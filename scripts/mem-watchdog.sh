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

PREV_LEVEL=OK; PREV_COMP=0; STRIKES=0; LAST_ALERT=0; LAST_ALERT_PAPEIS=0
[ -f "$STATE" ] && . "$STATE"
COMP_DELTA=$(( COMP_MB - PREV_COMP ))

# --- papeis de terminal (registry.json) + memoria livre da cmux (liveness.json) ---
# Adicionado 2026-08-27: sinal COMPLEMENTAR ao SEG_PCT/COMP_PCT acima (nao mexe na
# logica de LEVEL do mem-metrics.sh). Cap de terminais abertos por agente vem do
# registry do cockpit; memory_free_pct vem do snapshot do cmux (liveness.json).
# Tolerante a arquivo ausente/corrompido/sem python3: fica "?" e nao gera erro.
REGISTRY="$HOME/Claude/docs/ai-state/terminais/registry.json"
LIVENESS="$HOME/Claude/docs/ai-state/terminais/liveness.json"

PAPEIS_CLAUDE_ABERTOS="?"; PAPEIS_CLAUDE_CAP="?"
PAPEIS_CODEX_ABERTOS="?"; PAPEIS_CODEX_CAP="?"
MEMORY_FREE_PCT="?"

if [ -f "$REGISTRY" ] && command -v python3 >/dev/null 2>&1; then
  REGISTRY_VARS=$(python3 - "$REGISTRY" <<'PYEOF' 2>/dev/null
import json, sys
try:
    with open(sys.argv[1]) as f:
        d = json.load(f)
    cap = d.get("cap", {}) or {}
    terms = d.get("terminais", {}) or {}
    abertos = {"claude": 0, "codex": 0}
    for t in terms.values():
        if isinstance(t, dict) and t.get("estado") == "aberto":
            agent = t.get("agent")
            if agent in abertos:
                abertos[agent] += 1
    print("PAPEIS_CLAUDE_CAP=%d" % int(cap.get("claude", 0) or 0))
    print("PAPEIS_CODEX_CAP=%d" % int(cap.get("codex", 0) or 0))
    print("PAPEIS_CLAUDE_ABERTOS=%d" % abertos["claude"])
    print("PAPEIS_CODEX_ABERTOS=%d" % abertos["codex"])
except Exception:
    pass
PYEOF
)
  [ -n "$REGISTRY_VARS" ] && eval "$REGISTRY_VARS"
fi

if [ -f "$LIVENESS" ] && command -v python3 >/dev/null 2>&1; then
  LIVENESS_VARS=$(python3 - "$LIVENESS" <<'PYEOF' 2>/dev/null
import json, sys
try:
    with open(sys.argv[1]) as f:
        d = json.load(f)
    v = d.get("memory_free_pct")
    if isinstance(v, (int, float)):
        print("MEMORY_FREE_PCT=%d" % int(v))
except Exception:
    pass
PYEOF
)
  [ -n "$LIVENESS_VARS" ] && eval "$LIVENESS_VARS"
fi

echo "$TS $LEVEL avail=${AVAIL_MB}MB swap=${SWAP_MB}MB comp=${COMP_MB}MB(${COMP_PCT}%) seg=${SEG_PCT}% d_comp=${COMP_DELTA}MB claude=$CLAUDE_N codex=$CODEX_N node=$NODE_N procs=$PROC_N papeis_claude=${PAPEIS_CLAUDE_ABERTOS}/${PAPEIS_CLAUDE_CAP} papeis_codex=${PAPEIS_CODEX_ABERTOS}/${PAPEIS_CODEX_CAP} mem_free=${MEMORY_FREE_PCT}%" >> "$LOG"

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
  printf '{"ts":"%s","level":"%s","reason":"%s","ram_mb":%d,"avail_mb":%d,"comp_mb":%d,"comp_pct":%d,"seg_pct":%d,"swap_mb":%d,"claude_n":%d,"codex_n":%d,"node_n":%d,"proc_n":%d,"rss_mb":%s}\n' \
    "$TS_ISO" "$LEVEL" "$REASON_ESC" "$RAM_MB" "$AVAIL_MB" "$COMP_MB" "$COMP_PCT" "$SEG_PCT" "$SWAP_MB" \
    "$CLAUDE_N" "$CODEX_N" "$NODE_N" "$PROC_N" "$RSS_JSON" >> "$JSONL"
} 2>/dev/null || true

if [ "$LEVEL" = "CRIT" ]; then
  STRIKES=$(( STRIKES + 1 ))
else
  STRIKES=0
fi

# 3 amostras CRIT seguidas (3 min) = alerta, com cooldown de 15 min entre notificacoes.
# Antes eram 2 amostras sem cooldown: em regime CRIT sustentado virava notificacao com
# som a cada ~2 min — alarme que so ensina a ignorar alarme.
NOW=$(date +%s)
ALERT_COOLDOWN=${MEM_ALERT_COOLDOWN_S:-900}
if [ "$STRIKES" -ge 3 ] && [ $(( NOW - LAST_ALERT )) -ge "$ALERT_COOLDOWN" ]; then
  LAST_ALERT=$NOW
  {
    echo "--- TOP RSS $TS ---"
    ps -Aro rss=,pid=,comm= | sort -rn | head -12 | awk '{printf "  %6.1f GB  pid=%-7s %s\n", $1/1048576, $2, $3}'
  } >> "$LOG"

  MSG="segmentos ${SEG_PCT}% | compressor ${COMP_PCT}% | avail ${AVAIL_MB}MB | ${CLAUDE_N} claude/${CODEX_N} codex/${PROC_N} procs"
  if command -v terminal-notifier >/dev/null 2>&1; then
    terminal-notifier -title "MEMORIA CRITICA — risco de kernel panic" -message "$MSG" -sound Basso 2>/dev/null
  else
    osascript -e "display notification \"$MSG\" with title \"MEMORIA CRITICA — risco de kernel panic\" sound name \"Basso\"" 2>/dev/null
  fi
  STRIKES=0   # nao repetir alerta a cada minuto
fi

# --- WARN de papeis/memoria (mesmo mecanismo de alerta acima: terminal-notifier/osascript) ---
# Dispara quando abertos > cap de algum agente OU quando memoria livre < 15% com >=4
# papeis abertos. Nao mexe em $LEVEL/$STRIKES (sinal independente do SEG/COMP acima).
# Digitos-only guard: se registry/liveness faltaram ("?"), a condicao nao dispara.
is_num() { case "$1" in ''|*[!0-9]*) return 1 ;; *) return 0 ;; esac; }

PAPEIS_WARN=0
if is_num "$PAPEIS_CLAUDE_ABERTOS" && is_num "$PAPEIS_CLAUDE_CAP" && [ "$PAPEIS_CLAUDE_CAP" -gt 0 ] \
   && [ "$PAPEIS_CLAUDE_ABERTOS" -gt "$PAPEIS_CLAUDE_CAP" ]; then
  PAPEIS_WARN=1
fi
if is_num "$PAPEIS_CODEX_ABERTOS" && is_num "$PAPEIS_CODEX_CAP" && [ "$PAPEIS_CODEX_CAP" -gt 0 ] \
   && [ "$PAPEIS_CODEX_ABERTOS" -gt "$PAPEIS_CODEX_CAP" ]; then
  PAPEIS_WARN=1
fi
if is_num "$MEMORY_FREE_PCT" && [ "$MEMORY_FREE_PCT" -lt 15 ] \
   && is_num "$PAPEIS_CLAUDE_ABERTOS" && is_num "$PAPEIS_CODEX_ABERTOS" \
   && [ $(( PAPEIS_CLAUDE_ABERTOS + PAPEIS_CODEX_ABERTOS )) -ge 4 ]; then
  PAPEIS_WARN=1
fi

if [ "$PAPEIS_WARN" -eq 1 ] && [ $(( NOW - LAST_ALERT_PAPEIS )) -ge "$ALERT_COOLDOWN" ]; then
  LAST_ALERT_PAPEIS=$NOW
  echo "$TS WARN papeis_claude=${PAPEIS_CLAUDE_ABERTOS}/${PAPEIS_CLAUDE_CAP} papeis_codex=${PAPEIS_CODEX_ABERTOS}/${PAPEIS_CODEX_CAP} mem_free=${MEMORY_FREE_PCT}%" >> "$LOG"

  MSG="papeis claude ${PAPEIS_CLAUDE_ABERTOS}/${PAPEIS_CLAUDE_CAP} | codex ${PAPEIS_CODEX_ABERTOS}/${PAPEIS_CODEX_CAP} | memoria livre ${MEMORY_FREE_PCT}%"
  if command -v terminal-notifier >/dev/null 2>&1; then
    terminal-notifier -title "WARN — papeis de terminal / memoria" -message "$MSG" -sound Tink 2>/dev/null
  else
    osascript -e "display notification \"$MSG\" with title \"WARN — papeis de terminal / memoria\" sound name \"Tink\"" 2>/dev/null
  fi
fi

printf 'PREV_LEVEL=%s\nPREV_COMP=%s\nSTRIKES=%s\nLAST_ALERT=%s\nLAST_ALERT_PAPEIS=%s\n' "$LEVEL" "$COMP_MB" "$STRIKES" "$LAST_ALERT" "$LAST_ALERT_PAPEIS" > "$STATE"
exit 0
