# Claude Code Memory System

> Source: https://code.claude.com/docs/en/memory

## Overview

Each Claude Code session begins with a fresh context window. Two mechanisms carry knowledge across sessions:

- **CLAUDE.md files**: instructions you write to give Claude persistent context
- **Auto memory**: notes Claude writes itself based on your corrections and preferences

Both are loaded at the start of every conversation. Claude treats them as context, not enforced configuration.

## CLAUDE.md vs Auto Memory

| | CLAUDE.md files | Auto memory |
|:--|:--|:--|
| **Who writes it** | You | Claude |
| **What it contains** | Instructions and rules | Learnings and patterns |
| **Scope** | Project, user, or org | Per working tree |
| **Loaded into** | Every session | Every session (first 200 lines) |
| **Use for** | Coding standards, workflows, project architecture | Build commands, debugging insights, preferences Claude discovers |

## CLAUDE.md Files

### Locations and Scope

| Scope | Location | Purpose | Shared with |
|:--|:--|:--|:--|
| **Managed policy** | macOS: `/Library/Application Support/ClaudeCode/CLAUDE.md` / Linux: `/etc/claude-code/CLAUDE.md` / Windows: `C:\Program Files\ClaudeCode\CLAUDE.md` | Organization-wide instructions | All users |
| **Project** | `./CLAUDE.md` or `./.claude/CLAUDE.md` | Team-shared instructions | Team via source control |
| **User** | `~/.claude/CLAUDE.md` | Personal preferences | Just you |

### How CLAUDE.md Files Load

1. Claude Code walks UP the directory tree from CWD, loading CLAUDE.md from each directory
2. CLAUDE.md files in subdirectories are loaded on-demand when Claude reads files in those dirs
3. Running in `foo/bar/` loads both `foo/bar/CLAUDE.md` and `foo/CLAUDE.md`

### Writing Effective Instructions

- **Size**: target under 200 lines per CLAUDE.md file
- **Structure**: use markdown headers and bullets
- **Specificity**: concrete enough to verify ("Use 2-space indentation" not "Format code properly")
- **Consistency**: avoid contradicting rules across files

### Import Additional Files

Use `@path/to/import` syntax:

```text
See @README for project overview and @package.json for npm commands.

# Additional Instructions
- git workflow @docs/git-instructions.md
```

- Both relative and absolute paths allowed
- Relative paths resolve relative to the containing file
- Maximum depth: 5 hops
- Personal imports: `@~/.claude/my-project-instructions.md`

### Generate CLAUDE.md

Run `/init` to generate a starting CLAUDE.md automatically. Set `CLAUDE_CODE_NEW_INIT=true` for interactive multi-phase flow.

### Additional Directories

```bash
CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1 claude --add-dir ../shared-config
```

## Organize Rules with .claude/rules/

For larger projects, use `.claude/rules/` directory with markdown files per topic:

```
.claude/
├── CLAUDE.md
└── rules/
    ├── code-style.md
    ├── testing.md
    └── security.md
```

### Path-Specific Rules

```markdown
---
paths:
  - "src/api/**/*.ts"
---

# API Development Rules
- All API endpoints must include input validation
```

Glob patterns:

| Pattern | Matches |
|:--|:--|
| `**/*.ts` | All TypeScript files |
| `src/**/*` | All files under src/ |
| `*.md` | Markdown files in root |
| `src/components/*.tsx` | React components in specific dir |

Multiple patterns with brace expansion:

```markdown
---
paths:
  - "src/**/*.{ts,tsx}"
  - "lib/**/*.ts"
  - "tests/**/*.test.ts"
---
```

### Symlinks for Shared Rules

```bash
ln -s ~/shared-claude-rules .claude/rules/shared
ln -s ~/company-standards/security.md .claude/rules/security.md
```

### User-Level Rules

`~/.claude/rules/` apply to every project. Loaded before project rules.

### Exclude CLAUDE.md Files

```json
{
  "claudeMdExcludes": [
    "**/monorepo/CLAUDE.md",
    "/home/user/monorepo/other-team/.claude/rules/**"
  ]
}
```

Managed policy CLAUDE.md files cannot be excluded.

## Auto Memory

Auto memory lets Claude accumulate knowledge across sessions. Claude saves notes as it works: build commands, debugging insights, architecture notes, code style preferences. Requires v2.1.59+.

### Enable/Disable

```json
{ "autoMemoryEnabled": false }
```

Or set `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`.

### Storage Location

Default: `~/.claude/projects/<project>/memory/`

The `<project>` path is derived from the git repository. All worktrees within the same repo share one auto memory directory.

Custom location:

```json
{ "autoMemoryDirectory": "~/my-custom-memory-dir" }
```

### Memory Directory Structure

```
~/.claude/projects/<project>/memory/
├── MEMORY.md          # Concise index, loaded into every session
├── debugging.md       # Detailed notes
├── api-conventions.md # API design decisions
└── ...
```

### How It Works

- First 200 lines of `MEMORY.md` loaded at session start
- Content beyond line 200 is NOT loaded
- Topic files (debugging.md, patterns.md) loaded on demand
- Claude reads/writes memory files during sessions

### Audit and Edit

Run `/memory` to browse and open memory files. All auto memory files are plain markdown you can edit or delete.

## View and Edit with /memory

The `/memory` command:
- Lists all CLAUDE.md and rules files loaded in current session
- Toggles auto memory on/off
- Provides link to open auto memory folder
- Opens files in your editor

## Troubleshooting

### Claude isn't following CLAUDE.md
- Run `/memory` to verify files are loaded
- Check file location matches scope rules
- Make instructions more specific
- Look for conflicting instructions across files

### CLAUDE.md is too large
- Move detailed content into `@path` imports
- Split into `.claude/rules/` files

### Instructions lost after /compact
- CLAUDE.md fully survives compaction (re-read from disk)
- If instruction disappeared, it was conversation-only, not in CLAUDE.md

## Subagent Memory

Subagents can maintain their own auto memory. See subagent configuration for `memory` field: `user`, `project`, or `local` scope.
