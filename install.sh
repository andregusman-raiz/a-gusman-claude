#!/bin/bash
# Claude Agent System — Installer
# Installs the multi-agent framework for Claude Code
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/andregusman-raiz/a-gusman-claude/main/install.sh | bash
#   # or with options:
#   bash install.sh [--tier starter|standard|full] [--dest .claude]

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Defaults
TIER="${TIER:-full}"
DEST="${DEST:-.claude}"
REPO_URL="https://github.com/andregusman-raiz/a-gusman-claude"
RAW_URL="https://raw.githubusercontent.com/andregusman-raiz/a-gusman-claude/main"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse args
while [[ $# -gt 0 ]]; do
  case $1 in
    --tier) TIER="$2"; shift 2 ;;
    --dest) DEST="$2"; shift 2 ;;
    --help) echo "Usage: install.sh [--tier starter|standard|full] [--dest .claude]"; exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

echo -e "${BLUE}Claude Agent System Installer${NC}"
echo -e "Tier: ${GREEN}$TIER${NC} | Destination: ${GREEN}$DEST${NC}"
echo ""

# Create directory structure
echo -e "${YELLOW}Creating directory structure...${NC}"
mkdir -p "$DEST"/{agents,commands,skills,rules,hooks,Playbooks,scripts}
mkdir -p docs/ai-state

# --- STARTER TIER (always installed) ---
echo -e "${YELLOW}Installing Starter tier (CLAUDE.md + core rules + safety hooks)...${NC}"

# Core files list - these would be downloaded from the repo
STARTER_RULES=(config-protection quality-gate root-cause-debugging gsd incremental-commits)
STARTER_HOOKS=(security-gate secret-scan _env)
STARTER_SKILLS=(ag-00-orquestrar)
STARTER_AGENTS=()
STARTER_COMMANDS=(ag00)

install_file() {
  local src="$1"
  local dst="$2"
  if command -v curl &>/dev/null; then
    curl -fsSL "${RAW_URL}/${src}" -o "${dst}" 2>/dev/null || echo -e "${RED}  Failed: ${src}${NC}"
  elif command -v wget &>/dev/null; then
    wget -q "${RAW_URL}/${src}" -O "${dst}" 2>/dev/null || echo -e "${RED}  Failed: ${src}${NC}"
  fi
}

# Install CLAUDE.md template
install_file "CLAUDE.md" "CLAUDE.md.template"
echo -e "${GREEN}  CLAUDE.md.template${NC}"

# Install starter rules
for rule in "${STARTER_RULES[@]}"; do
  install_file "rules/${rule}.md" "$DEST/rules/${rule}.md"
  echo -e "${GREEN}  rules/${rule}.md${NC}"
done

# Install starter hooks
for hook in "${STARTER_HOOKS[@]}"; do
  install_file "hooks/${hook}.sh" "$DEST/hooks/${hook}.sh"
  chmod +x "$DEST/hooks/${hook}.sh" 2>/dev/null
  echo -e "${GREEN}  hooks/${hook}.sh${NC}"
done

# Install hooks.json
install_file "hooks.json" "$DEST/hooks.json"
echo -e "${GREEN}  hooks.json${NC}"

# Install orchestrator skill
mkdir -p "$DEST/skills/ag-00-orquestrar"
install_file "skills/ag-00-orquestrar/SKILL.md" "$DEST/skills/ag-00-orquestrar/SKILL.md"
echo -e "${GREEN}  skills/ag-00-orquestrar/SKILL.md${NC}"

# Install ag00 command
install_file "commands/ag00.md" "$DEST/commands/ag00.md"
echo -e "${GREEN}  commands/ag00.md${NC}"

INSTALLED=7

if [[ "$TIER" == "starter" ]]; then
  echo ""
  echo -e "${GREEN}Starter tier installed! ($INSTALLED files)${NC}"
  echo -e "Next: Copy CLAUDE.md.template to CLAUDE.md and customize for your project."
  exit 0
fi

# --- STANDARD TIER ---
echo ""
echo -e "${YELLOW}Installing Standard tier (core agents + all rules + all hooks)...${NC}"

# Core agents (16)
STANDARD_AGENTS=(
  ag-01-iniciar-projeto ag-02-setup-ambiente ag-03-explorar-codigo
  ag-04-analisar-contexto ag-05-pesquisar-referencia ag-06-especificar-solucao
  ag-07-planejar-execucao ag-08-construir-codigo ag-09-depurar-erro
  ag-10-refatorar-codigo ag-11-otimizar-codigo ag-12-validar-execucao
  ag-13-testar-codigo ag-14-criticar-projeto ag-15-auditar-codigo
  ag-18-versionar-codigo
)

for agent in "${STANDARD_AGENTS[@]}"; do
  install_file "agents/${agent}.md" "$DEST/agents/${agent}.md"
  # Create corresponding command
  num=$(echo "$agent" | grep -oP 'ag-\K\d+')
  cmd="ag$(echo $num | sed 's/^0*//')"
  install_file "commands/${cmd}.md" "$DEST/commands/${cmd}.md"
  echo -e "${GREEN}  agents/${agent}.md + commands/${cmd}.md${NC}"
done

# Remaining rules
ALL_RULES=($(ls ${SCRIPT_DIR}/rules/*.md 2>/dev/null | xargs -I{} basename {} .md))
for rule in "${ALL_RULES[@]}"; do
  if [[ ! -f "$DEST/rules/${rule}.md" ]]; then
    install_file "rules/${rule}.md" "$DEST/rules/${rule}.md"
    echo -e "${GREEN}  rules/${rule}.md${NC}"
  fi
done

# Remaining hooks
ALL_HOOKS=($(ls ${SCRIPT_DIR}/hooks/*.sh 2>/dev/null | xargs -I{} basename {} .sh))
for hook in "${ALL_HOOKS[@]}"; do
  if [[ ! -f "$DEST/hooks/${hook}.sh" ]]; then
    install_file "hooks/${hook}.sh" "$DEST/hooks/${hook}.sh"
    chmod +x "$DEST/hooks/${hook}.sh" 2>/dev/null
    echo -e "${GREEN}  hooks/${hook}.sh${NC}"
  fi
done

# Pattern skills
PATTERN_SKILLS=(nextjs-react-patterns typescript-patterns supabase-patterns python-patterns)
for skill in "${PATTERN_SKILLS[@]}"; do
  mkdir -p "$DEST/skills/${skill}"
  install_file "skills/${skill}/SKILL.md" "$DEST/skills/${skill}/SKILL.md"
  echo -e "${GREEN}  skills/${skill}/SKILL.md${NC}"
done

INSTALLED=$((INSTALLED + 50))

if [[ "$TIER" == "standard" ]]; then
  echo ""
  echo -e "${GREEN}Standard tier installed! (~$INSTALLED files)${NC}"
  echo -e "Next: Copy CLAUDE.md.template to CLAUDE.md and customize for your project."
  echo -e "Test: Run Claude Code and type /ag00 to invoke the orchestrator."
  exit 0
fi

# --- FULL TIER ---
echo ""
echo -e "${YELLOW}Installing Full tier (all agents + skills + playbooks)...${NC}"

# Remaining agents
ALL_AGENTS=($(ls ${SCRIPT_DIR}/agents/*.md 2>/dev/null | xargs -I{} basename {} .md))
for agent in "${ALL_AGENTS[@]}"; do
  if [[ ! -f "$DEST/agents/${agent}.md" ]]; then
    install_file "agents/${agent}.md" "$DEST/agents/${agent}.md"
    echo -e "${GREEN}  agents/${agent}.md${NC}"
  fi
done

# Remaining commands
ALL_COMMANDS=($(ls ${SCRIPT_DIR}/commands/*.md 2>/dev/null | xargs -I{} basename {} .md))
for cmd in "${ALL_COMMANDS[@]}"; do
  if [[ ! -f "$DEST/commands/${cmd}" ]]; then
    install_file "commands/${cmd}" "$DEST/commands/${cmd}"
    echo -e "${GREEN}  commands/${cmd}${NC}"
  fi
done

# Remaining skills
ALL_SKILLS=($(ls -d ${SCRIPT_DIR}/skills/*/ 2>/dev/null | xargs -I{} basename {}))
for skill in "${ALL_SKILLS[@]}"; do
  if [[ ! -d "$DEST/skills/${skill}" ]]; then
    mkdir -p "$DEST/skills/${skill}"
    # Copy all files in the skill directory
    for f in $(find "${SCRIPT_DIR}/skills/${skill}" -type f); do
      rel=$(echo "$f" | sed "s|${SCRIPT_DIR}/||")
      dst_path="$DEST/skills/${skill}/$(basename $f)"
      install_file "$rel" "$dst_path"
    done
    echo -e "${GREEN}  skills/${skill}/${NC}"
  fi
done

# Playbooks
for pb in ${SCRIPT_DIR}/Playbooks/*.md; do
  name=$(basename "$pb")
  install_file "Playbooks/${name}" "$DEST/Playbooks/${name}"
  echo -e "${GREEN}  Playbooks/${name}${NC}"
done

# Scripts
for sc in ${SCRIPT_DIR}/scripts/*; do
  name=$(basename "$sc")
  install_file "scripts/${name}" "$DEST/scripts/${name}"
  chmod +x "$DEST/scripts/${name}" 2>/dev/null
  echo -e "${GREEN}  scripts/${name}${NC}"
done

# settings.local.json template
install_file "settings.local.json" "$DEST/settings.local.json.template"
echo -e "${GREEN}  settings.local.json.template${NC}"

# State files
echo '{"last_updated":"","agent_active":"","task_description":"","progress":{"completed":[],"in_progress":"","remaining":[]},"files_modified":[],"notes":""}' > docs/ai-state/session-state.json
touch docs/ai-state/errors-log.md
echo -e "${GREEN}  docs/ai-state/ (session state)${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Full tier installed! (180+ files)${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. Copy CLAUDE.md.template to CLAUDE.md and customize"
echo -e "  2. Review settings.local.json.template and merge into your settings"
echo -e "  3. Run Claude Code and type ${BLUE}/ag00 analyze this project${NC}"
echo ""
echo -e "Documentation: ${BLUE}https://github.com/andregusman-raiz/a-gusman-claude${NC}"
