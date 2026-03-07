# Deploy Preflight Checklist

## Antes de QUALQUER Deploy
Executar na ordem — PARAR se algum falhar:

1. **Git status limpo**: `git status` — sem arquivos uncommitted
2. **Build local**: `npm run build` — sem erros de prerender/SSR
3. **TypeCheck**: `npm run typecheck` — 0 erros
4. **Env vars**: verificar que nao ha valores corrompidos (literal \r\n, chaves erradas)
5. **Branch correta**: confirmar que esta na branch certa (nunca deploy de main direto)
6. **CI verde**: verificar que workflows do CI passaram

## NUNCA
- Fazer deploy com build falhando
- Remover `force-dynamic` ou diretivas SSR sem testar build
- Sobrescrever env vars de producao sem confirmacao do usuario
- Fazer deploy sem ter rodado build local pelo menos 1x
- Fazer deploy direto sem git/CI configurado

## Env Vars — Cuidados Especiais
- NUNCA copiar env vars entre projetos sem validar
- Verificar que SUPABASE_URL aponta para o projeto CORRETO
- Verificar que nao ha caracteres de controle (\r\n) em valores
- Ao rotacionar credentials, atualizar TODOS os ambientes (local, CI, Vercel)
