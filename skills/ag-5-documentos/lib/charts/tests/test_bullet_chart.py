"""Smoke tests for BulletChart (C12)."""
from __future__ import annotations

import sys
from pathlib import Path

_PKG_ROOT = Path(__file__).resolve().parents[3]
if str(_PKG_ROOT) not in sys.path:
    sys.path.insert(0, str(_PKG_ROOT))

from lib.charts.base import ChartFormat, ChartSpec  # noqa: E402
from lib.charts.bullet_chart import BulletChart  # noqa: E402


def _is_png(b: bytes) -> bool:
    return b[:8] == b"\x89PNG\r\n\x1a\n"


def test_bullet_with_3_kpis_renders_valid_png():
    spec = ChartSpec(
        type="bullet",
        action_title="Q1 atinge 95% das metas pressionando proximas entregas",
        data=[
            {"metric": "Receita", "actual": 92, "target": 100, "benchmark": 80,
             "scale_max": 120},
            {"metric": "NPS",     "actual": 78, "target": 75, "benchmark": 65,
             "scale_max": 100},
            {"metric": "Churn",   "actual": 5,  "target": 4,  "benchmark": 8,
             "scale_max": 15, "lower_is_better": True},
        ],
        format=ChartFormat(value_format="{:.0f}"),
    )
    png = BulletChart().render(spec)
    assert _is_png(png)
    assert len(png) > 1500


def test_bullet_validate_missing_target_field():
    spec = ChartSpec(
        type="bullet",
        action_title="x",
        data=[{"metric": "X", "actual": 10}],
    )
    errors = BulletChart().validate(spec)
    assert any("missing required fields" in e for e in errors)


def test_bullet_normalize_auto_computes_scale_max_from_benchmark():
    data = [{"metric": "X", "actual": 10, "target": 12, "benchmark": 20}]
    out = BulletChart._normalize(data)
    # 1.25 * max(actual=10, target=12, benchmark=20) = 25
    assert out[0]["scale_max"] == 25.0


def test_bullet_normalize_auto_computes_scale_max_no_benchmark():
    data = [{"metric": "X", "actual": 10, "target": 12}]
    out = BulletChart._normalize(data)
    # 1.25 * max(10, 12) = 15
    assert out[0]["scale_max"] == 15.0


def test_bullet_format_value_handles_invalid_format():
    out = BulletChart._format_value(3.14, "INVALID {:.x}")
    assert "3.14" in out or "3" in out


def test_bullet_supports_only_bullet():
    assert BulletChart.SUPPORTED_TYPES == ["bullet"]
