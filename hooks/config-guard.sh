#!/bin/bash
# =============================================================================
# config-guard.sh — PreToolUse(Write): Block Write tool on protected config files
# BLOCKING (exit 2) — forces use of Edit tool for surgical changes.
# =============================================================================

# Read tool input from stdin (JSON with tool_input.file_path)
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"file_path"[[:space:]]*:[[:space:]]*"//;s/"$//')

# If no file path found, allow
[ -z "$FILE_PATH" ] && exit 0

# Extract just the filename for matching
BASENAME=$(basename "$FILE_PATH")
RELPATH="$FILE_PATH"

# Protected config file patterns
BLOCKED=false

case "$BASENAME" in
  .env|.env.*)
    BLOCKED=true
    ;;
  .mcp.json)
    BLOCKED=true
    ;;
  package.json)
    BLOCKED=true
    ;;
  package-lock.json)
    BLOCKED=true
    ;;
  tsconfig.json|tsconfig.*.json)
    BLOCKED=true
    ;;
  vite.config.ts|vite.config.js)
    BLOCKED=true
    ;;
  vitest.config.ts|vitest.config.js)
    BLOCKED=true
    ;;
  playwright.config.ts|playwright.config.js)
    BLOCKED=true
    ;;
  vercel.json)
    BLOCKED=true
    ;;
  config.toml)
    # Only block if it's inside a supabase directory
    if echo "$RELPATH" | grep -q "supabase/config.toml"; then
      BLOCKED=true
    fi
    ;;
esac

# Check for .github/workflows/*.yml files
if echo "$RELPATH" | grep -qE '\.github/workflows/.*\.ya?ml$'; then
  BLOCKED=true
fi

if [ "$BLOCKED" = true ]; then
  echo "BLOCKED: Use Edit tool for config files, never Write. Read the file first, then make surgical edits." >&2
  echo "Protected file: $BASENAME" >&2
  exit 2
fi

exit 0
