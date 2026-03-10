# UI & Design System Patterns (Cross-Project)

## Tailwind CSS Conventions

### Utility-First
```tsx
// BOM — utility-first para componentes unicos
<button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
  Save
</button>

// BOM — extrair componente quando repeticao > 2x
function Button({ children, variant = 'primary', ...props }) {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  return (
    <button className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${variants[variant]}`} {...props}>
      {children}
    </button>
  );
}
```

### Spacing Scale
| Token | Valor | Uso |
|-------|-------|-----|
| `gap-1` / `p-1` | 4px | Dentro de componentes compactos |
| `gap-2` / `p-2` | 8px | Padding interno padrao |
| `gap-4` / `p-4` | 16px | Espacamento entre elementos |
| `gap-6` / `p-6` | 24px | Secoes dentro de cards |
| `gap-8` / `p-8` | 32px | Secoes de pagina |

## Server vs Client Components

### Decision Tree
```
Componente precisa de...
├── useState, useEffect, event handlers → 'use client'
├── Apenas render de dados do server → Server Component (default)
├── Fetch de dados + interatividade → Split:
│   ├── ServerWrapper.tsx (fetch) → passa data como props
│   └── ClientInteractive.tsx ('use client') → recebe props
└── Context provider → 'use client' (mas children podem ser Server)
```

### Pattern: Server Wrapper + Client Interactive
```tsx
// ServerWrapper.tsx (Server Component — default)
import { createClient } from '@/lib/supabase/server';
import { ClientDashboard } from './ClientDashboard';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data } = await supabase.from('projects').select('*');
  return <ClientDashboard initialData={data} />;
}

// ClientDashboard.tsx
'use client';
import { useState } from 'react';

export function ClientDashboard({ initialData }: { initialData: Project[] }) {
  const [filter, setFilter] = useState('');
  // interatividade aqui...
}
```

## Form Handling (react-hook-form + Zod)

### Pattern
```tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(1, 'Nome obrigatorio').max(200),
  email: z.string().email('Email invalido'),
  role: z.enum(['admin', 'member', 'viewer']),
});

type FormValues = z.infer<typeof formSchema>;

export function UserForm({ onSubmit }: { onSubmit: (data: FormValues) => Promise<void> }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { role: 'member' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nome</label>
        <input {...register('name')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>
      <button type="submit" disabled={isSubmitting} className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
        {isSubmitting ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  );
}
```

## Dark Mode

### CSS Variables + Tailwind
```css
/* globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --card: 0 0% 100%;
  --border: 214 32% 91%;
  --muted: 210 40% 96%;
}

.dark {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
  --card: 222 47% 15%;
  --border: 217 33% 25%;
  --muted: 217 33% 18%;
}
```

```typescript
// tailwind.config.ts
export default {
  darkMode: 'class', // toggle via classe no <html>
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
      },
    },
  },
};
```

## Accessibility Checklist

### Obrigatorio
- [ ] Todas as imagens tem `alt` descritivo (ou `alt=""` se decorativa)
- [ ] Formularios com `<label>` associado a cada input
- [ ] Contraste minimo 4.5:1 para texto, 3:1 para elementos grandes
- [ ] Navegacao por teclado funcional (Tab, Enter, Escape)
- [ ] Focus visible em todos os elementos interativos
- [ ] ARIA roles corretos para componentes custom (dialog, menu, tabs)
- [ ] Skip link para conteudo principal

### Pattern: Focus Trap (modais)
```tsx
// Usar radix-ui ou headless-ui que ja implementam focus trap
import * as Dialog from '@radix-ui/react-dialog';
```

## Component Composition Patterns

### Compound Component
```tsx
// Uso: <Card><Card.Header>...</Card.Header><Card.Body>...</Card.Body></Card>
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border bg-card ${className}`}>{children}</div>;
}
Card.Header = ({ children }: { children: React.ReactNode }) => (
  <div className="border-b px-6 py-4 font-semibold">{children}</div>
);
Card.Body = ({ children }: { children: React.ReactNode }) => (
  <div className="px-6 py-4">{children}</div>
);
```

### Render Props (flexibilidade maxima)
```tsx
interface DataListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyState?: React.ReactNode;
}

function DataList<T>({ data, renderItem, emptyState }: DataListProps<T>) {
  if (data.length === 0) return emptyState ?? <p>Nenhum item</p>;
  return <ul className="divide-y">{data.map((item, i) => <li key={i}>{renderItem(item, i)}</li>)}</ul>;
}
```

## Quiet Intelligence UI

### Principios
1. **Minimal** — Cada elemento na tela deve justificar sua existencia
2. **Data-dense** — Mostrar informacao util, nao decoracao
3. **Purposeful motion** — Animacoes apenas para feedback (nao distraction)
4. **Progressive disclosure** — Complexidade revelada sob demanda

### Na pratica
```tsx
// BOM — informacao densa, sem decoracao
<div className="grid grid-cols-3 gap-4 text-sm">
  <div><span className="text-muted-foreground">Users</span> <span className="font-mono">1,234</span></div>
  <div><span className="text-muted-foreground">Active</span> <span className="font-mono text-green-600">98.2%</span></div>
  <div><span className="text-muted-foreground">Errors</span> <span className="font-mono text-red-600">3</span></div>
</div>

// MAL — decoracao excessiva
<div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-2xl p-8">
  <h2 className="text-3xl font-bold text-white animate-pulse">Welcome!</h2>
</div>
```

### Transitions (purposeful only)
```css
/* BOM — feedback sutil */
.interactive { transition: color 150ms, background-color 150ms; }

/* MAL — animacao distrativa */
.decorative { animation: bounce 1s infinite; }
```

## NUNCA
- `animate-pulse` ou `animate-bounce` em elementos de conteudo
- Gradientes decorativos sem funcao informacional
- Modais sem focus trap e Escape para fechar
- Forms sem feedback de erro inline
- Componentes client-side quando server component resolve
- CSS-in-JS em projetos com Tailwind (escolher um)
- `!important` em estilos (indica problema de especificidade)
