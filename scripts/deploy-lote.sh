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
if [[ "$MAIN" == "$CUR" ]]; then
  # 30/08 21:59Z: lote 49cec9eb FAILED e o batcher não tinha re-tentativa — pipeline parava até ao próximo merge.
  # CORRIGIDO 31/08 00:1xZ — a causa que esta linha afirmava ("advisory lock ocupado por job dbt vivo") foi RETRACTADA
  # na mesma noite: o veredito FATAL saiu às 21:56:34Z, ANTES da primeira execução que tocou o banco (21:59:04Z), logo
  # não pode ter contribuído. A causa medida foi models_changed_since_build — o #6406 acrescentou 8 ficheiros sob dbt/
  # (todos candidate, nenhum governado) e invalidou a prova do ledger, porque governed_models_hash() faz hash da
  # closure INTEIRA apesar do nome. Fica escrito para não ensinar a lição errada a quem ler a seguir.
  # LIMITE CONHECIDO: este retry foi desenhado para condição TRANSITÓRIA (lock que liberta). Contra condição
  # PERSISTENTE — p.ex. janela Alembic não aprovada (00:00Z 31/08) — esgota as 3 tentativas e cala-se, com a produção
  # parada e sem sinal. Retry esgotado NÃO é o mesmo que nada a fazer.
  # Agora: último deployment FAILED do MESMO commit e sem commit novo → redeploy a cada ≥30 min, máx 3 por commit.
  RS="$HOME/.claude/state/deploy-lote.retry"; RC=$(cat "$RS" 2>/dev/null || echo "none 0 0"); set -- $RC; rsha=$1; rn=$2; rts=$3
  [[ "$rsha" != "$MAIN" ]] && { rn=0; rts=$ts; echo "$MAIN 0 $ts" > "$RS"; }   # 1º avistamento: só arma o relógio (retry ≥30 min depois)
  LAST=$(railway deployment list --json 2>/dev/null | python3 -c "
import sys,json
d=json.load(sys.stdin); d=d if isinstance(d,list) else d.get('deployments',[])
x=[e.get('node',e) for e in d][:1]
print((x[0].get('status','') + ' ' + str(x[0].get('meta',{}).get('commitHash') or x[0].get('commitHash') or '')) if x else '')" 2>/dev/null)
  if [[ "$LAST" == FAILED* && $rn -lt 3 && $(( ts - rts )) -ge 1800 ]]; then
    if yes | railway redeploy >/dev/null 2>&1; then
      echo "$MAIN $((rn+1)) $ts" > "$RS"; echo "$now deploy-lote: RETRY $((rn+1))/3 do commit ${MAIN:0:8} (último deployment FAILED) via railway redeploy" >> "$LOG"
    else
      echo "$now deploy-lote: railway redeploy falhou (retry $((rn+1)))" >> "$LOG"
    fi
  fi
  exit 0
fi
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
# 31/08 02:1xZ (lacuna apontada pelo COMANDO): o estado dos deployments só era lido no ramo do retry — com commit novo o lote
# saía por cima de um deployment ainda em voo (Railway REMOVE o anterior = o churn que o batcher existe para evitar).
# Agora: deployment em BUILDING/DEPLOYING/INITIALIZING/QUEUED → adia este tick sem consumir o relógio da hora.
EMVOO=$(railway deployment list --json 2>/dev/null | python3 -c "
import sys,json
d=json.load(sys.stdin); d=d if isinstance(d,list) else d.get('deployments',[])
x=[e.get('node',e) for e in d][:1]
print(x[0].get('status','') if x else '')" 2>/dev/null)
case "$EMVOO" in BUILDING|DEPLOYING|INITIALIZING|QUEUED|WAITING)
  echo "$now deploy-lote: adiado — deployment em voo ($EMVOO); lote ${CUR:0:8}→${MAIN:0:8} sai no próximo tick" >> "$LOG"; exit 0;;
esac
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
