#!/bin/bash
# pre-commit-autofix.sh — Auto-fix unused imports em staged files antes de commit
# Chamado por bash-guards.sh quando detecta git commit

STAGED=$(git diff --cached --name-only --diff-filter=ACMR 2>/dev/null | grep -E '\.(ts|tsx)$')
[ -z "$STAGED" ] && exit 0

# Detectar package manager
[ -f bun.lock ] || [ -f bun.lockb ] && PM="bunx" || PM="npx"

# Auto-fix com eslint (remove unused imports)
echo "$STAGED" | xargs $PM eslint --fix --quiet \
  --rule '{"@typescript-eslint/no-unused-vars":"off","no-unused-vars":"off"}' \
  2>/dev/null

# Re-stage arquivos corrigidos
echo "$STAGED" | xargs git add 2>/dev/null
exit 0
