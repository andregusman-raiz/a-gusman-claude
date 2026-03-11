---
name: ag-I-33-mapear-integracao
description: "Mapeia todas as dimensoes de integracao entre sistema externo e rAIz Platform. Identifica pontos de contato, conflitos e caminhos de migracao."
model: sonnet
argument-hint: "[sistema-externo]"
disable-model-invocation: true
---

# ag-I-33 — Mapear Integracao

Spawn the `ag-I-33-mapear-integracao` agent to map all integration dimensions between an external system and rAIz Platform. Identifies contact points, conflicts, and migration paths.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-I-33-mapear-integracao`
- `mode`: `auto`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
Sistema externo: [nome do sistema]
Due diligence path: [path do relatorio ag-I-32, se disponivel]

$ARGUMENTS

## Output
- Mapa de integracao: Database, Auth, API, UI/Components, Business Logic, Infra, Data Migration
- Pontos de contato, conflitos e caminhos de migracao por dimensao

Mapeie todas as dimensoes de integracao: Database, Auth, API, UI/Components, Business Logic,
Infrastructure, Data Migration. Identifique conflitos e caminhos de migracao para cada dimensao.
Pre-condicao: due diligence concluida (ag-I-32) com recomendacao GO.
Referencia: Playbook 11 (Incorporacao de Software).
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- Runs in background — produces integration map
- After spawning, confirm to the user
