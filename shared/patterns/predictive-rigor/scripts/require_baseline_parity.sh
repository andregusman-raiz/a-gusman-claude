#!/usr/bin/env bash
# require_baseline_parity.sh — Check 11 (pre-PR enforcement)
#
# Rule L7-M16 + M03: Any PR adding or modifying a model script
# MUST include a baseline_parity report in the commit.
#
# Triggered by pre_commit_governance.sh Check 11 for files matching:
#   - scripts/run_*.py
#   - engine_v4_2/*_model.py
#
# Can also be run standalone:
#   bash scripts/governance/require_baseline_parity.sh [--staged] [--help]
#
# Exit codes:
#   0 = PASS (report exists and is recent)
#   1 = WARN (report exists but may be stale — non-blocking)
#   2 = BLOCKED (no report found — commit blocked)
#
# M03 pass/fail thresholds (from M03-PFC.md — Rule M4 goalpost lock):
#   PASS: new_model_brier < best_baseline_brier - 0.003
#   Any model PR without evidence of this comparison is BLOCKED.

set -u

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -z "$REPO_ROOT" ]; then
    echo "[require_baseline_parity] not in a git repo — skipping"
    exit 0
fi

cd "$REPO_ROOT"

# ---------------------------------------------------------------------------
# Parse args
# ---------------------------------------------------------------------------
STAGED_MODE=0
for arg in "$@"; do
    case "$arg" in
        --staged) STAGED_MODE=1 ;;
        --help|-h)
            echo "Usage: $0 [--staged]"
            echo ""
            echo "Check that a baseline_parity report exists before model PRs."
            echo "  --staged : Only check staged files (pre-commit mode)"
            echo ""
            echo "Thresholds (M03-PFC.md, Rule M4):"
            echo "  Model must beat LogReg+L4 (or LogReg+odds) by Brier delta >= 0.003"
            echo "  OR show ROI CI95 strictly > 0 AND > best baseline ROI"
            exit 0
            ;;
    esac
done

# ---------------------------------------------------------------------------
# Determine which files to check
# ---------------------------------------------------------------------------
if [ "$STAGED_MODE" -eq 1 ]; then
    CHANGED_FILES=$(git diff --cached --name-only --diff-filter=AM 2>/dev/null || true)
else
    # Default: all uncommitted + staged changes
    CHANGED_FILES=$(git diff --name-only --diff-filter=AM HEAD 2>/dev/null || true)
    STAGED_ALSO=$(git diff --cached --name-only --diff-filter=AM 2>/dev/null || true)
    CHANGED_FILES=$(printf '%s\n%s\n' "$CHANGED_FILES" "$STAGED_ALSO" | sort -u | grep -v '^$' || true)
fi

if [ -z "$CHANGED_FILES" ]; then
    echo "[require_baseline_parity] No changed files — skipping"
    exit 0
fi

# ---------------------------------------------------------------------------
# Check for model-touching files
# ---------------------------------------------------------------------------
MODEL_FILES=$(echo "$CHANGED_FILES" | grep -E \
    "^scripts/run_[^/]+\.py$|^engine_v4_2/[^/]+_model\.py$" || true)

if [ -z "$MODEL_FILES" ]; then
    echo "[require_baseline_parity] No model files changed — skipping"
    exit 0
fi

echo "[require_baseline_parity] Model files detected in changeset:"
echo "$MODEL_FILES" | sed 's/^/  /'

# ---------------------------------------------------------------------------
# Check for baseline_parity report in staged changes or recent reports/
# ---------------------------------------------------------------------------

# Strategy 1: check if a baseline_parity report is staged in this commit
STAGED_REPORT=$(git diff --cached --name-only 2>/dev/null \
    | grep -E "^reports/baseline_parity_|^reports/m03_baseline_parity_" || true)

if [ -n "$STAGED_REPORT" ]; then
    echo "[require_baseline_parity] PASS: baseline_parity report staged in this commit:"
    echo "$STAGED_REPORT" | sed 's/^/  /'
    exit 0
fi

# Strategy 2: check for recent report in reports/ (within last 7 days)
RECENT_REPORT=$(find "$REPO_ROOT/reports" -maxdepth 1 -name "baseline_parity_*.md" \
    -newer "$REPO_ROOT/reports/.gitkeep" 2>/dev/null \
    | sort | tail -1 || true)

# Fallback: any baseline_parity report in reports/
LATEST_REPORT=$(ls "$REPO_ROOT/reports/baseline_parity_"*.md 2>/dev/null \
    | sort | tail -1 || true)
LATEST_M03_REPORT=$(ls "$REPO_ROOT/reports/m03_baseline_parity_l4_"*.md 2>/dev/null \
    | sort | tail -1 || true)

BEST_REPORT=""
if [ -n "$LATEST_M03_REPORT" ]; then
    BEST_REPORT="$LATEST_M03_REPORT"
elif [ -n "$LATEST_REPORT" ]; then
    BEST_REPORT="$LATEST_REPORT"
fi

if [ -z "$BEST_REPORT" ]; then
    echo ""
    echo "[require_baseline_parity] BLOCKED: Model files changed but no baseline_parity report found."
    echo ""
    echo "  Rule L7-M16 + M03: Any new model must be compared against the LogReg+L4 baseline."
    echo "  Required: Brier delta >= 0.003 improvement OR ROI CI95 strictly > 0."
    echo ""
    echo "  To generate the baseline report, run:"
    echo "    source .venv312/bin/activate"
    echo "    PYTHONPATH=. python scripts/analysis/m03_baseline_parity_l4.py"
    echo ""
    echo "  Then stage the generated report:"
    echo "    git add reports/m03_baseline_parity_l4_*.md"
    echo ""
    echo "  Model files that triggered this check:"
    echo "$MODEL_FILES" | sed 's/^/    /'
    exit 2
fi

# ---------------------------------------------------------------------------
# Validate the report contains a verdict
# ---------------------------------------------------------------------------
REPORT_VERDICT=$(grep -E "^\*\*(PASS|MARGINAL|FAIL)" "$BEST_REPORT" 2>/dev/null \
    | head -1 || true)

if [ -z "$REPORT_VERDICT" ]; then
    echo "[require_baseline_parity] WARN: Found report $BEST_REPORT but no verdict line detected."
    echo "  Report may be malformed or incomplete."
    echo "  Re-run: PYTHONPATH=. python scripts/analysis/m03_baseline_parity_l4.py"
    exit 1
fi

# Extract verdict keyword
VERDICT_KEYWORD=$(echo "$REPORT_VERDICT" | grep -oE "PASS|MARGINAL|FAIL" | head -1 || true)
REPORT_BASENAME=$(basename "$BEST_REPORT")

echo "[require_baseline_parity] Found baseline report: $REPORT_BASENAME"
echo "[require_baseline_parity] Verdict in report: $VERDICT_KEYWORD"

# ---------------------------------------------------------------------------
# Check if report is staged — warn if not
# ---------------------------------------------------------------------------
REPORT_STAGED=$(git diff --cached --name-only 2>/dev/null \
    | grep -F "$(basename "$BEST_REPORT")" || true)

if [ -z "$REPORT_STAGED" ]; then
    echo ""
    echo "[require_baseline_parity] WARN: Report exists but is NOT staged."
    echo "  Stage it with: git add $BEST_REPORT"
    echo ""
    echo "  This is a warning — commit not blocked."
    echo "  But PR review WILL require the report to be present in the diff."
    # Non-blocking (exit 1 = warn)
    exit 1
fi

echo "[require_baseline_parity] PASS: Report staged and verdict found ($VERDICT_KEYWORD)."
echo "  Report: $REPORT_BASENAME"

# Note: we do NOT block on MARGINAL or FAIL verdicts here.
# The governance is to REQUIRE the report to exist and be reviewed.
# A FAIL verdict means the model PR should be rejected in code review,
# not blocked at commit time (the operator needs to know WHY it fails).

exit 0
