# API Design Patterns (Cross-Project)

## Route Handler Structure (Next.js App Router)

### File Convention
```
src/app/api/
├── v1/
│   ├── users/
│   │   ├── route.ts          # GET (list), POST (create)
│   │   └── [id]/
│   │       └── route.ts      # GET (detail), PUT (update), DELETE
│   ├── projects/
│   │   └── route.ts
│   └── health/
│       └── route.ts
```

### Handler Template
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from('items').select('*');

    if (error) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data, error: null, meta: { count: data.length } });
  } catch (err) {
    return NextResponse.json(
      { error: { code: 'INTERNAL', message: 'Unexpected error' } },
      { status: 500 }
    );
  }
}
```

## Standard Response Format

### Success
```json
{
  "data": { ... },
  "error": null,
  "meta": {
    "count": 25,
    "cursor": "abc123",
    "hasMore": true
  }
}
```

### Error
```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [
      { "field": "email", "message": "Must be a valid email address" }
    ]
  }
}
```

### Error Codes (padrao)
| Code | HTTP | Significado |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Input invalido |
| `UNAUTHORIZED` | 401 | Sem autenticacao |
| `FORBIDDEN` | 403 | Sem permissao |
| `NOT_FOUND` | 404 | Recurso nao encontrado |
| `CONFLICT` | 409 | Estado conflitante |
| `RATE_LIMITED` | 429 | Muitas requests |
| `INTERNAL` | 500 | Erro inesperado |
| `DB_ERROR` | 500 | Erro de banco |

## Zod Validation Pattern

### Request Body
```typescript
const createUserSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']).default('viewer'),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        details: parsed.error.issues.map(i => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      },
    }, { status: 400 });
  }

  // parsed.data e tipado corretamente
  const { name, email, role } = parsed.data;
  // ...
}
```

### Query Parameters
```typescript
const listSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['created_at', 'name']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = listSchema.safeParse(params);
  // ...
}
```

## Pagination

### Cursor-Based (preferido para feeds, listas grandes)
```typescript
const { data } = await supabase
  .from('items')
  .select('*')
  .order('created_at', { ascending: false })
  .lt('created_at', cursor) // cursor = ultimo created_at da pagina anterior
  .limit(limit + 1);        // +1 para saber se hasMore

const hasMore = data.length > limit;
const items = hasMore ? data.slice(0, -1) : data;
const nextCursor = hasMore ? items[items.length - 1].created_at : null;

return { data: items, meta: { cursor: nextCursor, hasMore } };
```

### Offset-Based (quando precisa de page numbers)
```typescript
const from = (page - 1) * limit;
const to = from + limit - 1;
const { data, count } = await supabase
  .from('items')
  .select('*', { count: 'exact' })
  .range(from, to);

return { data, meta: { page, limit, total: count, pages: Math.ceil(count / limit) } };
```

## Versioning

### URL Prefix Pattern
```
/api/v1/users     ← versao 1
/api/v2/users     ← versao 2 (quando breaking change)
```

- Incrementar versao apenas para breaking changes
- Manter versao antiga por pelo menos 1 ciclo de release
- Documentar diferencas no CHANGELOG

## Rate Limiting Headers

### Padrao de resposta
```typescript
const headers = {
  'X-RateLimit-Limit': '100',
  'X-RateLimit-Remaining': '95',
  'X-RateLimit-Reset': '1710000000',
  'Retry-After': '60', // apenas quando 429
};
```

## Middleware de Auth

### Pattern
```typescript
import { createClient } from '@/lib/supabase/server';

async function withAuth(req: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  return user;
}
```

## NUNCA
- Retornar stack traces em producao (apenas em dev)
- Aceitar request body sem validacao Zod
- Usar `any` em tipos de request/response
- Expor IDs internos de sistema (usar UUIDs publicos)
- Logar request bodies com dados sensiveis
- Misturar versoes de API no mesmo handler

---

## GraphQL Best Practices

### Connection Pattern (Relay)
```typescript
type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type UserEdge {
  node: User!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

### DataLoader (OBRIGATORIO para N+1)
```typescript
import DataLoader from 'dataloader';

const userLoader = new DataLoader(async (ids: readonly string[]) => {
  const users = await db.users.findMany({ where: { id: { in: [...ids] } } });
  return ids.map(id => users.find(u => u.id === id) ?? null);
});

// No resolver
const resolvers = {
  Post: {
    author: (post) => userLoader.load(post.authorId)  // batched automaticamente
  }
};
```

### Schema Design Rules
- Tipos coesos — evitar campos nullable sem motivo
- Enums para valores fixos (status, role)
- Input types separados para mutations
- **Depth Limiting**: max 5-7 niveis de aninhamento
- **Complexity Analysis**: calcular custo da query antes de executar

## API Gateway

### Responsabilidades do Gateway
- Rate limiting (Token Bucket, Sliding Window)
- Autenticacao (JWT validation, API key check)
- Routing (path-based, header-based)
- Transformacao (request/response mapping)
- Caching (GET requests, TTL-based)

### NAO colocar no Gateway
- Logica de negocio
- Validacao de dominio
- Transformacoes complexas de dados

## OpenAPI / Swagger

| Abordagem | Quando | Vantagem |
|-----------|--------|----------|
| Code-first | Projetos existentes | Spec gerada do codigo, sempre sincronizada |
| Spec-first | APIs publicas, design-first | Contrato definido antes da implementacao |

- **Validacao**: `spectral` para lint da spec OpenAPI
- **Geracao de tipos**: `openapi-typescript` para gerar tipos TS do spec
- **Documentacao**: Swagger UI ou Redoc para documentacao interativa
