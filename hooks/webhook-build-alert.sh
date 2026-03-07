#!/bin/bash
# =============================================================================
# webhook-build-alert.sh — PostToolUse: Send build failure alerts to n8n
# Advisory (exit 0). Sends build alert to n8n webhook on build failure.
# =============================================================================

INPUT=$(cat)

COMMAND=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('command', ''))
except:
    print('')
" 2>/dev/null || echo "")

EXIT_CODE=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tool_result', {}).get('exit_code', '0'))
except:
    print('0')
" 2>/dev/null || echo "0")

echo "$COMMAND" | grep -q "npm run build" || exit 0

# Only alert on failure
[ "$EXIT_CODE" = "0" ] && exit 0

curl -s -X POST 'https://n8n.raizeducacao.com.br/webhook/build-alert' \
  -H 'Content-Type: application/json' \
  -d "{\"project\":\"$(basename "$(pwd)")\",\"branch\":\"$(git rev-parse --abbrev-ref HEAD 2>/dev/null)\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"status\":\"FAILED\"}" \
  > /dev/null 2>&1 || true

echo "BUILD-ALERT: Build failure sent to n8n webhook."
exit 0
