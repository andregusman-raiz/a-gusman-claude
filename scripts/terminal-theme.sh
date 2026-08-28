#!/usr/bin/env bash
# terminal-theme.sh — aplica o Padrao de Cores da Sidebar (cmux) por TIER do papel.
# Fonte da proposta: docs/workspace/PROPOSTA-cores-sidebar-cmux-2026-08-27.md
set -euo pipefail

CMUX_BIN="${CMUX_BIN:-/Applications/cmux.app/Contents/Resources/bin/cmux}"
export CMUX_QUIET=1
REGISTRY="$HOME/Claude/docs/ai-state/terminais/registry.json"

usage() {
  cat <<'EOF'
Uso: terminal-theme.sh <PAPEL|--all> [--apply]

Aplica, por papel do registry (docs/ai-state/terminais/registry.json):
  - cor do workspace por TIER      (cmux workspace-action --action set-color)
  - pill "papel" com icone/cor/tier (cmux set-status papel ...)
  - pill "critica"  quando registry.terminais[papel].critica == true
  - pill "bloqueio" quando registry.terminais[papel].bloqueado_por != null

Tabela tier -> cor/icone (ver PROPOSTA-cores-sidebar-cmux-2026-08-27.md):
  0 coordenacao        #F7941D flag.fill
  1 builders DE        #5BB5A2 hammer.fill
  2 consumidores DE    #3B82F6 bolt.horizontal.fill
  3 projetos sem DE    #A1A1AA folder.fill

Sem --apply (default): dry-run, so imprime os comandos cmux que seriam executados.
Com --apply: executa de fato, e SO em papeis com workspace_uuid resolvido e estado=aberto.

  <PAPEL>   nome exato em registry.json (ex: COMANDO)
  --all     roda para todos os papeis. Com --apply reescreve cor/pill de TODOS os
            workspaces abertos numa tacada — prefira 1 papel por vez em producao.

Nota (verificado ao vivo, cmux 0.64.22): a cor do workspace e o --color/--icon de
pill custom (chave != claude_code/codex) NAO aparecem hoje na sidebar padrao — ficam
como metadado/API. Ver secao 1-2 da proposta. O texto do pill (papel/critica/bloqueio)
e a ordenacao por --priority funcionam normalmente.
EOF
}

tier_color() {
  case "$1" in
    0) echo "#F7941D" ;;
    1) echo "#5BB5A2" ;;
    2) echo "#3B82F6" ;;
    *) echo "#A1A1AA" ;;
  esac
}

tier_icon() {
  case "$1" in
    0) echo "flag.fill" ;;
    1) echo "hammer.fill" ;;
    2) echo "bolt.horizontal.fill" ;;
    *) echo "folder.fill" ;;
  esac
}

APPLY=0
TARGET=""
for arg in "$@"; do
  case "$arg" in
    --help|-h) usage; exit 0 ;;
    --apply) APPLY=1 ;;
    --all) TARGET="--all" ;;
    -*) echo "flag desconhecida: $arg" >&2; exit 2 ;;
    *) TARGET="$arg" ;;
  esac
done

if [[ -z "$TARGET" ]]; then usage; exit 2; fi
if [[ ! -f "$REGISTRY" ]]; then echo "registry nao encontrado: $REGISTRY" >&2; exit 1; fi

list_papeis() {
  python3 - "$REGISTRY" <<'PYEOF'
import json, sys
reg = json.load(open(sys.argv[1]))
for k in reg.get("terminais", {}):
    print(k)
PYEOF
}

reg_field() {
  # reg_field <papel> <path.dotted> [default]
  python3 - "$REGISTRY" "$1" "$2" "${3:-}" <<'PYEOF'
import json, sys
registry_path, papel, path, default = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
reg = json.load(open(registry_path))
entry = reg.get("terminais", {}).get(papel)
if entry is None:
    print(default); sys.exit(0)
cur = entry
for part in path.split("."):
    cur = cur.get(part) if isinstance(cur, dict) else None
    if cur is None:
        break
if cur is None:
    print(default)
elif isinstance(cur, bool):
    print("true" if cur else "false")
else:
    print(cur)
PYEOF
}

run_or_echo() {
  if [[ "$APPLY" -eq 1 ]]; then
    "$@"
  else
    printf '[dry-run]'
    printf ' %q' "$@"
    echo
  fi
}

theme_papel() {
  local papel="$1" tier agent uuid estado critica bloqueado color icon
  tier=$(reg_field "$papel" tier "3")
  agent=$(reg_field "$papel" agent "?")
  uuid=$(reg_field "$papel" workspace_uuid "")
  estado=$(reg_field "$papel" estado "?")
  critica=$(reg_field "$papel" critica "false")
  bloqueado=$(reg_field "$papel" bloqueado_por "")

  color=$(tier_color "$tier")
  icon=$(tier_icon "$tier")

  echo "--- $papel (tier $tier, agent $agent, estado $estado) ---"

  if [[ -z "$uuid" || "$uuid" == "None" ]]; then
    echo "  [skip] workspace_uuid nao resolvido no registry (terminal fechado ou nunca aberto via terminal-open.sh)"
    return 0
  fi
  if [[ "$estado" != "aberto" ]]; then
    echo "  [skip] estado=$estado (so tematiza terminal aberto)"
    return 0
  fi

  run_or_echo "$CMUX_BIN" workspace-action --action set-color --color "$color" --workspace "$uuid"
  run_or_echo "$CMUX_BIN" set-status papel "$papel" --icon "$icon" --color "$color" --priority 10 --workspace "$uuid"

  if [[ "$critica" == "true" ]]; then
    run_or_echo "$CMUX_BIN" set-status critica "🔴 CRITICO tier $tier" --priority 95 --workspace "$uuid"
  else
    run_or_echo "$CMUX_BIN" clear-status critica --workspace "$uuid"
  fi

  if [[ -n "$bloqueado" && "$bloqueado" != "None" ]]; then
    run_or_echo "$CMUX_BIN" set-status bloqueio "⛔ BLOQUEADO: $bloqueado" --priority 90 --workspace "$uuid"
  else
    run_or_echo "$CMUX_BIN" clear-status bloqueio --workspace "$uuid"
  fi
}

if [[ "$TARGET" == "--all" ]]; then
  while IFS= read -r p; do
    theme_papel "$p"
  done < <(list_papeis)
else
  if ! list_papeis | grep -qx "$TARGET"; then
    echo "papel nao encontrado no registry: $TARGET" >&2
    exit 3
  fi
  theme_papel "$TARGET"
fi

if [[ "$APPLY" -eq 0 ]]; then
  echo
  echo "(dry-run - nada foi executado. Rode com --apply para aplicar de verdade.)"
fi
