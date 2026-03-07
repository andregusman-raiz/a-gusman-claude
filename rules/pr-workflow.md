---
description: "Workflow de Pull Requests — toda mudanca funcional via PR"
paths:
  - "**/*"
---

# PR Workflow

## Regra Principal
TODA mudanca funcional (que altera comportamento do app) DEVE ir via Pull Request.
Push direto em main e BLOQUEADO por branch protection.

## Quando fazer PR
- SEMPRE para: features, fixes, refactors, mudancas de schema/migration
- OPCIONAL para: docs puros, config CI, atualizacao de skills/rules

## Como criar PR
```bash
# Garantir que branch esta pushada
git push -u origin $(git rev-parse --abbrev-ref HEAD)

# Criar PR com template
gh pr create --base main \
  --title "tipo(escopo): descricao concisa" \
  --body "$(cat <<'EOF'
## Resumo
- O que mudou e por que

## Checklist
- [ ] Typecheck passa (`npm run typecheck`)
- [ ] Lint passa (`npm run lint`)
- [ ] Testes passam (`npm run test`)
- [ ] Build funciona (`npm run build`)
- [ ] Sem console.log/debugger residuais
- [ ] Migrations incluem rollback (se aplicavel)

## Test Plan
- [ ] Como testar essa mudanca
EOF
)"
```

## Titulo do PR
- Seguir conventional commits: `feat(auth): add login flow`
- Maximo 70 caracteres
- Imperativo: "add", "fix", "update" (nao "added", "fixed", "updated")

## Labels (usar quando disponivel)
- `feat` — nova funcionalidade
- `fix` — correcao de bug
- `refactor` — reestruturacao
- `docs` — documentacao
- `breaking` — mudanca incompativel

## Review
- CODEOWNERS define reviewers automaticos
- CI deve estar verde antes de mergear
- Pelo menos 1 approval quando branch protection exigir
- Verificar preview deploy (se disponivel) antes de aprovar

## Apos Merge
- Branch deletada automaticamente
- Deploy em main dispara deploy-gate.yml
- Verificar que deploy passou nos smoke tests
