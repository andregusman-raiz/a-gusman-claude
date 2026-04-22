# Multi-Agent Isolation — Prevenção de Corrupção em Repos Compartilhados

> Regra nascida do incidente 2026-04-07 no `raiz-data-engine`: 3 corrupções de branch state (rename, reset, force-push) e 23 stashes acumulados por múltiplas sessões Claude escrevendo no mesmo working tree sem isolamento.

---

## Princípio

**Dois processos Claude NUNCA devem escrever no mesmo working tree ao mesmo tempo.** Mesmo que pareça que estão em branches diferentes — `git checkout`, `git stash`, `git reset` afetam estado global do working tree.

---

## Regras inegociáveis

### R1 — Health check antes de qualquer trabalho em repo git
Antes de spawnar agent ou começar tarefa não-trivial em qualquer repo sob `~/Claude/GitHub/` ou `~/Claude/projetos/`:

```bash
bash ~/.claude/scripts/repo-health.sh <repo-path>
```

Se o script reportar:
- **stash count > 3** → PAUSAR. Rodar triagem de stash antes de começar trabalho novo.
- **working tree dirty** → perguntar ao usuário de quem é o WIP. NÃO começar até resolver.
- **branches locais sem upstream > 5** → limpar com `git branch -D` após confirmar que mergearam.
- **outro PID Claude ativo no mesmo repo** → usar worktree isolation obrigatório.

### R2 — Worktree isolation obrigatório para agents paralelos no mesmo repo
Se você precisa rodar 2+ agents que tocam o mesmo repo simultaneamente:

- **Opção A (preferida):** spawnar cada agent com `isolation: "worktree"` no Agent tool. Cada um ganha working tree próprio.
- **Opção B:** rodar sequencial, não paralelo. Perde paralelismo mas evita corrupção.
- **Proibido:** spawnar 2 agents sem isolamento no mesmo repo, mesmo em branches diferentes.

**Exceção:** agents que só leem (Explore, read-only) podem rodar em paralelo sem worktree, desde que nenhum deles crie branches, stashes, ou edite arquivos.

### R3 — Respeitar stashes e WIP alheio
Nunca executar `git stash drop`, `git stash clear`, `git reset --hard`, `git clean -fd` sem:
1. Listar todos os stashes: `git stash list`
2. Para cada stash, confirmar com o usuário se é descartável
3. Fazer backup via `git bundle create /tmp/<repo>-backup-$(date +%s).bundle --all` antes

Se encontrar arquivos dirty no working tree que não são seus:
1. `git stash push -u -m "wip-alheio-<data>"` para preservá-los
2. Registrar a origem no relatório final da sessão
3. NUNCA dropar esses stashes sem confirmação

### R4 — Ritual de encerramento de sessão
Antes de encerrar qualquer sessão que fez commits em repo compartilhado:

1. `git stash list` — contar stashes
2. `git status` — confirmar working tree limpo
3. `git branch --show-current` — confirmar que está na branch esperada
4. Se fez trabalho em feature branch, push (ou stash + registro)
5. Documentar WIP não finalizado em `~/Claude/docs/ai-state/session-YYYY-MM-DD-<slug>.md`

### R5 — Detectar processos Claude ativos antes de escrever
Antes de qualquer escrita em repo git compartilhado:

```bash
pgrep -f "claude.*<repo-name>" | grep -v $$
```

Se retornar algo: outro processo Claude pode estar ativo. Confirmar com usuário antes de prosseguir.

---

## Sinais de que a regra está sendo violada

- Stash count > 5 em um repo
- Branches `recovery/*`, `wip/*`, `temp/*` acumulando sem PR
- `git reflog` mostra resets/rebases inesperados
- Agent reporta "outro processo modificou a branch"
- Force-push no remote sem autor identificado

Quando qualquer um acontecer: PARAR, rodar `repo-health.sh`, triagem de stash antes de continuar.

---

## Recovery de incidente

Se você detectar corrupção em curso:

1. **Backup imediato:** `git bundle create /tmp/<repo>-incident-$(date +%s).bundle --all`
2. **Congelar state:** não rodar mais nada no repo até investigar
3. **Reflog:** `git reflog -30` para reconstruir histórico
4. **Stash list:** `git stash list` para ver o que foi preservado
5. **Abrir issue de tracking:** `wip-recovery: <repo> <data>`
6. **Plano de triagem:** seguir o modelo de `~/Claude/docs/diagnosticos/2026-04-07-raiz-data-engine-wip-triage.md` (Fases 1-5)

---

## Referências

- Plano original do incidente: `docs/diagnosticos/2026-04-07-raiz-data-engine-wip-triage.md`
- Inventário de stashes: `docs/diagnosticos/wip-inventory-2026-04-07.md`
- Relatório de execução: `docs/diagnosticos/wip-triage-execution-2026-04-07.md`
- Hook de lock: `~/.claude/scripts/repo-lock.sh`
- Script de health check: `~/.claude/scripts/repo-health.sh`
