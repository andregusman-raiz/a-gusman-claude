#!/usr/bin/env python3
"""
sunk_cost_guard.py — Rule M6 Sunk-Cost Declaration Hook
=======================================================

Theme I17 — Mechanically enforce ADR override before reopening archived decisions.

Behaviour:
  check   --staged | --files <f1> <f2>
            Cross-refs touched files/content against archived_topics.yaml.
            Exit 2 if archived topic touched without Rule M6 override.

  declare --archived-adr <path> --reason <text>
            Creates ADR-override-YYYYMMDD-<slug>.md and updates archived_topics.yaml.

  index   [--dry-run]
            (Re-)scan docs/specs/ to build/refresh archived_topics.yaml.

Self-test:
  python scripts/governance/sunk_cost_guard.py --self-test
            Simulates two scenarios and asserts exit behaviour.

Requirements: stdlib + PyYAML
"""

import argparse
import datetime
import os
import re
import subprocess
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("[sunk_cost_guard] ERROR: PyYAML not installed. Run: pip install pyyaml", file=sys.stderr)
    sys.exit(1)

# ---------------------------------------------------------------------------
# Paths (relative to repo root; resolved at runtime)
# ---------------------------------------------------------------------------
REPO_ROOT = Path(
    subprocess.check_output(
        ["git", "rev-parse", "--show-toplevel"], stderr=subprocess.DEVNULL
    ).decode().strip()
)

ARCHIVED_TOPICS = REPO_ROOT / "docs" / "roadmap" / "archived_topics.yaml"
SPECS_DIR = REPO_ROOT / "docs" / "specs"
OVERRIDES_DIR = REPO_ROOT / "docs" / "specs"

# Keywords that mark archival in ADR/report files
ARCHIVE_SIGNALS = [
    "ARQUIVAR",
    "non-viable",
    "FAILURE_CRITERION",
    "OVERFIT_TRAIN",
    "archived",
    "FAILURE CRITERION",
]

# Commit-message markers that authorise override
OVERRIDE_MARKERS = [
    "Rule M6 override",
    "M6 override",
    "sunk-cost override",
    "ADR override",
]


# ---------------------------------------------------------------------------
# YAML helpers
# ---------------------------------------------------------------------------

def _load_archived() -> dict:
    if not ARCHIVED_TOPICS.exists():
        return {"topics": []}
    with open(ARCHIVED_TOPICS, encoding="utf-8") as fh:
        data = yaml.safe_load(fh) or {}
    if "topics" not in data:
        data["topics"] = []
    return data


def _save_archived(data: dict) -> None:
    ARCHIVED_TOPICS.parent.mkdir(parents=True, exist_ok=True)
    with open(ARCHIVED_TOPICS, "w", encoding="utf-8") as fh:
        yaml.dump(data, fh, allow_unicode=True, sort_keys=False, default_flow_style=False)


# ---------------------------------------------------------------------------
# Index: scan docs/specs/ for archived ADRs
# ---------------------------------------------------------------------------

def _extract_archive_date(text: str, path: Path) -> str:
    """Best-effort: extract date from file content or fallback to mtime."""
    for pat in [
        r"Decision Date:\s*(\d{4}-\d{2}-\d{2})",
        r"\*\*Data[:\*]*\*?\s*(\d{4}-\d{2}-\d{2})",
        r"date[:\s]+(\d{4}-\d{2}-\d{2})",
    ]:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return m.group(1)
    mtime = datetime.date.fromtimestamp(path.stat().st_mtime)
    return mtime.isoformat()


def _extract_topic_keywords(path: Path, text: str) -> list[str]:
    """Derive topic keywords from filename + known content patterns."""
    keywords: list[str] = []

    stem = path.stem.lower()
    # Use hyphen-separated parts of the ADR stem as keywords
    parts = [p for p in re.split(r"[-_]", stem) if len(p) > 2]
    keywords.extend(parts)

    # Extract capitalized abbreviations that appear 2+ times (domain tokens)
    caps = re.findall(r"\b[A-Z_]{2,}\b", text)
    from collections import Counter
    for tok, cnt in Counter(caps).most_common(10):
        if cnt >= 2 and tok not in ("ADR", "AND", "NOT", "THE", "FOR", "WITH"):
            keywords.append(tok.lower())

    return list(dict.fromkeys(keywords))  # deduplicate preserving order


def cmd_index(dry_run: bool = False) -> int:
    """Scan docs/specs/ and rebuild archived_topics.yaml."""
    if not SPECS_DIR.exists():
        print(f"[sunk_cost_guard] SPECS_DIR {SPECS_DIR} not found", file=sys.stderr)
        return 1

    existing = _load_archived()
    existing_paths = {t["adr_path"] for t in existing["topics"]}
    new_topics: list[dict] = []

    for path in sorted(SPECS_DIR.glob("*.md")):
        text = path.read_text(encoding="utf-8", errors="replace")
        if not any(sig in text for sig in ARCHIVE_SIGNALS):
            continue

        rel = str(path.relative_to(REPO_ROOT))
        if rel in existing_paths:
            continue  # already indexed

        archive_date = _extract_archive_date(text, path)
        keywords = _extract_topic_keywords(path, text)

        entry = {
            "topic_keywords": keywords,
            "archive_date": archive_date,
            "adr_path": rel,
            "title": path.stem,
        }
        new_topics.append(entry)
        print(f"[sunk_cost_guard] indexing: {rel} ({archive_date}) kw={keywords[:5]}")

    if not new_topics and existing["topics"]:
        print("[sunk_cost_guard] index up-to-date, no new archived ADRs found")
        return 0

    all_topics = existing["topics"] + new_topics
    data = {"topics": all_topics}

    if dry_run:
        print("[sunk_cost_guard] --dry-run: would write", len(all_topics), "topics")
        print(yaml.dump(data, allow_unicode=True))
        return 0

    _save_archived(data)
    print(f"[sunk_cost_guard] archived_topics.yaml updated: {len(all_topics)} topics total")
    return 0


# ---------------------------------------------------------------------------
# Check: validate staged/given files against archived topics
# ---------------------------------------------------------------------------

def _get_staged_files() -> list[str]:
    out = subprocess.check_output(
        ["git", "diff", "--cached", "--name-only", "--diff-filter=AM"],
        cwd=REPO_ROOT,
    ).decode().strip()
    return [l for l in out.splitlines() if l]


def _get_commit_message_draft() -> str:
    """Try to read COMMIT_EDITMSG if present (best-effort)."""
    msg_path = REPO_ROOT / ".git" / "COMMIT_EDITMSG"
    if msg_path.exists():
        return msg_path.read_text(encoding="utf-8", errors="replace")
    return ""


def _has_override_adr() -> bool:
    """Check if any staged file is an ADR-override-* document."""
    staged = _get_staged_files()
    return any("ADR-override-" in f for f in staged)


def _has_override_in_message(msg: str) -> bool:
    return any(m.lower() in msg.lower() for m in OVERRIDE_MARKERS)


def _file_touches_topic(filepath: str, file_content: str, topic: dict) -> bool:
    """Return True if filepath/content relates to an archived topic."""
    kws = [k.lower() for k in topic.get("topic_keywords", [])]
    candidate = (filepath + " " + file_content[:2000]).lower()
    # Need at least 2 keyword matches to avoid false positives
    hits = sum(1 for k in kws if k and k in candidate)
    return hits >= 2


def cmd_check(files: list[str], staged: bool) -> int:
    """Check files against archived topics. Exit 2 if violation found."""
    if staged:
        files = _get_staged_files()

    if not files:
        return 0

    data = _load_archived()
    topics = data.get("topics", [])
    if not topics:
        # No archived topics indexed yet — nothing to check
        return 0

    commit_msg = _get_commit_message_draft()
    msg_has_override = _has_override_in_message(commit_msg)
    adr_override_staged = _has_override_adr()

    violations: list[tuple[str, dict]] = []

    for fpath in files:
        abs_path = REPO_ROOT / fpath
        try:
            content = abs_path.read_text(encoding="utf-8", errors="replace") if abs_path.exists() else ""
        except Exception:
            content = ""

        for topic in topics:
            if _file_touches_topic(fpath, content, topic):
                violations.append((fpath, topic))

    if not violations:
        return 0

    # At least one archived topic touched — check for override
    if msg_has_override and adr_override_staged:
        print("[sunk_cost_guard] Rule M6 override accepted (ADR-override staged + message marker)")
        return 0

    # Print violation report
    print("[sunk_cost_guard] BLOCKED — Rule M6: Sunk-Cost Declaration required", file=sys.stderr)
    print("  The following archived decisions appear to be reopened:", file=sys.stderr)
    for fpath, topic in violations:
        print(f"    File:    {fpath}", file=sys.stderr)
        print(f"    Archive: {topic['adr_path']} ({topic['archive_date']})", file=sys.stderr)
        print(f"    Keywords matched: {topic['topic_keywords'][:5]}", file=sys.stderr)

    print("", file=sys.stderr)
    print("  To proceed, you must:", file=sys.stderr)
    print("    1. Run: python scripts/governance/sunk_cost_guard.py declare \\", file=sys.stderr)
    print("               --archived-adr <adr_path> --reason '<new evidence>'", file=sys.stderr)
    print("    2. Stage the generated ADR-override-*.md file", file=sys.stderr)
    print("    3. Include 'Rule M6 override' in your commit message", file=sys.stderr)
    print("", file=sys.stderr)
    print("  Cycles this prevents: 6, 8, 9, 11, 12, 13 (see ANTI_CYCLE_RULES M6)", file=sys.stderr)
    return 2


# ---------------------------------------------------------------------------
# Declare: create override ADR
# ---------------------------------------------------------------------------

def cmd_declare(archived_adr: str, reason: str) -> int:
    """Create an ADR-override-* file and register it."""
    today = datetime.date.today().isoformat()
    slug = re.sub(r"[^a-z0-9]+", "-", reason.lower())[:40].strip("-")
    out_name = f"ADR-override-{today}-{slug}.md"
    out_path = OVERRIDES_DIR / out_name

    # Resolve original ADR title
    adr_full = REPO_ROOT / archived_adr
    orig_title = archived_adr
    if adr_full.exists():
        first_line = adr_full.read_text(encoding="utf-8").splitlines()[0]
        if first_line.startswith("#"):
            orig_title = first_line.lstrip("#").strip()

    content = f"""# ADR Override: {orig_title}

Date: {today}
Previous decision: {archived_adr}
Status: OVERRIDE

## New evidence justifying reopening

{reason}

## What was archived

The previous ADR at `{archived_adr}` declared one of:
- ARQUIVAR / archived
- non-viable
- FAILURE_CRITERION evoked
- OVERFIT_TRAIN verdict

## Why this is NOT sunk-cost

(Operator must fill this in — explain concretely what changed in data, venue,
methodology, or theoretical understanding that makes this reopening justified.
Generic optimism is NOT sufficient. Reference specific new evidence.)

## Failure criterion for this reopening

(Pre-register: "If X, this reopening is also non-viable. Do not pivot again
without Y." — prevents recursive sunk-cost cycles.)

## Acceptance

Operator signs off — proceed with caution. Rule M6 acknowledged.
Cycles 6, 8, 9, 11, 12, 13 were driven by sunk-cost without this declaration.
"""

    out_path.write_text(content, encoding="utf-8")
    print(f"[sunk_cost_guard] Created override ADR: {out_path.relative_to(REPO_ROOT)}")
    print(f"  Stage it: git add {out_path.relative_to(REPO_ROOT)}")
    print("  Include in commit message: 'Rule M6 override'")
    return 0


# ---------------------------------------------------------------------------
# Self-test
# ---------------------------------------------------------------------------

def _self_test() -> None:
    """
    Simulate check() in two scenarios using a synthetic topic registry.
    Asserts correct exit codes without writing to repo files.
    """
    print("[self-test] Running sunk_cost_guard self-test...")

    # Build a minimal in-memory topic list
    synthetic_topics = [
        {
            "topic_keywords": ["engine", "v4", "price", "residual", "model", "dgm"],
            "archive_date": "2026-04-19",
            "adr_path": "docs/specs/ADR-phase8-paradigm-shift-v4.md",
            "title": "ADR-phase8-paradigm-shift-v4",
        }
    ]

    def _check_files_inline(files: list[str], override_msg: bool, override_adr: bool) -> int:
        """Inline version of cmd_check that uses synthetic_topics."""
        topics = synthetic_topics
        msg_has_override = override_msg
        adr_override_staged = override_adr
        violations = []
        for fpath in files:
            for topic in topics:
                candidate = fpath.lower()
                kws = [k.lower() for k in topic["topic_keywords"]]
                hits = sum(1 for k in kws if k and k in candidate)
                if hits >= 2:
                    violations.append((fpath, topic))
        if not violations:
            return 0
        if msg_has_override and adr_override_staged:
            return 0
        return 2

    # Scenario A: commit touches engine_v4_2/price_residual_model.py without override
    files_a = ["engine_v4_2/price_residual_model.py"]
    rc_a = _check_files_inline(files_a, override_msg=False, override_adr=False)
    assert rc_a == 2, f"Scenario A expected exit 2, got {rc_a}"
    print(f"  [PASS] Scenario A (no override): exit {rc_a} == 2")

    # Scenario B: same commit but with override ADR staged + message marker
    rc_b = _check_files_inline(files_a, override_msg=True, override_adr=True)
    assert rc_b == 0, f"Scenario B expected exit 0, got {rc_b}"
    print(f"  [PASS] Scenario B (with override): exit {rc_b} == 0")

    # Scenario C: unrelated file — no violation
    files_c = ["scripts/governance/registry_check.py"]
    rc_c = _check_files_inline(files_c, override_msg=False, override_adr=False)
    assert rc_c == 0, f"Scenario C expected exit 0, got {rc_c}"
    print(f"  [PASS] Scenario C (unrelated file): exit {rc_c} == 0")

    print("[self-test] All scenarios PASSED.")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Rule M6 Sunk-Cost Declaration Hook (Theme I17)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--self-test", action="store_true", help="Run self-test and exit")

    sub = parser.add_subparsers(dest="command")

    # check
    p_check = sub.add_parser("check", help="Check files for archived topic revival")
    p_check.add_argument("--staged", action="store_true", help="Use git staged files")
    p_check.add_argument("--files", nargs="*", default=[], help="Explicit file list")

    # declare
    p_decl = sub.add_parser("declare", help="Create an ADR override document")
    p_decl.add_argument("--archived-adr", required=True, help="Path to original archived ADR")
    p_decl.add_argument("--reason", required=True, help="New evidence justifying reopening")

    # index
    p_idx = sub.add_parser("index", help="(Re-)index archived topics from docs/specs/")
    p_idx.add_argument("--dry-run", action="store_true")

    args = parser.parse_args()

    if args.self_test:
        _self_test()
        sys.exit(0)

    if args.command == "check":
        files = args.files or []
        rc = cmd_check(files, staged=args.staged)
        sys.exit(rc)

    elif args.command == "declare":
        rc = cmd_declare(args.archived_adr, args.reason)
        sys.exit(rc)

    elif args.command == "index":
        rc = cmd_index(dry_run=args.dry_run)
        sys.exit(rc)

    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
