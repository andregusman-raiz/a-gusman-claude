#!/bin/bash
# =============================================================================
# quality-check.sh — Stop hook: TODO scan + uncommitted changes warning
# Exit 0 = allow stop (advisory only)
# =============================================================================

# --- TODO/FIXME Scan ---
MODIFIED=$(git diff --name-only HEAD 2>/dev/null)
if [ -n "$MODIFIED" ]; then
  TODOS=$(echo "$MODIFIED" | xargs grep -l "TODO\|FIXME\|HACK" 2>/dev/null)
  if [ -n "$TODOS" ]; then
    echo "hook additional context: TODOs/FIXMEs em arquivos modificados: $TODOS" >&2
  fi
fi

# --- Uncommitted Changes Warning ---
UNCOMMITTED=$(git diff --stat HEAD 2>/dev/null | tail -1)
if [ -n "$UNCOMMITTED" ]; then
  echo "hook additional context: Mudancas nao commitadas detectadas: $UNCOMMITTED" >&2
fi

exit 0
