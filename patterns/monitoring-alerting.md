# Monitoring & Alerting Patterns (Cross-Project)

## Health Endpoint

### Pattern: /api/health
```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {};

  // Database check
  try {
    const supabase = createClient();
    await supabase.from('health_check').select('id').limit(1);
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  // Redis check (se aplicavel)
  try {
    await redis.ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'error';
  }

  const healthy = Object.values(checks).every(v => v === 'ok');

  return NextResponse.json(
    { status: healthy ? 'healthy' : 'degraded', checks, timestamp: new Date().toISOString() },
    { status: healthy ? 200 : 503 }
  );
}
```

### Niveis de health
| Status | HTTP | Significado |
|--------|------|-------------|
| healthy | 200 | Todos os checks OK |
| degraded | 503 | Funcionalidade parcial |
| down | 503 | Sistema indisponivel |

## Structured Logging

### JSON Format
```typescript
interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  correlationId: string;    // UUID por request
  service: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;         // apenas em dev
  };
}
```

### Pattern de uso
```typescript
function createLogger(service: string) {
  return {
    info: (message: string, context?: Record<string, unknown>) =>
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        message,
        service,
        correlationId: getCorrelationId(),
        context,
      })),
    error: (message: string, error: Error, context?: Record<string, unknown>) =>
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        message,
        service,
        correlationId: getCorrelationId(),
        context,
        error: { name: error.name, message: error.message },
      })),
  };
}

const logger = createLogger('auth-service');
logger.info('User login', { userId: user.id });
logger.error('Login failed', err, { email: '[MASKED]' });
```

### Correlation ID (tracing entre services)
```typescript
import { headers } from 'next/headers';
import { randomUUID } from 'crypto';

function getCorrelationId(): string {
  const headerStore = headers();
  return headerStore.get('x-correlation-id') ?? randomUUID();
}
```

## DORA Metrics

| Metrica | Definicao | Target | Como medir |
|---------|-----------|--------|------------|
| Deployment Frequency | Deploys por semana | >= 3/semana | GitHub Actions workflow runs |
| Lead Time for Changes | Commit → producao | < 24h | PR created_at → deploy timestamp |
| Change Failure Rate | % deploys que causam incidente | < 15% | Rollbacks / total deploys |
| Mean Time to Recovery | Tempo para resolver incidente | < 1h | Incidente detectado → resolvido |

### Automacao (dora-metrics.yml)
```yaml
# Coleta automatica via GitHub API
- gh api repos/{owner}/{repo}/actions/runs --jq '.workflow_runs | length'
- Tempo medio entre PR merge e deploy success
```

## Sentry Integration

### Setup basico
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,         // 10% das transacoes
  replaysSessionSampleRate: 0.01, // 1% das sessoes
  replaysOnErrorSampleRate: 1.0,  // 100% quando ha erro
});
```

### Error Grouping
```typescript
Sentry.withScope((scope) => {
  scope.setTag('module', 'auth');
  scope.setContext('user_action', { action: 'login', method: 'email' });
  Sentry.captureException(error);
});
```

### Breadcrumbs
```typescript
Sentry.addBreadcrumb({
  category: 'auth',
  message: 'User attempted login',
  level: 'info',
  data: { method: 'email' },
});
```

## Uptime Monitoring

### Synthetic Checks
```typescript
// Executar a cada 5min via cron ou servico externo
const endpoints = [
  { url: '/api/health', expectedStatus: 200 },
  { url: '/', expectedStatus: 200 },
  { url: '/login', expectedStatus: 200 },
];

for (const { url, expectedStatus } of endpoints) {
  const start = Date.now();
  const res = await fetch(`${baseUrl}${url}`);
  const duration = Date.now() - start;

  if (res.status !== expectedStatus || duration > 5000) {
    await sendAlert({ url, status: res.status, duration });
  }
}
```

## Alerting Thresholds

| Metrica | Warning | Critical | Acao |
|---------|---------|----------|------|
| Error rate (5xx) | > 1% | > 5% | Investigar imediato |
| Response time (p95) | > 2s | > 5s | Verificar queries/cache |
| Availability | < 99.5% | < 99% | Rollback se deploy recente |
| Memory usage | > 80% | > 95% | Scale ou investigar leak |
| Disk usage | > 80% | > 90% | Limpar logs/cache |

## NUNCA
- Logar PII, tokens, secrets (ver security.md)
- Ignorar alertas criticos (mesmo se "provavelmente falso positivo")
- Desabilitar monitoring em producao
- Usar sample rate 100% em producao (custo + performance)
- Health check com side effects (deve ser read-only)
