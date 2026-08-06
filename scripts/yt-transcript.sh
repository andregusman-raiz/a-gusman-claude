#!/usr/bin/env bash
# yt-transcript.sh — extrai transcript de video YouTube via yt-dlp (legenda manual > auto)
# Uso: yt-transcript.sh <url-ou-video-id> [sub-langs]
#   sub-langs default: "pt,pt-BR,en,en-orig" (cada idioma = 1 request; lista curta evita 429)
#   NAO usar wildcard tipo "pt.*": casa tracks auto-TRADUZIDOS (ex: pt-en) => requests extras => HTTP 429
# Output: imprime o caminho do .md gerado (cache em ~/Claude/.cache/yt-transcripts/)
# Racional: absorcao minima do gap identificado na avaliacao Agent-Reach (2026-08-06).
set -euo pipefail

CACHE_DIR="${YT_TRANSCRIPT_CACHE:-$HOME/Claude/.cache/yt-transcripts}"
LANGS="${2:-pt,pt-BR,en,en-orig}"

usage() { echo "Uso: $(basename "$0") <url-ou-video-id> [sub-langs]" >&2; exit 1; }
[ $# -ge 1 ] || usage

command -v yt-dlp >/dev/null || { echo "ERRO: yt-dlp nao encontrado (brew install yt-dlp)" >&2; exit 2; }

INPUT="$1"
# Extrai video id de URL (watch?v=, youtu.be/, shorts/, embed/) ou aceita id cru (11 chars)
if [[ "$INPUT" =~ (v=|youtu\.be/|shorts/|embed/)([A-Za-z0-9_-]{11}) ]]; then
  VID="${BASH_REMATCH[2]}"
elif [[ "$INPUT" =~ ^[A-Za-z0-9_-]{11}$ ]]; then
  VID="$INPUT"
else
  echo "ERRO: nao consegui extrair video id de: $INPUT" >&2; exit 3
fi
URL="https://www.youtube.com/watch?v=${VID}"

mkdir -p "$CACHE_DIR"
OUT="$CACHE_DIR/${VID}.md"
if [ -s "$OUT" ]; then
  echo "$OUT"
  exit 0
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# 1 chamada: metadata + legendas (--no-simulate para escrever subs mesmo com --print-to-file)
# player_client=android: endpoint de legendas do client web leva HTTP 429 (throttle YouTube 2026)
yt-dlp --skip-download --no-simulate --quiet --no-warnings \
  --extractor-args "youtube:player_client=android" \
  --sleep-subtitles 2 \
  --write-subs --write-auto-subs \
  --sub-langs "$LANGS" --sub-format "vtt" \
  --print-to-file "%(title)s" "$TMP/meta.txt" \
  --print-to-file "%(channel)s" "$TMP/meta.txt" \
  --print-to-file "%(upload_date>%Y-%m-%d)s" "$TMP/meta.txt" \
  --print-to-file "%(duration_string)s" "$TMP/meta.txt" \
  -o "subtitle:$TMP/%(id)s.%(ext)s" \
  "$URL" >/dev/null

# Preferencia de idioma: pt exato > pt-* > en > primeiro que houver
SUB=""
for pat in "${VID}.pt.vtt" "${VID}.pt-"*.vtt "${VID}.en.vtt" "${VID}.en-"*.vtt "${VID}."*.vtt; do
  for f in "$TMP"/$pat; do
    [ -s "$f" ] && { SUB="$f"; break 2; }
  done
done

if [ -z "$SUB" ]; then
  echo "ERRO: video sem legenda disponivel (manual ou auto) em langs=$LANGS" >&2
  echo "Fallback: baixar audio e transcrever local (sistema escuta / whisper)" >&2
  exit 4
fi

SUB_LANG="$(basename "$SUB" .vtt)"; SUB_LANG="${SUB_LANG#"${VID}".}"

TITLE="$(sed -n '1p' "$TMP/meta.txt")"
CHANNEL="$(sed -n '2p' "$TMP/meta.txt")"
DATE="$(sed -n '3p' "$TMP/meta.txt")"
DURATION="$(sed -n '4p' "$TMP/meta.txt")"

{
  echo "# $TITLE"
  echo ""
  echo "- Canal: $CHANNEL"
  echo "- Data: $DATE | Duracao: $DURATION"
  echo "- URL: https://youtu.be/$VID"
  echo "- Legenda: $SUB_LANG"
  echo ""
  echo "---"
  echo ""
  # VTT -> texto: remove header/timestamps/tags, dedupe janela de 2 linhas (rolling das auto-subs)
  sed -E 's/<[^>]+>//g' "$SUB" \
    | grep -vE '^WEBVTT|^Kind:|^Language:|^NOTE|-->' \
    | sed -E 's/^[[:space:]]+|[[:space:]]+$//g' \
    | grep -vE '^$' \
    | awk '$0 != p1 && $0 != p2 { print } { p2 = p1; p1 = $0 }'
} > "$OUT"

echo "$OUT"
