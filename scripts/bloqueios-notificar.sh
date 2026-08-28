#!/usr/bin/env bash
# bloqueios-notificar.sh — varre bloqueios ATIVOS (decisoes.json e registry.json)
# e cutuca quem esta segurando, sem exigir que alguem lembre de fazer isso.
# Contrato: docs/ai-state/terminais (reforma de pendencias, 2026-08-28, ITEM 2).
#
# Duas fontes, dois formatos de bloqueio:
#
#   1) decisoes.json, campo estruturado `bloqueio: {papel, motivo, desde}`
#      (gravado por decisao-ref.sh --bloqueado-por). "desde" e ISO real ->
#      da pra calcular idade em horas com confianca.
#      -> terminal-send.sh <papel> "D-nnn esta bloqueada por voce ha Nh: ..."
#         no maximo 1x a cada 6h por par (papel, decisao).
#      -> bloqueio com >48h desde `desde` TAMBEM vira linha em ALERTAS.md via
#         canal-append.sh --papel SYNC --tipo ALERTA (1x por "episodio" —
#         assinatura papel+motivo+desde — re-alerta so apos 24h).
#
#   2) registry.json, campo `bloqueado_por` (prosa legada, ex: "sem atuacao
#      ate segunda ordem do dono (27/08 22:20)") ou o novo `bloqueado_por_papel`
#      (opcional, papel explicito). Sem `bloqueado_por_papel`, tenta extrair um
#      papel CONHECIDO da prosa (fronteira de palavra); se a prosa nao cita
#      nenhum papel do registry (caso comum: bloqueado pelo "dono", que nao e
#      um papel registrado), trata como bloqueio SEM DESTINATARIO — nao envia
#      nada (nao ha timestamp estruturado aqui, entao esta fonte NAO gera a
#      extensao de ALERTA >48h — so a fonte 1, que tem `desde` confiavel).
#      -> terminal-send.sh <papel_resolvido> "<papel bloqueado> esta bloqueado
#         por voce: ..." no maximo 1x a cada 6h por par (blocker, bloqueado).
#
# Estado (dedup/cooldown) no MESMO docs/ai-state/terminais/.roteamento-state.json
# que canal-append.sh usa para o roteamento lateral (ITEM 1) — chave "bloqueios",
# nao colide com a chave "nudges". Toda escrita via registry_lib.mutate.
#
# So leitura sobre decisoes.json/registry.json (nunca muda `bloqueio`/`estado`
# de nada — quem decide isso e decisao-ref.sh/decisao-decidir.sh). Idempotente:
# rodar 2x seguidas sem o cooldown ter expirado nao manda mensagem 2x.
set -euo pipefail

T="${DECISOES_DIR:-${PAPEL_TERMINAIS_DIR:-$HOME/Claude/docs/ai-state/terminais}}"
Q="${DE_PR_QUEUE_DIR:-$HOME/Claude/docs/ai-state/de-pr-queue}"
DECISOES_JSON="$T/decisoes.json"
REGISTRY="$T/registry.json"
STATE="$T/.roteamento-state.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERMINAL_SEND_BIN="${TERMINAL_SEND_BIN:-$SCRIPT_DIR/terminal-send.sh}"
CANAL_APPEND_BIN="${CANAL_APPEND_BIN:-$SCRIPT_DIR/canal-append.sh}"

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'EOF'
Uso: bloqueios-notificar.sh

Sem argumentos. Le decisoes.json (campo `bloqueio`) e registry.json (campo
`bloqueado_por_papel` ou `bloqueado_por` prosa) e manda `terminal-send.sh
<PAPEL bloqueador>` para cada bloqueio ATIVO, no maximo 1x a cada 6h por
par. Bloqueio de decisao com mais de 48h desde `bloqueio.desde` tambem gera
uma linha em ALERTAS.md via canal-append.sh --papel SYNC --tipo ALERTA
(1x por episodio; re-alerta so apos 24h). So leitura sobre as duas fontes;
escrita atomica (registry_lib.mutate) so no proprio
docs/ai-state/terminais/.roteamento-state.json.

Variaveis: DECISOES_DIR/PAPEL_TERMINAIS_DIR (default
docs/ai-state/terminais), DE_PR_QUEUE_DIR (default docs/ai-state/de-pr-queue),
TERMINAL_SEND_BIN, CANAL_APPEND_BIN (overrides para teste — nunca aponte
para os scripts reais dentro de um teste que nao deva mandar mensagem real).
EOF
  exit 0
fi

if [[ ! -f "$DECISOES_JSON" && ! -f "$REGISTRY" ]]; then
  echo "AVISO: nem decisoes.json nem registry.json encontrados — nada a notificar" >&2
  exit 0
fi

PLANO=$(REGISTRY_LIB_DIR="$SCRIPT_DIR" DECISOES_JSON="$DECISOES_JSON" REGISTRY="$REGISTRY" \
  STATE="$STATE" python3 <<'PYEOF'
import hashlib
import json
import os
import re
import sys
import time

sys.path.insert(0, os.environ["REGISTRY_LIB_DIR"])
from registry_lib import mutate, RegistryLockTimeout  # noqa: E402

DECISOES_JSON = os.environ["DECISOES_JSON"]
REGISTRY = os.environ["REGISTRY"]
STATE = os.environ["STATE"]

NUDGE_COOLDOWN_S = 6 * 3600
ALERTA_COOLDOWN_S = 24 * 3600
ALERTA_LIMIAR_H = 48


def safe_load(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def parse_iso(raw):
    if not raw:
        return None
    s = raw.strip()
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    try:
        import datetime
        dt = datetime.datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=datetime.timezone.utc)
        return dt.timestamp()
    except Exception:
        return None


now = time.time()

reg = safe_load(REGISTRY) or {}
terminais = reg.get("terminais") or {}
papeis_conhecidos = sorted(terminais.keys(), key=len, reverse=True)


def extrai_papel(texto, excluir=None):
    if not texto:
        return None
    for papel in papeis_conhecidos:
        if papel == excluir:
            continue
        if re.search(r'\b' + re.escape(papel) + r'\b', texto):
            return papel
    return None


# Bootstrap do state file — mesmo schema/bootstrap do canal-append.sh
# (ITEM 1); ver comentario la para o motivo do O_CREAT|O_EXCL.
if not os.path.exists(STATE):
    try:
        fd = os.open(STATE, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o644)
        with os.fdopen(fd, "w") as f:
            json.dump({
                "_schema": (
                    "docs/ai-state/terminais/.roteamento-state.json — dedup/cooldown "
                    "de roteamento lateral (canal-append.sh ITEM 1) e notificacao de "
                    "bloqueios (bloqueios-notificar.sh ITEM 2)."
                ),
                "nudges": {},
                "bloqueios": {},
            }, f, ensure_ascii=False, indent=2)
            f.write("\n")
    except FileExistsError:
        pass


def pode_mandar(key, cooldown_s):
    resultado = {}

    def claim(state, _key=key, _cooldown=cooldown_s, _out=resultado):
        bloqueios = state.setdefault("bloqueios", {})
        rec = bloqueios.get(_key)
        if rec and (now - float(rec.get("ts_epoch", 0))) < _cooldown:
            _out["send"] = False
            return
        bloqueios[_key] = {
            "ts_epoch": now,
            "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now)),
        }
        _out["send"] = True

    try:
        mutate(STATE, claim)
    except RegistryLockTimeout:
        return False
    return resultado.get("send", False)


plano = []  # linhas de saida (tab-separated)

# --- fonte 1: decisoes.json, campo bloqueio {papel, motivo, desde} ---
decisoes_doc = safe_load(DECISOES_JSON) or {}
for d in decisoes_doc.get("decisoes") or []:
    bloqueio = d.get("bloqueio")
    if not bloqueio or not bloqueio.get("papel"):
        continue
    papel_bloqueador = bloqueio["papel"]
    if papel_bloqueador not in terminais:
        continue  # papel some do registry depois do bloqueio gravado — nao insiste
    desde_epoch = parse_iso(bloqueio.get("desde"))
    idade_h = (now - desde_epoch) / 3600 if desde_epoch else None

    key_nudge = f"decisao:{papel_bloqueador}:{d['id']}"
    if pode_mandar(key_nudge, NUDGE_COOLDOWN_S):
        idade_txt = f"{idade_h:.0f}h" if idade_h is not None else "?h"
        titulo80 = (d.get("titulo") or "")[:80]
        msg = f"{d['id']} esta bloqueada por voce ha {idade_txt}: {titulo80} — resolver ou responder em ALERTAS"
        plano.append(("NUDGE", papel_bloqueador, msg))

    if idade_h is not None and idade_h > ALERTA_LIMIAR_H:
        sig = hashlib.sha1(
            f"{papel_bloqueador}|{bloqueio.get('motivo','')}|{bloqueio.get('desde','')}".encode("utf-8")
        ).hexdigest()[:12]
        key_alerta = f"decisao-alerta48h:{d['id']}:{sig}"
        if pode_mandar(key_alerta, ALERTA_COOLDOWN_S):
            titulo80 = (d.get("titulo") or "")[:80]
            texto = f"{d['id']} bloqueada ha {idade_h:.0f}h por {papel_bloqueador} sem resolucao: {titulo80}"
            # dest="-" (placeholder, nao ""): bash `read` com IFS=tab colapsa
            # tabs ADJACENTES (tab IFS whitespace nunca produz campo vazio
            # entre 2 delimitadores, mesmo com IFS custom) — um campo vazio
            # no meio desalinharia TAG/DEST/MSG no loop de leitura abaixo.
            plano.append(("ALERTA", "-", texto))

# --- fonte 2: registry.json, bloqueado_por_papel (explicito) ou bloqueado_por (prosa) ---
for papel_bloqueado, entry in terminais.items():
    if entry.get("estado") != "aberto":
        continue
    explicito = entry.get("bloqueado_por_papel")
    prosa = entry.get("bloqueado_por")
    papel_bloqueador = None
    if explicito and explicito in terminais:
        papel_bloqueador = explicito
    elif prosa:
        papel_bloqueador = extrai_papel(prosa, excluir=papel_bloqueado)
    if not papel_bloqueador:
        continue  # bloqueio sem destinatario resolvivel (ex: "bloqueado pelo dono") — nao envia

    key_nudge = f"registry:{papel_bloqueador}:{papel_bloqueado}"
    if pode_mandar(key_nudge, NUDGE_COOLDOWN_S):
        motivo80 = (prosa or "")[:80]
        msg = f"{papel_bloqueado} esta bloqueado por voce: {motivo80} — resolver ou responder em ALERTAS"
        plano.append(("NUDGE", papel_bloqueador, msg))

for tag, dest, msg in plano:
    print(f"{tag}\t{dest}\t{msg}")
PYEOF
)
PYRC=$?

if [[ $PYRC -ne 0 ]]; then
  echo "AVISO: bloqueios-notificar.sh (deteccao) falhou (rc=$PYRC) — nada enviado" >&2
  exit 0
fi

TS="$(date -u +'%Y-%m-%d %H:%M')"
N_NUDGE=0
N_ALERTA=0
N_FALHA=0
while IFS=$'\t' read -r TAG DEST MSG; do
  [[ -z "$TAG" ]] && continue
  case "$TAG" in
    NUDGE)
      if OUT=$("$TERMINAL_SEND_BIN" "$DEST" "$MSG" 2>&1); then
        N_NUDGE=$((N_NUDGE + 1))
      else
        N_FALHA=$((N_FALHA + 1))
        printf '[%s] BLOQUEIO-NOTIFICAR FALHOU dest=%s :: %s\n' \
          "$TS" "$DEST" "$(echo "$OUT" | tr '\n' ' ' | cut -c1-300)" >> "$T/roteamento.log"
        echo "AVISO: notificar $DEST falhou — ver $T/roteamento.log" >&2
      fi
      ;;
    ALERTA)
      if [[ -x "$CANAL_APPEND_BIN" ]]; then
        "$CANAL_APPEND_BIN" ALERTAS "$MSG" --papel SYNC --tipo ALERTA --no-rota >/dev/null \
          && N_ALERTA=$((N_ALERTA + 1)) \
          || echo "AVISO: canal-append.sh falhou para alerta de bloqueio >48h" >&2
      fi
      ;;
  esac
done <<< "$PLANO"

echo "OK: bloqueios-notificar — $N_NUDGE nudge(s), $N_ALERTA alerta(s) 48h, $N_FALHA falha(s) de envio"
