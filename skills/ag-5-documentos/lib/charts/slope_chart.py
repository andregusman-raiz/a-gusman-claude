"""SlopeChart — C18 ranking change between 2 periods.

Data shape:
    [
        {"label": "Marca A", "start": 5, "end": 1},
        {"label": "Marca B", "start": 1, "end": 3},
        {"label": "Marca C", "start": 3, "end": 2},
        {"label": "Marca D", "start": 4, "end": 4},
        {"label": "Marca E", "start": 2, "end": 5},
    ]

Format options:
    - x_label: pair "Periodo 1 -> Periodo 2" (used as t1/t2 column labels).
    - highlight: list of labels to render in RAIZ_ORANGE (others FG_MUTED).
    - annotation: optional caption upper-right.
"""
from __future__ import annotations

import io
from typing import Any, Dict, List, Tuple

import matplotlib.pyplot as plt

from ..raiz_tokens import FG_MUTED, FG_PRIMARY, RAIZ_ORANGE
from .base import ChartBase, ChartSpec


class SlopeChart(ChartBase):
    SUPPORTED_TYPES = ["slope"]
    REQUIRED_FIELDS = ["label", "start", "end"]

    def render(self, spec: ChartSpec) -> bytes:
        fmt = spec.format
        rows = [
            {"label": str(d["label"]),
             "start": float(d["start"]),
             "end":   float(d["end"])}
            for d in spec.data
        ]
        highlight = set(fmt.highlight or [])

        fig, ax = plt.subplots(figsize=fmt.figsize)

        # Two columns at x=0.2 and x=0.8
        x_left, x_right = 0.0, 1.0
        for row in rows:
            color = RAIZ_ORANGE if row["label"] in highlight else FG_MUTED
            alpha = 1.0 if row["label"] in highlight or not highlight else 0.6
            lw = 2.5 if row["label"] in highlight else 1.5
            ax.plot(
                [x_left, x_right],
                [row["start"], row["end"]],
                color=color, linewidth=lw, alpha=alpha,
                marker="o", markersize=6,
            )
            # Left label
            ax.text(
                x_left - 0.04, row["start"],
                f"{row['label']}  {self._format_value(row['start'], fmt.value_format)}",
                ha="right", va="center", fontsize=10, color=FG_PRIMARY,
                fontweight="bold" if row["label"] in highlight else "normal",
            )
            # Right label
            ax.text(
                x_right + 0.04, row["end"],
                f"{self._format_value(row['end'], fmt.value_format)}  {row['label']}",
                ha="left", va="center", fontsize=10, color=FG_PRIMARY,
                fontweight="bold" if row["label"] in highlight else "normal",
            )

        # Period labels at top
        period_labels = self._period_labels(fmt.x_label)
        all_y = [r["start"] for r in rows] + [r["end"] for r in rows]
        if all_y:
            top_y = max(all_y) + (max(all_y) - min(all_y)) * 0.15
            ax.text(x_left, top_y, period_labels[0],
                    ha="center", va="bottom",
                    fontsize=11, color=FG_PRIMARY, fontweight="bold")
            ax.text(x_right, top_y, period_labels[1],
                    ha="center", va="bottom",
                    fontsize=11, color=FG_PRIMARY, fontweight="bold")

        # Hide ticks/spines (slope chart is minimalist)
        ax.set_xticks([])
        ax.set_yticks([])
        for spine in ("top", "right", "left", "bottom"):
            ax.spines[spine].set_visible(False)
        ax.grid(False)

        # Invert y for ranking (1 at top)
        ax.invert_yaxis()
        ax.set_xlim(-0.4, 1.4)

        if fmt.annotation:
            ax.text(
                0.99, 0.02, fmt.annotation, transform=ax.transAxes,
                ha="right", va="bottom",
                fontsize=9, color=FG_MUTED, style="italic",
            )

        return _figure_to_png(fig)

    # -----------------------------------------------------------------------
    # Helpers
    # -----------------------------------------------------------------------
    @staticmethod
    def _period_labels(x_label: str | None) -> Tuple[str, str]:
        if x_label and "->" in x_label:
            left, right = x_label.split("->", 1)
            return (left.strip(), right.strip())
        if x_label and "→" in x_label:
            left, right = x_label.split("→", 1)
            return (left.strip(), right.strip())
        return ("Inicio", "Fim")

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


__all__ = ["SlopeChart"]
