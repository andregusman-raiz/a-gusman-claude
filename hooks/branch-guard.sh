#!/bin/bash
# =============================================================================
# branch-guard.sh — PreToolUse: Block git commit of source code to main/master
# BLOCKING (exit 2) for source code commits on main/master.
# Advisory (exit 0) for config/docs commits on main/master.
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

# Only trigger on git commit commands
echo "$COMMAND" | grep -q "git commit" || exit 0

# Check current branch
BRANCH=$(git branch --show-current 2>/dev/null)
[ -z "$BRANCH" ] && exit 0

case "$BRANCH" in
  main|master|develop)
    # Check what files are staged
    STAGED_FILES=$(git diff --cached --name-only 2>/dev/null)
    [ -z "$STAGED_FILES" ] && exit 0

    # Check if ANY staged file is source code (not just config/docs)
    HAS_SOURCE_CODE=false
    while IFS= read -r file; do
      case "$file" in
        # Config/docs files — allowed on main
        *.md|*.json|*.yml|*.yaml|.gitignore|.env.example|.eslintrc*|.prettierrc*|*.toml|*.cfg|*.ini)
          ;;
        # Claude config files — allowed on main
        .claude/*|CLAUDE.md)
          ;;
        # Everything else is source code — BLOCKED on main
        *)
          HAS_SOURCE_CODE=true
          break
          ;;
      esac
    done <<< "$STAGED_FILES"

    if [ "$HAS_SOURCE_CODE" = true ]; then
      # BLOCKING — exit 2 with feedback
      echo "[BRANCH-GUARD] BLOQUEADO: Commit de codigo fonte em '$BRANCH'." >&2
      echo "Crie uma feature branch primeiro:" >&2
      echo "  git checkout -b feat/nome-descritivo" >&2
      echo "  git checkout -b fix/nome-do-bug" >&2
      echo "  git checkout -b refactor/descricao" >&2
      exit 2
    else
      # Config/docs only — advisory warning
      echo "hook additional context: [BRANCH-GUARD] Commitando config/docs em '$BRANCH'. OK para arquivos nao-codigo." >&2
    fi
    ;;
esac

exit 0
