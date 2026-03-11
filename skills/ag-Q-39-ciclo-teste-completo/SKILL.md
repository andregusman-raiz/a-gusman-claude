---
name: ag-Q-39-ciclo-teste-completo
description: "Ciclo autonomo Test-Fix-Retest. Roda suite completa, documenta achados, corrige em sprints, re-testa ate convergencia. Max 3 ciclos."
model: opus
argument-hint: "[projeto-path]"
disable-model-invocation: true
---

# ag-Q-39 — Ciclo Completo de Teste

Spawn the `ag-Q-39-ciclo-teste-completo` agent to run the full autonomous Test-Fix-Retest cycle.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-Q-39-ciclo-teste-completo`
- `context`: `fork`
- `mode`: `bypassPermissions`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]

$ARGUMENTS

Executar ciclo completo autonomo: baseline -> triage -> fix sprints -> retest -> report final.
Max 3 ciclos de convergencia. Sem perguntas intermediarias — documentar SKIPs e continuar.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user
- Autonomous heavy agent — runs with `context: fork` for isolation
- Delivers: baseline report, triage, committed fixes, retest comparison, final report
- Max 3 convergence cycles; documents unfixable items as SKIP
