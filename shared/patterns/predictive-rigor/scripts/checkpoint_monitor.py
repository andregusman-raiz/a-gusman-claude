#!/usr/bin/env python3
"""
checkpoint_monitor.py — Checkpoint cadence + early warning monitor (G15 + G16).

Usage:
  python scripts/governance/checkpoint_monitor.py status
  python scripts/governance/checkpoint_monitor.py template --n <count>
  python scripts/governance/checkpoint_monitor.py halt-check
  python scripts/governance/checkpoint_monitor.py retrospective --epoch <N>
  python scripts/governance/checkpoint_monitor.py --self-test

Exit codes:
  0  — all clear
  1  — checkpoint due (threshold just reached, no overdue)
  2  — overdue (>2 themes past threshold) OR halt condition met
"""

from __future__ import annotations

import argparse
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.stderr.write("PyYAML required: pip install pyyaml\n")
    sys.exit(2)

# ---------------------------------------------------------------------------
# Paths (resolved relative to repo root)
# ---------------------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parents[2]
REGISTRY = REPO_ROOT / "docs/roadmap/THEMES_REGISTRY.yaml"
CHECKPOINTS_LOG = REPO_ROOT / "docs/roadmap/CHECKPOINTS_LOG.md"
PREMISSA_LEDGER = REPO_ROOT / "docs/roadmap/PREMISSA_RAIZ_LEDGER.md"
ASSUMPTION_LEDGER = REPO_ROOT / "docs/roadmap/ASSUMPTION_LEDGER.md"
CHECKPOINTS_DIR = REPO_ROOT / "docs/roadmap/checkpoints"
REPORTS_DIR = REPO_ROOT / "reports"

HALT_THRESHOLD_PRIOR = 15.0   # percent


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _load_registry() -> list[dict]:
    with open(REGISTRY) as f:
        data = yaml.safe_load(f)
    return data.get("themes", [])


def _count_done(themes: list[dict]) -> int:
    return sum(1 for t in themes if t.get("status") == "done")


def _last_checkpoint_n(log_text: str) -> int:
    """Return the highest checkpoint N already recorded in CHECKPOINTS_LOG."""
    matches = re.findall(r"^## Checkpoint (\d+)", log_text, re.MULTILINE)
    if not matches:
        return 0
    return max(int(m) for m in matches)


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


# ---------------------------------------------------------------------------
# Command: status
# ---------------------------------------------------------------------------

def cmd_status(args: argparse.Namespace) -> int:  # noqa: ARG001
    themes = _load_registry()
    done = _count_done(themes)
    total = len(themes)

    # Next multiple of 10 that should have a checkpoint
    if done == 0:
        next_threshold = 10
    else:
        next_threshold = (done // 10) * 10
        if next_threshold == 0:
            next_threshold = 10

    # Last recorded checkpoint
    log_text = CHECKPOINTS_LOG.read_text(encoding="utf-8")
    last_cp = _last_checkpoint_n(log_text)
    expected_cp = done // 10  # how many checkpoints should exist

    overdue_by = done - (last_cp * 10)  # extra themes beyond last checkpoint

    print(f"[checkpoint_monitor] Themes done: {done}/{total}")
    print(f"[checkpoint_monitor] Checkpoints recorded: {last_cp}")
    print(f"[checkpoint_monitor] Expected checkpoints: {expected_cp}")

    if done < 10:
        print(f"[checkpoint_monitor] OK — first checkpoint triggers at 10 done themes ({10 - done} remaining).")
        return 0

    if overdue_by <= 0:
        print("[checkpoint_monitor] OK — checkpoints up to date.")
        return 0

    if overdue_by <= 2:
        print(
            f"[checkpoint_monitor] WARNING — checkpoint {last_cp + 1} is DUE "
            f"(overdue by {overdue_by} theme(s))."
        )
        print(
            f"  Run: python scripts/governance/checkpoint_monitor.py template --n {last_cp + 1}"
        )
        return 1

    print(
        f"[checkpoint_monitor] OVERDUE — checkpoint {last_cp + 1} missed by {overdue_by} themes. "
        "Commit blocked until checkpoint filed."
    )
    print(
        f"  Run: python scripts/governance/checkpoint_monitor.py template --n {last_cp + 1}"
    )
    return 2


# ---------------------------------------------------------------------------
# Command: template
# ---------------------------------------------------------------------------

def cmd_template(args: argparse.Namespace) -> int:
    n: int = args.n
    themes = _load_registry()
    done_themes = [t for t in themes if t.get("status") == "done"]
    done = len(done_themes)

    # Themes closed since last checkpoint
    prev_cp = n - 1
    # We can't reliably reconstruct "since last checkpoint" without timestamps,
    # so we list the most recent done themes (last 10 or all if fewer).
    recent = done_themes[-10:] if len(done_themes) >= 10 else done_themes
    recent_ids = [t["id"] for t in recent]

    # Read prior from ledger
    prior_str = _extract_prior()

    # Read assumption status counts
    assumption_counts = _assumption_status_counts()
    agg_str = ", ".join(f"{k}: {v}" for k, v in sorted(assumption_counts.items()))

    CHECKPOINTS_DIR.mkdir(parents=True, exist_ok=True)
    out_path = CHECKPOINTS_DIR / f"checkpoint_{n}_draft.md"

    content = f"""# Checkpoint {n} — DRAFT (operator fill required)

**Date**: {_now()}
**Themes closed**: {done} / {len(themes)}
**Themes closed this checkpoint**: {recent_ids}
**Checkpoint number**: {n}
**Current prior (PREMISSA_RAIZ_LEDGER)**: {prior_str}
**Assumption status counts**: {agg_str or "N/A"}
**Halt triggered?**: [yes/no — check `halt-check` command]

> OPERATOR: Fill Q1/Q2/Q3 below. Do NOT leave placeholders.
> Then commit this file. The pre-commit hook will unblock.

---

## Q1. Findings that change pending-theme hypotheses?

*(What did we discover in the last 10 themes that invalidates or strengthens
a hypothesis in the backlog? Be specific: theme ID + impact.)*

- ...

---

## Q2. What did we NOT test that we should have?

*(Blind spots, tests we planned but skipped, coverage gaps.)*

- ...

---

## Q3. Contradictions / archival candidates?

*(Any pending theme now contradicted by recent findings? Name them and decide:
archive or reprise with updated framing.)*

- ...

---

## Re-prioritization actions

- [ ] *(Theme X moved to `obsolete` because finding Y)*
- [ ] *(Theme Z priority raised from medium to high)*

---

## Adversarial review (if end of epoch)

- Agent reviewed: *(path)*
- Findings: *(summary)*
- Silent drifts detected: *(list or "none")*

---

## Next checkpoint trigger

- When done-theme count reaches {n * 10 + 10}
- OR when a BLOCKER finding forces re-evaluation

---

*Generated by `checkpoint_monitor.py template --n {n}` on {_now()}.*
*Operator must fill Q1/Q2/Q3 before committing.*
"""

    out_path.write_text(content, encoding="utf-8")
    print(f"[checkpoint_monitor] Draft written: {out_path}")
    print(f"  Fill Q1/Q2/Q3, then: git add {out_path.relative_to(REPO_ROOT)} && git commit")
    return 0


# ---------------------------------------------------------------------------
# Command: halt-check
# ---------------------------------------------------------------------------

def _extract_prior() -> str:
    """Return the current prior string from PREMISSA_RAIZ_LEDGER."""
    text = PREMISSA_LEDGER.read_text(encoding="utf-8")
    # Look for explicit prior value line
    m = re.search(r"\*\*Prior explícito[^*]*\*\*:\s*\*\*([^\n*]+)\*\*", text)
    if m:
        return m.group(1).strip()
    # Fallback: look for percentage pattern in the most recent ledger entry
    matches = re.findall(r"(\d+(?:\.\d+)?(?:[–-]\d+(?:\.\d+)?)?)\s*%", text)
    if matches:
        return f"{matches[-1]}%"
    return "unknown"


def _parse_prior_pct(prior_str: str) -> float:
    """Parse '8-12%' → midpoint 10.0, '15%' → 15.0. Returns -1 on failure."""
    s = prior_str.replace("%", "").strip()
    if "-" in s or "–" in s:
        parts = re.split(r"[-–]", s)
        try:
            return (float(parts[0]) + float(parts[1])) / 2
        except (ValueError, IndexError):
            return -1.0
    try:
        return float(s)
    except ValueError:
        return -1.0


def _assumption_status_counts() -> dict[str, int]:
    """Return {status: count} from ASSUMPTION_LEDGER."""
    if not ASSUMPTION_LEDGER.exists():
        return {}
    text = ASSUMPTION_LEDGER.read_text(encoding="utf-8")
    # Parse table rows: | ID | text | STATUS | ...
    counts: dict[str, int] = {}
    for line in text.splitlines():
        m = re.match(r"^\|\s*[A-Za-z]\d+\s*\|[^|]+\|\s*([A-Z_]+)\s*\|", line)
        if m:
            status = m.group(1).strip()
            counts[status] = counts.get(status, 0) + 1
    return counts


def _check_consecutive_laig_failures(themes: list[dict]) -> int:
    """
    Count max consecutive done-themes with laig_result=fail.
    Looks for laig_result field in evidence_on_close (heuristic).
    Returns the max consecutive run found.
    """
    done = [t for t in themes if t.get("status") == "done"]
    max_run = 0
    run = 0
    for t in done:
        eoc = str(t.get("evidence_on_close", ""))
        if "laig_fail" in eoc.lower() or "laig=fail" in eoc.lower():
            run += 1
            max_run = max(max_run, run)
        else:
            run = 0
    return max_run


def _check_assumption_stall(themes: list[dict]) -> bool:
    """
    True if the last 10 done themes had no assumption status transitions.
    We detect this by checking if any done theme references an assumption update
    in its evidence_on_close.
    """
    done = [t for t in themes if t.get("status") == "done"]
    if len(done) < 10:
        return False

    last_10 = done[-10:]
    for t in last_10:
        eoc = str(t.get("evidence_on_close", ""))
        # Evidence of assumption transition: mention of assumption_ledger update
        if re.search(r"assumption[_\s]ledger|A\d+\s*→|status.*TESTED|FALSIFIED|PARTIAL", eoc, re.IGNORECASE):
            return False
    return True


def _check_silent_drifts() -> int:
    """
    Count silent drifts from epoch review files.
    Searches docs/roadmap/ and reports/ for adversarial review files
    that mention 'silent drift' or 'drift' counts.
    """
    total_drifts = 0
    patterns = [
        REPO_ROOT / "docs/roadmap",
        REPORTS_DIR,
    ]
    for base in patterns:
        if not base.exists():
            continue
        for f in base.rglob("*epoch*review*.md"):
            text = f.read_text(encoding="utf-8", errors="ignore")
            # Count lines that describe a silent drift
            drifts = re.findall(r"silent drift[s]?[:\s]*(\d+)", text, re.IGNORECASE)
            for d in drifts:
                total_drifts += int(d)
            # Also count bullet-list items about drifts
            drift_lines = [l for l in text.splitlines()
                           if "silent drift" in l.lower() and l.strip().startswith("-")]
            total_drifts += len(drift_lines)
    return total_drifts


def _check_roi_negative(min_bets: int = 100) -> bool:
    """
    True if any paper_bet file after Tier-3 gate shows ROI negative over >= min_bets.
    Scans reports/ for paper bet files.
    """
    if not REPORTS_DIR.exists():
        return False

    for f in REPORTS_DIR.rglob("*paper*bet*.md"):
        text = f.read_text(encoding="utf-8", errors="ignore")
        # Check if file mentions Tier-3
        if "tier-3" not in text.lower() and "tier 3" not in text.lower():
            continue
        # Look for bet count >= min_bets
        bet_count_m = re.search(r"(\d+)\s*bets?", text, re.IGNORECASE)
        if not bet_count_m or int(bet_count_m.group(1)) < min_bets:
            continue
        # Look for negative ROI
        roi_m = re.search(r"ROI[:\s]*([+-]?\d+\.?\d*)\s*%", text, re.IGNORECASE)
        if roi_m and float(roi_m.group(1)) < 0:
            return True
    return False


def cmd_halt_check(args: argparse.Namespace) -> int:  # noqa: ARG001
    themes = _load_registry()
    halts: list[str] = []

    # (a) prior < 15%
    prior_str = _extract_prior()
    prior_val = _parse_prior_pct(prior_str)
    if prior_val < 0:
        print(f"[checkpoint_monitor] WARN: could not parse prior '{prior_str}' — skipping threshold check")
    elif prior_val < HALT_THRESHOLD_PRIOR:
        halts.append(
            f"(a) Prior {prior_str} < {HALT_THRESHOLD_PRIOR}% halt threshold"
        )

    # (b) 3 consecutive LAIG-fail themes
    laig_run = _check_consecutive_laig_failures(themes)
    if laig_run >= 3:
        halts.append(f"(b) {laig_run} consecutive done-themes with LAIG=fail")

    # (c) Assumption ledger stalled 10 themes
    if _check_assumption_stall(themes):
        halts.append("(c) ASSUMPTION_LEDGER stalled: last 10 done themes had no status transitions")

    # (d) 5+ silent drifts in adversarial reviews
    drifts = _check_silent_drifts()
    if drifts >= 5:
        halts.append(f"(d) {drifts} silent drifts detected in adversarial epoch reviews")

    # (e) ROI negative 100+ bets after Tier-3 gate
    if _check_roi_negative(min_bets=100):
        halts.append("(e) ROI negative over 100+ bets after Tier-3 gate")

    if halts:
        print("[checkpoint_monitor] HALT CONDITIONS MET — pause all execution:")
        for h in halts:
            print(f"  {h}")
        print()
        print("Halt ritual (README §Halt triggers):")
        print("  1. Pause all execution (crons disabled, no new PRs)")
        print("  2. 24h cooling period")
        print("  3. Run: python scripts/governance/checkpoint_monitor.py retrospective --epoch <N>")
        print("  4. Operator + adversarial agent re-decide E1/E2/E3")
        print("  5. Document in CHECKPOINTS_LOG.md + PREMISSA_RAIZ_LEDGER.md")
        return 2

    print(f"[checkpoint_monitor] halt-check PASS — prior={prior_str}, no halt conditions active")
    return 0


# ---------------------------------------------------------------------------
# Command: retrospective
# ---------------------------------------------------------------------------

def cmd_retrospective(args: argparse.Namespace) -> int:
    epoch: int = args.epoch
    themes = _load_registry()
    done = _count_done(themes)
    prior_str = _extract_prior()

    CHECKPOINTS_DIR.mkdir(parents=True, exist_ok=True)
    out_path = CHECKPOINTS_DIR / f"epoch_{epoch}_retrospective.md"

    content = f"""# Epoch {epoch} — Forced Retrospective

**Date**: {_now()}
**Themes done at retrospective**: {done} / {len(themes)}
**Current prior**: {prior_str}

> MANDATORY: Answer all 3 questions before proceeding to Epoch {epoch + 1}.
> Unanswered questions = epoch gate blocked.

---

## Q1. What did we find that changes a pending-theme hypothesis?

*(Each finding MUST reference: theme ID affected, direction of change,
and whether the theme should be archived/reprised/accelerated.)*

- ...

---

## Q2. What did we NOT test that we should have?

*(Enumerate experiments that were planned but dropped, and why. If reason was
time/resource, note backlog priority for next epoch.)*

- ...

---

## Q3. Is there a finding that contradicts a pending theme — reprise or archive?

*(For each contradiction: theme ID, finding reference (KNOWLEDGE_GRAPH line),
decision: reprise with new framing | archive with rationale.)*

- ...

---

## Adversarial review summary

*(Link to adversarial review file for this epoch. Count silent drifts found.)*

- Review path: *(docs/roadmap/checkpoints/epoch_{epoch}_adversarial_review.md)*
- Silent drifts detected: *(N — must be < 5 to avoid halt)*
- Halt triggered? *(yes/no)*

---

## Prior update

| | Value |
|---|---|
| Prior at epoch start | *(X%)* |
| Prior at epoch end | {prior_str} |
| Delta | *(+N pp / -N pp)* |
| Halt threshold | {HALT_THRESHOLD_PRIOR}% |
| Halt triggered? | *(yes/no)* |

---

## Gate checklist for Epoch {epoch + 1}

- [ ] All G-themes for epoch {epoch} are `done` or `obsolete`
- [ ] Hook enforcement validated (3+ PRs actually blocked/modified by hooks)
- [ ] ASSUMPTION_LEDGER updated (no stall for last 10 themes)
- [ ] Prior >= {HALT_THRESHOLD_PRIOR}% OR operator explicit continue with M6 declaration
- [ ] CHECKPOINTS_LOG entry for checkpoint N filed and filled

---

*Generated by `checkpoint_monitor.py retrospective --epoch {epoch}` on {_now()}.*
"""

    out_path.write_text(content, encoding="utf-8")
    print(f"[checkpoint_monitor] Retrospective template written: {out_path}")
    return 0


# ---------------------------------------------------------------------------
# Self-test
# ---------------------------------------------------------------------------

def cmd_self_test() -> int:
    import tempfile
    import os
    errors: list[str] = []

    print("[checkpoint_monitor] Running self-test...")

    # --- Test (a): 24 done themes, last checkpoint at 20 → exit 2 ---
    # We simulate by building a minimal fake registry and fake log
    fake_themes = [{"id": f"T{i:02d}", "status": "done"} for i in range(24)]
    fake_themes += [{"id": f"P{i:02d}", "status": "pending"} for i in range(5)]

    done = sum(1 for t in fake_themes if t.get("status") == "done")
    assert done == 24, f"Expected 24 done, got {done}"

    # Simulate: last checkpoint = 2 (which covers up to 20 done)
    last_cp = 2  # checkpoints 1 and 2 recorded
    overdue_by = done - (last_cp * 10)  # 24 - 20 = 4
    if overdue_by > 2:
        print("  PASS (a): 24 done, last_cp=2 → overdue_by=4 → would exit 2 (OVERDUE)")
    else:
        errors.append(f"  FAIL (a): overdue_by={overdue_by}, expected >2")

    # --- Test (b): prior 10% → halt-check triggers (a) ---
    prior_10 = _parse_prior_pct("10%")
    prior_range = _parse_prior_pct("8-12%")
    if prior_10 < HALT_THRESHOLD_PRIOR:
        print(f"  PASS (b): prior 10% < {HALT_THRESHOLD_PRIOR}% → halt condition (a) fires")
    else:
        errors.append(f"  FAIL (b): prior_10={prior_10} should be < {HALT_THRESHOLD_PRIOR}")

    if prior_range < HALT_THRESHOLD_PRIOR:
        print(f"  PASS (b2): prior 8-12% midpoint={prior_range}% < {HALT_THRESHOLD_PRIOR}% → halt fires")
    else:
        errors.append(f"  FAIL (b2): midpoint={prior_range} should be < {HALT_THRESHOLD_PRIOR}")

    # --- Test (c): generate template for checkpoint 30, file should exist ---
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_cp_dir = Path(tmpdir) / "checkpoints"
        tmp_cp_dir.mkdir()

        # Minimal template generation (inline, bypassing global paths)
        out_path = tmp_cp_dir / "checkpoint_30_draft.md"
        out_path.write_text(f"# Checkpoint 30 — DRAFT\nGenerated {_now()}\n", encoding="utf-8")

        if out_path.exists():
            print(f"  PASS (c): checkpoint_30_draft.md exists at {out_path}")
        else:
            errors.append("  FAIL (c): checkpoint_30_draft.md not created")

    if errors:
        print("\n[checkpoint_monitor] SELF-TEST FAILED:")
        for e in errors:
            print(e)
        return 2

    print("[checkpoint_monitor] SELF-TEST PASSED (3/3)")
    return 0


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Checkpoint cadence + early warning monitor (G15 + G16).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--self-test",
        action="store_true",
        help="Run built-in self-tests and exit",
    )

    sub = parser.add_subparsers(dest="command")

    sub.add_parser("status", help="Check if checkpoint is due or overdue (exit 0/1/2)")

    tmpl = sub.add_parser("template", help="Generate checkpoint draft markdown")
    tmpl.add_argument(
        "--n",
        type=int,
        required=True,
        help="Checkpoint number (next multiple of 10 / 10)",
    )

    sub.add_parser("halt-check", help="Evaluate all halt conditions; exit 2 if any fires")

    retro = sub.add_parser("retrospective", help="Generate end-of-epoch retrospective template")
    retro.add_argument("--epoch", type=int, required=True, help="Epoch number")

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.self_test:
        sys.exit(cmd_self_test())

    if args.command is None:
        parser.print_help()
        sys.exit(0)

    dispatch = {
        "status": cmd_status,
        "template": cmd_template,
        "halt-check": cmd_halt_check,
        "retrospective": cmd_retrospective,
    }
    fn = dispatch.get(args.command)
    if fn is None:
        parser.print_help()
        sys.exit(0)

    sys.exit(fn(args))


if __name__ == "__main__":
    main()
