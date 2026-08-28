#!/usr/bin/env bash
# Repo lock manager — prevents 2 Claude sessions from writing to the same git working tree.
# Used by SessionStart, Stop, and PreToolUse hooks.
#
# Modes:
#   acquire   — try to claim lock for $PWD. If held by live PID, attempt auto-worktree.
#   release   — remove lock owned by current PID.
#   validate  — check that current session still owns the lock and branch hasn't drifted.

set -u

LOCK_DIR="$HOME/.claude/locks"
mkdir -p "$LOCK_DIR"

# Find the git toplevel; if not in a repo, exit silently (nothing to lock).
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[ -z "$REPO_ROOT" ] && exit 0

REPO_HASH="$(echo -n "$REPO_ROOT" | shasum | cut -c1-12)"
LOCK_FILE="$LOCK_DIR/$REPO_HASH.lock"
SESSION_PID="${CLAUDE_SESSION_PID:-$PPID}"

# Read lock file fields: pid|branch|repo|timestamp
read_lock() {
  [ -f "$LOCK_FILE" ] || return 1
  cat "$LOCK_FILE"
}

pid_alive() {
  kill -0 "$1" 2>/dev/null
}

current_branch() {
  git -C "$REPO_ROOT" branch --show-current 2>/dev/null || echo "DETACHED"
}

write_lock() {
  echo "$SESSION_PID|$(current_branch)|$REPO_ROOT|$(date +%s)" > "$LOCK_FILE"
}

case "${1:-acquire}" in
  acquire)
    if existing="$(read_lock)"; then
      other_pid="${existing%%|*}"
      if [ "$other_pid" != "$SESSION_PID" ] && pid_alive "$other_pid"; then
        # Another live session owns this repo. Auto-create worktree.
        TS="$(date +%s)"
        WT_PATH="${REPO_ROOT}-claude-${TS}"
        WT_BRANCH="auto/claude-${TS}"
        echo "[repo-lock] Repo $REPO_ROOT is locked by PID $other_pid." >&2
        echo "[repo-lock] Creating isolated worktree: $WT_PATH (branch $WT_BRANCH)" >&2
        if git -C "$REPO_ROOT" worktree add "$WT_PATH" -b "$WT_BRANCH" >&2; then
          echo "[repo-lock] SWITCH_TO:$WT_PATH"
          # Lock the new worktree instead.
          REPO_ROOT="$WT_PATH"
          REPO_HASH="$(echo -n "$REPO_ROOT" | shasum | cut -c1-12)"
          LOCK_FILE="$LOCK_DIR/$REPO_HASH.lock"
          write_lock
          exit 0
        else
          echo "[repo-lock] FAILED to create worktree. ABORTING to prevent corruption." >&2
          exit 0
        fi
      fi
    fi
    write_lock
    ;;

  release)
    if existing="$(read_lock)"; then
      other_pid="${existing%%|*}"
      if [ "$other_pid" = "$SESSION_PID" ]; then
        rm -f "$LOCK_FILE"
      fi
    fi
    ;;

  validate)
    if ! existing="$(read_lock)"; then
      # No lock — re-acquire silently.
      write_lock
      exit 0
    fi
    other_pid="${existing%%|*}"
    locked_branch="$(echo "$existing" | cut -d'|' -f2)"
    cur_branch="$(current_branch)"

    if [ "$other_pid" != "$SESSION_PID" ] && pid_alive "$other_pid"; then
      echo "[repo-lock] BLOCKED: another live Claude session (PID $other_pid) owns $REPO_ROOT" >&2
      echo "[repo-lock] Use a git worktree: git worktree add ../$(basename "$REPO_ROOT")-wt -b your-branch" >&2
      exit 0
    fi

    if [ "$cur_branch" != "$locked_branch" ] && [ "$cur_branch" != "DETACHED" ]; then
      # Same session (PID matched the !alive check above) — legitimate branch switch.
      # Auto-refresh lock instead of blocking. Only emit warning.
      echo "[repo-lock] branch refresh: '$locked_branch' -> '$cur_branch' (same session PID $SESSION_PID)" >&2
    fi

    # Refresh timestamp.
    write_lock
    ;;

  pre-bash)
    # Read PreToolUse JSON from stdin, extract command, block destructive git ops
    # if another live Claude PID owns the lock for $REPO_ROOT.
    INPUT="$(cat)"
    CMD="$(printf '%s' "$INPUT" | python3 -c 'import json,sys
try:
  d=json.load(sys.stdin); print(d.get("tool_input",{}).get("command",""))
except Exception:
  pass' 2>/dev/null)"
    [ -z "$CMD" ] && exit 0

    # Match destructive git ops that touch stash/branch/working tree.
    if ! printf '%s' "$CMD" | grep -qE '(^|[;&|[:space:]])git[[:space:]]+(-[Cc][[:space:]]+[^[:space:]]+[[:space:]]+)?(stash|checkout|switch|reset|clean|restore|rebase|merge|worktree)([[:space:]]|$)'; then
      exit 0
    fi

    # Lock check: only block if another LIVE Claude PID owns the current repo.
    if ! existing="$(read_lock)"; then
      exit 0  # no lock = no contention possible
    fi
    other_pid="${existing%%|*}"
    if [ "$other_pid" = "$SESSION_PID" ] || ! pid_alive "$other_pid"; then
      exit 0  # we own it, or owner is dead
    fi

    cat >&2 <<EOF
[repo-lock] BLOCKED: destructive git operation while another Claude session owns this repo
  Repo:     $REPO_ROOT
  Command:  $CMD
  Locked by: PID $other_pid (alive)

This protects against the lint-staged + stash contention pattern that has
corrupted branches in 3+ prior sessions. Options:
  1. Wait for the other session to finish (release lock)
  2. Use a worktree:  git worktree add ../$(basename "$REPO_ROOT")-wt -b your-branch
  3. Bypass (only if you are CERTAIN no contention):  REPO_LOCK_BYPASS=1 <command>
EOF

    [ "${REPO_LOCK_BYPASS:-0}" = "1" ] && { echo "[repo-lock] bypass set, allowing" >&2; exit 0; }
    exit 2
    ;;

  *)
    echo "usage: $0 {acquire|release|validate|pre-bash}" >&2
    exit 1
    ;;
esac
