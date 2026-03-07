#!/bin/bash
# =============================================================================
# session-logger.sh — PostToolUse: Log agent session completions
# Advisory (exit 0). Appends to sessions.csv when agents complete.
# =============================================================================

INPUT=$(cat)

# Only trigger on Agent tool completions
TOOL_NAME=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tool_name', ''))
except:
    print('')
" 2>/dev/null || echo "")

[ "$TOOL_NAME" = "Agent" ] || exit 0

# Extract agent info from result
RESULT=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    result = data.get('tool_result', {})
    stdout = result.get('stdout', '') if isinstance(result, dict) else str(result)
    print(stdout[:500])
except:
    print('')
" 2>/dev/null || echo "")

# Try to extract agent type and token usage
AGENT_TYPE=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('subagent_type', 'general'))
except:
    print('general')
" 2>/dev/null || echo "general")

TOKENS=$(echo "$RESULT" | grep -o 'total_tokens: [0-9]*' | grep -o '[0-9]*' || echo "0")
STATUS="completed"

# Detect failure
if echo "$RESULT" | grep -qiE "error|failed|FAIL"; then
    STATUS="failed"
fi

CSV_FILE="$HOME/Claude/.claude/docs/ai-state/sessions.csv"

# Create CSV with header if it doesn't exist
if [ ! -f "$CSV_FILE" ]; then
    echo "timestamp,agent_id,model,status,duration_tokens,notes" > "$CSV_FILE"
fi

# Append session entry
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
PROJECT=$(basename "$(pwd)")
echo "$TIMESTAMP,$AGENT_TYPE,auto,$STATUS,$TOKENS,$PROJECT" >> "$CSV_FILE"

exit 0
