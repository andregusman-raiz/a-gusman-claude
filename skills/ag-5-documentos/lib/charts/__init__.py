"""Chart subsystem for ag-5-documentos — matplotlib-based chart renderers.

Implements SPEC `~/Claude/docs/specs/ag-5-documentos-graficos-ceo/SPEC.md`.

Architecture: BUILD-IN-SKILL — matplotlib + python-pptx, no external dependencies.

CHART_REGISTRY is **parallel** to RENDER_REGISTRY in `lib/exhibits/__init__.py`.
Charts resolve quantitative data (timeseries, comparisons, distributions, flows).
Exhibits resolve narrative layouts (matrix, timeline, before/after, hero_number).

Public API:
    from lib.charts import CHART_REGISTRY, ChartBuilder, ChartSpec, ChartFormat
    from lib.charts.embed import embed_chart_in_slide

Each chart class implements the ChartBase ABC: validate(spec) + render(spec) -> bytes.
"""
from __future__ import annotations

from .base import (
    ChartBase,
    ChartFormat,
    ChartSpec,
    SlideRegion,
    CHART_PALETTE_CATEGORICAL,
    CHART_PALETTE_DIVERGING,
    CHART_PALETTE_SEQUENTIAL,
)
from .bar_chart import BarChart
from .builder import ChartBuilder
from .bullet_chart import BulletChart
from .combo_chart import ComboChart
from .donut_chart import DonutChart
from .infographic_chart import InfographicChart
from .line_chart import LineChart
from .stacked_bar_chart import StackedBarChart
from .waterfall_chart import WaterfallChart


# Parallel to RENDER_REGISTRY. Keys are chart types; values are classes that
# implement ChartBase (validate + render). Multiple keys can map to the same
# class when the class supports SUPPORTED_TYPES with internal switching.
CHART_REGISTRY = {
    # Bar family (PR-A)
    "bar":           BarChart,
    "bar_chart":     BarChart,
    "grouped_bar":   BarChart,
    # Line family (PR-A)
    "line":          LineChart,
    "area":          LineChart,
    # Donut/pie family (PR-A)
    "donut":         DonutChart,
    "pie":           DonutChart,
    # Financial / KPI family (PR-B)
    "waterfall":     WaterfallChart,
    "bullet":        BulletChart,
    "infographic":   InfographicChart,
    # Composition / combo family (PR-C)
    "stacked_bar":     StackedBarChart,
    "stacked100_bar":  StackedBarChart,
    "combo":           ComboChart,
    # PR-D/E will append here:
    # "scatter", "heatmap",
    # "treemap", "driver_tree", "slope",
}


__all__ = [
    "CHART_REGISTRY",
    "ChartBase",
    "ChartBuilder",
    "ChartFormat",
    "ChartSpec",
    "SlideRegion",
    "CHART_PALETTE_CATEGORICAL",
    "CHART_PALETTE_DIVERGING",
    "CHART_PALETTE_SEQUENTIAL",
    "BarChart",
    "LineChart",
    "DonutChart",
    "WaterfallChart",
    "BulletChart",
    "InfographicChart",
    "StackedBarChart",
    "ComboChart",
]
