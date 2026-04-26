"""ChartBuilder — orchestrator for spec → bytes (and optionally → slide).

Pipeline:
  1) Look up spec.type in CHART_REGISTRY.
  2) Run V01..V13 via ChartSpecValidator on spec.to_dict().
     - Bloqueante errors raise ChartBuildError.
     - Non-bloqueante errors are returned as warnings.
  3) Run subclass-level validate(spec) for type-specific checks.
  4) render(spec) -> bytes.
  5) (optional) embed_chart_in_slide() to inject into a pptx slide.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional, Tuple

from ..chart_validator import ChartSpecValidator
from .base import ChartBase, ChartSpec, SlideRegion


class ChartBuildError(Exception):
    """Raised when a chart cannot be built (bloqueante validation errors)."""

    def __init__(self, message: str, codes: Optional[List[str]] = None):
        super().__init__(message)
        self.codes = codes or []


@dataclass
class BuildResult:
    png_bytes: bytes
    warnings: List[str] = field(default_factory=list)


class ChartBuilder:
    """Stateless orchestrator: spec → PNG bytes (+ optional slide embed)."""

    def __init__(self, registry=None):
        # Late import to avoid circular dependency at module load.
        if registry is None:
            from . import CHART_REGISTRY
            registry = CHART_REGISTRY
        self._registry = registry

    # -----------------------------------------------------------------------
    # Public API
    # -----------------------------------------------------------------------
    def build(self, spec: ChartSpec) -> BuildResult:
        chart_cls, blocking, warnings = self._validate(spec)
        if blocking:
            raise ChartBuildError(
                "Chart build blocked by validation errors: "
                + "; ".join(blocking),
                codes=[c.split(":", 1)[0] for c in blocking],
            )
        chart = chart_cls()
        sub_errors = chart.validate(spec)
        if sub_errors:
            raise ChartBuildError(
                "Chart subclass validation failed: " + "; ".join(sub_errors)
            )
        png = chart.render(spec)
        return BuildResult(png_bytes=png, warnings=warnings)

    def build_and_embed(
        self,
        spec: ChartSpec,
        slide,
        region: SlideRegion,
        *,
        brand=None,
    ) -> BuildResult:
        result = self.build(spec)
        # Late import — embed pulls in python-pptx helpers
        from .embed import embed_chart_in_slide
        embed_chart_in_slide(
            slide=slide,
            png_bytes=result.png_bytes,
            region=region,
            action_title=spec.action_title or None,
            takeaway_bar=spec.takeaway_bar,
            source=spec.source,
            brand=brand,
        )
        return result

    # -----------------------------------------------------------------------
    # Internals
    # -----------------------------------------------------------------------
    def _validate(
        self, spec: ChartSpec
    ) -> Tuple[type, List[str], List[str]]:
        """Returns (chart_cls, blocking_messages, non_blocking_warnings)."""
        chart_cls = self._registry.get(spec.type)
        if chart_cls is None:
            return type(None), [f"V01: type {spec.type!r} not in CHART_REGISTRY"], []

        validator = ChartSpecValidator(spec.to_dict())
        errors = validator.validate()
        blocking: List[str] = []
        warnings: List[str] = []
        for err in errors:
            line = f"{err.code}: {err.message}"
            if err.bloqueante:
                blocking.append(line)
            else:
                warnings.append(line)
        return chart_cls, blocking, warnings


__all__ = ["ChartBuilder", "ChartBuildError", "BuildResult"]
