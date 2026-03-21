---
name: ag-R-57-quality-gates
description: "Quality Gates minimos, checklist pos-execucao, regras anti-teatralidade, metricas CI. Reference skill carregado on-demand."
context: fork
---

# Quality Gates (Minimos)

Antes de declarar qualquer tarefa como concluida:

| Gate | Criterio | Comando Tipico |
|------|----------|----------------|
| Build | Sem erros | `bun run build` |
| TypeCheck | 0 erros | `bun run typecheck` ou `bunx tsc --noEmit` |
| Lint | 0 erros novos | `bun run lint` |
| Tests | 0 falhas novas | `bun run test` ou `pytest` |
| Security | 0 vulnerabilidades criticas | `bun run audit` |
| UX Render | 0 L1 failures (quando configurado) | `/ag-Q-42 --layers=L1` |
| UX Compliance | WCAG AA + Lighthouse >= 90 | `/ag-Q-42 --layers=L4` |

## Teste Focado (durante desenvolvimento)

Preferir execucao de teste individual para feedback rapido:
```bash
bunx vitest run path/to/test.test.ts   # Um arquivo
bunx vitest run --reporter=verbose      # Suite completa (somente no final)
```
NUNCA rodar `bun run test` durante desenvolvimento iterativo — somente para validacao final.

## Checklist Minimo Pos-Execucao
```bash
bun run typecheck && bun run lint && bun run test
```

## Regras Anti-Teatralidade (Obrigatorias)

Ao escrever ou revisar testes:
- Cada expect() DEVE poder FALHAR em cenario real
- NUNCA: `.catch(() => false)`, `|| true`, conditional sem else, expect always-true
- SEMPRE: hard-code valores esperados, testar ambos paths (sucesso + falha)
- SEMPRE: mutation mental antes de declarar done ("se eu introduzir bug, este teste falha?")
- Ver detalhes: `.claude/rules/test-quality-enforcement.md`

## Metricas de Qualidade (CI)

- **Theatrical scan**: CI bloqueia merge se anti-patterns detectados (test-quality job)
- **Mutation testing**: Stryker roda semanalmente (mutation-testing.yml), target 80%
- **DORA metrics**: Change Fail Rate, Lead Time, Deploy Frequency (dora-metrics.yml)
- **Quality gates**: TS budget, ESLint budget, file size, bun run audit (quality-gates.yml)
- **Audit local**: `bash .claude/scripts/test-quality-audit.sh [path]`

## Compaction Preservation

Ao executar `/compact`, SEMPRE incluir instrucao:
> "Preserve: lista de arquivos modificados, task atual, comandos de teste, erros encontrados"
