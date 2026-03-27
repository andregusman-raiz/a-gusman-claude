# Integração LayersPortal.js - Frontend

## Visão Geral

O Super Cantina é um **app embedded** na plataforma Layers Education. Toda comunicação com a plataforma é feita através da biblioteca `LayersPortal.js`.

---

## Instalação

### NPM

```bash
npm install @anthropic/layers-portal
```

### CDN (Alternativa)

```html
<script src="https://cdn.layers.digital/libs/LayersPortal.min.js"></script>
```

---

## Configuração Inicial

### main.tsx

```tsx
// src/main.tsx

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LayersPortalProvider } from './providers/LayersPortalProvider';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LayersPortalProvider>
      <App />
    </LayersPortalProvider>
  </StrictMode>
);
```

### Provider

```tsx
// src/providers/LayersPortalProvider.tsx

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';

interface LayersSession {
  token: string;
  userId: string;
  communityId: string;
  role: string;
  expiresAt: number;
}

interface LayersPortalContextValue {
  isReady: boolean;
  isConnected: boolean;
  session: LayersSession | null;
  error: Error | null;
  notifyParent: (type: string, payload?: any) => void;
  requestNavigation: (path: string) => void;
  closeApp: () => void;
}

const LayersPortalContext = createContext<LayersPortalContextValue | null>(null);

// Singleton para acesso fora de componentes
let globalSession: LayersSession | null = null;

export function getLayersSession(): LayersSession | null {
  return globalSession;
}

interface Props {
  children: ReactNode;
}

export function LayersPortalProvider({ children }: Props) {
  const [isReady, setIsReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [session, setSession] = useState<LayersSession | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    initializeLayersPortal();
  }, []);

  const initializeLayersPortal = async () => {
    try {
      // Verificar se LayersPortal está disponível
      if (typeof window.LayersPortal === 'undefined') {
        throw new Error('LayersPortal.js não carregado');
      }

      // Configurar callbacks
      window.LayersPortal.onReady(handleReady);
      window.LayersPortal.onSessionUpdate(handleSessionUpdate);
      window.LayersPortal.onDisconnect(handleDisconnect);
      window.LayersPortal.onError(handleError);

      // Inicializar
      await window.LayersPortal.init({
        appId: import.meta.env.VITE_LAYERS_APP_ID,
        version: '1.0.0',
        permissions: ['session', 'notifications', 'navigation'],
      });
    } catch (err) {
      setError(err as Error);
    }
  };

  const handleReady = (data: any) => {
    const newSession: LayersSession = {
      token: data.token,
      userId: data.userId,
      communityId: data.communityId,
      role: data.role,
      expiresAt: data.expiresAt,
    };

    setSession(newSession);
    globalSession = newSession;
    setIsReady(true);
    setIsConnected(true);
  };

  const handleSessionUpdate = (data: any) => {
    if (data.token) {
      const updatedSession: LayersSession = {
        ...session!,
        token: data.token,
        expiresAt: data.expiresAt,
      };
      setSession(updatedSession);
      globalSession = updatedSession;
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
  };

  const handleError = (err: any) => {
    setError(new Error(err.message || 'Erro LayersPortal'));
  };

  const notifyParent = useCallback((type: string, payload?: any) => {
    window.LayersPortal?.notify(type, payload);
  }, []);

  const requestNavigation = useCallback((path: string) => {
    window.LayersPortal?.navigate(path);
  }, []);

  const closeApp = useCallback(() => {
    window.LayersPortal?.close();
  }, []);

  const value: LayersPortalContextValue = {
    isReady,
    isConnected,
    session,
    error,
    notifyParent,
    requestNavigation,
    closeApp,
  };

  return (
    <LayersPortalContext.Provider value={value}>
      {children}
    </LayersPortalContext.Provider>
  );
}

export function useLayersPortal(): LayersPortalContextValue {
  const context = useContext(LayersPortalContext);

  if (!context) {
    throw new Error(
      'useLayersPortal deve ser usado dentro de LayersPortalProvider'
    );
  }

  return context;
}
```

---

## Hook Customizado

### useLayersPortal

```tsx
// src/hooks/useLayersPortal.ts

import { useCallback, useEffect, useRef } from 'react';
import { useLayersPortal as useLayersPortalContext } from '../providers/LayersPortalProvider';

export function useLayersPortal() {
  const context = useLayersPortalContext();
  const sessionCheckInterval = useRef<NodeJS.Timeout>();

  // Verificar expiração da sessão periodicamente
  useEffect(() => {
    if (!context.session) return;

    sessionCheckInterval.current = setInterval(() => {
      const now = Date.now();
      const expiresAt = context.session!.expiresAt;

      // Se faltam menos de 5 minutos, solicitar refresh
      if (expiresAt - now < 5 * 60 * 1000) {
        window.LayersPortal?.refreshSession();
      }
    }, 60 * 1000); // Verifica a cada minuto

    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
    };
  }, [context.session]);

  // Notificar Layers sobre mudança de estado
  const notifyStateChange = useCallback(
    (state: 'NORMAL' | 'ATTENTION' | 'ACTION_REQUIRED') => {
      context.notifyParent('stateChange', { state });
    },
    [context]
  );

  // Notificar Layers sobre erro
  const notifyError = useCallback(
    (error: Error) => {
      context.notifyParent('error', {
        message: error.message,
        stack: error.stack,
      });
    },
    [context]
  );

  // Solicitar notificação push
  const requestPushNotification = useCallback(
    (notification: {
      title: string;
      body: string;
      data?: Record<string, any>;
    }) => {
      context.notifyParent('pushNotification', notification);
    },
    [context]
  );

  return {
    ...context,
    notifyStateChange,
    notifyError,
    requestPushNotification,
  };
}

// Re-export para acesso fora de componentes
export { getLayersSession } from '../providers/LayersPortalProvider';
```

---

## Declaração de Tipos

### global.d.ts

```typescript
// src/types/global.d.ts

declare global {
  interface Window {
    LayersPortal?: LayersPortalAPI;
  }
}

interface LayersPortalAPI {
  init(options: LayersPortalOptions): Promise<void>;

  // Callbacks
  onReady(callback: (data: LayersReadyData) => void): void;
  onSessionUpdate(callback: (data: LayersSessionUpdate) => void): void;
  onDisconnect(callback: () => void): void;
  onError(callback: (error: LayersError) => void): void;

  // Actions
  notify(type: string, payload?: any): void;
  navigate(path: string): void;
  close(): void;
  refreshSession(): Promise<void>;
  sessionExpired(): void;
}

interface LayersPortalOptions {
  appId: string;
  version: string;
  permissions: string[];
}

interface LayersReadyData {
  token: string;
  userId: string;
  communityId: string;
  role: string;
  expiresAt: number;
}

interface LayersSessionUpdate {
  token?: string;
  expiresAt?: number;
}

interface LayersError {
  code: string;
  message: string;
}

export {};
```

---

## Fluxo de Autenticação

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUXO DE AUTENTICAÇÃO                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐                                                            │
│   │ Usuário abre│                                                            │
│   │ app Layers  │                                                            │
│   └──────┬──────┘                                                            │
│          │                                                                   │
│          ▼                                                                   │
│   ┌─────────────┐     ┌─────────────┐                                        │
│   │ Layers SSO  │────►│ Sessão      │                                        │
│   │ (já logado) │     │ criada      │                                        │
│   └─────────────┘     └──────┬──────┘                                        │
│                              │                                               │
│          ┌───────────────────┘                                               │
│          ▼                                                                   │
│   ┌─────────────┐                                                            │
│   │ Abre Super  │                                                            │
│   │ Cantina     │                                                            │
│   └──────┬──────┘                                                            │
│          │                                                                   │
│          ▼                                                                   │
│   ┌─────────────────────────────────────────┐                                │
│   │ LayersPortal.init()                     │                                │
│   │                                         │                                │
│   │  • Conecta com parent window            │                                │
│   │  • Solicita token de sessão             │                                │
│   │  • Registra callbacks                   │                                │
│   └──────────────────┬──────────────────────┘                                │
│                      │                                                       │
│                      ▼                                                       │
│   ┌─────────────────────────────────────────┐                                │
│   │ LayersPortal.onReady()                  │                                │
│   │                                         │                                │
│   │  Recebe:                                │                                │
│   │  • token (JWT válido)                   │                                │
│   │  • userId                               │                                │
│   │  • communityId                          │                                │
│   │  • role                                 │                                │
│   │  • expiresAt                            │                                │
│   └──────────────────┬──────────────────────┘                                │
│                      │                                                       │
│                      ▼                                                       │
│   ┌─────────────────────────────────────────┐                                │
│   │ App usa token para chamar API           │                                │
│   │                                         │                                │
│   │  Authorization: Bearer <token>          │                                │
│   │  X-Layers-Community: <communityId>      │                                │
│   └─────────────────────────────────────────┘                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tratamento de Erros

### Sessão Expirada

```tsx
// src/services/api.ts

api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Tentar refresh
      try {
        await window.LayersPortal?.refreshSession();

        // Retry da requisição com novo token
        const newSession = getLayersSession();
        if (newSession) {
          error.config.headers.Authorization = `Bearer ${newSession.token}`;
          return api.request(error.config);
        }
      } catch {
        // Refresh falhou - notificar Layers
        window.LayersPortal?.sessionExpired();
      }
    }

    return Promise.reject(error);
  }
);
```

### Desconexão

```tsx
// src/App.tsx

function App() {
  const { isConnected, error } = useLayersPortal();

  // Mostra mensagem se desconectado
  if (!isConnected && !error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-4">
            Reconectando com Layers...
          </p>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // ...
}
```

---

## Notificações

### Enviar Notificação Push

```tsx
// src/components/ActionCard.tsx

function ActionCard({ action, onRespond }) {
  const { requestPushNotification } = useLayersPortal();

  const handleRespond = async (response: string) => {
    await onRespond(action.id, response);

    // Notificar via push se necessário
    if (response === 'ALLOW_TODAY') {
      requestPushNotification({
        title: 'Super Cantina',
        body: `Compra liberada para ${action.studentName} hoje`,
        data: { actionId: action.id },
      });
    }
  };

  // ...
}
```

---

## Navegação

### Navegar para Outras Áreas do Layers

```tsx
// src/components/shared/NavigationHelper.tsx

function NavigationHelper() {
  const { requestNavigation } = useLayersPortal();

  const goToProfile = () => {
    requestNavigation('/profile');
  };

  const goToHelp = () => {
    requestNavigation('/help/super-cantina');
  };

  return (
    <div className="flex gap-2">
      <button onClick={goToProfile}>Meu Perfil</button>
      <button onClick={goToHelp}>Ajuda</button>
    </div>
  );
}
```

---

## Analytics

### Tracking de Eventos

```tsx
// src/hooks/useAnalytics.ts

import { useCallback } from 'react';
import { useLayersPortal } from './useLayersPortal';

export function useAnalytics() {
  const { notifyParent, session } = useLayersPortal();

  const trackEvent = useCallback(
    (eventName: string, properties?: Record<string, any>) => {
      notifyParent('analytics', {
        event: eventName,
        properties: {
          ...properties,
          userId: session?.userId,
          communityId: session?.communityId,
          timestamp: new Date().toISOString(),
        },
      });
    },
    [notifyParent, session]
  );

  const trackPageView = useCallback(
    (pageName: string) => {
      trackEvent('page_view', { page: pageName });
    },
    [trackEvent]
  );

  const trackAction = useCallback(
    (actionType: string, actionId: string, response: string) => {
      trackEvent('action_response', {
        actionType,
        actionId,
        response,
      });
    },
    [trackEvent]
  );

  return {
    trackEvent,
    trackPageView,
    trackAction,
  };
}
```

---

## Testes

### Mock do LayersPortal

```typescript
// src/test/mocks/layersPortal.ts

export const mockLayersPortal = {
  init: jest.fn().mockResolvedValue(undefined),

  onReady: jest.fn((callback) => {
    callback({
      token: 'mock-token',
      userId: 'user-123',
      communityId: 'community-1',
      role: 'guardian',
      expiresAt: Date.now() + 3600000,
    });
  }),

  onSessionUpdate: jest.fn(),
  onDisconnect: jest.fn(),
  onError: jest.fn(),

  notify: jest.fn(),
  navigate: jest.fn(),
  close: jest.fn(),
  refreshSession: jest.fn().mockResolvedValue(undefined),
  sessionExpired: jest.fn(),
};

// Setup antes dos testes
beforeEach(() => {
  window.LayersPortal = mockLayersPortal;
});
```

### Teste de Integração

```tsx
// src/__tests__/layersIntegration.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import { LayersPortalProvider } from '../providers/LayersPortalProvider';
import { App } from '../App';

describe('Layers Integration', () => {
  it('deve inicializar corretamente com LayersPortal', async () => {
    render(
      <LayersPortalProvider>
        <App />
      </LayersPortalProvider>
    );

    await waitFor(() => {
      expect(mockLayersPortal.init).toHaveBeenCalled();
    });

    // App deve estar pronto
    expect(screen.queryByText(/Carregando/i)).not.toBeInTheDocument();
  });

  it('deve incluir token nas requisições', async () => {
    // ...
  });
});
```

---

## Referências

- [Documentação LayersPortal.js](../../layers-portal-docs/README.md)
- [Autenticação SSO](../../layers-portal-docs/04-AUTENTICACAO-SSO.md)
- [Exemplos Práticos](../../layers-portal-docs/05-EXEMPLOS-PRATICOS.md)
