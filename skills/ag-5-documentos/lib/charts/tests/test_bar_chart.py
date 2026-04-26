"""Smoke tests for BarChart (C01 + C02)."""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

# Add ag-5-documentos/ root to sys.path so `lib.X` imports resolve.
_PKG_ROOT = Path(__file__).resolve().parents[3]
if str(_PKG_ROOT) not in sys.path:
    sys.path.insert(0, str(_PKG_ROOT))

from lib.charts.bar_chart import BarChart  # noqa: E402
from lib.charts.base import ChartFormat, ChartSpec  # noqa: E402


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _is_png(b: bytes) -> bool:
    """PNG starts with 8-byte magic 89 50 4E 47 0D 0A 1A 0A."""
    return b[:8] == b"\x89PNG\r\n\x1a\n"


# ---------------------------------------------------------------------------
# C01 — simple bar
# ---------------------------------------------------------------------------
def test_simple_bar_renders_valid_png_3_categories():
    spec = ChartSpec(
        type="bar",
        action_title="Receita cresceu 49% em 2025 — maior salto historico",
        data=[
            {"label": "2023", "value": 8.2},
            {"label": "2024", "value": 9.1},
            {"label": "2025", "value": 12.2},
        ],
        format=ChartFormat(value_format="R$ {:.1f}M", highlight=["2025"]),
    )
    png = BarChart().render(spec)
    assert _is_png(png), "Output is not valid PNG"
    assert len(png) > 1000, f"PNG too small ({len(png)} bytes)"


def test_simple_bar_with_sort_desc():
    spec = ChartSpec(
        type="bar",
        action_title="Marca A captura 40% do mercado pressionando seguidoras",
        data=[
            {"label": "B", "value": 30},
            {"label": "A", "value": 100},
            {"label": "C", "value": 25},
        ],
        format=ChartFormat(sort="desc"),
    )
    bar = BarChart()
    labels, values = bar._extract_simple(spec.data, sort="desc")
    assert labels == ["A", "B", "C"]
    assert values == [100.0, 30.0, 25.0]


def test_simple_bar_validate_missing_field_returns_error():
    spec = ChartSpec(
        type="bar",
        action_title="Receita cresceu 25% pressionando margem",
        data=[{"label": "A"}, {"label": "B", "value": 50}],
    )
    errors = BarChart().validate(spec)
    assert any("missing required fields" in e for e in errors)


def test_simple_bar_validate_empty_data():
    spec = ChartSpec(type="bar", action_title="x", data=[])
    errors = BarChart().validate(spec)
    assert any("empty" in e for e in errors)


def test_unsupported_type_validates_with_error():
    spec = ChartSpec(type="line", action_title="x", data=[{"label": "A", "value": 1}])
    errors = BarChart().validate(spec)
    assert any("does not support type" in e for e in errors)


# ---------------------------------------------------------------------------
# C02 — grouped bar
# ---------------------------------------------------------------------------
def test_grouped_bar_renders_valid_png_2_groups():
    spec = ChartSpec(
        type="grouped_bar",
        action_title="Receita supera custo em todos os trimestres pressionando expansao",
        data=[
            {"label": "Q1", "group": "Receita", "value": 120},
            {"label": "Q1", "group": "Custo",   "value": 80},
            {"label": "Q2", "group": "Receita", "value": 135},
            {"label": "Q2", "group": "Custo",   "value": 85},
            {"label": "Q3", "group": "Receita", "value": 150},
            {"label": "Q3", "group": "Custo",   "value": 90},
        ],
        format=ChartFormat(y_label="R$ M"),
    )
    png = BarChart().render(spec)
    assert _is_png(png)
    assert len(png) > 1500


def test_grouped_bar_extract_preserves_label_and_group_order():
    data = [
        {"label": "Q1", "group": "A", "value": 10},
        {"label": "Q2", "group": "A", "value": 20},
        {"label": "Q1", "group": "B", "value": 5},
        {"label": "Q2", "group": "B", "value": 8},
    ]
    labels, groups, matrix = BarChart._extract_grouped(data)
    assert labels == ["Q1", "Q2"]
    assert groups == ["A", "B"]
    assert matrix == [[10.0, 20.0], [5.0, 8.0]]


# ---------------------------------------------------------------------------
# Color resolution
# ---------------------------------------------------------------------------
def test_resolve_simple_colors_no_highlight_uses_teal():
    from lib.raiz_tokens import RAIZ_TEAL
    colors = BarChart._resolve_simple_colors(["A", "B"], set())
    assert colors == [RAIZ_TEAL, RAIZ_TEAL]


def test_resolve_simple_colors_with_highlight_uses_orange_and_muted():
    from lib.raiz_tokens import FG_MUTED, RAIZ_ORANGE
    colors = BarChart._resolve_simple_colors(["A", "B", "C"], {"B"})
    assert colors == [FG_MUTED, RAIZ_ORANGE, FG_MUTED]


# ---------------------------------------------------------------------------
# Class metadata
# ---------------------------------------------------------------------------
def test_supported_types_include_bar_and_grouped():
    assert "bar" in BarChart.SUPPORTED_TYPES
    assert "grouped_bar" in BarChart.SUPPORTED_TYPES
