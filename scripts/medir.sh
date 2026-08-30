#!/usr/bin/env bash
# Escreve uma medição em docs/ai-state/medicoes/, commita, e SÓ ENTÃO imprime o
# ponteiro para enviar. O ponteiro é derivado do ficheiro que acabou de existir.
#
# Motivo (FUNIL, 30/08): mandei duas vezes em dez minutos um "lê X" para um X que
# ainda não estava no disco — a segunda logo depois de escrever a regra "escrever
# primeiro, apontar depois". Uma regra que eu próprio quebro nesse intervalo não é
# mecanismo; é uma nota. Aqui o ponteiro é IMPOSSÍVEL de obter sem o ficheiro.
#
# Uso:  medir.sh <slug-kebab> "<resumo de uma linha>" < corpo.md
set -euo pipefail
[ $# -eq 2 ] || { echo "uso: medir.sh <slug> \"<resumo>\" < corpo" >&2; exit 2; }
SLUG="$1"; RESUMO="$2"
RAIZ="$HOME/Claude/docs/ai-state/medicoes"
STAMP="$(date -u +%Y-%m-%d-%H%M)"
DEST="$RAIZ/${STAMP}-${SLUG}.md"
[ -e "$DEST" ] && { echo "❌ já existe: $DEST" >&2; exit 1; }
cat > "$DEST"
[ -s "$DEST" ] || { rm -f "$DEST"; echo "❌ corpo vazio — nada escrito" >&2; exit 1; }
git -C "$HOME/Claude" add "$DEST" >/dev/null
git -C "$HOME/Claude" commit -q -m "measure: ${RESUMO}

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>" >/dev/null
REL="medicoes/$(basename "$DEST")"
SHA="$(git -C "$HOME/Claude" log -1 --format=%h)"
echo "✅ escrito e commitado ($SHA): $DEST"
echo
echo "── ponteiro (copiar para SendMessage; o ficheiro JÁ existe) ──"
PONTO="${RESUMO} Le ${REL}"
echo "$PONTO"
[ "${#PONTO}" -le 600 ] || echo "⚠ ${#PONTO} chars — encurta o resumo (teto 600)"
