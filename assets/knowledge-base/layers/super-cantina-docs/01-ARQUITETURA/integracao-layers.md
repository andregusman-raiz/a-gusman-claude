# Integração com Plataforma Layers

## 1. Visão Geral da Integração

O Super Cantina opera como **app embedded** na plataforma Layers, utilizando os seguintes serviços:

| Serviço Layers | Uso no Super Cantina |
|----------------|---------------------|
| SSO/Sessions | Autenticação de responsáveis e operadores |
| LayersPortal.js | SDK de integração no frontend |
| Notification API | Push notifications para bloqueios |
| Context API | Dados de usuário e comunidade |

---

## 2. Autenticação via LayersPortal.js

### 2.1 Configuração Inicial

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Super Cantina</title>

  <!-- Configuração do LayersPortal -->
  <script>
    window.LayersPortalOptions = {
      appId: "super-cantina",
      insidePortalOnly: true,
      features: ["manually-control-loading"]
    };
  </script>
  <script src="https://js.layers.digital/v1/LayersPortal.js"></script>
</head>
<body>
  <div id="root"></div>
</body>
</html>
```

### 2.2 Fluxo de Autenticação

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Usuário abre   │     │  LayersPortal   │     │  Super Cantina  │
│  Super Cantina  │     │      .js        │     │    Backend      │
│  via Layers     │     │                 │     │                 │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │  1. Carrega página    │                       │
         │──────────────────────►│                       │
         │                       │                       │
         │  2. Evento 'ready'    │                       │
         │◄──────────────────────│                       │
         │                       │                       │
         │  3. Evento 'connected'│                       │
         │  (session, userId,    │                       │
         │   communityId)        │                       │
         │◄──────────────────────│                       │
         │                       │                       │
         │                       │  4. POST /auth/validate
         │                       │  (credenciais)        │
         │                       │──────────────────────►│
         │                       │                       │
         │                       │                       │ 5. Valida com
         │                       │                       │ Layers API
         │                       │                       │────┐
         │                       │                       │    │
         │                       │                       │◄───┘
         │                       │                       │
         │                       │  6. JWT interno       │
         │                       │◄──────────────────────│
         │                       │                       │
         │  7. App carrega       │                       │
         │◄──────────────────────│                       │
         │                       │                       │
```

### 2.3 Dados Recebidos do Layers

```typescript
interface LayersContext {
  // Sessão
  session: string;      // Token de sessão para validação

  // Identificação
  userId: string;       // ID único do usuário no Layers
  accountId: string;    // ID da conta
  communityId: string;  // ID da comunidade (escola)

  // Preferências
  preferredLanguages: string[];  // Ex: ["pt-BR", "en"]

  // Ambiente
  platform: 'iframe' | 'ios' | 'android' | null;
}
```

### 2.4 Implementação React

```typescript
// src/hooks/useLayersAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

interface AuthState {
  loading: boolean;
  authenticated: boolean;
  error: string | null;
  user: User | null;
  layersContext: LayersContext | null;
}

export function useLayersAuth() {
  const [state, setState] = useState<AuthState>({
    loading: true,
    authenticated: false,
    error: null,
    user: null,
    layersContext: null
  });

  useEffect(() => {
    const LP = window.LayersPortal;

    if (!LP) {
      setState(s => ({
        ...s,
        loading: false,
        error: 'LayersPortal não disponível'
      }));
      return;
    }

    LP.on('connected', async (data: LayersContext) => {
      try {
        // Validar sessão no backend
        const response = await api.post('/auth/validate', {
          session: data.session,
          communityId: data.communityId,
          userId: data.userId,
          accountId: data.accountId
        });

        if (response.data.valid) {
          setState({
            loading: false,
            authenticated: true,
            error: null,
            user: response.data.user,
            layersContext: data
          });

          // Sinalizar que carregou
          LP('ready');
        } else {
          throw new Error('Sessão inválida');
        }
      } catch (error) {
        setState(s => ({
          ...s,
          loading: false,
          error: error.message
        }));
      }
    });

    // Timeout de segurança
    const timeout = setTimeout(() => {
      setState(s => {
        if (s.loading) {
          return { ...s, loading: false, error: 'Timeout de conexão' };
        }
        return s;
      });
    }, 10000);

    return () => clearTimeout(timeout);
  }, []);

  return state;
}
```

---

## 3. Validação de Sessão no Backend

### 3.1 Endpoint de Validação

```typescript
// src/interfaces/http/controllers/AuthController.ts
import { Request, Response } from 'express';
import { LayersAuthService } from '../../../infrastructure/layers/LayersAuthService';

export class AuthController {
  constructor(private layersAuth: LayersAuthService) {}

  async validate(req: Request, res: Response) {
    const { session, communityId, userId, accountId } = req.body;

    try {
      // 1. Validar com Layers API
      const layersValidation = await this.layersAuth.validateSession({
        session,
        communityId,
        userId
      });

      if (!layersValidation.valid) {
        return res.status(401).json({
          valid: false,
          error: 'Sessão inválida'
        });
      }

      // 2. Buscar/criar usuário no sistema
      const user = await this.userService.findOrCreate({
        layersUserId: userId,
        layersCommunityId: communityId,
        layersAccountId: accountId
      });

      // 3. Determinar role
      const role = await this.determineUserRole(user, communityId);

      // 4. Gerar JWT interno
      const token = this.jwtService.sign({
        sub: user.id,
        layersUserId: userId,
        communityId,
        role
      });

      return res.json({
        valid: true,
        user: {
          id: user.id,
          name: user.name,
          role,
          linkedStudents: role === 'guardian'
            ? await this.getLinkedStudents(user.id)
            : []
        },
        token
      });

    } catch (error) {
      console.error('Auth validation error:', error);
      return res.status(500).json({
        valid: false,
        error: 'Erro interno'
      });
    }
  }
}
```

### 3.2 Chamada à API do Layers

```typescript
// src/infrastructure/layers/LayersAuthService.ts
import axios from 'axios';

interface ValidateSessionParams {
  session: string;
  communityId: string;
  userId: string;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
}

export class LayersAuthService {
  private baseUrl = 'https://api.layers.digital/v1';
  private apiToken: string;

  constructor() {
    this.apiToken = process.env.LAYERS_API_TOKEN!;

    if (!this.apiToken) {
      throw new Error('LAYERS_API_TOKEN não configurado');
    }
  }

  async validateSession(params: ValidateSessionParams): Promise<ValidationResult> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/sso/session/validate`,
        {
          params: {
            session: params.session,
            community: params.communityId,
            userId: params.userId
          },
          headers: {
            'Authorization': `Bearer ${this.apiToken}`
          },
          timeout: 5000  // 5 segundos
        }
      );

      return {
        valid: response.data.valid === true
      };

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return { valid: false, error: 'Token inválido' };
        }
        if (error.response?.status === 404) {
          return { valid: false, error: 'Sessão não encontrada' };
        }
      }

      // Log mas não expõe detalhes
      console.error('Layers validation error:', error);
      return { valid: false, error: 'Erro de validação' };
    }
  }
}
```

---

## 4. Integração com Notification API

### 4.1 Política de Notificação (do PRD)

| Evento | Notifica? | Canal |
|--------|-----------|-------|
| Compra normal | ❌ | - |
| Limite atingido | ❌ | - |
| Tentativa bloqueada por categoria | ❌ | - |
| Tentativa bloqueada por restrição alimentar | ✅ | Push |
| Exceção que requer ação | ✅ | Push |

### 4.2 Serviço de Notificação

```typescript
// src/infrastructure/layers/LayersNotificationService.ts
import axios from 'axios';

interface NotificationPayload {
  target: {
    userId: string;
    communityId: string;
  };
  channels: ('push' | 'email')[];
  title: string;
  body: string;
  action?: {
    type: 'portal';
    portalId: string;
    path?: string;
  };
}

export class LayersNotificationService {
  private baseUrl = 'https://api.layers.digital/v1';
  private apiToken: string;
  private retryQueue: NotificationPayload[] = [];

  constructor() {
    this.apiToken = process.env.LAYERS_API_TOKEN!;
  }

  /**
   * Notifica responsável sobre tentativa bloqueada por restrição alimentar
   */
  async notifyDietaryBlock(params: {
    guardianUserId: string;
    communityId: string;
    studentName: string;
    restriction: string;
    itemAttempted: string;
  }): Promise<void> {
    await this.send({
      target: {
        userId: params.guardianUserId,
        communityId: params.communityId
      },
      channels: ['push'],
      title: 'Alerta Alimentar - Super Cantina',
      body: `${params.studentName} tentou comprar item com ${params.restriction}`,
      action: {
        type: 'portal',
        portalId: 'super-cantina',
        path: '/action-required'
      }
    });
  }

  /**
   * Notifica responsável sobre ação pendente
   */
  async notifyActionRequired(params: {
    guardianUserId: string;
    communityId: string;
    studentName: string;
    description: string;
  }): Promise<void> {
    await this.send({
      target: {
        userId: params.guardianUserId,
        communityId: params.communityId
      },
      channels: ['push'],
      title: 'Super Cantina',
      body: `Ação necessária: ${params.description}`,
      action: {
        type: 'portal',
        portalId: 'super-cantina',
        path: '/action-required'
      }
    });
  }

  private async send(payload: NotificationPayload): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/notifications/send`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      console.log('Notification sent successfully', {
        userId: payload.target.userId,
        title: payload.title
      });

    } catch (error) {
      console.error('Failed to send notification:', error);

      // Enfileirar para retry
      this.retryQueue.push(payload);
      this.scheduleRetry();
    }
  }

  private scheduleRetry(): void {
    // Implementar retry com backoff exponencial
    // Max 3 tentativas por notificação
  }
}
```

### 4.3 Integração com Domain Events

```typescript
// src/application/subscribers/NotificationSubscriber.ts
import { EventHandler } from '../../domain/events/EventHandler';
import { PurchaseBlockedNotify } from '../../domain/events/PurchaseBlockedNotify';
import { LayersNotificationService } from '../../infrastructure/layers/LayersNotificationService';
import { GuardianRepository } from '../../domain/repositories/GuardianRepository';

export class NotificationSubscriber implements EventHandler<PurchaseBlockedNotify> {
  constructor(
    private notificationService: LayersNotificationService,
    private guardianRepo: GuardianRepository
  ) {}

  async handle(event: PurchaseBlockedNotify): Promise<void> {
    // Buscar responsável do aluno
    const guardian = await this.guardianRepo.findPrimaryByStudentId(
      event.studentId
    );

    if (!guardian) {
      console.warn('No guardian found for student', event.studentId);
      return;
    }

    // Enviar notificação apropriada
    if (event.reason === 'DIETARY_RESTRICTION') {
      await this.notificationService.notifyDietaryBlock({
        guardianUserId: guardian.layersUserId,
        communityId: guardian.communityId,
        studentName: event.studentName,
        restriction: event.restrictionType!,
        itemAttempted: event.itemCategory
      });
    } else {
      await this.notificationService.notifyActionRequired({
        guardianUserId: guardian.layersUserId,
        communityId: guardian.communityId,
        studentName: event.studentName,
        description: `Tentativa de compra bloqueada: ${event.reason}`
      });
    }
  }
}
```

---

## 5. Mapeamento de Contexto

### 5.1 De Layers para Super Cantina

```typescript
// src/infrastructure/layers/LayersContextMapper.ts

interface LayersUser {
  userId: string;
  accountId: string;
  communityId: string;
  // Dados adicionais do Layers
  name?: string;
  email?: string;
  profiles?: string[];
}

interface SuperCantinaUser {
  id: string;
  layersUserId: string;
  schoolId: string;
  role: 'guardian' | 'student' | 'operator' | 'admin';
  name: string;
  email?: string;
}

export class LayersContextMapper {
  constructor(
    private userRepo: UserRepository,
    private schoolRepo: SchoolRepository
  ) {}

  async mapToInternalContext(layersContext: LayersUser): Promise<SuperCantinaUser> {
    // 1. Buscar escola pelo communityId
    const school = await this.schoolRepo.findByCommunityId(
      layersContext.communityId
    );

    if (!school) {
      throw new SchoolNotConfiguredError(
        `Escola não configurada: ${layersContext.communityId}`
      );
    }

    // 2. Buscar ou criar usuário
    let user = await this.userRepo.findByLayersId(layersContext.userId);

    if (!user) {
      // Primeiro acesso - buscar info adicional do Layers e criar
      const layersInfo = await this.fetchLayersUserInfo(layersContext);

      user = await this.userRepo.create({
        layersUserId: layersContext.userId,
        layersAccountId: layersContext.accountId,
        schoolId: school.id,
        name: layersInfo.name,
        email: layersInfo.email,
        role: this.determineRole(layersInfo.profiles)
      });
    }

    return {
      id: user.id,
      layersUserId: user.layersUserId,
      schoolId: school.id,
      role: user.role,
      name: user.name,
      email: user.email
    };
  }

  private determineRole(profiles?: string[]): UserRole {
    if (!profiles) return 'guardian';  // Default

    if (profiles.includes('admin_cantina') || profiles.includes('admin_escola')) {
      return 'admin';
    }
    if (profiles.includes('operador_cantina')) {
      return 'operator';
    }
    if (profiles.includes('aluno')) {
      return 'student';
    }

    return 'guardian';
  }
}
```

### 5.2 Sincronização de Dados

O Super Cantina **não** sincroniza dados completos do Layers. Mantém apenas:

| Dado | Origem | Sincronização |
|------|--------|---------------|
| ID do usuário | Layers | No login |
| ID da escola | Layers (communityId) | Configuração inicial |
| Nome do aluno | Cadastro manual ou import | Sob demanda |
| Regras | Super Cantina | Local |
| Transações | Super Cantina | Local |

---

## 6. Métodos do LayersPortal.js Utilizados

### 6.1 Controle de Interface

```typescript
// Sinalizar fim do loading
LayersPortal('ready');

// Atualizar título (quando mudar de estado)
LayersPortal('update', { title: 'Ação Necessária' });

// Fechar portal (após ação concluída)
LayersPortal('close');
```

### 6.2 Verificação de Plataforma

```typescript
// Adaptar UI baseado na plataforma
function adaptUI() {
  switch (LayersPortal.platform) {
    case 'ios':
      // Ajustes específicos iOS
      break;
    case 'android':
      // Ajustes específicos Android
      break;
    case 'iframe':
      // Versão web
      break;
  }
}
```

### 6.3 Idioma

```typescript
// Usar idioma preferido do usuário
function getLocale(): string {
  const preferred = LayersPortal.preferredLanguages;

  // Verificar se suportamos algum dos idiomas preferidos
  for (const lang of preferred) {
    if (['pt-BR', 'en', 'es'].includes(lang)) {
      return lang;
    }
  }

  return 'pt-BR';  // Fallback
}
```

---

## 7. Configuração de Ambiente

### 7.1 Variáveis de Ambiente

```env
# .env.production

# Layers Integration
LAYERS_API_TOKEN=seu_token_aqui
LAYERS_API_URL=https://api.layers.digital/v1

# App Registration
LAYERS_APP_ID=super-cantina
LAYERS_PORTAL_URL=https://supercantina.app.layers.digital

# Timeouts
LAYERS_SESSION_VALIDATE_TIMEOUT=5000
LAYERS_NOTIFICATION_TIMEOUT=10000
```

### 7.2 Registro do App no Layers

Para registrar o Super Cantina no Layers:

1. Acessar Developer Center: https://developers.layers.education
2. Preencher formulário de pré-cadastro
3. Configurar app com:
   - App ID: `super-cantina`
   - Portal URL: URL do frontend hospedado
   - Funcionalidades: Portais, Notificações
4. Aguardar aprovação e receber `LAYERS_API_TOKEN`

---

## 8. Troubleshooting

### Problema: Evento 'connected' não dispara

**Causas possíveis**:
1. `appId` incorreto no `LayersPortalOptions`
2. App não está sendo acessado via Layers
3. Script do LayersPortal.js não carregou

**Solução**:
```typescript
// Verificar se está no ambiente Layers
if (!window.LayersPortal) {
  console.error('LayersPortal não disponível');
  // Mostrar mensagem de erro ou redirecionar
}

// Verificar plataforma
if (LayersPortal.platform === null) {
  console.warn('Acessado fora do Layers');
}
```

### Problema: Validação de sessão falha

**Causas possíveis**:
1. `LAYERS_API_TOKEN` inválido ou expirado
2. Sessão expirada no lado do usuário
3. Parâmetros incorretos

**Solução**:
```typescript
// Log detalhado para debug
console.log('Validating session:', {
  session: params.session.substring(0, 10) + '...',
  communityId: params.communityId,
  userId: params.userId
});

// Verificar resposta
if (response.status === 401) {
  // Token da API inválido - verificar configuração
}
if (response.status === 404) {
  // Sessão não existe - usuário precisa relogar no Layers
}
```

### Problema: Notificações não chegam

**Causas possíveis**:
1. `userId` incorreto (deve ser o do Layers, não interno)
2. Usuário não tem app instalado
3. Permissões de notificação desabilitadas

**Solução**:
```typescript
// Usar sempre o layersUserId, não o ID interno
await notificationService.send({
  target: {
    userId: guardian.layersUserId,  // ✅ Correto
    // userId: guardian.id,         // ❌ Incorreto
    communityId: guardian.communityId
  },
  channels: ['push'],
  // ...
});
```

---

## Próximos Documentos

- [Autenticação SSO Detalhada](../06-SEGURANCA/autenticacao-sso.md)
- [Backend API](../02-BACKEND-API/autenticacao.md)
- [Frontend Integration](../03-FRONTEND/layers-portal-integration.md)
