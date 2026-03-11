# Gusman Claude Agent System

> Transform Claude Code from a passive assistant into an autonomous development platform.
> 46 specialized agents. 56 skills. Battle-tested across 200+ real sessions. Self-improving.

## Why This Exists

Claude Code is powerful but generic. This framework adds:
- **46 specialized agents** that know exactly what to do at each phase of development
- **56 skills** with Quality Gates, Anti-Patterns, and structured outputs
- **Defense-in-depth safety** with 4 layers of protection (hooks, rules, permissions, governance)
- **Self-improvement pipeline** that learns from failures and improves agent prompts
- **Model routing** that uses the right model for the right task (haiku for scans, opus for debugging)
- **Parallel execution** via Agent Teams for bug sprints, multi-module builds, and audits

## Quick Start

```bash
# Clone and install
git clone https://github.com/andregusman-raiz/a-gusman-claude.git
cd your-project
cp -r /path/to/a-gusman-claude/{agents,skills,rules,hooks,Playbooks,scripts} .claude/
cp a-gusman-claude/CLAUDE.md .
cp a-gusman-claude/hooks.json .claude/

# Or use the installer
bash /path/to/a-gusman-claude/install.sh --tier full

# Start Claude Code and orchestrate
claude
# Then type: /ag-M-00-orquestrar analyze this project
```

## Architecture

```
                    /ag-M-00-orquestrar (user skill)
                              |
                    ag-M-00 Orchestrator
                    (classifies intent, selects workflow)
                              |
            +---------+-------+--------+---------+
            |         |       |        |         |
         Discover   Plan    Build   Validate   Deploy
        ag-P-03    ag-P-06 ag-B-08 ag-Q-12    ag-D-18
        ag-P-04    ag-P-07 ag-B-09 ag-Q-13    ag-D-19
        ag-P-05            ag-B-10 ag-Q-14    ag-D-20
                           ag-B-11 ag-Q-15    ag-D-27

    Safety Layers:
    [PreToolUse Hooks] -> [Rules] -> [Permissions] -> [CLAUDE.md]
```

### Naming Convention: `ag-L-NN-nome`

| Category | Letter | Agents |
|----------|--------|--------|
| Planning | P | ag-P-01 through ag-P-07 |
| Build & Fix | B | ag-B-08 through ag-B-26 |
| Quality & Testing | Q | ag-Q-12 through ag-Q-45 |
| Deploy & Ops | D | ag-D-17 through ag-D-38 |
| Writing & Docs | W | ag-W-21, ag-W-29 through ag-W-31 |
| Integration | I | ag-I-32 through ag-I-35 |
| Meta | M | ag-M-00, ag-M-28, ag-M-47, ag-M-99 |
| External | X | ag-X-46 |

## Agents by Phase

| Phase | Agents | What They Do |
|-------|--------|-------------|
| **Discover** | ag-P-03, ag-P-04, ag-P-05 | Map codebase, analyze tech debt, research solutions |
| **Plan** | ag-P-06, ag-P-07 | Write technical specs, decompose into task plans |
| **Build** | ag-B-08, ag-B-09, ag-B-10, ag-B-11 | Implement code, debug, refactor, optimize |
| **Validate** | ag-Q-12, ag-Q-13, ag-Q-14, ag-Q-15 | Verify completeness, test, review, audit security |
| **UX & Docs** | ag-Q-16, ag-W-21, ag-W-29, ag-W-31 | Review UX, generate docs, create Office files |
| **Data** | ag-D-17 | Database migrations with zero-downtime |
| **Git & Deploy** | ag-D-18, ag-D-19, ag-D-20, ag-D-27 | Version control, deploy, monitor, full pipeline |
| **E2E Testing** | ag-Q-22, ag-Q-36, ag-D-38 | Playwright tests, exploratory QA, smoke tests |
| **QAT** | ag-Q-39 through ag-Q-45 | Quality Acceptance Testing (PDCA cycles, benchmarks, UX-QAT) |
| **Bug Fixing** | ag-B-23, ag-B-24, ag-B-25, ag-B-26 | Batch fixes, parallel fixes, triage, verified fixes |
| **Operations** | ag-M-28, ag-W-30 | Session health, file organization |
| **Incorporation** | ag-I-32, ag-I-33, ag-I-34, ag-I-35 | Due diligence, integration mapping, module adoption |
| **Meta** | ag-M-00, ag-M-47, ag-M-99, ag_skill-creator | Orchestration, agent factory, self-improvement |

## Key Features

### Model Routing
Each agent uses the optimal model for its task:

| Model | Agents | Use Case |
|-------|--------|----------|
| **Haiku** | ag-P-03, 05, Q-12, B-25, M-28, W-31 | Fast scans, triage, health checks |
| **Sonnet** | ~38 agents | Building, testing, deploying |
| **Opus** | ag-P-04, ag-B-09 | Deep analysis, complex debugging |

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

## Invocation

All agents are invoked via skills (no commands needed):
```
User types /ag-B-08-construir-codigo → Skill tool → SKILL.md → Agent subprocess
```

Skills run in main context. Agents run as isolated subprocesses (200K tokens each).

## Installation Tiers

| Tier | Files | Setup Time | What's Included |
|------|-------|-----------|-----------------|
| **Starter** | ~15 | 2 min | CLAUDE.md + core rules + safety hooks + orchestrator |
| **Standard** | ~80 | 10 min | + 16 core agents + all rules + all hooks + pattern skills |
| **Full** | 250+ | 20 min | + all 46 agents + 56 skills + playbooks + .shared/ |

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
/ag-P-03-explorar-codigo      ->  understand structure
/ag-P-06-especificar-solucao  ->  technical specification
/ag-P-07-planejar-execucao    ->  task plan with phases
/ag-B-08-construir-codigo     ->  implementation
/ag-Q-13-testar-codigo        ->  unit + integration tests
/ag-Q-14-criticar-projeto     ->  code review
/ag-D-18-versionar-codigo     ->  commit and PR
```

### Bug Sprint
```
/ag-B-25-diagnosticar-bugs    ->  classify by severity
/ag-B-24-bugfix-paralelo      ->  parallel execution via Agent Teams
/ag-Q-12-validar-execucao     ->  completeness check
```

### Deploy
```
/ag-D-27-deploy-pipeline      ->  typecheck -> lint -> test -> build -> deploy -> smoke
```

## Documentation

| Doc | Content |
|-----|---------|
| [Setup Guide](docs/01-SETUP-GUIDE.md) | Step-by-step installation |
| [Agent Reference](docs/02-AGENT-REFERENCE.md) | All 46 agents with prompts |
| [Skill Reference](docs/03-SKILL-REFERENCE.md) | All 56 skills |
| [Hook Reference](docs/04-HOOK-REFERENCE.md) | Safety and quality hooks |
| [Rule Reference](docs/05-RULE-REFERENCE.md) | 21 governance rules |
| [Playbooks](docs/06-PLAYBOOKS.md) | 11 strategic methodologies |
| [Best Practices](docs/07-BEST-PRACTICES.md) | Lessons from 200+ sessions |
| [Decision Trees](docs/08-DECISION-TREES.md) | When to use each agent |

## FAQ

**Works with Python/Go/Rust/Java?**
Yes. Agents are language-agnostic. Adjust typecheck/lint/test commands in your CLAUDE.md.

**Do I need all 46 agents?**
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

*Built by [Andre Gusman](https://github.com/andregusman-raiz). Battle-tested across 200+ development sessions.*
