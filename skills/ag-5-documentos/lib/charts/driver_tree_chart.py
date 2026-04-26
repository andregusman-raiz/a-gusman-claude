"""DriverTreeChart — C17 causal decomposition tree (e.g. ROI = R x M - C).

Data shape (recursive):
    [
        {
            "id": "roi",
            "label": "ROI",
            "value": "12%",
            "children": [
                {
                    "id": "revenue",
                    "label": "Receita",
                    "value": "R$ 100M",
                    "operator": "x",
                    "children": [...]
                },
                {
                    "id": "cost",
                    "label": "Custo",
                    "value": "R$ 88M",
                    "operator": "-",
                    "children": []
                },
            ]
        }
    ]

Implementation:
    - Prefer networkx for layout (hierarchical) when available.
    - Fallback: manual layout (BFS, x = depth, y = vertical spacing).
    - Edges drawn as right-angled connectors (matplotlib lines).
"""
from __future__ import annotations

import io
from typing import Any, Dict, List, Optional, Tuple

import matplotlib.patches as patches
import matplotlib.pyplot as plt

from ..raiz_tokens import (
    BG_LIGHT,
    FG_MUTED,
    FG_PRIMARY,
    RAIZ_ORANGE,
    RAIZ_TEAL,
    SIDEBAR,
)
from .base import ChartBase, ChartSpec


try:  # networkx is optional but widely available
    import networkx as nx  # type: ignore
    _HAS_NETWORKX = True
except ImportError:  # pragma: no cover
    _HAS_NETWORKX = False


class DriverTreeChart(ChartBase):
    SUPPORTED_TYPES = ["driver_tree"]
    REQUIRED_FIELDS = ["label", "value"]

    def render(self, spec: ChartSpec) -> bytes:
        fmt = spec.format
        roots = self._normalize_roots(spec.data)
        if not roots:
            raise ValueError("driver_tree: spec.data has no root node")

        # Single root supported for V1; multi-root would need horizontal stacking
        root = roots[0]
        positions = self._compute_layout(root)
        highlight = set(fmt.highlight or [])

        fig, ax = plt.subplots(figsize=fmt.figsize)
        ax.set_xlim(-0.05, 1.05)
        ax.set_ylim(-0.05, 1.05)
        ax.axis("off")

        # Draw edges first
        self._draw_edges(ax, root, positions)
        # Then nodes
        self._draw_nodes(ax, root, positions, highlight)

        return _figure_to_png(fig)

    # -----------------------------------------------------------------------
    # Layout
    # -----------------------------------------------------------------------
    @staticmethod
    def _normalize_roots(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return [d for d in data if isinstance(d, dict) and "label" in d]

    def _compute_layout(self, root: Dict[str, Any]) -> Dict[str, Tuple[float, float]]:
        """Returns {node_id: (x, y)} in [0..1] coords.

        Layout strategy:
            x = depth / max_depth
            y = vertical spacing within depth tier
        """
        # Collect nodes per depth
        tiers: Dict[int, List[str]] = {}

        def walk(node: Dict[str, Any], depth: int):
            nid = self._node_id(node)
            tiers.setdefault(depth, []).append(nid)
            for child in node.get("children") or []:
                walk(child, depth + 1)

        walk(root, 0)
        max_depth = max(tiers.keys()) if tiers else 0

        positions: Dict[str, Tuple[float, float]] = {}
        for depth, ids in tiers.items():
            x = (depth / max_depth) if max_depth > 0 else 0.5
            n = len(ids)
            for i, nid in enumerate(ids):
                y = (n - 1 - i + 0.5) / n if n > 1 else 0.5
                positions[nid] = (x * 0.85 + 0.07, y)
        return positions

    @staticmethod
    def _node_id(node: Dict[str, Any]) -> str:
        return str(node.get("id") or node.get("label", ""))

    # -----------------------------------------------------------------------
    # Drawing
    # -----------------------------------------------------------------------
    def _draw_edges(self, ax, root: Dict[str, Any],
                    positions: Dict[str, Tuple[float, float]]):
        def walk(node: Dict[str, Any]):
            nid = self._node_id(node)
            x, y = positions[nid]
            for child in node.get("children") or []:
                cid = self._node_id(child)
                cx, cy = positions[cid]
                # Right-angle connector: horizontal then vertical
                mid_x = (x + cx) / 2
                ax.plot([x + 0.06, mid_x], [y, y],
                        color=FG_MUTED, linewidth=1.2, alpha=0.7)
                ax.plot([mid_x, mid_x], [y, cy],
                        color=FG_MUTED, linewidth=1.2, alpha=0.7)
                ax.plot([mid_x, cx - 0.06], [cy, cy],
                        color=FG_MUTED, linewidth=1.2, alpha=0.7)
                walk(child)

        walk(root)

    def _draw_nodes(self, ax, root: Dict[str, Any],
                    positions: Dict[str, Tuple[float, float]],
                    highlight):
        def walk(node: Dict[str, Any], is_root: bool):
            nid = self._node_id(node)
            x, y = positions[nid]
            label = node.get("label", "")
            value = node.get("value", "")

            box_w, box_h = 0.12, 0.10
            bg = (RAIZ_ORANGE if label in highlight
                  else SIDEBAR if is_root
                  else RAIZ_TEAL)
            text_color = "white"

            ax.add_patch(patches.FancyBboxPatch(
                (x - box_w / 2, y - box_h / 2),
                box_w, box_h,
                boxstyle="round,pad=0.005,rounding_size=0.012",
                facecolor=bg, edgecolor="none",
            ))
            ax.text(x, y + 0.012, label,
                    ha="center", va="center",
                    fontsize=10, color=text_color, fontweight="bold")
            ax.text(x, y - 0.022, str(value),
                    ha="center", va="center",
                    fontsize=9, color=text_color)

            for child in node.get("children") or []:
                walk(child, is_root=False)

        walk(root, is_root=True)


def _figure_to_png(fig) -> bytes:
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    plt.close(fig)
    buf.seek(0)
    return buf.read()


__all__ = ["DriverTreeChart"]
