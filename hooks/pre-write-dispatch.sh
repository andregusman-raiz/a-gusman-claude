#!/bin/bash
# pre-write-dispatch.sh — PreToolUse(Write|Edit|MultiEdit): payload lido UMA vez, guards em cadeia.
# config-guard.sh so se aplica a Write (forca Edit em configs); gha-guard.sh a todos.
# Bypass individual: CONFIG_GUARD_DISABLED=1 | GHA_GUARD_DISABLED=1

set -uo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PAYLOAD="$(cat)"
TOOL="$(printf '%s' "$PAYLOAD" | python3 -c 'import json,sys
try:
    print(json.load(sys.stdin).get("tool_name",""))
except Exception:
    print("")' 2>/dev/null)"

if [ "$TOOL" = "Write" ]; then
  printf '%s' "$PAYLOAD" | bash "$DIR/config-guard.sh"
  rc=$?; [ $rc -ne 0 ] && exit $rc
fi

printf '%s' "$PAYLOAD" | bash "$HOME/.claude/scripts/gha-guard.sh"
rc=$?; [ $rc -ne 0 ] && exit $rc
exit 0
