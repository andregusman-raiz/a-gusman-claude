# Claude Code CLI Reference

> Source: https://code.claude.com/docs/en/cli-reference

## CLI Commands

| Command | Description | Example |
|:--|:--|:--|
| `claude` | Start interactive session | `claude` |
| `claude "query"` | Start with initial prompt | `claude "explain this project"` |
| `claude -p "query"` | Query via SDK, then exit | `claude -p "explain this function"` |
| `cat file \| claude -p "query"` | Process piped content | `cat logs.txt \| claude -p "explain"` |
| `claude -c` | Continue most recent conversation | `claude -c` |
| `claude -c -p "query"` | Continue via SDK | `claude -c -p "Check for type errors"` |
| `claude -r "<session>" "query"` | Resume session by ID or name | `claude -r "auth-refactor" "Finish this PR"` |
| `claude update` | Update to latest version | `claude update` |
| `claude auth login` | Sign in (`--email`, `--sso`, `--console`) | `claude auth login --console` |
| `claude auth logout` | Log out | `claude auth logout` |
| `claude auth status` | Auth status as JSON (`--text` for readable) | `claude auth status` |
| `claude agents` | List all configured subagents | `claude agents` |
| `claude mcp` | Configure MCP servers | See MCP docs |
| `claude remote-control` | Start Remote Control server | `claude remote-control --name "My Project"` |

## CLI Flags

| Flag | Description |
|:--|:--|
| `--add-dir` | Add additional working directories |
| `--agent` | Specify agent for session |
| `--agents` | Define custom subagents via JSON |
| `--allow-dangerously-skip-permissions` | Enable permission bypassing as option |
| `--allowedTools` | Tools that execute without prompting |
| `--append-system-prompt` | Append text to default system prompt |
| `--append-system-prompt-file` | Append file contents to system prompt |
| `--betas` | Beta headers for API requests |
| `--channels` | MCP channel notifications to listen for |
| `--chrome` | Enable Chrome browser integration |
| `--continue`, `-c` | Load most recent conversation |
| `--dangerously-load-development-channels` | Enable non-allowlisted channels |
| `--dangerously-skip-permissions` | Skip permission prompts |
| `--debug` | Debug mode with category filtering |
| `--disable-slash-commands` | Disable all skills/commands |
| `--disallowedTools` | Tools removed from model context |
| `--effort` | Set effort level: `low`, `medium`, `high`, `max` |
| `--fallback-model` | Fallback model when overloaded (print mode) |
| `--fork-session` | Create new session ID when resuming |
| `--from-pr` | Resume sessions linked to GitHub PR |
| `--ide` | Auto-connect to IDE |
| `--init` | Run init hooks and start interactive |
| `--init-only` | Run init hooks and exit |
| `--include-partial-messages` | Include partial streaming events |
| `--input-format` | Input format for print mode: `text`, `stream-json` |
| `--json-schema` | Validated JSON output matching schema (print mode) |
| `--maintenance` | Run maintenance hooks and exit |
| `--max-budget-usd` | Maximum dollar spend (print mode) |
| `--max-turns` | Limit agentic turns (print mode) |
| `--mcp-config` | Load MCP servers from JSON files |
| `--model` | Set model for session (alias or full name) |
| `--name`, `-n` | Set display name for session |
| `--no-chrome` | Disable Chrome integration |
| `--no-session-persistence` | Don't save sessions to disk (print mode) |
| `--output-format` | Output format: `text`, `json`, `stream-json` |
| `--permission-mode` | Begin in specified permission mode |
| `--permission-prompt-tool` | MCP tool for permission prompts (non-interactive) |
| `--plugin-dir` | Load plugins from directory |
| `--print`, `-p` | Print response without interactive mode |
| `--remote` | Create web session on claude.ai |
| `--remote-control`, `--rc` | Interactive session with Remote Control |
| `--resume`, `-r` | Resume session by ID or name |
| `--session-id` | Use specific session UUID |
| `--setting-sources` | Setting sources to load: `user,project,local` |
| `--settings` | Path to settings JSON file |
| `--strict-mcp-config` | Only use MCP from `--mcp-config` |
| `--system-prompt` | Replace entire system prompt |
| `--system-prompt-file` | Load system prompt from file |
| `--teleport` | Resume web session in local terminal |
| `--teammate-mode` | Agent team display: `auto`, `in-process`, `tmux` |
| `--tools` | Restrict built-in tools |
| `--verbose` | Enable verbose logging |
| `--version`, `-v` | Output version number |
| `--worktree`, `-w` | Start in isolated git worktree |

## System Prompt Flags

| Flag | Behavior |
|:--|:--|
| `--system-prompt` | Replaces entire default prompt |
| `--system-prompt-file` | Replaces with file contents |
| `--append-system-prompt` | Appends to default prompt |
| `--append-system-prompt-file` | Appends file contents to default prompt |

`--system-prompt` and `--system-prompt-file` are mutually exclusive. Append flags can combine with either.

## Output Formats

### Text (Default)

```bash
cat data.txt | claude -p 'summarize this data' --output-format text > summary.txt
```

### JSON

```bash
cat code.py | claude -p 'analyze this code' --output-format json > analysis.json
```

Returns JSON array of messages with metadata (cost, duration).

### Stream JSON

```bash
cat log.txt | claude -p 'parse this log' --output-format stream-json
```

Real-time JSON objects per conversation turn.

## Session Management

### Resume Sessions

```bash
claude --continue          # Most recent in current directory
claude --resume            # Interactive picker
claude --resume auth-fix   # By name
claude --from-pr 123       # From GitHub PR
```

### Name Sessions

```bash
claude -n auth-refactor                    # At startup
/rename auth-refactor                      # During session
claude --resume auth-refactor              # Resume by name
```

### Session Picker Shortcuts

| Shortcut | Action |
|:--|:--|
| `Up/Down` | Navigate sessions |
| `Right/Left` | Expand/collapse grouped sessions |
| `Enter` | Select and resume |
| `P` | Preview session |
| `R` | Rename session |
| `/` | Search/filter |
| `A` | Toggle current dir / all projects |
| `B` | Filter to current git branch |
| `Esc` | Exit |

## Worktrees

```bash
claude --worktree feature-auth    # Named worktree
claude --worktree                 # Auto-generated name
```

Creates at `<repo>/.claude/worktrees/<name>`. Branch: `worktree-<name>`.

## Extended Thinking

Enabled by default. Configure:

| Scope | How |
|:--|:--|
| Effort level | `/effort`, `/model`, or `CLAUDE_CODE_EFFORT_LEVEL` env var |
| `ultrathink` | Include "ultrathink" in prompt for one-off high effort |
| Toggle | `Option+T` (macOS) / `Alt+T` (Windows/Linux) |
| Global | `/config` to toggle |
| Token limit | `MAX_THINKING_TOKENS` env var |

View thinking: `Ctrl+O` for verbose mode.

## Plan Mode

```bash
claude --permission-mode plan                          # New session
claude --permission-mode plan -p "Analyze auth system" # Headless
```

Toggle during session: `Shift+Tab` (cycles through modes).

## Unix-Style Usage

### As Linter

```json
{
  "scripts": {
    "lint:claude": "claude -p 'you are a linter. look at changes vs main and report issues.'"
  }
}
```

### Pipe In/Out

```bash
cat build-error.txt | claude -p 'explain the root cause' > output.txt
```
