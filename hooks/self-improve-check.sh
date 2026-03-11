#!/usr/bin/env bash
# self-improve-check.sh
# Stop hook: triggers self-improvement when errors-log.md was modified in this session.
# Runs after session ends -- exits 0 always to never block session end.

LOG=/tmp/self-improve-hook.log
SCRIPT="$HOME/Claude/.claude/skills/ag_skill-creator/scripts/self_improve.py"
WORKSPACE_ROOT="$HOME/Claude"

exec >> "$LOG" 2>&1
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] self-improve-check: START"

# Require python3 and script
if ! command -v python3 &>/dev/null; then
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] SKIP: python3 not found"
  exit 0
fi

if [ ! -f "$SCRIPT" ]; then
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] SKIP: self_improve.py not found at $SCRIPT"
  exit 0
fi

# Find errors-log.md files modified in the last 3 hours (session window)
MODIFIED_LOGS=$(find "$WORKSPACE_ROOT" \
  -name "errors-log.md" \
  -mmin -180 \
  2>/dev/null)

if [ -z "$MODIFIED_LOGS" ]; then
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] SKIP: no errors-log.md modified in this session"
  exit 0
fi

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Found modified errors logs:"
echo "$MODIFIED_LOGS"

# For each modified log, determine which project it belongs to and trigger harvest
while IFS= read -r log_path; do
  # Derive project path: walk up until we find a directory with package.json, .git, or CLAUDE.md
  project_path=$(dirname "$log_path")
  for _i in 1 2 3 4; do
    project_path=$(dirname "$project_path")
    if [ -f "$project_path/package.json" ] || [ -d "$project_path/.git" ] || [ -f "$project_path/CLAUDE.md" ]; then
      break
    fi
  done

  # Determine skill from context -- use a best-effort heuristic:
  # Look for skill name in the log file header
  skill_name=""
  if grep -q "ag-B-09\|depurar" "$log_path" 2>/dev/null; then
    skill_name="ag-B-09-depurar-erro"
  elif grep -q "ag-B-08\|construir" "$log_path" 2>/dev/null; then
    skill_name="ag-B-08-construir-codigo"
  elif grep -q "ag-B-26\|fix-verificar" "$log_path" 2>/dev/null; then
    skill_name="ag-B-26-fix-verificar"
  elif grep -q "ag-Q-13\|testar" "$log_path" 2>/dev/null; then
    skill_name="ag-Q-13-testar-codigo"
  else
    # Extract agent name from most recent header in errors log
    skill_name=$(grep -oE 'ag-[A-Z]-[0-9]+-[a-z-]+' "$log_path" 2>/dev/null | tail -1)
  fi

  if [ -z "$skill_name" ]; then
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] SKIP: could not determine skill for $log_path"
    continue
  fi

  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Running self-improve for skill=$skill_name project=$project_path"
  # Unset CLAUDECODE to allow claude -p subprocess (Stop hook still has it set)
  CLAUDECODE="" python3 "$SCRIPT" "$skill_name" --project "$project_path" >> "$LOG" 2>&1 &

done <<< "$MODIFIED_LOGS"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] self-improve-check: DONE (background jobs may still run)"
exit 0
