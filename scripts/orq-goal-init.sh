#!/usr/bin/env bash
# orq-goal-init.sh — Cria orq-goal-active.json para ag-0-orquestrador.
#
# Uso:
#   orq-goal-init.sh --intent "<intent>" --route <machine> --mode <single-pr|full|dag|ad-hoc> [opts]
#
# Opcoes:
#   --slug <slug>           Override do slug (default: derivado do intent)
#   --branch <name>         Head branch para checks gh_pr_open/merged
#   --spec-path <path>      Path do SPEC para check file_exists
#   --phase-state <file>    Nome do state file de --full (sem path)
#   --total-phases <N>      Para --full, qual fase deve estar done (default: 7)
#   --score-min <N>         Override threshold MQS/SSS/FS (default: 85)
#   --ttl-hours <N>         Override TTL (default: 2/4/6 por mode)
#   --extra-check <json>    Append check custom (pode usar varias vezes)
#   --session-id <id>       Override do session_id (default: $CLAUDE_CODE_SESSION_ID do processo atual)
#   --dry-run               Imprime JSON sem escrever
#   --force                 Sobrescreve goal-active.json existente
#
# Saidas:
#   Escreve ~/Claude/docs/ai-state/orq-goal-active.json
#   Stdout: path do arquivo + intent

set -euo pipefail

GOAL_FILE="${HOME}/Claude/docs/ai-state/orq-goal-active.json"
SCHEMA_FILE="${HOME}/Claude/.claude/shared/templates/orq-goal-active.schema.json"

# Defaults
INTENT=""
ROUTE=""
MODE="single-pr"
SLUG=""
BRANCH=""
SPEC_PATH=""
PHASE_STATE=""
TOTAL_PHASES=7
SCORE_MIN=85
TTL_HOURS=""
DRY_RUN=0
FORCE=0
EXTRA_CHECKS=()
SESSION_ID="${CLAUDE_CODE_SESSION_ID:-}"

while [ $# -gt 0 ]; do
  case "$1" in
    --intent) INTENT="$2"; shift 2 ;;
    --route) ROUTE="$2"; shift 2 ;;
    --mode) MODE="$2"; shift 2 ;;
    --slug) SLUG="$2"; shift 2 ;;
    --branch) BRANCH="$2"; shift 2 ;;
    --spec-path) SPEC_PATH="$2"; shift 2 ;;
    --phase-state) PHASE_STATE="$2"; shift 2 ;;
    --total-phases) TOTAL_PHASES="$2"; shift 2 ;;
    --score-min) SCORE_MIN="$2"; shift 2 ;;
    --ttl-hours) TTL_HOURS="$2"; shift 2 ;;
    --extra-check) EXTRA_CHECKS+=("$2"); shift 2 ;;
    --session-id) SESSION_ID="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --force) FORCE=1; shift ;;
    -h|--help) sed -n '2,25p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "[orq-goal-init] flag desconhecida: $1" >&2; exit 1 ;;
  esac
done

[ -z "$INTENT" ] && { echo "[orq-goal-init] --intent obrigatorio" >&2; exit 1; }
[ -z "$ROUTE" ] && { echo "[orq-goal-init] --route obrigatorio (ex: ag-1-construir)" >&2; exit 1; }

# Slug: 4 primeiras palavras kebab-case
if [ -z "$SLUG" ]; then
  SLUG=$(echo "$INTENT" \
    | tr '[:upper:]' '[:lower:]' \
    | sed 's/[^a-z0-9 ]/ /g' \
    | tr -s ' ' \
    | awk '{n = (NF < 4 ? NF : 4); for (i=1; i<=n; i++) printf (i>1?"-":"") $i}' )
  [ -z "$SLUG" ] && SLUG="goal-$(date +%s)"
fi

# TTL default por mode
if [ -z "$TTL_HOURS" ]; then
  case "$MODE" in
    single-pr) TTL_HOURS=2 ;;
    full) TTL_HOURS=4 ;;
    dag) TTL_HOURS=6 ;;
    ad-hoc) TTL_HOURS=1 ;;
    *) TTL_HOURS=2 ;;
  esac
fi

NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
EXPIRES=$(date -u -v+${TTL_HOURS}H +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d "+${TTL_HOURS} hours" +%Y-%m-%dT%H:%M:%SZ)

# Phase state default
[ -z "$PHASE_STATE" ] && [ "$MODE" = "full" ] && PHASE_STATE="orq-goal-${SLUG}.json"

# Construir checks por route
CHECKS_JSON='[]'

add_check() {
  local check="$1"
  CHECKS_JSON=$(echo "$CHECKS_JSON" | jq --argjson c "$check" '. + [$c]')
}

case "$ROUTE" in
  ag-1-construir|ag-1)
    if [ -n "$BRANCH" ]; then
      add_check "$(jq -n --arg b "$BRANCH" '{type:"gh_pr_open", args:{head_branch:$b}, rationale:"PR aberto da feature"}')"
    fi
    if [ -n "$SPEC_PATH" ]; then
      add_check "$(jq -n --arg p "$SPEC_PATH" '{type:"file_exists", args:{path:$p}, rationale:"SPEC existe"}')"
    fi
    ;;
  ag-2-corrigir|ag-2)
    if [ -n "$BRANCH" ]; then
      add_check "$(jq -n --arg b "$BRANCH" '{type:"gh_pr_open", args:{head_branch:$b}, rationale:"PR do fix aberto"}')"
    fi
    add_check '{"type":"command_success","args":{"command":"bun run typecheck","timeout":180},"rationale":"Typecheck verde apos fix","skip":true}'
    ;;
  ag-3-entregar|ag-3)
    add_check '{"type":"deploy_url_active","args":{"url":"<set-via-extra-check>"},"rationale":"Preview/prod responde HTTP","skip":true}'
    if [ -n "$BRANCH" ]; then
      add_check "$(jq -n --arg b "$BRANCH" '{type:"gh_pr_merged", args:{head_branch:$b}, rationale:"PR merged antes do deploy prod"}')"
    fi
    ;;
  ag-7-qualidade|ag-7)
    add_check "$(jq -n --argjson m "$SCORE_MIN" '{type:"score_threshold", args:{file:"meridian-state.json", field:".mqs", min:$m}, rationale:"MERIDIAN Quality Score"}')"
    ;;
  ag-8-seguranca|ag-8)
    add_check "$(jq -n --argjson m "$SCORE_MIN" '{type:"score_threshold", args:{file:"sentinel-state.json", field:".sss", min:$m}, rationale:"SENTINEL Security Score"}')"
    ;;
  ag-9-auditar|ag-9)
    add_check "$(jq -n --argjson m "$SCORE_MIN" '{type:"score_threshold", args:{file:"fortress-state.json", field:".fs", min:$m}, rationale:"FORTRESS Score completo"}')"
    ;;
  *) ;;
esac

# Mode-specific
if [ "$MODE" = "full" ] && [ -n "$PHASE_STATE" ]; then
  add_check "$(jq -n --arg sf "$PHASE_STATE" --argjson pid "$TOTAL_PHASES" '{type:"phase_done", args:{state_file:$sf, phase_id:$pid}, rationale:"Pipeline full chega ate FINALIZE"}')"
fi

# Extra checks
for extra in "${EXTRA_CHECKS[@]:-}"; do
  [ -n "$extra" ] && add_check "$extra"
done

# Validar minimo 1 check
N_CHECKS=$(echo "$CHECKS_JSON" | jq 'length')
if [ "$N_CHECKS" -eq 0 ]; then
  echo "[orq-goal-init] aviso: zero checks gerados para route=$ROUTE — usando file_exists fallback" >&2
  add_check '{"type":"command_success","args":{"command":"true"},"rationale":"placeholder; substitua por check real","skip":true}'
fi

# Montar goal JSON
GOAL_JSON=$(jq -n \
  --arg slug "$SLUG" \
  --arg intent "$INTENT" \
  --arg route "$ROUTE" \
  --arg mode "$MODE" \
  --arg now "$NOW" \
  --arg exp "$EXPIRES" \
  --arg sid "$SESSION_ID" \
  --argjson checks "$CHECKS_JSON" \
  '{
    slug: $slug,
    intent: $intent,
    machine_route: $route,
    mode: $mode,
    started_at: $now,
    expires_at: $exp,
    status: "active",
    bypass_allowed: true,
    checks: $checks
  } + (if $sid != "" then {session_id: $sid} else {} end)')

if [ -z "$SESSION_ID" ]; then
  echo "[orq-goal-init] aviso: CLAUDE_CODE_SESSION_ID vazio — goal sem session_id vai bloquear Stop de TODAS as sessoes (comportamento legado). Passe --session-id se souber o valor." >&2
fi

if [ "$DRY_RUN" -eq 1 ]; then
  echo "$GOAL_JSON" | jq .
  exit 0
fi

# Check existente
if [ -f "$GOAL_FILE" ] && [ "$FORCE" -eq 0 ]; then
  EXISTING_SLUG=$(jq -r '.slug' "$GOAL_FILE" 2>/dev/null || echo "?")
  echo "[orq-goal-init] erro: goal ativo ja existe (slug=$EXISTING_SLUG)" >&2
  echo "  Use --force para sobrescrever OU complete o goal atual primeiro" >&2
  echo "  Path: $GOAL_FILE" >&2
  exit 2
fi

mkdir -p "$(dirname "$GOAL_FILE")"
echo "$GOAL_JSON" > "$GOAL_FILE"

echo "[orq-goal-init] goal ativado:"
echo "  path: $GOAL_FILE"
echo "  slug: $SLUG"
echo "  intent: $INTENT"
echo "  route: $ROUTE | mode: $MODE | ttl: ${TTL_HOURS}h"
echo "  checks: $N_CHECKS"
echo "  expires: $EXPIRES"
