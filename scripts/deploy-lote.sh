#!/usr/bin/env bash
# deploy-lote.sh — desacopla MERGE de DEPLOY no raiz-data-engine (SPEC-fila-review-deploy-2026-08-30 §1.3).
# DOR: 119 deploys/semana, 45 REMOVED (substituídos) e 47 FAILED em cascata; gate serial 45 min pago por merge.
# MECANISMO: Railway constrói a partir de `deploy/railway`; este script avança esse ponteiro por fast-forward para
# `origin/main` no máximo 1×/hora (ou quando a fila de PRs prontos está vazia), gravando as áreas alteradas em
# RDE_DEPLOY_CHANGED_AREAS (--skip-deploys) para o gate por caminho (§2). Sem LLM; corre no de-fila-tick.
# ATIVAÇÃO: só com o arquivo ~/.claude/state/deploy-lote.enabled (COMANDO cria DEPOIS de mudar a branch do Railway).
# MANUAL: DEPLOY_LOTE_NOW=1 bash deploy-lote.sh (hotfix). DRY: DEPLOY_LOTE_DRY=1.
set -uo pipefail
REPO_DIR="${DE_REPO_DIR:-$HOME/Claude/GitHub/raiz-data-engine}"; REPO="${DE_REPO:-Raiz-Educacao-SA/raiz-data-engine}"
REL="${DEPLOY_LOTE_BRANCH:-deploy/railway}"; MIN_GAP="${DEPLOY_LOTE_MIN_GAP_S:-3600}"
LOG="$HOME/Claude/docs/ai-state/terminais/deploy-lote.log"; STATE="$HOME/.claude/state/deploy-lote.last"; FLAG="$HOME/.claude/state/deploy-lote.enabled"
now=$(date -u +%Y-%m-%dT%H:%M:%SZ); ts=$(date +%s)
[[ -f "$FLAG" || "${DEPLOY_LOTE_NOW:-0}" == "1" || "${DEPLOY_LOTE_DRY:-0}" == "1" ]] || exit 0
cd "$REPO_DIR" 2>/dev/null || { echo "$now deploy-lote: repo ausente $REPO_DIR" >> "$LOG"; exit 1; }
git fetch -q origin main "$REL" 2>/dev/null || { echo "$now deploy-lote: fetch falhou (branch $REL existe?)" >> "$LOG"; exit 1; }
MAIN=$(git rev-parse origin/main); CUR=$(git rev-parse "origin/$REL" 2>/dev/null || echo "")
[[ -z "$CUR" ]] && { echo "$now deploy-lote: origin/$REL inexistente — criar primeiro (SPEC §1.1)" >> "$LOG"; exit 1; }
[[ "$MAIN" == "$CUR" ]] && exit 0                                   # nada novo
git merge-base --is-ancestor "$CUR" "$MAIN" || { echo "$now deploy-lote: $REL NÃO é ancestral de main (divergiu) — intervenção humana" >> "$LOG"; exit 2; }
# rev 2 (juiz): condição "fila vazia" REMOVIDA — anteciparia todo merge. Só hora + manual. Lock único tick↔manual.
LK="$HOME/.claude/state/deploy-lote.lock"
if ! mkdir "$LK" 2>/dev/null; then
  [[ -n "$(find "$LK" -maxdepth 0 -mmin +15 2>/dev/null)" ]] && rmdir "$LK" 2>/dev/null && mkdir "$LK" 2>/dev/null || exit 0
fi
trap 'rmdir "$LK" 2>/dev/null' EXIT
last=$(cat "$STATE" 2>/dev/null || echo 0); gap=$(( ts - last ))
motivo=""
if [[ "${DEPLOY_LOTE_NOW:-0}" == "1" ]]; then motivo="manual"
elif (( gap >= MIN_GAP )); then motivo="hora"
fi
[[ -z "$motivo" ]] && exit 0
AREAS=$(git diff --name-only "$CUR" "$MAIN" | python3 -c '
import sys,re
A=set()
for p in sys.stdin.read().split():
    if re.match(r"(dbt/|scripts/dbt-prata-gate\.sh|scripts/dbt/)",p) or re.search(r"raiz_data_engine/.*(prata|/models/)",p): A.add("dbt")
    elif re.match(r"(alembic/|migrations/)",p): A.add("alembic")
    elif re.search(r"raiz_data_engine/.*/rh/|docs/diagnosticos/.*rh",p): A.add("rh")
    elif p.startswith("raiz_data_engine/"): A.add("api")
    else: A.add("outros")
print(",".join(sorted(A)) or "outros")')
if [[ "${DEPLOY_LOTE_DRY:-0}" == "1" ]]; then echo "[dry] $REL: ${CUR:0:8}→${MAIN:0:8} areas=$AREAS motivo=$motivo"; exit 0; fi
railway variables --set "RDE_DEPLOY_CHANGED_AREAS=$AREAS" --set "RDE_DEPLOY_PREV_SHA=$CUR" --set "RDE_DEPLOY_TARGET_SHA=$MAIN" --skip-deploys >/dev/null 2>&1 || { echo "$now deploy-lote: railway variables falhou — lote NÃO enviado" >> "$LOG"; exit 3; }
if git push -q --force-with-lease="refs/heads/$REL:$CUR" origin "$MAIN:refs/heads/$REL" 2>>"$LOG"; then
  echo "$ts" > "$STATE"; echo "$now deploy-lote: $REL ${CUR:0:8}→${MAIN:0:8} areas=$AREAS motivo=$motivo" >> "$LOG"
else
  echo "$now deploy-lote: push ff falhou ${CUR:0:8}→${MAIN:0:8}" >> "$LOG"; exit 4
fi
