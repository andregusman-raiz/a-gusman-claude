# Arquitetura Offline-First - PDV

## Visão Geral

O PDV (Ponto de Venda) do Super Cantina é projetado para operar de forma **offline-first**. Isso significa que a cantina funciona normalmente mesmo sem conexão com a internet.

> **Princípio**: A fila do caixa nunca pode parar por problemas de rede.

---

## Stack Tecnológico

| Tecnologia | Propósito |
|------------|-----------|
| Electron | App desktop (Windows/Linux) |
| React | Interface do operador |
| SQLite | Banco de dados local |
| Web Workers | Sync em background |
| IndexedDB | Cache de imagens |

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PDV - ARQUITETURA OFFLINE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        INTERFACE DO OPERADOR                           │  │
│  │                                                                        │  │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │  │
│  │   │ Identificação│  │   Carrinho   │  │  Pagamento   │               │  │
│  │   │   Aluno      │  │   Itens      │  │   Finalizar  │               │  │
│  │   └──────────────┘  └──────────────┘  └──────────────┘               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│                                      ▼                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                          CAMADA DE SERVIÇOS                            │  │
│  │                                                                        │  │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │  │
│  │   │  Decision    │  │  Transaction │  │    Sync      │               │  │
│  │   │  Service     │  │   Service    │  │   Manager    │               │  │
│  │   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘               │  │
│  │          │                 │                 │                        │  │
│  └──────────┼─────────────────┼─────────────────┼────────────────────────┘  │
│             │                 │                 │                            │
│             ▼                 ▼                 ▼                            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                          CAMADA DE DADOS                               │  │
│  │                                                                        │  │
│  │   ┌──────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │  │
│  │   │     SQLite       │  │   Sync Queue    │  │    Image Cache      │  │  │
│  │   │                  │  │                 │  │    (IndexedDB)      │  │  │
│  │   │ • students       │  │ • transactions  │  │                     │  │  │
│  │   │ • rules          │  │ • events        │  │ • student photos    │  │  │
│  │   │ • aggregates     │  │ • confirmations │  │                     │  │  │
│  │   │ • transactions   │  │                 │  │                     │  │  │
│  │   └──────────────────┘  └─────────────────┘  └─────────────────────┘  │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│                                      ▼                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         SYNC WORKER (Background)                       │  │
│  │                                                                        │  │
│  │   • Poll a cada 5 minutos (online)                                    │  │
│  │   • Detecta mudança de conexão                                        │  │
│  │   • Processa fila de sync                                             │  │
│  │   • Reconcilia conflitos                                              │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│                                      │ HTTPS (quando online)                 │
│                                      ▼                                       │
│                         ┌─────────────────────┐                              │
│                         │  SUPER CANTINA API  │                              │
│                         └─────────────────────┘                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Estrutura do Projeto

```
pdv/
├── electron/
│   ├── main.ts               # Process principal Electron
│   ├── preload.ts            # Bridge para renderer
│   └── ipc/                  # Handlers IPC
│       ├── database.ts
│       └── hardware.ts
│
├── src/
│   ├── main.tsx              # Entry point React
│   ├── App.tsx
│   │
│   ├── components/           # Componentes UI
│   │   ├── checkout/
│   │   ├── identification/
│   │   └── status/
│   │
│   ├── services/             # Serviços de negócio
│   │   ├── decision.service.ts
│   │   ├── transaction.service.ts
│   │   └── sync.service.ts
│   │
│   ├── database/             # Camada de dados
│   │   ├── sqlite.ts
│   │   ├── models/
│   │   └── migrations/
│   │
│   ├── workers/              # Web Workers
│   │   └── sync.worker.ts
│   │
│   └── utils/
│       ├── offline-detector.ts
│       └── queue.ts
│
├── database/
│   └── schema.sql            # Schema SQLite
│
└── package.json
```

---

## Schema SQLite Local

```sql
-- pdv/database/schema.sql

-- Alunos (cache do servidor)
CREATE TABLE students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    qr_code TEXT UNIQUE,
    nfc_tag TEXT UNIQUE,
    photo_hash TEXT,
    grade TEXT,
    school_id TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    synced_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_students_qr ON students(qr_code);
CREATE INDEX idx_students_nfc ON students(nfc_tag);
CREATE INDEX idx_students_name ON students(name);

-- Regras por aluno (cache do servidor)
CREATE TABLE student_rules (
    student_id TEXT PRIMARY KEY REFERENCES students(id),
    daily_limit INTEGER NOT NULL DEFAULT 0,
    dietary_restrictions TEXT, -- JSON array
    blocked_categories TEXT,   -- JSON array
    time_windows TEXT,         -- JSON array
    max_per_category TEXT,     -- JSON object
    version INTEGER DEFAULT 1,
    synced_at DATETIME
);

-- Agregados diários (cache + local)
CREATE TABLE daily_aggregates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL REFERENCES students(id),
    date TEXT NOT NULL, -- YYYY-MM-DD
    total_spent INTEGER DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    category_breakdown TEXT, -- JSON object
    synced BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, date)
);

CREATE INDEX idx_aggregates_date ON daily_aggregates(date);

-- Transações locais
CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    local_id TEXT UNIQUE NOT NULL,
    student_id TEXT NOT NULL REFERENCES students(id),
    amount INTEGER NOT NULL,
    item_category TEXT,
    items TEXT, -- JSON array
    decision TEXT NOT NULL, -- ALLOW, BLOCK_SILENT, BLOCK_NOTIFY
    decision_source TEXT NOT NULL, -- LOCAL_CACHE, LOCAL_FALLBACK, SERVER
    rules_version INTEGER,
    operator_id TEXT,
    evaluated_at DATETIME NOT NULL,
    confirmed_at DATETIME,
    cancelled_at DATETIME,
    sync_status TEXT DEFAULT 'PENDING', -- PENDING, SYNCED, CONFLICT, ERROR
    sync_error TEXT,
    synced_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_sync ON transactions(sync_status);
CREATE INDEX idx_transactions_date ON transactions(evaluated_at);

-- Fila de sincronização
CREATE TABLE sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL, -- TRANSACTION, EVENT, CONFIRMATION
    payload TEXT NOT NULL, -- JSON
    priority INTEGER DEFAULT 5, -- 1 = highest
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    last_attempt DATETIME,
    last_error TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sync_queue_priority ON sync_queue(priority, created_at);

-- Configuração local
CREATE TABLE config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Inserir configurações padrão
INSERT INTO config (key, value) VALUES
    ('last_sync', ''),
    ('cache_version', ''),
    ('device_id', ''),
    ('school_id', ''),
    ('offline_max_hours', '24'),
    ('fallback_behavior', 'ALLOW_CONSERVATIVE');
```

---

## Fluxo de Dados Offline

### Compra com Cache Local

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUXO: COMPRA OFFLINE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Operador escaneia QR Code                                                │
│     │                                                                        │
│     ▼                                                                        │
│  2. Busca aluno no SQLite local                                              │
│     │                                                                        │
│     ├── Não encontrado ──► Busca por nome                                    │
│     │                                                                        │
│     ▼                                                                        │
│  3. Carrega regras do aluno (SQLite)                                         │
│     │                                                                        │
│     ▼                                                                        │
│  4. Carrega agregado do dia (SQLite)                                         │
│     │                                                                        │
│     ▼                                                                        │
│  5. Decision Engine LOCAL avalia                                             │
│     │                                                                        │
│     ├── ALLOW ──► Registra transação local                                   │
│     │                                                                        │
│     ├── BLOCK_SILENT ──► Mostra mensagem, não registra                       │
│     │                                                                        │
│     └── BLOCK_NOTIFY ──► Adiciona à fila de notificação                      │
│                                                                              │
│  6. Atualiza agregado local                                                  │
│     │                                                                        │
│     ▼                                                                        │
│  7. Adiciona transação à fila de sync                                        │
│     │                                                                        │
│     ▼                                                                        │
│  8. [Quando online] Sync worker processa fila                                │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementação

### Database Service

```typescript
// src/database/sqlite.ts

import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

const DB_PATH = path.join(app.getPath('userData'), 'pdv.db');

export class DatabaseService {
  private db: Database.Database;

  constructor() {
    this.db = new Database(DB_PATH);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.runMigrations();
  }

  // Alunos

  findStudentByQR(qrCode: string): Student | null {
    const stmt = this.db.prepare(`
      SELECT s.*, sr.daily_limit, sr.dietary_restrictions,
             sr.blocked_categories, sr.time_windows, sr.version as rules_version
      FROM students s
      LEFT JOIN student_rules sr ON s.id = sr.student_id
      WHERE s.qr_code = ?
    `);

    const row = stmt.get(qrCode);
    return row ? this.mapStudent(row) : null;
  }

  findStudentByNFC(nfcTag: string): Student | null {
    const stmt = this.db.prepare(`
      SELECT s.*, sr.daily_limit, sr.dietary_restrictions,
             sr.blocked_categories, sr.time_windows, sr.version as rules_version
      FROM students s
      LEFT JOIN student_rules sr ON s.id = sr.student_id
      WHERE s.nfc_tag = ?
    `);

    const row = stmt.get(nfcTag);
    return row ? this.mapStudent(row) : null;
  }

  searchStudentsByName(query: string, limit: number = 10): Student[] {
    const stmt = this.db.prepare(`
      SELECT s.*, sr.daily_limit
      FROM students s
      LEFT JOIN student_rules sr ON s.id = sr.student_id
      WHERE s.name LIKE ?
      ORDER BY s.name
      LIMIT ?
    `);

    const rows = stmt.all(`%${query}%`, limit);
    return rows.map(this.mapStudent);
  }

  // Agregados

  getOrCreateAggregate(studentId: string, date: string): DailyAggregate {
    const existing = this.db.prepare(`
      SELECT * FROM daily_aggregates WHERE student_id = ? AND date = ?
    `).get(studentId, date);

    if (existing) {
      return {
        studentId,
        date,
        totalSpent: existing.total_spent,
        transactionCount: existing.transaction_count,
        categoryBreakdown: JSON.parse(existing.category_breakdown || '{}'),
      };
    }

    // Criar novo
    this.db.prepare(`
      INSERT INTO daily_aggregates (student_id, date, total_spent, transaction_count)
      VALUES (?, ?, 0, 0)
    `).run(studentId, date);

    return {
      studentId,
      date,
      totalSpent: 0,
      transactionCount: 0,
      categoryBreakdown: {},
    };
  }

  updateAggregate(
    studentId: string,
    date: string,
    amount: number,
    category: string
  ): void {
    // Atualizar agregado
    this.db.prepare(`
      UPDATE daily_aggregates
      SET total_spent = total_spent + ?,
          transaction_count = transaction_count + 1,
          synced = FALSE
      WHERE student_id = ? AND date = ?
    `).run(amount, studentId, date);

    // Atualizar breakdown por categoria
    const current = this.db.prepare(`
      SELECT category_breakdown FROM daily_aggregates
      WHERE student_id = ? AND date = ?
    `).get(studentId, date);

    const breakdown = JSON.parse(current?.category_breakdown || '{}');
    breakdown[category] = (breakdown[category] || 0) + amount;

    this.db.prepare(`
      UPDATE daily_aggregates
      SET category_breakdown = ?
      WHERE student_id = ? AND date = ?
    `).run(JSON.stringify(breakdown), studentId, date);
  }

  // Transações

  createTransaction(transaction: LocalTransaction): void {
    this.db.prepare(`
      INSERT INTO transactions (
        id, local_id, student_id, amount, item_category, items,
        decision, decision_source, rules_version, operator_id,
        evaluated_at, confirmed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      transaction.id,
      transaction.localId,
      transaction.studentId,
      transaction.amount,
      transaction.itemCategory,
      JSON.stringify(transaction.items || []),
      transaction.decision,
      transaction.decisionSource,
      transaction.rulesVersion,
      transaction.operatorId,
      transaction.evaluatedAt.toISOString(),
      transaction.confirmedAt?.toISOString()
    );
  }

  getPendingTransactions(limit: number = 100): LocalTransaction[] {
    const rows = this.db.prepare(`
      SELECT * FROM transactions
      WHERE sync_status = 'PENDING'
      ORDER BY evaluated_at
      LIMIT ?
    `).all(limit);

    return rows.map(this.mapTransaction);
  }

  markTransactionSynced(localId: string, serverId: string): void {
    this.db.prepare(`
      UPDATE transactions
      SET sync_status = 'SYNCED', synced_at = CURRENT_TIMESTAMP
      WHERE local_id = ?
    `).run(localId);
  }

  // Sync Queue

  addToSyncQueue(type: string, payload: any, priority: number = 5): void {
    this.db.prepare(`
      INSERT INTO sync_queue (type, payload, priority)
      VALUES (?, ?, ?)
    `).run(type, JSON.stringify(payload), priority);
  }

  getNextSyncItems(limit: number = 50): SyncQueueItem[] {
    return this.db.prepare(`
      SELECT * FROM sync_queue
      WHERE attempts < max_attempts
      ORDER BY priority, created_at
      LIMIT ?
    `).all(limit);
  }

  // Bulk operations para sync

  bulkUpsertStudents(students: StudentRuleSnapshot[]): void {
    const insertStudent = this.db.prepare(`
      INSERT OR REPLACE INTO students (id, name, qr_code, nfc_tag, photo_hash, grade, school_id, version, synced_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const insertRules = this.db.prepare(`
      INSERT OR REPLACE INTO student_rules (student_id, daily_limit, dietary_restrictions, blocked_categories, time_windows, max_per_category, version, synced_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const transaction = this.db.transaction((students: StudentRuleSnapshot[]) => {
      for (const s of students) {
        insertStudent.run(
          s.studentId,
          s.identity.name,
          s.identity.qrCode,
          s.identity.nfcTag,
          s.identity.photoHash,
          null, // grade not in snapshot
          null, // school_id set from config
          s.version
        );

        insertRules.run(
          s.studentId,
          s.rules.dailyLimit,
          JSON.stringify(s.rules.dietaryRestrictions),
          JSON.stringify(s.rules.blockedCategories),
          JSON.stringify(s.rules.allowedTimeWindows),
          JSON.stringify(s.rules.maxItemsPerCategory),
          s.version
        );
      }
    });

    transaction(students);
  }

  private mapStudent(row: any): Student {
    return {
      id: row.id,
      name: row.name,
      qrCode: row.qr_code,
      nfcTag: row.nfc_tag,
      photoHash: row.photo_hash,
      grade: row.grade,
      rules: {
        dailyLimit: row.daily_limit || 0,
        dietaryRestrictions: JSON.parse(row.dietary_restrictions || '[]'),
        blockedCategories: JSON.parse(row.blocked_categories || '[]'),
        timeWindows: JSON.parse(row.time_windows || '[]'),
      },
      rulesVersion: row.rules_version || 0,
    };
  }

  private mapTransaction(row: any): LocalTransaction {
    return {
      id: row.id,
      localId: row.local_id,
      studentId: row.student_id,
      amount: row.amount,
      itemCategory: row.item_category,
      items: JSON.parse(row.items || '[]'),
      decision: row.decision,
      decisionSource: row.decision_source,
      rulesVersion: row.rules_version,
      operatorId: row.operator_id,
      evaluatedAt: new Date(row.evaluated_at),
      confirmedAt: row.confirmed_at ? new Date(row.confirmed_at) : null,
      syncStatus: row.sync_status,
    };
  }

  private runMigrations(): void {
    // Executar schema inicial se necessário
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schema = require('fs').readFileSync(schemaPath, 'utf8');
    this.db.exec(schema);
  }
}
```

---

## Detector de Conexão

```typescript
// src/utils/offline-detector.ts

type ConnectionStatus = 'ONLINE' | 'OFFLINE' | 'UNSTABLE';

interface ConnectionEvent {
  status: ConnectionStatus;
  timestamp: Date;
  latency?: number;
}

export class OfflineDetector {
  private status: ConnectionStatus = 'ONLINE';
  private listeners: Set<(event: ConnectionEvent) => void> = new Set();
  private pingInterval: NodeJS.Timer | null = null;
  private readonly PING_URL: string;
  private readonly PING_INTERVAL = 30000; // 30 segundos
  private readonly PING_TIMEOUT = 5000;   // 5 segundos
  private consecutiveFailures = 0;

  constructor(apiUrl: string) {
    this.PING_URL = `${apiUrl}/health`;
    this.init();
  }

  private init(): void {
    // Listeners nativos do browser
    window.addEventListener('online', () => this.checkConnection());
    window.addEventListener('offline', () => this.setStatus('OFFLINE'));

    // Ping periódico
    this.startPinging();

    // Verificação inicial
    this.checkConnection();
  }

  private startPinging(): void {
    this.pingInterval = setInterval(() => {
      this.checkConnection();
    }, this.PING_INTERVAL);
  }

  async checkConnection(): Promise<ConnectionStatus> {
    if (!navigator.onLine) {
      this.setStatus('OFFLINE');
      return 'OFFLINE';
    }

    try {
      const start = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.PING_TIMEOUT);

      const response = await fetch(this.PING_URL, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const latency = Date.now() - start;

      if (response.ok) {
        this.consecutiveFailures = 0;

        // Se latência muito alta, marcar como instável
        if (latency > 2000) {
          this.setStatus('UNSTABLE', latency);
        } else {
          this.setStatus('ONLINE', latency);
        }
      } else {
        this.handleFailure();
      }
    } catch (error) {
      this.handleFailure();
    }

    return this.status;
  }

  private handleFailure(): void {
    this.consecutiveFailures++;

    if (this.consecutiveFailures >= 3) {
      this.setStatus('OFFLINE');
    } else {
      this.setStatus('UNSTABLE');
    }
  }

  private setStatus(newStatus: ConnectionStatus, latency?: number): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.notifyListeners({ status: newStatus, timestamp: new Date(), latency });
    }
  }

  private notifyListeners(event: ConnectionEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  // Public API

  getStatus(): ConnectionStatus {
    return this.status;
  }

  isOnline(): boolean {
    return this.status === 'ONLINE';
  }

  isOffline(): boolean {
    return this.status === 'OFFLINE';
  }

  onStatusChange(callback: (event: ConnectionEvent) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  destroy(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    this.listeners.clear();
  }
}
```

---

## Cache de Imagens

```typescript
// src/database/image-cache.ts

const DB_NAME = 'pdv-images';
const STORE_NAME = 'photos';
const DB_VERSION = 1;

export class ImageCache {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'hash' });
        }
      };
    });
  }

  async getPhoto(hash: string): Promise<Blob | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(hash);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result?.blob || null);
      };
    });
  }

  async savePhoto(hash: string, blob: Blob): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ hash, blob, cachedAt: new Date() });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearOldPhotos(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.db) return;

    const cutoff = new Date(Date.now() - maxAge);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (cursor.value.cachedAt < cutoff) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}
```

---

## Configuração Electron

```typescript
// electron/main.ts

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { DatabaseService } from '../src/database/sqlite';

let mainWindow: BrowserWindow | null = null;
let database: DatabaseService;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    fullscreen: process.env.NODE_ENV === 'production',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Carregar app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(async () => {
  // Inicializar banco de dados
  database = new DatabaseService();

  // Registrar handlers IPC
  registerDatabaseHandlers();

  createWindow();
});

function registerDatabaseHandlers() {
  ipcMain.handle('db:findStudentByQR', (_, qrCode) => {
    return database.findStudentByQR(qrCode);
  });

  ipcMain.handle('db:findStudentByNFC', (_, nfcTag) => {
    return database.findStudentByNFC(nfcTag);
  });

  ipcMain.handle('db:searchStudents', (_, query, limit) => {
    return database.searchStudentsByName(query, limit);
  });

  ipcMain.handle('db:getAggregate', (_, studentId, date) => {
    return database.getOrCreateAggregate(studentId, date);
  });

  ipcMain.handle('db:createTransaction', (_, transaction) => {
    return database.createTransaction(transaction);
  });

  // ... mais handlers
}
```

---

## Referências

- [Decision Local](./decision-local.md)
- [Identificação de Alunos](./identificacao-alunos.md)
- [Sincronização](./sincronizacao.md)
