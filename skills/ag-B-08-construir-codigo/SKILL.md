---
name: ag-B-08-construir-codigo
description: "Implementa codigo seguindo o plano do ag-P-07. Re-le o plano a cada 10 acoes. Salva progresso a cada 5 acoes. Self-check antes de declarar pronto. Use when building/implementing code from a plan."
model: sonnet
argument-hint: "[projeto-path] [scope/modulos]"
disable-model-invocation: true
---

# ag-B-08 — Construir Codigo

Spawn the `ag-B-08-construir-codigo` agent to implement code following a task plan.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-B-08-construir-codigo`
- `mode`: `bypassPermissions`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Dynamic Context
- **Branch**: !`git branch --show-current 2>/dev/null || echo "no-git"`
- **Task plan**: !`cat task_plan.md 2>/dev/null | head -30 || echo "none"`

## Prompt Template

```
Projeto: [CWD or user-provided path]
Branch: [from dynamic context]
Scope: [modules/scope from $ARGUMENTS]

$ARGUMENTS

Implementar seguindo task_plan.md:
- Re-ler plano a cada 10 acoes
- Commit incremental a cada 5 acoes
- Self-check (typecheck + lint + test) antes de declarar pronto
- Para 3+ modulos independentes, usar Agent Teams (parallel build)

Worktree isolation ativo. Codigo que funciona > codigo perfeito.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user that the build agent is running
- Supports parallel build via Agent Teams for 3+ independent modules
- Uses worktree isolation for safe implementation

## Output
- Codigo funcional implementando todos os itens do task_plan.md
- Commits incrementais (1 a cada 5 arquivos modificados)
- session-state.json atualizado com progresso
- Handoff para ag-Q-12 apos self-check passar

## Anti-Patterns
- NUNCA implementar sem ler o plano primeiro — task_plan.md e vinculante
- NUNCA acumular 10+ arquivos sem commit — context reset perde trabalho nao salvo
- NUNCA ignorar erros de typecheck para "avancar" — debt tecnico retorna multiplicado
- NUNCA deixar TODOs/stubs e marcar como done — "parcial" nao e "done"
- NUNCA refatorar ou otimizar durante build — agentes especializados existem (ag-B-10, ag-B-11)

## Quality Gate
- [ ] Self-check de completude executado (releu task_plan, cada item: done/parcial/faltando)?
- [ ] Codigo compila e roda sem erros (`npm run build && npm run typecheck`)?
- [ ] session-state.json atualizado com progresso?
- [ ] errors-log.md atualizado se erros ocorreram?
- [ ] task_plan.md com 100% dos items marcados como done?

$ARGUMENTS
