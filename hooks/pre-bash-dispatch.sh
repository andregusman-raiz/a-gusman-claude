#!/bin/bash
# pre-bash-dispatch.sh — PreToolUse(Bash): le o payload UMA vez e roda os guards em cadeia.
# Um unico spawn por tool call em vez de 3. Primeiro exit != 0 vence.
# Guards: bash-guards.sh (destrutivos+branch+SQL), stack-deny-list.sh, new-project-guard.sh
# Bypass individual: BASH_GUARDS_DISABLED=1 | STACK_GUARD_BYPASS=1
#
# F0b (SPEC-metodologia-cockpit-2026-08-28.md §7.3 item 5): cada guard que
# passa por aqui e registrado em ~/.claude/state/hooks.log (`ts · hook ·
# papel · rc · alvo`) -- "log de disparo num lugar so" em vez de cada guard
# inventar (ou nao ter) o proprio registro.

set -uo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PAYLOAD="$(cat)"

HOOKS_LOG="${HOOKS_LOG_PATH:-$HOME/.claude/state/hooks.log}"
REGISTRY="${PRE_BASH_DISPATCH_REGISTRY_PATH:-$HOME/Claude/docs/ai-state/terminais/registry.json}"

log_hook() {
  # log_hook <hook> <rc> <alvo>
  local hook="$1" rc="$2" alvo="$3"
  local ts papel
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  papel="$(REGISTRY="$REGISTRY" python3 - <<'PYEOF' 2>/dev/null
import json, os
ws = os.environ.get("CMUX_WORKSPACE_ID") or ""
if not ws:
    print("sem-cmux")
    raise SystemExit(0)
try:
    with open(os.environ["REGISTRY"]) as f:
        reg = json.load(f)
    for papel, e in (reg.get("terminais") or {}).items():
        if e.get("workspace_uuid") == ws:
            print(papel)
            raise SystemExit(0)
except SystemExit:
    raise
except Exception:
    pass
print(f"nao-registrado:{ws[:8]}")
PYEOF
)"
  [ -z "$papel" ] && papel="desconhecido"
  mkdir -p "$(dirname "$HOOKS_LOG")" 2>/dev/null
  printf '%s · %s · %s · %s · %s\n' "$ts" "$hook" "$papel" "$rc" "$alvo" >> "$HOOKS_LOG" 2>/dev/null
}

ALVO="$(printf '%s' "$PAYLOAD" | python3 -c 'import json,sys
try:
    print((json.load(sys.stdin).get("tool_input") or {}).get("command","")[:80])
except Exception:
    print("")' 2>/dev/null)"

for guard in bash-guards.sh stack-deny-list.sh new-project-guard.sh; do
  printf '%s' "$PAYLOAD" | bash "$DIR/$guard"
  rc=$?
  log_hook "$guard" "$rc" "$ALVO"
  [ $rc -ne 0 ] && exit $rc
done
exit 0
