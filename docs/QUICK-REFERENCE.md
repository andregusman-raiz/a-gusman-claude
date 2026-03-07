# Quick Reference Card

## All Commands

| Command | Agent | Purpose |
|---------|-------|---------|
| `/ag00` | Orchestrator | Classify intent, route to correct agent |
| `/ag01` | Scaffold | Initialize new project structure |
| `/ag02` | Setup | Dev environment, Docker, CI/CD |
| `/ag03` | Explore | Map codebase structure and stack |
| `/ag04` | Analyze | Diagnose tech debt, code quality |
| `/ag05` | Research | Find solutions, benchmarks, alternatives |
| `/ag06` | Spec | Write technical specification |
| `/ag07` | Plan | Decompose spec into task plan |
| `/ag08` | Build | Implement code from plan |
| `/ag09` | Debug | Root-cause analysis and fix |
| `/ag10` | Refactor | Restructure without behavior change |
| `/ag11` | Optimize | Performance and legibility |
| `/ag12` | Validate | Verify plan vs implementation |
| `/ag13` | Test | Unit + integration tests |
| `/ag14` | Review | Code review and critique |
| `/ag15` | Audit | Security audit (OWASP, deps, secrets) |
| `/ag16` | UX Review | Accessibility, usability |
| `/ag17` | Migrate | Database migrations |
| `/ag18` | Git | Branches, commits, PRs |
| `/ag19` | Deploy | Deploy to production |
| `/ag20` | Monitor | Post-deploy health checks |
| `/ag21` | Document | README, API docs, guides |
| `/ag22` | E2E Test | Playwright end-to-end tests |
| `/ag23` | Batch Fix | Fix 3-5 bugs sequentially |
| `/ag24` | Parallel Fix | Fix 6+ bugs via Agent Teams |
| `/ag25` | Triage | Classify bugs by severity |
| `/ag26` | Verified Fix | Fix with 5 quality gates |
| `/ag27` | Pipeline | Full deploy pipeline |
| `/ag28` | Health | Session health check |
| `/ag29` | Office | Generate PPTX/DOCX/XLSX |
| `/ag30` | Organize | File organization |
| `/ag31` | Spell Check | Spelling and grammar |
| `/ag32` | Due Diligence | Evaluate external software |
| `/ag33` | Integration Map | Map integration dimensions |
| `/ag34` | Incorporation Plan | Roadmap for adoption |
| `/ag35` | Incorporate | Execute module adoption |
| `/ag36` | Manual QA | Exploratory testing via MCP |
| `/ag37` | Generate Tests | Create Playwright tests from flows |
| `/ag38` | Smoke Test | Verify Vercel deployment |
| `/agM` | Meta-Improve | Analyze and improve agent prompts |

## Common Recipes

```bash
# Understand a new codebase
/ag00 analyze this project

# Build a feature end-to-end
/ag06 spec: [feature description]
/ag07 plan from spec
/ag08 build from plan
/ag13 test
/ag18 commit and create PR

# Fix bugs fast
/ag25 triage these bugs: [list]
/ag24 fix in parallel

# Deploy safely
/ag27 full pipeline to production

# Improve the system itself
/agM diagnose agents from errors-log
```
