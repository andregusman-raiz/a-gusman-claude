"""Smoke tests for ScatterChart (C09)."""
from __future__ import annotations

import sys
from pathlib import Path

_PKG_ROOT = Path(__file__).resolve().parents[3]
if str(_PKG_ROOT) not in sys.path:
    sys.path.insert(0, str(_PKG_ROOT))

from lib.charts.base import ChartFormat, ChartSpec  # noqa: E402
from lib.charts.scatter_chart import ScatterChart  # noqa: E402


def _is_png(b: bytes) -> bool:
    return b[:8] == b"\x89PNG\r\n\x1a\n"


def test_scatter_no_groups_renders_valid_png():
    spec = ChartSpec(
        type="scatter",
        action_title="Receita correlaciona positivamente com NPS pressionando expansao",
        data=[
            {"x": 12, "y": 0.65, "label": "Cliente A"},
            {"x": 18, "y": 0.78, "label": "Cliente B"},
            {"x": 25, "y": 0.85, "label": "Cliente C"},
            {"x": 32, "y": 0.92, "label": "Cliente D"},
            {"x": 40, "y": 0.88, "label": "Cliente E"},
        ],
        format=ChartFormat(x_label="Receita (R$ K)", y_label="NPS",
                           highlight=["Cliente D"]),
    )
    png = ScatterChart().render(spec)
    assert _is_png(png)
    assert len(png) > 1500


def test_scatter_with_groups_uses_categorical_palette():
    spec = ChartSpec(
        type="scatter",
        action_title="Marca A supera Marca B em duas dimensoes pressionando estrategia",
        data=[
            {"x": 10, "y": 0.5, "label": "p1", "group": "Marca A"},
            {"x": 15, "y": 0.6, "label": "p2", "group": "Marca A"},
            {"x": 20, "y": 0.7, "label": "p3", "group": "Marca A"},
            {"x": 8,  "y": 0.4, "label": "p4", "group": "Marca B"},
            {"x": 12, "y": 0.45, "label": "p5", "group": "Marca B"},
        ],
        format=ChartFormat(x_label="Receita", y_label="NPS"),
    )
    png = ScatterChart().render(spec)
    assert _is_png(png)
    assert len(png) > 1500


def test_scatter_collect_groups_returns_empty_when_any_missing_group():
    data = [
        {"x": 1, "y": 1, "group": "A"},
        {"x": 2, "y": 2},  # no group
    ]
    out = ScatterChart._collect_groups(data)
    assert out == {}


def test_scatter_extract_default_pulls_label_and_default_size():
    data = [{"x": 1, "y": 2}, {"x": 3, "y": 4, "label": "P", "size": 100}]
    xs, ys, labels, sizes = ScatterChart._extract_default(data)
    assert xs == [1.0, 3.0]
    assert ys == [2.0, 4.0]
    assert labels == ["", "P"]
    assert sizes == [60.0, 100.0]


def test_scatter_validate_missing_y_field():
    spec = ChartSpec(
        type="scatter",
        action_title="x",
        data=[{"x": 1}],
    )
    errors = ScatterChart().validate(spec)
    assert any("missing required fields" in e for e in errors)


def test_scatter_supports_only_scatter():
    assert ScatterChart.SUPPORTED_TYPES == ["scatter"]
