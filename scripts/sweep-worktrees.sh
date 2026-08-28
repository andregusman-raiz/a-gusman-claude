#!/bin/bash
# sweep-worktrees.sh [dry|apply]
# Remove worktrees orfaos com protocolo anti-perda:
#   - so worktree LINKADO (.git e arquivo-ponteiro; clone completo = skip)
#   - skip se arquivo modificado nos ultimos 2 dias (sessao ativa)
#   - skip se dirty (tracked mod OU untracked)
#   - skip se commits nao pushados no HEAD
#   - nunca deleta branch/ref
MODE=${1:-dry}
H=/Users/andregusmandeoliveira/Claude
total_kb=0; n_elig=0; n_recent=0; n_dirty=0; n_unpushed=0; n_orphan=0; n_notwt=0; n_removed=0; n_fail=0
declare -a PRUNE_REPOS

candidates() {
  for g in \
    "$H/worktrees"/* \
    "$H/.claude/worktrees"/* \
    "$H/.worktrees"/* \
    "$H/.codex-worktrees"/* \
    "$H/GitHub"/*/.claude/worktrees/* \
    "$H/GitHub"/*/.codex/worktrees/* \
    "$H/GitHub"/*/.claude/worktrees/*/ \
    "$H/GitHub-raiz"/*/.claude/worktrees/* \
    "$H/GitHub-raiz"/*/.codex/worktrees/* \
    "$H/GitHub-pessoal"/*/.claude/worktrees/* \
    "$H/GitHub-pessoal"/*/.codex/worktrees/* \
    "$H/projetos"/*/.claude/worktrees/* \
    "$H/projetos"/*/.codex/worktrees/* \
    "$H/GitHub-raiz/.wt-front-r3" \
    "$H/projetos/_wt-cfg-pascal-embed"; do
    [ -d "$g" ] && echo "$g"
  done | sort -u
}

while IFS= read -r wt; do
  if [ ! -f "$wt/.git" ]; then
    echo "SKIP not-linked $wt"; n_notwt=$((n_notwt+1)); continue
  fi
  if ! git -C "$wt" rev-parse --git-dir >/dev/null 2>&1; then
    echo "ORPHAN (repo-pai sumiu) $wt"; n_orphan=$((n_orphan+1)); continue
  fi
  recent=$(find "$wt" \( -name node_modules -o -name .venv -o -name venv -o -name .next \) -prune -o -type f -newermt '2 days ago' -print -quit 2>/dev/null)
  if [ -n "$recent" ]; then
    echo "SKIP recent $wt ($recent)"; n_recent=$((n_recent+1)); continue
  fi
  if [ -n "$(git -C "$wt" status --porcelain 2>/dev/null | head -1)" ]; then
    echo "SKIP dirty $wt"; n_dirty=$((n_dirty+1)); continue
  fi
  if [ -n "$(git -C "$wt" log --oneline HEAD --not --remotes 2>/dev/null | head -1)" ]; then
    echo "SKIP unpushed $wt"; n_unpushed=$((n_unpushed+1)); continue
  fi
  kb=$(du -sk "$wt" 2>/dev/null | awk '{print $1}')
  total_kb=$((total_kb+kb)); n_elig=$((n_elig+1))
  if [ "$MODE" = "apply" ]; then
    common=$(git -C "$wt" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)
    repo=$(dirname "$common")
    if git -C "$repo" worktree remove "$wt" >/dev/null 2>&1; then
      echo "REMOVED $((kb/1024))M $wt"; n_removed=$((n_removed+1)); PRUNE_REPOS+=("$repo")
    else
      echo "FAIL-remove $wt (git recusou; mantido)"; n_fail=$((n_fail+1))
    fi
  else
    echo "ELIGIBLE $((kb/1024))M $wt"
  fi
done < <(candidates)

if [ "$MODE" = "apply" ] && [ ${#PRUNE_REPOS[@]} -gt 0 ]; then
  printf '%s\n' "${PRUNE_REPOS[@]}" | sort -u | while IFS= read -r r; do
    git -C "$r" worktree prune 2>/dev/null && echo "PRUNED $r"
  done
fi

echo "=========================================="
echo "MODE=$MODE | elegiveis=$n_elig (~$((total_kb/1048576)) GB) | removidos=$n_removed | fail=$n_fail"
echo "skips: recent=$n_recent dirty=$n_dirty unpushed=$n_unpushed orphan=$n_orphan not-linked=$n_notwt"
