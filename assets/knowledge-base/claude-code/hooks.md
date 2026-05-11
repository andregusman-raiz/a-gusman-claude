# Claude Code Hooks Reference

> Source: https://code.claude.com/docs/en/hooks

## Overview

Hooks are user-defined shell commands, HTTP endpoints, LLM prompts, or agents that execute automatically at specific points in Claude Code's lifecycle. They receive JSON context via stdin/HTTP POST and can control behavior through exit codes and JSON output.

## Hook Lifecycle Events

| Event | When it fires |
|-------|---------------|
| `SessionStart` | When session begins or resumes |
| `UserPromptSubmit` | Before Claude processes user prompt |
| `PreToolUse` | Before tool call executes (can block) |
| `PermissionRequest` | When permission dialog appears |
| `PostToolUse` | After tool call succeeds |
| `PostToolUseFailure` | After tool call fails |
| `Notification` | When Claude Code sends notification |
| `SubagentStart` | When subagent spawned |
| `SubagentStop` | When subagent finishes |
| `Stop` | When Claude finishes responding |
| `StopFailure` | When turn ends due to API error |
| `TeammateIdle` | Agent team teammate going idle |
| `TaskCompleted` | Task being marked completed |
| `InstructionsLoaded` | CLAUDE.md/.claude/rules/*.md loaded |
| `ConfigChange` | Configuration file changes |
| `WorktreeCreate` | Worktree being created |
| `WorktreeRemove` | Worktree being removed |
| `PreCompact` | Before context compaction |
| `PostCompact` | After context compaction |
| `Elicitation` | MCP server requests user input |
| `ElicitationResult` | User responds to MCP elicitation |
| `SessionEnd` | Session terminates |

## Hook Configuration

Hooks are defined in JSON settings files with three-level nesting:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/block-rm.sh"
          }
        ]
      }
    ]
  }
}
```

### Hook Locations & Scope

| Location | Scope | Shareable |
|----------|-------|-----------|
| `~/.claude/settings.json` | All projects | No |
| `.claude/settings.json` | Single project | Yes (commit to repo) |
| `.claude/settings.local.json` | Single project | No (gitignored) |
| Managed policy settings | Organization-wide | Yes (admin-controlled) |
| Plugin `hooks/hooks.json` | When plugin enabled | Yes |
| Skill/agent frontmatter | While component active | Yes |

### Hook Types

1. **Command hooks** (`type: "command"`): Run shell commands, receive JSON on stdin
2. **HTTP hooks** (`type: "http"`): Send JSON via POST request to URL
3. **Prompt hooks** (`type: "prompt"`): Send prompt to Claude for yes/no evaluation
4. **Agent hooks** (`type: "agent"`): Spawn subagent with tool access

### Common Fields (All Hook Types)

```json
{
  "type": "command|http|prompt|agent",
  "timeout": 600,
  "statusMessage": "Custom spinner message",
  "once": false
}
```

### Command Hook Fields

```json
{
  "type": "command",
  "command": "sh script.sh",
  "async": false
}
```

### HTTP Hook Fields

```json
{
  "type": "http",
  "url": "http://localhost:8080/hooks/pre-tool-use",
  "timeout": 30,
  "headers": {
    "Authorization": "Bearer $MY_TOKEN"
  },
  "allowedEnvVars": ["MY_TOKEN"]
}
```

### Prompt/Agent Hook Fields

```json
{
  "type": "prompt|agent",
  "prompt": "Evaluate this: $ARGUMENTS",
  "model": "fast-model"
}
```

## Matcher Patterns

Matchers are regex strings filtering when hooks fire. Use `"*"`, `""`, or omit to match all.

| Event | Matches on | Examples |
|-------|-----------|----------|
| `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest` | tool name | `Bash`, `Edit\|Write`, `mcp__.*` |
| `SessionStart` | session source | `startup`, `resume`, `clear`, `compact` |
| `SessionEnd` | exit reason | `clear`, `resume`, `logout`, `prompt_input_exit`, `bypass_permissions_disabled`, `other` |
| `Notification` | notification type | `permission_prompt`, `idle_prompt`, `auth_success`, `elicitation_dialog` |
| `SubagentStart`, `SubagentStop` | agent type | `Bash`, `Explore`, `Plan`, custom names |
| `PreCompact`, `PostCompact` | compaction trigger | `manual`, `auto` |
| `ConfigChange` | config source | `user_settings`, `project_settings`, `local_settings`, `policy_settings`, `skills` |
| `StopFailure` | error type | `rate_limit`, `authentication_failed`, `billing_error`, `invalid_request`, `server_error`, `max_output_tokens`, `unknown` |
| `InstructionsLoaded` | load reason | `session_start`, `nested_traversal`, `path_glob_match`, `include`, `compact` |
| `Elicitation`, `ElicitationResult` | MCP server name | your configured server names |

### Match MCP Tools

MCP tools follow pattern: `mcp__<server>__<tool>`

Examples:
- `mcp__memory__create_entities`
- `mcp__filesystem__read_file`

Regex patterns:
```json
{ "matcher": "mcp__memory__.*" }
```

## Hook Input and Output

### Common Input Fields

All hooks receive these JSON fields:

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/current/working/directory",
  "permission_mode": "default|plan|acceptEdits|dontAsk|bypassPermissions",
  "hook_event_name": "PreToolUse",
  "agent_id": "agent-xyz",
  "agent_type": "Explore"
}
```

### Exit Codes

| Code | Meaning | Behavior |
|------|---------|----------|
| 0 | Success | Parse stdout for JSON; proceed with action |
| 2 | Blocking error | Ignore stdout, use stderr as error message; block action |
| Other | Non-blocking error | Show stderr in verbose mode; continue execution |

### JSON Output Format

Exit with code 0 and print JSON to stdout:

```json
{
  "continue": true,
  "stopReason": "Reason to stop",
  "suppressOutput": false,
  "systemMessage": "Warning message",
  "decision": "block",
  "reason": "Why blocked",
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow|deny|ask",
    "permissionDecisionReason": "Why",
    "updatedInput": {},
    "additionalContext": "Extra context"
  }
}
```

## Environment Variables

### Available to All Hooks

- `$CLAUDE_PROJECT_DIR`: Project root
- `${CLAUDE_PLUGIN_ROOT}`: Plugin installation directory
- `${CLAUDE_PLUGIN_DATA}`: Plugin persistent data directory
- `$CLAUDE_CODE_REMOTE`: `"true"` in remote environments

### SessionStart: CLAUDE_ENV_FILE

SessionStart hooks can persist environment variables via `CLAUDE_ENV_FILE`:

```bash
#!/bin/bash
if [ -n "$CLAUDE_ENV_FILE" ]; then
  echo 'export NODE_ENV=production' >> "$CLAUDE_ENV_FILE"
fi
exit 0
```

## Major Hook Events Detail

### SessionStart

**Input:**
```json
{
  "hook_event_name": "SessionStart",
  "source": "startup|resume|clear|compact",
  "model": "claude-sonnet-4-6",
  "agent_type": "optional-agent-name"
}
```

### UserPromptSubmit

**Input:**
```json
{
  "hook_event_name": "UserPromptSubmit",
  "prompt": "User's prompt text"
}
```

**Output (block):**
```json
{
  "decision": "block",
  "reason": "Why blocked"
}
```

### PreToolUse

**Matchers:** Tool names: `Bash`, `Edit`, `Write`, `Read`, `Glob`, `Grep`, `Agent`, `WebFetch`, `WebSearch`, MCP tools

**Tool Input Schemas:**
- **Bash:** `command`, `description`, `timeout`, `run_in_background`
- **Write:** `file_path`, `content`
- **Edit:** `file_path`, `old_string`, `new_string`, `replace_all`
- **Read:** `file_path`, `offset`, `limit`
- **Glob:** `pattern`, `path`
- **Grep:** `pattern`, `path`, `glob`, `output_mode`, `-i`, `multiline`
- **WebFetch:** `url`, `prompt`
- **WebSearch:** `query`, `allowed_domains`, `blocked_domains`
- **Agent:** `prompt`, `description`, `subagent_type`, `model`

**Output (allow):**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "permissionDecisionReason": "Reason",
    "updatedInput": { "command": "modified-command" },
    "additionalContext": "Extra context"
  }
}
```

**Output (deny):**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Why denied"
  }
}
```

### PermissionRequest

**Output (allow with updated permissions):**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "allow",
      "updatedInput": { "command": "npm run lint" },
      "updatedPermissions": [
        {
          "type": "addRules",
          "rules": [{ "toolName": "Bash" }],
          "behavior": "allow",
          "destination": "session"
        }
      ]
    }
  }
}
```

**Permission Update Types:** `addRules`, `replaceRules`, `removeRules`, `setMode`, `addDirectories`, `removeDirectories`

**Destinations:** `session`, `localSettings`, `projectSettings`, `userSettings`

### PostToolUse

**Input:**
```json
{
  "hook_event_name": "PostToolUse",
  "tool_name": "Write",
  "tool_input": { "file_path": "/path/to/file.txt", "content": "content" },
  "tool_response": { "filePath": "/path/to/file.txt", "success": true },
  "tool_use_id": "toolu_01ABC123..."
}
```

### Stop

**Output (continue working):**
```json
{
  "decision": "block",
  "reason": "Why Claude should continue"
}
```

### StopFailure

**Matchers:** `rate_limit`, `authentication_failed`, `billing_error`, `invalid_request`, `server_error`, `max_output_tokens`, `unknown`

### TeammateIdle / TaskCompleted

**Output (feedback, continue working):**
```bash
echo "Build artifact missing. Run build first." >&2
exit 2
```

**Output (stop):**
```json
{
  "continue": false,
  "stopReason": "Why stopping"
}
```

### WorktreeCreate

Print absolute path to stdout (only `type: "command"` supported):

```bash
#!/bin/bash
NAME=$(jq -r .name)
DIR="$HOME/.claude/worktrees/$NAME"
svn checkout https://svn.example.com/repo/trunk "$DIR" >&2
echo "$DIR"
```

### WorktreeRemove

```bash
#!/bin/bash
jq -r .worktree_path | xargs rm -rf
```

### SessionEnd

**Default timeout:** 1.5 seconds. Extend with `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS`.

### InstructionsLoaded

**Matchers:** `session_start`, `nested_traversal`, `path_glob_match`, `include`, `compact`

No decision control (observability only).

### Elicitation / ElicitationResult

**Output (accept):**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "Elicitation",
    "action": "accept",
    "content": { "username": "alice" }
  }
}
```

## HTTP Hooks

**Status codes:**
- **2xx with empty body:** success (like exit 0)
- **2xx with plain text:** success, text added as context
- **2xx with JSON:** success, parsed like command hook JSON output
- **Non-2xx:** non-blocking error (continues)
- **Connection failure/timeout:** non-blocking error (continues)

**Environment variable interpolation in headers:**
```json
{
  "headers": { "Authorization": "Bearer $MY_TOKEN" },
  "allowedEnvVars": ["MY_TOKEN"]
}
```

## Prompt Hooks

```json
{
  "type": "prompt",
  "prompt": "Is this safe to execute? $ARGUMENTS",
  "model": "fast-model"
}
```

`$ARGUMENTS` is replaced with the hook input JSON.

## Agent Hooks

```json
{
  "type": "agent",
  "prompt": "Verify this passes requirements: $ARGUMENTS",
  "model": "sonnet"
}
```

## Example: Bash Command Validator

```bash
#!/bin/bash
COMMAND=$(jq -r '.tool_input.command')

if echo "$COMMAND" | grep -qE '(rm -rf|dd|mkfs)'; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "Destructive command detected"
    }
  }'
  exit 0
fi

if echo "$COMMAND" | grep -qE '^(ls|cat|grep|find|npm test)'; then
  exit 0
fi

jq -n '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "ask",
    permissionDecisionReason: "Confirm execution"
  }
}'
```

## Configuration in Skills/Agents Frontmatter

```yaml
---
name: secure-operations
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/security-check.sh"
---
```

## Disable Hooks

```json
{ "disableAllHooks": true }
```

## View Configured Hooks

Type `/hooks` in Claude Code to browse all configured hooks.
