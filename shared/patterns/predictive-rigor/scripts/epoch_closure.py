"""Epoch closure orchestrator.

Enforces G17 (adversarial review) + G18 (retrospective) gate before each epoch advances.

Commands:
  start    --epoch N   Validate all epoch-N themes done; generate skeleton docs.
  validate --epoch N   Confirm both docs exist and Q1/Q2/Q3 are filled.
  status               Print epoch progress table.
  --self-test          Run internal tests, exit 0 if all pass.

Exit codes:
  0 = success / gate cleared
  1 = instructions printed (user must fill docs)
  2 = hard failure (pending themes / incomplete docs / bad args)
"""

from __future__ import annotations

import argparse
import sys
import textwrap
from datetime import date
from pathlib import Path
from typing import NamedTuple

try:
    import yaml
except ImportError:
    sys.stderr.write("PyYAML required: pip install pyyaml\n")
    sys.exit(2)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parents[2]
REGISTRY = REPO_ROOT / "docs/roadmap/THEMES_REGISTRY.yaml"
CHECKPOINTS_DIR = REPO_ROOT / "docs/roadmap/checkpoints"
TEMPLATES_DIR = REPO_ROOT / "docs/roadmap/templates"
ADVERSARIAL_TMPL = TEMPLATES_DIR / "ADVERSARIAL_REVIEW_TEMPLATE.md"
RETRO_TMPL = TEMPLATES_DIR / "RETROSPECTIVE_TEMPLATE.md"

TERMINAL_STATUSES = {"done", "archived", "obsolete"}
PLACEHOLDER_SENTINEL = "<"   # template lines start with <...> = unfilled

# Markers checked by validate; must be present and non-placeholder
Q_MARKERS = ["## §3 Q1", "## §4 Q2", "## §5 Q3"]

# ---------------------------------------------------------------------------
# Registry helpers
# ---------------------------------------------------------------------------


class ThemeInfo(NamedTuple):
    tid: str
    epoch: int
    status: str
    title: str


def _load_registry() -> list[ThemeInfo]:
    with open(REGISTRY) as f:
        data = yaml.safe_load(f)
    themes = data.get("themes", [])
    return [
        ThemeInfo(
            tid=t["id"],
            epoch=t.get("epoch", -1),
            status=t.get("status", "pending"),
            title=t.get("title", ""),
        )
        for t in themes
        if isinstance(t, dict) and t.get("id")
    ]


def _epoch_themes(themes: list[ThemeInfo], epoch: int) -> list[ThemeInfo]:
    return [t for t in themes if t.epoch == epoch]


def _pending(themes: list[ThemeInfo]) -> list[ThemeInfo]:
    return [t for t in themes if t.status not in TERMINAL_STATUSES]


def _done(themes: list[ThemeInfo]) -> list[ThemeInfo]:
    return [t for t in themes if t.status in TERMINAL_STATUSES]


# ---------------------------------------------------------------------------
# Template population
# ---------------------------------------------------------------------------

def _epoch_label(epoch: int) -> str:
    labels = {0: "E0 — Governance hardening", 1: "E1 — Data foundation",
               2: "E2 — Methodology rebuild", 3: "E3 — Experimental expansion",
               4: "E4 — Production"}
    return labels.get(epoch, f"E{epoch}")


def _populate_adversarial(template_text: str, epoch: int, themes: list[ThemeInfo]) -> str:
    ep_themes = _epoch_themes(themes, epoch)
    done_count = len(_done(ep_themes))
    text = template_text
    text = text.replace("Epoch <N>", f"Epoch {epoch}")
    text = text.replace("<e.g. E0 — Governance hardening>", _epoch_label(epoch))
    text = text.replace("adversarial_review_epoch_<N>.md", f"adversarial_review_epoch_{epoch}.md")
    text = text.replace("<count> / <total in epoch>",
                        f"{done_count} / {len(ep_themes)}")
    text = text.replace("**Review date**: <YYYY-MM-DD>",
                        f"**Review date**: {date.today()}")
    return text


def _populate_retro(template_text: str, epoch: int, themes: list[ThemeInfo]) -> str:
    ep_themes = _epoch_themes(themes, epoch)
    done_count = len([t for t in ep_themes if t.status == "done"])
    archived_count = len([t for t in ep_themes if t.status == "archived"])
    obsolete_count = len([t for t in ep_themes if t.status == "obsolete"])
    pending_list = [t.tid for t in ep_themes if t.status not in TERMINAL_STATUSES]
    text = template_text
    text = text.replace("Epoch <N>", f"Epoch {epoch}")
    text = text.replace("<e.g. E0 — Governance hardening>", _epoch_label(epoch))
    text = text.replace("retrospective_epoch_<N>.md", f"retrospective_epoch_{epoch}.md")
    text = text.replace("adversarial_review_epoch_<N>.md", f"adversarial_review_epoch_{epoch}.md")
    text = text.replace("**Retrospective date**: <YYYY-MM-DD>",
                        f"**Retrospective date**: {date.today()}")
    text = text.replace("**Themes closed (done)**: <count>",
                        f"**Themes closed (done)**: {done_count}")
    text = text.replace("**Themes archived (done, with evidence)**: <count>",
                        f"**Themes archived (done, with evidence)**: {archived_count}")
    text = text.replace("**Themes obsolete (invalidated)**: <count>",
                        f"**Themes obsolete (invalidated)**: {obsolete_count}")
    pending_str = ", ".join(pending_list) if pending_list else "none"
    text = text.replace("list IDs: [<G01>, <G02>...]", f"list IDs: [{pending_str}]")
    text = text.replace("<count> — list IDs:",
                        f"{len(pending_list)} — list IDs:")
    return text


# ---------------------------------------------------------------------------
# Validate helpers
# ---------------------------------------------------------------------------

def _section_content_after(text: str, marker: str) -> str:
    """Return text between this marker's first newline and the next ## section."""
    idx = text.find(marker)
    if idx == -1:
        return ""
    # Skip to first newline to drop the rest of the heading line
    first_nl = text.find("\n", idx)
    if first_nl == -1:
        return ""
    after = text[first_nl + 1:]
    next_section = after.find("\n## ")
    if next_section != -1:
        after = after[:next_section]
    return after.strip()


FILL_SENTINEL = "<!-- FILL_REQUIRED:"


def _section_is_filled(text: str, marker: str) -> bool:
    """Return True if the section no longer contains the FILL_REQUIRED sentinel.

    Templates have `<!-- FILL_REQUIRED: ... -->` at the top of each answer area.
    When the operator fills the section they replace that sentinel block.
    Presence of the sentinel = section not filled.
    """
    content = _section_content_after(text, marker)
    if not content:
        return False
    return FILL_SENTINEL not in content


# ---------------------------------------------------------------------------
# Sub-commands
# ---------------------------------------------------------------------------

def cmd_start(epoch: int) -> int:
    themes = _load_registry()
    ep_themes = _epoch_themes(themes, epoch)

    if not ep_themes:
        sys.stderr.write(f"ERROR: no themes found for epoch {epoch} in registry.\n")
        return 2

    pending = _pending(ep_themes)
    if pending:
        ids = ", ".join(t.tid for t in pending)
        sys.stderr.write(
            f"ERROR: epoch {epoch} has {len(pending)} pending theme(s): {ids}\n"
            f"All must be done|archived|obsolete before closure can begin.\n"
        )
        return 2

    CHECKPOINTS_DIR.mkdir(parents=True, exist_ok=True)

    adv_path = CHECKPOINTS_DIR / f"adversarial_review_epoch_{epoch}.md"
    retro_path = CHECKPOINTS_DIR / f"retrospective_epoch_{epoch}.md"

    adv_tmpl = ADVERSARIAL_TMPL.read_text()
    retro_tmpl = RETRO_TMPL.read_text()

    adv_text = _populate_adversarial(adv_tmpl, epoch, themes)
    retro_text = _populate_retro(retro_tmpl, epoch, themes)

    def _rel(p: Path) -> str:
        try:
            return str(p.relative_to(REPO_ROOT))
        except ValueError:
            return str(p)

    created = []
    for path, text in [(adv_path, adv_text), (retro_path, retro_text)]:
        if not path.exists():
            path.write_text(text)
            created.append(_rel(path))
        else:
            created.append(f"{_rel(path)} (already exists — not overwritten)")

    done_count = len(_done(ep_themes))
    print(textwrap.dedent(f"""
        Epoch {epoch} themes: {done_count}/{len(ep_themes)} terminal.

        Skeleton documents created:
          {chr(10).join('  ' + p for p in created)}

        NEXT STEPS:
          1. Fill ALL placeholder sections in the adversarial review:
               {_rel(adv_path)}
             Pay special attention to §2 (re-execution), §4 (goalpost audit), §5 (10 questions).

          2. Fill ALL sections in the retrospective:
               {_rel(retro_path)}
             Q1/Q2/Q3 are mandatory — placeholder answers are rejected by validate.

          3. When both docs are filled, run:
               python scripts/governance/epoch_closure.py validate --epoch {epoch}

          4. If validate exits 0, the epoch gate is cleared.
    """).strip())
    return 1


def _rel_safe(p: Path) -> str:
    try:
        return str(p.relative_to(REPO_ROOT))
    except ValueError:
        return str(p)


def cmd_validate(epoch: int) -> int:
    adv_path = CHECKPOINTS_DIR / f"adversarial_review_epoch_{epoch}.md"
    retro_path = CHECKPOINTS_DIR / f"retrospective_epoch_{epoch}.md"

    errors: list[str] = []

    for path in (adv_path, retro_path):
        if not path.exists():
            errors.append(f"Missing: {_rel_safe(path)}")

    if errors:
        for e in errors:
            sys.stderr.write(f"ERROR: {e}\n")
        sys.stderr.write("Run `epoch_closure.py start --epoch N` to generate skeletons.\n")
        return 2

    retro_text = retro_path.read_text()
    for marker in Q_MARKERS:
        if not _section_is_filled(retro_text, marker):
            errors.append(
                f"Retrospective section '{marker}' is empty or contains only placeholders."
            )

    adv_text = adv_path.read_text()
    for marker in ["## §5 Ten Questions"]:
        if not _section_is_filled(adv_text, marker):
            errors.append(
                f"Adversarial review section '{marker}' is empty or contains only placeholders."
            )

    if errors:
        sys.stderr.write("VALIDATE FAILED — incomplete documents:\n")
        for e in errors:
            sys.stderr.write(f"  - {e}\n")
        return 2

    print(f"EPOCH {epoch} GATE CLEARED — both docs exist and Q1/Q2/Q3 are filled.")
    print(f"  Adversarial review: {_rel_safe(adv_path)}")
    print(f"  Retrospective:      {_rel_safe(retro_path)}")
    print("You may now advance to the next epoch.")
    return 0


def cmd_status() -> int:
    themes = _load_registry()
    all_epochs = sorted({t.epoch for t in themes if t.epoch >= 0})

    header = f"{'Epoch':<8} {'Total':>6} {'Done':>6} {'Pending':>8} {'Gate doc':>10}"
    print(header)
    print("-" * len(header))

    for epoch in all_epochs:
        ep_themes = _epoch_themes(themes, epoch)
        done = len(_done(ep_themes))
        pending = len(_pending(ep_themes))
        adv = CHECKPOINTS_DIR / f"adversarial_review_epoch_{epoch}.md"
        retro = CHECKPOINTS_DIR / f"retrospective_epoch_{epoch}.md"
        if adv.exists() and retro.exists():
            gate = "docs ready"
        elif pending == 0 and ep_themes:
            gate = "start ready"
        else:
            gate = "pending"
        print(f"E{epoch:<7} {len(ep_themes):>6} {done:>6} {pending:>8} {gate:>10}")

    total = len(themes)
    total_done = len(_done(themes))
    print(f"\nTotal: {total_done}/{total} themes terminal across all epochs.")
    return 0


# ---------------------------------------------------------------------------
# Self-test
# ---------------------------------------------------------------------------

def _self_test() -> int:
    import tempfile, shutil, os
    failures: list[str] = []

    # Use a temp dir to avoid touching real registry
    tmpdir = Path(tempfile.mkdtemp())
    try:
        # Build minimal fake registry
        fake_registry = tmpdir / "THEMES_REGISTRY.yaml"
        checkpoints = tmpdir / "checkpoints"
        checkpoints.mkdir()
        templates = tmpdir / "templates"
        templates.mkdir()
        shutil.copy(ADVERSARIAL_TMPL, templates / "ADVERSARIAL_REVIEW_TEMPLATE.md")
        shutil.copy(RETRO_TMPL, templates / "RETROSPECTIVE_TEMPLATE.md")

        def write_registry(themes_yaml: str):
            fake_registry.write_text(f"themes:\n{themes_yaml}\ngates: {{}}\n")

        # Monkey-patch globals for isolated test
        orig_registry = globals().get("REGISTRY")
        orig_checkpoints = globals().get("CHECKPOINTS_DIR")
        orig_templates = globals().get("TEMPLATES_DIR")
        orig_adv = globals().get("ADVERSARIAL_TMPL")
        orig_retro = globals().get("RETRO_TMPL")

        import scripts.governance.epoch_closure as _self
        _self.REGISTRY = fake_registry
        _self.CHECKPOINTS_DIR = checkpoints
        _self.TEMPLATES_DIR = templates
        _self.ADVERSARIAL_TMPL = templates / "ADVERSARIAL_REVIEW_TEMPLATE.md"
        _self.RETRO_TMPL = templates / "RETROSPECTIVE_TEMPLATE.md"

        # Test 1: start with pending theme → exit 2
        write_registry(textwrap.dedent("""\
          - id: G01
            class: G
            epoch: 0
            title: test
            source: test
            priority: high
            pfc_required: false
            blocks: []
            blocked_by: []
            status: pending
        """))
        code = _self.cmd_start(0)
        if code != 2:
            failures.append(f"T1 FAIL: expected exit 2 with pending theme, got {code}")
        else:
            print("T1 PASS: start exits 2 when pending theme exists")

        # Test 2: mark all done → start creates templates
        write_registry(textwrap.dedent("""\
          - id: G01
            class: G
            epoch: 0
            title: test
            source: test
            priority: high
            pfc_required: false
            blocks: []
            blocked_by: []
            status: done
            evidence_on_close: "done for test"
        """))
        code = _self.cmd_start(0)
        adv_path = checkpoints / "adversarial_review_epoch_0.md"
        retro_path = checkpoints / "retrospective_epoch_0.md"
        if code != 1:
            failures.append(f"T2 FAIL: expected exit 1 after creating templates, got {code}")
        elif not adv_path.exists() or not retro_path.exists():
            failures.append("T2 FAIL: template files not created")
        else:
            print("T2 PASS: start creates templates when all themes done")

        # Test 3: validate with empty Q1 → exit 2
        # Files exist but Q sections are placeholders
        code = _self.cmd_validate(0)
        if code != 2:
            failures.append(f"T3 FAIL: expected exit 2 with unfilled Q1, got {code}")
        else:
            print("T3 PASS: validate exits 2 with placeholder Q1")

        # Test 4: fill Q1/Q2/Q3 + adversarial §5 → validate exits 0
        # Simulates operator filling: remove FILL_REQUIRED sentinels + add real content
        retro_text = retro_path.read_text()
        retro_text = retro_text.replace(
            "<!-- FILL_REQUIRED: replace this block with real findings before epoch_closure validate -->",
            "1. **Finding**: F-001 — market efficiency increased 2022-2025.\n"
            "   - **Source theme**: G01\n"
            "   - **Affected pending theme(s)**: [M01]\n"
            "   - **How it changes hypothesis**: dislocation assumption incorrect.",
        )
        retro_text = retro_text.replace(
            "<!-- FILL_REQUIRED: replace this block with real gaps before epoch_closure validate -->",
            "1. **Gap**: goalpost_lock not audited against historical goalposts.\n"
            "   - **Why it matters**: threshold drift is a critical failure mode.\n"
            "   - **Concrete test**: run goalpost_lock --audit-history.\n"
            "   - **Blocks any pending theme?**: no",
        )
        retro_text = retro_text.replace(
            "<!-- FILL_REQUIRED: replace this block with real contradiction checks before epoch_closure validate -->",
            "1. **Finding**: F-002 — synthetic timestamps negate temporal lag premise.\n"
            "   - **Contradicts pending theme(s)**: [PR103]\n"
            "   - **Nature of contradiction**: full\n"
            "   - **Decision**: ARCHIVE\n"
            "   - **Rationale**: non-testable with current data.",
        )
        retro_path.write_text(retro_text)

        adv_text = adv_path.read_text()
        adv_text = adv_text.replace(
            "<!-- FILL_REQUIRED: replace numbered questions with real uncomfortable questions before epoch_closure validate -->",
            "1. **Q:** Are timestamps truly distinct between books?\n"
            "   - **Why possibly avoided:** Would invalidate temporal lag hypothesis.\n"
            "   - **Evidence needed:** SQL gap distribution per book pair.",
        )
        adv_path.write_text(adv_text)

        code = _self.cmd_validate(0)
        if code != 0:
            failures.append(f"T4 FAIL: expected exit 0 with filled docs, got {code}")
        else:
            print("T4 PASS: validate exits 0 with filled Q1/Q2/Q3")

        # Restore globals
        _self.REGISTRY = REGISTRY
        _self.CHECKPOINTS_DIR = CHECKPOINTS_DIR
        _self.TEMPLATES_DIR = TEMPLATES_DIR
        _self.ADVERSARIAL_TMPL = ADVERSARIAL_TMPL
        _self.RETRO_TMPL = RETRO_TMPL

    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

    if failures:
        print("\nSELF-TEST FAILURES:")
        for f in failures:
            print(f"  {f}")
        return 2
    print("\nAll self-tests passed.")
    return 0


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Epoch closure orchestrator (G17 + G18).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument("--self-test", action="store_true", help="Run internal tests.")
    sub = p.add_subparsers(dest="command")

    s = sub.add_parser("start", help="Begin epoch closure (validate pending + generate docs).")
    s.add_argument("--epoch", type=int, required=True, help="Epoch number (0-4).")

    v = sub.add_parser("validate", help="Confirm epoch docs are filled; clear gate.")
    v.add_argument("--epoch", type=int, required=True, help="Epoch number (0-4).")

    sub.add_parser("status", help="Print epoch progress table.")
    return p


def main(argv: list[str] | None = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)

    if args.self_test:
        return _self_test()
    if args.command == "start":
        return cmd_start(args.epoch)
    if args.command == "validate":
        return cmd_validate(args.epoch)
    if args.command == "status":
        return cmd_status()

    parser.print_help()
    return 2


if __name__ == "__main__":
    sys.exit(main())
