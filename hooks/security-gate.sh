#!/bin/bash
# =============================================================================
# security-gate.sh — PreToolUse security gate for Bash commands
# Blocks dangerous commands with exit code 2 (feedback to Claude).
# =============================================================================

# Read tool input from stdin (JSON with tool_input.command)
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    cmd = data.get('tool_input', {}).get('command', '')
    print(cmd)
except:
    print('')
" 2>/dev/null || echo "")

if [ -z "$COMMAND" ]; then
  exit 0
fi

# Dangerous patterns — block with feedback
BLOCKED=""

# Destructive file operations
echo "$COMMAND" | grep -qE '\brm\s+(-rf|-fr)\s+/' && BLOCKED="rm -rf on root paths"
echo "$COMMAND" | grep -qE '\brm\s+(-rf|-fr)\s+\.' && BLOCKED="rm -rf on current directory"

# Dangerous git operations
echo "$COMMAND" | grep -qE '\bgit\s+push\s+--force\b' && BLOCKED="git push --force"
echo "$COMMAND" | grep -qE '\bgit\s+push\s+-f\b' && BLOCKED="git push -f"
echo "$COMMAND" | grep -qE '\bgit\s+reset\s+--hard\b' && BLOCKED="git reset --hard"
echo "$COMMAND" | grep -qE '\bgit\s+clean\s+-fd' && BLOCKED="git clean -fd"
echo "$COMMAND" | grep -qE '\bgit\s+checkout\s+--\s+\.' && BLOCKED="git checkout -- . (discards all changes)"
echo "$COMMAND" | grep -qE '\bgit\s+stash\b' && BLOCKED="git stash (requires user approval)"

# Supabase danger zone
echo "$COMMAND" | grep -qE '\bsupabase\s+config\s+push\b' && BLOCKED="supabase config push (can overwrite production)"
echo "$COMMAND" | grep -qE '\bsupabase\s+db\s+reset\b' && BLOCKED="supabase db reset (drops all data)"

# Generic danger
echo "$COMMAND" | grep -qE '(^|\s)--no-verify(\s|$)' && BLOCKED="--no-verify (bypasses hooks)"

if [ -n "$BLOCKED" ]; then
  echo "BLOCKED: $BLOCKED — Requires explicit user approval before executing." >&2
  exit 2
fi

exit 0
