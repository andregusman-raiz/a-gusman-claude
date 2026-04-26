"""WaterfallChart — C11 P&L bridge / variation cascade.

Data shape:
    [
        {"label": "Receita 2024", "value": 1000, "type": "subtotal"},
        {"label": "Volume",       "value":  +120, "type": "positive"},
        {"label": "Mix",          "value":  -80,  "type": "negative"},
        {"label": "Receita 2025", "value": 1040, "type": "total"},
    ]

Color scheme (canonical):
    positive  → RAIZ_TEAL        (#5BB5A2)
    negative  → STATUS_DANGER    (#DC3545)
    subtotal  → FG_MUTED         (#718096)
    total     → SIDEBAR          (#1E2433)

Connectors between bars: FG_MUTED at alpha=0.5.

Validators:
    AP05 (waterfall_missing_total) is enforced by ChartSpecValidator V13/AP05; we
    additionally accept missing total but emit a warning via subclass validate().
"""
from __future__ import annotations

import io
from typing import Any, Dict, List

import matplotlib.pyplot as plt

from ..raiz_tokens import (
    FG_MUTED,
    FG_PRIMARY,
    RAIZ_TEAL,
    SIDEBAR,
    STATUS_DANGER,
)
from .base import ChartBase, ChartSpec


_TYPE_COLORS = {
    "positive": RAIZ_TEAL,
    "negative": STATUS_DANGER,
    "subtotal": FG_MUTED,
    "total":    SIDEBAR,
}


class WaterfallChart(ChartBase):
    SUPPORTED_TYPES = ["waterfall"]
    REQUIRED_FIELDS = ["label", "value", "type"]

    def render(self, spec: ChartSpec) -> bytes:
        fmt = spec.format
        steps = self._normalize(spec.data)

        fig, ax = plt.subplots(figsize=fmt.figsize)
        running = 0.0
        bars_meta: List[Dict[str, Any]] = []

        for idx, step in enumerate(steps):
            label = step["label"]
            value = float(step["value"])
            kind = step["type"]
            color = _TYPE_COLORS.get(kind, FG_MUTED)

            if kind in ("subtotal", "total"):
                bottom = 0.0
                top = value
                running = value
            elif kind == "positive":
                bottom = running
                top = running + value
                running = top
            else:  # negative
                bottom = running + value  # value is negative
                top = running
                running = bottom

            bar_height = top - bottom
            ax.bar(
                idx, bar_height, bottom=bottom,
                color=color, edgecolor="none", width=0.62,
            )
            bars_meta.append({
                "idx": idx, "bottom": bottom, "top": top,
                "value": value, "kind": kind,
            })

            # Value label above bar (or below for negative below baseline)
            if fmt.show_values:
                try:
                    txt = fmt.value_format.format(value)
                except (KeyError, IndexError, ValueError):
                    txt = f"{value:g}"
                if kind == "negative":
                    txt = f"-{fmt.value_format.format(abs(value))}" \
                        if "{" in fmt.value_format else f"-{abs(value):g}"
                y_anchor = max(top, bottom) + abs(top - bottom) * 0.04
                ax.text(idx, y_anchor, txt,
                        ha="center", va="bottom",
                        fontsize=9, color=FG_PRIMARY)

        # Connectors between consecutive bars
        for i in range(len(bars_meta) - 1):
            curr = bars_meta[i]
            nxt = bars_meta[i + 1]
            # Skip connector between an event and a subtotal/total — total
            # is a fresh bar from 0; line goes from current top to total top.
            if nxt["kind"] in ("subtotal", "total"):
                y = nxt["top"] if curr["top"] >= curr["bottom"] else curr["bottom"]
                y = curr["top"] if curr["kind"] != "negative" else curr["bottom"]
            else:
                y = curr["top"] if curr["kind"] != "negative" else curr["bottom"]
            ax.plot(
                [curr["idx"] + 0.31, nxt["idx"] - 0.31],
                [y, y],
                color=FG_MUTED, alpha=0.5, linewidth=1.0, linestyle="--",
            )

        ax.set_xticks(range(len(steps)))
        ax.set_xticklabels([s["label"] for s in steps], rotation=20, ha="right")
        if fmt.y_label:
            ax.set_ylabel(fmt.y_label)
        if fmt.zero_baseline:
            ax.set_ylim(bottom=0)

        ax.grid(axis="x", visible=False)

        return _figure_to_png(fig)

    def validate(self, spec: ChartSpec) -> List[str]:
        errors = super().validate(spec)
        # Type-level check: at least 1 total/subtotal expected (AP05 hint)
        types_seen = {item.get("type") for item in spec.data
                      if isinstance(item, dict)}
        if not (types_seen & {"total", "subtotal"}):
            errors.append(
                "waterfall: AP05 anti-pattern — no 'total' or 'subtotal' bar "
                "found; add a final closing bar"
            )
        return errors

    @staticmethod
    def _normalize(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        out = []
        for item in data:
            t = item.get("type", "positive")
            if t not in _TYPE_COLORS:
                t = "positive"
            out.append({
                "label": str(item["label"]),
                "value": float(item["value"]),
                "type": t,
            })
        return out


def _figure_to_png(fig) -> bytes:
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    plt.close(fig)
    buf.seek(0)
    return buf.read()


__all__ = ["WaterfallChart"]
