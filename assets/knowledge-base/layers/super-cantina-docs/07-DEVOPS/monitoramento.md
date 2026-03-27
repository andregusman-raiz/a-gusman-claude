# Monitoramento - Super Cantina

## Visão Geral

O sistema de monitoramento do Super Cantina utiliza a stack **Prometheus + Grafana + Loki** para métricas, dashboards e logs.

---

## Stack de Observabilidade

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            OBSERVABILITY STACK                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                          DATA SOURCES                                    │ │
│  │                                                                          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │ │
│  │  │   API       │  │   PDV       │  │  Database   │  │   Redis     │     │ │
│  │  │  /metrics   │  │  /metrics   │  │  metrics    │  │   metrics   │     │ │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │ │
│  │         │                │                │                │            │ │
│  └─────────┼────────────────┼────────────────┼────────────────┼────────────┘ │
│            │                │                │                │              │
│            └────────────────┴────────────────┴────────────────┘              │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                          COLLECTION                                      │ │
│  │                                                                          │ │
│  │  ┌─────────────────────────┐     ┌─────────────────────────┐            │ │
│  │  │       Prometheus        │     │         Loki            │            │ │
│  │  │                         │     │                         │            │ │
│  │  │  • Scrape metrics       │     │  • Aggregate logs       │            │ │
│  │  │  • Store time-series    │     │  • Index and query      │            │ │
│  │  │  • Alert evaluation     │     │  • Retention policy     │            │ │
│  │  └───────────┬─────────────┘     └───────────┬─────────────┘            │ │
│  │              │                               │                          │ │
│  └──────────────┼───────────────────────────────┼──────────────────────────┘ │
│                 │                               │                            │
│                 └───────────────┬───────────────┘                            │
│                                 │                                            │
│                                 ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         VISUALIZATION                                    │ │
│  │                                                                          │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │ │
│  │  │                        Grafana                                   │    │ │
│  │  │                                                                  │    │ │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │    │ │
│  │  │  │  Dashboard  │  │   Alerts    │  │   Explore   │             │    │ │
│  │  │  │  Overview   │  │   Panel     │  │    Logs     │             │    │ │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘             │    │ │
│  │  │                                                                  │    │ │
│  │  └──────────────────────────────────────────────────────────────────┘    │ │
│  │                                                                          │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Métricas da Aplicação

### Instrumentação

```typescript
// src/monitoring/metrics.ts

import { Registry, Counter, Histogram, Gauge } from 'prom-client';

export const registry = new Registry();

// Métricas padrão do Node.js
registry.setDefaultLabels({
  app: 'supercantina',
  environment: process.env.NODE_ENV,
});

// ================================
// REQUEST METRICS
// ================================

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total de requisições HTTP',
  labelNames: ['method', 'path', 'status'],
  registers: [registry],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duração das requisições HTTP em segundos',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});

// ================================
// DECISION ENGINE METRICS
// ================================

export const decisionTotal = new Counter({
  name: 'decision_engine_total',
  help: 'Total de decisões tomadas',
  labelNames: ['decision', 'source'],
  registers: [registry],
});

export const decisionLatency = new Histogram({
  name: 'decision_engine_latency_seconds',
  help: 'Latência do decision engine em segundos',
  labelNames: ['decision'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 0.75, 1],
  registers: [registry],
});

export const slaViolations = new Counter({
  name: 'sla_violations_total',
  help: 'Total de violações de SLA',
  labelNames: ['endpoint', 'threshold'],
  registers: [registry],
});

// ================================
// SYNC METRICS
// ================================

export const syncQueueSize = new Gauge({
  name: 'sync_queue_size',
  help: 'Tamanho da fila de sincronização',
  labelNames: ['pdv_id', 'type'],
  registers: [registry],
});

export const syncDuration = new Histogram({
  name: 'sync_duration_seconds',
  help: 'Duração da sincronização em segundos',
  labelNames: ['direction', 'status'],
  buckets: [0.5, 1, 2, 5, 10, 30, 60],
  registers: [registry],
});

export const syncConflicts = new Counter({
  name: 'sync_conflicts_total',
  help: 'Total de conflitos de sincronização',
  labelNames: ['type', 'resolution'],
  registers: [registry],
});

// ================================
// DATABASE METRICS
// ================================

export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duração das queries em segundos',
  labelNames: ['query', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [registry],
});

export const dbPoolConnections = new Gauge({
  name: 'db_pool_connections',
  help: 'Conexões no pool do banco',
  labelNames: ['state'],
  registers: [registry],
});

// ================================
// CACHE METRICS
// ================================

export const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total de cache hits',
  labelNames: ['cache', 'key_pattern'],
  registers: [registry],
});

export const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total de cache misses',
  labelNames: ['cache', 'key_pattern'],
  registers: [registry],
});

// ================================
// BUSINESS METRICS
// ================================

export const transactionsTotal = new Counter({
  name: 'transactions_total',
  help: 'Total de transações',
  labelNames: ['school_id', 'decision', 'category'],
  registers: [registry],
});

export const transactionValue = new Histogram({
  name: 'transaction_value_cents',
  help: 'Valor das transações em centavos',
  labelNames: ['school_id', 'category'],
  buckets: [100, 500, 1000, 2000, 5000, 10000],
  registers: [registry],
});

export const activeStudents = new Gauge({
  name: 'active_students',
  help: 'Número de alunos ativos',
  labelNames: ['school_id'],
  registers: [registry],
});
```

### Middleware de Métricas

```typescript
// src/middleware/metrics.middleware.ts

import { Request, Response, NextFunction } from 'express';
import {
  httpRequestsTotal,
  httpRequestDuration,
  slaViolations,
} from '../monitoring/metrics';

export function metricsMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
      const duration = Number(process.hrtime.bigint() - start) / 1e9;
      const labels = {
        method: req.method,
        path: req.route?.path || req.path,
        status: res.statusCode.toString(),
      };

      httpRequestsTotal.inc(labels);
      httpRequestDuration.observe(labels, duration);

      // Verificar SLA para endpoints críticos
      if (req.path.includes('/pdv/evaluate') && duration > 0.5) {
        slaViolations.inc({
          endpoint: 'pdv_evaluate',
          threshold: '500ms',
        });
      }
    });

    next();
  };
}
```

### Endpoint de Métricas

```typescript
// src/routes/metrics.routes.ts

import { Router } from 'express';
import { registry } from '../monitoring/metrics';

const router = Router();

router.get('/metrics', async (req, res) => {
  res.set('Content-Type', registry.contentType);
  res.send(await registry.metrics());
});

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export { router as metricsRoutes };
```

---

## Prometheus

### Configuração

```yaml
# prometheus/prometheus.yml

global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

rule_files:
  - /etc/prometheus/rules/*.yml

scrape_configs:
  # API Pods
  - job_name: 'supercantina-api'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        regex: supercantina
        action: keep
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        regex: 'true'
        action: keep
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_port]
        target_label: __metrics_path__
        regex: (.+)
        replacement: /metrics

  # PostgreSQL
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  # Redis
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  # Node Exporter
  - job_name: 'node'
    kubernetes_sd_configs:
      - role: node
    relabel_configs:
      - source_labels: [__address__]
        regex: '(.+):10250'
        replacement: '${1}:9100'
        target_label: __address__
```

---

## Grafana

### Dashboard Principal

```json
{
  "title": "Super Cantina - Overview",
  "uid": "supercantina-overview",
  "panels": [
    {
      "title": "Decision Engine P95 Latency",
      "type": "gauge",
      "targets": [
        {
          "expr": "histogram_quantile(0.95, rate(decision_engine_latency_seconds_bucket[5m]))",
          "legendFormat": "P95"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "thresholds": {
            "steps": [
              { "value": 0, "color": "green" },
              { "value": 0.3, "color": "yellow" },
              { "value": 0.5, "color": "red" }
            ]
          },
          "unit": "s",
          "max": 1
        }
      }
    },
    {
      "title": "Requests per Second",
      "type": "graph",
      "targets": [
        {
          "expr": "sum(rate(http_requests_total[5m])) by (path)",
          "legendFormat": "{{path}}"
        }
      ]
    },
    {
      "title": "Error Rate",
      "type": "stat",
      "targets": [
        {
          "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100",
          "legendFormat": "Error %"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "thresholds": {
            "steps": [
              { "value": 0, "color": "green" },
              { "value": 1, "color": "yellow" },
              { "value": 5, "color": "red" }
            ]
          },
          "unit": "percent"
        }
      }
    },
    {
      "title": "Decision Distribution",
      "type": "piechart",
      "targets": [
        {
          "expr": "sum(increase(decision_engine_total[1h])) by (decision)",
          "legendFormat": "{{decision}}"
        }
      ]
    },
    {
      "title": "Sync Queue Size",
      "type": "graph",
      "targets": [
        {
          "expr": "sum(sync_queue_size) by (pdv_id)",
          "legendFormat": "{{pdv_id}}"
        }
      ]
    },
    {
      "title": "Cache Hit Rate",
      "type": "stat",
      "targets": [
        {
          "expr": "sum(rate(cache_hits_total[5m])) / (sum(rate(cache_hits_total[5m])) + sum(rate(cache_misses_total[5m]))) * 100",
          "legendFormat": "Hit Rate"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "thresholds": {
            "steps": [
              { "value": 0, "color": "red" },
              { "value": 80, "color": "yellow" },
              { "value": 95, "color": "green" }
            ]
          },
          "unit": "percent"
        }
      }
    }
  ]
}
```

---

## Logging

### Configuração Winston

```typescript
// src/logging/logger.ts

import winston from 'winston';
import LokiTransport from 'winston-loki';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'supercantina',
    environment: process.env.NODE_ENV,
  },
  transports: [
    // Console (development)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),

    // Loki (production)
    new LokiTransport({
      host: process.env.LOKI_HOST || 'http://loki:3100',
      labels: {
        app: 'supercantina',
        environment: process.env.NODE_ENV || 'development',
      },
      json: true,
      replaceTimestamp: true,
      onConnectionError: (err) => console.error('Loki connection error:', err),
    }),
  ],
});

export { logger };
```

### Structured Logging

```typescript
// src/middleware/logging.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { logger } from '../logging/logger';
import { v4 as uuidv4 } from 'uuid';

export function loggingMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestId = uuidv4();
    const startTime = Date.now();

    // Adicionar request ID
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);

    // Log de entrada
    logger.info('Request received', {
      requestId,
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Log de saída
    res.on('finish', () => {
      const duration = Date.now() - startTime;

      const logData = {
        requestId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration,
        userId: (req as any).user?.id,
      };

      if (res.statusCode >= 500) {
        logger.error('Request failed', logData);
      } else if (res.statusCode >= 400) {
        logger.warn('Request error', logData);
      } else {
        logger.info('Request completed', logData);
      }
    });

    next();
  };
}
```

---

## Tracing (OpenTelemetry)

```typescript
// src/tracing/tracer.ts

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'supercantina',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV,
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://jaeger:4318/v1/traces',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
```

---

## Dashboards por Área

### Decision Engine Dashboard

| Métrica | Query | Alerta |
|---------|-------|--------|
| P95 Latency | `histogram_quantile(0.95, ...)` | > 500ms |
| Error Rate | `rate(errors) / rate(total)` | > 1% |
| Throughput | `rate(decisions_total[5m])` | < 10/s |

### Sync Dashboard

| Métrica | Query | Alerta |
|---------|-------|--------|
| Queue Depth | `sync_queue_size` | > 100 |
| Offline PDVs | `count(time() - last_sync > 3600)` | > 0 |
| Conflict Rate | `rate(conflicts) / rate(syncs)` | > 5% |

### Business Dashboard

| Métrica | Query | Período |
|---------|-------|---------|
| Transações/hora | `sum(increase(transactions_total[1h]))` | Última hora |
| GMV | `sum(transaction_value)` | Hoje |
| Alunos ativos | `active_students` | Atual |

---

## Referências

- [Alertas SLA](./alertas-sla.md)
- [Infraestrutura](./infraestrutura.md)
- [Deploy](./deploy.md)
