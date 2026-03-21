---
name: ag-P-06-especificar-solucao
description: "Cria especificacao tecnica detalhada: o que construir, como, quais interfaces, quais edge cases. Spec precisa e implementavel. Use when creating technical specifications."
model: opus
argument-hint: "[feature ou problema]"
disable-model-invocation: true
---

# ag-P-06 — Especificar Solucao

Spawn the `ag-P-06-especificar-solucao` agent to create a precise, implementable technical specification.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-P-06-especificar-solucao`
- `mode`: `auto`
- `run_in_background`: `false`
- `prompt`: Compose from template below + $ARGUMENTS

**NOTE**: NOT background — output is needed before ag-P-07 can plan execution.

## Prompt Template

```
Feature/Problema: [from $ARGUMENTS]
Escopo: [scope boundaries if specified]


Criar SPEC tecnica implementavel cobrindo:
- Interface do componente/feature (inputs, outputs, comportamento)
- Fluxos de usuario (happy path + error paths)
- Estrutura de dados (schemas Zod, types TypeScript)
- Edge cases e como tratar cada um
- O que NAO esta no escopo (OOS)
- Decisoes tecnicas com rationale

Ler docs/ai-state/findings.md e errors-log.md antes de comecar.
Max 200 linhas por SPEC (dividir se maior).
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- Do NOT run in background — output feeds into ag-P-07
- Supports modes: default (full spec), `minimal` (< 50 lines), `review` (evaluate existing spec)
