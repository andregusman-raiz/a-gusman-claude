#!/bin/bash
# memory-guard.sh — Verifica se eh seguro spawnar mais agents
# Uso: bash ~/.claude/scripts/memory-guard.sh
# Exit codes: 0=safe, 1=warn, 2=critical

set -uo pipefail

# Cores
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# 1. Memory pressure (macOS)
PRESSURE=$(memory_pressure 2>/dev/null | grep "System-wide memory free percentage" | awk '{print $NF}' | tr -d '%')
if [ -z "$PRESSURE" ]; then
  # Fallback: usar vm_stat
  FREE_PAGES=$(vm_stat | grep "Pages free" | awk '{print $3}' | tr -d '.')
  INACTIVE_PAGES=$(vm_stat | grep "Pages inactive" | awk '{print $3}' | tr -d '.')
  TOTAL_FREE_MB=$(( (FREE_PAGES + INACTIVE_PAGES) * 4096 / 1024 / 1024 ))
  PRESSURE_STATUS="unknown"
  if [ "$TOTAL_FREE_MB" -gt 8000 ]; then
    PRESSURE_STATUS="normal"
  elif [ "$TOTAL_FREE_MB" -gt 4000 ]; then
    PRESSURE_STATUS="warn"
  else
    PRESSURE_STATUS="critical"
  fi
else
  if [ "$PRESSURE" -gt 50 ]; then
    PRESSURE_STATUS="normal"
    TOTAL_FREE_MB="${PRESSURE}%"
  elif [ "$PRESSURE" -gt 20 ]; then
    PRESSURE_STATUS="warn"
    TOTAL_FREE_MB="${PRESSURE}%"
  else
    PRESSURE_STATUS="critical"
    TOTAL_FREE_MB="${PRESSURE}%"
  fi
fi

# 2. Contar processos Claude Code
CLAUDE_PROCS=$(pgrep -f "claude" 2>/dev/null | wc -l | tr -d ' ')
NODE_PROCS=$(pgrep -f "node.*claude" 2>/dev/null | wc -l | tr -d ' ')

# 3. Memoria total usada pelo iTerm2
ITERM_MEM=$(ps aux | grep -i "[i]Term" | awk '{sum += $6} END {printf "%.0f", sum/1024}')
if [ -z "$ITERM_MEM" ] || [ "$ITERM_MEM" = "0" ]; then
  ITERM_MEM="N/A"
else
  ITERM_MEM="${ITERM_MEM}MB"
fi

# 4. Memoria usada por processos node
NODE_MEM=$(ps aux | grep "[n]ode" | awk '{sum += $6} END {printf "%.0f", sum/1024}')
NODE_MEM="${NODE_MEM}MB"

# Output
echo "================================"
echo "  MEMORY GUARD — Resource Check"
echo "================================"
echo ""
echo "Memory free:      $TOTAL_FREE_MB"
echo "Pressure:         $PRESSURE_STATUS"
echo "Claude processes:  $CLAUDE_PROCS"
echo "Node processes:    $NODE_PROCS"
echo "iTerm2 memory:     $ITERM_MEM"
echo "Node total memory: $NODE_MEM"
echo ""

# Decisao
case "$PRESSURE_STATUS" in
  "normal")
    echo -e "${GREEN}STATUS: SAFE — pode spawnar mais agents${NC}"
    exit 0
    ;;
  "warn")
    echo -e "${YELLOW}STATUS: WARN — evitar novos agents, aguardar os atuais${NC}"
    echo "Recomendacao: fechar terminais inativos, TeamDelete em teams concluidos"
    exit 1
    ;;
  "critical")
    echo -e "${RED}STATUS: CRITICAL — NAO spawnar agents! Risco de crash${NC}"
    echo "Acao imediata: fechar sessoes Claude extras, limpar scrollback iTerm2"
    exit 2
    ;;
esac
