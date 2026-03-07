#!/bin/bash
# =============================================================================
# theatrical-scan.sh — PostToolUse: Detect theatrical testing anti-patterns
# Runs after Edit/Write on test files. Blocks if anti-patterns found.
# Exit 2 = block with feedback. Exit 0 = allow.
# =============================================================================

# Read tool input from stdin
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tool_name', ''))
except:
    print('')
" 2>/dev/null || echo "")

# Only check Write and Edit tools
case "$TOOL_NAME" in
  Write|Edit) ;;
  *) exit 0 ;;
esac

# Get file path from tool input
FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('file_path', ''))
except:
    print('')
" 2>/dev/null || echo "")

# Only scan test files
case "$FILE_PATH" in
  *.test.ts|*.test.tsx|*.spec.ts|*.spec.tsx) ;;
  *) exit 0 ;;
esac

[ ! -f "$FILE_PATH" ] && exit 0

ERRORS=0
DETAILS=""

# Pattern 1: .catch(() => false)
P1=$(grep -cn "\.catch.*=>.*false" "$FILE_PATH" 2>/dev/null || echo "0")
if [ "$P1" -gt 0 ]; then
  ERRORS=$((ERRORS + P1))
  DETAILS="$DETAILS\n  - $P1x .catch(() => false) — mascara erros reais"
fi

# Pattern 2: || true tautology
P2=$(grep -cn "|| true" "$FILE_PATH" 2>/dev/null || echo "0")
if [ "$P2" -gt 0 ]; then
  ERRORS=$((ERRORS + P2))
  DETAILS="$DETAILS\n  - $P2x || true — tautologia que nunca falha"
fi

# Pattern 3: Always-true assertion
P3=$(grep -cn "toBeGreaterThanOrEqual(0)" "$FILE_PATH" 2>/dev/null || echo "0")
if [ "$P3" -gt 0 ]; then
  ERRORS=$((ERRORS + P3))
  DETAILS="$DETAILS\n  - $P3x toBeGreaterThanOrEqual(0) — array.length sempre >= 0"
fi

if [ "$ERRORS" -gt 0 ]; then
  echo "BLOCKED: [THEATRICAL-SCAN] $ERRORS anti-pattern(s) teatrais em $FILE_PATH:" >&2
  echo -e "$DETAILS" >&2
  echo "Ver: .claude/rules/test-quality-enforcement.md" >&2
  exit 2
fi

exit 0
