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

$ARGUMENTS

Carregar o plano, extrair todos os itens executaveis, rastrear cada um no codigo.
Reportar: Total, Completos, Parciais, Faltando. NAO modificar codigo — apenas validar.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user
- READ-ONLY agent — validates completeness, does NOT fix or implement
- Independent validation (different from self-check by the builder agent)
