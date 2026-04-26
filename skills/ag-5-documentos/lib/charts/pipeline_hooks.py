"""Pipeline integration helpers for the chart subsystem.

Pure functions, testable independently of the full ExecutiveDeckPipeline.

Functions:
    viz_spec_to_chart_spec(viz, slide_item) -> Optional[ChartSpec]
        Maps a VizSpec.data_input + slide outline item to a ChartSpec when
        viz.kind matches CHART_REGISTRY.

    compute_chart_region(slide_item) -> SlideRegion
        Computes the EMU rectangle below action_title + takeaway_bar where
        the chart should be embedded. Defaults to default_chart_region().

    iter_chart_slides(outline) -> Iterator[(slide_idx, ChartSpec)]
        Convenience: iterate all slides whose viz kind is in CHART_REGISTRY.
"""
from __future__ import annotations

from typing import Any, Dict, Iterator, Optional, Tuple

from . import CHART_REGISTRY
from .base import ChartFormat, ChartSpec, SlideRegion
from .embed import default_chart_region


def viz_spec_to_chart_spec(
    viz, slide_item: Dict[str, Any]
) -> Optional[ChartSpec]:
    """Map a VizSpec + slide outline dict to a ChartSpec.

    Returns None when viz.kind is not in CHART_REGISTRY (caller falls back
    to exhibit rendering or AuditWarning).

    Spec.data is sourced (in priority order):
        1) slide_item["chart_data"] when present (explicit pipeline-set)
        2) viz.data_input["data"] when present
        3) [] (empty — V02 will block)
    """
    if viz is None or not hasattr(viz, "kind"):
        return None
    kind = viz.kind
    if kind not in CHART_REGISTRY:
        return None

    data = (
        slide_item.get("chart_data")
        or _data_from_viz(viz)
        or []
    )

    fmt_overrides = slide_item.get("chart_format") or {}

    return ChartSpec(
        type=kind,
        action_title=(slide_item.get("title")
                      or slide_item.get("message")
                      or "").strip(),
        subtitle=slide_item.get("subtitle"),
        takeaway_bar=slide_item.get("takeaway_bar"),
        source=slide_item.get("source"),
        data=list(data),
        format=ChartFormat(**fmt_overrides) if fmt_overrides else ChartFormat(),
        anti_patterns_check=True,
        insight_auto=bool(slide_item.get("insight_auto", False)),
        slide_n=slide_item.get("slide_n"),
        deck_section=slide_item.get("deck_section"),
    )


def _data_from_viz(viz) -> Any:
    """Pull data field out of viz.data_input (the dict carried by VizSpec)."""
    di = getattr(viz, "data_input", None)
    if isinstance(di, dict):
        return di.get("data") or di.get("items") or []
    return []


def compute_chart_region(slide_item: Dict[str, Any]) -> SlideRegion:
    """Returns the SlideRegion in EMU for a chart on a 16:9 slide.

    Currently returns `default_chart_region()`; the slide_item parameter is
    accepted for forward-compat (so future per-slide overrides do not require
    a signature change in callers).
    """
    # Future: use slide_item to detect kpi_card stripe heights, custom
    # action_title 2-line wrap, etc. For now, default works for all slides
    # produced by the McKinsey pipeline.
    _ = slide_item  # acknowledge param
    return default_chart_region()


def iter_chart_slides(
    outline: list,
) -> Iterator[Tuple[int, Dict[str, Any], ChartSpec]]:
    """Iterate (slide_idx, slide_item, chart_spec) for slides with chart viz.

    Skips slides where viz.kind is not in CHART_REGISTRY.
    """
    for idx, slide_item in enumerate(outline or []):
        viz = slide_item.get("viz") if isinstance(slide_item, dict) else None
        chart_spec = viz_spec_to_chart_spec(viz, slide_item)
        if chart_spec is not None:
            yield idx, slide_item, chart_spec


__all__ = [
    "viz_spec_to_chart_spec",
    "compute_chart_region",
    "iter_chart_slides",
]
