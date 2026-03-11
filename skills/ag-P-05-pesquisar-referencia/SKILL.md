---
name: ag-P-05-pesquisar-referencia
description: "Pesquisa solucoes, benchmarks e alternativas antes de especificar. Compara trade-offs com dados. Use when researching solutions, comparing alternatives, or evaluating technologies."
model: haiku
argument-hint: "[tema de pesquisa]"
disable-model-invocation: true
---

# ag-P-05 — Pesquisar Referencia

Spawn the `ag-P-05-pesquisar-referencia` agent to research solutions, benchmarks, and alternatives with data-backed trade-offs.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-P-05-pesquisar-referencia`
- `mode`: `auto`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Tema: [research topic from $ARGUMENTS]
Contexto: [project context if available, otherwise "general"]

$ARGUMENTS

## Output
- Research findings em docs/ai-state/findings.md
- Comparacao de alternativas com trade-offs documentados
- Benchmarks e best practices relevantes

Pesquisar e comparar alternativas com dados:
- Solucoes para o problema especifico
- Comparacao de alternativas (features, performance, maturidade)
- Best practices e anti-patterns documentados
- Libs/ferramentas relevantes

Salvar achados incrementalmente em docs/ai-state/findings.md (a cada 2 pesquisas).
Usar Context7 MCP para docs atualizadas quando possivel.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user that the agent is running in background
- Uses WebSearch and WebFetch for external research
