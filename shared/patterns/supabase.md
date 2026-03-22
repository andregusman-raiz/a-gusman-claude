# Supabase Patterns (Cross-Project)

## Migrations

### Naming Convention
```
YYYYMMDDHHMMSS_descricao_curta.sql
```
- Sequencial — NUNCA pular numeracao
- Verificar ultimo numero antes de criar: `ls supabase/migrations/ | tail -1`
- Uma migration por mudanca logica (nao agrupar mudancas nao relacionadas)

### Migration Template
```sql
-- Migration: YYYYMMDDHHMMSS_descricao
-- Description: [O que esta mudanca faz]
-- Depends on: [migration anterior se relevante]

BEGIN;

-- 1. Schema changes
ALTER TABLE ...;

-- 2. RLS policies (OBRIGATORIO para tabelas novas)
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON new_table
  FOR SELECT USING (auth.uid() = user_id);

-- 3. Indexes (desde o inicio, nao como afterthought)
CREATE INDEX idx_new_table_user_id ON new_table(user_id);

-- 4. Audit trigger (se tabela tem CRUD)
-- [ver audit trail abaixo]

COMMIT;
```

## RLS (Row Level Security)

### Regra: TODAS as tabelas, sem excecao
- Tabela nova sem RLS = dados expostos
- Incluir RLS na MESMA migration que cria a tabela
- Testar com pelo menos 2 roles (com e sem acesso)

### Patterns por tipo
```sql
-- Owner access
CREATE POLICY "owner_all" ON table_name
  FOR ALL USING (auth.uid() = user_id);

-- Org-scoped access
CREATE POLICY "org_select" ON table_name
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid())
  );

-- Public read, authenticated write
CREATE POLICY "public_read" ON table_name
  FOR SELECT USING (true);
CREATE POLICY "auth_insert" ON table_name
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

### Performance em RLS
- Evitar subqueries complexas em policies (usar materialized views se necessario)
- Criar indice em TODAS as colunas usadas em USING/WITH CHECK
- Preferir `auth.uid()` direto (nao funcoes custom no hot path)

## Audit Trail

### Obrigatorio para tabelas com CRUD
```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID,
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Schemas (Zod)

### Pattern: Schema define o contrato
```typescript
// domain/feature/v0/feature.schema.ts
import { z } from 'zod';

export const featureSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  user_id: z.string().uuid(),
  created_at: z.string().datetime(),
});

export type Feature = z.infer<typeof featureSchema>;
export const featureInsertSchema = featureSchema.omit({ id: true, created_at: true });
```

## Client Singleton
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

## RLS Edge Cases

### Cascading Deletes through Policies
```sql
-- Problema: DELETE em parent pode falhar se child tem RLS restritivo
-- Solucao: policy no child deve considerar deletes cascading

-- Parent policy
CREATE POLICY "owner_delete" ON projects
  FOR DELETE USING (auth.uid() = owner_id);

-- Child policy — deve permitir delete quando parent e deletado
CREATE POLICY "cascade_delete" ON project_items
  FOR DELETE USING (
    project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
  );
```

### Nested Policies (joins em policies)
```sql
-- Cuidado com performance: subquery executada para CADA row
-- Preferir materializar acesso em tabela de lookup
CREATE TABLE user_org_access AS
  SELECT user_id, org_id FROM org_members WHERE active = true;

CREATE INDEX idx_user_org_access ON user_org_access(user_id, org_id);

-- Policy usa tabela de lookup (rapido)
CREATE POLICY "org_access" ON resources
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM user_org_access WHERE user_id = auth.uid())
  );
```

## Realtime Subscriptions

### Quando usar
- Chat, notificacoes, dashboards live
- Dados que mudam frequentemente E usuario precisa ver imediatamente

### Quando NAO usar
- Listas estaticas, relatorios, dados historicos
- Dados com alta cardinalidade (milhares de rows mudando/segundo)

### Cleanup Pattern
```typescript
'use client';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useRealtimeMessages(channelId: string) {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${channelId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` },
        (payload) => setMessages(prev => [...prev, payload.new as Message])
      )
      .subscribe();

    // OBRIGATORIO: cleanup ao desmontar
    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId]);

  return messages;
}
```

## JSON/JSONB Column Patterns

### Quando usar JSONB
- Dados semi-estruturados (metadata, preferences, config)
- Schema flexivel que varia por record
- Audit trail (old_data/new_data)

### Quando NAO usar JSONB
- Dados com schema fixo (usar colunas tipadas)
- Campos que precisam de foreign keys
- Dados que precisam de aggregation frequente

### Indexing com GIN
```sql
-- Index para queries em JSONB
CREATE INDEX idx_metadata_gin ON items USING GIN (metadata);

-- Index para path especifico (mais performante)
CREATE INDEX idx_metadata_status ON items ((metadata->>'status'));

-- Query
SELECT * FROM items WHERE metadata @> '{"status": "active"}';
SELECT * FROM items WHERE metadata->>'category' = 'education';
```

## Supabase CLI Workflow

### Fluxo padrao: diff → push → verify
```bash
# 1. Verificar estado atual
supabase db diff --use-migra

# 2. Criar migration a partir do diff
supabase db diff --use-migra -f add_new_table

# 3. Revisar migration gerada
cat supabase/migrations/*_add_new_table.sql

# 4. Aplicar no banco remoto
supabase db push

# 5. Verificar que aplicou corretamente
supabase db diff --use-migra  # deve retornar vazio
```

### NUNCA
```bash
# Estes comandos sao DESTRUTIVOS
supabase db reset           # apaga tudo e recria
supabase config push        # sobrescreve config remoto
# Sempre confirmar com usuario antes de executar
```

## RLS Testing Pattern

### Testar com roles diferentes
```sql
-- Em ambiente de teste, simular diferentes users
SET request.jwt.claim.sub = 'user-uuid-owner';
SELECT * FROM items;  -- deve retornar items do owner

SET request.jwt.claim.sub = 'user-uuid-other';
SELECT * FROM items;  -- deve retornar vazio (ou items compartilhados)

-- Reset
RESET request.jwt.claim.sub;
```

### Pattern em testes automatizados
```typescript
describe('RLS - items table', () => {
  test('owner can read own items', async () => {
    const client = createClientAsUser(ownerUserId);
    const { data } = await client.from('items').select('*');
    expect(data?.length).toBeGreaterThan(0);
    expect(data?.every(i => i.user_id === ownerUserId)).toBe(true);
  });

  test('other user cannot read owner items', async () => {
    const client = createClientAsUser(otherUserId);
    const { data } = await client.from('items').select('*').eq('user_id', ownerUserId);
    expect(data).toHaveLength(0);
  });
});
```

## NUNCA
- Desabilitar RLS ("so por enquanto")
- Usar service_role key no frontend
- Hardcode Supabase URL/keys
- Rodar `supabase db reset` sem confirmar com usuario
- Rodar `supabase config push` sem revisar diff
