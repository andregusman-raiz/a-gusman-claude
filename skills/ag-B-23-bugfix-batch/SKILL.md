---
name: ag-B-23-bugfix-batch
description: "Sprint de bug-fix em batches. Classifica por severidade, agrupa em sprints de 3-5, executa com commits incrementais. NUNCA acumula mais de 5 fixes sem commit."
model: sonnet
argument-hint: "[lista de bugs ou diagnostico]"
disable-model-invocation: true
---

# ag-B-23 — Bugfix Batch

Spawn the `ag-B-23-bugfix-batch` agent to fix bugs in sequential batches with incremental commits.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-B-23-bugfix-batch`
- `mode`: `bypassPermissions`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
Bugs: [lista de bugs — IDs, descricoes, ou path para arquivo de diagnostico]
Diagnostico: [path para diagnostico gerado por ag-B-25, se disponivel]

$ARGUMENTS

Classificar bugs por severidade, agrupar em sprints de 3-5, executar com commits incrementais.
Se > 5 bugs independentes em modulos diferentes, considerar ag-B-24 (paralelo).
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user
- For 2-5 bugs sequential; for 6+ independent bugs use ag-B-24 instead
- Uses worktree isolation
