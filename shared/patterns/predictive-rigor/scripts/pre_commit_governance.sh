#!/usr/bin/env bash
# Pre-commit governance hook.
#
# Runs on staged changes. Blocks commit (exit 2) if:
#   - THEMES_REGISTRY.yaml has schema errors
#   - A PFC-required theme moved to 'in_progress' or 'done' without PFC file
#   - A theme marked 'done' has no evidence_on_close
#   - A PR touches engine_v4_2/*.py without updating ASSUMPTION_LEDGER.md
#
# Install:
#   ln -sf ../../scripts/governance/pre_commit_governance.sh .git/hooks/pre-commit
#   OR
#   cp scripts/governance/pre_commit_governance.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit

set -u

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -z "$REPO_ROOT" ]; then
    echo "[governance] not in a git repo — skipping"
    exit 0
fi

cd "$REPO_ROOT"

STAGED=$(git diff --cached --name-only --diff-filter=AM)

# Quick bail if nothing staged
if [ -z "$STAGED" ]; then
    exit 0
fi

# --- Check 1: REGISTRY schema strict ---
if echo "$STAGED" | grep -q "docs/roadmap/THEMES_REGISTRY.yaml"; then
    echo "[governance] validating THEMES_REGISTRY.yaml..."
    if command -v python >/dev/null 2>&1; then
        if [ -f .venv312/bin/activate ]; then
            # shellcheck disable=SC1091
            . .venv312/bin/activate 2>/dev/null || true
        fi
        python scripts/governance/registry_check.py --strict >/tmp/gov_check.out 2>&1
        rc=$?
        if [ $rc -eq 2 ]; then
            echo "[governance] REGISTRY check FAILED. Details:"
            cat /tmp/gov_check.out
            exit 2
        elif [ $rc -eq 1 ]; then
            echo "[governance] REGISTRY check WARNINGS:"
            cat /tmp/gov_check.out
        fi
    else
        echo "[governance] WARN: python not found; skipping registry check"
    fi
fi

# --- Check 2: ASSUMPTION_LEDGER must update if engine_v4_2 changes (HARD — I16 done) ---
if echo "$STAGED" | grep -qE "^engine_v4_2/.*\.py$"; then
    if ! echo "$STAGED" | grep -q "docs/roadmap/ASSUMPTION_LEDGER.md"; then
        echo "[governance] BLOCKED: engine_v4_2/*.py changed but ASSUMPTION_LEDGER.md not updated."
        echo "  Rule L2-M13: each layer change MUST update the assumption ledger."
        echo "  Run: python scripts/governance/assumption_ledger.py check-pr --files \$(git diff --cached --name-only)"
        echo "  Then add/update assumption rows and re-stage ASSUMPTION_LEDGER.md."
        exit 2
    fi
    # Also validate the ledger is structurally sound after the update
    if command -v python >/dev/null 2>&1; then
        if [ -f .venv312/bin/activate ]; then
            # shellcheck disable=SC1091
            . .venv312/bin/activate 2>/dev/null || true
        fi
        python scripts/governance/assumption_ledger.py validate >/tmp/ledger_check.out 2>&1
        rc=$?
        if [ $rc -eq 2 ]; then
            echo "[governance] ASSUMPTION_LEDGER validation FAILED after update:"
            cat /tmp/ledger_check.out
            exit 2
        fi
    fi
fi

# --- Check 3: KNOWLEDGE_GRAPH should be appended (not modified) ---
if echo "$STAGED" | grep -q "docs/roadmap/KNOWLEDGE_GRAPH.md"; then
    # Simple heuristic: old lines must not disappear
    DIFF=$(git diff --cached docs/roadmap/KNOWLEDGE_GRAPH.md)
    REMOVED=$(echo "$DIFF" | grep -c "^-[^-]" || true)
    if [ "${REMOVED:-0}" -gt "5" ]; then
        echo "[governance] WARN: KNOWLEDGE_GRAPH.md had $REMOVED lines removed."
        echo "  Policy: append-only. Removing findings requires ADR."
    fi
fi

# --- Check 3b: LAIG scan for look-ahead patterns in staged .py files ---
PY_STAGED=$(echo "$STAGED" | grep -E "^(engine_v4_2/|scripts/).*\.py$" || true)
if [ -n "$PY_STAGED" ]; then
    echo "[governance] running LAIG scan on staged .py files..."
    if command -v python >/dev/null 2>&1; then
        if [ -f .venv312/bin/activate ]; then
            # shellcheck disable=SC1091
            . .venv312/bin/activate 2>/dev/null || true
        fi
        python scripts/governance/laig_scan.py --staged >/tmp/laig_scan.out 2>&1
        rc=$?
        if [ $rc -eq 2 ]; then
            echo "[governance] LAIG CRITICAL patterns detected — commit blocked."
            echo "  Rule M3: Every feature/target must be observable at decision time T-0."
            echo "  See docs/roadmap/templates/LAIG_CHECKLIST.md"
            cat /tmp/laig_scan.out
            exit 2
        elif [ $rc -eq 1 ]; then
            echo "[governance] LAIG warnings detected (non-blocking):"
            cat /tmp/laig_scan.out
        else
            echo "[governance] LAIG scan: PASS"
        fi
    else
        echo "[governance] WARN: python not found; skipping LAIG scan"
    fi
fi

# --- Check 4: PFC files committed must reference valid theme ID ---
#              AND auto-register §10 time budget (Rule M10 / Theme I18)
NEW_PFCS=$(echo "$STAGED" | grep -E "^docs/roadmap/pfc/[A-Z][0-9]+-.*\.md$" || true)
if [ -n "$NEW_PFCS" ]; then
    if command -v python >/dev/null 2>&1; then
        if [ -f .venv312/bin/activate ]; then
            # shellcheck disable=SC1091
            . .venv312/bin/activate 2>/dev/null || true
        fi
    fi

    for pfc in $NEW_PFCS; do
        base=$(basename "$pfc")
        # Extract theme ID (e.g. "D01" from "D01-PFC.md")
        tid=$(echo "$base" | cut -d'-' -f1)

        # Verify theme exists in registry
        if ! grep -q "id: $tid\b" docs/roadmap/THEMES_REGISTRY.yaml 2>/dev/null; then
            echo "[governance] ERROR: $pfc references theme $tid which does not exist in registry"
            exit 2
        fi

        # Auto-register §10 time budget via time_budget.py (Rule M10 / Theme I18)
        if command -v python >/dev/null 2>&1 && [ -f scripts/governance/time_budget.py ]; then
            echo "[governance] registering time budget from $pfc (Rule M10)..."
            PYTHONPATH=. python scripts/governance/time_budget.py register \
                --theme "$tid" --pfc "$pfc" >/tmp/time_budget_reg.out 2>&1
            rc=$?
            cat /tmp/time_budget_reg.out
            if [ $rc -eq 2 ]; then
                echo "[governance] BLOCKED: PFC §10 ratio < 0.4 for theme $tid."
                echo "  Rule M10: Y/(X+Y) >= 0.4 required. Increase falsification budget."
                exit 2
            elif [ $rc -eq 1 ]; then
                echo "[governance] WARN: time_budget register returned warnings for $tid."
            fi
            # Auto-stage the updated time_budget.yaml
            if [ -f docs/roadmap/time_budget.yaml ]; then
                git add docs/roadmap/time_budget.yaml
            fi
        fi
    done
fi

# --- Check 6: Sunk-cost declaration (Rule M6) ---
# Blocks commits that reopen archived scopes (engine_v4_2/*, ADR-phase9*, FAILURE_CRITERION)
# without an ADR-override-* staged and "Rule M6 override" in commit message.
SCG_TRIGGER=$(echo "$STAGED" | grep -E \
    "^engine_v4_2/|^docs/specs/ADR-phase9|^reports/FAILURE_CRITERION" || true)
if [ -n "$SCG_TRIGGER" ]; then
    echo "[governance] Check 6: sunk-cost guard (Rule M6) for staged archived-scope files..."
    if command -v python >/dev/null 2>&1; then
        if [ -f .venv312/bin/activate ]; then
            # shellcheck disable=SC1091
            . .venv312/bin/activate 2>/dev/null || true
        fi
        python scripts/governance/sunk_cost_guard.py check --staged \
            >/tmp/sunk_cost.out 2>&1
        rc=$?
        if [ $rc -eq 2 ]; then
            echo "[governance] SUNK-COST GUARD BLOCKED commit."
            cat /tmp/sunk_cost.out
            exit 2
        elif [ $rc -eq 1 ]; then
            echo "[governance] sunk-cost guard warnings:"
            cat /tmp/sunk_cost.out
        else
            echo "[governance] Check 6: PASS (no archived topic revival detected)"
        fi
    else
        echo "[governance] WARN: python not found; skipping sunk-cost guard"
    fi
fi

# --- Check 7: Goalpost lock (Rule M4) ---
# When a PFC is staged AND a lock exists: verify thresholds unchanged.
# When a NEW PFC is staged without lock: auto-lock it.
PFC_STAGED=$(echo "$STAGED" | grep -E "^docs/roadmap/pfc/[A-Z][0-9]+-.*\.md$" || true)
if [ -n "$PFC_STAGED" ]; then
    echo "[governance] Check 7: goalpost lock (Rule M4) for staged PFC files..."
    if command -v python >/dev/null 2>&1; then
        if [ -f .venv312/bin/activate ]; then
            # shellcheck disable=SC1091
            . .venv312/bin/activate 2>/dev/null || true
        fi

        for pfc in $PFC_STAGED; do
            base=$(basename "$pfc")
            tid=$(echo "$base" | cut -d'-' -f1)
            lock_file=$(ls "docs/roadmap/goalposts/${tid}-v"*.yaml 2>/dev/null | sort | tail -1)

            if [ -n "$lock_file" ]; then
                # Lock exists → verify. Block if thresholds changed (unless commit message has override).
                STAGED_MSG=$(cat .git/COMMIT_EDITMSG 2>/dev/null || echo "")
                if echo "$STAGED_MSG" | grep -q "Rule M4 override"; then
                    echo "[governance] Check 7: Rule M4 override found in commit message — skipping verify for $tid."
                else
                    PYTHONPATH=. python scripts/governance/goalpost_lock.py verify \
                        --theme "$tid" >/tmp/goalpost_verify.out 2>&1
                    rc=$?
                    cat /tmp/goalpost_verify.out
                    if [ $rc -eq 2 ]; then
                        echo "[governance] GOALPOST LOCK BLOCKED commit for $tid."
                        echo "  Rule M4: Thresholds changed since lock. Use override subcommand:"
                        echo "    python scripts/governance/goalpost_lock.py override \\"
                        echo "      --theme $tid --reason \"<rationale>\""
                        echo "  Then add 'Rule M4 override' to your commit message."
                        exit 2
                    fi
                fi
            else
                # No lock yet → auto-lock this PFC
                echo "[governance] Check 7: no lock for $tid — auto-locking PFC $pfc..."
                PYTHONPATH=. python scripts/governance/goalpost_lock.py lock \
                    --theme "$tid" --pfc "$pfc" >/tmp/goalpost_lock.out 2>&1
                rc=$?
                cat /tmp/goalpost_lock.out
                if [ $rc -eq 0 ]; then
                    new_lock=$(ls "docs/roadmap/goalposts/${tid}-v"*.yaml 2>/dev/null | sort | tail -1)
                    if [ -n "$new_lock" ]; then
                        git add "$new_lock"
                        echo "[governance] Auto-staged: $new_lock"
                    fi
                elif [ $rc -eq 2 ]; then
                    echo "[governance] WARN: goalpost auto-lock failed for $tid (non-blocking)."
                fi
            fi
        done
    else
        echo "[governance] WARN: python not found; skipping goalpost lock check"
    fi
fi

# --- Check 8: Checkpoint cadence (G15) ---
# When a theme status changes to 'done' in the registry, verify no checkpoint is overdue.
# Exit 2 (overdue) blocks the commit — operator must file + commit checkpoint first.
if echo "$STAGED" | grep -q "docs/roadmap/THEMES_REGISTRY.yaml"; then
    DONE_NOW=$(git show :docs/roadmap/THEMES_REGISTRY.yaml 2>/dev/null \
        | grep -c "status: done" || true)
    DONE_BEFORE=$(git show HEAD:docs/roadmap/THEMES_REGISTRY.yaml 2>/dev/null \
        | grep -c "status: done" || true)
    if [ "${DONE_NOW:-0}" -gt "${DONE_BEFORE:-0}" ]; then
        echo "[governance] Check 8: new theme(s) closed — checking checkpoint cadence (G15)..."
        if command -v python >/dev/null 2>&1; then
            if [ -f .venv312/bin/activate ]; then
                # shellcheck disable=SC1091
                . .venv312/bin/activate 2>/dev/null || true
            fi
            python scripts/governance/checkpoint_monitor.py status >/tmp/cp_monitor.out 2>&1
            rc=$?
            cat /tmp/cp_monitor.out
            if [ $rc -eq 2 ]; then
                echo "[governance] BLOCKED: checkpoint overdue (G15)."
                echo "  Done themes exceed last checkpoint by >2. File the checkpoint first:"
                echo "    python scripts/governance/checkpoint_monitor.py template --n <next>"
                echo "  Fill Q1/Q2/Q3 in the generated draft, then commit the draft file."
                exit 2
            fi
        else
            echo "[governance] WARN: python not found; skipping checkpoint cadence check"
        fi
    fi
fi

# --- Check 9: KNOWLEDGE_GRAPH append-only (G19) ---
# If KNOWLEDGE_GRAPH.md is staged, verify only additions (no removals).
# Removals require "ADR-override knowledge" in commit message.
if echo "$STAGED" | grep -q "docs/roadmap/KNOWLEDGE_GRAPH.md"; then
    echo "[governance] Check 9: knowledge_graph append-only (G19)..."
    if command -v python >/dev/null 2>&1; then
        if [ -f .venv312/bin/activate ]; then
            # shellcheck disable=SC1091
            . .venv312/bin/activate 2>/dev/null || true
        fi
        python scripts/governance/knowledge_graph_validator.py append-check \
            >/tmp/kg_append.out 2>&1
        rc=$?
        cat /tmp/kg_append.out
        if [ $rc -eq 2 ]; then
            echo "[governance] BLOCKED: KNOWLEDGE_GRAPH.md removals without override."
            echo "  Policy: append-only audit trail (G19). To override:"
            echo "    Add 'ADR-override knowledge' to commit message with rationale."
            exit 2
        fi
        echo "[governance] Check 9: PASS"
    else
        echo "[governance] WARN: python not found; skipping KG append-check"
    fi
fi

# --- Check 10: Replay trigger warning (I04) ---
# If engine_v4_2/*.py or replay scripts are staged, warn that replay should be run post-merge.
# Does NOT run replay inline (too slow for pre-commit — operator runs manually).
REPLAY_TRIGGER=$(echo "$STAGED" | grep -E \
    "^engine_v4_2/.*\.py$|^scripts/replay_decision_pipeline\.py$|^scripts/governance/baseline_parity\.py$" \
    || true)
if [ -n "$REPLAY_TRIGGER" ]; then
    echo "[governance] Check 10: replay trigger detected (I04)..."
    if command -v python >/dev/null 2>&1; then
        if [ -f .venv312/bin/activate ]; then
            # shellcheck disable=SC1091
            . .venv312/bin/activate 2>/dev/null || true
        fi
        TRIGGER_FILES=$(echo "$REPLAY_TRIGGER" | tr '\n' ' ')
        # shellcheck disable=SC2086
        python scripts/governance/replay_auto_runner.py check-trigger \
            --files $TRIGGER_FILES >/tmp/replay_trigger.out 2>&1
        rc=$?
        cat /tmp/replay_trigger.out
        if [ $rc -eq 1 ]; then
            echo "[governance] WARN (non-blocking): engine/replay files changed."
            echo "  After merge, run:"
            echo "    PYTHONPATH=. python scripts/governance/replay_auto_runner.py run --walkforward"
            echo "  This detects ROI regression vs last_good.json baseline."
            # exit 0 intentionally — pre-commit is warn-only for replay (too slow)
        fi
    else
        echo "[governance] WARN: python not found; skipping replay trigger check"
    fi
fi

# --- Check 11: Baseline parity required for model PRs (L7-M16 + M03) ---
# Any PR adding/modifying scripts/run_*.py OR engine_v4_2/*_model.py
# must have a baseline_parity report staged in the commit.
# Report must show model beats LogReg+L4 baseline per M03-PFC thresholds.
MODEL_STAGED=$(echo "$STAGED" | grep -E \
    "^scripts/run_[^/]+\.py$|^engine_v4_2/[^/]+_model\.py$" || true)
if [ -n "$MODEL_STAGED" ]; then
    echo "[governance] Check 11: baseline parity required (L7-M16 + M03)..."
    if command -v bash >/dev/null 2>&1 && [ -f scripts/governance/require_baseline_parity.sh ]; then
        bash scripts/governance/require_baseline_parity.sh --staged >/tmp/baseline_parity_check.out 2>&1
        rc=$?
        cat /tmp/baseline_parity_check.out
        if [ $rc -eq 2 ]; then
            echo "[governance] BLOCKED: model PR without baseline_parity report."
            echo "  Rule L7-M16: LogReg+L4 must be run BEFORE any complex model."
            echo "  Run: PYTHONPATH=. python scripts/analysis/m03_baseline_parity_l4.py"
            echo "  Then: git add reports/m03_baseline_parity_l4_*.md"
            exit 2
        elif [ $rc -eq 1 ]; then
            echo "[governance] WARN (non-blocking): baseline report exists but not staged."
            echo "  Consider: git add reports/m03_baseline_parity_l4_*.md"
        else
            echo "[governance] Check 11: PASS"
        fi
    else
        echo "[governance] WARN: require_baseline_parity.sh not found; skipping Check 11"
    fi
fi

# --- Check 13: Confounding check required for segment-based strategy PRs (L8-R2 / M11) ---
# Any PR adding/modifying files that propose or reference a segment-based strategy
# (files matching reports/m*segment*, reports/l8*, scripts/analysis/*segment*,
#  or engine_v4_2/*niche*) MUST include confounding_check output.
# Confounding_check output = a report file staged that contains "confounded_by_fav_tier"
#   OR staged alongside a confounding_check report/reference.
SEGMENT_STRATEGY_TRIGGER=$(echo "$STAGED" | grep -iE \
    "^reports/.*segment|^reports/l8|^scripts/analysis/.*segment|^engine_v4_2/.*niche" \
    || true)
if [ -n "$SEGMENT_STRATEGY_TRIGGER" ]; then
    echo "[governance] Check 13: segment-based strategy detected (L8-R2 / M11)..."

    # Check if confounding_check output is staged alongside
    CONFOUND_OUTPUT_STAGED=$(echo "$STAGED" | grep -iE \
        "^reports/m11_confounding|confounding_check" || true)
    if [ -z "$CONFOUND_OUTPUT_STAGED" ]; then
        # Allow if the staged report file already contains confounding_check evidence
        CONFOUND_IN_REPORT=0
        for f in $SEGMENT_STRATEGY_TRIGGER; do
            if git show ":$f" 2>/dev/null | grep -qiE "confounded_by_fav_tier|confounding_check"; then
                CONFOUND_IN_REPORT=1
                break
            fi
        done

        if [ "$CONFOUND_IN_REPORT" -eq 0 ]; then
            echo "[governance] BLOCKED: segment-based strategy PR without confounding_check output."
            echo "  Rule L8-R2 (M11): Any segment claim MUST include fav_tier confounding check."
            echo "  Run: PYTHONPATH=. python scripts/governance/confounding_check.py --segment <col> --metric brier"
            echo "  Or:  PYTHONPATH=. python scripts/governance/confounding_check.py --audit"
            echo "  Then include the output in your report or stage: reports/m11_confounding_<stamp>.md"
            exit 2
        else
            echo "[governance] Check 13: confounding evidence found in staged report(s). PASS"
        fi
    else
        echo "[governance] Check 13: confounding_check output staged. PASS"
    fi
fi

# --- Check 12: Heteroscedasticity check required for brier/NLL model PRs (M10-L8-R1) ---
# Any PR staging scripts/run_*.py or engine_v4_2/*_model.py that contains brier/nll/log_loss
# must include a heteroscedasticity report (reports/m10_heteroscedasticity_tool_*.md).
# If missing: WARN (rc=1 for report existing but not staged) or BLOCK (rc=2 for absent).
MODEL_BRIER_STAGED=$(echo "$STAGED" | grep -E \
    "^scripts/run_[^/]+\.py$|^engine_v4_2/[^/]+_model\.py$" || true)
if [ -n "$MODEL_BRIER_STAGED" ]; then
    echo "[governance] Check 12: heteroscedasticity check for brier/NLL models (M10 L8-R1)..."
    if command -v python >/dev/null 2>&1; then
        if [ -f .venv312/bin/activate ]; then
            # shellcheck disable=SC1091
            . .venv312/bin/activate 2>/dev/null || true
        fi
        # Build staged file list as space-separated args
        STAGED_FILE_ARGS=$(echo "$STAGED" | tr '\n' ' ')
        # shellcheck disable=SC2086
        PYTHONPATH=. python scripts/governance/heteroscedasticity_check.py --validate \
            --staged-files $STAGED_FILE_ARGS >/tmp/heterosc_check.out 2>&1
        rc=$?
        cat /tmp/heterosc_check.out
        if [ $rc -eq 2 ]; then
            echo "[governance] BLOCKED (Check 12): brier/NLL model staged without heteroscedasticity report."
            echo "  Rule L8-R1 (M10): AUC > 0.5 on Brier error may be trivial fav_tier variance."
            echo "  Run: PYTHONPATH=. python scripts/governance/heteroscedasticity_check.py \\"
            echo "         --demo-m01 --db \$DB_URL --out-dir reports/"
            echo "  Then: git add reports/m10_heteroscedasticity_tool_*.md"
            exit 2
        elif [ $rc -eq 1 ]; then
            echo "[governance] WARN (Check 12): heteroscedasticity report exists but not staged."
            echo "  Consider: git add reports/m10_heteroscedasticity_tool_*.md"
        else
            echo "[governance] Check 12: PASS"
        fi
    else
        echo "[governance] WARN: python not found; skipping Check 12 (heteroscedasticity)"
    fi
fi

exit 0
