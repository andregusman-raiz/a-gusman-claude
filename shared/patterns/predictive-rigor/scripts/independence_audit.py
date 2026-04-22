"""Independence Audit — data lineage checker (Rule L2-M11).

Reads a component spec (YAML) describing layers and their feature sources.
Detects overlap in source tables/columns between layers claimed independent.
Outputs a Markdown report with overlap matrix + PASS/FAIL verdict.

Schema for component spec (layers.yaml):
    component: DecisionPipeline
    layers:
      - name: C1
        role: target_c_trigger
        sources:
          - table: stg.odds
            column: odds
            filter: "bookmaker='pinnacle' AND is_closing=TRUE"
        consumes_output_of: []   # optional
      - name: C2
        role: outcome_probs
        sources:
          - table: stg.odds
            column: odds
            filter: "bookmaker='pinnacle' AND is_closing=TRUE"
        consumes_output_of: []
      - name: C3
        role: sizing
        sources: []
        consumes_output_of: [C2]   # uses C2 output only (expected)

Usage:
    python scripts/governance/independence_audit.py --spec path/to/layers.yaml
    python scripts/governance/independence_audit.py --self-test

Exit 0 if PASS, 2 if FAIL.
"""

from __future__ import annotations

import argparse
import re
import sys
from itertools import combinations
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.stderr.write("PyYAML required: pip install pyyaml\n")
    sys.exit(2)


# ---------------------------------------------------------------------------
# Source identity
# ---------------------------------------------------------------------------

def _normalise_filter(f: str | None) -> str:
    """Lower-case, strip extra whitespace, canonical form for comparison."""
    if not f:
        return ""
    return re.sub(r"\s+", " ", f.strip().lower())


def _source_key(src: dict) -> str:
    """Unique identity for a source entry: table.column[filter]."""
    table = (src.get("table") or "").strip()
    column = (src.get("column") or "").strip()
    filt = _normalise_filter(src.get("filter"))
    if filt:
        return f"{table}.{column}[{filt}]"
    return f"{table}.{column}"


def _source_keys(layer: dict) -> set[str]:
    return {_source_key(s) for s in (layer.get("sources") or [])}


# ---------------------------------------------------------------------------
# Overlap computation
# ---------------------------------------------------------------------------

def _compute_pairs(layers: list[dict]) -> list[dict]:
    """
    For every pair (A, B) not linked by consumes_output_of,
    compute shared source keys and overlap pct.

    consumes_output_of means B explicitly uses A's OUTPUT (expected dependency),
    so that pair is exempt from the strict independence check.
    """
    # Build a map name -> layer
    by_name = {L["name"]: L for L in layers}

    # Build expected-dependency pairs (output consumption)
    output_pairs: set[frozenset] = set()
    for L in layers:
        for dep in (L.get("consumes_output_of") or []):
            output_pairs.add(frozenset({L["name"], dep}))

    results = []
    for la, lb in combinations(layers, 2):
        na, nb = la["name"], lb["name"]
        pair_key = frozenset({na, nb})
        is_output_dep = pair_key in output_pairs

        keys_a = _source_keys(la)
        keys_b = _source_keys(lb)
        shared = keys_a & keys_b

        if is_output_dep:
            # Expected: B consumes A's output — skip strict check, mark as OK
            results.append({
                "a": na, "b": nb,
                "shared": shared,
                "overlap_pct_a": None,
                "overlap_pct_b": None,
                "is_output_dep": True,
                "fail": False,
            })
            continue

        overlap_b = len(shared) / max(len(keys_b), 1) * 100 if keys_b else 0.0
        overlap_a = len(shared) / max(len(keys_a), 1) * 100 if keys_a else 0.0
        results.append({
            "a": na, "b": nb,
            "shared": shared,
            "overlap_pct_a": overlap_a,
            "overlap_pct_b": overlap_b,
            "is_output_dep": False,
            "fail": bool(shared),
        })
    return results


# ---------------------------------------------------------------------------
# Report rendering
# ---------------------------------------------------------------------------

def _render_report(spec: dict, pairs: list[dict]) -> str:
    component = spec.get("component", "unknown")
    layers = spec.get("layers", [])

    lines = [
        f"# Independence Audit — {component}",
        "",
        "## Layer inventory",
        "",
    ]
    for L in layers:
        srcs = L.get("sources") or []
        deps = L.get("consumes_output_of") or []
        lines.append(f"### {L['name']} ({L.get('role', '—')})")
        if srcs:
            lines.append("| Source key |")
            lines.append("|------------|")
            for s in srcs:
                lines.append(f"| `{_source_key(s)}` |")
        else:
            lines.append("_No direct sources (consumes layer output only)._")
        if deps:
            lines.append(f"\nConsumes output of: {', '.join(deps)}")
        lines.append("")

    lines += [
        "## Overlap matrix",
        "",
        "| Layer A | Layer B | Shared sources | Overlap % (of B) | Claim valid? |",
        "|---------|---------|----------------|------------------|--------------|",
    ]

    for p in pairs:
        if p["is_output_dep"]:
            shared_str = "— (output dependency)"
            pct_str = "—"
            verdict = "OK (expected)"
        elif not p["shared"]:
            shared_str = "—"
            pct_str = "0%"
            verdict = "YES (independent)"
        else:
            shared_str = "; ".join(f"`{s}`" for s in sorted(p["shared"]))
            pct_b = p["overlap_pct_b"]
            pct_str = f"{pct_b:.0f}% of {p['b']}"
            verdict = f"**NO** (dual-validation theater — {pct_b:.0f}% overlap)"

        lines.append(
            f"| {p['a']} | {p['b']} | {shared_str} | {pct_str} | {verdict} |"
        )

    any_fail = any(p["fail"] for p in pairs)
    failing_pairs = [p for p in pairs if p["fail"]]

    verdict_str = "FAIL" if any_fail else "PASS"
    lines += [
        "",
        "## Verdict",
        "",
        f"**{verdict_str}**",
        "",
    ]
    if any_fail:
        lines.append("Failing pairs:")
        for p in failing_pairs:
            pct = p["overlap_pct_b"]
            lines.append(
                f"- `{p['a']}` / `{p['b']}`: "
                f"{len(p['shared'])} shared source(s), "
                f"{pct:.0f}% overlap in {p['b']}"
            )
        lines += [
            "",
            "Architecture cannot claim independence for the pairs above.",
            "Either remove the dual-validation claim, redesign layers with",
            "disjoint sources, or document explicit justification.",
        ]
    else:
        lines.append("All audited pairs are source-disjoint. Independence holds.")

    return "\n".join(lines) + "\n"


# ---------------------------------------------------------------------------
# Errors / warnings collector (mirrors registry_check.py style)
# ---------------------------------------------------------------------------

def _validate_spec(spec: dict, errors: list, warnings: list) -> None:
    if "component" not in spec:
        warnings.append("spec missing 'component' field")
    layers = spec.get("layers")
    if not layers or not isinstance(layers, list):
        errors.append("spec missing or empty 'layers' list")
        return
    names_seen: set[str] = set()
    for i, L in enumerate(layers):
        if not isinstance(L, dict):
            errors.append(f"layer #{i} is not a dict")
            continue
        name = L.get("name")
        if not name:
            errors.append(f"layer #{i} missing 'name'")
        elif name in names_seen:
            errors.append(f"duplicate layer name: {name}")
        else:
            names_seen.add(name)
        if "role" not in L:
            warnings.append(f"layer '{name}' missing 'role' (cosmetic)")
        sources = L.get("sources")
        if sources is None:
            errors.append(f"layer '{name}' missing 'sources' key (use [] if none)")
        elif not isinstance(sources, list):
            errors.append(f"layer '{name}' sources must be a list")
        else:
            for j, src in enumerate(sources):
                if "table" not in src:
                    errors.append(f"layer '{name}' source #{j} missing 'table'")
                if "column" not in src:
                    errors.append(f"layer '{name}' source #{j} missing 'column'")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def run_audit(spec: dict) -> tuple[str, bool]:
    """Return (report_markdown, passed)."""
    errors: list = []
    warnings: list = []
    _validate_spec(spec, errors, warnings)

    if errors:
        report = "# Independence Audit — ABORTED\n\nSpec validation errors:\n"
        for e in errors:
            report += f"- {e}\n"
        return report, False

    layers = spec.get("layers", [])
    pairs = _compute_pairs(layers)
    report = _render_report(spec, pairs)
    passed = not any(p["fail"] for p in pairs)
    return report, passed


def _self_test() -> None:
    """Self-test using DGM-v4 real structure (C1 and C2 both use pinnacle close)."""
    spec = {
        "component": "DecisionPipeline-DGM-v4",
        "layers": [
            {
                "name": "C1",
                "role": "target_c_trigger",
                "sources": [
                    {
                        "table": "stg.odds",
                        "column": "odds",
                        "filter": "bookmaker='pinnacle' AND is_closing=TRUE",
                    },
                    {
                        "table": "mart.features_pre_match",
                        "column": "implied_prob_home",
                        "filter": None,
                    },
                ],
            },
            {
                "name": "C2",
                "role": "outcome_probs",
                "sources": [
                    {
                        "table": "stg.odds",
                        "column": "odds",
                        "filter": "bookmaker='pinnacle' AND is_closing=TRUE",
                    }
                ],
            },
            {
                "name": "C3",
                "role": "sizing",
                "sources": [],
                "consumes_output_of": ["C2"],
            },
        ],
    }

    report, passed = run_audit(spec)
    print(report)
    expected_fail = not passed
    assert expected_fail, "Self-test expected FAIL (C1-C2 share pinnacle close) but got PASS"
    print("Self-test PASSED (correctly detected C1-C2 overlap, verdict=FAIL).")
    sys.exit(2)  # FAIL exit as per spec


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Independence audit — data lineage checker (L2-M11)"
    )
    parser.add_argument("--spec", metavar="YAML", help="Path to component spec YAML")
    parser.add_argument(
        "--self-test", action="store_true", help="Run built-in DGM-v4 self-test"
    )
    parser.add_argument("--output", metavar="FILE", help="Write report to file")
    args = parser.parse_args()

    if args.self_test:
        _self_test()
        return  # unreachable

    if not args.spec:
        parser.print_help()
        sys.exit(1)

    spec_path = Path(args.spec)
    if not spec_path.exists():
        print(f"FATAL: spec file not found: {spec_path}", file=sys.stderr)
        sys.exit(2)

    with open(spec_path) as f:
        spec = yaml.safe_load(f)

    report, passed = run_audit(spec)

    if args.output:
        Path(args.output).write_text(report)
        print(f"Report written to {args.output}")
    else:
        print(report)

    sys.exit(0 if passed else 2)


if __name__ == "__main__":
    main()
