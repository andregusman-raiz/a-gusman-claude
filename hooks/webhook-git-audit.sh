#!/bin/bash
# =============================================================================
# webhook-git-audit.sh — PostToolUse: Send git push events to n8n
# Advisory (exit 0). Sends audit data to n8n webhook on git push.
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

echo "$COMMAND" | grep -q "git push" || exit 0

REPO=$(git remote get-url origin 2>/dev/null | sed 's/.*github.com[:/]//;s/.git$//')
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
COMMITS=$(git log "origin/$BRANCH..$BRANCH" --oneline 2>/dev/null | wc -l | tr -d ' ')

WEBHOOK_URL="${CLAUDE_WEBHOOK_GIT_AUDIT_URL:-${CLAUDE_WEBHOOK_BASE_URL:-}}"
if [ -z "$WEBHOOK_URL" ]; then
  echo "GIT-AUDIT: No webhook URL configured. Set CLAUDE_WEBHOOK_GIT_AUDIT_URL or CLAUDE_WEBHOOK_BASE_URL."
  exit 0
fi

curl -s -X POST "${WEBHOOK_URL}/webhook/git-audit" \
  -H 'Content-Type: application/json' \
  -d "{\"repo\":\"$REPO\",\"branch\":\"$BRANCH\",\"commits\":$COMMITS,\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
  > /dev/null 2>&1 || true

echo "GIT-AUDIT: Push event sent to n8n webhook."
exit 0
