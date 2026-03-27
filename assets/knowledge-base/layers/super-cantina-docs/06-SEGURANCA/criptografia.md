# Criptografia e Proteção de Dados

## Visão Geral

O Super Cantina implementa criptografia em múltiplas camadas para proteger dados sensíveis em trânsito e em repouso.

---

## Arquitetura de Segurança

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CAMADAS DE CRIPTOGRAFIA                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  1. TRANSPORTE (TLS 1.3)                                                │ │
│  │                                                                          │ │
│  │  Client ◄──────── HTTPS / TLS 1.3 ────────► Server                      │ │
│  │                                                                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  2. APLICAÇÃO (AES-256-GCM)                                             │ │
│  │                                                                          │ │
│  │  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐               │ │
│  │  │ Dados       │────►│ Encrypt     │────►│ Dados       │               │ │
│  │  │ sensíveis   │     │ AES-256     │     │ cifrados    │               │ │
│  │  └─────────────┘     └─────────────┘     └─────────────┘               │ │
│  │                                                                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  3. BANCO DE DADOS (TDE / Column Encryption)                            │ │
│  │                                                                          │ │
│  │  PostgreSQL ◄──────── Encryption at Rest ────────► Storage              │ │
│  │                                                                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  4. BACKUP (GPG / AES-256)                                              │ │
│  │                                                                          │ │
│  │  Backups ◄──────── Encrypted ────────► S3 (SSE-KMS)                     │ │
│  │                                                                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Dados Criptografados

### Classificação de Dados

| Nível | Dados | Proteção |
|-------|-------|----------|
| Crítico | Restrições alimentares | AES-256-GCM + TDE |
| Alto | API Keys PDV | Hash SHA-256 |
| Médio | Tokens de sessão | Cache criptografado |
| Baixo | Transações | TDE apenas |

---

## Criptografia em Nível de Aplicação

### Serviço de Criptografia

```typescript
// src/services/crypto.service.ts

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
  scrypt,
} from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

interface EncryptedData {
  iv: string;       // Initialization Vector (hex)
  data: string;     // Encrypted data (hex)
  tag: string;      // Auth tag para GCM (hex)
  version: string;  // Versão do algoritmo
}

export class CryptoService {
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly KEY_LENGTH = 32; // 256 bits
  private readonly IV_LENGTH = 12;  // 96 bits para GCM
  private readonly TAG_LENGTH = 16; // 128 bits

  private masterKey: Buffer;

  constructor() {
    // Derivar master key do secret
    this.initMasterKey();
  }

  private async initMasterKey(): Promise<void> {
    const secret = process.env.ENCRYPTION_SECRET;
    const salt = process.env.ENCRYPTION_SALT;

    if (!secret || !salt) {
      throw new Error('Encryption secrets not configured');
    }

    this.masterKey = (await scryptAsync(
      secret,
      salt,
      this.KEY_LENGTH
    )) as Buffer;
  }

  /**
   * Criptografa dados sensíveis
   */
  async encrypt(plaintext: string): Promise<EncryptedData> {
    const iv = randomBytes(this.IV_LENGTH);

    const cipher = createCipheriv(this.ALGORITHM, this.masterKey, iv, {
      authTagLength: this.TAG_LENGTH,
    });

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    return {
      iv: iv.toString('hex'),
      data: encrypted.toString('hex'),
      tag: tag.toString('hex'),
      version: '1',
    };
  }

  /**
   * Descriptografa dados
   */
  async decrypt(encrypted: EncryptedData): Promise<string> {
    const iv = Buffer.from(encrypted.iv, 'hex');
    const data = Buffer.from(encrypted.data, 'hex');
    const tag = Buffer.from(encrypted.tag, 'hex');

    const decipher = createDecipheriv(this.ALGORITHM, this.masterKey, iv, {
      authTagLength: this.TAG_LENGTH,
    });

    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(data),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  /**
   * Hash irreversível (para API keys, senhas)
   */
  hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  /**
   * Gera token seguro
   */
  generateSecureToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  /**
   * Compara hashes de forma segura (timing-safe)
   */
  secureCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);

    if (bufA.length !== bufB.length) {
      return false;
    }

    return require('crypto').timingSafeEqual(bufA, bufB);
  }
}
```

---

## Campos Criptografados no Banco

### Schema com Campos Encriptados

```sql
-- Tabela de restrições alimentares (dados sensíveis)
CREATE TABLE dietary_restrictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),

    -- Campo criptografado
    restriction_data JSONB NOT NULL,
    -- Formato: { iv, data, tag, version }

    -- Metadata (não criptografado para queries)
    restriction_type VARCHAR(20) NOT NULL,
    severity VARCHAR(20) NOT NULL,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- API Keys do PDV (hash apenas)
CREATE TABLE pdv_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id),
    name VARCHAR(100) NOT NULL,

    -- Hash da API key (nunca armazenamos a key em texto)
    api_key_hash VARCHAR(64) NOT NULL,
    api_key_preview VARCHAR(20) NOT NULL, -- "pdv_abc1...xyz9"

    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Repository com Criptografia

```typescript
// src/repositories/dietary-restriction.repository.ts

import { CryptoService } from '../services/crypto.service';

interface DietaryRestriction {
  id: string;
  studentId: string;
  name: string;           // Ex: "Lactose"
  type: 'ALLERGY' | 'INTOLERANCE' | 'PREFERENCE';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  notes?: string;
  notifyOnViolation: boolean;
}

export class DietaryRestrictionRepository {
  constructor(
    private db: Database,
    private crypto: CryptoService
  ) {}

  async create(restriction: Omit<DietaryRestriction, 'id'>): Promise<DietaryRestriction> {
    // Dados sensíveis a criptografar
    const sensitiveData = {
      name: restriction.name,
      notes: restriction.notes,
    };

    // Criptografar
    const encryptedData = await this.crypto.encrypt(JSON.stringify(sensitiveData));

    // Inserir no banco
    const result = await this.db.query(`
      INSERT INTO dietary_restrictions
        (student_id, restriction_data, restriction_type, severity)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [
      restriction.studentId,
      JSON.stringify(encryptedData),
      restriction.type,
      restriction.severity,
    ]);

    return this.mapFromDb(result.rows[0]);
  }

  async findByStudent(studentId: string): Promise<DietaryRestriction[]> {
    const result = await this.db.query(`
      SELECT * FROM dietary_restrictions
      WHERE student_id = $1
    `, [studentId]);

    // Descriptografar cada registro
    return Promise.all(
      result.rows.map(row => this.mapFromDb(row))
    );
  }

  private async mapFromDb(row: any): Promise<DietaryRestriction> {
    // Descriptografar dados sensíveis
    const encryptedData = JSON.parse(row.restriction_data);
    const decrypted = await this.crypto.decrypt(encryptedData);
    const sensitiveData = JSON.parse(decrypted);

    return {
      id: row.id,
      studentId: row.student_id,
      name: sensitiveData.name,
      notes: sensitiveData.notes,
      type: row.restriction_type,
      severity: row.severity,
      notifyOnViolation: row.notify_on_violation,
    };
  }
}
```

---

## Gestão de Chaves

### Rotação de Chaves

```typescript
// src/services/key-rotation.service.ts

interface KeyVersion {
  version: string;
  key: Buffer;
  createdAt: Date;
  expiresAt: Date;
  status: 'ACTIVE' | 'DECRYPT_ONLY' | 'EXPIRED';
}

export class KeyRotationService {
  private keys: Map<string, KeyVersion> = new Map();

  constructor() {
    this.loadKeys();
  }

  /**
   * Carrega chaves do KMS/Vault
   */
  private async loadKeys(): Promise<void> {
    // Em produção, buscar do AWS KMS, HashiCorp Vault, etc.
    const currentKey = await this.fetchFromKMS('current');
    const previousKey = await this.fetchFromKMS('previous');

    this.keys.set(currentKey.version, currentKey);
    if (previousKey) {
      this.keys.set(previousKey.version, {
        ...previousKey,
        status: 'DECRYPT_ONLY',
      });
    }
  }

  /**
   * Obtém chave para criptografar (sempre a mais recente)
   */
  getEncryptionKey(): KeyVersion {
    const active = Array.from(this.keys.values())
      .find(k => k.status === 'ACTIVE');

    if (!active) {
      throw new Error('No active encryption key available');
    }

    return active;
  }

  /**
   * Obtém chave para descriptografar (por versão)
   */
  getDecryptionKey(version: string): KeyVersion | null {
    const key = this.keys.get(version);

    if (!key || key.status === 'EXPIRED') {
      return null;
    }

    return key;
  }

  /**
   * Inicia rotação de chave
   */
  async rotateKey(): Promise<void> {
    // 1. Marcar chave atual como DECRYPT_ONLY
    const current = this.getEncryptionKey();
    this.keys.set(current.version, {
      ...current,
      status: 'DECRYPT_ONLY',
    });

    // 2. Gerar nova chave
    const newKey = await this.generateNewKey();
    this.keys.set(newKey.version, newKey);

    // 3. Persistir no KMS
    await this.persistToKMS(newKey);

    // 4. Agendar re-criptografia de dados antigos
    await this.scheduleReEncryption();
  }

  private async generateNewKey(): Promise<KeyVersion> {
    const key = require('crypto').randomBytes(32);
    const version = `v${Date.now()}`;

    return {
      version,
      key,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
      status: 'ACTIVE',
    };
  }
}
```

---

## TLS / HTTPS

### Configuração do Servidor

```typescript
// src/server.ts

import https from 'https';
import fs from 'fs';
import express from 'express';

const app = express();

// Apenas HTTPS em produção
if (process.env.NODE_ENV === 'production') {
  const options = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH!),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH!),

    // TLS 1.3 preferido
    minVersion: 'TLSv1.2',

    // Cipher suites seguros
    ciphers: [
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256',
      'TLS_AES_128_GCM_SHA256',
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-RSA-AES128-GCM-SHA256',
    ].join(':'),

    // HSTS
    honorCipherOrder: true,
  };

  https.createServer(options, app).listen(443);
} else {
  app.listen(3000);
}
```

### Middleware HSTS

```typescript
// src/middleware/hsts.middleware.ts

export function hstsMiddleware() {
  return (req, res, next) => {
    // Strict-Transport-Security header
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );

    // Redirect HTTP to HTTPS
    if (!req.secure && process.env.NODE_ENV === 'production') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }

    next();
  };
}
```

---

## Criptografia no PDV (SQLite)

```typescript
// pdv/src/database/encrypted-sqlite.ts

import Database from 'better-sqlite3-multiple-ciphers';

export function createEncryptedDatabase(path: string): Database.Database {
  const db = new Database(path);

  // Usar SQLCipher para criptografia
  db.pragma(`key = '${process.env.SQLITE_ENCRYPTION_KEY}'`);
  db.pragma('cipher = aes256cbc');

  // Verificar se a criptografia está funcionando
  try {
    db.prepare('SELECT 1').get();
  } catch (error) {
    throw new Error('Failed to decrypt database. Wrong key?');
  }

  return db;
}
```

---

## Backup Criptografado

```bash
#!/bin/bash
# scripts/backup-encrypted.sh

# Variáveis
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${TIMESTAMP}.sql"
ENCRYPTED_FILE="${BACKUP_FILE}.gpg"
S3_BUCKET="s3://supercantina-backups"

# 1. Dump do banco
pg_dump $DATABASE_URL > $BACKUP_FILE

# 2. Criptografar com GPG
gpg --symmetric --cipher-algo AES256 \
    --passphrase "$BACKUP_PASSPHRASE" \
    --output $ENCRYPTED_FILE \
    $BACKUP_FILE

# 3. Upload para S3 (com SSE-KMS)
aws s3 cp $ENCRYPTED_FILE $S3_BUCKET/ \
    --sse aws:kms \
    --sse-kms-key-id $KMS_KEY_ID

# 4. Limpar arquivos locais
rm $BACKUP_FILE $ENCRYPTED_FILE

echo "Backup completed: $ENCRYPTED_FILE"
```

---

## Variáveis de Ambiente

```env
# .env.example - Configurações de criptografia

# Chave mestra de criptografia (32 bytes em hex)
ENCRYPTION_SECRET=your_64_char_hex_string_here

# Salt para derivação de chave
ENCRYPTION_SALT=your_salt_here

# SQLite encryption (PDV)
SQLITE_ENCRYPTION_KEY=your_sqlite_key_here

# SSL/TLS
SSL_KEY_PATH=/etc/ssl/private/server.key
SSL_CERT_PATH=/etc/ssl/certs/server.crt

# Backup
BACKUP_PASSPHRASE=your_backup_passphrase
KMS_KEY_ID=arn:aws:kms:region:account:key/key-id
```

---

## Auditoria de Segurança

```typescript
// src/services/security-audit.service.ts

export class SecurityAuditService {
  /**
   * Verifica configurações de segurança
   */
  async runSecurityChecks(): Promise<SecurityReport> {
    const checks = await Promise.all([
      this.checkEncryptionConfig(),
      this.checkTlsConfig(),
      this.checkKeyRotation(),
      this.checkBackupEncryption(),
    ]);

    return {
      timestamp: new Date(),
      checks,
      passed: checks.every(c => c.passed),
    };
  }

  private async checkEncryptionConfig(): Promise<SecurityCheck> {
    const hasSecret = !!process.env.ENCRYPTION_SECRET;
    const hasSalt = !!process.env.ENCRYPTION_SALT;

    return {
      name: 'Encryption Configuration',
      passed: hasSecret && hasSalt,
      details: hasSecret && hasSalt
        ? 'Encryption properly configured'
        : 'Missing encryption secrets',
    };
  }

  private async checkKeyRotation(): Promise<SecurityCheck> {
    const keyAge = await this.keyService.getCurrentKeyAge();
    const maxAge = 365; // dias

    return {
      name: 'Key Rotation',
      passed: keyAge < maxAge,
      details: `Current key age: ${keyAge} days`,
      warning: keyAge > 300 ? 'Key rotation recommended soon' : undefined,
    };
  }
}
```

---

## Referências

- [LGPD](./lgpd.md)
- [Autenticação SSO](./autenticacao-sso.md)
- [Arquitetura Offline PDV](../04-PDV/arquitetura-offline.md)
- [OWASP Cryptographic Failures](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)
