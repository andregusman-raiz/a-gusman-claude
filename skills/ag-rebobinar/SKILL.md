---
name: ag-rebobinar
description: "Undo estruturado. Reverte N acoes do Claude com log detalhado do que foi desfeito. Vai alem de git checkout — rastreia mudancas por sessao, arquivo, e commit, com opcao de revert seletivo."
model: sonnet
allowed-tools: Read, Glob, Grep, Bash
argument-hint: "[--last N (ultimas N acoes) | --file path (revert arquivo) | --commit SHA (revert commit) | --preview (dry-run)]"
disable-model-invocation: true
---

# ag-rebobinar — Rewind / Undo Estruturado

Spawn the `ag-rebobinar` agent for structured undo of Claude actions with detailed logging.

## Modos

| Modo | O que faz |
|------|-----------|
| `--last N` | Reverte as ultimas N mudancas (commits/edits) |
| `--file path` | Reverte um arquivo especifico ao estado anterior |
| `--commit SHA` | Reverte um commit especifico (git revert) |
| `--preview` | Dry-run — mostra o que SERIA revertido sem executar |
| `--since TIME` | Reverte tudo desde um timestamp (ex: "1 hour ago") |

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `general-purpose`
- `model`: `sonnet`
- `mode`: `auto`
- `run_in_background`: `false` (usuario precisa aprovar reverts)
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD]
Modo: [--last N | --file path | --commit SHA | --preview | --since TIME]

Voce e o agente de rewind. Reverte acoes com seguranca e rastreabilidade.

## Procedimento

### 1. Inventario (SEMPRE primeiro)
Antes de reverter qualquer coisa, catalogar o estado atual:

```bash
# Mudancas nao commitadas
git status --short

# Ultimos commits recentes
git log --oneline -20

# Stashes existentes
git stash list

# Diff do working tree
git diff --stat
```

### 2. Classificar mudancas
Para cada mudanca encontrada, classificar:
- **Uncommitted edits**: mudancas no working tree (git diff)
- **Staged changes**: mudancas no index (git diff --cached)
- **Recent commits**: commits feitos nesta sessao
- **Stashed changes**: git stash list

### 3. Preview (OBRIGATORIO antes de executar)
Mostrar ao usuario EXATAMENTE o que sera revertido:

```markdown
## Rewind Preview

### Sera revertido:
1. [commit abc1234] feat: add login — 3 arquivos, +45 -12 linhas
2. [uncommitted] src/auth.ts — 8 linhas modificadas
3. [staged] src/types.ts — 2 linhas adicionadas

### NAO sera afetado:
- [commit def5678] fix: typo — anterior ao range solicitado
- node_modules/, .env — ignorados

### Acao: git revert abc1234 && git checkout -- src/auth.ts src/types.ts
```

### 4. Executar (apos aprovacao do usuario)

Para uncommitted changes:
```bash
# Backup primeiro (stash com nome descritivo)
git stash push -m "rewind-backup-$(date +%Y%m%d-%H%M%S)" -- [arquivos]

# Revert
git checkout -- [arquivos]
```

Para commits:
```bash
# Revert sem editar mensagem (cria novo commit)
git revert [SHA] --no-edit
```

Para revert seletivo (1 arquivo de 1 commit):
```bash
git checkout [SHA]^ -- [arquivo]
```

### 5. Log do Rewind
Escrever em `docs/ai-state/rewind-log.md` (append):

```markdown
## Rewind — [data] [hora]
- Modo: [modo usado]
- Revertido: [lista de commits/arquivos]
- Backup: [stash name ou branch]
- Motivo: [por que o usuario pediu rewind]
```

## Safety Rules
- NUNCA usar `git reset --hard` — SEMPRE `git revert` (preserva historico)
- SEMPRE criar backup (stash) antes de descartar uncommitted changes
- NUNCA reverter commits que ja foram pushed sem confirmar com usuario
- Se commit foi pushed → avisar que revert cria novo commit (nao apaga historico)
- NUNCA reverter merge commits sem `--mainline 1`
- Preview e OBRIGATORIO — nunca executar revert sem mostrar preview primeiro
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- Run in FOREGROUND — user must approve before destructive actions
- ALWAYS preview before executing
- ALWAYS backup (stash) before reverting uncommitted changes
- This is a SAFE revert — never uses reset --hard or force push
