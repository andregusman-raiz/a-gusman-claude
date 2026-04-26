"""Smoke tests for TreemapChart (C16)."""
from __future__ import annotations

import sys
from pathlib import Path

_PKG_ROOT = Path(__file__).resolve().parents[3]
if str(_PKG_ROOT) not in sys.path:
    sys.path.insert(0, str(_PKG_ROOT))

from lib.charts.base import ChartFormat, ChartSpec  # noqa: E402
from lib.charts.treemap_chart import TreemapChart  # noqa: E402


def _is_png(b: bytes) -> bool:
    return b[:8] == b"\x89PNG\r\n\x1a\n"


def test_treemap_4_segments_renders_valid_png():
    spec = ChartSpec(
        type="treemap",
        action_title="Premium concentra 47% da receita pressionando outros segmentos",
        data=[
            {"label": "Premium",  "value": 450},
            {"label": "Standard", "value": 320},
            {"label": "Basic",    "value": 130},
            {"label": "Free",     "value": 50},
        ],
        format=ChartFormat(value_format="R$ {:.0f}M",
                           highlight=["Premium"]),
    )
    png = TreemapChart().render(spec)
    assert _is_png(png)
    assert len(png) > 1500


def test_treemap_compute_rects_returns_areas_proportional_to_values():
    values = [50.0, 25.0, 25.0]
    rects = TreemapChart._compute_rects(values)
    # Each rect is (x, y, w, h). Area = w * h.
    areas = [w * h for (_, _, w, h) in rects]
    total = sum(areas)
    # Areas must be proportional to values within total area=1.0
    assert abs(total - 1.0) < 0.01
    assert areas[0] > areas[1]  # 50 > 25
    assert abs(areas[1] - areas[2]) < 0.01  # both 25


def test_treemap_sort_desc_orders_data_by_value():
    data = [
        {"label": "A", "value": 10},
        {"label": "B", "value": 50},
        {"label": "C", "value": 30},
    ]
    out = TreemapChart._sort_desc(data)
    assert [d["label"] for d in out] == ["B", "C", "A"]


def test_treemap_validate_missing_value_field():
    spec = ChartSpec(
        type="treemap",
        action_title="x",
        data=[{"label": "A"}],
    )
    errors = TreemapChart().validate(spec)
    assert any("missing required fields" in e for e in errors)


def test_treemap_supports_only_treemap():
    assert TreemapChart.SUPPORTED_TYPES == ["treemap"]


def test_treemap_format_value_handles_invalid_format():
    out = TreemapChart._format_value(123.456, "BAD {:.q}")
    assert "123" in out
