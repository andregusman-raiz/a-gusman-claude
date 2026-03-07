#!/bin/bash
# =============================================================================
# webhook-test-metrics.sh — PostToolUse: Send test run events to n8n
# Advisory (exit 0). Sends test metrics to n8n webhook.
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

echo "$COMMAND" | grep -qE "npm test|npx vitest|npx playwright" || exit 0

WEBHOOK_URL="${CLAUDE_WEBHOOK_TEST_METRICS_URL:-${CLAUDE_WEBHOOK_BASE_URL:-}}"
if [ -z "$WEBHOOK_URL" ]; then
  echo "TEST-METRICS: No webhook URL configured. Set CLAUDE_WEBHOOK_TEST_METRICS_URL or CLAUDE_WEBHOOK_BASE_URL."
  exit 0
fi

curl -s -X POST "${WEBHOOK_URL}/webhook/test-metrics" \
  -H 'Content-Type: application/json' \
  -d "{\"suite\":\"$(basename "$(pwd)")\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
  > /dev/null 2>&1 || true

echo "TEST-METRICS: Test run event sent to n8n webhook."
exit 0
