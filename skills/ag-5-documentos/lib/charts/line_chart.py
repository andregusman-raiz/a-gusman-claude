"""LineChart — C05 (line) and C06 (area).

Data shape:
    line:
        [{"date": "2023-01", "value": 100}, ...]   # single series
        [{"date": "2023-01", "value": 100, "series": "Receita"}, ...]   # multi
    area:
        Same as line; rendered as filled area instead of stroked line.

Format options:
    - palette: categorical | sequential — applies to multi-series.
    - highlight: list of series names to keep at full alpha; others muted.
    - annotation: text rendered upper-right.
"""
from __future__ import annotations

import io
from typing import Any, Dict, List, Tuple

import matplotlib.pyplot as plt

from ..raiz_tokens import FG_MUTED, RAIZ_TEAL
from .base import (
    CHART_PALETTE_CATEGORICAL,
    ChartBase,
    ChartSpec,
    palette_colors,
)


class LineChart(ChartBase):
    SUPPORTED_TYPES = ["line", "area"]
    REQUIRED_FIELDS = ["date", "value"]

    def render(self, spec: ChartSpec) -> bytes:
        fmt = spec.format
        is_area = spec.type == "area"

        series_dict = self._group_by_series(spec.data)
        # Preserve insertion order of x values for each series
        all_x = self._unique_x_in_order(spec.data)
        series_names = list(series_dict.keys())

        palette = palette_colors(fmt.palette or "categorical")
        if fmt.palette not in ("categorical", "diverging", "sequential"):
            palette = CHART_PALETTE_CATEGORICAL

        highlight = set(fmt.highlight or [])

        fig, ax = plt.subplots(figsize=fmt.figsize)
        for idx, name in enumerate(series_names):
            xs, ys = self._align_to_axis(series_dict[name], all_x)
            color = palette[idx % len(palette)]
            alpha = 1.0
            if highlight and name not in highlight:
                color = FG_MUTED
                alpha = 0.55

            if is_area:
                ax.fill_between(xs, ys, alpha=0.25, color=color, linewidth=0)
                ax.plot(xs, ys, color=color, linewidth=2.0, alpha=alpha,
                        label=name if len(series_names) > 1 else None)
            else:
                ax.plot(xs, ys, color=color, linewidth=2.2, marker="o",
                        markersize=4, alpha=alpha,
                        label=name if len(series_names) > 1 else None)

        if fmt.x_label:
            ax.set_xlabel(fmt.x_label)
        if fmt.y_label:
            ax.set_ylabel(fmt.y_label)
        if fmt.zero_baseline:
            ax.set_ylim(bottom=0)

        # Rotate x ticks if many points or long labels
        if len(all_x) > 6 or any(len(str(v)) > 5 for v in all_x):
            for t in ax.get_xticklabels():
                t.set_rotation(30)
                t.set_ha("right")

        if len(series_names) > 1:
            ax.legend(loc="upper left", frameon=False)

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
    def _group_by_series(
        data: List[Dict[str, Any]],
    ) -> Dict[str, List[Tuple[str, float]]]:
        out: Dict[str, List[Tuple[str, float]]] = {}
        for d in data:
            name = str(d.get("series", "value"))
            out.setdefault(name, []).append((str(d["date"]), float(d["value"])))
        return out

    @staticmethod
    def _unique_x_in_order(data: List[Dict[str, Any]]) -> List[str]:
        seen: List[str] = []
        for d in data:
            x = str(d["date"])
            if x not in seen:
                seen.append(x)
        return seen

    @staticmethod
    def _align_to_axis(
        series: List[Tuple[str, float]], all_x: List[str]
    ) -> Tuple[List[str], List[float]]:
        """Align series to common x axis; missing points become None gaps.

        For matplotlib, we use NaN to render gaps.
        """
        idx = {x: v for x, v in series}
        ys: List[float] = []
        xs: List[str] = []
        for x in all_x:
            if x in idx:
                xs.append(x)
                ys.append(idx[x])
            else:
                xs.append(x)
                ys.append(float("nan"))
        return xs, ys


def _figure_to_png(fig) -> bytes:
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    plt.close(fig)
    buf.seek(0)
    return buf.read()


__all__ = ["LineChart"]
