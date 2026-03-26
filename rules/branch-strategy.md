---
description: "Estrategia de branching — quando e como criar branches"
paths:
  - "**/*"
---

# Branch Strategy

## Regra Principal
TODA mudanca funcional (feature, fix, refactor) DEVE ser feita em feature branch.
Commits diretos em `main` ou `develop` sao BLOQUEADOS por hooks em 2 camadas: branch-guard.sh (hooks.json) + bash-guards.sh (settings.local.json).

## Quando criar branch
- Feature nova → `feat/nome-descritivo`
- Bug fix → `fix/nome-do-bug`
- Refatoracao → `refactor/descricao`
- Hotfix producao → `hotfix/descricao`
- Docs significativos → `docs/descricao`
- Manutencao/CI → `chore/descricao`

## Quando NAO criar branch (excecoes)
- Typo em README/docs (< 3 linhas de mudanca)
- Atualizacao de config (.env.example, .gitignore)
- Atualizacao de CLAUDE.md, skills, rules, hooks

## Fluxo Obrigatorio
1. Atualizar main: `git fetch origin main && git checkout main && git pull`
2. Criar branch: `git checkout -b feat/nome`
3. Implementar com commits semanticos incrementais
4. Push com upstream: `git push -u origin feat/nome`
5. Criar PR: `gh pr create --base main`
6. Merge via PR (squash merge) — NUNCA push direto em main

## Naming
- Sempre lowercase, hifens para separar palavras
- Prefixo obrigatorio: feat/, fix/, refactor/, hotfix/, docs/, chore/
- Maximo 50 caracteres apos o prefixo
- Sem caracteres especiais, acentos ou espacos
- Exemplos: `feat/user-authentication`, `fix/login-token-expiry`, `refactor/extract-auth-module`

## Verificacao Automatica
- Hook `branch-guard.sh` BLOQUEIA commits de codigo fonte em main/master
- Hook `pre-push-check.sh` AVISA sobre push direto em main
- Agentes ag-implementar-codigo e ag-corrigir-bugs verificam branch ANTES de commitar
