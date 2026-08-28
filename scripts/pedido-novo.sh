#!/usr/bin/env bash
# pedido-novo.sh — abre um novo P-nnn na tabela de PEDIDOS.md.
set -euo pipefail

Q="${DE_PR_QUEUE_DIR:-$HOME/Claude/docs/ai-state/de-pr-queue}"
T="$HOME/Claude/docs/ai-state/terminais"
REGISTRY="$T/registry.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FILE="$Q/PEDIDOS.md"

usage() {
  cat <<'EOF'
Uso: pedido-novo.sh "<pedido>" --evidencia "<texto>" --urgencia baixa|media|alta [--papel X]

Insere uma nova linha `P-nnn | data | papel | pedido | evidencia |
urgencia | aberto | — | —` na tabela de PEDIDOS.md, logo APOS a ultima
linha de tabela existente (nunca no fim do arquivo, que hoje e prosa).

id = proximo P-nnn (varre `^P-\d+ \|` na tabela e soma 1).
data = UTC, carimbada pelo script (nunca pelo chamador).
papel = --papel, ou resolvido por $CMUX_WORKSPACE_ID no registry.

Excecao justificada ao "so append": a tabela precisa ficar contigua
para continuar grepavel — por isso read-modify-write sob flock
(PEDIDOS.md.lock) + escrita em tmp + os.replace (atomico), nunca
regravando o arquivo por overwrite direto.

Imprime o id criado (ex: "P-004") em stdout.
EOF
}

EVIDENCIA=""
URGENCIA=""
PAPEL_OVERRIDE=""
POSITIONAL=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h) usage; exit 0 ;;
    --evidencia) [[ $# -ge 2 ]] || { echo "RECUSADO: --evidencia exige valor" >&2; exit 2; }; EVIDENCIA="$2"; shift 2 ;;
    --urgencia) [[ $# -ge 2 ]] || { echo "RECUSADO: --urgencia exige valor" >&2; exit 2; }; URGENCIA="$2"; shift 2 ;;
    --papel) [[ $# -ge 2 ]] || { echo "RECUSADO: --papel exige valor" >&2; exit 2; }; PAPEL_OVERRIDE="$2"; shift 2 ;;
    *) POSITIONAL+=("$1"); shift ;;
  esac
done

if [[ "${#POSITIONAL[@]}" -lt 1 ]]; then usage; exit 2; fi
PEDIDO="${POSITIONAL[0]}"

[[ -n "$EVIDENCIA" ]] || { echo "RECUSADO: --evidencia obrigatoria" >&2; exit 2; }
case "$URGENCIA" in
  baixa|media|alta) ;;
  *) echo "RECUSADO: --urgencia invalida '$URGENCIA' — use baixa|media|alta" >&2; exit 2 ;;
esac
[[ -f "$FILE" ]] || { echo "RECUSADO: $FILE nao encontrado" >&2; exit 1; }

PAPEL=""
if [[ -n "$PAPEL_OVERRIDE" ]]; then
  if [[ ! "$PAPEL_OVERRIDE" =~ ^[A-Z][A-Z0-9-]*$ ]]; then
    echo "RECUSADO: --papel '$PAPEL_OVERRIDE' fora do formato (maiusculas/numeros/hifen)" >&2
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
    echo "RECUSADO: CMUX_WORKSPACE_ID ($CMUX_WORKSPACE_ID) nao resolvido no registry — use --papel explicito" >&2
    exit 3
  fi
else
  echo "RECUSADO: sem --papel e sem CMUX_WORKSPACE_ID no ambiente — passe --papel <PAPEL>" >&2
  exit 3
fi

DATA="$(date -u +'%Y-%m-%d')"

FILE="$FILE" PAPEL="$PAPEL" DATA="$DATA" PEDIDO="$PEDIDO" EVIDENCIA="$EVIDENCIA" URGENCIA="$URGENCIA" python3 - <<'PYEOF'
import fcntl, os, re, sys, tempfile, time

PATH = os.environ["FILE"]
LOCK = PATH + ".lock"
TIMEOUT = 10.0

def esc(s):
    return s.replace("|", "\\|").replace("\n", " ").strip()

fd = os.open(LOCK, os.O_CREAT | os.O_RDWR, 0o644)
deadline = time.monotonic() + TIMEOUT
try:
    while True:
        try:
            fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
            break
        except BlockingIOError:
            if time.monotonic() >= deadline:
                print(f"RECUSADO: lock de {PATH} nao liberado em {TIMEOUT}s (outro processo escrevendo?)", file=sys.stderr)
                sys.exit(4)
            time.sleep(0.05)

    with open(PATH, encoding="utf-8") as f:
        lines = f.readlines()

    row_re = re.compile(r'^P-(\d+)\s*\|')
    max_id = 0
    last_idx = None
    for i, line in enumerate(lines):
        m = row_re.match(line)
        if m:
            max_id = max(max_id, int(m.group(1)))
            last_idx = i
    if last_idx is None:
        print("RECUSADO: nenhuma linha 'P-nnn |' encontrada em PEDIDOS.md para ancorar a insercao", file=sys.stderr)
        sys.exit(1)

    next_id = max_id + 1
    novo_id = f"P-{next_id:03d}"
    row = " | ".join([
        novo_id,
        os.environ["DATA"],
        esc(os.environ["PAPEL"]),
        esc(os.environ["PEDIDO"]),
        esc(os.environ["EVIDENCIA"]),
        os.environ["URGENCIA"],
        "aberto",
        "—",
        "—",
    ]) + "\n"

    lines.insert(last_idx + 1, row)

    dirpath = os.path.dirname(PATH) or "."
    tmpfd, tmp = tempfile.mkstemp(dir=dirpath, prefix=".pedidos-", suffix=".tmp")
    try:
        with os.fdopen(tmpfd, "w", encoding="utf-8") as f:
            f.writelines(lines)
            f.flush()
            os.fsync(f.fileno())
        os.chmod(tmp, 0o644)
        os.replace(tmp, PATH)
    except BaseException:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise

    print(novo_id)
finally:
    fcntl.flock(fd, fcntl.LOCK_UN)
    os.close(fd)
PYEOF
