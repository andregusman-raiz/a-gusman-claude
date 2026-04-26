"""Smoke tests for WaterfallChart (C11)."""
from __future__ import annotations

import sys
from pathlib import Path

_PKG_ROOT = Path(__file__).resolve().parents[3]
if str(_PKG_ROOT) not in sys.path:
    sys.path.insert(0, str(_PKG_ROOT))

from lib.charts.base import ChartFormat, ChartSpec  # noqa: E402
from lib.charts.waterfall_chart import WaterfallChart  # noqa: E402


def _is_png(b: bytes) -> bool:
    return b[:8] == b"\x89PNG\r\n\x1a\n"


def test_waterfall_pl_bridge_renders_valid_png():
    spec = ChartSpec(
        type="waterfall",
        action_title="Receita ajustada cresceu R$ 40M pressionando margem",
        data=[
            {"label": "Receita 2024", "value": 1000, "type": "subtotal"},
            {"label": "Volume",       "value": 120,  "type": "positive"},
            {"label": "Mix",          "value": -30,  "type": "negative"},
            {"label": "Preco",        "value": 80,   "type": "positive"},
            {"label": "Cambio",       "value": -130, "type": "negative"},
            {"label": "Receita 2025", "value": 1040, "type": "total"},
        ],
        format=ChartFormat(value_format="R$ {:.0f}M", y_label="R$ M"),
    )
    png = WaterfallChart().render(spec)
    assert _is_png(png)
    assert len(png) > 2000


def test_waterfall_negative_only_with_total_renders():
    spec = ChartSpec(
        type="waterfall",
        action_title="Custos sobem 15% pressionando lucro liquido",
        data=[
            {"label": "EBITDA", "value": 200, "type": "subtotal"},
            {"label": "Pessoal", "value": -30, "type": "negative"},
            {"label": "Insumos", "value": -40, "type": "negative"},
            {"label": "Resultado", "value": 130, "type": "total"},
        ],
    )
    png = WaterfallChart().render(spec)
    assert _is_png(png)
    assert len(png) > 1500


def test_waterfall_ap05_warns_when_no_total_or_subtotal():
    spec = ChartSpec(
        type="waterfall",
        action_title="x",
        data=[
            {"label": "Volume", "value": 100, "type": "positive"},
            {"label": "Mix",    "value": -20, "type": "negative"},
        ],
    )
    errors = WaterfallChart().validate(spec)
    assert any("AP05" in e for e in errors)


def test_waterfall_normalize_coerces_unknown_type_to_positive():
    data = [{"label": "X", "value": 10, "type": "unknown_kind"}]
    out = WaterfallChart._normalize(data)
    assert out[0]["type"] == "positive"


def test_waterfall_color_mapping_uses_canonical_tokens():
    from lib.charts.waterfall_chart import _TYPE_COLORS
    from lib.raiz_tokens import (
        FG_MUTED, RAIZ_TEAL, SIDEBAR, STATUS_DANGER,
    )
    assert _TYPE_COLORS["positive"] == RAIZ_TEAL
    assert _TYPE_COLORS["negative"] == STATUS_DANGER
    assert _TYPE_COLORS["subtotal"] == FG_MUTED
    assert _TYPE_COLORS["total"]    == SIDEBAR


def test_waterfall_supports_only_waterfall():
    assert WaterfallChart.SUPPORTED_TYPES == ["waterfall"]
