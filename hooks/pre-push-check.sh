#!/bin/bash
# =============================================================================
# pre-push-check.sh — PreToolUse: Validate branch and state before git push
# Advisory (exit 0) — warns but doesn't block.
# =============================================================================

# Read tool input from stdin
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('command', ''))
except:
    print('')
" 2>/dev/null || echo "")

# Only trigger on git push commands
echo "$COMMAND" | grep -q "git push" || exit 0

# Skip if not in a git repo
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
[ -z "$BRANCH" ] && exit 0

WARNINGS=""

# 1. Warn if pushing directly to main/master
if [[ "$BRANCH" == "main" || "$BRANCH" == "master" ]]; then
  WARNINGS="${WARNINGS}[PRE-PUSH] AVISO: Pushando diretamente em '$BRANCH'. Considere usar feature branch + PR.\n"
fi

# 2. Check if branch has upstream tracking
UPSTREAM=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null)
if [ -z "$UPSTREAM" ]; then
  WARNINGS="${WARNINGS}[PRE-PUSH] Branch '$BRANCH' sem upstream. Recomendado: git push -u origin $BRANCH\n"
fi

# 3. Check for uncommitted changes
UNCOMMITTED=$(git status --porcelain 2>/dev/null | head -5)
if [ -n "$UNCOMMITTED" ]; then
  WARNINGS="${WARNINGS}[PRE-PUSH] Ha mudancas nao commitadas. Considere commitar antes de pushar.\n"
fi

# 4. Check if push command includes -u flag when needed
if [ -z "$UPSTREAM" ] && ! echo "$COMMAND" | grep -qE "\-u |--set-upstream"; then
  WARNINGS="${WARNINGS}[PRE-PUSH] Sem upstream configurado. Adicione -u: git push -u origin $BRANCH\n"
fi

if [ -n "$WARNINGS" ]; then
  echo -e "hook additional context: $WARNINGS" >&2
fi

exit 0
