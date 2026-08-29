#!/usr/bin/env bash
# board-tui.sh — STATUS BOARD em texto para o Dock do cmux (terminal, sem LLM, sem depender do modelo de dados do sidebar).
# DOR: o custom sidebar em pane/Dock recebe contexto magro (sem description/progress/branch) — o board ficava vazio (29/08 12:08).
# METRICA: dono le a fila unica no Dock (M-4); zero "sem dados". DONO-MEDICAO: COMANDO.
# REMOVER-QUANDO: o cmux expuser description/progress no contexto do pane (ai o status-board.swift volta a bastar).
# TESTADO-EM: Dock do dono, 29/08. Uso: bash ~/.claude/scripts/board-tui.sh   (BOARD_TUI_REFRESH=60)
set -uo pipefail
REFRESH="${BOARD_TUI_REFRESH:-60}"
SYNC="${BOARD_SYNC:-$(dirname "$0")/board-sync.sh}"
printf '\033]0;BOARD\007'; tput civis 2>/dev/null; trap 'tput cnorm 2>/dev/null; exit 0' INT TERM
while true; do
  OUT=$(COLUMNS="${COLUMNS:-$(tput cols 2>/dev/null || echo 120)}" PRINT=1 DRY_RUN=1 bash "$SYNC" 2>&1)
  clear; printf '%s\n' "$OUT"
  sleep "$REFRESH"
done
