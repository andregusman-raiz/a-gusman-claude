---
description: "Estrategia de merge — squash vs merge commit vs rebase"
paths:
  - "**/*"
---

# Merge Strategy

## Regra Principal
- Feature branches → **Squash merge** (historico limpo, 1 commit por feature)
- Hotfix branches → **Merge commit** (preservar rastreabilidade de emergencia)
- Release branches → **Merge commit** (preservar historico completo)

## Como fazer merge
- SEMPRE via Pull Request no GitHub
- NUNCA `git merge` local em main
- Squash merge: GitHub PR → "Squash and merge"
- Merge commit: GitHub PR → "Create a merge commit"

## NUNCA fazer
- Rebase em branches que ja foram pushadas (reescreve historico publico)
- Force push em main/develop (destruicao de historico)
- Merge com testes falhando (CI deve estar verde)
- Merge sem review (CODEOWNERS define reviewers)

## Resolucao de Conflitos
1. Na feature branch: `git fetch origin main`
2. Merge main na feature: `git merge origin/main`
3. Resolver conflitos manualmente (nunca aceitar "theirs" ou "ours" cegamente)
4. Rodar typecheck + lint + test apos resolver
5. Commit de merge: `chore: merge main into feat/nome`
6. NUNCA usar `git rebase` se a branch ja foi pushada

## Apos Merge
- Branch remota: deletada automaticamente (GitHub auto-delete configurado)
- Branch local: `git fetch --prune` ou `/clean_gone` para limpar
- Verificar que deploy-gate.yml rodou com sucesso apos merge em main
