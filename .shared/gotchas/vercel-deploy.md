# Gotchas: Vercel & Deploy

## Timeouts
- Funcoes padrao: 60s max. Streaming: 300s
- Operacoes longas DEVEM usar background jobs, nao aumentar timeout
- Se timeout em build: verificar bundle size (`npm run analyze`)

## force-dynamic
- NUNCA remover `export const dynamic = 'force-dynamic'` sem testar build completo
- Paginas que usam headers/cookies/searchParams PRECISAM de force-dynamic
- Remover causa erro de prerender silencioso que so aparece em prod

## Env Vars
- NUNCA copiar env vars entre projetos sem validar
- Verificar que SUPABASE_URL aponta para projeto CORRETO
- Verificar sem caracteres de controle (`\r\n`) — comum ao copiar do browser
- Ao rotacionar credentials: atualizar TODOS os ambientes (local, CI, Vercel)
- `\r\n` literal em valores = build quebrado silenciosamente

## Deploy Direto
- NUNCA `vercel --prod` sem pipeline — usar `gh pr create` + merge
- Hook bloqueia `vercel --prod` automaticamente
- Preview deploy automatico via PR (se configurado)

## Build Errors
- SSR errors so aparecem em `npm run build`, nao em `npm run dev`
- Sempre rodar build local ANTES de qualquer deploy
- `NODE_OPTIONS='--max-old-space-size=8192'` se OOM durante build

## Middleware
- Env vars missing em middleware.ts = `MIDDLEWARE_INVOCATION_FAILED` (todas requests falham)
- Auth redirect loop: whitelist `/login` no middleware auth check
- Validar middleware em smoke tests, nao apenas health endpoint

## Smoke Tests Pos-Deploy
- Cold start pode levar 15-30s — aumentar timeout ou sleep antes do smoke
- `vercel rollback` pode falhar silenciosamente (retorna 0 mas nao executa)
- Sempre verificar URL do deploy antes de rodar smoke (`[ -z "$DEPLOY_URL" ]`)

## Rate Limiting
- Upstash Redis tem rate limits — 429 em producao = verificar dashboard
- Deploy roda muitas API calls (npm ci, git, Vercel API) — stagger se rate limited
