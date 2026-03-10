#!/bin/bash
# =============================================================================
# post-deploy-monitor.sh — PostToolUse: Monitor production health after push
# Advisory (exit 0). Non-blocking — sends result to n8n webhook.
#
# Triggers after git push to main/master/develop.
# Checks production health endpoint and notifies n8n of the result.
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

# Only trigger on git push commands
echo "$COMMAND" | grep -q "git push" || exit 0

# Skip if not in a git repo
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

# Only monitor pushes to main-like branches
if [[ "$BRANCH" != "main" && "$BRANCH" != "master" && "$BRANCH" != "develop" ]]; then
  exit 0
fi

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Production URL — prefer project-specific env var, fall back to platform default
PROD_URL="${RAIZ_PROD_URL:-https://raiz.com.br}"
HEALTH_URL="${PROD_URL}/api/health"
N8N_WEBHOOK="${N8N_DEPLOY_MONITOR_WEBHOOK:-https://n8n.raizeducacao.com.br/webhook/deploy-monitor}"

REPO=$(git remote get-url origin 2>/dev/null | sed 's/.*github.com[:/]//;s/.git$//')
COMMIT=$(git rev-parse HEAD 2>/dev/null | cut -c1-8)
ACTOR=$(git config user.email 2>/dev/null || echo "unknown")
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

echo "POST-DEPLOY: Checking health of $HEALTH_URL (branch: $BRANCH, commit: $COMMIT)..."

# ---------------------------------------------------------------------------
# Health check (non-blocking: 15s timeout, 1 retry)
# ---------------------------------------------------------------------------

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  --max-time 15 \
  --retry 1 \
  --retry-delay 3 \
  "$HEALTH_URL" 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
  HEALTH_STATUS="healthy"
  echo "POST-DEPLOY: Health check PASSED ($HTTP_STATUS)"
else
  HEALTH_STATUS="unhealthy"
  echo "POST-DEPLOY: Health check FAILED ($HTTP_STATUS) — manual investigation may be needed." >&2
fi

# ---------------------------------------------------------------------------
# Send result to n8n webhook (fire-and-forget)
# ---------------------------------------------------------------------------

curl -s -X POST "$N8N_WEBHOOK" \
  -H 'Content-Type: application/json' \
  -d "{
    \"repo\":\"$REPO\",
    \"branch\":\"$BRANCH\",
    \"commit\":\"$COMMIT\",
    \"actor\":\"$ACTOR\",
    \"timestamp\":\"$TIMESTAMP\",
    \"health_status\":\"$HEALTH_STATUS\",
    \"health_url\":\"$HEALTH_URL\",
    \"http_status\":\"$HTTP_STATUS\"
  }" \
  > /dev/null 2>&1 || true

echo "POST-DEPLOY: Result sent to n8n ($HEALTH_STATUS)."

# Always exit 0 — advisory hook, never blocks the push
exit 0
