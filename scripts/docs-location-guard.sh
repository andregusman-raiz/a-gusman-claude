#!/usr/bin/env bash
# docs-location-guard.sh
# PreToolUse Write hook: bloqueia salvar markdown em ~/Claude/docs/{specs,diagnosticos,plans,adr,reports}/
# quando ha projeto detectavel via git no CWD ou no caminho do arquivo.
#
# Permitido:
#   - paths em ~/Claude/docs/workspace/...  (cross-project legitimo)
#   - DOCS_GUARD_DISABLED=1                 (bypass de sessao)
#   - paths fora de ~/Claude/docs/          (qualquer projeto)
#
# Bloqueado:
#   - ~/Claude/docs/specs/*.md
#   - ~/Claude/docs/diagnosticos/*.md
#   - ~/Claude/docs/plans/*.md
#   - ~/Claude/docs/adr/*.md
#   - ~/Claude/docs/reports/*.md
#   - ~/Claude/docs/*.md (qualquer .md no nivel docs/)
#
# Exit codes:
#   0 = permitido (silencioso)
#   2 = bloqueado (mensagem para o modelo via stderr)
#
# JSON esperado em stdin (PreToolUse):
#   { "tool_name": "Write", "tool_input": { "file_path": "...", "content": "..." } }

set -uo pipefail

# Bypass explicito
if [ "${DOCS_GUARD_DISABLED:-0}" = "1" ]; then
  exit 0
fi

# Ler payload do stdin
PAYLOAD="$(cat)"

# Extrair tool_name e file_path com python (mais seguro que jq dependency)
PARSED="$(printf '%s' "$PAYLOAD" | python3 -c '
import sys, json
try:
    d = json.load(sys.stdin)
    tn = d.get("tool_name", "")
    fp = (d.get("tool_input") or {}).get("file_path", "")
    # tab-separated para sobreviver a paths com espaco
    print(f"{tn}\t{fp}")
except Exception:
    print("\t")
')"
TOOL_NAME="${PARSED%%	*}"
FILE_PATH="${PARSED#*	}"

# Aplicar somente em Write/Edit/MultiEdit
case "$TOOL_NAME" in
  Write|Edit|MultiEdit) ;;
  *) exit 0 ;;
esac

# Sem path? deixar passar (outras validacoes pegam)
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Normalizar HOME
HOME_DIR="${HOME%/}"
WORKSPACE_DOCS="$HOME_DIR/Claude/docs"

# Path nao esta em ~/Claude/docs? deixa passar
case "$FILE_PATH" in
  "$WORKSPACE_DOCS"/*) ;;
  *) exit 0 ;;
esac

# Path esta em workspace/ (excecao legitima)
case "$FILE_PATH" in
  "$WORKSPACE_DOCS"/workspace/*) exit 0 ;;
esac

# Path nao e .md? (assets, scripts, screenshots etc) deixa passar
case "$FILE_PATH" in
  *.md|*.MD) ;;
  *) exit 0 ;;
esac

# Identificar subpasta bloqueada
REL_PATH="${FILE_PATH#$WORKSPACE_DOCS/}"
SUBDIR="${REL_PATH%%/*}"

# Subpastas auxiliares que nao sao docs (deixa passar — sao assets do workspace)
case "$SUBDIR" in
  scripts|screenshots|screenshots-final|screenshots-modulos|prompts|treinamento*|verificacao*|"(nao usar)") exit 0 ;;
esac

# Aqui chegamos: tentativa de Write em ~/Claude/docs/<subdir>/*.md
# Detectar se ha projeto detectavel ascendendo do CWD
DETECTED_PROJECT=""
if CWD_GIT="$(git -C "$(pwd)" rev-parse --show-toplevel 2>/dev/null)"; then
  if [ "$CWD_GIT" != "$HOME_DIR/Claude" ]; then
    DETECTED_PROJECT="$CWD_GIT"
  fi
fi

# Detectar projeto pelo nome do arquivo (ex: raiz-platform-fix.md, automata-spec-v1.md)
BASENAME="$(basename "$FILE_PATH")"
SUGGESTED=""
for proj_dir in "$HOME_DIR"/Claude/GitHub/* "$HOME_DIR"/Claude/projetos/*; do
  [ -d "$proj_dir" ] || continue
  proj_name="$(basename "$proj_dir")"
  if echo "$BASENAME" | grep -qiF "$proj_name"; then
    SUGGESTED="$proj_dir"
    break
  fi
done

# Montar mensagem de bloqueio
{
  echo "BLOCKED: tentativa de salvar doc no workspace raiz."
  echo ""
  echo "Path tentado: $FILE_PATH"
  echo "Subpasta:     $SUBDIR/"
  echo ""
  echo "REGRA: docs (specs, diagnosticos, plans, adr, reports) DEVEM ficar dentro do projeto."
  echo "Ver: ~/Claude/.claude/shared/patterns/docs-location.md"
  echo ""
  if [ -n "$DETECTED_PROJECT" ]; then
    DEST_GUESS="$DETECTED_PROJECT/docs/$REL_PATH"
    echo "Projeto detectado via git (CWD): $DETECTED_PROJECT"
    echo "Salvar em: $DEST_GUESS"
  elif [ -n "$SUGGESTED" ]; then
    DEST_GUESS="$SUGGESTED/docs/$REL_PATH"
    echo "Projeto sugerido pelo nome do arquivo: $SUGGESTED"
    echo "Salvar em: $DEST_GUESS"
  else
    echo "Nao consegui detectar projeto automaticamente."
    echo "Opcoes:"
    echo "  a) cd para o projeto antes (ex: cd ~/Claude/GitHub/<projeto>)"
    echo "  b) salvar com path absoluto do projeto-alvo"
    echo "  c) se for doc cross-project legitimo: salvar em $WORKSPACE_DOCS/workspace/$REL_PATH"
  fi
  echo ""
  echo "Bypass de emergencia: export DOCS_GUARD_DISABLED=1"
} >&2

exit 2
