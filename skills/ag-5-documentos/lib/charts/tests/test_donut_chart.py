"""Smoke tests for DonutChart (C08 + C15)."""
from __future__ import annotations

import sys
from pathlib import Path

_PKG_ROOT = Path(__file__).resolve().parents[3]
if str(_PKG_ROOT) not in sys.path:
    sys.path.insert(0, str(_PKG_ROOT))

from lib.charts.base import ChartFormat, ChartSpec  # noqa: E402
from lib.charts.donut_chart import DonutChart  # noqa: E402


def _is_png(b: bytes) -> bool:
    return b[:8] == b"\x89PNG\r\n\x1a\n"


def test_donut_4_slices_renders_valid_png():
    spec = ChartSpec(
        type="donut",
        action_title="Premium representa 45% da receita exigindo expansao da base",
        data=[
            {"label": "Premium",  "value": 45},
            {"label": "Standard", "value": 30},
            {"label": "Basic",    "value": 15},
            {"label": "Free",     "value": 10},
        ],
        format=ChartFormat(value_format="{:.0f}%", annotation="100%"),
    )
    png = DonutChart().render(spec)
    assert _is_png(png)
    assert len(png) > 2000


def test_pie_3_slices_renders_valid_png():
    spec = ChartSpec(
        type="pie",
        action_title="Marca lider concentra 60% do share pressionando seguidoras",
        data=[
            {"label": "Lider",     "value": 60},
            {"label": "Seguidor",  "value": 25},
            {"label": "Outras",    "value": 15},
        ],
    )
    png = DonutChart().render(spec)
    assert _is_png(png)
    assert len(png) > 2000


def test_donut_with_highlight_uses_orange_for_highlighted():
    from lib.raiz_tokens import RAIZ_ORANGE
    palette = ["#111111", "#222222", "#333333"]
    colors = DonutChart._resolve_colors(["A", "B", "C"], palette, {"B"})
    assert colors[1] == RAIZ_ORANGE


def test_donut_clamps_negative_values_to_zero():
    labels, values = DonutChart._extract([
        {"label": "A", "value": 10},
        {"label": "B", "value": -5},  # invalid for pie/donut, gets clamped
    ])
    assert labels == ["A", "B"]
    assert values == [10.0, 0.0]


def test_donut_validate_missing_value_field():
    spec = ChartSpec(
        type="donut",
        action_title="x",
        data=[{"label": "A"}, {"label": "B", "value": 10}],
    )
    errors = DonutChart().validate(spec)
    assert any("missing required fields" in e for e in errors)


def test_donut_format_value_uses_value_format():
    out = DonutChart._format_value(120.5, "R$ {:.1f}M")
    assert out == "R$ 120.5M"


def test_donut_supports_donut_and_pie():
    assert "donut" in DonutChart.SUPPORTED_TYPES
    assert "pie" in DonutChart.SUPPORTED_TYPES
