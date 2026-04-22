---
name: ag-team-safe
description: "Wrapper para criar Agent Teams com isolamento de worktree OBRIGATORIO em todos os teammates que fazem escrita. Previne corrupcao de working tree por edits concorrentes."
model: opus
context: fork
argument-hint: "[objetivo] [--teammates N] [--repo path]"
allowed-tools: Read, Bash, Agent, TaskCreate, TaskUpdate, TaskList, TeamCreate, TeamDelete, SendMessage
---

# ag-team-safe — Team Wrapper com Worktree Obrigatorio

## Problema que resolve

`TeamCreate` por padrao NAO impoe `isolation:"worktree"` nos teammates. Se
voce spawna 3 teammates que editam o mesmo repo, os 3 escrevem no mesmo
working tree → corrupcao garantida (stash overflow, edits perdidos, branch
drift). Incidente referencia: `docs/diagnosticos/2026-04-07-raiz-data-engine-wip-triage.md`.

## O que faz

1. Valida ambiente antes de criar team:
   - `memory_pressure` != critical
   - `repo-health.sh` no repo alvo (stash < 3, working tree limpo ou com WIP identificado)
   - `claude-locks-status.sh` sem PIDs ativos conflitantes
2. Cria team via `TeamCreate`
3. Para CADA teammate que fara escrita (build/refactor/fix):
   - Spawna com `isolation:"worktree"` OBRIGATORIO
   - Injeta no prompt: path absoluto do worktree, branch alvo, escopo de arquivos exclusivo
4. Teammates read-only (Explore, review) podem rodar sem worktree
5. Coordena merge sequencial dos worktrees para a branch integradora
6. `TeamDelete` imediato ao final

## Invocacao

```
/ag-team-safe adicionar autenticacao Clerk no raiz-platform --teammates 3
/ag-team-safe refatorar modulo auth em 3 frentes --teammates 3 --repo ~/Claude/GitHub/raiz-platform
```

## Regras inegociaveis

### R1 — Zero overlap de arquivos
Antes de spawnar teammates, declarar lista EXPLICITA de arquivos por teammate.
Se houver overlap → rejeitar paralelismo, fazer sequencial.

### R2 — Worktree para todo teammate que escreve
```
Agent({
  team_name: "<nome>",
  name: "builder-auth",
  subagent_type: "ag-implementar-codigo-construir-codigo",
  isolation: "worktree",   // ← OBRIGATORIO
  prompt: "Trabalhe em [worktree path absoluto]. Edite APENAS: [lista]. NAO toque em: [lista]."
})
```

### R3 — Max 4 teammates
Memory safety (36GB MacBook). Mais que 4 → sequencial.

### R4 — Max 1 teammate escrevendo em package.json / tsconfig / lock files
Se 2+ teammates precisam mudar deps → sequencial por esses arquivos, paralelo no resto.

### R5 — Merge sequencial dos worktrees
Nunca merge paralelo. Ordem:
1. Teammate que toca infra (migrations, configs, tipos)
2. Teammates de features independentes
3. Teammate de testes/docs
Entre cada merge: typecheck + lint + test.

### R6 — TeamDelete imediato
Apos ultimo merge, `TeamDelete` para liberar memoria e matar tmux panes.

## Fases

### Fase 1 — Pre-flight
```
memory_pressure                                          # deve ser normal
bash ~/.claude/scripts/claude-locks-status.sh            # sem PIDs conflitantes
bash ~/.claude/scripts/repo-health.sh <repo>             # saudavel
```
Se qualquer check falhar → abortar e reportar ao usuario.

### Fase 2 — Planejamento
- Decompor objetivo em N tarefas independentes (N <= 4)
- Para cada tarefa, declarar: lista de arquivos, branch alvo, escopo de commits
- Verificar overlap → ajustar ate zero

### Fase 3 — TeamCreate + spawn
- `TeamCreate` com nome descritivo
- Para cada tarefa, `Agent` com `isolation:"worktree"` e prompt contendo:
  - Path absoluto do worktree (apos criacao)
  - Branch alvo (ex: feat/<nome>-<subtask>)
  - Lista de arquivos permitidos
  - Lista de arquivos proibidos
  - Quality gate: typecheck + lint + test antes de reportar done
- Registrar task para cada teammate na TaskList compartilhada

### Fase 4 — Monitoramento
- Aguardar teammates reportarem via SendMessage
- Se teammate bloquear → reatribuir ou escalar
- Nao aceitar "done" sem typecheck + lint + test verdes

### Fase 5 — Merge
- Sequencial conforme R5
- Cada merge: checkout integradora, merge worktree branch, rodar gates
- Se gate falhar → revert merge, reportar ao teammate para fix

### Fase 6 — Cleanup
- `TeamDelete`
- `git worktree prune` em cada repo tocado
- Reportar resumo: commits criados, branches, PRs (se --autonomo)

## Quando usar ag-team-safe vs ag-1-construir vs ag-0-orquestrador

| Cenario | Ferramenta |
|---------|-----------|
| 1 feature, 1 PR | ag-1-construir |
| 1 plano multi-PR (5 entregas sequenciais) | ag-0-orquestrador → N x ag-1 |
| 2-4 frentes independentes do mesmo objetivo, simultaneas | ag-team-safe |
| Audit read-only em N repos | Agent Explore paralelos (sem team) |
| >4 frentes | Sequencial ou quebrar em sub-objetivos |

## Anti-patterns (NUNCA fazer)

- TeamCreate sem passar por pre-flight (Fase 1)
- Teammate escrevendo sem isolation:"worktree"
- 2 teammates com overlap de arquivos
- Merge paralelo de worktrees
- Deixar team vivo apos conclusao (memory leak)
- Usar ag-team-safe para 1 tarefa so (overhead nao compensa)
