#!/bin/bash
# =============================================================================
# tdd-guard.sh — PreToolUse: Block writes to implementation files without tests
# Item #11: TDD Guard hook
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

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only guard domain/ and components/ source files
case "$FILE_PATH" in
  */domain/*.ts|*/domain/*.tsx|*/components/*.ts|*/components/*.tsx) ;;
  *) exit 0 ;;
esac

# Whitelist: types, schemas, configs, index files, styles
case "$FILE_PATH" in
  *.types.ts|*.schema.ts|*.d.ts|*/index.ts|*/index.tsx|*.css|*.scss) exit 0 ;;
  *.test.ts|*.test.tsx|*.spec.ts|*.spec.tsx) exit 0 ;;  # Test files themselves
  *.config.ts|*.config.tsx) exit 0 ;;
esac

# Check if corresponding test file exists
TEST_FILE=$(echo "$FILE_PATH" | sed 's/\.\(ts\|tsx\)$/.test.\1/')
if [ ! -f "$TEST_FILE" ]; then
  # Also check with .spec extension
  SPEC_FILE=$(echo "$FILE_PATH" | sed 's/\.\(ts\|tsx\)$/.spec.\1/')
  if [ ! -f "$SPEC_FILE" ]; then
    echo "BLOCKED: [TDD-GUARD] Arquivo $FILE_PATH nao tem teste correspondente ($TEST_FILE)." >&2
    echo "Crie o teste ANTES de implementar (Red-Green-Refactor)." >&2
    echo "Excecoes: *.types.ts, *.schema.ts, *.config.ts, *.d.ts, index.ts" >&2
    exit 2
  fi
fi

exit 0
