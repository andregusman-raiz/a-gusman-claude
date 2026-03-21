---
name: ag-M-28-saude-sessao
description: "Health check de sessao. Verifica processos concorrentes, config corruption, stashes orfaos, worktrees abandonados. Executa ANTES de qualquer trabalho para prevenir perda de dados. Use at session start or when environment seems broken."
model: haiku
disable-model-invocation: true
---

# ag-M-28 — Saude da Sessao

Spawn the `ag-M-28-saude-sessao` agent to perform a health check on the development environment.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-M-28-saude-sessao`
- `mode`: `auto`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD]


## Output
- Health check status por secao (OK/WARN/FAIL):
  - Processos concorrentes, config integrity, stashes orfaos
  - Worktrees abandonados, env var corruption, disk/memory pressure
- Diagnostico READ-ONLY (nao modifica nada)

Executar health check completo:
1. Processos concorrentes (Claude instances)
2. Config validation (.claude.json integrity)
3. Git stashes orfaos
4. Worktrees abandonados
5. Env vars corruption
6. Disk space / memory pressure

Reportar status de cada check: OK / WARN / FAIL.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user that the health check is running
- This agent is READ-ONLY — it diagnoses but does NOT fix issues
- Use at session start or when environment behaves unexpectedly
