# 06 — Referencia Completa de Hooks

> 4 hooks automaticos que verificam qualidade, salvam estado e previnem erros.

---

## Como Hooks Funcionam

Hooks sao scripts que rodam automaticamente em momentos especificos:

| Evento | Quando Roda | Exemplo |
|--------|-------------|---------|
| **PreToolUse** | Antes de cada uso de ferramenta | Verificar saude do ambiente |
| **PostToolUse** | Apos cada uso de ferramenta | Lembrar de salvar estado |
| **Stop** | Quando sessao termina | Verificar se estado foi salvo |

Hooks sao configurados em `.claude/hooks.json`.

---

## Configuracao: hooks.json

Crie `.claude/hooks.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/preflight-check.sh 2>/dev/null || true"
          }
        ]
      }
    ]
  }
}
```

### Configuracao Expandida (Opcional)

Se quiser todos os hooks:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/preflight-check.sh 2>/dev/null || true"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/post-edit-check.sh 2>/dev/null || true"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/quality-check.sh 2>/dev/null || true"
          }
        ]
      }
    ]
  }
}
```

---

## Hook 1: preflight-check.sh

Health check na sessao. Roda UMA vez por sessao no primeiro uso do Bash.

Crie `.claude/hooks/preflight-check.sh`:

```bash
#!/usr/bin/env bash
# =============================================================================
# preflight-check.sh — Lightweight health check for Claude Code hooks
# Called by hooks.json on first PreToolUse. Uses flag file to run only once.
# Output goes to stderr (Claude sees it as hook context).
# =============================================================================

# Only run once per session (check parent PID-based flag)
PPID_FLAG="/tmp/.raiz-preflight-$(ps -o ppid= $$ 2>/dev/null | tr -d ' ' || echo 'unknown')"
if [ -f "$PPID_FLAG" ]; then
  exit 0
fi
touch "$PPID_FLAG" 2>/dev/null || true

WARNINGS=""

# Check Node version (customize version as needed)
if command -v node &>/dev/null; then
  NODE_VER=$(node --version 2>/dev/null)
  if [[ ! "$NODE_VER" == v20.* ]]; then
    WARNINGS="${WARNINGS}Node version $NODE_VER (expected v20.x). "
  fi
fi

# Check concurrent Claude processes (Windows)
if command -v tasklist &>/dev/null; then
  CLAUDE_COUNT=$(tasklist 2>/dev/null | grep -ic "claude" || true)
  if [ "$CLAUDE_COUNT" -gt 3 ]; then
    WARNINGS="${WARNINGS}${CLAUDE_COUNT} Claude processes detected — risk of config corruption. "
  fi
fi

# Check .next/trace lock (Next.js projects)
if [ -f ".next/trace" ]; then
  WARNINGS="${WARNINGS}.next/trace exists (potential lock). "
fi

# Check NODE_OPTIONS for OOM prevention (Node.js projects)
if [ -z "${NODE_OPTIONS:-}" ]; then
  WARNINGS="${WARNINGS}NODE_OPTIONS not set (OOM risk on builds). "
fi

# Output warnings if any
if [ -n "$WARNINGS" ]; then
  echo "hook additional context: [PREFLIGHT] $WARNINGS"
fi

exit 0
```

### Customizacao

Adapte os checks para sua stack:

- **Python**: verificar versao do Python, virtualenv ativo
- **Go**: verificar GOPATH, go version
- **Rust**: verificar cargo, rustc version
- **Docker**: verificar se Docker daemon esta rodando

---

## Hook 2: post-edit-check.sh

Lembrete para salvar estado a cada N edicoes.

Crie `.claude/hooks/post-edit-check.sh`:

```bash
#!/bin/bash
# PostToolUse: lembretes a cada 5 e 10 edicoes

COUNTER_FILE="/tmp/claude-edit-counter-$$"
COUNT=1
[ -f "$COUNTER_FILE" ] && COUNT=$(($(cat "$COUNTER_FILE") + 1))
echo "$COUNT" > "$COUNTER_FILE"

[ $((COUNT % 5)) -eq 0 ] && echo "$COUNT edicoes. Atualize session-state.json." >&2
[ $((COUNT % 10)) -eq 0 ] && echo "$COUNT edicoes. Re-leia task_plan.md." >&2
exit 0
```

---

## Hook 3: pre-commit-check.sh

Roda testes relacionados aos arquivos staged.

Crie `.claude/hooks/pre-commit-check.sh`:

```bash
#!/bin/bash
# PreToolUse: run only related tests for changed files

if [ -f "package.json" ]; then
  HAS_TEST=$(node -e "const p=require('./package.json'); console.log(p.scripts&&p.scripts.test?'yes':'no')" 2>/dev/null)
  if [ "$HAS_TEST" = "yes" ]; then
    # Get staged files (ts/tsx only — customize for your stack)
    STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR -- '*.ts' '*.tsx' 2>/dev/null | tr '\n' ' ')

    if [ -z "$STAGED_FILES" ]; then
      exit 0
    fi

    # Run only tests related to changed files
    npx jest --bail --findRelatedTests --passWithNoTests --maxWorkers=50% $STAGED_FILES 2>/dev/null
    [ $? -ne 0 ] && echo "BLOQUEADO: Testes relacionados falhando." >&2 && exit 2
  fi
elif [ -f "pytest.ini" ] || [ -f "pyproject.toml" ]; then
  python -m pytest --quiet 2>/dev/null
  [ $? -ne 0 ] && echo "BLOQUEADO: Testes falhando." >&2 && exit 2
fi
exit 0
```

### Customizacao

- **Python**: ja suporta pytest
- **Go**: adicione `go test ./...`
- **Rust**: adicione `cargo test`
- **Java**: adicione `mvn test` ou `gradle test`

---

## Hook 4: quality-check.sh

Verificacao ao final da sessao.

Crie `.claude/hooks/quality-check.sh`:

```bash
#!/bin/bash
# Stop hook: verifica se estado foi salvo e busca TODOs

STATE_FILE="docs/ai-state/session-state.json"
if [ -f "$STATE_FILE" ]; then
  # Check if state file was updated recently (within 5 minutes)
  if command -v stat &>/dev/null; then
    LAST_MODIFIED=$(stat -c %Y "$STATE_FILE" 2>/dev/null || stat -f %m "$STATE_FILE" 2>/dev/null)
    NOW=$(date +%s)
    DIFF=$((NOW - LAST_MODIFIED))
    if [ $DIFF -gt 300 ]; then
      echo "session-state.json nao atualizado ha $((DIFF/60))min. Atualize." >&2
    fi
  fi
else
  echo "session-state.json nao existe. Crie para persistir estado." >&2
fi

# Check for TODOs in modified files
MODIFIED=$(git diff --name-only HEAD 2>/dev/null)
if [ -n "$MODIFIED" ]; then
  TODOS=$(echo "$MODIFIED" | xargs grep -l "TODO\|FIXME\|HACK" 2>/dev/null)
  if [ -n "$TODOS" ]; then
    echo "TODOs/FIXMEs em arquivos modificados:" >&2
    echo "$TODOS" >&2
  fi
fi
exit 0
```

---

## Tornando Hooks Executaveis

```bash
chmod +x .claude/hooks/preflight-check.sh
chmod +x .claude/hooks/post-edit-check.sh
chmod +x .claude/hooks/pre-commit-check.sh
chmod +x .claude/hooks/quality-check.sh
```

---

## Troubleshooting

| Problema | Solucao |
|----------|---------|
| Hook nao executa | Verificar chmod +x e que hooks.json esta correto |
| Hook quebra a sessao | Adicionar `2>/dev/null || true` ao final do command |
| Hook muito lento | Mover logica pesada para background ou reduzir frequencia |
| Windows: bash nao encontrado | Usar Git Bash ou WSL |
| Matcher nao funciona | Verificar que o nome da tool esta correto (Bash, Edit, Write) |
