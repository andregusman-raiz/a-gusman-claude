#!/bin/bash
# ux-qat-pre-deploy.sh — Run L1+L2+L4 before deploy
#
# Triggers: PreToolUse (before deploy commands)
# Purpose: Ensure basic visual quality before deploying

set -euo pipefail

# Only run before deploy commands
if [[ "${TOOL_INPUT:-}" != *"deploy"* ]] && [[ "${TOOL_INPUT:-}" != *"vercel"* ]]; then
  exit 0
fi

# Find project root
PROJECT_ROOT="."
if [ -f "package.json" ]; then
  PROJECT_ROOT="$(pwd)"
elif [ -f "../package.json" ]; then
  PROJECT_ROOT="$(cd .. && pwd)"
fi

# Check if UX-QAT is configured
UXQAT_CONFIG="$PROJECT_ROOT/.ux-qat/config/ux-qat.config.ts"
if [ ! -f "$UXQAT_CONFIG" ]; then
  exit 0  # UX-QAT not configured
fi

# Check if dev server is running (needed for visual checks)
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo ""
  echo "UX-QAT: Dev server not running at localhost:3000"
  echo "Start the dev server before deploy for visual quality checks"
  echo "Skipping UX-QAT pre-deploy checks"
  echo ""
  exit 0
fi

echo ""
echo "UX-QAT: Pre-deploy visual quality check"
echo "Running L1+L2+L4 (render, interaction, compliance)..."
echo "Use /ag-Q-42 for full PDCA cycle with L3 Visual Judge"
echo ""

# Note: The actual UX-QAT run is triggered by the agent system (ag-Q-42)
# This hook only provides a reminder. The agent runner.ts handles execution.
