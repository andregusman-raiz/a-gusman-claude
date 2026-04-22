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

# SQL Safety Guards — Block dangerous query patterns against TOTVS RM
# SELECT * on large TOTVS tables (PFUNC=680 cols, SMATRICPL=1M+ rows, SPARCELA=5M+)
if echo "$INPUT" | grep -qiP 'SELECT\s+\*\s+FROM\s+(PFUNC|SMATRICULA|SMATRICPL|SHABILITACAOALUNO|PPESSOA|SPARCELA|FLAN)\b'; then
  echo "BLOCKED: SELECT * on large TOTVS table. Specify column names (PFUNC has 680 cols). Consult schema.json." && exit 2
fi
# Multi-tenant queries without CODCOLIGADA filter
if echo "$INPUT" | grep -qiP 'FROM\s+(PFUNC|SMATRICULA|SMATRICPL|SPARCELA|FLAN|SHABILITACAOALUNO|PFHSTAFT)\b' && \
   ! echo "$INPUT" | grep -qi 'CODCOLIGADA'; then
  echo "BLOCKED: Query on multi-tenant TOTVS table without CODCOLIGADA filter. Add WHERE CODCOLIGADA = N." && exit 2
fi

# Warn on git stash (non-blocking) — prefer WIP commits
if [[ "$INPUT" == *"git stash"* ]] && \
   [[ "$INPUT" != *"git stash list"* ]] && \
   [[ "$INPUT" != *"git stash show"* ]] && \
   [[ "$INPUT" != *"git stash pop"* ]]; then
  echo "WARNING: git stash can lose work. Prefer WIP commits. Proceeding..." >&2
fi

exit 0
