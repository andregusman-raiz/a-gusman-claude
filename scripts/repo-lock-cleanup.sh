#!/usr/bin/env bash
# Repo lock cleanup — removes stale locks at SessionStart.
#
# A lock is "stale" if any of:
#   1. The owning PID is no longer alive
#   2. The repo path it points to no longer exists on disk (orphaned worktree)
#
# Live locks (PID alive AND repo path exists) are left untouched.
# Output is silent unless something is removed, to avoid noise on session start.

set -u

LOCK_DIR="$HOME/.claude/locks"
[ -d "$LOCK_DIR" ] || exit 0

removed=0
for f in "$LOCK_DIR"/*.lock; do
  [ -f "$f" ] || continue

  content="$(cat "$f" 2>/dev/null)" || continue
  pid="${content%%|*}"
  rest="${content#*|}"
  branch="${rest%%|*}"
  rest="${rest#*|}"
  repo="${rest%%|*}"

  reason=""
  if [ -z "$pid" ]; then
    reason="empty pid"
  elif ! kill -0 "$pid" 2>/dev/null; then
    reason="dead pid $pid"
  elif [ -n "$repo" ] && [ ! -d "$repo" ]; then
    reason="orphan path $repo"
  fi

  if [ -n "$reason" ]; then
    rm -f "$f"
    echo "[repo-lock-cleanup] removed $(basename "$f"): $reason" >&2
    removed=$((removed + 1))
  fi
done

[ "$removed" -gt 0 ] && echo "[repo-lock-cleanup] cleaned $removed stale lock(s)" >&2
exit 0
