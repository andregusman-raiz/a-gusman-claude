---
name: ag-explorar-codigo
description: "Mapeia estrutura, stack, padroes e dependencias de um codebase existente. Produz project-profile.json, codebase-map.md e findings.md (incremental). Use when exploring, mapping, or understanding a codebase."
model: haiku
argument-hint: "[projeto-path] [focus-area]"
disable-model-invocation: true
---

# ag-explorar-codigo — Explorar Codigo

Spawn the `ag-explorar-codigo` agent to map a codebase: structure, stack, patterns, dependencies.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-explorar-codigo`
- `mode`: `auto`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
Focus: [focus area if specified, otherwise "full codebase"]


Mapear o codebase produzindo:
1. docs/ai-state/project-profile.json (metadados estruturados)
2. docs/ai-state/codebase-map.md (mapa visual)
3. docs/ai-state/findings.md (descobertas incrementais)

Regra: salvar a cada 2 arquivos lidos. NAO acumular no contexto.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user that the agent is running in background
- Output files will be in `docs/ai-state/` of the target project
