<p align="center">
  <img src="assets/logos/raiz-educacao-logo.svg" alt="rAIz Educação" width="180" />
</p>

# Gusman Claude Agent System

> Transform Claude Code from a passive assistant into an autonomous development platform.
> 13 machines, 52 internal agents, 66 skills. Battle-tested across 193+ real sessions. Self-improving.

## Why This Exists

Claude Code is powerful but generic. This framework adds:
- **13 numbered machines** — autonomous pipelines with convergence loops (MERIDIAN pattern)
- **Defense-in-depth safety** with 4 layers of protection (hooks, rules, permissions, governance)
- **Self-improvement pipeline** that learns from failures and improves agent prompts
- **Model routing** that uses the right model for the right task (haiku for scans, opus for debugging)
- **Parallel execution** via Agent Teams for bug sprints, multi-module builds, and audits
- **QAT (Quality Acceptance Testing)** — AI-as-Judge validates output quality, not just functionality
- **Issue pipeline** — GitHub Issue → SPEC → Build → Verify → Test → PR (fully automated)

## Quick Start

```bash
# One-line install (clones repo + symlinks into .claude/ + auto-update hook)
curl -fsSL https://raw.githubusercontent.com/andregusman-raiz/a-gusman-claude/main/install.sh | bash

# Or clone manually
git clone https://github.com/andregusman-raiz/a-gusman-claude.git ~/.gusman-claude
bash ~/.gusman-claude/install.sh

# Start Claude Code and use any machine
claude
# Then type: /ag-0-orquestrador [describe what you want]
# Or directly: /ag-1-construir implement user auth
```

### What install.sh does

1. **Clones** the repo to `~/.gusman-claude/` (the source of truth)
2. **Symlinks** `agents/`, `skills/`, `rules/`, `hooks/`, `shared/` into your `.claude/`
3. **Installs auto-update hook** that `git pull`s latest on every session start (~1h throttle)

**Your files are never touched**: `settings.local.json`, `projects/`, memory — all yours.

### Auto-update

Every time you start Claude Code, a SessionStart hook checks for updates:
- Runs `git pull --ff-only` in background (never blocks startup)
- Throttled to max once per hour
- To disable: `bash install.sh --no-auto-update` or delete `.claude/hooks/auto-update.sh`
- To update manually: `cd ~/.gusman-claude && git pull`

### Uninstall

```bash
bash ~/.gusman-claude/install.sh --uninstall
# Removes symlinks and repo. Your settings/memory preserved.
```

## Architecture — 13 Machines

Each machine is an **autonomous pipeline** following the MERIDIAN pattern:
phases → convergence loop → state persistence → self-healing → artifacts.

The user interacts with **13 commands**. Each machine internally orchestrates multiple agents.

```
ag-0  ORQUESTRADOR ← entry point (classifies intent → delegates to machine)
  │
  ├── ag-1  CONSTRUIR      feature, issue, refactor, optimize, ui, integrate
  ├── ag-2  CORRIGIR       bugs, TypeScript errors, tech debt
  ├── ag-3  ENTREGAR       preview, production, rollback
  ├── ag-4  TESTE-FINAL    QAT, UX-QAT, benchmark, E2E, test-fix-retest
  ├── ag-5  DOCUMENTOS     project docs, Office, organize, spelling
  ├── ag-6  INICIAR        new project, setup, explore, research
  ├── ag-7  QUALIDADE      MERIDIAN (5D autonomous QA, MQS ≥ 85)
  ├── ag-8  SEGURANCA      SENTINEL (6D security+load+LGPD, SSS ≥ 80)
  ├── ag-9  AUDITAR        FORTRESS (full audit: 5 machines sequentially)
  ├── ag-10 BENCHMARK      Crawl SaaS platforms, screenshot, AI analysis, SPEC
  ├── ag-11 DESENHAR       UI/UX design intelligence (67 styles, 96 palettes)
  └── ag-12 SQL-TOTVS      SQL Server (TOTVS RM) + PostgreSQL optimization

Safety Layers:
[PreToolUse Hooks] → [Rules (27)] → [Permissions] → [CLAUDE.md]
```

### How Machines Work (MERIDIAN Pattern)

Every machine follows the same pattern:

1. **ASSESS** — auto-detect sub-mode from user input
2. **Phase sequence** — SPEC → PLAN → BUILD → VERIFY (varies by machine)
3. **Convergence** — VERIFY loops back to BUILD if threshold not met (max 2-3 cycles)
4. **State persistence** — `*-state.json` allows `--resume` after interruption
5. **Self-healing** — failures trigger alternatives, never block
6. **Artifacts** — tangible outputs (PR, SPEC, certificate, report)

## Common Workflows

### Build a Feature
```
/ag-1-construir implement user authentication with Clerk
→ ASSESS (feature mode) → SPEC → PLAN → BUILD → VERIFY → REVIEW → PR
```

### Fix Bugs
```
/ag-2-corrigir login not working after Clerk update
→ ASSESS (single bug) → DIAGNOSE → FIX → VERIFY (loop until green) → PR
```

### Fix Multiple Bugs
```
/ag-2-corrigir lista: [bug1, bug2, bug3, bug4, bug5]
→ auto-routes to batch mode → sprints with incremental commits → PR
```

### Resolve GitHub Issue
```
/ag-1-construir issue #42
→ Fetch issue → SPEC → PLAN → BUILD → VERIFY vs SPEC → TEST → PR (closes #42)
```

### Deploy to Production
```
/ag-3-entregar producao
→ PREFLIGHT (credentials + typecheck + lint + test + build) → DEPLOY → SMOKE → MONITOR
```

### Quality Audit
```
/ag-7-qualidade https://myapp.vercel.app
→ MERIDIAN: SCOUT → SIEGE (5D) → FORGE (fix) → CONVERGE (MQS ≥ 85) → CERTIFICATE
```

### Full Software Audit
```
/ag-9-auditar https://myapp.vercel.app
→ FORTRESS: MERIDIAN → SENTINEL → ARCHITECT → CONDUCTOR → LIGHTHOUSE → Fortress Score
```

### Design UI/UX
```
/ag-11-desenhar landing page minimalist dark mode
→ Design system selection, palette, typography, components, implementation
```

### New Project from Scratch
```
/ag-6-iniciar projeto SaaS with Next.js + Supabase + Clerk
→ SCAFFOLD → SETUP → EXPLORE → ready for /ag-1-construir
```

### Or Just Let the Orchestrator Decide
```
/ag-0-orquestrador [describe anything you want]
→ classifies into 1 of 13 machines → delegates automatically
```

## Machine Details

| # | Command | Sub-modes | Internal Agents |
|---|---------|-----------|-----------------|
| 0 | `/ag-0-orquestrador` | auto-route | — |
| 1 | `/ag-1-construir` | feature, issue, refactor, optimize, ui, integrate, --validado | ag-especificar-solucao, ag-planejar-execucao, ag-implementar-codigo, ag-validar-execucao, ag-testar-codigo, ag-revisar-codigo |
| 2 | `/ag-2-corrigir` | bug, tipos, batch, debt, triage | ag-depurar-erro, ag-corrigir-bugs, ag-corrigir-tipos |
| 3 | `/ag-3-entregar` | preview, producao, rollback | ag-versionar-codigo, ag-pipeline-deploy, ag-smoke-vercel, ag-monitorar-producao |
| 4 | `/ag-4-teste-final` | qat, ux-qat, benchmark, ciclo, e2e | ag-testar-qualidade-qat, ag-testar-ux-qualidade, ag-benchmark-qualidade, ag-ciclo-testes |
| 5 | `/ag-5-documentos` | projeto, office, organizar, ortografia | ag-documentar-projeto, ag-gerar-documentos, ag-organizar-arquivos, ag-revisar-ortografia |
| 6 | `/ag-6-iniciar` | projeto, ambiente, explorar, pesquisar | ag-criar-projeto, ag-preparar-ambiente, ag-explorar-codigo, ag-pesquisar-referencia |
| 7 | `/ag-7-qualidade` | — | ag-meridian (MERIDIAN engine) |
| 8 | `/ag-8-seguranca` | — | ag-sentinel (SENTINEL engine) |
| 9 | `/ag-9-auditar` | — | ag-fortress (FORTRESS engine) |
| 10 | `/ag-10-benchmark-software` | — | Playwright crawl + AI analysis |
| 11 | `/ag-11-desenhar` | plan, build, review | 67 styles, 96 palettes, 13 stacks |
| 12 | `/ag-12-sql-totvs` | — | SQL Server + PostgreSQL patterns |

## Plugins (Shortcuts — No Pipeline)

Plugins complement machines for quick, single-action tasks:

| Command | What |
|---------|------|
| `/code-review` | Quick PR review (< 10 files) |
| `/commit` | Git commit (no branch-guard) |
| `/commit-push-pr` | Commit + push + PR |
| `/deploy` | Quick Vercel deploy |
| `/feature-dev` | Self-contained feature (no QA pipeline) |
| `/seer` | Sentry error investigation |
| `/summarize-channel` | Slack channel digest |
| `/clean_gone` | Clean deleted remote branches |

**Rule**: Plugin for quick action. Machine for pipeline with convergence.

## Reference Skills (On-Demand Expertise)

Load domain knowledge into context when needed:

| Skill | Domain |
|-------|--------|
| `/ag-referencia-nextjs` | Next.js + React patterns |
| `/ag-referencia-typescript` | TypeScript strict mode |
| `/ag-referencia-python` | Python patterns |
| `/ag-referencia-supabase` | Supabase, PostgreSQL, RLS |
| `/ag-referencia-qualidade` | Quality gates, anti-theatrical tests |
| `/ag-referencia-sdd` | Spec Driven Development methodology |
| `/ag-referencia-seguranca-rules` | Security, LGPD, permissions |
| `/ag-referencia-mock-first` | Mock-First methodology for integrations |

## Safety (Defense-in-Depth)

| Layer | What | How |
|-------|------|-----|
| **PreToolUse** | Block dangerous commands | force push, --no-verify, commits on main, config overwrites |
| **PostToolUse** | Detect secrets | Scans edited files for API keys, passwords, tokens |
| **Rules (27)** | Governance by context | Branch strategy, debug protocol, bulk change safety, memory limits |
| **CLAUDE.md** | Global behavior | Conventions, security, methodology |

## Configuration

### Customize CLAUDE.md
Copy `CLAUDE.md` to your project root and customize:
- Replace `[YOUR_PROJECT]` with your project details
- Add your stack-specific commands
- List your project's gotchas

### Permissions (settings.local.json)
- **Allow**: npm, npx, bun, git, gh, node, and dev tools
- **Deny**: .env files, SSH keys, secrets, .pem/.key files

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

**Do I need all 52 agents?**
No. The 13 machines are the interface. Internal agents are called automatically. You never need to know they exist.

**Works on Windows?**
Yes. Shell hooks need Git Bash or WSL. Everything else works natively.

**Can I customize agents?**
Yes. Agents are plain .md files — edit freely. Use ag-melhorar-agentes to improve them based on error patterns.

**What is QAT?**
Quality Acceptance Testing. Instead of just checking "does it work?", QAT uses AI to evaluate "is the output good?" — scoring responses on domain-specific criteria.

**Conflicts with other Claude Code setups?**
No. Uses standard .claude/ directory structure. Compatible with other tools and plugins.

## Stats

| Metric | Value |
|--------|-------|
| Sessions analyzed | 193+ |
| Commits generated | 464+ |
| **Machines** | **13** (ag-0 to ag-12) |
| Internal agents | 52 |
| Skills | 66 |
| Rules | 27 |
| Hooks | 8 (safety-only) |
| Playbooks | 12 |
| QAT scenarios | 173 |
| Plugins integrated | 24 |
| MCP servers | 8 |
| Reference skills | 8 |

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

## License

[MIT](LICENSE)

---

*Built by [Andre Gusman](https://github.com/andregusman-raiz). Battle-tested across 193+ development sessions, 464 commits in 15 days.*
*Guide: [Como Eu Trabalho com Claude Code Todo Dia](docs/guia-melhores-praticas-claude-code.html)*
