"""InfographicChart — C13 N KPI cards in icon-grid layout.

Data shape:
    [
        {"label": "Receita",    "value": "R$ 12M", "icon": "$"},
        {"label": "Crescimento","value": "+34%",   "icon": "↑"},
        {"label": "Clientes",   "value": "1,200",  "icon": "◆"},
        {"label": "Churn",      "value": "4.2%",   "icon": "↓"},
    ]

Format options:
    - palette: "categorical" (default) — one accent color per card.
    - highlight: list of labels to color RAIZ_ORANGE (others use teal).

Layout: auto-grids cards into rows × cols (target 2 cols for ≤4 KPIs,
3 cols for 5-6, 4 cols for 7-8, max 8 cards).
"""
from __future__ import annotations

import io
import math
from typing import Any, Dict, List, Tuple

import matplotlib.patches as patches
import matplotlib.pyplot as plt

from ..raiz_tokens import (
    BG_LIGHT,
    FG_MUTED,
    FG_PRIMARY,
    RAIZ_ORANGE,
    RAIZ_TEAL,
)
from .base import ChartBase, ChartSpec


class InfographicChart(ChartBase):
    SUPPORTED_TYPES = ["infographic"]
    REQUIRED_FIELDS = ["label", "value"]

    MAX_KPIS = 8

    def render(self, spec: ChartSpec) -> bytes:
        fmt = spec.format
        items = spec.data[: self.MAX_KPIS]
        rows, cols = self._grid_shape(len(items))
        highlight = set(fmt.highlight or [])

        fig, ax = plt.subplots(figsize=fmt.figsize)
        ax.set_xlim(0, cols)
        ax.set_ylim(0, rows)
        ax.set_aspect("equal")
        ax.axis("off")

        for idx, item in enumerate(items):
            r = rows - 1 - (idx // cols)  # top to bottom
            c = idx % cols
            color = RAIZ_ORANGE if str(item["label"]) in highlight else RAIZ_TEAL
            self._draw_card(ax, c, r, item, color)

        return _figure_to_png(fig)

    # -----------------------------------------------------------------------
    # Helpers
    # -----------------------------------------------------------------------
    @staticmethod
    def _grid_shape(n: int) -> Tuple[int, int]:
        if n <= 0:
            return (1, 1)
        if n <= 2:
            return (1, n)
        if n <= 4:
            return (2, 2)
        if n <= 6:
            return (2, 3)
        return (2, 4)  # 7-8

    @staticmethod
    def _draw_card(ax, c: int, r: int, item: Dict[str, Any], accent: str):
        pad = 0.08
        x = c + pad
        y = r + pad
        w = 1 - 2 * pad
        h = 1 - 2 * pad

        # Background card with rounded effect (rectangle here; pptx renders crisper)
        rect = patches.Rectangle(
            (x, y), w, h,
            linewidth=1.2, edgecolor=accent, facecolor=BG_LIGHT,
        )
        ax.add_patch(rect)

        # Top accent stripe (5% of card height)
        stripe = patches.Rectangle(
            (x, y + h - h * 0.06), w, h * 0.06,
            linewidth=0, edgecolor="none", facecolor=accent,
        )
        ax.add_patch(stripe)

        # Icon (top-left), large and accent-colored
        icon = str(item.get("icon") or "").strip() or "•"
        ax.text(
            x + w * 0.10, y + h * 0.72,
            icon,
            fontsize=22, color=accent,
            ha="left", va="center", fontweight="bold",
        )

        # Value (large, center-left)
        ax.text(
            x + w * 0.10, y + h * 0.45,
            str(item["value"]),
            fontsize=20, color=FG_PRIMARY,
            ha="left", va="center", fontweight="bold",
        )

        # Label (small, bottom)
        ax.text(
            x + w * 0.10, y + h * 0.18,
            str(item["label"]),
            fontsize=10, color=FG_MUTED,
            ha="left", va="center",
        )


def _figure_to_png(fig) -> bytes:
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    plt.close(fig)
    buf.seek(0)
    return buf.read()


__all__ = ["InfographicChart"]
