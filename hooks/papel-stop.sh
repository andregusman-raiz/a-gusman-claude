#!/bin/bash
# papel-stop.sh — Stop hook: papel do cockpit sem handoff de HOJE apos escrever
# codigo nesta sessao -> BLOQUEIA (forca handoff ou terminal-close.sh). Quando
# nao bloqueia, reporta estado (handoff + decisoes abertas) a COMANDO — throttled
# (ver nota de design abaixo), nao a cada Stop.
#
# Cura achados 4/5/6 da auditoria 48h (2026-08-28):
#   4. 10/13 papeis abertos ha >12h so tem o handoff de ABERTURA (nunca escreveram
#      de novo). O bloqueio (a) forca pelo menos 1 handoff por dia de trabalho real.
#   5. 8/13 papeis (inclusive DE-COORD) nunca reportaram ao COMANDO. O reporte (b)
#      torna isso automatico em vez de depender de disciplina do papel.
#   6. Gate de handoff ao fechar era contornavel digitando /exit direto (sem passar
#      por terminal-close.sh). Este hook roda no Stop nativo do Claude Code — /exit
#      nao dispara Stop (encerra o processo), entao ele NAO fecha esse vetor
#      sozinho; a mitigacao real de (6) e o par bloqueio-diario (a) + reporte (b):
#      mesmo que a sessao morra sem handoff formal, o ULTIMO Stop antes de sumir
#      ja bloqueou/reportou o estado, entao COMANDO nao fica as escuras.
#
# Design (assuncao explicita, documentada — Stop dispara a CADA turno, nao so
# no fim da sessao):
#   (a) BLOQUEIA so quando falta o handoff de HOJE E a sessao (transcript
#       inteiro) teve pelo menos 1 Edit/Write/MultiEdit. Uma vez que o handoff
#       de hoje exista, para de bloquear pelo resto do dia (nao gera loop).
#   (b) o reporte a COMANDO (canal-append + terminal-send) e THROTTLED por um
#       estado local (.papel-stop-state/<PAPEL>.json): so reenvia se o
#       handoff/decisoes mudou desde o ultimo reporte OU se passou
#       PAPEL_STOP_REPORT_COOLDOWN_MIN (default 60min). Sem isso, reportar em
#       TODO Stop (que dispara a cada resposta do agente) spammaria COMANDO
#       dezenas de vezes por sessao — o oposto do que a auditoria pediu.
#
# Papel COMANDO/RESUMO: nunca bloqueiam (sao loops que nao "fecham" no sentido
# de handoff diario) — so recebem o AVISO em stderr; COMANDO tambem nunca
# reporta a si mesmo.
#
# BLOCKING (exit 2) so no caso (a) para papeis != COMANDO/RESUMO.
# Bypass: PAPEL_STOP_DISABLED=1 | limite de horas: PAPEL_STOP_MAX_H (default 8)
#
# A4 (2026-08-28, unica excecao ao "nao mexer neste arquivo" — suporte a esta
# env, mais nada): PAPEL_STOP_SESSIONEND=1 marca que este Stop foi disparado
# pelo hook SessionEnd (sessao encerrando de verdade, nao so fim de turno).
# Sob essa env: NUNCA faz exit 2 (bloquear no fim e' inutil — a sessao ja
# esta saindo) e o reporte (b) dispara INCONDICIONALMENTE, ignorando o
# throttle de 60min (ultima chance de avisar COMANDO antes da sessao sumir).
#
# A5 (2026-08-28, bug em producao reportado pelo proprio RESUMO): o reporte
# (b) rotulava TODO Stop throttled como "OFFLINE:", mas Stop dispara a CADA
# TURNO (nao no fim da sessao) — RESUMO/DE-COORD/COMANDO/VALIDACAO-DATA
# apareceram "OFFLINE" em ALERTAS.md estando VIVOS, um fato falso num canal
# de decisao. Fix semantico: rotulo passa a ser "TICK:" (reporte de estado,
# sessao segue viva) sempre que SESSIONEND!=1. "OFFLINE:" fica RESERVADO
# para os 2 caminhos que de fato encerram: PAPEL_STOP_SESSIONEND=1 (acima) e
# terminal-close.sh (fora deste arquivo).
set -uo pipefail
[ "${PAPEL_STOP_DISABLED:-0}" = "1" ] && exit 0

SESSIONEND="${PAPEL_STOP_SESSIONEND:-0}"
if [ "$SESSIONEND" = "1" ]; then
  REPORT_LABEL="OFFLINE"
  REPORT_VERB="encerrou (SessionEnd)"
else
  REPORT_LABEL="TICK"
  REPORT_VERB="reporta (tick, sessao segue viva)"
fi

# T e' overridable (PAPEL_TERMINAIS_DIR) so para permitir teste isolado com
# registry/estado sinteticos, sem tocar docs/ai-state/terminais real — default
# inalterado em producao.
T="${PAPEL_TERMINAIS_DIR:-$HOME/Claude/docs/ai-state/terminais}"
REGISTRY="$T/registry.json"
# Idem para os scripts chamados (canal-append.sh/terminal-send.sh) — permite
# apontar para stubs em teste isolado, sem risco de mandar mensagem real a
# um terminal do dono. Default inalterado em producao.
SCRIPTS="${PAPEL_STOP_SCRIPTS_DIR:-$HOME/Claude/.claude/scripts}"

[ -f "$REGISTRY" ] || exit 0
WS="${CMUX_WORKSPACE_ID:-}"
[ -z "$WS" ] && exit 0

PAYLOAD="$(cat)"
STOP_ACTIVE="$(printf '%s' "$PAYLOAD" | python3 -c 'import json,sys
try:
    d=json.load(sys.stdin); print("1" if d.get("stop_hook_active") else "0")
except Exception:
    print("0")' 2>/dev/null)"
[ "$STOP_ACTIVE" = "1" ] && exit 0

TRANSCRIPT="$(printf '%s' "$PAYLOAD" | python3 -c 'import json,sys
try:
    print(json.load(sys.stdin).get("transcript_path","") or "")
except Exception:
    print("")' 2>/dev/null)"

INFO="$(REGISTRY="$REGISTRY" WS="$WS" python3 <<'PYEOF' 2>/dev/null
import json, os
try:
    reg = json.load(open(os.environ["REGISTRY"]))
except Exception:
    print(""); raise SystemExit(0)
ws = os.environ["WS"]
for papel, e in (reg.get("terminais") or {}).items():
    if e.get("workspace_uuid") == ws:
        print(papel)
        raise SystemExit(0)
print("")
PYEOF
)"
[ -z "$INFO" ] && exit 0
PAPEL="$INFO"

HOJE="$(date +%F)"
HANDOFF_PATH="$T/handoffs/$PAPEL/$HOJE.md"
HANDOFF_REL="docs/ai-state/terminais/handoffs/$PAPEL/$HOJE.md"

WROTE=0
if [ -n "$TRANSCRIPT" ] && [ -f "$TRANSCRIPT" ]; then
  N=$(grep -oE '"name"[[:space:]]*:[[:space:]]*"(Edit|Write|MultiEdit)"' "$TRANSCRIPT" 2>/dev/null | wc -l | tr -d ' ')
  [ -n "$N" ] && [ "$N" -gt 0 ] && WROTE=1
fi

HANDOFF_EXISTS=0
[ -f "$HANDOFF_PATH" ] && HANDOFF_EXISTS=1

IS_LOOP_PAPEL=0
[ "$PAPEL" = "COMANDO" ] && IS_LOOP_PAPEL=1
[ "$PAPEL" = "RESUMO" ] && IS_LOOP_PAPEL=1

# IDADE DA SESSAO — o bloqueio e por handoff VENCIDO, nao por "editou uma vez".
# Sem isto o hook bloqueava TODO turno logo apos o primeiro Edit (Stop dispara por
# turno, nao no fim da sessao): papel tier 1 nao conseguia encerrar turno nenhum ate
# escrever handoff. A politica escrita (CONDUTA.md) sempre foi ">8h so com handoff de
# abertura" — o codigo e que divergia. Medimos a idade pela 1a escrita do transcript.
PAPEL_STOP_MAX_H="${PAPEL_STOP_MAX_H:-8}"
SESSAO_H=0
if [ -n "$TRANSCRIPT" ] && [ -f "$TRANSCRIPT" ]; then
  MT=$(stat -f %m "$TRANSCRIPT" 2>/dev/null || echo 0)
  BT=$(stat -f %B "$TRANSCRIPT" 2>/dev/null || echo "$MT")
  [ "$BT" -gt 0 ] && SESSAO_H=$(( ( $(date +%s) - BT ) / 3600 ))
fi
VENCIDO=0
[ "$SESSAO_H" -ge "$PAPEL_STOP_MAX_H" ] && VENCIDO=1

if [ "$HANDOFF_EXISTS" -eq 0 ] && [ "$WROTE" -eq 1 ] && [ "$VENCIDO" -eq 0 ]; then
  echo "[papel-stop] $PAPEL sem handoff de hoje ($HANDOFF_REL); sessao com ${SESSAO_H}h (bloqueio a partir de ${PAPEL_STOP_MAX_H}h). Escreva no proximo marco." >&2
fi

if [ "$HANDOFF_EXISTS" -eq 0 ] && [ "$WROTE" -eq 1 ] && [ "$VENCIDO" -eq 1 ]; then
  if [ "$IS_LOOP_PAPEL" -eq 1 ]; then
    echo "[papel-stop] AVISO: $PAPEL ainda sem handoff de hoje ($HANDOFF_REL) apos escrita nesta sessao. Papeis loop (COMANDO/RESUMO) nao bloqueiam, mas escreva ao fechar de verdade." >&2
  else
    cat >&2 <<EOF
BLOQUEADO pelo papel-stop.sh: $PAPEL editou/escreveu arquivos nesta sessao e
nao ha handoff de HOJE — e a sessao ja tem ${SESSAO_H}h (limite ${PAPEL_STOP_MAX_H}h).

Escreva agora em:
  $HANDOFF_PATH
seguindo docs/ai-state/terminais/handoffs/TEMPLATE.md — ou encerre de forma
governada (marca fechado no registry e pede o handoff por voce):
  bash ~/.claude/scripts/terminal-close.sh $PAPEL

Depois de escrito, o proximo Stop passa livre pelo resto do dia.
Bypass de emergencia: PAPEL_STOP_DISABLED=1
EOF
    if [ "$SESSIONEND" = "1" ]; then
      # A4: SessionEnd nao bloqueia (a sessao ja esta encerrando — exit 2
      # aqui nao teria efeito util nenhum). O reporte (b) abaixo dispara
      # incondicionalmente e carrega esse mesmo estado a COMANDO.
      echo "[papel-stop] SessionEnd: nao bloqueia (sessao ja encerrando) — reporte a COMANDO disparado incondicionalmente abaixo." >&2
    else
      exit 2
    fi
  fi
fi

# --- (b) reporte throttled a COMANDO (nao roda quando bloqueou acima) ---
DECISOES_JSON="$T/decisoes.json"
ABERTAS="$(DECISOES_JSON="$DECISOES_JSON" PAPEL="$PAPEL" python3 <<'PYEOF' 2>/dev/null
import json, os
try:
    d = json.load(open(os.environ["DECISOES_JSON"]))
except Exception:
    print("n/d"); raise SystemExit(0)
papel = os.environ["PAPEL"]
ids = [x["id"] for x in d.get("decisoes", [])
       if x.get("estado") == "aberta" and papel in (x.get("origem") or "")]
print(",".join(ids) if ids else "nenhuma")
PYEOF
)"
[ -z "$ABERTAS" ] && ABERTAS="n/d"

HANDOFF_DISPLAY="nenhum"
[ "$HANDOFF_EXISTS" -eq 1 ] && HANDOFF_DISPLAY="$HANDOFF_REL"

STATE_DIR="$T/.papel-stop-state"
mkdir -p "$STATE_DIR" 2>/dev/null
STATE_FILE="$STATE_DIR/${PAPEL}.json"
COOLDOWN_MIN="${PAPEL_STOP_REPORT_COOLDOWN_MIN:-60}"

SHOULD_REPORT="$(STATE_FILE="$STATE_FILE" HANDOFF="$HANDOFF_DISPLAY" ABERTAS="$ABERTAS" COOLDOWN_MIN="$COOLDOWN_MIN" python3 <<'PYEOF' 2>/dev/null
import json, os, time
state_file = os.environ["STATE_FILE"]
handoff = os.environ["HANDOFF"]
abertas = os.environ["ABERTAS"]
cooldown_min = float(os.environ["COOLDOWN_MIN"])
try:
    prev = json.load(open(state_file))
except Exception:
    prev = {}
now = time.time()
changed = prev.get("handoff") != handoff or prev.get("abertas") != abertas
age_min = (now - prev.get("ts", 0)) / 60.0 if prev.get("ts") else 1e9
should = changed or age_min >= cooldown_min
if should:
    tmp = state_file + ".tmp"
    with open(tmp, "w") as f:
        json.dump({"handoff": handoff, "abertas": abertas, "ts": now}, f)
    os.replace(tmp, state_file)
print("1" if should else "0")
PYEOF
)"

# A4: SessionEnd dispara o reporte INCONDICIONALMENTE (ignora throttle) —
# ultima chance de avisar COMANDO antes da sessao sumir de vez.
# A5: rotulo vem de REPORT_LABEL/REPORT_VERB (definidos no topo do arquivo)
# — "TICK" (sessao segue viva) em todo Stop normal, "OFFLINE" reservado a
# este SessionEnd (ou a terminal-close.sh, fora deste arquivo).
if [ "$SHOULD_REPORT" = "1" ] || [ "$SESSIONEND" = "1" ]; then
  if [ -x "$SCRIPTS/canal-append.sh" ]; then
    bash "$SCRIPTS/canal-append.sh" ALERTAS "${REPORT_LABEL}: handoff ${HANDOFF_DISPLAY}; decisoes abertas de origem ${PAPEL}: ${ABERTAS}" --papel "$PAPEL" --tipo INFO >/dev/null 2>&1 || true
  fi
  if [ "$PAPEL" != "COMANDO" ] && [ -x "$SCRIPTS/terminal-send.sh" ]; then
    bash "$SCRIPTS/terminal-send.sh" COMANDO "${PAPEL} ${REPORT_VERB}: handoff ${HANDOFF_DISPLAY}. Decisoes abertas: ${ABERTAS}" >/dev/null 2>&1 || true
  fi
fi

exit 0
