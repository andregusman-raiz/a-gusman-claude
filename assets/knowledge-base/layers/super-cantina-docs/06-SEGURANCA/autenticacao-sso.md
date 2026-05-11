# Autenticação SSO - Layers Integration

## Visão Geral

O Super Cantina utiliza **Single Sign-On (SSO)** da plataforma Layers Education. Não existe cadastro próprio de usuários - toda autenticação é delegada.

---

## Fluxo SSO Detalhado

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FLUXO SSO COMPLETO                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐                                                             │
│  │  1. Usuário │                                                             │
│  │  acessa app │                                                             │
│  │  Layers     │                                                             │
│  └──────┬──────┘                                                             │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        PLATAFORMA LAYERS                                 │ │
│  │                                                                          │ │
│  │  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                │ │
│  │  │  2. Login   │────►│  3. Sessão  │────►│  4. Token   │                │ │
│  │  │  (email/pwd)│     │  criada     │     │  JWT gerado │                │ │
│  │  └─────────────┘     └─────────────┘     └──────┬──────┘                │ │
│  │                                                 │                        │ │
│  └─────────────────────────────────────────────────┼────────────────────────┘ │
│                                                    │                         │
│         ┌──────────────────────────────────────────┘                         │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                       SUPER CANTINA (IFRAME)                            │ │
│  │                                                                          │ │
│  │  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                │ │
│  │  │ 5. Layers   │────►│ 6. onReady  │────►│ 7. Token    │                │ │
│  │  │ Portal.init │     │ callback    │     │ recebido    │                │ │
│  │  └─────────────┘     └─────────────┘     └──────┬──────┘                │ │
│  │                                                 │                        │ │
│  │                                                 ▼                        │ │
│  │                                          ┌─────────────┐                 │ │
│  │                                          │ 8. Armazena │                 │ │
│  │                                          │ em memória  │                 │ │
│  │                                          └──────┬──────┘                 │ │
│  │                                                 │                        │ │
│  └─────────────────────────────────────────────────┼────────────────────────┘ │
│                                                    │                         │
│         ┌──────────────────────────────────────────┘                         │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                       SUPER CANTINA API                                  │ │
│  │                                                                          │ │
│  │  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                │ │
│  │  │ 9. Request  │────►│10. Validar  │────►│11. Buscar   │                │ │
│  │  │ + Bearer    │     │ com Layers  │     │ user local  │                │ │
│  │  └─────────────┘     └─────────────┘     └──────┬──────┘                │ │
│  │                                                 │                        │ │
│  │                                          ┌──────▼──────┐                 │ │
│  │                                          │12. Response │                 │ │
│  │                                          │ autenticado │                 │ │
│  │                                          └─────────────┘                 │ │
│  │                                                                          │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Estrutura do Token JWT

### Claims do Token Layers

```typescript
interface LayersJWTPayload {
  // Claims padrão
  iss: string;        // 'layers.education'
  sub: string;        // User ID no Layers
  aud: string;        // App ID
  exp: number;        // Expiration timestamp
  iat: number;        // Issued at timestamp
  jti: string;        // Token ID único

  // Claims customizados
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  };

  communities: string[];  // IDs das comunidades
  roles: string[];        // Roles do usuário

  // Contexto da sessão
  session: {
    id: string;
    createdAt: string;
    deviceInfo?: string;
  };
}
```

### Exemplo de Token Decodificado

```json
{
  "iss": "layers.education",
  "sub": "user-550e8400-e29b-41d4-a716-446655440000",
  "aud": "super-cantina",
  "exp": 1705329600,
  "iat": 1705326000,
  "jti": "token-abc123def456",
  "user": {
    "id": "user-550e8400-e29b-41d4-a716-446655440000",
    "email": "pai@escola.com.br",
    "name": "João da Silva",
    "avatar": "https://cdn.layers.education/avatars/..."
  },
  "communities": ["community-123", "community-456"],
  "roles": ["guardian"],
  "session": {
    "id": "session-xyz789",
    "createdAt": "2024-01-15T10:00:00Z",
    "deviceInfo": "Mozilla/5.0 iPhone..."
  }
}
```

---

## Validação de Token

### Backend Implementation

```typescript
// src/services/layers.service.ts

import axios from 'axios';
import { Redis } from 'ioredis';
import { config } from '../config';

interface ValidationResult {
  valid: boolean;
  user?: LayersUser;
  error?: string;
}

interface LayersUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  communities: string[];
}

export class LayersAuthService {
  private redis: Redis;
  private readonly CACHE_TTL = 300; // 5 minutos

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Valida token com a API do Layers
   * Implementa cache para reduzir chamadas
   */
  async validateToken(token: string): Promise<ValidationResult> {
    // 1. Verificar cache
    const cacheKey = this.getCacheKey(token);
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // 2. Validar com Layers
    try {
      const response = await axios.post(
        `${config.layers.apiUrl}/auth/validate`,
        { token },
        {
          headers: {
            'X-API-Key': config.layers.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );

      const result: ValidationResult = {
        valid: response.data.valid,
        user: response.data.user,
      };

      // 3. Cachear resultado positivo
      if (result.valid) {
        await this.redis.setex(
          cacheKey,
          this.CACHE_TTL,
          JSON.stringify(result)
        );
      }

      return result;
    } catch (error) {
      console.error('Erro ao validar token com Layers:', error);

      // Se Layers está indisponível, verificar cache expirado
      const expiredCache = await this.redis.get(`expired:${cacheKey}`);
      if (expiredCache) {
        console.warn('Usando cache expirado devido a erro de validação');
        return JSON.parse(expiredCache);
      }

      return {
        valid: false,
        error: 'Erro ao validar token',
      };
    }
  }

  /**
   * Invalida cache quando token expira ou usuário faz logout
   */
  async invalidateToken(token: string): Promise<void> {
    const cacheKey = this.getCacheKey(token);
    await this.redis.del(cacheKey);
  }

  /**
   * Refresh de token (chamado pelo frontend quando próximo de expirar)
   */
  async refreshToken(oldToken: string): Promise<{ newToken: string } | null> {
    try {
      const response = await axios.post(
        `${config.layers.apiUrl}/auth/refresh`,
        { token: oldToken },
        {
          headers: {
            'X-API-Key': config.layers.apiKey,
          },
          timeout: 5000,
        }
      );

      if (response.data.token) {
        // Invalidar token antigo
        await this.invalidateToken(oldToken);
        return { newToken: response.data.token };
      }

      return null;
    } catch (error) {
      console.error('Erro ao refresh token:', error);
      return null;
    }
  }

  private getCacheKey(token: string): string {
    // Usar hash do token como chave (não armazenar token completo)
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    return `auth:${hash.substring(0, 16)}`;
  }
}
```

---

## Middleware de Autenticação

```typescript
// src/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { LayersAuthService } from '../services/layers.service';
import { UserRepository } from '../repositories/user.repository';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    layersUserId: string;
    email: string;
    name: string;
    role: string;
    communityId: string;
  };
  token: string;
}

export function createAuthMiddleware(
  authService: LayersAuthService,
  userRepo: UserRepository
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Extrair token
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'Token não fornecido',
        });
      }

      const token = authHeader.substring(7);

      // 2. Extrair community ID
      const communityId = req.headers['x-layers-community'] as string;
      if (!communityId) {
        return res.status(400).json({
          error: 'BAD_REQUEST',
          message: 'Community ID não fornecido',
        });
      }

      // 3. Validar token
      const validation = await authService.validateToken(token);

      if (!validation.valid || !validation.user) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: validation.error || 'Token inválido',
        });
      }

      // 4. Verificar se usuário pertence à comunidade
      if (!validation.user.communities.includes(communityId)) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: 'Usuário não pertence a esta comunidade',
        });
      }

      // 5. Buscar ou criar usuário local
      let localUser = await userRepo.findByLayersId(validation.user.id);

      if (!localUser) {
        localUser = await userRepo.create({
          layersUserId: validation.user.id,
          email: validation.user.email,
          name: validation.user.name,
          role: mapLayersRole(validation.user.roles),
        });
      }

      // 6. Anexar ao request
      (req as AuthenticatedRequest).user = {
        id: localUser.id,
        layersUserId: localUser.layersUserId,
        email: localUser.email,
        name: localUser.name,
        role: localUser.role,
        communityId,
      };
      (req as AuthenticatedRequest).token = token;

      next();
    } catch (error) {
      console.error('Erro de autenticação:', error);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Erro ao processar autenticação',
      });
    }
  };
}

function mapLayersRole(roles: string[]): string {
  if (roles.includes('admin') || roles.includes('school_admin')) {
    return 'admin';
  }
  if (roles.includes('operator') || roles.includes('staff')) {
    return 'operator';
  }
  return 'guardian';
}
```

---

## Refresh de Sessão

### Frontend

```typescript
// src/hooks/useSessionRefresh.ts

import { useEffect, useRef } from 'react';
import { useLayersPortal } from './useLayersPortal';

const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutos antes de expirar
const CHECK_INTERVAL = 60 * 1000; // Verificar a cada 1 minuto

export function useSessionRefresh() {
  const { session } = useLayersPortal();
  const intervalRef = useRef<NodeJS.Timer>();

  useEffect(() => {
    if (!session) return;

    const checkAndRefresh = async () => {
      const now = Date.now();
      const expiresAt = session.expiresAt;
      const timeUntilExpiry = expiresAt - now;

      if (timeUntilExpiry < REFRESH_THRESHOLD) {
        console.log('[Session] Token próximo de expirar, solicitando refresh');

        try {
          await window.LayersPortal?.refreshSession();
        } catch (error) {
          console.error('[Session] Erro ao refresh:', error);
          // Notificar usuário para fazer login novamente
          window.LayersPortal?.sessionExpired();
        }
      }
    };

    intervalRef.current = setInterval(checkAndRefresh, CHECK_INTERVAL);

    // Verificar imediatamente
    checkAndRefresh();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [session]);
}
```

---

## Segurança Adicional

### Headers de Segurança

```typescript
// src/middleware/security.middleware.ts

import helmet from 'helmet';
import { Express } from 'express';

export function configureSecurityHeaders(app: Express) {
  app.use(helmet({
    // CSP para prevenir XSS
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://cdn.layers.digital'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'https://cdn.layers.education', 'data:'],
        connectSrc: ["'self'", 'https://api.layers.education'],
        frameSrc: ["'none'"],
        frameAncestors: ['https://*.layers.education'],
      },
    },

    // Prevenir clickjacking
    frameguard: {
      action: 'allow-from',
      domain: 'https://app.layers.education',
    },

    // HSTS
    strictTransportSecurity: {
      maxAge: 31536000,
      includeSubDomains: true,
    },

    // Outras proteções
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));
}
```

### Rate Limiting por Usuário

```typescript
// src/middleware/rate-limit.middleware.ts

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Redis } from 'ioredis';

export function createRateLimiter(redis: Redis) {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo de requests por janela
    standardHeaders: true,
    legacyHeaders: false,

    // Usar Redis para rate limiting distribuído
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.call(...args),
    }),

    // Identificar por usuário (se autenticado) ou IP
    keyGenerator: (req) => {
      const authReq = req as any;
      return authReq.user?.id || req.ip;
    },

    // Resposta personalizada
    handler: (req, res) => {
      res.status(429).json({
        error: 'TOO_MANY_REQUESTS',
        message: 'Muitas requisições. Tente novamente em alguns minutos.',
        retryAfter: res.getHeader('Retry-After'),
      });
    },
  });
}
```

---

## Logs de Autenticação

```typescript
// src/services/auth-logger.ts

interface AuthEvent {
  type: 'LOGIN' | 'LOGOUT' | 'TOKEN_REFRESH' | 'TOKEN_INVALID' | 'ACCESS_DENIED';
  userId?: string;
  layersUserId?: string;
  communityId?: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  details?: any;
}

export class AuthLogger {
  async log(event: AuthEvent): Promise<void> {
    // Log estruturado para análise
    console.log(JSON.stringify({
      level: 'info',
      category: 'auth',
      ...event,
    }));

    // Persistir em banco para auditoria
    // await this.authEventRepo.create(event);
  }
}

// Uso no middleware
authLogger.log({
  type: 'LOGIN',
  userId: localUser.id,
  layersUserId: validation.user.id,
  communityId,
  ip: req.ip,
  userAgent: req.headers['user-agent'] || '',
  timestamp: new Date(),
});
```

---

## Testes

```typescript
// src/services/__tests__/layers.service.test.ts

describe('LayersAuthService', () => {
  describe('validateToken', () => {
    it('deve validar token válido', async () => {
      mockAxios.post.mockResolvedValue({
        data: {
          valid: true,
          user: {
            id: 'user-123',
            email: 'test@test.com',
            name: 'Test User',
            roles: ['guardian'],
            communities: ['community-1'],
          },
        },
      });

      const result = await service.validateToken('valid-token');

      expect(result.valid).toBe(true);
      expect(result.user?.id).toBe('user-123');
    });

    it('deve retornar do cache em chamadas subsequentes', async () => {
      // Primeira chamada
      await service.validateToken('valid-token');

      // Segunda chamada - deve usar cache
      await service.validateToken('valid-token');

      // Layers API deve ser chamada apenas uma vez
      expect(mockAxios.post).toHaveBeenCalledTimes(1);
    });

    it('deve rejeitar token inválido', async () => {
      mockAxios.post.mockResolvedValue({
        data: { valid: false, error: 'Token expired' },
      });

      const result = await service.validateToken('invalid-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token expired');
    });
  });
});
```

---

## Referências

- [Autenticação Backend](../02-BACKEND-API/autenticacao.md)
- [Integração LayersPortal.js](../03-FRONTEND/layers-portal-integration.md)
- [RBAC](./rbac.md)
