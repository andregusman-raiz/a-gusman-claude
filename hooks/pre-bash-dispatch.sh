#!/bin/bash
# pre-bash-dispatch.sh — PreToolUse(Bash): le o payload UMA vez e roda os guards em cadeia.
# Um unico spawn por tool call em vez de 3. Primeiro exit != 0 vence.
# Guards: bash-guards.sh (destrutivos+branch+SQL), stack-deny-list.sh, new-project-guard.sh
# Bypass individual: BASH_GUARDS_DISABLED=1 | STACK_GUARD_BYPASS=1

set -uo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PAYLOAD="$(cat)"

for guard in bash-guards.sh stack-deny-list.sh new-project-guard.sh; do
  printf '%s' "$PAYLOAD" | bash "$DIR/$guard"
  rc=$?
  [ $rc -ne 0 ] && exit $rc
done
exit 0
