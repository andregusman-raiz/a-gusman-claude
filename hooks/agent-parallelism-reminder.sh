#!/bin/bash
# agent-parallelism-reminder.sh — a cada >=20min injeta lembrete para manter o fan-out de agents no teto de 5.
# Registrado em UserPromptSubmit (dispara em prompts do usuário E em task-notifications de background,
# que também passam pelo evento) — o gate de tempo garante no máximo 1 nudge a cada 20min por sessão.
# O hook NÃO conta agents (o modelo conhece seus próprios spawns e tem ListAgents); ele só dá a cadência.
# Desligar: AGENT_PARALLELISM_NUDGE_DISABLED=1 ou remover do settings.local.json.

[ -n "$AGENT_PARALLELISM_NUDGE_DISABLED" ] && exit 0

INPUT=$(cat)
SID=$(printf '%s' "$INPUT" | jq -r '.session_id // "global"' 2>/dev/null || echo global)
STATE_DIR="$HOME/.claude/state"
mkdir -p "$STATE_DIR"
STATE="$STATE_DIR/agent-parallelism-nudge-${SID}"
GATE_SECONDS=1200

now=$(date +%s)
last=$(cat "$STATE" 2>/dev/null || echo 0)
case "$last" in (*[!0-9]*|'') last=0;; esac
[ $((now - last)) -lt "$GATE_SECONDS" ] && exit 0
echo "$now" > "$STATE"

cat <<'JSON'
{"suppressOutput": true, "hookSpecificOutput": {"hookEventName": "UserPromptSubmit", "additionalContext": "[parallelism-check 20min] Cheque seu fan-out AGORA: conte os agents/builders ATIVOS desta sessão (seus spawns ainda rodando; confirme com ListAgents se precisar). Se houver MENOS de 5 ativos E existir na fila do trabalho atual tarefa paralelizável SEM conflito de arquivos, spawne novos agents até o teto de 5 (escrita no mesmo repo = worktree próprio; conferir memory_pressure antes de subir). Se já estiver no teto ou nada for paralelizável com segurança, siga sem ação e registre em 1 linha o porquê."}}
JSON
