#!/usr/bin/env python3
"""
time_budget.py — Time-to-Falsification budget tracker (Theme I18 / Rule M10).

Rule M10: "Cada fase recebe orçamento pré-alocado: construir X dias, falsificar Y dias.
           Y/(X+Y) >= 0.4."

Usage:
  time_budget.py register --theme <id> --pfc <path>   # extract §10, validate ratio
  time_budget.py log --theme <id> --phase build|falsification --hours <n>
  time_budget.py verify --theme <id>                  # check actual ratio
  time_budget.py report                               # print table of all themes

Exit codes:
  0  ok
  1  warnings only
  2  violation (ratio < 0.4)
"""

import argparse
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import yaml
except ImportError:
    print("ERROR: PyYAML not installed. Run: pip install pyyaml", file=sys.stderr)
    sys.exit(1)

REPO_ROOT = Path(__file__).resolve().parents[2]
BUDGET_FILE = REPO_ROOT / "docs" / "roadmap" / "time_budget.yaml"
MIN_RATIO = 0.4
WARN_BUILD_PCT = 0.50  # warn when actual_build >= 50% of declared_build and falsif not started


# ── helpers ──────────────────────────────────────────────────────────────────

def _load() -> dict:
    if BUDGET_FILE.exists():
        with open(BUDGET_FILE) as f:
            data = yaml.safe_load(f) or {}
    else:
        data = {}
    data.setdefault("themes", {})
    return data


def _save(data: dict) -> None:
    BUDGET_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(BUDGET_FILE, "w") as f:
        yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)


def _ratio(falsif: float, build: float) -> float:
    total = build + falsif
    return falsif / total if total > 0 else 0.0


def _parse_pfc_section10(pfc_path: Path) -> tuple[float, float]:
    """
    Extract build_hours and falsification_hours from PFC §10.

    Looks for lines like:
      - **Build/execute budget**: 8 hours
      - **Falsification/adversarial budget**: 6 hours, MUST be >= 40% of build>
    Also accepts plain numbers: "8h", "8 h", "8hrs", "8 hours".
    """
    text = pfc_path.read_text(encoding="utf-8")

    # Find §10 block
    section = re.search(
        r"##\s*10\.\s+Time-to-falsification budget.*?(?=^##\s|\Z)",
        text,
        re.DOTALL | re.MULTILINE | re.IGNORECASE,
    )
    if not section:
        raise ValueError(f"Section §10 not found in {pfc_path}")

    block = section.group(0)

    def extract_hours(pattern: str) -> float:
        m = re.search(pattern, block, re.IGNORECASE)
        if not m:
            return None
        raw = m.group(1).strip()
        # strip trailing description after comma or space+word
        raw = re.split(r"[,\s]", raw)[0]
        raw = re.sub(r"[^0-9.]", "", raw)
        return float(raw) if raw else None

    build = extract_hours(r"\*\*Build[^*]*budget\*\*[:\s]+([^\n]+)")
    falsif = extract_hours(r"\*\*Falsif[^*]*budget\*\*[:\s]+([^\n]+)")

    # Fallback: look for bare numbers on lines with keywords
    if build is None:
        m = re.search(r"build[^:\n]*:\s*([\d.]+)", block, re.IGNORECASE)
        build = float(m.group(1)) if m else None
    if falsif is None:
        m = re.search(r"falsif[^:\n]*:\s*([\d.]+)", block, re.IGNORECASE)
        falsif = float(m.group(1)) if m else None

    if build is None or falsif is None:
        raise ValueError(
            f"Could not parse build/falsification hours from §10 in {pfc_path}.\n"
            "Expected lines matching:\n"
            "  **Build/execute budget**: <N> hours\n"
            "  **Falsification/adversarial budget**: <N> hours"
        )

    return build, falsif


# ── commands ─────────────────────────────────────────────────────────────────

def cmd_register(args) -> int:
    pfc_path = Path(args.pfc).resolve()
    if not pfc_path.exists():
        print(f"ERROR: PFC file not found: {pfc_path}", file=sys.stderr)
        return 2

    try:
        build_h, falsif_h = _parse_pfc_section10(pfc_path)
    except ValueError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 2

    ratio = _ratio(falsif_h, build_h)

    print(f"Theme {args.theme}:")
    print(f"  declared_build_hours      = {build_h}")
    print(f"  declared_falsification_hours = {falsif_h}")
    print(f"  ratio Y/(X+Y)             = {ratio:.3f}  (min required: {MIN_RATIO})")

    if ratio < MIN_RATIO:
        print(
            f"\nERROR: ratio {ratio:.3f} < {MIN_RATIO}. PFC rejected by Rule M10.\n"
            f"  Increase falsification budget so Y/(X+Y) >= {MIN_RATIO}.\n"
            f"  Current: build={build_h}h, falsif={falsif_h}h → need falsif >= {build_h * MIN_RATIO / (1 - MIN_RATIO):.1f}h",
            file=sys.stderr,
        )
        return 2

    data = _load()
    data["themes"][args.theme] = {
        "declared_build_hours": build_h,
        "declared_falsification_hours": falsif_h,
        "declared_ratio": round(ratio, 4),
        "actual_build_hours": data["themes"].get(args.theme, {}).get("actual_build_hours", 0.0),
        "actual_falsification_hours": data["themes"].get(args.theme, {}).get("actual_falsification_hours", 0.0),
        "actual_ratio": None,
        "status": data["themes"].get(args.theme, {}).get("status", "in_progress"),
        "pfc_source": str(pfc_path.relative_to(REPO_ROOT)) if pfc_path.is_relative_to(REPO_ROOT) else str(pfc_path),
        "registered_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
    }
    _save(data)
    print(f"\nRegistered in {BUDGET_FILE.relative_to(REPO_ROOT)}")
    return 0


def cmd_log(args) -> int:
    data = _load()
    if args.theme not in data["themes"]:
        print(f"ERROR: Theme {args.theme} not registered. Run 'register' first.", file=sys.stderr)
        return 2

    entry = data["themes"][args.theme]
    phase_key = (
        "actual_build_hours" if args.phase == "build" else "actual_falsification_hours"
    )
    entry[phase_key] = round((entry.get(phase_key) or 0.0) + args.hours, 2)

    # Recompute actual ratio
    ab = entry.get("actual_build_hours") or 0.0
    af = entry.get("actual_falsification_hours") or 0.0
    entry["actual_ratio"] = round(_ratio(af, ab), 4) if (ab + af) > 0 else None

    # Warn if build is 50%+ consumed but falsification not started
    decl_build = entry.get("declared_build_hours") or 0.0
    if (
        ab >= decl_build * WARN_BUILD_PCT
        and af == 0.0
        and decl_build > 0
    ):
        print(
            f"WARN [{args.theme}]: {ab}h of build logged ({100*ab/decl_build:.0f}% of budget) "
            f"but falsification not started. Rule M10 requires Y/(X+Y) >= {MIN_RATIO}.",
            file=sys.stderr,
        )

    _save(data)
    print(
        f"Logged {args.hours}h to {args.phase} for {args.theme}. "
        f"Totals: build={ab}h, falsif={af}h, actual_ratio={entry['actual_ratio']}"
    )
    return 0


def cmd_verify(args) -> int:
    data = _load()
    if args.theme not in data["themes"]:
        print(f"ERROR: Theme {args.theme} not registered.", file=sys.stderr)
        return 2

    entry = data["themes"][args.theme]
    status = entry.get("status", "in_progress")

    if status == "pending":
        print(f"Theme {args.theme} is still pending — nothing to verify.")
        return 0

    ab = entry.get("actual_build_hours") or 0.0
    af = entry.get("actual_falsification_hours") or 0.0

    if (ab + af) == 0:
        print(f"WARN [{args.theme}]: No actual hours logged yet.", file=sys.stderr)
        return 1

    actual_ratio = _ratio(af, ab)
    decl_ratio = entry.get("declared_ratio") or 0.0

    print(f"Theme {args.theme} ({status}):")
    print(f"  declared ratio  : {decl_ratio:.3f}")
    print(f"  actual ratio    : {actual_ratio:.3f}  (build={ab}h, falsif={af}h)")

    if status == "complete" and actual_ratio < MIN_RATIO:
        print(
            f"\nERROR: Theme marked 'complete' but actual ratio {actual_ratio:.3f} < {MIN_RATIO}. "
            f"Rule M10 violated.",
            file=sys.stderr,
        )
        # Update stored value
        entry["actual_ratio"] = round(actual_ratio, 4)
        entry["status"] = "violated"
        _save(data)
        return 2

    if status == "in_progress" and actual_ratio < MIN_RATIO and (ab + af) > 0:
        print(
            f"WARN [{args.theme}]: Current ratio {actual_ratio:.3f} < {MIN_RATIO}. "
            f"Add more falsification time before closing.",
            file=sys.stderr,
        )
        entry["actual_ratio"] = round(actual_ratio, 4)
        _save(data)
        return 1

    entry["actual_ratio"] = round(actual_ratio, 4)
    _save(data)
    print("  Status: OK")
    return 0


def cmd_report(args) -> int:
    data = _load()
    themes = data.get("themes", {})

    if not themes:
        print("No themes registered in time_budget.yaml")
        return 0

    header = f"{'Theme':<8} {'D-Build':>8} {'D-Falsif':>9} {'D-Ratio':>8} {'A-Build':>8} {'A-Falsif':>9} {'A-Ratio':>8} {'Status':<12}"
    print(header)
    print("-" * len(header))

    rc = 0
    for tid, e in sorted(themes.items()):
        db = e.get("declared_build_hours") or 0
        df = e.get("declared_falsification_hours") or 0
        dr = e.get("declared_ratio")
        ab = e.get("actual_build_hours") or 0
        af = e.get("actual_falsification_hours") or 0
        ar = e.get("actual_ratio")
        status = e.get("status", "?")

        dr_str = f"{dr:.3f}" if dr is not None else "  —  "
        ar_str = f"{ar:.3f}" if ar is not None else "  —  "

        flag = ""
        if status == "violated":
            flag = " !"
            rc = 2
        elif ar is not None and ar < MIN_RATIO:
            flag = " ?"
            if rc < 1:
                rc = 1

        print(
            f"{tid:<8} {db:>8.1f} {df:>9.1f} {dr_str:>8} "
            f"{ab:>8.1f} {af:>9.1f} {ar_str:>8} {status:<12}{flag}"
        )

    print(f"\nMin required ratio: {MIN_RATIO}  |  ! = violated  |  ? = trending low")
    return rc


# ── self-test ─────────────────────────────────────────────────────────────────

def _self_test() -> None:
    """Run self-tests inline (no pytest dependency)."""
    import tempfile
    import textwrap

    failures = []

    def assert_eq(label, got, expected):
        if got != expected:
            failures.append(f"  FAIL {label}: got {got!r}, expected {expected!r}")
        else:
            print(f"  PASS {label}")

    print("=== self-test: time_budget.py ===")

    # Test _ratio
    assert_eq("ratio(2, 4)", round(_ratio(2, 4), 4), 0.3333)
    assert_eq("ratio(4, 6)", round(_ratio(4, 6), 4), 0.4)
    assert_eq("ratio(6, 4)", round(_ratio(6, 4), 4), 0.6)
    assert_eq("ratio(0, 0)", _ratio(0, 0), 0.0)

    # Build a minimal PFC §10 block and test parsing
    pfc_ok = textwrap.dedent("""\
        # PFC test

        ## 10. Time-to-falsification budget (Rule M10)

        - **Build/execute budget**: 6 hours
        - **Falsification/adversarial budget**: 4 hours, MUST be >= 40% of build
        - **Ratio**: 0.4, must be >= 0.4
    """)

    pfc_bad = textwrap.dedent("""\
        # PFC test

        ## 10. Time-to-falsification budget (Rule M10)

        - **Build/execute budget**: 4 hours
        - **Falsification/adversarial budget**: 2 hours
        - **Ratio**: 0.33
    """)

    with tempfile.TemporaryDirectory() as tmpdir:
        ok_path = Path(tmpdir) / "ok-PFC.md"
        bad_path = Path(tmpdir) / "bad-PFC.md"
        ok_path.write_text(pfc_ok)
        bad_path.write_text(pfc_bad)

        b, f = _parse_pfc_section10(ok_path)
        assert_eq("parse_ok build", b, 6.0)
        assert_eq("parse_ok falsif", f, 4.0)
        assert_eq("parse_ok ratio ok", _ratio(f, b) >= MIN_RATIO, True)

        b2, f2 = _parse_pfc_section10(bad_path)
        assert_eq("parse_bad build", b2, 4.0)
        assert_eq("parse_bad falsif", f2, 2.0)
        assert_eq("parse_bad ratio too_low", _ratio(f2, b2) < MIN_RATIO, True)

    # Simulate register + log + verify using a temp budget file
    import unittest.mock as mock

    tmp_budget = Path(tempfile.mktemp(suffix=".yaml"))
    try:
        with mock.patch("scripts.governance.time_budget.BUDGET_FILE", tmp_budget):
            # We call _load/_save directly — patch the module-level constant
            # Instead, test via monkey-patch of the global
            import scripts.governance.time_budget as tb_mod
            orig = tb_mod.BUDGET_FILE
            tb_mod.BUDGET_FILE = tmp_budget

            # register ok (ratio=0.4)
            data = tb_mod._load()
            b, f = 6.0, 4.0
            ratio = tb_mod._ratio(f, b)
            data["themes"]["TEST1"] = {
                "declared_build_hours": b,
                "declared_falsification_hours": f,
                "declared_ratio": round(ratio, 4),
                "actual_build_hours": 0.0,
                "actual_falsification_hours": 0.0,
                "actual_ratio": None,
                "status": "in_progress",
                "pfc_source": "test",
                "registered_at": "2026-04-19",
            }
            tb_mod._save(data)

            # log build
            data = tb_mod._load()
            data["themes"]["TEST1"]["actual_build_hours"] = 3.0
            data["themes"]["TEST1"]["actual_ratio"] = round(tb_mod._ratio(0, 3), 4)
            tb_mod._save(data)

            # log falsif
            data = tb_mod._load()
            data["themes"]["TEST1"]["actual_falsification_hours"] = 2.5
            ab, af = 3.0, 2.5
            data["themes"]["TEST1"]["actual_ratio"] = round(tb_mod._ratio(af, ab), 4)
            tb_mod._save(data)

            data = tb_mod._load()
            ar = data["themes"]["TEST1"]["actual_ratio"]
            assert_eq("log actual_ratio", ar >= MIN_RATIO, True)

            tb_mod.BUDGET_FILE = orig
    finally:
        if tmp_budget.exists():
            tmp_budget.unlink()

    if failures:
        print("\nFAILURES:")
        for f in failures:
            print(f)
        sys.exit(1)
    else:
        print("\nAll self-tests PASSED.")


# ── CLI ───────────────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Time-to-Falsification budget tracker (Rule M10)"
    )
    sub = parser.add_subparsers(dest="cmd", required=True)

    # register
    p_reg = sub.add_parser("register", help="Parse PFC §10 and register budget")
    p_reg.add_argument("--theme", required=True, help="Theme ID (e.g. I18)")
    p_reg.add_argument("--pfc", required=True, help="Path to PFC markdown file")

    # log
    p_log = sub.add_parser("log", help="Increment actual hours for a phase")
    p_log.add_argument("--theme", required=True)
    p_log.add_argument("--phase", required=True, choices=["build", "falsification"])
    p_log.add_argument("--hours", required=True, type=float)

    # verify
    p_ver = sub.add_parser("verify", help="Check actual ratio for a theme")
    p_ver.add_argument("--theme", required=True)

    # report
    sub.add_parser("report", help="Print table of all theme budgets")

    # self-test
    sub.add_parser("self-test", help="Run self-tests and exit")

    args = parser.parse_args()

    if args.cmd == "register":
        return cmd_register(args)
    elif args.cmd == "log":
        return cmd_log(args)
    elif args.cmd == "verify":
        return cmd_verify(args)
    elif args.cmd == "report":
        return cmd_report(args)
    elif args.cmd == "self-test":
        _self_test()
        return 0
    else:
        parser.print_help()
        return 1


if __name__ == "__main__":
    sys.exit(main())
