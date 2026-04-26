"""Base classes and shared types for the chart subsystem.

- ChartSpec: input contract for any chart (type + data + format + metadata).
- ChartFormat: visual config (labels, palette, sort, highlight, etc.).
- SlideRegion: target rectangle inside a slide (EMU coords).
- ChartBase: abstract base class — every chart type subclasses this.

Sets matplotlib rcParams once at import time (Agg backend, Montserrat fallback chain).
Defines CHART_PALETTE_* constants from `raiz_tokens` — zero hex hardcoded here.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

# Headless backend MUST be set before pyplot is imported anywhere in the process.
import matplotlib as _mpl
_mpl.use("Agg")
import matplotlib.pyplot as _plt  # noqa: E402,F401  — re-export point

from ..raiz_tokens import (
    BG_LIGHT,
    FG_MUTED,
    FG_PRIMARY,
    FONT_BODY,
    RAIZ_ORANGE,
    RAIZ_ORANGE_LIGHT,
    RAIZ_TEAL,
    RAIZ_TEAL_DARK,
    RAIZ_TEAL_LIGHT,
    SIDEBAR,
    STATUS_DANGER,
    STATUS_SUCCESS,
)


# ---------------------------------------------------------------------------
# Canonical chart palettes (extracted from raiz_tokens — NO hex hardcoded)
# ---------------------------------------------------------------------------
CHART_PALETTE_CATEGORICAL: List[str] = [
    RAIZ_ORANGE,        # primary highlight
    RAIZ_TEAL,          # secondary highlight
    SIDEBAR,            # tertiary neutral dark
    RAIZ_ORANGE_LIGHT,  # quaternary soft fill
    FG_MUTED,           # quinary neutral grey
]
CHART_PALETTE_DIVERGING: List[str] = [STATUS_DANGER, BG_LIGHT, STATUS_SUCCESS]
CHART_PALETTE_SEQUENTIAL: List[str] = [RAIZ_TEAL_LIGHT, RAIZ_TEAL, RAIZ_TEAL_DARK]


# ---------------------------------------------------------------------------
# matplotlib rcParams — Montserrat fallback chain + sizes from FONT_SIZE
# ---------------------------------------------------------------------------
_mpl.rcParams.update({
    "font.family": "sans-serif",
    "font.sans-serif": [FONT_BODY, "Helvetica Neue", "Arial", "DejaVu Sans"],
    "font.size": 11,
    "axes.titlesize": 14,
    "axes.labelsize": 11,
    "xtick.labelsize": 9,
    "ytick.labelsize": 9,
    "legend.fontsize": 9,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "axes.edgecolor": FG_MUTED,
    "axes.labelcolor": FG_PRIMARY,
    "xtick.color": FG_MUTED,
    "ytick.color": FG_MUTED,
    "axes.grid": True,
    "grid.color": BG_LIGHT,
    "grid.linestyle": "-",
    "grid.linewidth": 0.5,
    "figure.facecolor": "white",
    "axes.facecolor": "white",
    "savefig.dpi": 200,
    "savefig.bbox": "tight",
    "savefig.facecolor": "white",
})


# ---------------------------------------------------------------------------
# Spec + format dataclasses
# ---------------------------------------------------------------------------
@dataclass
class ChartFormat:
    """Visual configuration for a chart render."""
    x_label: Optional[str] = None
    y_label: Optional[str] = None
    y2_label: Optional[str] = None  # combo/dual-axis only
    value_format: str = "{:,.0f}"
    sort: Optional[str] = None  # "asc" | "desc" | None
    highlight: Optional[List[str]] = None
    palette: str = "categorical"  # categorical | diverging | sequential
    zero_baseline: bool = True
    show_values: bool = True
    annotation: Optional[str] = None
    figsize: Tuple[float, float] = (12.0, 5.5)  # inches at dpi=200 -> ~2400x1100 px


@dataclass
class ChartSpec:
    """Input contract for any chart in CHART_REGISTRY."""
    type: str
    action_title: str = ""
    subtitle: Optional[str] = None
    takeaway_bar: Optional[str] = None
    source: Optional[str] = None
    data: List[Dict[str, Any]] = field(default_factory=list)
    format: ChartFormat = field(default_factory=ChartFormat)
    anti_patterns_check: bool = True
    insight_auto: bool = False
    slide_n: Optional[int] = None
    deck_section: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Flatten to dict — used by ChartSpecValidator (which expects dict)."""
        fmt = self.format
        return {
            "type": self.type,
            "data": self.data,
            "action_title": self.action_title,
            "subtitle": self.subtitle,
            "takeaway_bar": self.takeaway_bar,
            "source": self.source,
            "palette": fmt.palette,
            "format": {
                "x_label": fmt.x_label,
                "y_label": fmt.y_label,
                "y2_label": fmt.y2_label,
                "value_format": fmt.value_format,
                "sort": fmt.sort,
                "highlight": fmt.highlight or [],
                "zero_baseline": fmt.zero_baseline,
                "show_values": fmt.show_values,
                "annotation": fmt.annotation,
            },
        }


@dataclass
class SlideRegion:
    """Target rectangle inside a slide, in EMU (English Metric Units).

    pptx uses EMU internally (914400 EMU = 1 inch). Helpers in mckinsey_pptx
    return EMU values via `Inches(...)`.
    """
    x: int
    y: int
    width: int
    height: int


# ---------------------------------------------------------------------------
# Palette resolver
# ---------------------------------------------------------------------------
def palette_colors(name: str) -> List[str]:
    """Resolve a palette name to a list of hex colors."""
    if name == "diverging":
        return CHART_PALETTE_DIVERGING
    if name == "sequential":
        return CHART_PALETTE_SEQUENTIAL
    return CHART_PALETTE_CATEGORICAL


# ---------------------------------------------------------------------------
# ChartBase ABC
# ---------------------------------------------------------------------------
class ChartBase(ABC):
    """Abstract base for every chart type.

    Subclasses must declare:
        SUPPORTED_TYPES: list[str] — the spec.type values they handle
        REQUIRED_FIELDS: list[str] — the dict keys they require in spec.data items

    Subclasses must implement:
        render(spec) -> bytes  — PNG bytes ready to embed in pptx

    `validate(spec)` is concrete here and provides the basic gates (type match +
    required fields + non-empty data); subclasses can extend by overriding and
    calling super().validate(spec) first.
    """

    SUPPORTED_TYPES: List[str] = []
    REQUIRED_FIELDS: List[str] = []

    def validate(self, spec: ChartSpec) -> List[str]:
        """Returns a list of error messages (empty list = OK)."""
        errors: List[str] = []
        if spec.type not in self.SUPPORTED_TYPES:
            errors.append(
                f"{type(self).__name__} does not support type {spec.type!r}; "
                f"supported: {self.SUPPORTED_TYPES}"
            )
        if not spec.data:
            errors.append("spec.data is empty")
        else:
            for idx, item in enumerate(spec.data):
                if not isinstance(item, dict):
                    errors.append(f"data[{idx}] is not a dict")
                    continue
                missing = [f for f in self.REQUIRED_FIELDS if f not in item]
                if missing:
                    errors.append(
                        f"data[{idx}] missing required fields {missing} for type {spec.type!r}"
                    )
        return errors

    @abstractmethod
    def render(self, spec: ChartSpec) -> bytes:  # pragma: no cover — abstract
        """Render the chart and return PNG bytes."""
        raise NotImplementedError


__all__ = [
    "ChartBase",
    "ChartFormat",
    "ChartSpec",
    "SlideRegion",
    "CHART_PALETTE_CATEGORICAL",
    "CHART_PALETTE_DIVERGING",
    "CHART_PALETTE_SEQUENTIAL",
    "palette_colors",
]
