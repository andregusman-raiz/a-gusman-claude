# RBAC - Controle de Acesso Baseado em Roles

## Visão Geral

O Super Cantina implementa um sistema de **Role-Based Access Control (RBAC)** com 4 roles principais, cada um com permissões específicas.

---

## Roles do Sistema

| Role | Descrição | Fonte |
|------|-----------|-------|
| `guardian` | Responsável por aluno(s) | Layers SSO |
| `operator` | Operador da cantina (caixa) | Configuração escola |
| `admin` | Administrador da escola | Layers SSO |
| `super_admin` | Administrador do sistema | Configuração interna |

---

## Matriz de Permissões

### Portal do Responsável

| Recurso | guardian | operator | admin | super_admin |
|---------|----------|----------|-------|-------------|
| Ver dashboard próprio | ✅ | ❌ | ✅ | ✅ |
| Ver alunos vinculados | ✅ | ❌ | ✅ | ✅ |
| Editar regras do aluno | ✅ | ❌ | ✅ | ✅ |
| Responder ações pendentes | ✅ | ❌ | ✅ | ✅ |
| Ver histórico agregado | ✅ | ❌ | ✅ | ✅ |

### PDV

| Recurso | guardian | operator | admin | super_admin |
|---------|----------|----------|-------|-------------|
| Realizar vendas | ❌ | ✅ | ✅ | ✅ |
| Identificar alunos | ❌ | ✅ | ✅ | ✅ |
| Cancelar transações | ❌ | ✅ | ✅ | ✅ |
| Ver relatório do turno | ❌ | ✅ | ✅ | ✅ |

### Administração

| Recurso | guardian | operator | admin | super_admin |
|---------|----------|----------|-------|-------------|
| Gerenciar operadores | ❌ | ❌ | ✅ | ✅ |
| Gerenciar dispositivos PDV | ❌ | ❌ | ✅ | ✅ |
| Ver relatórios da escola | ❌ | ❌ | ✅ | ✅ |
| Configurar regras globais | ❌ | ❌ | ✅ | ✅ |
| Ver logs de auditoria | ❌ | ❌ | ✅ | ✅ |

### Super Administração

| Recurso | guardian | operator | admin | super_admin |
|---------|----------|----------|-------|-------------|
| Gerenciar escolas | ❌ | ❌ | ❌ | ✅ |
| Acessar qualquer escola | ❌ | ❌ | ❌ | ✅ |
| Ver métricas globais | ❌ | ❌ | ❌ | ✅ |
| Configurações do sistema | ❌ | ❌ | ❌ | ✅ |

---

## Implementação

### Definição de Permissões

```typescript
// src/auth/permissions.ts

export const PERMISSIONS = {
  // Dashboard
  'dashboard:view': 'Ver dashboard',
  'dashboard:view_all': 'Ver dashboard de qualquer aluno',

  // Students
  'students:view': 'Ver alunos vinculados',
  'students:view_all': 'Ver todos os alunos da escola',
  'students:edit_rules': 'Editar regras do aluno',

  // Actions
  'actions:respond': 'Responder ações pendentes',
  'actions:view_all': 'Ver todas as ações pendentes',

  // PDV
  'pdv:operate': 'Operar PDV',
  'pdv:cancel': 'Cancelar transações',
  'pdv:reports': 'Ver relatórios do PDV',

  // Admin
  'admin:operators': 'Gerenciar operadores',
  'admin:devices': 'Gerenciar dispositivos PDV',
  'admin:reports': 'Ver relatórios da escola',
  'admin:settings': 'Configurar regras globais',
  'admin:audit': 'Ver logs de auditoria',

  // Super Admin
  'super:schools': 'Gerenciar escolas',
  'super:impersonate': 'Acessar como outra escola',
  'super:metrics': 'Ver métricas globais',
  'super:config': 'Configurações do sistema',
} as const;

export type Permission = keyof typeof PERMISSIONS;
```

### Mapeamento Role → Permissões

```typescript
// src/auth/roles.ts

import { Permission } from './permissions';

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  guardian: [
    'dashboard:view',
    'students:view',
    'students:edit_rules',
    'actions:respond',
  ],

  operator: [
    'pdv:operate',
    'pdv:cancel',
    'pdv:reports',
  ],

  admin: [
    // Herda de guardian
    'dashboard:view',
    'dashboard:view_all',
    'students:view',
    'students:view_all',
    'students:edit_rules',
    'actions:respond',
    'actions:view_all',

    // Herda de operator
    'pdv:operate',
    'pdv:cancel',
    'pdv:reports',

    // Próprias
    'admin:operators',
    'admin:devices',
    'admin:reports',
    'admin:settings',
    'admin:audit',
  ],

  super_admin: [
    // Todas as permissões
    ...Object.keys(PERMISSIONS) as Permission[],
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function getPermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}
```

### Middleware de Autorização

```typescript
// src/middleware/authorize.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { Permission, hasPermission } from '../auth';
import { AuthenticatedRequest } from './auth.middleware';

/**
 * Middleware para verificar permissão específica
 */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Não autenticado',
      });
    }

    if (!hasPermission(authReq.user.role, permission)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Sem permissão para esta ação',
        required: permission,
      });
    }

    next();
  };
}

/**
 * Middleware para verificar qualquer uma das permissões
 */
export function requireAnyPermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Não autenticado',
      });
    }

    const hasAny = permissions.some(p =>
      hasPermission(authReq.user.role, p)
    );

    if (!hasAny) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Sem permissão para esta ação',
        required: permissions,
      });
    }

    next();
  };
}

/**
 * Middleware para verificar todas as permissões
 */
export function requireAllPermissions(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Não autenticado',
      });
    }

    const hasAll = permissions.every(p =>
      hasPermission(authReq.user.role, p)
    );

    if (!hasAll) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Sem permissão para esta ação',
        required: permissions,
      });
    }

    next();
  };
}
```

---

## Verificação de Vínculo

### Guardian-Student Relationship

```typescript
// src/services/authorization.service.ts

import { StudentRepository } from '../repositories/student.repository';
import { ForbiddenError } from '../errors';

export class AuthorizationService {
  constructor(private studentRepo: StudentRepository) {}

  /**
   * Verifica se o usuário é responsável pelo aluno
   */
  async assertGuardianship(userId: string, studentId: string): Promise<void> {
    const isGuardian = await this.studentRepo.isGuardian(userId, studentId);

    if (!isGuardian) {
      throw new ForbiddenError(
        'Você não é responsável por este aluno'
      );
    }
  }

  /**
   * Verifica se o operador pertence à escola do aluno
   */
  async assertOperatorSchool(operatorId: string, studentId: string): Promise<void> {
    const student = await this.studentRepo.findById(studentId);
    const operator = await this.userRepo.findById(operatorId);

    if (!student || !operator) {
      throw new ForbiddenError('Recursos não encontrados');
    }

    if (student.schoolId !== operator.schoolId) {
      throw new ForbiddenError(
        'Operador não pertence à escola do aluno'
      );
    }
  }

  /**
   * Verifica se admin tem acesso à escola
   */
  async assertAdminSchool(adminId: string, schoolId: string): Promise<void> {
    const admin = await this.userRepo.findById(adminId);

    if (!admin) {
      throw new ForbiddenError('Admin não encontrado');
    }

    // Super admin tem acesso a todas as escolas
    if (admin.role === 'super_admin') {
      return;
    }

    if (admin.schoolId !== schoolId) {
      throw new ForbiddenError(
        'Admin não tem acesso a esta escola'
      );
    }
  }
}
```

---

## Uso nas Rotas

```typescript
// src/routes/guardian.routes.ts

import { Router } from 'express';
import { requirePermission } from '../middleware/authorize.middleware';
import { GuardianController } from '../controllers/guardian.controller';

const router = Router();
const controller = new GuardianController();

// Dashboard - qualquer guardian pode ver
router.get(
  '/dashboard',
  requirePermission('dashboard:view'),
  controller.getDashboard
);

// Ver aluno específico - precisa verificar vínculo
router.get(
  '/students/:studentId',
  requirePermission('students:view'),
  controller.assertGuardianship, // Middleware adicional
  controller.getStudent
);

// Editar regras do aluno
router.patch(
  '/students/:studentId/rules',
  requirePermission('students:edit_rules'),
  controller.assertGuardianship,
  controller.updateRules
);

export { router as guardianRoutes };
```

```typescript
// src/routes/admin.routes.ts

import { Router } from 'express';
import { requirePermission, requireAnyPermission } from '../middleware/authorize.middleware';
import { AdminController } from '../controllers/admin.controller';

const router = Router();
const controller = new AdminController();

// Gerenciar operadores
router.get(
  '/operators',
  requirePermission('admin:operators'),
  controller.listOperators
);

router.post(
  '/operators',
  requirePermission('admin:operators'),
  controller.createOperator
);

// Relatórios - admin ou super_admin
router.get(
  '/reports',
  requireAnyPermission('admin:reports', 'super:metrics'),
  controller.getReports
);

// Logs de auditoria
router.get(
  '/audit-logs',
  requirePermission('admin:audit'),
  controller.getAuditLogs
);

export { router as adminRoutes };
```

---

## Context-Based Access Control

Além das permissões por role, implementamos verificações de contexto:

```typescript
// src/decorators/authorize.decorator.ts

import { AuthorizationService } from '../services/authorization.service';

/**
 * Decorator para verificar acesso contextual
 */
export function AuthorizeStudent() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const req = args[0];
      const authService: AuthorizationService = this.authService;
      const userId = req.user.id;
      const studentId = req.params.studentId || req.body.studentId;

      if (studentId) {
        // Guardian precisa ter vínculo
        if (req.user.role === 'guardian') {
          await authService.assertGuardianship(userId, studentId);
        }
        // Operator precisa ser da mesma escola
        else if (req.user.role === 'operator') {
          await authService.assertOperatorSchool(userId, studentId);
        }
        // Admin precisa ter acesso à escola
        else if (req.user.role === 'admin') {
          const student = await this.studentRepo.findById(studentId);
          await authService.assertAdminSchool(userId, student.schoolId);
        }
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
```

---

## Frontend - Verificação de Permissões

```typescript
// src/hooks/usePermissions.ts

import { useLayersPortal } from './useLayersPortal';
import { Permission, hasPermission, getPermissions } from '../auth';

export function usePermissions() {
  const { session } = useLayersPortal();
  const role = session?.role || 'guest';

  return {
    role,
    permissions: getPermissions(role),

    can: (permission: Permission): boolean => {
      return hasPermission(role, permission);
    },

    canAny: (...permissions: Permission[]): boolean => {
      return permissions.some(p => hasPermission(role, p));
    },

    canAll: (...permissions: Permission[]): boolean => {
      return permissions.every(p => hasPermission(role, p));
    },
  };
}
```

```tsx
// Uso em componentes

function AdminPanel() {
  const { can } = usePermissions();

  if (!can('admin:reports')) {
    return <AccessDenied />;
  }

  return (
    <div>
      <h1>Painel Administrativo</h1>

      {can('admin:operators') && (
        <Link to="/admin/operators">Gerenciar Operadores</Link>
      )}

      {can('admin:audit') && (
        <Link to="/admin/audit">Logs de Auditoria</Link>
      )}
    </div>
  );
}
```

---

## Logs de Acesso

```typescript
// src/middleware/access-log.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

export function accessLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;

    res.on('finish', () => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        userId: authReq.user?.id,
        role: authReq.user?.role,
        statusCode: res.statusCode,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      };

      // Log para auditoria
      if (res.statusCode === 403) {
        console.warn('[ACCESS DENIED]', logEntry);
      } else {
        console.info('[ACCESS]', logEntry);
      }
    });

    next();
  };
}
```

---

## Testes

```typescript
// src/auth/__tests__/permissions.test.ts

describe('RBAC', () => {
  describe('hasPermission', () => {
    it('guardian pode ver dashboard', () => {
      expect(hasPermission('guardian', 'dashboard:view')).toBe(true);
    });

    it('guardian não pode operar PDV', () => {
      expect(hasPermission('guardian', 'pdv:operate')).toBe(false);
    });

    it('operator pode operar PDV', () => {
      expect(hasPermission('operator', 'pdv:operate')).toBe(true);
    });

    it('admin tem permissões de guardian', () => {
      expect(hasPermission('admin', 'dashboard:view')).toBe(true);
      expect(hasPermission('admin', 'students:edit_rules')).toBe(true);
    });

    it('super_admin tem todas as permissões', () => {
      Object.keys(PERMISSIONS).forEach(permission => {
        expect(hasPermission('super_admin', permission as Permission)).toBe(true);
      });
    });
  });
});
```

---

## Referências

- [Autenticação SSO](./autenticacao-sso.md)
- [Autenticação Backend](../02-BACKEND-API/autenticacao.md)
- [Guardian API](../02-BACKEND-API/guardian-api.md)
