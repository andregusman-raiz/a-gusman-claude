#!/usr/bin/env python3
"""
assumption_ledger.py — Manage the per-layer assumption ledger (Rule L2-M13).

Usage:
  python scripts/governance/assumption_ledger.py validate
  python scripts/governance/assumption_ledger.py stats
  python scripts/governance/assumption_ledger.py add --layer <name> --id <id> --text <text> --theme <theme_id>
  python scripts/governance/assumption_ledger.py update --id <id> --status <status> --evidence <link>
  python scripts/governance/assumption_ledger.py check-pr --files <file1> [<file2> ...]

Status enum: UNTESTED | PARTIAL | TESTED_PASS | FALSIFIED | PARKED

Examples:
  python scripts/governance/assumption_ledger.py validate
  python scripts/governance/assumption_ledger.py stats
  python scripts/governance/assumption_ledger.py add --layer "Camada 1" --id Z1 --text "New assumption" --theme D01
  python scripts/governance/assumption_ledger.py update --id A1 --status TESTED_PASS --evidence "reports/test.md"
  python scripts/governance/assumption_ledger.py check-pr --files engine_v4_2/pipeline.py scripts/run.py
"""

import argparse
import re
import sys
from datetime import datetime
from pathlib import Path

LEDGER_PATH = Path("docs/roadmap/ASSUMPTION_LEDGER.md")
VALID_STATUSES = {"UNTESTED", "PARTIAL", "TESTED_PASS", "FALSIFIED", "PARKED"}
LAYER_NAMES = [
    "Camada 1",
    "Camada 2",
    "Camada 3",
    "Camada transversal",
    "Dados",
    "Metodologia",
    "Epistemologia",
]

# Patterns
LAYER_HEADER_RE = re.compile(r"^## (.+?) —")
TABLE_ROW_RE = re.compile(
    r"^\|\s*([A-Za-z][0-9]+)\s*\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|"
)
AGGREGATE_STATUS_RE = re.compile(r"`([A-Z_]+)`:\s*\*\*?(\d+)")
TOTAL_RE = re.compile(r"\*\*Total assumptions tracked\*\*:\s*(\d+)")


def load_ledger() -> str:
    if not LEDGER_PATH.exists():
        sys.exit(f"ERROR: {LEDGER_PATH} not found")
    return LEDGER_PATH.read_text(encoding="utf-8")


def save_ledger(content: str) -> None:
    LEDGER_PATH.write_text(content, encoding="utf-8")


def parse_assumptions(content: str) -> list[dict]:
    """Extract all assumption rows from the ledger markdown tables."""
    assumptions = []
    current_layer = None

    for line in content.splitlines():
        m = LAYER_HEADER_RE.match(line)
        if m:
            current_layer = m.group(1).strip()
            continue
        row = TABLE_ROW_RE.match(line)
        if row and current_layer:
            aid = row.group(1).strip()
            assumption_text = row.group(2).strip()
            status = row.group(3).strip()
            evidence = row.group(4).strip()
            theme = row.group(5).strip()
            assumptions.append(
                {
                    "id": aid,
                    "assumption": assumption_text,
                    "status": status,
                    "evidence": evidence,
                    "theme": theme,
                    "layer": current_layer,
                }
            )
    return assumptions


def parse_aggregated_counts(content: str) -> dict[str, int]:
    """Parse the Aggregated status section (after '## Aggregated status' header only)."""
    counts: dict[str, int] = {}
    # Only look in the aggregated section
    agg_idx = content.find("## Aggregated status")
    if agg_idx == -1:
        return counts
    agg_section = content[agg_idx:]

    total_match = TOTAL_RE.search(agg_section)
    total = int(total_match.group(1)) if total_match else None

    for m in AGGREGATE_STATUS_RE.finditer(agg_section):
        counts[m.group(1)] = int(m.group(2))

    if total is not None:
        counts["TOTAL"] = total
    return counts


def cmd_validate(content: str, assumptions: list[dict]) -> int:
    """Validate the ledger. Returns exit code (0=ok, 2=errors)."""
    errors: list[str] = []

    # 1. Valid status enum
    for a in assumptions:
        if a["status"] not in VALID_STATUSES:
            errors.append(
                f"  ID {a['id']} (layer={a['layer']}): invalid status '{a['status']}'"
            )

    # 2. Every assumption references at least one theme
    for a in assumptions:
        if not a["theme"] or a["theme"] in ("-", ""):
            errors.append(f"  ID {a['id']}: no theme reference")

    # 3. No duplicate IDs within a layer
    seen: dict[str, str] = {}
    for a in assumptions:
        key = (a["layer"], a["id"])
        if key in seen:
            errors.append(
                f"  Duplicate ID {a['id']} in layer '{a['layer']}'"
            )
        seen[key] = a["assumption"]

    # 4. Aggregated counts match actual
    actual_counts: dict[str, int] = {}
    for a in assumptions:
        actual_counts[a["status"]] = actual_counts.get(a["status"], 0) + 1

    parsed_counts = parse_aggregated_counts(content)
    actual_total = len(assumptions)
    declared_total = parsed_counts.get("TOTAL", None)

    if declared_total is not None and declared_total != actual_total:
        errors.append(
            f"  Aggregated total mismatch: declared={declared_total}, actual={actual_total}"
        )

    for status, count in actual_counts.items():
        declared = parsed_counts.get(status, None)
        if declared is not None and declared != count:
            errors.append(
                f"  Aggregated {status} mismatch: declared={declared}, actual={count}"
            )

    if errors:
        print("[assumption_ledger] VALIDATION FAILED:")
        for e in errors:
            print(e)
        return 2

    print(
        f"[assumption_ledger] VALID — {actual_total} assumptions, "
        f"{len(set(a['layer'] for a in assumptions))} layers"
    )
    return 0


def cmd_stats(assumptions: list[dict]) -> None:
    """Print counts by status and layer, plus top blockers."""
    # Counts by status
    status_counts: dict[str, int] = {}
    for a in assumptions:
        status_counts[a["status"]] = status_counts.get(a["status"], 0) + 1

    print("=== Assumption Ledger Stats ===")
    print(f"Total: {len(assumptions)}")
    print()
    print("By status:")
    for s in sorted(VALID_STATUSES):
        count = status_counts.get(s, 0)
        pct = count / len(assumptions) * 100 if assumptions else 0
        bar = "#" * count
        print(f"  {s:<14} {count:>3}  ({pct:4.1f}%)  {bar}")

    # By layer
    print()
    print("By layer:")
    layer_counts: dict[str, dict[str, int]] = {}
    for a in assumptions:
        layer = a["layer"]
        if layer not in layer_counts:
            layer_counts[layer] = {}
        layer_counts[layer][a["status"]] = layer_counts[layer].get(a["status"], 0) + 1

    for layer in LAYER_NAMES:
        if layer in layer_counts:
            counts = layer_counts[layer]
            total = sum(counts.values())
            falsified = counts.get("FALSIFIED", 0)
            untested = counts.get("UNTESTED", 0)
            print(f"  {layer:<25} total={total}  FALSIFIED={falsified}  UNTESTED={untested}")

    # Top 10 critical blockers (FALSIFIED + UNTESTED)
    blockers = [
        a for a in assumptions if a["status"] in ("FALSIFIED", "UNTESTED")
    ]
    print()
    print(f"Top blockers for Epoch 2 (FALSIFIED + UNTESTED = {len(blockers)}):")
    for i, a in enumerate(blockers[:10], 1):
        print(
            f"  {i:>2}. [{a['status']:<12}] {a['id']} ({a['layer']}): "
            f"{a['assumption'][:70]}"
        )


def _find_layer_table_end(lines: list[str], layer_name: str) -> int:
    """Return the line index of the blank line after the layer's table."""
    in_layer = False
    for i, line in enumerate(lines):
        if LAYER_HEADER_RE.match(line):
            header_match = LAYER_HEADER_RE.match(line)
            if header_match and header_match.group(1).strip() == layer_name:
                in_layer = True
                continue
            elif in_layer:
                # Hit the next layer header — insert before it
                return i
        if in_layer and line.startswith("---"):
            return i
    return len(lines)


def cmd_add(content: str, layer: str, aid: str, text: str, theme: str) -> str:
    """Add a new assumption row to the correct layer table."""
    lines = content.splitlines(keepends=True)

    in_layer = False
    table_end_idx = None

    for i, line in enumerate(lines):
        stripped = line.rstrip("\n")
        hm = LAYER_HEADER_RE.match(stripped)
        if hm:
            if hm.group(1).strip() == layer:
                in_layer = True
                continue
            elif in_layer:
                # Insert before this header
                table_end_idx = i
                break
        if in_layer:
            if stripped.startswith("---") or stripped.startswith("## Aggregated"):
                table_end_idx = i
                break

    if table_end_idx is None:
        sys.exit(f"ERROR: layer '{layer}' not found in ledger")

    # Walk back past any empty lines to find the last table row
    insert_at = table_end_idx
    for i in range(table_end_idx - 1, 0, -1):
        stripped = lines[i].rstrip("\n")
        if stripped.startswith("|"):
            insert_at = i + 1
            break

    new_row = f"| {aid} | {text} | UNTESTED | Not tested | {theme} |\n"
    lines.insert(insert_at, new_row)
    return "".join(lines)


def cmd_update(content: str, aid: str, new_status: str, evidence: str) -> str:
    """Update status of an existing assumption, append history sub-entry."""
    if new_status not in VALID_STATUSES:
        sys.exit(f"ERROR: invalid status '{new_status}'")

    lines = content.splitlines(keepends=True)
    found = False
    date_str = datetime.utcnow().strftime("%Y-%m-%d")

    for i, line in enumerate(lines):
        row = TABLE_ROW_RE.match(line.rstrip("\n"))
        if row and row.group(1).strip() == aid:
            found = True
            old_status = row.group(3).strip()
            old_evidence = row.group(4).strip()

            # Rebuild the row with new status and evidence appended
            new_evidence = f"{old_evidence} → {new_status} [{date_str}] {evidence}"
            lines[i] = (
                f"| {aid} | {row.group(2).strip()} | {new_status} "
                f"| {new_evidence} | {row.group(5).strip()} |\n"
            )
            print(
                f"[assumption_ledger] Updated {aid}: {old_status} → {new_status}"
            )
            break

    if not found:
        sys.exit(f"ERROR: assumption ID '{aid}' not found in ledger")

    return "".join(lines)


def cmd_check_pr(files: list[str]) -> int:
    """Check PR coverage: if engine_v4_2/*.py changed, ledger must also change."""
    engine_changed = any(
        re.match(r"engine_v4_2/.*\.py$", f) for f in files
    )
    ledger_changed = any("ASSUMPTION_LEDGER.md" in f for f in files)

    if engine_changed and not ledger_changed:
        print(
            "[assumption_ledger] BLOCKED: engine_v4_2/*.py changed but "
            "docs/roadmap/ASSUMPTION_LEDGER.md not updated."
        )
        print(
            "  Rule L2-M13: each layer change must update the assumption ledger."
        )
        print("  Add or update an assumption row, then re-stage the ledger file.")
        return 2

    if engine_changed and ledger_changed:
        print("[assumption_ledger] check-pr PASS: engine change accompanied by ledger update.")
    elif not engine_changed:
        print("[assumption_ledger] check-pr PASS: no engine_v4_2/*.py files changed.")
    return 0


def recount_and_update_aggregated(content: str, assumptions: list[dict]) -> str:
    """Update the Aggregated status section with correct counts."""
    status_counts: dict[str, int] = {}
    for a in assumptions:
        status_counts[a["status"]] = status_counts.get(a["status"], 0) + 1

    total = len(assumptions)
    lines = content.splitlines(keepends=True)
    new_lines = []
    in_agg = False

    for line in lines:
        stripped = line.rstrip("\n")
        if stripped.startswith("**Total assumptions tracked**"):
            in_agg = True
            new_lines.append(f"**Total assumptions tracked**: {total}\n")
            continue
        if in_agg and stripped.startswith("- `"):
            # Replace count lines
            m = re.match(r"- `([A-Z_]+)`", stripped)
            if m:
                s = m.group(1)
                count = status_counts.get(s, 0)
                pct = count / total * 100 if total else 0
                # Preserve trailing text after the count
                new_lines.append(f"- `{s}`: **{count} ({pct:.0f}%)**\n")
                continue
        if in_agg and stripped == "" and not new_lines[-1].startswith("- "):
            in_agg = False
        new_lines.append(line)
    return "".join(new_lines)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Manage the per-layer assumption ledger (Rule L2-M13).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("validate", help="Validate ledger schema and counts")
    sub.add_parser("stats", help="Print counts by status and layer")

    add_p = sub.add_parser("add", help="Add a new assumption row")
    add_p.add_argument("--layer", required=True, help="Layer name (exact match)")
    add_p.add_argument("--id", dest="aid", required=True, help="Assumption ID (e.g. Z1)")
    add_p.add_argument("--text", required=True, help="Assumption text")
    add_p.add_argument("--theme", required=True, help="Theme ID(s) referencing this assumption")

    upd_p = sub.add_parser("update", help="Update status of an assumption")
    upd_p.add_argument("--id", dest="aid", required=True, help="Assumption ID")
    upd_p.add_argument(
        "--status",
        required=True,
        choices=sorted(VALID_STATUSES),
        help="New status",
    )
    upd_p.add_argument("--evidence", required=True, help="Evidence link or description")

    chk_p = sub.add_parser("check-pr", help="Check PR has ledger update if layer changed")
    chk_p.add_argument("--files", nargs="+", required=True, help="List of changed files")

    args = parser.parse_args()
    content = load_ledger()
    assumptions = parse_assumptions(content)

    if args.command == "validate":
        rc = cmd_validate(content, assumptions)
        sys.exit(rc)

    elif args.command == "stats":
        cmd_stats(assumptions)

    elif args.command == "add":
        new_content = cmd_add(content, args.layer, args.aid, args.text, args.theme)
        # Reparse and update aggregate
        new_assumptions = parse_assumptions(new_content)
        new_content = recount_and_update_aggregated(new_content, new_assumptions)
        save_ledger(new_content)
        print(f"[assumption_ledger] Added {args.aid} to '{args.layer}' with status=UNTESTED")

    elif args.command == "update":
        new_content = cmd_update(content, args.aid, args.status, args.evidence)
        new_assumptions = parse_assumptions(new_content)
        new_content = recount_and_update_aggregated(new_content, new_assumptions)
        save_ledger(new_content)

    elif args.command == "check-pr":
        rc = cmd_check_pr(args.files)
        sys.exit(rc)


if __name__ == "__main__":
    main()
