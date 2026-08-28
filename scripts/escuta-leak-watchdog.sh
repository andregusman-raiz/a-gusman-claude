#!/usr/bin/env bash
# escuta-leak-watchdog.sh
#
# Watchdog protetivo (stopgap) para o vazamento de memoria conhecido do daemon
# `escuta start` (com.andregusman.escuta): a diarizacao sherpa-onnx retem
# 300-500MB COMPRIMIDOS por chamada e nao libera, ate a maquina entrar em zona
# de kernel panic por pressao do vm-compressor. O fix real (parar de recarregar
# o modelo por chamada / liberar buffers) fica para fase propria no repo escuta.
# Este script so contem o sintoma: mede memoria comprimida do processo e
# reinicia o daemon quando passa do limiar, MAS NUNCA durante reuniao em curso.
#
# Gotcha da maquina (ver MEMORY.md): RSS e cego para esse vazamento porque o
# vm-compressor comprime as paginas do sherpa-onnx antes do kernel reportar em
# RSS. A metrica que sobe de forma monotonica e CMPRS (memoria comprimida) via
# `top -stats cmprs`. NUNCA medir por nome de processo generico (python) — o
# PID e sempre resolvido via `launchctl list <label>`, que so pode ser um
# processo: o daemon com.andregusman.escuta.
#
# Uso: chamado pelo LaunchAgent com.andregusman.escuta-leak-watchdog
# (StartInterval=300) ou manualmente para teste.
#
# Overrides (para teste manual, sem editar o script):
#   ESCUTA_LEAK_THRESHOLD_GB=1 ./escuta-leak-watchdog.sh   # forca limiar baixo
#   ou arquivo ~/.local/state/escuta-leak-watchdog.conf com linha THRESHOLD_GB=N
#
# Kill-switch: crie ~/.local/state/escuta-leak-watchdog.DISABLED (arquivo vazio)
# para o script virar no-op (loga "disabled" e sai 0). Apague o arquivo para
# reativar.
#
# Log de acoes (auditoria, rotaciona em >1MB mantendo a cauda):
#   ~/.local/share/escuta/leak-watchdog.log

set -uo pipefail

# PATH determinístico — não depender do ambiente do launchd.
PATH="/usr/bin:/bin:/usr/sbin:/sbin"

LABEL="com.andregusman.escuta"
UID_NUM="$(id -u)"
HEALTH_FILE="$HOME/.local/share/escuta/screen_capture_health.json"
LOG_FILE="$HOME/.local/share/escuta/leak-watchdog.log"
DISABLE_FILE="$HOME/.local/state/escuta-leak-watchdog.DISABLED"
CONFIG_FILE="$HOME/.local/state/escuta-leak-watchdog.conf"
DEFAULT_THRESHOLD_GB=15
LOG_MAX_BYTES=1048576   # 1MB
LOG_TAIL_LINES=200

mkdir -p "$(dirname "$LOG_FILE")" "$(dirname "$DISABLE_FILE")" 2>/dev/null

rotate_log() {
  [ -f "$LOG_FILE" ] || return 0
  local size
  size="$(stat -f%z "$LOG_FILE" 2>/dev/null || echo 0)"
  if [ "${size:-0}" -gt "$LOG_MAX_BYTES" ]; then
    tail -n "$LOG_TAIL_LINES" "$LOG_FILE" > "${LOG_FILE}.tmp" 2>/dev/null && mv "${LOG_FILE}.tmp" "$LOG_FILE"
  fi
}

log() {
  rotate_log
  printf '%s | %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1" >> "$LOG_FILE"
}

# --- kill-switch -------------------------------------------------------
if [ -f "$DISABLE_FILE" ]; then
  log "disabled (kill-switch presente: $DISABLE_FILE) — no-op"
  exit 0
fi

# --- resolver limiar: env > config file > default ----------------------
THRESHOLD_GB="${ESCUTA_LEAK_THRESHOLD_GB:-}"
if [ -z "$THRESHOLD_GB" ] && [ -f "$CONFIG_FILE" ]; then
  THRESHOLD_GB="$(grep -E '^THRESHOLD_GB=' "$CONFIG_FILE" | tail -1 | cut -d= -f2 | tr -d '[:space:]')"
fi
THRESHOLD_GB="${THRESHOLD_GB:-$DEFAULT_THRESHOLD_GB}"
THRESHOLD_MB="$(awk -v g="$THRESHOLD_GB" 'BEGIN{printf "%.0f", g*1024}')"

# --- resolver PID via launchctl (NUNCA por nome de processo) -----------
get_escuta_pid() {
  launchctl list "$LABEL" 2>/dev/null | awk -F'= ' '/"PID"/{gsub(/[;[:space:]]/,"",$2); print $2}'
}

PID="$(get_escuta_pid)"
if [ -z "$PID" ] || [ "$PID" = "-" ]; then
  log "escuta nao esta rodando (sem PID via launchctl list ${LABEL}) — nada a monitorar"
  exit 0
fi

# --- medir CMPRS via top (metrica que reflete o vazamento; RSS e cego) -
get_cmprs_raw() {
  local pid="$1"
  /usr/bin/top -l 1 -pid "$pid" -stats pid,command,cmprs 2>/dev/null | awk -v p="$pid" '$1==p {print $NF}'
}

cmprs_to_mb() {
  awk -v v="$1" 'BEGIN{
    unit = substr(v, length(v), 1);
    num = substr(v, 1, length(v)-1);
    if (unit=="G") printf "%.0f", num*1024;
    else if (unit=="M") printf "%.0f", num+0;
    else if (unit=="K") printf "%.0f", num/1024;
    else printf "%.0f", 0;
  }'
}

CMPRS_RAW="$(get_cmprs_raw "$PID")"
if [ -z "$CMPRS_RAW" ]; then
  log "falha ao ler cmprs via top para pid ${PID} — pulando ciclo"
  exit 0
fi
CMPRS_MB="$(cmprs_to_mb "$CMPRS_RAW")"

if [ "$CMPRS_MB" -le "$THRESHOLD_MB" ]; then
  log "OK cmprs=${CMPRS_MB}MB (raw=${CMPRS_RAW}, pid=${PID}) <= limiar=${THRESHOLD_MB}MB — no-op"
  exit 0
fi

# --- limiar excedido: so reinicia se NAO houver reuniao em curso -------
get_health_status() {
  local f="$1"
  [ -f "$f" ] || { echo ""; return; }
  grep -o '"status"[[:space:]]*:[[:space:]]*"[^"]*"' "$f" | head -1 | sed -E 's/.*:[[:space:]]*"([^"]*)"/\1/'
}

HEALTH_STATUS="$(get_health_status "$HEALTH_FILE")"

if [ "$HEALTH_STATUS" != "no_meeting_window" ]; then
  log "LIMIAR EXCEDIDO cmprs=${CMPRS_MB}MB > ${THRESHOLD_MB}MB mas health=${HEALTH_STATUS:-desconhecido/arquivo ausente} (reuniao em curso ou status indisponivel) — restart ADIADO"
  exit 0
fi

# --- restart + verificacao de PID novo E processo vivo -----------------
log "LIMIAR EXCEDIDO cmprs=${CMPRS_MB}MB > ${THRESHOLD_MB}MB, health=no_meeting_window — iniciando restart (pid atual=${PID})"

launchctl kickstart -k "gui/${UID_NUM}/${LABEL}" >/dev/null 2>&1

NEW_PID=""
tries=0
while [ "$tries" -lt 8 ]; do
  sleep 2
  NEW_PID="$(get_escuta_pid)"
  [ -n "$NEW_PID" ] && [ "$NEW_PID" != "-" ] && break
  tries=$((tries+1))
done

if [ -n "$NEW_PID" ] && [ "$NEW_PID" != "-" ] && [ "$NEW_PID" != "$PID" ] && ps -p "$NEW_PID" >/dev/null 2>&1; then
  log "RESTART OK: pid ${PID} -> ${NEW_PID} (processo vivo confirmado)"
elif [ -n "$NEW_PID" ] && [ "$NEW_PID" != "-" ] && [ "$NEW_PID" = "$PID" ] && ps -p "$NEW_PID" >/dev/null 2>&1; then
  log "RESTART AVISO: pid manteve ${PID} apos kickstart (processo vivo, mas nao reciclou — investigar)"
else
  log "RESTART FALHOU: sem PID vivo apos kickstart (pid_antigo=${PID}, pid_lido=${NEW_PID:-nenhum})"
fi
