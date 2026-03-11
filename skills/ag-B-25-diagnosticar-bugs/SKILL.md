---
name: ag-B-25-diagnosticar-bugs
description: "Triagem de bugs. Le documentos/pastas, classifica por severidade e modulo, gera plano de sprints. NAO executa fixes — apenas diagnostica e planeja."
model: haiku
argument-hint: "[projeto-path ou lista de bugs]"
disable-model-invocation: true
---

# ag-B-25 — Diagnosticar Bugs

Spawn the `ag-B-25-diagnosticar-bugs` agent to triage bugs and generate a structured fix plan.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-B-25-diagnosticar-bugs`
- `mode`: `auto`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
Fonte: [errors-log.md, issues, pasta de bugs, ou lista inline]

$ARGUMENTS

Ler TODOS os bugs da fonte, classificar por severidade e modulo, gerar plano de sprints para ag-B-23 ou ag-B-24.
NAO executar fixes — apenas diagnosticar e produzir plano.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user
- This agent is READ-ONLY — it does NOT fix bugs, only triages and plans
- Output is input for ag-B-23 (batch) or ag-B-24 (parallel)
