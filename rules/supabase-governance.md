---
description: "Governanca de Supabase — migrations, naming, seguranca"
paths:
  - "**/supabase/**"
  - "**/migrations/**"
---

# Supabase Governance

## Migrations

### Naming
- Formato: `YYYYMMDDHHMMSS_descricao_acao.sql`
- Descricao em snake_case, sem espacos ou acentos
- Exemplos validos:
  - `20260303120000_create_users_table.sql`
  - `20260303120100_add_avatar_to_profiles.sql`
  - `20260303120200_add_index_on_email.sql`

### Antes de Criar Migration (Checklist OBRIGATORIO)
1. `supabase migration list` → verificar migrations existentes
2. `SELECT conname FROM pg_constraint WHERE conname LIKE '%nome%'` → constraints existentes
3. `SELECT indexname FROM pg_indexes WHERE indexname LIKE '%nome%'` → indices existentes
4. Verificar que timestamp nao conflita com migrations existentes
5. Se nova tabela → OBRIGATORIO incluir RLS policies

### Regras
- TODA migration deve ser reversivel (incluir DOWN section ou comentario explicando por que nao)
- NUNCA deletar coluna diretamente — usar ciclo de 3 migrations:
  1. Rename para `_deprecated_[nome]`
  2. Remover referencias no codigo
  3. Drop da coluna (apos confirmar que nenhum codigo usa)
- SEMPRE incluir indices para colunas de busca, join, e foreign keys
- SEMPRE incluir RLS policies para novas tabelas
- NUNCA usar `CASCADE` em DROP sem revisar dependencias

## Comandos Perigosos (BLOQUEADOS por security-gate.sh)
- `supabase config push` → BLOQUEADO (ja sobrescreveu URLs de producao com localhost)
- `supabase db reset` → BLOQUEADO (so permitido em ambiente local com confirmacao)
- `supabase db push --force` → NUNCA sem confirmacao explicita do usuario

## Workflow Seguro
1. Criar migration: `supabase migration new descricao`
2. Escrever SQL (com RLS + indices + DOWN section)
3. Testar local: `supabase db reset` (so em LOCAL, com confirmacao)
4. Verificar diff: `supabase db diff`
5. Commitar migration file (em feature branch)
6. PR → review → merge
7. Aplicar em staging primeiro, producao depois

## Supabase CLI — Boas Praticas
- `supabase status` → verificar estado antes de operar
- `supabase db lint` → verificar qualidade do schema
- `supabase functions serve` → testar edge functions local
- NUNCA rodar comandos destrutivos sem verificar ambiente (local vs staging vs prod)
