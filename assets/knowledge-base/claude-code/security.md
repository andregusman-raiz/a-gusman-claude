# Claude Code Security

> Source: https://code.claude.com/docs/en/security

## Security Foundation

Claude Code is built according to Anthropic's comprehensive security program. Resources at https://trust.anthropic.com (SOC 2 Type 2, ISO 27001).

## Permission-Based Architecture

- Strict read-only permissions by default
- Explicit permission required for: editing files, running tests, executing commands
- Users control whether to approve once or allow automatically

## Built-in Protections

### Sandboxed Bash Tool
- Filesystem and network isolation
- Enable with `/sandbox`
- Reduces permission prompts while maintaining security

### Write Access Restriction
- Can only write to the folder where started and subfolders
- Cannot modify files in parent directories without explicit permission
- Can read files outside working directory (system libraries, dependencies)

### Prompt Fatigue Mitigation
- Allowlisting frequently used safe commands per-user, per-codebase, or per-organization

### Accept Edits Mode
- Batch accept multiple edits
- Maintains permission prompts for commands with side effects

## Prompt Injection Protections

### Core Protections
- **Permission system**: Sensitive operations require explicit approval
- **Context-aware analysis**: Detects potentially harmful instructions
- **Input sanitization**: Prevents command injection
- **Command blocklist**: Blocks `curl`, `wget` by default

### Privacy Safeguards
- Limited retention periods for sensitive information
- Restricted access to user session data
- User control over data training preferences

### Additional Safeguards
- **Network request approval**: Network tools require user approval by default
- **Isolated context windows**: WebFetch uses separate context window
- **Trust verification**: First-time codebase runs and new MCP servers require verification (disabled in `-p` mode)
- **Command injection detection**: Suspicious bash commands require manual approval even if allowlisted
- **Fail-closed matching**: Unmatched commands default to manual approval
- **Natural language descriptions**: Complex bash commands include explanations
- **Secure credential storage**: API keys and tokens are encrypted

## Windows WebDAV Warning

Do not enable WebDAV or allow paths like `\\*`. WebDAV has been deprecated by Microsoft due to security risks and may trigger network requests bypassing the permission system.

## Best Practices for Untrusted Content

1. Review suggested commands before approval
2. Avoid piping untrusted content directly to Claude
3. Verify proposed changes to critical files
4. Use VMs for scripts interacting with external web services
5. Report suspicious behavior with `/feedback`

## MCP Security

- MCP server list configured in source code (settings checked into source control)
- Write your own or use trusted MCP servers
- Configure permissions for MCP servers
- Anthropic does not manage or audit any MCP servers

## Cloud Execution Security

When using Claude Code on the web:
- **Isolated VMs**: Each session in isolated, Anthropic-managed VM
- **Network controls**: Limited by default, configurable
- **Credential protection**: Scoped credential in sandbox, translated to actual GitHub token
- **Branch restrictions**: Push restricted to current working branch
- **Audit logging**: All operations logged
- **Automatic cleanup**: Environments terminated after session

## Remote Control Security

- Web interface connects to local Claude Code process
- All code execution stays local
- Data flows through Anthropic API over TLS
- Multiple short-lived, narrowly scoped credentials

## Security Best Practices

### Working with Sensitive Code
- Review all suggested changes before approval
- Use project-specific permission settings
- Consider devcontainers for additional isolation
- Audit permissions with `/permissions`

### Team Security
- Use managed settings for organizational standards
- Share approved permissions through version control
- Train team on security best practices
- Monitor usage through OpenTelemetry metrics
- Audit settings changes with `ConfigChange` hooks

### Reporting Vulnerabilities
1. Do not disclose publicly
2. Report via HackerOne: https://hackerone.com/anthropic-vdp/reports/new
3. Include detailed reproduction steps
4. Allow time for remediation
