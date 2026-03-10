# Gotchas: Migration Rollback

## Ordem de Rollback
- Foreign keys bloqueiam DROP TABLE fora de ordem — rollback na ordem INVERSA da criacao
- Se migration 001 cria `users` e 002 cria `posts` (com FK para users), rollback 002 PRIMEIRO
- Erro tipico: `cannot drop table "users" because other objects depend on it`
- CASCADE resolve mas pode deletar mais do que esperado — NUNCA usar CASCADE em rollback cego

## Perda de Dados
- Rollback de `ALTER TABLE DROP COLUMN` = dados perdidos permanentemente
- SEMPRE fazer backup antes de migrations destrutivas: `pg_dump -t tabela > backup.sql`
- Migrations que renomeiam colunas: dados preservados, mas codigo que referencia nome antigo quebra
- `TRUNCATE` em rollback e irreversivel — preferir soft delete quando possivel

## Conflitos de Branch
- Duas branches com mesmo numero de migration → conflito no merge
- Sintoma: `supabase db push` falha com "migration already applied" ou "conflicting migrations"
- Prevencao: usar timestamp (YYYYMMDDHHMMSS), nao sequencial numerico
- Se conflito detectado: renumerar a migration da feature branch ANTES de merge

## Arquivos de Migration
- NUNCA deletar um arquivo de migration ja aplicado — cria inconsistencia entre schema e historico
- Para desfazer: criar uma NOVA migration reversa (ex: `20260308120000_revert_add_column.sql`)
- Migration vazia (so com comentario) e valida e preferivel a deletar
- `supabase migration list` mostra aplicadas vs pendentes — verificar antes de push

## supabase db reset
- Destroi TODOS os dados e recria do zero a partir dos arquivos de migration
- NUNCA rodar em producao — apenas local development
- Util para validar que migrations rodam do zero sem erros
- Se `db reset` falha → migration tem dependencia de dados que nao existe no schema puro

## Naming Convention
- Formato: `YYYYMMDDHHMMSS_descricao_curta.sql`
- Exemplo: `20260308143022_add_user_preferences.sql`
- Descricao em snake_case, sem acentos, max 50 caracteres
- Prefixos uteis: `add_`, `drop_`, `alter_`, `create_`, `revert_`

## Rollback Seguro — Checklist
1. Identificar dependencias: `\d+ tabela` ou query `pg_constraint`
2. Backup dos dados afetados: `pg_dump -t tabela --data-only`
3. Escrever migration reversa em arquivo novo
4. Testar rollback em ambiente local: `supabase db reset`
5. Aplicar em staging antes de producao
6. NUNCA rollback direto em prod sem teste previo

## Anti-Patterns
- Editar migration ja aplicada — Supabase nao re-executa, schema fica inconsistente
- `DROP TABLE IF EXISTS` no rollback sem verificar FKs — falha silenciosa
- Rollback parcial (desfazer metade da migration) — deixa schema em estado invalido
- Rodar `supabase db push --reset` em producao — equivalente a db reset + push
