<p align="center">
  <img src="assets/logos/raiz-educacao-logo.svg" alt="rAIz Educação" width="180" />
</p>

# Gusman Claude Agent System

> Transform Claude Code from a passive assistant into an autonomous development platform.
> 60 specialized skills & 46 agents. Battle-tested across 193+ real sessions, 464 commits. Self-improving.

## Why This Exists

Claude Code is powerful but generic. This framework adds:
- **60 specialized skills** that know exactly what to do at each phase of development
- **Defense-in-depth safety** with 4 layers of protection (hooks, rules, permissions, governance)
- **Self-improvement pipeline** that learns from failures and improves agent prompts
- **Model routing** that uses the right model for the right task (haiku for scans, opus for debugging)
- **Parallel execution** via Agent Teams for bug sprints, multi-module builds, and audits
- **QAT (Quality Acceptance Testing)** — AI-as-Judge validates output quality, not just functionality
- **Issue pipeline** — GitHub Issue → SPEC → Build → Verify → Test → PR (fully automated)

## Quick Start

```bash
# Clone the system
git clone https://github.com/andregusman-raiz/a-gusman-claude.git

# Install to your .claude/ directory (3 tiers available)
cd a-gusman-claude
bash install.sh --tier starter   # Starter: core rules + safety + orchestrator (~7 files, 2 min)
bash install.sh --tier standard  # Standard: + 16 core agents + patterns (~50 files, 10 min)
bash install.sh --tier full      # Full: all 46 agents, 60 skills, everything (180+ files, 20 min)

# Start Claude Code and orchestrate
claude
# Then type: /ag-M-00-orquestrar [describe what you want]
```

## Architecture

```
                        /ag-M-00-orquestrar (user command)
                              |
                    ag-M-00 Orchestrator (Opus)
                    (classifies intent, selects workflow)
                              |
            +---------+-------+--------+---------+---------+
            |         |       |        |         |         |
         Discover   Plan    Build   Validate   Deploy   Meta
        ag-P-03/04  ag-P-06  ag-B-08  ag-Q-12/13 ag-D-18  ag-M-47
        ag-P-05     ag-P-07  ag-B-09  ag-Q-14/15 ag-D-27  ag-M-49
                             ag-B-10  ag-Q-22    ag-D-38  ag-M-50
                             ag-B-11  ag-Q-39/51          ag-M-51
                             ag-B-23  ag-Q-40/44
                             ag-B-50/52

    Safety Layers:
    [PreToolUse Hooks] -> [Rules (31)] -> [Permissions] -> [CLAUDE.md]
```

## Agent Catalog

### By Category (ag-L-NN naming: L = category letter)

| Category | Prefix | Agents | What They Do |
|----------|--------|--------|-------------|
| **Planning** | ag-P-* | ag-P-01 to ag-P-07 | Project init, env setup, explore, analyze, research, spec, plan |
| **Building** | ag-B-* | ag-B-08 to ag-B-52 | Implement, debug, refactor, optimize, unified bugfix, validated build, UI/UX design |
| **Quality** | ag-Q-* | ag-Q-12 to ag-Q-51 | Validate, test (unit/E2E/QAT), review, audit, UX review, benchmarks, E2E batch |
| **Deploy** | ag-D-* | ag-D-17 to ag-D-38 | Migrations, git/PR/release, publish, monitor, full pipeline, smoke tests |
| **Writing** | ag-W-* | ag-W-21 to ag-W-31 | Project docs, Office generation, file org, spell check |
| **Integration** | ag-I-* | ag-I-32 to ag-I-35 | Due diligence, mapping, planning, module incorporation |
| **Meta** | ag-M-* | ag-M-00 to ag-M-51 | Orchestration, health, agent creation, issue pipeline, self-improvement |
| **Reference** | ag-R-* | ag-R-53 to ag-R-59 | Pattern libraries (Next.js, TypeScript, Python, Supabase, Quality, SDD, Security) |
| **Experimental** | ag-X-* | ag-X-46 | Flight search |

### Key Agents

| Agent | Model | What It Does |
|-------|-------|-------------|
| **ag-M-00** | Opus | **Orchestrator** — classifies intent, selects workflow, coordinates agents. Entry point. |
| **ag-M-51** | Sonnet | **Issue pipeline** — Issue → SPEC → Build → Verify → Test → PR. Fully automated. |
| **ag-B-08** | Sonnet | **Code builder** — Implements from plans. Re-reads plan every 10 actions. Worktree isolation. |
| **ag-B-23** | Sonnet | **Unified bugfix** — 4 modes: --triage, --fix, --batch, --parallel. Replaces ag-B-24/25/26. |
| **ag-B-09** | Opus | **Deep debugger** — Traces root cause before fixing. Max 2 attempts. |
| **ag-Q-13** | Sonnet | **Test creator** — Anti-theatrical tests. TDD mode (--from-spec) or validation mode. |
| **ag-Q-40** | Sonnet | **QAT orchestrator** — AI-as-Judge quality validation with PDCA cycle. |
| **ag-D-27** | Sonnet | **Deploy pipeline** — 8 stages with auto-recovery. env→type→lint→test→build→deploy→smoke→report |
| **ag-B-52** | Sonnet | **UI/UX design** — 67 styles, 96 palettes, 57 font pairings. Design intelligence. |
| **ag-P-06** | Opus | **Spec writer** — Technical specifications with edge cases and acceptance criteria. |

## Key Features

### Model Routing
Each agent uses the optimal model for its task:

| Model | Agents | Use Case |
|-------|--------|----------|
| **Haiku** | ag-P-03, P-05, Q-12, M-28, M-50, W-31 | Fast scans, triage, health checks |
| **Sonnet** | ~35 agents | Building, testing, deploying (80% of work) |
| **Opus** | ag-M-00, P-04, P-06, P-07, B-09, M-47 | Deep analysis, specs, complex debugging |

### Safety Hooks (Defense-in-Depth)

| Layer | What | How |
|-------|------|-----|
| **PreToolUse** | Block dangerous commands | force push, --no-verify, commits on main, config overwrites |
| **PostToolUse** | Detect secrets | Scans edited files for API keys, passwords, tokens |
| **Rules (31)** | Governance by context | Branch strategy, debug protocol, bulk change safety, memory limits |
| **CLAUDE.md** | Global behavior | Conventions, security, methodology |

### Agent Teams (Parallel Execution)

```
ag-B-23 --parallel (Team Lead)
  |
  +-- fixer-1 (worktree: bugs in auth module)
  +-- fixer-2 (worktree: bugs in UI module)
  +-- fixer-3 (worktree: bugs in API module)
  |
  Coordinator: merge verified branches → report
```

- Max 4 teammates (memory: 36GB constraint)
- Each agent in isolated worktree (no file conflicts)
- Zero file overlap enforced

### QAT — Quality Acceptance Testing

Traditional tests verify "does it work?" QAT verifies "is the output GOOD?"

- **173 scenarios** with 4-layer evaluation (Smoke → Functional → Quality → Business)
- **AI-as-Judge** scoring 1-10 on domain-specific criteria
- **PDCA cycle** for continuous quality improvement
- **Benchmark mode** comparing app output vs Claude API baseline

### Issue Pipeline (ag-M-51)

```
GitHub Issue → SPEC (mandatory) → Plan → Build → Verify vs SPEC → Test → PR (closes #N)
```

Every issue gets a specification before code. Every delivery is verified against the spec.

### Self-Improvement Pipeline

```
errors-log.md → ag-M-99 (analyze patterns) → ag-M-49 (eval + improve) → better agents
```

## Installation Tiers

| Tier | Files | Setup Time | What's Included |
|------|-------|-----------|-----------------|
| **Starter** | ~7 | 2 min | CLAUDE.md + core rules + safety hooks + orchestrator |
| **Standard** | ~50 | 10 min | + 16 core agents + all rules + all hooks + pattern skills |
| **Full** | 180+ | 20 min | All 46 agents + 60 skills + 12 playbooks + 31 rules + scripts |

## Common Workflows

### New Feature
```
/ag-M-00-orquestrar implement user authentication
→ ag-P-06 (spec) → ag-P-07 (plan) → ag-B-08 (build) → ag-Q-13 (test) → ag-Q-14 (review) → ag-D-18 (PR)
```

### Bug Sprint
```
/ag-M-00-orquestrar fix bugs #100 to #110
→ ag-B-23 --triage (classify) → ag-B-23 --parallel (fix via Teams) → ag-Q-12 (validate)
```

### Resolve GitHub Issue
```
/ag-M-51 resolve issue #201
→ Read issue → Create SPEC → Implement → Verify vs SPEC → Test → PR (closes #201)
```

### Deploy
```
/ag-D-27 full pipeline
→ env-check → typecheck → lint → test → build → deploy → smoke → report
```

### Build From Scratch
```
/ag-M-00-orquestrar new project: task management app with Next.js, Supabase, Tailwind
→ ag-P-01 (scaffold) → ag-P-02 (environment) → ag-P-06 (spec) → ag-P-07 (plan) → ag-B-08 (build)
```

## Rules (31)

Governance documents auto-loaded into every session:

| Rule | Purpose |
|------|---------|
| agent-boundaries | Parallel execution safety, worktree isolation, max 4 agents |
| agent-decision-guide | Quick reference: "I want X → use agent Y" |
| branch-strategy | Feature branches mandatory, naming conventions |
| bulk-change-safety | Max 5 files per batch, tests between batches |
| commit-conventions | Conventional commits, semantic messages |
| context-management | /clear between tasks, /compact at 60% |
| cost-optimization | Model routing, token reduction, budget safety |
| deploy-routing | Preview vs production decision tree |
| incremental-commits | Commit every 3-5 fixes, emergency WIP commits |
| issue-spec-workflow | Issue → SPEC mandatory before implementation |
| memory-safety | tsc limits (3.5GB), LSP for fast validation, cleanup |
| merge-strategy | Squash (features), merge commit (hotfix) |
| quality-gate | Pre-completion checklist, credential preflight |
| root-cause-debugging | 3 questions before any fix, max 2 attempts |
| ... | 17 more specialized rules |

## Playbooks (12)

Strategic workflow guides:

| # | Playbook | Focus |
|---|----------|-------|
| 01 | Spec Driven Development | 80% planning, 20% execution |
| 02 | Project Checklist | 7-section setup verification |
| 03 | Database First | Schema → RLS → Audit → Seeds |
| 04 | Security By Design | 4 permission levels, LGPD |
| 05 | Cost Optimization | Model routing, budget safety |
| 06 | Parallel Development | Multi-branch, feature flags |
| 07 | Quality Assurance | 4 verification levels |
| 08 | Context Memory | /clear, /compact, session persistence |
| 09 | MCP Integration | Sequential execution, validation |
| 10 | Workflow Automation | N8N, idempotency, error handling |
| 11 | Software Incorporation | Strangler Fig, ACL, 5 maturity levels |
| 12 | QAT Methodology | AI-as-Judge, 4 layers, PDCA cycle |

## Configuration

### Customize CLAUDE.md
Copy `CLAUDE.md` to your project root and customize:
- Replace `[YOUR_PROJECT]` with your project details
- Add your stack-specific commands
- List your project's gotchas

### Permissions (settings.local.json)
- **Allow**: npm, npx, bun, git, gh, node, and dev tools
- **Deny**: .env files, SSH keys, secrets, .pem/.key files
- Configure once, works for all sessions

### Adjust Model Routing
Edit agent frontmatter to change model assignments:
```yaml
model: haiku    # Fast, cheap — for scans and triage
model: sonnet   # Balanced — for building and testing (default)
model: opus     # Powerful — for complex analysis and specs
```

## FAQ

**Works with Python/Go/Rust/Java?**
Yes. Agents are language-agnostic. Adjust typecheck/lint/test commands in your CLAUDE.md.

**Do I need all 46 agents?**
No. Start with Starter tier (orchestrator + rules + hooks). Add agents as needed.

**Works on Windows?**
Yes. Shell hooks need Git Bash or WSL. Everything else works natively.

**Can I customize agents?**
Yes. Agents are plain .md files — edit freely. Use ag-M-99 to improve them based on error patterns.

**What is QAT?**
Quality Acceptance Testing. Instead of just checking "does it work?", QAT uses AI to evaluate "is the output good?" — scoring responses on domain-specific criteria like pedagogical quality, language accuracy, and practical applicability.

**Conflicts with other Claude Code setups?**
No. Uses standard .claude/ directory structure. Compatible with other tools and plugins.

## Stats

| Metric | Value |
|--------|-------|
| Sessions analyzed | 193+ |
| Commits generated | 464+ |
| Agents | 46 |
| Skills | 60 |
| Rules | 31 |
| Hooks | 7 (safety-only) |
| Playbooks | 12 |
| QAT scenarios | 173 |
| Plugins integrated | 24 |
| MCP servers | 8 |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on adding agents, skills, rules, and hooks.

## Brand Assets & Design System

Logo vetorial + Design System oficial em `assets/`:

| File | What |
|------|------|
| `assets/logos/raiz-educacao-logo.svg` | SVG logo (pure paths, no fonts, any scale) |
| `assets/logos/raiz-logo-transparente.png` | PNG 900px, transparent background |
| `assets/logos/RaizLogo.tsx` | React/Next.js component |
| **[`assets/raiz-educacao-design-system.md`](assets/raiz-educacao-design-system.md)** | **UX/UI Design System (1045 lines, 13 sections)** |

**Brand colors** (sampled from official logo):

| Element | Hex | UI Token |
|---------|-----|----------|
| Leaves | `#77c6be` | `--raiz-teal` |
| RAIZ | `#f0870b` | `--raiz-orange` |
| educação | `#70c3bb` | `--raiz-teal-light` |

**Design System contents**: Identity, Color palette (30+ tokens), Typography (IBM Plex Sans), Spacing/Grid, Components (Card, KPI, Table, Button, Input, Badge), Layout Patterns (AppShell, Sidebar, Topbar), Dark Mode tokens, Motion, Charts, Accessibility (WCAG AA), CSS Tokens, and a 25-item delivery checklist.

## License

[MIT](LICENSE)

---

*Built by [Andre Gusman](https://github.com/andregusman-raiz). Battle-tested across 193+ development sessions, 464 commits in 15 days.*
*Guide: [Como Eu Trabalho com Claude Code Todo Dia](docs/guia-melhores-praticas-claude-code.html)*
