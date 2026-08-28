#!/usr/bin/env bash
# pedido-responder.sh — preenche resposta_em + resposta de um P-nnn existente.
set -euo pipefail

Q="${DE_PR_QUEUE_DIR:-$HOME/Claude/docs/ai-state/de-pr-queue}"
FILE="$Q/PEDIDOS.md"

usage() {
  cat <<'EOF'
Uso: pedido-responder.sh P-nnn "<resposta>" [--estado respondido|aguarda-dono|recusado]

Localiza a linha `P-nnn | ...` na tabela de PEDIDOS.md e substitui os
3 ultimos campos: estado (default: respondido), resposta_em (UTC,
carimbado pelo script) e resposta (o texto passado). Nao mexe nos
campos anteriores (data/papel/pedido/evidencia/urgencia).

Read-modify-write sob flock (PEDIDOS.md.lock) + tmp/os.replace,
mesma excecao justificada do pedido-novo.sh (tabela precisa ficar
contigua).

Recusa (exit 1) se o id nao existir na tabela.
EOF
}

ESTADO="respondido"
POSITIONAL=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h) usage; exit 0 ;;
    --estado) [[ $# -ge 2 ]] || { echo "RECUSADO: --estado exige valor" >&2; exit 2; }; ESTADO="$2"; shift 2 ;;
    *) POSITIONAL+=("$1"); shift ;;
  esac
done

if [[ "${#POSITIONAL[@]}" -lt 2 ]]; then usage; exit 2; fi
ID="${POSITIONAL[0]}"
RESPOSTA="${POSITIONAL[1]}"

case "$ESTADO" in
  respondido|aguarda-dono|recusado) ;;
  *) echo "RECUSADO: --estado invalido '$ESTADO' — use respondido|aguarda-dono|recusado" >&2; exit 2 ;;
esac
[[ -f "$FILE" ]] || { echo "RECUSADO: $FILE nao encontrado" >&2; exit 1; }

TS="$(date -u +'%Y-%m-%d %H:%M')"

FILE="$FILE" ID="$ID" RESPOSTA="$RESPOSTA" ESTADO="$ESTADO" TS="$TS" python3 - <<'PYEOF'
import fcntl, os, re, sys, tempfile, time

PATH = os.environ["FILE"]
LOCK = PATH + ".lock"
TIMEOUT = 10.0
TARGET_ID = os.environ["ID"]

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

    row_re = re.compile(r'^(' + re.escape(TARGET_ID) + r')\s*\|')
    idx = None
    for i, line in enumerate(lines):
        if row_re.match(line):
            idx = i
            break

    if idx is None:
        print(f"RECUSADO: id inexistente na tabela de PEDIDOS.md: {TARGET_ID}", file=sys.stderr)
        sys.exit(1)

    raw = lines[idx].rstrip("\n")
    parts = [p.strip() for p in raw.split("|")]
    # tabela declarada com 9 campos; linhas legadas podem ter menos —
    # completa com "—" em vez de assumir indice fora de faixa.
    while len(parts) < 9:
        parts.append("—")
    parts = parts[:9]

    parts[6] = os.environ["ESTADO"]
    parts[7] = os.environ["TS"]
    parts[8] = esc(os.environ["RESPOSTA"])

    lines[idx] = " | ".join(parts) + "\n"

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

    print(f"OK: {TARGET_ID} atualizado (estado={os.environ['ESTADO']}, resposta_em={os.environ['TS']})")
finally:
    fcntl.flock(fd, fcntl.LOCK_UN)
    os.close(fd)
PYEOF
