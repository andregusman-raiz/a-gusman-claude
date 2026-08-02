#!/usr/bin/env bash
# Gusman Claude Agent System — Installer (macOS / Linux / WSL)
#
# One-line install:
#   curl -fsSL https://raw.githubusercontent.com/andregusman-raiz/a-gusman-claude/main/install.sh | bash
#
# What it does:
#   1. Detects OS and pre-flights dependencies (git, curl, node>=20, gh, claude CLI)
#   2. Auto-installs missing deps (Homebrew on macOS; apt/dnf on Linux/WSL)
#   3. Clones the repo to ~/.gusman-claude/ (the "source of truth")
#   4. Symlinks agents, skills, rules, hooks, shared into your .claude/
#   5. Installs auto-update hook (pulls latest on every Claude Code session start)
#
# Your .claude/ keeps YOUR settings.local.json, projects/, memory — untouched.
#
# Options:
#   --no-auto-update   Skip auto-update hook installation
#   --skip-deps        Skip dependency pre-flight (assume git/node/claude exist)
#   --yes              Don't ask for confirmation before installing deps
#   --dest DIR         Custom .claude directory (default: ~/.claude)
#   --uninstall        Remove symlinks and repo

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

REPO_URL="https://github.com/andregusman-raiz/a-gusman-claude.git"
REPO_DIR="${HOME}/.gusman-claude"
DEST="${DEST:-${HOME}/.claude}"
AUTO_UPDATE=true
SKIP_DEPS=false
ASSUME_YES=false
UNINSTALL=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --no-auto-update) AUTO_UPDATE=false; shift ;;
    --skip-deps) SKIP_DEPS=true; shift ;;
    --yes|-y) ASSUME_YES=true; shift ;;
    --dest) DEST="$2"; shift 2 ;;
    --uninstall) UNINSTALL=true; shift ;;
    --help|-h)
      sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) echo -e "${RED}Unknown option: $1${NC}"; exit 1 ;;
  esac
done

log()  { echo -e "${BLUE}[install]${NC} $*"; }
ok()   { echo -e "${GREEN}  ✓${NC} $*"; }
warn() { echo -e "${YELLOW}  !${NC} $*"; }
err()  { echo -e "${RED}  ✗${NC} $*" >&2; }

# ── Uninstall ──────────────────────────────────────────────────────────────────
if [[ "$UNINSTALL" == true ]]; then
  log "Uninstalling Gusman Claude Agent System..."

  SYMLINKS=(agents skills rules hooks Playbooks scripts shared)
  for item in "${SYMLINKS[@]}"; do
    target="${DEST}/${item}"
    if [[ -L "$target" ]]; then
      rm "$target"
      ok "removed symlink: ${target}"
    fi
  done

  if [[ -L "${DEST}/hooks.json" ]]; then
    rm "${DEST}/hooks.json"
    ok "removed symlink: hooks.json"
  fi

  if [[ -f "${REPO_DIR}/hooks/auto-update.sh" ]]; then
    rm -f "${REPO_DIR}/hooks/auto-update.sh"
    ok "removed auto-update hook"
  fi

  if [[ -d "$REPO_DIR" ]]; then
    rm -rf "$REPO_DIR"
    ok "removed repo: ${REPO_DIR}"
  fi

  echo -e "${GREEN}Uninstall complete. Your settings.local.json, projects/, and memory/ were preserved.${NC}"
  exit 0
fi

# ── OS detection ───────────────────────────────────────────────────────────────
detect_os() {
  local uname_s
  uname_s="$(uname -s)"
  case "$uname_s" in
    Darwin) OS="macos" ;;
    Linux)
      if grep -qi microsoft /proc/version 2>/dev/null; then
        OS="wsl"
      elif [[ -f /etc/os-release ]]; then
        # shellcheck disable=SC1091
        . /etc/os-release
        case "${ID:-}" in
          ubuntu|debian|linuxmint|pop) OS="debian" ;;
          fedora|rhel|centos|rocky|almalinux) OS="fedora" ;;
          arch|manjaro) OS="arch" ;;
          *) OS="linux-other" ;;
        esac
      else
        OS="linux-other"
      fi
      ;;
    MINGW*|MSYS*|CYGWIN*)
      err "Detected Git Bash / MSYS on Windows."
      err "On Windows native, use the PowerShell installer instead:"
      err "  irm https://raw.githubusercontent.com/andregusman-raiz/a-gusman-claude/main/install.ps1 | iex"
      exit 1
      ;;
    *) OS="unknown" ;;
  esac
}

# ── Dependency check ──────────────────────────────────────────────────────────
need_install=()

needs() {
  command -v "$1" >/dev/null 2>&1 || need_install+=("$1")
}

check_node_version() {
  if ! command -v node >/dev/null 2>&1; then
    need_install+=("node")
    return
  fi
  local major
  major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
  if [[ "$major" -lt 20 ]]; then
    warn "node $(node -v) is older than v20 — will upgrade"
    need_install+=("node")
  fi
}

# ── Dependency install ────────────────────────────────────────────────────────
install_brew_if_missing() {
  if command -v brew >/dev/null 2>&1; then return; fi
  log "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # add brew to PATH for this session
  if [[ -d /opt/homebrew/bin ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  elif [[ -d /usr/local/bin ]]; then
    eval "$(/usr/local/bin/brew shellenv)" 2>/dev/null || true
  fi
}

install_deps() {
  if [[ "${#need_install[@]}" -eq 0 ]]; then
    ok "all dependencies present"
    return
  fi

  log "Missing dependencies: ${need_install[*]}"

  if [[ "$ASSUME_YES" != true ]]; then
    read -r -p "Install them now? [Y/n] " ans
    ans="${ans:-Y}"
    if [[ ! "$ans" =~ ^[Yy] ]]; then
      err "Aborted by user. Re-run with --skip-deps if you want to install only the framework."
      exit 1
    fi
  fi

  case "$OS" in
    macos)
      install_brew_if_missing
      local brew_pkgs=()
      for d in "${need_install[@]}"; do
        case "$d" in
          node) brew_pkgs+=("node@20") ;;
          gh) brew_pkgs+=("gh") ;;
          git) brew_pkgs+=("git") ;;
          curl) brew_pkgs+=("curl") ;;
        esac
      done
      if [[ "${#brew_pkgs[@]}" -gt 0 ]]; then
        brew install "${brew_pkgs[@]}"
      fi
      # link node@20 if installed via versioned formula
      brew link --overwrite --force node@20 2>/dev/null || true
      ;;
    debian|wsl)
      log "Updating apt index (sudo required)..."
      sudo apt-get update -y
      local apt_pkgs=()
      for d in "${need_install[@]}"; do
        case "$d" in
          node)
            log "Installing Node.js 20 LTS via NodeSource..."
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            apt_pkgs+=("nodejs")
            ;;
          gh)
            # GitHub CLI repo
            curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
              | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg >/dev/null
            sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
              | sudo tee /etc/apt/sources.list.d/github-cli.list >/dev/null
            sudo apt-get update -y
            apt_pkgs+=("gh")
            ;;
          git) apt_pkgs+=("git") ;;
          curl) apt_pkgs+=("curl") ;;
        esac
      done
      if [[ "${#apt_pkgs[@]}" -gt 0 ]]; then
        sudo apt-get install -y "${apt_pkgs[@]}"
      fi
      ;;
    fedora)
      local dnf_pkgs=()
      for d in "${need_install[@]}"; do
        case "$d" in
          node)
            curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo -E bash -
            dnf_pkgs+=("nodejs")
            ;;
          gh)
            sudo dnf install -y dnf-plugins-core
            sudo dnf config-manager --add-repo https://cli.github.com/packages/rpm/gh-cli.repo
            dnf_pkgs+=("gh")
            ;;
          git) dnf_pkgs+=("git") ;;
          curl) dnf_pkgs+=("curl") ;;
        esac
      done
      if [[ "${#dnf_pkgs[@]}" -gt 0 ]]; then
        sudo dnf install -y "${dnf_pkgs[@]}"
      fi
      ;;
    arch)
      local pac_pkgs=()
      for d in "${need_install[@]}"; do
        case "$d" in
          node) pac_pkgs+=("nodejs" "npm") ;;
          gh) pac_pkgs+=("github-cli") ;;
          git) pac_pkgs+=("git") ;;
          curl) pac_pkgs+=("curl") ;;
        esac
      done
      if [[ "${#pac_pkgs[@]}" -gt 0 ]]; then
        sudo pacman -S --noconfirm "${pac_pkgs[@]}"
      fi
      ;;
    *)
      err "Automatic dependency install not supported on this distro ($OS)."
      err "Install manually: ${need_install[*]}"
      err "Then re-run with --skip-deps."
      exit 1
      ;;
  esac
}

install_claude_code_if_missing() {
  if command -v claude >/dev/null 2>&1; then
    ok "Claude Code CLI: $(claude --version 2>/dev/null | head -1 || echo 'installed')"
    return
  fi
  log "Installing Claude Code CLI globally..."
  if command -v npm >/dev/null 2>&1; then
    npm install -g @anthropic-ai/claude-code
    ok "Claude Code CLI installed"
  else
    err "npm not found — cannot install Claude Code CLI. Install Node.js first."
    exit 1
  fi
}

# ── Install ────────────────────────────────────────────────────────────────────
echo -e "${BOLD}${BLUE}Gusman Claude Agent System — Installer${NC}"
echo ""

detect_os
log "Detected OS: ${BOLD}${OS}${NC}"

if [[ "$SKIP_DEPS" == true ]]; then
  log "Skipping dependency pre-flight (--skip-deps)"
else
  log "Checking dependencies..."
  needs git
  needs curl
  needs gh
  check_node_version
  install_deps
  install_claude_code_if_missing
fi

# Step 1: Clone or update the repo
log "[1/4] Setting up repo at ${REPO_DIR}"
if [[ -d "$REPO_DIR/.git" ]]; then
  cd "$REPO_DIR" && git pull --ff-only origin main 2>/dev/null && cd - >/dev/null
  ok "repo updated"
else
  git clone --depth 1 "$REPO_URL" "$REPO_DIR"
  ok "repo cloned"
fi

# Step 2: Create .claude/ if needed (preserve existing files)
log "[2/4] Setting up ${DEST}/"
mkdir -p "${DEST}"

# Step 3: Create symlinks (skip if target exists and is NOT a symlink)
log "[3/4] Linking components"

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
    rm "$target"
    ln -s "$src" "$target"
    ok "updated: ${item}/ -> repo"
    LINKED=$((LINKED + 1))
  elif [[ -d "$target" ]]; then
    warn "skipped: ${item}/ (exists, not a symlink — rename to ${item}.bak to use repo version)"
    SKIPPED=$((SKIPPED + 1))
  else
    ln -s "$src" "$target"
    ok "linked:  ${item}/ -> repo"
    LINKED=$((LINKED + 1))
  fi
done

# Also link hooks.json if not present
if [[ ! -e "${DEST}/hooks.json" ]]; then
  ln -s "${REPO_DIR}/hooks.json" "${DEST}/hooks.json"
  ok "linked:  hooks.json -> repo"
elif [[ -L "${DEST}/hooks.json" ]]; then
  rm "${DEST}/hooks.json"
  ln -s "${REPO_DIR}/hooks.json" "${DEST}/hooks.json"
  ok "updated: hooks.json -> repo"
fi

echo "  ${LINKED} linked, ${SKIPPED} skipped"

# Step 4: Install auto-update hook
if [[ "$AUTO_UPDATE" == true ]]; then
  log "[4/4] Installing auto-update hook"

  cat > "${REPO_DIR}/hooks/auto-update.sh" << 'HOOKEOF'
#!/usr/bin/env bash
# Auto-update hook — runs on Claude Code SessionStart
# Pulls latest from a-gusman-claude repo silently. Throttled to 1h.
# Installed by install.sh — remove this file to disable.

REPO_DIR="${HOME}/.gusman-claude"
[[ -d "$REPO_DIR/.git" ]] || exit 0

MARKER="${REPO_DIR}/.last-pull"
NOW=$(date +%s)
if [[ -f "$MARKER" ]]; then
  LAST=$(cat "$MARKER" 2>/dev/null || echo 0)
  DIFF=$((NOW - LAST))
  [[ $DIFF -lt 3600 ]] && exit 0
fi

(cd "$REPO_DIR" && git pull --ff-only origin main >/dev/null 2>&1) &
echo "$NOW" > "$MARKER"
exit 0
HOOKEOF

  chmod +x "${REPO_DIR}/hooks/auto-update.sh"
  ok "auto-update hook installed (~1h throttle)"
else
  log "[4/4] Skipped auto-update hook (--no-auto-update)"
fi

# ── Summary ────────────────────────────────────────────────────────────────────
echo ""
# Note: pipefail is on, and ls returns non-zero when the glob has no match.
# Wrap each in a subshell that always exits 0 so the count is just "0" instead of aborting.
count_glob() {
  local pattern="$1"
  ( ls $pattern 2>/dev/null || true ) | wc -l | tr -d ' '
}
AGENT_COUNT=$(count_glob "${REPO_DIR}/agents/*.md")
SKILL_COUNT=$(count_glob "${REPO_DIR}/skills/*/")
RULE_COUNT=$(count_glob "${REPO_DIR}/rules/*.md")
PATTERN_COUNT=$(count_glob "${REPO_DIR}/shared/patterns/*.md")

echo -e "${GREEN}${BOLD}Installation complete!${NC}"
echo ""
echo -e "  ${BOLD}${AGENT_COUNT}${NC} agents  ${BOLD}${SKILL_COUNT}${NC} skills  ${BOLD}${RULE_COUNT}${NC} rules  ${BOLD}${PATTERN_COUNT}${NC} patterns"
echo ""
echo -e "  Repo:       ${BLUE}${REPO_DIR}${NC}"
echo -e "  Symlinked:  ${BLUE}${DEST}/{agents,skills,rules,hooks,shared,...}${NC}"
[[ "$AUTO_UPDATE" == true ]] && echo -e "  Auto-update: ${GREEN}ON${NC} (pulls latest every ~1h)"
echo ""
echo -e "${BOLD}Next steps:${NC}"
echo -e "  1. Start Claude Code: ${BLUE}claude${NC}"
echo -e "  2. Try: ${BLUE}/ag-0-orquestrador analyze this project${NC}"
echo ""
echo -e "${BOLD}Optional — authenticate MCPs:${NC}"
echo -e "  ${BLUE}gh auth login${NC}                  # GitHub"
echo -e "  ${BLUE}claude mcp list${NC}                # see all configured MCPs"
echo ""
echo -e "Files that are YOURS (never overwritten): ${DEST}/settings.local.json, ${DEST}/projects/, CLAUDE.md"
echo ""
echo -e "Update manually:  ${BLUE}cd ~/.gusman-claude && git pull${NC}"
echo -e "Uninstall:        ${BLUE}bash ~/.gusman-claude/install.sh --uninstall${NC}"
echo ""
echo -e "Docs: ${BLUE}https://github.com/andregusman-raiz/a-gusman-claude${NC}"
