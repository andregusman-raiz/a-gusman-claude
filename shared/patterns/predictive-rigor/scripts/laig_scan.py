"""LAIG static scanner — Look-Ahead Inspection Gate (Rule M3).

Scans Python source files for known look-ahead anti-patterns. Any pattern
that would inject future information into a decision-time model is flagged.

Exit codes:
  0 — no issues found (LAIG-clean)
  1 — warnings only (PARTIAL patterns, review recommended)
  2 — at least one CRITICAL finding (blocks PR / commit)

Usage:
  python scripts/governance/laig_scan.py scripts/foo.py
  python scripts/governance/laig_scan.py engine_v4_2/
  python scripts/governance/laig_scan.py --staged       # git staged .py files
  python scripts/governance/laig_scan.py --self-test    # run built-in test cases

Rule M3 reference: docs/roadmap/templates/LAIG_CHECKLIST.md
Root cause: ciclo 13 — pinnacle_close used as model input (not just CLV measurement).
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Tuple

# ---------------------------------------------------------------------------
# Pattern registry
# ---------------------------------------------------------------------------

@dataclass
class LAIGPattern:
    name: str
    severity: str          # CRITICAL | WARNING
    regex: str
    explanation: str
    suggestion: str
    _compiled: re.Pattern | None = field(default=None, init=False, repr=False)

    def compile(self) -> re.Pattern:
        if self._compiled is None:
            self._compiled = re.compile(self.regex)
        return self._compiled


PATTERNS: List[LAIGPattern] = [
    # -----------------------------------------------------------------------
    # 1. Pinnacle closing as input (ciclo 13 canonical)
    # -----------------------------------------------------------------------
    LAIGPattern(
        name="pinnacle_close_as_input",
        severity="CRITICAL",
        regex=r"\bis_closing\s*=\s*(True|TRUE|true)\b",
        explanation=(
            "is_closing=True selects Pinnacle closing odds. "
            "Closing odds are POSTERIOR to the bet365 decision moment — "
            "this was the exact ciclo 13 mistake (A3+A12 confirmed 100% gap=0h synthetic)."
        ),
        suggestion=(
            "Use is_closing=False to select opening odds (pre-match, LAIG-safe). "
            "Closing odds are allowed only in LEFT-joined CLV measurement columns "
            "that do NOT feed back into the decision pipeline."
        ),
    ),
    LAIGPattern(
        name="pin_close_as_outcome_probs",
        severity="CRITICAL",
        regex=(
            r"outcome_probs\s*=\s*[^\n]*(pin_close|pinnacle_close)"
            r"|"
            r"proportional_normalize\([^)]*(?:pin_close|pinnacle_close)"
        ),
        explanation=(
            "Pinnacle close odds passed as outcome_probs to the decision pipeline. "
            "Close is posterior to the bet365 decision moment — "
            "this was the exact ciclo 13 mistake."
        ),
        suggestion=(
            "Use Pinnacle OPENING odds as outcome_probs (is_closing=False). "
            "Pinnacle close is only permitted as the ex-post CLV benchmark."
        ),
    ),
    LAIGPattern(
        name="closing_pinnacle_odd_as_input",
        severity="CRITICAL",
        regex=r"\bclosing_pinnacle_odd\b(?!\s*#.*LAIG-safe)",
        explanation=(
            "closing_pinnacle_odd used without LAIG-safe annotation. "
            "This is future information at the moment of decision."
        ),
        suggestion=(
            "Replace with bet365 current odd or pinnacle opening odd. "
            "If used only for CLV measurement, add comment: '# LAIG-safe: CLV only'."
        ),
    ),
    # -----------------------------------------------------------------------
    # 2. Post-match tables as features
    # -----------------------------------------------------------------------
    LAIGPattern(
        name="sofascore_player_ratings_as_feature",
        severity="CRITICAL",
        regex=r"\bstg\.sofascore_player_ratings\b",
        explanation=(
            "stg.sofascore_player_ratings is 100% post-match (D08). "
            "SofaScore ratings are only published after the match ends. "
            "Using them as a feature leaks future information."
        ),
        suggestion=(
            "Remove from feature set. "
            "Only use this table for post-hoc analysis / validation, never as input."
        ),
    ),
    LAIGPattern(
        name="player_availability_as_feature",
        severity="CRITICAL",
        regex=r"\bstg\.player_availability\b",
        explanation=(
            "stg.player_availability snapshots are taken at 10:00 UTC "
            "derived from post-match lineups (D09). "
            "This is not observable at decision time T-0."
        ),
        suggestion=(
            "Remove from feature set. "
            "Pre-match availability data would require a dedicated pre-kickoff source."
        ),
    ),
    LAIGPattern(
        name="match_goals_as_sql_input",
        severity="CRITICAL",
        regex=(
            # SELECT m.home_goals / m.away_goals in a SQL context (not historical standings)
            r"\bSELECT\b[^;]*\bm\.(home_goals|away_goals)\b"
            r"(?![^;]*#.*LAIG-safe)"
            r"(?![^;]*standings|[^;]*historical|[^;]*compute_standing)"
        ),
        explanation=(
            "m.home_goals / m.away_goals selected in SQL — likely for feature use. "
            "These are post-match results, not available at decision time T-0."
        ),
        suggestion=(
            "Remove from feature SELECT. "
            "For rolling goal stats, use a subquery with WHERE match_date < :current_match_date."
        ),
    ),
    LAIGPattern(
        name="features_dict_home_goals",
        severity="CRITICAL",
        regex=(
            r"features\s*\[[\'\"](?:home_goals|away_goals)[\'\"]\]"
            r"(?!\s*#.*LAIG-safe)"
        ),
        explanation=(
            "home_goals / away_goals assigned into features dict. "
            "These are post-match results — using them as model inputs is look-ahead."
        ),
        suggestion=(
            "Remove from feature set. Use as label/target only, or compute "
            "rolling historical goals with strict match_date < T-0 filter."
        ),
    ),
    LAIGPattern(
        name="shot_table_without_temporal_filter",
        severity="CRITICAL",
        regex=r"\bstg\.shot\b(?![^;]*WHERE[^;]*match_date\s*<)",
        explanation=(
            "stg.shot used without temporal filter. "
            "Shot data is collected during/after the match. "
            "Rolling xG from stg.shot must be bounded to matches BEFORE current match_date."
        ),
        suggestion=(
            "Add: WHERE match_date < :current_match_date "
            "(or equivalent LATERAL/subquery with temporal bound)."
        ),
    ),
    # -----------------------------------------------------------------------
    # 3. Rolling features without temporal bound
    # -----------------------------------------------------------------------
    LAIGPattern(
        name="group_by_team_without_date_filter",
        severity="WARNING",
        regex=(
            r"GROUP\s+BY\s+team_id"
            r"(?![^;]*WHERE[^;]*match_date\s*<)"
        ),
        explanation=(
            "GROUP BY team_id without WHERE match_date < ... "
            "may include the current match in rolling aggregates (partial look-ahead)."
        ),
        suggestion=(
            "Add: WHERE match_date < :current_match_date before the GROUP BY "
            "to exclude the current match from historical aggregation."
        ),
    ),
    LAIGPattern(
        name="row_number_over_team_no_offset",
        severity="WARNING",
        regex=(
            r"ROW_NUMBER\(\)\s+OVER\s*\(\s*PARTITION\s+BY\s+team"
            r"[^)]*ORDER\s+BY\s+date\s+DESC"
            r"(?![^)]*-\s*\d)"
        ),
        explanation=(
            "ROW_NUMBER() OVER (PARTITION BY team ORDER BY date DESC) "
            "without an offset may include the current match as row 1. "
            "Risk: current match statistics used as 'most recent' prior statistics."
        ),
        suggestion=(
            "Add: WHERE match_date < :current_match_date in the subquery, "
            "or use row_num > 1 to skip the current match."
        ),
    ),
    # -----------------------------------------------------------------------
    # 4. Synthetic timestamp trust (A3 + A12)
    # -----------------------------------------------------------------------
    LAIGPattern(
        name="is_opening_is_closing_as_temporal_order",
        severity="CRITICAL",
        regex=(
            r"\b(is_opening|is_closing)\b"
            r"[^#\n]*(?:ORDER\s+BY|temporal|gap|lag|earlier|later|before|after)"
        ),
        explanation=(
            "is_opening/is_closing flags used to infer temporal ordering. "
            "A3+A12 confirmed: 100% of gaps between bet365 and pinnacle snapshots "
            "are 0h — these flags are SYNTHETIC, not real timestamps. "
            "Temporal gap analysis based on them is meaningless."
        ),
        suggestion=(
            "Use captured_at for real temporal ordering. "
            "Verify gap is non-zero before claiming temporal lead/lag."
        ),
    ),
    # -----------------------------------------------------------------------
    # 5. Ambiguous captured_at without temporal bound
    # -----------------------------------------------------------------------
    LAIGPattern(
        name="max_captured_at_without_match_date_bound",
        severity="WARNING",
        regex=(
            r"MAX\(captured_at\)"
            r"(?![^;]*<\s*(?:match_date|kickoff|match_time))"
        ),
        explanation=(
            "MAX(captured_at) without < match_date bound may select "
            "a snapshot captured AFTER kickoff, injecting post-match information."
        ),
        suggestion=(
            "Add: AND captured_at < match_date - INTERVAL '...' "
            "to ensure only pre-match snapshots are selected."
        ),
    ),
    LAIGPattern(
        name="captured_at_ordering_without_validation",
        severity="WARNING",
        regex=r"p\.captured_at\s*<\s*b\.captured_at(?!\s*#.*validated)",
        explanation=(
            "p.captured_at < b.captured_at used as temporal ordering. "
            "If captured_at values are synthetic (all gap=0h), "
            "this ordering conveys no real temporal information."
        ),
        suggestion=(
            "Validate that the median gap between p.captured_at and b.captured_at "
            "is non-zero before using as temporal evidence. "
            "If gap=0h, remove this as a temporal signal."
        ),
    ),
]

# ---------------------------------------------------------------------------
# Finding data class
# ---------------------------------------------------------------------------

@dataclass
class Finding:
    file_path: str
    line_no: int
    pattern_name: str
    context: str
    severity: str
    explanation: str
    suggestion: str

    def format(self) -> str:
        return (
            f"file: {self.file_path}:{self.line_no}\n"
            f"pattern: {self.pattern_name}\n"
            f"context: {self.context!r}\n"
            f"severity: {self.severity}\n"
            f"explanation: {self.explanation}\n"
            f"suggestion: {self.suggestion}\n"
        )


# ---------------------------------------------------------------------------
# Core scanner
# ---------------------------------------------------------------------------

def scan_text(text: str, file_path: str) -> List[Finding]:
    """Scan a block of text line-by-line against all patterns."""
    findings: List[Finding] = []
    lines = text.splitlines()
    for lineno, line in enumerate(lines, start=1):
        stripped = line.strip()
        # Skip pure comment lines and blank lines
        if not stripped or stripped.startswith("#"):
            continue
        for pat in PATTERNS:
            if pat.compile().search(line):
                findings.append(Finding(
                    file_path=file_path,
                    line_no=lineno,
                    pattern_name=pat.name,
                    context=stripped[:120],
                    severity=pat.severity,
                    explanation=pat.explanation,
                    suggestion=pat.suggestion,
                ))
    return findings


def scan_file(path: Path) -> List[Finding]:
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError as exc:
        print(f"[laig_scan] WARNING: cannot read {path}: {exc}", file=sys.stderr)
        return []
    return scan_text(text, str(path))


def scan_path(target: Path) -> List[Finding]:
    """Recursively scan a file or directory for .py files."""
    if target.is_file():
        if target.suffix == ".py":
            return scan_file(target)
        return []
    findings: List[Finding] = []
    for py_file in sorted(target.rglob("*.py")):
        findings.extend(scan_file(py_file))
    return findings


def get_staged_py_files() -> List[Path]:
    """Return list of staged .py files via git diff --cached."""
    try:
        result = subprocess.run(
            ["git", "diff", "--cached", "--name-only", "--diff-filter=AM"],
            capture_output=True, text=True, check=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("[laig_scan] ERROR: git not available or not in a repo", file=sys.stderr)
        return []
    return [Path(p) for p in result.stdout.splitlines() if p.endswith(".py")]


def print_findings(findings: List[Finding]) -> None:
    if not findings:
        print("[laig_scan] PASS — no look-ahead patterns detected.")
        return
    criticals = [f for f in findings if f.severity == "CRITICAL"]
    warnings = [f for f in findings if f.severity == "WARNING"]
    print(f"[laig_scan] Found {len(findings)} issue(s): "
          f"{len(criticals)} CRITICAL, {len(warnings)} WARNING\n")
    for finding in findings:
        print("---")
        print(finding.format())


# ---------------------------------------------------------------------------
# Self-test
# ---------------------------------------------------------------------------

def _self_test() -> int:
    """Validate scanner against known-BAD (legacy mode) and known-GOOD content."""
    errors = 0

    # -- BAD: legacy replay (pinnacle closing as both input and outcome_probs)
    bad_snippets = [
        # Pattern 1: is_closing=True as input selector
        ('is_closing=True in JOIN context',
         "AND p.is_closing = True AND p.odds > 1.0",
         "pinnacle_close_as_input"),
        # Pattern 2: pinnacle close passed as outcome_probs (ciclo 13 exact shape)
        ('pin_close as outcome_probs',
         "outcome_probs = proportional_normalize(pin_close_home, pin_close_draw, pin_close_away)",
         "pin_close_as_outcome_probs"),
        # Pattern 3: sofascore post-match table
        ('sofascore_player_ratings',
         "FROM stg.sofascore_player_ratings WHERE match_id = :mid",
         "sofascore_player_ratings_as_feature"),
        # Pattern 4: player_availability
        ('player_availability',
         "JOIN stg.player_availability pa ON pa.match_id = m.id",
         "player_availability_as_feature"),
        # Pattern 5: home_goals in features dict (look-ahead)
        ('home_goals in features dict',
         "features['home_goals'] = row['home_goals']",
         "features_dict_home_goals"),
        # Pattern 6: MAX(captured_at) without bound
        ('MAX(captured_at) no bound',
         "SELECT MAX(captured_at) FROM stg.odds WHERE bookmaker='pinnacle'",
         "max_captured_at_without_match_date_bound"),
    ]

    for desc, snippet, expected_pattern in bad_snippets:
        findings = scan_text(snippet, "<test>")
        matched = [f for f in findings if f.pattern_name == expected_pattern]
        if not matched:
            print(f"  SELF-TEST FAIL (BAD not detected): {desc!r} → expected {expected_pattern}")
            errors += 1
        else:
            print(f"  SELF-TEST PASS (BAD detected):     {desc!r} → {expected_pattern}")

    # -- GOOD: walkforward mode / LAIG-clean helpers
    good_snippets = [
        # Walkforward uses is_closing=FALSE
        ('walkforward uses is_closing=FALSE',
         "AND p.is_closing = FALSE AND p.odds > 1.0"),
        # CLV measured against close (LEFT join, not fed back)
        ('CLV measurement via LEFT-joined close — LAIG-safe',
         "# LAIG-safe: CLV only\npin_close_for_sel = float(r['pin_close_home'])"),
        # Jensen correction — pure math, no DB queries
        ('jensen_correction helper — pure math',
         "def estimate_jensen_floor(odds_seq):\n    return sum(1/o for o in odds_seq)"),
        # home_goals in compute_standings (legitimate post-match standings builder)
        ('home_goals in standings computation',
         "hg, ag = m.get('home_goals'), m.get('away_goals')  # compute_standings"),
    ]

    good_patterns_forbidden = [
        "pinnacle_close_as_input",
        "sofascore_player_ratings_as_feature",
        "player_availability_as_feature",
        "pin_close_as_outcome_probs",
    ]

    for desc, snippet in good_snippets:
        findings = scan_text(snippet, "<test>")
        critical_findings = [
            f for f in findings
            if f.pattern_name in good_patterns_forbidden and f.severity == "CRITICAL"
        ]
        if critical_findings:
            print(f"  SELF-TEST FAIL (GOOD falsely flagged): {desc!r}")
            for f in critical_findings:
                print(f"    flagged as: {f.pattern_name}")
            errors += 1
        else:
            print(f"  SELF-TEST PASS (GOOD not flagged):    {desc!r}")

    # -- Scan actual replay script (legacy mode = CRITICAL expected)
    replay_script = Path("scripts/replay_decision_pipeline.py")
    if replay_script.exists():
        findings = scan_file(replay_script)
        close_findings = [
            f for f in findings
            if f.pattern_name == "pinnacle_close_as_input"
        ]
        # Legacy script has is_closing=TRUE for legacy mode — should be found
        if close_findings:
            print(f"  SELF-TEST PASS (replay script has CRITICAL is_closing pattern as expected)")
        else:
            print(f"  SELF-TEST INFO: replay script is_closing pattern not found "
                  f"(may have been updated — verify manually)")
    else:
        print("  SELF-TEST SKIP: scripts/replay_decision_pipeline.py not found")

    # -- Scan jensen_correction.py (should be LAIG-clean)
    jensen_script = Path("scripts/governance/jensen_correction.py")
    if jensen_script.exists():
        findings = scan_file(jensen_script)
        critical = [f for f in findings if f.severity == "CRITICAL"]
        if critical:
            print(f"  SELF-TEST FAIL: jensen_correction.py has CRITICAL findings (unexpected):")
            for f in critical:
                print(f"    {f.pattern_name} at line {f.line_no}")
            errors += 1
        else:
            print("  SELF-TEST PASS: jensen_correction.py is LAIG-clean (no CRITICAL)")
    else:
        print("  SELF-TEST SKIP: jensen_correction.py not found")

    return errors


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="LAIG static scanner (Rule M3 — Look-Ahead Inspection Gate).",
        epilog=(
            "Exit 0=clean, 1=warnings only, 2=CRITICAL found. "
            "See docs/roadmap/templates/LAIG_CHECKLIST.md for full rule set."
        ),
    )
    parser.add_argument(
        "targets",
        nargs="*",
        help="Files or directories to scan (.py only). Omit when using --staged.",
    )
    parser.add_argument(
        "--staged",
        action="store_true",
        help="Scan git staged .py files (for pre-commit hook use).",
    )
    parser.add_argument(
        "--self-test",
        action="store_true",
        help="Run built-in test cases against known BAD/GOOD patterns and exit.",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Suppress output when PASS (exit 0 only).",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)

    if args.self_test:
        print("[laig_scan] Running self-tests...\n")
        errors = _self_test()
        if errors:
            print(f"\n[laig_scan] SELF-TEST FAILED: {errors} error(s)")
            return 2
        print("\n[laig_scan] SELF-TEST PASSED")
        return 0

    # Collect files to scan
    paths: List[Path] = []
    if args.staged:
        paths = get_staged_py_files()
        if not paths:
            if not args.quiet:
                print("[laig_scan] no staged .py files — nothing to scan")
            return 0
    else:
        for t in args.targets:
            paths.append(Path(t))
        if not paths:
            print("[laig_scan] ERROR: specify files/dirs or use --staged", file=sys.stderr)
            return 2

    all_findings: List[Finding] = []
    for p in paths:
        all_findings.extend(scan_path(p))

    if not args.quiet or all_findings:
        print_findings(all_findings)

    criticals = [f for f in all_findings if f.severity == "CRITICAL"]
    if criticals:
        return 2
    if all_findings:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
