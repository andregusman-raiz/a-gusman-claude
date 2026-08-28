#!/bin/bash
# memory-guard.sh — Verifica se eh seguro spawnar mais agents
# Exit codes: 0=safe (inclui WARN: avisa, NAO bloqueia), 2=critical (bloqueia o spawn)
#
# Politica (2026-08-08): so CRIT bloqueia. WARN e advisory — a statusline ja mostra
# o nivel, e um guard que bloqueia no "amarelo" acabava barrando praticamente todo
# Agent/Task/Workflow (98,7% das amostras eram CRIT na calibracao antiga).
# Limiares e racional: mem-metrics.sh.
#
# Bypass: MEMORY_GUARD_DISABLED=1 (sessao ou export). Ajuste fino sem desligar:
# MEM_SEG_CRIT_PCT / MEM_COMP_CRIT_PCT / MEM_AVAIL_FLOOR_MB / CLAUDE_SESSION_LIMIT /
# CLAUDE_NODE_PROC_LIMIT.

set -uo pipefail

if [ "${MEMORY_GUARD_DISABLED:-0}" = "1" ]; then
  echo "memory-guard: bypass (MEMORY_GUARD_DISABLED=1)"
  exit 0
fi

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# 1. Hard limit: max Claude CLI processes (MOST IMPORTANT CHECK)
# Only count actual "claude" binary processes, not subprocesses that have "claude" in path
CLAUDE_COUNT=$(ps aux | awk '$11 ~ /\/claude$/ || $11 == "claude"' | wc -l | tr -d ' ')
MAX_CLAUDE=${CLAUDE_SESSION_LIMIT:-18}

if [ "$CLAUDE_COUNT" -ge "$MAX_CLAUDE" ]; then
  echo -e "${RED}BLOCKED: $CLAUDE_COUNT sessoes Claude ativas (max: $MAX_CLAUDE)${NC}"
  echo "Feche terminais/sessoes antes de spawnar novos agents, ou eleve o teto:"
  echo "  CLAUDE_SESSION_LIMIT=<n>   (bypass total: MEMORY_GUARD_DISABLED=1)"
  ps aux | awk '$11 ~ /\/claude$/ || $11 == "claude" {printf "  PID %-8s %d MB RSS\n", $2, $6/1024}'
  exit 2
fi

# 2. Hard limit: max Node processes (MCPs + tools)
# pgrep -x (nome exato do executavel), NAO -f: `pgrep -f "node"` casava qualquer
# cmdline contendo "node" (sessoes claude via paths fnm node-versions — ja contadas
# no check 1 —, `bun run .../node_modules/...`, etc), inflando a contagem em ~40%
# e bloqueando spawn com RAM saudavel (incidente 2026-08-08). Bun e reportado como
# info no output; o guard real contra fan-out de memoria e o check 3 (mem-metrics).
NODE_COUNT=$(pgrep -x node 2>/dev/null | wc -l | tr -d ' ')
BUN_COUNT=$(pgrep -x bun 2>/dev/null | wc -l | tr -d ' ')
MAX_NODE=${CLAUDE_NODE_PROC_LIMIT:-300}

if [ "$NODE_COUNT" -ge "$MAX_NODE" ]; then
  echo -e "${RED}WARNING: $NODE_COUNT processos Node (max: $MAX_NODE). Cleaning...${NC}"
  bash "$(dirname "$0")/cleanup-orphans.sh" 2>/dev/null
  NODE_COUNT=$(pgrep -x node 2>/dev/null | wc -l | tr -d ' ')
  if [ "$NODE_COUNT" -ge "$MAX_NODE" ]; then
    echo "Ainda $NODE_COUNT processos apos cleanup. BLOQUEADO."
    exit 2
  fi
fi

# 3. Memoria REAL — swap + compressor, nao `memory_pressure`
# `memory_pressure` conta paginas inativas como livres: no kernel panic de 2026-07-28
# ele reportaria ~36% "livre" com o kernel ja em vm-compressor-space-shortage.
# Metricas e limiares em mem-metrics.sh (fonte unica). Ver gotcha-mac-panic-watchdog-vm-compressor.
eval "$(bash "$(dirname "$0")/mem-metrics.sh")"
case "$LEVEL" in
  OK)   PRESSURE_STATUS="normal" ;;
  WARN) PRESSURE_STATUS="warn" ;;
  *)    PRESSURE_STATUS="critical" ;;
esac
PRESSURE_DISPLAY="segmentos ${SEG_PCT}% do limite | compressor ${COMP_PCT}% da RAM | ${AVAIL_MB}MB livres | swap ${SWAP_MB}MB"

# 4. Output
echo "================================"
echo "  MEMORY GUARD — Resource Check"
echo "================================"
echo ""
echo "Memory:            $PRESSURE_DISPLAY ($PRESSURE_STATUS)"
echo "Claude processes:  $CLAUDE_COUNT / $MAX_CLAUDE"
echo "Node processes:    $NODE_COUNT / $MAX_NODE (bun: $BUN_COUNT)"
echo "Codex processes:   $CODEX_N"
echo "Total processes:   $PROC_N"

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
    # Advisory: passa. Segurar fan-out largo e decisao de quem chama, nao bloqueio.
    echo -e "${YELLOW}STATUS: WARN — passa, mas evite fan-out largo (>3 agents simultaneos)${NC}"
    echo "Motivo: $REASON"
    exit 0
    ;;
  "critical")
    echo -e "${RED}STATUS: CRITICAL — spawn BLOQUEADO${NC}"
    echo "Motivo: $REASON"
    echo "Compressor perto do limite de SEGMENTOS => risco de kernel panic (watchdog), nao so lentidao."
    echo ""
    echo "Saidas, em ordem:"
    echo "  1. Feche sessoes cmux/claude/codex ociosas (top consumidores acima)"
    echo "  2. bash ~/Claude/.claude/scripts/cleanup-orphans.sh"
    echo "  3. Rode a tarefa inline (sem subagent) — nao precisa de spawn"
    echo "  4. Bypass consciente: MEMORY_GUARD_DISABLED=1 (ou MEM_SEG_CRIT_PCT=90)"
    exit 2
    ;;
esac
