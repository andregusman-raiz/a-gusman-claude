---
name: ag-B-26-fix-verificar
description: "Pipeline completo: implementar fix -> typecheck -> lint -> test -> commit. 5 gates de qualidade. Garante que lint-staged NUNCA rejeita."
model: sonnet
argument-hint: "[descricao do fix]"
disable-model-invocation: true
---

# ag-B-26 — Fix e Verificar

Spawn the `ag-B-26-fix-verificar` agent to implement a fix with 5 sequential quality gates before commit.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-B-26-fix-verificar`
- `mode`: `bypassPermissions`
- `run_in_background`: `false`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
Fix: [descricao da correcao a implementar]
Branch: [branch atual ou nome para criar]

$ARGUMENTS

Implementar fix e passar por 5 gates: Branch Check -> Implementar -> Typecheck -> Lint -> Test -> Commit.
Se em main/master, criar feature branch antes de commitar.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user
- NOT background — runs sequentially through 5 quality gates
- For multiple fixes use ag-B-23 (batch) instead
- Gates are blocking: if any gate fails, fix before proceeding
