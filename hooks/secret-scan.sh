#!/bin/bash
# =============================================================================
# secret-scan.sh — PostToolUse: Scan edited files for hardcoded secrets
# Detects API keys, tokens, passwords, connection strings in source code.
# Advisory (exit 0) — warns but doesn't block.
# =============================================================================

# Get file paths from Claude environment
if [ -z "$CLAUDE_FILE_PATHS" ]; then
  exit 0
fi

WARNINGS=""

for FILE in $CLAUDE_FILE_PATHS; do
  # Skip non-existent files, binary, config, lock, and env files (already denied)
  [ -f "$FILE" ] || continue
  case "$FILE" in
    *.env*|*.lock|*.png|*.jpg|*.ico|*.woff*|*.ttf|*.map) continue ;;
    *node_modules*|*.git/*) continue ;;
  esac

  # Scan for common secret patterns
  HITS=$(grep -nEi \
    '(api[_-]?key|api[_-]?secret|access[_-]?key|secret[_-]?key|private[_-]?key|auth[_-]?token|bearer\s+[a-zA-Z0-9_.~+/-]{20,})\s*[:=]\s*["\x27][a-zA-Z0-9_.~+/=-]{16,}["\x27]' \
    "$FILE" 2>/dev/null)

  # AWS keys (AKIA...)
  HITS="${HITS}$(grep -nE 'AKIA[0-9A-Z]{16}' "$FILE" 2>/dev/null)"

  # Generic password/secret assignments
  HITS="${HITS}$(grep -nEi \
    '(password|passwd|pwd|secret|token|credential)\s*[:=]\s*["\x27][^"\x27]{8,}["\x27]' \
    "$FILE" 2>/dev/null | grep -vi '(process\.env|import|require|example|placeholder|your_|xxx|changeme|TODO)' 2>/dev/null)"

  # Connection strings with embedded credentials
  HITS="${HITS}$(grep -nEi \
    '(postgres|mysql|mongodb|redis|amqp)://[^:]+:[^@]+@' \
    "$FILE" 2>/dev/null | grep -vi 'localhost\|127\.0\.0\.1\|example\|placeholder' 2>/dev/null)"

  if [ -n "$HITS" ]; then
    WARNINGS="${WARNINGS}\n  $FILE: possiveis secrets hardcoded"
  fi
done

if [ -n "$WARNINGS" ]; then
  echo "hook additional context: [SECRET-SCAN] Secrets detectados em arquivos editados:${WARNINGS}" >&2
  echo "  Mova para variaveis de ambiente (.env) ou vault." >&2
fi

exit 0
