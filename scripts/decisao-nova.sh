#!/usr/bin/env bash
# decisao-nova.sh — abre uma nova decisão no ledger (decisoes.json).
# Contrato: docs/ai-state/terminais (reforma de pendencias, 2026-08-28, builder B).
set -euo pipefail

T="${DECISOES_DIR:-$HOME/Claude/docs/ai-state/terminais}"
DECISOES_JSON="$T/decisoes.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat <<'EOF'
Uso: decisao-nova.sh "<titulo>" --efeito "<texto>" [--recomendacao "<texto>"]
     [--bloco 1|2|3|4] [--pr N ...] [--supersede D-0xx ...] [--papel X]
     [--narrativa-stdin]

Cria uma entrada nova em decisoes.json (append via registry_lib.mutate —
flock + tmp + os.replace, seguro para escritores concorrentes) e imprime
o id criado (ex: "D-065") em stdout.

  --efeito         obrigatorio. "Efeito de não decidir" — 1-2 linhas.
  --recomendacao   opcional. 1-2 linhas.
  --bloco          1 (efeito silencioso em produção) | 2 (prazo) |
                    3 (destrava fila) | 4 (produto/operação). Sem --bloco:
                    vai para 4 com aviso em stderr — quem abre decide o
                    bloco explicitamente ou aceita "sem urgência" por
                    default seguro (nunca 1 por omissão).
  --pr             número de PR relacionado (repetível).
  --supersede      id D-0xx que esta decisão substitui (repetível).
  --papel          papel/token do chamador. Resolvido por $CMUX_WORKSPACE_ID
                    no registry (docs/ai-state/terminais/registry.json)
                    quando omitido; sem match e sem esta flag -> recusa.
  --narrativa-stdin lê um texto longo do stdin e grava em
                    decisoes/D-nnn.md (narrativa completa); o campo
                    "narrativa" no JSON aponta para o arquivo.

aberta_em é carimbado em UTC pelo script (nunca digitado pelo chamador).
Ao final, roda decisoes-render.sh para a view refletir a novidade
imediatamente (não espera o ciclo do launchd).

Exit codes: 0 ok | 2 uso inválido | 3 papel não resolvido.
EOF
}

TITULO=""
EFEITO=""
RECOMENDACAO=""
BLOCO=""
PRS=()
SUPERSEDE=()
PAPEL_OVERRIDE=""
NARRATIVA_STDIN=0
POSITIONAL=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h) usage; exit 0 ;;
    --efeito) [[ $# -ge 2 ]] || { echo "RECUSADO: --efeito exige valor" >&2; exit 2; }; EFEITO="$2"; shift 2 ;;
    --recomendacao) [[ $# -ge 2 ]] || { echo "RECUSADO: --recomendacao exige valor" >&2; exit 2; }; RECOMENDACAO="$2"; shift 2 ;;
    --bloco) [[ $# -ge 2 ]] || { echo "RECUSADO: --bloco exige valor" >&2; exit 2; }; BLOCO="$2"; shift 2 ;;
    --pr) [[ $# -ge 2 ]] || { echo "RECUSADO: --pr exige valor" >&2; exit 2; }; PRS+=("$2"); shift 2 ;;
    --supersede) [[ $# -ge 2 ]] || { echo "RECUSADO: --supersede exige valor" >&2; exit 2; }; SUPERSEDE+=("$2"); shift 2 ;;
    --papel) [[ $# -ge 2 ]] || { echo "RECUSADO: --papel exige valor" >&2; exit 2; }; PAPEL_OVERRIDE="$2"; shift 2 ;;
    --narrativa-stdin) NARRATIVA_STDIN=1; shift ;;
    --) shift; while [[ $# -gt 0 ]]; do POSITIONAL+=("$1"); shift; done ;;
    *) POSITIONAL+=("$1"); shift ;;
  esac
done

if [[ "${#POSITIONAL[@]}" -lt 1 ]]; then usage; exit 2; fi
TITULO="${POSITIONAL[0]}"

[[ -n "$EFEITO" ]] || { echo "RECUSADO: --efeito obrigatório" >&2; exit 2; }
[[ -f "$DECISOES_JSON" ]] || { echo "RECUSADO: $DECISOES_JSON não encontrado — rode a migração primeiro" >&2; exit 1; }

if [[ -n "$BLOCO" ]]; then
  case "$BLOCO" in
    1|2|3|4) ;;
    *) echo "RECUSADO: --bloco inválido '$BLOCO' — use 1|2|3|4" >&2; exit 2 ;;
  esac
else
  BLOCO=4
  echo "AVISO: --bloco omitido — indo para bloco 4 (sem urgência); passe --bloco N se for maior prioridade" >&2
fi

REGISTRY="$T/registry.json"
PAPEL=""
if [[ -n "$PAPEL_OVERRIDE" ]]; then
  if [[ ! "$PAPEL_OVERRIDE" =~ ^[A-Z][A-Z0-9-]*$ ]]; then
    echo "RECUSADO: --papel '$PAPEL_OVERRIDE' fora do formato (maiúsculas/números/hífen, ex: DE-COORD, WATCHDOG)" >&2
    exit 2
  fi
  PAPEL="$PAPEL_OVERRIDE"
elif [[ -n "${CMUX_WORKSPACE_ID:-}" ]]; then
  if [[ -f "$REGISTRY" ]]; then
    PAPEL=$(REGISTRY_LIB_DIR="$SCRIPT_DIR" python3 - "$REGISTRY" "$CMUX_WORKSPACE_ID" <<'PYEOF'
import os, sys
sys.path.insert(0, os.environ["REGISTRY_LIB_DIR"])
from registry_lib import load
registry_path, ws = sys.argv[1], sys.argv[2]
try:
    reg = load(registry_path)
    for papel, e in (reg.get("terminais") or {}).items():
        if e.get("workspace_uuid") == ws:
            print(papel)
            break
except Exception:
    pass
PYEOF
)
  fi
  if [[ -z "$PAPEL" ]]; then
    echo "RECUSADO: CMUX_WORKSPACE_ID ($CMUX_WORKSPACE_ID) não resolvido no registry — use --papel explícito" >&2
    exit 3
  fi
else
  echo "RECUSADO: sem --papel e sem CMUX_WORKSPACE_ID no ambiente — passe --papel <PAPEL|TOKEN>" >&2
  exit 3
fi

NARRATIVA_TEXT=""
if [[ "$NARRATIVA_STDIN" -eq 1 ]]; then
  NARRATIVA_TEXT="$(cat)"
fi

PR_JSON="[]"
if [[ "${#PRS[@]}" -gt 0 ]]; then
  PR_JSON=$(printf '%s\n' "${PRS[@]}" | python3 -c 'import sys, json; print(json.dumps(sorted({int(x) for x in sys.stdin if x.strip()})))')
fi
SUPERSEDE_JSON="[]"
if [[ "${#SUPERSEDE[@]}" -gt 0 ]]; then
  SUPERSEDE_JSON=$(printf '%s\n' "${SUPERSEDE[@]}" | python3 -c 'import sys, json; print(json.dumps([x.strip() for x in sys.stdin if x.strip()]))')
fi

NEW_ID=$(REGISTRY_LIB_DIR="$SCRIPT_DIR" \
  DECISOES_JSON="$DECISOES_JSON" \
  TITULO="$TITULO" EFEITO="$EFEITO" RECOMENDACAO="$RECOMENDACAO" BLOCO="$BLOCO" \
  PAPEL="$PAPEL" PR_JSON="$PR_JSON" SUPERSEDE_JSON="$SUPERSEDE_JSON" \
  NARR_DIR="$T/decisoes" NARRATIVA_TEXT="$NARRATIVA_TEXT" \
  LOG_FILE="$T/decisoes-ingest.log" \
  python3 <<'PYEOF'
import datetime
import json
import os
import sys

sys.path.insert(0, os.environ["REGISTRY_LIB_DIR"])
from registry_lib import mutate, RegistryLockTimeout  # noqa: E402

DECISOES_JSON = os.environ["DECISOES_JSON"]
now_iso = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:00Z')
narrativa_text = os.environ.get("NARRATIVA_TEXT") or ""

result = {}
LOG_FILE = os.environ.get("LOG_FILE") or ""


def do_add(reg):
    # CRITICO 1a (revisor adversarial 2026-08-28, mesma protecao aplicada em
    # decisoes-render.sh): nao confiar cegamente em reg['proximo_id'] para
    # cunhar — se ele estiver <= o maior id ja existente (corrupcao/edicao
    # manual do JSON), nasceria um id DUPLICADO em silencio. Recalcula o
    # proximo id livre a partir do MAIOR id realmente presente em
    # reg['decisoes']; se divergir do contador salvo, corrige o contador e
    # registra a anomalia na propria entrada nova.
    existing_nums = [int(d['id'].split('-')[1]) for d in reg['decisoes'] if d['id'].startswith('D-')]
    max_existing = max(existing_nums) if existing_nums else 0
    old_proximo = reg['proximo_id']
    next_free = max(max_existing, old_proximo - 1) + 1
    proximo_corrigido = next_free != old_proximo
    if proximo_corrigido:
        reg['proximo_id'] = next_free

    new_id = f"D-{reg['proximo_id']:03d}"
    narrativa_path = None
    if narrativa_text.strip():
        narrativa_path = f"decisoes/{new_id}.md"
    anomalias = []
    if proximo_corrigido:
        anomalias.append(f"proximo_id corrigido de {old_proximo} para {next_free} (colisao evitada)")
    entry = {
        "id": new_id,
        "titulo": os.environ["TITULO"],
        "origem": os.environ["PAPEL"],
        "aberta_em": now_iso,
        "aberta_em_estimada": False,
        "bloco": int(os.environ["BLOCO"]),
        "estado": "aberta",
        "decidida_em": None,
        "decisao": None,
        "efeito": os.environ["EFEITO"],
        "recomendacao": (os.environ.get("RECOMENDACAO") or None),
        "supersede": json.loads(os.environ["SUPERSEDE_JSON"]),
        "refs": {"pr": json.loads(os.environ["PR_JSON"]), "papel": [os.environ["PAPEL"]]},
        "narrativa": narrativa_path,
        "atualizado_em": now_iso,
        "anomalias": anomalias,
    }
    reg["decisoes"].append(entry)
    reg["proximo_id"] += 1
    result["id"] = new_id
    result["narrativa_path"] = narrativa_path
    result["proximo_corrigido"] = proximo_corrigido
    result["old_proximo"] = old_proximo
    result["next_free"] = next_free


try:
    mutate(DECISOES_JSON, do_add)
except RegistryLockTimeout as e:
    print(f"RECUSADO: {e}", file=sys.stderr)
    sys.exit(5)

if result.get("proximo_corrigido") and LOG_FILE:
    _line = (f"{now_iso} {result['id']} COLISAO-EVITADA "
             f"proximo_id {result['old_proximo']}->{result['next_free']}\n")
    _fd = os.open(LOG_FILE, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)
    try:
        os.write(_fd, _line.encode('utf-8'))
    finally:
        os.close(_fd)

print(result["id"])
if result["narrativa_path"]:
    narr_dir = os.environ["NARR_DIR"]
    os.makedirs(narr_dir, exist_ok=True)
    full_path = os.path.join(os.path.dirname(narr_dir), result["narrativa_path"])
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(f"> Narrativa de {result['id']} — criada via decisao-nova.sh em {now_iso}.\n\n")
        f.write(narrativa_text.rstrip() + "\n")
PYEOF
)

echo "$NEW_ID"

RENDER="$SCRIPT_DIR/decisoes-render.sh"
if [[ -x "$RENDER" ]]; then
  DECISOES_DIR="$T" "$RENDER" >&2 || echo "AVISO: decisoes-render.sh falhou após criar $NEW_ID — rode manualmente" >&2
fi
