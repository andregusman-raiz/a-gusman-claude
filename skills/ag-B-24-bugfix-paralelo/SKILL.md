---
name: ag-B-24-bugfix-paralelo
description: "Team Lead para corrigir 6+ bugs em paralelo. Usa Agent Teams para coordenar teammates com ownership exclusivo, TaskCreate/TaskUpdate para tracking, worktree isolation para zero conflitos."
model: sonnet
argument-hint: "[lista de 6+ bugs]"
disable-model-invocation: true
---

# ag-B-24 — Bugfix Paralelo

Spawn the `ag-B-24-bugfix-paralelo` agent to fix 6+ bugs in parallel using Agent Teams with exclusive ownership per module.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-B-24-bugfix-paralelo`
- `mode`: `bypassPermissions`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
Bugs: [lista de 6+ bugs — IDs, descricoes, modulos afetados]

$ARGUMENTS

## Output
- Coordination report com bugs distribuidos por teammate
- Cada bug corrigido em branch isolada com ownership exclusivo
- Smoke tests pos-agent para cada fix

Classificar bugs por modulo, verificar independencia (overlap < 30%), criar Agent Teams com ownership exclusivo.
Se < 6 bugs ou bugs compartilham muitos arquivos, usar ag-B-23 (sequencial).
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user
- Only use for 6+ independent bugs in different modules
- For < 6 bugs use ag-B-23 (batch sequential) instead
- Coordinator never executes fixes directly — only orchestrates
