#!/bin/bash
# PostToolUse: TypeCheck incremental para arquivos .ts/.tsx editados
# Item 6 — ROADMAP-MELHORIAS-CLAUDE-CODE.md
# Usa --incremental + .tsbuildinfo para cache (10-30s → <2s em runs subsequentes)

# Source PATH helper (npm/npx)
source "$(dirname "$0")/_env.sh" 2>/dev/null || true

# Verificar se algum arquivo editado e TypeScript
HAS_TS=false
if [ -n "$CLAUDE_FILE_PATHS" ]; then
  for f in $CLAUDE_FILE_PATHS; do
    case "$f" in
      *.ts|*.tsx) HAS_TS=true; FIRST_TS="$f"; break ;;
    esac
  done
fi

$HAS_TS || exit 0

# npx required
command -v npx &>/dev/null || exit 0

# Encontrar tsconfig.json mais proximo
DIR=$(dirname "$FIRST_TS")
TSCONFIG=""
while [ "$DIR" != "/" ] && [ "$DIR" != "." ] && [ -n "$DIR" ]; do
  if [ -f "$DIR/tsconfig.json" ]; then
    TSCONFIG="$DIR/tsconfig.json"
    break
  fi
  DIR=$(dirname "$DIR")
done

[ -z "$TSCONFIG" ] && exit 0

PROJECT_DIR=$(dirname "$TSCONFIG")
cd "$PROJECT_DIR" || exit 0

# TypeCheck incremental com timeout de 15s (advisory — nao bloqueia)
RESULT=$(timeout 15 npx tsc --noEmit --incremental 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ] && [ $EXIT_CODE -ne 124 ]; then
  ERRORS=$(echo "$RESULT" | grep -c "error TS" || echo "0")
  if [ "$ERRORS" -gt 0 ]; then
    echo "hook additional context: [TYPECHECK] $ERRORS erro(s) TypeScript:" >&2
    echo "$RESULT" | grep "error TS" | head -10 >&2
  fi
fi

# Advisory only — nunca bloqueia o fluxo
exit 0
