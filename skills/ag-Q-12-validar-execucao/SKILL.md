---
name: ag-Q-12-validar-execucao
description: "Compara o plano de execucao com o codigo produzido e verifica se TODOS os itens foram implementados. Validacao independente de completude."
model: haiku
argument-hint: "[task_plan.md ou SPEC path]"
disable-model-invocation: true
---

# ag-Q-12 — Validar Execucao

Spawn the `ag-Q-12-validar-execucao` agent to validate implementation completeness against a plan or SPEC.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-Q-12-validar-execucao`
- `mode`: `auto`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
Plano/SPEC: [path para task_plan.md, SPEC.md, ou implementation-brief]


Carregar o plano, extrair todos os itens executaveis, rastrear cada um no codigo.
Reportar: Total, Completos, Parciais, Faltando. NAO modificar codigo — apenas validar.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user
- READ-ONLY agent — validates completeness, does NOT fix or implement
- Independent validation (different from self-check by the builder agent)

## Validation Checklist por Tipo

### Feature
- [ ] Todos os endpoints/componentes do SPEC existem?
- [ ] Tipos/interfaces criados conforme spec?
- [ ] Testes unitarios incluidos?
- [ ] Error handling implementado?

### Bugfix
- [ ] Bug original reproduzido e confirmado resolvido?
- [ ] Teste de regressao adicionado?
- [ ] Nenhum efeito colateral em modulos adjacentes?

### Refactor
- [ ] Todos os testes anteriores continuam passando?
- [ ] Nenhuma funcionalidade removida acidentalmente?
- [ ] Imports atualizados em todos os consumidores?

## Como Comparar task_plan vs Codigo

1. Ler task_plan.md item por item
2. Para cada item: `grep -r "implementacao_esperada" src/`
3. Classificar: DONE (existe e funciona), PARCIAL (existe mas incompleto), FALTANDO (nao existe)
4. Reportar contagem: Total X | Done Y | Parcial Z | Faltando W

## Anti-Patterns
- NUNCA declarar "done" sem rodar `bun run typecheck && bun run lint`
- NUNCA skipar items do plano — cada item deve ser verificado
- NUNCA confiar em "eu implementei tudo" sem evidencia
- NUNCA validar sem ler o plano original — sempre reler task_plan.md

## Quality Gate
- [ ] Cada item do plano verificado individualmente?
- [ ] Contagem Total/Done/Parcial/Faltando reportada?
- [ ] Typecheck e lint executados?
- [ ] Nenhum item marcado como FALTANDO?
