#!/usr/bin/env bash
# auto-context-preview.sh
# SessionStart hook: se o CWD esta dentro de um projeto com .claude/AUTO_CONTEXT.md,
# imprime preview no console (visivel pro Claude na inicializacao).
#
# Idempotente, silencioso se nao houver contexto.

set -uo pipefail

CWD="${CLAUDE_PROJECT_DIR:-$(pwd)}"
PROJECT_ROOT="$(git -C "$CWD" rev-parse --show-toplevel 2>/dev/null || echo "")"
[ -z "$PROJECT_ROOT" ] && exit 0
[ "$PROJECT_ROOT" = "$HOME/Claude" ] && exit 0

CONTEXT_FILE="$PROJECT_ROOT/.claude/AUTO_CONTEXT.md"
[ ! -f "$CONTEXT_FILE" ] && exit 0

# Idade do arquivo
AGE_SEC=$(( $(date +%s) - $(stat -f %m "$CONTEXT_FILE" 2>/dev/null || echo 0) ))
AGE_HUMAN=""
if [ "$AGE_SEC" -lt 3600 ]; then
  AGE_HUMAN="$((AGE_SEC / 60))min"
elif [ "$AGE_SEC" -lt 86400 ]; then
  AGE_HUMAN="$((AGE_SEC / 3600))h"
else
  AGE_HUMAN="$((AGE_SEC / 86400))d"
fi

PROJECT_NAME="$(basename "$PROJECT_ROOT")"

echo "[auto-context] $PROJECT_NAME — snapshot $AGE_HUMAN atras"
# Mostrar Estado atual + ultimo commit + ultima sessao (compacto)
awk '
  /^## Estado atual/,/^## Ultimos commits/ {if (!/^## Ultimos commits/) print}
  /^## Ultimos commits/,/^## Branches locais/ {if ($0 ~ /^- `[a-f0-9]/) {print; exit}}
' "$CONTEXT_FILE" 2>/dev/null
echo "[auto-context] full: $CONTEXT_FILE"

exit 0
