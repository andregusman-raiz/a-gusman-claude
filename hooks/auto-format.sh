#!/bin/bash
# =============================================================================
# auto-format.sh — Auto-format edited files with Prettier
# PostToolUse hook (Edit|Write). Non-blocking (always exits 0).
# =============================================================================

# Source PATH helper (npm/npx)
source "$(dirname "$0")/_env.sh" 2>/dev/null || true

# Get edited files from Claude's environment
FILES="${CLAUDE_FILE_PATHS:-}"
if [ -z "$FILES" ]; then
  exit 0
fi

# Only format if prettier is available in the project
if [ ! -f "node_modules/.bin/prettier" ] && ! command -v prettier &>/dev/null && ! npx prettier --version &>/dev/null; then
  exit 0
fi

# Format each file silently
for f in $FILES; do
  case "$f" in
    *.ts|*.tsx|*.js|*.jsx|*.json|*.css|*.scss|*.md|*.html)
      npx prettier --write "$f" 2>/dev/null || true
      ;;
  esac
done

exit 0
