---
name: ag-referencia-nextjs
description: Patterns e convencoes para projetos Next.js com React
context: fork
user-invocable: false
---

# Skill: Next.js + React Patterns

Referencia de patterns e convencoes para projetos Next.js + React.

## Quando Ativar

- Trabalhando em projeto Next.js
- Criando componentes React
- Decidindo entre Server e Client Components

## App Router (Next.js 13+)

### Estrutura de Pastas

```
src/app/
├── layout.tsx          # Root layout (Server Component)
├── page.tsx            # Home page
├── loading.tsx         # Loading UI
├── error.tsx           # Error boundary (Client Component)
├── not-found.tsx       # 404 page
├── (auth)/             # Route group
│   ├── login/page.tsx
│   └── register/page.tsx
├── dashboard/
│   ├── layout.tsx      # Nested layout
│   └── [id]/page.tsx   # Dynamic route
└── api/
    └── route.ts        # API route handler
```

### Server vs Client Components

| Criterio | Server Component | Client Component |
|----------|-----------------|------------------|
| Default | Sim (padrao) | Precisa `'use client'` |
| Fetch data | Sim (async/await) | Via hooks |
| useState/useEffect | Nao | Sim |
| Event handlers | Nao | Sim |
| Bundle size | Nao inclui | Inclui no bundle |

**Regra**: Comece como Server Component. Adicione `'use client'` apenas quando precisar de interatividade.

### Data Fetching (Server Component)

```typescript
export default async function UsersPage() {
  const users = await getUsers();
  return <UserList users={users} />;
}
```

### Composicao Server + Client

```typescript
export default async function Page() {
  const data = await fetchData();
  return (
    <div>
      <h1>Server rendered</h1>
      <InteractiveWidget initialData={data} />
    </div>
  );
}
```

## React Patterns

### Custom Hooks

```typescript
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}
```

### Error Boundaries

```typescript
'use client';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <h2>Algo deu errado</h2>
      <button onClick={reset}>Tentar novamente</button>
    </div>
  );
}
```

## Tailwind CSS

- **Responsive**: mobile-first (`sm:`, `md:`, `lg:`, `xl:`)
- **Dark mode**: `dark:` prefix
- **Hover/Focus**: `hover:`, `focus:`, `focus-visible:`

## Performance

1. **Image**: Sempre usar `next/image` com `width` e `height`
2. **Fonts**: Usar `next/font`
3. **Dynamic imports**: `next/dynamic` para lazy loading
4. **Memoization**: `useMemo`/`useCallback` apenas quando necessario
5. **Suspense**: Para loading states granulares
