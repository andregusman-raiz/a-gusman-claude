"""HeatmapChart — C10 data-driven heatmap (NxM grid, intensity-coded).

NOT to be confused with `risk_heatmap` exhibit (lib/exhibits/risk_heatmap.py),
which is a narrative quadrant layout. CHART_REGISTRY key "heatmap" maps to
this class; RENDER_REGISTRY key "risk_heatmap" maps to the exhibit. Zero
ambiguity by deliberate naming.

Data shape:
    [
        {"row": "Marca A", "col": "Q1", "value": 0.82},
        {"row": "Marca A", "col": "Q2", "value": 0.75},
        ...
    ]

Format options:
    - palette: "sequential" (default for heatmap) — uses CHART_PALETTE_SEQUENTIAL.
                "diverging" for centered scales (e.g. delta vs target).
    - value_format: format string for cell labels.
    - annotation: text upper-right.
"""
from __future__ import annotations

import io
from typing import Any, Dict, List, Tuple

import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap

from ..raiz_tokens import FG_MUTED, FG_PRIMARY
from .base import (
    CHART_PALETTE_DIVERGING,
    CHART_PALETTE_SEQUENTIAL,
    ChartBase,
    ChartSpec,
)


class HeatmapChart(ChartBase):
    SUPPORTED_TYPES = ["heatmap"]
    REQUIRED_FIELDS = ["row", "col", "value"]

    DEFAULT_PALETTE = "sequential"

    def render(self, spec: ChartSpec) -> bytes:
        fmt = spec.format
        rows, cols, matrix = self._extract(spec.data)

        palette_name = fmt.palette or self.DEFAULT_PALETTE
        cmap = self._build_cmap(palette_name)

        fig, ax = plt.subplots(figsize=fmt.figsize)
        im = ax.imshow(matrix, cmap=cmap, aspect="auto")

        # Tick labels
        ax.set_xticks(range(len(cols)))
        ax.set_xticklabels(cols, rotation=20, ha="right")
        ax.set_yticks(range(len(rows)))
        ax.set_yticklabels(rows)

        # Cell value annotations
        if fmt.show_values:
            self._annotate_cells(ax, matrix, fmt.value_format)

        # Colorbar
        cbar = fig.colorbar(im, ax=ax, fraction=0.04, pad=0.02)
        cbar.outline.set_visible(False)
        cbar.ax.tick_params(colors=FG_MUTED, labelsize=9)

        if fmt.x_label:
            ax.set_xlabel(fmt.x_label)
        if fmt.y_label:
            ax.set_ylabel(fmt.y_label)

        ax.grid(False)
        ax.spines["bottom"].set_visible(False)
        ax.spines["left"].set_visible(False)

        if fmt.annotation:
            ax.text(
                0.99, 1.04, fmt.annotation, transform=ax.transAxes,
                ha="right", va="bottom", fontsize=9, color=FG_MUTED, style="italic",
            )

        return _figure_to_png(fig)

    # -----------------------------------------------------------------------
    # Helpers
    # -----------------------------------------------------------------------
    @staticmethod
    def _extract(
        data: List[Dict[str, Any]],
    ) -> Tuple[List[str], List[str], List[List[float]]]:
        rows: List[str] = []
        cols: List[str] = []
        for d in data:
            r = str(d["row"])
            c = str(d["col"])
            if r not in rows:
                rows.append(r)
            if c not in cols:
                cols.append(c)

        matrix = [[0.0 for _ in cols] for _ in rows]
        for d in data:
            ri = rows.index(str(d["row"]))
            ci = cols.index(str(d["col"]))
            matrix[ri][ci] = float(d["value"])
        return rows, cols, matrix

    @staticmethod
    def _build_cmap(palette_name: str):
        if palette_name == "diverging":
            return LinearSegmentedColormap.from_list(
                "raiz_diverging", CHART_PALETTE_DIVERGING, N=256,
            )
        # default: sequential teal_light -> teal -> teal_dark
        return LinearSegmentedColormap.from_list(
            "raiz_sequential", CHART_PALETTE_SEQUENTIAL, N=256,
        )

    @staticmethod
    def _annotate_cells(ax, matrix: List[List[float]], value_format: str):
        for ri, row in enumerate(matrix):
            for ci, val in enumerate(row):
                try:
                    txt = value_format.format(val)
                except (KeyError, IndexError, ValueError):
                    txt = f"{val:.2f}"
                # Pick text color based on cell intensity (heuristic: midpoint)
                vmin = min(min(r) for r in matrix)
                vmax = max(max(r) for r in matrix)
                threshold = vmin + (vmax - vmin) * 0.6
                color = "white" if val > threshold else FG_PRIMARY
                ax.text(ci, ri, txt, ha="center", va="center",
                        fontsize=9, color=color)


def _figure_to_png(fig) -> bytes:
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    plt.close(fig)
    buf.seek(0)
    return buf.read()


__all__ = ["HeatmapChart"]
