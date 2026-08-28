#!/usr/bin/env bash
# de-claims-sync.sh — reconcilia claims.json com o estado real do PR no GitHub,
# alerta autorizacoes CONCEDIDA sem GASTA, e poda PRs encerrados da tabela de
# ciclos do QUEUE.md.
#
# Extensao 2026-08-28 (contrato "reforma da camada de pendencias", builder C).
# Mantem 100% do comportamento ORIGINAL de reconciliacao de claims.json
# (dry-run por default; --apply grava) e ACRESCENTA duas checagens que rodam
# SEMPRE, independente de --apply (pensadas para rodar via cron/launchd, no
# mesmo espirito de terminais-watchdog.sh / radar-prazos.sh):
#
#   1) AUTORIZACOES.md: A-nnn CONCEDIDA ha mais de AUTORIZACAO_MAX_H horas
#      sem GASTA -> alerta em ALERTAS.md (1x por episodio; re-alerta so apos
#      SYNC_REALERT_H horas). NUNCA muda o estado da autorizacao — so alerta.
#      Nao depende de gh; roda mesmo sem GitHub CLI no PATH.
#
#   2) QUEUE.md: PRs citados na tabela "## Ciclo-count (regra dos 3)" que ja
#      tem estado terminal no GitHub (MERGED/CLOSED) sao movidos — nunca
#      apagados — para uma subsecao "### Encerrados (poda automatica)" logo
#      abaixo da tabela, com "(MERGED em <data>)"/"(CLOSED em <data>)".
#      Edicao cirurgica: so essa regiao do arquivo muda (prova: diff). Backup
#      previo em docs/ai-state/terminais/arquivo/QUEUE.pre-<AAAA-MM-DD-HHMM>.md.
#      Falha do gh (CLI ausente OU qualquer `gh pr view` com erro) => nada e
#      alterado nesta secao, so loga. Lock exclusivo QUEUE.md.lock (fcntl.flock,
#      timeout QUEUE_LOCK_TIMEOUT_S=5s) protege contra 2 instancias deste
#      mecanismo rodando ao mesmo tempo; lock ocupado => nao poda neste ciclo,
#      loga e sai limpo (poda e idempotente, proximo ciclo pega a mesma diff).
#
#   3) CLAIMS (comportamento ORIGINAL, preservado): reconcilia claims.json.
#      Default dry-run (so imprime a tabela de mudancas propostas). --apply
#      grava (faz backup claims.json.bak-<timestamp> ANTES, sempre, mesmo
#      sem mudancas a aplicar) usando registry_lib.mutate (read-modify-write
#      sob lock — claims.json tem multiplos escritores concorrentes).
#
# Idempotente: rodar 2x seguidas sem mudanca de estado externo (GitHub,
# AUTORIZACOES.md) produz o mesmo resultado (diff vazio na 2a rodada) para
# QUEUE.md e para o cooldown de alertas.
set -euo pipefail

REPO="${REPO:-Raiz-Educacao-SA/raiz-data-engine}"
Q="${DE_PR_QUEUE_DIR:-$HOME/Claude/docs/ai-state/de-pr-queue}"
CLAIMS="$Q/claims.json"
QUEUE_MD="$Q/QUEUE.md"
AUTORIZACOES_MD="$Q/AUTORIZACOES.md"
STATE="$Q/.claims-sync-state.json"
ALERTAS_MD="$Q/ALERTAS.md"
LOG_DIR="$Q/log"
ARCHIVE_DIR="${TERMINAIS_ARCHIVE_DIR:-$HOME/Claude/docs/ai-state/terminais/arquivo}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat <<'EOF'
Uso: de-claims-sync.sh [--apply]

Tres verificacoes independentes (uma falhando nao aborta as outras):

1) AUTORIZACOES (roda sempre; nao precisa de gh nem de --apply):
   AUTORIZACOES.md -> A-nnn CONCEDIDA sem GASTA ha mais de
   AUTORIZACAO_MAX_H horas (default 12) gera alerta em ALERTAS.md via
   canal-append.sh --papel SYNC --tipo ALERTA (1x por episodio; re-alerta
   so apos SYNC_REALERT_H horas, default 24). Ignora autorizacoes com a
   palavra PERMANENTE (nao se consomem). NUNCA muda o estado da autorizacao.

2) CICLOS (roda sempre; precisa de gh — ausencia/erro = no-op + log):
   QUEUE.md, secao "## Ciclo-count (regra dos 3)" -> `gh pr view --json
   state,mergedAt` por PR citado. MERGED/CLOSED -> linha migra para
   "### Encerrados (poda automatica)". Tudo ou nada: se `gh` falhar para
   qualquer PR do lote, QUEUE.md nao e tocado. Le e escreve sob lock
   exclusivo (QUEUE.md.lock, timeout QUEUE_LOCK_TIMEOUT_S) -- lock ocupado
   por outra instancia deste script = nao poda neste ciclo, so loga.

3) CLAIMS (comportamento ORIGINAL, inalterado): reconcilia claims.json com
   o estado real do PR no GitHub (gh pr view --json state,mergedAt,isDraft)
   para claims com 'pr' numerico e status ainda nao terminal. Tambem lista
   claims ativos sem campo 'frente'. Default dry-run. --apply grava (backup
   sempre antes).

Variaveis: REPO (default Raiz-Educacao-SA/raiz-data-engine),
AUTORIZACAO_MAX_H (default 12), SYNC_REALERT_H (default 24),
QUEUE_LOCK_TIMEOUT_S (default 5 -- timeout do lock exclusivo de QUEUE.md).
EOF
}

APPLY=0
for a in "$@"; do
  case "$a" in
    --help|-h) usage; exit 0 ;;
    --apply) APPLY=1 ;;
    *) echo "arg desconhecido: $a" >&2; exit 2 ;;
  esac
done

[[ -f "$CLAIMS" ]] || { echo "claims.json nao encontrado: $CLAIMS" >&2; exit 1; }
mkdir -p "$LOG_DIR" "$ARCHIVE_DIR"

GH_OK=0
if command -v gh >/dev/null 2>&1; then GH_OK=1; fi

TS_COMPACT="$(date -u +%Y-%m-%d-%H%M)"
HOJE="$(date -u +%Y-%m-%d)"
NOW_HHMM="$(date -u +%H:%M)"

REPO="$REPO" Q="$Q" CLAIMS="$CLAIMS" QUEUE_MD="$QUEUE_MD" \
AUTORIZACOES_MD="$AUTORIZACOES_MD" STATE="$STATE" ALERTAS_MD="$ALERTAS_MD" \
LOG_DIR="$LOG_DIR" ARCHIVE_DIR="$ARCHIVE_DIR" SCRIPT_DIR="$SCRIPT_DIR" \
APPLY="$APPLY" GH_OK="$GH_OK" TS_COMPACT="$TS_COMPACT" HOJE="$HOJE" \
NOW_HHMM="$NOW_HHMM" \
AUTORIZACAO_MAX_H="${AUTORIZACAO_MAX_H:-12}" SYNC_REALERT_H="${SYNC_REALERT_H:-24}" \
QUEUE_LOCK_TIMEOUT_S="${QUEUE_LOCK_TIMEOUT_S:-5}" \
python3 <<'PYEOF'
import fcntl, json, os, re, subprocess, sys, time
from datetime import datetime, timezone

REPO = os.environ["REPO"]
Q = os.environ["Q"]
CLAIMS = os.environ["CLAIMS"]
QUEUE_MD = os.environ["QUEUE_MD"]
AUTORIZACOES_MD = os.environ["AUTORIZACOES_MD"]
STATE = os.environ["STATE"]
ALERTAS_MD = os.environ["ALERTAS_MD"]
LOG_DIR = os.environ["LOG_DIR"]
ARCHIVE_DIR = os.environ["ARCHIVE_DIR"]
SCRIPT_DIR = os.environ["SCRIPT_DIR"]
APPLY = os.environ["APPLY"] == "1"
GH_OK = os.environ["GH_OK"] == "1"
TS_COMPACT = os.environ["TS_COMPACT"]
HOJE = os.environ["HOJE"]
NOW_HHMM = os.environ["NOW_HHMM"]
AUTORIZACAO_MAX_H = float(os.environ.get("AUTORIZACAO_MAX_H", "12"))
SYNC_REALERT_H = float(os.environ.get("SYNC_REALERT_H", "24"))
QUEUE_LOCK_TIMEOUT_S = float(os.environ.get("QUEUE_LOCK_TIMEOUT_S", "5"))

sys.path.insert(0, SCRIPT_DIR)
from registry_lib import mutate, load, _locked, RegistryLockTimeout

acoes = []  # linhas para o log de hoje; escreve so se nao vazio


def now_utc():
    return datetime.now(timezone.utc)


def ensure_state():
    if os.path.exists(STATE):
        return
    payload = {
        "_schema": ("state compartilhado de de-claims-sync.sh + roadmap-render.sh "
                    "(contrato reforma-pendencias 2026-08-28). Chaves: 'alertado' "
                    "(de-claims-sync, cooldown de alertas AUTORIZACOES por id) e "
                    "'gh_cache' (roadmap-render, cache de gh pr view por PR, TTL 10min)."),
        "alertado": {},
        "gh_cache": {},
    }
    try:
        fd = os.open(STATE, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o644)
        with os.fdopen(fd, "w") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
            f.write("\n")
    except FileExistsError:
        pass


def canal_append_alertas(texto):
    canal_append_sh = os.path.join(SCRIPT_DIR, "canal-append.sh")
    if os.path.isfile(canal_append_sh):
        r = subprocess.run(
            [canal_append_sh, "ALERTAS", texto, "--papel", "SYNC", "--tipo", "ALERTA"],
            capture_output=True, text=True, timeout=10,
        )
        if r.returncode != 0:
            print(f"  ERRO canal-append.sh: {r.stderr.strip()}")
            return False
        return True
    # Fallback (canal-append.sh ainda nao existe neste checkout): append direto,
    # write() unico em modo append — mesmo contrato de atomicidade do helper.
    ts = now_utc().strftime("%Y-%m-%d %H:%M")
    line = f"[{ts}] SYNC ALERTA: {texto}\n"
    fd = os.open(ALERTAS_MD, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)
    try:
        os.write(fd, line.encode("utf-8"))
    finally:
        os.close(fd)
    return True


# ============================================================
# 1) AUTORIZACOES: CONCEDIDA sem GASTA
# ============================================================
print("== 1) AUTORIZACOES: CONCEDIDA sem GASTA ==")
if not os.path.isfile(AUTORIZACOES_MD):
    print(f"  AUTORIZACOES.md nao encontrado: {AUTORIZACOES_MD} -- pulando")
else:
    def parse_autorizacao_line(line):
        # Aceita tanto a linha simples "A-003 | data | ..." quanto a variante em
        # linha de tabela markdown "| A-007 | data | ..." (drift real do arquivo).
        if not re.match(r'^\|?\s*A-\d{3}\s*\|', line):
            return None
        parts = [p.strip() for p in line.split(' | ')]
        if parts and parts[0].startswith('|'):
            parts[0] = parts[0][1:].strip()
        idm = re.match(r'^(A-\d{3})$', parts[0]) if parts else None
        if not idm:
            return None
        aid = idm.group(1)
        datestr = parts[1] if len(parts) > 1 else ''

        # Campo de ESTADO: formato nominal e "id|data|autor|escopo|estado|nota"
        # (5o campo = parts[4]). Quando a linha nao segue isso (drift real —
        # escopo/estado/nota vem tudo junto num so campo), cai para o marcador
        # explicito "Estado:" no texto. NUNCA procura a palavra GASTA solta na
        # linha inteira: o proprio texto de instrucao de varias entradas diz
        # "marcar GASTA no mesmo tick" DENTRO do estado CONCEDIDA — buscar a
        # palavra em qualquer lugar da linha produz falso-negativo sistematico
        # (ex.: A-003 nunca alertaria pq a propria instrucao cita "GASTA").
        estado_txt = parts[4] if len(parts) >= 5 else None
        if estado_txt is None:
            em = re.search(r'Estado:\s*\*{0,2}([^*\n]+)', line)
            estado_txt = em.group(1) if em else ''
        estado_txt = (estado_txt or '').lstrip('*').strip()

        gasta = estado_txt.upper().startswith('GASTA')
        concedida = estado_txt.upper().startswith('CONCEDIDA')
        permanente = bool(re.search(r'PERMANENTE', line, re.IGNORECASE))

        dm = re.search(r'(\d{4}-\d{2}-\d{2})\s*~?\s*(\d{2}:\d{2})', datestr)
        dt = None
        if dm:
            try:
                dt = datetime.strptime(f"{dm.group(1)} {dm.group(2)}", "%Y-%m-%d %H:%M").replace(tzinfo=timezone.utc)
            except ValueError:
                dt = None
        return aid, dict(date_str=datestr, dt=dt, gasta=gasta,
                          concedida=concedida, permanente=permanente, estado_txt=estado_txt)

    texto_autz = open(AUTORIZACOES_MD, encoding="utf-8").read()
    entries = {}
    for line in texto_autz.splitlines():
        parsed = parse_autorizacao_line(line)
        if not parsed:
            continue
        aid, info = parsed
        # Se o id aparece mais de uma vez (ex.: A-007 duplicado, prosa + tabela),
        # a ultima ocorrencia no arquivo vence — cobre o caso real sem crashar.
        entries[aid] = info

    candidatos = []
    for aid, e in sorted(entries.items()):
        if e["gasta"] or not e["concedida"] or e["permanente"]:
            continue
        if e["dt"] is None:
            print(f"  {aid}: CONCEDIDA sem GASTA, mas timestamp '{e['date_str']}' ilegivel -- nao alerto (idade desconhecida)")
            continue
        idade_h = (now_utc() - e["dt"]).total_seconds() / 3600.0
        if idade_h > AUTORIZACAO_MAX_H:
            candidatos.append((aid, idade_h))

    if not candidatos:
        print("  (nenhuma CONCEDIDA sem GASTA acima do limite)")
    else:
        ensure_state()

        def check_and_alert(aid, idade_h):
            st = load(STATE)
            last = st.get("alertado", {}).get(aid)
            fire = True
            if last:
                try:
                    last_dt = datetime.fromisoformat(last.replace("Z", "+00:00"))
                    fire = (now_utc() - last_dt).total_seconds() / 3600.0 >= SYNC_REALERT_H
                except ValueError:
                    fire = True
            if not fire:
                print(f"  {aid}: ja alertado ha menos de {SYNC_REALERT_H:.0f}h -- suprimido (cooldown)")
                return
            texto = (f"{aid} CONCEDIDA ha {int(idade_h)}h sem GASTA "
                     f"— risco de reexecucao; marcar GASTA (tick, deploy id) ou revogar")
            ok = canal_append_alertas(texto)
            if not ok:
                print(f"  {aid}: alerta NAO emitido (canal-append falhou)")
                return

            def mark(s):
                s.setdefault("alertado", {})[aid] = now_utc().strftime("%Y-%m-%dT%H:%M:%SZ")
                return s

            mutate(STATE, mark)
            print(f"  ALERTA emitido: {aid} ({idade_h:.1f}h)")
            acoes.append(f"- AUTORIZACOES: alerta emitido para {aid} (CONCEDIDA ha {idade_h:.1f}h sem GASTA)")

        for aid, idade_h in candidatos:
            check_and_alert(aid, idade_h)

# ============================================================
# 2) CICLOS: poda de PRs encerrados na tabela "regra dos 3 ciclos"
# ============================================================
print()
print("== 2) CICLOS: poda de PRs encerrados na tabela 'regra dos 3 ciclos' ==")
if not GH_OK:
    print("  gh CLI nao encontrado no PATH -- QUEUE.md NAO alterado.")
elif not os.path.isfile(QUEUE_MD):
    print(f"  QUEUE.md nao encontrado: {QUEUE_MD} -- pulando")
else:
    # Lock exclusivo ANTES de ler o arquivo, mantido ate depois do os.replace.
    # QUEUE.md e editado a mao pelo DE-COORD o dia inteiro; ler fora do lock e
    # escrever depois (mesmo com poucos segundos de gh no meio) e uma janela de
    # lost-update classica. O lock aqui protege sobretudo contra 2 instancias
    # deste MESMO mecanismo rodando ao mesmo tempo (2 syncs em paralelo, ou o
    # ciclo do launchd sobrepondo uma chamada manual) -- e o unico caso onde
    # mutua exclusao de verdade e possivel (um editor humano/Edit tool nao
    # participa deste lock; o remedio pra esse caso e minimizar a janela, o
    # que o "reler dentro do lock" ja faz). Timeout curto: se outra instancia
    # segura o lock, este ciclo desiste e loga -- a poda e idempotente, o
    # proximo ciclo (launchd, 10 min) pega a mesma diferenca de novo.
    # _locked() ja concatena ".lock" internamente (mesmo padrao de mutate()/load()
    # em registry_lib.py) -- passar QUEUE_MD direto, NAO QUEUE_MD+".lock" (isso
    # travaria "QUEUE.md.lock.lock", um arquivo diferente do lock real).
    lock_path = QUEUE_MD + ".lock"
    try:
        with _locked(QUEUE_MD, fcntl.LOCK_EX, QUEUE_LOCK_TIMEOUT_S):
            # Releitura DENTRO do lock -- nunca usar conteudo lido antes de
            # adquirir o lock (esse era o bug: conteudo podia estar stale por
            # causa do tempo gasto nas chamadas gh, apontado na revisao adversarial).
            original = open(QUEUE_MD, encoding="utf-8").read()
            m = re.search(r'(?ms)^## Ciclo-count \(regra dos 3\)\n(.*?)(?=\n## |\Z)', original)
            if not m:
                print("  Secao '## Ciclo-count (regra dos 3)' nao encontrada -- QUEUE.md NAO alterado.")
            else:
                bloco = m.group(1)
                tabela_rows = re.findall(r'^\|\s*(\d{3,6})\s*\|\s*([^|]+?)\s*\|\s*$', bloco, re.M)
                encerrados_existentes = re.findall(r'^-\s*(\d{3,6})\s*\|\s*([^|]+?)\s*\|\s*(.+)$', bloco, re.M)
                encerrados = {pr: (ciclos, nota) for pr, ciclos, nota in encerrados_existentes}

                erro_gh = False
                novos_encerrados = []
                ativos_restantes = []
                for pr, ciclos in tabela_rows:
                    try:
                        r = subprocess.run(
                            ["gh", "pr", "view", pr, "-R", REPO, "--json", "state,mergedAt"],
                            capture_output=True, text=True, timeout=20,
                        )
                        if r.returncode != 0:
                            print(f"  ERRO gh pr view #{pr}: {r.stderr.strip()[:200]}")
                            erro_gh = True
                            break
                        info = json.loads(r.stdout)
                    except Exception as e:
                        print(f"  ERRO gh pr view #{pr}: {e}")
                        erro_gh = True
                        break
                    state = info.get("state")
                    if state in ("MERGED", "CLOSED"):
                        data_evento = (info.get("mergedAt") or "")[:10] or "data desconhecida"
                        verbo = "MERGED" if state == "MERGED" else "CLOSED"
                        novos_encerrados.append((pr, ciclos, f"{verbo} em {data_evento}"))
                    else:
                        ativos_restantes.append((pr, ciclos))

                if erro_gh:
                    print("  gh falhou para pelo menos 1 PR -- QUEUE.md NAO alterado (tudo ou nada).")
                elif not novos_encerrados:
                    print("  Nenhum PR novo encerrado -- QUEUE.md sem mudancas nesta secao.")
                else:
                    backup_path = os.path.join(ARCHIVE_DIR, f"QUEUE.pre-{TS_COMPACT}.md")
                    with open(backup_path, "w", encoding="utf-8") as f:
                        f.write(original)

                    for pr, ciclos, nota in novos_encerrados:
                        encerrados[pr] = (ciclos, nota)

                    linhas = ["| PR | ciclos |", "|---|---|"]
                    for pr, ciclos in ativos_restantes:
                        linhas.append(f"| {pr} | {ciclos} |")
                    if encerrados:
                        linhas.append("")
                        linhas.append("### Encerrados (poda automatica)")
                        for pr, (ciclos, nota) in encerrados.items():
                            linhas.append(f"- {pr} | {ciclos} | {nota}")
                    novo_bloco = "\n".join(linhas) + "\n"

                    novo_conteudo = original[:m.start(1)] + novo_bloco + original[m.end(1):]
                    tmp = QUEUE_MD + ".tmp"
                    with open(tmp, "w", encoding="utf-8") as f:
                        f.write(novo_conteudo)
                    os.replace(tmp, QUEUE_MD)
                    nomes = ", ".join(f"#{pr}" for pr, _, _ in novos_encerrados)
                    print(f"  QUEUE.md atualizado sob lock: {nomes} movidos para 'Encerrados (poda automatica)'. Backup: {backup_path}")
                    acoes.append(f"- CICLOS: podados da tabela 'regra dos 3 ciclos' -> Encerrados: {nomes} (backup {os.path.basename(backup_path)})")
    except RegistryLockTimeout as e:
        print(f"  LOCK OCUPADO em {lock_path} ({QUEUE_LOCK_TIMEOUT_S:.0f}s) -- QUEUE.md NAO alterado neste ciclo "
              f"(poda e idempotente; o proximo ciclo pega a mesma diferenca). Detalhe: {e}")

# ============================================================
# 3) CLAIMS: reconciliacao com estado real do PR (comportamento original)
# ============================================================
print()
print("== 3) CLAIMS: reconciliacao com estado real do PR ==")
if not GH_OK:
    print("  gh CLI nao encontrado no PATH -- claims.json NAO alterado.")
else:
    with open(CLAIMS) as f:
        data = json.load(f)
    claims = data.get("claims", {})
    TERMINAL = {"merged", "closed", "cancelado-dedup", "closed-nao-remendar"}
    changes = []
    sem_frente = []
    errors = []

    for branch, c in claims.items():
        pr = c.get("pr")
        status = c.get("status")
        if status not in TERMINAL and "frente" not in c:
            sem_frente.append((branch, pr, status))
        if not isinstance(pr, int) or status in TERMINAL:
            continue
        try:
            r = subprocess.run(
                ["gh", "pr", "view", str(pr), "-R", REPO, "--json", "state,mergedAt,isDraft"],
                capture_output=True, text=True, timeout=20,
            )
            if r.returncode != 0:
                errors.append((branch, pr, r.stderr.strip()[:200]))
                continue
            info = json.loads(r.stdout)
        except Exception as e:
            errors.append((branch, pr, str(e)))
            continue

        gh_state = info.get("state")
        new_status = None
        if gh_state == "MERGED":
            new_status = "merged"
        elif gh_state == "CLOSED":
            new_status = "closed"
        if new_status and new_status != status:
            changes.append((branch, pr, status, new_status))

    now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    print(f"  claims ativos (status nao-terminal): {sum(1 for c in claims.values() if c.get('status') not in TERMINAL)}")
    print("  -- mudancas propostas (gh pr view) --")
    if not changes:
        print("  (nenhuma)")
    for branch, pr, old, new in changes:
        print(f"    {branch}  PR#{pr}  {old} -> {new}")

    print("  -- claims ativos sem 'frente' --")
    if not sem_frente:
        print("  (nenhum)")
    for branch, pr, status in sem_frente:
        print(f"    {branch}  PR#{pr}  status={status}")

    if errors:
        print("  -- erros gh pr view (nao aplicados) --")
        for branch, pr, err in errors:
            print(f"    {branch}  PR#{pr}  ERRO: {err}")

    if not APPLY:
        print("  [dry-run] nada gravado. Rode com --apply para persistir as mudancas acima.")
    else:
        backup_path = f"{CLAIMS}.bak-{int(time.time())}"
        with open(CLAIMS) as f:
            raw = f.read()
        with open(backup_path, "w") as f:
            f.write(raw)
        print(f"  backup gravado: {backup_path}")

        def apply_changes(d):
            cl = d.setdefault("claims", {})
            for branch, pr, old, new in changes:
                if branch in cl:
                    cl[branch]["status"] = new
                    cl[branch]["synced_at"] = now_iso
            return d

        mutate(CLAIMS, apply_changes)
        print(f"  claims.json atualizado com {len(changes)} mudanca(s).")
        if changes:
            acoes.append(f"- CLAIMS: {len(changes)} mudanca(s) aplicada(s) em claims.json (backup {os.path.basename(backup_path)})")

# ============================================================
# Log do dia (so quando alguma das 3 secoes agiu de verdade)
# ============================================================
print()
if acoes:
    log_path = os.path.join(LOG_DIR, f"{HOJE}.md")
    entry = f"\n## {NOW_HHMM}Z [SYNC]\n" + "\n".join(acoes) + "\n"
    fd = os.open(log_path, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)
    try:
        os.write(fd, entry.encode("utf-8"))
    finally:
        os.close(fd)
    print(f"Log gravado em {log_path} (secao ## {NOW_HHMM}Z [SYNC])")
else:
    print("Nenhuma acao tomada nesta execucao -- log nao alterado.")
PYEOF
