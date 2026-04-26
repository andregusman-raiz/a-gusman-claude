"""StackedBarChart — C03 (absolute) + C04 (stacked100, percentual).

Data shape:
    [
        {"label": "2023", "stack": "Premium",  "value": 40},
        {"label": "2023", "stack": "Standard", "value": 35},
        {"label": "2023", "stack": "Basic",    "value": 25},
        {"label": "2024", "stack": "Premium",  "value": 50},
        ...
    ]

Format options:
    - palette: categorical (default).
    - sort: applies to label order (e.g. desc by sum).
    - highlight: list of stack names to keep at full alpha; others muted.
"""
from __future__ import annotations

import io
from typing import Any, Dict, List, Tuple

import matplotlib.pyplot as plt

from ..raiz_tokens import FG_MUTED, FG_PRIMARY
from .base import (
    CHART_PALETTE_CATEGORICAL,
    ChartBase,
    ChartSpec,
    palette_colors,
)


class StackedBarChart(ChartBase):
    SUPPORTED_TYPES = ["stacked_bar", "stacked100_bar"]
    REQUIRED_FIELDS = ["label", "stack", "value"]

    def render(self, spec: ChartSpec) -> bytes:
        fmt = spec.format
        is_100 = spec.type == "stacked100_bar"

        labels, stacks, matrix = self._extract(spec.data, sort=fmt.sort)
        if is_100:
            matrix = self._normalize_to_100(matrix)

        palette = palette_colors(fmt.palette or "categorical")
        if fmt.palette not in ("categorical", "diverging", "sequential"):
            palette = CHART_PALETTE_CATEGORICAL
        highlight = set(fmt.highlight or [])

        fig, ax = plt.subplots(figsize=fmt.figsize)
        n_stacks = len(stacks)
        bottoms = [0.0] * len(labels)
        for si, stack_name in enumerate(stacks):
            row = matrix[si]
            color = palette[si % len(palette)]
            alpha = 1.0
            if highlight and stack_name not in highlight:
                color = FG_MUTED
                alpha = 0.55
            ax.bar(labels, row, bottom=bottoms,
                   color=color, edgecolor="white", linewidth=0.8,
                   width=0.62, label=stack_name, alpha=alpha)
            # Inline value labels at center of each segment, only when segment > 5%
            if fmt.show_values:
                self._annotate_segment(ax, labels, row, bottoms,
                                       value_format=fmt.value_format,
                                       is_100=is_100)
            bottoms = [b + r for b, r in zip(bottoms, row)]

        if is_100:
            ax.set_ylim(0, 100)
            ax.set_yticks([0, 25, 50, 75, 100])
            ax.set_yticklabels(["0%", "25%", "50%", "75%", "100%"])
        elif fmt.zero_baseline:
            ax.set_ylim(bottom=0)

        if fmt.x_label:
            ax.set_xlabel(fmt.x_label)
        if fmt.y_label:
            ax.set_ylabel(fmt.y_label)

        ax.grid(axis="x", visible=False)
        ax.legend(loc="upper left", bbox_to_anchor=(1.0, 1.0), frameon=False)

        return _figure_to_png(fig)

    # -----------------------------------------------------------------------
    # Helpers
    # -----------------------------------------------------------------------
    @staticmethod
    def _extract(
        data: List[Dict[str, Any]], sort: str | None
    ) -> Tuple[List[str], List[str], List[List[float]]]:
        labels: List[str] = []
        stacks: List[str] = []
        for d in data:
            lbl = str(d["label"])
            stk = str(d["stack"])
            if lbl not in labels:
                labels.append(lbl)
            if stk not in stacks:
                stacks.append(stk)

        # matrix[stack_idx][label_idx]
        matrix = [[0.0 for _ in labels] for _ in stacks]
        for d in data:
            li = labels.index(str(d["label"]))
            si = stacks.index(str(d["stack"]))
            matrix[si][li] += float(d["value"])

        if sort in ("asc", "desc"):
            sums = [sum(matrix[si][li] for si in range(len(stacks)))
                    for li in range(len(labels))]
            order = sorted(range(len(labels)), key=lambda i: sums[i],
                           reverse=(sort == "desc"))
            labels = [labels[i] for i in order]
            matrix = [[row[i] for i in order] for row in matrix]

        return labels, stacks, matrix

    @staticmethod
    def _normalize_to_100(matrix: List[List[float]]) -> List[List[float]]:
        if not matrix or not matrix[0]:
            return matrix
        n_labels = len(matrix[0])
        out = [[0.0] * n_labels for _ in matrix]
        for li in range(n_labels):
            col = [row[li] for row in matrix]
            total = sum(col) or 1.0
            for si in range(len(matrix)):
                out[si][li] = matrix[si][li] / total * 100.0
        return out

    @staticmethod
    def _annotate_segment(ax, labels, row, bottoms, value_format, is_100):
        for li, (lbl, val, b) in enumerate(zip(labels, row, bottoms)):
            if val < 5:
                continue  # skip thin slices
            txt = (f"{val:.0f}%" if is_100
                   else _safe_fmt(value_format, val))
            ax.text(li, b + val / 2, txt,
                    ha="center", va="center",
                    fontsize=9, color="white", fontweight="bold")


def _safe_fmt(value_format: str, v: float) -> str:
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


__all__ = ["StackedBarChart"]
