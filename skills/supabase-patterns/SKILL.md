---
name: supabase-patterns
description: Patterns para Supabase, PostgreSQL, RLS, migrations, e Zod schemas
context: fork
user-invocable: false
---

# Skill: Supabase Patterns

Referencia de patterns para Supabase, PostgreSQL, RLS, e integracao com TypeScript.

## Quando Ativar

- Trabalhando com banco de dados Supabase
- Criando migrations
- Configurando RLS
- Definindo schemas com Zod

## Zod Schema Pattern

```typescript
import { z } from 'zod';

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(255),
  role: z.enum(['superadmin', 'core_team', 'external_agent', 'client']),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type User = z.infer<typeof userSchema>;

export const createUserSchema = userSchema.omit({
  id: true, created_at: true, updated_at: true,
});
export type CreateUser = z.infer<typeof createUserSchema>;

export const updateUserSchema = createUserSchema.partial();
export type UpdateUser = z.infer<typeof updateUserSchema>;
```

## Repository Pattern

```typescript
export const userRepository = {
  async findById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users').select('*').eq('id', id).single();
    if (error) throw error;
    return data ? userSchema.parse(data) : null;
  },

  async create(input: CreateUser): Promise<User> {
    const { data, error } = await supabase
      .from('users').insert(input).select().single();
    if (error) throw error;
    return userSchema.parse(data);
  },
};
```

## RLS (Row Level Security)

### Patterns Comuns

```sql
-- Usuario ve apenas seus dados
CREATE POLICY "users_own_data" ON public.users
  FOR ALL USING (auth.uid() = id);

-- Todos leem, apenas dono edita
CREATE POLICY "posts_read_all" ON public.posts
  FOR SELECT USING (true);
CREATE POLICY "posts_write_own" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Baseado em role
CREATE POLICY "admin_full_access" ON public.users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- Baseado em organizacao
CREATE POLICY "org_members_only" ON public.projects
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );
```

### Checklist RLS

- [ ] `ENABLE ROW LEVEL SECURITY` em TODA tabela
- [ ] Policy para SELECT, INSERT, UPDATE, DELETE
- [ ] Service role bypass apenas para admin APIs

## Migrations

- Numeracao sequencial: `20260219000001_create_users.sql`
- Uma migracao por mudanca logica
- Idempotente: `IF NOT EXISTS`
- Incluir RLS na mesma migration da tabela

## Audit Trail

```sql
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Realtime

```typescript
const channel = supabase
  .channel('messages')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
    (payload) => console.log('Change:', payload)
  )
  .subscribe();
```
