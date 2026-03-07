# D09 -- Logging, Monitoring & Observability

> Diagnostico cruzado entre **raiz-platform** (Next.js 14) e **rAIz-AI-Prof** (Vite 7)
> Data: 2026-03-01

---

## 1. Resumo Executivo

A observabilidade dos dois projetos esta em estagios drasticamente diferentes de maturidade. O **raiz-platform** possui uma stack de observabilidade enterprise-grade com OpenTelemetry, Sentry (client/server/edge), PostHog, metricas Prometheus, tracing distribuido, secret redaction automatica, e um sistema de triage automatizado que cria GitHub Issues a partir de sinais de Sentry/Grafana. O **rAIz-AI-Prof** tem uma base funcional -- Sentry lazy-loaded, Web Vitals, Plausible analytics, e um sistema de logging estruturado com IndexedDB/Supabase -- mas carece de tracing distribuido, metricas server-side, e integracao com dashboards.

---

## 2. Tabela Comparativa -- Estado Atual

| Dimensao | raiz-platform | rAIz-AI-Prof |
|---|---|---|
| **Sentry Config** | 3 configs (client/server/edge), `@sentry/nextjs` | 1 config lazy-loaded, `@sentry/react` |
| **Sentry Sampling** | traces: 10%, replay: 1% sessoes / 100% erros | traces: 30%, replay: 10% sessoes / 100% erros |
| **Sentry ignoreErrors** | 6 patterns (ResizeObserver, Network, NEXT_REDIRECT) | 12 patterns (ResizeObserver, ChunkLoad, Extensions) |
| **Sentry beforeSend** | Nao tem (filtra via ignoreErrors) | Sim -- bloqueia em dev, taggeia LLM/validation |
| **OpenTelemetry** | Completo: NodeSDK, OTLP exporters, auto-instrumentations | Ausente |
| **Tracing Distribuido** | Dual: custom `Tracer` + OTel spans, W3C traceparent | Ausente |
| **Logging Estruturado** | JSON logger com OTel emission, 6 niveis, child loggers | Estruturado com taxonomia, 5 niveis (DEBUG-CRITICAL), IndexedDB + Supabase |
| **Secret Redaction** | `secrets-scanner.ts`: 18+ regex patterns + entropy analysis | `sanitizer.ts` + `removeForbiddenFields`: 16 campos proibidos |
| **Metricas** | Prometheus registry custom: HTTP, AI, automation, SSE, errors | Metricas de negocio em localStorage + Sentry breadcrumbs |
| **Web Vitals** | Next.js integration + PostHog tracking | `web-vitals` lib com handlers LCP/INP/CLS/FCP/TTFB + Sentry |
| **Product Analytics** | PostHog (client + server, session replay, feature flags) | Plausible (script injection, privacy-first, sem session replay) |
| **Alertas** | Triage service automatizado: Sentry + Grafana -> GitHub Issues | Sistema de alertas local: 4 regras default, verificacao periodica em IndexedDB |
| **Dashboard** | Grafana Cloud (via OTLP endpoint) | `PerformanceDashboard.tsx` componente React in-app |
| **API Observability** | `withObservability()` wrapper com logging+metrics+tracing automaticos | Ausente (cada endpoint faz logging ad-hoc) |
| **LLM Monitoring** | OTel spans customizados: agent, tool, correction, memory, DAG, batch | `startLlmSpan()` no Sentry + metricas localStorage |
| **Custom Exporter** | `LightningSpanExporter` para training data collection | Ausente |
| **CI/CD Observability** | `observability-triage.yml` + `dora-metrics.yml` GitHub Actions | Ausente |
| **Event Loop Monitor** | Sim (dev only, threshold 100ms) | Ausente |

---

## 3. Analise Detalhada por Dimensao

### 3.1 Structured Logging

#### raiz-platform
**Arquivo principal:** `D:/GitHub/raiz-platform/src/lib/observability/logger.ts`

Logger JSON-structured com integracao OTel nativa:
- 6 niveis: `trace`, `debug`, `info`, `warn`, `error`, `fatal`
- Context propagation: workspaceId, threadId, sessionId, userId, requestId
- Child loggers para scoping hierarquico
- Emissao dual: console + OTel Logs API (via `@opentelemetry/api-logs`)
- Secret redaction automatica em mensagens, data e error fields
- Timer utility para medicao de operacoes
- Nivel configuravel via `LOG_LEVEL` env var (default: info em prod, debug em dev)

```typescript
// Exemplo de uso
const log = createSessionLogger(workspaceId, threadId, sessionId);
log.info('Agent execution started', { model: 'claude-4', tokens: 1500 });
```

#### rAIz-AI-Prof
**Arquivos:** `D:/GitHub/rAIz-AI-Prof/lib/logging/logger.ts`, `D:/GitHub/rAIz-AI-Prof/lib/logging/index.ts`

Sistema de logging estruturado completo com armazenamento dual:
- 5 niveis: `DEBUG`, `INFO`, `WARN`, `ERROR`, `CRITICAL`
- Taxonomia canonica de eventos: 7 categorias, 50+ eventos pre-definidos (`D:/GitHub/rAIz-AI-Prof/lib/logging/taxonomy.ts`)
- Enriquecimento automatico: user_id_hash (SHA-256), session_id, role, environment
- Storage dual: IndexedDB (local, 10K max, 7 dias retencao) + Supabase (remoto, prod only)
- Fila com batching (100 entries, 5s flush), rate limiting, retry exponencial
- Sanitizacao de PII: `removeForbiddenFields()` remove 16 campos sensiveis
- CRITICAL logs disparam flush imediato
- Flush automatico em `beforeunload` e `visibilitychange`

```typescript
// Exemplo de uso
await logger.info({
  category: 'IA',
  event: 'IA::GENERATION::COMPLETED',
  module_id: 'QUESTOES_V2',
  duration_ms: 3200,
  context: { model: 'gemini-1.5-flash', questionCount: 5 }
});
```

**Gap identificado:** rAIz-AI-Prof nao tem emissao para pipeline OTel. Logs ficam em IndexedDB/Supabase mas nao sao queryaveis em ferramentas de observabilidade centralizadas.

---

### 3.2 Error Tracking (Sentry)

#### raiz-platform
**Arquivos:**
- `D:/GitHub/raiz-platform/sentry.client.config.ts`
- `D:/GitHub/raiz-platform/sentry.server.config.ts`
- `D:/GitHub/raiz-platform/sentry.edge.config.ts`

Configuracao tri-runtime:
- **Client:** tracesSampleRate 0.1, Session Replay (1% normal, 100% on error, maskAllText, blockAllMedia)
- **Server:** tracesSampleRate 0.1, ignora NEXT_REDIRECT/NEXT_NOT_FOUND/Rate limit
- **Edge:** tracesSampleRate 0.1, minimalista
- Habilitado apenas em production (`NODE_ENV === 'production'`)
- Environment tagging via VERCEL_ENV

#### rAIz-AI-Prof
**Arquivo:** `D:/GitHub/rAIz-AI-Prof/lib/monitoring/sentry.ts`

Configuracao single-runtime (SPA):
- Lazy-loaded para nao impactar bundle inicial
- tracesSampleRate 0.3 (3x mais que raiz-platform)
- Session Replay: 10% normal, 100% on error (maskAllText: false, blockAllMedia: false -- MENOS restritivo)
- `beforeSend` inteligente: bloqueia envio em dev, taggeia erros LLM e validation automaticamente
- Fila de erros pendentes (max 50) para erros antes da inicializacao
- `startLlmSpan()` para tracking de latencia de chamadas LLM
- `reportWebVital()` envia metricas como Sentry measurements
- Error Boundary React wrapper disponivel

**Gaps:**
1. rAIz-AI-Prof tem `maskAllText: false` e `blockAllMedia: false` -- risco de captura de PII em Session Replay
2. raiz-platform nao tem `beforeSend` customizado -- perde oportunidade de enrichment
3. rAIz-AI-Prof tem sampling 3x maior (0.3 vs 0.1) -- pode gerar custo desnecessario em producao

---

### 3.3 Distributed Tracing

#### raiz-platform
**Arquivos:**
- `D:/GitHub/raiz-platform/src/lib/observability/otel.ts` (OTel SDK)
- `D:/GitHub/raiz-platform/src/lib/observability/tracing.ts` (Custom tracer)
- `D:/GitHub/raiz-platform/src/lib/observability/instrumentation.ts` (Agent-specific)

Sistema dual de tracing:

**1. Custom Tracer** (`tracing.ts`):
- Implementacao in-memory com spans, trace IDs, parent-child relationships
- `withSpan()` / `withSpanSync()` wrappers
- Context propagation via headers (W3C traceparent + x-trace-id)

**2. OpenTelemetry** (`otel.ts`):
- NodeSDK com dynamic imports (lazy-load de ~30 sub-packages)
- OTLP HTTP exporters para traces e metrics
- Auto-instrumentations (HTTP, fetch, etc.) com exclusoes inteligentes (`_next`, health, favicon)
- Trace sampling configuravel via `OTEL_TRACES_SAMPLER_ARG` (default 0.1)
- Metrics export periodico (default 60s)
- Resource attributes: service name, version, deployment environment

**3. Custom Instrumentation** (`instrumentation.ts`):
- Agent execution spans com token usage tracking
- Tool execution spans com categorias
- Self-correction loop spans (plan/act/reflect/revise)
- Memory operations spans (STM/MTM/LTM tiers)
- Circuit breaker event recording
- DAG node execution spans
- Subagent delegation spans
- LLM request spans com duration tracking
- Batch operation instrumentation

**4. Lightning Exporter** (`D:/GitHub/raiz-platform/src/lib/observability/lightning-exporter.ts`):
- Custom SpanExporter que filtra spans raiz-specific
- Batch processing (50 spans, 10s flush)
- PII scrubbing (allowlist de atributos)
- Fire-and-forget semantics

#### rAIz-AI-Prof
**Tracing: AUSENTE**

Nao existe tracing distribuido. Correlacao de eventos depende de `correlation_id` e `session_id` no sistema de logging, mas nao ha propagacao de contexto entre operacoes.

**Gap critico:** Impossivel rastrear uma geracao LLM end-to-end (click do usuario -> validacao -> chamada API -> parsing -> rendering).

---

### 3.4 Metricas

#### raiz-platform
**Arquivo:** `D:/GitHub/raiz-platform/src/lib/observability/metrics.ts`

Registry Prometheus-compatible custom:
- **HTTP:** `http_request_duration_seconds` (histogram), `http_requests_total` (counter)
- **AI:** `ai_tokens_total`, `ai_requests_total`, `ai_request_duration_seconds`, `ai_cost_microcents_total`
- **Automations:** `automation_runs_total`, `automation_duration_seconds`
- **Realtime:** `sse_connections_active` (gauge), `chat_messages_total`, `realtime_events_total`
- **VibeCoding:** `vibecoding_builds_total`, `vibecoding_publishes_total`
- **Errors:** `errors_total` (by type + endpoint)
- Exposto via `/api/metrics` endpoint
- Helpers tipados: `recordHttpRequest()`, `recordAiUsage()`, `recordAutomationRun()`, etc.
- Histogram buckets padrao: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]

Adicionalmente, metricas OTel sao exportadas via OTLP para Grafana Cloud.

#### rAIz-AI-Prof
**Arquivo:** `D:/GitHub/rAIz-AI-Prof/lib/logging/metrics.ts`

Metricas de negocio client-side:
- Categorias: `llm`, `auth`, `generation`, `export`, `api`, `storage`, `navigation`
- Armazenamento em localStorage (max 1000 entries)
- `trackMetric()` geral + helpers especializados: `trackLLMGeneration()`, `trackAssetGeneration()`, `trackExport()`, `trackApiCall()`, `trackAuth()`
- Timer com `startMetricTimer()` / `end()` / `cancel()`
- Envio para Sentry como breadcrumbs (failures tambem como eventos)
- Agregacao local para dashboard: `getMetricsSummary()`

**Gaps:**
1. rAIz-AI-Prof nao tem metricas server-side (Vercel functions nao instrumentadas)
2. Metricas em localStorage sao volateis (limpar browser = perder tudo)
3. Nao existe endpoint `/api/metrics` para scraping externo
4. Sem histograms para analise de distribuicao de latencia

---

### 3.5 Product Analytics

#### raiz-platform
**Arquivos:**
- `D:/GitHub/raiz-platform/src/lib/analytics/posthog-client.ts`
- `D:/GitHub/raiz-platform/src/lib/analytics/posthog-server.ts`
- `D:/GitHub/raiz-platform/src/lib/analytics/PostHogProvider.tsx`
- `D:/GitHub/raiz-platform/src/lib/analytics/events.ts`

PostHog full-stack:
- **Client-side:** Auto-capture, pageview, pageleave, session recording, privacy-safe defaults
- **Server-side:** `posthog-node` para captura em API routes, batching (20 events, 10s flush)
- **Provider React:** Tracking automatico de page views em route changes
- **Event catalog:** 25+ eventos tipados (AI, Docs, Reports, Social, Automations, CLM, Errors, Feature flags)
- Privacy: `respect_dnt: true`, `person_profiles: 'identified_only'`, mask inputs
- Web Vitals enviados como eventos PostHog

#### rAIz-AI-Prof
**Arquivo:** `D:/GitHub/rAIz-AI-Prof/lib/monitoring/analytics.ts`

Plausible privacy-first:
- Script injection dinamico (sem SDK npm)
- Tracking de pageview para SPAs
- Custom events via `window.plausible()`
- 20+ eventos pre-definidos: geracoes, exportacoes, salvamentos, ratings
- Integracao com sistema de improvement (logGenerationEvent, logExportEvent, etc.)
- Desabilitado em localhost por default

**Gaps:**
1. rAIz-AI-Prof nao tem server-side analytics (perde eventos de API routes)
2. Plausible nao tem session replay, feature flags, ou cohort analysis
3. Nao ha correlation entre analytics events e error events
4. rAIz-AI-Prof nao tem user identification (Plausible e anonimo by design)

---

### 3.6 Sistema de Alertas

#### raiz-platform
**Arquivos:**
- `D:/GitHub/raiz-platform/src/lib/observability/triage/triage-service.ts`
- `D:/GitHub/raiz-platform/src/lib/observability/triage/signal-collectors.ts`
- `D:/GitHub/raiz-platform/src/lib/observability/triage/types.ts`

Sistema de triage automatizado enterprise:
- **Fontes:** Sentry (issues), Grafana (alerts), metricas internas
- **Fluxo:** Coleta sinais -> Deduplicacao (fingerprints) -> Cria GitHub Issues automaticamente
- **Severidade:** P0 (error rate >10%), P1 (error rate >5%, latency >5s), P2 (latency >2s), P3
- **Execucao:** Vercel Cron (hourly) + GitHub Action
- **Thresholds configuraveis** via env vars: min events, min users, error rates, latency
- **Limites:** Max 10 issues por execucao, P0 processado primeiro
- **Deduplicacao:** Fingerprint embeddido no body da issue (`<!-- fingerprint:xxx -->`)
- **Labels automaticos:** `auto-triage`, severity, module, status:triage

#### rAIz-AI-Prof
**Arquivo:** `D:/GitHub/rAIz-AI-Prof/lib/logging/alerts.ts`

Sistema de alertas local:
- 4 regras default: Critical errors (1 em 1h), High error rate (10 em 15min), IA failures (5 em 30min), Auth failures (10 em 15min)
- Verificacao periodica (default 5min) contra IndexedDB
- Alertas armazenados em Map in-memory (cleanup apos 24h)
- Notificacao via console.warn (sem integracao externa)

**Gaps:**
1. rAIz-AI-Prof alertas sao apenas client-side e se perdem ao fechar o browser
2. Sem integracao com sistemas externos (email, Slack, PagerDuty, GitHub Issues)
3. Sem alertas baseados em metricas de performance (Web Vitals, latencia)
4. Nao ha escalacao automatica de P0

---

### 3.7 Secret Redaction

#### raiz-platform
**Arquivo:** `D:/GitHub/raiz-platform/src/lib/security/secrets-scanner.ts`

Scanner avancado:
- **18+ regex patterns** cobrindo: AWS, GitHub tokens (ghp/gho/ghu/ghs/ghr), API keys, Bearer/Basic auth, JWT, private keys, passwords in URLs, database URLs, Slack, Stripe, Google, Supabase, OpenAI, Anthropic, env secrets
- **PII patterns (LGPD):** Email, CPF, telefone BR
- **Entropy analysis:** Shannon entropy > 4.5 flagra high-entropy strings
- **Funcoes:** `scanForSecrets()`, `containsSecrets()`, `redactSecrets()`, `redactSecretsInObject()` (recursivo)
- **Confidence levels:** high, medium, low
- **Categorias:** secret vs pii (para anti-exfil checks)
- Integrado no logger: toda mensagem, data e error passam por redaction automatica

#### rAIz-AI-Prof
**Arquivo:** `D:/GitHub/rAIz-AI-Prof/lib/logging/sanitizer.ts`

Sanitizacao basica:
- `removeForbiddenFields()`: remove 16 campos sensiveis por nome de chave (password, senha, token, apiKey, secret, cpf, email, phone, etc.)
- `sanitizeObject()`: delega para `redactData()` do `secureLogger`
- `hashSHA256()`: hash de user IDs com Web Crypto API
- Nao tem pattern matching em valores (apenas nomes de chave)
- Nao tem entropy analysis

**Gaps:**
1. rAIz-AI-Prof nao detecta secrets em valores de string (JWT em mensagem de erro, API key em URL, etc.)
2. Sem deteccao de entropy-based secrets
3. Redaction por nome de chave e fragil -- um campo chamado `data` com um JWT dentro nao e detectado
4. Sem categorias secret/pii

---

### 3.8 Log Levels

#### raiz-platform
- 6 niveis: `trace` (10) < `debug` (20) < `info` (30) < `warn` (40) < `error` (50) < `fatal` (60)
- Configuravel via `LOG_LEVEL` env var
- Default: `info` em prod, `debug` em dev
- Mapeamento para OTel SeverityNumber

#### rAIz-AI-Prof
- 5 niveis: `DEBUG` < `INFO` < `WARN` < `ERROR` < `CRITICAL`
- DEBUG filtrado em producao automaticamente
- CRITICAL dispara flush imediato
- Rate limiting: fila excedente descarta non-CRITICAL primeiro

**Gap:** rAIz-AI-Prof nao tem `trace` nem `fatal`. O nivel `CRITICAL` e semanticamente similar a `fatal`.

---

### 3.9 Performance Monitoring

#### raiz-platform
**Arquivos:**
- `D:/GitHub/raiz-platform/src/lib/monitoring/web-vitals.ts`
- `D:/GitHub/raiz-platform/src/lib/observability/api-wrapper.ts`
- `D:/GitHub/raiz-platform/src/instrumentation.ts`

Multi-camada:
- **Web Vitals:** LCP, FID, CLS, FCP, TTFB, INP com thresholds, rating, e envio para PostHog
- **API Wrapper:** `withObservability()` e `withStreamingObservability()` automatizam logging, metricas e tracing por rota
- **Event Loop Monitor:** Detecta lag > 100ms (dev only)
- **OTel Metrics:** Histograms de latencia HTTP, AI request duration
- **Timer utility** no logger para medicao de operacoes

#### rAIz-AI-Prof
**Arquivos:**
- `D:/GitHub/rAIz-AI-Prof/lib/monitoring/web-vitals.ts`
- `D:/GitHub/rAIz-AI-Prof/hooks/usePerformance.ts`
- `D:/GitHub/rAIz-AI-Prof/components/performance/PerformanceDashboard.tsx`
- `D:/GitHub/rAIz-AI-Prof/lib/logging/metrics.ts`

Client-side focado:
- **Web Vitals:** LCP, INP, CLS, FCP, TTFB com thresholds Google, rating, Sentry + analytics tracking
- **usePerformance hook:** React hook para tracking de component render count, render time, custom operations
- **PerformanceDashboard:** Componente visual in-app para visualizar metricas
- **Business metrics:** Timer + tracking por categoria (LLM, generation, export, API)
- Web Vitals "poor" disparam eventos analiticos extras

**Gaps:**
1. rAIz-AI-Prof nao tem server-side performance monitoring (Vercel functions nao instrumentadas)
2. Sem API wrapper equivalente a `withObservability()` -- cada endpoint precisa implementar manualmente
3. Sem event loop monitoring
4. PerformanceDashboard e util mas e in-app only (nao e um dashboard operacional externo)

---

### 3.10 Dashboard / Visualizacao

#### raiz-platform
- **Grafana Cloud** via OTLP endpoint (traces + metrics)
- **Prometheus metrics** expostos em `/api/metrics`
- **ADR-003:** `D:/GitHub/raiz-platform/docs/adr/ADR-003-grafana-cloud-observability.md`
- **ADR-006:** `D:/GitHub/raiz-platform/docs/adr/ADR-006-automated-observability-triage.md`
- **Sentry dashboard** para errors + performance
- **PostHog dashboards** para product analytics + session replays

#### rAIz-AI-Prof
- **PerformanceDashboard.tsx:** Componente React embeddido na app
- **getMetricsSummary():** Agregacao local por categoria
- **getVitalsSummary():** Resumo de Web Vitals
- **Sentry dashboard** para errors (se configurado)
- **Plausible dashboard** para analytics (hospedado externamente)

**Gap critico:** rAIz-AI-Prof nao tem dashboard operacional externo. Debugging em producao requer acesso ao browser do usuario ou ao Sentry dashboard.

---

## 4. Gaps Consolidados

### 4.1 Gaps do raiz-platform

| # | Gap | Impacto | Severidade |
|---|---|---|---|
| RP-01 | Sem `beforeSend` customizado no Sentry (enrichment de tags) | Perde classificacao automatica de erros LLM/validation | P2 |
| RP-02 | Custom Tracer e OTel Tracer coexistem -- duplicacao de logica | Manutencao dobrada, possivel confusao sobre qual usar | P3 |
| RP-03 | Event Loop Monitor apenas em dev | Producao perde visibilidade de event loop lag | P3 |
| RP-04 | Metricas Prometheus em-memoria perdem dados em restart | Escala limitada em serverless (cold starts) | P2 |

### 4.2 Gaps do rAIz-AI-Prof

| # | Gap | Impacto | Severidade |
|---|---|---|---|
| AI-01 | Sem OpenTelemetry / tracing distribuido | Impossivel correlacionar operacoes end-to-end | P1 |
| AI-02 | Sem metricas server-side (Vercel functions) | Producao sem visibilidade de latencia/erros de API | P1 |
| AI-03 | Secret redaction por nome de chave apenas | Secrets em valores de string passam pelo sanitizer | P1 |
| AI-04 | Alertas apenas client-side (in-memory Map) | Perdem-se ao fechar browser, sem notificacao externa | P1 |
| AI-05 | Sem dashboard operacional externo (Grafana/Datadog) | Debugging em producao requer acesso ao browser do usuario | P2 |
| AI-06 | Session Replay com maskAllText: false | Risco de captura de PII (dados de alunos, questoes) | P0 |
| AI-07 | Analytics (Plausible) sem server-side tracking | Eventos de API routes nao sao capturados | P2 |
| AI-08 | Metricas em localStorage volateis | Limpar browser = perder historico de metricas | P2 |
| AI-09 | Sem API wrapper com observabilidade automatica | Cada endpoint precisa instrumentacao manual | P2 |
| AI-10 | Sem CI/CD observability (DORA metrics, triage) | Sem visibilidade de health do pipeline | P3 |
| AI-11 | Sem correlation entre analytics e error events | Impossivel responder "quantos usuarios foram impactados por esse erro?" | P2 |
| AI-12 | tracesSampleRate 0.3 em producao | Custo potencialmente 3x maior que necessario | P3 |

---

## 5. Oportunidades Priorizadas

### P0 -- Critico (resolver imediatamente)

#### O-01: Corrigir Session Replay PII no rAIz-AI-Prof
**Problema:** `maskAllText: false` e `blockAllMedia: false` em `D:/GitHub/rAIz-AI-Prof/lib/monitoring/sentry.ts` linha 96-97.
**Risco:** Captura texto de alunos, questoes, dados pessoais em Session Replay. Violacao potencial LGPD.
**Solucao:**
```typescript
// D:/GitHub/rAIz-AI-Prof/lib/monitoring/sentry.ts
Sentry.replayIntegration({
  maskAllText: true,     // era false
  blockAllMedia: true,   // era false
  maskAllInputs: true,
}),
```
**Esforco:** 15 minutos.

### P1 -- Alta Prioridade (sprint atual)

#### O-02: Implementar secret redaction pattern-based no rAIz-AI-Prof
**Problema:** `removeForbiddenFields()` em `D:/GitHub/rAIz-AI-Prof/lib/logging/sanitizer.ts` so detecta por nome de chave.
**Solucao:** Portar `secrets-scanner.ts` de raiz-platform (`D:/GitHub/raiz-platform/src/lib/security/secrets-scanner.ts`) com adaptacoes para browser (remover patterns server-only).
**Esforco:** 2-4 horas. Criar `D:/GitHub/rAIz-AI-Prof/lib/security/secrets-scanner.ts` com subset de patterns (JWT, API keys, Bearer tokens, passwords in URLs).

#### O-03: Adicionar observabilidade a Vercel Functions do rAIz-AI-Prof
**Problema:** `D:/GitHub/rAIz-AI-Prof/api/` functions nao tem logging/metrics/tracing.
**Solucao:** Criar um `withApiObservability()` wrapper inspirado em `D:/GitHub/raiz-platform/src/lib/observability/api-wrapper.ts`. Versao simplificada sem OTel (Sentry spans + structured logging).
**Esforco:** 4-8 horas.

#### O-04: Implementar alertas com notificacao externa no rAIz-AI-Prof
**Problema:** Alertas de `D:/GitHub/rAIz-AI-Prof/lib/logging/alerts.ts` ficam apenas em memoria.
**Solucao:**
1. Enviar alertas CRITICAL para Sentry como eventos (`captureMessage` com level error)
2. Opcional: webhook para Slack/Discord para alertas P0
3. Persistir alertas em Supabase para consulta posterior
**Esforco:** 4-6 horas.

#### O-05: Adicionar correlacao de trace basica no rAIz-AI-Prof
**Problema:** Sem tracing distribuido, impossivel rastrear operacao end-to-end.
**Solucao:** Nao precisa de OTel completo para SPA. Implementar:
1. `generateTraceId()` / `generateSpanId()` (copiar de raiz-platform `tracing.ts`)
2. Propagar `trace_id` como correlation_id no logging
3. Adicionar `trace_id` como Sentry tag
4. Passar `trace_id` para Vercel functions via header
**Esforco:** 4-6 horas. Referencia: `D:/GitHub/raiz-platform/src/lib/observability/tracing.ts`.

### P2 -- Media Prioridade (proximo sprint)

#### O-06: Adicionar server-side analytics no rAIz-AI-Prof
**Problema:** Eventos de Vercel API routes nao sao trackados.
**Solucao:** Duas opcoes:
1. Plausible Events API (server-side POST para api.plausible.io/events)
2. Migrar para PostHog (mais rico, ja usado no raiz-platform)
**Recomendacao:** Manter Plausible para pageviews + adicionar Sentry custom events para tracking server-side (ja disponivel). Migrar para PostHog quando necessario feature flags/session replay.
**Esforco:** 2-4 horas para Plausible Events API.

#### O-07: Implementar dashboard operacional no rAIz-AI-Prof
**Problema:** Apenas PerformanceDashboard in-app, sem visao operacional.
**Solucao:**
1. Expor metricas via Vercel function `/api/metrics`
2. Configurar Grafana Cloud free tier (10K metrics, 50GB logs)
3. Enviar metricas de Web Vitals + LLM + errors
**Esforco:** 8-16 horas para setup completo. Referencia: ADR-003 em `D:/GitHub/raiz-platform/docs/adr/ADR-003-grafana-cloud-observability.md`.

#### O-08: Reduzir tracesSampleRate no rAIz-AI-Prof
**Problema:** 0.3 (30%) em `D:/GitHub/rAIz-AI-Prof/lib/monitoring/sentry.ts` e excessivo para producao.
**Solucao:** Reduzir para 0.1 em producao (alinhado com raiz-platform). Manter 0.3 ou mais em staging.
```typescript
tracesSampleRate: getEnvironment() === 'production' ? 0.1 : 0.3,
```
**Esforco:** 5 minutos.

#### O-09: Adicionar beforeSend enrichment no raiz-platform Sentry
**Problema:** `D:/GitHub/raiz-platform/sentry.client.config.ts` nao tem beforeSend.
**Solucao:** Portar logica de enrichment do rAIz-AI-Prof para classificar erros automaticamente:
```typescript
beforeSend(event, hint) {
  const error = hint?.originalException;
  if (error instanceof Error) {
    if (error.message.match(/llm|ai|claude|gpt|gemini/i)) {
      event.tags = { ...event.tags, error_category: 'llm_generation' };
    }
    if (error.message.match(/supabase|rls|postgres/i)) {
      event.tags = { ...event.tags, error_category: 'database' };
    }
  }
  return event;
},
```
**Esforco:** 30 minutos.

#### O-10: Unificar sistema de metricas de negocio no rAIz-AI-Prof
**Problema:** Metricas de `D:/GitHub/rAIz-AI-Prof/lib/logging/metrics.ts` ficam em localStorage e Sentry breadcrumbs.
**Solucao:**
1. Enviar metricas agregadas para Supabase periodicamente (batch a cada 5min)
2. Criar tabela `business_metrics` no Supabase
3. Dashboard admin com metricas server-side queryaveis
**Esforco:** 4-8 horas.

### P3 -- Baixa Prioridade (backlog)

#### O-11: Consolidar dual tracer no raiz-platform
**Problema:** `tracing.ts` (custom) e `otel.ts` (OTel) coexistem com APIs diferentes.
**Solucao:** Deprecar custom tracer, usar apenas OTel API. `withSpan()` pode ser alias para `withOTelSpan()`.
**Esforco:** 8-16 horas (refactor em multiplos arquivos).

#### O-12: Implementar CI/CD observability no rAIz-AI-Prof
**Problema:** Sem DORA metrics, sem triage automatizada.
**Solucao:** Portar `D:/GitHub/raiz-platform/.github/workflows/dora-metrics.yml` e `observability-triage.yml`.
**Esforco:** 4-8 horas.

#### O-13: Adicionar event loop monitoring no raiz-platform producao
**Problema:** Event loop monitor em `D:/GitHub/raiz-platform/src/instrumentation.ts` so roda em dev.
**Solucao:** Habilitar em producao com threshold mais alto (500ms) e emitir como metrica OTel.
**Esforco:** 2 horas.

---

## 6. Patterns Reutilizaveis

### Pattern 1: Secret Scanner (raiz-platform -> rAIz-AI-Prof)
**Fonte:** `D:/GitHub/raiz-platform/src/lib/security/secrets-scanner.ts`
**Alvo:** Novo `D:/GitHub/rAIz-AI-Prof/lib/security/secrets-scanner.ts`
**Adaptacao:** Remover patterns server-only (AWS Secret Key com process.env, database URLs). Manter JWT, API keys, Bearer tokens.

### Pattern 2: API Wrapper com Observabilidade (raiz-platform -> rAIz-AI-Prof)
**Fonte:** `D:/GitHub/raiz-platform/src/lib/observability/api-wrapper.ts`
**Alvo:** Novo `D:/GitHub/rAIz-AI-Prof/api/middleware/withObservability.ts`
**Adaptacao:** Usar Sentry spans ao inves de OTel. Simplificar para Vercel functions format.

### Pattern 3: Triage Automatizado (raiz-platform -> rAIz-AI-Prof)
**Fonte:** `D:/GitHub/raiz-platform/src/lib/observability/triage/`
**Futuro:** Quando rAIz-AI-Prof tiver Grafana/metricas server-side, portar o triage service.

### Pattern 4: Event Catalog Tipado (raiz-platform -> padrao compartilhado)
**Fonte raiz-platform:** `D:/GitHub/raiz-platform/src/lib/analytics/events.ts`
**Fonte rAIz-AI-Prof:** `D:/GitHub/rAIz-AI-Prof/lib/monitoring/analytics.ts` (AnalyticsEvents)
**Oportunidade:** Ambos tem catalogo de eventos. Extrair pattern para package compartilhado.

### Pattern 5: Logging Taxonomy (rAIz-AI-Prof -> raiz-platform)
**Fonte:** `D:/GitHub/rAIz-AI-Prof/lib/logging/taxonomy.ts`
**Insight:** rAIz-AI-Prof tem uma taxonomia de eventos mais rica e formalizada que raiz-platform. O pattern `CATEGORIA::SUBCATEGORIA::EVENTO` e mais estruturado que strings livres.
**Oportunidade:** Adotar taxonomia canonica no raiz-platform logger.

### Pattern 6: Lazy-load Sentry (rAIz-AI-Prof -> padrao)
**Fonte:** `D:/GitHub/rAIz-AI-Prof/lib/monitoring/sentry.ts`, `D:/GitHub/rAIz-AI-Prof/index.tsx`
**Insight:** rAIz-AI-Prof faz dynamic import de `@sentry/react` para nao impactar bundle inicial. Fila de erros pendentes garante que nada se perde. Excelente pattern para SPAs.

### Pattern 7: Web Vitals com Sentry Integration (ambos -> padrao)
**Ambos projetos** reportam Web Vitals para Sentry. rAIz-AI-Prof tem integracao mais direta (`reportWebVital` com `setMeasurement`). raiz-platform envia via PostHog. Combinar: enviar para ambos.

---

## 7. Mapa de Arquivos Relevantes

### raiz-platform

| Arquivo | Funcao |
|---|---|
| `D:/GitHub/raiz-platform/sentry.client.config.ts` | Sentry config client |
| `D:/GitHub/raiz-platform/sentry.server.config.ts` | Sentry config server |
| `D:/GitHub/raiz-platform/sentry.edge.config.ts` | Sentry config edge |
| `D:/GitHub/raiz-platform/src/instrumentation.ts` | Next.js instrumentation entry |
| `D:/GitHub/raiz-platform/src/lib/observability/otel.ts` | OpenTelemetry SDK setup |
| `D:/GitHub/raiz-platform/src/lib/observability/logger.ts` | Structured JSON logger + OTel |
| `D:/GitHub/raiz-platform/src/lib/observability/tracing.ts` | Custom tracer (spans, context) |
| `D:/GitHub/raiz-platform/src/lib/observability/metrics.ts` | Prometheus-compatible metrics |
| `D:/GitHub/raiz-platform/src/lib/observability/instrumentation.ts` | Agent/tool/LLM custom spans |
| `D:/GitHub/raiz-platform/src/lib/observability/api-wrapper.ts` | API route observability wrapper |
| `D:/GitHub/raiz-platform/src/lib/observability/lightning-exporter.ts` | Custom OTel span exporter |
| `D:/GitHub/raiz-platform/src/lib/observability/index.ts` | Module barrel exports |
| `D:/GitHub/raiz-platform/src/lib/observability/triage/triage-service.ts` | Auto-triage: signals -> issues |
| `D:/GitHub/raiz-platform/src/lib/observability/triage/types.ts` | Triage types + thresholds |
| `D:/GitHub/raiz-platform/src/lib/analytics/posthog-client.ts` | PostHog client SDK |
| `D:/GitHub/raiz-platform/src/lib/analytics/posthog-server.ts` | PostHog server SDK |
| `D:/GitHub/raiz-platform/src/lib/analytics/PostHogProvider.tsx` | PostHog React provider |
| `D:/GitHub/raiz-platform/src/lib/analytics/events.ts` | PostHog event catalog |
| `D:/GitHub/raiz-platform/src/lib/analytics/index.ts` | Analytics barrel exports |
| `D:/GitHub/raiz-platform/src/lib/monitoring/web-vitals.ts` | Web Vitals tracking + PostHog |
| `D:/GitHub/raiz-platform/src/lib/security/secrets-scanner.ts` | Secret detection + redaction |

### rAIz-AI-Prof

| Arquivo | Funcao |
|---|---|
| `D:/GitHub/rAIz-AI-Prof/lib/monitoring/sentry.ts` | Sentry config + LLM spans + Web Vitals |
| `D:/GitHub/rAIz-AI-Prof/lib/monitoring/analytics.ts` | Plausible analytics |
| `D:/GitHub/rAIz-AI-Prof/lib/monitoring/web-vitals.ts` | Web Vitals tracking |
| `D:/GitHub/rAIz-AI-Prof/lib/monitoring/index.ts` | Monitoring barrel + init |
| `D:/GitHub/rAIz-AI-Prof/lib/logging/logger.ts` | Structured logger (IndexedDB + Supabase) |
| `D:/GitHub/rAIz-AI-Prof/lib/logging/index.ts` | Logging barrel exports |
| `D:/GitHub/rAIz-AI-Prof/lib/logging/types.ts` | Log entry schema + types |
| `D:/GitHub/rAIz-AI-Prof/lib/logging/taxonomy.ts` | Canonical event taxonomy |
| `D:/GitHub/rAIz-AI-Prof/lib/logging/sanitizer.ts` | PII sanitization |
| `D:/GitHub/rAIz-AI-Prof/lib/logging/storage.local.ts` | IndexedDB log storage |
| `D:/GitHub/rAIz-AI-Prof/lib/logging/storage.remote.ts` | Supabase log storage |
| `D:/GitHub/rAIz-AI-Prof/lib/logging/alerts.ts` | Client-side alert system |
| `D:/GitHub/rAIz-AI-Prof/lib/logging/metrics.ts` | Business metrics (localStorage) |
| `D:/GitHub/rAIz-AI-Prof/lib/logging/analytics.ts` | Log analytics/aggregation |
| `D:/GitHub/rAIz-AI-Prof/hooks/usePerformance.ts` | Component performance hook |
| `D:/GitHub/rAIz-AI-Prof/components/performance/PerformanceDashboard.tsx` | In-app performance dashboard |
| `D:/GitHub/rAIz-AI-Prof/index.tsx` | App entry (monitoring init) |

---

## 8. Score de Maturidade

| Dimensao | raiz-platform (0-5) | rAIz-AI-Prof (0-5) | Gap |
|---|---|---|---|
| Structured Logging | 5 | 4 | 1 |
| Error Tracking | 4 | 3 | 1 |
| Distributed Tracing | 5 | 0 | 5 |
| Metrics Collection | 4 | 2 | 2 |
| Product Analytics | 5 | 3 | 2 |
| Alert System | 5 | 2 | 3 |
| Secret Redaction | 5 | 2 | 3 |
| Log Levels | 4 | 4 | 0 |
| Performance Monitoring | 4 | 3 | 1 |
| Dashboard/Visualization | 4 | 2 | 2 |
| **MEDIA** | **4.5** | **2.5** | **2.0** |

O raiz-platform tem maturidade nivel 4-5 (enterprise). O rAIz-AI-Prof esta nivel 2-3 (startup) com base solida para evoluir. As maiores oportunidades de melhoria estao em tracing (gap 5), alertas (gap 3), e secret redaction (gap 3).

---

## 9. Recomendacao de Roadmap

### Sprint Atual (Semana 1)
1. **O-01 (P0):** Fix Session Replay PII -- 15min
2. **O-08 (P2):** Reduzir sampling rate -- 5min
3. **O-02 (P1):** Secret scanner pattern-based -- 4h
4. **O-05 (P1):** Trace correlation basica -- 4h

### Sprint Seguinte (Semana 2)
5. **O-03 (P1):** API wrapper observabilidade -- 8h
6. **O-04 (P1):** Alertas com notificacao externa -- 6h
7. **O-09 (P2):** beforeSend enrichment raiz-platform -- 30min

### Sprint 3+
8. **O-06 (P2):** Server-side analytics -- 4h
9. **O-07 (P2):** Dashboard Grafana -- 16h
10. **O-10 (P2):** Metricas no Supabase -- 8h
11. **O-11/12/13 (P3):** Consolidacao e CI/CD -- backlog
