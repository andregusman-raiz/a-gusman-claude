# Plugin vs Agent Routing

## Principio
Plugins sao atalhos rapidos. Agents sao pipelines com quality gates.
Usar o certo para cada situacao.

## Regras de Preferencia

### Git: ag-versionar-codigo sobre /commit
- `/commit` e `/commit-push-pr` do plugin commit-commands NAO tem branch-guard nem lint-staged awareness
- Para projetos com branch protection → SEMPRE usar ag-versionar-codigo
- `/commit` plugin aceitavel apenas para: repos sem protecao, quick fixes em branch ja criada
- `/clean_gone` do plugin e seguro — nao tem equivalente em agents

### Code Review: depende do tamanho
- < 10 arquivos, review rapido → `/code-review` ou `/review-pr`
- 10+ arquivos, review completo → ag-revisar-codigo (Teams paired)
- Review + security audit → ag-revisar-codigo + ag-verificar-seguranca (pipeline ag-0-orquestrador)

### Deploy: depende do risco
- Preview/staging rapido → `/deploy` (vercel plugin)
- Producao com pipeline → ag-pipeline-deploy (8 etapas com recovery)
- NUNCA plugin para producao sem CI verde

### Feature: depende da complexidade
- Feature isolada, sem pipeline QA → `/feature-dev`
- Feature com spec + testes + review → ag-especificar-solucao → ag-planejar-execucao → ag-implementar-codigo (pipeline ag-0-orquestrador)

### Sentry: canonical de monitoring (ADR-0001)
- Debug/triage/fix em produção → `sentry:sentry-workflow`
- Question ad-hoc ("tem erro no projeto X?") → `sentry:seer` (ou `/seer`)
- Setup Sentry SDK em projeto novo → `sentry:sentry-sdk-setup`
- Alerts/OTEL/AI instrumentation → `sentry:sentry-feature-setup`
- ag-monitorar-producao continua como wrapper para multi-monitoring orchestration (Sentry + Web Vitals + auto-rollback)

### Figma: canonical (ADR-0001)
- URL Figma → código React → `figma:figma-implement-design`
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
