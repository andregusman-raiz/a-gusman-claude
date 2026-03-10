#!/bin/bash
# Hook: error-context-enricher.sh
# Trigger: PostToolUse Bash (when test/build fails)
# Purpose: When a test or build fails, search Knowledge Graph for similar past errors
# Type: notification (non-blocking)

# Only trigger on test/build/typecheck failures
TOOL_OUTPUT="${1:-}"

# Check if the command output contains error indicators
if ! echo "$TOOL_OUTPUT" | grep -qiE "(FAIL|ERROR|error TS|Build failed|exit code [1-9]|ELIFECYCLE)"; then
  exit 0
fi

# Extract error signature (first meaningful error line)
ERROR_LINE=$(echo "$TOOL_OUTPUT" | grep -iE "(FAIL|error TS|Error:|TypeError:|ReferenceError:|Cannot find)" | head -1 | sed 's/^[[:space:]]*//' | cut -c1-120)

if [ -z "$ERROR_LINE" ]; then
  exit 0
fi

# Check errors-log.md for similar past errors
ERRORS_LOG=""
for LOG_PATH in \
  "docs/ai-state/errors-log.md" \
  "../docs/ai-state/errors-log.md" \
  "../../docs/ai-state/errors-log.md"; do
  if [ -f "$LOG_PATH" ]; then
    ERRORS_LOG="$LOG_PATH"
    break
  fi
done

CONTEXT=""
if [ -n "$ERRORS_LOG" ]; then
  # Search for similar errors in the log
  SIMILAR=$(grep -i "$(echo "$ERROR_LINE" | cut -c1-40)" "$ERRORS_LOG" 2>/dev/null | head -3)
  if [ -n "$SIMILAR" ]; then
    CONTEXT="Similar past errors found in errors-log.md"
  fi
fi

# Output enriched context
echo ""
echo "--- Error Context ---"
echo "Error: $ERROR_LINE"
if [ -n "$CONTEXT" ]; then
  echo "History: $CONTEXT"
  echo "Check: $ERRORS_LOG"
fi
echo "Tip: Search Knowledge Graph for related fixes"
echo "---"

exit 0
