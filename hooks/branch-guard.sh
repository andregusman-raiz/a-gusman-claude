#!/bin/bash
# branch-guard.sh — PreToolUse(Bash): Block git commit/push on protected branches
# BLOCKING (exit 2)
INPUT="${CLAUDE_TOOL_INPUT:-}"

# Interceptar git commit em branch protegida
if [[ "$INPUT" == *"git commit"* ]]; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
  case "$BRANCH" in
    main|master|develop)
      echo "BLOCKED: Commit em '$BRANCH' proibido. Crie feature branch: git checkout -b feat/nome" >&2
      exit 2 ;;
  esac
fi

# Bloquear git commit --amend em branch protegida
if [[ "$INPUT" == *"git commit --amend"* ]] || [[ "$INPUT" == *"git commit -"*"--amend"* ]]; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
  case "$BRANCH" in
    main|master|develop)
      echo "BLOCKED: git commit --amend em '$BRANCH' proibido. Amend reescreve historico publico." >&2
      exit 2 ;;
  esac
fi

# Interceptar git push direto a branch protegida
if [[ "$INPUT" == *"git push"* ]] && [[ "$INPUT" == *"main"* || "$INPUT" == *"master"* || "$INPUT" == *"develop"* ]]; then
  echo "BLOCKED: Push direto em branch protegida. Use PR: gh pr create" >&2
  exit 2
fi

exit 0
