# E2E Testing Templates (Playwright)

Templates reutilizaveis para testes end-to-end com Playwright.

## Uso
```bash
# Copiar para pasta de E2E do projeto
cp -r ~/.shared/templates/e2e/ ./tests/e2e/shared/
```

## Arquivos
- `auth-setup.template.ts` — Setup de autenticacao (storageState)
- `base-page.template.ts` — Page object base
- `smoke.template.spec.ts` — Smoke tests pos-deploy
- `access-control.template.spec.ts` — Testes de controle de acesso
- `playwright.base.config.ts` — Config base (importar no projeto)

## Convencoes
- E2E tests usam `.spec.ts` (unit tests usam `.test.ts`)
- Auth state salvo em `.auth/user.json` (gitignored)
- Traces habilitados em first retry
- Screenshots em falha
