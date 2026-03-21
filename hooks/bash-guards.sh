#!/bin/bash
# bash-guards.sh — PreToolUse(Bash): Block dangerous CLI patterns
# BLOCKING (exit 2)

INPUT="${CLAUDE_TOOL_INPUT:-}"
[[ "$INPUT" == *"vercel --prod"* ]] && echo "BLOCKED: Use CI/CD pipeline instead of direct vercel --prod" && exit 2
[[ "$INPUT" == *"--force"* ]] && [[ "$INPUT" == *"git push"* ]] && echo "BLOCKED: Force push is dangerous." && exit 2
[[ "$INPUT" == *"--no-verify"* ]] && echo "BLOCKED: --no-verify bypasses safety hooks." && exit 2

# Auto-fix imports before commit (prevent lint-staged failures)
if [[ "$INPUT" == *"git commit"* ]]; then
  bash ~/Claude/.claude/scripts/pre-commit-autofix.sh 2>/dev/null
fi

# Block destructive git operations (not delegated to branch-guard.sh)
if [[ "$INPUT" == *"git rebase -i"* ]]; then
  echo "BLOCKED: git rebase -i is interactive and destructive. Use merge instead." && exit 2
fi
if [[ "$INPUT" == *"git checkout -- ."* ]] || [[ "$INPUT" == *"git checkout -- \*"* ]]; then
  echo "BLOCKED: git checkout -- . discards all unstaged changes. Commit first." && exit 2
fi
if [[ "$INPUT" == *"git restore ."* ]]; then
  echo "BLOCKED: git restore . discards changes. Commit or branch first." && exit 2
fi
if [[ "$INPUT" == *"git clean -f"* ]]; then
  echo "BLOCKED: git clean -f permanently deletes untracked files." && exit 2
fi

# Warn on git stash (non-blocking) — prefer WIP commits
if [[ "$INPUT" == *"git stash"* ]] && \
   [[ "$INPUT" != *"git stash list"* ]] && \
   [[ "$INPUT" != *"git stash show"* ]] && \
   [[ "$INPUT" != *"git stash pop"* ]]; then
  echo "WARNING: git stash can lose work. Prefer WIP commits. Proceeding..." >&2
fi

exit 0
