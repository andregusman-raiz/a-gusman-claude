#!/usr/bin/env bash
# board-tui.sh — STATUS BOARD em texto para o Dock do cmux (terminal, sem LLM, sem depender do modelo de dados do sidebar).
# DOR: o custom sidebar em pane/Dock recebe contexto magro (sem description/progress/branch) — o board ficava vazio (29/08 12:08).
# METRICA: dono le a fila unica no Dock (M-4); zero "sem dados"; zero linha truncada (dono 29/08 14:35: "todos os bullets, sem resumir").
# DONO-MEDICAO: COMANDO. REMOVER-QUANDO: o cmux expuser description/progress no contexto do pane.
# TESTADO-EM: Dock do dono, 29/08. Uso: bash ~/.claude/scripts/board-tui.sh   (BOARD_TUI_REFRESH=60)
# Comportamento: recalcula a cada REFRESH s, mas so REDESENHA quando o conteudo muda (a posicao de scroll do dono nao salta).
set -uo pipefail
REFRESH="${BOARD_TUI_REFRESH:-60}"
SYNC="${BOARD_SYNC:-$(dirname "$0")/board-sync.sh}"
printf '\033]0;BOARD\007'; tput civis 2>/dev/null; trap 'tput cnorm 2>/dev/null; exit 0' INT TERM
LAST=""
while true; do
  OUT=$(COLUMNS="${COLUMNS:-$(tput cols 2>/dev/null || echo 120)}" PRINT=1 DRY_RUN=1 bash "$SYNC" 2>&1)
  # ignora a linha de hora ao comparar (senao muda todo minuto)
  SIG=$(printf '%s' "$OUT" | sed -E 's/[0-9]{2}:[0-9]{2}:[0-9]{2}Z//g' | shasum | cut -c1-16)
  if [ "$SIG" != "$LAST" ]; then clear; printf '%s\n' "$OUT"; LAST="$SIG"; fi
  sleep "$REFRESH"
done
