# Decision Engine - Motor de Decisão

## 1. Visão Geral

O Decision Engine é o componente **mais crítico** do Super Cantina, responsável por avaliar cada tentativa de compra e retornar uma decisão em tempo real.

### Requisitos de Performance

| Métrica | Target | Crítico | Ação |
|---------|--------|---------|------|
| Latência P50 | < 100ms | - | Normal |
| Latência P95 | < 500ms | > 500ms | Alert |
| Latência P99 | < 750ms | > 1000ms | Pager |
| Disponibilidade | 99.9% | < 99% | Incident |

### Decisões Possíveis

| Decisão | Descrição | Notifica Responsável? |
|---------|-----------|----------------------|
| `ALLOW` | Compra permitida | ❌ |
| `BLOCK_SILENT` | Bloqueio silencioso | ❌ |
| `BLOCK_NOTIFY_PARENT` | Bloqueio com notificação | ✅ |

---

## 2. Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DECISION ENGINE                                   │
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   HTTP Handler  │───►│ Decision        │───►│  Rule Chain     │         │
│  │   /pdv/evaluate │    │ Service         │    │                 │         │
│  └─────────────────┘    └────────┬────────┘    │  1. Dietary     │         │
│                                  │             │  2. Daily Limit │         │
│                                  │             │  3. Category    │         │
│                                  ▼             │  4. Time        │         │
│                         ┌─────────────────┐    └────────┬────────┘         │
│                         │  Rules Cache    │             │                   │
│                         │  (Redis)        │◄────────────┘                   │
│                         └────────┬────────┘                                 │
│                                  │                                          │
│                                  ▼                                          │
│                         ┌─────────────────┐    ┌─────────────────┐         │
│                         │  Daily Agg      │    │  Event Bus      │         │
│                         │  Cache          │    │                 │         │
│                         └─────────────────┘    └─────────────────┘         │
│                                                         │                   │
└─────────────────────────────────────────────────────────┼───────────────────┘
                                                          │
                                                          ▼
                                               ┌─────────────────┐
                                               │ Notification    │
                                               │ Service         │
                                               └─────────────────┘
```

---

## 3. API

### Endpoint: POST /api/v1/pdv/evaluate

**Descrição**: Avalia uma tentativa de compra e retorna decisão.

**Headers**:
```http
Authorization: Bearer <pdv_token>
Content-Type: application/json
X-Request-ID: <uuid>
```

**Request Body**:
```typescript
interface EvaluateRequest {
  studentId: string;       // UUID do aluno
  itemCategory: string;    // Categoria do item (ex: "lanche", "bebida")
  amount: number;          // Valor em centavos
  timestamp: string;       // ISO 8601 (ex: "2024-01-15T10:30:00Z")
  pdvId: string;          // Identificador do PDV
  operatorId?: string;    // UUID do operador (opcional)
  itemDescription?: string; // Descrição do item (para verificação alimentar)
}
```

**Response Body (200 OK)**:
```typescript
interface EvaluateResponse {
  decision: 'ALLOW' | 'BLOCK_SILENT' | 'BLOCK_NOTIFY_PARENT';
  transactionId: string;   // UUID da transação registrada
  reason?: string;         // Motivo do bloqueio (apenas para BLOCK)
  displayMessage?: string; // Mensagem para exibir no PDV
  metadata: {
    dailySpent: number;      // Total gasto hoje (centavos)
    dailyLimit: number;      // Limite diário (centavos)
    remainingToday: number;  // Restante disponível (centavos)
  };
}
```

**Exemplos de Resposta**:

```json
// ALLOW
{
  "decision": "ALLOW",
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "metadata": {
    "dailySpent": 3500,
    "dailyLimit": 5000,
    "remainingToday": 1500
  }
}

// BLOCK_SILENT (limite)
{
  "decision": "BLOCK_SILENT",
  "transactionId": "550e8400-e29b-41d4-a716-446655440001",
  "reason": "DAILY_LIMIT",
  "displayMessage": "Limite diário atingido",
  "metadata": {
    "dailySpent": 5000,
    "dailyLimit": 5000,
    "remainingToday": 0
  }
}

// BLOCK_NOTIFY_PARENT (restrição alimentar)
{
  "decision": "BLOCK_NOTIFY_PARENT",
  "transactionId": "550e8400-e29b-41d4-a716-446655440002",
  "reason": "DIETARY_RESTRICTION",
  "displayMessage": "Item contém ingrediente restrito",
  "metadata": {
    "dailySpent": 2000,
    "dailyLimit": 5000,
    "remainingToday": 3000
  }
}
```

**Códigos de Erro**:

| Código | Descrição |
|--------|-----------|
| 400 | Request inválido (campos obrigatórios) |
| 401 | Token inválido ou expirado |
| 404 | Aluno não encontrado |
| 500 | Erro interno |
| 503 | Serviço indisponível (fallback) |

---

## 4. Implementação

### 4.1 Decision Service

```typescript
// src/application/services/DecisionService.ts

import { Injectable } from '@nestjs/common';
import { RulesCache } from '../../infrastructure/cache/RulesCache';
import { DailyAggregateCache } from '../../infrastructure/cache/DailyAggregateCache';
import { TransactionRepository } from '../../domain/repositories/TransactionRepository';
import { EventBus } from '../../infrastructure/events/EventBus';
import { MetricsService } from '../../infrastructure/monitoring/MetricsService';

interface PurchaseContext {
  studentId: string;
  itemCategory: string;
  amount: number;
  timestamp: Date;
  pdvId: string;
  operatorId?: string;
  itemDescription?: string;
}

interface Decision {
  decision: 'ALLOW' | 'BLOCK_SILENT' | 'BLOCK_NOTIFY_PARENT';
  reason?: string;
  displayMessage?: string;
}

@Injectable()
export class DecisionService {
  constructor(
    private rulesCache: RulesCache,
    private dailyAggCache: DailyAggregateCache,
    private transactionRepo: TransactionRepository,
    private eventBus: EventBus,
    private metrics: MetricsService
  ) {}

  async evaluate(context: PurchaseContext): Promise<EvaluateResponse> {
    const startTime = performance.now();
    let decision: Decision;

    try {
      // 1. Buscar regras do aluno (cache)
      const rules = await this.getRulesWithCache(context.studentId);

      if (!rules) {
        // Aluno sem regras = usar defaults
        decision = await this.evaluateWithDefaults(context);
      } else {
        // 2. Executar cadeia de regras
        decision = await this.executeRuleChain(context, rules);
      }

      // 3. Registrar transação
      const transaction = await this.transactionRepo.create({
        studentId: context.studentId,
        pdvId: context.pdvId,
        operatorId: context.operatorId,
        amount: context.amount,
        categoryId: await this.resolveCategoryId(context.itemCategory),
        decision: decision.decision,
        blockReason: decision.reason,
        createdAt: context.timestamp
      });

      // 4. Publicar evento
      await this.publishEvent(decision, context, transaction.id);

      // 5. Buscar metadata atualizado
      const dailySpent = await this.getDailySpent(context.studentId);
      const dailyLimit = rules?.dailyLimit || await this.getDefaultLimit(context.studentId);

      // 6. Registrar métricas
      const latency = performance.now() - startTime;
      this.metrics.recordDecision(decision.decision, decision.reason, latency);

      return {
        decision: decision.decision,
        transactionId: transaction.id,
        reason: decision.reason,
        displayMessage: decision.displayMessage,
        metadata: {
          dailySpent,
          dailyLimit,
          remainingToday: Math.max(0, dailyLimit - dailySpent)
        }
      };

    } catch (error) {
      // Fallback em caso de erro
      const latency = performance.now() - startTime;
      this.metrics.recordError('decision', error);

      return this.fallbackDecision(context, error);
    }
  }

  private async executeRuleChain(
    context: PurchaseContext,
    rules: StudentRules
  ): Promise<Decision> {
    // Ordem de prioridade (do mais restritivo para o menos)
    const ruleChecks = [
      () => this.checkDietaryRestrictions(context, rules),
      () => this.checkDailyLimit(context, rules),
      () => this.checkCategoryBlock(context, rules),
      () => this.checkTimeRestrictions(context, rules)
    ];

    for (const check of ruleChecks) {
      const result = await check();
      if (result.decision !== 'ALLOW') {
        return result;
      }
    }

    return { decision: 'ALLOW' };
  }

  // Verificações individuais
  private async checkDietaryRestrictions(
    context: PurchaseContext,
    rules: StudentRules
  ): Promise<Decision> {
    if (!rules.dietaryRestrictions?.length) {
      return { decision: 'ALLOW' };
    }

    // Verificar palavras-chave no item
    const itemText = (context.itemDescription || context.itemCategory).toLowerCase();

    for (const restriction of rules.dietaryRestrictions) {
      for (const keyword of restriction.blockedKeywords) {
        if (itemText.includes(keyword.toLowerCase())) {
          return {
            decision: 'BLOCK_NOTIFY_PARENT',  // SEMPRE notifica
            reason: 'DIETARY_RESTRICTION',
            displayMessage: `Item contém ${restriction.type}`
          };
        }
      }
    }

    return { decision: 'ALLOW' };
  }

  private async checkDailyLimit(
    context: PurchaseContext,
    rules: StudentRules
  ): Promise<Decision> {
    const dailySpent = await this.getDailySpent(context.studentId);

    if (dailySpent + context.amount > rules.dailyLimit) {
      return {
        decision: 'BLOCK_SILENT',  // NÃO notifica
        reason: 'DAILY_LIMIT',
        displayMessage: 'Limite diário atingido'
      };
    }

    return { decision: 'ALLOW' };
  }

  private async checkCategoryBlock(
    context: PurchaseContext,
    rules: StudentRules
  ): Promise<Decision> {
    const categoryId = await this.resolveCategoryId(context.itemCategory);

    // Verificar lista de bloqueio
    if (rules.blockedCategories?.includes(categoryId)) {
      return {
        decision: 'BLOCK_SILENT',  // NÃO notifica
        reason: 'CATEGORY_BLOCKED',
        displayMessage: 'Categoria não permitida'
      };
    }

    // Verificar lista de permitidos (se existir)
    if (rules.allowedCategories?.length > 0) {
      if (!rules.allowedCategories.includes(categoryId)) {
        return {
          decision: 'BLOCK_SILENT',
          reason: 'CATEGORY_NOT_ALLOWED',
          displayMessage: 'Categoria não está na lista permitida'
        };
      }
    }

    return { decision: 'ALLOW' };
  }

  private async checkTimeRestrictions(
    context: PurchaseContext,
    rules: StudentRules
  ): Promise<Decision> {
    if (!rules.timeRestrictions?.length) {
      return { decision: 'ALLOW' };
    }

    const timestamp = context.timestamp;
    const dayOfWeek = timestamp.getDay();  // 0=Dom, 1=Seg, etc.
    const timeString = timestamp.toTimeString().substring(0, 5);  // HH:MM

    for (const restriction of rules.timeRestrictions) {
      // Verificar dia da semana
      if (!restriction.dayOfWeek.includes(dayOfWeek)) {
        continue;
      }

      // Verificar horário
      if (timeString >= restriction.start && timeString <= restriction.end) {
        return { decision: 'ALLOW' };  // Dentro do horário permitido
      }
    }

    // Nenhum horário permitido corresponde
    return {
      decision: 'BLOCK_SILENT',
      reason: 'TIME_RESTRICTION',
      displayMessage: 'Fora do horário permitido'
    };
  }

  // Fallback para erros
  private fallbackDecision(
    context: PurchaseContext,
    error: Error
  ): EvaluateResponse {
    const SAFE_AMOUNT = 2000;  // R$ 20,00

    // Permitir valores pequenos em modo degradado
    if (context.amount <= SAFE_AMOUNT) {
      return {
        decision: 'ALLOW',
        transactionId: 'fallback-' + Date.now(),
        metadata: {
          dailySpent: 0,
          dailyLimit: SAFE_AMOUNT,
          remainingToday: SAFE_AMOUNT - context.amount
        }
      };
    }

    // Bloquear valores altos silenciosamente
    return {
      decision: 'BLOCK_SILENT',
      transactionId: 'fallback-' + Date.now(),
      reason: 'FALLBACK_EXCEEDED',
      displayMessage: 'Sistema temporariamente indisponível',
      metadata: {
        dailySpent: 0,
        dailyLimit: SAFE_AMOUNT,
        remainingToday: 0
      }
    };
  }

  // Helpers
  private async getRulesWithCache(studentId: string): Promise<StudentRules | null> {
    // Tentar cache primeiro (TTL: 5 min)
    const cached = await this.rulesCache.get(studentId);
    if (cached) return cached;

    // Buscar do banco
    const rules = await this.rulesRepo.findByStudentId(studentId);
    if (rules) {
      await this.rulesCache.set(studentId, rules, 300);  // 5 min
    }

    return rules;
  }

  private async getDailySpent(studentId: string): Promise<number> {
    // Buscar do cache de agregados
    const cached = await this.dailyAggCache.get(studentId);
    if (cached !== null) return cached;

    // Fallback: buscar do banco
    const agg = await this.dailyAggRepo.findByStudentAndDate(
      studentId,
      new Date()
    );

    const spent = agg?.totalSpent || 0;
    await this.dailyAggCache.set(studentId, spent, 60);  // 1 min

    return spent;
  }
}
```

### 4.2 Rule Chain Pattern

```typescript
// src/domain/rules/RuleChain.ts

interface Rule {
  name: string;
  priority: number;
  evaluate(context: PurchaseContext, rules: StudentRules): Promise<Decision>;
}

class RuleChain {
  private rules: Rule[] = [];

  register(rule: Rule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  async execute(context: PurchaseContext, rules: StudentRules): Promise<Decision> {
    for (const rule of this.rules) {
      const result = await rule.evaluate(context, rules);

      if (result.decision !== 'ALLOW') {
        return result;
      }
    }

    return { decision: 'ALLOW' };
  }
}

// Exemplo de regra
class DietaryRestrictionRule implements Rule {
  name = 'DietaryRestriction';
  priority = 1;  // Primeira a ser avaliada

  async evaluate(context: PurchaseContext, rules: StudentRules): Promise<Decision> {
    // Implementação...
  }
}
```

---

## 5. Caching Strategy

### 5.1 Redis Cache

```typescript
// src/infrastructure/cache/RulesCache.ts

import Redis from 'ioredis';

export class RulesCache {
  private redis: Redis;
  private keyPrefix = 'rules:student:';

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async get(studentId: string): Promise<StudentRules | null> {
    const key = this.keyPrefix + studentId;
    const data = await this.redis.get(key);

    if (!data) return null;

    return JSON.parse(data);
  }

  async set(studentId: string, rules: StudentRules, ttlSeconds: number): Promise<void> {
    const key = this.keyPrefix + studentId;
    await this.redis.setex(key, ttlSeconds, JSON.stringify(rules));
  }

  async invalidate(studentId: string): Promise<void> {
    const key = this.keyPrefix + studentId;
    await this.redis.del(key);
  }

  async invalidateAll(): Promise<void> {
    const keys = await this.redis.keys(this.keyPrefix + '*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

### 5.2 TTL Strategy

| Cache | TTL | Justificativa |
|-------|-----|---------------|
| Regras do aluno | 5 min | Raramente mudam |
| Gasto diário | 1 min | Atualizado a cada compra |
| Identificadores (QR/NFC) | 30 min | Estáticos |

### 5.3 Invalidação

```typescript
// Invalidar cache quando regras mudam
@OnEvent('rules.updated')
async handleRulesUpdated(event: RulesUpdatedEvent): Promise<void> {
  await this.rulesCache.invalidate(event.studentId);
}

// Invalidar agregado após transação
@OnEvent('transaction.created')
async handleTransactionCreated(event: TransactionCreatedEvent): Promise<void> {
  await this.dailyAggCache.invalidate(event.studentId);
}
```

---

## 6. Eventos

### 6.1 Eventos Publicados

```typescript
// src/domain/events/PurchaseEvents.ts

interface PurchaseAllowedEvent {
  type: 'purchase.allowed';
  transactionId: string;
  studentId: string;
  amount: number;
  category: string;
  timestamp: Date;
  pdvId: string;
  dailyTotalAfter: number;
}

interface PurchaseBlockedSilentEvent {
  type: 'purchase.blocked.silent';
  transactionId: string;
  studentId: string;
  amount: number;
  category: string;
  timestamp: Date;
  reason: 'DAILY_LIMIT' | 'CATEGORY_BLOCKED' | 'TIME_RESTRICTION';
}

interface PurchaseBlockedNotifyEvent {
  type: 'purchase.blocked.notify';
  transactionId: string;
  studentId: string;
  studentName: string;
  amount: number;
  category: string;
  timestamp: Date;
  reason: 'DIETARY_RESTRICTION';
  restrictionType: string;
  guardianId: string;
}

interface LimitReachedEvent {
  type: 'limit.reached';
  studentId: string;
  dailyLimit: number;
  currentSpent: number;
  timestamp: Date;
}
```

### 6.2 Publicação de Eventos

```typescript
private async publishEvent(
  decision: Decision,
  context: PurchaseContext,
  transactionId: string
): Promise<void> {
  const baseEvent = {
    transactionId,
    studentId: context.studentId,
    amount: context.amount,
    category: context.itemCategory,
    timestamp: context.timestamp
  };

  switch (decision.decision) {
    case 'ALLOW':
      await this.eventBus.publish({
        type: 'purchase.allowed',
        ...baseEvent,
        pdvId: context.pdvId,
        dailyTotalAfter: await this.getDailySpent(context.studentId)
      });
      break;

    case 'BLOCK_SILENT':
      await this.eventBus.publish({
        type: 'purchase.blocked.silent',
        ...baseEvent,
        reason: decision.reason
      });
      break;

    case 'BLOCK_NOTIFY_PARENT':
      const student = await this.studentRepo.findById(context.studentId);
      const guardian = await this.guardianRepo.findPrimaryByStudentId(context.studentId);

      await this.eventBus.publish({
        type: 'purchase.blocked.notify',
        ...baseEvent,
        studentName: student.name,
        reason: decision.reason,
        restrictionType: decision.displayMessage,
        guardianId: guardian.id
      });
      break;
  }

  // Verificar se limite foi atingido
  const rules = await this.getRulesWithCache(context.studentId);
  const spent = await this.getDailySpent(context.studentId);

  if (spent >= rules?.dailyLimit) {
    await this.eventBus.publish({
      type: 'limit.reached',
      studentId: context.studentId,
      dailyLimit: rules.dailyLimit,
      currentSpent: spent,
      timestamp: context.timestamp
    });
  }
}
```

---

## 7. Monitoramento

### 7.1 Métricas Prometheus

```typescript
// src/infrastructure/monitoring/DecisionMetrics.ts

import { Counter, Histogram, Gauge } from 'prom-client';

// Latência das decisões
const decisionLatency = new Histogram({
  name: 'decision_engine_latency_ms',
  help: 'Latency of purchase decisions in milliseconds',
  labelNames: ['decision', 'school_id'],
  buckets: [10, 25, 50, 100, 200, 300, 400, 500, 750, 1000, 2000]
});

// Contagem de decisões
const decisionCount = new Counter({
  name: 'decision_engine_total',
  help: 'Total number of purchase decisions',
  labelNames: ['decision', 'reason', 'school_id']
});

// Violações de SLA
const slaBreaches = new Counter({
  name: 'decision_engine_sla_breaches_total',
  help: 'Number of decisions exceeding 500ms SLA',
  labelNames: ['school_id']
});

// Erros
const errorCount = new Counter({
  name: 'decision_engine_errors_total',
  help: 'Total number of decision errors',
  labelNames: ['error_type']
});

export class DecisionMetrics {
  recordDecision(
    decision: string,
    reason: string | undefined,
    latencyMs: number,
    schoolId: string
  ): void {
    decisionLatency.labels(decision, schoolId).observe(latencyMs);
    decisionCount.labels(decision, reason || 'none', schoolId).inc();

    if (latencyMs > 500) {
      slaBreaches.labels(schoolId).inc();
    }
  }

  recordError(type: string): void {
    errorCount.labels(type).inc();
  }
}
```

### 7.2 Alertas

```yaml
# alerts/decision-engine.yml

groups:
  - name: decision-engine
    rules:
      - alert: DecisionEngineSLABreach
        expr: |
          histogram_quantile(0.95,
            rate(decision_engine_latency_ms_bucket[5m])
          ) > 500
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Decision Engine P95 > 500ms"
          description: "P95 latency is {{ $value }}ms"

      - alert: DecisionEngineHighErrorRate
        expr: |
          rate(decision_engine_errors_total[5m]) /
          rate(decision_engine_total[5m]) > 0.01
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Decision error rate > 1%"

      - alert: DecisionEngineDown
        expr: up{job="decision-engine"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Decision Engine is down"
```

---

## 8. Testes

### 8.1 Testes Unitários

```typescript
// tests/unit/DecisionService.test.ts

describe('DecisionService', () => {
  describe('evaluate', () => {
    it('should ALLOW when within limits', async () => {
      // Arrange
      mockRulesCache.get.mockResolvedValue({
        dailyLimit: 5000,
        blockedCategories: [],
        dietaryRestrictions: []
      });
      mockDailyAggCache.get.mockResolvedValue(2000);

      // Act
      const result = await service.evaluate({
        studentId: 'student-1',
        itemCategory: 'lanche',
        amount: 1500,
        timestamp: new Date(),
        pdvId: 'pdv-1'
      });

      // Assert
      expect(result.decision).toBe('ALLOW');
      expect(result.metadata.remainingToday).toBe(1500);
    });

    it('should BLOCK_SILENT when daily limit exceeded', async () => {
      // Arrange
      mockRulesCache.get.mockResolvedValue({
        dailyLimit: 5000,
        blockedCategories: [],
        dietaryRestrictions: []
      });
      mockDailyAggCache.get.mockResolvedValue(4500);

      // Act
      const result = await service.evaluate({
        studentId: 'student-1',
        itemCategory: 'lanche',
        amount: 1000,
        timestamp: new Date(),
        pdvId: 'pdv-1'
      });

      // Assert
      expect(result.decision).toBe('BLOCK_SILENT');
      expect(result.reason).toBe('DAILY_LIMIT');
    });

    it('should BLOCK_NOTIFY_PARENT for dietary restriction', async () => {
      // Arrange
      mockRulesCache.get.mockResolvedValue({
        dailyLimit: 5000,
        blockedCategories: [],
        dietaryRestrictions: [{
          type: 'alergia_amendoim',
          blockedKeywords: ['amendoim', 'peanut']
        }]
      });

      // Act
      const result = await service.evaluate({
        studentId: 'student-1',
        itemCategory: 'doce',
        itemDescription: 'Paçoca de amendoim',
        amount: 500,
        timestamp: new Date(),
        pdvId: 'pdv-1'
      });

      // Assert
      expect(result.decision).toBe('BLOCK_NOTIFY_PARENT');
      expect(result.reason).toBe('DIETARY_RESTRICTION');
    });
  });
});
```

### 8.2 Testes de Performance

```typescript
// tests/performance/DecisionService.perf.ts

describe('DecisionService Performance', () => {
  it('should respond within 500ms for P95', async () => {
    const latencies: number[] = [];

    // Executar 1000 decisões
    for (let i = 0; i < 1000; i++) {
      const start = performance.now();

      await service.evaluate({
        studentId: `student-${i % 100}`,
        itemCategory: 'lanche',
        amount: 1500,
        timestamp: new Date(),
        pdvId: 'pdv-1'
      });

      latencies.push(performance.now() - start);
    }

    // Calcular P95
    latencies.sort((a, b) => a - b);
    const p95 = latencies[Math.floor(latencies.length * 0.95)];

    expect(p95).toBeLessThan(500);
  });
});
```

---

## Próximos Documentos

- [PDV API](./pdv-api.md)
- [Guardian API](./guardian-api.md)
- [Sync API](./sync-api.md)
