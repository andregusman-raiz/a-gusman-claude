---
name: ag-I-32-due-diligence
description: "Avaliacao tecnica de software externo antes de incorporacao. Analisa stack, qualidade, seguranca, dados e compatibilidade. Produz score Go/No-Go."
model: sonnet
argument-hint: "[path ou URL do software externo]"
disable-model-invocation: true
---

# ag-I-32 — Due Diligence Tecnica

Spawn the `ag-I-32-due-diligence` agent to evaluate external software for incorporation. Analyzes stack, quality, security, data, and compatibility. Produces Go/No-Go score.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-I-32-due-diligence`
- `mode`: `auto`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
Software: [nome do software externo]
URL/Path: [URL do repo ou path local]

$ARGUMENTS

## Output
- Due diligence report com Go/No-Go score
- Analise de: stack, qualidade de codigo, seguranca, dados, compatibilidade com rAIz Platform
- Riscos identificados com mitigacao sugerida

Realize due diligence tecnica completa: identificacao, stack analysis, qualidade de codigo,
seguranca, dados/schema, compatibilidade com rAIz Platform (Next.js 14, TS, Supabase, Vercel).
Produza relatorio com score Go/No-Go fundamentado.
Referencia: Playbook 11 (Incorporacao de Software).
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- Runs in background — produces detailed evaluation report
- After spawning, confirm to the user
