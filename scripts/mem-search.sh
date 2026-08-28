#!/usr/bin/env bash
# mem-search.sh — wrapper user-friendly pra memory-fts-index.py search
#
# Uso:
#   mem-search "raiz-platform PFFINANC"
#   mem-search "browser localhost" --limit 10
#
# Reindex incremental antes de buscar (idempotente, ~50ms).

set -euo pipefail

if [ $# -eq 0 ]; then
  cat <<EOF
Uso: $0 <query> [--limit N]
Exemplo: $0 "TOTVS PFFINANC"

Comandos auxiliares:
  $0 --reindex         # full rebuild
  $0 --stats           # status do index
EOF
  exit 1
fi

PY="$HOME/.claude/scripts/memory-fts-index.py"

case "$1" in
  --reindex)  python3 "$PY" reindex --full ;;
  --stats)    python3 "$PY" stats ;;
  *)
    # Reindex incremental (silencioso) + search
    python3 "$PY" reindex >/dev/null 2>&1 || true
    python3 "$PY" search "$@"
    ;;
esac
