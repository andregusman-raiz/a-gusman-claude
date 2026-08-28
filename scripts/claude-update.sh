#!/bin/bash
# claude-update.sh — update do Claude Code serializado e verificado.
#
# POR QUE (2026-08-26): com ~12 sessoes vivas, cada uma rodava seu proprio auto-update
#   contra o MESMO prefix global do npm (4 checagens de `@latest` no mesmo minuto foram
#   observadas em ~/.npm/_logs). O updater instala em dois passos:
#     1) npm i -g @anthropic-ai/claude-code@X
#     2) npm i -g @anthropic-ai/claude-code-darwin-arm64@X --include optional
#   Entre eles o install fica SEM binario nativo (~60s). Todo teammate spawnado nessa
#   janela morre com status 1 e o pai nao percebe. Por isso o auto-updater esta desligado
#   (DISABLE_AUTOUPDATER=1 em ~/.claude/settings.json) e o update passa por aqui.
#
# USO:
#   claude-update.sh            # atualiza se houver versao nova, com lock
#   claude-update.sh --check    # so reporta versao local vs latest
#   claude-update.sh --repair   # nao muda versao: garante o binario nativo da versao atual
#   claude-update.sh --safe     # como o default, mas ABORTA se houver fan-out em andamento
#                               # (usado pelo LaunchAgent com.andregusman.claude-update)
#
# Sessoes JA abertas continuam na versao antiga (o processo tem o binario carregado);
# a nova versao vale para sessoes e teammates novos.

set -uo pipefail

PKG="@anthropic-ai/claude-code"
LOCK="/tmp/claude-update-$(id -u).lock"
MODE="${1:-}"

bin_path() {
  local root; root="$(npm root -g 2>/dev/null)" || return 1
  printf '%s/%s/bin/claude.exe' "$root" "$PKG"
}

# Executa o binario de verdade. Presenca de diretorio nao prova nada: o pacote nativo
# pode estar no nivel global OU aninhado dentro do proprio pacote.
bin_ok() {
  local b="$1" out
  [ -x "$b" ] || return 1
  out="$("$b" --version 2>&1)" || return 1
  printf '%s' "$out" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+'
}

local_version() {
  local b; b="$(bin_path)" || return 1
  "$b" --version 2>/dev/null | grep -oE '^[0-9]+\.[0-9]+\.[0-9]+'
}

pkg_version() {
  local root; root="$(npm root -g 2>/dev/null)" || return 1
  python3 -c "import json;print(json.load(open('$root/$PKG/package.json'))['version'])" 2>/dev/null
}

repair() {
  local b v
  b="$(bin_path)" || { echo "npm root -g falhou"; return 1; }
  if bin_ok "$b"; then echo "binario OK: $("$b" --version 2>&1 | head -1)"; return 0; fi
  v="$(pkg_version)" || { echo "nao li a versao do pacote instalado"; return 1; }
  echo "binario nativo ausente para $v — instalando..."
  npm install -g "${PKG}-darwin-arm64@${v}" --include optional >/dev/null 2>&1
  if bin_ok "$b"; then echo "reparado: $("$b" --version 2>&1 | head -1)"; return 0; fi
  echo "FALHOU. Tente: npm install -g ${PKG}@${v} --include optional"
  return 1
}

# --safe: nunca trocar o binario com teammate vivo. Um pane que ja nasceu sobrevive
# (o processo segurou o inode antigo), mas a sessao pai pode spawnar OUTRO no meio da
# troca — exatamente a janela que este script existe para fechar.
swarm_busy() {
  local t sock_dir s
  t="$(command -v tmux || echo /opt/homebrew/bin/tmux)"
  [ -x "$t" ] || return 1
  sock_dir="${TMUX_TMPDIR:-/private/tmp}/tmux-$(id -u)"
  [ -d "$sock_dir" ] || return 1
  for s in "$sock_dir"/claude-swarm-*; do
    [ -S "$s" ] || continue
    "$t" -L "${s##*/}" list-panes -a -F '#{pane_dead}' 2>/dev/null | grep -q '^0$' && return 0
  done
  return 1
}

ns() { date '+%F %T'; }

if [ "$MODE" = "--safe" ]; then
  SKIP_STAMP="$HOME/.claude/state/claude-update.first-skip"
  if swarm_busy; then
    # Escape de fome: com ~12 sessoes quase sempre ha ALGUM teammate vivo em algum
    # socket. Se o guard fosse absoluto, o update nunca aconteceria. Depois de 3 dias
    # adiando, prossegue — o preflight (PreToolUse Agent) e quem protege um spawn que
    # caia exatamente na troca.
    if [ -f "$SKIP_STAMP" ] && [ -n "$(find "$SKIP_STAMP" -maxdepth 0 -mtime +3 2>/dev/null)" ]; then
      echo "$(ns) fan-out ativo, mas adiando ha >3 dias — atualizando mesmo assim (preflight protege o spawn)"
      rm -f "$SKIP_STAMP"
    else
      [ -f "$SKIP_STAMP" ] || : >"$SKIP_STAMP"
      echo "$(ns) adiado: ha teammate(s) ativo(s) — nao troco binario durante fan-out"
      exit 0
    fi
  else
    rm -f "$SKIP_STAMP"
  fi
  MODE=""
fi

if [ "$MODE" = "--check" ]; then
  echo "local:  $(local_version || echo '(nao executa)')"
  echo "latest: $(npm view "${PKG}@latest" version --prefer-online 2>/dev/null)"
  exit 0
fi

# lock atomico via mkdir (macOS nao tem flock) — segura updates concorrentes de N sessoes
if ! mkdir "$LOCK" 2>/dev/null; then
  # lock com mais de 10min e restos de um processo morto
  if [ -n "$(find "$LOCK" -maxdepth 0 -mmin +10 2>/dev/null)" ]; then
    rmdir "$LOCK" 2>/dev/null && mkdir "$LOCK" 2>/dev/null || { echo "update em andamento noutra sessao"; exit 0; }
  else
    echo "update em andamento noutra sessao — nada a fazer"
    exit 0
  fi
fi
trap 'rmdir "$LOCK" 2>/dev/null' EXIT

if [ "$MODE" = "--repair" ]; then repair; exit $?; fi

LOCAL="$(local_version || true)"
LATEST="$(npm view "${PKG}@latest" version --prefer-online 2>/dev/null)"
[ -n "$LATEST" ] || { echo "nao consegui consultar o registry"; exit 1; }

if [ "$LOCAL" = "$LATEST" ]; then
  repair   # mesma versao, mas confirma que o binario executa
  exit $?
fi

echo "$(date '+%F %T') atualizando ${LOCAL:-?} -> ${LATEST}"
npm install -g "${PKG}@${LATEST}" >/dev/null 2>&1
repair
echo "sessoes abertas seguem na versao antiga; teammates novos ja usam a nova."
