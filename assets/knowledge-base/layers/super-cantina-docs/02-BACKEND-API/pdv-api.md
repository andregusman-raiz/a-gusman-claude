# PDV API - Ponto de Venda

## Visão Geral

A PDV API fornece endpoints para o sistema de Ponto de Venda da cantina. É a API mais crítica em termos de performance, com **SLA < 500ms** para decisões de compra.

---

## Endpoints

### Avaliar Compra (Crítico)

```http
POST /api/v1/pdv/evaluate
Authorization: ApiKey <pdv_api_key>
X-PDV-Device-Id: <device_id>
Content-Type: application/json
```

#### Request

```typescript
interface EvaluateRequest {
  studentId: string;       // UUID do aluno
  itemCategory: string;    // Categoria do item (lanche, bebida, doce, etc.)
  amount: number;          // Valor em centavos
  timestamp: string;       // ISO 8601
  pdvId: string;           // ID do dispositivo PDV
  items?: ItemDetail[];    // Opcional: detalhes dos itens
}

interface ItemDetail {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  category: string;
  allergens?: string[];    // Alérgenos do item
}
```

#### Response

```typescript
interface EvaluateResponse {
  decision: 'ALLOW' | 'BLOCK_SILENT' | 'BLOCK_NOTIFY_PARENT';
  transactionId: string;   // UUID para rastreamento

  // Metadata para display no PDV
  metadata: {
    studentName: string;
    dailySpent: number;
    dailyLimit: number;
    remainingToday: number;
  };

  // Motivo do bloqueio (se houver)
  blockReason?: {
    code: string;
    message: string;
    displayMessage: string;  // Mensagem para operador
  };

  // Tempo de processamento
  processingTime: number;  // ms
}
```

#### Exemplo - Compra Permitida

```json
// Request
{
  "studentId": "550e8400-e29b-41d4-a716-446655440000",
  "itemCategory": "lanche",
  "amount": 1500,
  "timestamp": "2024-01-15T10:30:00Z",
  "pdvId": "pdv-001"
}

// Response
{
  "decision": "ALLOW",
  "transactionId": "txn-789xyz",
  "metadata": {
    "studentName": "Maria Silva",
    "dailySpent": 3500,
    "dailyLimit": 5000,
    "remainingToday": 1500
  },
  "processingTime": 45
}
```

#### Exemplo - Bloqueio por Restrição Alimentar

```json
// Response
{
  "decision": "BLOCK_NOTIFY_PARENT",
  "transactionId": "txn-blocked-123",
  "metadata": {
    "studentName": "Maria Silva",
    "dailySpent": 2000,
    "dailyLimit": 5000,
    "remainingToday": 3000
  },
  "blockReason": {
    "code": "DIETARY_RESTRICTION",
    "message": "Item contém lactose - aluno com intolerância",
    "displayMessage": "Compra bloqueada: restrição alimentar"
  },
  "processingTime": 52
}
```

---

### Confirmar Transação

Confirma que a transação foi efetivada no caixa.

```http
POST /api/v1/pdv/confirm/:transactionId
Authorization: ApiKey <pdv_api_key>
X-PDV-Device-Id: <device_id>
Content-Type: application/json

{
  "paymentMethod": "CANTINA_CREDIT",
  "finalAmount": 1500,
  "confirmedAt": "2024-01-15T10:30:15Z"
}
```

#### Response

```json
{
  "success": true,
  "transactionId": "txn-789xyz",
  "receipt": {
    "number": "2024011500123",
    "studentName": "Maria Silva",
    "amount": 1500,
    "timestamp": "2024-01-15T10:30:15Z"
  }
}
```

---

### Cancelar Transação

Cancela uma transação avaliada mas não efetivada.

```http
POST /api/v1/pdv/cancel/:transactionId
Authorization: ApiKey <pdv_api_key>
X-PDV-Device-Id: <device_id>
Content-Type: application/json

{
  "reason": "CUSTOMER_DESISTED",
  "cancelledAt": "2024-01-15T10:30:30Z"
}
```

---

### Identificar Aluno

Busca aluno por diferentes métodos de identificação.

```http
POST /api/v1/pdv/identify
Authorization: ApiKey <pdv_api_key>
X-PDV-Device-Id: <device_id>
Content-Type: application/json

{
  "method": "QR_CODE" | "NFC" | "NAME_SEARCH",
  "value": "string"
}
```

#### Response

```typescript
interface IdentifyResponse {
  found: boolean;
  student?: {
    id: string;
    name: string;
    photoUrl?: string;
    grade: string;

    // Status rápido para display
    status: 'OK' | 'LIMIT_REACHED' | 'BLOCKED';
    remainingToday: number;
  };

  // Para busca por nome, pode retornar múltiplos
  suggestions?: Array<{
    id: string;
    name: string;
    photoUrl?: string;
    grade: string;
  }>;
}
```

#### Exemplo - QR Code

```json
// Request
{
  "method": "QR_CODE",
  "value": "STUDENT:550e8400-e29b-41d4-a716-446655440000"
}

// Response
{
  "found": true,
  "student": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Maria Silva",
    "photoUrl": "https://cdn.layers.education/photos/...",
    "grade": "5º ano",
    "status": "OK",
    "remainingToday": 2500
  }
}
```

#### Exemplo - Busca por Nome

```json
// Request
{
  "method": "NAME_SEARCH",
  "value": "mari"
}

// Response
{
  "found": true,
  "suggestions": [
    {
      "id": "student-1",
      "name": "Maria Silva",
      "photoUrl": "...",
      "grade": "5º ano"
    },
    {
      "id": "student-2",
      "name": "Mariana Santos",
      "photoUrl": "...",
      "grade": "3º ano"
    }
  ]
}
```

---

### Sincronizar Regras (Offline Cache)

Obtém regras atualizadas para cache local do PDV.

```http
GET /api/v1/pdv/sync/rules
Authorization: ApiKey <pdv_api_key>
X-PDV-Device-Id: <device_id>
X-Last-Sync: <timestamp>
```

#### Response

```typescript
interface SyncRulesResponse {
  syncId: string;
  timestamp: string;

  // Regras que mudaram desde last-sync
  rules: StudentRuleCache[];

  // IDs de regras removidas
  removed: string[];

  // Próximo sync recomendado
  nextSyncIn: number; // segundos
}

interface StudentRuleCache {
  studentId: string;
  studentName: string;
  qrCode: string;
  nfcTag?: string;
  photoHash?: string;

  dailyLimit: number;

  // Restrições para decision local
  dietaryRestrictions: string[];
  blockedCategories: string[];

  // Versão para reconciliação
  version: number;
  updatedAt: string;
}
```

---

### Enviar Transações Offline (Batch)

Envia transações realizadas offline quando conexão é restaurada.

```http
POST /api/v1/pdv/sync/transactions
Authorization: ApiKey <pdv_api_key>
X-PDV-Device-Id: <device_id>
Content-Type: application/json

{
  "transactions": [
    {
      "localId": "local-txn-001",
      "studentId": "...",
      "amount": 1500,
      "decision": "ALLOW",
      "decisionSource": "LOCAL_CACHE",
      "timestamp": "2024-01-15T10:30:00Z",
      "confirmedAt": "2024-01-15T10:30:15Z"
    }
  ]
}
```

#### Response

```json
{
  "processed": 5,
  "failed": 0,
  "results": [
    {
      "localId": "local-txn-001",
      "serverId": "txn-server-abc",
      "status": "SYNCED"
    }
  ],
  "conflicts": []
}
```

---

### Status do Dispositivo PDV

```http
GET /api/v1/pdv/status
Authorization: ApiKey <pdv_api_key>
X-PDV-Device-Id: <device_id>
```

#### Response

```json
{
  "deviceId": "pdv-001",
  "name": "Cantina Principal",
  "status": "ONLINE",
  "lastSync": "2024-01-15T10:00:00Z",
  "pendingSync": 0,
  "cacheVersion": "2024011510",
  "serverTime": "2024-01-15T10:30:00Z"
}
```

---

## Implementação

### PdvController.ts

```typescript
// src/controllers/pdv.controller.ts

import { Request, Response } from 'express';
import { DecisionService } from '../services/decision.service';
import { TransactionService } from '../services/transaction.service';
import { StudentService } from '../services/student.service';
import { SyncService } from '../services/sync.service';
import { metrics } from '../monitoring/metrics';

export class PdvController {
  constructor(
    private decisionService: DecisionService,
    private transactionService: TransactionService,
    private studentService: StudentService,
    private syncService: SyncService
  ) {}

  /**
   * POST /pdv/evaluate
   * Endpoint crítico - SLA < 500ms
   */
  async evaluate(req: Request, res: Response) {
    const startTime = Date.now();
    const { pdv } = req as any;
    const { studentId, itemCategory, amount, timestamp, items } = req.body;

    try {
      // Executar decisão
      const decision = await this.decisionService.evaluate({
        studentId,
        itemCategory,
        amount,
        timestamp: new Date(timestamp),
        pdvId: pdv.id,
        schoolId: pdv.schoolId,
        items,
      });

      const processingTime = Date.now() - startTime;

      // Registrar métricas
      metrics.decisionLatency.observe(
        { decision: decision.decision },
        processingTime / 1000
      );

      // Log se SLA violado
      if (processingTime > 500) {
        console.warn(`SLA violation: ${processingTime}ms for student ${studentId}`);
        metrics.slaViolations.inc({ endpoint: 'evaluate' });
      }

      res.json({
        ...decision,
        processingTime,
      });
    } catch (error) {
      const processingTime = Date.now() - startTime;
      metrics.decisionErrors.inc({ error: error.name });

      // Em caso de erro, retornar ALLOW_SAFE (conservador)
      res.json({
        decision: 'ALLOW',
        transactionId: `fallback-${Date.now()}`,
        metadata: {
          studentName: 'Aluno',
          dailySpent: 0,
          dailyLimit: 0,
          remainingToday: 0,
        },
        fallback: true,
        processingTime,
      });
    }
  }

  /**
   * POST /pdv/confirm/:transactionId
   */
  async confirm(req: Request, res: Response) {
    const { transactionId } = req.params;
    const { paymentMethod, finalAmount, confirmedAt } = req.body;

    const result = await this.transactionService.confirm(transactionId, {
      paymentMethod,
      finalAmount,
      confirmedAt: new Date(confirmedAt),
    });

    res.json(result);
  }

  /**
   * POST /pdv/cancel/:transactionId
   */
  async cancel(req: Request, res: Response) {
    const { transactionId } = req.params;
    const { reason, cancelledAt } = req.body;

    await this.transactionService.cancel(transactionId, {
      reason,
      cancelledAt: new Date(cancelledAt),
    });

    res.json({ success: true });
  }

  /**
   * POST /pdv/identify
   */
  async identify(req: Request, res: Response) {
    const { pdv } = req as any;
    const { method, value } = req.body;

    const result = await this.studentService.identify({
      method,
      value,
      schoolId: pdv.schoolId,
    });

    res.json(result);
  }

  /**
   * GET /pdv/sync/rules
   */
  async syncRules(req: Request, res: Response) {
    const { pdv } = req as any;
    const lastSync = req.headers['x-last-sync'] as string;

    const result = await this.syncService.getRulesUpdate(
      pdv.schoolId,
      lastSync ? new Date(lastSync) : null
    );

    res.json(result);
  }

  /**
   * POST /pdv/sync/transactions
   */
  async syncTransactions(req: Request, res: Response) {
    const { pdv } = req as any;
    const { transactions } = req.body;

    const result = await this.syncService.processOfflineTransactions(
      pdv.id,
      transactions
    );

    res.json(result);
  }

  /**
   * GET /pdv/status
   */
  async status(req: Request, res: Response) {
    const { pdv } = req as any;

    const status = await this.syncService.getDeviceStatus(pdv.id);

    res.json(status);
  }
}
```

---

## Performance

### Otimizações Implementadas

| Técnica | Impacto |
|---------|---------|
| Cache Redis para regras | -80% latência |
| Prepared statements | -30% tempo DB |
| Connection pooling | Estabilidade |
| Índices otimizados | -50% tempo query |
| Batch aggregation | -40% writes |

### Configuração de Pool

```typescript
// src/config/database.ts

export const poolConfig = {
  min: 5,
  max: 20,
  acquireTimeoutMillis: 3000,
  createTimeoutMillis: 3000,
  destroyTimeoutMillis: 1000,
  idleTimeoutMillis: 30000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 100,
};
```

### Cache Strategy

```typescript
// src/services/cache.service.ts

export class CacheService {
  private readonly TTL = {
    STUDENT_RULES: 300,      // 5 minutos
    DAILY_AGGREGATE: 60,     // 1 minuto
    STUDENT_INFO: 600,       // 10 minutos
  };

  async getStudentRules(studentId: string): Promise<StudentRules | null> {
    const key = `rules:${studentId}`;
    const cached = await this.redis.get(key);

    if (cached) {
      return JSON.parse(cached);
    }

    const rules = await this.rulesRepo.findByStudent(studentId);

    if (rules) {
      await this.redis.setex(key, this.TTL.STUDENT_RULES, JSON.stringify(rules));
    }

    return rules;
  }
}
```

---

## Validação de Request

### Schema Validation

```typescript
// src/validators/pdv.validator.ts

import { z } from 'zod';

export const evaluateSchema = z.object({
  studentId: z.string().uuid(),
  itemCategory: z.string().min(1).max(50),
  amount: z.number().int().positive().max(100000), // max R$ 1000
  timestamp: z.string().datetime(),
  pdvId: z.string().min(1),
  items: z.array(z.object({
    sku: z.string(),
    name: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().int().positive(),
    category: z.string(),
    allergens: z.array(z.string()).optional(),
  })).optional(),
});

export const identifySchema = z.object({
  method: z.enum(['QR_CODE', 'NFC', 'NAME_SEARCH']),
  value: z.string().min(1).max(200),
});
```

---

## Códigos de Erro

| Código | HTTP | Descrição |
|--------|------|-----------|
| `STUDENT_NOT_FOUND` | 404 | Aluno não encontrado |
| `INVALID_QR_CODE` | 400 | QR Code malformado |
| `PDV_NOT_AUTHORIZED` | 403 | PDV não autorizado para escola |
| `TRANSACTION_EXPIRED` | 410 | Transação expirou (>5min) |
| `DUPLICATE_TRANSACTION` | 409 | Transação já processada |

---

## Métricas Prometheus

```yaml
# Métricas críticas

pdv_evaluate_latency_seconds:
  type: histogram
  help: Latência do endpoint evaluate
  buckets: [0.05, 0.1, 0.25, 0.5, 0.75, 1.0]

pdv_evaluate_total:
  type: counter
  help: Total de avaliações
  labels: [decision, pdv_id]

pdv_sla_violations_total:
  type: counter
  help: Violações de SLA (>500ms)
  labels: [endpoint]

pdv_sync_queue_size:
  type: gauge
  help: Tamanho da fila de sync pendente
  labels: [pdv_id]
```

---

## Alertas

```yaml
# AlertManager rules

- alert: PdvEvaluateSlaViolation
  expr: |
    histogram_quantile(0.95, rate(pdv_evaluate_latency_seconds_bucket[5m])) > 0.5
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "P95 latency above 500ms"

- alert: PdvHighErrorRate
  expr: |
    rate(pdv_evaluate_errors_total[5m]) / rate(pdv_evaluate_total[5m]) > 0.01
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Error rate above 1%"
```

---

## Testes de Performance

```typescript
// src/__tests__/pdv.performance.test.ts

describe('PDV Performance', () => {
  it('evaluate deve responder em menos de 500ms (P95)', async () => {
    const times: number[] = [];

    for (let i = 0; i < 100; i++) {
      const start = Date.now();
      await request(app)
        .post('/api/v1/pdv/evaluate')
        .set('Authorization', 'ApiKey test-key')
        .set('X-PDV-Device-Id', 'test-device')
        .send({
          studentId: testStudentId,
          itemCategory: 'lanche',
          amount: 1500,
          timestamp: new Date().toISOString(),
          pdvId: 'pdv-001',
        });
      times.push(Date.now() - start);
    }

    // Ordenar e pegar P95
    times.sort((a, b) => a - b);
    const p95 = times[Math.floor(times.length * 0.95)];

    expect(p95).toBeLessThan(500);
  });
});
```

---

## Referências

- [Decision Engine](./decision-engine.md)
- [Sincronização](./sync-api.md)
- [Arquitetura Offline PDV](../04-PDV/arquitetura-offline.md)
