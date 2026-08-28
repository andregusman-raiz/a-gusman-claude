#!/usr/bin/env bash
# orq-goal-guard.sh — Stop hook determinístico para guardrail do ag-0-orquestrador.
#
# Comportamento:
#   - Lê ~/Claude/docs/ai-state/orq-goal-active.json
#   - Se não existe → exit 0 (não bloqueia)
#   - Se expires_at vencido → arquiva como .expired + exit 0
#   - Roda orq-goal-verify.py para avaliar checks declarativos
#   - Se TODOS pass → arquiva goal em archive/ + exit 0
#   - Se >=1 fail/pending → emite motivo em stderr + exit 2 (bloqueia Stop)
#
# Bypass: ORQ_GOAL_GUARD_DISABLED=1
# Bypass: existe arquivo ~/Claude/docs/ai-state/orq-goal-bypass.flag (uma vez, removido após uso)
#
# Integração: settings.json Stop hook + ag-0-orquestrador SKILL.md (Goal Activation)
# Rule: ~/Claude/.claude/rules/orq-goal-schema.md

set -u

GOAL_FILE="${HOME}/Claude/docs/ai-state/orq-goal-active.json"
ARCHIVE_DIR="${HOME}/Claude/docs/ai-state/archive"
BYPASS_FLAG="${HOME}/Claude/docs/ai-state/orq-goal-bypass.flag"
VERIFY_SCRIPT="${HOME}/Claude/.claude/scripts/orq-goal-verify.py"

# Bypass via env var
if [ "${ORQ_GOAL_GUARD_DISABLED:-0}" = "1" ]; then
  exit 0
fi

# Bypass via flag file (one-shot)
if [ -f "$BYPASS_FLAG" ]; then
  rm -f "$BYPASS_FLAG"
  exit 0
fi

# Sem goal ativo → nada a fazer
if [ ! -f "$GOAL_FILE" ]; then
  exit 0
fi

# Dependências mínimas
if ! command -v jq >/dev/null 2>&1; then
  echo "[orq-goal-guard] jq não encontrado; pulando guard" >&2
  exit 0
fi

# Escopo por sessão: goal com session_id só bloqueia a sessão dona.
# Sem session_id no arquivo (goal legado/antigo) → comportamento anterior (bloqueia todas).
GOAL_SESSION_ID=$(jq -r '.session_id // empty' "$GOAL_FILE" 2>/dev/null)
if [ -n "$GOAL_SESSION_ID" ] && [ -n "${CLAUDE_CODE_SESSION_ID:-}" ] && [ "$GOAL_SESSION_ID" != "$CLAUDE_CODE_SESSION_ID" ]; then
  exit 0
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "[orq-goal-guard] python3 não encontrado; pulando guard" >&2
  exit 0
fi
if [ ! -f "$VERIFY_SCRIPT" ]; then
  echo "[orq-goal-guard] orq-goal-verify.py ausente; pulando guard" >&2
  exit 0
fi

mkdir -p "$ARCHIVE_DIR"

# TTL check (expires_at em ISO8601 UTC)
EXPIRES_AT=$(jq -r '.expires_at // empty' "$GOAL_FILE" 2>/dev/null)
if [ -n "$EXPIRES_AT" ]; then
  NOW_TS=$(date -u +%s)
  # macOS BSD date OR GNU date
  EXP_TS=$(date -j -u -f "%Y-%m-%dT%H:%M:%SZ" "$EXPIRES_AT" +%s 2>/dev/null || date -u -d "$EXPIRES_AT" +%s 2>/dev/null || echo 0)
  if [ "$EXP_TS" -gt 0 ] && [ "$NOW_TS" -gt "$EXP_TS" ]; then
    SLUG=$(jq -r '.slug // "unknown"' "$GOAL_FILE" 2>/dev/null)
    TS=$(date -u +%Y%m%dT%H%M%SZ)
    mv "$GOAL_FILE" "${ARCHIVE_DIR}/orq-goal-${SLUG}-${TS}.expired.json"
    echo "[orq-goal-guard] Goal '${SLUG}' expirou em ${EXPIRES_AT}; arquivado e liberando Stop" >&2
    exit 0
  fi
fi

# Executa verifier (saída JSON: {ok: bool, pending: [...], failed: [...]} )
VERIFY_OUT=$(python3 "$VERIFY_SCRIPT" "$GOAL_FILE" 2>&1)
VERIFY_EXIT=$?

if [ $VERIFY_EXIT -ne 0 ]; then
  echo "[orq-goal-guard] verifier falhou (exit ${VERIFY_EXIT}):" >&2
  echo "$VERIFY_OUT" >&2
  # Em caso de erro do verifier, NÃO bloquear (fail-open para não travar sessão)
  exit 0
fi

OK=$(echo "$VERIFY_OUT" | jq -r '.ok // false' 2>/dev/null)

if [ "$OK" = "true" ]; then
  SLUG=$(jq -r '.slug // "unknown"' "$GOAL_FILE" 2>/dev/null)
  TS=$(date -u +%Y%m%dT%H%M%SZ)
  # Atualiza status=done antes de arquivar
  tmp=$(mktemp)
  jq --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '.status="done" | .completed_at=$ts' "$GOAL_FILE" > "$tmp" && mv "$tmp" "$GOAL_FILE"
  mv "$GOAL_FILE" "${ARCHIVE_DIR}/orq-goal-${SLUG}-${TS}.done.json"
  echo "[orq-goal-guard] Goal '${SLUG}' atendido — todos os checks pass. Arquivado." >&2
  exit 0
fi

# Caso bloqueado: emitir motivo legível
INTENT=$(jq -r '.intent // "(sem intent)"' "$GOAL_FILE" 2>/dev/null)
PENDING=$(echo "$VERIFY_OUT" | jq -r '.pending[]? | "  - " + .type + " (" + (.detail // "pending") + ")"' 2>/dev/null)
FAILED=$(echo "$VERIFY_OUT" | jq -r '.failed[]? | "  - " + .type + " (" + (.detail // "failed") + ")"' 2>/dev/null)

cat >&2 <<EOF
[orq-goal-guard] Stop bloqueado — goal ativo não atendido.

Intent: ${INTENT}
EOF

if [ -n "$PENDING" ]; then
  echo "" >&2
  echo "Checks PENDENTES:" >&2
  echo "$PENDING" >&2
fi
if [ -n "$FAILED" ]; then
  echo "" >&2
  echo "Checks FALHOS:" >&2
  echo "$FAILED" >&2
fi

cat >&2 <<EOF

Continue trabalhando até completar, OU rode um dos comandos abaixo se desejar encerrar:
  - touch ${BYPASS_FLAG}   # libera Stop UMA vez
  - ORQ_GOAL_GUARD_DISABLED=1 (env var)
  - editar ${GOAL_FILE} (marcar checks manualmente ou apagar)
EOF

exit 2
