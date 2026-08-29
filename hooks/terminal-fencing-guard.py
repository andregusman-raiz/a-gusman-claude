#!/usr/bin/env python3
"""terminal-fencing-guard.py — PreToolUse(Write|Edit|MultiEdit).

Duas guardas independentes, ambas registrando o bloqueio (F0b — SPEC-
metodologia-cockpit-2026-08-28.md §7.3 item 4: "9/11 sem saber" que
tinham sido bloqueados, porque a unica evidencia ia so pro stderr da
tool call, que ninguem revisita depois):

1) FENCING de canal de ESCRITOR UNICO (original, 2026-08-27, P0.3): o
   watchdog pode reviver um papel tier 0 que na verdade nao morreu — duas
   instancias do mesmo papel escrevendo no manifesto da fila e o dano do
   split-brain. `workspace_uuid` do registry identifica quem detem o papel;
   `CMUX_WORKSPACE_ID` identifica a sessao atual. So bloqueia se os dois
   discordam E o canal esta em `canais_exclusivos` do registry.

2) CANAIS CONGELADOS (F0a, 2026-08-28/29): ALERTAS.md/ORDENS.md e
   inbox-<PAPEL>/ pararam de ser escritos por edicao direta — o unico
   escritor sancionado e `canal-append.sh` (via Bash, carimba hora,
   valida tipo/teto). Nega a TODOS (mesmo o dono do papel) editar esses
   arquivos com a tool Write/Edit/MultiEdit; `canal-append.sh` continua
   funcionando pois roda via Bash, nunca aciona este hook.

Regras (deliberadamente estreitas — guard que bloqueia demais e desligado):
  - Path fora de `canais_exclusivos` E fora dos canais congelados -> passa.
  - Fencing (1): papel sem `workspace_uuid` no registry (fechado) -> passa.
  - Fencing (1): sem `CMUX_WORKSPACE_ID` no ambiente -> passa com AVISO
    (sessao remota/cloud/headless; bloquear quebraria peer legitimo).
  - Fencing (1): `CMUX_WORKSPACE_ID` != `workspace_uuid` registrado -> BLOQUEIA.
  - Congelado (2): sempre BLOQUEIA (nao ha excecao de identidade).

Todo BLOQUEIO (1 ou 2) e registrado em ~/.claude/state/hooks.log
(`ts · hook · papel · rc · alvo`) -- papel resolvido do CMUX_WORKSPACE_ID
via registry quando possivel, "desconhecido" quando nao.

Bypass: TERMINAL_FENCING_DISABLED=1 (cobre as duas guardas).
"""

import json
import os
import re
import sys
import time

REGISTRY = os.path.expanduser("~/Claude/docs/ai-state/terminais/registry.json")
WORKSPACE_ROOT = os.path.expanduser("~/Claude")
HOOKS_LOG = os.environ.get("HOOKS_LOG_PATH") or os.path.expanduser("~/.claude/state/hooks.log")

# Canais congelados em F0a (redirect de 1 linha no path antigo; escritor
# sancionado unico e canal-append.sh, que roda via Bash e nunca passa por
# este hook). Regex sobre o path RELATIVO a WORKSPACE_ROOT.
FROZEN_PATTERNS = [
    re.compile(r"^docs/ai-state/de-pr-queue/ALERTAS\.md$"),
    re.compile(r"^docs/ai-state/de-pr-queue/ORDENS\.md$"),
    re.compile(r"^docs/ai-state/terminais/inbox-[^/]+/"),
]


def read_payload():
    try:
        return json.load(sys.stdin)
    except Exception:
        return {}


def target_path(payload):
    ti = payload.get("tool_input") or {}
    for key in ("file_path", "path", "notebook_path"):
        if ti.get(key):
            return ti[key]
    return None


def resolve_papel(reg, ws_id):
    if not ws_id:
        return "desconhecido"
    for papel, e in (reg.get("terminais") or {}).items():
        if e.get("workspace_uuid") == ws_id:
            return papel
    return f"nao-registrado:{ws_id[:8]}"


def log_bloqueio(papel, alvo_rel):
    try:
        os.makedirs(os.path.dirname(HOOKS_LOG), exist_ok=True)
        ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        line = f"{ts} · terminal-fencing-guard.py · {papel} · 2 · {alvo_rel}\n"
        fd = os.open(HOOKS_LOG, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)
        try:
            os.write(fd, line.encode("utf-8"))
        finally:
            os.close(fd)
    except Exception:
        pass  # log e so observabilidade -- nunca vira motivo de crash do guard


def main():
    if os.environ.get("TERMINAL_FENCING_DISABLED") == "1":
        return 0

    path = target_path(read_payload())
    if not path:
        return 0

    try:
        abs_path = os.path.realpath(os.path.expanduser(path))
    except Exception:
        return 0

    try:
        rel_path = os.path.relpath(abs_path, WORKSPACE_ROOT)
    except Exception:
        rel_path = abs_path

    try:
        with open(REGISTRY) as f:
            reg = json.load(f)
    except Exception:
        reg = {}

    ws_id_atual = os.environ.get("CMUX_WORKSPACE_ID")

    # --- guarda 2: canal congelado (nega a TODOS, sem excecao de identidade) ---
    for pat in FROZEN_PATTERNS:
        if pat.match(rel_path):
            papel = resolve_papel(reg, ws_id_atual)
            log_bloqueio(papel, rel_path)
            print(
                f"[fencing] BLOQUEADO: {rel_path} e canal CONGELADO desde F0a "
                f"(ver docs/workspace/SPEC-metodologia-cockpit-2026-08-28.md §7.3).\n"
                f"Escritor sancionado unico: canal-append.sh (via Bash, nao esta tool).\n"
                f"  ~/.claude/scripts/canal-append.sh LOG \"<texto>\" --papel <SEU_PAPEL>\n"
                f"Texto longo demais para canal-append.sh vai para log/<hoje>.md (sem teto) --\n"
                f"escreva la e cite so a referencia no canal.\n"
                f"Bypass consciente: TERMINAL_FENCING_DISABLED=1",
                file=sys.stderr,
            )
            return 2

    # --- guarda 1: canal de escritor unico (canais_exclusivos do registry) ---
    canais = reg.get("canais_exclusivos") or {}
    if not canais:
        return 0

    dono = None
    canal_rel = None
    for rel, papel in canais.items():
        if abs_path == os.path.realpath(os.path.join(WORKSPACE_ROOT, rel)):
            dono, canal_rel = papel, rel
            break
    if not dono:
        return 0

    entry = (reg.get("terminais") or {}).get(dono) or {}
    registrado = entry.get("workspace_uuid")
    if not registrado:
        return 0  # papel fechado: canal sem dono vivo

    if not ws_id_atual:
        print(
            f"[fencing] AVISO: escrevendo em {canal_rel} (canal exclusivo de {dono}) "
            f"de uma sessao sem CMUX_WORKSPACE_ID. Nao consigo provar que voce e a "
            f"instancia registrada do papel. Confirme antes de gravar.",
            file=sys.stderr,
        )
        return 0

    if ws_id_atual == registrado:
        return 0

    log_bloqueio(dono, canal_rel or rel_path)
    print(
        f"[fencing] BLOQUEADO: {canal_rel} e canal de escritor unico do papel {dono}.\n"
        f"  instancia registrada : {registrado}\n"
        f"  esta sessao          : {ws_id_atual}\n"
        f"Voce nao e a instancia que detem {dono}. Escrever aqui e o dano real do\n"
        f"split-brain (dois donos do manifesto). Caminhos corretos:\n"
        f"  - ~/.claude/scripts/canal-append.sh LOG \"<texto>\" --papel <SEU_PAPEL> (ALERTAS congelado, F0b); ou\n"
        f"  - fale com o papel: ~/.claude/scripts/terminal-send.sh {dono} \"<msg>\"; ou\n"
        f"  - se {dono} morreu de verdade, reabra pelo registry "
        f"(~/.claude/scripts/terminal-open.sh {dono}) em vez de escrever no lugar dele.\n"
        f"Bypass consciente: TERMINAL_FENCING_DISABLED=1",
        file=sys.stderr,
    )
    return 2


if __name__ == "__main__":
    sys.exit(main())
