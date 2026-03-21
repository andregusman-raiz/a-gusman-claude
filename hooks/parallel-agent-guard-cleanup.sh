#!/bin/bash
# parallel-agent-guard-cleanup.sh — PostToolUse(Bash): Remove lock do parallel-agent-guard
# Remove apenas o lock criado por este processo (PPID match)

INPUT="${CLAUDE_TOOL_INPUT:-}"

# So atua em git commit ou git push
if [[ "$INPUT" != *"git commit"* ]] && [[ "$INPUT" != *"git push"* ]]; then
  exit 0
fi

REPO_PATH=""
if [[ "$INPUT" =~ git\ -C\ ([^\ ]+) ]]; then
  REPO_PATH="${BASH_REMATCH[1]}"
fi
if [[ -z "$REPO_PATH" ]]; then
  REPO_PATH=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
fi
if [[ -z "$REPO_PATH" ]]; then
  exit 0
fi

REPO_HASH=$(echo "$REPO_PATH" | shasum | cut -c1-8)
LOCK_FILE="/tmp/claude-git-locks/${REPO_HASH}.lock"

if [[ -f "$LOCK_FILE" ]]; then
  LOCK_PPID=$(cut -d: -f1 "$LOCK_FILE" 2>/dev/null || echo "")
  # Remover apenas se o lock pertence a este processo
  if [[ "$LOCK_PPID" == "$PPID" ]]; then
    rm -f "$LOCK_FILE"
  fi
fi

exit 0
