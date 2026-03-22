# Claude Code Tutorials & Common Workflows

> Source: https://code.claude.com/docs/en/tutorials (common-workflows)

## Understanding New Codebases

### Quick Overview
```text
give me an overview of this codebase
explain the main architecture patterns used here
what are the key data models?
how is authentication handled?
```

### Finding Relevant Code
```text
find the files that handle user authentication
how do these authentication files work together?
trace the login process from front-end to database
```

## Fixing Bugs

```text
I'm seeing an error when I run npm test
suggest a few ways to fix the @ts-ignore in user.ts
update user.ts to add the null check you suggested
```

Tips:
- Tell Claude the command to reproduce the issue
- Mention steps to reproduce
- Note if error is intermittent or consistent

## Refactoring Code

```text
find deprecated API usage in our codebase
suggest how to refactor utils.js to use modern JavaScript features
refactor utils.js to use ES2024 features while maintaining same behavior
run tests for the refactored code
```

## Using Subagents

```text
/agents                                                    # View available subagents
review my recent code changes for security issues          # Auto-delegation
use the code-reviewer subagent to check the auth module    # Explicit
```

Create custom subagents in `.claude/agents/` for team sharing.

## Plan Mode for Safe Analysis

Plan Mode: read-only analysis, perfect for exploring codebases, planning complex changes, reviewing code safely.

### Activate
- During session: **Shift+Tab** to cycle modes
- New session: `claude --permission-mode plan`
- Headless: `claude --permission-mode plan -p "Analyze auth system"`

### Example
```bash
claude --permission-mode plan
```
```text
I need to refactor our authentication system to use OAuth2. Create a detailed migration plan.
```

Press `Ctrl+G` to open plan in text editor.

## Working with Tests

```text
find functions in NotificationsService.swift that are not covered by tests
add tests for the notification service
add test cases for edge conditions in the notification service
run the new tests and fix any failures
```

## Creating Pull Requests

```text
summarize the changes I've made to the authentication module
create a pr
enhance the PR description with more context about the security improvements
```

Sessions auto-link to PR when using `gh pr create`. Resume with `claude --from-pr <number>`.

## Working with Images

Add images by:
1. Drag and drop into Claude Code window
2. Copy and paste with Ctrl+V
3. Provide path: "Analyze this image: /path/to/image.png"

```text
What does this image show?
Describe the UI elements in this screenshot
Here's a screenshot of the error. What's causing it?
Generate CSS to match this design mockup
```

Cmd+Click image references to open in default viewer.

## Referencing Files and Directories

```text
Explain the logic in @src/utils/auth.js        # Single file
What's the structure of @src/components?         # Directory
Show me data from @github:repos/owner/repo/issues  # MCP resource
```

## Extended Thinking

Enabled by default. Configure effort level:
- `/effort` command
- `--effort high` flag
- `CLAUDE_CODE_EFFORT_LEVEL` env var
- "ultrathink" keyword in prompt for one-off deep reasoning

View thinking: `Ctrl+O` for verbose mode.

## Session Management

### Resume Previous Conversations
```bash
claude --continue          # Most recent in current directory
claude --resume            # Session picker
claude --from-pr 123       # Linked to GitHub PR
/resume                    # Switch within active session
```

### Name Sessions
```bash
claude -n auth-refactor           # At startup
/rename auth-refactor             # During session
claude --resume auth-refactor     # Resume by name
```

## Git Worktrees for Parallel Sessions

```bash
claude --worktree feature-auth    # Named worktree
claude --worktree bugfix-123      # Another parallel session
claude --worktree                 # Auto-generated name
```

Worktrees created at `<repo>/.claude/worktrees/<name>`. Add `.claude/worktrees/` to `.gitignore`.

### Subagent Worktrees
Configure `isolation: worktree` in agent frontmatter.

### Cleanup
- No changes: auto-removed
- Changes exist: prompted to keep or remove

## Desktop Notifications

Add to `~/.claude/settings.json`:

### macOS
```json
{
  "hooks": {
    "Notification": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "osascript -e 'display notification \"Claude Code needs attention\" with title \"Claude Code\"'"
      }]
    }]
  }
}
```

### Linux
```json
{
  "hooks": {
    "Notification": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "notify-send 'Claude Code' 'Claude Code needs your attention'"
      }]
    }]
  }
}
```

Matchers: `permission_prompt`, `idle_prompt`, `auth_success`, `elicitation_dialog`

## Unix-Style Usage

### Build Script Linter
```json
{
  "scripts": {
    "lint:claude": "claude -p 'you are a linter. look at changes vs main and report issues.'"
  }
}
```

### Pipe Data
```bash
cat build-error.txt | claude -p 'explain the root cause' > output.txt
```

### Output Formats
- `--output-format text` (default): plain text response
- `--output-format json`: JSON array with metadata
- `--output-format stream-json`: real-time JSON per turn

## Ask About Capabilities

```text
can Claude Code create pull requests?
how does Claude Code handle permissions?
what skills are available?
how do I use MCP with Claude Code?
how do I configure Claude Code for Amazon Bedrock?
```
