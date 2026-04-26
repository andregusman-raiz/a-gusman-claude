"""Smoke tests for DriverTreeChart (C17)."""
from __future__ import annotations

import sys
from pathlib import Path

_PKG_ROOT = Path(__file__).resolve().parents[3]
if str(_PKG_ROOT) not in sys.path:
    sys.path.insert(0, str(_PKG_ROOT))

from lib.charts.base import ChartFormat, ChartSpec  # noqa: E402
from lib.charts.driver_tree_chart import DriverTreeChart  # noqa: E402


def _is_png(b: bytes) -> bool:
    return b[:8] == b"\x89PNG\r\n\x1a\n"


def _roi_tree() -> dict:
    """ROI = Receita x Margem - Custo."""
    return {
        "id": "roi",
        "label": "ROI",
        "value": "12%",
        "children": [
            {
                "id": "revenue",
                "label": "Receita",
                "value": "R$ 100M",
                "children": [
                    {"id": "volume", "label": "Volume",  "value": "10K", "children": []},
                    {"id": "preco",  "label": "Preco",   "value": "R$ 10K", "children": []},
                ],
            },
            {
                "id": "margin",
                "label": "Margem",
                "value": "25%",
                "children": [
                    {"id": "cost", "label": "Custo", "value": "R$ 75M", "children": []},
                ],
            },
        ],
    }


def test_driver_tree_3_levels_renders_valid_png():
    spec = ChartSpec(
        type="driver_tree",
        action_title="ROI cresceu 4pp impulsionado por volume pressionando preco",
        data=[_roi_tree()],
        format=ChartFormat(highlight=["Receita"]),
    )
    png = DriverTreeChart().render(spec)
    assert _is_png(png)
    assert len(png) > 1500


def test_driver_tree_compute_layout_assigns_positions():
    chart = DriverTreeChart()
    positions = chart._compute_layout(_roi_tree())
    # 1 root + 2 children + 3 grandchildren = 6 nodes
    assert len(positions) == 6
    # Root must be at depth 0 (left side)
    root_pos = positions["roi"]
    leaf_pos = positions["volume"]
    assert root_pos[0] < leaf_pos[0], "Root should be left of leaf"


def test_driver_tree_node_id_falls_back_to_label_when_id_missing():
    node = {"label": "Receita", "value": "R$ 100M"}
    assert DriverTreeChart._node_id(node) == "Receita"


def test_driver_tree_normalize_roots_filters_invalid():
    out = DriverTreeChart._normalize_roots([
        {"label": "ok", "value": 1},
        {"value": 2},  # no label
        "string-not-dict",
    ])
    assert len(out) == 1
    assert out[0]["label"] == "ok"


def test_driver_tree_supports_only_driver_tree():
    assert DriverTreeChart.SUPPORTED_TYPES == ["driver_tree"]


def test_driver_tree_render_raises_when_no_roots():
    spec = ChartSpec(
        type="driver_tree",
        action_title="Receita cresce 25% pressionando margem",
        data=[],
    )
    # Subclass validate catches empty data first; to test render-level guard
    # we bypass validation by calling render directly with an invalid spec.
    spec_bad = ChartSpec(
        type="driver_tree",
        action_title="x",
        data=["not-a-dict"],  # type: ignore
    )
    import pytest
    with pytest.raises(ValueError):
        DriverTreeChart().render(spec_bad)
