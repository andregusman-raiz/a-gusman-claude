# Claude Code Settings Reference

> Source: https://code.claude.com/docs/en/settings

## Configuration Scopes

| Scope | Location | Who it affects | Shared? |
|:--|:--|:--|:--|
| **Managed** | Server-managed, plist/registry, or `managed-settings.json` | All users on machine | Yes (deployed by IT) |
| **User** | `~/.claude/` directory | You, across all projects | No |
| **Project** | `.claude/` in repository | All collaborators | Yes (committed to git) |
| **Local** | `.claude/settings.local.json` | You, in this repo only | No (gitignored) |

### Precedence (highest to lowest)

1. **Managed** - can't be overridden
2. **Command line arguments** - temporary session overrides
3. **Local** - overrides project and user
4. **Project** - overrides user
5. **User** - applies when nothing else specifies

### What Uses Scopes

| Feature | User | Project | Local |
|:--|:--|:--|:--|
| **Settings** | `~/.claude/settings.json` | `.claude/settings.json` | `.claude/settings.local.json` |
| **Subagents** | `~/.claude/agents/` | `.claude/agents/` | None |
| **MCP servers** | `~/.claude.json` | `.mcp.json` | `~/.claude.json` (per-project) |
| **CLAUDE.md** | `~/.claude/CLAUDE.md` | `CLAUDE.md` or `.claude/CLAUDE.md` | None |

## Settings Files

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": ["Bash(npm run lint)", "Bash(npm run test *)", "Read(~/.zshrc)"],
    "deny": ["Bash(curl *)", "Read(./.env)", "Read(./.env.*)", "Read(./secrets/**)"]
  },
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_METRICS_EXPORTER": "otlp"
  }
}
```

### Managed Settings Locations

- **macOS**: `/Library/Application Support/ClaudeCode/managed-settings.json`
- **Linux/WSL**: `/etc/claude-code/managed-settings.json`
- **Windows**: `C:\Program Files\ClaudeCode\managed-settings.json`
- **MDM/OS-level**: macOS plist `com.anthropic.claudecode`, Windows registry `HKLM\SOFTWARE\Policies\ClaudeCode`

## Available Settings

| Key | Description |
|:--|:--|
| `apiKeyHelper` | Custom script to generate auth value |
| `autoMemoryDirectory` | Custom directory for auto memory storage |
| `cleanupPeriodDays` | Session cleanup period (default: 30) |
| `companyAnnouncements` | Announcements at startup |
| `env` | Environment variables for every session |
| `attribution` | Customize attribution for git commits and PRs |
| `includeGitInstructions` | Include built-in commit/PR instructions (default: true) |
| `permissions` | Permission rules structure |
| `hooks` | Lifecycle hooks configuration |
| `disableAllHooks` | Disable all hooks |
| `allowManagedHooksOnly` | (Managed only) Only managed/SDK hooks |
| `allowedHttpHookUrls` | Allowlist of HTTP hook URLs |
| `httpHookAllowedEnvVars` | Allowlist of env vars for HTTP hooks |
| `allowManagedPermissionRulesOnly` | (Managed only) Only managed permission rules |
| `allowManagedMcpServersOnly` | (Managed only) Only managed MCP servers |
| `model` | Override default model |
| `availableModels` | Restrict model selection |
| `modelOverrides` | Map model IDs to provider-specific IDs |
| `effortLevel` | Persist effort level: `"low"`, `"medium"`, `"high"` |
| `otelHeadersHelper` | Script for dynamic OpenTelemetry headers |
| `statusLine` | Custom status line configuration |
| `fileSuggestion` | Custom `@` file autocomplete script |
| `respectGitignore` | File picker respects .gitignore (default: true) |
| `outputStyle` | Output style for system prompt |
| `agent` | Run main thread as named subagent |
| `forceLoginMethod` | Restrict login to `claudeai` or `console` |
| `forceLoginOrgUUID` | Auto-select organization during login |
| `enableAllProjectMcpServers` | Auto-approve project MCP servers |
| `enabledMcpjsonServers` | Specific MCP servers to approve |
| `disabledMcpjsonServers` | Specific MCP servers to reject |
| `channelsEnabled` | (Managed only) Allow channels |
| `allowedMcpServers` | (Managed) MCP server allowlist |
| `deniedMcpServers` | (Managed) MCP server denylist |
| `strictKnownMarketplaces` | (Managed) Plugin marketplace allowlist |
| `blockedMarketplaces` | (Managed) Marketplace blocklist |
| `pluginTrustMessage` | (Managed) Custom plugin trust warning |
| `awsAuthRefresh` | Custom AWS auth refresh script |
| `awsCredentialExport` | Custom AWS credential export script |
| `alwaysThinkingEnabled` | Enable extended thinking by default |
| `plansDirectory` | Custom plan files location |
| `spinnerVerbs` | Custom spinner action verbs |
| `language` | Preferred response language |
| `voiceEnabled` | Enable push-to-talk voice dictation |
| `autoUpdatesChannel` | `"stable"` or `"latest"` |
| `spinnerTipsEnabled` | Show tips in spinner (default: true) |
| `spinnerTipsOverride` | Custom spinner tips |
| `prefersReducedMotion` | Reduce UI animations |
| `fastModePerSessionOptIn` | Require per-session fast mode enable |
| `teammateMode` | Agent team display: `auto`, `in-process`, `tmux` |
| `feedbackSurveyRate` | Session quality survey probability (0-1) |

### Global Config Settings (in ~/.claude.json)

| Key | Description |
|:--|:--|
| `autoConnectIde` | Auto-connect to IDE (default: false) |
| `autoInstallIdeExtension` | Auto-install IDE extension (default: true) |
| `showTurnDuration` | Show turn duration messages (default: true) |
| `terminalProgressBarEnabled` | Terminal progress bar (default: true) |

### Worktree Settings

| Key | Description |
|:--|:--|
| `worktree.symlinkDirectories` | Directories to symlink into worktrees |
| `worktree.sparsePaths` | Sparse-checkout paths for worktrees |

## Permission Settings

| Key | Description |
|:--|:--|
| `allow` | Permission rules to allow tool use |
| `ask` | Permission rules requiring confirmation |
| `deny` | Permission rules to deny tool use |
| `additionalDirectories` | Additional working directories |
| `defaultMode` | Default permission mode |
| `disableBypassPermissionsMode` | Disable bypass permissions |

### Permission Rule Syntax

Rules follow format `Tool` or `Tool(specifier)`. Evaluated: deny first, then ask, then allow.

| Rule | Effect |
|:--|:--|
| `Bash` | Matches all Bash commands |
| `Bash(npm run *)` | Matches commands starting with `npm run` |
| `Read(./.env)` | Matches reading .env file |
| `WebFetch(domain:example.com)` | Matches fetch to example.com |

## Sandbox Settings

| Key | Description |
|:--|:--|
| `sandbox.enabled` | Enable bash sandboxing |
| `sandbox.autoAllowBashIfSandboxed` | Auto-approve bash when sandboxed |
| `sandbox.excludedCommands` | Commands outside sandbox |
| `sandbox.allowUnsandboxedCommands` | Allow `dangerouslyDisableSandbox` |
| `sandbox.filesystem.allowWrite` | Additional writable paths |
| `sandbox.filesystem.denyWrite` | Non-writable paths |
| `sandbox.filesystem.denyRead` | Non-readable paths |
| `sandbox.filesystem.allowRead` | Re-allow reading within denyRead |
| `sandbox.network.allowUnixSockets` | Unix sockets in sandbox |
| `sandbox.network.allowAllUnixSockets` | All Unix sockets |
| `sandbox.network.allowLocalBinding` | Bind to localhost (macOS) |
| `sandbox.network.allowedDomains` | Allowed outbound domains |

### Sandbox Path Prefixes

| Prefix | Meaning |
|:--|:--|
| `/` | Absolute path |
| `~/` | Relative to home |
| `./` or no prefix | Relative to project root |

## Attribution Settings

```json
{
  "attribution": {
    "commit": "Generated with AI\n\nCo-Authored-By: AI <ai@example.com>",
    "pr": ""
  }
}
```

## Plugin Configuration

```json
{
  "enabledPlugins": {
    "formatter@acme-tools": true,
    "deployer@acme-tools": true
  },
  "extraKnownMarketplaces": {
    "acme-tools": {
      "source": "github",
      "repo": "acme-corp/claude-plugins"
    }
  }
}
```

Marketplace source types: `github`, `git`, `directory`, `hostPattern`, `settings`, `url`, `npm`, `file`.

## Verify Active Settings

Run `/status` to see which settings sources are active and their origins.

### Array Settings Merge

Array-valued settings (e.g., `sandbox.filesystem.allowWrite`, `permissions.allow`) are concatenated and deduplicated across scopes, not replaced.
