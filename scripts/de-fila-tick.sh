#!/usr/bin/env bash
# de-fila-tick.sh — tick sem LLM da fila de PRs do raiz-data-engine (launchd 10min).
#
# DOR: 248 despertares LLM/dia do DE-COORD (3 despertadores por relogio + /loop
#   do DE-COORD) -- ev-custo §3. $2,14/turno, 86% cache-read.
# METRICA: turnos/ciclo do DE-COORD (contar entradas do dia no transcript/log
#   do papel) -- hoje 248, alvo <=60 (F1) e <=40 (F4); E nudges INUTEIS (nudge
#   deste script sem nenhum tool_use de ESCRITA do DE-COORD na hora seguinte)
#   <=10% -- ambos medidos por M-14.
# DONO-MEDICAO: DE-COORD
# REMOVER-QUANDO: Monitor nativo acordar o DE-COORD por transicao com latencia
#   <=30min por 2 ciclos consecutivos (M-12) OU merge queue + required checks
#   deixarem 0 transicoes que exigem julgamento humano/LLM por 3 ciclos.
# TESTADO-EM: DE-COORD, 1 ciclo, modo minimo (este script). Rodado read-only
#   contra a fila real do raiz-data-engine antes do merge (ver corpo do PR).
#
# SPEC-metodologia-cockpit-2026-08-28.md §8.3 + §11 F0b (entra so com Q0=SIM,
# dado pelo dono em 29/08 ~00:50 -- ver handoff RESUMO/2026-08-29.md). Modo
# MINIMO (unico implementado aqui): so 2 transicoes disparam nudge --
# APPROVED+CLEAN e "merge falhou" (mergeStateStatus DIRTY/BLOCKED ou algum
# check com conclusion FAILURE). Modo completo (CR triagem, head duplo,
# espelho >26h, P-nnn novo, estacionado->em curso) e F1, NAO existe aqui.
#
# Debounce por SHA (desde a 1a versao -- sem isto os 38 update-branch/dia e as
# 51% de reviews sem codigo novo virariam ~50 despertares/dia): uma transicao
# so conta se o headRefOid mudou desde o ultimo tick OU o PR passou a
# qualificar (APPROVED+CLEAN / merge falhou) sem qualificar antes. PR que
# continua no mesmo estado, mesmo SHA -> silencio.
#
# So le estado e escreve arquivo (.fila-snapshot.json, lock+os.replace via
# registry_lib.mutate) + manda 1 mensagem via terminal-send.sh quando ha
# transicao. NENHUMA acao automatica (merge, dismissal, comentario) -- isso
# e do DE-COORD, nunca do tick.
set -euo pipefail

REPO="${DE_FILA_TICK_REPO:-Raiz-Educacao-SA/raiz-data-engine}"
Q="${DE_PR_QUEUE_DIR:-$HOME/Claude/docs/ai-state/de-pr-queue}"
SNAPSHOT="${DE_FILA_TICK_SNAPSHOT:-$Q/.fila-snapshot.json}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERMINAL_SEND_BIN="${TERMINAL_SEND_BIN:-$SCRIPT_DIR/terminal-send.sh}"
DEST_PAPEL="${DE_FILA_TICK_DEST:-DE-COORD}"
HOOKS_LOG="${HOOKS_LOG_PATH:-$HOME/.claude/state/hooks.log}"

DRY_RUN=0
for a in "$@"; do
  case "$a" in
    --help|-h)
      cat <<'EOF'
Uso: de-fila-tick.sh [--dry-run]

Sem LLM, sem subagente. Le `gh pr list` do repo (REPO), compara com o
snapshot anterior (.fila-snapshot.json) e manda 1 mensagem ao DE-COORD
(via terminal-send.sh) SO quando ha transicao que exige julgamento:
PR virou APPROVED+CLEAN, ou merge falhou (mergeStateStatus DIRTY/BLOCKED
ou check com conclusion FAILURE). Debounce por SHA — ver cabecalho do
arquivo. --dry-run: imprime o que seria enviado, nao chama
terminal-send.sh nem grava o snapshot.
EOF
      exit 0 ;;
    --dry-run) DRY_RUN=1 ;;
    *) echo "flag desconhecida: $a" >&2; exit 2 ;;
  esac
done

if ! command -v gh >/dev/null 2>&1; then
  echo "de-fila-tick: gh CLI ausente -- nada a fazer, saindo limpo (sem alterar snapshot)." >&2
  exit 0
fi

PR_JSON=$(gh pr list --state open -R "$REPO" \
  --json number,headRefOid,reviewDecision,mergeStateStatus,statusCheckRollup,isDraft 2>&1) || {
  echo "de-fila-tick: gh pr list falhou -- nada a fazer, saindo limpo (sem alterar snapshot): $PR_JSON" >&2
  exit 0
}

mkdir -p "$(dirname "$SNAPSHOT")"
if [[ ! -f "$SNAPSHOT" ]]; then
  echo '{"_schema":"de-fila-tick.sh -- snapshot por PR (headRefOid, qualifica) do ultimo tick. Debounce por SHA.","prs":{}}' > "$SNAPSHOT"
fi

RESULT=$(REGISTRY_LIB_DIR="$SCRIPT_DIR" SNAPSHOT="$SNAPSHOT" PR_JSON="$PR_JSON" DRY_RUN="$DRY_RUN" python3 <<'PYEOF'
import json
import os
import sys

sys.path.insert(0, os.environ["REGISTRY_LIB_DIR"])
from registry_lib import mutate, RegistryLockTimeout  # noqa: E402

SNAPSHOT = os.environ["SNAPSHOT"]
DRY_RUN = os.environ["DRY_RUN"] == "1"
prs = json.loads(os.environ["PR_JSON"])


def qualifica(pr):
    if pr.get("isDraft"):
        return None
    if pr.get("reviewDecision") == "APPROVED" and pr.get("mergeStateStatus") == "CLEAN":
        return "APPROVED+CLEAN"
    if pr.get("mergeStateStatus") in ("DIRTY", "BLOCKED"):
        return "merge-falhou"
    for chk in (pr.get("statusCheckRollup") or []):
        if isinstance(chk, dict) and chk.get("conclusion") == "FAILURE":
            return "check-falhou"
    return None


transicoes = []  # (numero, motivo)


def do_tick(snap):
    prs_snap = snap.setdefault("prs", {})
    for pr in prs:
        num = str(pr["number"])
        sha = pr.get("headRefOid") or ""
        motivo = qualifica(pr)
        anterior = prs_snap.get(num) or {}
        sha_mudou = anterior.get("sha") != sha
        motivo_novo = bool(motivo) and anterior.get("motivo") != motivo
        if motivo and (sha_mudou or motivo_novo):
            transicoes.append((pr["number"], motivo))
        prs_snap[num] = {"sha": sha, "motivo": motivo}
    # PRs que sairam da lista (merged/closed/fechados fora daqui) saem do snapshot
    numeros_vivos = {str(pr["number"]) for pr in prs}
    for num in list(prs_snap):
        if num not in numeros_vivos:
            del prs_snap[num]


if DRY_RUN:
    # dry-run nao persiste -- roda a MESMA logica sobre uma copia lida direto,
    # sem lock/replace, so para prever o que aconteceria.
    try:
        with open(SNAPSHOT) as f:
            snap_copy = json.load(f)
    except Exception:
        snap_copy = {"prs": {}}
    do_tick(snap_copy)
else:
    try:
        mutate(SNAPSHOT, do_tick)
    except RegistryLockTimeout as e:
        print(f"LOCK_PRESO\t{e}")
        sys.exit(0)

if transicoes:
    nums = ",".join(f"#{n}({m})" for n, m in transicoes)
    print(f"TRANSICAO\t{nums}")
else:
    print("SEM_TRANSICAO")
PYEOF
)

echo "$RESULT" | grep -q "^LOCK_PRESO" && { echo "de-fila-tick: $RESULT" >&2; exit 0; }

if [[ "$RESULT" == "SEM_TRANSICAO" ]]; then
  echo "de-fila-tick: sem transicao que exija julgamento. Nenhuma mensagem enviada."
  exit 0
fi

NUMS="${RESULT#TRANSICAO$'\t'}"
MSG="leia QUEUE.md ${NUMS} (de-fila-tick, modo minimo)"

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "[dry-run] enviaria a $DEST_PAPEL: $MSG"
  exit 0
fi

SEND_OUT=$("$TERMINAL_SEND_BIN" "$DEST_PAPEL" "$MSG" 2>&1)
SEND_RC=$?
echo "$SEND_OUT"

TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
mkdir -p "$(dirname "$HOOKS_LOG")" 2>/dev/null
printf '%s · de-fila-tick.sh · %s · %s · %s\n' "$TS" "$DEST_PAPEL" "$SEND_RC" "$NUMS" >> "$HOOKS_LOG" 2>/dev/null || true

exit "$SEND_RC"

# board-sync: preenche as colunas ROADMAP e PR/STATUS da sidebar (sem LLM; REMOVER-QUANDO no cabecalho dele)
bash "$(dirname "$0")/board-sync.sh" >/dev/null 2>&1 || true

# despacho mecanico (dono 29/08): builder ocioso/sem PR com Entrega executavel -> DESPACHO.md + acorda DE-COORD por evento
DESPACHO=1 bash "$(dirname "$0")/board-sync.sh" >/dev/null 2>&1 || true

# aprovador humano externo (dono 29/08): PR com reviewer externo pedido e sem approve no head -> WhatsApp via gusman-os (1x por PR/head, horario comercial)
bash "$(dirname "$0")/de-aprovador-externo.sh" >/dev/null 2>&1 || true
