#!/usr/bin/env bash
# terminal-close.sh — pede handoff de encerramento e marca o papel como fechado.
# NUNCA mata processo.
set -euo pipefail

CMUX_BIN="${CMUX_BIN:-/Applications/cmux.app/Contents/Resources/bin/cmux}"
export CMUX_QUIET=1
T="$HOME/Claude/docs/ai-state/terminais"
REGISTRY="$T/registry.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat <<'EOF'
Uso: terminal-close.sh <PAPEL> [--timeout-min N]

Pede o handoff de encerramento ao terminal do papel (seguindo
docs/ai-state/terminais/handoffs/TEMPLATE.md), espera o arquivo aparecer
(poll a cada 15s ate N minutos, default 10), e marca estado=fechado +
workspace_uuid=null no registry. NUNCA mata processo. Se o timeout
expirar, sai com codigo 4 e o papel permanece 'aberto' no registry (nao
mascara o problema).
EOF
}

TIMEOUT_MIN=10
PAPEL=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h) usage; exit 0 ;;
    --timeout-min) TIMEOUT_MIN="$2"; shift ;;
    *) PAPEL="$1" ;;
  esac
  shift
done

if [[ -z "$PAPEL" ]]; then usage; exit 2; fi
if [[ ! -f "$REGISTRY" ]]; then echo "registry nao encontrado: $REGISTRY" >&2; exit 1; fi

RESOLVE_JSON=$("$SCRIPT_DIR/terminal-resolve.sh" "$PAPEL" 2>/dev/null) || {
  echo "ERRO: nao foi possivel resolver $PAPEL (workspace nao encontrado ou ja fechado)" >&2
  exit 3
}

UUID=$(echo "$RESOLVE_JSON" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("workspace_uuid_live") or d.get("workspace_uuid") or "")')
HANDOFF_REL=$(echo "$RESOLVE_JSON" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("handoff") or "")')

if [[ -z "$UUID" ]]; then
  echo "ERRO: workspace vivo nao encontrado para $PAPEL" >&2
  exit 3
fi
if [[ -z "$HANDOFF_REL" ]]; then
  echo "ERRO: registry sem campo 'handoff' para $PAPEL" >&2
  exit 1
fi

TODAY="$(date +%F)"
HANDOFF_REL_TODAY="${HANDOFF_REL/2026-08-27/$TODAY}"
HANDOFF_PATH="$HOME/Claude/$HANDOFF_REL_TODAY"
mkdir -p "$(dirname "$HANDOFF_PATH")"

MSG="Escreva agora o handoff de encerramento em $HANDOFF_PATH seguindo docs/ai-state/terminais/handoffs/TEMPLATE.md. A ULTIMA LINHA DO ARQUIVO deve ser exatamente: HANDOFF OK — e so escreva essa linha quando o handoff estiver completo (sem secao vazia, decisoes ja copiadas para DECISOES-PENDENTES.md)."

echo "enviando pedido de handoff para $PAPEL ($UUID): $HANDOFF_PATH"
"$CMUX_BIN" send --workspace "$UUID" "$MSG"
"$CMUX_BIN" send-key --workspace "$UUID" enter

# O arquivo APARECE no primeiro write do agente, muito antes de ele terminar de
# escrever (as decisoes pendentes sao a ultima secao). Fechar em `-f` puro mandava
# /exit no meio da escrita. Dois criterios de completude, nessa ordem:
#   forte  — ultima linha "HANDOFF OK" + mtime estavel por HANDOFF_SETTLE_S
#   fraco  — sem marcador, mas mtime parado ha HANDOFF_QUIET_S (aceita e AVISA)
# O fraco existe porque a adocao do marcador era 0/20 em 27/08; sem ele, ligar o
# gate estrito faria todo close expirar. Aceitacao por quiescencia e sempre dita
# em voz alta na saida — nao e silenciosa.
HANDOFF_SETTLE_S="${HANDOFF_SETTLE_S:-10}"
HANDOFF_QUIET_S="${HANDOFF_QUIET_S:-90}"
DEADLINE=$(( $(date +%s) + TIMEOUT_MIN*60 ))
WARNED_MARKER=0
while true; do
  if [[ -f "$HANDOFF_PATH" ]]; then
    NOW=$(date +%s)
    # stat falhando (arquivo sumiu entre o -f e aqui) NAO pode virar quiescencia:
    # com MTIME=0 o QUIET vira ~1.8bi e o handoff seria "aceito" na hora. Fail para
    # o lado de "ainda nao pronto" — o deadline continua sendo a saida.
    if MTIME=$(stat -f %m "$HANDOFF_PATH" 2>/dev/null); then
      QUIET=$(( NOW - MTIME ))
    else
      QUIET=-1
    fi
    if tail -n 3 "$HANDOFF_PATH" | grep -q '^[[:space:]]*HANDOFF OK[[:space:]]*$'; then
      if [[ "$QUIET" -ge "$HANDOFF_SETTLE_S" ]]; then
        echo "handoff completo (marcador HANDOFF OK, mtime parado ha ${QUIET}s): $HANDOFF_PATH"
        break
      fi
      if [[ "$QUIET" -lt 0 ]]; then
        echo "marcador presente, mas nao consegui ler o mtime do handoff — aguardando..."
      else
        echo "marcador presente, aguardando mtime estabilizar (${QUIET}s/${HANDOFF_SETTLE_S}s)..."
      fi
    elif [[ "$QUIET" -ge "$HANDOFF_QUIET_S" ]]; then
      echo "AVISO: handoff SEM marcador 'HANDOFF OK', aceito por quiescencia (mtime parado ha ${QUIET}s)." >&2
      echo "AVISO: confira $HANDOFF_PATH antes de confiar no estado registrado." >&2
      break
    else
      if [[ "$WARNED_MARKER" -eq 0 ]]; then
        echo "handoff existe mas ainda sem 'HANDOFF OK' na ultima linha — aguardando..."
        WARNED_MARKER=1
      fi
    fi
  fi
  if [[ $(date +%s) -ge $DEADLINE ]]; then
    echo "TIMEOUT: handoff nao ficou completo em ${TIMEOUT_MIN}min ($HANDOFF_PATH). $PAPEL permanece 'aberto' no registry." >&2
    exit 4
  fi
  sleep 15
done

REGISTRY_LIB_DIR="$SCRIPT_DIR" python3 - "$REGISTRY" "$PAPEL" <<'PYEOF'
import os, sys
sys.path.insert(0, os.environ["REGISTRY_LIB_DIR"])
from registry_lib import mutate
registry_path, papel = sys.argv[1], sys.argv[2]

def close_papel(reg):
    entry = reg["terminais"][papel]
    entry["estado"] = "fechado"
    entry["workspace_uuid"] = None

try:
    mutate(registry_path, close_papel)
except Exception as e:
    # Sem try/except o traceback cru mata o script sob `set -e` e o operador nao
    # sabe em que ponto parou. Falhar aqui deixa o papel 'aberto' — que e o estado
    # seguro (nao mascara), mas precisa ser DITO.
    print(f"ERRO: handoff esta pronto, mas nao consegui marcar {papel} como fechado "
          f"no registry: {e}\nO papel permanece 'aberto'. Reexecute terminal-close.sh "
          f"(o handoff ja existe, o poll passa direto).", file=sys.stderr)
    raise SystemExit(5)
PYEOF


# --- encerrar sessao do agente (graceful) e fechar workspace ---
AGENT=$(echo "$RESOLVE_JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("agent",""))')
if [[ "${KEEP_WORKSPACE:-0}" != "1" && -n "$UUID" ]]; then
  if [[ "$AGENT" == "codex" ]]; then EXITCMD="/quit"; else EXITCMD="/exit"; fi
  "$CMUX_BIN" send --workspace "$UUID" "$EXITCMD" >/dev/null 2>&1 && "$CMUX_BIN" send-key --workspace "$UUID" enter >/dev/null 2>&1
  for i in $(seq 1 12); do
    sleep 5
    SCREEN=$("$CMUX_BIN" read-screen --workspace "$UUID" --lines 4 2>/dev/null || true)
    if ! echo "$SCREEN" | grep -qE "bypass permissions|Ask Codex|thinking|Working"; then break; fi
  done
  "$CMUX_BIN" workspace close "$UUID" >/dev/null 2>&1 && echo "workspace fechado ($UUID)" || echo "AVISO: nao fechei o workspace $UUID (feche manualmente; KEEP_WORKSPACE=1 pula)"
fi
echo "OK: $PAPEL marcado como fechado no registry."
