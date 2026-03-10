# Gotchas: RLS Performance

## Full Table Scans
- Policies com subqueries complexas no `USING` clause causam full table scan
- PostgreSQL avalia a policy POR LINHA — subquery roda N vezes sem indice
- Sintoma: query que leva 50ms sem RLS leva 5s+ com RLS habilitado
- SEMPRE adicionar indice na coluna referenciada pelo subquery da policy

## Indices Obrigatorios
- `user_id` — indice em TODA tabela que usa `auth.uid()` na policy
- `org_id` — indice quando policy faz lookup de organizacao
- Coluna usada em `EXISTS (SELECT 1 FROM ... WHERE col = ...)` → indice obrigatorio
- Sem indice, Postgres faz sequential scan na tabela referenciada a cada linha

## auth.uid() e Caching
- `auth.uid()` e cacheado por request (nao por statement) — custo baixo em policy simples
- MAS: policies nested (tabela A referencia policy de tabela B) multiplicam avaliacoes
- Exemplo: `SELECT * FROM posts WHERE org_id IN (SELECT org_id FROM memberships WHERE user_id = auth.uid())`
- Se `memberships` tambem tem RLS → policy de memberships roda dentro da policy de posts
- Solucao: usar `security definer` function para queries internas de lookup

## USING(false) — Bloqueio Total
- `USING (false)` bloqueia TODOS os acessos — incluindo service role em alguns contextos
- Erro comum: definir policy padrao `USING (false)` e esquecer de criar policy permissiva
- Sintoma: feature funciona para superadmin (bypass RLS) mas retorna vazio para todos outros
- Debug: `SET ROLE authenticated; SELECT * FROM tabela;` no SQL editor do Supabase

## Policy por Operacao
- NUNCA criar uma unica policy para ALL operations
- Separar: SELECT, INSERT, UPDATE, DELETE — cada um tem semantica diferente
- INSERT usa `WITH CHECK`, nao `USING` — confundir causa policy que nunca passa
- UPDATE precisa BOTH `USING` (linhas visiveis) + `WITH CHECK` (resultado valido)
- DELETE precisa apenas `USING` — WITH CHECK nao se aplica

## Performance Patterns
```sql
-- RUIM: subquery sem indice, roda por linha
CREATE POLICY "org_access" ON documents
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- BOM: security definer function com indice
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT org_id FROM org_members WHERE user_id = auth.uid() $$;

CREATE POLICY "org_access" ON documents
  USING (org_id IN (SELECT get_user_org_ids()));
```

## Diagnostico
```sql
-- Verificar se RLS esta ativo
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Ver policies de uma tabela
SELECT * FROM pg_policies WHERE tablename = 'nome_tabela';

-- Testar performance com EXPLAIN ANALYZE como authenticated user
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-uuid-aqui';
EXPLAIN ANALYZE SELECT * FROM tabela;
RESET ROLE;
```
