# Error Handling Patterns (Cross-Project)

## Principio: Erros sao Dados, nao Excecoes

Tratar erros como parte do fluxo normal, nao como casos excepcionais.
Preferir tipos discriminados sobre try/catch sempre que possivel.

## Result Type Pattern (Ok/Err)

### Definicao
```typescript
// src/lib/result.ts
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// Type guard
function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}
```

### Uso em Services
```typescript
// src/lib/services/user.service.ts
interface UserError {
  code: 'NOT_FOUND' | 'DUPLICATE_EMAIL' | 'INVALID_INPUT' | 'DB_ERROR';
  message: string;
  details?: Record<string, unknown>;
}

export async function createUser(
  input: CreateUserInput
): Promise<Result<User, UserError>> {
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return Err({
      code: 'INVALID_INPUT',
      message: 'Validation failed',
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const { data, error } = await supabase
    .from('users')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return Err({ code: 'DUPLICATE_EMAIL', message: 'Email already exists' });
    }
    return Err({ code: 'DB_ERROR', message: error.message });
  }

  return Ok(data);
}
```

### Consumo no Route Handler
```typescript
// src/app/api/users/route.ts
export async function POST(req: Request) {
  const body = await req.json();
  const result = await createUser(body);

  if (!result.ok) {
    const statusMap: Record<UserError['code'], number> = {
      NOT_FOUND: 404,
      DUPLICATE_EMAIL: 409,
      INVALID_INPUT: 422,
      DB_ERROR: 500,
    };
    return NextResponse.json(
      { error: result.error },
      { status: statusMap[result.error.code] }
    );
  }

  return NextResponse.json({ data: result.value }, { status: 201 });
}
```

## Quando Usar Result vs try/catch

| Cenario | Pattern | Motivo |
|---------|---------|--------|
| Validacao de input | Result | Erro esperado, faz parte do fluxo |
| DB query que pode falhar | Result | Erro previsivel, caller decide como tratar |
| Parse de JSON externo | Result | Input nao confiavel |
| Network fetch | try/catch | Erros imprevisiveis, muitos tipos |
| File system ops | try/catch | OS-level, nao previsivel |
| Middleware auth check | throw | Framework espera throw para interromper |
| Constructor / init | throw | Objeto invalido nao deve existir |

## API Error Response (Standard Shape)

### Schema
```typescript
// src/lib/api/error-response.ts
import { z } from 'zod';

const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),           // 'VALIDATION_ERROR', 'NOT_FOUND', etc.
    message: z.string(),        // Human-readable
    details: z.unknown().optional(), // Field errors, context
    requestId: z.string(),      // Para correlacao com logs
  }),
});

type ApiError = z.infer<typeof apiErrorSchema>;

export function createApiError(
  code: string,
  message: string,
  status: number,
  details?: unknown
): NextResponse<ApiError> {
  const requestId = crypto.randomUUID();

  // Log server-side com contexto completo
  logger.error({ code, message, details, requestId, status });

  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
        requestId,
      },
    },
    { status }
  );
}
```

### Uso Padronizado
```typescript
// Em qualquer route handler
if (!session) {
  return createApiError('UNAUTHORIZED', 'Authentication required', 401);
}

if (!hasRole(session, 'admin')) {
  return createApiError('FORBIDDEN', 'Insufficient permissions', 403);
}

const parsed = schema.safeParse(body);
if (!parsed.success) {
  return createApiError('VALIDATION_ERROR', 'Invalid input', 422, parsed.error.flatten());
}
```

## Structured Logging

### Logger Setup
```typescript
// src/lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  service?: string;
  duration?: number;
  error?: { name: string; message: string; stack?: string };
  [key: string]: unknown;
}

class Logger {
  private service: string;

  constructor(service: string) {
    this.service = service;
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: this.service,
      ...meta,
    };

    // JSON em producao, pretty em dev
    if (process.env.NODE_ENV === 'production') {
      console[level === 'error' ? 'error' : 'log'](JSON.stringify(entry));
    } else {
      console[level](message, meta);
    }
  }

  info(message: string, meta?: Record<string, unknown>) { this.log('info', message, meta); }
  warn(message: string, meta?: Record<string, unknown>) { this.log('warn', message, meta); }
  error(message: string, meta?: Record<string, unknown>) { this.log('error', message, meta); }
  debug(message: string, meta?: Record<string, unknown>) { this.log('debug', message, meta); }
}

export function createLogger(service: string): Logger {
  return new Logger(service);
}
```

### Context Propagation (RequestId)
```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();

  const response = NextResponse.next();
  response.headers.set('x-request-id', requestId);

  return response;
}

// Em route handlers: extrair requestId
export async function GET(req: Request) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  const logger = createLogger('users-api');

  logger.info('Fetching users', { requestId });
  // ...
}
```

## React Error Boundaries (App Router)

### Error Boundary Component
```typescript
// src/app/dashboard/error.tsx
'use client';

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report to Sentry or logging service
    reportError(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-xl font-semibold">Algo deu errado</h2>
      <p className="text-muted-foreground">
        Erro: {error.message}
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground">
          Referencia: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
      >
        Tentar novamente
      </button>
    </div>
  );
}
```

### Global Error Boundary
```typescript
// src/app/global-error.tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1>Erro critico</h1>
          <p>{error.message}</p>
          <button onClick={reset}>Recarregar</button>
        </div>
      </body>
    </html>
  );
}
```

### Not Found Page
```typescript
// src/app/not-found.tsx
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Pagina nao encontrada</p>
    </div>
  );
}
```

## Sentry Integration

### Setup
```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

export function initSentry() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event) {
      // Scrub PII
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
  });
}
```

### Captura Manual
```typescript
// Em qualquer lugar
import * as Sentry from '@sentry/nextjs';

try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: { module: 'payment', operation: 'charge' },
    extra: { userId, amount },
  });
  // Re-throw ou handle gracefully
}
```

### Sentry com Result Pattern
```typescript
async function safeOperation<T>(
  fn: () => Promise<T>,
  context: Record<string, unknown>
): Promise<Result<T, Error>> {
  try {
    const value = await fn();
    return Ok(value);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    Sentry.captureException(err, { extra: context });
    return Err(err);
  }
}
```

## NUNCA

- `catch(() => {})` — catch-and-swallow esconde bugs reais
- `console.log(error)` em producao — usar structured logger
- `throw new Error('something went wrong')` — mensagem generica, inutil para debug
- `catch(e) { return null }` — caller nao sabe que falhou
- Expor stack traces para o cliente — seguranca (usar digest/requestId)
- Ignorar error boundaries em rotas criticas (checkout, auth, dashboard)

## SEMPRE

- Incluir `requestId` em logs e responses de erro
- Tipar erros com discriminated unions quando possivel
- Logar contexto suficiente para reproduzir (sem PII)
- Retry apenas para erros transientes (network, 429, 503)
- Fail fast para erros de configuracao (missing env vars, bad credentials)

## Checklist

- [ ] Result type definido e usado em services
- [ ] API error response padronizado (code, message, requestId)
- [ ] Structured logger configurado (JSON em prod)
- [ ] Error boundaries em `/app/**/error.tsx`
- [ ] `global-error.tsx` e `not-found.tsx` existem
- [ ] Sentry configurado com PII scrubbing
- [ ] Nenhum `console.log` em producao
- [ ] Nenhum catch-and-swallow no codebase

---

## Retry com Backoff Exponencial

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { maxRetries?: number; baseMs?: number; maxMs?: number } = {}
): Promise<T> {
  const { maxRetries = 3, baseMs = 1000, maxMs = 30_000 } = opts;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      if (isClientError(error)) throw error;  // 4xx: nao retry (exceto 429)

      const delay = Math.min(
        baseMs * Math.pow(2, attempt) + Math.random() * 1000,  // jitter
        maxMs
      );
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('unreachable');
}
```

- **Jitter**: SEMPRE adicionar randomizacao para evitar thundering herd
- **Quando NAO retry**: erros 4xx (exceto 429), validacao, autenticacao

## Idempotencia em Consumers

Todo consumer de eventos/webhooks DEVE ser idempotente:

```typescript
async function handleEvent(event: IntegrationEvent): Promise<void> {
  // Dedup por event ID
  const already = await processedEvents.exists(event.id);
  if (already) return;  // ja processado

  await processEvent(event);
  await processedEvents.markDone(event.id, { ttl: '7d' });
}
```

## Dead Letter Queue (DLQ)

Mensagens que falham apos N retries → DLQ para analise.

- Monitorar tamanho da DLQ (**alerta se > 0**)
- Incluir contexto do erro na DLQ para debugging
- Processar DLQ: retry manual, corrigir e reprocessar, ou descartar com justificativa
