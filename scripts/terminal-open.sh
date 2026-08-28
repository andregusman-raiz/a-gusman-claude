#!/usr/bin/env bash
# terminal-open.sh — abre (ou reabre) o terminal cmux de um papel do registry.
set -euo pipefail

CMUX_BIN="${CMUX_BIN:-/Applications/cmux.app/Contents/Resources/bin/cmux}"
export CMUX_QUIET=1
T="$HOME/Claude/docs/ai-state/terminais"
REGISTRY="$T/registry.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NOW_ISO="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

usage() {
  cat <<'EOF'
Uso: terminal-open.sh <PAPEL> [--fresh] [--dry-run] [--force]

Abre (ou reabre) o terminal cmux do papel definido no registry
(docs/ai-state/terminais/registry.json).

  --fresh      nao usa --resume <session_id>; abre sessao nova do agente
  --dry-run    imprime as acoes sem executar nada (nao chama cmux)
  --force      ignora bloqueado_por / nao_antes_de (usar com cuidado)

Recusa (exit != 0) quando:
  - papel tem bloqueado_por, ou nao_antes_de no futuro (sem --force)  -> exit 4
  - cap do tipo de agente (claude/codex) estourado (conta estado=aberto) -> exit 4
  - memoria livre < 20% (memory_pressure)                              -> exit 4
  - worktree definido no registry, nao existe no disco, e falta 'branch'
    para criar via `git worktree add`                                  -> exit 5
EOF
}

DRY_RUN=0
FRESH=0
FORCE=0
PAPEL=""
for arg in "$@"; do
  case "$arg" in
    --help|-h) usage; exit 0 ;;
    --fresh) FRESH=1 ;;
    --dry-run) DRY_RUN=1 ;;
    --force) FORCE=1 ;;
    -*) echo "flag desconhecida: $arg" >&2; exit 2 ;;
    *) PAPEL="$arg" ;;
  esac
done

if [[ -z "$PAPEL" ]]; then usage; exit 2; fi
if [[ ! -f "$REGISTRY" ]]; then echo "registry nao encontrado: $REGISTRY" >&2; exit 1; fi

reg_field() {
  # reg_field <path.dotted> [default]
  python3 - "$REGISTRY" "$PAPEL" "$1" "${2:-}" <<'PYEOF'
import json, sys
registry_path, papel, path, default = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
with open(registry_path) as f:
    reg = json.load(f)
entry = reg.get("terminais", {}).get(papel)
if entry is None:
    print(default); sys.exit(0)
cur = entry
for part in path.split("."):
    if isinstance(cur, dict) and part in cur:
        cur = cur[part]
    else:
        cur = None; break
if cur is None:
    print(default)
elif isinstance(cur, bool):
    print("true" if cur else "false")
else:
    print(cur)
PYEOF
}

reg_exists() {
  python3 - "$REGISTRY" "$PAPEL" <<'PYEOF'
import json, sys
with open(sys.argv[1]) as f:
    reg = json.load(f)
sys.exit(0 if sys.argv[2] in reg.get("terminais", {}) else 1)
PYEOF
}

if ! reg_exists; then
  echo "papel nao encontrado no registry: $PAPEL" >&2
  exit 3
fi

TIER=$(reg_field tier "")
AGENT=$(reg_field agent "")
CWD=$(reg_field cwd "")
REPO=$(reg_field repo "")
WORKTREE=$(reg_field worktree "")
BRANCH=$(reg_field branch "")
SESSION_ID=$(reg_field session_id "")
BOOT=$(reg_field boot "")
TITLE=$(reg_field workspace_title "")
BLOQUEADO_POR=$(reg_field bloqueado_por "")
NAO_ANTES_DE=$(reg_field nao_antes_de "")

echo "== terminal-open: $PAPEL (tier $TIER, agent $AGENT) =="

# --- gates ---
if [[ -n "$BLOQUEADO_POR" && "$FORCE" -eq 0 ]]; then
  echo "RECUSADO: papel bloqueado -> $BLOQUEADO_POR (use --force para ignorar)" >&2
  exit 4
fi

if [[ -n "$NAO_ANTES_DE" && "$FORCE" -eq 0 ]]; then
  NOW_EPOCH=$(date +%s)
  GATE_EPOCH=$(python3 -c "
import sys, datetime
s = sys.argv[1]
try:
    d = datetime.datetime.fromisoformat(s)
    print(int(d.timestamp()))
except Exception:
    print(0)
" "$NAO_ANTES_DE" 2>/dev/null || echo 0)
  if [[ "$GATE_EPOCH" -gt 0 && "$NOW_EPOCH" -lt "$GATE_EPOCH" ]]; then
    echo "RECUSADO: nao_antes_de=$NAO_ANTES_DE ainda nao chegou (use --force para ignorar)" >&2
    exit 4
  fi
fi

CAP=$(python3 -c "
import json
reg = json.load(open('$REGISTRY'))
print(reg.get('cap', {}).get('$AGENT', 999))
")
ABERTOS=$(python3 -c "
import json
reg = json.load(open('$REGISTRY'))
n = sum(1 for v in reg.get('terminais', {}).values() if v.get('agent') == '$AGENT' and v.get('estado') == 'aberto')
print(n)
")
if [[ "$ABERTOS" -ge "$CAP" ]]; then
  echo "RECUSADO: cap de $AGENT estourado ($ABERTOS/$CAP abertos)" >&2
  exit 4
fi
# cap total (registry.cap.total, default 15)
TOTAL_ABERTOS=$(python3 - "$REGISTRY" <<'PYX'
import json,sys
reg=json.load(open(sys.argv[1])); print(sum(1 for v in reg["terminais"].values() if v.get("estado")=="aberto"))
PYX
)
TOTAL_CAP=$(python3 - "$REGISTRY" <<'PYX'
import json,sys
print(json.load(open(sys.argv[1])).get("cap",{}).get("total",15))
PYX
)
if [[ "$TOTAL_ABERTOS" -ge "$TOTAL_CAP" ]]; then
  echo "RECUSADO: cap total estourado ($TOTAL_ABERTOS/$TOTAL_CAP sessoes abertas no registry)" >&2
  exit 4
fi

MEM_FREE_PCT=$(memory_pressure 2>/dev/null | tail -1 | grep -oE '[0-9]+' || echo 100)
if [[ "$MEM_FREE_PCT" -lt 20 ]]; then
  echo "RECUSADO: memoria livre ${MEM_FREE_PCT}% < 20%" >&2
  exit 4
fi

# --- worktree ---
if [[ -n "$WORKTREE" && ! -d "$WORKTREE" ]]; then
  if [[ -z "$BRANCH" ]]; then
    echo "ERRO: worktree '$WORKTREE' nao existe e falta 'branch' no registry p/ criar (git worktree add $WORKTREE origin/<branch>)" >&2
    exit 5
  fi
  if [[ -z "$REPO" ]]; then
    echo "ERRO: worktree definido mas 'repo' ausente no registry" >&2
    exit 5
  fi
  echo "criar worktree: git -C $REPO worktree add $WORKTREE origin/$BRANCH"
  if [[ "$DRY_RUN" -eq 0 ]]; then
    git -C "$REPO" worktree add "$WORKTREE" "origin/$BRANCH"
  fi
fi

if [[ "$DRY_RUN" -eq 0 && ! -d "$CWD" ]]; then
  echo "ERRO: cwd nao existe: $CWD" >&2
  exit 5
fi

# --- comando inicial ---
if [[ "$AGENT" == "claude" ]]; then
  if [[ "$FRESH" -eq 1 || -z "$SESSION_ID" || "$SESSION_ID" == "None" ]]; then
    CMD="claude --dangerously-skip-permissions"
  else
    CMD="claude --dangerously-skip-permissions --resume $SESSION_ID"
  fi
elif [[ "$AGENT" == "codex" ]]; then
  if [[ "$FRESH" -eq 1 ]]; then
    CMD="codex --add-dir "$HOME/Claude/docs/ai-state" --add-dir "$HOME/Claude/.claude/worktrees" --add-dir "$HOME/Claude/GitHub/raiz-data-engine/.claude/worktrees" -c mcp_servers.raiz-data-engine.enabled=false"
  else
    CMD="codex resume --add-dir "$HOME/Claude/docs/ai-state" --add-dir "$HOME/Claude/.claude/worktrees" --add-dir "$HOME/Claude/GitHub/raiz-data-engine/.claude/worktrees" -c mcp_servers.raiz-data-engine.enabled=false"
  fi
else
  echo "ERRO: agent desconhecido: $AGENT" >&2
  exit 5
fi

echo "titulo: $TITLE"
echo "cwd: $CWD"
echo "comando inicial: $CMD"
[[ -n "$BOOT" ]] && echo "boot: $BOOT"

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "[dry-run] nao executando cmux new-workspace / send / registry update"
  exit 0
fi

CREATE_OUT=$("$CMUX_BIN" --json new-workspace --name "$TITLE" --cwd "$CWD" --focus false 2>&1)
echo "cmux new-workspace: $CREATE_OUT"
WS_REF=$(echo "$CREATE_OUT" | grep -oE 'workspace:[0-9]+' | head -1 || true)
if [[ -z "$WS_REF" ]]; then
  echo "ERRO: nao consegui extrair workspace ref de: $CREATE_OUT" >&2
  exit 6
fi

sleep 1
LIST_OUT=$("$CMUX_BIN" list-workspaces --id-format both 2>/dev/null || true)
UUID=$(python3 - "$TITLE" "$LIST_OUT" <<'PYEOF'
import re, sys
title_wanted, data = sys.argv[1], sys.argv[2]
uuid = ""
for line in data.splitlines():
    line = line.rstrip()
    if not line.strip():
        continue
    m = re.match(r'^\*?\s*workspace:\d+\s+([0-9A-Fa-f-]{36})\s+(.*?)(\s+\[selected\])?$', line)
    if not m:
        continue
    u, title = m.group(1), m.group(2).strip()
    if title == title_wanted:
        uuid = u
        break
print(uuid)
PYEOF
)
if [[ -z "$UUID" ]]; then
  echo "AVISO: nao consegui resolver UUID via list-workspaces (title='$TITLE'); registry ficara com workspace_uuid=null" >&2
fi

"$CMUX_BIN" set-status papel "$PAPEL" --workspace "$WS_REF" --priority 10 >/dev/null 2>&1 || true

sleep 2

"$CMUX_BIN" send --workspace "$WS_REF" "$CMD"
"$CMUX_BIN" send-key --workspace "$WS_REF" enter

if [[ -n "$BOOT" && ( "$FRESH" -eq 1 || "$AGENT" == "codex" ) ]]; then
  sleep 10
  "$CMUX_BIN" read-screen --workspace "$WS_REF" --lines 5 >/dev/null 2>&1 || true
  "$CMUX_BIN" send --workspace "$WS_REF" "Leia $BOOT e assuma o papel $PAPEL."
  "$CMUX_BIN" send-key --workspace "$WS_REF" enter
fi

REGISTRY_LIB_DIR="$SCRIPT_DIR" python3 - "$REGISTRY" "$PAPEL" "${UUID:-}" "$NOW_ISO" <<'PYEOF'
import os, sys
sys.path.insert(0, os.environ["REGISTRY_LIB_DIR"])
from registry_lib import mutate
registry_path, papel, uuid, now_iso = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]

def open_papel(reg):
    entry = reg["terminais"][papel]
    entry["workspace_uuid"] = uuid if uuid else entry.get("workspace_uuid")
    entry["estado"] = "aberto"
    entry["aberto_em"] = now_iso

try:
    mutate(registry_path, open_papel)
except Exception as e:
    # O workspace JA foi criado e o comando JA foi enviado. Falhar aqui deixa
    # terminal vivo fora do registry (drift) — o pior estado silencioso possivel,
    # porque cap/watchdog/fencing passam a contar errado. Grita e sai != 0.
    print(f"ERRO: {papel} FOI ABERTO no cmux, mas o registry NAO foi atualizado: {e}\n"
          f"Corrija AGORA: ~/.claude/scripts/terminal-resolve.sh {papel}\n"
          f"(sem isso o papel fica vivo e invisivel para cap, watchdog e fencing.)",
          file=sys.stderr)
    raise SystemExit(7)
print(f"registry atualizado: {papel} -> aberto, uuid={uuid or '(nao resolvido)'}")
PYEOF

echo "OK: $PAPEL aberto em $WS_REF"
