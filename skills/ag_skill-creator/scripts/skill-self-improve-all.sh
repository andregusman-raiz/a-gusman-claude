#!/bin/bash
# Skill Self-Improvement — All Projects
# Roda o pipeline de auto-melhoria para ag-09 contra todos os projetos conhecidos.
# Trigger: launchd (semanal) ou manual
#
# Uso: ./skill-self-improve-all.sh [--dry-run]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$HOME/.claude/skills-workspace/self-improve-logs"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$LOG_DIR/run-$TIMESTAMP.log"

DRY_RUN=""
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN="--dry-run"
fi

# Projects to scan
PROJECTS=(
  "$HOME/Claude/GitHub/raiz-platform"
  "$HOME/Claude/GitHub/rAIz-AI-Prof"
)

if [ ${#PROJECTS[@]} -eq 0 ]; then
  echo "No projects configured. Exiting."
  exit 0
fi

# Skills to evaluate
SKILLS=(
  "ag-09-depurar-erro"
)

echo "=== Skill Self-Improvement Run: $TIMESTAMP ===" | tee "$LOG_FILE"
echo "Projects: ${#PROJECTS[@]} | Skills: ${#SKILLS[@]} | Dry run: ${DRY_RUN:-no}" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

TOTAL_EVALS=0
IMPROVEMENTS=0

for project in "${PROJECTS[@]}"; do
  if [[ ! -d "$project" ]]; then
    echo "SKIP: $project (not found)" | tee -a "$LOG_FILE"
    continue
  fi

  project_name=$(basename "$project")
  echo "--- Project: $project_name ---" | tee -a "$LOG_FILE"

  for skill in "${SKILLS[@]}"; do
    echo "  Skill: $skill" | tee -a "$LOG_FILE"

    ARGS=(
      "$SCRIPT_DIR/self_improve.py"
      --skill "$skill"
      --project "$project"
      --threshold 0.80
    )

    if [[ -n "$DRY_RUN" ]]; then
      ARGS+=(--dry-run)
    fi

    if python3 "${ARGS[@]}" 2>&1 | tee -a "$LOG_FILE"; then
      echo "  OK" | tee -a "$LOG_FILE"
    else
      echo "  WARN: failed or no data" | tee -a "$LOG_FILE"
    fi
    echo "" | tee -a "$LOG_FILE"
  done
done

echo "=== Run complete: $TIMESTAMP ===" | tee -a "$LOG_FILE"
echo "Log: $LOG_FILE"
