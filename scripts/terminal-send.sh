#!/usr/bin/env bash
# terminal-send.sh — envia mensagem a um papel, lendo a tela do DESTINO.
#
# F0b (docs/workspace/SPEC-metodologia-cockpit-2026-08-28.md §7.3 item 1):
# `--force` foi REMOVIDO — era o vetor do incidente D-064 (28/08): mensagem
# enviada a um terminal com AskUserQuestion aberto virou RESPOSTA a uma
# pergunta do dono. A checagem de MARCADOR (exit 4, "tela nao mostra
# basename/frente/titulo") tambem foi removida: ela recusava mensagem
# legitima e o texto SUMIA (nao ia para lugar nenhum) — 67 recusas/dia
# medidas (ev-harness §8). A UNICA guarda que sobrevive e a de MENU ABERTO:
# nunca pulavel, com retry (a pergunta do dono pode fechar sozinha em
# segundos) e falha REGISTRADA (nunca silenciosa) se continuar aberta.
set -euo pipefail

CMUX_BIN="${CMUX_BIN:-/Applications/cmux.app/Contents/Resources/bin/cmux}"
export CMUX_QUIET=1
T="$HOME/Claude/docs/ai-state/terminais"
REGISTRY="$T/registry.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG="$T/send.log"

usage() {
  cat <<'EOF'
Uso: terminal-send.sh <PAPEL> "<mensagem>"

Resolve o papel (terminal-resolve.sh -> workspace_uuid AO VIVO, nunca
`[selected]`/indice posicional), le a TELA DO DESTINO e recusa enviar
enquanto ela mostrar um menu de decisao aberto (AskUserQuestion/permissao/
selector) — reter-tenta ate 3x em ~60s e so entao falha, registrando em
docs/ai-state/terminais/send.log. Sem essa condicao, envia (send +
send-key enter) e confirma a entrega lendo a tela de novo.

Nao ha flag de bypass: a guarda de menu aberto NAO e pulavel (incidente
D-064, 28/08 — um Enter no lugar errado respondeu pelo dono). Mensagem
maior que TERMINAL_SEND_MAXLEN (default 600) e recusada — escreva o
conteudo em arquivo e mande so o path.
EOF
}

ARGS=()
for a in "$@"; do
  case "$a" in
    --help|-h) usage; exit 0 ;;
    -*)
      echo "RECUSADO: flag desconhecida '$a'. terminal-send.sh nao aceita mais --force" >&2
      echo "(removido em F0b — vetor do incidente D-064; ver SPEC-metodologia-cockpit-2026-08-28.md §7.3.1)." >&2
      exit 2
      ;;
    *) ARGS+=("$a") ;;
  esac
done

if [[ "${#ARGS[@]}" -lt 2 ]]; then usage; exit 2; fi
PAPEL="${ARGS[0]}"
MSG="${ARGS[1]}"

MAXLEN=${TERMINAL_SEND_MAXLEN:-600}
if [[ ${#MSG} -gt $MAXLEN && "${FORCE_LONG:-0}" != "1" ]]; then
  echo "RECUSADO: mensagem com ${#MSG} chars (> $MAXLEN). cmux send trunca texto longo — escreva o conteudo em arquivo (canal-append.sh LOG, PEDIDOS.md ou handoff) e mande so o path. FORCE_LONG=1 ignora." >&2
  exit 5
fi

[[ -f "$REGISTRY" ]] || { echo "registry nao encontrado: $REGISTRY" >&2; exit 1; }

RESOLVE_JSON=$("$SCRIPT_DIR/terminal-resolve.sh" "$PAPEL" 2>/dev/null) || {
  echo "ERRO: $PAPEL nao resolvido (fechado ou nao encontrado)" >&2
  exit 3
}

UUID=$(echo "$RESOLVE_JSON" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("workspace_uuid_live") or d.get("workspace_uuid") or "")')
SESSION_ID_ALVO=$(echo "$RESOLVE_JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("session_id") or "")')

[[ -z "$UUID" ]] && { echo "ERRO: workspace vivo nao encontrado para $PAPEL" >&2; exit 3; }

# --- GUARDA DE MENU ABERTO (unica guarda que sobrevive a F0b) ---
# Incidente 2026-08-28 (2x): mensagem enviada a um terminal com AskUserQuestion
# aberto virou RESPOSTA a pergunta do dono (D-064 respondida por engano, depois
# anulada). Duas fontes, checadas a cada tentativa: (a) padrao textual na tela
# do DESTINO (regex de menu/selecao) e (b) feed estruturado do cmux (question/
# permission/exit_plan pendente casando workstream_id -> session_id do papel).
# Retry: a pergunta do dono pode ser respondida por ELE nesses segundos — falhar
# na 1a tentativa perderia mensagem legitima por coincidencia de timing. Falha
# APOS os retries e SEMPRE registrada em send.log (nunca silenciosa, nunca vai
# para inbox — inbox foi descontinuada em F0a).
MENU_RE='Esc to cancel|Enter to (select|confirm|submit)|to select|↑/↓|\(Recommended\)|\(Recomendado\)|❯ *[0-9]+\.|Do you want to|Yes, and don|No, and tell'
MENU_RETRIES="${TERMINAL_SEND_MENU_RETRIES:-3}"
MENU_RETRY_SLEEP_S="${TERMINAL_SEND_MENU_RETRY_SLEEP_S:-20}"

feed_menu_reason() {
  # Imprime uma razao nao-vazia se o feed do cmux mostra question/permission/
  # exit_plan pendente para a sessao do papel; vazio se nao ha ou se o feed
  # estiver indisponivel (fail-open: nao inventa bloqueio por erro de leitura).
  [[ -z "$SESSION_ID_ALVO" ]] && return 0
  CMUX_BIN="$CMUX_BIN" SESSION_ID="$SESSION_ID_ALVO" python3 <<'PYEOF' 2>/dev/null
import json, os, subprocess
sid = os.environ.get("SESSION_ID") or ""
if not sid:
    raise SystemExit(0)
try:
    out = subprocess.run([os.environ["CMUX_BIN"], "rpc", "feed.list", "{}"],
                         capture_output=True, text=True, timeout=8).stdout
    d = json.loads(out)
except Exception:
    raise SystemExit(0)   # feed indisponivel: nao inventa bloqueio
items = d.get("items", d if isinstance(d, list) else [])
for i in items:
    if i.get("kind") not in ("question", "permission", "exit_plan"):
        continue
    if i.get("resolved_at") or i.get("status") in ("expired", "resolved", "answered"):
        continue
    ws = str(i.get("workstream_id") or i.get("request_id") or "")
    if sid and sid in ws:
        print(f'feed:{i.get("kind")}:{str(i.get("title") or "")[:40]}')
        break
PYEOF
}

RAZAO=""
TENTATIVA=1
while [[ "$TENTATIVA" -le "$MENU_RETRIES" ]]; do
  SCREEN=$("$CMUX_BIN" read-screen --workspace "$UUID" --lines 15 2>/dev/null || true)
  RAZAO=""
  if echo "$SCREEN" | grep -qE "$MENU_RE"; then
    RAZAO="tela:menu-visivel"
  else
    FEED_HIT="$(feed_menu_reason || true)"
    [[ -n "$FEED_HIT" ]] && RAZAO="$FEED_HIT"
  fi
  [[ -z "$RAZAO" ]] && break
  if [[ "$TENTATIVA" -lt "$MENU_RETRIES" ]]; then
    sleep "$MENU_RETRY_SLEEP_S"
  fi
  TENTATIVA=$((TENTATIVA + 1))
done

if [[ -n "$RAZAO" ]]; then
  mkdir -p "$T"
  printf '%s FALHA-MENU-ABERTO papel=%s uuid=%s razao=%s tentativas=%s\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$PAPEL" "$UUID" "$RAZAO" "$MENU_RETRIES" >> "$LOG"
  echo "RECUSADO: $PAPEL continua com MENU DE DECISAO aberto apos $MENU_RETRIES tentativas ($RAZAO)." >&2
  echo "Enviar agora faria seu texto virar a RESPOSTA dessa pergunta — ja aconteceu 2x em 28/08" >&2
  echo "(D-064 foi respondida por engano e precisou ser anulada). Esta guarda NAO tem bypass." >&2
  echo "Espere o dono responder e reenvie; falha registrada em $LOG." >&2
  exit 5
fi

"$CMUX_BIN" send --workspace "$UUID" "$MSG"
"$CMUX_BIN" send-key --workspace "$UUID" enter

# CONFIRMACAO DE ENTREGA — o script confirma, o chamador nao improvisa.
# Sem isto cada terminal inventava a propria verificacao com `read-screen`, e em
# 28/08 um deles: (a) endereçou por `workspace:1` (indice posicional — se alguem
# reordena as janelas, le a tela de OUTRO terminal e conclui "entregue"),
# (b) leu "Press up to edit queued messages" como prova de recebimento (essa linha
# diz que ha algo na fila de input, nao que a SUA mensagem esta la), e
# (c) afirmou "sem menu aberto, nada foi respondido por engano" tendo olhado 6
# linhas do fim da tela. Tres inferencias frageis empilhadas para declarar sucesso.
sleep 2
CONFIRMA=""
TELA_POS=$("$CMUX_BIN" read-screen --workspace "$UUID" --lines 25 2>/dev/null || true)
# procura uma fatia distintiva da mensagem (as primeiras palavras significativas)
AMOSTRA=$(printf '%s' "$MSG" | tr -s ' ' | cut -c1-40)
if [[ -n "$AMOSTRA" ]] && printf '%s' "$TELA_POS" | grep -qF -- "$AMOSTRA"; then
  CONFIRMA="confirmado: texto visivel na tela do destino"
elif printf '%s' "$TELA_POS" | grep -qiE "queued messages|esc to interrupt|working|thinking"; then
  CONFIRMA="ENFILEIRADO: destino ocupado; texto nao visivel ainda (nao e prova de leitura)"
else
  CONFIRMA="NAO CONFIRMADO: texto nao apareceu na tela em 2s — verifique antes de assumir entrega"
fi

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
echo "     $CONFIRMA"
