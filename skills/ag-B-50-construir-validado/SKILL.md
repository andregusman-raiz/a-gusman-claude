---
name: ag-B-50-construir-validado
description: "Spawna builder (ag-B-08) + validator (ag-Q-14) em paralelo. Builder implementa, validator verifica em tempo real. Pattern de Boris Cherny."
model: sonnet
context: fork
allowed-tools: Agent, Read, Glob, Grep, Bash
argument-hint: "[projeto-path] [scope]"
---

# ag-B-50-construir-validado — Builder/Validator Pattern

Implements the builder/validator pattern where implementation and review
happen concurrently instead of sequentially.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `general-purpose`
- `mode`: `auto`
- `prompt`: Compose from template below

## Prompt Template

```
Projeto: [CWD]
Scope: [from arguments]

## Pattern: Builder + Validator Concurrent

1. Read task_plan.md to understand what needs to be built
2. Spawn TWO agents in parallel:

   **Builder (ag-B-08)**:
   - Agent tool with subagent_type: ag-B-08-construir-codigo
   - isolation: worktree
   - Implements all items from task_plan.md
   - Commits incrementally every 5 actions

   **Validator (ag-Q-14)**:
   - Agent tool with subagent_type: ag-Q-14-criticar-projeto
   - run_in_background: true
   - Reviews code as it's committed
   - Reports issues found

3. During build: Builder uses LSP tool (hover/documentSymbol) for instant type validation on modified files — avoids spawning tsc during iterative work

4. After both complete:
   - Read validator output
   - If issues found: fix them
   - Run quality gates: tsc full (`bun run typecheck`) + lint + test (only here, not during build)
   - Report final status
```

## Inter-Agent Communication
- Builder uses **SendMessage** to notify coordinator at key milestones:
  - Module complete, blocker found, self-check result
- Validator uses **SendMessage** to report issues found during review
- Coordinator reads messages and decides: continue, fix, or escalate

## Important
- Builder and validator run CONCURRENTLY — this is the key innovation
- Validator reviews code as it appears, not after all code is written
- This reduces cycle time vs sequential build→review
- allowed-tools for coordinator MUST include SendMessage
