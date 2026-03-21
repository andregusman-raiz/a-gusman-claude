# Conformidade LGPD

## Visão Geral

O Super Cantina foi projetado seguindo o princípio de **minimização de dados** da LGPD. Coletamos apenas o estritamente necessário para o funcionamento do sistema.

> **Princípio**: O melhor dado é aquele que não coletamos.

---

## Dados Coletados

### Dados Necessários

| Dado | Base Legal | Finalidade | Retenção |
|------|------------|------------|----------|
| Nome do aluno | Contrato | Identificação na cantina | Enquanto ativo |
| Série/turma | Contrato | Contexto escolar | Enquanto ativo |
| Foto | Consentimento | Identificação visual | Enquanto ativo |
| Restrições alimentares | Legítimo interesse | Segurança alimentar | Enquanto ativo |
| Limite diário | Contrato | Controle de gastos | Enquanto ativo |
| Transações (agregadas) | Contrato | Controle financeiro | 90 dias |

### Dados NÃO Coletados (por design)

- ❌ Itens específicos comprados (apenas categoria)
- ❌ Horário exato das compras (apenas turno)
- ❌ Localização do aluno
- ❌ Histórico detalhado para responsável
- ❌ Padrões de consumo individuais
- ❌ Preferências alimentares
- ❌ Dados biométricos

---

## Minimização de Dados

### Transações

```sql
-- O que ARMAZENAMOS
INSERT INTO transactions (
    student_id,
    date,           -- Apenas data, não hora exata
    amount,
    category,       -- Apenas categoria (lanche, bebida)
    decision
) VALUES (...);

-- O que NÃO armazenamos
-- ❌ item_name (nome do produto)
-- ❌ timestamp (hora exata)
-- ❌ pdv_operator (quem atendeu)
-- ❌ payment_details
```

### Agregação Diária

```typescript
// Em vez de armazenar cada transação individualmente,
// mantemos apenas agregados diários

interface DailyAggregate {
  studentId: string;
  date: string;           // YYYY-MM-DD

  // Totais do dia
  totalSpent: number;
  transactionCount: number;

  // Breakdown por categoria (não por item)
  categoryBreakdown: {
    lanche: number;
    bebida: number;
    doce: number;
  };
}
```

---

## Política de Retenção

### Ciclo de Vida dos Dados

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CICLO DE VIDA DOS DADOS                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌───────────┐  │
│  │   COLETA    │────►│   ATIVO     │────►│  AGREGADO   │────►│  DELETADO │  │
│  │             │     │             │     │             │     │           │  │
│  │ Mínimo      │     │ 90 dias     │     │ 2 anos      │     │ Após      │  │
│  │ necessário  │     │ detalhado   │     │ anonimizado │     │ retenção  │  │
│  └─────────────┘     └─────────────┘     └─────────────┘     └───────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Tabela de Retenção

| Tipo de Dado | Retenção Detalhada | Retenção Agregada | Após Retenção |
|--------------|--------------------|--------------------|---------------|
| Transações | 90 dias | 2 anos | Deletado |
| Ações pendentes | 30 dias | N/A | Deletado |
| Logs de sistema | 30 dias | N/A | Deletado |
| Dados de aluno | Enquanto ativo | N/A | Anonimizado |
| Regras | Enquanto ativo | N/A | Deletado |

---

## Jobs de Retenção

### Implementação

```typescript
// src/jobs/data-retention.job.ts

import { CronJob } from 'cron';
import { TransactionRepository } from '../repositories/transaction.repository';
import { AggregateRepository } from '../repositories/aggregate.repository';
import { EventRepository } from '../repositories/event.repository';

export class DataRetentionJob {
  constructor(
    private transactionRepo: TransactionRepository,
    private aggregateRepo: AggregateRepository,
    private eventRepo: EventRepository
  ) {}

  /**
   * Executa diariamente às 3:00 AM
   */
  schedule(): void {
    const job = new CronJob('0 3 * * *', async () => {
      console.log('[Retention] Starting data retention job');

      try {
        await this.archiveOldTransactions();
        await this.deleteExpiredActions();
        await this.deleteOldLogs();
        await this.anonymizeInactiveStudents();

        console.log('[Retention] Job completed successfully');
      } catch (error) {
        console.error('[Retention] Job failed:', error);
      }
    });

    job.start();
  }

  /**
   * Arquiva transações com mais de 90 dias
   */
  private async archiveOldTransactions(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    // 1. Agregar transações antigas
    const oldTransactions = await this.transactionRepo.findOlderThan(cutoffDate);

    for (const txn of oldTransactions) {
      // Criar/atualizar agregado mensal
      await this.aggregateRepo.upsertMonthlyAggregate({
        studentId: txn.studentId,
        month: txn.date.substring(0, 7), // YYYY-MM
        totalSpent: txn.amount,
        transactionCount: 1,
      });
    }

    // 2. Deletar transações detalhadas
    const deleted = await this.transactionRepo.deleteOlderThan(cutoffDate);

    console.log(`[Retention] Archived ${deleted} transactions`);
  }

  /**
   * Deleta ações pendentes expiradas
   */
  private async deleteExpiredActions(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const deleted = await this.actionRepo.deleteOlderThan(cutoffDate);

    console.log(`[Retention] Deleted ${deleted} expired actions`);
  }

  /**
   * Deleta logs antigos
   */
  private async deleteOldLogs(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const deleted = await this.eventRepo.deleteOlderThan(cutoffDate);

    console.log(`[Retention] Deleted ${deleted} old logs`);
  }

  /**
   * Anonimiza alunos inativos há mais de 1 ano
   */
  private async anonymizeInactiveStudents(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);

    const inactiveStudents = await this.studentRepo.findInactiveSince(cutoffDate);

    for (const student of inactiveStudents) {
      await this.studentRepo.anonymize(student.id);

      console.log(`[Retention] Anonymized student ${student.id}`);
    }
  }
}
```

### Anonimização

```typescript
// src/repositories/student.repository.ts

async anonymize(studentId: string): Promise<void> {
  const anonymizedData = {
    name: `Aluno Anonimizado ${studentId.substring(0, 8)}`,
    email: null,
    phone: null,
    photo_url: null,
    qr_code: null,
    nfc_tag: null,
    is_active: false,
    anonymized_at: new Date(),
  };

  await this.db.update('students', studentId, anonymizedData);

  // Também anonimiza regras
  await this.db.delete('student_rules', { student_id: studentId });

  // E vínculos com responsáveis
  await this.db.delete('guardian_students', { student_id: studentId });
}
```

---

## Direitos do Titular

### Endpoints LGPD

```typescript
// src/routes/lgpd.routes.ts

import { Router } from 'express';
import { LgpdController } from '../controllers/lgpd.controller';
import { requirePermission } from '../middleware/authorize.middleware';

const router = Router();
const controller = new LgpdController();

// Direito de Acesso
router.get(
  '/my-data',
  requirePermission('dashboard:view'),
  controller.exportMyData
);

// Direito de Retificação
router.patch(
  '/my-data',
  requirePermission('students:edit_rules'),
  controller.updateMyData
);

// Direito de Exclusão (portabilidade)
router.post(
  '/export',
  requirePermission('dashboard:view'),
  controller.requestExport
);

// Direito de Esquecimento
router.delete(
  '/my-data',
  requirePermission('dashboard:view'),
  controller.requestDeletion
);

export { router as lgpdRoutes };
```

### Controller LGPD

```typescript
// src/controllers/lgpd.controller.ts

export class LgpdController {
  /**
   * GET /lgpd/my-data
   * Exporta todos os dados do titular
   */
  async exportMyData(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;

    // Buscar todos os dados do usuário
    const userData = await this.lgpdService.collectUserData(userId);

    // Gerar arquivo JSON
    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: userData.user.id,
        email: userData.user.email,
        name: userData.user.name,
        createdAt: userData.user.createdAt,
      },
      students: userData.students.map(s => ({
        id: s.id,
        name: s.name,
        grade: s.grade,
        rules: s.rules,
        // Agregados, não transações individuais
        monthlyAggregates: s.aggregates,
      })),
      metadata: {
        format: 'JSON',
        version: '1.0',
        generatedBy: 'Super Cantina LGPD Export',
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="meus-dados-${userId}.json"`
    );
    res.json(exportData);
  }

  /**
   * DELETE /lgpd/my-data
   * Solicita exclusão dos dados
   */
  async requestDeletion(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;

    // Criar ticket de solicitação
    const ticket = await this.lgpdService.createDeletionRequest({
      userId,
      requestedAt: new Date(),
      reason: req.body.reason,
    });

    // Notificar DPO
    await this.notificationService.notifyDPO('DELETION_REQUEST', {
      userId,
      ticketId: ticket.id,
    });

    res.json({
      message: 'Solicitação de exclusão registrada',
      ticketId: ticket.id,
      estimatedCompletion: '15 dias úteis',
    });
  }
}
```

---

## Consentimento

### Coleta de Consentimento

```typescript
// src/services/consent.service.ts

interface ConsentRecord {
  userId: string;
  purpose: string;
  granted: boolean;
  grantedAt: Date;
  revokedAt?: Date;
  version: string;
  ipAddress: string;
}

export class ConsentService {
  /**
   * Registra consentimento
   */
  async grantConsent(
    userId: string,
    purpose: 'PHOTO_IDENTIFICATION' | 'DIETARY_DATA' | 'NOTIFICATIONS',
    ipAddress: string
  ): Promise<void> {
    await this.consentRepo.create({
      userId,
      purpose,
      granted: true,
      grantedAt: new Date(),
      version: CURRENT_CONSENT_VERSION,
      ipAddress,
    });

    // Log para auditoria
    this.auditLogger.log({
      action: 'CONSENT_GRANTED',
      userId,
      purpose,
      timestamp: new Date(),
    });
  }

  /**
   * Revoga consentimento
   */
  async revokeConsent(userId: string, purpose: string): Promise<void> {
    const consent = await this.consentRepo.findActive(userId, purpose);

    if (consent) {
      await this.consentRepo.update(consent.id, {
        revokedAt: new Date(),
      });

      // Executar ações de revogação
      await this.handleRevocation(userId, purpose);

      // Log para auditoria
      this.auditLogger.log({
        action: 'CONSENT_REVOKED',
        userId,
        purpose,
        timestamp: new Date(),
      });
    }
  }

  private async handleRevocation(userId: string, purpose: string): Promise<void> {
    switch (purpose) {
      case 'PHOTO_IDENTIFICATION':
        // Remover foto
        await this.studentRepo.removePhoto(userId);
        break;

      case 'NOTIFICATIONS':
        // Desabilitar notificações
        await this.userRepo.disableNotifications(userId);
        break;
    }
  }
}
```

---

## Logs de Auditoria

### Eventos Auditados

```typescript
// src/services/audit.service.ts

type AuditEventType =
  | 'DATA_ACCESS'       // Acesso a dados pessoais
  | 'DATA_EXPORT'       // Exportação de dados
  | 'DATA_UPDATE'       // Atualização de dados
  | 'DATA_DELETION'     // Exclusão de dados
  | 'CONSENT_GRANTED'   // Consentimento dado
  | 'CONSENT_REVOKED'   // Consentimento revogado
  | 'LOGIN'             // Acesso ao sistema
  | 'RULE_CHANGE';      // Alteração de regras

interface AuditEvent {
  id: string;
  type: AuditEventType;
  userId: string;
  targetId?: string;      // ID do recurso acessado
  description: string;
  metadata: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export class AuditService {
  async log(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    const auditEvent: AuditEvent = {
      id: uuidv4(),
      ...event,
      timestamp: new Date(),
    };

    // Persistir em banco imutável (append-only)
    await this.auditRepo.append(auditEvent);

    // Log estruturado
    console.log(JSON.stringify({
      level: 'audit',
      ...auditEvent,
    }));
  }

  async getAuditTrail(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AuditEvent[]> {
    return this.auditRepo.findByUser(userId, startDate, endDate);
  }
}
```

---

## Segurança dos Dados

### Criptografia

```typescript
// Dados sensíveis são criptografados em repouso

// Campos criptografados:
// - student.dietary_restrictions (quando marcado como sensível)
// - student.photo_url (referência)
// - guardian_student.relationship_document

// Implementação: ver 06-SEGURANCA/criptografia.md
```

### Anonimização em Logs

```typescript
// src/utils/log-sanitizer.ts

const SENSITIVE_FIELDS = ['email', 'phone', 'name', 'cpf', 'photo'];

export function sanitizeForLogging(data: any): any {
  if (!data) return data;

  if (typeof data === 'object') {
    const sanitized = { ...data };

    for (const field of SENSITIVE_FIELDS) {
      if (sanitized[field]) {
        sanitized[field] = maskSensitiveData(sanitized[field], field);
      }
    }

    return sanitized;
  }

  return data;
}

function maskSensitiveData(value: string, field: string): string {
  switch (field) {
    case 'email':
      const [local, domain] = value.split('@');
      return `${local[0]}***@${domain}`;
    case 'phone':
      return value.replace(/\d(?=\d{4})/g, '*');
    case 'name':
      return value.split(' ').map(n => `${n[0]}***`).join(' ');
    case 'cpf':
      return '***.***.***-**';
    default:
      return '***';
  }
}
```

---

## Responsável pelo Tratamento

### Informações Obrigatórias

```typescript
// src/config/lgpd.config.ts

export const LGPD_CONFIG = {
  controller: {
    name: '[Nome da Empresa]',
    cnpj: 'XX.XXX.XXX/0001-XX',
    address: 'Rua..., Cidade, Estado',
    dpo: {
      name: 'Nome do Encarregado',
      email: 'dpo@empresa.com.br',
      phone: '(11) 9999-9999',
    },
  },

  purposes: {
    PHOTO_IDENTIFICATION: {
      description: 'Identificação visual do aluno no ponto de venda',
      legalBasis: 'Consentimento',
      retention: 'Enquanto aluno estiver ativo',
    },
    DIETARY_DATA: {
      description: 'Registro de restrições alimentares para segurança',
      legalBasis: 'Legítimo interesse (saúde)',
      retention: 'Enquanto aluno estiver ativo',
    },
    TRANSACTION_DATA: {
      description: 'Registro de transações para controle financeiro',
      legalBasis: 'Execução de contrato',
      retention: '90 dias detalhado, 2 anos agregado',
    },
  },

  privacyPolicyUrl: 'https://supercantina.com/privacidade',
  termsUrl: 'https://supercantina.com/termos',
};
```

---

## Referências

- [Criptografia](./criptografia.md)
- [RBAC](./rbac.md)
- [Schema do Banco](../05-BANCO-DADOS/schema.md)
- [LGPD - Lei nº 13.709/2018](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
