#!/usr/bin/env bash
# pdf-read-guard.sh — PreToolUse(Read) hook: 100% dos PDFs passam por markitdown antes de leitura.
#
# Bloqueia Read direto de *.pdf quando NAO existe o .md convertido correspondente.
# Fluxo forcado: bash ~/Claude/.claude/scripts/pdf2md.sh <file.pdf> -> Read do .md gerado.
# Excecao automatica: se <basename>.md existe e e mais novo que o PDF, o Read do PDF e
# liberado (leitura VISUAL deliberada pos-conversao: layout, slides, screenshots review).
#
# Bypass: PDF_GUARD_DISABLED=1 (sessao inteira) | PDF_VISUAL=1 (leitura visual pontual)
# Relacionado: .claude/rules/pdf-markitdown.md

set -uo pipefail

[ "${PDF_GUARD_DISABLED:-0}" = "1" ] && exit 0
[ "${PDF_VISUAL:-0}" = "1" ] && exit 0

INPUT="$(cat)"

# Fast-path: Read e a tool mais frequente — so paga o parse python se ".pdf" aparece no payload
case "$INPUT" in
  *.pdf*|*.PDF*|*.Pdf*) ;;
  *) exit 0 ;;
esac

FILE_PATH=$(printf '%s' "$INPUT" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('file_path', ''))
except Exception:
    print('')
" 2>/dev/null)

# Nao e PDF -> libera
case "$FILE_PATH" in
  *.pdf|*.PDF) ;;
  *) exit 0 ;;
esac

MD="${FILE_PATH%.*}.md"

# .md convertido existe e esta atualizado -> Read do PDF e visual deliberado, libera
if [ -f "$MD" ] && [ "$MD" -nt "$FILE_PATH" ]; then
  exit 0
fi

cat >&2 <<EOF
[pdf-read-guard] BLOQUEADO: Read direto de PDF sem conversao previa (regra: 100% dos PDFs via markitdown).

Caminho obrigatorio (economiza tokens):
  1. bash ~/Claude/.claude/scripts/pdf2md.sh "$FILE_PATH"
  2. Read "$MD"

Se a tarefa exige analise VISUAL (layout, slides, graficos) o Read do PDF e liberado
automaticamente APOS a conversao existir, ou pontualmente com PDF_VISUAL=1.
PDF escaneado sem texto (pdf2md exit 3): use PDF_VISUAL=1 + Read com 'pages'.
Bypass de sessao: PDF_GUARD_DISABLED=1. Detalhes: .claude/rules/pdf-markitdown.md
EOF
exit 2
