#!/bin/bash
# =============================================================================
# smart-test-suggest.sh — PostToolUse: Suggest test file to run after editing
#
# Trigger: PostToolUse, Edit events on *.ts and *.tsx files
# Purpose: Reduce context-switching cost by surfacing the right test command
#          immediately after a source file is modified.
# Non-blocking — informational only (exit 0 always).
# =============================================================================

[ -z "$CLAUDE_FILE_PATHS" ] && exit 0

SUGGESTIONS=""

for FILE in $CLAUDE_FILE_PATHS; do
  [ -f "$FILE" ] || continue

  # Only process TypeScript source files
  case "$FILE" in
    *.ts|*.tsx) ;;
    *) continue ;;
  esac

  # Skip test/spec files themselves — no point suggesting to test a test
  case "$FILE" in
    *.test.ts|*.spec.ts|*.test.tsx|*.spec.tsx|*/__tests__/*|*/__mocks__/*) continue ;;
    *.types.ts|*.d.ts) continue ;;
  esac

  BASENAME=$(basename "$FILE" .ts)
  BASENAME=$(basename "$BASENAME" .tsx)
  DIRPATH=$(dirname "$FILE")

  SUGGESTION=""

  # --- Service files: src/lib/services/foo.service.ts ---
  case "$FILE" in
    */lib/services/*.service.ts|*/services/*.service.ts)
      # Try vitest first (rAIz-AI-Prof), then jest (raiz-platform)
      VITEST_PATH="${DIRPATH/__tests__/}/__tests__/${BASENAME}.test.ts"
      JEST_PATH="${DIRPATH}/${BASENAME}.test.ts"

      if [ -f "$VITEST_PATH" ]; then
        SUGGESTION="npx vitest run ${VITEST_PATH}"
      elif [ -f "$JEST_PATH" ]; then
        SUGGESTION="npx jest --testPathPattern=${BASENAME}"
      else
        # Fallback: pattern search
        SUGGESTION="npx vitest run --reporter=verbose ${BASENAME}  # or: npx jest --testPathPattern=${BASENAME}"
      fi
      ;;
  esac

  # --- API route handlers: src/app/api/**/route.ts ---
  if [ -z "$SUGGESTION" ]; then
    case "$FILE" in
      */app/api/*/route.ts|*/app/api/*/route.tsx)
        # Extract the route segment (e.g. src/app/api/users/route.ts -> users)
        ROUTE_SEGMENT=$(echo "$DIRPATH" | sed 's|.*/api/||' | tr '/' '-')
        SUGGESTION="npx vitest run --reporter=verbose ${ROUTE_SEGMENT}  # or: npx jest --testPathPattern=${ROUTE_SEGMENT}"
        ;;
    esac
  fi

  # --- React components: src/components/Foo.tsx ---
  if [ -z "$SUGGESTION" ]; then
    case "$FILE" in
      */components/*.tsx|*/components/*.ts)
        # Component test may live alongside or in __tests__
        SIBLING_TEST="${DIRPATH}/${BASENAME}.test.tsx"
        NESTED_TEST="${DIRPATH}/__tests__/${BASENAME}.test.tsx"

        if [ -f "$SIBLING_TEST" ]; then
          SUGGESTION="npx vitest run ${SIBLING_TEST}  # or: npx jest ${SIBLING_TEST}"
        elif [ -f "$NESTED_TEST" ]; then
          SUGGESTION="npx vitest run ${NESTED_TEST}  # or: npx jest ${NESTED_TEST}"
        else
          SUGGESTION="npx vitest run --reporter=verbose ${BASENAME}  # or: npx jest --testPathPattern=${BASENAME}"
        fi
        ;;
    esac
  fi

  # --- Hooks: src/hooks/useXxx.ts ---
  if [ -z "$SUGGESTION" ]; then
    case "$FILE" in
      */hooks/use*.ts|*/hooks/use*.tsx)
        SUGGESTION="npx vitest run --reporter=verbose ${BASENAME}  # or: npx jest --testPathPattern=${BASENAME}"
        ;;
    esac
  fi

  # --- Generic fallback for any other .ts file ---
  if [ -z "$SUGGESTION" ]; then
    SUGGESTION="npx vitest run --reporter=verbose ${BASENAME}  # or: npx jest --testPathPattern=${BASENAME}"
  fi

  SUGGESTIONS="${SUGGESTIONS}\n  ${FILE}\n    -> ${SUGGESTION}"
done

if [ -n "$SUGGESTIONS" ]; then
  echo "hook additional context: [TEST-SUGGEST] Arquivo(s) modificado(s) — comando de teste sugerido:${SUGGESTIONS}" >&2
fi

# Informational only — never blocks execution
exit 0
