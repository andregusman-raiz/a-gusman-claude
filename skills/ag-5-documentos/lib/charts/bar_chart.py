"""BarChart — C01 (bar / bar_chart) and C02 (grouped_bar).

Data shape:
    bar / bar_chart:
        [{"label": "2023", "value": 8.2}, ...]
    grouped_bar:
        [{"label": "Q1", "group": "Receita", "value": 12.0},
         {"label": "Q1", "group": "Custo",   "value": 7.0}, ...]

Format options used:
    - sort: "asc" | "desc" | None (applies on label aggregation order)
    - highlight: list of labels to render in RAIZ_ORANGE (others muted)
    - zero_baseline: forced True for bar charts (V08); enforced via ylim
    - value_format: format string for value labels above bars
    - show_values: bool — render value labels on top of bars
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


class BarChart(ChartBase):
    SUPPORTED_TYPES = ["bar", "bar_chart", "grouped_bar"]
    REQUIRED_FIELDS = ["label", "value"]

    # -----------------------------------------------------------------------
    # Render entry point
    # -----------------------------------------------------------------------
    def render(self, spec: ChartSpec) -> bytes:
        if spec.type == "grouped_bar":
            return self._render_grouped(spec)
        return self._render_simple(spec)

    # -----------------------------------------------------------------------
    # Simple bar (C01)
    # -----------------------------------------------------------------------
    def _render_simple(self, spec: ChartSpec) -> bytes:
        fmt = spec.format
        labels, values = self._extract_simple(spec.data, sort=fmt.sort)
        highlight = set(fmt.highlight or [])

        colors = self._resolve_simple_colors(labels, highlight)

        fig, ax = plt.subplots(figsize=fmt.figsize)
        bars = ax.bar(labels, values, color=colors, edgecolor="none", width=0.65)

        if fmt.zero_baseline:
            ax.set_ylim(bottom=0)
        if fmt.x_label:
            ax.set_xlabel(fmt.x_label)
        if fmt.y_label:
            ax.set_ylabel(fmt.y_label)

        ax.grid(axis="x", visible=False)
        ax.tick_params(axis="x", colors=FG_PRIMARY)

        if fmt.show_values:
            self._annotate_bars(ax, bars, values, fmt.value_format)

        if fmt.annotation:
            ax.text(
                0.99, 0.97, fmt.annotation, transform=ax.transAxes,
                ha="right", va="top", fontsize=9, color=FG_MUTED, style="italic",
            )

        return _figure_to_png(fig)

    # -----------------------------------------------------------------------
    # Grouped bar (C02)
    # -----------------------------------------------------------------------
    def _render_grouped(self, spec: ChartSpec) -> bytes:
        fmt = spec.format
        labels, groups, matrix = self._extract_grouped(spec.data)
        palette = palette_colors(fmt.palette or "categorical")
        # Always use categorical palette for groups regardless of palette name
        if fmt.palette not in ("categorical", "diverging", "sequential"):
            palette = CHART_PALETTE_CATEGORICAL

        n_groups = len(groups)
        bar_w = 0.8 / max(n_groups, 1)

        fig, ax = plt.subplots(figsize=fmt.figsize)
        for gi, group_name in enumerate(groups):
            xs = [i + (gi - (n_groups - 1) / 2) * bar_w for i in range(len(labels))]
            color = palette[gi % len(palette)]
            ax.bar(xs, matrix[gi], width=bar_w, label=group_name,
                   color=color, edgecolor="none")

        ax.set_xticks(range(len(labels)))
        ax.set_xticklabels(labels)
        if fmt.zero_baseline:
            ax.set_ylim(bottom=0)
        if fmt.x_label:
            ax.set_xlabel(fmt.x_label)
        if fmt.y_label:
            ax.set_ylabel(fmt.y_label)

        ax.grid(axis="x", visible=False)
        ax.legend(loc="upper left", frameon=False)

        return _figure_to_png(fig)

    # -----------------------------------------------------------------------
    # Helpers
    # -----------------------------------------------------------------------
    @staticmethod
    def _extract_simple(
        data: List[Dict[str, Any]], sort: str | None
    ) -> Tuple[List[str], List[float]]:
        pairs = [(str(d["label"]), float(d["value"])) for d in data]
        if sort == "asc":
            pairs.sort(key=lambda p: p[1])
        elif sort == "desc":
            pairs.sort(key=lambda p: p[1], reverse=True)
        labels = [p[0] for p in pairs]
        values = [p[1] for p in pairs]
        return labels, values

    @staticmethod
    def _extract_grouped(
        data: List[Dict[str, Any]]
    ) -> Tuple[List[str], List[str], List[List[float]]]:
        """Returns (labels_in_order, groups_in_order, matrix[group_idx][label_idx])."""
        labels: List[str] = []
        groups: List[str] = []
        # Preserve insertion order
        for d in data:
            label = str(d["label"])
            group = str(d.get("group", "default"))
            if label not in labels:
                labels.append(label)
            if group not in groups:
                groups.append(group)

        # Build matrix indexed [group][label]
        matrix = [[0.0 for _ in labels] for _ in groups]
        for d in data:
            li = labels.index(str(d["label"]))
            gi = groups.index(str(d.get("group", "default")))
            matrix[gi][li] = float(d["value"])
        return labels, groups, matrix

    @staticmethod
    def _resolve_simple_colors(
        labels: List[str], highlight: set
    ) -> List[str]:
        """Highlight labels get RAIZ_ORANGE; others get RAIZ_TEAL.

        If no highlight specified, all bars use RAIZ_TEAL (calm default; the
        action_title carries the message). User can override by passing
        highlight=[labels] in format.
        """
        if not highlight:
            return [RAIZ_TEAL] * len(labels)
        return [RAIZ_ORANGE if lbl in highlight else FG_MUTED for lbl in labels]

    @staticmethod
    def _annotate_bars(ax, bars, values, value_format: str) -> None:
        for bar, v in zip(bars, values):
            try:
                label = value_format.format(v)
            except (KeyError, IndexError, ValueError):
                label = f"{v:g}"
            ax.text(
                bar.get_x() + bar.get_width() / 2,
                bar.get_height(),
                label,
                ha="center", va="bottom",
                fontsize=9, color=FG_PRIMARY,
            )


def _figure_to_png(fig) -> bytes:
    """Serialize a matplotlib Figure to PNG bytes and close the figure."""
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    plt.close(fig)
    buf.seek(0)
    return buf.read()


__all__ = ["BarChart"]
