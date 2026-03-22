# ag-M-00 — Full Agent Catalog & Shortcuts

## Full Agent Catalog

| ID | Nome | Model | Capacidades | Quando |
|----|------|-------|-------------|--------|
| ag-P-01 | iniciar-projeto | sonnet | Skill | Projeto do zero |
| ag-P-02 | setup-ambiente | sonnet | Skill | Infra dev/CI |
| ag-P-03 | explorar-codigo | haiku | BG | Mapear codebase |
| ag-P-04 | analisar-contexto | opus | BG,Plan | Tech debt, riscos |
| ag-P-05 | pesquisar-referencia | haiku | BG | Benchmarks, alternativas |
| ag-P-06 | especificar-solucao | opus | — | Criar SPEC |
| ag-P-07 | planejar-execucao | opus | — | Criar task_plan |
| ag-B-08 | construir-codigo | sonnet | Teams,Sub,WT | Implementar codigo |
| ag-B-09 | depurar-erro | opus | Sub | Debug complexo |
| ag-B-10 | refatorar-codigo | sonnet | WT | Reestruturar |
| ag-B-11 | otimizar-codigo | sonnet | WT | Performance |
| ag-Q-12 | validar-execucao | haiku | BG,Plan | Checar completude |
| ag-Q-13 | testar-codigo | sonnet | Teams,Sub,BG | Testes unit/integ |
| ag-Q-14 | criticar-projeto | sonnet | Teams,Sub,BG,Plan | Code review |
| ag-Q-15 | auditar-codigo | sonnet | Sub,BG,Plan | Security audit |
| ag-Q-16 | revisar-ux | sonnet | BG,Plan | UX review |
| ag-D-17 | migrar-dados | sonnet | — | DB migrations |
| ag-D-18 | versionar-codigo | sonnet | — | Git, PRs, releases |
| ag-D-19 | publicar-deploy | sonnet | — | Deploy |
| ag-D-20 | monitorar-producao | sonnet | BG,Plan | SRE pos-deploy |
| ag-W-21 | documentar-projeto | sonnet | — | Docs, README |
| ag-Q-22 | testar-e2e | sonnet | Teams,Sub | Playwright E2E |
| ag-B-23 | bugfix | sonnet | Teams,Sub,WT | Bugfix unificado (triage/fix/batch/parallel) |
| ag-D-27 | deploy-pipeline | sonnet | Teams,Sub | Pipeline E2E |
| ag-M-28 | saude-sessao | haiku | BG | Health check |
| ag-W-29 | gerar-documentos | sonnet | Teams,Sub | Office docs |
| ag-W-30 | organizar-arquivos | sonnet | — | Taxonomia |
| ag-W-31 | revisar-ortografia | haiku | — | Spell check |
| ag-I-32 | due-diligence | sonnet | BG,Plan | Avaliar software |
| ag-I-33 | mapear-integracao | sonnet | BG,Plan | Mapa integracao |
| ag-I-34 | planejar-incorporacao | sonnet | — | Roadmap incorp. |
| ag-I-35 | incorporar-modulo | sonnet | WT,Plan | Executar incorp. |
| ag-Q-36 | testar-manual-mcp | sonnet | — | QA exploratorio |
| ag-Q-37 | gerar-testes-mcp | sonnet | Skill | Testes de fluxo |
| ag-D-38 | smoke-vercel | sonnet | Skill | Smoke deploys |
| ag-Q-39 | ciclo-teste-completo | opus | BG | Test-Fix-Retest cycle |
| ag-Q-40 | testar-qualidade | sonnet | BG | QAT PDCA (textual) |
| ag-Q-41 | criar-cenario-qat | sonnet | BG | Cenarios QAT (textual) |
| ag-Q-42 | testar-ux-qualidade | sonnet | BG | UX-QAT PDCA (visual) |
| ag-Q-43 | criar-cenario-ux-qat | sonnet | BG | Cenarios UX-QAT (visual) |
| ag-Q-44 | benchmark-qualidade | sonnet | BG | QAT-Benchmark PDCA (parity) |
| ag-Q-45 | criar-cenario-benchmark | sonnet | BG | Cenarios benchmark (comparativo) |
| ag-X-46 | buscar-voos | haiku | — | Buscar passagens |
| ag-M-47 | criar-agente | opus | — | Criar novos agentes |
| ag-M-48 | retrospectiva | sonnet | BG | Retrospectiva de sessao |
| ag-M-50 | registrar-issue | haiku | BG | GitHub Issues para problemas nao resolvidos |
| ag-M-51 | issue-pipeline | sonnet | Sub | Issue→SPEC→Build→Verify→Test pipeline |
| ag-M-99 | melhorar-agentes | opus | Skill | Self-improvement |
| ag-M-49 | criar-skill | opus | Skill,fork | Criar/melhorar skills (eval framework) |
| ag-B-50 | construir-validado | sonnet | fork | Builder+Validator concorrente |
| ag-Q-51 | testar-e2e-batch | sonnet | — | E2E em batches com auto-fix |
| ag-B-52 | design-ui-ux | sonnet | Skill,fork | UI/UX design intelligence |
| ag-B-53 | fix-typescript (--scan/--fix/--sweep) | sonnet | BG | Corrigir erros TS (scan/batch/sweep) |
| ag-R-53 | patterns-nextjs | — | fork | Ref: Next.js + React patterns |
| ag-R-54 | patterns-typescript | — | fork | Ref: TypeScript strict mode |
| ag-R-55 | patterns-python | — | fork | Ref: Python patterns |
| ag-R-56 | patterns-supabase | — | fork | Ref: Supabase/PostgreSQL/RLS |
| ag-R-57 | quality-gates | — | fork | Ref: Quality gates, anti-teatralidade |
| ag-R-58 | sdd-methodology | — | fork | Ref: SDD PRD→SPEC→Exec→Review |
| ag-R-59 | security-rules | — | fork | Ref: Seguranca, RLS, LGPD |

Legenda: BG=background, Sub=subagents, WT=worktree, Teams=Agent Teams, Plan=permissionMode:plan, fork=context isolado, Ref=reference (passiva)

## Plugin Commands & Skills

| Plugin | Command/Skill | Capacidade | Quando preferir sobre agent |
|--------|---------------|------------|----------------------------|
| code-review | `/code-review` | 5 agents paralelos, scoring 0-100, comenta no PR | Review rapido < 10 arquivos |
| pr-review-toolkit | `/review-pr [aspects]` | 6 agents: code, comments, tests, silent-failures, types, simplifier | Review detalhado por aspecto |
| commit-commands | `/commit`, `/commit-push-pr`, `/clean_gone` | Git workflow automatizado | Commit rapido (SEM branch-guard) |
| feature-dev | `/feature-dev` | 7 fases: discovery→build→review, 3 agents | Feature self-contained |
| code-simplifier | agent `code-simplifier` | Simplifica codigo (opus) | Refino pos-implementacao |
| claude-md-management | `/revise-claude-md` | Auditoria e update de CLAUDE.md | Manter CLAUDE.md atualizado |
| hookify | `/hookify` | Criar hooks via markdown | Regras ad-hoc sem editar JSON |
| skill-creator | skill `skill-creator` | Criar/melhorar skills com evals | Otimizar skills existentes |
| agent-sdk-dev | `/new-sdk-app` | Scaffold Agent SDK (Python/TS) | Criar app com Claude Agent SDK |
| vercel | `/deploy`, `/vercel-logs` | Deploy direto Vercel | Deploy rapido sem pipeline |
| sentry | `/seer` + MCP | Queries de erros em tempo real | Debug producao |
| slack | `/summarize-channel`, `/standup`, `/find-discussions` | Slack integrado | Comunicacao e digest |
| figma | `implement-design`, `code-connect-components` | Figma → codigo | Design tokens e Code Connect |
| frontend-design | skill `frontend-design` | UI com estetica forte | Interfaces anti-genericas |
| security-guidance | hook PreToolUse | Reminder de seguranca ao editar | Automatico (sempre ativo) |

## Plugin MCP Servers

| MCP | Ferramentas principais | Uso |
|-----|----------------------|-----|
| context7 | Docs de libs por versao | Evitar hallucination de APIs |
| supabase | DB, auth, storage, realtime | Operacoes Supabase nativas |
| github | Issues, PRs, code search | GitHub alem do `gh` CLI |
| playwright | Browser automation | QA exploratorio (ag-Q-36) |
| linear | Issues, projetos, workflows | Gestao tarefas Linear |
| greptile | PR reviews, code search | Reviews automatizadas |
| slack | Messaging, search | Comunicacao Slack |
| sentry | Errors, alerts, perf | Monitoramento producao |
| figma | Design tokens, Code Connect | Design → codigo |

## Full Shortcuts Table

| Sinal | Atalho |
|-------|--------|
| < 20 palavras, escopo claro | Quick: ag-B-08 → ag-B-23 --fix |
| Ja tem spec/plano | Pula design, vai direto build |
| Typo/config | ag-B-08 quick → ag-D-18 |
| Chama agente direto (/ag-XX) | Respeita — nao intercepta |
| ID de roadmap (QS-BUG-015) | Roadmap: localizar e executar |
| "triar", "intake" | ag-B-23 --triage: triagem primeiro |
| "sprint", "sprint W10" | Sprint: planejar sprint |
| "deploy seguro" | ag-D-27: pipeline completo (com auto-recovery) |
| "fix e commit" | ag-B-23 --fix: pipeline com 5 gates |
| "bugs em paralelo" | ag-B-23 --parallel: bugfix paralelo (Teams) |
| "lista de bugs" / "diagnosticar" | ag-B-23 --triage: triagem primeiro |
| "health check" / "saude" | ag-M-28: verificar ambiente |
| "batch fix" / "sprint de bugs" | ag-B-23 --batch: bugfix batch (worktree + Teams) |
| "pptx" / "slides" | ag-W-29: gerar documentos (Teams se 5+ modulos) |
| "organizar" / "limpar pasta" | ag-W-30: organizar arquivos |
| "ortografia" / "spell check" | ag-W-31: revisar ortografia |
| "criar skill" / "benchmark skill" | ag-M-49: criar-skill |
| "indexar" / "knowledge base" | Infraestrutura: ingest.py |
| "incorporar" / "due diligence" | ag-I-32 primeiro |
| "testar manual" / "QA exploratorio" | ag-Q-36: teste manual via MCP |
| "gerar testes" | ag-Q-37 (Skill): gerar testes via MCP |
| "smoke" / "verificar deploy" | ag-D-38: smoke test Vercel |
| "testes teatrais" / "audit testes" | Test Quality Audit workflow |
| "limpar testes" / "corrigir testes" | Bulk Test Remediation workflow |
| "avaliar UX" / "qualidade UX" / "UX-QAT" | ag-Q-42: UX-QAT PDCA visual |
| "criar cenario UX" / "nova tela QAT" | ag-Q-43: criar cenario UX-QAT |
| "setup UX-QAT" | ag-Q-43 setup: estrutura + design tokens |
| "QAT" / "qualidade aceitacao" | ag-Q-40: QAT PDCA textual |
| "criar cenario QAT" | ag-Q-41: criar cenario QAT |
| "benchmark" / "parity" / "vs baseline" | ag-Q-44: QAT-Benchmark PDCA comparativo |
| "criar cenario benchmark" | ag-Q-45: criar cenario benchmark |
| "review grande" (10+ arquivos) | ag-Q-14 Teams: paired review+audit |
| "testar tudo" | ag-Q-13 Teams: unit + integ + E2E paralelo |
| "retrospectiva" / "retro" | ag-M-48: analise de sessao |
| "fix tipos" / "typecheck" / "erros TS" / "sweep" | ag-B-53: scan/fix/sweep TypeScript |
| "issue #N" / "resolver issue" / "implementar ticket" | ag-M-51: Issue→SPEC→Build→Verify→Test |

## QAT-Benchmark Workflow Details

```
Primeiro uso no projeto?
├── SIM → copiar templates: cp -r ~/.shared/templates/qat-benchmark/ tests/qat-benchmark/
│   → configurar adapters + API keys
│   → ag-Q-45 (criar cenarios iniciais — 5 fixed + 10 rotatable)
│   → ag-Q-44 (PDCA benchmark completo)
├── NAO → ag-Q-44 direto

ag-Q-44 (benchmark-qualidade): PDCA cycle comparativo
  PLAN: carregar KB, selecionar cenarios (anti-contaminacao 30/70)
  DO: dual-run (app Playwright + baseline Claude API) + triple-score (L1-L4)
  CHECK: classificar falhas (7 categorias), Parity Index por dimensao
  ACT: atualizar baselines, registrar patterns, gerar report

ag-Q-45 (criar-cenario-benchmark): Cria cenarios comparativos
  Analisa cobertura, design por 8 dimensoes, anti-contaminacao
  Output: TypeScript em scenarios/fixed/ ou scenarios/rotatable/

Frequencia:
├── Pos-deploy → /ag-Q-44 [url] all smoke (~$0.12-0.25)
├── Semanal → /ag-Q-44 [url] all standard (~$2-4)
├── Mensal → /ag-Q-44 [url] all full (~$6-12, 3 judges)
├── Novo cenario → /ag-Q-45 capability="X"
└── Complementar → ag-Q-40 (absoluto) + ag-Q-44 (relativo) em paralelo
```
