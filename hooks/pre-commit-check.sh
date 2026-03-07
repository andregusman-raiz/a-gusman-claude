#!/bin/bash
# =============================================================================
# pre-commit-check.sh — PostToolUse (Bash): Run related tests before git commit
# Triggers only on "git commit" commands. Uses vitest --related for speed.
# Exit 0 always (advisory) — warns but doesn't block.
# =============================================================================

# Source PATH helper (npm/npx)
source "$(dirname "$0")/_env.sh" 2>/dev/null || true

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('command', ''))
except:
    print('')
" 2>/dev/null || echo "")

# Only trigger on git commit commands
echo "$COMMAND" | grep -q "git commit" || exit 0

# Need vitest and a node project
[ -f "package.json" ] || exit 0
command -v npx &>/dev/null || exit 0

# Get staged .ts/.tsx files
STAGED=$(git diff --cached --name-only --diff-filter=ACMR -- '*.ts' '*.tsx' 2>/dev/null | tr '\n' ' ')
[ -z "$STAGED" ] && exit 0

# Run vitest on related files (10s timeout, advisory)
RESULT=$(timeout 10 npx vitest run --related $STAGED --reporter=verbose --passWithNoTests 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ] && [ $EXIT_CODE -ne 124 ]; then
  FAILURES=$(echo "$RESULT" | grep -c "FAIL" || echo "0")
  if [ "$FAILURES" -gt 0 ]; then
    echo "BLOCKED: [PRE-COMMIT] $FAILURES teste(s) falhando em arquivos staged." >&2
    echo "$RESULT" | grep "FAIL" | head -5 >&2
    echo "Corrija os testes antes de commitar." >&2
    exit 2
  fi
fi

exit 0
