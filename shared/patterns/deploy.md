# Deploy Patterns (Cross-Project)

## Pipeline Padrao

```
git push → CI (lint → typecheck → test → build) → deploy preview → smoke → merge → deploy prod
```

### Quality Gates (BLOCKING — parar se falhar)

| Gate | Comando | Criterio |
|------|---------|----------|
| Build | `npm run build` | 0 erros |
| TypeCheck | `npm run typecheck` | 0 erros |
| Lint | `npm run lint` | 0 erros novos |
| Tests | `npm test` | 0 falhas novas |
| Security | `npm audit --audit-level=high` | 0 criticas |

### Preflight Checklist (antes de QUALQUER deploy)
1. `git status` — sem arquivos uncommitted
2. `npm run build` — sem erros de prerender/SSR
3. `npm run typecheck` — 0 erros
4. Verificar .env — sem valores corrompidos (`\r\n`, chaves erradas)
5. Branch correta — nunca deploy de main direto
6. CI verde — workflows passaram

## Vercel

### Configuracao padrao
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

### Env vars
- NUNCA copiar entre projetos sem validar
- Verificar que SUPABASE_URL aponta para projeto CORRETO
- Verificar sem caracteres de controle (`\r\n`)
- Ao rotacionar, atualizar TODOS os ambientes

### Timeouts
- Funcoes padrao: 60s
- Streaming: 300s
- Operacoes longas: usar background jobs (nao aumentar timeout)

## Smoke Tests (pos-deploy)

### Minimo obrigatorio
```typescript
test('homepage loads', async ({ page }) => {
  const res = await page.goto('/');
  expect(res?.status()).toBe(200);
});

test('static assets load', async ({ page }) => {
  await page.goto('/');
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.waitForTimeout(3000);
  expect(errors).toHaveLength(0);
});

test('auth redirect works', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/login|auth/);
});
```

## Rollback Strategies

### Vercel Instant Rollback
```bash
# Listar deployments recentes
vercel ls --limit 5

# Rollback para deployment anterior
vercel rollback [deployment-url]

# Ou via dashboard: Deployments → ... → Promote to Production
```

### Database Rollback Plan
```sql
-- TODA migration deve ter um rollback script correspondente
-- Arquivo: supabase/migrations/rollback/YYYYMMDDHHMMSS_rollback.sql

-- Exemplo: rollback de ADD COLUMN
ALTER TABLE users DROP COLUMN IF EXISTS new_field;

-- Exemplo: rollback de CREATE TABLE
DROP TABLE IF EXISTS new_table;
DROP POLICY IF EXISTS "policy_name" ON new_table;
```

### Regra: saber como reverter ANTES de deployar
- Para cada migration, escrever rollback SQL (mesmo que simples)
- Testar rollback em staging antes de producao
- Se migration e irreversivel (drop column com dados) → documentar explicitamente

## Staging vs Production

| Aspecto | Staging | Production |
|---------|---------|------------|
| URL | preview-*.vercel.app | app.dominio.com |
| Database | Supabase staging project | Supabase production project |
| Env vars | `NEXT_PUBLIC_ENV=staging` | `NEXT_PUBLIC_ENV=production` |
| Error reporting | Verbose, stack traces | Sanitized, Sentry |
| Rate limits | Relaxados | Restritivos |
| Data | Seed/test data | Real user data |

### NUNCA
- Usar database de producao em staging
- Copiar env vars de prod para staging sem revisar
- Testar com dados reais de usuarios em staging

## Preview Environment Patterns

### PR-Based Previews (automatico)
```yaml
# .github/workflows/preview-deploy.yml
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: vercel pull --yes --environment=preview
      - run: vercel build
      - run: vercel deploy --prebuilt
      # Comentar URL no PR automaticamente
```

### Verificacao de preview
1. Abrir preview URL do comentario no PR
2. Testar fluxo principal manualmente
3. Verificar console sem erros
4. Verificar que nao aponta para DB de producao

## Database Migration Coordination

### Deploy com migration
```
1. Deploy codigo ANTES da migration (backward compatible)
2. Rodar migration (supabase db push)
3. Verificar que app funciona com novo schema
4. Se falhar → rollback migration → rollback deploy
```

### Breaking Changes em Schema
```
Sprint N:   Adicionar nova coluna (nullable) + codigo que usa ambas
Sprint N+1: Migrar dados para nova coluna + deprecar antiga
Sprint N+2: Remover coluna antiga + codigo legado
```

### NUNCA
- Rodar migration e deploy simultaneamente
- Assumir que migration e instantanea (pode travar tabela grande)
- Dropar coluna sem verificar que nenhum codigo referencia

## Post-Deploy Verification Checklist

### Automatico (smoke tests)
```bash
# Executar apos cada deploy
curl -sf https://app.dominio.com/api/health || echo "HEALTH CHECK FAILED"
npx playwright test tests/e2e/smoke/ --reporter=list
```

### Manual (quando relevante)
- [ ] Homepage carrega sem erros
- [ ] Login/logout funciona
- [ ] Feature deployada funciona como esperado
- [ ] Console sem erros inesperados
- [ ] Performance aceitavel (nao degradou)
- [ ] Dados existentes nao foram afetados

## NUNCA
- Deploy com build falhando
- Remover `force-dynamic` sem testar build completo
- Sobrescrever env vars de producao sem confirmacao
- Deploy direto sem git/CI configurado
- `vercel --prod` sem pipeline (usar `gh pr create` + merge)
