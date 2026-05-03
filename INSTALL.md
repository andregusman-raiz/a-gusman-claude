# Install Guide

Three ways to install **Gusman Claude Agent System** on any machine.
Pick the one that matches what you already have.

---

## Path A — Paste in Claude Code (universal, recommended)

You already have Claude Code or Claude Cowork running? Open it and paste:

```
Install the a-gusman-claude system on this machine:
https://github.com/andregusman-raiz/a-gusman-claude

Steps:
1. Detect the OS (macOS, Linux, WSL, or Windows).
2. Pre-flight dependencies. Install whatever is missing:
   - macOS: Homebrew (install if absent), then git/node@20/gh
   - Linux Debian/Ubuntu/WSL: apt + NodeSource for Node 20
   - Linux Fedora/RHEL: dnf + NodeSource for Node 20
   - Windows: winget (Git.Git, OpenJS.NodeJS.LTS, GitHub.cli)
3. Install Claude Code CLI globally if missing:
   `npm install -g @anthropic-ai/claude-code`
4. Run the official installer for the detected OS:
   - Unix: `curl -fsSL https://raw.githubusercontent.com/andregusman-raiz/a-gusman-claude/main/install.sh | bash`
   - Windows: `irm https://raw.githubusercontent.com/andregusman-raiz/a-gusman-claude/main/install.ps1 | iex`
5. Verify: `~/.gusman-claude/` exists and `~/.claude/agents` is a symlink/junction.
6. Print versions installed and next steps (gh auth login for MCPs).
7. Stop and report if any step needs sudo/admin or a credential I haven't given.
```

Claude detects your OS, installs every missing piece, and reports back.
Works identically in **Claude Code** and **Claude Cowork**.

---

## Path B — Shell one-liner (no Claude Code yet)

### macOS / Linux / WSL

```bash
curl -fsSL https://raw.githubusercontent.com/andregusman-raiz/a-gusman-claude/main/install.sh | bash
```

### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/andregusman-raiz/a-gusman-claude/main/install.ps1 | iex
```

Both installers:

1. Detect the OS and missing dependencies (`git`, `node>=20`, `gh`, Claude Code CLI)
2. **Ask once** before installing them (use `--yes` / `-Yes` to skip the prompt)
3. Install via the OS-native package manager (Homebrew / apt / dnf / winget)
4. Install Claude Code CLI via `npm install -g @anthropic-ai/claude-code`
5. Clone the repo to `~/.gusman-claude/` (or `%USERPROFILE%\.gusman-claude\`)
6. Symlink (or junction on Windows) `agents/skills/rules/hooks/shared` into your `.claude/`
7. Install a SessionStart hook that auto-pulls updates every ~1h

### Flags

| Bash | PowerShell | What it does |
|---|---|---|
| `--skip-deps` | `-SkipDeps` | Don't pre-flight or install deps |
| `--no-auto-update` | `-NoAutoUpdate` | Don't install the auto-update hook |
| `--yes` / `-y` | `-Yes` | Don't prompt before installing deps |
| `--dest DIR` | `-Dest <path>` | Custom `.claude` location |
| `--uninstall` | `-Uninstall` | Remove links and repo |

---

## Path C — Manual (audit before running)

```bash
git clone https://github.com/andregusman-raiz/a-gusman-claude.git ~/.gusman-claude
less ~/.gusman-claude/install.sh   # read it first
bash ~/.gusman-claude/install.sh
```

Windows equivalent:

```powershell
git clone https://github.com/andregusman-raiz/a-gusman-claude.git $HOME\.gusman-claude
notepad $HOME\.gusman-claude\install.ps1
powershell -File $HOME\.gusman-claude\install.ps1
```

---

## Prerequisites by OS

The installers handle these automatically — list is for reference / corp networks where auto-install is blocked.

| Tool | macOS | Debian/Ubuntu/WSL | Fedora/RHEL | Arch | Windows |
|---|---|---|---|---|---|
| git | `brew install git` | `apt install git` | `dnf install git` | `pacman -S git` | `winget install Git.Git` |
| node 20 LTS | `brew install node@20` | NodeSource setup_20.x | NodeSource setup_20.x | `pacman -S nodejs npm` | `winget install OpenJS.NodeJS.LTS` |
| gh CLI | `brew install gh` | NodeSource gh repo | dnf gh-cli repo | `pacman -S github-cli` | `winget install GitHub.cli` |
| Claude Code CLI | `npm i -g @anthropic-ai/claude-code` (any OS) | | | | |

---

## What the installer never touches

These remain 100% yours across reinstalls:

- `~/.claude/settings.local.json` — your permissions
- `~/.claude/projects/` — your per-project memory and session state
- `~/.claude/CLAUDE.md` and any project-level `CLAUDE.md`
- Your shell config, `~/.gitconfig`, env vars

---

## Optional — authenticate MCPs after install

The framework ships with MCP server config but auth is per-user. After install:

```bash
gh auth login                     # GitHub MCP
claude mcp list                   # see all configured MCPs
```

Some MCPs (Supabase, Sentry, Figma, Linear) need API keys you provide via `claude mcp add`.
See the repo's `mcp/` docs for each one.

---

## Updating

The auto-update hook does this for you on each Claude Code session start (throttled to 1h).
Manual update:

```bash
cd ~/.gusman-claude && git pull
```

```powershell
cd $HOME\.gusman-claude; git pull
```

---

## Uninstall

```bash
bash ~/.gusman-claude/install.sh --uninstall
```

```powershell
powershell -File $HOME\.gusman-claude\install.ps1 -Uninstall
```

Removes the symlinks/junctions and the cloned repo. Your `settings.local.json`, `projects/`, and memory stay intact.

---

## Troubleshooting

### "command not found: claude" after install
The Claude Code CLI was installed but your shell hasn't picked up the new PATH.
Open a new terminal, or `source ~/.zshrc` / `source ~/.bashrc`.

### "skipped: agents/ (exists, not a symlink)"
You have a real `agents/` directory in `~/.claude/` from before. Rename it:

```bash
mv ~/.claude/agents ~/.claude/agents.bak
bash ~/.gusman-claude/install.sh
```

### Windows: "junction failed" or "Developer Mode required"
Junctions don't need admin, but they only work for directories. The installer falls back to copying `hooks.json` (single file) if file-symlinks fail. To enable file-symlinks: Settings → System → For developers → Developer Mode = On.

### Linux: "sudo: command not found"
The installer needs `sudo` for `apt`/`dnf`. On systems without it (some containers), pre-install deps as root and re-run with `--skip-deps`.

### corporate proxy blocks GitHub or npm
Set `HTTPS_PROXY` and `HTTP_PROXY` env vars before running the installer. For npm: `npm config set proxy http://your-proxy:port`.

### Behind a firewall — need every URL upfront
The installer hits these:
- `github.com` (clone)
- `raw.githubusercontent.com` (one-liner bootstrap)
- `registry.npmjs.org` (Claude Code CLI)
- `deb.nodesource.com` / `rpm.nodesource.com` (Node 20 on Linux)
- `cli.github.com` (gh CLI)
- `formulae.brew.sh` and `homebrew.org` (macOS)
- `winget.microsoft.com` and CDNs of OpenJS/GitHub (Windows)
