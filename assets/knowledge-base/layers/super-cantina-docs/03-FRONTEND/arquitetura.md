# Arquitetura Frontend - Portal do Responsável

## Visão Geral

O frontend do Super Cantina é um **app embedded** que roda dentro da plataforma Layers Education. Seguindo a filosofia de UX invisível, a interface é minimalista com apenas **3 estados possíveis**.

> **Princípio**: O responsável abre o app menos de 1x por semana.

---

## Stack Tecnológico

| Tecnologia | Propósito |
|------------|-----------|
| React 18+ | Framework UI |
| TypeScript | Type safety |
| XState | State machine |
| React Query | Data fetching & cache |
| Tailwind CSS | Styling |
| Vite | Build tool |
| LayersPortal.js | Integração Layers |

---

## Estrutura do Projeto

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Root component
│
├── machines/                   # XState state machines
│   ├── dashboardMachine.ts     # Machine principal
│   └── actionMachine.ts        # Machine de ações
│
├── components/                 # Componentes React
│   ├── states/                 # Componentes por estado
│   │   ├── NormalState.tsx
│   │   ├── AttentionState.tsx
│   │   └── ActionState.tsx
│   │
│   ├── shared/                 # Componentes compartilhados
│   │   ├── StudentCard.tsx
│   │   ├── ActionCard.tsx
│   │   └── LoadingSpinner.tsx
│   │
│   └── layout/                 # Layout components
│       └── AppShell.tsx
│
├── hooks/                      # Custom hooks
│   ├── useLayersPortal.ts      # Hook integração Layers
│   ├── useDashboard.ts         # Hook do dashboard
│   └── useAction.ts            # Hook de ações
│
├── services/                   # API services
│   ├── api.ts                  # Cliente HTTP
│   ├── dashboard.service.ts    # Dashboard API
│   └── rules.service.ts        # Rules API
│
├── types/                      # TypeScript types
│   ├── dashboard.types.ts
│   ├── student.types.ts
│   └── action.types.ts
│
├── utils/                      # Utilitários
│   ├── format.ts               # Formatação
│   └── constants.ts            # Constantes
│
└── styles/                     # Estilos globais
    └── globals.css
```

---

## Fluxo de Inicialização

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INICIALIZAÇÃO                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. App carrega                                                              │
│     │                                                                        │
│     ▼                                                                        │
│  2. LayersPortal.ready() ──────────────────────────────────────────────┐    │
│     │                                                         (aguarda) │    │
│     ▼                                                                   │    │
│  3. Recebe session token ◄──────────────────────────────────────────────┘    │
│     │                                                                        │
│     ▼                                                                        │
│  4. Valida sessão no backend                                                 │
│     │                                                                        │
│     ├─── ❌ Inválida ───► Redirect para login Layers                        │
│     │                                                                        │
│     └─── ✅ Válida                                                           │
│           │                                                                  │
│           ▼                                                                  │
│  5. Carrega dashboard                                                        │
│     │                                                                        │
│     ▼                                                                        │
│  6. Renderiza estado (NORMAL | ATTENTION | ACTION_REQUIRED)                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Componente Principal

### App.tsx

```tsx
// src/App.tsx

import { useEffect } from 'react';
import { useMachine } from '@xstate/react';
import { useLayersPortal } from './hooks/useLayersPortal';
import { dashboardMachine } from './machines/dashboardMachine';
import { NormalState } from './components/states/NormalState';
import { AttentionState } from './components/states/AttentionState';
import { ActionState } from './components/states/ActionState';
import { LoadingSpinner } from './components/shared/LoadingSpinner';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

export function App() {
  const { isReady, session, error: layersError } = useLayersPortal();
  const [state, send] = useMachine(dashboardMachine);

  // Iniciar quando Layers estiver pronto
  useEffect(() => {
    if (isReady && session) {
      send({ type: 'INITIALIZE', session });
    }
  }, [isReady, session, send]);

  // Erro de integração Layers
  if (layersError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">Erro ao conectar com Layers</p>
      </div>
    );
  }

  // Loading
  if (state.matches('loading') || !isReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Erro
  if (state.matches('error')) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">{state.context.error}</p>
        <button onClick={() => send('RETRY')}>Tentar novamente</button>
      </div>
    );
  }

  // Renderizar estado correto
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {state.matches('normal') && (
          <NormalState
            students={state.context.students}
            message={state.context.message}
          />
        )}

        {state.matches('attention') && (
          <AttentionState
            students={state.context.students}
            message={state.context.message}
          />
        )}

        {state.matches('actionRequired') && (
          <ActionState
            students={state.context.students}
            actions={state.context.pendingActions}
            onActionResponse={(actionId, response) =>
              send({ type: 'RESPOND_ACTION', actionId, response })
            }
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
```

---

## Data Fetching

### React Query Setup

```tsx
// src/main.tsx

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time alto: dados mudam pouco
      staleTime: 60 * 1000, // 1 minuto

      // Cache time moderado
      gcTime: 5 * 60 * 1000, // 5 minutos

      // Retry conservador
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),

      // Refetch em foco (importante para app embedded)
      refetchOnWindowFocus: true,
    },
  },
});

function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}
```

### Dashboard Hook

```tsx
// src/hooks/useDashboard.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

export function useDashboard(enabled: boolean = true) {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.getDashboard(),
    enabled,
    // Poll a cada 1 minuto (dashboard muda pouco)
    refetchInterval: 60 * 1000,
  });
}

export function useRespondAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      actionId,
      response,
    }: {
      actionId: string;
      response: string;
    }) => dashboardService.respondToAction(actionId, response),

    onSuccess: () => {
      // Invalidar dashboard para recarregar
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
```

---

## API Service

### Dashboard Service

```typescript
// src/services/dashboard.service.ts

import { api } from './api';
import type { DashboardResponse, ActionResponse } from '../types';

export const dashboardService = {
  async getDashboard(): Promise<DashboardResponse> {
    const response = await api.get('/guardian/dashboard');
    return response.data;
  },

  async respondToAction(
    actionId: string,
    response: string
  ): Promise<ActionResponse> {
    const res = await api.post(`/guardian/action/${actionId}`, { response });
    return res.data;
  },

  async getStudentRules(studentId: string) {
    const response = await api.get(`/guardian/students/${studentId}/rules`);
    return response.data;
  },

  async updateStudentRules(studentId: string, updates: any) {
    const response = await api.patch(
      `/guardian/students/${studentId}/rules`,
      updates
    );
    return response.data;
  },
};
```

### API Client

```typescript
// src/services/api.ts

import axios from 'axios';
import { getLayersSession } from '../hooks/useLayersPortal';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// Interceptor para adicionar token
api.interceptors.request.use(config => {
  const session = getLayersSession();

  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }

  if (session?.communityId) {
    config.headers['X-Layers-Community'] = session.communityId;
  }

  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Sessão expirada - notificar Layers
      window.LayersPortal?.sessionExpired();
    }

    return Promise.reject(error);
  }
);
```

---

## Estilização

### Tailwind Config

```javascript
// tailwind.config.js

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cores alinhadas com Layers
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        // Estados UX
        state: {
          normal: '#10b981',    // Verde
          attention: '#f59e0b', // Amarelo
          action: '#ef4444',    // Vermelho
        },
      },
      // Animações sutis
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
```

### Estilos Globais

```css
/* src/styles/globals.css */

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    /* Fonte padrão Layers */
    font-family: 'Inter', system-ui, sans-serif;
  }

  body {
    @apply bg-gray-50 text-gray-900;
  }
}

@layer components {
  /* Estado card base */
  .state-card {
    @apply rounded-2xl p-6 shadow-sm transition-all duration-300;
  }

  .state-card-normal {
    @apply bg-green-50 border border-green-100;
  }

  .state-card-attention {
    @apply bg-amber-50 border border-amber-100;
  }

  .state-card-action {
    @apply bg-red-50 border border-red-100;
  }

  /* Botão primário */
  .btn-primary {
    @apply px-6 py-3 bg-primary-600 text-white rounded-lg
           font-medium transition-colors
           hover:bg-primary-700 active:bg-primary-800
           disabled:opacity-50 disabled:cursor-not-allowed;
  }

  /* Botão secundário */
  .btn-secondary {
    @apply px-6 py-3 bg-gray-100 text-gray-700 rounded-lg
           font-medium transition-colors
           hover:bg-gray-200 active:bg-gray-300;
  }
}
```

---

## Build & Deploy

### Vite Config

```typescript
// vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // Base path para embedded app
  base: '/apps/super-cantina/',

  build: {
    // Output otimizado
    target: 'es2020',
    minify: 'terser',

    // Chunks strategy
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          xstate: ['xstate', '@xstate/react'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },

  // Environment variables
  envPrefix: 'VITE_',
});
```

### Variáveis de Ambiente

```env
# .env.example

# API Backend
VITE_API_URL=https://api.supercantina.com/api/v1

# Layers Integration
VITE_LAYERS_APP_ID=super-cantina

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
```

---

## Performance

### Lazy Loading

```tsx
// src/App.tsx

import { lazy, Suspense } from 'react';

// Componentes carregados sob demanda
const RulesEditor = lazy(() => import('./components/RulesEditor'));

function App() {
  // ...

  return (
    <Suspense fallback={<LoadingSpinner />}>
      {showRulesEditor && <RulesEditor studentId={selectedStudent} />}
    </Suspense>
  );
}
```

### Memoização

```tsx
// src/components/shared/StudentCard.tsx

import { memo } from 'react';

interface StudentCardProps {
  student: StudentSummary;
}

export const StudentCard = memo(function StudentCard({
  student,
}: StudentCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-4">
        {student.photoUrl && (
          <img
            src={student.photoUrl}
            alt={student.name}
            className="w-12 h-12 rounded-full object-cover"
            loading="lazy"
          />
        )}
        <div>
          <h3 className="font-medium text-gray-900">{student.name}</h3>
          <p className="text-sm text-gray-500">{student.grade}</p>
        </div>
      </div>
    </div>
  );
});
```

---

## Testes

### Component Testing

```tsx
// src/components/states/__tests__/NormalState.test.tsx

import { render, screen } from '@testing-library/react';
import { NormalState } from '../NormalState';

describe('NormalState', () => {
  it('deve exibir mensagem de tudo certo', () => {
    render(
      <NormalState
        students={[]}
        message="Hoje está tudo certo"
      />
    );

    expect(screen.getByText('Hoje está tudo certo')).toBeInTheDocument();
  });

  it('deve exibir lista de alunos', () => {
    const students = [
      { id: '1', name: 'Maria', grade: '5º ano', status: 'OK', ... }
    ];

    render(<NormalState students={students} message="..." />);

    expect(screen.getByText('Maria')).toBeInTheDocument();
  });
});
```

### Hook Testing

```tsx
// src/hooks/__tests__/useDashboard.test.tsx

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboard } from '../useDashboard';

describe('useDashboard', () => {
  it('deve carregar dashboard com sucesso', async () => {
    const { result } = renderHook(() => useDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.state).toBe('NORMAL');
  });
});
```

---

## Referências

- [Integração LayersPortal.js](./layers-portal-integration.md)
- [State Machine](./state-machine.md)
- [Componentes UX](./componentes-ux.md)
