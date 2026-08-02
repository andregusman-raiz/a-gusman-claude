# Install Prompt — copy/paste into Claude Code or Cowork

Open Claude Code (or Claude Cowork) and paste the block below verbatim.
Claude will detect your OS, install missing dependencies, and run the framework installer.

---

```
Install the a-gusman-claude system on this machine:
https://github.com/andregusman-raiz/a-gusman-claude

Steps:
1. Detect the OS (macOS, Linux, WSL, or Windows native).
2. Pre-flight dependencies. Install whatever is missing using the OS-native
   package manager:
   - macOS: install Homebrew if absent, then: git, node@20, gh
   - Linux Debian/Ubuntu/WSL: apt + NodeSource setup_20.x for Node 20
   - Linux Fedora/RHEL: dnf + NodeSource setup_20.x for Node 20
   - Linux Arch: pacman (nodejs npm github-cli)
   - Windows: winget (Git.Git, OpenJS.NodeJS.LTS, GitHub.cli)
3. Install Claude Code CLI globally if missing:
   `npm install -g @anthropic-ai/claude-code`
4. Run the official framework installer for the detected OS:
   - Unix:    curl -fsSL https://raw.githubusercontent.com/andregusman-raiz/a-gusman-claude/main/install.sh | bash -s -- --yes
   - Windows: irm https://raw.githubusercontent.com/andregusman-raiz/a-gusman-claude/main/install.ps1 | iex
5. Verify install:
   - `~/.gusman-claude/` exists and is a git repo
   - `~/.claude/agents` is a symlink (Unix) or junction (Windows)
6. Print a summary: versions installed, where the repo lives, next steps.
7. Suggest (don't run) the optional MCP auth commands:
   - `gh auth login`
   - `claude mcp list`
8. STOP and report if any step needs sudo/admin rights, a credential I haven't
   given you, or hits a network/proxy error. Do not silently retry.

Constraints:
- Don't modify my settings.local.json, projects/, or any existing CLAUDE.md.
- Don't change my shell config beyond what the package managers do themselves.
- Use --yes / -Yes flags so the installer doesn't prompt mid-flight.
```

---

## Why this works in any Claude Code session

- The prompt is OS-agnostic — Claude figures out the right path for each step.
- Both installers (`install.sh`, `install.ps1`) are idempotent — safe to run multiple times.
- The `--yes` / `-Yes` flag skips the interactive confirmation, which matters because Claude Code piped stdin can't answer prompts.
- If a step fails (no sudo, blocked network, missing winget), Claude reports back instead of silently breaking.

## Variants

### Minimal install (skip dep auto-install)

If you're behind corp policy and prefer to install deps manually:

```
Install a-gusman-claude with --skip-deps:
curl -fsSL https://raw.githubusercontent.com/andregusman-raiz/a-gusman-claude/main/install.sh | bash -s -- --skip-deps

Before running, ensure git, node>=20, npm, and gh are on PATH.
```

### Without auto-update hook

```
Install a-gusman-claude with --no-auto-update so it never pulls automatically.
I'll update manually with `cd ~/.gusman-claude && git pull` when I want to.
```
