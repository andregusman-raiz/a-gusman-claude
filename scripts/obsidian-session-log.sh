#!/usr/bin/env bash
# Append session summary to Obsidian Daily note if session had >3 tool calls.
# Triggered by Stop hook. Idempotent (uses session_id marker).

set -euo pipefail
trap 'printf "{}\n"' EXIT

VAULT="$HOME/Claude/claude_obsidian"
DAILY_DIR="$VAULT/10-Daily"
TODAY=$(date +%Y-%m-%d)
NOW=$(date +%H:%M)
DAILY_FILE="$DAILY_DIR/$TODAY.md"

# Read hook payload from stdin (JSON with session info)
PAYLOAD=$(cat 2>/dev/null || echo "{}")

# Extract fields (with fallbacks)
SESSION_ID=$(echo "$PAYLOAD" | jq -r '.session_id // "unknown"' 2>/dev/null || echo "unknown")
CWD=$(echo "$PAYLOAD" | jq -r '.cwd // empty' 2>/dev/null || pwd)
TRANSCRIPT=$(echo "$PAYLOAD" | jq -r '.transcript_path // empty' 2>/dev/null || echo "")

# Count tool calls in transcript (filter: only log if >3)
TOOL_COUNT=0
if [[ -n "$TRANSCRIPT" && -f "$TRANSCRIPT" ]]; then
  TOOL_COUNT=$(grep -c '"type":"tool_use"' "$TRANSCRIPT" 2>/dev/null) || TOOL_COUNT=0
fi

# Threshold: skip trivial sessions
if [[ "$TOOL_COUNT" -lt 4 ]]; then
  exit 0
fi

# Privacy tags na sessao (varredura no transcript)
PRIVATE=0
NO_LOG=0
if [[ -n "$TRANSCRIPT" && -f "$TRANSCRIPT" ]]; then
  if grep -q "<no-log>" "$TRANSCRIPT" 2>/dev/null; then
    NO_LOG=1
  fi
  if grep -q "<private>" "$TRANSCRIPT" 2>/dev/null; then
    PRIVATE=1
  fi
fi
[ "$NO_LOG" = "1" ] && exit 0

# Idempotency: skip if this session already logged
mkdir -p "$DAILY_DIR"
if [[ -f "$DAILY_FILE" ]] && grep -q "session: $SESSION_ID" "$DAILY_FILE"; then
  exit 0
fi

# Project name from cwd basename, with normalization for edge cases
RAW=$(basename "$CWD")
case "$RAW" in
  Claude|claude) PROJECT="workspace" ;;  # ~/Claude root → workspace (avoid CLAUDE.md collision)
  *)             PROJECT="$RAW" ;;
esac

# Create file with frontmatter if first session of the day
if [[ ! -f "$DAILY_FILE" ]]; then
  cat > "$DAILY_FILE" <<EOF
---
type: daily
date: $TODAY
tags: [daily, sessions]
status: active
source: hook-stop
---

# $TODAY

EOF
fi

# Append session entry — mascarar cwd se <private> tag detectada
if [ "$PRIVATE" = "1" ]; then
  CWD_LINE="cwd: \`<masked: private>\`"
else
  CWD_LINE="cwd: \`$CWD\`"
fi

cat >> "$DAILY_FILE" <<EOF

## $NOW — $PROJECT
- session: $SESSION_ID
- $CWD_LINE
- tool_calls: $TOOL_COUNT
- project: [[20-Projects/$PROJECT|$PROJECT]]
EOF

exit 0
