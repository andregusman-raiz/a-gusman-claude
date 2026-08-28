#!/usr/bin/env bash
# terminal-send.sh — envia mensagem a um papel, com checagem de marcador de destino.
set -euo pipefail

CMUX_BIN="${CMUX_BIN:-/Applications/cmux.app/Contents/Resources/bin/cmux}"
export CMUX_QUIET=1
T="$HOME/Claude/docs/ai-state/terminais"
REGISTRY="$T/registry.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG="$T/send.log"

usage() {
  cat <<'EOF'
Uso: terminal-send.sh <PAPEL> "<mensagem>" [--force]

Resolve o papel, le a tela 2x com 1s de intervalo (cache stale do
read-screen), exige que a tela mostre um marcador de destino (basename
do cwd, a frente, ou o titulo do workspace) e que a ultima linha nao
pareca input parcialmente digitado, entao envia a mensagem (send +
send-key enter). Loga em docs/ai-state/terminais/send.log.

  --force   pula as duas checagens de seguranca (marcador + input parcial)
EOF
}

FORCE=0
ARGS=()
for a in "$@"; do
  case "$a" in
    --help|-h) usage; exit 0 ;;
    --force) FORCE=1 ;;
    *) ARGS+=("$a") ;;
  esac
done

if [[ "${#ARGS[@]}" -lt 2 ]]; then usage; exit 2; fi
PAPEL="${ARGS[0]}"
MSG="${ARGS[1]}"

MAXLEN=${TERMINAL_SEND_MAXLEN:-600}
if [[ ${#MSG} -gt $MAXLEN && "${FORCE_LONG:-0}" != "1" ]]; then
  echo "RECUSADO: mensagem com ${#MSG} chars (> $MAXLEN). cmux send trunca texto longo — escreva o conteudo em arquivo (ALERTAS.md/ORDENS.md/handoff) e mande so o path. FORCE_LONG=1 ignora." >&2
  exit 5
fi

[[ -f "$REGISTRY" ]] || { echo "registry nao encontrado: $REGISTRY" >&2; exit 1; }

RESOLVE_JSON=$("$SCRIPT_DIR/terminal-resolve.sh" "$PAPEL" 2>/dev/null) || {
  echo "ERRO: $PAPEL nao resolvido (fechado ou nao encontrado)" >&2
  exit 3
}

UUID=$(echo "$RESOLVE_JSON" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("workspace_uuid_live") or d.get("workspace_uuid") or "")')
CWD=$(echo "$RESOLVE_JSON" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("cwd") or "")')
FRENTE=$(echo "$RESOLVE_JSON" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("frente") or "")')
TITLE=$(echo "$RESOLVE_JSON" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("workspace_title") or "")')

[[ -z "$UUID" ]] && { echo "ERRO: workspace vivo nao encontrado para $PAPEL" >&2; exit 3; }

SCREEN1=$("$CMUX_BIN" read-screen --workspace "$UUID" --lines 15 2>/dev/null || true)
sleep 1
SCREEN2=$("$CMUX_BIN" read-screen --workspace "$UUID" --lines 15 2>/dev/null || true)
SCREEN="$SCREEN2"
[[ -z "$SCREEN" ]] && SCREEN="$SCREEN1"

if [[ "$FORCE" -eq 0 ]]; then
  BASENAME=$(basename "$CWD")
  MARK_OK=0
  if [[ -n "$BASENAME" ]] && echo "$SCREEN" | grep -qF -- "$BASENAME"; then MARK_OK=1; fi
  if [[ "$MARK_OK" -eq 0 && -n "$FRENTE" ]] && echo "$SCREEN" | grep -qF -- "$FRENTE"; then MARK_OK=1; fi
  if [[ "$MARK_OK" -eq 0 && -n "$TITLE" ]] && echo "$SCREEN" | grep -qF -- "$TITLE"; then MARK_OK=1; fi
  if [[ "$MARK_OK" -eq 0 ]]; then
    echo "RECUSADO: tela de $PAPEL nao mostra marcador de destino ($BASENAME / $FRENTE / $TITLE) — use --force" >&2
    exit 4
  fi

  LAST_LINE=$(echo "$SCREEN" | grep -v '^[[:space:]]*$' | tail -1 || true)
  # heuristica: prompt com texto colado logo apos '>' ou '|' sem espaco final
  # sugere input digitado e ainda nao enviado.
  if echo "$LAST_LINE" | grep -qE '^[[:space:]]*[>│|][[:space:]]*[^[:space:]]'; then
    echo "RECUSADO: ultima linha de $PAPEL parece input parcialmente digitado: '$LAST_LINE' — use --force" >&2
    exit 4
  fi
fi

# GUARD (28/08, incidente D-064): se a tela do destino mostra um MENU DE PERGUNTA
# (AskUserQuestion / permissao / seletor), um Enter aqui RESPONDE PELO DONO. Vale
# mesmo com --force. Nesse caso a mensagem vai para a inbox do papel e NAO e enviada.
MENU_RE='Esc to cancel|Enter to (select|confirm|submit)|to select|↑/↓|\(Recommended\)|\(Recomendado\)|❯ *[0-9]+\.|Do you want to|Yes, and don|No, and tell'
if echo "$SCREEN" | grep -qE "$MENU_RE"; then
  INBOX="$HOME/Claude/docs/ai-state/terminais/inbox-${PAPEL}"
  mkdir -p "$INBOX"
  F="$INBOX/$(date -u +%Y%m%dT%H%M%SZ)-from-${FROM:-desconhecido}.md"
  printf '%s\n' "# adiado $(date -u +%Y-%m-%dT%H:%MZ) — menu de decisao aberto em $PAPEL" "from: ${FROM:-desconhecido}" "" "$MSG" > "$F"
  echo "ADIADO: $PAPEL esta com MENU DE DECISAO aberto na tela (um Enter responderia pelo dono). Mensagem gravada em $F — o papel le a inbox no proximo ciclo; reenvie depois se for urgente." >&2
  exit 5
fi
"$CMUX_BIN" send --workspace "$UUID" "$MSG"
"$CMUX_BIN" send-key --workspace "$UUID" enter

# Quem MANDOU, nao so quem recebeu. Sem isso o log responde "o papel X foi
# avisado?" mas nao "quem pediu o que a quem, e quanto tempo esperou" — as
# perguntas que faltavam na auditoria de 27/08. $CMUX_WORKSPACE_ID e injetado
# pelo cmux em cada pane; vira papel pelo registry.
ORIGEM=$(REGISTRY_LIB_DIR="$SCRIPT_DIR" python3 - "$REGISTRY" "${CMUX_WORKSPACE_ID:-}" <<'PYEOF'
import os, sys
sys.path.insert(0, os.environ["REGISTRY_LIB_DIR"])
from registry_lib import load
registry_path, ws = sys.argv[1], sys.argv[2]
if not ws:
    print("externo"); raise SystemExit(0)
try:
    for papel, e in (load(registry_path).get("terminais") or {}).items():
        if e.get("workspace_uuid") == ws:
            print(papel); raise SystemExit(0)
except SystemExit:
    raise
except Exception:
    pass
print(f"nao-registrado:{ws[:8]}")
PYEOF
)
MSG_ID="${ORIGEM}-$(date -u +%Y%m%dT%H%M%SZ)-$$"

mkdir -p "$T"
printf '%s %s from=%s to=%s uuid=%s :: %s\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$MSG_ID" "$ORIGEM" "$PAPEL" "$UUID" "$MSG" >> "$LOG"
echo "OK: mensagem enviada para $PAPEL ($UUID) [msg_id=$MSG_ID]"
