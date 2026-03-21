#!/bin/bash
# =============================================================================
# cleanup-orphans.sh — Kill orphaned processes that leak memory
# Usage: bash ~/.claude/scripts/cleanup-orphans.sh [--dry-run]
# Exit: 0 always (advisory, never blocks)
# =============================================================================

set -uo pipefail

DRY_RUN=false
[ "${1:-}" = "--dry-run" ] && DRY_RUN=true

KILLED=0
SKIPPED=0

kill_orphans() {
  local pattern="$1"
  local label="$2"
  local pids

  pids=$(pgrep -f "$pattern" 2>/dev/null || true)
  [ -z "$pids" ] && return

  local count
  count=$(echo "$pids" | wc -l | tr -d ' ')

  if $DRY_RUN; then
    echo "[DRY-RUN] Would kill $count $label process(es)"
    SKIPPED=$((SKIPPED + count))
  else
    echo "$pids" | xargs kill -TERM 2>/dev/null || true
    echo "Killed $count $label process(es)"
    KILLED=$((KILLED + count))
  fi
}

# 1. Stale terminal-notifier (never exits, ~45MB each, accumulates per turn)
kill_orphans "terminal-notifier.*Claude Code" "terminal-notifier"

# 2. Orphaned tsc --noEmit (biggest leak: 400MB-1.3GB each)
# Only kill if more than 1 running (keep the intentional one)
TSC_COUNT=$(pgrep -f "tsc --noEmit" 2>/dev/null | wc -l | tr -d ' ')
if [ "$TSC_COUNT" -gt 1 ]; then
  kill_orphans "tsc --noEmit" "tsc (excess: $TSC_COUNT)"
fi

# 3. Orphaned Playwright Chrome browsers (headless)
kill_orphans "playwright_chromiumdev_profile" "Playwright Chrome"

# 4. Orphaned Playwright daemon sessions
kill_orphans "run-cli-server.*daemon-session" "Playwright daemon"

# 5. Orphaned jest workers (from timed-out test runs)
kill_orphans "jest-worker/build/processChild" "Jest worker"

# 6. Stale MCP servers from dead sessions (keep only newest of each type)
for server in mcp-server-filesystem mcp-server-github mcp-server-memory context7-mcp; do
  pids=$(pgrep -f "$server" 2>/dev/null | sort -rn || true)
  [ -z "$pids" ] && continue
  count=$(echo "$pids" | wc -l | tr -d ' ')
  if [ "$count" -gt 1 ]; then
    # Keep the newest (first after reverse sort), kill the rest
    stale=$(echo "$pids" | tail -n +2)
    stale_count=$(echo "$stale" | wc -l | tr -d ' ')
    if $DRY_RUN; then
      echo "[DRY-RUN] Would kill $stale_count duplicate $server"
      SKIPPED=$((SKIPPED + stale_count))
    else
      echo "$stale" | xargs kill -TERM 2>/dev/null || true
      echo "Killed $stale_count duplicate $server (kept newest)"
      KILLED=$((KILLED + stale_count))
    fi
  fi
done

# 7. Clean abandoned worktrees
# DISABLED: worktree cleanup conflicts with parallel agent work.
# Worktrees are managed by the Agent tool's lifecycle — only clean manually.
# Re-enable if worktrees accumulate: uncomment block below.
#
# WORKTREE_DIR="$HOME/Claude/GitHub/raiz-platform/.claude/worktrees"
# if [ -d "$WORKTREE_DIR" ]; then
#   WORKTREE_COUNT=$(ls -1 "$WORKTREE_DIR" 2>/dev/null | wc -l | tr -d ' ')
#   if [ "$WORKTREE_COUNT" -gt 0 ]; then
#     if $DRY_RUN; then
#       echo "[DRY-RUN] Would clean $WORKTREE_COUNT abandoned worktree(s)"
#     else
#       cd "$HOME/Claude/GitHub/raiz-platform" 2>/dev/null && git worktree prune 2>/dev/null
#       for wt in "$WORKTREE_DIR"/agent-*; do
#         [ -d "$wt" ] && rm -rf "$wt" 2>/dev/null && echo "Cleaned worktree: $(basename "$wt")"
#       done
#     fi
#   fi
# fi

# Summary
if $DRY_RUN; then
  echo "--- DRY RUN: would kill $SKIPPED process(es), killed 0 ---"
else
  if [ "$KILLED" -gt 0 ]; then
    echo "--- Cleaned up $KILLED orphaned process(es) ---"
  fi
fi

exit 0
