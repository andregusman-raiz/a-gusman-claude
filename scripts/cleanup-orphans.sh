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

# Conservative defaults: preserve recent/possibly active runtimes. These can be
# tightened for a one-off cleanup after supplying CODEX_MCP_PROTECT_EPOCHS.
MCP_DUPLICATE_STALE_AGE_S="${MCP_DUPLICATE_STALE_AGE_S:-43200}"
MCP_DUPLICATE_KEEP_NEWEST="${MCP_DUPLICATE_KEEP_NEWEST:-12}"
CODEX_MCP_STALE_AGE_S="${CODEX_MCP_STALE_AGE_S:-43200}"
CODEX_MCP_KEEP_NEWEST="${CODEX_MCP_KEEP_NEWEST:-50}"
CODEX_MCP_PROTECT_EPOCHS="${CODEX_MCP_PROTECT_EPOCHS:-}"
CODEX_MCP_PROTECT_TOLERANCE_S="${CODEX_MCP_PROTECT_TOLERANCE_S:-120}"

for numeric_var in MCP_DUPLICATE_STALE_AGE_S MCP_DUPLICATE_KEEP_NEWEST CODEX_MCP_STALE_AGE_S CODEX_MCP_KEEP_NEWEST CODEX_MCP_PROTECT_TOLERANCE_S; do
  numeric_value="${!numeric_var}"
  case "$numeric_value" in
    ''|*[!0-9]*)
      echo "Ignoring invalid numeric value for $numeric_var: $numeric_value" >&2
      exit 0
      ;;
  esac
done

process_age_seconds() {
  local pid="$1"
  local elapsed days=0 time_part first second third

  elapsed=$(ps -o etime= -p "$pid" 2>/dev/null | tr -d ' ')
  [ -z "$elapsed" ] && return 1

  time_part="$elapsed"
  case "$elapsed" in
    *-*)
      days="${elapsed%%-*}"
      time_part="${elapsed#*-}"
      ;;
  esac

  IFS=: read -r first second third <<EOF
$time_part
EOF

  if [ -n "${third:-}" ]; then
    echo $((days * 86400 + first * 3600 + second * 60 + third))
  else
    echo $((days * 86400 + first * 60 + second))
  fi
}

is_protected_codex_start() {
  local age_s="$1"
  local now_s start_s epoch diff old_ifs

  [ -z "$CODEX_MCP_PROTECT_EPOCHS" ] && return 1

  now_s=$(date +%s)
  start_s=$((now_s - age_s))
  old_ifs="$IFS"
  IFS=,
  for epoch in $CODEX_MCP_PROTECT_EPOCHS; do
    case "$epoch" in
      ''|*[!0-9]*) continue ;;
    esac
    diff=$((start_s - epoch))
    [ "$diff" -lt 0 ] && diff=$((-diff))
    if [ "$diff" -le "$CODEX_MCP_PROTECT_TOLERANCE_S" ]; then
      IFS="$old_ifs"
      return 0
    fi
  done
  IFS="$old_ifs"
  return 1
}

terminate_process_tree() {
  local pid="$1"
  local child

  for child in $(pgrep -P "$pid" 2>/dev/null || true); do
    terminate_process_tree "$child"
  done
  kill -TERM "$pid" 2>/dev/null || true
}

kill_orphans() {
  local pattern="$1"
  local label="$2"
  local min_age_s="${3:-0}"   # só matar processos mais velhos que isto (0 = qualquer idade)
  local pids

  pids=$(pgrep -f "$pattern" 2>/dev/null || true)
  [ -z "$pids" ] && return

  # Filtro de idade: protege processos legítimos em andamento (ex.: smoke-prod
  # com Playwright rodando <5min era morto pelo cron — 2026-07-05).
  if [ "$min_age_s" -gt 0 ]; then
    local old_pids=""
    for pid in $pids; do
      local etime_s
      etime_s=$(process_age_seconds "$pid" 2>/dev/null || echo 0)
      [ "${etime_s:-0}" -ge "$min_age_s" ] && old_pids="$old_pids $pid"
    done
    pids=$(echo "$old_pids" | tr ' ' '\n' | sed '/^$/d')
    [ -z "$pids" ] && return
  fi

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

kill_stale_duplicates() {
  local pattern="$1"
  local label="$2"
  local records="" sorted="" candidates=""
  local pid age_s rank=0 count

  for pid in $(pgrep -f "$pattern" 2>/dev/null || true); do
    age_s=$(process_age_seconds "$pid" 2>/dev/null || echo 0)
    records="${records}${age_s} ${pid}\n"
  done
  [ -z "$records" ] && return

  sorted=$(printf '%b' "$records" | sort -n)
  while read -r age_s pid; do
    [ -z "${pid:-}" ] && continue
    rank=$((rank + 1))
    [ "$rank" -le "$MCP_DUPLICATE_KEEP_NEWEST" ] && continue
    [ "$age_s" -lt "$MCP_DUPLICATE_STALE_AGE_S" ] && continue
    is_protected_codex_start "$age_s" && continue
    candidates="${candidates}${pid}\n"
  done <<EOF
$sorted
EOF

  count=$(printf '%b' "$candidates" | sed '/^$/d' | wc -l | tr -d ' ')
  [ "$count" -eq 0 ] && return

  if $DRY_RUN; then
    echo "[DRY-RUN] Would kill $count stale $label process(es)"
    SKIPPED=$((SKIPPED + count))
  else
    while read -r pid; do
      [ -n "${pid:-}" ] && terminate_process_tree "$pid"
    done <<EOF
$(printf '%b' "$candidates" | sed '/^$/d')
EOF
    echo "Killed $count stale $label process(es)"
    KILLED=$((KILLED + count))
  fi
}

kill_stale_codex_children() {
  local pattern="$1"
  local label="$2"
  local required_cwd="${3:-}"
  local app_pids records="" sorted="" candidates=""
  local app_pid pid ppid command_line cwd age_s rank=0 count

  app_pids=$(ps -axo pid=,command= | awk '/\/Applications\/ChatGPT.app\/Contents\/Resources\/codex .*app-server --analytics-default-enabled/ {print $1}')
  [ -z "$app_pids" ] && return

  while read -r pid ppid command_line; do
    case " $app_pids " in
      *" $ppid "*) ;;
      *) continue ;;
    esac
    [[ "$command_line" =~ $pattern ]] || continue

    if [ -n "$required_cwd" ]; then
      cwd=$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p')
      case "$cwd" in
        *"$required_cwd"*) ;;
        *) continue ;;
      esac
    fi

    age_s=$(process_age_seconds "$pid" 2>/dev/null || echo 0)
    records="${records}${age_s} ${pid}\n"
  done < <(ps -axo pid=,ppid=,command=)
  [ -z "$records" ] && return

  sorted=$(printf '%b' "$records" | sort -n)
  while read -r age_s pid; do
    [ -z "${pid:-}" ] && continue
    rank=$((rank + 1))
    [ "$rank" -le "$CODEX_MCP_KEEP_NEWEST" ] && continue
    [ "$age_s" -lt "$CODEX_MCP_STALE_AGE_S" ] && continue
    is_protected_codex_start "$age_s" && continue
    candidates="${candidates}${pid}\n"
  done <<EOF
$sorted
EOF

  count=$(printf '%b' "$candidates" | sed '/^$/d' | wc -l | tr -d ' ')
  [ "$count" -eq 0 ] && return

  if $DRY_RUN; then
    echo "[DRY-RUN] Would kill $count stale $label process(es)"
    SKIPPED=$((SKIPPED + count))
  else
    while read -r pid; do
      [ -n "${pid:-}" ] && terminate_process_tree "$pid"
    done <<EOF
$(printf '%b' "$candidates" | sed '/^$/d')
EOF
    echo "Killed $count stale $label process(es)"
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

# 3. Orphaned Playwright Chrome browsers (headless) — só >10min (smokes
#    legítimos rodam <5min e eram mortos no meio)
kill_orphans "playwright_chromiumdev_profile" "Playwright Chrome" 600

# 4. Orphaned Playwright daemon sessions
kill_orphans "run-cli-server.*daemon-session" "Playwright daemon" 600

# 5. Orphaned jest workers (from timed-out test runs)
kill_orphans "jest-worker/build/processChild" "Jest worker"

# 6. Stale MCP servers from dead sessions. Preserve a configurable pool for
# active parallel sessions and only remove processes past the age threshold.
for server in mcp-server-filesystem mcp-server-github mcp-server-memory context7-mcp; do
  kill_stale_duplicates "$server" "duplicate $server"
done

# 7. Codex Desktop starts one local MCP runtime per task and can retain them
# after the task becomes idle. Restrict cleanup to direct children of the app
# server, require an age threshold, preserve recent instances, and optionally
# protect exact task start epochs supplied by the caller.
kill_stale_codex_children 'node ./mcp/server\.mjs$' "Codex Sites MCP" "/.codex/plugins/cache/openai-bundled/sites/"
kill_stale_codex_children '/cua_node/bin/node_repl$' "Codex node_repl"
kill_stale_codex_children 'gusman-os/apps/mcp-server/src/index\.ts$' "Codex gusman-os MCP"
kill_stale_codex_children '@peng-shawn/mermaid-mcp-server' "Codex Mermaid MCP"
kill_stale_codex_children '@steipete/macos-automator-mcp' "Codex macOS Automator MCP"
kill_stale_codex_children 'mcp-server-macos-use$' "Codex macOS Use MCP"

# 8. Clean abandoned worktrees
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
