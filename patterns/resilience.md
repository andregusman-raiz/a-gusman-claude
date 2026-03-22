# Resilience Patterns

## Circuit Breaker

### 3 Estados
```
     sucesso         falha >= threshold
┌──────────┐      ┌──────────┐
│  CLOSED  │─────>│   OPEN   │
│ (normal) │      │ (falha)  │
└──────────┘      └──────────┘
     ^                │
     │ sucesso         │ timeout expira
     │                v
     │           ┌──────────────┐
     └───────────│  HALF-OPEN   │
       sucesso   │  (testando)  │
                 └──────────────┘
                      │ falha
                      └──> OPEN
```

### Implementacao
```typescript
class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failures = 0;
  private lastFailure: Date | null = null;
  private successesInHalfOpen = 0;

  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 30_000,   // ms para tentar novamente
    private readonly halfOpenMax: number = 3      // successos para fechar
  ) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure!.getTime() > this.timeout) {
        this.state = 'half-open';
        this.successesInHalfOpen = 0;
      } else {
        throw new CircuitOpenError('Circuit is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === 'half-open') {
      this.successesInHalfOpen++;
      if (this.successesInHalfOpen >= this.halfOpenMax) {
        this.state = 'closed';
        this.failures = 0;
      }
    } else {
      this.failures = 0;
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailure = new Date();
    if (this.failures >= this.threshold || this.state === 'half-open') {
      this.state = 'open';
    }
  }
}
```

## Retry com Backoff Exponencial

### Formula
```
delay = min(base * 2^attempt + random(0, jitter), maxDelay)
```

### Implementacao
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

      const delay = Math.min(baseMs * Math.pow(2, attempt) + Math.random() * 1000, maxMs);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('unreachable');
}

function isClientError(error: unknown): boolean {
  return error instanceof HttpError && error.status >= 400 && error.status < 500 && error.status !== 429;
}
```

### Quando NAO retry
- Erros 4xx (exceto 429 Too Many Requests)
- Erros de validacao
- Erros de autenticacao/autorizacao
- Operacoes nao-idempotentes sem idempotency key

## Bulkhead (Isolamento)
Isolar pools de recursos por dependencia para evitar que falha em uma degrade todas.

```typescript
class Bulkhead {
  private running = 0;

  constructor(private readonly maxConcurrent: number) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.running >= this.maxConcurrent) {
      throw new BulkheadFullError('Max concurrent requests reached');
    }
    this.running++;
    try {
      return await fn();
    } finally {
      this.running--;
    }
  }
}

// Uso: pools separados por dependencia
const paymentBulkhead = new Bulkhead(10);
const inventoryBulkhead = new Bulkhead(20);
```

## Timeout em Camadas
```
Client (30s) > Gateway (25s) > Service (20s) > DB Query (10s)
```
- Timeout de cada camada DEVE ser menor que o chamador
- Sempre configurar: connection timeout, read timeout, total timeout
- Liberar recursos no timeout (fechar conexao, cancelar query)

## Fallback Strategies

| Estrategia | Quando | Exemplo |
|-----------|--------|---------|
| Cache Stale | Dados tolerantes a atraso | Servir catalogo do cache enquanto API esta fora |
| Valor Padrao | Funcionalidade nao-critica | Mostrar 0 reviews se servico de reviews caiu |
| Degradacao Graceful | Feature opcional | Desabilitar recomendacoes, manter checkout |
| Fila para retry | Operacao eventual | Enfileirar email para enviar quando servico voltar |

## Health Checks

| Tipo | Pergunta | Frequencia | Acao se falhar |
|------|----------|-----------|----------------|
| Liveness | Processo esta vivo? | 10s | Reiniciar container |
| Readiness | Pronto para receber trafego? | 5s | Remover do load balancer |
| Startup | Inicializacao completa? | 1s | Aguardar (nao reiniciar) |

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    external_api: await checkExternalAPI()
  };
  const healthy = Object.values(checks).every(c => c.status === 'up');
  return NextResponse.json(
    { status: healthy ? 'healthy' : 'degraded', checks },
    { status: healthy ? 200 : 503 }
  );
}
```

## Decision Matrix

| Cenario | Pattern | Prioridade |
|---------|---------|-----------|
| API externa instavel | Circuit Breaker + Retry | P0 |
| Servico com latencia variavel | Timeout + Fallback | P0 |
| Multiplas dependencias | Bulkhead | P1 |
| Servico critico (pagamento) | Circuit Breaker + Bulkhead + Fallback | P0 |
| Servico opcional (analytics) | Timeout curto + Fallback silencioso | P2 |

## Anti-Patterns
- **Retry sem backoff**: DDoS no proprio servico. SEMPRE usar backoff + jitter.
- **Circuit Breaker sem fallback**: usuario ve erro generico. Ter sempre um fallback.
- **Timeout sem cleanup**: conexoes orfas acumulam. Liberar recursos.
- **Retry em operacao nao-idempotente**: duplica side effects. Usar idempotency key.
- **Health check que nao verifica dependencias**: diz "healthy" mas DB esta fora.
