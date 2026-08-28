#!/usr/bin/env bash
# nano-banana.sh — gera/edita imagens via API Gemini (Nano Banana).
#
# Uso:
#   nano-banana.sh -p "prompt" [-o saida.png] [-m flash|pro] [-a 16:9] [-i entrada.png]...
#
# Flags:
#   -p  prompt (obrigatório)
#   -o  arquivo de saída (default: nano-banana-<timestamp>.png no cwd)
#   -m  modelo: flash (default, gemini-2.5-flash-image) | pro (gemini-3-pro-image-preview) | id literal
#   -a  aspect ratio: 1:1, 16:9, 9:16, 4:3, 3:4, 21:9...
#   -i  imagem de entrada para edição/composição (repetível, máx 3)
#
# Chave: GEMINI_API_KEY ou GOOGLE_API_KEY no env; fallback ~/Claude/.env.local e ~/Claude/.env.
# A chave é lida em runtime e nunca impressa.
set -euo pipefail

MODEL_FLASH="gemini-2.5-flash-image"
MODEL_PRO="gemini-3-pro-image-preview"

prompt="" out="" model="$MODEL_FLASH" aspect=""
inputs=()
while getopts "p:o:m:a:i:h" opt; do
  case $opt in
    p) prompt=$OPTARG ;;
    o) out=$OPTARG ;;
    m) case $OPTARG in
         flash) model=$MODEL_FLASH ;;
         pro)   model=$MODEL_PRO ;;
         *)     model=$OPTARG ;;
       esac ;;
    a) aspect=$OPTARG ;;
    i) inputs+=("$OPTARG") ;;
    h) sed -n '2,15p' "$0" | cut -c3-; exit 0 ;;
    *) exit 2 ;;
  esac
done

[[ -n $prompt ]] || { echo "erro: -p \"prompt\" obrigatório (use -h)" >&2; exit 2; }
[[ -n $out ]] || out="nano-banana-$(date +%Y%m%d-%H%M%S).png"
command -v jq >/dev/null || { echo "erro: jq não instalado (brew install jq)" >&2; exit 2; }

api_key="${NANO_BANANA_API_KEY:-${GEMINI_API_KEY:-${GOOGLE_API_KEY:-}}}"
if [[ -z $api_key ]]; then
  for f in "$HOME/.claude/state/nano-banana.env" "$HOME/Claude/.env.local" "$HOME/Claude/.env"; do
    [[ -f $f ]] || continue
    api_key=$(grep -m1 -E '^(NANO_BANANA_API_KEY|GEMINI_API_KEY|GOOGLE_API_KEY)=' "$f" | cut -d= -f2- | tr -d '"' || true)
    [[ -n $api_key ]] && break
  done
fi
[[ -n $api_key ]] || {
  echo "erro: chave não encontrada. Defina NANO_BANANA_API_KEY no env ou em ~/Claude/.env" >&2
  exit 3
}

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT

parts_f="$tmpdir/parts.json"
jq -n --arg t "$prompt" '[{text:$t}]' > "$parts_f"

for img in ${inputs[@]+"${inputs[@]}"}; do
  [[ -f $img ]] || { echo "erro: imagem de entrada não existe: $img" >&2; exit 2; }
  mime=$(file -b --mime-type "$img")
  b64f="$tmpdir/in.b64"
  base64 -i "$img" | tr -d '\n' > "$b64f"
  jq --arg m "$mime" --rawfile d "$b64f" \
    '. + [{inline_data: {mime_type: $m, data: $d}}]' "$parts_f" > "$parts_f.new"
  mv "$parts_f.new" "$parts_f"
done

gen_cfg='{"responseModalities":["TEXT","IMAGE"]}'
[[ -n $aspect ]] && gen_cfg=$(jq --arg a "$aspect" '. + {imageConfig:{aspectRatio:$a}}' <<<"$gen_cfg")

body_f="$tmpdir/body.json"
jq --argjson g "$gen_cfg" '{contents:[{parts:.}],generationConfig:$g}' "$parts_f" > "$body_f"

resp="$tmpdir/resp.json"
http=$(curl -sS -o "$resp" -w '%{http_code}' \
  -H "x-goog-api-key: $api_key" -H 'Content-Type: application/json' \
  -X POST "https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent" \
  -d @"$body_f")

if [[ $http != 200 ]]; then
  echo "erro HTTP $http ($model):" >&2
  jq -r '.error.message // .' "$resp" 2>/dev/null | head -5 >&2
  exit 4
fi

img_b64_f="$tmpdir/out.b64"
jq -j '[.candidates[0].content.parts[]? | select(.inlineData) | .inlineData.data][0] // empty' \
  "$resp" > "$img_b64_f"

if [[ ! -s $img_b64_f ]]; then
  echo "erro: resposta sem imagem. Texto do modelo:" >&2
  jq -r '[.candidates[0].content.parts[]? | select(.text) | .text] | join("\n")' "$resp" | head -10 >&2
  exit 5
fi

base64 --decode -i "$img_b64_f" -o "$out"
txt=$(jq -r '[.candidates[0].content.parts[]? | select(.text) | .text] | join(" ")' "$resp" | head -c 300)
echo "OK: $out ($(du -h "$out" | cut -f1 | tr -d '\t '))"
[[ -n $txt ]] && echo "nota do modelo: $txt" || true
