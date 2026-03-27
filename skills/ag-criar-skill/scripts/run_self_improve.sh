#!/bin/bash
# Self-Improvement Runner
# Roda o pipeline de auto-melhoria para uma ou mais skills.
#
# Uso:
#   ./run_self_improve.sh --project /path/to/your-project
#   ./run_self_improve.sh --project /path/to/your-project --skill ag-B-09-depurar-erro --dry-run
#   ./run_self_improve.sh --all-skills --project /path/to/your-project
#
# Requisitos: python3, claude CLI no PATH

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILLS_DIR="$HOME/.claude/skills"
WORKSPACE_DIR="$HOME/.claude/skills-workspace"

# Defaults
PROJECT=""
SKILL=""
ALL_SKILLS=false
DRY_RUN=false
THRESHOLD=0.80

# Parse args
while [[ $# -gt 0 ]]; do
  case $1 in
    --project) PROJECT="$2"; shift 2 ;;
    --skill) SKILL="$2"; shift 2 ;;
    --all-skills) ALL_SKILLS=true; shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    --threshold) THRESHOLD="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ -z "$PROJECT" ]]; then
  echo "ERRO: --project e obrigatorio"
  exit 1
fi

# Expand ~
PROJECT="${PROJECT/#\~/$HOME}"

# Determine which skills to improve
SKILLS_TO_CHECK=()

if [[ -n "$SKILL" ]]; then
  SKILLS_TO_CHECK+=("$SKILL")
elif $ALL_SKILLS; then
  # All skills that have SKILL.md
  for dir in "$SKILLS_DIR"/ag-*/; do
    skill_name=$(basename "$dir")
    SKILLS_TO_CHECK+=("$skill_name")
  done
else
  # Default: skills most relevant to debugging/building
  SKILLS_TO_CHECK=("ag-B-09-depurar-erro" "ag-B-08-construir-codigo" "ag-Q-13-testar-codigo")
fi

echo "=== Self-Improvement Pipeline ==="
echo "Project: $PROJECT"
echo "Skills: ${SKILLS_TO_CHECK[*]}"
echo "Threshold: $THRESHOLD"
echo "Dry run: $DRY_RUN"
echo ""

# Run for each skill
IMPROVED=0
SKIPPED=0
FAILED=0

for skill in "${SKILLS_TO_CHECK[@]}"; do
  echo "--- Processing: $skill ---"

  ARGS=(
    "$SCRIPT_DIR/self_improve.py"
    --skill "$skill"
    --project "$PROJECT"
    --threshold "$THRESHOLD"
  )

  if $DRY_RUN; then
    ARGS+=(--dry-run)
  fi

  if python3 "${ARGS[@]}"; then
    echo "OK: $skill"
    ((IMPROVED++)) || true
  else
    echo "WARN: $skill falhou ou sem dados"
    ((FAILED++)) || true
  fi
  echo ""
done

echo "=== Resultado ==="
echo "Processados: ${#SKILLS_TO_CHECK[@]}"
echo "OK: $IMPROVED"
echo "Falhas: $FAILED"
