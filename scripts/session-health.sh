#!/usr/bin/env bash
# session-health.sh — Worker de saude de sessao unificado
#
# Consolida: repo-health.sh + memory_pressure + stash count + processos Claude
# Invocado em SessionStart hook para garantir ambiente limpo antes de trabalhar.
#
# Uso:
#   bash ~/Claude/.claude/scripts/session-health.sh [--repo <path>] [--quiet] [--json]
#   bash ~/Claude/.claude/scripts/session-health.sh --all-repos
#
# Exit codes:
#   0 — ambiente saudavel
#   1 — warnings (continuar com cautela)
#   2 — bloqueante (intervencao necessaria antes de continuar)
#
# Design (P1 da analise Ruflo vs ag-*):
#   Unifica em 1 worker o que antes era fragmentado em 3 scripts separados.
#   A versao anterior (repo-health.sh) so verificava git state, sem memory.

set -euo pipefail

REPO_PATH="${CWD:-$(pwd)}"
QUIET=0
JSON_OUTPUT=0
ALL_REPOS=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) REPO_PATH="$2"; shift 2 ;;
    --quiet) QUIET=1; shift ;;
    --json) JSON_OUTPUT=1; shift ;;
    --all-repos) ALL_REPOS=1; shift ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# //; s/^#//'
      exit 0
      ;;
    *) shift ;;
  esac
done

# ─────────────────────────────────────────────────────────────────────
# Coleta de dados
# ─────────────────────────────────────────────────────────────────────

WARNINGS=()
BLOCKERS=()
INFO=()

# 1. Memory pressure (macOS)
MEMORY_STATUS="unknown"
if command -v memory_pressure >/dev/null 2>&1; then
  MEMORY_STATUS=$(memory_pressure 2>/dev/null | grep "System memory pressure:" | awk '{print $NF}' || echo "unknown")
  if [[ "$MEMORY_STATUS" == "Critical" ]]; then
    BLOCKERS+=("memory_pressure=Critical — NAO spawnar agents")
  elif [[ "$MEMORY_STATUS" == "Warn"* ]]; then
    WARNINGS+=("memory_pressure=Warn — reduzir paralelismo (max 3 agents)")
  else
    INFO+=("memory_pressure=Normal")
  fi
fi

# 2. Processos Claude ativos (outros PIDs, nao o atual)
CLAUDE_PIDS_RAW=$(pgrep -f "claude" 2>/dev/null | grep -v "^$$" || true)
CLAUDE_PIDS=$(echo "$CLAUDE_PIDS_RAW" | grep -c . 2>/dev/null || echo "0")
CLAUDE_PIDS="${CLAUDE_PIDS//[[:space:]]/}"
if [[ "$CLAUDE_PIDS" -ge 2 ]]; then
  WARNINGS+=("claude_pids=$CLAUDE_PIDS — outro processo Claude ativo; verificar contention antes de escrever")
elif [[ "$CLAUDE_PIDS" -ge 1 ]]; then
  INFO+=("claude_pids=$CLAUDE_PIDS — processo Claude detectado (pode ser este mesmo)")
fi

# 3. Processos tsc orphan (vazamento de memoria comum)
TSC_PIDS_RAW=$(pgrep -f "tsc --noEmit" 2>/dev/null || true)
TSC_PIDS=$(echo "$TSC_PIDS_RAW" | grep -c . 2>/dev/null || echo "0")
TSC_PIDS="${TSC_PIDS//[[:space:]]/}"
if [[ "$TSC_PIDS" -ge 2 ]]; then
  WARNINGS+=("tsc_orphans=$TSC_PIDS — processos tsc travados; considerar: pkill -f 'tsc --noEmit'")
fi

# 4. Git state do repo (se em repo git)
GIT_AVAILABLE=0
STASH_COUNT=0
DIRTY_FILES=0
BRANCH=""
HAS_REMOTE=0

if [[ -d "$REPO_PATH/.git" ]] || git -C "$REPO_PATH" rev-parse --git-dir >/dev/null 2>&1; then
  GIT_AVAILABLE=1

  STASH_LIST=$(git -C "$REPO_PATH" stash list 2>/dev/null || true)
  STASH_COUNT=$(echo "$STASH_LIST" | grep -c . 2>/dev/null || echo "0")
  STASH_COUNT="${STASH_COUNT//[[:space:]]/}"
  DIRTY_LIST=$(git -C "$REPO_PATH" status --porcelain 2>/dev/null || true)
  DIRTY_FILES=$(echo "$DIRTY_LIST" | grep -c . 2>/dev/null || echo "0")
  DIRTY_FILES="${DIRTY_FILES//[[:space:]]/}"
  BRANCH=$(git -C "$REPO_PATH" branch --show-current 2>/dev/null || echo "unknown")
  REMOTE_LIST=$(git -C "$REPO_PATH" remote 2>/dev/null || true)
  HAS_REMOTE=$(echo "$REMOTE_LIST" | grep -c . 2>/dev/null || echo "0")
  HAS_REMOTE="${HAS_REMOTE//[[:space:]]/}"

  if [[ "$STASH_COUNT" -gt 5 ]]; then
    BLOCKERS+=("stash_count=$STASH_COUNT em $REPO_PATH — triagem necessaria antes de continuar (agent-parallel-safety R1)")
  elif [[ "$STASH_COUNT" -gt 3 ]]; then
    WARNINGS+=("stash_count=$STASH_COUNT em $REPO_PATH — considerar triagem de stashes antigos")
  fi

  if [[ "$DIRTY_FILES" -gt 0 ]]; then
    WARNINGS+=("working_tree_dirty=$DIRTY_FILES arquivos em $REPO_PATH — confirmar de quem e o WIP antes de comecar")
  else
    INFO+=("working_tree=clean branch=$BRANCH")
  fi

  # Branches locais sem upstream (indicador de branches abandonadas)
  NO_UPSTREAM_LIST=$(git -C "$REPO_PATH" branch --format='%(refname:short) %(upstream)' 2>/dev/null | awk '$2 == ""' || true)
  LOCAL_NO_UPSTREAM=$(echo "$NO_UPSTREAM_LIST" | grep -c . 2>/dev/null || echo "0")
  LOCAL_NO_UPSTREAM="${LOCAL_NO_UPSTREAM//[[:space:]]/}"
  if [[ "$LOCAL_NO_UPSTREAM" -gt 10 ]]; then
    WARNINGS+=("branches_sem_upstream=$LOCAL_NO_UPSTREAM — considerar limpeza com git branch -D")
  fi
fi

# 5. Worktrees ativos (outro indicador de paralelismo)
WORKTREE_COUNT=0
if [[ "$GIT_AVAILABLE" -eq 1 ]]; then
  WORKTREE_LIST=$(git -C "$REPO_PATH" worktree list 2>/dev/null || true)
  WORKTREE_COUNT=$(echo "$WORKTREE_LIST" | grep -c . 2>/dev/null || echo "1")
  WORKTREE_COUNT="${WORKTREE_COUNT//[[:space:]]/}"
  WORKTREE_COUNT=$((WORKTREE_COUNT - 1))  # subtrair o worktree principal
  if [[ "$WORKTREE_COUNT" -gt 0 ]]; then
    INFO+=("worktrees_ativos=$WORKTREE_COUNT — paralelismo de escrita possivel; verificar owners")
  fi
fi

# ─────────────────────────────────────────────────────────────────────
# Saida
# ─────────────────────────────────────────────────────────────────────

HEALTH_STATUS="ok"
EXIT_CODE=0

if [[ "${#BLOCKERS[@]}" -gt 0 ]]; then
  HEALTH_STATUS="blocker"
  EXIT_CODE=2
elif [[ "${#WARNINGS[@]}" -gt 0 ]]; then
  HEALTH_STATUS="warn"
  EXIT_CODE=1
fi

if [[ "$JSON_OUTPUT" -eq 1 ]]; then
  python3 -c "
import json, sys
data = {
  'status': '$HEALTH_STATUS',
  'memory_pressure': '$MEMORY_STATUS',
  'claude_pids': $CLAUDE_PIDS,
  'tsc_orphans': $TSC_PIDS,
  'git': {
    'available': bool($GIT_AVAILABLE),
    'stash_count': $STASH_COUNT,
    'dirty_files': $DIRTY_FILES,
    'branch': '$BRANCH',
    'worktrees': $WORKTREE_COUNT
  },
  'blockers': $(python3 -c "import json; print(json.dumps('${BLOCKERS[*]:-}'.split(' - ') if '${BLOCKERS[*]:-}' else []))"),
  'warnings': $(python3 -c "import json; print(json.dumps('${WARNINGS[*]:-}'.split(' - ') if '${WARNINGS[*]:-}' else []))")
}
print(json.dumps(data, indent=2))
"
  exit $EXIT_CODE
fi

if [[ "$QUIET" -eq 1 ]]; then
  exit $EXIT_CODE
fi

# Output human-readable
echo ""
echo "─────────────────────────────────────────────────────"
echo "  Session Health — $(date '+%Y-%m-%d %H:%M:%S')"
echo "─────────────────────────────────────────────────────"

if [[ "${#BLOCKERS[@]}" -gt 0 ]]; then
  echo "  BLOQUEANTE:"
  for b in "${BLOCKERS[@]}"; do
    echo "    ✗ $b"
  done
fi

if [[ "${#WARNINGS[@]}" -gt 0 ]]; then
  echo "  AVISOS:"
  for w in "${WARNINGS[@]}"; do
    echo "    ⚠ $w"
  done
fi

if [[ "${#INFO[@]}" -gt 0 ]]; then
  echo "  INFO:"
  for i in "${INFO[@]}"; do
    echo "    ✓ $i"
  done
fi

echo "─────────────────────────────────────────────────────"
if [[ "$HEALTH_STATUS" == "ok" ]]; then
  echo "  Status: OK — ambiente saudavel"
elif [[ "$HEALTH_STATUS" == "warn" ]]; then
  echo "  Status: WARN — continuar com cautela"
else
  echo "  Status: BLOCKER — intervencao necessaria antes de continuar"
fi
echo "─────────────────────────────────────────────────────"
echo ""

exit $EXIT_CODE
