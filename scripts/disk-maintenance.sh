#!/bin/bash
# disk-maintenance.sh — rotina semanal de higiene de disco (Fase 5 da ESTRATEGIA-limpeza-disco-2026-08-21)
# Roda: sweep de worktrees orfaos (protocolo anti-perda embutido), brew cleanup,
# uv cache prune, e alerta se disco < 50 GB livres.
LOG=/Users/andregusmandeoliveira/.claude/state/disk-maintenance.log
{
  echo "===== $(date '+%Y-%m-%d %H:%M') ====="
  bash /Users/andregusmandeoliveira/.claude/scripts/sweep-worktrees.sh apply 2>&1 | tail -3
  /opt/homebrew/bin/brew cleanup --prune=all 2>&1 | tail -1
  command -v uv >/dev/null 2>&1 && uv cache prune 2>&1 | tail -1
  free_gb=$(df -g /System/Volumes/Data | tail -1 | awk '{print $4}')
  echo "livre: ${free_gb} GB"
  if [ "${free_gb:-0}" -lt 50 ]; then
    /usr/bin/osascript -e "display notification \"Disco com apenas ${free_gb} GB livres — rodar limpeza (ESTRATEGIA-limpeza-disco)\" with title \"Disk Maintenance\"" 2>/dev/null
  fi
} >> "$LOG" 2>&1
tail -c 200000 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
