---
name: ag-I-34-planejar-incorporacao
description: "Cria roadmap de incorporacao com fases, milestones, feature flags e task_plan. Transforma mapa de integracao em plano executavel."
model: sonnet
argument-hint: "[integration-map path]"
disable-model-invocation: true
---

# ag-I-34 — Planejar Incorporacao

Spawn the `ag-I-34-planejar-incorporacao` agent to create an incorporation roadmap with phases, milestones, feature flags, and task_plan.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-I-34-planejar-incorporacao`
- `mode`: `auto`
- `run_in_background`: `false`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
Integration map: [path do mapa de integracao ag-I-33]
Prioridades: [quais dimensoes/modulos priorizar]

$ARGUMENTS

## Output
- Roadmap de incorporacao com fases, milestones e feature flags
- task_plan.md com tasks atomicas por fase
- Criterios de rollback por milestone

Transforme o mapa de integracao em roadmap executavel com fases, milestones e tarefas atomicas.
Defina feature flags, criterios de rollback e task_plan por fase.
Pre-condicao: due diligence GO (ag-I-32) + mapa de integracao completo (ag-I-33).
Referencia: Playbook 11 (Incorporacao de Software).
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user
