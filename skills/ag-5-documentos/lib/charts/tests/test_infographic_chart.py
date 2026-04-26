"""Smoke tests for InfographicChart (C13)."""
from __future__ import annotations

import sys
from pathlib import Path

_PKG_ROOT = Path(__file__).resolve().parents[3]
if str(_PKG_ROOT) not in sys.path:
    sys.path.insert(0, str(_PKG_ROOT))

from lib.charts.base import ChartFormat, ChartSpec  # noqa: E402
from lib.charts.infographic_chart import InfographicChart  # noqa: E402


def _is_png(b: bytes) -> bool:
    return b[:8] == b"\x89PNG\r\n\x1a\n"


def test_infographic_4_kpis_renders_in_2x2_grid():
    spec = ChartSpec(
        type="infographic",
        action_title="Quatro KPIs principais consolidados pressionando metas Q2",
        data=[
            {"label": "Receita",     "value": "R$ 12M",  "icon": "$"},
            {"label": "Crescimento", "value": "+34%",    "icon": "↑"},
            {"label": "Clientes",    "value": "1,200",   "icon": "◆"},
            {"label": "Churn",       "value": "4.2%",    "icon": "↓"},
        ],
        format=ChartFormat(highlight=["Crescimento"]),
    )
    png = InfographicChart().render(spec)
    assert _is_png(png)
    assert len(png) > 2000


def test_infographic_grid_shape_logic():
    assert InfographicChart._grid_shape(0) == (1, 1)
    assert InfographicChart._grid_shape(1) == (1, 1)
    assert InfographicChart._grid_shape(2) == (1, 2)
    assert InfographicChart._grid_shape(3) == (2, 2)
    assert InfographicChart._grid_shape(4) == (2, 2)
    assert InfographicChart._grid_shape(5) == (2, 3)
    assert InfographicChart._grid_shape(6) == (2, 3)
    assert InfographicChart._grid_shape(7) == (2, 4)
    assert InfographicChart._grid_shape(8) == (2, 4)


def test_infographic_caps_at_max_kpis():
    items = [{"label": f"KPI{i}", "value": str(i)} for i in range(12)]
    spec = ChartSpec(type="infographic", action_title="x", data=items)
    png = InfographicChart().render(spec)
    assert _is_png(png)
    # Render with 8 cards (capped from 12); 12 would have overflowed grid
    assert InfographicChart.MAX_KPIS == 8


def test_infographic_validate_missing_value_field():
    spec = ChartSpec(
        type="infographic",
        action_title="x",
        data=[{"label": "A"}, {"label": "B", "value": "ok"}],
    )
    errors = InfographicChart().validate(spec)
    assert any("missing required fields" in e for e in errors)


def test_infographic_supports_only_infographic():
    assert InfographicChart.SUPPORTED_TYPES == ["infographic"]
