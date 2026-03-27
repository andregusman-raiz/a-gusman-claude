---
name: ag-analisar-contexto
description: "Analisa padroes de codigo, debitos tecnicos, riscos arquiteturais. Produz diagnostico com prioridades P0-P3. Use when analyzing code quality, tech debt, or architectural risks."
model: opus
argument-hint: "[projeto-path]"
disable-model-invocation: true
---

# ag-analisar-contexto — Analisar Contexto

Spawn the `ag-analisar-contexto` agent to diagnose code patterns, tech debt, and architectural risks.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-analisar-contexto`
- `mode`: `auto`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]


Analisar o codebase produzindo diagnostico com prioridades P0-P3:
- Consistencia de padroes
- Debito tecnico (TODOs, any, magic numbers)
- Riscos arquiteturais (acoplamento, single points of failure)
- Cobertura de testes
- Seguranca superficial

Salvar incrementalmente em docs/ai-state/findings.md.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user that the agent is running in background
- Requires ag-explorar-codigo output (project-profile.json, codebase-map.md) for best results

## Output
- findings.md em docs/ai-state/ com prioridades P0-P3
- Inventario de tech debt: TODOs, tipos `any`, magic numbers, duplicacao, deps desatualizadas
- Riscos arquiteturais: single points of failure, dependencias circulares, gaps de seguranca

## Anti-Patterns
- NUNCA diagnosticar sem ler codigo — findings do ag-explorar-codigo sao ponto de partida, nao substituto
- NUNCA classificar tudo como P0 — se tudo e critico, nada e critico; usar P0-P3 rigorosamente
- NUNCA misturar diagnostico com prescricao — diagnostico e ag-analisar-contexto, solucao e ag-especificar-solucao

## Escalacao: Issues para Tech Debt P0

Findings P0 (blocking production) DEVEM ser registrados como GitHub Issues:

```
Agent({
  subagent_type: "ag-registrar-issue",
  name: "issue-registrar",
  model: "haiku",
  run_in_background: true,
  prompt: "Repo: [detectar]\nOrigem: ag-analisar-contexto\nSeveridade: P0-critical\nTitulo: [Tech Debt] descricao do problema\nContexto: [descricao completa, impacto, arquivos afetados, risco se nao resolvido]\nArquivos: [arquivos afetados]\nLabels: tech-debt"
})
```

- P0: SEMPRE criar issue (risco iminente)
- P1-P3: apenas documentar em findings.md

## Quality Gate
- [ ] Cada debt tem severidade (P0-P3)?
- [ ] Riscos de seguranca verificados?
- [ ] findings.md atualizado incrementalmente?
- [ ] Findings P0 registrados como GitHub Issues via ag-registrar-issue?

