# Claude Code Sub-Agents & Agent Teams

> Source: https://code.claude.com/docs/en/sub-agents

## Overview

Subagents are specialized AI assistants that handle specific types of tasks. Each runs in its own context window with a custom system prompt, specific tool access, and independent permissions. Claude delegates tasks based on subagent descriptions.

## Built-in Subagents

### Explore
- **Model**: Haiku (fast, low-latency)
- **Tools**: Read-only (no Write/Edit)
- **Purpose**: File discovery, code search, codebase exploration
- **Thoroughness levels**: quick, medium, very thorough

### Plan
- **Model**: Inherits from main conversation
- **Tools**: Read-only
- **Purpose**: Codebase research for planning mode

### General-purpose
- **Model**: Inherits
- **Tools**: All tools
- **Purpose**: Complex research, multi-step operations, code modifications

### Other Built-in Agents

| Agent | Model | Purpose |
|:--|:--|:--|
| Bash | Inherits | Terminal commands in separate context |
| statusline-setup | Sonnet | Configure status line via `/statusline` |
| Claude Code Guide | Haiku | Answer questions about Claude Code features |

## Creating Subagents

### Using /agents Command

```text
/agents
```

Create, view, edit, or delete subagents interactively.

### Subagent File Format

Markdown files with YAML frontmatter:

```markdown
---
name: code-reviewer
description: Reviews code for quality and best practices
tools: Read, Glob, Grep
model: sonnet
---

You are a code reviewer. Analyze code and provide specific, actionable feedback.
```

### Subagent Scope & Priority

| Location | Scope | Priority |
|:--|:--|:--|
| `--agents` CLI flag | Current session | 1 (highest) |
| `.claude/agents/` | Current project | 2 |
| `~/.claude/agents/` | All your projects | 3 |
| Plugin's `agents/` directory | Where plugin enabled | 4 (lowest) |

### CLI-Defined Subagents

```bash
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer.",
    "prompt": "You are a senior code reviewer.",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  }
}'
```

## Frontmatter Fields

| Field | Required | Description |
|:--|:--|:--|
| `name` | Yes | Unique identifier (lowercase, hyphens) |
| `description` | Yes | When Claude should delegate |
| `tools` | No | Tools the subagent can use (inherits all if omitted) |
| `disallowedTools` | No | Tools to deny |
| `model` | No | `sonnet`, `opus`, `haiku`, full model ID, or `inherit` (default) |
| `permissionMode` | No | `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan` |
| `maxTurns` | No | Maximum agentic turns |
| `skills` | No | Skills to load at startup |
| `mcpServers` | No | MCP servers for this subagent |
| `hooks` | No | Lifecycle hooks scoped to subagent |
| `memory` | No | Persistent memory: `user`, `project`, `local` |
| `background` | No | Always run as background task (default: false) |
| `effort` | No | Effort level: `low`, `medium`, `high`, `max` |
| `isolation` | No | `worktree` for isolated git worktree |

## Controlling Capabilities

### Tool Access

```yaml
---
name: safe-researcher
tools: Read, Grep, Glob, Bash
---
```

Or use denylist:

```yaml
---
name: no-writes
disallowedTools: Write, Edit
---
```

### Restrict Spawnable Subagents

```yaml
---
name: coordinator
tools: Agent(worker, researcher), Read, Bash
---
```

### Scope MCP Servers to Subagent

```yaml
---
name: browser-tester
mcpServers:
  - playwright:
      type: stdio
      command: npx
      args: ["-y", "@playwright/mcp@latest"]
  - github
---
```

### Permission Modes

| Mode | Behavior |
|:--|:--|
| `default` | Standard permission checking |
| `acceptEdits` | Auto-accept file edits |
| `dontAsk` | Auto-deny prompts (allowed tools still work) |
| `bypassPermissions` | Skip permission prompts |
| `plan` | Plan mode (read-only) |

### Preload Skills

```yaml
---
name: api-developer
skills:
  - api-conventions
  - error-handling-patterns
---
```

### Persistent Memory

```yaml
---
name: code-reviewer
memory: user
---
```

| Scope | Location |
|:--|:--|
| `user` | `~/.claude/agent-memory/<name>/` |
| `project` | `.claude/agent-memory/<name>/` |
| `local` | `.claude/agent-memory-local/<name>/` |

### Hooks in Subagent Frontmatter

```yaml
---
name: code-reviewer
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-command.sh"
  PostToolUse:
    - matcher: "Edit|Write"
      hooks:
        - type: command
          command: "./scripts/run-linter.sh"
---
```

### Disable Specific Subagents

```json
{
  "permissions": {
    "deny": ["Agent(Explore)", "Agent(my-custom-agent)"]
  }
}
```

## Invoking Subagents

### Natural Language

```text
Use the test-runner subagent to fix failing tests
```

### @-Mention (Guaranteed)

```text
@"code-reviewer (agent)" look at the auth changes
```

### Session-Wide (--agent)

```bash
claude --agent code-reviewer
```

Or in settings:
```json
{ "agent": "code-reviewer" }
```

## Foreground vs Background

- **Foreground**: Blocks main conversation. Permission prompts pass through.
- **Background**: Concurrent. Permissions pre-approved upfront. Clarifying questions fail silently.

Press **Ctrl+B** to background a running task.

Disable: `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1`

## Common Patterns

### Isolate High-Volume Operations

```text
Use a subagent to run the test suite and report only failing tests
```

### Parallel Research

```text
Research the authentication, database, and API modules in parallel using separate subagents
```

### Chain Subagents

```text
Use the code-reviewer to find performance issues, then use the optimizer to fix them
```

## Resuming Subagents

Subagents retain full conversation history when resumed. Claude uses `SendMessage` with agent ID.

```text
Continue that code review and now analyze the authorization logic
```

### Auto-Compaction

Subagents auto-compact at ~95% capacity. Configure with `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`.

## Example Subagents

### Code Reviewer (Read-Only)

```markdown
---
name: code-reviewer
description: Expert code review specialist. Use immediately after writing code.
tools: Read, Grep, Glob, Bash
model: inherit
---

Review checklist:
- Code clarity, naming, duplication
- Error handling, security, input validation
- Test coverage, performance
```

### Debugger

```markdown
---
name: debugger
description: Debugging specialist for errors and test failures.
tools: Read, Edit, Bash, Grep, Glob
---

Process: capture error -> identify reproduction -> isolate failure -> fix -> verify
```

### Database Query Validator

```markdown
---
name: db-reader
description: Execute read-only database queries.
tools: Bash
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-readonly-query.sh"
---
```

## Agent Teams

For multiple agents working in parallel and communicating with each other, use agent teams instead of subagents. Agent teams coordinate across separate sessions.

Configure with:
- `--teammate-mode`: `auto`, `in-process`, or `tmux`
- `TeammateIdle` and `TaskCompleted` hooks for coordination

See separate agent teams documentation for full details.
