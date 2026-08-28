#!/usr/bin/env bash
# screenshot-resize.sh — PostToolUse hook para manter screenshots abaixo de 2000px
#
# Evita erro "image exceeds the dimension limit for many-image requests (2000px)"
# quando multiplas imagens acumulam em contexto.
#
# Le o tool_input JSON via stdin, extrai o caminho do arquivo, e roda sips -Z 1800.
# Silencioso em caso de erro (nao bloqueia o fluxo).

set -euo pipefail

MAX_DIM=1800
LOG_FILE="${HOME}/.claude/logs/screenshot-resize.log"
mkdir -p "$(dirname "$LOG_FILE")"

# Le payload do hook (JSON com tool_name, tool_input, tool_response)
PAYLOAD=$(cat)

TOOL_NAME=$(printf '%s' "$PAYLOAD" | /usr/bin/python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('tool_name',''))" 2>/dev/null || echo "")

# So processa tools de screenshot conhecidas
case "$TOOL_NAME" in
    *take_screenshot*|*browser_take_screenshot*) ;;
    *) exit 0 ;;
esac

# Extrai filename/filePath do tool_input
FILE_PATH=$(printf '%s' "$PAYLOAD" | /usr/bin/python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    inp = d.get('tool_input', {}) or {}
    # chrome-devtools usa 'filePath', playwright usa 'filename'
    path = inp.get('filePath') or inp.get('filename') or ''
    print(path)
except Exception:
    print('')
" 2>/dev/null || echo "")

if [[ -z "$FILE_PATH" ]]; then
    exit 0
fi

# Resolve caminho relativo (playwright salva relativo ao CWD do projeto)
if [[ ! "$FILE_PATH" = /* ]]; then
    # Tenta CWD atual, depois diretorios comuns de output do playwright
    for base in "$PWD" "$PWD/.playwright-mcp" "$HOME/.cache/playwright-mcp"; do
        if [[ -f "$base/$FILE_PATH" ]]; then
            FILE_PATH="$base/$FILE_PATH"
            break
        fi
    done
fi

if [[ ! -f "$FILE_PATH" ]]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') SKIP not-found: $FILE_PATH" >> "$LOG_FILE"
    exit 0
fi

# Le dimensoes atuais
DIMS=$(/usr/bin/sips -g pixelWidth -g pixelHeight "$FILE_PATH" 2>/dev/null | awk '/pixel/ {print $2}' | paste -sd'x' -)
W=$(echo "$DIMS" | cut -dx -f1)
H=$(echo "$DIMS" | cut -dx -f2)

if [[ -z "$W" || -z "$H" ]]; then
    exit 0
fi

# Resize so se alguma dimensao exceder o limite
if (( W > MAX_DIM || H > MAX_DIM )); then
    /usr/bin/sips -Z "$MAX_DIM" "$FILE_PATH" > /dev/null 2>&1 || true
    NEW_DIMS=$(/usr/bin/sips -g pixelWidth -g pixelHeight "$FILE_PATH" 2>/dev/null | awk '/pixel/ {print $2}' | paste -sd'x' -)
    echo "$(date '+%Y-%m-%d %H:%M:%S') RESIZE $TOOL_NAME ${W}x${H} -> ${NEW_DIMS}: $FILE_PATH" >> "$LOG_FILE"
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') OK ${W}x${H}: $FILE_PATH" >> "$LOG_FILE"
fi

exit 0
