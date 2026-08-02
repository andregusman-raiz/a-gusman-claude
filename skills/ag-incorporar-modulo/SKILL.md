---
name: ag-incorporar-modulo
description: "Executa incorporacao de um modulo seguindo o roadmap e task_plan. Implementa ACL, migrations, sync, UI adapters. Um modulo por vez."
model: sonnet
argument-hint: "[modulo] [fase]"
disable-model-invocation: true
---

# ag-incorporar-modulo — Incorporar Modulo

Spawn the `ag-incorporar-modulo` agent to execute module incorporation following the roadmap and task_plan. Implements ACL, migrations, sync, and UI adapters.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-incorporar-modulo`
- `mode`: `bypassPermissions`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
Modulo: [nome do modulo a incorporar]
Fase: [numero da fase no roadmap]
Roadmap path: [path do roadmap ag-planejar-incorporacao]


## Output
- Modulo incorporado: ACL, migrations, sync, UI adapters
- Feature branch com feature flag (default: off)
- Testes de integracao para o modulo incorporado

Execute a incorporacao do modulo seguindo rigorosamente o roadmap e task_plan.
Implemente ACL, migrations, sync, UI adapters conforme necessario.
Um modulo por vez. Feature branch obrigatoria. Feature flags default: off.
Pre-condicao: roadmap aprovado (ag-planejar-incorporacao) + task plan da fase atual.
Referencia: Playbook 11 (Incorporacao de Software).
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- Runs in background with bypassPermissions (autonomous execution)
- Uses worktree isolation for safe parallel work
- After spawning, confirm to the user
