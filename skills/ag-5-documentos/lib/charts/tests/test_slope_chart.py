"""Smoke tests for SlopeChart (C18)."""
from __future__ import annotations

import sys
from pathlib import Path

_PKG_ROOT = Path(__file__).resolve().parents[3]
if str(_PKG_ROOT) not in sys.path:
    sys.path.insert(0, str(_PKG_ROOT))

from lib.charts.base import ChartFormat, ChartSpec  # noqa: E402
from lib.charts.slope_chart import SlopeChart  # noqa: E402


def _is_png(b: bytes) -> bool:
    return b[:8] == b"\x89PNG\r\n\x1a\n"


def test_slope_5_brands_renders_valid_png():
    spec = ChartSpec(
        type="slope",
        action_title="Marca A salta da posicao 5 para 1 pressionando lider anterior",
        data=[
            {"label": "Marca A", "start": 5, "end": 1},
            {"label": "Marca B", "start": 1, "end": 3},
            {"label": "Marca C", "start": 3, "end": 2},
            {"label": "Marca D", "start": 4, "end": 4},
            {"label": "Marca E", "start": 2, "end": 5},
        ],
        format=ChartFormat(x_label="2023 -> 2025",
                           highlight=["Marca A"]),
    )
    png = SlopeChart().render(spec)
    assert _is_png(png)
    assert len(png) > 1500


def test_slope_period_labels_split_arrow():
    assert SlopeChart._period_labels("2023 -> 2025") == ("2023", "2025")
    assert SlopeChart._period_labels("Q1 → Q4") == ("Q1", "Q4")


def test_slope_period_labels_default_when_x_label_missing():
    assert SlopeChart._period_labels(None) == ("Inicio", "Fim")
    assert SlopeChart._period_labels("Periodo") == ("Inicio", "Fim")


def test_slope_validate_missing_end_field():
    spec = ChartSpec(
        type="slope",
        action_title="x",
        data=[{"label": "A", "start": 1}],
    )
    errors = SlopeChart().validate(spec)
    assert any("missing required fields" in e for e in errors)


def test_slope_supports_only_slope():
    assert SlopeChart.SUPPORTED_TYPES == ["slope"]
