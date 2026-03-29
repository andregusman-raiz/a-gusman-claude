# Claude Code GitHub Integration

> Source: https://code.claude.com/docs/en/github-actions

## Overview

Claude Code GitHub Actions brings AI-powered automation to your GitHub workflow. With `@claude` mention in any PR or issue, Claude can analyze code, create PRs, implement features, and fix bugs.

Built on the Claude Agent SDK. Repository: https://github.com/anthropics/claude-code-action

## Capabilities

- **Instant PR creation**: Describe what you need, Claude creates a complete PR
- **Automated code implementation**: Turn issues into working code
- **Follows your standards**: Respects CLAUDE.md guidelines and existing patterns
- **Secure by default**: Code stays on GitHub's runners

## Setup

### Quick Setup

```text
/install-github-app
```

Requires repo admin. GitHub app requests read/write for Contents, Issues, Pull requests.

### Manual Setup

1. Install GitHub app: https://github.com/apps/claude
2. Add `ANTHROPIC_API_KEY` to repository secrets
3. Copy workflow from `examples/claude.yml` into `.github/workflows/`

## Basic Workflow

```yaml
name: Claude Code
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
jobs:
  claude:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Action Parameters

| Parameter | Description | Required |
|:--|:--|:--|
| `prompt` | Instructions for Claude | No |
| `claude_args` | CLI arguments passed to Claude Code | No |
| `anthropic_api_key` | Claude API key | Yes* |
| `github_token` | GitHub token for API access | No |
| `trigger_phrase` | Custom trigger (default: "@claude") | No |
| `use_bedrock` | Use AWS Bedrock | No |
| `use_vertex` | Use Google Vertex AI | No |

### CLI Arguments via claude_args

```yaml
claude_args: "--max-turns 5 --model claude-sonnet-4-6 --mcp-config /path/to/config.json"
```

Common: `--max-turns`, `--model`, `--mcp-config`, `--allowed-tools`, `--debug`

## Example Workflows

### Code Review on PR

```yaml
name: Code Review
on:
  pull_request:
    types: [opened, synchronize]
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: "Review this PR for code quality, correctness, and security."
          claude_args: "--max-turns 5"
```

### Scheduled Automation

```yaml
name: Daily Report
on:
  schedule:
    - cron: "0 9 * * *"
jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: "Generate a summary of yesterday's commits and open issues"
          claude_args: "--model opus"
```

## Common @claude Commands

```text
@claude implement this feature based on the issue description
@claude how should I implement user authentication for this endpoint?
@claude fix the TypeError in the user dashboard component
```

## Using with AWS Bedrock

### Prerequisites
- AWS account with Amazon Bedrock enabled
- GitHub OIDC Identity Provider configured
- IAM role with Bedrock permissions

### Workflow

```yaml
name: Claude PR Action
permissions:
  contents: write
  pull-requests: write
  issues: write
  id-token: write
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
jobs:
  claude-pr:
    if: contains(github.event.comment.body, '@claude')
    runs-on: ubuntu-latest
    env:
      AWS_REGION: us-west-2
    steps:
      - uses: actions/checkout@v4
      - id: app-token
        uses: actions/create-github-app-token@v2
        with:
          app-id: ${{ secrets.APP_ID }}
          private-key: ${{ secrets.APP_PRIVATE_KEY }}
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_TO_ASSUME }}
          aws-region: us-west-2
      - uses: anthropics/claude-code-action@v1
        with:
          github_token: ${{ steps.app-token.outputs.token }}
          use_bedrock: "true"
          claude_args: '--model us.anthropic.claude-sonnet-4-6 --max-turns 10'
```

## Using with Google Vertex AI

### Prerequisites
- Google Cloud Project with Vertex AI enabled
- Workload Identity Federation configured
- Service account with Vertex AI permissions

### Workflow

```yaml
steps:
  - uses: actions/checkout@v4
  - id: app-token
    uses: actions/create-github-app-token@v2
    with:
      app-id: ${{ secrets.APP_ID }}
      private-key: ${{ secrets.APP_PRIVATE_KEY }}
  - id: auth
    uses: google-github-actions/auth@v2
    with:
      workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
      service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}
  - uses: anthropics/claude-code-action@v1
    with:
      github_token: ${{ steps.app-token.outputs.token }}
      use_vertex: "true"
      claude_args: '--model claude-sonnet-4@20250514 --max-turns 10'
    env:
      ANTHROPIC_VERTEX_PROJECT_ID: ${{ steps.auth.outputs.project_id }}
      CLOUD_ML_REGION: us-east5
```

## Upgrading from Beta to v1

| Old Beta Input | New v1.0 Input |
|:--|:--|
| `mode` | *(Removed - auto-detected)* |
| `direct_prompt` | `prompt` |
| `override_prompt` | `prompt` with GitHub variables |
| `custom_instructions` | `claude_args: --append-system-prompt` |
| `max_turns` | `claude_args: --max-turns` |
| `model` | `claude_args: --model` |
| `allowed_tools` | `claude_args: --allowedTools` |
| `disallowed_tools` | `claude_args: --disallowedTools` |
| `claude_env` | `settings` JSON format |

## PR Workflow in CLI

Create PRs from Claude Code CLI:

```text
create a pr for my changes
```

When created via `gh pr create`, sessions auto-link to PR. Resume with:

```bash
claude --from-pr 123
```

## Best Practices

- Create `CLAUDE.md` for code style guidelines and project rules
- Use GitHub Secrets for API keys (never hardcode)
- Configure appropriate `--max-turns` to prevent excessive iterations
- Set workflow-level timeouts to avoid runaway jobs
- Use GitHub's concurrency controls for parallel runs

## Troubleshooting

### Claude not responding
- Verify GitHub App installed correctly
- Check workflows enabled
- Ensure API key in repository secrets
- Confirm comment uses `@claude` (not `/claude`)

### CI not running on Claude's commits
- Use GitHub App or custom app (not Actions user)
- Check workflow triggers include necessary events
- Verify app permissions include CI triggers

### Authentication errors
- Confirm API key is valid
- For Bedrock/Vertex, check credentials configuration
- Ensure secrets named correctly
