#!/usr/bin/env bash
# terminal-resolve.sh — resolve PAPEL -> workspace_uuid ao vivo, imprime JSON.
# Casa workspace_title do registry com `cmux list-workspaces --id-format both`;
# atualiza registry.json se o UUID mudou. Exit 3 se fechado/nao encontrado.
set -euo pipefail

CMUX_BIN="${CMUX_BIN:-/Applications/cmux.app/Contents/Resources/bin/cmux}"
export CMUX_QUIET=1
T="$HOME/Claude/docs/ai-state/terminais"
REGISTRY="$T/registry.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat <<'EOF'
Uso: terminal-resolve.sh <PAPEL>

Imprime em stdout o JSON do papel no registry
(docs/ai-state/terminais/registry.json), tentando casar workspace_title
com `cmux list-workspaces --id-format both` para resolver workspace_uuid
ao vivo. Se encontrar um workspace vivo com o titulo esperado e o UUID no
registry estiver desatualizado, atualiza o registry.

Exit codes:
  0  papel encontrado E workspace vivo resolvido
  3  papel nao encontrado, OU estado=fechado, OU workspace nao encontrado
  2  uso invalido
EOF
}

if [[ $# -lt 1 ]]; then usage; exit 2; fi
if [[ "$1" == "--help" || "$1" == "-h" ]]; then usage; exit 0; fi

PAPEL="$1"

if [[ ! -f "$REGISTRY" ]]; then
  echo "{\"error\":\"registry nao encontrado: $REGISTRY\"}" >&2
  exit 3
fi

LIVE_WORKSPACES="$("$CMUX_BIN" list-workspaces --id-format both 2>/dev/null || true)"

set +e
REGISTRY_LIB_DIR="$SCRIPT_DIR" python3 - "$PAPEL" "$REGISTRY" "$LIVE_WORKSPACES" <<'PYEOF'
import json, os, re, sys
sys.path.insert(0, os.environ["REGISTRY_LIB_DIR"])
from registry_lib import load, mutate

papel, registry_path, live = sys.argv[1], sys.argv[2], sys.argv[3]

reg = load(registry_path)

entry = reg.get("terminais", {}).get(papel)
if entry is None:
    print(json.dumps({"error": f"papel nao encontrado: {papel}"}, ensure_ascii=False))
    sys.exit(3)

title_wanted = entry.get("workspace_title", "")
found_uuid = None
for line in live.splitlines():
    line = line.rstrip()
    if not line.strip():
        continue
    m = re.match(r'^\*?\s*workspace:\d+\s+([0-9A-Fa-f-]{36})\s+(.*?)(\s+\[selected\])?$', line)
    if not m:
        continue
    uuid, title = m.group(1), m.group(2).strip()
    if title == title_wanted:
        found_uuid = uuid
        break

updated = False
if found_uuid and entry.get("workspace_uuid") != found_uuid:
    # Grava SO o campo, relendo dentro do lock. O padrao antigo regravava o
    # registry inteiro lido segundos antes — apagava mudanca concorrente do
    # watchdog (que roda por launchd a cada 5 min).
    def set_uuid(r):
        r["terminais"][papel]["workspace_uuid"] = found_uuid
    mutate(registry_path, set_uuid)
    entry["workspace_uuid"] = found_uuid
    updated = True

out = dict(entry)
out["papel"] = papel
out["workspace_uuid_live"] = found_uuid
out["registry_updated"] = updated

print(json.dumps(out, ensure_ascii=False, indent=2))

if entry.get("estado") == "fechado" or not found_uuid:
    sys.exit(3)
sys.exit(0)
PYEOF
rc=$?
set -e
exit $rc
