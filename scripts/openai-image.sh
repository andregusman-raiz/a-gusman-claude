#!/usr/bin/env bash
# openai-image.sh — gera/edita imagens via OpenAI API (gpt-image-1).
#
# Uso:
#   openai-image.sh -p "prompt" [-o saida.png] [-m gpt-image-1] [-s 1024x1024] [-q low|medium|high] [-i entrada.png]...
#
# Flags:
#   -p  prompt (obrigatório)
#   -o  arquivo de saída (default: openai-image-<timestamp>.png no cwd)
#   -m  modelo (default: gpt-image-1)
#   -s  tamanho: 1024x1024 (default), 1536x1024, 1024x1536, auto
#   -q  qualidade: low | medium (default) | high
#   -i  imagem de entrada para edição (repetível; usa endpoint /images/edits)
#
# Chave: OPENAI_API_KEY no env; fallback ~/.claude/state/openai-image.env e ~/Claude/.env.
# A chave é lida em runtime e nunca impressa.
set -euo pipefail

prompt="" out="" model="gpt-image-1" size="1024x1024" quality="medium"
inputs=()
while getopts "p:o:m:s:q:i:h" opt; do
  case $opt in
    p) prompt=$OPTARG ;;
    o) out=$OPTARG ;;
    m) model=$OPTARG ;;
    s) size=$OPTARG ;;
    q) quality=$OPTARG ;;
    i) inputs+=("$OPTARG") ;;
    h) sed -n '2,16p' "$0" | cut -c3-; exit 0 ;;
    *) exit 2 ;;
  esac
done

[[ -n $prompt ]] || { echo "erro: -p \"prompt\" obrigatório (use -h)" >&2; exit 2; }
[[ -n $out ]] || out="openai-image-$(date +%Y%m%d-%H%M%S).png"
command -v jq >/dev/null || { echo "erro: jq não instalado (brew install jq)" >&2; exit 2; }

api_key="${OPENAI_API_KEY:-}"
if [[ -z $api_key ]]; then
  for f in "$HOME/.claude/state/openai-image.env" "$HOME/Claude/.env.local" "$HOME/Claude/.env"; do
    [[ -f $f ]] || continue
    api_key=$(grep -m1 -E '^OPENAI_API_KEY=' "$f" | cut -d= -f2- | tr -d '"' || true)
    [[ -n $api_key ]] && break
  done
fi
[[ -n $api_key ]] || {
  echo "erro: chave não encontrada. Defina OPENAI_API_KEY no env ou em ~/.claude/state/openai-image.env" >&2
  exit 3
}

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT
resp="$tmpdir/resp.json"

if [[ ${#inputs[@]} -gt 0 ]]; then
  form_args=(-F "model=$model" -F "prompt=$prompt" -F "size=$size" -F "quality=$quality")
  for img in "${inputs[@]}"; do
    [[ -f $img ]] || { echo "erro: imagem de entrada não existe: $img" >&2; exit 2; }
    form_args+=(-F "image[]=@$img")
  done
  http=$(curl -sS -o "$resp" -w '%{http_code}' \
    -H "Authorization: Bearer $api_key" \
    "https://api.openai.com/v1/images/edits" "${form_args[@]}")
else
  body=$(jq -n --arg m "$model" --arg p "$prompt" --arg s "$size" --arg q "$quality" \
    '{model:$m, prompt:$p, size:$s, quality:$q}')
  http=$(curl -sS -o "$resp" -w '%{http_code}' \
    -H "Authorization: Bearer $api_key" -H 'Content-Type: application/json' \
    -X POST "https://api.openai.com/v1/images/generations" -d "$body")
fi

if [[ $http != 200 ]]; then
  echo "erro HTTP $http ($model):" >&2
  jq -r '.error.message // .' "$resp" 2>/dev/null | head -5 >&2
  exit 4
fi

img_b64_f="$tmpdir/out.b64"
jq -j '.data[0].b64_json // empty' "$resp" > "$img_b64_f"
[[ -s $img_b64_f ]] || { echo "erro: resposta sem imagem" >&2; jq -c 'del(.data)' "$resp" | head -c 300 >&2; exit 5; }

base64 --decode -i "$img_b64_f" -o "$out"
echo "OK: $out ($(du -h "$out" | cut -f1 | tr -d '\t '))"
