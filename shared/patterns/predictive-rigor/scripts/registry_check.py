"""Registry governance checker.

Enforces:
  - THEMES_REGISTRY.yaml is valid YAML
  - Every theme has required fields
  - No duplicate IDs
  - DAG acyclic (blocked_by does not form cycle)
  - Gates reference existing themes
  - Classes and epochs are in allowed enums
  - PFC file exists for every theme with pfc_required=true and status in [in_progress, done]
  - evidence_on_close present for every theme with status=done

Usage:
    python scripts/governance/registry_check.py
    python scripts/governance/registry_check.py --strict  # also checks PFCs

Exit 0 if all checks pass, 1 if warnings, 2 if hard failures.
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.stderr.write("PyYAML required. pip install pyyaml\n")
    sys.exit(2)


REPO_ROOT = Path(__file__).resolve().parents[2]
REGISTRY = REPO_ROOT / "docs/roadmap/THEMES_REGISTRY.yaml"
PFC_DIR = REPO_ROOT / "docs/roadmap/pfc"

ALLOWED_CLASSES = {"D", "I", "M", "X", "A", "P", "G", "Q"}
ALLOWED_EPOCHS = {0, 1, 2, 3, 4}
ALLOWED_PRIORITIES = {"critical", "high", "medium", "low"}
ALLOWED_STATUS = {"pending", "in_progress", "done", "archived", "obsolete"}


REQUIRED_FIELDS = [
    "id", "class", "epoch", "title", "source", "priority",
    "pfc_required", "blocks", "blocked_by", "status",
]


def _load_registry():
    with open(REGISTRY) as f:
        return yaml.safe_load(f)


def _check_schema(data, errors, warnings):
    themes = data.get("themes", [])
    gates = data.get("gates", {})

    if not themes:
        errors.append("no themes found in registry")
        return

    ids_seen = set()
    for i, t in enumerate(themes):
        if not isinstance(t, dict):
            errors.append(f"theme #{i} is not a dict")
            continue
        for field in REQUIRED_FIELDS:
            if field not in t:
                errors.append(f"theme {t.get('id', f'#{i}')} missing '{field}'")
        tid = t.get("id")
        if tid:
            if tid in ids_seen:
                errors.append(f"duplicate id: {tid}")
            ids_seen.add(tid)
            if t.get("class") not in ALLOWED_CLASSES:
                errors.append(f"{tid}: invalid class '{t.get('class')}'")
            if t.get("epoch") not in ALLOWED_EPOCHS:
                errors.append(f"{tid}: invalid epoch '{t.get('epoch')}'")
            if t.get("priority") not in ALLOWED_PRIORITIES:
                errors.append(f"{tid}: invalid priority '{t.get('priority')}'")
            if t.get("status") not in ALLOWED_STATUS:
                errors.append(f"{tid}: invalid status '{t.get('status')}'")

    # Gate check
    for gname, gdef in gates.items():
        if not isinstance(gdef, dict):
            errors.append(f"gate {gname} not dict")
            continue
        for req in gdef.get("requires", []):
            if req not in ids_seen and req not in gates:
                errors.append(f"gate {gname}: requires '{req}' not found")

    return ids_seen


def _check_dag(data, errors, warnings, ids_seen):
    """Detect cycles in blocked_by relationships."""
    themes = {t["id"]: t for t in data.get("themes", []) if t.get("id")}
    color = {}  # 0=white 1=gray 2=black

    def visit(node, path):
        if color.get(node) == 1:
            errors.append(f"cycle detected: {' -> '.join(path + [node])}")
            return
        if color.get(node) == 2:
            return
        color[node] = 1
        deps = themes.get(node, {}).get("blocked_by", []) or []
        for dep in deps:
            if dep in themes or dep in data.get("gates", {}):
                visit(dep, path + [node])
        color[node] = 2

    for tid in themes:
        visit(tid, [])


def _check_pfc_coverage(data, errors, warnings):
    """Themes with pfc_required=true AND status=done must have PFC file."""
    for t in data.get("themes", []):
        tid = t.get("id")
        if not tid:
            continue
        if t.get("pfc_required") and t.get("status") in ("in_progress", "done"):
            pfc_path = PFC_DIR / f"{tid}-PFC.md"
            if not pfc_path.exists():
                errors.append(
                    f"{tid}: status={t['status']}, pfc_required=true, "
                    f"but {pfc_path.relative_to(REPO_ROOT)} not found"
                )


def _check_evidence(data, errors, warnings):
    """Themes with status=done must have evidence_on_close."""
    for t in data.get("themes", []):
        tid = t.get("id")
        if not tid:
            continue
        if t.get("status") == "done":
            evidence = t.get("evidence_on_close")
            if not evidence:
                errors.append(f"{tid}: status=done but evidence_on_close empty")


def _summary(data, warnings, errors):
    themes = data.get("themes", [])
    by_class = {}
    by_epoch = {}
    by_status = {}
    for t in themes:
        by_class[t.get("class")] = by_class.get(t.get("class"), 0) + 1
        by_epoch[t.get("epoch")] = by_epoch.get(t.get("epoch"), 0) + 1
        by_status[t.get("status")] = by_status.get(t.get("status"), 0) + 1
    print(f"Total themes: {len(themes)}")
    print(f"By class: {sorted(by_class.items())}")
    print(f"By epoch: {sorted(by_epoch.items())}")
    print(f"By status: {sorted(by_status.items())}")
    print(f"Errors: {len(errors)}, Warnings: {len(warnings)}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--strict", action="store_true", help="enforce PFC existence")
    args = parser.parse_args()

    errors = []
    warnings = []

    if not REGISTRY.exists():
        print(f"FATAL: {REGISTRY} does not exist", file=sys.stderr)
        return 2

    data = _load_registry()
    ids_seen = _check_schema(data, errors, warnings) or set()
    _check_dag(data, errors, warnings, ids_seen)

    if args.strict:
        _check_pfc_coverage(data, errors, warnings)
        _check_evidence(data, errors, warnings)

    if warnings:
        print("WARNINGS:")
        for w in warnings:
            print(f"  WARN: {w}")
    if errors:
        print("ERRORS:")
        for e in errors:
            print(f"  ERR: {e}")

    print("---")
    _summary(data, warnings, errors)

    if errors:
        return 2
    if warnings:
        return 1
    print("REGISTRY OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
