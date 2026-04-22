# Agent Parallel Safety — Unified Rules (ADR-0001)

> **Unifica:** `agent-boundaries.md` + `multi-agent-isolation.md` em uma única rule canonical.
> **Nasce de:** incidente 2026-04-07 (3 corrupções de branch state + 23 stashes acumulados no `raiz-data-engine` por multiple sessions Claude).

---

## Princípio fundamental

**Dois processos Claude NUNCA devem escrever no mesmo working tree ao mesmo tempo.** Git state é global — `checkout`, `stash`, `reset` afetam outras sessões mesmo em branches diferentes. Paralelismo de escrita exige **isolation**.

## Regra Zero — Path absoluto obrigatório

Ao spawnar QUALQUER agent (especialmente cross-repo), SEMPRE incluir **path absoluto** do repo-alvo no prompt. Agents herdam CWD da sessão pai (que pode ser outro repo).

```
✓ CORRETO: "Trabalhe no repo em ~/Claude/GitHub/raiz-platform/"
✗ ERRADO:  "no raiz-platform"
```

---

## Regras inegociáveis (R1-R8)

### R1 — Health check antes de qualquer trabalho em repo git

Antes de spawnar agent ou começar tarefa não-trivial em repo sob `~/Claude/GitHub/` ou `~/Claude/projetos/`:

```bash
bash ~/.claude/scripts/repo-health.sh <repo-path>
```

Se reportar:
- **stash count > 3** → PAUSAR + triagem de stash
- **working tree dirty** → perguntar ao usuário de quem é o WIP, NÃO começar
- **branches locais sem upstream > 5** → limpar com `git branch -D` após confirmar merge
- **outro PID Claude ativo** → usar worktree isolation obrigatório

### R2 — Worktree isolation para paralelismo de escrita

Se 2+ agents tocam o mesmo repo simultaneamente:

- **Opção A (preferida):** `isolation: "worktree"` no Agent tool — cada um ganha working tree próprio
- **Opção B:** rodar sequencial — perde paralelismo mas zero risco
- **Proibido:** 2 agents sem isolamento no mesmo repo, mesmo em branches diferentes

**Exceção:** agents read-only (Explore) podem rodar paralelos sem worktree, desde que NUNCA criem branches/stashes/editem arquivos.

### R3 — Ownership exclusivo por agent

Cada agent recebe:
- Lista EXPLÍCITA de arquivos que pode modificar
- Lista de arquivos que NÃO pode tocar
- Escopo de commits delimitado

**Sem overlap:** se 2 agents precisam do mesmo arquivo → NÃO paralelizar.

**Arquivos compartilhados (READ-ONLY para agents paralelos):**
- `package.json` / lock files
- `tsconfig.json` / configs de build
- middleware / tipos compartilhados / `.env`

Se agent precisa modificar shared file → reportar ao coordinator.

### R4 — Respeitar stashes e WIP alheio

Nunca executar `git stash drop`, `git stash clear`, `git reset --hard`, `git clean -fd` sem:
1. Listar todos os stashes: `git stash list`
2. Para cada stash, confirmar com usuário se é descartável
3. Backup via `git bundle create /tmp/<repo>-backup-$(date +%s).bundle --all`

Se encontrar arquivos dirty que não são seus:
1. `git stash push -u -m "wip-alheio-<data>"` para preservar
2. Registrar origem no relatório final
3. NUNCA dropar sem confirmação

### R5 — Detectar processos Claude ativos antes de escrever

```bash
pgrep -f "claude.*<repo-name>" | grep -v $$
```

Se retornar algo → outro processo ativo → confirmar com usuário antes.

### R6 — Limites de paralelismo (memory safety)

MacBook Pro M5 36GB RAM:

| Cenário | Sessões | Subagents/sessão | Total |
|---------|---------|------------------|-------|
| Conservador | 2 | 2 | ~16GB |
| Normal | 3 | 3 | ~27GB |
| Agressivo | 4 | 3 | ~36GB |
| **MAX (nunca exceder)** | **5** | **2** | **~35GB** |

**Dentro de cada sessão (Agent Teams):**
- Max 4 teammates simultâneos
- Cada teammate **sem subagents próprios** (flat, não nested)
- `TeamDelete` **IMEDIATO** após teammates terminarem
- Preferir sequencial (ex: `ag-corrigir-bugs`) quando < 6 tasks

**Monitoramento:**
```bash
memory_pressure  # macOS: normal/warn/critical
# Se warn ou critical → NÃO spawnar mais agents
```

### R7 — Ritual de encerramento de sessão

Antes de encerrar sessão que fez commits em repo compartilhado:

1. `git stash list` — contar stashes
2. `git status` — confirmar working tree limpo
3. `git branch --show-current` — confirmar branch esperada
4. Se feature branch: push (ou stash + registro em `docs/ai-state/session-YYYY-MM-DD-<slug>.md`)

### R8 — Enforcement por ag-0-orquestrador

`ag-0-orquestrador` DEVE recusar paralelismo se:
1. Agents modificam código sem `isolation: "worktree"`
2. Overlap de arquivos > 0
3. `memory_pressure` em warn/critical

Ação: "Executando sequencialmente por segurança."

---

## Sinais de violação

- Stash count > 5 em um repo
- Branches `recovery/*`, `wip/*`, `temp/*` acumulando sem PR
- `git reflog` mostra resets/rebases inesperados
- Agent reporta "outro processo modificou a branch"
- Force-push no remote sem autor identificado

Quando qualquer um acontecer: PARAR, rodar `repo-health.sh`, triagem antes de continuar.

---

## Recovery de incidente

Se detectar corrupção em curso:

1. **Backup imediato:** `git bundle create /tmp/<repo>-incident-$(date +%s).bundle --all`
2. **Congelar state:** não rodar mais nada no repo até investigar
3. **Reflog:** `git reflog -30` para reconstruir histórico
4. **Stash list:** `git stash list` para ver o que foi preservado
5. **Issue de tracking:** `wip-recovery: <repo> <data>`
6. **Plano de triagem:** modelo em `~/Claude/docs/diagnosticos/2026-04-07-raiz-data-engine-wip-triage.md` (Fases 1-5)

---

## Anti-patterns

- NUNCA agents sem escopo definido
- NUNCA 2 agents no mesmo arquivo simultaneamente
- NUNCA merge branch sem validation
- NUNCA modificar package.json em paralelo
- NUNCA spawnar agents sem verificar `memory_pressure`
- NUNCA manter Teams vivos após conclusão (TeamDelete obrigatório)
- NUNCA pular R1 (health check) em projetos compartilhados

---

## iTerm2 + tmux (para Agent Teams)

- `teammateMode: "tmux"` ativo — Agent Teams abrem em split panes via `tmux -CC`
- Scrollback: max 10.000 linhas (Settings → Profiles → Terminal)
- Fechar panes/sessões inativas — tmux mantém processos vivos
- `tmux ls` antes de spawnar novos agents
- Prefix `Ctrl+A` (não `Ctrl+B`) — evita conflito com Claude Code

---

## Referências

- Plano original do incidente: `docs/diagnosticos/2026-04-07-raiz-data-engine-wip-triage.md`
- Inventário de stashes: `docs/diagnosticos/wip-inventory-2026-04-07.md`
- Relatório de execução: `docs/diagnosticos/wip-triage-execution-2026-04-07.md`
- Hook de lock: `~/.claude/scripts/repo-lock.sh`
- Script de health check: `~/.claude/scripts/repo-health.sh`
- ADR-0001: `.claude/shared/adr/ADR-0001-consolidacao-pos-opus-47.md`
