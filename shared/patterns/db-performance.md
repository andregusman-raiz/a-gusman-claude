# Database Performance Patterns (Cross-Project)

## Principio: Performance desde o Inicio

Indices, connection pooling e query optimization nao sao afterthought.
Incluir na migration de criacao da tabela, nao "quando ficar lento".

## Index Strategies para RLS

### Problema
RLS policies executam para CADA row. Sem indices nos campos usados nas policies,
queries em tabelas grandes ficam O(n) mesmo com filtro.

### Indices Obrigatorios
```sql
-- Toda tabela com RLS baseada em user_id
CREATE INDEX idx_[table]_user_id ON [table] (user_id);

-- Toda tabela com RLS baseada em organization_id
CREATE INDEX idx_[table]_org_id ON [table] (organization_id);

-- Composite quando policy usa AND
CREATE INDEX idx_[table]_org_role ON [table] (organization_id, role);
```

### Template de Migration com RLS + Index
```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_documents.sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  title TEXT NOT NULL,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices ANTES de habilitar RLS
CREATE INDEX idx_documents_user_id ON documents (user_id);
CREATE INDEX idx_documents_org_id ON documents (organization_id);
CREATE INDEX idx_documents_status ON documents (status) WHERE status = 'published';
CREATE INDEX idx_documents_created ON documents (created_at DESC);

-- RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own org documents"
  ON documents FOR SELECT
  USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users create own documents"
  ON documents FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own documents"
  ON documents FOR UPDATE
  USING (user_id = auth.uid());
```

## N+1 Query Prevention

### Problema
```typescript
// N+1: 1 query para users + N queries para posts
const users = await supabase.from('users').select('*');
for (const user of users.data!) {
  const posts = await supabase.from('posts').select('*').eq('user_id', user.id);
  // ...
}
```

### Solucao: Select com Joins
```typescript
// 1 query com join embutido
const { data } = await supabase
  .from('users')
  .select(`
    id,
    name,
    email,
    posts (
      id,
      title,
      created_at
    )
  `)
  .order('created_at', { referencedTable: 'posts', ascending: false })
  .limit(5, { referencedTable: 'posts' });

// Result: User[] com posts[] embutido (single query via PostgREST)
```

### Joins Complexos
```typescript
// Nested joins (3 niveis)
const { data } = await supabase
  .from('organizations')
  .select(`
    id,
    name,
    teams (
      id,
      name,
      members:team_members (
        user:users (
          id,
          name,
          email
        )
      )
    )
  `)
  .eq('id', orgId)
  .single();
```

### Inner Join (excluir rows sem relacao)
```typescript
// Somente users COM posts (inner join)
const { data } = await supabase
  .from('users')
  .select(`
    id,
    name,
    posts!inner (
      id,
      title
    )
  `);
// Users sem posts NAO aparecem
```

## Connection Pooling

### Supabase Pooler Config
```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';

export async function createClient() {
  // Use pooler URL for server-side (port 6543)
  // Direct URL (port 5432) only for migrations
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // ... cookie handling
      },
      db: {
        schema: 'public',
      },
    }
  );
}
```

### Connection String Best Practices
```bash
# .env.local
# Transaction pooler (port 6543) — para queries normais
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Session pooler (port 5432) — para migrations e prepared statements
DIRECT_URL=postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

## Materialized Views

### Quando Usar
| Cenario | Materialized View? | Motivo |
|---------|-------------------|--------|
| Dashboard com aggregates | SIM | Calculo pesado, atualiza 1x/hora |
| Leaderboard | SIM | Ranking complexo, refresh periodico |
| Search results | NAO | Precisa ser real-time |
| User profile | NAO | Dados mudam frequentemente |
| Reports mensais | SIM | Dados historicos, nao mudam |

### Implementacao
```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_dashboard_stats.sql
CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT
  o.id AS organization_id,
  o.name AS organization_name,
  COUNT(DISTINCT u.id) AS total_users,
  COUNT(DISTINCT d.id) AS total_documents,
  COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'published') AS published_documents,
  MAX(d.updated_at) AS last_activity
FROM organizations o
LEFT JOIN user_organizations uo ON uo.org_id = o.id
LEFT JOIN users u ON u.id = uo.user_id
LEFT JOIN documents d ON d.organization_id = o.id
GROUP BY o.id, o.name;

-- Index na materialized view
CREATE UNIQUE INDEX idx_dashboard_stats_org ON dashboard_stats (organization_id);

-- Funcao para refresh
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Refresh via Cron
```typescript
// src/app/api/cron/refresh-stats/route.ts
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const { error } = await supabase.rpc('refresh_dashboard_stats');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ refreshed: true });
}
```

## Query Optimization (EXPLAIN ANALYZE)

### Como Diagnosticar
```sql
-- Sempre ANALYZE (nao so EXPLAIN) para tempos reais
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT d.*, u.name as author_name
FROM documents d
JOIN users u ON u.id = d.user_id
WHERE d.organization_id = 'xxx'
  AND d.status = 'published'
ORDER BY d.created_at DESC
LIMIT 20;
```

### Red Flags no Output
| Sinal | Problema | Solucao |
|-------|----------|---------|
| `Seq Scan` em tabela grande | Sem indice | Criar indice no campo filtrado |
| `Nested Loop` com N grande | N+1 via join | Usar `Hash Join` (mais dados na memoria) |
| `Sort` sem indice | Sort em disco | Criar indice com ORDER BY desejado |
| `Rows Removed by Filter` alto | Indice parcial faltando | `CREATE INDEX ... WHERE condition` |
| `Buffers: shared read` alto | Dados nao em cache | Aumentar shared_buffers ou indices |

### Via Supabase Client
```typescript
// Debug: ver query gerada pelo Supabase client
const query = supabase
  .from('documents')
  .select('*, users(name)')
  .eq('organization_id', orgId)
  .eq('status', 'published')
  .order('created_at', { ascending: false })
  .limit(20);

// Log query for debugging (dev only)
if (process.env.NODE_ENV === 'development') {
  console.log('Query URL:', query.url.toString());
}
```

## Caching Layer (Upstash Redis)

### Setup
```typescript
// src/lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface CacheOptions {
  ttlSeconds: number;
  staleWhileRevalidate?: number;
}

export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions
): Promise<T> {
  const cached = await redis.get<{ data: T; timestamp: number }>(key);

  if (cached) {
    const age = (Date.now() - cached.timestamp) / 1000;

    if (age < options.ttlSeconds) {
      return cached.data; // Fresh
    }

    if (options.staleWhileRevalidate && age < options.ttlSeconds + options.staleWhileRevalidate) {
      // Return stale, revalidate in background
      fetcher().then(async fresh => {
        await redis.set(key, { data: fresh, timestamp: Date.now() }, {
          ex: options.ttlSeconds + (options.staleWhileRevalidate ?? 0),
        });
      });
      return cached.data;
    }
  }

  // Cache miss or expired
  const fresh = await fetcher();
  await redis.set(key, { data: fresh, timestamp: Date.now() }, {
    ex: options.ttlSeconds + (options.staleWhileRevalidate ?? 0),
  });
  return fresh;
}

export async function invalidate(pattern: string) {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

### Uso
```typescript
// Cache dashboard stats por 5 min, stale por mais 5 min
const stats = await cached(
  `dashboard:${orgId}`,
  () => supabase.from('dashboard_stats').select('*').eq('organization_id', orgId).single(),
  { ttlSeconds: 300, staleWhileRevalidate: 300 }
);

// Invalidar quando dados mudam
await supabase.from('documents').insert(newDoc);
await invalidate(`dashboard:${orgId}`);
```

## Batch Operations

### Bulk Insert
```typescript
// Supabase suporta array insert nativo
const records = users.map(u => ({
  email: u.email,
  name: u.name,
  organization_id: orgId,
}));

// Batch de ate 1000 por vez (limite PostgREST)
const BATCH_SIZE = 1000;
for (let i = 0; i < records.length; i += BATCH_SIZE) {
  const batch = records.slice(i, i + BATCH_SIZE);
  const { error } = await supabase.from('users').insert(batch);
  if (error) throw error;
}
```

### Bulk Upsert
```typescript
// Upsert com conflict resolution
const { error } = await supabase
  .from('user_settings')
  .upsert(
    settings.map(s => ({
      user_id: s.userId,
      key: s.key,
      value: s.value,
    })),
    {
      onConflict: 'user_id,key',  // unique constraint columns
      ignoreDuplicates: false,     // update on conflict
    }
  );
```

### Batch com Transaction (RPC)
```sql
-- Para operacoes que precisam ser atomicas
CREATE OR REPLACE FUNCTION batch_update_statuses(
  p_ids UUID[],
  p_status TEXT
) RETURNS INT AS $$
DECLARE
  updated INT;
BEGIN
  UPDATE documents
  SET status = p_status, updated_at = now()
  WHERE id = ANY(p_ids);

  GET DIAGNOSTICS updated = ROW_COUNT;
  RETURN updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

```typescript
// Client
const { data: count } = await supabase.rpc('batch_update_statuses', {
  p_ids: documentIds,
  p_status: 'archived',
});
```

## Denormalization Decisions

### Quando Aceitavel
| Cenario | Denormalizar? | Motivo |
|---------|--------------|--------|
| Contagem de items (comment_count) | SIM | Evita COUNT(*) em cada load |
| Nome do autor em documento | NAO | Muda, fica inconsistente |
| Last activity timestamp | SIM | Evita MAX() aggregate |
| User role em cada request | NAO | Security-critical, normalizar |
| Search text (tsvector) | SIM | Full-text search performance |
| Cached aggregates (mat view) | SIM | Refresh periodico controlado |

### Pattern: Counter Cache
```sql
-- Trigger para manter contagem atualizada
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_comment_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_comment_count();
```

## NUNCA

- Tabela sem indice no campo usado em RLS policy
- `SELECT *` quando precisa de 3 campos — listar campos explicitamente
- Query dentro de loop (N+1) — usar joins do Supabase
- Connection direta (port 5432) para queries em producao — usar pooler
- Cache sem invalidacao — dados ficam stale indefinidamente
- `REFRESH MATERIALIZED VIEW` sem `CONCURRENTLY` — bloqueia reads

## SEMPRE

- `EXPLAIN ANALYZE` antes de otimizar (medir, nao adivinhar)
- Indice em campos de FK + campos usados em WHERE/ORDER BY
- Limite de rows em queries (`LIMIT` ou pagination)
- Partial indices para status checks (`WHERE status = 'active'`)
- `updated_at` trigger para cache invalidation
- Monitor slow queries via Supabase Dashboard > Database > Query Performance

## Checklist

- [ ] Indices criados na migration (nao depois)
- [ ] RLS policies testadas com EXPLAIN ANALYZE
- [ ] N+1 verificado (nenhum query em loop)
- [ ] Connection pooler configurado (port 6543)
- [ ] Materialized views com refresh schedule (se usadas)
- [ ] Cache layer com TTL e invalidacao
- [ ] Batch operations para > 10 records
- [ ] Slow query monitoring ativo

---

## Event Sourcing

### Conceito
Armazenar sequencia de eventos (fatos imutaveis) em vez de estado atual.

```typescript
interface DomainEvent {
  eventId: string;
  aggregateId: string;
  type: string;
  data: Record<string, unknown>;
  timestamp: Date;
  version: number;  // para ordering e optimistic concurrency
}

// Reconstruir estado a partir de eventos
function rehydrate(events: DomainEvent[]): Order {
  return events.reduce((order, event) => applyEvent(order, event), Order.empty());
}
```

### Snapshots
Salvar estado materializado a cada N eventos para evitar replay longo.
```
Eventos: [1, 2, 3, ..., 100] → Snapshot em 100 → [101, 102, ...]
Rebuild: carregar snapshot(100) + replay(101...)
```

### Quando Usar
- Auditoria obrigatoria (financeiro, legal, compliance)
- Undo/redo, time-travel queries
- Dominio temporal (o que aconteceu quando?)
- CQRS avancado (projecoes em DBs diferentes)

### Quando NAO Usar
- CRUD simples sem necessidade de historico
- Time sem experiencia em event sourcing
- Dominio com muitas atualizacoes por segundo no mesmo aggregate

## CQRS — 3 Niveis

| Nivel | Read | Write | DB | Quando |
|-------|------|-------|----|--------|
| Simples | DTO/View Model | Aggregate/Entity | Mesmo | Leituras com joins complexos |
| Medio | Read Replica | Primary DB | Separados | Carga de leitura alta |
| Avancado | Projecoes (Elasticsearch, etc) | Event Store | Diferentes | Auditoria + busca + escala |

## Migracao Segura de Coluna (Zero-Downtime)

```
1. ALTER TABLE ADD nova_coluna (nullable)        -- nao quebra nada
2. Deploy: codigo escreve em AMBAS colunas       -- dual-write
3. UPDATE SET nova_coluna = coluna_antiga         -- backfill
4. Deploy: codigo LE da nova coluna              -- cutover de leitura
5. Deploy: codigo PARA de escrever na antiga     -- cleanup de escrita
6. ALTER TABLE DROP coluna_antiga                -- cleanup final
```

> **NUNCA** renomear coluna diretamente (`ALTER TABLE RENAME COLUMN`) — cria downtime entre deploy e migracao.
> **NUNCA** fazer DROP e ADD na mesma migracao — se o deploy falhar no meio, dados sao perdidos.
