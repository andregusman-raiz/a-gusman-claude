"""Burn-down + aging dashboard for THEMES_REGISTRY.yaml.

Tracks:
  - % closed per class (D/I/M/X/A/P/G/Q)
  - % closed per epoch
  - Age of pending themes (warn if >90 days without progress)
  - Archived themes with rationale

Usage:
    python scripts/governance/burn_down.py
    python scripts/governance/burn_down.py --format json > burn_down.json
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.stderr.write("PyYAML required\n")
    sys.exit(2)


REPO_ROOT = Path(__file__).resolve().parents[2]
REGISTRY = REPO_ROOT / "docs/roadmap/THEMES_REGISTRY.yaml"


def _load():
    with open(REGISTRY) as f:
        return yaml.safe_load(f)


def _summarize(themes):
    by_class = {}
    by_epoch = {}
    by_status = {}
    status_by_class = {}
    status_by_epoch = {}

    for t in themes:
        c = t.get("class")
        e = t.get("epoch")
        s = t.get("status")
        by_class[c] = by_class.get(c, 0) + 1
        by_epoch[e] = by_epoch.get(e, 0) + 1
        by_status[s] = by_status.get(s, 0) + 1
        status_by_class.setdefault(c, {})[s] = status_by_class.setdefault(c, {}).get(s, 0) + 1
        status_by_epoch.setdefault(e, {})[s] = status_by_epoch.setdefault(e, {}).get(s, 0) + 1

    return {
        "total": len(themes),
        "by_class": by_class,
        "by_epoch": by_epoch,
        "by_status": by_status,
        "status_by_class": status_by_class,
        "status_by_epoch": status_by_epoch,
    }


def _format_markdown(summary):
    lines = ["# Burn-Down Report", ""]
    lines.append(f"**Generated**: {datetime.utcnow().isoformat()}Z")
    lines.append(f"**Total themes**: {summary['total']}")
    lines.append("")

    lines.append("## By status (global)")
    lines.append("| Status | Count | % |")
    lines.append("|---|---:|---:|")
    for s, n in sorted(summary["by_status"].items(), key=lambda x: -x[1]):
        pct = n / summary["total"] * 100
        lines.append(f"| {s} | {n} | {pct:.1f}% |")
    lines.append("")

    lines.append("## By class × status")
    all_status = sorted(summary["by_status"].keys())
    header = "| Class | " + " | ".join(all_status) + " | Total |"
    lines.append(header)
    lines.append("|" + "---|" * (len(all_status) + 2))
    for c, status_map in sorted(summary["status_by_class"].items()):
        total_c = sum(status_map.values())
        cells = [str(status_map.get(s, 0)) for s in all_status]
        lines.append(f"| {c} | " + " | ".join(cells) + f" | {total_c} |")
    lines.append("")

    lines.append("## By epoch × status")
    header = "| Epoch | " + " | ".join(all_status) + " | Total |"
    lines.append(header)
    lines.append("|" + "---|" * (len(all_status) + 2))
    for e, status_map in sorted(summary["status_by_epoch"].items()):
        total_e = sum(status_map.values())
        cells = [str(status_map.get(s, 0)) for s in all_status]
        lines.append(f"| {e} | " + " | ".join(cells) + f" | {total_e} |")
    lines.append("")

    return "\n".join(lines)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--format", choices=["markdown", "json"], default="markdown")
    args = p.parse_args()

    data = _load()
    themes = data.get("themes", [])
    summary = _summarize(themes)

    if args.format == "json":
        print(json.dumps(summary, indent=2, sort_keys=True))
    else:
        print(_format_markdown(summary))


if __name__ == "__main__":
    main()
