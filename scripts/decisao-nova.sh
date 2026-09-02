#!/usr/bin/env bash
# decisao-nova.sh — abre uma nova decisão no ledger (decisoes.json).
# Contrato: docs/ai-state/terminais (reforma de pendencias, 2026-08-28, builder B).
set -euo pipefail

T="${DECISOES_DIR:-$HOME/Claude/docs/ai-state/terminais}"
DECISOES_JSON="$T/decisoes.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat <<'EOF'
Uso: decisao-nova.sh "<titulo>" --classe A|B|C|D --efeito "<texto>"
     [--criterio "<texto>"] [--origem relogio|evento|dono]
     [--recomendacao "<texto>"] [--bloco 1|2|3|4] [--pr N ...]
     [--supersede D-0xx ...] [--papel X] [--narrativa-stdin] [--silencio]

Cria uma entrada nova em decisoes.json (append via registry_lib.mutate —
flock + tmp + os.replace, seguro para escritores concorrentes) e imprime
o id criado (ex: "D-065") em stdout.

  --classe         OBRIGATORIO. A|B|C|D — classe da ALCADA (ALCADA.md):
                    A sobe ao dono; B/C o COMANDO/DE-COORD decide citando
                    a regra; D e duplicata (ver dedupe por --pr abaixo).
  --efeito         obrigatorio. "Efeito de não decidir" — 1-2 linhas.
  --criterio       opcional. Qual criterio LITERAL da ALCADA.md justifica
                    a classe (ex: "A-07"). Sem isto a classe fica sem
                    rastro do "por que".
  --origem         opcional (default "evento"). relogio (aberta por
                    cadencia/tick) | evento (reacao a algo que aconteceu —
                    default) | dono (o proprio dono abriu). Vira o campo
                    aberta_em_origem — M-2/M-15 usam para nao confundir
                    ficha aberta por tick com ficha aberta por humano.
  --recomendacao   opcional. 1-2 linhas.
  --bloco          1 (efeito silencioso em produção) | 2 (prazo) |
                    3 (destrava fila) | 4 (produto/operação). Sem --bloco:
                    vai para 4 com aviso em stderr — quem abre decide o
                    bloco explicitamente ou aceita "sem urgência" por
                    default seguro (nunca 1 por omissão). Independente de
                    --classe (bloco = prioridade de triagem; classe = ALCADA).
  --pr             número de PR relacionado (repetível). DEDUPE: se algum
                    dos PRs ja tem ficha ABERTA, nao cria outra — devolve o
                    D-nnn existente (stdout) com exit 9 (classe D implicita:
                    "decisao-nova.sh recusa PR já em ficha aberta").
  --supersede      id D-0xx que esta decisão substitui (repetível).
  --papel          papel/token do chamador. Resolvido por $CMUX_WORKSPACE_ID
                    no registry (docs/ai-state/terminais/registry.json)
                    quando omitido; sem match e sem esta flag -> recusa.
  --narrativa-stdin lê um texto longo do stdin e grava em
                    decisoes/D-nnn.md (narrativa completa); o campo
                    "narrativa" no JSON aponta para o arquivo.
  --silencio       nao roda decisoes-render.sh ao final (uso em lote/tick).

aberta_em é carimbado em UTC pelo script (nunca digitado pelo chamador).
Ao final (sem --silencio), roda decisoes-render.sh para a view refletir a
novidade imediatamente (não espera o ciclo do launchd).

Exit codes: 0 ok | 2 uso inválido (inclui --classe ausente/invalida) |
3 papel não resolvido | 9 dedupe (PR já tem ficha aberta — id existente
em stdout, nao e erro de uso).
EOF
}

TITULO=""
EFEITO=""
CLASSE=""
CRITERIO=""
ORIGEM="evento"
RECOMENDACAO=""
BLOCO=""
PRS=()
SUPERSEDE=()
PAPEL_OVERRIDE=""
NARRATIVA_STDIN=0
SILENCIO=0
POSITIONAL=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h) usage; exit 0 ;;
    --efeito) [[ $# -ge 2 ]] || { echo "RECUSADO: --efeito exige valor" >&2; exit 2; }; EFEITO="$2"; shift 2 ;;
    --classe) [[ $# -ge 2 ]] || { echo "RECUSADO: --classe exige valor" >&2; exit 2; }; CLASSE="$2"; shift 2 ;;
    --criterio) [[ $# -ge 2 ]] || { echo "RECUSADO: --criterio exige valor" >&2; exit 2; }; CRITERIO="$2"; shift 2 ;;
    --origem) [[ $# -ge 2 ]] || { echo "RECUSADO: --origem exige valor" >&2; exit 2; }; ORIGEM="$2"; shift 2 ;;
    --recomendacao) [[ $# -ge 2 ]] || { echo "RECUSADO: --recomendacao exige valor" >&2; exit 2; }; RECOMENDACAO="$2"; shift 2 ;;
    --bloco) [[ $# -ge 2 ]] || { echo "RECUSADO: --bloco exige valor" >&2; exit 2; }; BLOCO="$2"; shift 2 ;;
    --pr) [[ $# -ge 2 ]] || { echo "RECUSADO: --pr exige valor" >&2; exit 2; }; PRS+=("$2"); shift 2 ;;
    --supersede) [[ $# -ge 2 ]] || { echo "RECUSADO: --supersede exige valor" >&2; exit 2; }; SUPERSEDE+=("$2"); shift 2 ;;
    --papel) [[ $# -ge 2 ]] || { echo "RECUSADO: --papel exige valor" >&2; exit 2; }; PAPEL_OVERRIDE="$2"; shift 2 ;;
    --narrativa-stdin) NARRATIVA_STDIN=1; shift ;;
    --silencio) SILENCIO=1; shift ;;
    --) shift; while [[ $# -gt 0 ]]; do POSITIONAL+=("$1"); shift; done ;;
    *) POSITIONAL+=("$1"); shift ;;
  esac
done

if [[ "${#POSITIONAL[@]}" -lt 1 ]]; then usage; exit 2; fi
TITULO="${POSITIONAL[0]}"

[[ -n "$EFEITO" ]] || { echo "RECUSADO: --efeito obrigatório" >&2; exit 2; }
case "$CLASSE" in
  A|B|C|D) ;;
  "") echo "RECUSADO: --classe obrigatória (A|B|C|D) — ver ALCADA.md" >&2; exit 2 ;;
  *) echo "RECUSADO: --classe inválida '$CLASSE' — use A|B|C|D" >&2; exit 2 ;;
esac
case "$ORIGEM" in
  relogio|evento|dono) ;;
  *) echo "RECUSADO: --origem inválida '$ORIGEM' — use relogio|evento|dono" >&2; exit 2 ;;
esac
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

set +e
NEW_ID=$(REGISTRY_LIB_DIR="$SCRIPT_DIR" \
  DECISOES_JSON="$DECISOES_JSON" \
  TITULO="$TITULO" EFEITO="$EFEITO" RECOMENDACAO="$RECOMENDACAO" BLOCO="$BLOCO" \
  CLASSE="$CLASSE" CRITERIO="$CRITERIO" ORIGEM="$ORIGEM" \
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
    # F0b (SPEC-metodologia-cockpit-2026-08-28.md §11 F0b; ALCADA classe D:
    # "Duplicata... decisao-nova.sh recusa PR já em ficha aberta"). Dedupe
    # DENTRO do lock (nao antes) -- ver duas chamadas concorrentes pro mesmo
    # PR e so uma pode vencer a corrida de criar. Compara contra toda ficha
    # ainda "aberta" (fechada nao compete: PR pode reabrir legitimamente).
    pr_list = json.loads(os.environ["PR_JSON"])
    if pr_list:
        pr_set = set(pr_list)
        for d in reg["decisoes"]:
            if d.get("estado") != "aberta":
                continue
            existentes = set((d.get("refs") or {}).get("pr") or [])
            if existentes & pr_set:
                result["dedupe"] = True
                result["id"] = d["id"]
                return

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
        "classe": os.environ["CLASSE"],
        "criterio": (os.environ.get("CRITERIO") or None),
        "aberta_em": now_iso,
        "aberta_em_estimada": False,
        "aberta_em_origem": os.environ["ORIGEM"],
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

if result.get("dedupe"):
    print(f"DEDUPE: PR já tem ficha ABERTA -> {result['id']} (nenhuma ficha nova criada)",
          file=sys.stderr)
    print(result["id"])
    sys.exit(9)

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
RC=$?
set -e

if [[ "$RC" -eq 9 ]]; then
  echo "$NEW_ID"
  exit 9
elif [[ "$RC" -ne 0 ]]; then
  exit "$RC"
fi

echo "$NEW_ID"

if [[ "$SILENCIO" -eq 1 ]]; then
  exit 0
fi

RENDER="$SCRIPT_DIR/decisoes-render.sh"
if [[ -x "$RENDER" ]]; then
  DECISOES_DIR="$T" "$RENDER" >&2 || echo "AVISO: decisoes-render.sh falhou após criar $NEW_ID — rode manualmente" >&2
fi

# --- Ordem do dono 2026-09-02 (fila única + papel DECISAO): TODA decisão nova, sem excepção,
# é comunicada ao papel DECISAO. Duas camadas: (1) o notify abaixo (evento, best-effort);
# (2) a REDE DE SEGURANÇA é o decisao-fila-derive.sh, que corre no tick e apanha qualquer
# ficha que entre por OUTRA porta (ingest manual incluído — lição da D-172). Falha aqui
# nunca falha a criação da ficha.
DERIVE="$SCRIPT_DIR/decisao-fila-derive.sh"
[[ -x "$DERIVE" ]] && bash "$DERIVE" >/dev/null 2>&1 || true
SENDBIN="$SCRIPT_DIR/terminal-send.sh"
if [[ -x "$SENDBIN" ]]; then
  bash "$SENDBIN" DECISAO "decisao nova ${NEW_ID} — puxa: fila-pull.sh decisao DECISAO (fila-decisao.jsonl)" \
    >/dev/null 2>&1 || echo "AVISO: notify ao DECISAO falhou (${NEW_ID} está na fila na mesma — o derive cobre)" >&2
fi
