---
description: "Protocolo multi-sessão no raiz-data-engine — worktree próprio + claim + incidentes reais"
paths:
  - "**/raiz-data-engine/**"
---

# Multi-Sessão no raiz-data-engine

> O DE é trabalhado por **várias sessões Claude em paralelo** (specs, DP, casework, front). Esta
> rule é operacional e nasceu de incidentes REAIS (não hipóteses). Regra-mãe genérica:
> `agent-parallel-safety.md`. Aqui ficam só os fatos específicos do DE.

## Regra de ouro

**1 sessão = 1 worktree próprio.** NUNCA duas sessões no mesmo working tree. NUNCA usar o
worktree `pos-auditoria` (compartilhado/instável) — criar o seu:

```bash
git worktree add .claude/worktrees/<seu-nome> -b <feat/seu-branch> origin/main
```

Antes de codar numa **trilha compartilhada** (mesmo arquivo/módulo que outra sessão pode tocar):
**claim por comentário na issue** correspondente. Sem claim = colisão garantida.

## Incidentes que geraram a regra (casos, não teoria)

| # | Incidente | Causa | Recuperação / prevenção |
|---|-----------|-------|-------------------------|
| I-1 | **Colisão de worktree (GRAVE)** | 2 sessões no mesmo `pos-auditoria`; stashes cruzados (17s de intervalo) apagaram trabalho | `git fsck --unreachable` achou o WIP + untracked; movido para worktree próprio. **Prevenção: worktree por sessão.** |
| I-2 | **Item duplicado** | Sessão-specs mergeou VerifySpec.kind idêntico (#5256) enquanto meu PR esperava CI | `rebase --onto main` descartando o commit duplo. **Prevenção: claim antes de codar.** |
| I-3 | **Stacked PR auto-fechado** | merge com `--delete-branch` fechou o PR empilhado que apontava pro branch deletado; force-push pós-close impede reabrir | `rebase --onto main` + novo PR. **Prevenção: não empilhar PR entre sessões; rebasear no main.** |
| I-4 | **dbt advisory lock trava deploy** | deploys concorrentes + cron dbt-refresh (`*/15 9-23,0-2 UTC`) competem pelo advisory lock | "sniper": observar `pg_locks WHERE locktype='advisory'` até count==0 → `railway redeploy` no mesmo tick |
| I-5 | **Merge falha: main em outro worktree** | `gh pr merge --delete-branch` tenta checkout local do main já usado por worktree codex | merge server-side já passou; re-rodar `gh pr merge <n> --squash` sem `--delete-branch` |
| I-6 | **Migration fail-open** | entrypoint roda alembic com timeout 90s fail-open → deploy SUCCESS ≠ migration aplicada | conferir `alembic_version`; aplicar manual via `railway run -- uv run alembic upgrade head` |

## Disciplina de baseline (anti falso-positivo)

A suíte `tests/casework` tem baseline que **drifta diariamente** (26→22→20 falhas conhecidas). Antes
de atribuir uma falha ao seu diff: `git stash -u` → rodar → comparar lista-de-FAILED vs main limpo.
Falha que já existe no main NÃO é sua.

## Sentença scratch wsConsultaSQL

`CLAUDE.TESTE` é a **única** sentença GCONSSQL registrada no RM (scratch compartilhada). Nome novo
(ex: `CLAUDE.ESOCIALMSG`) falha com `SentenceNotFound`. É contendida entre sessões/crons → sempre
atualizar via `update_scratch_sentence_with_retry` (retry anti-concorrência). IN-list de SQL trunca
acima de ~4KB (chunk ≤100 valores).
