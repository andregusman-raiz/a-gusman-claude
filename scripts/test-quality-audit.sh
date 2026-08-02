#!/bin/bash
# =============================================================================
# test-quality-audit.sh — Auditoria automatica de qualidade de testes
# Uso: bash test-quality-audit.sh [diretorio]
# Output: Report Markdown com anti-patterns e metricas
# =============================================================================

DIR="${1:-.}"
echo "=== Test Quality Audit: $DIR ==="
echo ""

# --- Anti-Patterns Teatrais ---
echo "## Anti-Patterns Teatrais"
echo ""
echo "| Pattern | Count |"
echo "|---------|-------|"

P1=$(find "$DIR" -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" | xargs grep -l "\.catch.*=>.*false" 2>/dev/null | wc -l | tr -d ' ')
P1=${P1:-0}
echo "| .catch(() => false) | $P1 |"

P2=$(find "$DIR" -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" | xargs grep -l "|| true" 2>/dev/null | wc -l | tr -d ' ')
P2=${P2:-0}
echo "| OR-chain tautology (\|\| true) | $P2 |"

P3=$(find "$DIR" -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" | xargs grep -l "toBeGreaterThanOrEqual(0)" 2>/dev/null | wc -l | tr -d ' ')
P3=${P3:-0}
echo "| Always-true assertion (>=0) | $P3 |"

P4=$(find "$DIR" -name "*.test.ts" -o -name "*.test.tsx" | xargs grep -l "toMatchSnapshot" 2>/dev/null | wc -l | tr -d ' ')
P4=${P4:-0}
echo "| Snapshot-only (toMatchSnapshot) | $P4 |"

TOTAL_THEATRICAL=$((P1 + P2 + P3))

echo ""

# --- Coverage vs Efetividade ---
echo "## Metricas de Cobertura"
echo ""
echo "| Metric | Value |"
echo "|--------|-------|"

TOTAL_TEST_FILES=$(find "$DIR" -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" 2>/dev/null | wc -l | tr -d ' ')
TOTAL_TEST_FILES=${TOTAL_TEST_FILES:-0}
echo "| Total test files | $TOTAL_TEST_FILES |"

FILES_WITH_EXPECT=$(find "$DIR" -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" | xargs grep -l "expect(" 2>/dev/null | wc -l | tr -d ' ')
FILES_WITH_EXPECT=${FILES_WITH_EXPECT:-0}
echo "| Files with expect() | $FILES_WITH_EXPECT |"

FILES_WITHOUT=$((TOTAL_TEST_FILES - FILES_WITH_EXPECT))
echo "| Files WITHOUT expect() | $FILES_WITHOUT |"

TOTAL_EXPECTS=$(grep -rn "expect(" --include="*.test.ts" --include="*.test.tsx" --include="*.spec.ts" "$DIR" 2>/dev/null | wc -l | tr -d ' ')
echo "| Total expect() calls | $TOTAL_EXPECTS |"

if [ "$TOTAL_TEST_FILES" -gt 0 ]; then
  AVG=$((TOTAL_EXPECTS / TOTAL_TEST_FILES))
  echo "| Avg expects per file | $AVG |"
fi

echo "| Theatrical patterns total | $TOTAL_THEATRICAL |"

echo ""

# --- Access Control Tests ---
echo "## Access Control Coverage"
echo ""
ACCESS_TESTS=$(grep -rl "role\|permission\|unauthorized\|forbidden\|403\|denied\|access.control" --include="*.test.ts" --include="*.test.tsx" --include="*.spec.ts" "$DIR" 2>/dev/null | wc -l | tr -d ' ')
echo "- Access control test files: $ACCESS_TESTS"

DENIAL_TESTS=$(grep -rn "not.*access\|denied\|forbidden\|redirect.*login\|403\|toThrow.*unauth" --include="*.test.ts" --include="*.test.tsx" --include="*.spec.ts" "$DIR" 2>/dev/null | wc -l | tr -d ' ')
echo "- Denial assertions: $DENIAL_TESTS"

echo ""

# --- Veredicto ---
if [ "$TOTAL_THEATRICAL" -gt 10 ]; then
  VERDICT="MAJORITARIAMENTE TEATRAL"
elif [ "$TOTAL_THEATRICAL" -gt 0 ]; then
  VERDICT="PARCIALMENTE TEATRAL"
elif [ "$FILES_WITHOUT" -gt 5 ]; then
  VERDICT="RISCO: muitos testes sem assertions"
else
  VERDICT="EFETIVO"
fi

echo "## Veredicto: $VERDICT"
echo ""

# --- Detalhes dos problemas ---
if [ "$TOTAL_THEATRICAL" -gt 0 ]; then
  echo "## Detalhes (primeiros 10)"
  echo ""
  if [ "$P1" -gt 0 ]; then
    echo "### .catch(() => false)"
    grep -rn "\.catch.*=>.*false" --include="*.test.ts" --include="*.test.tsx" "$DIR" 2>/dev/null | head -5
    echo ""
  fi
  if [ "$P2" -gt 0 ]; then
    echo "### || true"
    grep -rn "|| true" --include="*.test.ts" --include="*.test.tsx" "$DIR" 2>/dev/null | head -5
    echo ""
  fi
  if [ "$P3" -gt 0 ]; then
    echo "### toBeGreaterThanOrEqual(0)"
    grep -rn "toBeGreaterThanOrEqual(0)" --include="*.test.ts" --include="*.test.tsx" "$DIR" 2>/dev/null | head -5
    echo ""
  fi
fi
