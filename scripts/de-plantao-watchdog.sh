#!/usr/bin/env bash
# de-plantao-watchdog.sh — vigia EXTERNO (launchd, 5min) do plantão da fila de PRs do DE.
# Nunca mata nada. Escala: nudge (45min mudo) -> revive (90min mudo + sessão morta) -> notify.
set -u
Q="$HOME/Claude/docs/ai-state/de-pr-queue"
HB="$Q/.heartbeat"
CMUX="/Volumes/cmux/cmux.app/Contents/Resources/bin/cmux"
SID="909f0c25-dc07-4754-a894-616bbab5ee0d"
WS="workspace:46"
LOG="$Q/watchdog.log"
now=$(date +%s)
hb=$(cat "$HB" 2>/dev/null || echo 0)
age=$(( now - hb ))
log(){ echo "$(date '+%F %T') $*" >> "$LOG"; }

[ "$age" -lt 2700 ] && exit 0   # <45min: saudável

alive=$(pgrep -f "claude" | while read -r p; do ps -o command= -p "$p" 2>/dev/null | grep -q "$SID" && echo yes && break; done)
[ -x "$CMUX" ] || { log "cmux indisponivel; age=${age}s"; exit 0; }

if [ "$age" -lt 5400 ]; then
  # 45-90min mudo: nudge no pane (vira input de usuário e acorda o loop)
  log "NUDGE age=${age}s alive=${alive:-no}"
  "$CMUX" send --workspace "$WS" "[watchdog] plantao mudo ha $((age/60))min — execute um tick AGORA: leia ~/Claude/docs/ai-state/de-pr-queue/QUEUE.md, rode o snapshot, toque .heartbeat e re-arme o loop." 2>>"$LOG" && "$CMUX" send-key --workspace "$WS" enter 2>>"$LOG"
  "$CMUX" notify --title "Plantao DE" --body "mudo ha $((age/60))min — nudge enviado" 2>>"$LOG"
  exit 0
fi

# >90min mudo
if [ -n "${alive:-}" ]; then
  log "REVIVE-NUDGE age=${age}s (sessao viva mas muda)"
  "$CMUX" send --workspace "$WS" "[watchdog] plantao mudo ha $((age/60))min com sessao viva — retome o loop pelo PLANTAO-BOOT.md" 2>>"$LOG" && "$CMUX" send-key --workspace "$WS" enter 2>>"$LOG"
else
  log "REVIVE age=${age}s (sessao morta) — tentando resume no pane"
  "$CMUX" send --workspace "$WS" "claude --resume $SID" 2>>"$LOG" && "$CMUX" send-key --workspace "$WS" enter 2>>"$LOG"
  sleep 20
  "$CMUX" send --workspace "$WS" "leia ~/Claude/docs/ai-state/de-pr-queue/PLANTAO-BOOT.md e retome o plantao da fila de PRs do DE" 2>>"$LOG" && "$CMUX" send-key --workspace "$WS" enter 2>>"$LOG"
fi
"$CMUX" notify --title "Plantao DE" --body "revive tentado (mudo ha $((age/60))min)" 2>>"$LOG"
exit 0
