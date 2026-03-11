#!/bin/bash
# ux-qat-post-build.sh — Suggest /ag-Q-43 when new screen detected after build
#
# Triggers: PostToolUse (after Bash tool with build commands)
# Purpose: Detect new route files and suggest creating UX-QAT scenarios

set -euo pipefail

# Only run after successful build commands
if [[ "${TOOL_INPUT:-}" != *"build"* ]] && [[ "${TOOL_INPUT:-}" != *"dev"* ]]; then
  exit 0
fi

# Find project root (look for package.json)
PROJECT_ROOT="."
if [ -f "package.json" ]; then
  PROJECT_ROOT="$(pwd)"
elif [ -f "../package.json" ]; then
  PROJECT_ROOT="$(cd .. && pwd)"
fi

# Check if UX-QAT is configured
UXQAT_CONFIG="$PROJECT_ROOT/.ux-qat/config/ux-qat.config.ts"
if [ ! -f "$UXQAT_CONFIG" ]; then
  exit 0  # UX-QAT not configured for this project
fi

# Detect new route files added in current git diff
NEW_ROUTES=$(git diff --name-only --diff-filter=A HEAD~1 2>/dev/null | grep -E "(app|pages)/.*page\.(tsx|ts|jsx|js)$" || true)

if [ -z "$NEW_ROUTES" ]; then
  exit 0  # No new routes
fi

# Check which new routes don't have UX-QAT scenarios
SCENARIOS_DIR="$PROJECT_ROOT/.ux-qat/scenarios"
MISSING_SCENARIOS=""

for route in $NEW_ROUTES; do
  # Extract screen name from route path
  SCREEN_NAME=$(basename "$(dirname "$route")" | tr '[:upper:]' '[:lower:]')

  if [ ! -d "$SCENARIOS_DIR/$SCREEN_NAME" ]; then
    MISSING_SCENARIOS="$MISSING_SCENARIOS $SCREEN_NAME"
  fi
done

if [ -n "$MISSING_SCENARIOS" ]; then
  echo ""
  echo "UX-QAT: New screens detected without scenarios:$MISSING_SCENARIOS"
  echo "Consider running: /ag-Q-43 to create UX-QAT scenarios for these screens"
  echo ""
fi
