# Caching & State Patterns (Cross-Project)

## Upstash Redis

### Rate Limiting
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
  analytics: true,
});

export async function middleware(req: NextRequest) {
  const ip = req.ip ?? '127.0.0.1';
  const { success, limit, remaining, reset } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) } }
    );
  }
}
```

### Session Cache
```typescript
const redis = Redis.fromEnv();

// Cache de sessao (TTL curto)
await redis.set(`session:${userId}`, sessionData, { ex: 3600 }); // 1h
const session = await redis.get(`session:${userId}`);

// Cache de query (TTL medio)
const cacheKey = `query:${hashOfParams}`;
const cached = await redis.get(cacheKey);
if (cached) return cached;
const result = await expensiveQuery();
await redis.set(cacheKey, result, { ex: 300 }); // 5min
```

## Client-Side Caching (React Query / SWR)

### React Query Pattern
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch com cache
function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/v1/users').then(r => r.json()),
    staleTime: 5 * 60 * 1000,    // 5min antes de considerar stale
    gcTime: 30 * 60 * 1000,      // 30min no garbage collection
  });
}

// Mutation com invalidacao
function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserInput) =>
      fetch('/api/v1/users', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
```

## Next.js Caching Layers

### Fetch Cache (request-level)
```typescript
// Revalidate a cada 60s
const data = await fetch(url, { next: { revalidate: 60 } });

// Sem cache (dados em tempo real)
const data = await fetch(url, { cache: 'no-store' });
```

### Route Segment Config
```typescript
// Em page.tsx ou layout.tsx
export const dynamic = 'force-dynamic';    // Sem cache (SSR a cada request)
export const revalidate = 3600;            // ISR: revalidate a cada 1h
```

### Full Route Cache vs Data Cache
| Layer | Escopo | Invalidacao |
|-------|--------|-------------|
| Fetch cache | Por request fetch | `revalidate`, `revalidateTag()` |
| Data cache | Respostas de fetch | `revalidatePath()`, `revalidateTag()` |
| Full route cache | Pagina renderizada | Rebuild ou `revalidatePath()` |
| Router cache | Client-side nav | Automatico (30s dynamic, 5min static) |

## Cache Invalidation Strategies

### TTL (Time-To-Live)
- Simples, previsivel, pode servir dados stale
- Usar para: dados que mudam pouco (configs, listas publicas)

### Event-Based
```typescript
// Apos mutation, invalidar cache relevante
await supabase.from('items').insert(newItem);
await redis.del(`items:list:${orgId}`);
// Ou com tags do Next.js
revalidateTag('items');
```

### Manual (on-demand)
```typescript
// API route para invalidar cache manualmente
export async function POST(req: NextRequest) {
  revalidatePath('/dashboard');
  return NextResponse.json({ revalidated: true });
}
```

## Session State (AI Agents)

### Filesystem-Based
```json
// session-state.json — preservar progresso entre /compact e /clear
{
  "task": "Implementar auth flow",
  "branch": "feat/auth-flow",
  "filesModified": ["src/app/api/auth/route.ts", "src/lib/auth.service.ts"],
  "testCommand": "npx vitest run src/lib/__tests__/auth.test.ts",
  "progress": "3/5 endpoints implementados",
  "lastError": null
}
```

## Quando NAO Cachear

| Cenario | Motivo |
|---------|--------|
| Dados com RLS (user-specific) | Cache compartilhado ignora permissoes |
| Dados em tempo real | Stale data inaceitavel |
| Operacoes de escrita | Risco de inconsistencia |
| Dados sensiveis (PII) | Risco de vazamento via cache |
| Dados com alta cardinalidade | Cache hit ratio muito baixo |

## NUNCA
- Cachear respostas que passam por RLS sem separar por user
- Usar cache sem TTL (memory leak)
- Ignorar invalidacao apos mutation
- Cachear erros (retry deve buscar dados frescos)
- Servir dados stale para operacoes financeiras/criticas
