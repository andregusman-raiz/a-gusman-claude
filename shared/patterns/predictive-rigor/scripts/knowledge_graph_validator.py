"""Knowledge Graph validator.

Enforces append-only, format, and cross-reference rules on
docs/roadmap/KNOWLEDGE_GRAPH.md.

Commands:
  validate          -- full structural validation
  check-invalidation --theme <id>  -- look for BLOCKER findings that impact theme
  append-check      -- verify staged diff is additions-only (for pre-commit)

Exit codes:
  0  clean / no issues
  1  blockers found (warning, operator decides)
  2  hard error (invalid format / removals / duplicates)
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.stderr.write("PyYAML required. pip install pyyaml\n")
    sys.exit(2)

REPO_ROOT = Path(__file__).resolve().parents[2]
KG_PATH = REPO_ROOT / "docs/roadmap/KNOWLEDGE_GRAPH.md"
REGISTRY_PATH = REPO_ROOT / "docs/roadmap/THEMES_REGISTRY.yaml"

VALID_SEVERITIES = {"LOW", "MEDIUM", "HIGH", "BLOCKER"}

# Matches: - [YYYY-MM-DD] theme_id | finding text | source-path
ENTRY_RE = re.compile(
    r"^- \[(\d{4}-\d{2}-\d{2})\] ([A-Za-z0-9_]+) \| (.+?) \| (.+)$"
)
IMPACTS_RE = re.compile(r"^\s+impacts: \[([^\]]*)\]")
SEVERITY_RE = re.compile(r"^\s+severity: (\w+)")


def _load_registry_theme_ids() -> set[str]:
    if not REGISTRY_PATH.exists():
        return set()
    with open(REGISTRY_PATH) as f:
        data = yaml.safe_load(f) or {}
    return {t["id"] for t in data.get("themes", []) if "id" in t}


def _parse_findings(lines: list[str]) -> list[dict]:
    """Parse KG entries. Each entry spans 3 lines: header, impacts, severity."""
    findings: list[dict] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        m = ENTRY_RE.match(line)
        if m:
            date, theme_id, finding_text, source = m.groups()
            entry: dict = {
                "lineno": i + 1,
                "date": date,
                "theme_id": theme_id,
                "finding": finding_text.strip(),
                "source": source.strip(),
                "impacts": [],
                "severity": None,
                "raw_line": line,
            }
            # peek ahead for impacts + severity
            j = i + 1
            if j < len(lines):
                m_imp = IMPACTS_RE.match(lines[j])
                if m_imp:
                    raw = m_imp.group(1).strip()
                    entry["impacts"] = [
                        x.strip() for x in raw.split(",") if x.strip()
                    ] if raw else []
                    j += 1
            if j < len(lines):
                m_sev = SEVERITY_RE.match(lines[j])
                if m_sev:
                    entry["severity"] = m_sev.group(1).strip()
                    j += 1
            findings.append(entry)
            i = j
        else:
            i += 1
    return findings


def cmd_validate(args: argparse.Namespace) -> int:
    if not KG_PATH.exists():
        print(f"ERROR: {KG_PATH} not found", file=sys.stderr)
        return 2

    known_theme_ids = _load_registry_theme_ids()
    lines = KG_PATH.read_text().splitlines()
    findings = _parse_findings(lines)

    errors: list[str] = []
    warnings: list[str] = []
    seen: dict[tuple[str, str], int] = {}  # (theme_id, finding_first_line) -> lineno

    for f in findings:
        # Format check: severity must be present and valid
        if f["severity"] is None:
            errors.append(
                f"Line {f['lineno']}: missing severity block for "
                f"[{f['theme_id']}] {f['finding'][:60]!r}"
            )
        elif f["severity"] not in VALID_SEVERITIES:
            errors.append(
                f"Line {f['lineno']}: invalid severity {f['severity']!r} "
                f"(must be one of {sorted(VALID_SEVERITIES)})"
            )

        # impacts must reference valid theme IDs from registry
        if known_theme_ids:
            for imp in f["impacts"]:
                # Allow special tokens like E2_gate, ALL_PR103_DERIVED, ADR-phase8
                if re.match(r"^[A-Z][A-Z0-9_-]+$", imp) and not imp[0].isdigit():
                    if imp not in known_theme_ids:
                        # Many are gate IDs (E0_gate etc.) — treat unknown as warning
                        warnings.append(
                            f"Line {f['lineno']}: impacts references unknown "
                            f"theme/gate {imp!r}"
                        )

        # Duplicate check
        key = (f["theme_id"], f["finding"][:80])
        if key in seen:
            errors.append(
                f"Line {f['lineno']}: duplicate finding (theme={f['theme_id']!r}, "
                f"first_line={f['finding'][:60]!r}) already seen at line {seen[key]}"
            )
        else:
            seen[key] = f["lineno"]

    if errors:
        for e in errors:
            print(f"ERROR: {e}")
        print(f"\n{len(errors)} error(s), {len(warnings)} warning(s)")
        return 2

    for w in warnings:
        print(f"WARN: {w}")

    print(
        f"validate: OK — {len(findings)} findings, "
        f"{len(warnings)} warnings, 0 errors"
    )
    return 0


def cmd_check_invalidation(args: argparse.Namespace) -> int:
    theme = args.theme
    if not KG_PATH.exists():
        print(f"ERROR: {KG_PATH} not found", file=sys.stderr)
        return 2

    lines = KG_PATH.read_text().splitlines()
    findings = _parse_findings(lines)

    blockers: list[dict] = []
    for f in findings:
        if theme in f["impacts"] and f["severity"] == "BLOCKER":
            blockers.append(f)

    if blockers:
        print(
            f"WARNING: {len(blocker)} BLOCKER finding(s) impact theme {theme!r}. "
            f"Review before executing."
            if False else
            f"WARNING: {len(blockers)} BLOCKER finding(s) impact theme {theme!r}. "
            f"Review before executing."
        )
        for b in blockers:
            print(
                f"  [{b['date']}] {b['theme_id']} | {b['finding'][:80]} "
                f"| {b['source']}"
            )
        print(
            "\nOptions: (a) archive theme, (b) refactor PFC to address blocker, "
            "(c) document why theme still valid."
        )
        return 1

    print(f"check-invalidation: CLEAN — no BLOCKER findings impact theme {theme!r}")
    return 0


def cmd_append_check(args: argparse.Namespace) -> int:
    """Verify staged diff of KNOWLEDGE_GRAPH.md is additions-only.

    Removals are only allowed if the git commit message contains the token
    'ADR-override knowledge'.
    """
    try:
        diff_output = subprocess.check_output(
            ["git", "diff", "--cached", "docs/roadmap/KNOWLEDGE_GRAPH.md"],
            cwd=REPO_ROOT,
            stderr=subprocess.DEVNULL,
            text=True,
        )
    except subprocess.CalledProcessError:
        # Not in git or nothing staged — pass through
        return 0

    if not diff_output.strip():
        # KNOWLEDGE_GRAPH.md not staged — nothing to check
        return 0

    removed_lines = [
        line for line in diff_output.splitlines()
        if line.startswith("-") and not line.startswith("---")
    ]

    if not removed_lines:
        print("append-check: OK — only additions detected")
        return 0

    # Check if commit message has override token
    try:
        commit_msg = Path(REPO_ROOT / ".git" / "COMMIT_EDITMSG").read_text()
    except FileNotFoundError:
        commit_msg = ""

    if "ADR-override knowledge" in commit_msg:
        print(
            f"append-check: OVERRIDE detected ({len(removed_lines)} removal(s) "
            f"permitted by 'ADR-override knowledge' in commit message)"
        )
        return 0

    print(
        f"ERROR: KNOWLEDGE_GRAPH.md has {len(removed_lines)} removed line(s).",
        file=sys.stderr,
    )
    print(
        "  Policy: append-only audit trail. Findings may not be removed.",
        file=sys.stderr,
    )
    print(
        "  To override: add 'ADR-override knowledge' to commit message with rationale.",
        file=sys.stderr,
    )
    for line in removed_lines[:5]:
        print(f"  {line}", file=sys.stderr)
    if len(removed_lines) > 5:
        print(f"  ... and {len(removed_lines) - 5} more", file=sys.stderr)
    return 2


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Knowledge Graph validator — append-only audit trail enforcement.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("validate", help="Full structural validation of KNOWLEDGE_GRAPH.md")

    p_inv = sub.add_parser(
        "check-invalidation",
        help="Check if any BLOCKER findings impact a given theme",
    )
    p_inv.add_argument(
        "--theme", required=True, metavar="ID",
        help="Theme ID to check (e.g. D01, M03)",
    )

    sub.add_parser(
        "append-check",
        help="Verify staged diff is additions-only (for pre-commit use)",
    )

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)

    if args.command == "validate":
        return cmd_validate(args)
    elif args.command == "check-invalidation":
        return cmd_check_invalidation(args)
    elif args.command == "append-check":
        return cmd_append_check(args)
    else:
        parser.print_help()
        return 2


if __name__ == "__main__":
    sys.exit(main())
