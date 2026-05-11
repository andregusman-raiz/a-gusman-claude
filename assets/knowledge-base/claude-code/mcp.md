# Claude Code MCP (Model Context Protocol)

> Source: https://code.claude.com/docs/en/mcp

## Overview

Claude Code connects to external tools and data sources through the Model Context Protocol (MCP). MCP servers give Claude access to tools, databases, and APIs.

## What You Can Do

- Implement features from issue trackers (JIRA, GitHub)
- Analyze monitoring data (Sentry, Statsig)
- Query databases (PostgreSQL, etc.)
- Integrate designs (Figma)
- Automate workflows (Gmail, Slack)
- React to external events via channels

## Installing MCP Servers

### Option 1: Remote HTTP Server (Recommended)

```bash
claude mcp add --transport http <name> <url>

# Example: Connect to Notion
claude mcp add --transport http notion https://mcp.notion.com/mcp

# With Bearer token
claude mcp add --transport http secure-api https://api.example.com/mcp \
  --header "Authorization: Bearer your-token"
```

### Option 2: Remote SSE Server (Deprecated)

```bash
claude mcp add --transport sse <name> <url>

# With auth header
claude mcp add --transport sse private-api https://api.company.com/sse \
  --header "X-API-Key: your-key-here"
```

### Option 3: Local stdio Server

```bash
claude mcp add [options] <name> -- <command> [args...]

# Example: Airtable
claude mcp add --transport stdio --env AIRTABLE_API_KEY=YOUR_KEY airtable \
  -- npx -y airtable-mcp-server
```

**Important:** All options (`--transport`, `--env`, `--scope`, `--header`) must come BEFORE the server name. `--` separates name from command.

## Managing Servers

```bash
claude mcp list          # List all configured servers
claude mcp get github    # Details for specific server
claude mcp remove github # Remove a server
/mcp                     # Check status within Claude Code
```

## MCP Scopes

### Local Scope (Default)

Stored in `~/.claude.json` under project path. Private to you, current project only.

```bash
claude mcp add --transport http stripe https://mcp.stripe.com
claude mcp add --transport http stripe --scope local https://mcp.stripe.com
```

### Project Scope

Stored in `.mcp.json` at project root. Shared via version control.

```bash
claude mcp add --transport http paypal --scope project https://mcp.paypal.com/mcp
```

`.mcp.json` format:

```json
{
  "mcpServers": {
    "shared-server": {
      "command": "/path/to/server",
      "args": [],
      "env": {}
    }
  }
}
```

### User Scope

Stored in `~/.claude.json`. Available across all projects.

```bash
claude mcp add --transport http hubspot --scope user https://mcp.hubspot.com/anthropic
```

### Scope Precedence

Local > Project > User (local wins when same name exists at multiple scopes)

## Environment Variable Expansion in .mcp.json

**Syntax:**
- `${VAR}` - Expands to value
- `${VAR:-default}` - Value or default

**Supported in:** `command`, `args`, `env`, `url`, `headers`

```json
{
  "mcpServers": {
    "api-server": {
      "type": "http",
      "url": "${API_BASE_URL:-https://api.example.com}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

## Plugin-Provided MCP Servers

Plugins can bundle MCP servers in `.mcp.json` at plugin root or inline in `plugin.json`:

```json
{
  "database-tools": {
    "command": "${CLAUDE_PLUGIN_ROOT}/servers/db-server",
    "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"],
    "env": { "DB_URL": "${DB_URL}" }
  }
}
```

- **Automatic lifecycle**: Connect at startup, disconnect on disable
- **Environment variables**: `${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_PLUGIN_DATA}`
- Run `/reload-plugins` to reconnect after enabling/disabling

## Authentication

Many cloud MCP servers require OAuth 2.0:

1. Add the server: `claude mcp add --transport http sentry https://mcp.sentry.dev/mcp`
2. Authenticate: `/mcp` then follow browser steps

### Fixed OAuth Callback Port

```bash
claude mcp add --transport http --callback-port 8080 my-server https://mcp.example.com/mcp
```

### Pre-configured OAuth Credentials

```bash
claude mcp add --transport http \
  --client-id your-client-id --client-secret --callback-port 8080 \
  my-server https://mcp.example.com/mcp
```

## Dynamic Tool Updates

Claude Code supports MCP `list_changed` notifications, auto-refreshing capabilities when servers update.

## Push Messages with Channels

MCP servers can push messages via `claude/channel` capability. Enable with `--channels` flag.

## Practical Examples

### Sentry

```bash
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp
```

### GitHub

```bash
claude mcp add --transport http github https://api.githubcopilot.com/mcp/
```

### PostgreSQL

```bash
claude mcp add --transport stdio db -- npx -y @bytebase/dbhub \
  --dsn "postgresql://readonly:pass@prod.db.com:5432/analytics"
```

## Managed MCP Configuration

File: `managed-mcp.json` in system directories.

Settings:
- `allowedMcpServers`: Allowlist of servers users can configure
- `deniedMcpServers`: Denylist of blocked servers
- `allowManagedMcpServersOnly`: Only admin-defined allowlist applies

## Tips

- `MCP_TIMEOUT=10000 claude` sets 10-second startup timeout
- `MAX_MCP_OUTPUT_TOKENS=50000` increases output token limit
- Windows: use `cmd /c` wrapper for `npx` commands
- Reset project server choices: `claude mcp reset-project-choices`
