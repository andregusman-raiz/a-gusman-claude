#!/usr/bin/env bash
# pdf2md.sh — Converte PDF -> Markdown via microsoft/markitdown (economia de tokens).
# Uso: bash ~/Claude/.claude/scripts/pdf2md.sh <arquivo.pdf> [output.md]
#
# Comportamento:
#   - Output padrao: mesmo dir, mesmo basename, extensao .md
#   - Cache: se o .md existir e for mais novo que o .pdf, reusa (exit 0, imprime path)
#   - Header de proveniencia injetado no .md gerado
#   - Fallback: se markitdown nao estiver no PATH, tenta uvx markitdown
#
# Relacionado: .claude/rules/pdf-markitdown.md | hook pdf-read-guard.sh

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "uso: pdf2md.sh <arquivo.pdf> [output.md]" >&2
  exit 1
fi

PDF="$1"
if [ ! -f "$PDF" ]; then
  echo "erro: arquivo nao encontrado: $PDF" >&2
  exit 1
fi

OUT="${2:-${PDF%.*}.md}"

# Cache: .md mais novo que o .pdf -> reusa
if [ -f "$OUT" ] && [ "$OUT" -nt "$PDF" ]; then
  echo "[cache] ja convertido: $OUT"
  exit 0
fi

# Resolver binario
MARKITDOWN=""
if command -v markitdown >/dev/null 2>&1; then
  MARKITDOWN="markitdown"
elif [ -x "$HOME/.local/bin/markitdown" ]; then
  MARKITDOWN="$HOME/.local/bin/markitdown"
elif command -v uvx >/dev/null 2>&1; then
  MARKITDOWN="uvx markitdown[all]"
else
  echo "erro: markitdown nao instalado. Rode: uv tool install 'markitdown[all]'" >&2
  exit 2
fi

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

if ! $MARKITDOWN "$PDF" > "$TMP" 2>/dev/null; then
  echo "erro: markitdown falhou em $PDF (PDF escaneado sem camada de texto?)" >&2
  echo "fallback: Read multimodal direto com PDF_VISUAL=1 (paginas especificas via 'pages')" >&2
  exit 3
fi

# PDF escaneado/imagem: markitdown retorna vazio ou quase vazio
CHARS=$(wc -c < "$TMP" | tr -d ' ')
if [ "$CHARS" -lt 50 ]; then
  echo "aviso: extracao retornou ${CHARS} chars — PDF provavelmente escaneado (sem texto)." >&2
  echo "fallback: Read multimodal direto com PDF_VISUAL=1" >&2
  exit 3
fi

{
  echo "<!-- gerado por markitdown de $(basename "$PDF") em $(date -u +%Y-%m-%dT%H:%M:%SZ) — nao editar manualmente -->"
  cat "$TMP"
} > "$OUT"

PDF_KB=$(du -k "$PDF" | cut -f1)
TOKENS_EST=$((CHARS / 4))
echo "[ok] $OUT (${CHARS} chars ≈ ${TOKENS_EST} tokens | PDF original: ${PDF_KB}KB)"
