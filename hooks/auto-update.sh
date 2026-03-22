#!/bin/bash
# Auto-update hook — runs on Claude Code SessionStart (startup event)
# Pulls latest from a-gusman-claude repo silently in background
#
# How it works:
#   1. Checks if ~/.gusman-claude/ exists (installed via install.sh)
#   2. If yes, pulls latest (max once per hour)
#   3. If no, checks if .claude/ itself is a git repo and pulls
#   4. Never blocks session start (runs in background)
#
# To disable: remove this file or remove SessionStart hook from hooks.json

REPO_DIR="${HOME}/.gusman-claude"
CLAUDE_DIR="$(dirname "$0")/.."

# Resolve the actual .claude directory (could be this repo itself)
if [[ -d "$REPO_DIR/.git" ]]; then
  TARGET="$REPO_DIR"
elif [[ -d "${CLAUDE_DIR}/.git" ]]; then
  TARGET="$CLAUDE_DIR"
else
  # Not installed from repo — skip
  exit 0
fi

# Throttle: only pull once per hour
MARKER="${TARGET}/.last-auto-pull"
NOW=$(date +%s)
if [[ -f "$MARKER" ]]; then
  LAST=$(cat "$MARKER" 2>/dev/null || echo 0)
  DIFF=$((NOW - LAST))
  if [[ $DIFF -lt 3600 ]]; then
    exit 0
  fi
fi

# Pull in background (don't block session start)
(cd "$TARGET" && git pull --ff-only origin main >/dev/null 2>&1; echo "$NOW" > "$MARKER") &

exit 0
