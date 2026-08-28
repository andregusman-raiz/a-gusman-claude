#!/usr/bin/env bash
# auto-context-update.sh
# Stop hook: gera/atualiza .claude/AUTO_CONTEXT.md no projeto onde a sessao rodou.
# Conteudo: ultimas 10 sessoes (timestamp, tool_calls, transcript hash),
#           git status, ultimos 5 commits, branches abertas.
#
# Inspirado em claude-mem (auto-update folder-level CLAUDE.md), mas SEM Agent SDK
# (custo zero de tokens — pura inspecao de filesystem + git).
#
# Idempotente. Trunca para max 10 sessoes (rolling).

set -uo pipefail
trap 'printf "{}\n"' EXIT

# Read hook payload from stdin
PAYLOAD=$(cat 2>/dev/null || echo "{}")

SESSION_ID=$(echo "$PAYLOAD" | jq -r '.session_id // "unknown"' 2>/dev/null || echo "unknown")
CWD=$(echo "$PAYLOAD" | jq -r '.cwd // empty' 2>/dev/null || pwd)
TRANSCRIPT=$(echo "$PAYLOAD" | jq -r '.transcript_path // empty' 2>/dev/null || echo "")

# Resolver PROJECT_ROOT
PROJECT_ROOT="$(git -C "$CWD" rev-parse --show-toplevel 2>/dev/null || echo "")"
[ -z "$PROJECT_ROOT" ] && exit 0
[ "$PROJECT_ROOT" = "$HOME/Claude" ] && exit 0

# Tool count
TOOL_COUNT=0
if [[ -n "$TRANSCRIPT" && -f "$TRANSCRIPT" ]]; then
  TOOL_COUNT=$(grep -c '"type":"tool_use"' "$TRANSCRIPT" 2>/dev/null) || TOOL_COUNT=0
fi
# Skip trivial sessions (mesmo threshold do session-log)
[ "$TOOL_COUNT" -lt 4 ] && exit 0

CONTEXT_DIR="$PROJECT_ROOT/.claude"
CONTEXT_FILE="$CONTEXT_DIR/AUTO_CONTEXT.md"
mkdir -p "$CONTEXT_DIR"

NOW="$(date '+%Y-%m-%d %H:%M')"
PROJECT_NAME="$(basename "$PROJECT_ROOT")"

# Git info
BRANCH="$(git -C "$PROJECT_ROOT" branch --show-current 2>/dev/null || echo '?')"
DIRTY_COUNT="$(git -C "$PROJECT_ROOT" status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
AHEAD_BEHIND="$(git -C "$PROJECT_ROOT" rev-list --left-right --count HEAD...@{u} 2>/dev/null || echo '? ?')"
RECENT_COMMITS="$(git -C "$PROJECT_ROOT" log -5 --format='- `%h` %s _(%ar)_' 2>/dev/null || echo '_(no commits)_')"
LOCAL_BRANCHES="$(git -C "$PROJECT_ROOT" for-each-ref --sort=-committerdate --count=8 --format='- `%(refname:short)` _(%(committerdate:relative))_' refs/heads/ 2>/dev/null | head -8)"

# Sessoes anteriores: extrair do AUTO_CONTEXT existente (manter ate 9, adicionar 1 nova = 10)
PREVIOUS_SESSIONS=""
if [ -f "$CONTEXT_FILE" ]; then
  # Linhas dentro do bloco <!-- SESSIONS:START --> e <!-- SESSIONS:END -->
  PREVIOUS_SESSIONS="$(awk '/<!-- SESSIONS:START -->/{flag=1;next} /<!-- SESSIONS:END -->/{flag=0} flag' "$CONTEXT_FILE" | head -9)"
fi

# Truncar transcript path para hash curto
TRANSCRIPT_HINT=""
if [ -n "$TRANSCRIPT" ]; then
  TRANSCRIPT_HINT="$(basename "$TRANSCRIPT" | cut -c1-12)..."
fi

# Construir nova linha de sessao
NEW_SESSION_LINE="- **$NOW** — \`$SESSION_ID\` — ${TOOL_COUNT} tool calls — branch \`$BRANCH\` — transcript \`$TRANSCRIPT_HINT\`"

# Gerar arquivo (sobrescreve)
cat > "$CONTEXT_FILE" <<EOF
---
type: auto-context
project: $PROJECT_NAME
generated: $NOW
generator: ~/.claude/scripts/auto-context-update.sh (Stop hook)
note: NAO editar manualmente — regenerado a cada sessao com 4+ tool calls.
---

# AUTO_CONTEXT — $PROJECT_NAME

> Snapshot automatico do estado do projeto. Lido pelo SessionStart hook quando voce abre Claude Code aqui.
> Para info estavel/manual, edite \`CLAUDE.md\` (este arquivo nunca toca CLAUDE.md).

## Estado atual

- **Branch**: \`$BRANCH\`
- **Working tree**: $DIRTY_COUNT arquivo(s) com mudancas
- **Vs upstream**: $AHEAD_BEHIND (ahead behind)

## Ultimos commits

$RECENT_COMMITS

## Branches locais ativas

$LOCAL_BRANCHES

## Ultimas sessoes (rolling 10)

<!-- SESSIONS:START -->
$NEW_SESSION_LINE
$PREVIOUS_SESSIONS
<!-- SESSIONS:END -->
EOF

exit 0
