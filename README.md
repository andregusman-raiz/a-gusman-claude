# Gusman Claude Agent System

> Transform Claude Code from a passive assistant into an autonomous development platform.
> 37 specialized agents. Battle-tested across 155+ real sessions. Self-improving.

## Why This Exists

Claude Code is powerful but generic. This framework adds:
- **37 specialized agents** that know exactly what to do at each phase of development
- **Defense-in-depth safety** with 4 layers of protection (hooks, rules, permissions, governance)
- **Self-improvement pipeline** that learns from failures and improves agent prompts
- **Model routing** that uses the right model for the right task (haiku for scans, opus for debugging)
- **Parallel execution** via Agent Teams for bug sprints, multi-module builds, and audits

## Quick Start

```bash
# Clone and install
git clone https://github.com/andregusman-raiz/a-gusman-claude.git
cd your-project
cp -r /path/to/claude-agent-system/{agents,commands,skills,rules,hooks,Playbooks,scripts} .claude/
cp claude-agent-system/CLAUDE.md .
cp claude-agent-system/hooks.json .claude/

# Or use the installer
bash /path/to/claude-agent-system/install.sh --tier full

# Start Claude Code and orchestrate
claude
# Then type: /ag00 analyze this project
```

## Architecture

```
                        /ag00 (user command)
                              |
                    ag-00 Orchestrator
                    (classifies intent)
                              |
            +---------+-------+--------+---------+
            |         |       |        |         |
         Discover   Plan    Build   Validate   Deploy
        ag-03/04   ag-06   ag-08   ag-12/13   ag-18/19
        ag-05      ag-07   ag-09   ag-14/15   ag-20/27
                           ag-10
                           ag-11

    Safety Layers:
    [PreToolUse Hooks] -> [Rules] -> [Permissions] -> [CLAUDE.md]
```

## Agents by Phase

| Phase | Agents | What They Do |
|-------|--------|-------------|
| **Discover** | ag-03, ag-04, ag-05 | Map codebase, analyze tech debt, research solutions |
| **Plan** | ag-06, ag-07 | Write technical specs, decompose into task plans |
| **Build** | ag-08, ag-09, ag-10, ag-11 | Implement code, debug, refactor, optimize |
| **Validate** | ag-12, ag-13, ag-14, ag-15 | Verify completeness, test, review, audit security |
| **UX & Docs** | ag-16, ag-21, ag-29, ag-31 | Review UX, generate docs, create Office files |
| **Data** | ag-17 | Database migrations with zero-downtime |
| **Git & Deploy** | ag-18, ag-19, ag-20, ag-27 | Version control, deploy, monitor, full pipeline |
| **E2E Testing** | ag-22, ag-36, ag-37, ag-38 | Playwright tests, exploratory QA, smoke tests |
| **Bug Fixing** | ag-23, ag-24, ag-25, ag-26 | Batch fixes, parallel fixes, triage, verified fixes |
| **Operations** | ag-28, ag-30 | Session health, file organization |
| **Incorporation** | ag-32, ag-33, ag-34, ag-35 | Due diligence, integration mapping, module adoption |
| **Meta** | ag-00, ag-M, ag_skill-creator | Orchestration, self-improvement, skill creation |

## Key Features

### Model Routing
Each agent uses the optimal model for its task:

| Model | Agents | Use Case |
|-------|--------|----------|
| **Haiku** | ag-03, 04, 05, 12, 25, 28, 31 | Fast scans, triage, health checks |
| **Sonnet** | 28 agents | Building, testing, deploying |
| **Opus** | ag-04, ag-09 | Deep analysis, complex debugging |

### Safety Hooks (Defense-in-Depth)

| Layer | What | How |
|-------|------|-----|
| **PreToolUse** | Block dangerous commands | force push, --no-verify, rm -rf, direct prod deploy |
| **PostToolUse** | Validate quality | TypeScript check, theatrical test detection, commit conventions |
| **Rules** | Governance by context | Config protection, deploy preflight, root-cause debugging |
| **CLAUDE.md** | Global behavior | Conventions, security, methodology |

### Agent Teams (Parallel Execution)

```
ag-24 (Team Lead)
  |
  +-- fixer-auth (bugs in auth module)
  +-- fixer-ui (bugs in UI module)
  +-- fixer-api (bugs in API module)
  |
  Coordinator: merge + validate + report
```

### Self-Improvement Pipeline

```
errors-log.md -> ag-M (analyze patterns) -> ag_skill-creator (eval + improve) -> better agents
```

## Installation Tiers

| Tier | Files | Setup Time | What's Included |
|------|-------|-----------|-----------------|
| **Starter** | ~10 | 2 min | CLAUDE.md + core rules + safety hooks + orchestrator |
| **Standard** | ~60 | 10 min | + 16 core agents + all rules + all hooks + pattern skills |
| **Full** | 180+ | 20 min | + all 37 agents + all skills + playbooks + scripts |

## Configuration

### Customize CLAUDE.md
Copy `CLAUDE.md` to your project root and customize:
- Replace `[YOUR_PROJECT]` with your project details
- Add your stack-specific commands
- List your project's gotchas

### Add Webhooks (Optional)
In `settings.local.json`, replace `YOUR_WEBHOOK_URL` with your webhook endpoint:
- Git audit: notifies on push
- Test metrics: tracks test runs
- Build alerts: notifies on build failures

### Adjust Model Routing
Edit agent frontmatter to change model assignments:
```yaml
model: haiku    # Fast, cheap -- for scans and triage
model: sonnet   # Balanced -- for building and testing
model: opus     # Powerful -- for complex analysis
```

## Common Workflows

### New Feature
```
/ag03 explore the codebase    ->  understand structure
/ag06 spec: user auth module  ->  technical specification
/ag07 plan from spec          ->  task plan with phases
/ag08 build from plan         ->  implementation
/ag13 test the new module     ->  unit + integration tests
/ag14 review the changes      ->  code review
/ag18 commit and PR           ->  version control
```

### Bug Sprint
```
/ag25 triage these 10 bugs    ->  classify by severity
/ag24 fix in parallel         ->  parallel execution via Agent Teams
/ag12 validate all fixes      ->  completeness check
```

### Deploy
```
/ag27 full pipeline           ->  typecheck -> lint -> test -> build -> deploy -> smoke
```

## Documentation

| Doc | Content |
|-----|---------|
| [Setup Guide](docs/01-SETUP-GUIDE.md) | Step-by-step installation |
| [Agent Reference](docs/02-AGENT-REFERENCE.md) | All 37 agents with prompts |
| [Skill Reference](docs/03-SKILL-REFERENCE.md) | All 14 skills |
| [Hook Reference](docs/04-HOOK-REFERENCE.md) | Safety and quality hooks |
| [Rule Reference](docs/05-RULE-REFERENCE.md) | 29 governance rules |
| [Playbooks](docs/06-PLAYBOOKS.md) | 11 strategic methodologies |
| [Best Practices](docs/07-BEST-PRACTICES.md) | Lessons from 155+ sessions |
| [Decision Trees](docs/08-DECISION-TREES.md) | When to use each agent |
| [Examples](examples/) | Real-world configurations |

## FAQ

**Works with Python/Go/Rust/Java?**
Yes. Agents are language-agnostic. Adjust typecheck/lint/test commands in your CLAUDE.md.

**Do I need all 37 agents?**
No. Start with Starter tier (orchestrator + rules + hooks). Add agents as needed.

**Works on Windows?**
Yes. Shell hooks need Git Bash or WSL. Everything else works natively.

**Can I customize agents?**
Yes. Agents are plain .md files -- edit freely. Use ag-M to improve them based on error patterns.

**Conflicts with other Claude Code setups?**
No. The framework uses standard .claude/ directory structure. Compatible with oh-my-claudecode and other tools.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on adding agents, skills, rules, and hooks.

## License

[MIT](LICENSE)

---

*Built by [Andre Gusman](https://github.com/andregusman-raiz). Battle-tested across 155+ development sessions.*
