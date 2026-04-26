"""DonutChart — C08 (pie) and C15 (donut).

Donut differs from pie by carrying a hero number/label in the center hole.

Data shape:
    [{"label": "Premium", "value": 120}, ...]

Format options:
    - palette: categorical (default).
    - highlight: list of labels to render in RAIZ_ORANGE; others in palette
      cycle muted (alpha 0.85).
    - annotation: optional center number/label (donut only).
"""
from __future__ import annotations

import io
from typing import Any, Dict, List, Tuple

import matplotlib.pyplot as plt

from ..raiz_tokens import FG_MUTED, FG_PRIMARY, RAIZ_ORANGE
from .base import (
    CHART_PALETTE_CATEGORICAL,
    ChartBase,
    ChartSpec,
    palette_colors,
)


class DonutChart(ChartBase):
    SUPPORTED_TYPES = ["donut", "pie"]
    REQUIRED_FIELDS = ["label", "value"]

    def render(self, spec: ChartSpec) -> bytes:
        fmt = spec.format
        is_donut = spec.type == "donut"

        labels, values = self._extract(spec.data)
        palette = palette_colors(fmt.palette or "categorical")
        if fmt.palette not in ("categorical", "diverging", "sequential"):
            palette = CHART_PALETTE_CATEGORICAL

        highlight = set(fmt.highlight or [])
        colors = self._resolve_colors(labels, palette, highlight)

        # Square figure for clean donut/pie circle
        side = min(fmt.figsize[1], fmt.figsize[0])
        fig, ax = plt.subplots(figsize=(side * 1.6, side))

        wedges, _ = ax.pie(
            values,
            labels=None,
            colors=colors,
            startangle=90,
            counterclock=False,
            wedgeprops={
                "width": 0.42 if is_donut else 1.0,
                "edgecolor": "white",
                "linewidth": 2,
            },
        )

        # Side legend (label + percent)
        total = sum(values) or 1.0
        legend_labels = [
            f"{lbl} — {self._format_value(v, fmt.value_format)} ({v / total * 100:.1f}%)"
            for lbl, v in zip(labels, values)
        ]
        ax.legend(
            wedges,
            legend_labels,
            loc="center left",
            bbox_to_anchor=(1.0, 0.5),
            frameon=False,
            fontsize=10,
        )
        ax.set(aspect="equal")

        if is_donut and fmt.annotation:
            ax.text(
                0, 0, fmt.annotation,
                ha="center", va="center",
                fontsize=22, color=FG_PRIMARY, fontweight="bold",
            )
        elif is_donut and not fmt.annotation:
            ax.text(
                0, 0, self._format_value(total, fmt.value_format),
                ha="center", va="center",
                fontsize=20, color=FG_MUTED, fontweight="bold",
            )

        return _figure_to_png(fig)

    # -----------------------------------------------------------------------
    # Helpers
    # -----------------------------------------------------------------------
    @staticmethod
    def _extract(data: List[Dict[str, Any]]) -> Tuple[List[str], List[float]]:
        labels = [str(d["label"]) for d in data]
        values = [max(0.0, float(d["value"])) for d in data]  # clamp negatives
        return labels, values

    @staticmethod
    def _resolve_colors(
        labels: List[str], palette: List[str], highlight: set
    ) -> List[str]:
        if not highlight:
            return [palette[i % len(palette)] for i in range(len(labels))]
        return [RAIZ_ORANGE if lbl in highlight else palette[(i + 1) % len(palette)]
                for i, lbl in enumerate(labels)]

    @staticmethod
    def _format_value(v: float, value_format: str) -> str:
        try:
            return value_format.format(v)
        except (KeyError, IndexError, ValueError):
            return f"{v:g}"


def _figure_to_png(fig) -> bytes:
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    plt.close(fig)
    buf.seek(0)
    return buf.read()


__all__ = ["DonutChart"]
