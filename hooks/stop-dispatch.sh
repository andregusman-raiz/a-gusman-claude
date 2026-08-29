#!/bin/bash
# stop-dispatch.sh — Stop: le o payload UMA vez e roda os 4 guards de Stop em
# sequencia, registrando CADA UM em ~/.claude/state/hooks.log.
#
# F0b (SPEC-metodologia-cockpit-2026-08-28.md §7.3 item 5): "log de disparo
# num lugar so". Antes eram 4 entradas SEPARADAS no array "Stop" de
# settings.local.json (gap-acceptance-guard.py, completion-gate.py,
# autonomous-persist-guard.py, papel-stop.sh) sem nenhum registro alem do
# proprio stderr da tool call -- ninguem sabia, depois do fato, quantas vezes
# um guard bloqueou ou passou. Mesmo espirito de pre-bash-dispatch.sh (1
# dispatcher, todos os hooks que passam por ele entram no ratchet de §9.5.3),
# so que aqui os 4 SEMPRE rodam (cada um e uma checagem independente --
# diferente de pre-bash-dispatch.sh, onde o 1o bloqueio ja resolve o
# comando) e o dispatcher devolve o PRIMEIRO codigo != 0 no final, para o
# Stop continuar bloqueando exatamente como bloqueava com as 4 entradas
# separadas.
#
# Bypass individual: os bypass envs de cada guard continuam valendo
# (GAP_GUARD_DISABLED=1, COMPLETION_GATE_DISABLED=1, etc. -- ver cada script).

set -uo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PAYLOAD="$(cat)"

HOOKS_LOG="${HOOKS_LOG_PATH:-$HOME/.claude/state/hooks.log}"
REGISTRY="${STOP_DISPATCH_REGISTRY_PATH:-$HOME/Claude/docs/ai-state/terminais/registry.json}"

log_hook() {
  # log_hook <hook> <rc>
  local hook="$1" rc="$2"
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
  [[ -z "$papel" ]] && papel="desconhecido"
  mkdir -p "$(dirname "$HOOKS_LOG")" 2>/dev/null
  printf '%s · %s · %s · %s · stop\n' "$ts" "$hook" "$papel" "$rc" >> "$HOOKS_LOG" 2>/dev/null
}

FINAL_RC=0

for guard in gap-acceptance-guard.py completion-gate.py autonomous-persist-guard.py; do
  printf '%s' "$PAYLOAD" | python3 "$DIR/$guard"
  rc=$?
  log_hook "$guard" "$rc"
  if [[ "$rc" -ne 0 && "$FINAL_RC" -eq 0 ]]; then
    FINAL_RC=$rc
  fi
done

printf '%s' "$PAYLOAD" | bash "$DIR/papel-stop.sh"
rc=$?
log_hook "papel-stop.sh" "$rc"
if [[ "$rc" -ne 0 && "$FINAL_RC" -eq 0 ]]; then
  FINAL_RC=$rc
fi

exit "$FINAL_RC"
