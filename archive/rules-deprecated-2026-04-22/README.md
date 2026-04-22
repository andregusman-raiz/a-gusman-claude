# Deprecated Rules — archived 2026-04-22

Unificadas em `rules/agent-parallel-safety.md` conforme ADR-0001 P2.3.

- `agent-boundaries.md` → conteúdo em `agent-parallel-safety.md` R3 (ownership) + R6 (limites paralelismo) + R8 (enforcement orquestrador)
- `multi-agent-isolation.md` → conteúdo em `agent-parallel-safety.md` R1 (health check) + R2 (worktree) + R4 (stashes) + R5 (pgrep) + R7 (encerramento) + seção Recovery

Overlap detectado: ~40%. Regra unificada tem 8 regras (R1-R8) vs 5+7 separadas anteriormente.
