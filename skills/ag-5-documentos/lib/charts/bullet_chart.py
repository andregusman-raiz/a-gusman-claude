"""BulletChart — C12 progress vs target with optional benchmark.

Data shape:
    [
        {"metric": "NPS",      "actual": 78, "target": 80,  "benchmark": 65, "scale_max": 100},
        {"metric": "Receita",  "actual": 12, "target": 15,  "benchmark": 10, "scale_max": 20},
        {"metric": "Churn",    "actual": 5,  "target": 4,   "benchmark": 8,  "scale_max": 15, "lower_is_better": True},
    ]

Layout: horizontal bullet bars. From left to right:
    1. Light grey background = scale_max
    2. Light teal benchmark band = [0, benchmark] (semantic "background")
    3. Solid bar = actual value (RAIZ_ORANGE if at/below target depending on
       direction; STATUS_SUCCESS if exceeds target)
    4. Vertical black tick = target
"""
from __future__ import annotations

import io
from typing import Any, Dict, List

import matplotlib.pyplot as plt

from ..raiz_tokens import (
    FG_MUTED,
    FG_PRIMARY,
    RAIZ_TEAL_LIGHT,
    SIDEBAR,
    STATUS_DANGER,
    STATUS_SUCCESS,
)
from .base import ChartBase, ChartSpec


class BulletChart(ChartBase):
    SUPPORTED_TYPES = ["bullet"]
    REQUIRED_FIELDS = ["metric", "actual", "target"]

    def render(self, spec: ChartSpec) -> bytes:
        fmt = spec.format
        rows = self._normalize(spec.data)

        n = len(rows)
        fig, ax = plt.subplots(figsize=(fmt.figsize[0], 0.9 * n + 1.2))

        bar_h = 0.55
        for i, row in enumerate(rows):
            y = n - 1 - i  # top-to-bottom
            scale_max = float(row["scale_max"])
            actual = float(row["actual"])
            target = float(row["target"])
            benchmark = row.get("benchmark")
            lower_is_better = bool(row.get("lower_is_better", False))

            # 1) Background (scale)
            ax.barh(y, scale_max, height=bar_h * 1.4, color="#F1F4F8",
                    edgecolor="none")
            # 2) Benchmark band (light teal) — half-height behind actual bar
            if benchmark is not None:
                ax.barh(y, float(benchmark), height=bar_h * 0.95,
                        color=RAIZ_TEAL_LIGHT, edgecolor="none")
            # 3) Actual bar — color depends on hit
            on_target = (actual <= target) if lower_is_better else (actual >= target)
            actual_color = STATUS_SUCCESS if on_target else STATUS_DANGER
            ax.barh(y, actual, height=bar_h, color=actual_color,
                    edgecolor="none")
            # 4) Target tick
            ax.plot([target, target], [y - bar_h * 0.55, y + bar_h * 0.55],
                    color=SIDEBAR, linewidth=2.4)

            # Inline value labels (right of actual)
            label_x = max(actual, target) + scale_max * 0.02
            label = self._format_value(actual, fmt.value_format)
            tgt = self._format_value(target, fmt.value_format)
            ax.text(label_x, y,
                    f"{label}  ·  alvo {tgt}",
                    va="center", ha="left",
                    fontsize=9, color=FG_PRIMARY)

        ax.set_yticks(range(n))
        ax.set_yticklabels([row["metric"] for row in reversed(rows)])
        ax.set_xlim(left=0)
        ax.spines["left"].set_visible(False)
        ax.tick_params(axis="y", colors=FG_PRIMARY)
        ax.grid(axis="y", visible=False)

        if fmt.x_label:
            ax.set_xlabel(fmt.x_label)

        return _figure_to_png(fig)

    @staticmethod
    def _normalize(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        out = []
        for item in data:
            row = dict(item)
            scale_max = row.get("scale_max")
            if scale_max is None:
                # Fallback: 1.25× max of (actual, target, benchmark)
                cands = [row["actual"], row["target"]]
                if row.get("benchmark") is not None:
                    cands.append(row["benchmark"])
                scale_max = max(cands) * 1.25
            row["scale_max"] = float(scale_max)
            out.append(row)
        return out

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


__all__ = ["BulletChart"]
