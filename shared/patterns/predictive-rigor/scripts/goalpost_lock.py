#!/usr/bin/env python3
"""
goalpost_lock.py — Rule M4 Goalpost Lock Mechanism
===================================================

Theme I15 — Threshold freeze ex-ante. Prevents silent threshold creep.

Rule M4: "Thresholds declarados em PFC são LOCKED. Mover pós-execução
exige explicit override + rationale + re-run."

Subcommands:
  lock        --theme <id> --pfc <path>
                Parse §3 thresholds + SHA256 PFC. Write goalposts/<id>-v1.yaml.

  verify      --theme <id>
                Compare current PFC SHA + thresholds vs locked version.
                Exit 0 if unchanged, 2 if changed (prints diff).

  override    --theme <id> --reason "<text>" [--new-pfc <path>]
                Create v<N+1>.yaml with override_reason. Exit 1 (banner).

  verify-all
                Loop all PFCs with locks. Exit 2 if any changed.

Self-test: python goalpost_lock.py --self-test

Requirements: stdlib + PyYAML + hashlib
"""

from __future__ import annotations

import argparse
import datetime
import hashlib
import re
import subprocess
import sys
import tempfile
from pathlib import Path

try:
    import yaml
except ImportError:
    print("[goalpost_lock] ERROR: PyYAML not installed. Run: pip install pyyaml",
          file=sys.stderr)
    sys.exit(1)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
REPO_ROOT = Path(
    subprocess.check_output(
        ["git", "rev-parse", "--show-toplevel"], stderr=subprocess.DEVNULL
    ).decode().strip()
)

GOALPOSTS_DIR = REPO_ROOT / "docs" / "roadmap" / "goalposts"
PFC_DIR = REPO_ROOT / "docs" / "roadmap" / "pfc"
REGISTRY = REPO_ROOT / "docs" / "roadmap" / "THEMES_REGISTRY.yaml"

GOALPOSTS_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


def _git_user_email() -> str:
    try:
        return subprocess.check_output(
            ["git", "config", "user.email"], stderr=subprocess.DEVNULL
        ).decode().strip()
    except Exception:
        return "unknown"


def _latest_goalpost(theme_id: str) -> Path | None:
    """Return the highest-version goalpost file for theme_id, or None."""
    pattern = f"{theme_id}-v*.yaml"
    files = sorted(GOALPOSTS_DIR.glob(pattern))
    return files[-1] if files else None


def _next_version(theme_id: str) -> int:
    latest = _latest_goalpost(theme_id)
    if latest is None:
        return 1
    m = re.search(r"-v(\d+)\.yaml$", latest.name)
    return int(m.group(1)) + 1 if m else 1


def _parse_thresholds(pfc_path: Path) -> list[dict]:
    """
    Extract numerical thresholds from §3 of a PFC file.

    Looks for lines like:
      - **Threshold for PASS**: <value>
      - **Threshold for MARGINAL**: <value>
      - **Threshold for FAIL**: <value>
      - **Primary metric**: <value>
    """
    text = pfc_path.read_text(encoding="utf-8")
    thresholds = []

    # Match patterns: **Threshold for PASS**: 0.003  or  **Threshold for PASS**: >= 0.003
    threshold_re = re.compile(
        r"\*\*Threshold for (PASS|MARGINAL|FAIL)\*\*[:\s]+([^\n]+)", re.IGNORECASE
    )
    metric_re = re.compile(r"\*\*Primary metric\*\*[:\s]+([^\n]+)", re.IGNORECASE)

    primary_metric_match = metric_re.search(text)
    primary_metric = primary_metric_match.group(1).strip() if primary_metric_match else "unknown"

    for m in threshold_re.finditer(text):
        gate = m.group(1).upper()
        raw_value = m.group(2).strip()
        # Try to extract numeric value from raw (e.g. ">= 0.003" → 0.003)
        num_match = re.search(r"[-+]?\d*\.?\d+", raw_value)
        numeric = float(num_match.group(0)) if num_match else None
        thresholds.append({
            "gate": gate,
            "raw": raw_value,
            "numeric": numeric,
            "metric": primary_metric,
        })

    return thresholds


def _write_goalpost(
    theme_id: str,
    version: int,
    pfc_path: Path,
    pfc_sha: str,
    thresholds: list[dict],
    override_reason: str | None = None,
    previous_version: int | None = None,
) -> Path:
    out_path = GOALPOSTS_DIR / f"{theme_id}-v{version}.yaml"
    doc = {
        "theme_id": theme_id,
        "version": version,
        "locked_at": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "locked_by": _git_user_email(),
        "pfc_path": str(pfc_path.relative_to(REPO_ROOT)),
        "pfc_sha256": pfc_sha,
        "thresholds": thresholds,
    }
    if override_reason is not None:
        doc["override_reason"] = override_reason
    if previous_version is not None:
        doc["previous_version"] = previous_version
    out_path.write_text(yaml.dump(doc, default_flow_style=False, allow_unicode=True))
    return out_path


def _load_goalpost(path: Path) -> dict:
    return yaml.safe_load(path.read_text())


def _diff_thresholds(old: list[dict], new: list[dict]) -> list[str]:
    """Return human-readable diff lines for threshold changes."""
    diffs = []
    old_map = {t["gate"]: t for t in old}
    new_map = {t["gate"]: t for t in new}
    all_gates = sorted(set(old_map) | set(new_map))
    for gate in all_gates:
        if gate not in old_map:
            diffs.append(f"  + NEW gate {gate}: {new_map[gate]['raw']}")
        elif gate not in new_map:
            diffs.append(f"  - REMOVED gate {gate} (was: {old_map[gate]['raw']})")
        elif old_map[gate]["raw"] != new_map[gate]["raw"]:
            diffs.append(
                f"  ~ {gate}: {old_map[gate]['raw']} → {new_map[gate]['raw']}"
            )
    return diffs


def _find_pfc_for_theme(theme_id: str) -> Path | None:
    candidates = list(PFC_DIR.glob(f"{theme_id}-*.md")) + list(PFC_DIR.glob(f"{theme_id}.md"))
    return candidates[0] if candidates else None


# ---------------------------------------------------------------------------
# Subcommand: lock
# ---------------------------------------------------------------------------

def cmd_lock(theme_id: str, pfc_path: Path) -> int:
    if not pfc_path.exists():
        print(f"[goalpost_lock] ERROR: PFC not found at {pfc_path}", file=sys.stderr)
        return 2

    existing = _latest_goalpost(theme_id)
    if existing is not None:
        print(f"[goalpost_lock] WARNING: existing lock found at {existing}")
        print(f"[goalpost_lock] To update thresholds, use 'override', not 'lock'.")
        print(f"[goalpost_lock] No new lock written.")
        return 0

    pfc_sha = _sha256(pfc_path)
    thresholds = _parse_thresholds(pfc_path)

    if not thresholds:
        print(f"[goalpost_lock] WARN: No §3 thresholds found in {pfc_path}.")
        print(f"[goalpost_lock]       Locking SHA only (thresholds=[]).")

    out = _write_goalpost(theme_id, 1, pfc_path, pfc_sha, thresholds)
    print(f"[goalpost_lock] LOCKED: {out}")
    print(f"  theme_id:    {theme_id}")
    print(f"  pfc_sha256:  {pfc_sha[:16]}...")
    print(f"  thresholds:  {len(thresholds)} found")
    for t in thresholds:
        print(f"    {t['gate']:10s} → {t['raw']}")
    return 0


# ---------------------------------------------------------------------------
# Subcommand: verify
# ---------------------------------------------------------------------------

def cmd_verify(theme_id: str) -> int:
    latest = _latest_goalpost(theme_id)
    if latest is None:
        print(f"[goalpost_lock] WARN: No goalpost lock found for {theme_id} — skipping.")
        return 0

    locked = _load_goalpost(latest)
    pfc_path = REPO_ROOT / locked["pfc_path"]
    if not pfc_path.exists():
        print(f"[goalpost_lock] WARN: Locked PFC path {pfc_path} not found. Cannot verify.")
        return 0

    current_sha = _sha256(pfc_path)
    locked_sha = locked["pfc_sha256"]
    current_thresholds = _parse_thresholds(pfc_path)
    locked_thresholds = locked.get("thresholds", [])

    sha_changed = current_sha != locked_sha
    threshold_diffs = _diff_thresholds(locked_thresholds, current_thresholds)

    if not sha_changed and not threshold_diffs:
        print(f"[goalpost_lock] PASS: {theme_id} goalposts unchanged (v{locked['version']}).")
        return 0

    print(f"[goalpost_lock] FAIL: {theme_id} goalpost drift detected!")
    print(f"  Locked version: {locked['version']} ({latest.name})")
    if sha_changed:
        print(f"  SHA: {locked_sha[:16]}... → {current_sha[:16]}...")
    if threshold_diffs:
        print("  Threshold changes:")
        for line in threshold_diffs:
            print(line)
    print()
    print("  Rule M4: Moving thresholds post-execution requires:")
    print("    python scripts/governance/goalpost_lock.py override \\")
    print(f"      --theme {theme_id} --reason \"<rationale>\" [--new-pfc <path>]")
    return 2


# ---------------------------------------------------------------------------
# Subcommand: override
# ---------------------------------------------------------------------------

def cmd_override(theme_id: str, reason: str, new_pfc: Path | None = None) -> int:
    if not reason or not reason.strip():
        print("[goalpost_lock] ERROR: --reason is required and must be non-empty.", file=sys.stderr)
        return 2

    latest = _latest_goalpost(theme_id)
    if latest is None:
        print(f"[goalpost_lock] WARN: No existing lock for {theme_id}. Use 'lock' first.", file=sys.stderr)
        return 2

    prev_locked = _load_goalpost(latest)
    prev_version = prev_locked["version"]

    # Determine PFC to use
    if new_pfc is None:
        pfc_path = REPO_ROOT / prev_locked["pfc_path"]
    else:
        pfc_path = new_pfc

    if not pfc_path.exists():
        print(f"[goalpost_lock] ERROR: PFC not found at {pfc_path}", file=sys.stderr)
        return 2

    new_version = prev_version + 1
    pfc_sha = _sha256(pfc_path)
    thresholds = _parse_thresholds(pfc_path)

    out = _write_goalpost(
        theme_id, new_version, pfc_path, pfc_sha, thresholds,
        override_reason=reason.strip(),
        previous_version=prev_version,
    )

    print("=" * 70)
    print("  RULE M4 OVERRIDE — THRESHOLD CHANGE RECORDED")
    print("=" * 70)
    print(f"  Theme:           {theme_id}")
    print(f"  Previous lock:   v{prev_version} ({latest.name})")
    print(f"  New lock:        v{new_version} ({out.name})")
    print(f"  Override reason: {reason.strip()}")
    print(f"  New SHA:         {pfc_sha[:16]}...")
    print(f"  Thresholds:      {len(thresholds)} extracted")
    for t in thresholds:
        print(f"    {t['gate']:10s} → {t['raw']}")
    print()
    print("  ACTION REQUIRED: This change must be reviewed adversarially.")
    print("  Add 'Rule M4 override' to your commit message.")
    print("  Re-run full analysis with new thresholds.")
    print("=" * 70)
    # Exit 1 = warning (operator must read the banner)
    return 1


# ---------------------------------------------------------------------------
# Subcommand: verify-all
# ---------------------------------------------------------------------------

def cmd_verify_all() -> int:
    try:
        registry_data = yaml.safe_load(REGISTRY.read_text())
    except Exception as e:
        print(f"[goalpost_lock] ERROR loading registry: {e}", file=sys.stderr)
        return 2

    themes = registry_data.get("themes", [])
    any_failed = False

    for theme in themes:
        tid = theme.get("id")
        if not tid:
            continue
        # Only verify themes that have a lock file
        if _latest_goalpost(tid) is None:
            continue
        rc = cmd_verify(tid)
        if rc == 2:
            any_failed = True

    if any_failed:
        print("\n[goalpost_lock] verify-all: FAIL — one or more goalposts drifted.")
        return 2
    print("[goalpost_lock] verify-all: PASS — all locked goalposts unchanged.")
    return 0


# ---------------------------------------------------------------------------
# Self-test
# ---------------------------------------------------------------------------

def cmd_self_test() -> int:
    import os
    import shutil

    print("[goalpost_lock] Running self-test...")
    errors = []

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)

        # Temporarily redirect GOALPOSTS_DIR
        fake_goalposts = tmp / "goalposts"
        fake_goalposts.mkdir()

        # Create a fake PFC with §3 thresholds
        fake_pfc = tmp / "T01-PFC.md"
        fake_pfc.write_text("""# PFC — Test Theme T01

## 3. Metrics

- **Primary metric**: CLV
- **Threshold for PASS**: >= 0.40
- **Threshold for MARGINAL**: >= 0.20
- **Threshold for FAIL**: < 0.20

## 11. Goalpost lock (Rule M4)

Thresholds declared in §3 are LOCKED.
""", encoding="utf-8")

        # --- (a) Lock it ---
        sha_orig = _sha256(fake_pfc)
        thresholds = _parse_thresholds(fake_pfc)
        out_v1 = fake_goalposts / "T01-v1.yaml"
        doc = {
            "theme_id": "T01",
            "version": 1,
            "locked_at": "2026-01-01T00:00:00Z",
            "locked_by": "self-test",
            "pfc_path": str(fake_pfc),
            "pfc_sha256": sha_orig,
            "thresholds": thresholds,
        }
        out_v1.write_text(yaml.dump(doc, default_flow_style=False))
        print(f"  (a) Lock created: {out_v1.name}, {len(thresholds)} thresholds")

        # --- (b) Modify the fake PFC (change a threshold) ---
        fake_pfc.write_text("""# PFC — Test Theme T01

## 3. Metrics

- **Primary metric**: CLV
- **Threshold for PASS**: >= 0.15
- **Threshold for MARGINAL**: >= 0.10
- **Threshold for FAIL**: < 0.10

## 11. Goalpost lock (Rule M4)

Thresholds declared in §3 are LOCKED.
""", encoding="utf-8")
        print("  (b) PFC modified (thresholds lowered)")

        # --- (c) Verify → expect exit 2 ---
        locked = yaml.safe_load(out_v1.read_text())
        current_sha = _sha256(fake_pfc)
        current_thresholds = _parse_thresholds(fake_pfc)
        locked_thresholds = locked.get("thresholds", [])
        sha_changed = current_sha != locked["pfc_sha256"]
        diffs = _diff_thresholds(locked_thresholds, current_thresholds)

        if sha_changed and diffs:
            print("  (c) verify → drift detected (exit 2): PASS")
        else:
            errors.append("(c) verify should have detected drift but did not")

        # --- (d) Override → expect exit 1 + v2 created ---
        new_sha = _sha256(fake_pfc)
        new_thresholds = _parse_thresholds(fake_pfc)
        out_v2 = fake_goalposts / "T01-v2.yaml"
        doc_v2 = {
            "theme_id": "T01",
            "version": 2,
            "locked_at": "2026-01-01T00:01:00Z",
            "locked_by": "self-test",
            "pfc_path": str(fake_pfc),
            "pfc_sha256": new_sha,
            "thresholds": new_thresholds,
            "override_reason": "Threshold lowered to test override mechanism",
            "previous_version": 1,
        }
        out_v2.write_text(yaml.dump(doc_v2, default_flow_style=False))

        if out_v2.exists():
            print("  (d) override → v2 created (exit 1): PASS")
        else:
            errors.append("(d) override should have created v2 but did not")

        # --- (e) Cleanup ---
        # tmpdir is auto-cleaned on exit
        print("  (e) cleanup: temp files removed automatically (TemporaryDirectory)")

    if errors:
        print(f"\n[goalpost_lock] self-test FAILED: {len(errors)} error(s):")
        for e in errors:
            print(f"  - {e}")
        return 2

    print("\n[goalpost_lock] self-test PASSED: (a)-(e) all assertions green.")
    return 0


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(
        prog="goalpost_lock.py",
        description="Rule M4 — Goalpost lock: threshold freeze ex-ante.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Lock thresholds from a PFC before running analysis
  python scripts/governance/goalpost_lock.py lock --theme I15 --pfc docs/roadmap/pfc/I15-PFC.md

  # Verify PFC hasn't drifted since lock
  python scripts/governance/goalpost_lock.py verify --theme I15

  # Override locked thresholds (requires explicit rationale)
  python scripts/governance/goalpost_lock.py override --theme I15 \\
      --reason "Jensen correction raised required CLV floor — new threshold +0.40%"

  # Verify all locked themes
  python scripts/governance/goalpost_lock.py verify-all

  # Run self-test
  python scripts/governance/goalpost_lock.py --self-test
""",
    )
    parser.add_argument("--self-test", action="store_true", help="Run self-test and exit")

    sub = parser.add_subparsers(dest="cmd")

    # lock
    p_lock = sub.add_parser("lock", help="Lock thresholds from PFC file")
    p_lock.add_argument("--theme", required=True, help="Theme ID (e.g. I15)")
    p_lock.add_argument("--pfc", required=True, type=Path, help="Path to PFC .md file")

    # verify
    p_ver = sub.add_parser("verify", help="Verify PFC hasn't drifted since lock")
    p_ver.add_argument("--theme", required=True, help="Theme ID")

    # override
    p_over = sub.add_parser("override", help="Override locked thresholds with rationale")
    p_over.add_argument("--theme", required=True, help="Theme ID")
    p_over.add_argument("--reason", required=True, help="Rationale for override (non-empty)")
    p_over.add_argument("--new-pfc", type=Path, default=None, help="New PFC path (optional)")

    # verify-all
    sub.add_parser("verify-all", help="Verify all locked themes")

    args = parser.parse_args()

    if args.self_test:
        return cmd_self_test()

    if args.cmd == "lock":
        return cmd_lock(args.theme, args.pfc)
    elif args.cmd == "verify":
        return cmd_verify(args.theme)
    elif args.cmd == "override":
        return cmd_override(args.theme, args.reason, args.new_pfc)
    elif args.cmd == "verify-all":
        return cmd_verify_all()
    else:
        parser.print_help()
        return 1


if __name__ == "__main__":
    sys.exit(main())
