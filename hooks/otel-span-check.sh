#!/bin/bash
# =============================================================================
# otel-span-check.sh — PostToolUse: Warn when service/API files lack tracing
#
# Trigger: PostToolUse, Edit events on api/*.ts and lib/services/*.ts
# Purpose: Remind developers to instrument new code with OTEL spans.
# Non-blocking — advisory only (exit 0 always).
# =============================================================================

[ -z "$CLAUDE_FILE_PATHS" ] && exit 0

WARNINGS=""

for FILE in $CLAUDE_FILE_PATHS; do
  [ -f "$FILE" ] || continue

  # Only flag API route handlers and service files
  case "$FILE" in
    */api/*.ts|*/api/*.tsx|*/lib/services/*.ts|*/services/*.ts) ;;
    *) continue ;;
  esac

  # Skip test files, mocks, and type-only files
  case "$FILE" in
    *.test.ts|*.spec.ts|*.test.tsx|*.spec.tsx|*/__tests__/*|*/__mocks__/*|*.types.ts|*.d.ts) continue ;;
  esac

  # Check for any tracing/span import or usage
  # Covers: OpenTelemetry, Sentry performance, dd-trace, @vercel/otel, custom span utilities
  HAS_TRACING=$(grep -lEi \
    'startSpan|withSpan|trace\.(start|get)|opentelemetry|@opentelemetry|otel|Sentry\.start|dd-trace|tracer\.|createSpan|span\.set' \
    "$FILE" 2>/dev/null)

  if [ -z "$HAS_TRACING" ]; then
    WARNINGS="${WARNINGS}\n  ${FILE}"
  fi
done

if [ -n "$WARNINGS" ]; then
  echo "hook additional context: [OTEL] Arquivos sem instrumentacao de tracing detectados:${WARNINGS}" >&2
  echo "  Considere adicionar spans para observabilidade:" >&2
  echo "  - OpenTelemetry: import { trace } from '@opentelemetry/api'" >&2
  echo "  - Sentry: Sentry.startSpan({ name: '...' }, async (span) => { ... })" >&2
  echo "  - Custom: import { withSpan } from '@/lib/tracing'" >&2
fi

# Advisory only — never blocks execution
exit 0
