# Decision Engine Local - PDV

## Visão Geral

O PDV implementa uma versão local do Decision Engine que funciona **completamente offline**. Utiliza regras cacheadas do servidor para tomar decisões em tempo real.

> **Garantia**: Decisões locais devem ser idênticas às do servidor quando usando mesmas regras.

---

## Decisões Possíveis

| Decisão | Significado | Registra Transação? | Notifica? |
|---------|-------------|---------------------|-----------|
| `ALLOW` | Compra permitida | Sim | Não |
| `BLOCK_SILENT` | Bloqueio por limite | Não | Não |
| `BLOCK_NOTIFY_PARENT` | Bloqueio por restrição | Não | Sim (queue) |

---

## Chain of Responsibility

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DECISION CHAIN - LOCAL                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐                                                         │
│  │    Request      │                                                         │
│  │                 │                                                         │
│  │ • studentId     │                                                         │
│  │ • amount        │                                                         │
│  │ • category      │                                                         │
│  │ • items         │                                                         │
│  │ • timestamp     │                                                         │
│  └────────┬────────┘                                                         │
│           │                                                                  │
│           ▼                                                                  │
│  ┌─────────────────┐     ┌─────────────────┐                                 │
│  │ 1. Student      │────►│ Aluno existe?   │                                 │
│  │    Validator    │     │ Está ativo?     │                                 │
│  └────────┬────────┘     └─────────────────┘                                 │
│           │                                                                  │
│           ▼                                                                  │
│  ┌─────────────────┐     ┌─────────────────┐                                 │
│  │ 2. Dietary      │────►│ Alérgenos nos   │──► BLOCK_NOTIFY_PARENT          │
│  │    Checker      │     │ itens?          │                                 │
│  └────────┬────────┘     └─────────────────┘                                 │
│           │                                                                  │
│           ▼                                                                  │
│  ┌─────────────────┐     ┌─────────────────┐                                 │
│  │ 3. Category     │────►│ Categoria       │──► BLOCK_SILENT                 │
│  │    Checker      │     │ bloqueada?      │                                 │
│  └────────┬────────┘     └─────────────────┘                                 │
│           │                                                                  │
│           ▼                                                                  │
│  ┌─────────────────┐     ┌─────────────────┐                                 │
│  │ 4. Time         │────►│ Horário         │──► BLOCK_SILENT                 │
│  │    Checker      │     │ permitido?      │                                 │
│  └────────┬────────┘     └─────────────────┘                                 │
│           │                                                                  │
│           ▼                                                                  │
│  ┌─────────────────┐     ┌─────────────────┐                                 │
│  │ 5. Limit        │────►│ Limite diário   │──► BLOCK_SILENT                 │
│  │    Checker      │     │ excedido?       │                                 │
│  └────────┬────────┘     └─────────────────┘                                 │
│           │                                                                  │
│           ▼                                                                  │
│  ┌─────────────────┐     ┌─────────────────┐                                 │
│  │ 6. Category     │────►│ Max por         │──► BLOCK_SILENT                 │
│  │    Limit        │     │ categoria?      │                                 │
│  └────────┬────────┘     └─────────────────┘                                 │
│           │                                                                  │
│           ▼                                                                  │
│  ┌─────────────────┐                                                         │
│  │     ALLOW       │                                                         │
│  └─────────────────┘                                                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementação

### Decision Service

```typescript
// src/services/decision.service.ts

import { DatabaseService } from '../database/sqlite';

interface DecisionContext {
  studentId: string;
  amount: number;
  itemCategory: string;
  items?: ItemDetail[];
  timestamp: Date;
}

interface ItemDetail {
  sku: string;
  name: string;
  category: string;
  allergens?: string[];
}

interface DecisionResult {
  decision: 'ALLOW' | 'BLOCK_SILENT' | 'BLOCK_NOTIFY_PARENT';
  transactionId: string;
  decisionSource: 'LOCAL_CACHE' | 'LOCAL_FALLBACK';
  metadata: {
    studentName: string;
    dailySpent: number;
    dailyLimit: number;
    remainingToday: number;
  };
  blockReason?: {
    code: string;
    message: string;
    displayMessage: string;
  };
}

export class LocalDecisionService {
  private readonly chain: DecisionRule[];

  constructor(private database: DatabaseService) {
    // Configurar chain de regras
    this.chain = [
      new StudentValidator(database),
      new DietaryChecker(database),
      new CategoryChecker(database),
      new TimeChecker(),
      new DailyLimitChecker(database),
      new CategoryLimitChecker(database),
    ];
  }

  async evaluate(context: DecisionContext): Promise<DecisionResult> {
    const startTime = Date.now();

    // Carregar dados do aluno
    const student = await this.database.findStudentById(context.studentId);

    if (!student) {
      return this.createBlockResult(context, {
        code: 'STUDENT_NOT_FOUND',
        message: 'Aluno não encontrado no cache local',
        displayMessage: 'Aluno não encontrado',
      });
    }

    // Carregar agregado do dia
    const today = context.timestamp.toISOString().split('T')[0];
    const aggregate = await this.database.getOrCreateAggregate(
      context.studentId,
      today
    );

    // Contexto enriquecido para as regras
    const enrichedContext = {
      ...context,
      student,
      rules: student.rules,
      aggregate,
      today,
    };

    // Executar chain de regras
    for (const rule of this.chain) {
      const result = await rule.check(enrichedContext);

      if (result.blocked) {
        console.log(`[Decision] Blocked by ${rule.name}: ${result.reason?.code}`);

        return this.createBlockResult(context, result.reason!, {
          student,
          aggregate,
        });
      }
    }

    // Todas as regras passaram - ALLOW
    const transactionId = this.generateTransactionId();
    const dailyLimit = student.rules?.dailyLimit || 0;
    const remaining = Math.max(0, dailyLimit - aggregate.totalSpent - context.amount);

    console.log(`[Decision] ALLOW in ${Date.now() - startTime}ms`);

    return {
      decision: 'ALLOW',
      transactionId,
      decisionSource: 'LOCAL_CACHE',
      metadata: {
        studentName: student.name,
        dailySpent: aggregate.totalSpent + context.amount,
        dailyLimit,
        remainingToday: remaining,
      },
    };
  }

  /**
   * Fallback para quando não há cache
   */
  async evaluateFallback(context: DecisionContext): Promise<DecisionResult> {
    // Comportamento configurável: ALLOW_CONSERVATIVE ou BLOCK_ALL
    const behavior = await this.database.getConfig('fallback_behavior');

    if (behavior === 'BLOCK_ALL') {
      return {
        decision: 'BLOCK_SILENT',
        transactionId: this.generateTransactionId(),
        decisionSource: 'LOCAL_FALLBACK',
        metadata: {
          studentName: 'Desconhecido',
          dailySpent: 0,
          dailyLimit: 0,
          remainingToday: 0,
        },
        blockReason: {
          code: 'NO_CACHE',
          message: 'Sem dados em cache, configurado para bloquear',
          displayMessage: 'Sistema offline - tente novamente',
        },
      };
    }

    // ALLOW_CONSERVATIVE: permite até um limite seguro
    const CONSERVATIVE_LIMIT = 2000; // R$ 20,00

    if (context.amount > CONSERVATIVE_LIMIT) {
      return {
        decision: 'BLOCK_SILENT',
        transactionId: this.generateTransactionId(),
        decisionSource: 'LOCAL_FALLBACK',
        metadata: {
          studentName: 'Desconhecido',
          dailySpent: 0,
          dailyLimit: CONSERVATIVE_LIMIT,
          remainingToday: 0,
        },
        blockReason: {
          code: 'CONSERVATIVE_LIMIT',
          message: 'Valor acima do limite conservador',
          displayMessage: 'Valor máximo offline: R$ 20,00',
        },
      };
    }

    // Permitir com flag de fallback
    return {
      decision: 'ALLOW',
      transactionId: this.generateTransactionId(),
      decisionSource: 'LOCAL_FALLBACK',
      metadata: {
        studentName: 'Aluno',
        dailySpent: context.amount,
        dailyLimit: CONSERVATIVE_LIMIT,
        remainingToday: CONSERVATIVE_LIMIT - context.amount,
      },
    };
  }

  private createBlockResult(
    context: DecisionContext,
    reason: BlockReason,
    data?: { student: any; aggregate: any }
  ): DecisionResult {
    const isNotify = reason.code.includes('DIETARY') || reason.code.includes('ALLERGY');

    return {
      decision: isNotify ? 'BLOCK_NOTIFY_PARENT' : 'BLOCK_SILENT',
      transactionId: this.generateTransactionId(),
      decisionSource: 'LOCAL_CACHE',
      metadata: {
        studentName: data?.student?.name || 'Aluno',
        dailySpent: data?.aggregate?.totalSpent || 0,
        dailyLimit: data?.student?.rules?.dailyLimit || 0,
        remainingToday: 0,
      },
      blockReason: reason,
    };
  }

  private generateTransactionId(): string {
    return `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

---

## Regras Individuais

### Interface Base

```typescript
// src/services/decision-rules/base.ts

interface RuleContext {
  studentId: string;
  amount: number;
  itemCategory: string;
  items?: ItemDetail[];
  timestamp: Date;
  student: Student;
  rules: StudentRules;
  aggregate: DailyAggregate;
  today: string;
}

interface RuleResult {
  blocked: boolean;
  reason?: BlockReason;
}

interface BlockReason {
  code: string;
  message: string;
  displayMessage: string;
}

abstract class DecisionRule {
  abstract name: string;
  abstract check(context: RuleContext): Promise<RuleResult>;

  protected pass(): RuleResult {
    return { blocked: false };
  }

  protected block(reason: BlockReason): RuleResult {
    return { blocked: true, reason };
  }
}
```

### Student Validator

```typescript
// src/services/decision-rules/student-validator.ts

export class StudentValidator extends DecisionRule {
  name = 'StudentValidator';

  async check(context: RuleContext): Promise<RuleResult> {
    if (!context.student) {
      return this.block({
        code: 'STUDENT_NOT_FOUND',
        message: 'Aluno não encontrado',
        displayMessage: 'Aluno não cadastrado',
      });
    }

    if (context.student.isBlocked) {
      return this.block({
        code: 'STUDENT_BLOCKED',
        message: 'Aluno bloqueado',
        displayMessage: 'Aluno com restrição de compra',
      });
    }

    return this.pass();
  }
}
```

### Dietary Checker

```typescript
// src/services/decision-rules/dietary-checker.ts

export class DietaryChecker extends DecisionRule {
  name = 'DietaryChecker';

  async check(context: RuleContext): Promise<RuleResult> {
    const restrictions = context.rules?.dietaryRestrictions || [];

    if (restrictions.length === 0) {
      return this.pass();
    }

    // Verificar alérgenos nos itens
    for (const item of context.items || []) {
      for (const allergen of item.allergens || []) {
        if (restrictions.includes(allergen.toLowerCase())) {
          return this.block({
            code: 'DIETARY_RESTRICTION',
            message: `Item contém ${allergen} - aluno tem restrição`,
            displayMessage: `Restrição alimentar: ${allergen}`,
          });
        }
      }
    }

    return this.pass();
  }
}
```

### Category Checker

```typescript
// src/services/decision-rules/category-checker.ts

export class CategoryChecker extends DecisionRule {
  name = 'CategoryChecker';

  async check(context: RuleContext): Promise<RuleResult> {
    const blockedCategories = context.rules?.blockedCategories || [];

    if (blockedCategories.includes(context.itemCategory)) {
      return this.block({
        code: 'CATEGORY_BLOCKED',
        message: `Categoria ${context.itemCategory} bloqueada`,
        displayMessage: 'Categoria não permitida',
      });
    }

    return this.pass();
  }
}
```

### Time Checker

```typescript
// src/services/decision-rules/time-checker.ts

export class TimeChecker extends DecisionRule {
  name = 'TimeChecker';

  async check(context: RuleContext): Promise<RuleResult> {
    const timeWindows = context.rules?.timeWindows || [];

    // Se não há restrições de horário, permitir
    if (timeWindows.length === 0) {
      return this.pass();
    }

    const now = context.timestamp;
    const dayOfWeek = now.getDay(); // 0-6
    const currentTime = this.formatTime(now);

    // Verificar se está em alguma janela permitida
    const isAllowed = timeWindows.some(window => {
      // Verificar dia da semana
      if (!window.dayOfWeek.includes(dayOfWeek)) {
        return false;
      }

      // Verificar horário
      return currentTime >= window.startTime && currentTime <= window.endTime;
    });

    if (!isAllowed) {
      return this.block({
        code: 'TIME_RESTRICTION',
        message: 'Fora do horário permitido',
        displayMessage: 'Horário não permitido para compras',
      });
    }

    return this.pass();
  }

  private formatTime(date: Date): string {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
}
```

### Daily Limit Checker

```typescript
// src/services/decision-rules/daily-limit-checker.ts

export class DailyLimitChecker extends DecisionRule {
  name = 'DailyLimitChecker';

  async check(context: RuleContext): Promise<RuleResult> {
    const dailyLimit = context.rules?.dailyLimit || 0;

    // Se não há limite configurado, permitir
    if (dailyLimit === 0) {
      return this.pass();
    }

    const totalAfterPurchase = context.aggregate.totalSpent + context.amount;

    if (totalAfterPurchase > dailyLimit) {
      const remaining = dailyLimit - context.aggregate.totalSpent;

      return this.block({
        code: 'DAILY_LIMIT_EXCEEDED',
        message: `Limite diário excedido. Restam R$ ${(remaining / 100).toFixed(2)}`,
        displayMessage: `Limite diário atingido`,
      });
    }

    return this.pass();
  }
}
```

### Category Limit Checker

```typescript
// src/services/decision-rules/category-limit-checker.ts

export class CategoryLimitChecker extends DecisionRule {
  name = 'CategoryLimitChecker';

  constructor(private database: DatabaseService) {
    super();
  }

  async check(context: RuleContext): Promise<RuleResult> {
    const maxPerCategory = context.rules?.maxItemsPerCategory || {};
    const category = context.itemCategory;

    // Se não há limite para esta categoria, permitir
    if (!maxPerCategory[category]) {
      return this.pass();
    }

    const limit = maxPerCategory[category];

    // Contar quantos itens desta categoria já foram comprados hoje
    const categoryBreakdown = context.aggregate.categoryBreakdown || {};
    const currentCount = Object.entries(categoryBreakdown)
      .filter(([cat]) => cat === category)
      .reduce((sum, [, count]) => sum + count, 0);

    if (currentCount >= limit) {
      return this.block({
        code: 'CATEGORY_LIMIT_EXCEEDED',
        message: `Máximo de ${limit} ${category}(s) por dia atingido`,
        displayMessage: `Limite de ${category} atingido`,
      });
    }

    return this.pass();
  }
}
```

---

## Uso no PDV

```typescript
// src/components/checkout/Checkout.tsx

import { useCallback, useState } from 'react';
import { LocalDecisionService } from '../../services/decision.service';

export function Checkout({ student, items }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<DecisionResult | null>(null);

  const decisionService = useMemo(() => new LocalDecisionService(database), []);

  const handleCheckout = useCallback(async () => {
    setIsProcessing(true);

    try {
      const totalAmount = items.reduce((sum, item) => sum + item.price, 0);

      const decision = await decisionService.evaluate({
        studentId: student.id,
        amount: totalAmount,
        itemCategory: items[0].category, // Categoria principal
        items,
        timestamp: new Date(),
      });

      setResult(decision);

      if (decision.decision === 'ALLOW') {
        // Registrar transação local
        await database.createTransaction({
          id: decision.transactionId,
          localId: decision.transactionId,
          studentId: student.id,
          amount: totalAmount,
          itemCategory: items[0].category,
          items,
          decision: decision.decision,
          decisionSource: decision.decisionSource,
          rulesVersion: student.rulesVersion,
          evaluatedAt: new Date(),
        });

        // Atualizar agregado local
        await database.updateAggregate(
          student.id,
          new Date().toISOString().split('T')[0],
          totalAmount,
          items[0].category
        );

        // Adicionar à fila de sync
        await database.addToSyncQueue('TRANSACTION', decision);
      } else if (decision.decision === 'BLOCK_NOTIFY_PARENT') {
        // Adicionar notificação à fila de sync
        await database.addToSyncQueue('NOTIFICATION', {
          studentId: student.id,
          reason: decision.blockReason,
          timestamp: new Date(),
        }, 1); // Prioridade alta
      }
    } finally {
      setIsProcessing(false);
    }
  }, [student, items, decisionService]);

  // ...
}
```

---

## Testes

```typescript
// src/services/__tests__/decision.service.test.ts

describe('LocalDecisionService', () => {
  let service: LocalDecisionService;
  let mockDatabase: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    mockDatabase = createMockDatabase();
    service = new LocalDecisionService(mockDatabase);
  });

  describe('evaluate', () => {
    it('deve permitir compra dentro do limite', async () => {
      mockDatabase.findStudentById.mockResolvedValue({
        id: 'student-1',
        name: 'João',
        rules: { dailyLimit: 5000 },
      });

      mockDatabase.getOrCreateAggregate.mockResolvedValue({
        totalSpent: 2000,
        transactionCount: 1,
      });

      const result = await service.evaluate({
        studentId: 'student-1',
        amount: 1500,
        itemCategory: 'lanche',
        timestamp: new Date(),
      });

      expect(result.decision).toBe('ALLOW');
      expect(result.metadata.remainingToday).toBe(1500);
    });

    it('deve bloquear silenciosamente quando limite excedido', async () => {
      mockDatabase.findStudentById.mockResolvedValue({
        id: 'student-1',
        name: 'João',
        rules: { dailyLimit: 3000 },
      });

      mockDatabase.getOrCreateAggregate.mockResolvedValue({
        totalSpent: 2500,
        transactionCount: 2,
      });

      const result = await service.evaluate({
        studentId: 'student-1',
        amount: 1000,
        itemCategory: 'lanche',
        timestamp: new Date(),
      });

      expect(result.decision).toBe('BLOCK_SILENT');
      expect(result.blockReason?.code).toBe('DAILY_LIMIT_EXCEEDED');
    });

    it('deve notificar pai quando restrição alimentar violada', async () => {
      mockDatabase.findStudentById.mockResolvedValue({
        id: 'student-1',
        name: 'Maria',
        rules: {
          dailyLimit: 5000,
          dietaryRestrictions: ['lactose'],
        },
      });

      mockDatabase.getOrCreateAggregate.mockResolvedValue({
        totalSpent: 0,
        transactionCount: 0,
      });

      const result = await service.evaluate({
        studentId: 'student-1',
        amount: 500,
        itemCategory: 'lanche',
        items: [{ sku: '123', name: 'Iogurte', category: 'lanche', allergens: ['lactose'] }],
        timestamp: new Date(),
      });

      expect(result.decision).toBe('BLOCK_NOTIFY_PARENT');
      expect(result.blockReason?.code).toBe('DIETARY_RESTRICTION');
    });
  });
});
```

---

## Referências

- [Arquitetura Offline](./arquitetura-offline.md)
- [Decision Engine Server](../02-BACKEND-API/decision-engine.md)
- [Sincronização](./sincronizacao.md)
