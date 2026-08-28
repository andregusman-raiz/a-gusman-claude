#!/usr/bin/env bash
# decisao-decidir.sh — fecha uma decisão do ledger (decisoes.json).
# Contrato: docs/ai-state/terminais (reforma de pendencias, 2026-08-28, builder B).
set -euo pipefail

T="${DECISOES_DIR:-$HOME/Claude/docs/ai-state/terminais}"
DECISOES_JSON="$T/decisoes.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat <<'EOF'
Uso: decisao-decidir.sh D-nnn "<decisão>" [--executada] [--alcada N] [--arquivar] [--forcar]

Marca uma decisão como fechada em decisoes.json: seta `estado`,
`decidida_em` (UTC, carimbado pelo script) e `decisao` (o texto
passado). Roda decisoes-render.sh ao final para a view e o
ARQUIVO-decisoes.md refletirem a mudança imediatamente.

  --executada   estado = decidida_executada (decisão já aplicada/em execução)
  --alcada N    estado = decidida_por_alcada (degrau N de alçada, ex: COMANDO)
  --arquivar    estado = arquivada (sem decisão de mérito — encerrada/absorvida)
  --forcar      permite redecidir um id que já não está "aberta" (sobrescreve
                decisao/decidida_em anteriores)

Sem nenhuma das três flags: estado = decidida (default).

Recusa (exit != 0, sem stack trace) quando: id não existe; id já não está
"aberta" e --forcar não foi passado; ambos --executada e --alcada juntos
(escolha uma classificação); lock do decisoes.json preso além do timeout
(mensagem legível, não traceback).
EOF
}

EXECUTADA=0
ALCADA=""
ARQUIVAR=0
FORCAR=0
POSITIONAL=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h) usage; exit 0 ;;
    --executada) EXECUTADA=1; shift ;;
    --alcada) [[ $# -ge 2 ]] || { echo "RECUSADO: --alcada exige valor" >&2; exit 2; }; ALCADA="$2"; shift 2 ;;
    --arquivar) ARQUIVAR=1; shift ;;
    --forcar) FORCAR=1; shift ;;
    --) shift; while [[ $# -gt 0 ]]; do POSITIONAL+=("$1"); shift; done ;;
    *) POSITIONAL+=("$1"); shift ;;
  esac
done

if [[ "${#POSITIONAL[@]}" -lt 2 ]]; then usage; exit 2; fi
ID="${POSITIONAL[0]}"
DECISAO_TEXTO="${POSITIONAL[1]}"

if [[ ! "$ID" =~ ^D-[0-9]+$ ]]; then
  echo "RECUSADO: id inválido '$ID' — formato esperado D-nnn" >&2
  exit 2
fi

N_FLAGS=$EXECUTADA
if [[ -n "$ALCADA" ]]; then N_FLAGS=$((N_FLAGS + 1)); fi
N_FLAGS=$((N_FLAGS + ARQUIVAR))
if [[ "$N_FLAGS" -gt 1 ]]; then
  echo "RECUSADO: use no máximo uma de --executada / --alcada / --arquivar" >&2
  exit 2
fi

ESTADO="decidida"
if [[ "$EXECUTADA" -eq 1 ]]; then
  ESTADO="decidida_executada"
elif [[ -n "$ALCADA" ]]; then
  ESTADO="decidida_por_alcada"
elif [[ "$ARQUIVAR" -eq 1 ]]; then
  ESTADO="arquivada"
fi

[[ -f "$DECISOES_JSON" ]] || { echo "RECUSADO: $DECISOES_JSON não encontrado — rode a migração primeiro" >&2; exit 1; }

set +e
OUT=$(REGISTRY_LIB_DIR="$SCRIPT_DIR" \
  DECISOES_JSON="$DECISOES_JSON" \
  ID="$ID" DECISAO_TEXTO="$DECISAO_TEXTO" ESTADO="$ESTADO" ALCADA="$ALCADA" FORCAR="$FORCAR" \
  python3 <<'PYEOF'
import datetime
import os
import sys

sys.path.insert(0, os.environ["REGISTRY_LIB_DIR"])
from registry_lib import mutate, RegistryLockTimeout  # noqa: E402

DECISOES_JSON = os.environ["DECISOES_JSON"]
ID = os.environ["ID"]
DECISAO_TEXTO = os.environ["DECISAO_TEXTO"]
ESTADO = os.environ["ESTADO"]
ALCADA = os.environ.get("ALCADA") or ""
FORCAR = os.environ["FORCAR"] == "1"
now_iso = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:00Z')

status = {}


def do_decide(reg):
    alvo = None
    for d in reg["decisoes"]:
        if d["id"] == ID:
            alvo = d
            break
    if alvo is None:
        status["error"] = f"RECUSADO: {ID} não existe em decisoes.json"
        status["code"] = 3
        return
    if alvo["estado"] != "aberta" and not FORCAR:
        status["error"] = (
            f"RECUSADO: {ID} já está '{alvo['estado']}' (decidida_em={alvo.get('decidida_em')}) "
            f"— use --forcar para redecidir"
        )
        status["code"] = 4
        return
    alvo["estado"] = ESTADO
    alvo["decidida_em"] = now_iso
    texto = DECISAO_TEXTO
    if ALCADA:
        texto = f"(alçada {ALCADA}) {texto}"
    alvo["decisao"] = texto
    alvo["atualizado_em"] = now_iso
    status["ok"] = True
    status["titulo"] = alvo["titulo"]


try:
    mutate(DECISOES_JSON, do_decide)
except RegistryLockTimeout as e:
    print(f"RECUSADO: {e}", file=sys.stderr)
    sys.exit(5)

if status.get("error"):
    print(status["error"], file=sys.stderr)
    sys.exit(status["code"])

print(f"OK: {ID} -> {ESTADO} ({status['titulo']})")
PYEOF
)
RC=$?
set -e
echo "$OUT"
if [[ $RC -ne 0 ]]; then
  exit $RC
fi

RENDER="$SCRIPT_DIR/decisoes-render.sh"
if [[ -x "$RENDER" ]]; then
  DECISOES_DIR="$T" "$RENDER" >&2 || echo "AVISO: decisoes-render.sh falhou após decidir $ID — rode manualmente" >&2
fi
