#!/usr/bin/env bash
# repo-health.sh — Relatorio rapido de saude de um repo git.
# Uso:
#   bash ~/.claude/scripts/repo-health.sh [repo-path]
#   (sem argumento = CWD atual)
#
# Reporta:
#   - Branch atual e divergencia vs upstream
#   - Stash count + alerta se > 3
#   - Working tree dirty count + alerta se > 0
#   - Branches locais sem upstream
#   - Outros processos Claude tocando o repo
#   - Timestamps de ultimo commit/push
#
# Exit codes:
#   0 — saudavel ou warnings apenas
#   1 — nao e um git repo
#   2 — problemas criticos (stash > 10, multiplos PIDs Claude, branch drift forte)

set -u

REPO="${1:-$PWD}"

if ! cd "$REPO" 2>/dev/null; then
  echo "[repo-health] ERRO: nao consegui entrar em $REPO" >&2
  exit 1
fi

if ! git rev-parse --show-toplevel >/dev/null 2>&1; then
  echo "[repo-health] SKIP: $REPO nao e um git repo"
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
REPO_NAME="$(basename "$REPO_ROOT")"

CRITICAL=0
WARNING=0

echo "═══════════════════════════════════════════════════════════"
echo "  repo-health: $REPO_NAME"
echo "  path: $REPO_ROOT"
echo "═══════════════════════════════════════════════════════════"

# ─── Branch atual ─────────────────────────────────────────────
BRANCH="$(git branch --show-current 2>/dev/null || echo 'DETACHED')"
echo "branch: $BRANCH"

# ─── Divergencia vs upstream ──────────────────────────────────
if [ "$BRANCH" != "DETACHED" ]; then
  UPSTREAM="$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || echo '')"
  if [ -n "$UPSTREAM" ]; then
    AHEAD="$(git rev-list --count "${UPSTREAM}..HEAD" 2>/dev/null || echo 0)"
    BEHIND="$(git rev-list --count "HEAD..${UPSTREAM}" 2>/dev/null || echo 0)"
    echo "upstream: $UPSTREAM (ahead=$AHEAD, behind=$BEHIND)"
    if [ "$BEHIND" -gt 20 ]; then
      echo "  ⚠  WARNING: branch behind upstream por >20 commits. Rebase/merge recomendado."
      WARNING=$((WARNING + 1))
    fi
  else
    echo "upstream: (none)"
  fi
fi

# ─── Working tree dirty ───────────────────────────────────────
DIRTY_COUNT="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
if [ "$DIRTY_COUNT" -eq 0 ]; then
  echo "working tree: clean"
else
  echo "working tree: $DIRTY_COUNT file(s) modified/untracked"
  echo "  ⚠  WARNING: working tree sujo. Commit/stash antes de trocar branch."
  WARNING=$((WARNING + 1))
  if [ "$DIRTY_COUNT" -gt 15 ]; then
    echo "  🔴 CRITICAL: >15 arquivos dirty. Provavel WIP de outro processo ou sessao."
    CRITICAL=$((CRITICAL + 1))
  fi
fi

# ─── Stash count ──────────────────────────────────────────────
STASH_COUNT="$(git stash list 2>/dev/null | wc -l | tr -d ' ')"
echo "stashes: $STASH_COUNT"
if [ "$STASH_COUNT" -gt 10 ]; then
  echo "  🔴 CRITICAL: >10 stashes acumulados. Rodar triagem antes de novo trabalho."
  echo "     Ver: ~/Claude/docs/diagnosticos/2026-04-07-raiz-data-engine-wip-triage.md"
  CRITICAL=$((CRITICAL + 1))
elif [ "$STASH_COUNT" -gt 3 ]; then
  echo "  ⚠  WARNING: $STASH_COUNT stashes. Triagem recomendada."
  WARNING=$((WARNING + 1))
fi

# ─── Branches locais sem upstream ─────────────────────────────
ORPHAN_BRANCHES="$(git for-each-ref --format='%(refname:short) %(upstream)' refs/heads/ 2>/dev/null | awk '$2 == "" {print $1}' | wc -l | tr -d ' ')"
if [ "$ORPHAN_BRANCHES" -gt 0 ]; then
  echo "branches sem upstream: $ORPHAN_BRANCHES"
  if [ "$ORPHAN_BRANCHES" -gt 5 ]; then
    echo "  ⚠  WARNING: muitas branches locais sem upstream. Limpar com 'git branch -D' apos confirmar merge."
    WARNING=$((WARNING + 1))
  fi
fi

# ─── Branches recovery/wip/temp ───────────────────────────────
RECOVERY_BRANCHES="$(git branch 2>/dev/null | grep -cE '(recovery/|wip/|temp/)' || true)"
if [ "$RECOVERY_BRANCHES" -gt 0 ]; then
  echo "branches recovery/wip/temp: $RECOVERY_BRANCHES"
  if [ "$RECOVERY_BRANCHES" -gt 3 ]; then
    echo "  ⚠  WARNING: branches de recovery acumulando. Revisar PRs e fechar."
    WARNING=$((WARNING + 1))
  fi
fi

# ─── Outros processos Claude ──────────────────────────────────
# Busca por processos claude cujo CWD ou argumentos mencionem este repo.
CLAUDE_PIDS="$(pgrep -af "claude" 2>/dev/null | grep -v "repo-health.sh" | grep -F "$REPO_NAME" | awk '{print $1}' | head -5)"
CLAUDE_COUNT="$(echo "$CLAUDE_PIDS" | grep -c . || true)"
if [ "$CLAUDE_COUNT" -gt 1 ]; then
  echo "processos claude tocando este repo: $CLAUDE_COUNT"
  echo "  🔴 CRITICAL: multiplas sessoes claude. Usar worktree isolation obrigatorio."
  echo "     PIDs: $(echo $CLAUDE_PIDS | tr '\n' ' ')"
  CRITICAL=$((CRITICAL + 1))
fi

# ─── Ultimo commit ────────────────────────────────────────────
LAST_COMMIT="$(git log -1 --format='%cr by %an: %s' 2>/dev/null || echo 'none')"
echo "last commit: $LAST_COMMIT"

# ─── Resumo ───────────────────────────────────────────────────
echo "───────────────────────────────────────────────────────────"
if [ "$CRITICAL" -gt 0 ]; then
  echo "  STATUS: 🔴 CRITICAL ($CRITICAL critical, $WARNING warnings)"
  exit 2
elif [ "$WARNING" -gt 0 ]; then
  echo "  STATUS: ⚠  WARNING ($WARNING warnings)"
  exit 0
else
  echo "  STATUS: ✓ HEALTHY"
  exit 0
fi
