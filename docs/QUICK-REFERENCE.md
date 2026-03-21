# Quick Reference Card

## All Commands

| Command | Agent | Purpose |
|---------|-------|---------|
| `/ag-M-00` | Orchestrator | Classify intent, route to correct agent |
| `/ag-P-01` | Scaffold | Initialize new project structure |
| `/ag-P-02` | Setup | Dev environment, Docker, CI/CD |
| `/ag-P-03` | Explore | Map codebase structure and stack |
| `/ag-P-04` | Analyze | Diagnose tech debt, code quality |
| `/ag-P-05` | Research | Find solutions, benchmarks, alternatives |
| `/ag-P-06` | Spec | Write technical specification |
| `/ag-P-07` | Plan | Decompose spec into task plan |
| `/ag-B-08` | Build | Implement code from plan |
| `/ag-B-09` | Debug | Root-cause analysis and fix |
| `/ag-B-10` | Refactor | Restructure without behavior change |
| `/ag-B-11` | Optimize | Performance and legibility |
| `/ag-Q-12` | Validate | Verify plan vs implementation |
| `/ag-Q-13` | Test | Unit + integration tests |
| `/ag-Q-14` | Review | Code review and critique |
| `/ag-Q-15` | Audit | Security audit (OWASP, deps, secrets) |
| `/ag-Q-16` | UX Review | Accessibility, usability |
| `/ag-D-17` | Migrate | Database migrations |
| `/ag-D-18` | Git | Branches, commits, PRs |
| `/ag-D-19` | Deploy | Deploy to production |
| `/ag-D-20` | Monitor | Post-deploy health checks |
| `/ag-W-21` | Document | README, API docs, guides |
| `/ag-Q-22` | E2E Test | Playwright end-to-end tests |
| `/ag-B-23` | Batch Fix | Fix 3-5 bugs sequentially |
| `/ag-B-24` | Parallel Fix | Fix 6+ bugs via Agent Teams |
| `/ag-B-25` | Triage | Classify bugs by severity |
| `/ag-B-26` | Verified Fix | Fix with 5 quality gates |
| `/ag-D-27` | Pipeline | Full deploy pipeline |
| `/ag-M-28` | Health | Session health check |
| `/ag-W-29` | Office | Generate PPTX/DOCX/XLSX |
| `/ag-W-30` | Organize | File organization |
| `/ag-W-31` | Spell Check | Spelling and grammar |
| `/ag-I-32` | Due Diligence | Evaluate external software |
| `/ag-I-33` | Integration Map | Map integration dimensions |
| `/ag-I-34` | Incorporation Plan | Roadmap for adoption |
| `/ag-I-35` | Incorporate | Execute module adoption |
| `/ag-Q-36` | Manual QA | Exploratory testing via MCP |
| `/ag-Q-37` | Generate Tests | Create Playwright tests from flows |
| `/ag-D-38` | Smoke Test | Verify Vercel deployment |
| `/agM` | Meta-Improve | Analyze and improve agent prompts |

## Common Recipes

```bash
# Understand a new codebase
/ag-M-00 analyze this project

# Build a feature end-to-end
/ag-P-06 spec: [feature description]
/ag-P-07 plan from spec
/ag-B-08 build from plan
/ag-Q-13 test
/ag-D-18 commit and create PR

# Fix bugs fast
/ag-B-25 triage these bugs: [list]
/ag-B-24 fix in parallel

# Deploy safely
/ag-D-27 full pipeline to production

# Improve the system itself
/agM diagnose agents from errors-log
```
