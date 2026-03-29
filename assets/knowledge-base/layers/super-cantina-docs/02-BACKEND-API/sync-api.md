# Sync API - Sincronização Offline

## Visão Geral

A Sync API gerencia a sincronização de dados entre o servidor e os dispositivos PDV que operam em modo offline-first. Garante consistência eventual dos dados e reconciliação de conflitos.

---

## Arquitetura de Sincronização

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PDV (Offline-First)                             │
│                                                                              │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐             │
│  │  SQLite Local  │    │  Sync Queue    │    │ Decision Cache │             │
│  │                │    │                │    │                │             │
│  │ • Regras       │    │ • Transactions │    │ • Student Rules│             │
│  │ • Agregados    │    │ • Events       │    │ • Aggregates   │             │
│  │ • Histórico    │    │ • Confirmations│    │ • Restrictions │             │
│  └───────┬────────┘    └───────┬────────┘    └───────┬────────┘             │
│          │                     │                     │                       │
│          └─────────────────────┼─────────────────────┘                       │
│                                │                                             │
│                                ▼                                             │
│                     ┌─────────────────────┐                                  │
│                     │   Sync Manager      │                                  │
│                     │                     │                                  │
│                     │ • Poll interval     │                                  │
│                     │ • Conflict resolver │                                  │
│                     │ • Retry logic       │                                  │
│                     └──────────┬──────────┘                                  │
└────────────────────────────────┼────────────────────────────────────────────┘
                                 │
                                 │ HTTPS
                                 │
┌────────────────────────────────┼────────────────────────────────────────────┐
│                                ▼                                             │
│                     ┌─────────────────────┐                                  │
│                     │     Sync API        │                                  │
│                     │                     │                                  │
│                     │ • /sync/rules       │                                  │
│                     │ • /sync/transactions│                                  │
│                     │ • /sync/status      │                                  │
│                     └──────────┬──────────┘                                  │
│                                │                                             │
│                                ▼                                             │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐             │
│  │   PostgreSQL   │    │     Redis      │    │   Event Bus    │             │
│  └────────────────┘    └────────────────┘    └────────────────┘             │
│                                                                              │
│                          SUPER CANTINA SERVER                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Endpoints

### Sincronizar Regras (Server → PDV)

Obtém regras atualizadas desde última sincronização.

```http
GET /api/v1/sync/rules
Authorization: ApiKey <pdv_api_key>
X-PDV-Device-Id: <device_id>
X-Last-Sync: <ISO_timestamp>
X-Cache-Version: <version_string>
```

#### Response

```typescript
interface SyncRulesResponse {
  // Identificador desta sincronização
  syncId: string;

  // Timestamp do servidor
  timestamp: string;

  // Versão do cache (para validação rápida)
  cacheVersion: string;

  // Se true, PDV deve limpar cache e receber tudo
  fullSync: boolean;

  // Regras atualizadas/novas
  rules: StudentRuleSnapshot[];

  // IDs de regras removidas
  removed: string[];

  // Categorias de produtos atualizadas
  categories: CategorySnapshot[];

  // Configurações globais da escola
  schoolConfig: SchoolConfig;

  // Quando fazer próximo sync (em segundos)
  nextSyncIn: number;
}

interface StudentRuleSnapshot {
  studentId: string;

  // Dados para identificação
  identity: {
    name: string;
    qrCode: string;
    nfcTag?: string;
    photoHash?: string;
  };

  // Regras de decisão
  rules: {
    dailyLimit: number;
    dietaryRestrictions: string[];
    blockedCategories: string[];
    allowedTimeWindows: TimeWindow[];
    maxItemsPerCategory: Record<string, number>;
  };

  // Agregado do dia atual
  todayAggregate: {
    totalSpent: number;
    transactionCount: number;
    categoryBreakdown: Record<string, number>;
  };

  // Controle de versão
  version: number;
  updatedAt: string;
}

interface TimeWindow {
  dayOfWeek: number[];  // 0-6
  startTime: string;    // HH:mm
  endTime: string;      // HH:mm
}

interface CategorySnapshot {
  id: string;
  name: string;
  allergens: string[];
  isActive: boolean;
}

interface SchoolConfig {
  schoolId: string;
  name: string;
  timezone: string;
  operatingHours: {
    start: string;
    end: string;
  };
  fallbackBehavior: 'ALLOW_CONSERVATIVE' | 'BLOCK_ALL';
  offlineMaxHours: number;
}
```

#### Exemplo

```json
{
  "syncId": "sync-20240115-103000",
  "timestamp": "2024-01-15T10:30:00Z",
  "cacheVersion": "v20240115103000",
  "fullSync": false,
  "rules": [
    {
      "studentId": "student-123",
      "identity": {
        "name": "Maria Silva",
        "qrCode": "STUDENT:student-123:5a8f3c",
        "nfcTag": "NFC:0x1234ABCD",
        "photoHash": "abc123def"
      },
      "rules": {
        "dailyLimit": 5000,
        "dietaryRestrictions": ["lactose"],
        "blockedCategories": ["refrigerante"],
        "allowedTimeWindows": [
          {
            "dayOfWeek": [1, 2, 3, 4, 5],
            "startTime": "09:30",
            "endTime": "11:30"
          }
        ],
        "maxItemsPerCategory": {
          "doce": 1
        }
      },
      "todayAggregate": {
        "totalSpent": 2000,
        "transactionCount": 1,
        "categoryBreakdown": {
          "lanche": 2000
        }
      },
      "version": 42,
      "updatedAt": "2024-01-15T08:00:00Z"
    }
  ],
  "removed": [],
  "categories": [
    {
      "id": "cat-lanche",
      "name": "Lanche",
      "allergens": [],
      "isActive": true
    }
  ],
  "schoolConfig": {
    "schoolId": "school-1",
    "name": "Colégio São Paulo",
    "timezone": "America/Sao_Paulo",
    "operatingHours": {
      "start": "07:00",
      "end": "18:00"
    },
    "fallbackBehavior": "ALLOW_CONSERVATIVE",
    "offlineMaxHours": 24
  },
  "nextSyncIn": 300
}
```

---

### Enviar Transações Offline (PDV → Server)

```http
POST /api/v1/sync/transactions
Authorization: ApiKey <pdv_api_key>
X-PDV-Device-Id: <device_id>
Content-Type: application/json
```

#### Request

```typescript
interface SyncTransactionsRequest {
  // ID do batch para idempotência
  batchId: string;

  // Transações a sincronizar
  transactions: OfflineTransaction[];

  // Eventos ocorridos offline
  events: OfflineEvent[];
}

interface OfflineTransaction {
  // ID local gerado pelo PDV
  localId: string;

  // Dados da transação
  studentId: string;
  amount: number;
  itemCategory: string;
  items?: ItemDetail[];

  // Decisão tomada localmente
  decision: 'ALLOW' | 'BLOCK_SILENT' | 'BLOCK_NOTIFY_PARENT';
  decisionSource: 'LOCAL_CACHE' | 'LOCAL_FALLBACK';

  // Versão das regras usadas
  rulesVersion: number;

  // Timestamps
  evaluatedAt: string;
  confirmedAt?: string;
  cancelledAt?: string;

  // Metadata adicional
  operatorId?: string;
  notes?: string;
}

interface OfflineEvent {
  localId: string;
  type: string;
  payload: Record<string, any>;
  occurredAt: string;
}
```

#### Response

```typescript
interface SyncTransactionsResponse {
  // Resumo do processamento
  processed: number;
  failed: number;
  skipped: number;

  // Resultado por transação
  results: TransactionSyncResult[];

  // Conflitos detectados
  conflicts: ConflictInfo[];

  // Atualizações de agregados (para corrigir cache local)
  aggregateUpdates: AggregateUpdate[];
}

interface TransactionSyncResult {
  localId: string;
  status: 'SYNCED' | 'DUPLICATE' | 'CONFLICT' | 'ERROR';
  serverId?: string;
  error?: string;
}

interface ConflictInfo {
  localId: string;
  type: 'RULES_CHANGED' | 'LIMIT_EXCEEDED' | 'STUDENT_BLOCKED';
  localDecision: string;
  serverDecision: string;
  resolution: 'ACCEPT_LOCAL' | 'ACCEPT_SERVER' | 'MANUAL_REVIEW';
  details: string;
}

interface AggregateUpdate {
  studentId: string;
  date: string;
  totalSpent: number;
  transactionCount: number;
}
```

#### Exemplo

```json
// Request
{
  "batchId": "batch-pdv001-20240115-1",
  "transactions": [
    {
      "localId": "local-txn-001",
      "studentId": "student-123",
      "amount": 1500,
      "itemCategory": "lanche",
      "decision": "ALLOW",
      "decisionSource": "LOCAL_CACHE",
      "rulesVersion": 41,
      "evaluatedAt": "2024-01-15T10:30:00Z",
      "confirmedAt": "2024-01-15T10:30:15Z"
    },
    {
      "localId": "local-txn-002",
      "studentId": "student-456",
      "amount": 800,
      "itemCategory": "bebida",
      "decision": "BLOCK_SILENT",
      "decisionSource": "LOCAL_FALLBACK",
      "rulesVersion": 38,
      "evaluatedAt": "2024-01-15T10:35:00Z"
    }
  ],
  "events": []
}

// Response
{
  "processed": 2,
  "failed": 0,
  "skipped": 0,
  "results": [
    {
      "localId": "local-txn-001",
      "status": "SYNCED",
      "serverId": "txn-server-abc123"
    },
    {
      "localId": "local-txn-002",
      "status": "CONFLICT",
      "conflict": {
        "type": "RULES_CHANGED",
        "localDecision": "BLOCK_SILENT",
        "serverDecision": "ALLOW",
        "resolution": "ACCEPT_LOCAL",
        "details": "Regras mudaram mas transação já finalizada"
      }
    }
  ],
  "conflicts": [...],
  "aggregateUpdates": [
    {
      "studentId": "student-123",
      "date": "2024-01-15",
      "totalSpent": 3500,
      "transactionCount": 2
    }
  ]
}
```

---

### Status de Sincronização

```http
GET /api/v1/sync/status
Authorization: ApiKey <pdv_api_key>
X-PDV-Device-Id: <device_id>
```

#### Response

```json
{
  "deviceId": "pdv-001",
  "deviceName": "Cantina Principal",
  "status": "HEALTHY",

  "lastSync": {
    "rules": "2024-01-15T10:25:00Z",
    "transactions": "2024-01-15T10:20:00Z"
  },

  "pendingSync": {
    "transactions": 0,
    "events": 0
  },

  "cacheStatus": {
    "version": "v20240115102500",
    "studentCount": 450,
    "oldestRule": "2024-01-15T08:00:00Z"
  },

  "health": {
    "syncLatency": 45,
    "errorRate": 0.001,
    "offlineHours": 0
  },

  "serverTime": "2024-01-15T10:30:00Z"
}
```

---

### Heartbeat (Keep-Alive)

```http
POST /api/v1/sync/heartbeat
Authorization: ApiKey <pdv_api_key>
X-PDV-Device-Id: <device_id>
Content-Type: application/json

{
  "deviceTime": "2024-01-15T10:30:00Z",
  "queueSize": 0,
  "cacheVersion": "v20240115102500",
  "operatorId": "operator-1"
}
```

#### Response

```json
{
  "ack": true,
  "serverTime": "2024-01-15T10:30:00Z",
  "timeDrift": -50,
  "syncRequired": false,
  "message": null
}
```

---

## Implementação

### SyncService.ts

```typescript
// src/services/sync.service.ts

import { Redis } from 'ioredis';
import { StudentRepository } from '../repositories/student.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { RulesRepository } from '../repositories/rules.repository';
import { EventEmitter } from '../events/emitter';

export class SyncService {
  private readonly SYNC_BATCH_SIZE = 100;
  private readonly MAX_OFFLINE_HOURS = 24;

  constructor(
    private redis: Redis,
    private studentRepo: StudentRepository,
    private transactionRepo: TransactionRepository,
    private rulesRepo: RulesRepository,
    private eventEmitter: EventEmitter
  ) {}

  /**
   * Obtém atualizações de regras para PDV
   */
  async getRulesUpdate(
    schoolId: string,
    lastSync: Date | null,
    cacheVersion: string | null
  ): Promise<SyncRulesResponse> {
    const syncId = `sync-${Date.now()}`;
    const now = new Date();

    // Verificar se precisa full sync
    const needsFullSync = !lastSync ||
      this.hoursSince(lastSync) > this.MAX_OFFLINE_HOURS;

    // Obter versão atual do cache
    const currentCacheVersion = await this.getCacheVersion(schoolId);

    // Se versões iguais e não precisa full sync, retornar vazio
    if (cacheVersion === currentCacheVersion && !needsFullSync) {
      return {
        syncId,
        timestamp: now.toISOString(),
        cacheVersion: currentCacheVersion,
        fullSync: false,
        rules: [],
        removed: [],
        categories: [],
        schoolConfig: await this.getSchoolConfig(schoolId),
        nextSyncIn: 300,
      };
    }

    // Buscar regras atualizadas
    let rules: StudentRuleSnapshot[];
    let removed: string[] = [];

    if (needsFullSync) {
      // Full sync: todos os alunos ativos
      rules = await this.getAllStudentRules(schoolId);
    } else {
      // Delta sync: apenas mudanças
      const changes = await this.rulesRepo.findChangedSince(schoolId, lastSync!);
      rules = changes.updated;
      removed = changes.removed;
    }

    // Buscar categorias
    const categories = await this.getCategories(schoolId);

    // Buscar config da escola
    const schoolConfig = await this.getSchoolConfig(schoolId);

    return {
      syncId,
      timestamp: now.toISOString(),
      cacheVersion: currentCacheVersion,
      fullSync: needsFullSync,
      rules,
      removed,
      categories,
      schoolConfig,
      nextSyncIn: this.calculateNextSync(rules.length),
    };
  }

  /**
   * Processa transações offline do PDV
   */
  async processOfflineTransactions(
    pdvId: string,
    transactions: OfflineTransaction[]
  ): Promise<SyncTransactionsResponse> {
    const results: TransactionSyncResult[] = [];
    const conflicts: ConflictInfo[] = [];
    const aggregateUpdates: Map<string, AggregateUpdate> = new Map();

    for (const txn of transactions) {
      try {
        const result = await this.processSingleTransaction(txn, pdvId);
        results.push(result);

        if (result.status === 'CONFLICT') {
          conflicts.push(result.conflict!);
        }

        if (result.status === 'SYNCED' && txn.confirmedAt) {
          // Atualizar agregados
          this.updateAggregateMap(aggregateUpdates, txn);
        }
      } catch (error) {
        results.push({
          localId: txn.localId,
          status: 'ERROR',
          error: error.message,
        });
      }
    }

    // Commit agregados
    await this.commitAggregates(aggregateUpdates);

    return {
      processed: results.filter(r => r.status === 'SYNCED').length,
      failed: results.filter(r => r.status === 'ERROR').length,
      skipped: results.filter(r => r.status === 'DUPLICATE').length,
      results,
      conflicts,
      aggregateUpdates: Array.from(aggregateUpdates.values()),
    };
  }

  private async processSingleTransaction(
    txn: OfflineTransaction,
    pdvId: string
  ): Promise<TransactionSyncResult> {
    // Verificar duplicata
    const existing = await this.transactionRepo.findByLocalId(
      pdvId,
      txn.localId
    );

    if (existing) {
      return {
        localId: txn.localId,
        status: 'DUPLICATE',
        serverId: existing.id,
      };
    }

    // Verificar conflito de regras
    const currentRules = await this.rulesRepo.findByStudent(txn.studentId);

    if (currentRules && currentRules.version > txn.rulesVersion) {
      // Regras mudaram - verificar se decisão seria diferente
      const serverDecision = await this.evaluateWithCurrentRules(txn);

      if (serverDecision !== txn.decision) {
        // Conflito detectado
        const conflict = await this.resolveConflict(txn, serverDecision);

        return {
          localId: txn.localId,
          status: 'CONFLICT',
          conflict,
        };
      }
    }

    // Criar transação no servidor
    const serverTxn = await this.transactionRepo.create({
      localId: txn.localId,
      pdvId,
      studentId: txn.studentId,
      amount: txn.amount,
      itemCategory: txn.itemCategory,
      items: txn.items,
      decision: txn.decision,
      decisionSource: txn.decisionSource,
      evaluatedAt: new Date(txn.evaluatedAt),
      confirmedAt: txn.confirmedAt ? new Date(txn.confirmedAt) : null,
      cancelledAt: txn.cancelledAt ? new Date(txn.cancelledAt) : null,
    });

    // Emitir evento
    this.eventEmitter.emit('transaction.synced', {
      transactionId: serverTxn.id,
      pdvId,
      studentId: txn.studentId,
      amount: txn.amount,
      decision: txn.decision,
    });

    return {
      localId: txn.localId,
      status: 'SYNCED',
      serverId: serverTxn.id,
    };
  }

  private async resolveConflict(
    txn: OfflineTransaction,
    serverDecision: string
  ): Promise<ConflictInfo> {
    // Se transação já confirmada, aceitar local
    // (não podemos reverter uma venda já feita)
    if (txn.confirmedAt) {
      return {
        localId: txn.localId,
        type: 'RULES_CHANGED',
        localDecision: txn.decision,
        serverDecision,
        resolution: 'ACCEPT_LOCAL',
        details: 'Transação já confirmada, aceita decisão local',
      };
    }

    // Se bloqueio virou permissão, aceitar
    if (txn.decision.startsWith('BLOCK') && serverDecision === 'ALLOW') {
      return {
        localId: txn.localId,
        type: 'RULES_CHANGED',
        localDecision: txn.decision,
        serverDecision,
        resolution: 'ACCEPT_LOCAL',
        details: 'Regras relaxadas, bloqueio mantido por segurança',
      };
    }

    // Se permissão virou bloqueio
    if (txn.decision === 'ALLOW' && serverDecision.startsWith('BLOCK')) {
      // Se for crítico (notifica pai), precisa review
      if (serverDecision === 'BLOCK_NOTIFY_PARENT') {
        return {
          localId: txn.localId,
          type: 'RULES_CHANGED',
          localDecision: txn.decision,
          serverDecision,
          resolution: 'MANUAL_REVIEW',
          details: 'Possível violação de restrição alimentar',
        };
      }

      return {
        localId: txn.localId,
        type: 'LIMIT_EXCEEDED',
        localDecision: txn.decision,
        serverDecision,
        resolution: 'ACCEPT_LOCAL',
        details: 'Limite excedido mas venda já processada',
      };
    }

    return {
      localId: txn.localId,
      type: 'RULES_CHANGED',
      localDecision: txn.decision,
      serverDecision,
      resolution: 'ACCEPT_LOCAL',
      details: 'Conflito resolvido automaticamente',
    };
  }

  private async getAllStudentRules(schoolId: string): Promise<StudentRuleSnapshot[]> {
    const students = await this.studentRepo.findBySchool(schoolId);
    const today = new Date().toISOString().split('T')[0];

    return Promise.all(
      students.map(async student => {
        const rules = await this.rulesRepo.findByStudent(student.id);
        const aggregate = await this.getStudentAggregate(student.id, today);

        return {
          studentId: student.id,
          identity: {
            name: student.name,
            qrCode: student.qrCode,
            nfcTag: student.nfcTag,
            photoHash: student.photoHash,
          },
          rules: {
            dailyLimit: rules?.dailyLimit || 0,
            dietaryRestrictions: rules?.dietaryRestrictions || [],
            blockedCategories: rules?.blockedCategories || [],
            allowedTimeWindows: rules?.timeWindows || [],
            maxItemsPerCategory: rules?.maxItemsPerCategory || {},
          },
          todayAggregate: aggregate,
          version: rules?.version || 0,
          updatedAt: rules?.updatedAt?.toISOString() || new Date().toISOString(),
        };
      })
    );
  }

  private async getCacheVersion(schoolId: string): Promise<string> {
    const lastUpdate = await this.redis.get(`cache-version:${schoolId}`);
    return lastUpdate || `v${Date.now()}`;
  }

  private async getSchoolConfig(schoolId: string): Promise<SchoolConfig> {
    const school = await this.studentRepo.getSchool(schoolId);
    return {
      schoolId,
      name: school.name,
      timezone: school.timezone || 'America/Sao_Paulo',
      operatingHours: school.operatingHours || { start: '07:00', end: '18:00' },
      fallbackBehavior: school.fallbackBehavior || 'ALLOW_CONSERVATIVE',
      offlineMaxHours: school.offlineMaxHours || 24,
    };
  }

  private hoursSince(date: Date): number {
    return (Date.now() - date.getTime()) / (1000 * 60 * 60);
  }

  private calculateNextSync(changesCount: number): number {
    // Se muitas mudanças, sync mais frequente
    if (changesCount > 50) return 60;
    if (changesCount > 10) return 120;
    return 300; // 5 minutos padrão
  }
}
```

---

## Estratégia de Conflitos

| Cenário | Resolução | Justificativa |
|---------|-----------|---------------|
| Regras relaxadas offline | ACCEPT_LOCAL | Segurança: manter bloqueio |
| Regras restringidas offline | ACCEPT_LOCAL (+ flag) | Venda já efetivada |
| Limite excedido offline | ACCEPT_LOCAL | Não pode reverter venda |
| Restrição alimentar violada | MANUAL_REVIEW | Crítico: requer atenção |
| Duplicata detectada | SKIP | Idempotência garantida |

---

## Reconciliação de Agregados

```typescript
// Processo de reconciliação ao final do dia

async function reconcileAggregates(schoolId: string, date: string) {
  // 1. Buscar todos os agregados calculados do dia
  const serverAggregates = await aggregateRepo.findBySchoolAndDate(schoolId, date);

  // 2. Recalcular baseado em transações confirmadas
  const recalculated = await transactionRepo.calculateAggregates(schoolId, date);

  // 3. Comparar e corrigir discrepâncias
  for (const agg of serverAggregates) {
    const correct = recalculated.find(r => r.studentId === agg.studentId);

    if (correct && correct.totalSpent !== agg.totalSpent) {
      await aggregateRepo.update(agg.id, {
        totalSpent: correct.totalSpent,
        transactionCount: correct.transactionCount,
        reconciled: true,
        reconciledAt: new Date(),
      });

      // Emitir evento de discrepância para auditoria
      eventEmitter.emit('aggregate.reconciled', {
        studentId: agg.studentId,
        date,
        originalValue: agg.totalSpent,
        correctedValue: correct.totalSpent,
      });
    }
  }
}
```

---

## Monitoramento

### Métricas Críticas

```yaml
sync_rules_latency_seconds:
  type: histogram
  help: Latência de sincronização de regras
  buckets: [0.5, 1, 2, 5, 10]

sync_transactions_processed_total:
  type: counter
  labels: [status, pdv_id]

sync_conflicts_total:
  type: counter
  labels: [type, resolution]

sync_queue_depth:
  type: gauge
  labels: [pdv_id]
  help: Transações pendentes de sync por PDV

sync_offline_hours:
  type: gauge
  labels: [pdv_id]
  help: Horas desde último sync bem-sucedido
```

### Alertas

```yaml
- alert: SyncOfflineTooLong
  expr: sync_offline_hours > 4
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "PDV offline há mais de 4 horas"

- alert: SyncQueueBacklog
  expr: sync_queue_depth > 100
  for: 15m
  labels:
    severity: critical
  annotations:
    summary: "Fila de sync com mais de 100 transações"

- alert: SyncConflictRateHigh
  expr: rate(sync_conflicts_total[1h]) > 10
  for: 30m
  labels:
    severity: warning
  annotations:
    summary: "Taxa alta de conflitos de sincronização"
```

---

## Testes

```typescript
describe('SyncService', () => {
  describe('getRulesUpdate', () => {
    it('deve retornar full sync quando offline > 24h', async () => {
      const lastSync = new Date(Date.now() - 25 * 60 * 60 * 1000);

      const result = await syncService.getRulesUpdate(
        'school-1',
        lastSync,
        null
      );

      expect(result.fullSync).toBe(true);
      expect(result.rules.length).toBeGreaterThan(0);
    });

    it('deve retornar delta sync quando online recente', async () => {
      const lastSync = new Date(Date.now() - 5 * 60 * 1000);

      const result = await syncService.getRulesUpdate(
        'school-1',
        lastSync,
        'v123'
      );

      expect(result.fullSync).toBe(false);
    });
  });

  describe('processOfflineTransactions', () => {
    it('deve detectar e resolver conflito de regras', async () => {
      // Setup: regra mudou após transação offline
      await rulesRepo.update('student-1', { version: 5 });

      const result = await syncService.processOfflineTransactions('pdv-1', [
        {
          localId: 'local-1',
          studentId: 'student-1',
          amount: 1000,
          decision: 'ALLOW',
          rulesVersion: 3, // versão antiga
          ...
        }
      ]);

      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].resolution).toBe('ACCEPT_LOCAL');
    });
  });
});
```

---

## Referências

- [PDV API](./pdv-api.md)
- [Arquitetura Offline PDV](../04-PDV/arquitetura-offline.md)
- [Sincronização PDV](../04-PDV/sincronizacao.md)
