#!/usr/bin/env bash
# stop-consolidate.sh — Stop hook: auto-consolidacao silenciosa de sessao
#
# Roda apos cada sessao (Stop event). Se >= 3 machines foram invocadas,
# executa ag-destilar --silent para capturar aprendizados automaticamente.
#
# Inspirado em Ruflo SessionEnd hook — mas sem sobrescrita silenciosa:
# apenas APPENDA em feedback_*.md. Nunca bloqueia (exit 0 sempre).
#
# Design (P0 da analise Ruflo vs ag-*):
#   Ruflo tem SessionEnd hook que consolida automaticamente.
#   ag-* tinha apenas session-retro-check.sh (deteccao sem acao).
#   Este script FAZ a acao silenciosa para sessoes significativas.
#
# Bypass: STOP_CONSOLIDATE_DISABLED=1

set -euo pipefail

# Nunca bloquear — este hook e advisory
trap 'exit 0' ERR

[[ "${STOP_CONSOLIDATE_DISABLED:-}" == "1" ]] && exit 0

CLAUDE_HOME="$HOME/.claude"
PROJECTS_DIR="$CLAUDE_HOME/projects"
MEMORY_DIR="$CLAUDE_HOME/projects/-Users-andregusmandeoliveira-Claude/memory"
STATE_FILE="$HOME/Claude/docs/ai-state/stop-consolidate-state.json"

# Detectar sessao atual
LATEST_SESSION=""
if [[ -d "$PROJECTS_DIR" ]]; then
  LATEST_SESSION=$(find "$PROJECTS_DIR" -name "*.jsonl" -type f -newer "$STATE_FILE" 2>/dev/null | \
    xargs ls -t 2>/dev/null | head -1 || true)
fi

# Se nao encontrou sessao nova desde ultimo run, sair
[[ -z "$LATEST_SESSION" ]] && exit 0

# Contar machines invocadas na sessao
MACHINE_COUNT=0
if [[ -f "$LATEST_SESSION" ]]; then
  MACHINE_COUNT=$(grep -cE '"name":\s*"ag-[0-9]+-' "$LATEST_SESSION" 2>/dev/null || echo "0")
fi

# Contar PRs criados na sessao
PR_COUNT=0
if [[ -f "$LATEST_SESSION" ]]; then
  PR_COUNT=$(grep -c '"gh pr create"' "$LATEST_SESSION" 2>/dev/null || echo "0")
fi

# Limiar: >= 3 machines OU >= 2 PRs
SHOULD_CONSOLIDATE=0
REASON=""
if [[ "$MACHINE_COUNT" -ge 3 ]]; then
  SHOULD_CONSOLIDATE=1
  REASON="${MACHINE_COUNT} machines invocadas"
fi
if [[ "$PR_COUNT" -ge 2 ]]; then
  SHOULD_CONSOLIDATE=1
  REASON="${REASON:+${REASON}, }${PR_COUNT} PRs criados"
fi

# Atualizar state file (criar se nao existe)
mkdir -p "$(dirname "$STATE_FILE")"
python3 - <<PYEOF 2>/dev/null || true
import json, os, datetime

state_file = "$STATE_FILE"
try:
    with open(state_file) as f:
        state = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    state = {"runs": [], "last_consolidation": None}

state["runs"].append({
    "ts": datetime.datetime.utcnow().isoformat() + "Z",
    "session": "$LATEST_SESSION",
    "machine_count": $MACHINE_COUNT,
    "pr_count": $PR_COUNT,
    "consolidated": bool($SHOULD_CONSOLIDATE),
    "reason": "$REASON"
})

# Manter apenas ultimas 50 runs
state["runs"] = state["runs"][-50:]

if $SHOULD_CONSOLIDATE:
    state["last_consolidation"] = datetime.datetime.utcnow().isoformat() + "Z"

os.makedirs(os.path.dirname(state_file), exist_ok=True)
with open(state_file, "w") as f:
    json.dump(state, f, indent=2)
PYEOF

[[ "$SHOULD_CONSOLIDATE" -eq 0 ]] && exit 0

# Sessao significativa — gerar resumo compacto em memory
MEMORY_FILE="$MEMORY_DIR/session-auto-$(date +%Y-%m-%d).md"
mkdir -p "$MEMORY_DIR"

python3 - <<PYEOF 2>/dev/null || true
import json, datetime, os

session_path = "$LATEST_SESSION"
memory_file = "$MEMORY_FILE"
machine_count = $MACHINE_COUNT
pr_count = $PR_COUNT
reason = "$REASON"

# Extrair resumo basico da sessao
machines_used = set()
files_edited = []
bash_commands = []

try:
    with open(session_path) as f:
        for line in f:
            try:
                msg = json.loads(line)
                if msg.get("type") == "assistant":
                    content = msg.get("message", {}).get("content", [])
                    if not isinstance(content, list):
                        continue
                    for c in content:
                        if not isinstance(c, dict):
                            continue
                        if c.get("type") == "tool_use":
                            name = c.get("name", "")
                            inp = c.get("input", {}) or {}
                            if "ag-" in str(inp.get("skill", "")):
                                machines_used.add(inp.get("skill", ""))
                            if name in ("Edit", "Write"):
                                fp = inp.get("file_path", "")
                                if fp and fp not in files_edited:
                                    files_edited.append(fp)
                            elif name == "Bash":
                                cmd = inp.get("command", "")[:100]
                                if cmd and "git" in cmd:
                                    bash_commands.append(cmd)
            except (json.JSONDecodeError, KeyError):
                continue
except (OSError, IOError):
    pass

# Gerar entry no memory file
ts = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
entry = f"""
## Auto-consolidado em {ts}
**Gatilho**: {reason}
**Machines**: {machine_count} invocadas{f" ({', '.join(list(machines_used)[:5])})" if machines_used else ""}
**PRs**: {pr_count}
**Arquivos editados**: {len(files_edited)}{f" (ex: {', '.join(files_edited[:3])})" if files_edited else ""}

> Consolidacao automatica via stop-consolidate.sh — revisar com /ag-retrospectiva para detalhes.
"""

# Append no arquivo de memoria diario
os.makedirs(os.path.dirname(memory_file), exist_ok=True)
with open(memory_file, "a") as f:
    if os.path.getsize(memory_file) == 0:
        f.write(f"# Auto-consolidacoes — {datetime.date.today()}\n")
    f.write(entry)
PYEOF

exit 0
