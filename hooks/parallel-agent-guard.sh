#!/bin/bash
# parallel-agent-guard.sh — PreToolUse(Bash|Edit|Write|MultiEdit|NotebookEdit)
# BLOCKING (exit 2) se outro processo Claude ja tem lock no mesmo working tree
#
# Cobertura:
#   - git commit / git push → lock 30s em /tmp/claude-git-locks/
#   - Edit / Write / MultiEdit / NotebookEdit → lock 10s em /tmp/claude-write-locks/
#
# Incidente referencia: docs/diagnosticos/2026-04-07-raiz-data-engine-wip-triage.md

INPUT="${CLAUDE_TOOL_INPUT:-}"
TOOL_NAME="${CLAUDE_TOOL_NAME:-}"

lock_check() {
  local lock_file="$1"
  local timeout="$2"
  local context="$3"

  mkdir -p "$(dirname "$lock_file")"

  if [[ -f "$lock_file" ]]; then
    local lock_ppid lock_time now age
    lock_ppid=$(cut -d: -f1 "$lock_file" 2>/dev/null || echo "")
    lock_time=$(cut -d: -f2 "$lock_file" 2>/dev/null || echo "0")
    now=$(date +%s)
    age=$(( now - lock_time ))

    if [[ $age -gt $timeout ]]; then
      rm -f "$lock_file"
    elif [[ -n "$lock_ppid" ]] && kill -0 "$lock_ppid" 2>/dev/null \
         && [[ "$lock_ppid" != "$$" ]] && [[ "$lock_ppid" != "$PPID" ]]; then
      echo "BLOCKED: Agent paralelo (PID $lock_ppid) ja esta operando em '$context'." >&2
      echo "Aguarde o outro agent ou remova o lock: rm $lock_file" >&2
      exit 2
    fi
  fi

  echo "${PPID}:$(date +%s)" > "$lock_file"
}

# ─── Branch 1: git commit / git push (lock 30s) ──────────────────────────
if [[ "$TOOL_NAME" == "Bash" || -z "$TOOL_NAME" ]]; then
  if [[ "$INPUT" == *"git commit"* ]] || [[ "$INPUT" == *"git push"* ]]; then
    REPO_PATH=""
    if [[ "$INPUT" =~ git\ -C\ ([^\ ]+) ]]; then
      REPO_PATH="${BASH_REMATCH[1]}"
    fi
    if [[ -z "$REPO_PATH" ]]; then
      REPO_PATH=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
    fi
    [[ -z "$REPO_PATH" ]] && exit 0

    REPO_HASH=$(echo "$REPO_PATH" | shasum | cut -c1-8)
    LOCK_FILE="/tmp/claude-git-locks/${REPO_HASH}.lock"
    lock_check "$LOCK_FILE" 30 "$(basename "$REPO_PATH") (git)"
    exit 0
  fi
fi

# ─── Branch 2: Edit / Write / MultiEdit / NotebookEdit (lock 10s) ───────
case "$TOOL_NAME" in
  Edit|Write|MultiEdit|NotebookEdit)
    TARGET_FILE=$(echo "$INPUT" | grep -oE '"(file_path|notebook_path)"[[:space:]]*:[[:space:]]*"[^"]+"' | head -1 | sed -E 's/.*"([^"]+)"$/\1/')
    [[ -z "$TARGET_FILE" ]] && exit 0

    TARGET_DIR=$(dirname "$TARGET_FILE" 2>/dev/null || echo "")
    [[ ! -d "$TARGET_DIR" ]] && exit 0

    REPO_PATH=$(git -C "$TARGET_DIR" rev-parse --show-toplevel 2>/dev/null || echo "")
    [[ -z "$REPO_PATH" ]] && exit 0

    # Skip se for worktree isolado (path contem .claude/worktrees/)
    [[ "$REPO_PATH" == *".claude/worktrees/"* ]] && exit 0

    REPO_HASH=$(echo "$REPO_PATH" | shasum | cut -c1-8)
    LOCK_FILE="/tmp/claude-write-locks/${REPO_HASH}.lock"
    lock_check "$LOCK_FILE" 10 "$(basename "$REPO_PATH") (write)"
    ;;
esac

exit 0
