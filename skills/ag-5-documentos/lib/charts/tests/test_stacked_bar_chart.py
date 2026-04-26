"""Smoke tests for StackedBarChart (C03 + C04)."""
from __future__ import annotations

import sys
from pathlib import Path

_PKG_ROOT = Path(__file__).resolve().parents[3]
if str(_PKG_ROOT) not in sys.path:
    sys.path.insert(0, str(_PKG_ROOT))

from lib.charts.base import ChartFormat, ChartSpec  # noqa: E402
from lib.charts.stacked_bar_chart import StackedBarChart  # noqa: E402


def _is_png(b: bytes) -> bool:
    return b[:8] == b"\x89PNG\r\n\x1a\n"


def test_stacked_bar_absolute_renders_valid_png():
    spec = ChartSpec(
        type="stacked_bar",
        action_title="Receita Premium dobrou em 2 anos pressionando Standard",
        data=[
            {"label": "2023", "stack": "Premium",  "value": 30},
            {"label": "2023", "stack": "Standard", "value": 40},
            {"label": "2023", "stack": "Basic",    "value": 30},
            {"label": "2024", "stack": "Premium",  "value": 45},
            {"label": "2024", "stack": "Standard", "value": 35},
            {"label": "2024", "stack": "Basic",    "value": 25},
            {"label": "2025", "stack": "Premium",  "value": 60},
            {"label": "2025", "stack": "Standard", "value": 30},
            {"label": "2025", "stack": "Basic",    "value": 20},
        ],
        format=ChartFormat(y_label="R$ M", highlight=["Premium"]),
    )
    png = StackedBarChart().render(spec)
    assert _is_png(png)
    assert len(png) > 2000


def test_stacked100_bar_normalizes_to_100():
    spec = ChartSpec(
        type="stacked100_bar",
        action_title="Mix de receita migra para Premium em 3 anos",
        data=[
            {"label": "2023", "stack": "Premium",  "value": 30},
            {"label": "2023", "stack": "Standard", "value": 70},
            {"label": "2024", "stack": "Premium",  "value": 50},
            {"label": "2024", "stack": "Standard", "value": 50},
        ],
    )
    png = StackedBarChart().render(spec)
    assert _is_png(png)


def test_normalize_to_100_each_column_sums_to_100():
    matrix = [[30.0, 50.0], [70.0, 50.0]]
    out = StackedBarChart._normalize_to_100(matrix)
    # column 0
    assert abs(out[0][0] + out[1][0] - 100.0) < 1e-9
    # column 1
    assert abs(out[0][1] + out[1][1] - 100.0) < 1e-9
    # values
    assert abs(out[0][0] - 30.0) < 1e-9
    assert abs(out[1][0] - 70.0) < 1e-9


def test_extract_with_sort_desc_orders_labels_by_total():
    data = [
        {"label": "B", "stack": "X", "value": 10},
        {"label": "B", "stack": "Y", "value": 20},
        {"label": "A", "stack": "X", "value": 5},
        {"label": "A", "stack": "Y", "value": 15},
        {"label": "C", "stack": "X", "value": 50},
        {"label": "C", "stack": "Y", "value": 50},
    ]
    labels, _, _ = StackedBarChart._extract(data, sort="desc")
    # Totals: A=20, B=30, C=100. desc -> C, B, A
    assert labels == ["C", "B", "A"]


def test_stacked_validate_missing_stack_field():
    spec = ChartSpec(
        type="stacked_bar",
        action_title="x",
        data=[{"label": "Q1", "value": 10}],  # missing 'stack'
    )
    errors = StackedBarChart().validate(spec)
    assert any("missing required fields" in e for e in errors)


def test_stacked_supports_both_types():
    assert "stacked_bar" in StackedBarChart.SUPPORTED_TYPES
    assert "stacked100_bar" in StackedBarChart.SUPPORTED_TYPES
