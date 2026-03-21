---
name: ag-Q-39-ciclo-teste-completo
description: "Ciclo autonomo Test-Fix-Retest. Roda suite completa, documenta achados, corrige em sprints, re-testa ate convergencia. Max 3 ciclos."
model: sonnet
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


Executar ciclo completo autonomo: baseline -> triage -> fix sprints -> retest -> report final.
Max 3 ciclos de convergencia. Sem perguntas intermediarias — documentar SKIPs e continuar.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user
- Autonomous heavy agent — runs with `context: fork` for isolation
- Delivers: baseline report, triage, committed fixes, retest comparison, final report
- Max 3 convergence cycles; documents unfixable items as SKIP

## Escalacao: Issues para SKIPs

Itens marcados como SKIP (unfixable apos 3 ciclos) DEVEM ser registrados como GitHub Issues:

```
Agent({
  subagent_type: "ag-M-50-registrar-issue",
  name: "issue-registrar",
  model: "haiku",
  run_in_background: true,
  prompt: "Repo: [detectar]\nOrigem: ag-Q-39\nSeveridade: P2-medium\nTitulo: Unfixable test: [nome do teste/item]\nContexto: [descricao do item, tentativas nos 3 ciclos, razao do SKIP, impacto]\nArquivos: [arquivos relevantes]\nLabels: bug, needs-investigation"
})
```
