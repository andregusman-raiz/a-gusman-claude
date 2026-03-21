# Componentes UX - 3 Estados

## Visão Geral

A interface do Super Cantina segue o princípio de **UX invisível**. Existem apenas **3 estados visuais** possíveis, cada um com propósito específico.

> **Regra de Ouro**: O usuário deve entender a situação em **menos de 3 segundos**.

---

## Os 3 Estados

| Estado | Frequência | Cor | Propósito |
|--------|------------|-----|-----------|
| NORMAL | 95% | Verde | "Tudo certo, pode fechar" |
| ATTENTION | 4% | Amarelo | "Algo aconteceu, já resolvemos" |
| ACTION_REQUIRED | 1% | Vermelho | "Precisa da sua resposta" |

---

## Estado NORMAL

> "Hoje está tudo certo"

Este é o estado **padrão**. O responsável vê e fecha o app em segundos.

### Design

```
┌─────────────────────────────────────────┐
│                                         │
│         ✓ Hoje está tudo certo          │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  👦 João Silva                   │    │
│  │  5º ano                         │    │
│  │  ████████████░░░░ R$ 25/50      │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  👧 Maria Silva                  │    │
│  │  3º ano                         │    │
│  │  ██████████████░░ R$ 35/50      │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

### Componente

```tsx
// src/components/states/NormalState.tsx

import { CheckCircle } from 'lucide-react';
import { StudentCard } from '../shared/StudentCard';
import type { StudentSummary } from '../../types';

interface Props {
  students: StudentSummary[];
  message: string;
}

export function NormalState({ students, message }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header com mensagem principal */}
      <header className="pt-12 pb-8 px-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {message}
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Última atualização: agora
        </p>
      </header>

      {/* Lista de alunos */}
      <main className="px-4 pb-8">
        <div className="space-y-3">
          {students.map(student => (
            <StudentCard
              key={student.id}
              student={student}
              variant="normal"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
```

---

## Estado ATTENTION

> "Limite atingido, sistema resolveu"

O sistema já tomou uma ação. O responsável é apenas **informado**.

### Design

```
┌─────────────────────────────────────────┐
│                                         │
│         ⚡ Limite atingido              │
│         Sistema resolveu                │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  👦 João Silva                   │    │
│  │  5º ano                         │    │
│  │  ████████████████ R$ 50/50      │    │
│  │                                 │    │
│  │  ⚠️ Limite diário atingido      │    │
│  │  Próximas compras bloqueadas    │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  👧 Maria Silva                  │    │
│  │  3º ano                         │    │
│  │  ██████████░░░░░░ R$ 25/50      │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

### Componente

```tsx
// src/components/states/AttentionState.tsx

import { AlertTriangle } from 'lucide-react';
import { StudentCard } from '../shared/StudentCard';
import type { StudentSummary } from '../../types';

interface Props {
  students: StudentSummary[];
  message: string;
}

export function AttentionState({ students, message }: Props) {
  // Separar alunos com atenção
  const studentsWithAttention = students.filter(
    s => s.status === 'LIMIT_REACHED'
  );
  const studentsNormal = students.filter(
    s => s.status !== 'LIMIT_REACHED'
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Header */}
      <header className="pt-12 pb-8 px-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {message}
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Nenhuma ação necessária
        </p>
      </header>

      {/* Alunos com atenção primeiro */}
      <main className="px-4 pb-8">
        {studentsWithAttention.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-500 mb-3 px-2">
              Limite atingido
            </h2>
            <div className="space-y-3">
              {studentsWithAttention.map(student => (
                <StudentCard
                  key={student.id}
                  student={student}
                  variant="attention"
                  showLimitWarning
                />
              ))}
            </div>
          </div>
        )}

        {/* Demais alunos */}
        {studentsNormal.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-3 px-2">
              Tudo certo
            </h2>
            <div className="space-y-3">
              {studentsNormal.map(student => (
                <StudentCard
                  key={student.id}
                  student={student}
                  variant="normal"
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
```

---

## Estado ACTION_REQUIRED

> "Precisa da sua atenção"

O sistema **precisa de uma decisão** do responsável. Exibe ações pendentes com opções claras.

### Design

```
┌─────────────────────────────────────────┐
│                                         │
│         🔔 Precisa da sua atenção       │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  ⚠️ Compra bloqueada            │    │
│  │                                 │    │
│  │  João tentou comprar um item    │    │
│  │  com lactose às 10:15           │    │
│  │                                 │    │
│  │  ┌───────────────┐  ┌─────────┐ │    │
│  │  │ Manter bloq.  │  │Liberar  │ │    │
│  │  │   (Primário)  │  │ hoje    │ │    │
│  │  └───────────────┘  └─────────┘ │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  👦 João Silva                   │    │
│  │  5º ano                         │    │
│  │  ████████████░░░░ R$ 30/50      │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

### Componente

```tsx
// src/components/states/ActionState.tsx

import { Bell } from 'lucide-react';
import { ActionCard } from '../shared/ActionCard';
import { StudentCard } from '../shared/StudentCard';
import type { StudentSummary, PendingAction } from '../../types';

interface Props {
  students: StudentSummary[];
  actions: PendingAction[];
  onActionResponse: (actionId: string, response: string) => void;
}

export function ActionState({ students, actions, onActionResponse }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      {/* Header */}
      <header className="pt-12 pb-8 px-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4 animate-pulse">
          <Bell className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Precisa da sua atenção
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          {actions.length} {actions.length === 1 ? 'ação pendente' : 'ações pendentes'}
        </p>
      </header>

      {/* Ações pendentes */}
      <main className="px-4 pb-8">
        <div className="space-y-4 mb-8">
          {actions.map(action => (
            <ActionCard
              key={action.id}
              action={action}
              onRespond={(response) => onActionResponse(action.id, response)}
            />
          ))}
        </div>

        {/* Divisor */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-sm text-gray-500">
              Seus alunos
            </span>
          </div>
        </div>

        {/* Lista de alunos */}
        <div className="space-y-3">
          {students.map(student => (
            <StudentCard
              key={student.id}
              student={student}
              variant="normal"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
```

---

## Componentes Compartilhados

### StudentCard

```tsx
// src/components/shared/StudentCard.tsx

import { memo } from 'react';
import { AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import type { StudentSummary } from '../../types';

interface Props {
  student: StudentSummary;
  variant: 'normal' | 'attention' | 'action';
  showLimitWarning?: boolean;
}

export const StudentCard = memo(function StudentCard({
  student,
  variant,
  showLimitWarning = false,
}: Props) {
  const { name, photoUrl, grade, todaySummary } = student;
  const { totalSpent, dailyLimit, remainingPercent } = todaySummary;

  const progressColor = getProgressColor(remainingPercent, variant);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      {/* Header com foto e nome */}
      <div className="flex items-center gap-3 mb-3">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className="w-12 h-12 rounded-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-xl">{getInitial(name)}</span>
          </div>
        )}
        <div>
          <h3 className="font-medium text-gray-900">{name}</h3>
          <p className="text-sm text-gray-500">{grade}</p>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            {formatCurrency(totalSpent)} / {formatCurrency(dailyLimit)}
          </span>
          <span className={`font-medium ${progressColor.text}`}>
            {remainingPercent}% restante
          </span>
        </div>

        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${progressColor.bar}`}
            style={{ width: `${100 - remainingPercent}%` }}
          />
        </div>
      </div>

      {/* Warning se limite atingido */}
      {showLimitWarning && remainingPercent === 0 && (
        <div className="mt-3 flex items-center gap-2 text-amber-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Limite diário atingido - próximas compras bloqueadas</span>
        </div>
      )}
    </div>
  );
});

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

function getProgressColor(percent: number, variant: string) {
  if (variant === 'attention' || percent === 0) {
    return { bar: 'bg-amber-500', text: 'text-amber-600' };
  }
  if (percent < 30) {
    return { bar: 'bg-amber-400', text: 'text-amber-500' };
  }
  return { bar: 'bg-green-500', text: 'text-green-600' };
}
```

### ActionCard

```tsx
// src/components/shared/ActionCard.tsx

import { useState } from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';
import type { PendingAction, ActionOption } from '../../types';

interface Props {
  action: PendingAction;
  onRespond: (response: string) => void;
}

export function ActionCard({ action, onRespond }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleRespond = async (response: string) => {
    setSelectedOption(response);
    setIsSubmitting(true);

    try {
      await onRespond(response);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-md border-l-4 border-red-400">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-red-100 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{action.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{action.description}</p>
          <p className="text-xs text-gray-400 mt-2">
            {formatRelativeTime(action.createdAt)}
          </p>
        </div>
      </div>

      {/* Opções de resposta */}
      <div className="flex gap-3">
        {action.options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleRespond(option.action)}
            disabled={isSubmitting}
            className={`
              flex-1 py-3 px-4 rounded-lg font-medium transition-all
              ${getButtonStyle(option.type)}
              ${isSubmitting && selectedOption === option.action ? 'animate-pulse' : ''}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function getButtonStyle(type: 'primary' | 'secondary' | 'destructive'): string {
  switch (type) {
    case 'primary':
      return 'bg-gray-900 text-white hover:bg-gray-800';
    case 'secondary':
      return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    case 'destructive':
      return 'bg-red-600 text-white hover:bg-red-700';
  }
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Agora mesmo';
  if (diffMins < 60) return `Há ${diffMins} minutos`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Há ${diffHours} horas`;

  return date.toLocaleDateString('pt-BR');
}
```

### LoadingSpinner

```tsx
// src/components/shared/LoadingSpinner.tsx

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-gray-200 rounded-full" />
        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary-500 rounded-full border-t-transparent animate-spin" />
      </div>
      <p className="text-gray-500 text-sm">Carregando...</p>
    </div>
  );
}
```

---

## Utilitários de Formatação

```typescript
// src/utils/format.ts

/**
 * Formata valor em centavos para moeda brasileira
 */
export function formatCurrency(cents: number): string {
  const reais = cents / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(reais);
}

/**
 * Formata porcentagem
 */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Formata data relativa
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `${diffDays} dias atrás`;

  return d.toLocaleDateString('pt-BR');
}
```

---

## Acessibilidade

### Requisitos

- [ ] Contraste WCAG AA (4.5:1 para texto)
- [ ] Labels em todos os botões
- [ ] Estados de foco visíveis
- [ ] Suporte a leitor de tela
- [ ] Navegação por teclado

### Implementação

```tsx
// Exemplo de botão acessível
<button
  onClick={handleClick}
  disabled={isLoading}
  aria-label={`${option.label} para ${action.studentName}`}
  aria-busy={isLoading}
  className="focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
>
  {option.label}
</button>
```

---

## Responsividade

```css
/* Breakpoints */
@media (max-width: 375px) {
  /* iPhone SE */
  .action-buttons {
    flex-direction: column;
  }
}

@media (min-width: 768px) {
  /* Tablet */
  .student-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}
```

---

## Referências

- [Arquitetura Frontend](./arquitetura.md)
- [State Machine](./state-machine.md)
- [Integração LayersPortal.js](./layers-portal-integration.md)
