#!/bin/bash
# Hook: quality-trend-check.sh
# Trigger: PreToolUse Bash (when creating PR via gh pr create)
# Purpose: Before creating a PR, verify quality metrics haven't degraded
# Type: notification (non-blocking warning)

TOOL_INPUT="${1:-}"

# Only trigger on PR creation
if ! echo "$TOOL_INPUT" | grep -q "gh pr create"; then
  exit 0
fi

echo ""
echo "--- Quality Trend Check ---"

WARNINGS=0

# 1. Check for uncommitted typecheck errors
if command -v npx &>/dev/null; then
  # Quick check: are there TS errors in staged files?
  STAGED=$(git diff --cached --name-only --diff-filter=ACMR 2>/dev/null | grep -E '\.(ts|tsx)$' | head -10)
  if [ -n "$STAGED" ]; then
    TS_ERRORS=$(npx tsc --noEmit 2>&1 | grep -c "error TS" 2>/dev/null || echo "0")
    if [ "$TS_ERRORS" -gt 0 ]; then
      echo "WARNING: $TS_ERRORS TypeScript errors detected"
      WARNINGS=$((WARNINGS + 1))
    fi
  fi
fi

# 2. Check for theatrical test patterns in changed files
CHANGED_TESTS=$(git diff --name-only origin/main...HEAD 2>/dev/null | grep -E '\.test\.(ts|tsx)$')
if [ -n "$CHANGED_TESTS" ]; then
  THEATRICAL=0
  for f in $CHANGED_TESTS; do
    if [ -f "$f" ]; then
      THEATRICAL=$((THEATRICAL + $(grep -cE '\.catch\(\(\) =>|OR true|\|\| true|toBeGreaterThanOrEqual\(0\)' "$f" 2>/dev/null || echo "0")))
    fi
  done
  if [ "$THEATRICAL" -gt 0 ]; then
    echo "WARNING: $THEATRICAL theatrical test anti-patterns found in changed test files"
    WARNINGS=$((WARNINGS + 1))
  fi
fi

# 3. Check for console.log/debugger left in changed files
CHANGED_SRC=$(git diff --name-only origin/main...HEAD 2>/dev/null | grep -E '\.(ts|tsx)$' | grep -v '\.test\.' | grep -v '\.spec\.')
if [ -n "$CHANGED_SRC" ]; then
  DEBUG_COUNT=0
  for f in $CHANGED_SRC; do
    if [ -f "$f" ]; then
      DEBUG_COUNT=$((DEBUG_COUNT + $(grep -cE 'console\.(log|debug)|debugger;' "$f" 2>/dev/null || echo "0")))
    fi
  done
  if [ "$DEBUG_COUNT" -gt 0 ]; then
    echo "WARNING: $DEBUG_COUNT console.log/debugger statements in changed source files"
    WARNINGS=$((WARNINGS + 1))
  fi
fi

# 4. Check diff size (large PRs = more risk)
LINES_CHANGED=$(git diff --stat origin/main...HEAD 2>/dev/null | tail -1 | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+' || echo "0")
if [ "$LINES_CHANGED" -gt 500 ]; then
  echo "NOTE: Large PR ($LINES_CHANGED lines). Consider splitting."
  WARNINGS=$((WARNINGS + 1))
fi

if [ "$WARNINGS" -eq 0 ]; then
  echo "All quality checks passed"
else
  echo "$WARNINGS warning(s) — review before creating PR"
fi

echo "---"
exit 0
