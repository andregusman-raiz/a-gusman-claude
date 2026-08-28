#!/usr/bin/env bash
# worktree-prune.sh — Stop hook: limpa worktrees orfaos dos repos tocados na sessao.
#
# Estrategia:
#   1. Descobre repos sob ~/Claude/GitHub e ~/Claude/projetos que tem .claude/worktrees/
#   2. Para cada um, roda `git worktree prune -v` (remove entries orfaos do metadata)
#   3. Remove diretorios .claude/worktrees/<name> cujo working tree nao esta mais registrado
#
# Nao-destrutivo: NUNCA remove worktree com commits pendentes ou dirty.

set -u

PRUNED=0
FAILED=0

find_repos() {
  find "$HOME/Claude/GitHub" "$HOME/Claude/projetos" -maxdepth 3 -type d -name ".git" 2>/dev/null | while read -r gitdir; do
    dirname "$gitdir"
  done
}

prune_repo() {
  local repo="$1"
  local wt_dir="$repo/.claude/worktrees"

  [ -d "$wt_dir" ] || return 0

  # 1. Prune metadata (remove stale entries de worktrees ja deletados)
  git -C "$repo" worktree prune -v 2>/dev/null || true

  # 2. Para cada diretorio em .claude/worktrees/, verificar se esta registrado
  for wt in "$wt_dir"/*/; do
    [ -d "$wt" ] || continue
    local wt_path
    wt_path=$(cd "$wt" && pwd)

    # Verifica se esta registrado como worktree ativo
    if ! git -C "$repo" worktree list --porcelain 2>/dev/null | grep -q "^worktree $wt_path$"; then
      # Nao registrado — candidato a remocao
      # Safety: se tem .git e arquivos dirty, nao remover
      if [ -e "$wt_path/.git" ]; then
        if (cd "$wt_path" && git status --porcelain 2>/dev/null | grep -q .); then
          echo "[worktree-prune] SKIP dirty: $wt_path" >&2
          FAILED=$((FAILED + 1))
          continue
        fi
      fi
      rm -rf "$wt_path"
      PRUNED=$((PRUNED + 1))
    fi
  done
}

while IFS= read -r repo; do
  [ -z "$repo" ] && continue
  prune_repo "$repo" || true
done < <(find_repos)

[ "$PRUNED" -gt 0 ] && echo "[worktree-prune] removed $PRUNED orphan worktree(s)"
exit 0
