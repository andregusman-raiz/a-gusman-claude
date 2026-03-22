# Gotchas: Supabase & Database

## RLS Esquecido
- Tabela nova sem RLS = dados expostos para qualquer usuario autenticado
- SEMPRE incluir `ENABLE ROW LEVEL SECURITY` na mesma migration que cria a tabela
- ag-17 e ag-08 verificam automaticamente, mas dupla-checagem manual e essencial

## Migrations
- NUNCA pular numeracao sequencial (verificar `ls supabase/migrations/ | tail -1`)
- NUNCA rodar `supabase db reset` sem confirmar com usuario (apaga todos os dados)
- NUNCA rodar `supabase config push` sem revisar diff (sobrescreve config remota)
- Uma migration por mudanca logica — nao agrupar mudancas nao relacionadas

## Indices
- Criar desde o inicio, nao como afterthought
- Toda coluna usada em WHERE, JOIN, ORDER BY, ou RLS policy precisa de indice
- Indices em colunas UUID referenciadas por RLS sao criticos para performance

## Client Singleton
- Nao criar multiplas instancias do Supabase client
- Usar singleton pattern (um createClient por contexto: browser, server, admin)

## Types
- Regenerar tipos apos cada migration: `supabase gen types typescript`
- Tipos desatualizados causam erros silenciosos em runtime

## Materialized Views
- MVs nao se atualizam automaticamente — precisam de refresh explicito ou cron
- Dashboard mostra zeros = MV stale. Criar cron endpoint `/api/cron/refresh-usage-views`

## RPCs
- RPCs cacheiam schema. Se renomear coluna, RPC ainda referencia nome antigo
- Queries falham silenciosamente e retornam null/default. Recriar RPC na migration

## Connection Limits
- Free tier: 5-10 conexoes simultaneas
- Vercel serverless + Supabase = pool exhaustion se cada function abre conexao
- Usar connection pooling (pgBouncer no Supabase UI)

## RLS Policies
- Policy `USING (false)` bloqueia tudo — testar com usuarios reais em dev
- Sintoma: feature funciona para superadmin mas retorna vazio para user
