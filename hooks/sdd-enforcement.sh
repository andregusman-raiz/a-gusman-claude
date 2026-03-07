#!/bin/bash
# =============================================================================
# sdd-enforcement.sh — PreToolUse: Warn when editing domain code without spec
# Item #28: SDD enforcement
# Advisory (exit 0 with warning). Change to exit 2 for strict enforcement.
# =============================================================================

# Read tool input
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tool_name', ''))
except:
    print('')
" 2>/dev/null || echo "")

# Only check Write and Edit
case "$TOOL_NAME" in
  Write|Edit) ;;
  *) exit 0 ;;
esac

FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('file_path', ''))
except:
    print('')
" 2>/dev/null || echo "")

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only guard domain/ source files (the core business logic)
case "$FILE_PATH" in
  */domain/*.service.ts|*/domain/*.generator.ts|*/domain/*.store.ts) ;;
  *) exit 0 ;;
esac

# Check if a spec or task plan exists for current work
SPEC_EXISTS=false
for f in SPEC.md task_plan.md .agents/.context/session-state.json; do
  if [ -f "$f" ]; then
    SPEC_EXISTS=true
    break
  fi
done

# Check roadmap specs
if [ -d "roadmap/specs" ] && [ "$(ls -A roadmap/specs 2>/dev/null)" ]; then
  SPEC_EXISTS=true
fi

if [ "$SPEC_EXISTS" = false ]; then
  echo "hook additional context: [SDD-ENFORCEMENT] Editando logica de dominio ($FILE_PATH) sem SPEC.md, task_plan.md ou session-state.json. SDD recomenda 80% planning antes de 20% execution." >&2
fi

exit 0
