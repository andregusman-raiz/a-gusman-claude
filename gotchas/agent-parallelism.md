# Gotchas: Agent Parallelism

## Memory Exhaustion
- MacBook Pro M5 com 36GB RAM — NUNCA exceder 4 sessoes Claude Code simultaneas
- Max 4 teammates por sessao (Agent Teams) — total estimado ~36GB em cenario agressivo
- Verificar `memory_pressure` (macOS) ANTES de spawnar novos agents
- Se `warn` ou `critical` → NAO spawnar, aguardar os atuais terminarem
- Cada sessao Claude Code consome ~4-6GB RAM base + ~2GB por teammate

## Context Window Conflicts
- Subagents herdam MCPs da sessao pai automaticamente
- NUNCA iniciar MCPs extras dentro de subagents (duplica consumo de tokens + RAM)
- Se sessao nao precisa de browser → nao carregar playwright/chrome-devtools
- Cada MCP server roda como processo separado — multiplica por numero de agents
- Context window de 200K e POR agent, nao compartilhado — usar isso a favor (exploracao em subagent)

## File Ownership
- NUNCA dois agents no mesmo arquivo — causa conflitos silenciosos
- Declarar escopo EXPLICITO antes de executar: lista de arquivos por agent
- Se dois agents precisam do mesmo arquivo → serializar, NAO paralelizar
- Sintoma: agent sobrescreve mudancas do outro, diff mostra regressoes inexplicaveis

## Race Conditions em Arquivos Compartilhados
- `package.json` → READ-ONLY durante execucao paralela
- `tsconfig.json` → READ-ONLY durante execucao paralela
- `package-lock.json` → NUNCA rodar `npm install` em paralelo (corrompe lockfile)
- `.env` / `.env.local` → um agent por vez, nunca paralelo
- Se agent precisa modificar shared file → reportar ao coordinator, aguardar turno

## Worktree Cleanup
- `TeamDelete` IMEDIATO apos teammates terminarem — libera memoria
- Panes do tmux mantidos abertos = processos vivos consumindo RAM
- Verificar `tmux ls` antes de spawnar novos agents — fechar sessoes orfas
- iTerm2 scrollback max 10.000 linhas (Settings → Profiles → Terminal)
- Usar `tmux kill-session -t nome` para limpar sessoes travadas

## Orquestracao
- Preferir sequencial (ag-23) quando < 6 tasks — overhead de paralelismo nao compensa
- Flat hierarchy: teammates NAO devem ter subagents proprios (evitar nesting)
- Coordinator deve verificar overlap de escopo ANTES de dispatch
- Limite pratico: max 8 arquivos por agent — mais que isso, dividir em sub-tasks

## Git em Paralelo
- Cada agent DEVE trabalhar em branch separada ou worktree isolado
- NUNCA dois agents fazendo commit na mesma branch — historico fica inconsistente
- `git add -A` em agent paralelo → commita mudancas de outro agent (usar `git add arquivo`)
- Merge conflicts: coordinator resolve APOS todos agents terminarem, nunca durante
- `git stash` bloqueado por hooks — se agent precisa trocar contexto, commit WIP primeiro

## Limites de Recursos — Tabela Rapida

| Cenario | Sessoes | Teammates/sessao | RAM estimada |
|---------|---------|-------------------|-------------|
| Conservador | 2 | 2 | ~16GB |
| Normal | 3 | 3 | ~27GB |
| Agressivo | 4 | 3 | ~36GB |
| NUNCA exceder | 4 | 4 | ~40GB+ |

## Anti-Patterns Comuns
- Spawnar 5 agents para 3 tasks → overhead > beneficio
- Dois agents rodando `npm test` simultaneamente → port conflicts, flaky results
- Agent fazendo exploracao (grep/read) em context principal → usar subagent
- Esquecer TeamDelete → sessoes acumulam, swap ativa, tudo desacelera
- `git add -A` em agent paralelo → commita mudancas de outro agent

## Diagnostico Rapido
```bash
# Memoria atual
memory_pressure

# Sessoes tmux ativas
tmux ls

# Processos Claude consumindo recursos
ps aux | grep -i claude | grep -v grep

# Worktrees orfas
git worktree list
```
