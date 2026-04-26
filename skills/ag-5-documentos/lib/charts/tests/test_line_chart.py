"""Smoke tests for LineChart (C05 + C06)."""
from __future__ import annotations

import sys
from pathlib import Path

_PKG_ROOT = Path(__file__).resolve().parents[3]
if str(_PKG_ROOT) not in sys.path:
    sys.path.insert(0, str(_PKG_ROOT))

from lib.charts.base import ChartFormat, ChartSpec  # noqa: E402
from lib.charts.line_chart import LineChart  # noqa: E402


def _is_png(b: bytes) -> bool:
    return b[:8] == b"\x89PNG\r\n\x1a\n"


# ---------------------------------------------------------------------------
# C05 — line (single & multi-series)
# ---------------------------------------------------------------------------
def test_line_single_series_renders_valid_png():
    spec = ChartSpec(
        type="line",
        action_title="Receita cresceu 50% em 12 meses pressionando capacidade",
        data=[
            {"date": "2024-01", "value": 100},
            {"date": "2024-04", "value": 120},
            {"date": "2024-07", "value": 135},
            {"date": "2024-10", "value": 150},
        ],
        format=ChartFormat(y_label="R$ M"),
    )
    png = LineChart().render(spec)
    assert _is_png(png)
    assert len(png) > 1500


def test_line_two_series_renders_with_legend():
    spec = ChartSpec(
        type="line",
        action_title="Marca A supera marca B em 30% no periodo",
        data=[
            {"date": "2024-01", "value": 100, "series": "Marca A"},
            {"date": "2024-04", "value": 120, "series": "Marca A"},
            {"date": "2024-07", "value": 135, "series": "Marca A"},
            {"date": "2024-01", "value": 80,  "series": "Marca B"},
            {"date": "2024-04", "value": 90,  "series": "Marca B"},
            {"date": "2024-07", "value": 100, "series": "Marca B"},
        ],
    )
    png = LineChart().render(spec)
    assert _is_png(png)
    assert len(png) > 2000


def test_line_extract_unique_x_in_order():
    data = [
        {"date": "2024-01", "value": 1},
        {"date": "2024-02", "value": 2, "series": "B"},
        {"date": "2024-01", "value": 3, "series": "B"},
        {"date": "2024-03", "value": 4},
    ]
    xs = LineChart._unique_x_in_order(data)
    assert xs == ["2024-01", "2024-02", "2024-03"]


def test_line_align_to_axis_handles_gaps():
    series = [("a", 1.0), ("c", 3.0)]
    xs, ys = LineChart._align_to_axis(series, ["a", "b", "c"])
    assert xs == ["a", "b", "c"]
    assert ys[0] == 1.0
    assert ys[1] != ys[1]  # NaN check (NaN != NaN)
    assert ys[2] == 3.0


# ---------------------------------------------------------------------------
# C06 — area
# ---------------------------------------------------------------------------
def test_area_renders_valid_png():
    spec = ChartSpec(
        type="area",
        action_title="Volume acumulado dobrou em 8 meses pressionando logistica",
        data=[
            {"date": "M1", "value": 50},
            {"date": "M2", "value": 80},
            {"date": "M3", "value": 110},
            {"date": "M4", "value": 130},
            {"date": "M5", "value": 145},
        ],
    )
    png = LineChart().render(spec)
    assert _is_png(png)
    assert len(png) > 1000


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------
def test_line_validate_missing_required_field():
    spec = ChartSpec(
        type="line",
        action_title="x",
        data=[{"date": "2024-01"}, {"date": "2024-02", "value": 5}],
    )
    errors = LineChart().validate(spec)
    assert any("missing required fields" in e for e in errors)


def test_line_supports_line_and_area():
    assert "line" in LineChart.SUPPORTED_TYPES
    assert "area" in LineChart.SUPPORTED_TYPES
