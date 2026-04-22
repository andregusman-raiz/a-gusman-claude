"""Replay auto-runner — regression detection for engine_v4_2 changes.

Wraps scripts/replay_decision_pipeline.py with:
  - trigger detection (which files should cause a replay)
  - baseline comparison (regression if ROI drops > 1pp vs last_good.json)
  - last_good.json update on clean run
  - self-test (trigger logic only, does NOT run full replay)

Commands:
  check-trigger --files f1 f2 ...   exit 0=no trigger, 1=trigger needed
  run [--walkforward] [--home-only]  run replay, compare, update baseline
  --self-test                        validate trigger logic with fake inputs

Exit codes:
  0  no trigger / run clean / self-test pass
  1  trigger needed (check-trigger) / self-test minor issue
  2  regression detected / hard failure
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
BASELINES_DIR = REPO_ROOT / "docs/roadmap/replay_baselines"
LAST_GOOD_PATH = BASELINES_DIR / "last_good.json"
REPORTS_DIR = REPO_ROOT / "reports"

# Files that trigger a replay when changed
TRIGGER_PATTERNS = [
    # engine modules
    "engine_v4_2/",
    # replay scripts
    "scripts/replay_decision_pipeline.py",
    "scripts/governance/baseline_parity.py",
]

# Regression threshold: ROI per bet drop larger than this triggers exit 2
ROI_REGRESSION_THRESHOLD_PP = 1.0  # 1 percentage point

# Metrics extracted from replay report file
METRIC_KEYS = ("roi_per_bet", "mean_clv", "n_bets", "win_rate", "max_dd_pct")


def _matches_trigger(file_path: str) -> bool:
    for pat in TRIGGER_PATTERNS:
        if file_path.startswith(pat) or pat in file_path:
            return True
    return False


def cmd_check_trigger(args: argparse.Namespace) -> int:
    files = args.files or []
    triggered = [f for f in files if _matches_trigger(f)]
    if triggered:
        print(f"TRIGGER: {len(triggered)} file(s) require replay:")
        for f in triggered:
            print(f"  {f}")
        print(
            "\nRun after merge: "
            "PYTHONPATH=. python scripts/governance/replay_auto_runner.py run --walkforward"
        )
        return 1
    print(f"check-trigger: no trigger (checked {len(files)} file(s))")
    return 0


def _parse_metrics_from_report(report_path: Path) -> dict:
    """Extract key metrics from a replay report markdown file."""
    metrics: dict = {}
    if not report_path.exists():
        return metrics
    text = report_path.read_text()
    import re
    # ROI/bet line: "ROI/bet=+0.0137" or "ROI/BET=+0.0137"
    m = re.search(r"ROI/BET=([+-]?\d+\.\d+)", text, re.IGNORECASE)
    if m:
        metrics["roi_per_bet"] = float(m.group(1))
    # BETS=N
    m = re.search(r"BETS=(\d+)", text)
    if m:
        metrics["n_bets"] = int(m.group(1))
    # WIN_RATE=0.XXXX
    m = re.search(r"WIN_RATE=(\d+\.\d+)", text)
    if m:
        metrics["win_rate"] = float(m.group(1))
    # MAX_DD=XX.X%
    m = re.search(r"MAX_DD=(\d+\.\d+)", text)
    if m:
        metrics["max_dd_pct"] = float(m.group(1))
    # MEAN_CLV=+/-0.XXXX
    m = re.search(r"MEAN_CLV=([+-]?\d+\.\d+)", text)
    if m:
        metrics["mean_clv"] = float(m.group(1))
    return metrics


def _load_last_good() -> dict:
    if not LAST_GOOD_PATH.exists():
        return {}
    with open(LAST_GOOD_PATH) as f:
        return json.load(f)


def _save_last_good(metrics: dict, report_path: str, flags: dict) -> None:
    BASELINES_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "report": report_path,
        "flags": flags,
        "metrics": metrics,
    }
    with open(LAST_GOOD_PATH, "w") as f:
        json.dump(payload, f, indent=2)
    print(f"Baseline updated: {LAST_GOOD_PATH}")


def _compare_metrics(current: dict, baseline: dict) -> list[str]:
    """Return list of regression messages (empty = no regression)."""
    regressions: list[str] = []
    cur_roi = current.get("roi_per_bet")
    base_roi = baseline.get("metrics", {}).get("roi_per_bet")
    if cur_roi is not None and base_roi is not None:
        drop_pp = (base_roi - cur_roi) * 100
        if drop_pp > ROI_REGRESSION_THRESHOLD_PP:
            regressions.append(
                f"ROI regression: {base_roi*100:+.2f}% → {cur_roi*100:+.2f}% "
                f"(drop={drop_pp:.2f}pp > threshold={ROI_REGRESSION_THRESHOLD_PP}pp)"
            )
    return regressions


def cmd_run(args: argparse.Namespace) -> int:
    # Build replay command
    replay_cmd = [
        sys.executable, "-m", "scripts.replay_decision_pipeline",
    ]
    # Handle module invocation; fallback to direct path
    replay_script = REPO_ROOT / "scripts/replay_decision_pipeline.py"
    replay_cmd = [sys.executable, str(replay_script)]
    if args.walkforward:
        replay_cmd.append("--walkforward")
    if args.home_only:
        replay_cmd.append("--home-only")

    flags = {"walkforward": args.walkforward, "home_only": args.home_only}

    print(f"[replay_auto_runner] Running: {' '.join(replay_cmd)}")
    env = {**os.environ, "PYTHONPATH": str(REPO_ROOT)}

    try:
        result = subprocess.run(
            replay_cmd,
            cwd=REPO_ROOT,
            env=env,
            capture_output=False,  # let output stream to terminal
            text=True,
        )
    except FileNotFoundError as e:
        print(f"ERROR: could not launch replay script: {e}", file=sys.stderr)
        return 2

    if result.returncode != 0:
        print(
            f"ERROR: replay_decision_pipeline exited {result.returncode}",
            file=sys.stderr,
        )
        return 2

    # Find the most recent replay report
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    report_files = sorted(
        REPORTS_DIR.glob("replay_decision_pipeline_*.md"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    if not report_files:
        print("WARN: no replay report found in reports/", file=sys.stderr)
        return 1

    latest_report = report_files[0]
    current_metrics = _parse_metrics_from_report(latest_report)
    print(f"[replay_auto_runner] Report: {latest_report.name}")
    print(f"[replay_auto_runner] Metrics: {current_metrics}")

    # Copy to auto_replay_<timestamp>.md
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    auto_report = REPORTS_DIR / f"auto_replay_{stamp}.md"
    auto_report.write_text(latest_report.read_text())
    print(f"[replay_auto_runner] Saved: {auto_report.name}")

    # Compare against baseline
    baseline = _load_last_good()
    if baseline:
        regressions = _compare_metrics(current_metrics, baseline)
        if regressions:
            print("\n[replay_auto_runner] REGRESSION DETECTED:")
            for r in regressions:
                print(f"  {r}")
            base_ts = baseline.get("timestamp", "unknown")
            base_report = baseline.get("report", "unknown")
            print(f"  Baseline: {base_ts} ({base_report})")
            print("  Baseline NOT updated. Investigate before accepting.")
            return 2
        print("[replay_auto_runner] No regression vs baseline.")
    else:
        print("[replay_auto_runner] No baseline yet — establishing first baseline.")

    _save_last_good(current_metrics, str(latest_report), flags)
    return 0


def _self_test() -> int:
    """Validate trigger logic with fake file lists. Does NOT run replay."""
    errors: list[str] = []

    # Should trigger
    trigger_cases = [
        "engine_v4_2/decision_pipeline.py",
        "engine_v4_2/ev_calculator.py",
        "scripts/replay_decision_pipeline.py",
        "scripts/governance/baseline_parity.py",
    ]
    for f in trigger_cases:
        if not _matches_trigger(f):
            errors.append(f"FAIL: expected trigger for {f!r}")
        else:
            print(f"  PASS trigger: {f}")

    # Should NOT trigger
    no_trigger_cases = [
        "docs/roadmap/KNOWLEDGE_GRAPH.md",
        "scripts/governance/registry_check.py",
        "tests/v4_2/test_kelly.py",
        "README.md",
    ]
    for f in no_trigger_cases:
        if _matches_trigger(f):
            errors.append(f"FAIL: unexpected trigger for {f!r}")
        else:
            print(f"  PASS no-trigger: {f}")

    # Metric regression logic
    current = {"roi_per_bet": -0.05}
    baseline = {"metrics": {"roi_per_bet": -0.03}}
    regressions = _compare_metrics(current, baseline)
    if regressions:
        print(f"  PASS regression detection: {regressions[0]}")
    else:
        errors.append("FAIL: expected regression for -3%→-5%")

    current_ok = {"roi_per_bet": -0.03}
    regressions_ok = _compare_metrics(current_ok, baseline)
    if not regressions_ok:
        print("  PASS no-regression: same ROI")
    else:
        errors.append(f"FAIL: unexpected regression: {regressions_ok}")

    if errors:
        for e in errors:
            print(f"FAIL: {e}", file=sys.stderr)
        return 1

    print(f"\nself-test: ALL PASS ({len(trigger_cases)} trigger + "
          f"{len(no_trigger_cases)} no-trigger + 2 regression checks)")
    return 0


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Replay auto-runner — regression guard for engine_v4_2 changes.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--self-test",
        action="store_true",
        help="Validate trigger logic with fake inputs (does NOT run full replay)",
    )
    sub = parser.add_subparsers(dest="command")

    p_trigger = sub.add_parser(
        "check-trigger",
        help="Exit 1 if any file requires a replay run, 0 otherwise",
    )
    p_trigger.add_argument(
        "--files", nargs="+", metavar="FILE",
        help="List of staged/changed files to check",
    )

    p_run = sub.add_parser(
        "run",
        help="Run replay, compare to baseline, update baseline on clean run",
    )
    p_run.add_argument(
        "--walkforward", action="store_true",
        help="Pass --walkforward to replay_decision_pipeline.py",
    )
    p_run.add_argument(
        "--home-only", action="store_true",
        help="Pass --home-only to replay_decision_pipeline.py",
    )

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)

    if args.self_test:
        return _self_test()

    if not args.command:
        parser.print_help()
        return 2

    if args.command == "check-trigger":
        return cmd_check_trigger(args)
    elif args.command == "run":
        return cmd_run(args)
    else:
        parser.print_help()
        return 2


if __name__ == "__main__":
    sys.exit(main())
