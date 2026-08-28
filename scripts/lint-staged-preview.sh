#!/usr/bin/env bash
# Post-Edit/Write hook: se o arquivo editado esta em repo com lint-staged,
# roda eslint --fix para alinhar o conteudo ao que seria commitado.
# Assim, qualquer revert do linter acontece IMEDIATAMENTE (visivel no proximo Read)
# em vez de silenciosamente no git commit.

set -u

# Claude Code passa tool input em stdin como JSON
INPUT=$(cat 2>/dev/null || echo "{}")

# Extrair file_path do JSON (Edit, Write, MultiEdit usam "file_path")
FILE=$(echo "$INPUT" | /usr/bin/python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    ti = d.get('tool_input', {})
    print(ti.get('file_path', ''))
except Exception:
    print('')
" 2>/dev/null)

# Sair silencioso se nao ha arquivo ou nao e .ts/.tsx/.js/.jsx
[ -z "$FILE" ] && exit 0
case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx|*.mts|*.cts) ;;
  *) exit 0 ;;
esac

# Arquivo deve existir (nao cobre create que falhou)
[ -f "$FILE" ] || exit 0

# Encontrar git root
DIR=$(dirname "$FILE")
GIT_ROOT=$(cd "$DIR" 2>/dev/null && git rev-parse --show-toplevel 2>/dev/null)
[ -z "$GIT_ROOT" ] && exit 0

# So agir se o repo usa lint-staged
PKG="$GIT_ROOT/package.json"
[ -f "$PKG" ] || exit 0
grep -q '"lint-staged"' "$PKG" || exit 0

# So agir se eslint esta instalado localmente
ESLINT_BIN="$GIT_ROOT/node_modules/.bin/eslint"
[ -x "$ESLINT_BIN" ] || exit 0

# Rodar eslint --fix em background com timeout curto
# Output vai pra stderr do hook (visivel em debug), nao bloqueia
(
  cd "$GIT_ROOT" || exit 0
  REL_FILE="${FILE#$GIT_ROOT/}"
  BEFORE=$(shasum "$FILE" 2>/dev/null | awk '{print $1}')

  # Timeout 10s para nao travar edicoes
  /usr/bin/env timeout 10 "$ESLINT_BIN" --fix --no-warn-ignored "$REL_FILE" >/dev/null 2>&1

  AFTER=$(shasum "$FILE" 2>/dev/null | awk '{print $1}')
  if [ "$BEFORE" != "$AFTER" ]; then
    # Emite aviso em stderr — Claude Code mostra como tool output
    echo "[lint-staged-preview] eslint --fix modificou $REL_FILE — verifique diff antes de commitar" >&2
  fi
) &

# Sempre success, nao queremos bloquear edicoes
exit 0
