"""ScatterChart — C09 correlation between two numeric variables.

Data shape:
    [
        {"x": 12, "y": 0.85, "label": "Cliente A"},
        {"x": 18, "y": 0.92, "label": "Cliente B"},
        ...
    ]

Optional fields per item:
    - "size": float — bubble size (defaults to fixed)
    - "group": str — categorical grouping for color coding

Format options:
    - palette: categorical (default) — applies when group is present.
    - highlight: list of labels to render in RAIZ_ORANGE.
    - annotation: text rendered upper-right.
    - x_label, y_label: axis labels.
    - sort: ignored (scatter is not ordered).
"""
from __future__ import annotations

import io
from typing import Any, Dict, List, Tuple

import matplotlib.pyplot as plt

from ..raiz_tokens import FG_MUTED, FG_PRIMARY, RAIZ_ORANGE, RAIZ_TEAL
from .base import (
    CHART_PALETTE_CATEGORICAL,
    ChartBase,
    ChartSpec,
    palette_colors,
)


class ScatterChart(ChartBase):
    SUPPORTED_TYPES = ["scatter"]
    REQUIRED_FIELDS = ["x", "y"]

    def render(self, spec: ChartSpec) -> bytes:
        fmt = spec.format
        groups = self._collect_groups(spec.data)
        palette = palette_colors(fmt.palette or "categorical")
        if fmt.palette not in ("categorical", "diverging", "sequential"):
            palette = CHART_PALETTE_CATEGORICAL
        highlight = set(fmt.highlight or [])

        fig, ax = plt.subplots(figsize=fmt.figsize)

        if not groups:
            xs, ys, labels, sizes = self._extract_default(spec.data)
            colors = [
                RAIZ_ORANGE if labels[i] in highlight else RAIZ_TEAL
                for i in range(len(xs))
            ]
            ax.scatter(xs, ys, s=sizes, c=colors, alpha=0.78,
                       edgecolors="white", linewidths=0.8)
            self._annotate_highlights(ax, xs, ys, labels, highlight)
        else:
            for gi, (group_name, items) in enumerate(groups.items()):
                xs, ys, labels, sizes = self._extract_default(items)
                color = palette[gi % len(palette)]
                colors = [
                    RAIZ_ORANGE if labels[i] in highlight else color
                    for i in range(len(xs))
                ]
                ax.scatter(xs, ys, s=sizes, c=colors, alpha=0.78,
                           label=group_name,
                           edgecolors="white", linewidths=0.8)
                self._annotate_highlights(ax, xs, ys, labels, highlight)
            ax.legend(loc="upper left", frameon=False)

        if fmt.x_label:
            ax.set_xlabel(fmt.x_label)
        if fmt.y_label:
            ax.set_ylabel(fmt.y_label)

        if fmt.annotation:
            ax.text(
                0.99, 0.97, fmt.annotation, transform=ax.transAxes,
                ha="right", va="top", fontsize=9, color=FG_MUTED, style="italic",
            )

        return _figure_to_png(fig)

    # -----------------------------------------------------------------------
    # Helpers
    # -----------------------------------------------------------------------
    @staticmethod
    def _collect_groups(data: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        out: Dict[str, List[Dict[str, Any]]] = {}
        for d in data:
            g = d.get("group")
            if g is None:
                return {}  # any item without group disables grouping
            out.setdefault(str(g), []).append(d)
        return out

    @staticmethod
    def _extract_default(
        data: List[Dict[str, Any]],
    ) -> Tuple[List[float], List[float], List[str], List[float]]:
        xs: List[float] = []
        ys: List[float] = []
        labels: List[str] = []
        sizes: List[float] = []
        for d in data:
            xs.append(float(d["x"]))
            ys.append(float(d["y"]))
            labels.append(str(d.get("label", "")))
            sizes.append(float(d.get("size", 60)))
        return xs, ys, labels, sizes

    @staticmethod
    def _annotate_highlights(ax, xs, ys, labels, highlight):
        for x, y, lbl in zip(xs, ys, labels):
            if lbl in highlight:
                ax.annotate(
                    lbl, (x, y),
                    xytext=(8, 6), textcoords="offset points",
                    fontsize=9, color=FG_PRIMARY, fontweight="bold",
                )


def _figure_to_png(fig) -> bytes:
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    plt.close(fig)
    buf.seek(0)
    return buf.read()


__all__ = ["ScatterChart"]
