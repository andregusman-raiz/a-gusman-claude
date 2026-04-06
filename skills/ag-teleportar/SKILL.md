---
name: ag-teleportar
description: "Switch rapido entre projetos no workspace com contexto preservado. Carrega CLAUDE.md, detecta stack, verifica .env, mostra branch atual, e resume estado. Nao e cd — e context-aware switching."
model: haiku
allowed-tools: Read, Glob, Grep, Bash
argument-hint: "[nome-do-projeto | path | --list (listar projetos)]"
disable-model-invocation: true
---

# ag-teleportar — Context-Aware Project Switching

Spawn the `ag-teleportar` agent for intelligent project switching with context preservation.

## Diferenca vs `cd`

| | `cd ~/Claude/GitHub/projeto` | ag-teleportar projeto |
|---|---|---|
| Muda diretorio | Sim | Sim |
| Carrega CLAUDE.md | Nao | Sim |
| Detecta stack | Nao | Sim |
| Verifica .env | Nao | Sim |
| Mostra branch/status | Nao | Sim |
| Resume estado | Nao | Sim |

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `general-purpose`
- `model`: `haiku`
- `mode`: `auto`
- `run_in_background`: `false`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Modo: [nome-do-projeto | path | --list]

Voce e o agente de teleporte. Faz switch inteligente entre projetos.

## Para --list

Listar todos os projetos conhecidos:

```bash
# Projetos em GitHub/
for dir in ~/Claude/GitHub/*/; do
  if [ -d "$dir/.git" ]; then
    name=$(basename "$dir")
    branch=$(cd "$dir" && git branch --show-current 2>/dev/null || echo "?")
    status=$(cd "$dir" && git status --short 2>/dev/null | wc -l | tr -d ' ')
    echo "- $name (branch: $branch, changes: $status)"
  fi
done

# Projetos em projetos/
for dir in ~/Claude/projetos/*/; do
  name=$(basename "$dir")
  echo "- $name (projetos/)"
done
```

Incluir portas conhecidas da tabela do CLAUDE.md:
| Porta | Projeto |
|-------|---------|
| 3000 | raiz-platform |
| 3001 | profdigital |
| 3002 | automata |
| 3003 | totvs-educacional-frontend |
| 3004 | sophia-educacional-frontend |
| 3005 | fgts-platform |
| 4200 | raiz-agent-dashboard |

## Para nome-do-projeto ou path

### 1. Resolver path
Procurar em ordem:
1. ~/Claude/GitHub/[nome]/
2. ~/Claude/projetos/[nome]/
3. Path absoluto (se fornecido)
4. Fuzzy match no nome (se nao encontrar exato)

### 2. Context Snapshot (estado atual antes de sair)
Salvar estado do projeto ATUAL antes de trocar:
```bash
echo "## Context Snapshot — $(basename $PWD) — $(date)" >> /tmp/teleport-context.md
echo "Branch: $(git branch --show-current 2>/dev/null)" >> /tmp/teleport-context.md
echo "Changes: $(git status --short 2>/dev/null | wc -l)" >> /tmp/teleport-context.md
echo "Last commit: $(git log --oneline -1 2>/dev/null)" >> /tmp/teleport-context.md
```

### 3. Switch
```bash
cd [resolved-path]
```

### 4. Context Load (carregar contexto do destino)
Executar e reportar:

```bash
# Git status
echo "=== Branch ==="
git branch --show-current 2>/dev/null
echo "=== Status ==="
git status --short 2>/dev/null
echo "=== Last 3 commits ==="
git log --oneline -3 2>/dev/null

# Stack detection
echo "=== Stack ==="
[ -f package.json ] && echo "Node: $(node -v 2>/dev/null)"
[ -f bun.lock ] && echo "PM: bun" || ([ -f package-lock.json ] && echo "PM: npm")
[ -f next.config.* ] && echo "Framework: Next.js"
[ -f vite.config.* ] && echo "Framework: Vite"

# Env check
echo "=== Env ==="
[ -f .env ] && echo ".env exists ($(wc -l < .env) vars)" || echo ".env MISSING"
[ -f .env.local ] && echo ".env.local exists" || echo ".env.local missing"

# Dev server check
echo "=== Dev Server ==="
lsof -i :3000 -i :3001 -i :3002 -i :3003 -i :3004 -i :3005 -i :4200 2>/dev/null | grep LISTEN

# CLAUDE.md
echo "=== Project Instructions ==="
[ -f CLAUDE.md ] && echo "CLAUDE.md exists ($(wc -l < CLAUDE.md) lines)" || echo "No CLAUDE.md"
```

### 5. Resumo
Reportar ao usuario em formato conciso:

```
Teleportado para: [projeto]
Path: [path]
Branch: [branch] (N changes pendentes)
Stack: [Next.js | Vite | ...] + [bun | npm]
Env: [OK | MISSING .env]
Dev server: [rodando em :PORT | parado]
CLAUDE.md: [sim (N linhas) | nao]
```

## Regras
- NAO modificar nada no projeto destino
- NAO rodar npm install ou bun install automaticamente
- Se .env missing → AVISAR mas NAO criar
- Se dev server ja rodando → informar a porta
- Snapshot do projeto anterior e salvo em /tmp/teleport-context.md
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- Run in FOREGROUND — user needs the context output immediately
- Uses haiku model (fast, just data collection)
- Does NOT modify anything — pure context loading
- Fuzzy matching: "raiz" matches "raiz-platform", "fgts" matches "fgts-platform"
