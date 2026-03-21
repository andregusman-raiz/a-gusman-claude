# Autenticação - Super Cantina API

## Visão Geral

O Super Cantina utiliza **autenticação delegada** à plataforma Layers Education. Não existe cadastro próprio de usuários - toda autenticação passa pelo SSO da Layers.

---

## Fluxo de Autenticação

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Usuário   │     │   Layers    │     │ Super       │     │  Database   │
│   (App)     │     │   Portal    │     │ Cantina API │     │             │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       │  1. Acessa app    │                   │                   │
       │ ─────────────────>│                   │                   │
       │                   │                   │                   │
       │  2. LayersPortal  │                   │                   │
       │     .ready()      │                   │                   │
       │ <─────────────────│                   │                   │
       │                   │                   │                   │
       │  3. session token │                   │                   │
       │ <─────────────────│                   │                   │
       │                   │                   │                   │
       │  4. API call + token                  │                   │
       │ ─────────────────────────────────────>│                   │
       │                   │                   │                   │
       │                   │  5. Validate      │                   │
       │                   │ <─────────────────│                   │
       │                   │                   │                   │
       │                   │  6. User data     │                   │
       │                   │ ─────────────────>│                   │
       │                   │                   │                   │
       │                   │                   │  7. Find/Create   │
       │                   │                   │ ─────────────────>│
       │                   │                   │                   │
       │                   │                   │  8. User record   │
       │                   │                   │ <─────────────────│
       │                   │                   │                   │
       │  9. Response                          │                   │
       │ <─────────────────────────────────────│                   │
       │                   │                   │                   │
```

---

## Tipos de Autenticação

### 1. Portal do Responsável (Guardian)

Autenticação via LayersPortal.js com token de sessão.

```http
GET /api/v1/guardian/dashboard
Authorization: Bearer <layers_session_token>
X-Layers-Community: <community_id>
```

### 2. PDV (Ponto de Venda)

Autenticação via API Key específica do dispositivo.

```http
POST /api/v1/pdv/evaluate
Authorization: ApiKey <pdv_api_key>
X-PDV-Device-Id: <device_id>
```

### 3. Admin/Escola

Autenticação via LayersPortal.js com verificação de role `operator` ou `admin`.

```http
GET /api/v1/admin/reports
Authorization: Bearer <layers_session_token>
X-Layers-Community: <community_id>
```

---

## Middleware de Autenticação

### AuthMiddleware.ts

```typescript
// src/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { LayersService } from '../services/layers.service';
import { UserRepository } from '../repositories/user.repository';
import { UnauthorizedError, ForbiddenError } from '../errors';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    layersUserId: string;
    communityId: string;
    role: 'guardian' | 'operator' | 'admin';
    email: string;
    name: string;
  };
}

export class AuthMiddleware {
  constructor(
    private layersService: LayersService,
    private userRepository: UserRepository
  ) {}

  /**
   * Middleware para autenticação de responsáveis e admins
   */
  authenticateSession() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const token = this.extractBearerToken(req);
        const communityId = req.headers['x-layers-community'] as string;

        if (!token) {
          throw new UnauthorizedError('Token não fornecido');
        }

        if (!communityId) {
          throw new UnauthorizedError('Community ID não fornecido');
        }

        // Validar token com Layers
        const layersUser = await this.layersService.validateSession(token);

        if (!layersUser) {
          throw new UnauthorizedError('Sessão inválida ou expirada');
        }

        // Verificar se usuário pertence à comunidade
        if (!layersUser.communities.includes(communityId)) {
          throw new ForbiddenError('Usuário não pertence a esta comunidade');
        }

        // Buscar ou criar usuário local
        let user = await this.userRepository.findByLayersId(layersUser.id);

        if (!user) {
          user = await this.userRepository.create({
            layersUserId: layersUser.id,
            email: layersUser.email,
            name: layersUser.name,
            role: this.mapLayersRole(layersUser.role),
          });
        }

        // Anexar usuário ao request
        (req as AuthenticatedRequest).user = {
          id: user.id,
          layersUserId: user.layersUserId,
          communityId,
          role: user.role,
          email: user.email,
          name: user.name,
        };

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Middleware para autenticação de PDV
   */
  authenticatePdv() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const apiKey = this.extractApiKey(req);
        const deviceId = req.headers['x-pdv-device-id'] as string;

        if (!apiKey) {
          throw new UnauthorizedError('API Key não fornecida');
        }

        if (!deviceId) {
          throw new UnauthorizedError('Device ID não fornecido');
        }

        // Validar API Key e device
        const pdvDevice = await this.validatePdvCredentials(apiKey, deviceId);

        if (!pdvDevice) {
          throw new UnauthorizedError('Credenciais PDV inválidas');
        }

        if (!pdvDevice.isActive) {
          throw new ForbiddenError('Dispositivo PDV desativado');
        }

        // Anexar dados do PDV ao request
        (req as any).pdv = {
          id: pdvDevice.id,
          schoolId: pdvDevice.schoolId,
          name: pdvDevice.name,
        };

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Middleware de autorização por role
   */
  requireRole(...roles: Array<'guardian' | 'operator' | 'admin'>) {
    return (req: Request, res: Response, next: NextFunction) => {
      const user = (req as AuthenticatedRequest).user;

      if (!user) {
        return next(new UnauthorizedError('Usuário não autenticado'));
      }

      if (!roles.includes(user.role)) {
        return next(new ForbiddenError('Permissão insuficiente'));
      }

      next();
    };
  }

  private extractBearerToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  private extractApiKey(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('ApiKey ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  private mapLayersRole(layersRole: string): 'guardian' | 'operator' | 'admin' {
    switch (layersRole) {
      case 'admin':
      case 'school_admin':
        return 'admin';
      case 'operator':
      case 'staff':
        return 'operator';
      default:
        return 'guardian';
    }
  }

  private async validatePdvCredentials(
    apiKey: string,
    deviceId: string
  ): Promise<any> {
    // Implementação de validação de credenciais PDV
    // Verifica hash da API key e associação com device
    return this.userRepository.findPdvDevice(apiKey, deviceId);
  }
}
```

---

## Serviço de Integração Layers

### LayersService.ts

```typescript
// src/services/layers.service.ts

import axios, { AxiosInstance } from 'axios';
import { Redis } from 'ioredis';
import { config } from '../config';

interface LayersUser {
  id: string;
  email: string;
  name: string;
  role: string;
  communities: string[];
  avatar?: string;
}

interface LayersValidationResponse {
  valid: boolean;
  user?: LayersUser;
  error?: string;
}

export class LayersService {
  private client: AxiosInstance;
  private redis: Redis;
  private readonly CACHE_TTL = 300; // 5 minutos

  constructor(redis: Redis) {
    this.redis = redis;
    this.client = axios.create({
      baseURL: config.layers.apiUrl,
      timeout: 5000,
      headers: {
        'X-API-Key': config.layers.apiKey,
      },
    });
  }

  /**
   * Valida sessão com a API da Layers
   * Implementa cache para reduzir chamadas
   */
  async validateSession(token: string): Promise<LayersUser | null> {
    // Verificar cache primeiro
    const cacheKey = `session:${this.hashToken(token)}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const response = await this.client.post<LayersValidationResponse>(
        '/auth/validate',
        { token }
      );

      if (!response.data.valid || !response.data.user) {
        return null;
      }

      // Cachear resultado
      await this.redis.setex(
        cacheKey,
        this.CACHE_TTL,
        JSON.stringify(response.data.user)
      );

      return response.data.user;
    } catch (error) {
      console.error('Erro ao validar sessão com Layers:', error);
      return null;
    }
  }

  /**
   * Invalida cache de sessão (chamado no logout)
   */
  async invalidateSession(token: string): Promise<void> {
    const cacheKey = `session:${this.hashToken(token)}`;
    await this.redis.del(cacheKey);
  }

  /**
   * Obtém dados do usuário pelo ID Layers
   */
  async getUserById(layersUserId: string): Promise<LayersUser | null> {
    const cacheKey = `user:${layersUserId}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const response = await this.client.get<LayersUser>(
        `/users/${layersUserId}`
      );

      await this.redis.setex(
        cacheKey,
        this.CACHE_TTL,
        JSON.stringify(response.data)
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar usuário Layers:', error);
      return null;
    }
  }

  /**
   * Lista comunidades do usuário
   */
  async getUserCommunities(layersUserId: string): Promise<string[]> {
    try {
      const response = await this.client.get<{ communities: string[] }>(
        `/users/${layersUserId}/communities`
      );
      return response.data.communities;
    } catch (error) {
      console.error('Erro ao buscar comunidades:', error);
      return [];
    }
  }

  private hashToken(token: string): string {
    // Cria hash do token para uso como chave de cache
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex').slice(0, 16);
  }
}
```

---

## Configuração de Rotas

### Aplicando Middlewares

```typescript
// src/routes/index.ts

import { Router } from 'express';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { guardianRoutes } from './guardian.routes';
import { pdvRoutes } from './pdv.routes';
import { adminRoutes } from './admin.routes';

export function configureRoutes(authMiddleware: AuthMiddleware): Router {
  const router = Router();

  // Rotas públicas (health check)
  router.get('/health', (req, res) => res.json({ status: 'ok' }));

  // Rotas do Portal do Responsável
  router.use(
    '/guardian',
    authMiddleware.authenticateSession(),
    authMiddleware.requireRole('guardian', 'admin'),
    guardianRoutes
  );

  // Rotas do PDV
  router.use(
    '/pdv',
    authMiddleware.authenticatePdv(),
    pdvRoutes
  );

  // Rotas Administrativas
  router.use(
    '/admin',
    authMiddleware.authenticateSession(),
    authMiddleware.requireRole('operator', 'admin'),
    adminRoutes
  );

  return router;
}
```

---

## Gestão de API Keys para PDV

### Geração e Registro

```typescript
// src/services/pdv-auth.service.ts

import { randomBytes, createHash } from 'crypto';
import { PdvDeviceRepository } from '../repositories/pdv-device.repository';

export class PdvAuthService {
  constructor(private pdvRepository: PdvDeviceRepository) {}

  /**
   * Gera nova API Key para dispositivo PDV
   * Retorna a key em texto claro apenas uma vez
   */
  async generateApiKey(schoolId: string, deviceName: string): Promise<{
    deviceId: string;
    apiKey: string;
    apiKeyPreview: string;
  }> {
    // Gerar API Key única
    const apiKey = `pdv_${randomBytes(32).toString('hex')}`;

    // Hash para armazenamento
    const apiKeyHash = createHash('sha256').update(apiKey).digest('hex');

    // Preview para exibição (primeiros e últimos caracteres)
    const apiKeyPreview = `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`;

    // Registrar dispositivo
    const device = await this.pdvRepository.create({
      schoolId,
      name: deviceName,
      apiKeyHash,
      apiKeyPreview,
      isActive: true,
    });

    return {
      deviceId: device.id,
      apiKey, // Só retornado uma vez!
      apiKeyPreview,
    };
  }

  /**
   * Valida API Key de dispositivo PDV
   */
  async validateApiKey(apiKey: string, deviceId: string): Promise<boolean> {
    const apiKeyHash = createHash('sha256').update(apiKey).digest('hex');

    const device = await this.pdvRepository.findByIdAndKeyHash(
      deviceId,
      apiKeyHash
    );

    return device !== null && device.isActive;
  }

  /**
   * Revoga API Key (desativa dispositivo)
   */
  async revokeApiKey(deviceId: string): Promise<void> {
    await this.pdvRepository.deactivate(deviceId);
  }

  /**
   * Regenera API Key para dispositivo existente
   */
  async regenerateApiKey(deviceId: string): Promise<{
    apiKey: string;
    apiKeyPreview: string;
  }> {
    const apiKey = `pdv_${randomBytes(32).toString('hex')}`;
    const apiKeyHash = createHash('sha256').update(apiKey).digest('hex');
    const apiKeyPreview = `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`;

    await this.pdvRepository.updateApiKey(deviceId, apiKeyHash, apiKeyPreview);

    return { apiKey, apiKeyPreview };
  }
}
```

---

## Tratamento de Erros de Autenticação

### Códigos HTTP

| Código | Situação | Resposta |
|--------|----------|----------|
| 401 | Token ausente ou inválido | `{ "error": "UNAUTHORIZED", "message": "..." }` |
| 403 | Token válido, sem permissão | `{ "error": "FORBIDDEN", "message": "..." }` |
| 419 | Sessão expirada | `{ "error": "SESSION_EXPIRED", "message": "..." }` |

### ErrorHandler

```typescript
// src/middleware/error.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError, SessionExpiredError } from '../errors';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (error instanceof UnauthorizedError) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: error.message,
    });
  }

  if (error instanceof ForbiddenError) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: error.message,
    });
  }

  if (error instanceof SessionExpiredError) {
    return res.status(419).json({
      error: 'SESSION_EXPIRED',
      message: error.message,
    });
  }

  // Erro genérico
  console.error('Erro não tratado:', error);
  return res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'Erro interno do servidor',
  });
}
```

---

## Segurança

### Headers de Segurança

```typescript
// src/middleware/security.middleware.ts

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

export const securityMiddleware = [
  helmet(),

  // Rate limiting para autenticação
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP
    message: { error: 'TOO_MANY_REQUESTS', message: 'Muitas tentativas' },
    standardHeaders: true,
    legacyHeaders: false,
  }),
];

// Rate limit específico para PDV (mais permissivo)
export const pdvRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 300, // 300 requests por minuto (alto volume de vendas)
  keyGenerator: (req) => req.headers['x-pdv-device-id'] as string,
});
```

### Variáveis de Ambiente

```env
# .env.example

# Layers Integration
LAYERS_API_URL=https://api.layers.education
LAYERS_API_KEY=your_layers_api_key
LAYERS_WEBHOOK_SECRET=your_webhook_secret

# JWT (para tokens internos se necessário)
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=1h

# Redis (cache de sessões)
REDIS_URL=redis://localhost:6379

# Security
CORS_ORIGINS=https://app.layers.education,https://escola.layers.education
```

---

## Testes

### Testes de Autenticação

```typescript
// src/middleware/__tests__/auth.middleware.test.ts

import { AuthMiddleware } from '../auth.middleware';
import { createMockRequest, createMockResponse } from '../../test/utils';

describe('AuthMiddleware', () => {
  let authMiddleware: AuthMiddleware;
  let mockLayersService: jest.Mocked<LayersService>;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockLayersService = {
      validateSession: jest.fn(),
    } as any;

    mockUserRepository = {
      findByLayersId: jest.fn(),
      create: jest.fn(),
    } as any;

    authMiddleware = new AuthMiddleware(mockLayersService, mockUserRepository);
  });

  describe('authenticateSession', () => {
    it('deve rejeitar request sem token', async () => {
      const req = createMockRequest({});
      const res = createMockResponse();
      const next = jest.fn();

      await authMiddleware.authenticateSession()(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Token não fornecido' })
      );
    });

    it('deve autenticar usuário válido', async () => {
      mockLayersService.validateSession.mockResolvedValue({
        id: 'layers-123',
        email: 'pai@escola.com',
        name: 'João Silva',
        role: 'guardian',
        communities: ['community-1'],
      });

      mockUserRepository.findByLayersId.mockResolvedValue({
        id: 'user-1',
        layersUserId: 'layers-123',
        email: 'pai@escola.com',
        name: 'João Silva',
        role: 'guardian',
      });

      const req = createMockRequest({
        headers: {
          authorization: 'Bearer valid-token',
          'x-layers-community': 'community-1',
        },
      });
      const res = createMockResponse();
      const next = jest.fn();

      await authMiddleware.authenticateSession()(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe('user-1');
    });
  });
});
```

---

## Referências

- [Integração Layers](../01-ARQUITETURA/integracao-layers.md)
- [RBAC e Permissões](../06-SEGURANCA/rbac.md)
- [SSO Detalhado](../06-SEGURANCA/autenticacao-sso.md)
