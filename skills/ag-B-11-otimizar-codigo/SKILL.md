---
name: ag-B-11-otimizar-codigo
description: "Otimizacao de performance e legibilidade. Mede antes e depois. Nao otimiza sem medir. Use when optimizing code performance."
model: sonnet
argument-hint: "[modulo ou area a otimizar]"
disable-model-invocation: true
---

# ag-B-11 — Otimizar Codigo

Spawn the `ag-B-11-otimizar-codigo` agent to optimize code performance with before/after measurements.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-B-11-otimizar-codigo`
- `mode`: `bypassPermissions`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
Area: [module or area to optimize from $ARGUMENTS]
Benchmark: [specific metric if provided, otherwise "auto-detect"]


## Output
- Metricas antes/depois: bundle size, render time, API latency, Lighthouse scores
- Relatorio de delta com melhorias documentadas
- Codigo otimizado com commits por otimizacao

Regra de ouro: "Otimizar sem medir e adivinhar."
1. Medir ANTES (bundle size, render time, API latency, Lighthouse, etc.)
2. Identificar gargalo
3. Otimizar
4. Medir DEPOIS
5. Comparar e reportar delta

Prioridade: executar medicoes via CLI (lighthouse, bundle-analyzer, curl).
Worktree isolation ativo.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user that the optimization agent is running
- NEVER optimizes without measuring first
- Uses worktree isolation
- Reports before/after metrics for every optimization
