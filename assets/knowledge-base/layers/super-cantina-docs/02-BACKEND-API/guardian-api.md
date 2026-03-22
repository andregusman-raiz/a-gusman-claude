# Guardian API - Portal do Responsável

## Visão Geral

A Guardian API fornece os endpoints consumidos pelo Portal do Responsável. Seguindo a filosofia de **UX invisível**, esta API retorna o mínimo necessário para renderizar os 3 estados do dashboard.

> **Princípio**: O responsável interage menos de 1x por semana com o app.

---

## Endpoints

### Dashboard Principal

```http
GET /api/v1/guardian/dashboard
Authorization: Bearer <layers_session_token>
X-Layers-Community: <community_id>
```

#### Response

```typescript
interface DashboardResponse {
  // Estado atual do dashboard (determina UI)
  state: 'NORMAL' | 'ATTENTION' | 'ACTION_REQUIRED';

  // Mensagem principal para exibição
  message: string;

  // Alunos vinculados ao responsável
  students: StudentSummary[];

  // Ações pendentes (se houver)
  pendingActions: PendingAction[];

  // Metadata para analytics
  metadata: {
    lastUpdate: string;
    cacheKey: string;
  };
}

interface StudentSummary {
  id: string;
  name: string;
  photoUrl?: string;
  grade: string;

  // Status atual (simplificado)
  status: 'OK' | 'LIMIT_REACHED' | 'HAS_RESTRICTION';

  // Resumo do dia (sem detalhes)
  todaySummary: {
    totalSpent: number;
    dailyLimit: number;
    remainingPercent: number;
  };
}

interface PendingAction {
  id: string;
  type: 'DIETARY_VIOLATION' | 'LIMIT_ADJUSTMENT' | 'RULE_CONFIRMATION';
  studentId: string;
  studentName: string;
  title: string;
  description: string;
  createdAt: string;
  expiresAt?: string;

  // Opções de resposta
  options: ActionOption[];
}

interface ActionOption {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'destructive';
  action: string; // Valor para enviar na resposta
}
```

#### Exemplo de Response - Estado NORMAL

```json
{
  "state": "NORMAL",
  "message": "Hoje está tudo certo",
  "students": [
    {
      "id": "student-123",
      "name": "Maria Silva",
      "photoUrl": "https://cdn.layers.education/...",
      "grade": "5º ano",
      "status": "OK",
      "todaySummary": {
        "totalSpent": 1500,
        "dailyLimit": 3000,
        "remainingPercent": 50
      }
    }
  ],
  "pendingActions": [],
  "metadata": {
    "lastUpdate": "2024-01-15T10:30:00Z",
    "cacheKey": "dash-guardian-abc123"
  }
}
```

#### Exemplo de Response - Estado ACTION_REQUIRED

```json
{
  "state": "ACTION_REQUIRED",
  "message": "Precisa da sua atenção",
  "students": [...],
  "pendingActions": [
    {
      "id": "action-456",
      "type": "DIETARY_VIOLATION",
      "studentId": "student-123",
      "studentName": "Maria Silva",
      "title": "Tentativa de compra bloqueada",
      "description": "Maria tentou comprar um item com lactose às 10:15",
      "createdAt": "2024-01-15T10:15:00Z",
      "expiresAt": "2024-01-15T18:00:00Z",
      "options": [
        {
          "id": "allow-once",
          "label": "Liberar só hoje",
          "type": "secondary",
          "action": "ALLOW_TODAY"
        },
        {
          "id": "keep-blocked",
          "label": "Manter bloqueio",
          "type": "primary",
          "action": "KEEP_BLOCKED"
        }
      ]
    }
  ],
  "metadata": {...}
}
```

---

### Responder Ação Pendente

```http
POST /api/v1/guardian/action/:actionId
Authorization: Bearer <layers_session_token>
Content-Type: application/json

{
  "response": "ALLOW_TODAY" | "KEEP_BLOCKED" | "ADJUST_LIMIT" | ...
}
```

#### Response

```json
{
  "success": true,
  "message": "Ação registrada com sucesso",
  "newState": "NORMAL"
}
```

---

### Obter Regras do Aluno

```http
GET /api/v1/guardian/students/:studentId/rules
Authorization: Bearer <layers_session_token>
```

#### Response

```typescript
interface StudentRulesResponse {
  studentId: string;
  studentName: string;

  // Limite diário
  dailyLimit: {
    amount: number;
    currency: 'BRL';
  };

  // Restrições alimentares
  dietaryRestrictions: DietaryRestriction[];

  // Categorias permitidas/bloqueadas
  categoryRules: CategoryRule[];

  // Horários permitidos
  timeRestrictions: TimeRestriction[];
}

interface DietaryRestriction {
  id: string;
  type: 'ALLERGY' | 'INTOLERANCE' | 'PREFERENCE';
  name: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  notifyOnViolation: boolean;
}

interface CategoryRule {
  category: string;
  allowed: boolean;
  maxPerDay?: number;
}

interface TimeRestriction {
  dayOfWeek: number[]; // 0-6 (domingo-sábado)
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
  allowed: boolean;
}
```

#### Exemplo

```json
{
  "studentId": "student-123",
  "studentName": "Maria Silva",
  "dailyLimit": {
    "amount": 3000,
    "currency": "BRL"
  },
  "dietaryRestrictions": [
    {
      "id": "restriction-1",
      "type": "INTOLERANCE",
      "name": "Lactose",
      "severity": "HIGH",
      "notifyOnViolation": true
    }
  ],
  "categoryRules": [
    {
      "category": "doces",
      "allowed": true,
      "maxPerDay": 1
    },
    {
      "category": "refrigerante",
      "allowed": false
    }
  ],
  "timeRestrictions": [
    {
      "dayOfWeek": [1, 2, 3, 4, 5],
      "startTime": "09:30",
      "endTime": "10:00",
      "allowed": true
    }
  ]
}
```

---

### Atualizar Regras do Aluno

```http
PATCH /api/v1/guardian/students/:studentId/rules
Authorization: Bearer <layers_session_token>
Content-Type: application/json
```

#### Request Body

```json
{
  "dailyLimit": {
    "amount": 3500
  },
  "dietaryRestrictions": [
    {
      "id": "restriction-1",
      "notifyOnViolation": false
    }
  ],
  "categoryRules": [
    {
      "category": "doces",
      "maxPerDay": 2
    }
  ]
}
```

#### Response

```json
{
  "success": true,
  "message": "Regras atualizadas com sucesso",
  "updatedAt": "2024-01-15T14:30:00Z"
}
```

---

### Listar Alunos Vinculados

```http
GET /api/v1/guardian/students
Authorization: Bearer <layers_session_token>
```

#### Response

```json
{
  "students": [
    {
      "id": "student-123",
      "name": "Maria Silva",
      "photoUrl": "https://...",
      "grade": "5º ano",
      "school": {
        "id": "school-1",
        "name": "Colégio São Paulo"
      },
      "hasRulesConfigured": true,
      "lastActivity": "2024-01-15T10:15:00Z"
    }
  ]
}
```

---

## Implementação

### GuardianController.ts

```typescript
// src/controllers/guardian.controller.ts

import { Request, Response } from 'express';
import { GuardianService } from '../services/guardian.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class GuardianController {
  constructor(private guardianService: GuardianService) {}

  /**
   * GET /guardian/dashboard
   * Retorna estado do dashboard para o responsável
   */
  async getDashboard(req: AuthenticatedRequest, res: Response) {
    const { id: guardianId, communityId } = req.user;

    const dashboard = await this.guardianService.getDashboard(
      guardianId,
      communityId
    );

    res.json(dashboard);
  }

  /**
   * POST /guardian/action/:actionId
   * Processa resposta a uma ação pendente
   */
  async respondToAction(req: AuthenticatedRequest, res: Response) {
    const { actionId } = req.params;
    const { response } = req.body;
    const { id: guardianId } = req.user;

    const result = await this.guardianService.respondToAction(
      guardianId,
      actionId,
      response
    );

    res.json(result);
  }

  /**
   * GET /guardian/students/:studentId/rules
   * Obtém regras configuradas para um aluno
   */
  async getStudentRules(req: AuthenticatedRequest, res: Response) {
    const { studentId } = req.params;
    const { id: guardianId } = req.user;

    // Verificar vínculo guardião-aluno
    await this.guardianService.verifyGuardianship(guardianId, studentId);

    const rules = await this.guardianService.getStudentRules(studentId);

    res.json(rules);
  }

  /**
   * PATCH /guardian/students/:studentId/rules
   * Atualiza regras de um aluno
   */
  async updateStudentRules(req: AuthenticatedRequest, res: Response) {
    const { studentId } = req.params;
    const { id: guardianId } = req.user;
    const updates = req.body;

    // Verificar vínculo e permissão
    await this.guardianService.verifyGuardianship(guardianId, studentId);

    const result = await this.guardianService.updateStudentRules(
      studentId,
      updates
    );

    res.json(result);
  }

  /**
   * GET /guardian/students
   * Lista alunos vinculados ao responsável
   */
  async listStudents(req: AuthenticatedRequest, res: Response) {
    const { id: guardianId, communityId } = req.user;

    const students = await this.guardianService.listStudents(
      guardianId,
      communityId
    );

    res.json({ students });
  }
}
```

### GuardianService.ts

```typescript
// src/services/guardian.service.ts

import { Redis } from 'ioredis';
import { StudentRepository } from '../repositories/student.repository';
import { RulesRepository } from '../repositories/rules.repository';
import { ActionRepository } from '../repositories/action.repository';
import { AggregateRepository } from '../repositories/aggregate.repository';
import { EventEmitter } from '../events/emitter';
import { ForbiddenError, NotFoundError } from '../errors';

type DashboardState = 'NORMAL' | 'ATTENTION' | 'ACTION_REQUIRED';

export class GuardianService {
  private readonly CACHE_TTL = 60; // 1 minuto

  constructor(
    private redis: Redis,
    private studentRepo: StudentRepository,
    private rulesRepo: RulesRepository,
    private actionRepo: ActionRepository,
    private aggregateRepo: AggregateRepository,
    private eventEmitter: EventEmitter
  ) {}

  /**
   * Obtém dashboard do responsável
   * Implementa lógica dos 3 estados UX
   */
  async getDashboard(guardianId: string, communityId: string) {
    // Verificar cache
    const cacheKey = `dashboard:${guardianId}:${communityId}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Buscar alunos vinculados
    const students = await this.studentRepo.findByGuardian(
      guardianId,
      communityId
    );

    // Buscar ações pendentes
    const pendingActions = await this.actionRepo.findPendingByGuardian(
      guardianId
    );

    // Buscar agregados do dia
    const today = new Date().toISOString().split('T')[0];
    const aggregates = await this.aggregateRepo.findByStudentsAndDate(
      students.map(s => s.id),
      today
    );

    // Montar resumo de cada aluno
    const studentSummaries = students.map(student => {
      const agg = aggregates.find(a => a.studentId === student.id);
      const rules = student.rules;

      return {
        id: student.id,
        name: student.name,
        photoUrl: student.photoUrl,
        grade: student.grade,
        status: this.determineStudentStatus(student, agg),
        todaySummary: {
          totalSpent: agg?.totalSpent || 0,
          dailyLimit: rules?.dailyLimit || 0,
          remainingPercent: this.calculateRemainingPercent(agg, rules),
        },
      };
    });

    // Determinar estado do dashboard
    const state = this.determineDashboardState(studentSummaries, pendingActions);
    const message = this.getStateMessage(state);

    const dashboard = {
      state,
      message,
      students: studentSummaries,
      pendingActions: this.formatPendingActions(pendingActions),
      metadata: {
        lastUpdate: new Date().toISOString(),
        cacheKey,
      },
    };

    // Cachear resultado
    await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(dashboard));

    return dashboard;
  }

  /**
   * Processa resposta a uma ação pendente
   */
  async respondToAction(
    guardianId: string,
    actionId: string,
    response: string
  ) {
    const action = await this.actionRepo.findById(actionId);

    if (!action) {
      throw new NotFoundError('Ação não encontrada');
    }

    // Verificar se responsável tem permissão
    if (action.guardianId !== guardianId) {
      throw new ForbiddenError('Sem permissão para esta ação');
    }

    // Verificar se ação ainda está pendente
    if (action.status !== 'PENDING') {
      throw new Error('Ação já foi processada');
    }

    // Processar resposta
    await this.actionRepo.update(actionId, {
      status: 'RESOLVED',
      response,
      resolvedAt: new Date(),
    });

    // Executar ação específica
    await this.executeActionResponse(action, response);

    // Emitir evento
    this.eventEmitter.emit('action.resolved', {
      actionId,
      guardianId,
      response,
      timestamp: new Date(),
    });

    // Invalidar cache do dashboard
    await this.invalidateDashboardCache(guardianId);

    // Determinar novo estado
    const pendingCount = await this.actionRepo.countPendingByGuardian(guardianId);
    const newState: DashboardState = pendingCount > 0 ? 'ACTION_REQUIRED' : 'NORMAL';

    return {
      success: true,
      message: 'Ação registrada com sucesso',
      newState,
    };
  }

  /**
   * Verifica vínculo responsável-aluno
   */
  async verifyGuardianship(guardianId: string, studentId: string) {
    const hasLink = await this.studentRepo.hasGuardian(studentId, guardianId);

    if (!hasLink) {
      throw new ForbiddenError('Sem vínculo com este aluno');
    }
  }

  /**
   * Obtém regras de um aluno
   */
  async getStudentRules(studentId: string) {
    const student = await this.studentRepo.findById(studentId);

    if (!student) {
      throw new NotFoundError('Aluno não encontrado');
    }

    const rules = await this.rulesRepo.findByStudent(studentId);
    const restrictions = await this.rulesRepo.findDietaryRestrictions(studentId);

    return {
      studentId,
      studentName: student.name,
      dailyLimit: {
        amount: rules?.dailyLimit || 0,
        currency: 'BRL',
      },
      dietaryRestrictions: restrictions,
      categoryRules: rules?.categoryRules || [],
      timeRestrictions: rules?.timeRestrictions || [],
    };
  }

  /**
   * Atualiza regras de um aluno
   */
  async updateStudentRules(studentId: string, updates: any) {
    await this.rulesRepo.update(studentId, updates);

    // Emitir evento para invalidar caches
    this.eventEmitter.emit('rules.updated', {
      studentId,
      updates,
      timestamp: new Date(),
    });

    return {
      success: true,
      message: 'Regras atualizadas com sucesso',
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Lista alunos vinculados
   */
  async listStudents(guardianId: string, communityId: string) {
    return this.studentRepo.findByGuardian(guardianId, communityId);
  }

  // --- Métodos auxiliares ---

  private determineDashboardState(
    students: any[],
    actions: any[]
  ): DashboardState {
    // Se há ações pendentes, estado é ACTION_REQUIRED
    if (actions.length > 0) {
      return 'ACTION_REQUIRED';
    }

    // Se algum aluno atingiu limite, estado é ATTENTION
    const hasLimitReached = students.some(s => s.status === 'LIMIT_REACHED');
    if (hasLimitReached) {
      return 'ATTENTION';
    }

    // Caso contrário, estado NORMAL
    return 'NORMAL';
  }

  private getStateMessage(state: DashboardState): string {
    switch (state) {
      case 'NORMAL':
        return 'Hoje está tudo certo';
      case 'ATTENTION':
        return 'Limite atingido, sistema resolveu';
      case 'ACTION_REQUIRED':
        return 'Precisa da sua atenção';
    }
  }

  private determineStudentStatus(student: any, aggregate: any): string {
    if (!aggregate) return 'OK';

    const limit = student.rules?.dailyLimit || 0;
    if (aggregate.totalSpent >= limit) {
      return 'LIMIT_REACHED';
    }

    return 'OK';
  }

  private calculateRemainingPercent(aggregate: any, rules: any): number {
    if (!rules?.dailyLimit) return 100;
    if (!aggregate?.totalSpent) return 100;

    const remaining = rules.dailyLimit - aggregate.totalSpent;
    return Math.max(0, Math.round((remaining / rules.dailyLimit) * 100));
  }

  private formatPendingActions(actions: any[]) {
    return actions.map(action => ({
      id: action.id,
      type: action.type,
      studentId: action.studentId,
      studentName: action.student?.name,
      title: action.title,
      description: action.description,
      createdAt: action.createdAt,
      expiresAt: action.expiresAt,
      options: this.getActionOptions(action.type),
    }));
  }

  private getActionOptions(actionType: string) {
    switch (actionType) {
      case 'DIETARY_VIOLATION':
        return [
          { id: 'allow-once', label: 'Liberar só hoje', type: 'secondary', action: 'ALLOW_TODAY' },
          { id: 'keep-blocked', label: 'Manter bloqueio', type: 'primary', action: 'KEEP_BLOCKED' },
        ];
      case 'LIMIT_ADJUSTMENT':
        return [
          { id: 'increase', label: 'Aumentar limite', type: 'primary', action: 'INCREASE_LIMIT' },
          { id: 'keep', label: 'Manter limite', type: 'secondary', action: 'KEEP_LIMIT' },
        ];
      default:
        return [
          { id: 'confirm', label: 'Confirmar', type: 'primary', action: 'CONFIRM' },
          { id: 'dismiss', label: 'Ignorar', type: 'secondary', action: 'DISMISS' },
        ];
    }
  }

  private async executeActionResponse(action: any, response: string) {
    switch (action.type) {
      case 'DIETARY_VIOLATION':
        if (response === 'ALLOW_TODAY') {
          await this.rulesRepo.addTemporaryException(action.studentId, {
            type: 'dietary',
            expiresAt: this.endOfDay(),
          });
        }
        break;

      case 'LIMIT_ADJUSTMENT':
        if (response === 'INCREASE_LIMIT') {
          const currentLimit = await this.rulesRepo.getDailyLimit(action.studentId);
          await this.rulesRepo.update(action.studentId, {
            dailyLimit: Math.round(currentLimit * 1.2), // +20%
          });
        }
        break;
    }
  }

  private async invalidateDashboardCache(guardianId: string) {
    const pattern = `dashboard:${guardianId}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  private endOfDay(): Date {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return end;
  }
}
```

---

## Cache Strategy

| Endpoint | TTL | Invalidação |
|----------|-----|-------------|
| `/dashboard` | 60s | Ao responder ação, ao atualizar regras |
| `/students/:id/rules` | 5min | Ao atualizar regras |
| `/students` | 10min | Ao vincular/desvincular aluno |

---

## Métricas

```typescript
// Métricas Prometheus

// Latência do dashboard
guardian_dashboard_latency_seconds{state="NORMAL|ATTENTION|ACTION_REQUIRED"}

// Ações pendentes por guardião
guardian_pending_actions_count{guardian_id}

// Taxa de resposta a ações
guardian_action_response_rate{action_type, response}

// Cache hit rate
guardian_cache_hit_rate{endpoint}
```

---

## Testes

```typescript
// src/services/__tests__/guardian.service.test.ts

describe('GuardianService', () => {
  describe('getDashboard', () => {
    it('deve retornar NORMAL quando não há ações pendentes', async () => {
      // Setup mocks...
      mockActionRepo.findPendingByGuardian.mockResolvedValue([]);

      const result = await service.getDashboard('guardian-1', 'community-1');

      expect(result.state).toBe('NORMAL');
      expect(result.message).toBe('Hoje está tudo certo');
    });

    it('deve retornar ACTION_REQUIRED quando há ações pendentes', async () => {
      mockActionRepo.findPendingByGuardian.mockResolvedValue([
        { id: 'action-1', type: 'DIETARY_VIOLATION', ... }
      ]);

      const result = await service.getDashboard('guardian-1', 'community-1');

      expect(result.state).toBe('ACTION_REQUIRED');
      expect(result.pendingActions).toHaveLength(1);
    });
  });
});
```

---

## Referências

- [Decision Engine](./decision-engine.md)
- [Autenticação](./autenticacao.md)
- [State Machine Frontend](../03-FRONTEND/state-machine.md)
