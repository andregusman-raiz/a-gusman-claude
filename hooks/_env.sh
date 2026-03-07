#!/bin/bash
# =============================================================================
# _env.sh — PATH helper for Claude Code hooks on macOS
# Source this at the top of any hook that needs npm/npx/node.
# =============================================================================

# macOS: node/npm/npx typically available via Homebrew or nvm
# Ensure nvm is loaded if present
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  export NVM_DIR="$HOME/.nvm"
  source "$NVM_DIR/nvm.sh" --no-use 2>/dev/null
fi

# OOM prevention for builds
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=8192}"
