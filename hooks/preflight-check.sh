#!/usr/bin/env bash
# =============================================================================
# preflight-check.sh — Lightweight health check for Claude Code hooks
# Called by hooks.json on first PreToolUse. Uses flag file to run only once.
# Output goes to stderr (Claude sees it as hook context).
# =============================================================================

# Only run once per session (check parent PID-based flag)
PPID_FLAG="/tmp/.raiz-preflight-$(ps -o ppid= $$ 2>/dev/null | tr -d ' ' || echo 'unknown')"
if [ -f "$PPID_FLAG" ]; then
  exit 0
fi
touch "$PPID_FLAG" 2>/dev/null || true

WARNINGS=""

# Check Node version (customize version as needed)
if command -v node &>/dev/null; then
  NODE_VER=$(node --version 2>/dev/null)
  if [[ ! "$NODE_VER" == v20.* ]]; then
    WARNINGS="${WARNINGS}Node version $NODE_VER (expected v20.x). "
  fi
fi

# Check concurrent Claude processes (macOS)
if command -v pgrep &>/dev/null; then
  CLAUDE_COUNT=$(pgrep -f "claude" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$CLAUDE_COUNT" -gt 3 ]; then
    WARNINGS="${WARNINGS}${CLAUDE_COUNT} Claude processes detected — risk of config corruption. "
  fi
fi

# Check .next/trace lock (Next.js projects)
if [ -f ".next/trace" ]; then
  WARNINGS="${WARNINGS}.next/trace exists (potential lock). "
fi

# Check NODE_OPTIONS for OOM prevention (Node.js projects)
if [ -z "${NODE_OPTIONS:-}" ]; then
  WARNINGS="${WARNINGS}NODE_OPTIONS not set (OOM risk on builds). "
fi

# Output warnings if any
if [ -n "$WARNINGS" ]; then
  echo "hook additional context: [PREFLIGHT] $WARNINGS"
fi

exit 0
