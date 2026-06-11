#!/usr/bin/env bash
# harness-drift-guard.sh — PostToolUse hook bloqueante leve.
#
# Trigger: Edit/Write em ~/Claude/.claude/skills/**/SKILL.md
#
# Comportamento:
#   - Se diff do SKILL.md modifica >50 linhas → emite warning no stderr
#     pedindo revalidacao do description vs corpo (HCS.drift).
#   - Soft warning (nao bloqueia) por padrao.
#   - Se HARNESS_DRIFT_GUARD_STRICT=1 → bloqueante (exit 2).
#
# Bypass:
#   HARNESS_DRIFT_GUARD_DISABLED=1
#
# Filosofia: incentivar Claude a revalidar consistencia description/corpo apos
# edicoes grandes em skills. Nao depende de embedding (rapido, sem custo).
set -euo pipefail

[ "${HARNESS_DRIFT_GUARD_DISABLED:-0}" = "1" ] && exit 0

INPUT="$(cat 2>/dev/null || echo '{}')"

# Path do arquivo editado (do tool_input JSON)
FILE_PATH="$(echo "$INPUT" | python3 -c '
import json, sys
try:
    d = json.load(sys.stdin)
    print(d.get("tool_input", {}).get("file_path", ""), end="")
except Exception:
    pass
' 2>/dev/null)"

# Aplica so a SKILL.md em ~/Claude/.claude/skills/
case "$FILE_PATH" in
  */Claude/.claude/skills/*/SKILL.md) ;;
  *) exit 0 ;;
esac

[ ! -f "$FILE_PATH" ] && exit 0

# Conta linhas modificadas no working tree (se git disponivel)
LINES_CHANGED=0
if command -v git >/dev/null 2>&1; then
  REPO_DIR="$(cd "$(dirname "$FILE_PATH")" && git rev-parse --show-toplevel 2>/dev/null || true)"
  if [ -n "$REPO_DIR" ]; then
    LINES_CHANGED=$(cd "$REPO_DIR" && git diff --numstat -- "$FILE_PATH" 2>/dev/null | awk '{print $1+$2}' || echo 0)
  fi
fi
LINES_CHANGED=${LINES_CHANGED:-0}

# Threshold: 50 linhas
[ "$LINES_CHANGED" -lt 50 ] && exit 0

# Extrai description do frontmatter
DESC="$(awk '
  /^---$/ { fm = !fm; next }
  fm && /^description:/ {
    sub(/^description: *"?/, "")
    sub(/"? *$/, "")
    print
    exit
  }
' "$FILE_PATH" 2>/dev/null)"

SKILL_NAME="$(basename "$(dirname "$FILE_PATH")")"

MSG=$(cat <<EOF
[harness-drift-guard] Skill $SKILL_NAME teve $LINES_CHANGED linhas modificadas.

ACAO RECOMENDADA: revalidar que o frontmatter description ainda reflete o corpo:

  description atual: $DESC

  Se o corpo mudou significativamente, atualize description tambem.
  HCS.drift (em /ag-auditar-harness) penaliza skills com description desalinhada.

Bypass: HARNESS_DRIFT_GUARD_DISABLED=1
EOF
)

if [ "${HARNESS_DRIFT_GUARD_STRICT:-0}" = "1" ]; then
  echo "$MSG" >&2
  exit 2
fi

echo "$MSG" >&2
exit 0
