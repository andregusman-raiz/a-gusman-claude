# rAIz Platform — Perfil Completo do Projeto

> Documento de referencia gerado em 2026-03-01
> Fonte: exploracao completa do codebase em D:/GitHub/raiz-platform/

---

## Indice

1. [Visao Geral](#1-visao-geral)
2. [Tech Stack](#2-tech-stack)
3. [Arquitetura](#3-arquitetura)
4. [Sistema de Logs e Observabilidade](#4-sistema-de-logs-e-observabilidade)
5. [Roadmap e Status do Projeto](#5-roadmap-e-status-do-projeto)
6. [Metricas do Projeto](#6-metricas-do-projeto)
7. [Gaps e Oportunidades](#7-gaps-e-oportunidades)

---

## 1. Visao Geral

**rAIz Platform** (`plataforma-raiz` v0.1.0) e uma plataforma enterprise de IA construida para a **rAIz Educacao**, grupo educacional brasileiro com 40+ escolas e um Centro de Servicos Compartilhados (CSC).

### Modulos de Negocio (16)

| Modulo | Status | Testes E2E |
|--------|--------|------------|
| Social Media | Estavel | 614 |
| Chat/RaizTalk | Estavel | 351 |
| Content Studio | Estavel | 290 |
| TOTVS SQL | Estavel | 194 |
| Contencioso | Em desenvolvimento | 188 |
| Admin | Estavel | 152 |
| Reports | Estavel | 143 |
| BI | **FALHO (P0)** | 118 |
| Automacoes | Estavel | 112 |
| CLM | Em desenvolvimento | 60 |
| VibeCoding | Estavel | 50 |
| Analises | Estavel | 46 |
| Google Workspace | Estavel | 34 |
| DPOS | Em desenvolvimento | 34 |
| HubSpot | Estavel | 29 |
| RAG | Estavel | 23 |

### Design System
"Quiet Intelligence UI" — design deterministico e limpo. Sem gradientes, sem glassmorphism, sem sombras pesadas, sem uppercase, sem significado apenas por cor.

### Idioma
Portugues (pt-BR)

---

## 2. Tech Stack

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| **Framework** | Next.js (App Router) | ^14.2.35 |
| **Linguagem** | TypeScript (strict mode) | ^5.7.2 |
| **Runtime** | Node.js | 20.19.0 |
| **UI** | Tailwind CSS ("Quiet Intelligence UI") | ^3.4.17 |
| **State** | React Context (15 providers) + TanStack React Query | ^5.90.19 |
| **URL State** | nuqs | ^2.8.8 |
| **Database** | Supabase (PostgreSQL 17, RLS ativo, pgvector) | ^2.91.0 |
| **Auth** | Supabase Auth (Google OAuth SSO, PKCE) + CLI token | via middleware |
| **Cache** | Upstash Redis (+ LRU in-memory fallback) | ^1.36.1 |
| **Rate Limiting** | Upstash Ratelimit (sliding window) | ^2.0.8 |
| **AI/LLM** | Multi-LLM: Claude, GPT, Gemini, Perplexity | Custom router + Vercel AI SDK |
| **AI SDK** | Vercel AI SDK | ^6.0.91 |
| **Search** | Meilisearch | ^0.55.0 |
| **Error Tracking** | Sentry | ^10.38.0 |
| **Observabilidade** | OpenTelemetry | ^0.211.0 |
| **Monitoring** | Vercel Speed Insights (instalado, NAO integrado) | ^1.3.1 |
| **Email** | Resend + React Email | ^6.8.0 |
| **Rich Text** | TipTap | ^3.20.0 |
| **Charts** | ECharts + Recharts | ^6.0.0 / ^3.6.0 |
| **Video** | Remotion | ^4.0.419 |
| **PDF** | pdf-lib, pdfmake, pdf-parse | various |
| **Excel** | ExcelJS | ^4.4.0 |
| **OCR** | Tesseract.js | ^7.0.0 |
| **Testing** | Jest 30 + Playwright 1.57 | via devDeps |
| **Linting** | ESLint + plugin custom `raiz` | ^8.57.1 |
| **Git Hooks** | Husky + lint-staged | ^9.1.7 |
| **Deploy** | Vercel (gru1 - Sao Paulo) | vercel.json |

### Integracoes Externas
- MSSQL (TOTVS ERP)
- Firebase Admin (push notifications)
- Google Ads API
- Meta/Facebook Ads SDK
- Azure MSAL/Power BI
- HubSpot CRM
- N8N (WhatsApp automation)
- WebSockets (ws)

---

## 3. Arquitetura

### 3.1 Estrutura de Diretorios

```
src/
├── app/              # Next.js App Router (30+ rotas, 80+ API routes)
├── components/       # Componentes React por dominio
├── config/           # Navegacao
├── context/          # 15 React Context providers
├── hooks/            # 40+ hooks customizados
├── lib/
│   ├── access-control/   # RBAC
│   ├── agent/            # Sistema de agentes IA (60+ arquivos!)
│   ├── ai/               # Abstracao multi-LLM customizada
│   ├── ai-sdk/           # Wrapper Vercel AI SDK
│   ├── audit/            # Audit logging
│   ├── auth/             # Auth helpers, API auth, rate limiting
│   ├── cache/            # Redis + LRU in-memory
│   ├── config/           # Config ambiente + feature flags
│   ├── db/
│   │   ├── schemas/      # ~60 schemas Zod
│   │   └── repositories/ # ~70 repositories (com base.repository.ts)
│   ├── di/               # Dependency Injection container
│   ├── gateway/          # API gateway + event bus + health aggregator
│   ├── logger/           # Logger simples (legado)
│   ├── mcp/              # MCP servers
│   ├── monitoring/       # Performance, Web Vitals
│   ├── observability/    # OpenTelemetry, logger estruturado, metricas
│   ├── prompts/          # Templates de prompts LLM
│   ├── query/            # TanStack Query hooks
│   ├── security/         # Seguranca, secrets scanner
│   ├── services/         # 140+ arquivos de servicos
│   ├── supabase/         # Clientes Supabase (client/server/admin)
│   ├── tools/            # Definicoes de ferramentas do agente
│   ├── types/            # Tipos TypeScript compartilhados
│   ├── utils/            # Utilitarios gerais
│   └── whatsapp/         # Integracao WhatsApp
├── providers/        # AppProviders (hierarquico)
├── remotion/         # Geracao de video
└── middleware.ts     # Auth + access control (~457 linhas, Node.js runtime)
```

### 3.2 Patterns Arquiteturais Chave

1. **Service-Repository Pattern**: Services (~140) → Repositories (~70) → Schemas Zod (~60)
2. **Dependency Injection**: Container leve com `register`/`resolve`/`reset`
3. **Multi-LLM Router**: Roteamento inteligente entre Claude/GPT/Gemini/Perplexity baseado em classificacao de tarefa, tracking de custo, budget de thinking
4. **Sistema de Agentes IA**: 60+ arquivos incluindo sub-agentes, plan mode, execucao DAG, execucao paralela, reflexion memory, circuit breakers, dead letter queues, tool registries, compressao de contexto, mixture-of-agents, checkpoint/rollback, A/B testing, automacao de browser
5. **Provider Pattern**: 15 Context providers em hierarquia (infra > auth > UI > settings > features > data)
6. **Cache Strategy**: Redis-first com fallback LRU in-memory (roles, modulos, registry, sessoes)
7. **Event Bus / Gateway**: API gateway com event bus pattern
8. **Zod Validation**: Todos inputs de API validados com Zod, tipos derivados com `z.infer`
9. **SDD (Spec Driven Development)**: PRD > SPEC > Execute > Review

### 3.3 Middleware (~457 linhas)

O middleware (Node.js runtime, nao Edge) faz:
1. Request logging com IDs unicos e timing (`Server-Timing` header)
2. Bypass de arquivos estaticos
3. Criacao de cliente Supabase + refresh de sessao
4. Auth check (Supabase session ou CLI token)
5. Protecao de rotas admin (fail-closed em timeout)
6. Controle de acesso por modulo (fail-closed em timeout)
7. Injecao de security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy
8. CSP enforced em producao, report-only em development

### 3.4 Auth

- **Supabase Auth** com **Google OAuth SSO** (PKCE flow)
- **4 niveis de permissao**: superadmin, core_team, external_agent, client
- **CLI token auth**: SHA-256 hashed tokens contra tabela `cli_tokens`
- **Cache de roles**: Redis com 5min TTL para evitar queries DB por request

### 3.5 Database

- **PostgreSQL 17** via Supabase
- **256 migrations** (evolucao completa do schema)
- **~30.000 linhas** de tipos auto-gerados (`database.types.ts` ~998KB)
- **3 clientes Supabase**: browser (anon), server (cookies+anon+RLS), admin (service role, bypass RLS)
- **RLS ativo** em todas as tabelas
- **Audit trail**: tabela `audit_logs` com JSONB (ISO 27001 compliant)
- **pgvector**: busca semantica no API Registry e RAG

### 3.6 Deploy

- **Plataforma**: Vercel, regiao `gru1` (Sao Paulo)
- **Timeouts**: default 60s, chat 120s, streaming/cron 300s
- **15 cron jobs**: RAG queue (5min), ads sync (hourly), CLM (daily), social media (5-30min), cleanup (6h/daily), warmup (5min), background jobs (1min), litigation (daily)
- **CI/CD**: 5 GitHub Actions workflows (lint, build+bundle check, security audit, Jest+Codecov, typecheck, Playwright E2E)
- **Pre-commit**: Husky + lint-staged (ESLint fix + Prettier)
- **AI Code Review**: 2 workflows automaticos com Claude Haiku (security + code quality)

---

## 4. Sistema de Logs e Observabilidade

### 4.1 Arquitetura Atual

```
┌─────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY STACK                       │
├─────────────────┬──────────────────┬────────────────────────┤
│  STRUCTURED     │  DISTRIBUTED     │  ERROR TRACKING        │
│  LOGGER         │  TRACING         │                        │
│                 │                  │                        │
│  JSON output    │  OpenTelemetry   │  Sentry                │
│  Secret redact  │  OTLP exporters  │  Client+Server+Edge    │
│  Context prop   │  10% sampling    │  Session replay (1%)   │
│  Child loggers  │  Agent attrs     │  100% on error         │
│  ~160 imports   │  Custom instrum  │  Global error boundary │
├─────────────────┼──────────────────┼────────────────────────┤
│  PROMETHEUS     │  HEALTH CHECKS   │  AUDIT TRAIL           │
│  METRICS        │                  │                        │
│                 │                  │                        │
│  14 metricas    │  5 endpoints:    │  SharedAuditService    │
│  /api/metrics   │  /api/health     │  platform_audit_logs   │
│  Token-protect  │  /api/v1/health  │  clm_audit_logs        │
│                 │  /api/rag/health │  Admin UI              │
│                 │  /api/charts/... │                        │
│                 │  MCP healthcheck │                        │
├─────────────────┼──────────────────┼────────────────────────┤
│  PERFORMANCE    │  CUSTOM          │  CI/CD                 │
│  MONITORING     │  EXPORTERS       │  OBSERVABILITY         │
│                 │                  │                        │
│  Web Vitals     │  Lightning       │  Bundle size budget    │
│  Event loop mon │  Collector       │  Codecov coverage      │
│  PerfLogger     │  (training data) │  AI PR reviews (2x)    │
│  Server-Timing  │  Agent/tool/LLM  │  npm audit             │
│  trackDbQuery   │  spans only      │  Playwright artifacts  │
└─────────────────┴──────────────────┴────────────────────────┘
```

### 4.2 Logger Estruturado (`src/lib/observability/logger.ts`)

- **Output**: JSON estruturado, compativel com Grafana Loki e Datadog
- **Log levels**: trace, debug, info, warn, error, fatal
- **Secret redaction**: automatica via `@/lib/security/secrets-scanner` (AWS keys, JWTs, passwords, tokens)
- **Context propagation**: workspaceId, threadId, sessionId, userId, requestId
- **Child logger**: `.child()` para contexto hierarquico
- **Factories**: `createRequestLogger`, `createWorkspaceLogger`, `createThreadLogger`, `createSessionLogger`
- **Timer**: `startTimer()` para medir duracao de operacoes
- **Env-driven**: `LOG_LEVEL` env var (default "info" prod, "debug" dev)
- **Cobertura**: importado em ~160 arquivos
- **Testes**: 203 linhas de testes

### 4.3 Logger Legado (`src/lib/logger/index.ts`)

- **Output**: `[timestamp] [LEVEL][ModuleName] message` (texto plano)
- **Factory**: `createLogger('ModuleName')`
- **Sem**: JSON output, secret redaction, context propagation
- **Cobertura**: ~7 arquivos apenas
- **Status**: legado, deveria ser migrado para o logger estruturado

### 4.4 OpenTelemetry

**Arquivos** (`src/lib/observability/`):

| Arquivo | Linhas | Funcao |
|---------|--------|--------|
| `otel.ts` | 467 | SDK init, OTLP exporters, span helpers, W3C Trace Context |
| `instrumentation.ts` | 484 | Instrumentacao custom (agents, tools, LLM, memory, circuit breakers, DAG, subagents, batch) |
| `metrics.ts` | 477 | Registry Prometheus (counters, gauges, histograms) |
| `tracing.ts` | 344 | Tracing leve sem dependencia OTel (fallback) |
| `api-wrapper.ts` | 365 | `withObservability()` e `withStreamingObservability()` para API routes |
| `lightning-exporter.ts` | 291 | Custom SpanExporter para coleta de dados de treinamento |
| `logger.ts` | 309 | Logger estruturado (descrito acima) |

**Configuracao**:
- Service name: `raiz-platform` (via `OTEL_SERVICE_NAME`)
- OTLP endpoint: `OTEL_EXPORTER_OTLP_ENDPOINT` (default localhost:4318)
- Trace sampling: 10%
- Metrics export interval: 60s
- Import dinamico de pacotes pesados OTel
- Inicializacao condicional (so se endpoint configurado)

**Atributos Custom do Agente**:
```
raiz.agent.user_id, raiz.agent.session_id, raiz.agent.workspace_id
raiz.agent.model, raiz.agent.provider, raiz.agent.execution_mode
raiz.agent.tool_name, raiz.agent.tool_category
raiz.agent.input_tokens, raiz.agent.output_tokens, raiz.agent.cost_microcents
raiz.agent.correction_iteration, raiz.agent.memory_tier
```

### 4.5 Metricas Prometheus

| Metrica | Tipo | Labels |
|---------|------|--------|
| `http_request_duration_seconds` | Histogram | method, route, status_code |
| `http_requests_total` | Counter | method, route, status_code |
| `ai_tokens_total` | Counter | provider, model, operation, workspace_id |
| `ai_requests_total` | Counter | provider, model, operation, status |
| `ai_request_duration_seconds` | Histogram | provider, model, operation |
| `ai_cost_microcents_total` | Counter | provider, model, workspace_id |
| `automation_runs_total` | Counter | status, workspace_id |
| `automation_duration_seconds` | Histogram | workspace_id, automation_id |
| `sse_connections_active` | Gauge | instance_id |
| `chat_messages_total` | Counter | room_id, message_type |
| `realtime_events_total` | Counter | event_type, source |
| `vibecoding_builds_total` | Counter | framework, status |
| `vibecoding_publishes_total` | Counter | workspace_id, status |
| `errors_total` | Counter | error_type, endpoint |

**Endpoint**: `GET /api/metrics` (Prometheus format, protegido por `METRICS_TOKEN`)

### 4.6 Sentry

- **3 configs**: client, server, edge
- **Habilitado**: apenas producao
- **Traces**: 10% sampling
- **Session replay**: 1% normal, 100% em erro (`maskAllText: true`, `blockAllMedia: true`)
- **Filtros de ruido**: ResizeObserver, Failed to fetch, NetworkError, NEXT_REDIRECT, Rate limit
- **Source maps**: hidden, uploaded via `SENTRY_AUTH_TOKEN`
- **Global error boundary**: `src/app/global-error.tsx` com `Sentry.captureException()`

### 4.7 Health Checks

| Endpoint | Verifica |
|----------|----------|
| `GET /api/health` | Redis, MCP servers, circuit breakers, AI providers (agregado) |
| `GET /api/v1/health` | TOTVS SQL Server + Supabase connectivity, uptime |
| `POST /api/mcp/servers/[id]/healthcheck` | MCP server individual (admin only) |
| `GET /api/charts/health` | Python environment para chart generation |
| `GET /api/rag/health` | RAG queue + auto-reset stuck documents |

**Health Aggregator** (`src/lib/gateway/health-aggregator.ts`):
- Subsistemas: Redis (ping), MCP (servers conectados), Circuit Breakers (circuitos abertos), AI Providers (API keys configuradas)
- Status por subsistema: ok / degraded / unhealthy / unconfigured
- Cache: 30s public, 60s s-maxage
- HTTP 503 se status geral "unhealthy"

### 4.8 Audit Trail

- **Service**: `SharedAuditService` (`src/lib/audit/audit.service.ts`)
- **Tabela**: `platform_audit_logs` (Supabase, JSONB)
- **Campos**: module, action, entityId, entityType, userId, businessUnitId, metadata, requestId, ipAddress
- **Modulos**: clm, litigation, dpos, brand, social, rag, whatsapp, chat, workspace, admin
- **Metodos**: `log()`, `logBatch()`, `queryByEntity()`, `query()`
- **CLM-specific**: tabela separada `clm_audit_logs`
- **Admin UI**: `src/components/admin/audit/AuditLogsTab.tsx`
- **Falhas**: silenciosamente swallowed (nunca interrompe operacao primaria)

### 4.9 Performance Monitoring

| Componente | Localizacao | Funcao |
|------------|------------|--------|
| Web Vitals | `src/lib/monitoring/web-vitals.ts` | LCP, FID, CLS, FCP, TTFB, INP (SEM envio externo) |
| Performance Utils | `src/lib/monitoring/performance.ts` | trackApiLatency (>500ms), trackDbQuery (>200ms), memory usage |
| PerfLogger | `src/lib/utils/perf-logger.ts` | Timing breakdown, Server-Timing header, request ID |
| Event Loop Monitor | `src/lib/utils/event-loop-monitor.ts` | Detecta bloqueio >100ms (dev only) |
| Middleware | `src/middleware.ts` | Request ID, Server-Timing, slow request warnings (>60s) |

### 4.10 Wrappers de Observabilidade para APIs

`withObservability()` e `withStreamingObservability()` (`src/lib/observability/api-wrapper.ts`):
- Auto-log request start/end com duracao
- Metricas HTTP (counter + histogram)
- Logger request-scoped com contexto
- Headers `x-request-id` e `x-trace-id`
- Error recording e response generation
- **Usado em ~18 de 80+ API routes** (parcial)

### 4.11 Lightning Collector (Custom Exporter)

- Custom OTel SpanExporter para coleta de dados de treinamento
- Filtra: apenas spans `agent.*`, `tool.*`, `llm.*`
- Batched (50 spans), async fire-and-forget, PII scrubbing
- Condicional via `LIGHTNING_COLLECTOR_ENDPOINT` env var

### 4.12 console.log Direto

- **359+ ocorrencias** de `console.log/error/warn/info/debug` em 50+ arquivos
- Muitos servicos usam `console.*` diretamente em vez do logger estruturado
- **PROBLEMA CRITICO**: `next.config.mjs` tem `removeConsole: true` em producao, o que **REMOVE TODOS os console.* incluindo o output do logger estruturado**

---

## 5. Roadmap e Status do Projeto

### 5.1 Sprint Atual

**Sprint W46** (01 Mar 2026): ag-M Improvements + Env Consolidation

**Velocidade**: ~203 items resolvidos nos Sprints W13-W46

### 5.2 Items Abertos

| Severidade | Total Original | Resolvidos | Abertos |
|------------|---------------|------------|---------|
| P0 | 19 | 17 | **2** |
| P1 | 33 | 33 | **0** |
| P2 | 77 | ~99 | **~5** |
| P3 | 39 | ~55 | **~3** |
| **Total** | **168** | **~203** | **~10** |

#### P0 Abertos (2)
1. **BI-BUG-001**: Todos os dashboards Power BI falham (MSOLAP). BLOCKED em infra Azure.
2. **IF-BUG-101**: 7 secrets no git history sem rotacao. Phase 1 done (audit script, pre-commit hook, rotation plan). Pendente: rotacao real de 6 secrets + git filter-repo.

#### P2 Abertos (~5)
1. **GL-FEAT-001**: CopilotKit Generative UI (intake, Size L)
2. **GL-FEAT-004**: Agent Lightning optimization (in-progress, Size XL — Phase 1 telemetria done)
3. **GL-FEAT-003**: Novu unified notifications (intake, Size L)
4. **IF-BUG-102**: `ignoreBuildErrors=true` em producao (3.774 type errors) — parcial, XL
5. **IF-IMP-002**: getEnv() consolidation: 53 de 776 raw `process.env` migrados — parcial, Size L

#### P3 Abertos (~3)
1. **IF-FEAT-001**: Upgrade Next.js 14 → 15 (XL, backlog)
2. **RG-FEAT-002**: Deploy RAGFlow external service (L, intake)
3. **GL-BUG-112**: Looker Studio embed sem RLS check (L, intake)

### 5.3 Roadmap por Trimestre

#### Q1 2026 (Jan-Mar) — Estabilizacao e Qualidade (MAIORIA DONE)
- Diagnostico de usabilidade V2: 42 items identificados, 40 fixados
- Cobertura E2E: 188 → 2.438+ testes em 16 modulos
- Bug Fix Marathon W13-W22: ~80 bugs fixados (P0-P3) em 6 modulos
- Security Audit W23: 82 achados, 14 fixes de seguranca
- API Registry: 671 APIs catalogadas com pgvector semantic search
- Sprints de arquitetura: God Object splits, ChatContext decomposition, DI container, WhatsApp v3 adapter

#### Q2 2026 (Abr-Jun) — Features Novas e Integracoes (PLANEJADO)
- WhatsApp V3 via N8N
- HubSpot CRM sync
- Agent Lightning Phases 2-4 (APO prompts + router RL + tool hints)
- CopilotKit Generative UI
- Novu unified notifications
- RAG improvements, multi-agent workflows
- Performance optimization (Redis cache, query optimization)

#### Q3 2026 (Jul-Set) — Consolidacao e Expansao (CANDIDATOS)
- PWA Responsive
- Consolidacao de observabilidade
- Agent memory upgrade
- Visual workflow builder
- Voice/audio
- Next.js 14 → 15 upgrade
- Vector DB upgrade
- i18n/accessibility

### 5.4 Documentacao Existente

| Documento | Local |
|-----------|-------|
| Roadmap principal | `roadmap/roadmap.md` |
| Backlog | `roadmap/backlog.md` |
| 24 sprints | `roadmap/sprints/SPRINT-2026-W12.md` a `W46.md` |
| 39 item files | `roadmap/items/{bugs,features,improvements}/` |
| 6 templates | `roadmap/templates/` |
| 2 ADRs | `docs/adr/ADR-001.md`, `ADR-002.md` |
| Arquitetura alvo | `ARQUITETURA_ALVO.md` |
| Arquitetura tecnica v2 | `docs/TECHNICAL_ARCHITECTURE.md` |
| PRD Social Media | `docs/socialmedia_module_prd.md` |
| SPEC Content Studio | `docs/content-studio/presentation/SPEC-wizard-completo.md` |
| Plano UX | `docs/UX_STANDARDIZATION_PLAN.md` |
| Plano de testes | `docs/plan/task_plan.md` |
| Survey de bibliotecas | `docs/LIBRARY_SURVEY.md` |
| WhatsApp v3 roadmap | `docs/research/whatsapp-v3-roadmap.md` |
| 26 AI state files | `docs/ai-state/` |
| 9 reports | `docs/reports/` |

### 5.5 Database Evolution

**256 migrations** em `supabase/migrations/`:
- **001-012**: Fundacao (extensions, tipos, tabelas core, threads, messages, chat, automations, integrations, settings, functions, triggers, RLS, seed)
- **013-021**: RAG, usage logging, dashboards, BI, ML predictions, VibeCoding
- **022-034**: Multi-LLM, daemon, WhatsApp, performance indexes, unified inbox
- **035-050**: Google Workspace, MCP, admin, OAuth, plans/CLI, daemon tasks
- **051-060**: RAG hibrido, quotas, document versions, agent sessions, execution ledger
- **061-080**: HubSpot, DPOS, Social Media, brands, CLM
- **200+**: Agent memory, canvas, embeddings, HNSW, model tiers, background jobs, API registry, prompt versioning

### 5.6 Feature Flags

- **Service**: `FeatureFlagService` (`src/lib/config/feature-flag.service.ts`)
- **Resolucao**: workspace-specific → global DB → hardcoded fallback
- **Cache**: Redis 30s TTL
- **Flags atuais**: apenas `jarvis: true` (hardcoded)
- **Uso**: 13 arquivos referenciam feature flags

---

## 6. Metricas do Projeto

| Metrica | Valor |
|---------|-------|
| Supabase migrations | 256 |
| Database types | ~30.000 linhas (~998KB) |
| Service files | ~140+ |
| Repository files | ~70 |
| Schema files (Zod) | ~60 |
| API route directories | ~80 |
| React hooks | ~40 |
| Context providers | 15 |
| Agent system files | ~60 |
| Cron jobs | 15 |
| CI workflows | 5 |
| Jest test suites | 482 |
| Jest tests | 15.161 |
| E2E tests (Playwright) | 2.438+ |
| Dependencias | 129 |
| APIs catalogadas | 671 (470+ routes) |
| Servicos | 255+ |
| Git tags/releases | 14 (CLI v1.0.0-v1.1.3) |
| Items backlog resolvidos | ~203 |
| Items abertos | ~10 (2 P0) |

---

## 7. Gaps e Oportunidades

### 7.1 Gaps Criticos

| # | Gap | Impacto | Recomendacao |
|---|-----|---------|--------------|
| 1 | **`removeConsole: true` mata o logger estruturado** | Todos os logs estruturados sao silenciosamente removidos em producao. Zero visibilidade de logs no deploy. | Remover `removeConsole` ou usar transport nao-console (HTTP POST direto para log aggregator) |
| 2 | **Sem analytics de usuario** | Zero insight sobre comportamento, adocao de features, jornadas de usuario. Sem PostHog, Mixpanel, GA, Vercel Analytics. | Implementar PostHog (open source, privacy-first) ou Vercel Analytics |
| 3 | **Vercel Speed Insights instalado mas NAO integrado** | `<SpeedInsights />` nunca renderizado. Dependencia morta. | Adicionar componente no layout root |

### 7.2 Gaps Moderados

| # | Gap | Impacto | Recomendacao |
|---|-----|---------|--------------|
| 4 | **Web Vitals sem envio externo** | `sendToAnalytics()` comentado. Vitals so logados no console (removido em prod). | Conectar ao Vercel Analytics ou custom endpoint |
| 5 | **API routes parcialmente wrappadas** | Apenas ~18 de 80+ routes usam `withObservability()`. Maioria sem logging/metricas/tracing. | Aplicar wrapper em todas as routes |
| 6 | **Dois loggers coexistem** | `@/lib/observability/logger` (estruturado) e `@/lib/logger` (texto plano). Inconsistencia. | Migrar 7 imports do logger legado para o estruturado |
| 7 | **Sem interceptor de queries DB** | Queries Supabase nao sao automaticamente tracked. `trackDbQuery()` e manual. | Wrapper no Supabase client com auto-tracking |
| 8 | **Sem alerting integrado** | Metricas coletadas mas sem PagerDuty, OpsGenie, Slack alerts, Grafana alert rules. | Configurar alerting via Grafana ou Vercel |
| 9 | **Sem log shipping configurado** | Logs existem em JSON mas nao ha evidencia de envio para agregador (Vercel log drains, Datadog, Loki). | Configurar Vercel log drains ou Grafana Cloud |
| 10 | **Sem error boundary por modulo** | So `global-error.tsx` usa Sentry. Erros em modulos especificos nao sao capturados granularmente. | Error boundaries por modulo com Sentry tags |

### 7.3 Gaps Menores

| # | Gap | Recomendacao |
|---|-----|--------------|
| 11 | **359+ `console.log` diretos** | Migrar para logger estruturado |
| 12 | **Sem uptime monitoring** | Configurar UptimeRobot ou Checkly |
| 13 | **Sem dashboards de metricas** | Criar Grafana dashboards ou Vercel dashboard |

### 7.4 Conexao com o Documento de Referencia

O documento `D:/.claude/research/log-driven-improvement-reference.md` (criado nesta sessao) contem tecnicas estado-da-arte que podem enderecar estes gaps. Principais conexoes:

| Gap | Secao do Ref Doc | Solucao Sugerida |
|-----|------------------|------------------|
| removeConsole mata logs | Sec 5: Patterns de Implementacao | Transport HTTP direto (nao via console) |
| Sem analytics de usuario | Sec 4: Ferramentas (PostHog) | PostHog self-hosted ou cloud |
| Sem log shipping | Sec 7: Arquiteturas de Referencia | Stack intermediario: Grafana Cloud + Loki |
| Sem alerting | Sec 5: Alerting baseado em logs | 3 camadas (critico/warning/info) |
| API routes sem observabilidade | Sec 5: API observability wrappers | Aplicar `withObservability()` em todas as routes |
| Sem dashboards | Sec 5: Dashboards ops vs analiticos | Grafana com metricas Prometheus existentes |
| Sem uptime monitoring | Sec 3: Synthetic monitoring | Checkly ou UptimeRobot |

---

## Apendice: Configuracao Claude Code

O projeto usa o sistema de agentes ag-00 a ag-28 + ag-M, com:
- 15 agents em `.claude/agents/`
- 16 commands em `.claude/commands/`
- 10 playbooks em `.claude/Playbooks/`
- 6 rules em `.claude/rules/`
- 4 hooks em `.claude/hooks/`
- Settings local em `.claude/settings.local.json`
