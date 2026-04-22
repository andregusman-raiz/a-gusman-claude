#!/usr/bin/env bash
# Claude Code Launcher — selecionar modelo/configuracao via fzf
# Uso: claude-launcher ou cmux (alias)

set -euo pipefail

# ── Cores ──
BOLD='\033[1m'
DIM='\033[2m'
CYAN='\033[36m'
GREEN='\033[32m'
YELLOW='\033[33m'
MAGENTA='\033[35m'
RESET='\033[0m'

# ── Modelos disponiveis ──
# Formato: "LABEL|COMANDO|DESCRICAO"
MODELS=(
  "Claude Opus (cloud)|claude --dangerously-skip-permissions|Modelo mais capaz, raciocinio complexo"
  "Claude Sonnet (cloud)|claude --dangerously-skip-permissions --model sonnet|Rapido, bom para implementacao"
  "Claude Haiku (cloud)|claude --dangerously-skip-permissions --model haiku|Ultra-rapido, exploracoes simples"
  "Qwen 2.5 Coder 32B (local)|ANTHROPIC_BASE_URL=http://localhost:11434 ANTHROPIC_AUTH_TOKEN=ollama claude --dangerously-skip-permissions|Modelo local via Ollama, privacidade total"
  "Claude Opus + Fast Mode|claude --dangerously-skip-permissions --fast|Opus com output mais rapido"
)

# ── Verificar se Ollama esta rodando (para modelos locais) ──
check_ollama() {
  if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "on"
  else
    echo "off"
  fi
}

# ── Verificar modelos Ollama instalados ──
get_ollama_models() {
  if [[ "$(check_ollama)" == "on" ]]; then
    curl -s http://localhost:11434/api/tags | python3 -c "
import sys, json
data = json.load(sys.stdin)
for m in data.get('models', []):
    name = m['name']
    size_gb = m.get('size', 0) / 1e9
    print(f'{name} ({size_gb:.1f}GB)')
" 2>/dev/null || echo "erro ao listar"
  else
    echo "ollama offline"
  fi
}

# ── Adicionar modelos Ollama dinamicamente ──
add_ollama_models() {
  if [[ "$(check_ollama)" == "on" ]]; then
    local models_json
    models_json=$(curl -s http://localhost:11434/api/tags 2>/dev/null)
    if [[ -n "$models_json" ]]; then
      while IFS= read -r model_name; do
        # Evitar duplicar o qwen2.5-coder:32b que ja esta hardcoded
        if [[ "$model_name" != "qwen2.5-coder:32b" ]]; then
          local size
          size=$(echo "$models_json" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for m in data.get('models', []):
    if m['name'] == '$model_name':
        print(f'{m.get(\"size\", 0) / 1e9:.1f}GB')
        break
" 2>/dev/null || echo "?GB")
          MODELS+=("$model_name (local)|ANTHROPIC_BASE_URL=http://localhost:11434 ANTHROPIC_AUTH_TOKEN=ollama claude --model $model_name|Ollama local, $size")
        fi
      done < <(echo "$models_json" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for m in data.get('models', []):
    print(m['name'])
" 2>/dev/null)
    fi
  fi
}

# ── Header ──
show_header() {
  echo ""
  echo -e "${BOLD}${CYAN}  Claude Code Launcher${RESET}"
  echo -e "${DIM}  ─────────────────────────────────${RESET}"

  local ollama_status
  ollama_status=$(check_ollama)
  if [[ "$ollama_status" == "on" ]]; then
    local ollama_models
    ollama_models=$(get_ollama_models)
    echo -e "  ${GREEN}Ollama: online${RESET} ${DIM}($ollama_models)${RESET}"
  else
    echo -e "  ${YELLOW}Ollama: offline${RESET} ${DIM}(rodar: ollama serve)${RESET}"
  fi
  echo ""
}

# ── Construir lista para fzf ──
build_menu() {
  local i=0
  for entry in "${MODELS[@]}"; do
    local label desc
    label=$(echo "$entry" | cut -d'|' -f1)
    desc=$(echo "$entry" | cut -d'|' -f3)

    # Icone por tipo
    local icon
    if [[ "$label" == *"local"* ]]; then
      icon="LOCAL"
    elif [[ "$label" == *"Opus"* ]]; then
      icon="OPUS"
    elif [[ "$label" == *"Sonnet"* ]]; then
      icon="SONNET"
    elif [[ "$label" == *"Haiku"* ]]; then
      icon="HAIKU"
    else
      icon="MODEL"
    fi

    printf "[%s] %-35s %s\n" "$icon" "$label" "$desc"
    ((i++))
  done
}

# ── Main ──
main() {
  # Adicionar modelos Ollama dinamicos
  add_ollama_models

  show_header

  local selection
  selection=$(build_menu | fzf \
    --height=40% \
    --layout=reverse \
    --border=rounded \
    --prompt="  Modelo > " \
    --header="  esc=cancelar  enter=selecionar" \
    --header-first \
    --ansi \
    --no-mouse \
    --color="fg:#cdd6f4,bg:#1e1e2e,hl:#f38ba8,fg+:#cdd6f4,bg+:#45475a,hl+:#f38ba8,info:#cba6f7,prompt:#94e2d5,pointer:#f5e0dc,marker:#f5e0dc,spinner:#f5e0dc,header:#6c7086,border:#585b70" \
  ) || { echo -e "\n${DIM}Cancelado.${RESET}"; exit 0; }

  # Extrair label da selecao
  local selected_label
  selected_label=$(echo "$selection" | sed 's/^\[[A-Z]*\] *//' | sed 's/ *[^ ].*$//' | xargs)
  # Match mais robusto: pegar tudo entre ] e a descricao
  selected_label=$(echo "$selection" | sed 's/^\[[^]]*\] *//' | sed 's/  \+.*//')

  # Encontrar o comando correspondente
  local cmd=""
  for entry in "${MODELS[@]}"; do
    local label
    label=$(echo "$entry" | cut -d'|' -f1)
    if [[ "$selected_label" == "$label" ]]; then
      cmd=$(echo "$entry" | cut -d'|' -f2)
      break
    fi
  done

  if [[ -z "$cmd" ]]; then
    echo -e "${YELLOW}Modelo nao encontrado. Iniciando Claude padrao...${RESET}"
    cmd="claude"
  fi

  echo ""
  echo -e "${GREEN}Iniciando:${RESET} ${BOLD}$selected_label${RESET}"
  echo -e "${DIM}Comando: $cmd${RESET}"
  echo ""

  # Executar (eval para suportar env vars inline)
  eval "$cmd"
}

main "$@"
