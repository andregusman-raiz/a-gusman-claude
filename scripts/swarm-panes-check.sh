#!/bin/bash
# swarm-panes-check.sh — detecta teammates mortos que o terminal pai ainda mostra "rodando".
#
# POR QUE: Agent nomeado roda num pane tmux do socket claude-swarm-<pid-pai>. Se o pane
#   morre (status != 0), o Claude Code pai NAO e notificado: o teammate continua listado
#   com o cronometro subindo. Nenhum hook/watchdog do harness olhava pane_dead ate aqui.
#
# USO:
#   swarm-panes-check.sh              # relatorio de todos os sockets
#   swarm-panes-check.sh --quiet      # so imprime se achar morto (para health check)
#   swarm-panes-check.sh --clean      # remove sockets orfaos (sem servidor tmux vivo)
#
# Exit: 0 = nenhum teammate morto | 1 = achou morto(s)

set -uo pipefail

TMUX_BIN="$(command -v tmux || echo /opt/homebrew/bin/tmux)"
SOCK_DIR="${TMUX_TMPDIR:-/private/tmp}/tmux-$(id -u)"
QUIET=0; CLEAN=0
for a in "$@"; do
  case "$a" in
    --quiet) QUIET=1 ;;
    --clean) CLEAN=1 ;;
  esac
done

[ -x "$TMUX_BIN" ] || exit 0
[ -d "$SOCK_DIR" ] || exit 0

found=0
report=""
orphans=""

for sock in "$SOCK_DIR"/claude-swarm-*; do
  [ -S "$sock" ] || continue
  s="${sock##*/}"
  pai="${s##*-}"

  if ! "$TMUX_BIN" -L "$s" has-session 2>/dev/null; then
    # socket sem servidor: so e lixo se o processo pai tambem morreu
    if ! ps -p "$pai" -o comm= >/dev/null 2>&1; then
      orphans="$orphans$sock"$'\n'
    fi
    continue
  fi

  while IFS='|' read -r dead cmd; do
    [ "$dead" = "1" ] || continue
    nome=$(printf '%s' "$cmd" | sed -n 's/.*--agent-name \([A-Za-z0-9_-]*\).*/\1/p')
    [ -n "$nome" ] || nome="(sem nome)"
    found=$((found + 1))
    report="${report}  MORTO  ${nome}  (sessao pai pid=${pai}, socket ${s})"$'\n'
  done < <("$TMUX_BIN" -L "$s" list-panes -a -F '#{pane_dead}|#{pane_start_command}' 2>/dev/null)
done

if [ "$CLEAN" = "1" ] && [ -n "$orphans" ]; then
  printf '%s' "$orphans" | while read -r o; do [ -n "$o" ] && rm -f "$o"; done
  [ "$QUIET" = "1" ] || echo "sockets orfaos removidos: $(printf '%s' "$orphans" | grep -c .)"
fi

if [ "$found" -eq 0 ]; then
  [ "$QUIET" = "1" ] || echo "swarm-panes-check: nenhum teammate morto."
  exit 0
fi

echo "swarm-panes-check: ${found} teammate(s) MORTO(S) — o pai ainda os conta como rodando:"
printf '%s' "$report"
echo ""
echo "Esses agents nao voltam sozinhos: re-spawne na sessao pai."
echo "Ver a tela do erro: ${TMUX_BIN} -L <socket> capture-pane -p -t <pane>"
exit 1
