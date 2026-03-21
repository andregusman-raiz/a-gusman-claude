#!/bin/bash
# =============================================================================
# safe-typecheck.sh — Wrapper for tsc that prevents multiple simultaneous runs
# Usage: bash ~/.claude/scripts/safe-typecheck.sh [extra tsc args...]
# If another tsc is already running for this project, waits or reuses result.
# =============================================================================

LOCK_FILE="/tmp/raiz-tsc-$(echo "$PWD" | md5sum 2>/dev/null | cut -c1-8 || echo "default").lock"
MAX_WAIT=180  # 3 minutes max wait

# Check if another tsc is already running for this project
EXISTING_TSC=$(pgrep -f "tsc --noEmit" 2>/dev/null | head -1)
if [ -n "$EXISTING_TSC" ]; then
  echo "TypeCheck already running (PID $EXISTING_TSC). Waiting for it to finish..."
  WAITED=0
  while kill -0 "$EXISTING_TSC" 2>/dev/null && [ "$WAITED" -lt "$MAX_WAIT" ]; do
    sleep 2
    WAITED=$((WAITED + 2))
  done
  if [ "$WAITED" -ge "$MAX_WAIT" ]; then
    echo "Timeout waiting for existing tsc. Killing it and running fresh."
    kill -TERM "$EXISTING_TSC" 2>/dev/null
    sleep 1
    kill -9 "$EXISTING_TSC" 2>/dev/null
  else
    echo "Previous tsc finished. Running fresh check..."
  fi
fi

# Kill any zombie tsc processes before starting
TSC_COUNT=$(pgrep -f "tsc --noEmit" 2>/dev/null | wc -l | tr -d ' ')
if [ "$TSC_COUNT" -gt 1 ]; then
  echo "Found $TSC_COUNT tsc processes. Cleaning up..."
  pgrep -f "tsc --noEmit" | xargs kill -TERM 2>/dev/null
  sleep 1
fi

# Run with memory limit and timeout
NODE_OPTIONS="--max-old-space-size=2048" npx tsc --noEmit --skipLibCheck "$@" 2>&1
EXIT=$?

exit $EXIT
