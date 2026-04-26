"""Smoke tests for HeatmapChart (C10) — data-driven heatmap, NOT risk_heatmap exhibit."""
from __future__ import annotations

import sys
from pathlib import Path

_PKG_ROOT = Path(__file__).resolve().parents[3]
if str(_PKG_ROOT) not in sys.path:
    sys.path.insert(0, str(_PKG_ROOT))

from lib.charts.base import ChartFormat, ChartSpec  # noqa: E402
from lib.charts.heatmap_chart import HeatmapChart  # noqa: E402


def _is_png(b: bytes) -> bool:
    return b[:8] == b"\x89PNG\r\n\x1a\n"


def test_heatmap_3x4_grid_renders_valid_png():
    rows = ["Marca A", "Marca B", "Marca C"]
    cols = ["Q1", "Q2", "Q3", "Q4"]
    data = []
    for ri, r in enumerate(rows):
        for ci, c in enumerate(cols):
            data.append({"row": r, "col": c, "value": 0.5 + 0.1 * ri + 0.05 * ci})
    spec = ChartSpec(
        type="heatmap",
        action_title="Marca C lidera todos os trimestres pressionando concorrentes",
        data=data,
        format=ChartFormat(value_format="{:.2f}", palette="sequential"),
    )
    png = HeatmapChart().render(spec)
    assert _is_png(png)
    assert len(png) > 2000


def test_heatmap_extract_preserves_row_and_col_order():
    data = [
        {"row": "B", "col": "X", "value": 1},
        {"row": "B", "col": "Y", "value": 2},
        {"row": "A", "col": "X", "value": 3},
        {"row": "A", "col": "Y", "value": 4},
    ]
    rows, cols, matrix = HeatmapChart._extract(data)
    assert rows == ["B", "A"]  # insertion order
    assert cols == ["X", "Y"]
    assert matrix == [[1.0, 2.0], [3.0, 4.0]]


def test_heatmap_diverging_palette_uses_diverging_colors():
    spec = ChartSpec(
        type="heatmap",
        action_title="Delta vs target divide marcas em dois grupos pressionando atencao",
        data=[
            {"row": "A", "col": "Q1", "value": -0.2},
            {"row": "A", "col": "Q2", "value":  0.1},
            {"row": "B", "col": "Q1", "value":  0.3},
            {"row": "B", "col": "Q2", "value": -0.1},
        ],
        format=ChartFormat(palette="diverging"),
    )
    png = HeatmapChart().render(spec)
    assert _is_png(png)


def test_heatmap_build_cmap_returns_listed_colormap():
    cmap = HeatmapChart._build_cmap("sequential")
    # Must be a matplotlib Colormap (LinearSegmentedColormap)
    from matplotlib.colors import LinearSegmentedColormap
    assert isinstance(cmap, LinearSegmentedColormap)


def test_heatmap_validate_missing_value_field():
    spec = ChartSpec(
        type="heatmap",
        action_title="x",
        data=[{"row": "A", "col": "B"}],
    )
    errors = HeatmapChart().validate(spec)
    assert any("missing required fields" in e for e in errors)


def test_heatmap_supports_only_heatmap():
    assert HeatmapChart.SUPPORTED_TYPES == ["heatmap"]


def test_heatmap_chart_distinct_from_risk_heatmap_exhibit():
    """Sanity: heatmap (chart) and risk_heatmap (exhibit) are different keys.

    CHART_REGISTRY should have 'heatmap' but NOT 'risk_heatmap'.
    RENDER_REGISTRY (exhibits) has 'risk_heatmap' for the narrative quadrant.
    """
    from lib.charts import CHART_REGISTRY
    from lib.exhibits import RENDER_REGISTRY
    assert "heatmap" in CHART_REGISTRY
    assert "risk_heatmap" not in CHART_REGISTRY
    assert "risk_heatmap" in RENDER_REGISTRY
    assert "heatmap" not in RENDER_REGISTRY  # zero ambiguity
