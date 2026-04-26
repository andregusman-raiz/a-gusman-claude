"""ComboChart — C07 bars (left axis) + line (right axis) on shared x-axis.

Data shape:
    [
        {"label": "Q1", "bar_val": 100, "line_val": 12.5},
        {"label": "Q2", "bar_val": 120, "line_val": 14.1},
        {"label": "Q3", "bar_val": 135, "line_val": 13.0},
    ]

Format options:
    - y_label: label for left axis (bars).
    - y2_label: label for right axis (line) — REQUIRED to mitigate AP04.
    - palette: categorical (default).
"""
from __future__ import annotations

import io
from typing import Any, Dict, List, Tuple

import matplotlib.pyplot as plt

from ..raiz_tokens import FG_MUTED, RAIZ_ORANGE, RAIZ_TEAL
from .base import ChartBase, ChartSpec


class ComboChart(ChartBase):
    SUPPORTED_TYPES = ["combo"]
    REQUIRED_FIELDS = ["label"]  # bar_val/line_val checked in subclass validate

    BAR_COLOR = RAIZ_TEAL
    LINE_COLOR = RAIZ_ORANGE

    def render(self, spec: ChartSpec) -> bytes:
        fmt = spec.format
        labels, bars, lines = self._extract(spec.data)

        fig, ax_bar = plt.subplots(figsize=fmt.figsize)

        # Left axis — bars
        ax_bar.bar(labels, bars, color=self.BAR_COLOR, edgecolor="none",
                   width=0.6, label=fmt.y_label or "Volume")
        if fmt.zero_baseline:
            ax_bar.set_ylim(bottom=0)
        if fmt.y_label:
            ax_bar.set_ylabel(fmt.y_label, color=self.BAR_COLOR)
        ax_bar.tick_params(axis="y", labelcolor=self.BAR_COLOR)
        ax_bar.grid(axis="x", visible=False)

        # Right axis — line
        ax_line = ax_bar.twinx()
        ax_line.plot(labels, lines, color=self.LINE_COLOR, marker="o",
                     linewidth=2.4, label=fmt.y2_label or "Taxa")
        if fmt.y2_label:
            ax_line.set_ylabel(fmt.y2_label, color=self.LINE_COLOR)
        ax_line.tick_params(axis="y", labelcolor=self.LINE_COLOR)
        # Hide right axis grid (avoid double-grid)
        ax_line.grid(False)
        # Hide top spine (consistent with rcParams)
        ax_line.spines["top"].set_visible(False)

        if fmt.x_label:
            ax_bar.set_xlabel(fmt.x_label)

        # Combined legend
        bars_handle, _ = ax_bar.get_legend_handles_labels()
        lines_handle, _ = ax_line.get_legend_handles_labels()
        ax_bar.legend(
            bars_handle + lines_handle,
            [fmt.y_label or "Volume", fmt.y2_label or "Taxa"],
            loc="upper left", frameon=False,
        )

        return _figure_to_png(fig)

    def validate(self, spec: ChartSpec) -> List[str]:
        errors = super().validate(spec)
        # AP04 — dual axis without labels is misleading
        if not spec.format.y_label or not spec.format.y2_label:
            errors.append(
                "combo: AP04 anti-pattern — both y_label and y2_label are "
                "required for dual-axis charts to avoid misleading scale comparison"
            )
        # Ensure each item has bar_val and line_val
        for idx, item in enumerate(spec.data):
            if not isinstance(item, dict):
                continue
            if "bar_val" not in item or "line_val" not in item:
                errors.append(
                    f"data[{idx}] missing bar_val or line_val for combo type"
                )
        return errors

    @staticmethod
    def _extract(
        data: List[Dict[str, Any]],
    ) -> Tuple[List[str], List[float], List[float]]:
        labels: List[str] = []
        bars: List[float] = []
        lines: List[float] = []
        for d in data:
            labels.append(str(d["label"]))
            bars.append(float(d.get("bar_val", 0)))
            lines.append(float(d.get("line_val", 0)))
        return labels, bars, lines


def _figure_to_png(fig) -> bytes:
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    plt.close(fig)
    buf.seek(0)
    return buf.read()


__all__ = ["ComboChart"]
