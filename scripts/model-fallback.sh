#!/bin/bash
# model-fallback.sh — cadeia de fallback de modelo para skills deep-reasoning.
# Era Fable 5 (ADR-0002): tier topo = fable. Quota esgotada -> degrau abaixo.
#
#   fable (design)  --fable-off-->  opus  --opus-off-->  sonnet
#   sonnet/opus     --on--------->  fable (restaura design)
#
# Lista de skills DINAMICA: frontmatter `tier: deep-reasoning` (sem lista hardcoded —
# o opus-fallback.sh antigo tinha 7 skills hardcoded e 9 reais; 2 ficavam pinadas).
# Spawns hardcoded em corpo de machine: linhas com marker `model-fallback:managed`.
#
# State: ~/.claude/state/model-mode.txt (fable|opus|sonnet). SessionStart hook roda `auto`.
# Substitui opus-fallback.sh (mantido como shim de compatibilidade p/ aliases antigos).

set -euo pipefail

STATE_FILE="$HOME/.claude/state/model-mode.txt"
LEGACY_STATE="$HOME/.claude/state/opus-mode.txt"
SKILLS_DIR="$HOME/Claude/.claude/skills"
TIERS="fable|opus|sonnet"

mkdir -p "$(dirname "$STATE_FILE")"

# Migracao do state legado (opus-mode.txt: "opus"=design antigo -> fable; "sonnet"=fallback)
if [ ! -f "$STATE_FILE" ] && [ -f "$LEGACY_STATE" ]; then
  legacy=$(cat "$LEGACY_STATE")
  [ "$legacy" = "sonnet" ] && echo "sonnet" > "$STATE_FILE" || echo "fable" > "$STATE_FILE"
fi
[ -f "$STATE_FILE" ] || echo "fable" > "$STATE_FILE"

managed_skill_files() { grep -l '^tier: deep-reasoning$' "$SKILLS_DIR"/*/SKILL.md 2>/dev/null || true; }
managed_spawn_files() { grep -rl 'model-fallback:managed' "$SKILLS_DIR" 2>/dev/null || true; }

set_tier() {
  local target="$1" count=0
  for f in $(managed_skill_files); do
    if grep -qE "^model: ($TIERS)$" "$f" && ! grep -q "^model: $target$" "$f"; then
      sed -i '' -E "s/^model: ($TIERS)$/model: $target/" "$f"
      count=$((count + 1))
    fi
  done
  for f in $(managed_spawn_files); do
    if grep -E "model-fallback:managed" "$f" | grep -qvE "\"$target\""; then
      sed -i '' -E "/model-fallback:managed/ s/model: \"($TIERS)\"/model: \"$target\"/" "$f"
      count=$((count + 1))
    fi
  done
  echo "$target" > "$STATE_FILE"
  echo "$count"
}

cmd="${1:-status}"
case "$cmd" in
  fable-off)        n=$(set_tier opus);   echo "[model-fallback] fable->opus ($n arquivos). Quota Fable esgotada." ;;
  opus-off|fallback|off) n=$(set_tier sonnet); echo "[model-fallback] ->sonnet ($n arquivos). Degrau final." ;;
  on|enable|fable-on|opus-on) n=$(set_tier fable); echo "[model-fallback] restaurado ->fable ($n arquivos)." ;;
  auto)
    state=$(cat "$STATE_FILE")
    n=$(set_tier "$state")
    [ "$n" -gt 0 ] && echo "[model-fallback] auto-applied '$state' ($n arquivos)"
    exit 0 ;;
  status)
    echo "Mode: $(cat "$STATE_FILE")"
    echo "Skills (tier: deep-reasoning):"
    for f in $(managed_skill_files); do
      printf "  %-30s %s\n" "$(basename "$(dirname "$f")")" "$(grep -m1 '^model:' "$f" | awk '{print $2}')"
    done
    echo "Spawns managed:"
    grep -rn 'model-fallback:managed' "$SKILLS_DIR" 2>/dev/null | sed 's|'"$SKILLS_DIR"'/||' | head -10 ;;
  *)
    cat <<EOF
Uso: $0 {fable-off|opus-off|on|auto|status}
  fable-off   fable -> opus   (quota Fable esgotada)
  opus-off    -> sonnet       (Opus tambem esgotado; aliases legados 'fallback'/'off')
  on          -> fable        (restaura design; aliases 'enable'/'fable-on'/'opus-on')
  auto        aplica state file (SessionStart hook)
  status      estado atual
EOF
    exit 1 ;;
esac
