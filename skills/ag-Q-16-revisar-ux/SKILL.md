---
name: ag-Q-16-revisar-ux
description: "Avalia experiencia do usuario com heuristicas de Nielsen, compara com benchmarks do mercado e propoe melhorias priorizadas. Review rapido e pontual."
model: sonnet
argument-hint: "[tela ou componente]"
disable-model-invocation: true
---

# ag-Q-16 — Revisar UX

Spawn the `ag-Q-16-revisar-ux` agent to review UX and accessibility of a screen or component.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-Q-16-revisar-ux`
- `mode`: `auto`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
Tela/Componente: [nome da tela, rota, ou componente a revisar]

$ARGUMENTS

Avaliar UX usando heuristicas de Nielsen. Verificar acessibilidade (WCAG 2.1 AA), responsividade, e experiencia mobile.
Propor melhorias priorizadas por impacto.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user
- READ-ONLY review — does NOT modify code, only suggests improvements
- For continuous PDCA evaluation with design tokens, use ag-Q-42 (UX-QAT) instead
- Supports modes: full review, benchmark comparison, accessibility focus, mobile focus
