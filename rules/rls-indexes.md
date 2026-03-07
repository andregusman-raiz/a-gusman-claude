---
description: "Regra de performance para RLS policies no Supabase/PostgreSQL"
paths:
  - "**/migrations/**"
  - "**/supabase/**"
---

# RLS Index Rule

## Obrigatorio
Sempre que criar uma RLS policy que referencia uma coluna, criar index nessa coluna na mesma migration.

Exemplo:
```sql
-- Policy
CREATE POLICY "users_own_data" ON profiles
  FOR ALL USING (auth.uid() = user_id);

-- Index obrigatorio (na mesma migration)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
```

## Performance
- Sem index: full table scan em CADA request autenticado (100x mais lento em tabelas grandes)
- Com index: lookup O(log n)

## Otimizacao auth.uid()
Cachear `auth.uid()` em subquery para ajudar o optimizer:
```sql
CREATE POLICY "optimized" ON table_name
  FOR ALL USING (
    user_id = (SELECT auth.uid())
  );
```
O `(SELECT ...)` wrapper faz o Postgres avaliar uma vez como `initPlan`, nao por row.

## Nunca usar em RLS
- `auth.jwt()->>'user_metadata'` — usuario pode modificar
- Usar `auth.jwt()->'app_metadata'` para dados de autorizacao
