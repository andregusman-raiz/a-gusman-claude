---
name: ag-P-07-planejar-execucao
description: "Quebra spec em fases e tarefas atomicas com dependencias, criterios de done e estimativas. Produz task_plan.md. Use when breaking specs into execution plans."
model: opus
argument-hint: "[SPEC path ou feature]"
disable-model-invocation: true
---

# ag-P-07 — Planejar Execucao

Spawn the `ag-P-07-planejar-execucao` agent to break a spec into phased, atomic tasks with dependencies and done criteria.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-P-07-planejar-execucao`
- `mode`: `auto`
- `run_in_background`: `false`
- `prompt`: Compose from template below + $ARGUMENTS

**NOTE**: NOT background — output (task_plan.md) is needed before ag-B-08 can build.

## Prompt Template

```
SPEC: [path to SPEC.md or feature description from $ARGUMENTS]
Scope: [scope boundaries if specified]


Produzir docs/plan/task_plan.md com:
- Goal (objetivo em uma frase)
- Phases com tarefas atomicas
- Cada tarefa: descricao + "Done when:" criterio
- Dependencias entre fases
- Estimativas de complexidade

Este task_plan sera seguido pelo ag-B-08 (build) e validado pelo ag-Q-12.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- Do NOT run in background — task_plan.md feeds into ag-B-08
- Output: `docs/plan/task_plan.md`

## Output
- docs/plan/task_plan.md com: Goal, Phases, Tasks atomicas (descricao + "Done when:" + depends-on)
- Phase 0: Test Specification (RED) — ag-Q-13 escreve testes antes da implementacao
- Para Size M+: implementation-brief-{TASK_ID}.md (arquivos exatos, snippets, edge cases)
- test-map.md mapeando requisitos para testes

## Anti-Patterns
- NUNCA criar tasks muito grandes — se >4h, decompor; tasks grandes causam goal drift
- NUNCA omitir "Done when" — "implementar login" e vago; criterios verificaveis sao obrigatorios
- NUNCA ignorar dependencias — marcar explicitamente Phase 2 depends on Phase 1

## Quality Gate
- [ ] Cada task tem criterios "Done when" verificaveis?
- [ ] Dependencias entre fases explicitas?
- [ ] Nenhuma task estimada em >4h?
- [ ] Phase 0 (TDD) incluida para features?
- [ ] Plano verificavel por ag-Q-12?

