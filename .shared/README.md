# .shared/ — Biblioteca de Best Practices

Camada 2 da arquitetura de 3 camadas para compartilhar conhecimento entre projetos.

## Arquitetura

```
Camada 1: WORKSPACE (~/.claude/)     → Agents, hooks, rules, playbooks (universais)
Camada 2: SHARED    (~/.shared/)     → Templates, patterns, ADRs, gotchas (reutilizaveis)
Camada 3: PROJECT   (GitHub/<proj>/) → CLAUDE.md, skills, overrides (especificos)
```

## Estrutura

```
.shared/
├── patterns/            # Documentos de referencia (16 docs)
│   ├── agent-testing.md     # Testes para sistemas multi-agente
│   ├── api-design.md        # REST API conventions, Zod, pagination
│   ├── background-jobs.md   # N8N, webhooks, idempotencia, retry
│   ├── caching-state.md     # Redis, React Query, Next.js cache
│   ├── cost-optimization.md # Model routing, token efficiency
│   ├── db-performance.md    # Indices RLS, N+1, pooling, Redis
│   ├── deploy.md            # CI/CD, smoke tests, rollback
│   ├── error-handling.md    # Result type, structured logging, Sentry
│   ├── llm-integration.md   # Multi-provider, streaming, fallback
│   ├── monitoring-alerting.md # Health, DORA, Sentry, alerting
│   ├── roadmap.md           # IDs, lifecycle, sizing, sprints
│   ├── security.md          # OWASP, LGPD, RLS, rate limiting, CSRF
│   ├── supabase.md          # Migrations, RLS, audit, realtime
│   ├── testing.md           # Anti-theatrical, Jest/Vitest, mutation
│   ├── typescript.md        # Strict, generics, branded types
│   └── ui-design-system.md  # Tailwind, components, accessibility
├── gotchas/             # Licoes aprendidas (9 docs)
│   ├── agent-parallelism.md   # Memory, ownership, race conditions
│   ├── environment-config.md  # Env vars, .env, secrets
│   ├── git-ci.md              # Stash, force push, lint-staged
│   ├── migration-rollback.md  # FK order, data loss, branch conflicts
│   ├── rls-performance.md     # Full scans, indices, USING(false)
│   ├── supabase-database.md   # MVs, RPCs, connection limits
│   ├── testing.md             # Theatrical tests, E2E auth, flakiness
│   ├── typescript-build.md    # Circular imports, bundle size
│   └── vercel-deploy.md       # Timeouts, middleware, streaming
├── templates/           # Copiados para projetos via sync.sh
│   ├── ci-workflows/    # GitHub Actions (ci, deploy-gate, quality-gates)
│   ├── component/       # React/Next.js (server, client, form, hook)
│   ├── database/        # SQL (RLS policies, audit trigger, migration)
│   ├── e2e/             # Playwright (smoke, base-page, fixtures, access)
│   ├── monitoring/      # Observability (health, logger, error-tracker)
│   ├── project-init/    # Scaffolding (CLAUDE.md, .env, .gitignore, roadmap)
│   ├── roadmap/         # Gestao (backlog, sprint, PRD, SPEC)
│   ├── scripts/         # Utilities (validate-env, db-health, bundle)
│   ├── security/        # Auth (rate-limiter, CSRF, auth-middleware)
│   └── service/         # Backend (domain-service, repository, test)
├── adr/                 # Architecture Decision Records
│   ├── ADR-001-shared-layer.md
│   └── ADR-002-test-runner-divergence.md
├── sync.sh              # Propagacao automatica para projetos
└── README.md            # Este arquivo
```

## Como usar

### Em um novo projeto (via ag-01)
```bash
# ag-01 copia automaticamente de .shared/ — ver SKILL.md secao "Shared Layer"
/ag01 next raiz-novo-projeto
```

### Sincronizacao manual
```bash
# Propagar atualizacoes para todos os projetos
bash ~/.shared/sync.sh

# Propagar para um projeto especifico
bash ~/.shared/sync.sh ~/Claude/GitHub/raiz-platform
```

### Auto-sync (via hook)
O hook `Stop` do workspace roda `sync.sh` automaticamente ao final de cada sessao Claude Code.

### Consultar patterns e gotchas
Arquivos em `patterns/` e `gotchas/` sao referencia — nao sao copiados para projetos.
Agents e skills referenciam diretamente via path `~/.shared/patterns/`.

## Principios

1. **DRY**: Definir uma vez, usar em todos os projetos
2. **Templates vs Patterns**: Templates sao copiados, patterns sao referenciados
3. **Override local**: Projeto pode customizar qualquer template apos copiar
4. **Sync inteligente**: sync.sh nunca sobrescreve customizacoes locais
5. **ADRs cross-project**: Decisoes que afetam todos os projetos ficam aqui
