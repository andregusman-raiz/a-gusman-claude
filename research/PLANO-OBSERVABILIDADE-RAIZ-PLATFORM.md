# Plano de Implementacao: Observabilidade Log-Driven para rAIz Platform

> **Status**: DRAFT — Aguardando aprovacao para execucao
> **Data**: 2026-03-01
> **Tipo**: Size XL (~40-60h total, 6 fases incrementais)
> **Documentos base**:
> - `D:/.claude/research/raiz-platform-profile.md` — perfil atual do projeto
> - `D:/.claude/research/log-driven-improvement-reference.md` — tecnicas estado-da-arte

---

## Indice

1. [Diagnostico: Estado Atual vs Ideal](#1-diagnostico)
2. [Visao: Arquitetura Alvo](#2-visao)
3. [Fases de Implementacao](#3-fases)
4. [Dependencias e Riscos](#4-dependencias)
5. [Metricas de Sucesso](#5-metricas)
6. [Decisoes Arquiteturais](#6-decisoes)

---

## 1. Diagnostico: Estado Atual vs Ideal

### Matriz de Maturidade

| Pilar | Atual | Alvo | Gap |
|-------|-------|------|-----|
| **Structured Logging** | Logger JSON existe mas `removeConsole` mata tudo em prod | Logger com transport HTTP direto, 100% routes cobertas | CRITICO |
| **Distributed Tracing** | OTel SDK configurado, 10% sampling, custom agent instrumentation | OTel funcionando em prod com backend (Grafana Tempo ou similar) | MODERADO |
| **Error Tracking** | Sentry funcional (client+server+edge, replay, filtering) | Sentry + correlacao com analytics + error budgets | BAIXO |
| **Metrics** | 14 metricas Prometheus, endpoint `/api/metrics` | Metricas coletadas + dashboards + alertas | MODERADO |
| **Health Checks** | 5 endpoints funcionais, health aggregator | Uptime monitoring externo + dashboards | BAIXO |
| **Audit Trail** | SharedAuditService, platform_audit_logs, admin UI | Adicionar audit para modulos faltantes | BAIXO |
| **User Analytics** | ZERO | PostHog (feature adoption, journeys, session replay) | CRITICO |
| **Log Shipping** | ZERO (logs nao saem do container) | Logs vissiveis em dashboard externo | CRITICO |
| **Alerting** | ZERO | 3 camadas (critico/warning/info) com Slack/email | ALTO |
| **Dashboards** | ZERO | Operacional (SRE) + Analitico (Product) | ALTO |
| **Performance Monitoring** | Web Vitals coletados mas nao enviados, PerfLogger local | Vercel Speed Insights + PostHog | MODERADO |
| **DB Query Monitoring** | trackDbQuery manual (>200ms), sem interceptor auto | Interceptor automatico no Supabase client | MODERADO |

### Gaps Priorizados por Impacto

```
P0 (Blocker — sem isso, nao ha observabilidade em prod):
├── GAP-01: removeConsole mata logger em producao
├── GAP-02: Sem log shipping (logs desaparecem com o container)
└── GAP-03: Sem analytics de usuario

P1 (Alto impacto — melhoria significativa):
├── GAP-04: Sem alerting (ninguem sabe quando algo quebra)
├── GAP-05: Sem dashboards (dados existem mas nao sao visualizados)
└── GAP-06: API routes sem observability wrapper (62/80+ routes)

P2 (Moderado — melhoria incremental):
├── GAP-07: Dois loggers coexistem (inconsistencia)
├── GAP-08: Sem interceptor automatico de queries DB
├── GAP-09: Web Vitals nao enviados
├── GAP-10: Speed Insights instalado mas nao integrado
└── GAP-11: OTel sem backend configurado em prod

P3 (Baixo — nice-to-have):
├── GAP-12: 359+ console.log diretos (migrar para logger)
├── GAP-13: Sem uptime monitoring externo
└── GAP-14: Sem error budgets como gate de deploy
```

---

## 2. Visao: Arquitetura Alvo

### Stack Recomendado (Intermediario — otimizado para Vercel + Supabase)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    rAIz Platform — Observability Stack              │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    INSTRUMENTACAO (codigo)                    │   │
│  │                                                              │   │
│  │  [Logger Estruturado]  →  Transport HTTP (nao console)       │   │
│  │  [OTel SDK]            →  OTLP exporter para Grafana Cloud   │   │
│  │  [Sentry SDK]          →  Error tracking (ja funcional)      │   │
│  │  [PostHog SDK]         →  Product analytics + session replay │   │
│  │  [withObservability()]  →  Em TODAS as API routes            │   │
│  │  [Supabase Interceptor] →  Auto-track de queries             │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              |                                      │
│                              v                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    BACKENDS                                   │   │
│  │                                                              │   │
│  │  [Grafana Cloud Free]     [Sentry]        [PostHog Cloud]    │   │
│  │   ├─ Loki (logs)          ├─ Errors       ├─ Analytics       │   │
│  │   ├─ Tempo (traces)       ├─ Perf         ├─ Session Replay  │   │
│  │   ├─ Mimir (metrics)      └─ Replay       ├─ Feature Flags   │   │
│  │   └─ Alerting                              └─ Experiments    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              |                                      │
│                              v                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    VISUALIZACAO + ACAO                        │   │
│  │                                                              │   │
│  │  [Grafana Dashboards]     [Slack/Email Alerts]               │   │
│  │   ├─ Operacional (SRE)    ├─ P0: erro critico               │   │
│  │   ├─ Analitico (Product)  ├─ P1: degradacao                  │   │
│  │   └─ AI/Agent             └─ P2: warning acumulado           │   │
│  │                                                              │   │
│  │  [BetterStack]            [Error Budget Gate]                │   │
│  │   └─ Uptime monitoring     └─ CI/CD gate baseado em SLO     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Custo estimado: $0-100/mes (free tiers)                            │
│  OTel garante: troca de backend sem mudar codigo                    │
└─────────────────────────────────────────────────────────────────────┘
```

### Decisao de Stack

| Componente | Escolha | Justificativa |
|------------|---------|---------------|
| **Log aggregation** | Grafana Cloud (Loki) | Free tier 50GB/mes, OTel-native, sem vendor lock-in |
| **Traces** | Grafana Cloud (Tempo) | Free tier 50GB/mes, correlacao com Loki |
| **Metrics** | Grafana Cloud (Mimir) | Free tier 10K series, Prometheus-compatible (ja temos endpoint) |
| **Error tracking** | Sentry (manter) | Ja funcional, bem configurado |
| **User analytics** | PostHog Cloud | Free 1M events/mes, session replay, feature flags, open source |
| **Uptime** | BetterStack (free) | 10 monitors free, status page incluida |
| **Alerting** | Grafana Alerting + Slack | Integrado com Loki/Mimir, zero custo extra |
| **Dashboards** | Grafana | Unificado com os backends acima |
| **Speed Insights** | Vercel Speed Insights | Ja instalado, so precisa ativar |

---

## 3. Fases de Implementacao

### Fase 0: Corrigir o Blocker Critico (GAP-01)
**Size**: S (~2h) | **Prioridade**: P0 | **Risco**: ZERO LOGS EM PRODUCAO

**Problema**: `next.config.mjs` tem `compiler: { removeConsole: true }` em producao. O logger estruturado usa `console.*` como transport — todos os logs sao removidos silenciosamente.

**Tarefas**:

| # | Tarefa | Arquivo | Descricao |
|---|--------|---------|-----------|
| 0.1 | Remover `removeConsole` do next.config | `next.config.mjs` | Remover ou refinar para nao afetar o logger |
| 0.2 | Alternativa: Transport HTTP no logger | `src/lib/observability/logger.ts` | Adicionar transport que envia via HTTP para backend de logs (nao depende de console) |
| 0.3 | Testar que logs aparecem em build de prod | CI | Validar com `npm run build && npm start` |

**Opcoes de implementacao (escolher 1)**:

**Opcao A (Rapida)**: Refinar `removeConsole` para manter `console.error` e `console.warn`:
```javascript
compiler: {
  removeConsole: {
    exclude: ['error', 'warn', 'info'] // manter info+warn+error
  }
}
```

**Opcao B (Robusta)**: Adicionar transport HTTP ao logger que nao depende de console:
```typescript
// Em logger.ts, adicionar:
async function httpTransport(entry: LogEntry) {
  if (process.env.LOG_ENDPOINT) {
    await fetch(process.env.LOG_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(entry),
      signal: AbortSignal.timeout(2000)
    }).catch(() => {}); // fire-and-forget
  }
}
```

**Opcao C (Definitiva)**: Usar OTel Logs API como transport (logs vao pelo mesmo pipeline que traces/metrics):
```typescript
import { logs } from '@opentelemetry/api-logs';
const otelLogger = logs.getLogger('raiz-platform');

function otelTransport(entry: LogEntry) {
  otelLogger.emit({
    severityNumber: mapLevel(entry.level),
    body: entry.message,
    attributes: entry.data
  });
}
```

**Recomendacao**: Opcao A imediata (5 min) + Opcao C como parte da Fase 2.

**Criterio de done**: Logs vissiveis em `vercel logs` ou backend de logs apos deploy.

---

### Fase 1: Product Analytics (GAP-03)
**Size**: M (~4-6h) | **Prioridade**: P0

**Objetivo**: Visibilidade sobre como usuarios usam a plataforma.

**Tarefas**:

| # | Tarefa | Arquivo(s) | Descricao |
|---|--------|------------|-----------|
| 1.1 | Instalar PostHog SDK | `package.json` | `npm install posthog-js posthog-node` |
| 1.2 | Criar PostHog provider | `src/lib/analytics/posthog-provider.tsx` | Provider React com init condicional (prod only) |
| 1.3 | Adicionar ao AppProviders | `src/providers/AppProviders.tsx` | Adicionar PostHogProvider na hierarquia |
| 1.4 | Server-side PostHog | `src/lib/analytics/posthog-server.ts` | PostHog Node client para server-side events |
| 1.5 | Eventos automaticos | `src/lib/analytics/events.ts` | Definir catalogo de eventos: page_view, feature_used, error_encountered, ai_chat_sent |
| 1.6 | Identify usuarios | `src/context/AuthContext.tsx` | `posthog.identify()` no login com propriedades (role, workspace) |
| 1.7 | Track feature usage | API routes chave | `posthog.capture('feature_used', { module, action })` nos modulos principais |
| 1.8 | Session replay | PostHog config | Ativar session replay (opt-in, privacy-safe) |
| 1.9 | Ativar Speed Insights | `src/app/layout.tsx` | Adicionar `<SpeedInsights />` (ja instalado, so ativar) |

**Privacidade**:
- Respeitar `maskAllText` e `blockAllMedia` (mesmo approach do Sentry replay)
- Nao capturar PII em eventos (user_id hasheado, sem email/nome)
- Compliance com politica de privacidade existente

**Catalogo de Eventos Inicial**:
```typescript
export const EVENTS = {
  // Navegacao
  PAGE_VIEW: 'page_view',
  MODULE_ACCESSED: 'module_accessed',

  // AI/Chat
  AI_CHAT_SENT: 'ai_chat_sent',
  AI_RESPONSE_RECEIVED: 'ai_response_received',
  AI_MODEL_USED: 'ai_model_used',

  // Features
  FEATURE_USED: 'feature_used',
  DOCUMENT_UPLOADED: 'document_uploaded',
  REPORT_GENERATED: 'report_generated',

  // Errors (correlacao com Sentry)
  ERROR_ENCOUNTERED: 'error_encountered',

  // UX
  RAGE_CLICK: 'rage_click', // PostHog autocapture
  DEAD_CLICK: 'dead_click', // PostHog autocapture
} as const;
```

**Criterio de done**: Dashboard PostHog mostrando page views, feature usage e session replays.

---

### Fase 2: Log Shipping + Backend de Observabilidade (GAP-02, GAP-11)
**Size**: M (~6-8h) | **Prioridade**: P0

**Objetivo**: Logs, traces e metricas vissiveis em dashboard central (Grafana Cloud).

**Tarefas**:

| # | Tarefa | Arquivo(s) | Descricao |
|---|--------|------------|-----------|
| 2.1 | Criar conta Grafana Cloud | Setup externo | Free tier: 50GB logs, 50GB traces, 10K metric series |
| 2.2 | Configurar OTel para Grafana | `.env.production` | Setar `OTEL_EXPORTER_OTLP_ENDPOINT` e `OTEL_EXPORTER_OTLP_HEADERS` |
| 2.3 | Adicionar OTel Logs API | `src/lib/observability/logger.ts` | Transport via OTel Logs (Opcao C da Fase 0) |
| 2.4 | Verificar OTel init em prod | `src/instrumentation.ts` | Garantir que OTel inicializa em producao (nao so se endpoint definido) |
| 2.5 | Configurar Vercel log drain | Vercel Dashboard | Enviar logs do Vercel para Grafana Loki |
| 2.6 | Testar correlacao log-trace | Validacao | Verificar que trace_id aparece nos logs e nos traces |
| 2.7 | Configurar Prometheus scrape | Grafana Cloud | Adicionar endpoint `/api/metrics` como target |

**Decisao: Vercel Log Drain vs OTel**:
- Vercel Log Drain: captura TODOS os logs (incluindo runtime errors, cold starts)
- OTel Logs API: captura apenas logs instrumentados (mais controle, correlacao com traces)
- **Recomendacao**: Ambos. Log Drain como safety net, OTel para logs estruturados com correlacao.

**Criterio de done**: Logs e traces da aplicacao vissiveis no Grafana Cloud com correlacao.

---

### Fase 3: Dashboards + Alerting (GAP-04, GAP-05)
**Size**: M (~4-6h) | **Prioridade**: P1

**Objetivo**: Dashboards operacionais e alertas automaticos.

**Tarefas**:

| # | Tarefa | Descricao |
|---|--------|-----------|
| 3.1 | Dashboard Operacional (SRE) | Error rate, latencia P50/P95/P99, throughput, error budget, health checks |
| 3.2 | Dashboard AI/Agent | Tokens consumidos por modelo, custo por workspace, latencia por provider, errors por modelo |
| 3.3 | Dashboard Analitico (Product) | Feature adoption (PostHog), user journeys, module usage, session duration |
| 3.4 | Alertas P0 (Slack) | 5xx rate >5%, health check fail, Sentry spike, OOM |
| 3.5 | Alertas P1 (Email) | Latencia P99 >2s, error rate >1%, cron job fail, slow queries |
| 3.6 | Alertas P2 (Dashboard) | Cache hit rate <80%, queue backlog crescendo, dependency degradation |
| 3.7 | Uptime monitoring | BetterStack free: monitorar /api/health, /api/v1/health, homepage |

**Dashboard Operacional — Paineis**:
```
┌────────────────────────────────────────────────────┐
│  rAIz Platform — Operational Dashboard             │
├──────────────┬──────────────┬──────────────────────┤
│ Error Rate   │ Latency P99  │ Health Status        │
│ [sparkline]  │ [sparkline]  │ ● Redis: OK          │
│ 0.12%        │ 450ms        │ ● Supabase: OK       │
│              │              │ ● MCP: 3/4 OK        │
│              │              │ ● AI: OK             │
├──────────────┼──────────────┼──────────────────────┤
│ Requests/min │ Active SSE   │ AI Cost (24h)        │
│ [timeseries] │ [gauge]      │ [bar by provider]    │
│ 1,247        │ 34           │ $12.45               │
├──────────────┴──────────────┴──────────────────────┤
│ Top Errors (24h)          │ Slow Endpoints (P99)   │
│ 1. ValidationError (45x)  │ 1. /api/ai/chat 890ms  │
│ 2. TimeoutError (12x)     │ 2. /api/rag/query 650ms│
│ 3. AuthError (8x)         │ 3. /api/reports 520ms  │
└───────────────────────────┴────────────────────────┘
```

**Criterio de done**: 3 dashboards criados no Grafana, alertas P0 chegando no Slack.

---

### Fase 4: Instrumentacao Completa (GAP-06, GAP-07, GAP-08, GAP-09, GAP-10)
**Size**: L (~10-15h) | **Prioridade**: P2

**Objetivo**: 100% das API routes com observabilidade, logger unificado, DB auto-tracking.

**Tarefas**:

| # | Tarefa | Descricao | Estimativa |
|---|--------|-----------|------------|
| 4.1 | Aplicar `withObservability()` em ~62 routes | Wrap todas as API routes restantes | 4-6h |
| 4.2 | Migrar logger legado | Substituir 7 imports de `@/lib/logger` para `@/lib/observability/logger` | 30min |
| 4.3 | Deprecar `src/lib/logger/` | Marcar como deprecated, remover em proximo ciclo | 15min |
| 4.4 | Criar Supabase query interceptor | Wrapper no createClient que auto-tracked queries com duracao | 2-3h |
| 4.5 | Ativar Web Vitals reporting | Conectar `reportWebVitals` ao PostHog ou endpoint custom | 1h |
| 4.6 | Verificar Speed Insights funcional | Confirmar dados no Vercel dashboard | 15min |
| 4.7 | Migrar top-20 console.log para logger | Substituir os mais criticos em services e middleware | 2-3h |

**4.1 — Estrategia para ~62 API routes**:
- Batch por modulo (nao arquivo por arquivo)
- Prioridade: modulos com mais trafego primeiro (chat, ai, social-media, totvs)
- Commits incrementais a cada 5-8 routes (regra do projeto)
- Typecheck apos cada batch

**4.4 — Supabase Query Interceptor**:
```typescript
// src/lib/supabase/instrumented-client.ts
import { createClient as originalCreateClient } from '@supabase/supabase-js';
import { logger } from '@/lib/observability/logger';

export function createInstrumentedClient(url: string, key: string, options?: any) {
  const client = originalCreateClient(url, key, options);

  // Interceptar .from() para auto-track
  const originalFrom = client.from.bind(client);
  client.from = (table: string) => {
    const start = performance.now();
    const builder = originalFrom(table);

    // Hook nos metodos terminais (.select, .insert, .update, .delete)
    // Log duracao e tabela acessada
    // Warn se >200ms
    return builder;
  };

  return client;
}
```

**Criterio de done**: 100% API routes com `withObservability()`, zero imports do logger legado, queries DB auto-tracked.

---

### Fase 5: Feedback Loop (GAP-14 + tecnicas avancadas)
**Size**: M (~6-8h) | **Prioridade**: P3

**Objetivo**: Fechar o ciclo logs → insights → melhoria de software.

**Tarefas**:

| # | Tarefa | Descricao |
|---|--------|-----------|
| 5.1 | Error budget gate no CI | GitHub Action que bloqueia deploy se error budget <25% |
| 5.2 | Auto-create issues de Sentry | Webhook Sentry → GitHub Issues com impact score |
| 5.3 | Slow query report semanal | Cron job que gera report de top-20 queries mais lentas |
| 5.4 | Feature adoption report | PostHog dashboard mostrando adocao por modulo/feature |
| 5.5 | Dependency health dashboard | Monitorar latencia/erros para cada integracao externa |
| 5.6 | Deploy correlation | Correlacionar deploys (GitHub webhook) com spikes de erros |
| 5.7 | DORA metrics | Dashboard com as 4 metricas DORA derivadas do CI/CD |

**5.1 — Error Budget Gate**:
```yaml
# .github/workflows/ci.yml (adicionar step)
- name: Check Error Budget
  if: github.ref == 'refs/heads/master'
  run: |
    BUDGET=$(curl -s -H "Authorization: Bearer ${{ secrets.GRAFANA_TOKEN }}" \
      "$GRAFANA_API/api/v1/query?query=slo:error_budget_remaining{service='raiz-platform'}")
    REMAINING=$(echo $BUDGET | jq -r '.data.result[0].value[1]')
    if (( $(echo "$REMAINING < 0.25" | bc -l) )); then
      echo "::warning::Error budget at ${REMAINING}%. Consider focusing on reliability."
    fi
```

**5.7 — DORA Metrics**:

| Metrica | Fonte | Como calcular |
|---------|-------|---------------|
| Deployment Frequency | GitHub API | Merges para master / semana |
| Lead Time for Changes | GitHub API | Tempo entre primeiro commit e deploy |
| Change Failure Rate | Sentry + Deploys | Deploys que causaram spike de erros / total deploys |
| Time to Restore | Grafana Alerting | Duracao media dos incidentes |

**Criterio de done**: Error budget visivel no CI, issues criados automaticamente de errors, DORA metrics no dashboard.

---

### Fase 6: Consolidacao e Cleanup (GAP-12, GAP-13)
**Size**: S (~3-4h) | **Prioridade**: P3

**Tarefas**:

| # | Tarefa | Descricao |
|---|--------|-----------|
| 6.1 | Migrar restante dos console.log | Substituir 300+ console.log em services/hooks/contexts |
| 6.2 | Remover logger legado | Deletar `src/lib/logger/` completamente |
| 6.3 | ADR de observabilidade | Documentar decisoes (Grafana Cloud, PostHog, etc.) |
| 6.4 | Runbook de incidentes | Template de runbook para top-5 alertas mais comuns |
| 6.5 | Validacao E2E de observabilidade | Playwright test que verifica health endpoint + metrics endpoint |

---

## 4. Dependencias e Riscos

### Dependencias entre Fases

```
Fase 0 ──→ Fase 2 ──→ Fase 3
  │                      │
  │         Fase 1       │
  │           │          │
  └───────────┴──────────┴──→ Fase 4 ──→ Fase 5 ──→ Fase 6
```

- **Fase 0** e **Fase 1** sao independentes (podem rodar em paralelo)
- **Fase 2** depende de Fase 0 (logs precisam funcionar antes de shipping)
- **Fase 3** depende de Fase 2 (dashboards precisam de dados)
- **Fase 4** pode comecar apos Fase 0 (instrumentacao nao depende de backend)
- **Fase 5** depende de Fase 2 e 3 (feedback loop precisa de infra)
- **Fase 6** e a ultima (cleanup apos tudo funcionando)

### Riscos

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|--------------|---------|-----------|
| `removeConsole` fix quebra producao | Baixa | Alto | Testar em staging primeiro |
| PostHog overhead em cliente | Media | Medio | Lazy load, amostrar session replay |
| Grafana Cloud free tier estourado | Media | Baixo | Monitoring de ingestao, sampling |
| OTel aumenta latencia de cold start | Media | Medio | Import dinamico (ja feito) |
| Custo de PostHog escalar | Baixa | Medio | Self-hosted como fallback |
| GDPR com session replay | Media | Alto | `maskAllText`, `blockAllMedia`, consentimento |

---

## 5. Metricas de Sucesso

### KPIs por Fase

| Fase | KPI | Meta |
|------|-----|------|
| 0 | Logs visiveis em prod | 100% dos log levels aparecendo |
| 1 | Eventos PostHog capturados | >1K events/dia nos primeiros 7 dias |
| 2 | Logs no Grafana | >95% dos requests com log entry |
| 3 | MTTD (Mean Time to Detect) | <5 min para erros P0 |
| 4 | API routes instrumentadas | 100% (80+ routes) |
| 5 | MTTR (Mean Time to Resolve) | Baseline estabelecido |
| 6 | Console.log restantes | <20 (apenas debug temporario) |

### Maturidade Alvo

```
Antes:  [████░░░░░░] 35% — Logger existe, Sentry funciona, mas zero visibilidade
Fase 0: [█████░░░░░] 45% — Logs funcionam em producao
Fase 1: [██████░░░░] 55% — User analytics ativo
Fase 2: [███████░░░] 65% — Logs e traces centralizados
Fase 3: [████████░░] 75% — Dashboards e alertas funcionais
Fase 4: [█████████░] 85% — Instrumentacao completa
Fase 5: [██████████] 95% — Feedback loop fechado
```

---

## 6. Decisoes Arquiteturais

### ADR-003: Grafana Cloud como Backend de Observabilidade

**Contexto**: O projeto precisa de um backend para logs, traces e metricas. Opcoes: Grafana Cloud, Datadog, New Relic, self-hosted ELK.

**Decisao**: Grafana Cloud (free tier)

**Justificativa**:
- Free tier generoso (50GB logs, 50GB traces, 10K metric series)
- OTel-native (sem vendor lock-in)
- Correlacao nativa entre logs, traces e metricas
- Alerting integrado
- Já temos endpoint Prometheus (`/api/metrics`) compativel
- Custo $0 no inicio, scaling previsivel

**Alternativas consideradas**:
- Datadog: excelente, mas custo alto (~$15/host/mes + ingestao)
- New Relic: free 100GB/mes, mas interface mais complexa
- Self-hosted ELK: custo de operacao alto, nao justificavel para o time

### ADR-004: PostHog como Product Analytics

**Contexto**: Zero visibilidade sobre como usuarios usam a plataforma.

**Decisao**: PostHog Cloud (free tier)

**Justificativa**:
- Free tier 1M events/mes (suficiente para 40 escolas)
- Session replay integrado (sem ferramenta extra)
- Feature flags integrados (pode substituir o FeatureFlagService custom)
- Open source (pode migrar para self-hosted se necessario)
- Integracao nativa com Sentry (correlacao error → session)
- GDPR-friendly (EU hosting disponivel, PII controls)

**Alternativas consideradas**:
- Mixpanel: mais maduro, mas free tier menor (20M events/mes, sem replay)
- Amplitude: bom, mas enterprise-focused
- Google Analytics: privacidade questionavel, sem session replay

### ADR-005: Transport de Logs via OTel (nao console)

**Contexto**: `removeConsole: true` no Next.js remove o output do logger em producao.

**Decisao**: Migrar transport do logger de `console.*` para OTel Logs API + manter `removeConsole` com exclusoes.

**Justificativa**:
- OTel Logs API envia logs pelo mesmo pipeline que traces (correlacao automatica)
- Nao depende de console (imune a `removeConsole`)
- Padrao aberto (pode trocar backend sem mudar codigo)
- `removeConsole` com exclusoes mantem console.error para debugging emergencial

---

## Apendice: Checklist Rapido

### Para comecar hoje (Fase 0):
- [ ] Refinar `removeConsole` em `next.config.mjs` (Opcao A — 5 min)
- [ ] Testar que logs aparecem em `vercel logs`
- [ ] Deploy para preview e validar

### Para a proxima sprint (Fase 1 + 2):
- [ ] Criar conta PostHog Cloud
- [ ] Criar conta Grafana Cloud
- [ ] Instalar PostHog SDK
- [ ] Configurar `OTEL_EXPORTER_OTLP_ENDPOINT` para Grafana
- [ ] Ativar `<SpeedInsights />` no layout

### Para o proximo mes (Fases 3-6):
- [ ] Dashboards no Grafana
- [ ] Alertas no Slack
- [ ] Instrumentacao completa das API routes
- [ ] Feedback loop (error budgets, DORA, auto-issues)
