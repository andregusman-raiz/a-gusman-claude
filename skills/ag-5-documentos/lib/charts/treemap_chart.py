"""TreemapChart — C16 hierarchical area-proportional layout.

Data shape:
    [
        {"label": "Premium",  "value": 450},
        {"label": "Standard", "value": 320},
        {"label": "Basic",    "value": 130},
        {"label": "Free",     "value":  50},
    ]

Optional fields:
    - "group" (str): for nested 2-level treemaps (currently used as parent label
      in legend; layout remains single-level grid).

Implementation:
    - Prefer `squarify` (better aspect ratios) if available.
    - Fallback: pure-matplotlib slice-and-dice algorithm using patches.Rectangle.

Format options:
    - palette: categorical (default).
    - highlight: list of labels to render in RAIZ_ORANGE; others in palette cycle.
    - value_format: format string for inline value labels.
"""
from __future__ import annotations

import io
from typing import Any, Dict, List, Tuple

import matplotlib.patches as patches
import matplotlib.pyplot as plt

from ..raiz_tokens import FG_PRIMARY, RAIZ_ORANGE
from .base import (
    CHART_PALETTE_CATEGORICAL,
    ChartBase,
    ChartSpec,
    palette_colors,
)


try:  # optional dependency
    import squarify  # type: ignore
    _HAS_SQUARIFY = True
except ImportError:  # pragma: no cover
    _HAS_SQUARIFY = False


class TreemapChart(ChartBase):
    SUPPORTED_TYPES = ["treemap"]
    REQUIRED_FIELDS = ["label", "value"]

    def render(self, spec: ChartSpec) -> bytes:
        fmt = spec.format
        items = self._sort_desc(spec.data)
        labels = [str(d["label"]) for d in items]
        values = [max(0.001, float(d["value"])) for d in items]
        palette = palette_colors(fmt.palette or "categorical")
        if fmt.palette not in ("categorical", "diverging", "sequential"):
            palette = CHART_PALETTE_CATEGORICAL
        highlight = set(fmt.highlight or [])

        fig, ax = plt.subplots(figsize=fmt.figsize)
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
        ax.set_aspect("auto")
        ax.axis("off")

        rects = self._compute_rects(values)

        for i, (x, y, w, h) in enumerate(rects):
            color = (RAIZ_ORANGE if labels[i] in highlight
                     else palette[i % len(palette)])
            ax.add_patch(patches.Rectangle(
                (x, y), w, h,
                facecolor=color, edgecolor="white", linewidth=2,
            ))
            # Inline label + value (only if rect is big enough)
            if w > 0.06 and h > 0.06:
                txt_value = self._format_value(values[i], fmt.value_format)
                ax.text(
                    x + w / 2, y + h / 2 + 0.02,
                    labels[i],
                    ha="center", va="center",
                    fontsize=11, color="white", fontweight="bold",
                )
                ax.text(
                    x + w / 2, y + h / 2 - 0.04,
                    txt_value,
                    ha="center", va="center",
                    fontsize=10, color="white",
                )

        return _figure_to_png(fig)

    # -----------------------------------------------------------------------
    # Helpers
    # -----------------------------------------------------------------------
    @staticmethod
    def _sort_desc(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return sorted(
            (d for d in data if isinstance(d, dict)),
            key=lambda d: float(d.get("value", 0)),
            reverse=True,
        )

    @staticmethod
    def _compute_rects(values: List[float]) -> List[Tuple[float, float, float, float]]:
        """Returns list of (x, y, w, h) rects for unit square (0..1)."""
        total = sum(values) or 1.0
        normed = [v / total for v in values]
        if _HAS_SQUARIFY:
            return _squarify_rects(normed)
        return _slice_and_dice(normed)

    @staticmethod
    def _format_value(v: float, value_format: str) -> str:
        try:
            return value_format.format(v)
        except (KeyError, IndexError, ValueError):
            return f"{v:.0f}"


def _squarify_rects(normed: List[float]) -> List[Tuple[float, float, float, float]]:
    """Use squarify when available — better aspect ratios."""
    rects = squarify.squarify(  # type: ignore
        squarify.normalize_sizes(normed, 1.0, 1.0),
        0, 0, 1.0, 1.0,
    )
    return [(r["x"], r["y"], r["dx"], r["dy"]) for r in rects]


def _slice_and_dice(normed: List[float]) -> List[Tuple[float, float, float, float]]:
    """Fallback layout: alternate horizontal/vertical slices.

    Recursive bisection: at each step, the current item takes a fraction of
    the remaining area equal to its share of the remaining values. Switches
    cut direction (longer side) at each step. Areas sum to 1.0 exactly.
    """
    rects: List[Tuple[float, float, float, float]] = []
    n = len(normed)
    if n == 0:
        return rects

    def recurse(items: List[float], x: float, y: float,
                w: float, h: float):
        if not items:
            return
        if len(items) == 1:
            rects.append((x, y, w, h))
            return
        total = sum(items) or 1.0
        first = items[0]
        rest = items[1:]
        if w >= h:
            # Cut vertically: first item gets a slice on the left
            slice_w = w * (first / total)
            rects.append((x, y, slice_w, h))
            recurse(rest, x + slice_w, y, w - slice_w, h)
        else:
            slice_h = h * (first / total)
            rects.append((x, y + (h - slice_h), w, slice_h))
            recurse(rest, x, y, w, h - slice_h)

    recurse(list(normed), 0.0, 0.0, 1.0, 1.0)
    return rects


def _figure_to_png(fig) -> bytes:
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    plt.close(fig)
    buf.seek(0)
    return buf.read()


__all__ = ["TreemapChart"]
