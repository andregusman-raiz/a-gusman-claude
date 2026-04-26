"""Tests para PR 5.3 — YAML configs canonical (visual_style + slide_template + principles)."""
from __future__ import annotations

from pathlib import Path

import yaml

CONFIGS_DIR = Path(__file__).resolve().parents[1] / "configs"


# ---------------------------------------------------------------------------
# 1. visual_style.yaml parseable + estrutura canonical
# ---------------------------------------------------------------------------
def test_visual_style_yaml_loads_and_has_required_keys():
    path = CONFIGS_DIR / "visual_style.yaml"
    assert path.exists(), f"{path} nao existe"

    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    assert data["version"] == 1
    assert "typography" in data
    assert "colors" in data
    assert "spacing" in data
    assert "charts" in data

    # typography
    assert data["typography"]["font_family"] == "Montserrat"
    sizes = data["typography"]["sizes"]
    for key in ("h1", "h2", "h3", "body", "body_sm", "caption"):
        assert key in sizes
        assert isinstance(sizes[key], int)

    # colors palette 70/20/10
    assert data["colors"]["palette"] == "70_20_10"
    assert "primary_accent" in data["colors"]
    assert data["colors"]["primary_accent"].startswith("#")

    # charts palettes
    assert isinstance(data["charts"]["palette_categorical"], list)
    assert len(data["charts"]["palette_categorical"]) >= 3


# ---------------------------------------------------------------------------
# 2. slide_template.yaml parseable + canonical_slides keys
# ---------------------------------------------------------------------------
def test_slide_template_yaml_has_canonical_slides():
    path = CONFIGS_DIR / "slide_template.yaml"
    assert path.exists()

    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    canonical = data["canonical_slides"]

    required_kinds = {"cover", "section_divider", "exec_summary", "scqa", "one_pager", "closing"}
    assert required_kinds.issubset(set(canonical.keys()))

    # Cada slide canonical tem `elements` ou estrutura equivalente
    for kind, spec in canonical.items():
        assert "description" in spec
        # cover/exec_summary/closing tem elements; scqa tem sections
        assert "elements" in spec or "sections" in spec

    # exhibit_types e chart_types listas
    assert isinstance(data["exhibit_types"], list)
    assert len(data["exhibit_types"]) >= 15  # canonical: 19

    assert isinstance(data["chart_types"], list)
    assert len(data["chart_types"]) >= 12  # canonical: 18 (alinhado SPEC chart-CEO)

    # storyline_templates: 6 canonical
    storylines = data["storyline_templates"]
    assert len(storylines) == 6
    storyline_ids = {s["id"] for s in storylines}
    assert "scqa" in storyline_ids
    assert "recommendation_first" in storyline_ids


# ---------------------------------------------------------------------------
# 3. principles.yaml estrutura 22 regras canonical (preservada de PR 1.4)
# ---------------------------------------------------------------------------
def test_principles_yaml_has_22_canonical_rules():
    path = CONFIGS_DIR / "principles.yaml"
    assert path.exists()

    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    sempre = data.get("sempre", [])
    nunca = data.get("nunca", [])

    assert len(sempre) == 12, f"Esperado 12 regras SEMPRE, achei {len(sempre)}"
    assert len(nunca) == 10, f"Esperado 10 regras NUNCA, achei {len(nunca)}"

    # Cada regra tem id, category, rule, validator, severity
    for rule in sempre + nunca:
        assert "id" in rule
        assert "category" in rule
        assert "rule" in rule
        assert "validator" in rule
        assert "severity" in rule
        assert rule["severity"] in ("high", "medium", "low")


# ---------------------------------------------------------------------------
# 4. principles.yaml hierarchy_4_levels adicionado em PR 5.3
# ---------------------------------------------------------------------------
def test_principles_yaml_has_hierarchy_4_levels():
    path = CONFIGS_DIR / "principles.yaml"
    data = yaml.safe_load(path.read_text(encoding="utf-8"))

    hierarchy = data.get("hierarchy_4_levels")
    assert hierarchy is not None, "PR 5.3 deve adicionar hierarchy_4_levels"
    assert isinstance(hierarchy, list)
    assert len(hierarchy) == 4

    names = [h["name"] for h in hierarchy]
    assert names == ["decisao", "storyline", "slide", "design"]

    # Cada nivel tem level, name, description
    for h in hierarchy:
        assert isinstance(h["level"], int)
        assert "name" in h
        assert "description" in h
