---
description: "Plugin vs Agent routing — tabela completa de prioridade"
paths:
  - ".claude/**"
---

# Plugin vs Agent Routing

## Principio
Plugins sao atalhos rapidos. Agents sao pipelines com quality gates.
Usar o certo para cada situacao.

## Regras de Preferencia

### Git: ag-versionar-codigo ou skill local /commit-push-pr
- Plugin commit-commands esta DESABILITADO — usar skill local `/commit-push-pr` ou ag-versionar-codigo
- Para projetos com branch protection → SEMPRE usar ag-versionar-codigo

### Code Review: depende do tamanho
- < 10 arquivos, review rapido → `/code-review` ou `/review-pr`
- 10+ arquivos, review completo → ag-revisar-codigo (Teams paired)
- Review + security audit → ag-revisar-codigo + ag-verificar-seguranca (pipeline ag-0-orquestrador)

### Deploy: depende do risco
- Preview/staging rapido → `/deploy` (vercel plugin)
- Producao com pipeline → ag-pipeline-deploy (8 etapas com recovery)
- NUNCA plugin para producao sem CI verde

### Feature: depende da complexidade
- Feature isolada, sem pipeline QA → `/ag-1-construir --draft` (plugin feature-dev esta desabilitado)
- Feature com spec + testes + review → ag-especificar-solucao → ag-planejar-execucao → ag-implementar-codigo (pipeline ag-0-orquestrador)

### Sentry: canonical de monitoring (ADR-0001)
- Debug/triage/fix em produção → `sentry:sentry-workflow`
- Question ad-hoc ("tem erro no projeto X?") → `sentry:seer` (ou `/seer`)
- Setup Sentry SDK em projeto novo → `sentry:sentry-sdk-setup`
- Alerts/OTEL/AI instrumentation → `sentry:sentry-feature-setup`
- ag-monitorar-producao continua como wrapper para multi-monitoring orchestration (Sentry + Web Vitals + auto-rollback)

### Figma: canonical (ADR-0001)
- URL Figma → código React / código → Figma → `figma:figma-generate-design`
- Criar design system no Figma → `figma:figma-generate-library`
- Escrever no canvas Figma (obrigatório antes de `use_figma`) → `figma:figma-use`
- Code Connect → `figma:figma-code-connect`
- ag-11-ux-ui continua como orquestrador de design (curadoria Raiz Library + decisões estilo/paleta/font)

### Chrome DevTools: canonical de browser debug (ADR-0001)
- Navegação localhost / screenshots → **Playwright MCP** (canonical navegação)
- Debug browser / performance / network → `chrome-devtools-mcp:chrome-devtools`
- Otimizar LCP / Core Web Vitals → `chrome-devtools-mcp:debug-optimize-lcp`
- A11y audit → `chrome-devtools-mcp:a11y-debugging`
- Memory leaks → `chrome-devtools-mcp:memory-leak-debugging`

### Supabase: canonical (ADR-0001)
- Qualquer operação Supabase (DB, Auth, Edge Functions, Realtime, Storage, RLS, migrations) → `supabase:supabase`
- Postgres performance/best-practices → `supabase:supabase-postgres-best-practices`
- ag-migrar-dados continua para migrations de ORMs não-Supabase (Prisma, Drizzle, SQL Server)

### AI features: canonical (ADR-0001)
- AI SDK (streaming, tools, agents, embeddings) → `vercel:ai-sdk`
- Multi-provider / failover / cost tracking → `vercel:ai-gateway`
- Chatbot multi-platform (Slack, Telegram, Discord) → `vercel:chat-sdk`
- Durável / long-running workflows → `vercel:workflow`
- Claude API direto (cache, thinking, tool use) → `claude-api`

### Railway: canonical de infra não-Vercel (ADR-0001)
- Railway projects/services/DBs/deploy → `railway:use-railway`

### Data Engine: consumir dados vs pedir acesso
- **Descobrir/consultar dado, KPI, painel, query** (Knowledge Gateway, KPI Ouro, SQL TOTVS/Neon/PBI) → `/ag-12-sql-totvs-zeev`
- **Pedir acesso governado** (uma plataforma/app/agente precisa de credencial/grant para usar dados/APIs já existentes do Data Engine) → `/ag-14-data-engine-cli`
  - Invocação explícita (`disable-model-invocation: true`) — não auto-roteada; o usuário/agente chama por `/ag-14`
  - Fluxo: Knowledge Gateway → `data-engine catalog search` → `access draft` → `validate` → `preview` → `request` → aprovação no Control Plane (a IA nunca aprova, nunca revela segredo)
  - NÃO confundir com "gerar/expor API no Data Engine" (provisioning) nem com consumir dado (ag-12)
- Em dúvida ag-12 vs ag-14: a pergunta é "quero o dado" (ag-12) ou "quero permissão para acessar o dado de outra plataforma" (ag-14)?

### Dead code / refactor: ag-13 vs simplify plugin
- **Dead code elimination (orphan components, unused imports, dead state, dead comments)** → `/ag-13-limpar-codigo`
  - Pipeline 5-fases (Discovery → Multi-tool Scan → AST Custom → Confidence Ranking → Apply Fixes)
  - Ensemble Knip + ts-prune + ESLint + AST custom + bundle analyzer + jscpd (DRY)
  - Confidence tiers (HIGH/MEDIUM/LOW), PRs atomicos por categoria, GitHub issues opt-in
- **Simplificar logica de codigo recente (reuso, qualidade, eficiencia)** → `simplify` (plugin)
  - Foco em codigo recem-modificado, nao detecta dead code
  - Sem ensemble de tools, sem confidence tiers
- **Tech debt geral (mix de issues)** → `/ag-2-corrigir debt [area]`
  - Quando o problema e heterogeneo e ag-13 / simplify nao se encaixam sozinhos
- Em duvida: `/ag-13-limpar-codigo --triage-only` primeiro — se findings sao majoritariamente dead code, seguir com ag-13. Se sao logica complicada, usar simplify.

### Benchmark prompts React/TS — 7 rotas canonicas

Mapeamento dos prompts benchmark de analise de qualidade React/TS (validado 2026-05-12). Cada prompt tem 1 rota primaria + combinacao opcional para audit completo:

| # | Prompt | Rota primaria | Combo audit completo |
|---|---|---|---|
| 1 | **Hooks React** (Rules of Hooks, deps, custom hook, useReducer) | `/ag-auditar-react-hooks --deep` | + `vercel:react-best-practices` apos editar TSX |
| 2 | **TypeScript** (any, props sem tipo, interface vs type) | `/ag-2-corrigir --audit-any` | + `pr-review-toolkit:type-design-analyzer` em PR |
| 3 | **Separacao responsabilidades** (UI com biz logic, fetch direto) | `/ag-avaliar-arquitetura` (dimensao PATTERNS) | + `ag-revisar-codigo` em PR |
| 4 | **Error handling** (try/catch, async silencioso, Error Boundary + retry) | `pr-review-toolkit:silent-failure-hunter` | + `/ag-cacar-bugs --deep` (categoria 4) |
| 5 | **Performance** (memo, useCallback, useMemo, virtualizacao, imagens) | `/ag-otimizar-codigo` (checklist React/Next) | + `chrome-devtools-mcp:debug-optimize-lcp` |
| 6 | **DRY / duplicacao** | `/ag-13-limpar-codigo categoria:duplicacao` (jscpd) | + `simplify` para refactor pontual |
| 7 | **Dead code** | `/ag-13-limpar-codigo --triage-only` ou `--apply-quick-wins` | (cobertura completa, sem combo) |

**Audit dos 7 de uma vez em projeto:**
```bash
/ag-9-auditar [path]                  # FORTRESS: cobre #3 (ARCHITECT) + bullets de #4/#5/#7
/ag-auditar-react-hooks [path] --deep # cobre #1
/ag-2-corrigir --audit-any [path]     # cobre #2
/ag-13-limpar-codigo [path]           # cobre #6 + #7
```

Cobertura validada: 7/7 prompts com rota canonical (2/7 excelente, 3/7 boa, 2/7 que eram criticos agora cobertos: #1 via skill nova, #6 via jscpd).

### Harness audit (auditoria do proprio Claude Code)

Auditar o proprio harness (skills, hooks, rules, MCPs) — equivalente local ao AgentShield do ECC:

| Necessidade | Rota canonical |
|---|---|
| Audit completo do harness (HCS) | `/ag-9-auditar --include-harness` ou `/ag-auditar-harness` direto |
| So otimizar (cache markers, dead skills, MCP roi) | `/ag-otimizar-harness` ou `/ag-13-limpar-codigo --target=harness` |
| Revisar candidatos auto-extraidos da sessao | `/ag-retrospectiva --instincts` |
| Revisar memories obsoletos | `/ag-retrospectiva --review-stale` (apos `memory-decay.py`) |

Rules aplicaveis: `harness-coverage.md` (R1-R10).
