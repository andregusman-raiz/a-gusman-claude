# Sincronização PDV - Protocolo

## Visão Geral

O protocolo de sincronização garante que o PDV opere corretamente em modo offline e sincronize dados quando a conexão for restaurada.

> **Princípio**: Nenhuma venda é perdida. Toda transação offline é sincronizada.

---

## Ciclo de Sincronização

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CICLO DE SINCRONIZAÇÃO                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                           SYNC MANAGER                                 │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│                                      ▼                                       │
│              ┌───────────────────────────────────────────┐                   │
│              │            Verificar conexão               │                   │
│              └───────────────────────┬───────────────────┘                   │
│                                      │                                       │
│               ┌──────────────────────┴──────────────────────┐                │
│               │                                             │                │
│               ▼                                             ▼                │
│        ┌─────────────┐                               ┌─────────────┐         │
│        │   ONLINE    │                               │   OFFLINE   │         │
│        └──────┬──────┘                               └──────┬──────┘         │
│               │                                             │                │
│               ▼                                             ▼                │
│  ┌────────────────────────┐                    ┌────────────────────────┐    │
│  │ 1. Download Rules      │                    │ Aguardar conexão       │    │
│  │    (Server → PDV)      │                    │ Retry em 30s           │    │
│  │                        │                    │                        │    │
│  │ 2. Upload Transactions │                    │ Continuar operando     │    │
│  │    (PDV → Server)      │                    │ com cache local        │    │
│  │                        │                    │                        │    │
│  │ 3. Reconcile           │                    │                        │    │
│  │    Conflicts           │                    │                        │    │
│  └────────────┬───────────┘                    └────────────────────────┘    │
│               │                                                              │
│               ▼                                                              │
│  ┌────────────────────────┐                                                  │
│  │ Agendar próximo sync   │                                                  │
│  │ (5 minutos)            │                                                  │
│  └────────────────────────┘                                                  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Sync Manager

### Implementação

```typescript
// src/workers/sync.worker.ts

import { DatabaseService } from '../database/sqlite';
import { OfflineDetector } from '../utils/offline-detector';
import { api } from '../services/api';

interface SyncConfig {
  apiUrl: string;
  apiKey: string;
  deviceId: string;
  syncIntervalMs: number;
  maxRetries: number;
}

interface SyncStatus {
  lastSync: Date | null;
  lastRulesSync: Date | null;
  lastTransactionSync: Date | null;
  pendingTransactions: number;
  pendingEvents: number;
  isRunning: boolean;
  errors: string[];
}

export class SyncManager {
  private database: DatabaseService;
  private offlineDetector: OfflineDetector;
  private config: SyncConfig;
  private status: SyncStatus;
  private syncTimer: NodeJS.Timer | null = null;
  private isSyncing: boolean = false;

  constructor(config: SyncConfig) {
    this.config = config;
    this.database = new DatabaseService();
    this.offlineDetector = new OfflineDetector(config.apiUrl);

    this.status = {
      lastSync: null,
      lastRulesSync: null,
      lastTransactionSync: null,
      pendingTransactions: 0,
      pendingEvents: 0,
      isRunning: false,
      errors: [],
    };

    this.init();
  }

  private init(): void {
    // Listener para mudanças de conexão
    this.offlineDetector.onStatusChange((event) => {
      if (event.status === 'ONLINE') {
        console.log('[Sync] Connection restored, syncing...');
        this.syncNow();
      } else {
        console.log('[Sync] Went offline');
      }
    });

    // Iniciar timer de sync periódico
    this.startPeriodicSync();
  }

  private startPeriodicSync(): void {
    this.syncTimer = setInterval(() => {
      if (this.offlineDetector.isOnline()) {
        this.syncNow();
      }
    }, this.config.syncIntervalMs);
  }

  async syncNow(): Promise<SyncStatus> {
    if (this.isSyncing) {
      console.log('[Sync] Already syncing, skipping');
      return this.status;
    }

    this.isSyncing = true;
    this.status.isRunning = true;
    this.status.errors = [];

    try {
      // 1. Download de regras atualizadas
      await this.syncRules();

      // 2. Upload de transações pendentes
      await this.syncTransactions();

      // 3. Processar fila de eventos
      await this.syncEvents();

      this.status.lastSync = new Date();
    } catch (error) {
      console.error('[Sync] Error:', error);
      this.status.errors.push(error.message);
    } finally {
      this.isSyncing = false;
      this.status.isRunning = false;
      this.updatePendingCounts();
    }

    return this.status;
  }

  /**
   * Download de regras do servidor
   */
  private async syncRules(): Promise<void> {
    const lastSync = await this.database.getConfig('last_rules_sync');
    const cacheVersion = await this.database.getConfig('cache_version');

    const response = await api.get('/sync/rules', {
      headers: {
        'X-Last-Sync': lastSync || '',
        'X-Cache-Version': cacheVersion || '',
      },
    });

    const data = response.data;

    if (data.fullSync) {
      console.log('[Sync] Full sync required, clearing cache');
      await this.database.clearStudentCache();
    }

    // Atualizar regras
    if (data.rules.length > 0) {
      await this.database.bulkUpsertStudents(data.rules);
      console.log(`[Sync] Updated ${data.rules.length} student rules`);
    }

    // Remover regras deletadas
    if (data.removed.length > 0) {
      await this.database.deleteStudents(data.removed);
      console.log(`[Sync] Removed ${data.removed.length} students`);
    }

    // Atualizar configurações da escola
    await this.database.setConfig('school_config', JSON.stringify(data.schoolConfig));
    await this.database.setConfig('cache_version', data.cacheVersion);
    await this.database.setConfig('last_rules_sync', data.timestamp);

    this.status.lastRulesSync = new Date();
  }

  /**
   * Upload de transações pendentes
   */
  private async syncTransactions(): Promise<void> {
    const pendingTransactions = await this.database.getPendingTransactions(100);

    if (pendingTransactions.length === 0) {
      return;
    }

    console.log(`[Sync] Uploading ${pendingTransactions.length} transactions`);

    const batchId = `batch-${this.config.deviceId}-${Date.now()}`;

    try {
      const response = await api.post('/sync/transactions', {
        batchId,
        transactions: pendingTransactions.map(this.mapTransactionForSync),
        events: [],
      });

      // Processar resultados
      for (const result of response.data.results) {
        if (result.status === 'SYNCED') {
          await this.database.markTransactionSynced(result.localId, result.serverId);
        } else if (result.status === 'DUPLICATE') {
          await this.database.markTransactionSynced(result.localId, result.serverId);
        } else if (result.status === 'CONFLICT') {
          await this.database.markTransactionConflict(result.localId, result.conflict);
        } else if (result.status === 'ERROR') {
          await this.database.markTransactionError(result.localId, result.error);
        }
      }

      // Atualizar agregados se necessário
      for (const update of response.data.aggregateUpdates) {
        await this.database.updateAggregateFromServer(
          update.studentId,
          update.date,
          update.totalSpent,
          update.transactionCount
        );
      }

      this.status.lastTransactionSync = new Date();
      console.log(`[Sync] Processed ${response.data.processed} transactions`);

      // Se há conflitos, logar
      if (response.data.conflicts.length > 0) {
        console.warn('[Sync] Conflicts detected:', response.data.conflicts);
      }
    } catch (error) {
      // Em caso de erro, não marcar transações como sincronizadas
      // Serão reprocessadas no próximo sync
      console.error('[Sync] Transaction sync failed:', error);
      throw error;
    }
  }

  /**
   * Processar fila de eventos (notificações, etc)
   */
  private async syncEvents(): Promise<void> {
    const pendingEvents = await this.database.getNextSyncItems(50);

    for (const item of pendingEvents) {
      try {
        await this.processSyncItem(item);
        await this.database.removeSyncItem(item.id);
      } catch (error) {
        await this.database.incrementSyncAttempt(item.id, error.message);

        if (item.attempts + 1 >= item.max_attempts) {
          console.error(`[Sync] Max attempts reached for item ${item.id}`);
        }
      }
    }
  }

  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    const payload = JSON.parse(item.payload);

    switch (item.type) {
      case 'NOTIFICATION':
        await api.post('/sync/notifications', payload);
        break;

      case 'EVENT':
        await api.post('/sync/events', payload);
        break;

      case 'CONFIRMATION':
        await api.post(`/pdv/confirm/${payload.transactionId}`, payload);
        break;

      default:
        console.warn(`[Sync] Unknown item type: ${item.type}`);
    }
  }

  private mapTransactionForSync(txn: LocalTransaction) {
    return {
      localId: txn.localId,
      studentId: txn.studentId,
      amount: txn.amount,
      itemCategory: txn.itemCategory,
      items: txn.items,
      decision: txn.decision,
      decisionSource: txn.decisionSource,
      rulesVersion: txn.rulesVersion,
      evaluatedAt: txn.evaluatedAt.toISOString(),
      confirmedAt: txn.confirmedAt?.toISOString(),
      cancelledAt: txn.cancelledAt?.toISOString(),
    };
  }

  private async updatePendingCounts(): Promise<void> {
    this.status.pendingTransactions = await this.database.countPendingTransactions();
    this.status.pendingEvents = await this.database.countPendingSyncItems();
  }

  getStatus(): SyncStatus {
    return { ...this.status };
  }

  stop(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    this.offlineDetector.destroy();
  }
}
```

---

## Resolução de Conflitos

### Estratégias

| Tipo de Conflito | Estratégia | Ação |
|------------------|------------|------|
| Regras mudaram (relaxadas) | ACCEPT_LOCAL | Manter decisão local |
| Regras mudaram (restringidas) | ACCEPT_LOCAL + FLAG | Manter, notificar admin |
| Transação duplicada | SKIP | Ignorar (idempotência) |
| Limite excedido retroativo | ACCEPT_LOCAL | Venda já ocorreu |
| Restrição alimentar violada | MANUAL_REVIEW | Alertar admin |

### Implementação

```typescript
// src/services/conflict-resolver.ts

interface ConflictResolution {
  action: 'ACCEPT_LOCAL' | 'ACCEPT_SERVER' | 'MANUAL_REVIEW';
  notify: boolean;
  message: string;
}

export class ConflictResolver {
  resolve(conflict: ConflictInfo): ConflictResolution {
    switch (conflict.type) {
      case 'RULES_CHANGED':
        return this.resolveRulesChanged(conflict);

      case 'LIMIT_EXCEEDED':
        return this.resolveLimitExceeded(conflict);

      case 'STUDENT_BLOCKED':
        return this.resolveStudentBlocked(conflict);

      default:
        return {
          action: 'ACCEPT_LOCAL',
          notify: false,
          message: 'Conflito desconhecido resolvido automaticamente',
        };
    }
  }

  private resolveRulesChanged(conflict: ConflictInfo): ConflictResolution {
    const { localDecision, serverDecision } = conflict;

    // Se local bloqueou e servidor permitiria, manter bloqueio
    if (localDecision.startsWith('BLOCK') && serverDecision === 'ALLOW') {
      return {
        action: 'ACCEPT_LOCAL',
        notify: false,
        message: 'Bloqueio mantido por segurança',
      };
    }

    // Se local permitiu e servidor bloquearia
    if (localDecision === 'ALLOW' && serverDecision.startsWith('BLOCK')) {
      // Restrição alimentar é crítica
      if (serverDecision === 'BLOCK_NOTIFY_PARENT') {
        return {
          action: 'MANUAL_REVIEW',
          notify: true,
          message: 'Possível violação de restrição alimentar detectada',
        };
      }

      // Limite excedido - venda já ocorreu
      return {
        action: 'ACCEPT_LOCAL',
        notify: true,
        message: 'Limite excedido retroativamente',
      };
    }

    return {
      action: 'ACCEPT_LOCAL',
      notify: false,
      message: 'Decisões compatíveis',
    };
  }

  private resolveLimitExceeded(conflict: ConflictInfo): ConflictResolution {
    // Venda já foi realizada, não podemos reverter
    return {
      action: 'ACCEPT_LOCAL',
      notify: true,
      message: 'Limite foi ajustado após transação offline',
    };
  }

  private resolveStudentBlocked(conflict: ConflictInfo): ConflictResolution {
    // Aluno foi bloqueado enquanto offline
    return {
      action: 'ACCEPT_LOCAL',
      notify: true,
      message: 'Aluno foi bloqueado após transação offline',
    };
  }
}
```

---

## Heartbeat e Monitoramento

```typescript
// src/services/heartbeat.service.ts

export class HeartbeatService {
  private interval: NodeJS.Timer | null = null;
  private readonly INTERVAL_MS = 60000; // 1 minuto

  constructor(
    private syncManager: SyncManager,
    private database: DatabaseService
  ) {}

  start(): void {
    this.interval = setInterval(() => {
      this.sendHeartbeat();
    }, this.INTERVAL_MS);
  }

  private async sendHeartbeat(): Promise<void> {
    const status = this.syncManager.getStatus();
    const deviceId = await this.database.getConfig('device_id');
    const operatorId = await this.database.getConfig('current_operator');

    try {
      const response = await api.post('/sync/heartbeat', {
        deviceId,
        deviceTime: new Date().toISOString(),
        queueSize: status.pendingTransactions + status.pendingEvents,
        cacheVersion: await this.database.getConfig('cache_version'),
        operatorId,
      });

      // Verificar se há drift de tempo significativo
      if (response.data.timeDrift > 60000) { // > 1 minuto
        console.warn('[Heartbeat] Time drift detected:', response.data.timeDrift);
        // Alertar operador sobre dessincronização de relógio
      }

      // Verificar se sync é necessário
      if (response.data.syncRequired) {
        console.log('[Heartbeat] Server requested sync');
        this.syncManager.syncNow();
      }

      // Verificar mensagens do servidor
      if (response.data.message) {
        this.handleServerMessage(response.data.message);
      }
    } catch (error) {
      // Heartbeat falhou - não é crítico
      console.warn('[Heartbeat] Failed:', error.message);
    }
  }

  private handleServerMessage(message: any): void {
    switch (message.type) {
      case 'FORCE_SYNC':
        this.syncManager.syncNow();
        break;

      case 'CLEAR_CACHE':
        this.database.clearStudentCache();
        this.syncManager.syncNow();
        break;

      case 'UPDATE_CONFIG':
        this.database.setConfig(message.key, message.value);
        break;

      default:
        console.log('[Heartbeat] Unknown message:', message);
    }
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
```

---

## Interface de Status

```tsx
// src/components/status/SyncStatus.tsx

import { useSyncStatus } from '../../hooks/useSyncStatus';
import { Cloud, CloudOff, RefreshCw, AlertTriangle } from 'lucide-react';

export function SyncStatus() {
  const { status, isOnline, syncNow } = useSyncStatus();

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 min-w-64">
      {/* Indicador de conexão */}
      <div className="flex items-center gap-2 mb-3">
        {isOnline ? (
          <>
            <Cloud className="w-5 h-5 text-green-500" />
            <span className="text-sm text-green-600">Online</span>
          </>
        ) : (
          <>
            <CloudOff className="w-5 h-5 text-red-500" />
            <span className="text-sm text-red-600">Offline</span>
          </>
        )}

        {status.isRunning && (
          <RefreshCw className="w-4 h-4 text-blue-500 animate-spin ml-auto" />
        )}
      </div>

      {/* Pendências */}
      {(status.pendingTransactions > 0 || status.pendingEvents > 0) && (
        <div className="text-sm text-gray-600 mb-2">
          <span className="font-medium">{status.pendingTransactions}</span> transações pendentes
        </div>
      )}

      {/* Última sincronização */}
      {status.lastSync && (
        <div className="text-xs text-gray-400">
          Última sync: {formatRelativeTime(status.lastSync)}
        </div>
      )}

      {/* Erros */}
      {status.errors.length > 0 && (
        <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-600 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{status.errors[0]}</span>
        </div>
      )}

      {/* Botão de sync manual */}
      <button
        onClick={syncNow}
        disabled={status.isRunning || !isOnline}
        className="mt-3 w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Sincronizar agora
      </button>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'agora';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min atrás`;
  return `${Math.floor(seconds / 3600)}h atrás`;
}
```

---

## Logs e Auditoria

```typescript
// src/services/sync-logger.ts

interface SyncLogEntry {
  timestamp: Date;
  action: string;
  details: any;
  status: 'SUCCESS' | 'ERROR' | 'WARNING';
  duration?: number;
}

export class SyncLogger {
  private logs: SyncLogEntry[] = [];
  private readonly MAX_LOGS = 1000;

  log(action: string, details: any, status: 'SUCCESS' | 'ERROR' | 'WARNING' = 'SUCCESS', duration?: number): void {
    const entry: SyncLogEntry = {
      timestamp: new Date(),
      action,
      details,
      status,
      duration,
    };

    this.logs.unshift(entry);

    // Manter apenas os últimos N logs
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(0, this.MAX_LOGS);
    }

    // Log no console em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Sync:${status}] ${action}`, details);
    }
  }

  getLogs(limit: number = 100): SyncLogEntry[] {
    return this.logs.slice(0, limit);
  }

  getErrorLogs(): SyncLogEntry[] {
    return this.logs.filter(l => l.status === 'ERROR');
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  clear(): void {
    this.logs = [];
  }
}
```

---

## Métricas

```typescript
// Métricas para monitoramento

interface SyncMetrics {
  // Latência
  avgSyncLatencyMs: number;
  p95SyncLatencyMs: number;

  // Throughput
  transactionsSyncedPerHour: number;
  rulesSyncedPerHour: number;

  // Erros
  syncErrorRate: number;
  conflictRate: number;

  // Fila
  avgQueueDepth: number;
  maxQueueDepth: number;

  // Offline
  totalOfflineHours: number;
  longestOfflinePeriodMinutes: number;
}
```

---

## Referências

- [Sync API](../02-BACKEND-API/sync-api.md)
- [Arquitetura Offline](./arquitetura-offline.md)
- [Decision Local](./decision-local.md)
