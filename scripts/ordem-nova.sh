#!/usr/bin/env bash
# ordem-nova.sh — abre um novo O-nnn em ORDENS.md com intake gh pr list embutido.
set -euo pipefail

Q="${DE_PR_QUEUE_DIR:-$HOME/Claude/docs/ai-state/de-pr-queue}"
T="$HOME/Claude/docs/ai-state/terminais"
REGISTRY="$T/registry.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FILE="$Q/ORDENS.md"
REPO="${REPO:-Raiz-Educacao-SA/raiz-data-engine}"

usage() {
  cat <<'EOF'
Uso: ordem-nova.sh "<assunto>" --origem "<quem>" [--papel X]

Registra uma nova ordem externa em ORDENS.md ANTES de abrir frente —
torna o intake obrigatorio real (ate hoje so existia na regra escrita).

1. Roda `gh pr list --repo <REPO> --search "<assunto>" --state all
   --limit 5 --json number,state,title` (REPO default
   Raiz-Educacao-SA/raiz-data-engine, override via env REPO).
2. Insere a linha logo apos a ultima linha `O-nnn | ...` da tabela:

   O-nnn | data hora | origem | assunto | intake: <resumo> | despacho: —

   Se o gh falhar (erro, timeout, sem PR encontrado nao conta como
   falha): "intake: FALHOU (<motivo>)" — o campo nunca fica omitido.
   Sem PR nenhum: "intake: 0 PRs".

--papel: opcional, so para log local (nao entra na linha — o cabecalho
de ORDENS.md declara DE-COORD como unico escritor).

Read-modify-write sob flock (ORDENS.md.lock) + tmp/os.replace, mesma
excecao justificada do pedido-novo.sh.
EOF
}

ORIGEM=""
PAPEL_OVERRIDE=""
POSITIONAL=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h) usage; exit 0 ;;
    --origem) [[ $# -ge 2 ]] || { echo "RECUSADO: --origem exige valor" >&2; exit 2; }; ORIGEM="$2"; shift 2 ;;
    --papel) [[ $# -ge 2 ]] || { echo "RECUSADO: --papel exige valor" >&2; exit 2; }; PAPEL_OVERRIDE="$2"; shift 2 ;;
    *) POSITIONAL+=("$1"); shift ;;
  esac
done

if [[ "${#POSITIONAL[@]}" -lt 1 ]]; then usage; exit 2; fi
ASSUNTO="${POSITIONAL[0]}"
[[ -n "$ORIGEM" ]] || { echo "RECUSADO: --origem obrigatoria" >&2; exit 2; }
[[ -f "$FILE" ]] || { echo "RECUSADO: $FILE nao encontrado" >&2; exit 1; }

# --papel e so informativo (registry opcional) — nao bloqueia se ausente.
PAPEL=""
if [[ -n "$PAPEL_OVERRIDE" ]]; then
  PAPEL="$PAPEL_OVERRIDE"
elif [[ -n "${CMUX_WORKSPACE_ID:-}" && -f "$REGISTRY" ]]; then
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

# Intake: gh pr list --search embutido (obrigatorio real, nao so na regra).
INTAKE=""
if ! command -v gh >/dev/null 2>&1; then
  INTAKE="intake: FALHOU (gh CLI nao encontrado no PATH)"
else
  GH_OUT="$(gh pr list --repo "$REPO" --search "$ASSUNTO" --state all --limit 5 --json number,state,title 2>/tmp/ordem-nova-gh-err.$$)" && GH_RC=0 || GH_RC=$?
  if [[ "$GH_RC" -ne 0 ]]; then
    GH_ERR="$(tr '\n' ' ' </tmp/ordem-nova-gh-err.$$ | cut -c1-160)"
    INTAKE="intake: FALHOU (gh exit $GH_RC: ${GH_ERR:-sem detalhe})"
  else
    INTAKE=$(GH_JSON="$GH_OUT" python3 - <<'PYEOF'
import json, os
data = json.loads(os.environ["GH_JSON"] or "[]")
if not data:
    print("intake: 0 PRs")
else:
    resumo = " ".join(f"#{p['number']}({p['state']})" for p in data)
    print(f"intake: {len(data)} PRs: {resumo}")
PYEOF
)
  fi
  rm -f /tmp/ordem-nova-gh-err.$$
fi

DATA="$(date -u +'%Y-%m-%d %H:%M')"

FILE="$FILE" DATA="$DATA" ORIGEM="$ORIGEM" ASSUNTO="$ASSUNTO" INTAKE="$INTAKE" python3 - <<'PYEOF'
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

    row_re = re.compile(r'^O-(\d+)\s*\|')
    max_id = 0
    last_idx = None
    for i, line in enumerate(lines):
        m = row_re.match(line)
        if m:
            max_id = max(max_id, int(m.group(1)))
            last_idx = i
    if last_idx is None:
        print("RECUSADO: nenhuma linha 'O-nnn |' encontrada em ORDENS.md para ancorar a insercao", file=sys.stderr)
        sys.exit(1)

    next_id = max_id + 1
    novo_id = f"O-{next_id:03d}"
    row = " | ".join([
        novo_id,
        os.environ["DATA"],
        esc(os.environ["ORIGEM"]),
        esc(os.environ["ASSUNTO"]),
        os.environ["INTAKE"],
        "despacho: —",
    ]) + "\n"

    lines.insert(last_idx + 1, row)

    dirpath = os.path.dirname(PATH) or "."
    tmpfd, tmp = tempfile.mkstemp(dir=dirpath, prefix=".ordens-", suffix=".tmp")
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
    print(row.rstrip("\n"))
finally:
    fcntl.flock(fd, fcntl.LOCK_UN)
    os.close(fd)
PYEOF
