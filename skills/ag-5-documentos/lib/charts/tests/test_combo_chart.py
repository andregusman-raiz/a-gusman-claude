"""Smoke tests for ComboChart (C07)."""
from __future__ import annotations

import sys
from pathlib import Path

_PKG_ROOT = Path(__file__).resolve().parents[3]
if str(_PKG_ROOT) not in sys.path:
    sys.path.insert(0, str(_PKG_ROOT))

from lib.charts.base import ChartFormat, ChartSpec  # noqa: E402
from lib.charts.combo_chart import ComboChart  # noqa: E402


def _is_png(b: bytes) -> bool:
    return b[:8] == b"\x89PNG\r\n\x1a\n"


def test_combo_renders_valid_png_with_dual_axis():
    spec = ChartSpec(
        type="combo",
        action_title="Receita cresce 30% mas margem cai 2pp pressionando lucro",
        data=[
            {"label": "Q1", "bar_val": 100, "line_val": 12.5},
            {"label": "Q2", "bar_val": 120, "line_val": 14.0},
            {"label": "Q3", "bar_val": 135, "line_val": 13.0},
            {"label": "Q4", "bar_val": 150, "line_val": 11.5},
        ],
        format=ChartFormat(y_label="Receita (R$ M)", y2_label="Margem (%)"),
    )
    png = ComboChart().render(spec)
    assert _is_png(png)
    assert len(png) > 2000


def test_combo_ap04_warns_when_y2_label_missing():
    spec = ChartSpec(
        type="combo",
        action_title="x",
        data=[{"label": "Q1", "bar_val": 100, "line_val": 5}],
        format=ChartFormat(y_label="R$"),  # y2_label missing
    )
    errors = ComboChart().validate(spec)
    assert any("AP04" in e for e in errors)


def test_combo_ap04_warns_when_y_label_missing():
    spec = ChartSpec(
        type="combo",
        action_title="x",
        data=[{"label": "Q1", "bar_val": 100, "line_val": 5}],
        format=ChartFormat(y2_label="%"),  # y_label missing
    )
    errors = ComboChart().validate(spec)
    assert any("AP04" in e for e in errors)


def test_combo_validate_missing_bar_or_line_value():
    spec = ChartSpec(
        type="combo",
        action_title="x",
        data=[{"label": "Q1"}],  # both missing
        format=ChartFormat(y_label="R$", y2_label="%"),
    )
    errors = ComboChart().validate(spec)
    assert any("missing bar_val or line_val" in e for e in errors)


def test_combo_extract_returns_three_aligned_lists():
    data = [
        {"label": "A", "bar_val": 1, "line_val": 10},
        {"label": "B", "bar_val": 2, "line_val": 20},
    ]
    labels, bars, lines = ComboChart._extract(data)
    assert labels == ["A", "B"]
    assert bars == [1.0, 2.0]
    assert lines == [10.0, 20.0]


def test_combo_supports_only_combo():
    assert ComboChart.SUPPORTED_TYPES == ["combo"]
