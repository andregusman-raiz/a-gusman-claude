#!/bin/bash
# mem-watchdog.sh — vigia de memoria FORA do Claude (launchd, 60s)
#
# Existe porque nenhum hook do Claude Code pega o cenario real do kernel panic de
# 2026-07-28: as sessoes cmux sao abertas pelo humano no app, e processos de terminal
# (claude/codex/node/bun) NAO sao jetsam-managed — o macOS nao consegue mata-los, entao
# nao ha rede de protecao entre "compressor saturando" e "kernel panic por watchdog".
# Este script e essa rede: observa, avisa, registra. NUNCA mata nada.
#
# Metricas/limiares: mem-metrics.sh. Log: ~/.claude/logs/mem-watchdog.log
# Instalar/remover:
#   launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.andregusman.mem-watchdog.plist
#   launchctl bootout   gui/$(id -u)/com.andregusman.mem-watchdog

set -uo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$HOME/.claude/logs"
LOG="$LOG_DIR/mem-watchdog.log"
STATE="$HOME/.claude/state/mem-watchdog.state"
mkdir -p "$LOG_DIR" "$(dirname "$STATE")"

# rotacao simples (2MB)
[ -f "$LOG" ] && [ "$(stat -f %z "$LOG" 2>/dev/null || echo 0)" -gt 2097152 ] && mv -f "$LOG" "$LOG.1"

eval "$(bash "$DIR/mem-metrics.sh")"
TS=$(date '+%Y-%m-%d %H:%M:%S')

PREV_LEVEL=OK; PREV_COMP=0; STRIKES=0
[ -f "$STATE" ] && . "$STATE"
COMP_DELTA=$(( COMP_MB - PREV_COMP ))

echo "$TS $LEVEL avail=${AVAIL_MB}MB swap=${SWAP_MB}MB comp=${COMP_MB}MB(${COMP_PCT}%) d_comp=${COMP_DELTA}MB claude=$CLAUDE_N codex=$CODEX_N node=$NODE_N procs=$PROC_N" >> "$LOG"

# SPEC-machine-status-panel-v1 (gusman-os) D1: snapshot estruturado p/ o painel /machine.
# Best-effort: falha aqui NUNCA derruba o watchdog (o log textual acima segue sendo o canônico).
{
  JSONL="$HOME/.claude/state/mem-metrics.jsonl"
  [ -f "$JSONL" ] && [ "$(stat -f %z "$JSONL" 2>/dev/null || echo 0)" -gt 2097152 ] && mv -f "$JSONL" "$JSONL.1"
  # RSS por família em 1 passada (só aqui, não no mem-metrics.sh — statusline o avalia por render)
  RSS_JSON=$(ps -Aro rss=,comm= 2>/dev/null | awk '
    { rss=$1; $1=""; c=tolower($0)
      if (c ~ /claude/)                 f["claude"]+=rss
      else if (c ~ /codex/)             f["codex"]+=rss
      else if (c ~ /next-server/ || c ~ /node/) f["node"]+=rss
      else if (c ~ /bun/)               f["bun"]+=rss
      else if (c ~ /google chrome/)     f["chrome"]+=rss }
    END { printf "{\"claude\":%d,\"codex\":%d,\"node\":%d,\"bun\":%d,\"chrome\":%d}",
      f["claude"]/1024, f["codex"]/1024, f["node"]/1024, f["bun"]/1024, f["chrome"]/1024 }')
  TS_ISO=$(date '+%Y-%m-%dT%H:%M:%S%z')
  REASON_ESC=$(printf '%s' "$REASON" | tr -d '"\\')
  printf '{"ts":"%s","level":"%s","reason":"%s","ram_mb":%d,"avail_mb":%d,"comp_mb":%d,"comp_pct":%d,"swap_mb":%d,"claude_n":%d,"codex_n":%d,"node_n":%d,"proc_n":%d,"rss_mb":%s}\n' \
    "$TS_ISO" "$LEVEL" "$REASON_ESC" "$RAM_MB" "$AVAIL_MB" "$COMP_MB" "$COMP_PCT" "$SWAP_MB" \
    "$CLAUDE_N" "$CODEX_N" "$NODE_N" "$PROC_N" "$RSS_JSON" >> "$JSONL"
} 2>/dev/null || true

if [ "$LEVEL" = "CRIT" ]; then
  STRIKES=$(( STRIKES + 1 ))
else
  STRIKES=0
fi

# 2 amostras CRIT seguidas (2 min) = alerta. Evita ruido de pico transitorio.
if [ "$STRIKES" -ge 2 ]; then
  {
    echo "--- TOP RSS $TS ---"
    ps -Aro rss=,pid=,comm= | sort -rn | head -12 | awk '{printf "  %6.1f GB  pid=%-7s %s\n", $1/1048576, $2, $3}'
  } >> "$LOG"

  MSG="avail ${AVAIL_MB}MB | swap ${SWAP_MB}MB | compressor ${COMP_PCT}% | ${CLAUDE_N} claude/${CODEX_N} codex/${PROC_N} procs"
  if command -v terminal-notifier >/dev/null 2>&1; then
    terminal-notifier -title "MEMORIA CRITICA — risco de kernel panic" -message "$MSG" -sound Basso 2>/dev/null
  else
    osascript -e "display notification \"$MSG\" with title \"MEMORIA CRITICA — risco de kernel panic\" sound name \"Basso\"" 2>/dev/null
  fi
  STRIKES=0   # nao repetir alerta a cada minuto
fi

printf 'PREV_LEVEL=%s\nPREV_COMP=%s\nSTRIKES=%s\n' "$LEVEL" "$COMP_MB" "$STRIKES" > "$STATE"
exit 0
