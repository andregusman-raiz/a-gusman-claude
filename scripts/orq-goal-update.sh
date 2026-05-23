#!/usr/bin/env bash
# orq-goal-update.sh — Atualiza orq-goal-active.json apos Verification Gate.
#
# Uso:
#   orq-goal-update.sh --check <type> --status <pass|fail|pending> [--detail "<motivo>"]
#   orq-goal-update.sh --status active|done|abandoned
#   orq-goal-update.sh --extend-ttl <hours>
#   orq-goal-update.sh --abandon "<motivo>"
#   orq-goal-update.sh --show

set -euo pipefail

GOAL_FILE="${HOME}/Claude/docs/ai-state/orq-goal-active.json"

if [ ! -f "$GOAL_FILE" ]; then
  echo "[orq-goal-update] nenhum goal ativo em $GOAL_FILE" >&2
  exit 1
fi

CHECK_TYPE=""
NEW_STATUS=""
DETAIL=""
GOAL_STATUS=""
EXTEND_HOURS=""
ABANDON_MSG=""
SHOW=0

while [ $# -gt 0 ]; do
  case "$1" in
    --check) CHECK_TYPE="$2"; shift 2 ;;
    --status) NEW_STATUS="$2"; shift 2 ;;
    --detail) DETAIL="$2"; shift 2 ;;
    --goal-status) GOAL_STATUS="$2"; shift 2 ;;
    --extend-ttl) EXTEND_HOURS="$2"; shift 2 ;;
    --abandon) ABANDON_MSG="$2"; shift 2 ;;
    --show) SHOW=1; shift ;;
    *) echo "[orq-goal-update] flag desconhecida: $1" >&2; exit 1 ;;
  esac
done

if [ "$SHOW" -eq 1 ]; then
  jq . "$GOAL_FILE"
  exit 0
fi

tmp=$(mktemp)

if [ -n "$CHECK_TYPE" ] && [ -n "$NEW_STATUS" ]; then
  jq --arg t "$CHECK_TYPE" --arg s "$NEW_STATUS" --arg d "$DETAIL" --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '
    .checks |= map(
      if .type == $t then
        .status = $s
        | (if $d != "" then .last_detail = $d else . end)
        | .updated_at = $ts
      else . end
    )
    | .updated_at = $ts
  ' "$GOAL_FILE" > "$tmp" && mv "$tmp" "$GOAL_FILE"
  echo "[orq-goal-update] check $CHECK_TYPE -> $NEW_STATUS"
fi

if [ -n "$GOAL_STATUS" ]; then
  jq --arg s "$GOAL_STATUS" --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '
    .status = $s | .updated_at = $ts
  ' "$GOAL_FILE" > "$tmp" && mv "$tmp" "$GOAL_FILE"
  echo "[orq-goal-update] goal status -> $GOAL_STATUS"
fi

if [ -n "$EXTEND_HOURS" ]; then
  NEW_EXP=$(date -u -v+${EXTEND_HOURS}H +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d "+${EXTEND_HOURS} hours" +%Y-%m-%dT%H:%M:%SZ)
  jq --arg e "$NEW_EXP" --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '
    .expires_at = $e | .updated_at = $ts
  ' "$GOAL_FILE" > "$tmp" && mv "$tmp" "$GOAL_FILE"
  echo "[orq-goal-update] expires_at -> $NEW_EXP"
fi

if [ -n "$ABANDON_MSG" ]; then
  SLUG=$(jq -r '.slug' "$GOAL_FILE")
  TS=$(date -u +%Y%m%dT%H%M%SZ)
  ARCHIVE_DIR="${HOME}/Claude/docs/ai-state/archive"
  mkdir -p "$ARCHIVE_DIR"
  jq --arg m "$ABANDON_MSG" --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '
    .status = "abandoned" | .abandoned_reason = $m | .abandoned_at = $ts
  ' "$GOAL_FILE" > "${ARCHIVE_DIR}/orq-goal-${SLUG}-${TS}.abandoned.json"
  rm -f "$GOAL_FILE"
  echo "[orq-goal-update] goal abandonado e arquivado: $ABANDON_MSG"
fi
