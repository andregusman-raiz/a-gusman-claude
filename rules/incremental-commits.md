---
description: "Protocolo de commits incrementais para proteger trabalho em andamento"
paths:
  - "**/*"
---

# Protocolo de Commits Incrementais

## Regra dos 3-5 Fixes

Quando trabalhando em batch de bugs/fixes/mudancas:

1. Apos cada 3-5 fixes implementados → PARE
2. Rode: typecheck nos arquivos tocados
3. Rode: lint nos arquivos tocados
4. Se ambos passam → commit imediato com mensagem semantica
5. Se falham → corrija ANTES de continuar
6. NUNCA acumule mais de 5 mudancas sem commit

## Verificacao de Persistencia (Prevenir Perda de Edicoes)

Apos cada batch de 2-3 edicoes, ANTES de continuar:
1. `git diff --stat` — confirmar que edicoes estao no disco
2. Se output vazio → edicoes foram perdidas (compaction/interrupcao). Re-executar.
3. NUNCA acumular mais de 3 edicoes sem `git diff --stat`

## Em Caso de Instabilidade

Se detectar API error, rate limit, ou qualquer instabilidade:

1. Commit IMEDIATO de todo trabalho em progresso
2. Mensagem: wip: progresso parcial - X de Y completos
3. Melhor um WIP commit do que perder tudo

## Pre-Commit Validation

ANTES de cada git commit:
1. Typecheck → zero erros
2. Lint → zero warnings
3. Se lint-staged rejeitar → corrigir e retry (max 3x)
4. NUNCA usar --no-verify

## Auto-Fix de Imports (Hook Automatico)

O hook bash-guards.sh executa auto-fix de eslint em staged .ts/.tsx antes de commit.
Corrige automaticamente unused imports (causa #1 de lint-staged rejection).
Se eslint nao disponivel, commit prossegue normalmente.
