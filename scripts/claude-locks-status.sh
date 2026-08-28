#!/usr/bin/env bash
# claude-locks-status.sh — Dashboard de locks ativos do sistema Claude.
#
# Mostra:
#   - Session locks em ~/.claude/locks/ (repo-lock.sh)
#   - Git commit/push locks em /tmp/claude-git-locks/ (parallel-agent-guard.sh)
#   - Write locks em /tmp/claude-write-locks/ (parallel-agent-guard.sh)
#
# Para cada lock: PID, vivo?, branch, repo, idade.
# Uso:
#   bash ~/.claude/scripts/claude-locks-status.sh [--cleanup]
#     --cleanup: remove locks de PIDs mortos

set -u

CLEANUP=0
[ "${1:-}" = "--cleanup" ] && CLEANUP=1

now=$(date +%s)

pid_alive() { kill -0 "$1" 2>/dev/null; }

age_fmt() {
  local seconds="$1"
  if [ "$seconds" -lt 60 ]; then echo "${seconds}s"
  elif [ "$seconds" -lt 3600 ]; then echo "$((seconds / 60))m"
  else echo "$((seconds / 3600))h"
  fi
}

scan_dir() {
  local dir="$1"
  local label="$2"
  local format="$3"  # "session" (pipe) ou "simple" (colon)

  [ -d "$dir" ] || return 0
  local found=0

  for lock in "$dir"/*.lock; do
    [ -f "$lock" ] || continue
    found=1

    local content pid branch repo ts age status
    content=$(cat "$lock" 2>/dev/null)

    if [ "$format" = "session" ]; then
      # pid|branch|repo|timestamp
      pid=$(echo "$content" | cut -d'|' -f1)
      branch=$(echo "$content" | cut -d'|' -f2)
      repo=$(echo "$content" | cut -d'|' -f3)
      ts=$(echo "$content" | cut -d'|' -f4)
    else
      # pid:timestamp
      pid=$(echo "$content" | cut -d: -f1)
      ts=$(echo "$content" | cut -d: -f2)
      branch="-"
      repo="-"
    fi

    age=$(( now - ${ts:-0} ))

    if pid_alive "$pid"; then
      status="ALIVE"
    else
      status="DEAD"
      if [ "$CLEANUP" = "1" ]; then
        rm -f "$lock"
        status="DEAD (removed)"
      fi
    fi

    printf "  %-14s pid=%-6s age=%-5s branch=%-30s repo=%s\n" \
      "[$status]" "$pid" "$(age_fmt $age)" "${branch:--}" "${repo:--}"
  done

  [ "$found" = "0" ] && echo "  (none)"
}

echo "═══════════════════════════════════════════════════════════"
echo "  Claude Locks Status  —  $(date '+%Y-%m-%d %H:%M:%S')"
[ "$CLEANUP" = "1" ] && echo "  (cleanup mode: removing locks of dead PIDs)"
echo "═══════════════════════════════════════════════════════════"

echo
echo "─── Session locks (~/.claude/locks/) ───"
scan_dir "$HOME/.claude/locks" "session" "session"

echo
echo "─── Git commit/push locks (/tmp/claude-git-locks/) ───"
scan_dir "/tmp/claude-git-locks" "git" "simple"

echo
echo "─── Write locks (/tmp/claude-write-locks/) ───"
scan_dir "/tmp/claude-write-locks" "write" "simple"

echo
echo "─── Active Claude processes ───"
pgrep -fla claude 2>/dev/null | head -20 || echo "  (none found)"

echo
