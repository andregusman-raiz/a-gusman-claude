#!/bin/bash
# Gusman Claude Agent System — Installer
#
# One-line install:
#   curl -fsSL https://raw.githubusercontent.com/andregusman-raiz/a-gusman-claude/main/install.sh | bash
#
# What it does:
#   1. Clones the repo to ~/.gusman-claude/ (the "source of truth")
#   2. Symlinks agents, skills, rules, hooks, shared into your .claude/
#   3. Installs auto-update hook (pulls latest on every Claude Code session start)
#
# Your .claude/ keeps YOUR settings.local.json, projects/, memory — untouched.
# Only agents/skills/rules/hooks/shared come from the repo.
#
# Options:
#   --no-auto-update    Skip auto-update hook installation
#   --dest DIR          Custom .claude directory (default: .claude)
#   --uninstall         Remove symlinks and repo

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

REPO_URL="https://github.com/andregusman-raiz/a-gusman-claude.git"
REPO_DIR="${HOME}/.gusman-claude"
DEST="${DEST:-.claude}"
AUTO_UPDATE=true
UNINSTALL=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --no-auto-update) AUTO_UPDATE=false; shift ;;
    --dest) DEST="$2"; shift 2 ;;
    --uninstall) UNINSTALL=true; shift ;;
    --help|-h)
      echo "Usage: install.sh [--no-auto-update] [--dest .claude] [--uninstall]"
      echo ""
      echo "  --no-auto-update  Don't install the auto-update hook"
      echo "  --dest DIR        Target .claude directory (default: .claude)"
      echo "  --uninstall       Remove all symlinks and the cloned repo"
      exit 0
      ;;
    *) echo -e "${RED}Unknown option: $1${NC}"; exit 1 ;;
  esac
done

# ── Uninstall ──────────────────────────────────────────────────────────────────
if [[ "$UNINSTALL" == true ]]; then
  echo -e "${YELLOW}Uninstalling Gusman Claude Agent System...${NC}"

  SYMLINKS=(agents skills rules hooks Playbooks scripts shared)
  for item in "${SYMLINKS[@]}"; do
    target="${DEST}/${item}"
    if [[ -L "$target" ]]; then
      rm "$target"
      echo -e "${GREEN}  Removed symlink: ${target}${NC}"
    fi
  done

  if [[ -f "${DEST}/hooks/auto-update.sh" ]]; then
    rm "${DEST}/hooks/auto-update.sh"
    echo -e "${GREEN}  Removed auto-update hook${NC}"
  fi

  if [[ -d "$REPO_DIR" ]]; then
    rm -rf "$REPO_DIR"
    echo -e "${GREEN}  Removed repo: ${REPO_DIR}${NC}"
  fi

  echo -e "${GREEN}Uninstall complete.${NC}"
  echo -e "Your settings.local.json, projects/, and memory/ were preserved."
  exit 0
fi

# ── Install ────────────────────────────────────────────────────────────────────
echo -e "${BOLD}${BLUE}Gusman Claude Agent System — Installer${NC}"
echo ""

# Step 1: Clone or update the repo
if [[ -d "$REPO_DIR/.git" ]]; then
  echo -e "${YELLOW}[1/4] Updating existing repo...${NC}"
  cd "$REPO_DIR" && git pull --ff-only origin main 2>/dev/null && cd - >/dev/null
else
  echo -e "${YELLOW}[1/4] Cloning repo to ${REPO_DIR}...${NC}"
  git clone --depth 1 "$REPO_URL" "$REPO_DIR"
fi
echo -e "${GREEN}  Done.${NC}"

# Step 2: Create .claude/ if needed (preserve existing files)
echo -e "${YELLOW}[2/4] Setting up ${DEST}/...${NC}"
mkdir -p "${DEST}"

# Step 3: Create symlinks (skip if target exists and is NOT a symlink)
echo -e "${YELLOW}[3/4] Linking components...${NC}"

SYMLINKS=(agents skills rules hooks Playbooks scripts shared)
LINKED=0
SKIPPED=0

for item in "${SYMLINKS[@]}"; do
  src="${REPO_DIR}/${item}"
  target="${DEST}/${item}"

  if [[ ! -d "$src" ]]; then
    continue
  fi

  if [[ -L "$target" ]]; then
    # Already a symlink — update it
    rm "$target"
    ln -s "$src" "$target"
    echo -e "${GREEN}  Updated: ${item}/ -> repo${NC}"
    ((LINKED++))
  elif [[ -d "$target" ]]; then
    # Real directory exists — don't overwrite, user has custom content
    echo -e "${YELLOW}  Skipped: ${item}/ (exists, not a symlink — rename to ${item}.bak to use repo version)${NC}"
    ((SKIPPED++))
  else
    ln -s "$src" "$target"
    echo -e "${GREEN}  Linked:  ${item}/ -> repo${NC}"
    ((LINKED++))
  fi
done

# Also link hooks.json if not present
if [[ ! -f "${DEST}/hooks.json" ]]; then
  ln -s "${REPO_DIR}/hooks.json" "${DEST}/hooks.json"
  echo -e "${GREEN}  Linked:  hooks.json -> repo${NC}"
elif [[ -L "${DEST}/hooks.json" ]]; then
  rm "${DEST}/hooks.json"
  ln -s "${REPO_DIR}/hooks.json" "${DEST}/hooks.json"
  echo -e "${GREEN}  Updated: hooks.json -> repo${NC}"
fi

echo -e "  ${LINKED} linked, ${SKIPPED} skipped"

# Step 4: Install auto-update hook
if [[ "$AUTO_UPDATE" == true ]]; then
  echo -e "${YELLOW}[4/4] Installing auto-update hook...${NC}"

  cat > "${REPO_DIR}/hooks/auto-update.sh" << 'HOOKEOF'
#!/bin/bash
# Auto-update hook — runs on Claude Code SessionStart
# Pulls latest from a-gusman-claude repo silently
# Installed by install.sh — remove this file to disable

REPO_DIR="${HOME}/.gusman-claude"

if [[ ! -d "$REPO_DIR/.git" ]]; then
  exit 0
fi

# Only pull if last pull was >1 hour ago (avoid hammering GitHub)
MARKER="${REPO_DIR}/.last-pull"
NOW=$(date +%s)
if [[ -f "$MARKER" ]]; then
  LAST=$(cat "$MARKER" 2>/dev/null || echo 0)
  DIFF=$((NOW - LAST))
  if [[ $DIFF -lt 3600 ]]; then
    exit 0
  fi
fi

# Pull in background (don't block session start)
cd "$REPO_DIR" && git pull --ff-only origin main >/dev/null 2>&1 &
echo "$NOW" > "$MARKER"

exit 0
HOOKEOF

  chmod +x "${REPO_DIR}/hooks/auto-update.sh"
  echo -e "${GREEN}  Auto-update hook installed (pulls every ~1h on session start)${NC}"
else
  echo -e "${YELLOW}[4/4] Skipped auto-update hook (--no-auto-update)${NC}"
fi

# ── Summary ────────────────────────────────────────────────────────────────────
echo ""
AGENT_COUNT=$(ls "${REPO_DIR}/agents/"*.md 2>/dev/null | wc -l | tr -d ' ')
SKILL_COUNT=$(ls -d "${REPO_DIR}/skills/"*/ 2>/dev/null | wc -l | tr -d ' ')
RULE_COUNT=$(ls "${REPO_DIR}/rules/"*.md 2>/dev/null | wc -l | tr -d ' ')
PATTERN_COUNT=$(ls "${REPO_DIR}/shared/patterns/"*.md 2>/dev/null | wc -l | tr -d ' ')

echo -e "${GREEN}${BOLD}Installation complete!${NC}"
echo -e ""
echo -e "  ${BOLD}${AGENT_COUNT}${NC} agents  ${BOLD}${SKILL_COUNT}${NC} skills  ${BOLD}${RULE_COUNT}${NC} rules  ${BOLD}${PATTERN_COUNT}${NC} patterns"
echo -e ""
echo -e "  Repo:       ${BLUE}${REPO_DIR}${NC}"
echo -e "  Symlinked:  ${BLUE}${DEST}/{agents,skills,rules,hooks,shared,...}${NC}"
if [[ "$AUTO_UPDATE" == true ]]; then
  echo -e "  Auto-update: ${GREEN}ON${NC} (pulls latest every ~1h)"
fi
echo -e ""
echo -e "${BOLD}Next steps:${NC}"
echo -e "  1. Start Claude Code: ${BLUE}claude${NC}"
echo -e "  2. Try: ${BLUE}/ag-M-00-orquestrar analyze this project${NC}"
echo -e ""
echo -e "${BOLD}Files that are YOURS (never overwritten):${NC}"
echo -e "  ${DEST}/settings.local.json   — your permissions"
echo -e "  ${DEST}/projects/              — your project memory"
echo -e "  CLAUDE.md                      — your project instructions"
echo -e ""
echo -e "To update manually:  ${BLUE}cd ~/.gusman-claude && git pull${NC}"
echo -e "To uninstall:        ${BLUE}bash install.sh --uninstall${NC}"
echo -e ""
echo -e "Docs: ${BLUE}https://github.com/andregusman-raiz/a-gusman-claude${NC}"
