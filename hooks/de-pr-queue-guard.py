#!/usr/bin/env python3
"""de-pr-queue-guard — PreToolUse(Bash) guard da fila de PRs do raiz-data-engine.

Decisão dono 2026-08-25 (enforcement HARD): todo `gh pr create`/`gh pr merge` no
raiz-data-engine exige claim em ~/Claude/docs/ai-state/de-pr-queue/claims.json.
Bypass emergência: DE_QUEUE_BYPASS=1 (export na sessão OU inline no comando).

Anti-falso-positivo: corpos de heredoc são removidos antes do match (senão
escrever um script/doc que MENCIONA os comandos bloqueia — gotcha de substring),
e o padrão exige posição de comando (início de linha ou após ; && || | $( ).

A remoção de heredoc (2026-08-27: generalizada e extraída para
~/Claude/.claude/hooks/lib/bash-cmd-normalize.py — usada também por
bash-guards.sh, que tinha o MESMO gotcha de substring para git push --force/
pkill/--no-verify/etc. Ver ADR do fix). Import com fallback: se o módulo
compartilhado não existir/carregar, cai na cópia local (nunca quebra o gate
duro da fila de PRs por causa de um refactor de DRY).

Decisão dono 2026-08-26 (WIP limit por frente): "1 frente = 1 PR vivo, teto 2"
no raiz-data-engine. Roda DEPOIS do claim já ter passado (gate duro continua
sendo o claim) e só para `gh pr create` (merge não conta). Claims legados sem
o campo opcional `frente` não são afetados. Bypass documentado (exige
autorização do dono): DE_WIP_BYPASS=1 (env ou inline no comando).

Fix 2026-08-27 (2ª rodada, incidente #6340 — portado de
~/Claude/.codex/hooks/de-parity-guard.py): o comando Bash top-level pode
esconder `gh pr create`/`gh pr merge` dentro de um SCRIPT executado via
`bash|sh|zsh|dash|ksh <arquivo>` ou `source|. <arquivo>` (o texto top-level
não contém a substring proibida). Quando o `pat.search(stripped)` inicial
falha, tenta achar o comando DENTRO de scripts referenciados via
`find_first_wrapped_match` (lib compartilhado, profundidade <= 2, sem
repetir path, fail-open se ausente/ilegível) e, se achar, mescla o conteúdo
do script ao texto analisado antes de seguir com repo_hit/claim/WIP — usa a
MESMA lógica de sempre, só que também enxergando o `cd <repo> && gh pr
merge ...` de dentro do script. Sem o lib compartilhado (import falhou),
essa indireção fica indisponível e o comando wrapped passa direto (fail-open
só para essa feature nova; o gate duro do claim no comando top-level
continua intacto). NÃO cobre: comando montado via variável (`eval "$CMD"`),
`curl | bash`, ou `$(...)`/substituição resolvida só em runtime.
"""
import json
import os
import re
import subprocess
import sys
import time

# F0b (SPEC-metodologia-cockpit-2026-08-28.md §7.3 item 3): duas checagens
# novas em MODO AVISO (nunca bloqueiam -- adocao do campo 'entrega' e 0/N
# hoje; ligar recusa exige 1 ciclo medido primeiro, gotcha
# gate_exige_marcador_medir_adocao_antes_de_ligar), e "estacionado" some
# do teto de WIP por frente (claim estacionado nao e PR vivo disputando o
# limite). HOOKS_LOG_PATH/REGISTRY_PATH overridable so p/ teste isolado.
HOOKS_LOG = os.environ.get("HOOKS_LOG_PATH") or os.path.expanduser("~/.claude/state/hooks.log")
REGISTRY_PATH = os.environ.get("DE_QUEUE_REGISTRY_PATH") or os.path.expanduser(
    "~/Claude/docs/ai-state/terminais/registry.json")


def _log_hook(papel, rc, alvo):
    try:
        os.makedirs(os.path.dirname(HOOKS_LOG), exist_ok=True)
        ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        line = f"{ts} · de-pr-queue-guard.py · {papel} · {rc} · {alvo}\n"
        fd = os.open(HOOKS_LOG, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)
        try:
            os.write(fd, line.encode("utf-8"))
        finally:
            os.close(fd)
    except Exception:
        pass  # log e so observabilidade -- nunca vira motivo do guard falhar


def _resolve_papel_from_env():
    """(papel, workspace_id) a partir de CMUX_WORKSPACE_ID x registry.

    Retorna (None, None) sem CMUX_WORKSPACE_ID no ambiente (nada a avisar --
    sessao fora do cmux e legitima). Retorna (None, ws) quando o env var
    existe mas nao casa nenhum papel do registry (aviso). Fail-open: erro de
    leitura do registry nunca impede o guard de seguir.
    """
    ws = os.environ.get("CMUX_WORKSPACE_ID") or ""
    if not ws:
        return None, None
    try:
        with open(REGISTRY_PATH) as f:
            reg = json.load(f)
        for papel, e in (reg.get("terminais") or {}).items():
            if e.get("workspace_uuid") == ws:
                return papel, ws
    except Exception:
        return None, ws
    return None, ws

try:
    # nome do arquivo tem hifens (convencao dos hooks) -> nao e um identificador
    # Python valido para `import`, carregar por path via importlib.
    import importlib.util as _ilu
    _lib_path = os.path.expanduser("~/Claude/.claude/hooks/lib/bash-cmd-normalize.py")
    _spec = _ilu.spec_from_file_location("bash_cmd_normalize", _lib_path)
    _mod = _ilu.module_from_spec(_spec)
    _spec.loader.exec_module(_mod)  # type: ignore
    _strip_heredocs = _mod.strip_heredocs
    _find_first_wrapped_match = _mod.find_first_wrapped_match
except Exception:
    def _strip_heredocs(cmd: str) -> str:
        # Fallback local (identico ao helper compartilhado) — so usado se o
        # modulo em ~/Claude/.claude/hooks/lib nao estiver disponivel.
        lines = cmd.split("\n")
        kept, terminator = [], None
        for line in lines:
            if terminator is not None:
                if line.strip() == terminator or line.strip() == terminator.strip("\t"):
                    terminator = None
                continue
            m = re.search(r"<<-?\s*(['\"]?)([A-Za-z_][A-Za-z0-9_]*)\1", line)
            if m:
                terminator = m.group(2)
            kept.append(line)
        return "\n".join(kept)
    # Sem o lib compartilhado, a indirecao via script (bash/sh/.../source)
    # fica indisponivel — fail-open so para ESSA feature nova, nunca quebra
    # o gate duro do claim (que continua funcionando no comando top-level).
    _find_first_wrapped_match = None

def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0

    if os.environ.get("DE_QUEUE_BYPASS") == "1":
        return 0

    cmd = (payload.get("tool_input") or {}).get("command") or ""
    if not cmd:
        return 0
    if "DE_QUEUE_BYPASS=1" in cmd:  # env inline não alcança o processo do hook
        return 0

    # remove corpos de heredoc (<<EOF ... EOF / <<'EOF' / <<-EOF) — helper
    # compartilhado (ver import no topo do arquivo, com fallback local)
    stripped = _strip_heredocs(cmd)
    cwd = payload.get("cwd") or ""

    # gh pr create|merge em POSIÇÃO DE COMANDO (não substring de texto)
    pat = re.compile(r"(?:^|[;&|(]|\$\(|\bthen\b|\bdo\b|\belse\b)\s*(?:env\s+[A-Z_=\w]*\s+)?gh\s+pr\s+(create|merge)\b", re.M)
    indirect_note = ""
    if not pat.search(stripped):
        # Indireção via script (mesmo vetor do incidente #6340: `bash
        # /tmp/x.sh` escondendo o comando fora do texto Bash top-level).
        # Reusa o scanner recursivo compartilhado (profundidade <= 2, sem
        # repetir path, fail-open se arquivo ausente/ilegível). Se achar,
        # MESCLA o conteúdo do script ao texto analisado (cand_dirs/repo_hit
        # abaixo passam a enxergar o `cd <repo> && gh pr merge ...` de
        # DENTRO do script, não só o `bash <script>` do comando top-level).
        if _find_first_wrapped_match is None:
            return 0
        hit_path, hit_content = _find_first_wrapped_match(
            cmd, cwd, lambda text: pat.search(text) is not None, 2)
        if hit_path is None:
            return 0
        stripped = stripped + "\n" + hit_content
        indirect_note = (
            f"AVISO — comando `gh pr create/merge` encontrado DENTRO do script "
            f"`{hit_path}` (indireção via bash/sh/zsh/dash/ksh/source/. — mesmo "
            f"vetor do incidente #6340), não no comando Bash top-level. Aplicando "
            f"os mesmos checks da fila de PRs sobre o conteúdo do script.\n"
        )

    # escopo: raiz-data-engine (cwd, QUALQUER menção no comando — cobre `cd <repo> &&` —, ou remote do git)
    repo_hit = ("raiz-data-engine" in cwd) or ("raiz-data-engine" in stripped)
    if not repo_hit and cwd:
        try:
            origin = subprocess.run(
                ["git", "-C", cwd, "remote", "get-url", "origin"],
                capture_output=True, text=True, timeout=5).stdout
            repo_hit = "raiz-data-engine" in origin
        except Exception:
            pass
    if not repo_hit:
        return 0

    # AVISO (nao bloqueia): CMUX_WORKSPACE_ID setado mas fora do registry de
    # papeis -- sessao dentro do cockpit cmux que o registry nao reconhece.
    papel_atual, ws_atual = _resolve_papel_from_env()
    if ws_atual and not papel_atual:
        sys.stderr.write(
            f"[de-pr-queue-guard] AVISO: CMUX_WORKSPACE_ID={ws_atual} nao encontrado em "
            f"docs/ai-state/terminais/registry.json -- comando prossegue, mas esta sessao "
            f"nao e um papel reconhecido pelo cockpit.\n")
        _log_hook(f"nao-registrado:{ws_atual[:8]}", 0, "CMUX_WORKSPACE_ID-fora-do-registry")

    # FREEZE do dono: bloqueia CRIAÇÃO de PR incondicionalmente enquanto o flag existir
    if os.path.exists(os.path.expanduser("~/Claude/docs/ai-state/de-pr-queue/FREEZE")):
        for m in pat.finditer(stripped):
            if m.group(1) == "create":
                sys.stderr.write(indirect_note + "BLOQUEADO — FREEZE do dono (26/08): PROIBIDO criar PR novo no raiz-data-engine até segunda ordem. Trabalho local pode continuar (sem push de PR). Ver ~/Claude/docs/ai-state/de-pr-queue/FREEZE.\n")
                return 2

    claims_path = os.environ.get("DE_QUEUE_CLAIMS_PATH") or os.path.expanduser(
        "~/Claude/docs/ai-state/de-pr-queue/claims.json")
    claims = {}
    try:
        with open(claims_path) as f:
            claims = json.load(f).get("claims", {})
    except Exception:
        pass

    # claim por branch atual — payload.cwd NÃO acompanha `cd` inline do comando
    # (incidente 26/08: builder com claim válido bloqueado). Testar também os
    # diretórios citados no próprio comando (cd <p> / git -C <p>).
    matched_branch = None
    cand_dirs = [cwd or "."]
    cand_dirs += [os.path.expanduser(p_) for p_ in
                  re.findall(r"(?:\bcd|git\s+-C)\s+([~/][^\s;&|\"']+)", stripped)]
    for cd_ in dict.fromkeys(cand_dirs):
        try:
            branch = subprocess.run(
                ["git", "-C", cd_, "branch", "--show-current"],
                capture_output=True, text=True, timeout=5).stdout.strip()
        except Exception:
            branch = ""
        if branch and branch in claims:
            matched_branch = branch
            break

    # claim cuja branch aparece literalmente no comando (gh pr create --head <branch> etc.)
    if matched_branch is None:
        for br in claims:
            if br and br in stripped:
                matched_branch = br
                break

    # claim por número de PR citado no comando (gh pr merge 6310 ...)
    if matched_branch is None:
        for m in re.finditer(pat, stripped):
            tail = stripped[m.end():m.end() + 120]
            num = re.search(r"\b(\d{2,6})\b", tail)
            if not num:
                continue
            for br, c in claims.items():
                if str(c.get("pr")) == num.group(1):
                    matched_branch = br
                    break
            if matched_branch is not None:
                break

    if matched_branch is None:
        sys.stderr.write(
            indirect_note +
            "BLOQUEADO — fila de PRs do Data Engine (enforcement hard, decisão dono 2026-08-25).\n"
            "Todo gh pr create/merge no raiz-data-engine exige claim registrado.\n"
            "1) Leia a fila: ~/Claude/docs/ai-state/de-pr-queue/QUEUE.md\n"
            "2) Peça claim ao terminal coordenador (ListAgents -> SendMessage) OU, se offline,\n"
            "   registre em ~/Claude/docs/ai-state/de-pr-queue/claims.json e anote no Log do QUEUE.md.\n"
            "3) Emergência real: DE_QUEUE_BYPASS=1 no comando e justifique no QUEUE.md.\n")
        _log_hook(papel_atual or "desconhecido", 2, "sem-claim")
        return 2

    # AVISO (nao bloqueia, F0b/F1 -- so mede adocao, M-2): claim sem 'entrega'
    # (E-nnn cunhada ou 'proposta' do builder) na criacao do PR. Recusa so em
    # F2, apos 1 ciclo medindo quantas vezes isto teria disparado.
    if any(m.group(1) == "create" for m in pat.finditer(stripped)):
        claim_para_entrega = claims.get(matched_branch) or {}
        if not claim_para_entrega.get("entrega"):
            sys.stderr.write(
                f"[de-pr-queue-guard] AVISO (modo aviso F0b/F1): claim da branch "
                f"'{matched_branch}' nao declara 'entrega' (E-nnn ou \"proposta\" cunhada "
                f"pelo builder). Nao bloqueia -- adocao esta sendo medida antes de virar "
                f"recusa (F2). Declare 'entrega' no claim.\n")
            _log_hook(papel_atual or "desconhecido", 0, f"entrega-ausente:{matched_branch}")

    # --- WIP limit por frente (decisão dono 2026-08-26): "1 frente = 1 PR vivo",
    # teto 2. Roda só para `gh pr create` (merge não conta) e só DEPOIS do claim
    # já ter passado acima — o gate duro continua sendo o claim, isto aqui é um
    # teto adicional, e falha ABERTO (nunca bloqueia por erro de leitura/schema).
    is_create = any(m.group(1) == "create" for m in pat.finditer(stripped))
    if not is_create:
        return 0

    if os.environ.get("DE_WIP_BYPASS") == "1" or "DE_WIP_BYPASS=1" in cmd:
        return 0

    try:
        claim = claims.get(matched_branch) or {}
        frente = claim.get("frente")
        if not frente:
            return 0  # claim legado sem `frente` — não bloquear

        terminal_prefixes = (
            "merged", "published", "closed", "superseded", "cancelado", "estacionado")
        live_prs = []
        for br, c in claims.items():
            if br == matched_branch or not isinstance(c, dict):
                continue
            if c.get("frente") != frente:
                continue
            pr = c.get("pr")
            if pr is None:
                continue
            status = str(c.get("status") or "").strip().lower()
            if any(status.startswith(p) for p in terminal_prefixes):
                continue
            live_prs.append(pr)

        if len(live_prs) >= 2:
            prs_txt = ", ".join(f"#{p}" for p in live_prs)
            sys.stderr.write(
                indirect_note +
                "BLOQUEADO — WIP limit da frente '" + str(frente) + "' "
                "(política dono: \"1 frente = 1 PR vivo\", teto 2 — ver QUEUE.md).\n"
                "Frente " + str(frente) + " já tem os PRs vivos " + prs_txt + ".\n"
                "Default: ANEXAR ao PR-trem da frente (push na branch existente + "
                "re-request review). Exceção via coordenador.\n"
                "Bypass documentado (exige autorização do dono): DE_WIP_BYPASS=1.\n")
            _log_hook(papel_atual or "desconhecido", 2, f"wip-limit:{frente}")
            return 2
    except Exception:
        return 0

    return 0

if __name__ == "__main__":
    sys.exit(main())
