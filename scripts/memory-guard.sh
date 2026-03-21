#!/bin/bash
# memory-guard.sh — Verifica se eh seguro spawnar mais agents
# Exit codes: 0=safe, 1=warn, 2=critical

set -uo pipefail

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# 1. Hard limit: max Claude CLI processes (MOST IMPORTANT CHECK)
# Only count actual "claude" binary processes, not subprocesses that have "claude" in path
CLAUDE_COUNT=$(ps aux | awk '$11 ~ /\/claude$/ || $11 == "claude"' | wc -l | tr -d ' ')
MAX_CLAUDE=6

if [ "$CLAUDE_COUNT" -ge "$MAX_CLAUDE" ]; then
  echo -e "${RED}BLOCKED: $CLAUDE_COUNT sessoes Claude ativas (max: $MAX_CLAUDE)${NC}"
  echo "Feche terminais/sessoes antes de spawnar novos agents."
  ps aux | awk '$11 ~ /\/claude$/ || $11 == "claude" {printf "  PID %-8s %d MB RSS\n", $2, $6/1024}'
  exit 2
fi

# 2. Hard limit: max Node processes (MCPs + tools)
NODE_COUNT=$(pgrep -f "node" 2>/dev/null | wc -l | tr -d ' ')
MAX_NODE=30

if [ "$NODE_COUNT" -ge "$MAX_NODE" ]; then
  echo -e "${RED}WARNING: $NODE_COUNT processos Node (max: $MAX_NODE). Cleaning...${NC}"
  bash "$(dirname "$0")/cleanup-orphans.sh" 2>/dev/null
  NODE_COUNT=$(pgrep -f "node" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$NODE_COUNT" -ge "$MAX_NODE" ]; then
    echo "Ainda $NODE_COUNT processos apos cleanup. BLOQUEADO."
    exit 2
  fi
fi

# 3. Memory pressure (macOS)
PRESSURE=$(memory_pressure 2>/dev/null | grep "System-wide memory free percentage" | awk '{print $NF}' | tr -d '%')
if [ -z "$PRESSURE" ]; then
  FREE_PAGES=$(vm_stat | grep "Pages free" | awk '{print $3}' | tr -d '.')
  INACTIVE_PAGES=$(vm_stat | grep "Pages inactive" | awk '{print $3}' | tr -d '.')
  TOTAL_FREE_MB=$(( (FREE_PAGES + INACTIVE_PAGES) * 4096 / 1024 / 1024 ))
  if [ "$TOTAL_FREE_MB" -gt 8000 ]; then
    PRESSURE_STATUS="normal"
  elif [ "$TOTAL_FREE_MB" -gt 4000 ]; then
    PRESSURE_STATUS="warn"
  else
    PRESSURE_STATUS="critical"
  fi
  PRESSURE_DISPLAY="${TOTAL_FREE_MB}MB free"
else
  if [ "$PRESSURE" -gt 50 ]; then
    PRESSURE_STATUS="normal"
  elif [ "$PRESSURE" -gt 20 ]; then
    PRESSURE_STATUS="warn"
  else
    PRESSURE_STATUS="critical"
  fi
  PRESSURE_DISPLAY="${PRESSURE}% free"
fi

# 4. Output
echo "================================"
echo "  MEMORY GUARD — Resource Check"
echo "================================"
echo ""
echo "Memory:            $PRESSURE_DISPLAY ($PRESSURE_STATUS)"
echo "Claude processes:  $CLAUDE_COUNT / $MAX_CLAUDE"
echo "Node processes:    $NODE_COUNT / $MAX_NODE"

# Orphan counts
TSC_ORPHANS=$(pgrep -f "tsc --noEmit" 2>/dev/null | wc -l | tr -d ' ')
PW_ORPHANS=$(pgrep -f "playwright_chromiumdev_profile" 2>/dev/null | wc -l | tr -d ' ')
[ "$TSC_ORPHANS" -gt 0 ] && echo "tsc orphans:       $TSC_ORPHANS (LEAK!)"
[ "$PW_ORPHANS" -gt 0 ] && echo "Playwright orphans: $PW_ORPHANS (LEAK!)"

# Flag orphan accumulation (cleanup already runs at Node > 30 above)
if [ "$TSC_ORPHANS" -gt 1 ] || [ "$PW_ORPHANS" -gt 3 ]; then
  echo ""
  echo "Orphans detected — cleanup will run if Node count exceeds threshold."
fi

echo ""

case "$PRESSURE_STATUS" in
  "normal")
    echo -e "${GREEN}STATUS: SAFE${NC}"
    exit 0
    ;;
  "warn")
    echo -e "${YELLOW}STATUS: WARN — evitar novos agents${NC}"
    exit 1
    ;;
  "critical")
    echo -e "${RED}STATUS: CRITICAL — NAO spawnar agents!${NC}"
    exit 2
    ;;
esac
