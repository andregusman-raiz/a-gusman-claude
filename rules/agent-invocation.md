---
description: "Quando usar Skill vs Agent vs Agent Teams vs Worktree"
paths:
  - "**/*"
---

# Agent Invocation — When to Use What

## Skill (load context on-demand)
- Pattern/reference skills: `/ag-referencia-nextjs-patterns-nextjs`, `/ag-referencia-supabase-patterns-supabase`, etc.
- When you need domain expertise loaded into current context
- context: fork — isolates from main conversation

## Agent (subagent for isolated tasks)
- Single tasks that don't need coordination
- Use `run_in_background: true` for independent work
- Use `isolation: "worktree"` for code changes that might conflict
- subagent_type: use the specific agent type (e.g., `ag-implementar-codigo-construir-codigo`)

## Agent Teams (3+ parallel coordinated tasks)
- 3+ independent tasks that need coordination
- Each teammate gets exclusive file ownership (NO overlap)
- TeamDelete IMMEDIATELY after teammates finish (memory safety)
- Max 4 teammates (memory constraint: 36GB MacBook)

## Worktree Isolation (code changes with rollback safety)
- Use `isolation: "worktree"` when code changes might conflict or need rollback
- Agent gets isolated git copy — main branch unaffected
- Best for: ag-implementar-codigo (build), ag-refatorar-codigo (refactor), ag-otimizar-codigo (optimize), ag-corrigir-bugs (bugfix), ag-incorporar-modulo (incorporate)
- Worktree auto-cleaned if no changes; branch returned if changes made

## Decision Matrix

| Scenario | Use | Why |
|----------|-----|-----|
| Need expertise context | Skill | Loads into current context |
| 1 isolated task | Agent | Separate context, focused |
| 2 independent tasks | 2x Agent (parallel) | Simple, no coordination needed |
| 3-5 independent code tasks | Agent Teams | Coordinated parallel execution |
| Code that might conflict | Agent + worktree | Isolated git state, safe rollback |
| Risky refactor/build | Worktree isolation | Full rollback if things go wrong |
| Research/exploration | Agent (Explore subagent) | 200K dedicated context |
