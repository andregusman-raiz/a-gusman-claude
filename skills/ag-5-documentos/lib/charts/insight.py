"""ChartInsightGenerator — auto-generates action_title + takeaway_bar via LLM.

SPEC `~/Claude/docs/specs/ag-5-documentos-graficos-ceo/SPEC.md` (Etapa 5).

Pipeline:
  1) Hash spec (type + data + deck_section) for cache lookup.
  2) Cache hit (TTL 7 days) -> return cached payload.
  3) Cache miss + Anthropic SDK available + insight_auto=True -> call API.
  4) Anthropic SDK unavailable / network error / insight_auto=False
     -> regex fallback (_extract_title_fallback).

Cache file: ~/.cache/ag5-chart-insights/{hash}.json
Tool name (Claude API): emit_chart_insight
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

from .base import ChartSpec


CACHE_DIR = Path.home() / ".cache" / "ag5-chart-insights"
CACHE_TTL_SECONDS = 7 * 24 * 3600

EMIT_CHART_INSIGHT_TOOL = {
    "name": "emit_chart_insight",
    "description": (
        "Gera action_title McKinsey-grade e takeaway_bar para um slide com "
        "grafico. Formula: [Conclusao direta] + [numero quantificado] + "
        "[implicacao de acao]. Exemplo: 'Inadimplencia subiu 4,2pp em 12 "
        "meses pressionando R$ 2,3M em risco imediato'."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "action_title": {
                "type": "string",
                "description": (
                    "Max 12-14 palavras. Obrigatorio numero quantificado. "
                    "Conclusao direta + numero + implicacao."
                ),
            },
            "takeaway_bar": {
                "type": "string",
                "description": "1 frase, max 20 palavras. Sintese 5-segundos.",
            },
            "source": {
                "type": "string",
                "description": "Ex: 'PBI_RAIZ / TOTVS RM, Abr-2026'.",
            },
        },
        "required": ["action_title", "takeaway_bar"],
    },
}


@dataclass
class InsightResult:
    """Container for the generated insight + provenance."""
    action_title: str
    takeaway_bar: str
    source: Optional[str] = None
    from_cache: bool = False
    from_llm: bool = False
    spec_hash: str = ""


class ChartInsightGenerator:
    """Generates insights for ChartSpec via Anthropic + cache + regex fallback."""

    def __init__(
        self,
        *,
        cache_dir: Optional[Path] = None,
        ttl_seconds: int = CACHE_TTL_SECONDS,
        model: str = "claude-sonnet-4-6",
    ):
        self.cache_dir = cache_dir or CACHE_DIR
        self.ttl_seconds = ttl_seconds
        self.model = model
        try:
            self.cache_dir.mkdir(parents=True, exist_ok=True)
        except OSError:
            pass

    # -----------------------------------------------------------------------
    # Public API
    # -----------------------------------------------------------------------
    def generate(self, spec: ChartSpec, *, audience: str = "C-level") -> InsightResult:
        """Returns InsightResult — never raises (always falls back gracefully)."""
        spec_hash = self._spec_hash(spec)

        # 1) Cache lookup
        cached = self._read_cache(spec_hash)
        if cached is not None:
            return InsightResult(
                action_title=cached.get("action_title", ""),
                takeaway_bar=cached.get("takeaway_bar", ""),
                source=cached.get("source"),
                from_cache=True,
                spec_hash=spec_hash,
            )

        # 2) LLM call when insight_auto=True
        if spec.insight_auto:
            llm_result = self._call_anthropic(spec, audience=audience)
            if llm_result is not None:
                self._write_cache(spec_hash, llm_result)
                return InsightResult(
                    action_title=llm_result.get("action_title", ""),
                    takeaway_bar=llm_result.get("takeaway_bar", ""),
                    source=llm_result.get("source"),
                    from_llm=True,
                    spec_hash=spec_hash,
                )

        # 3) Fallback regex
        fb_title = _extract_title_fallback(spec)
        return InsightResult(
            action_title=fb_title,
            takeaway_bar=spec.takeaway_bar or "",
            source=spec.source,
            spec_hash=spec_hash,
        )

    # -----------------------------------------------------------------------
    # Cache
    # -----------------------------------------------------------------------
    def _read_cache(self, spec_hash: str) -> Optional[Dict[str, Any]]:
        path = self.cache_dir / f"{spec_hash}.json"
        if not path.exists():
            return None
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return None
        ts = float(payload.get("_ts", 0))
        if time.time() - ts > self.ttl_seconds:
            return None
        return payload.get("data")

    def _write_cache(self, spec_hash: str, data: Dict[str, Any]) -> None:
        path = self.cache_dir / f"{spec_hash}.json"
        try:
            path.write_text(
                json.dumps({"_ts": time.time(), "data": data},
                           ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
        except OSError:
            pass

    # -----------------------------------------------------------------------
    # Spec hash
    # -----------------------------------------------------------------------
    @staticmethod
    def _spec_hash(spec: ChartSpec) -> str:
        payload = json.dumps(
            {
                "type": spec.type,
                "data": spec.data,
                "deck_section": spec.deck_section,
            },
            sort_keys=True, ensure_ascii=False, default=str,
        )
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:16]

    # -----------------------------------------------------------------------
    # Anthropic call (best-effort, non-fatal)
    # -----------------------------------------------------------------------
    def _call_anthropic(
        self, spec: ChartSpec, *, audience: str
    ) -> Optional[Dict[str, Any]]:
        try:
            import anthropic  # type: ignore
        except ImportError:
            return None
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            return None

        try:
            client = anthropic.Anthropic(api_key=api_key)
            data_summary = _summarize_data(spec.data, max_points=5)
            prompt = (
                f"DADOS DO GRAFICO:\n"
                f"- Tipo: {spec.type}\n"
                f"- Dados: {data_summary}\n"
                f"- Contexto: {spec.deck_section or 'N/A'} / "
                f"slide {spec.slide_n or 'N/A'}\n"
                f"- Audiencia: {audience}\n\n"
                f"TASK: Chame emit_chart_insight com action_title (formula "
                f"Conclusao + Numero + Implicacao), takeaway_bar (max 20 "
                f"palavras), source."
            )
            resp = client.messages.create(
                model=self.model,
                max_tokens=400,
                tools=[EMIT_CHART_INSIGHT_TOOL],
                tool_choice={"type": "tool", "name": "emit_chart_insight"},
                messages=[{"role": "user", "content": prompt}],
            )
            for block in getattr(resp, "content", []) or []:
                if getattr(block, "type", None) == "tool_use":
                    return dict(getattr(block, "input", {}) or {})
        except Exception:  # pragma: no cover — network/api errors
            return None
        return None


# ---------------------------------------------------------------------------
# Regex fallback
# ---------------------------------------------------------------------------
def _extract_title_fallback(spec: ChartSpec) -> str:
    """Returns spec.action_title if non-empty; else type-specific stub."""
    title = (spec.action_title or "").strip()
    if title:
        return title

    t = spec.type
    data = spec.data or []

    if t in ("waterfall",) and data:
        deltas = [
            (str(item.get("label")), float(item.get("value", 0)))
            for item in data if isinstance(item, dict)
            and item.get("type") in ("positive", "negative")
        ]
        if deltas:
            biggest = max(deltas, key=lambda d: abs(d[1]))
            sign = "+" if biggest[1] >= 0 else ""
            return f"{biggest[0]} contribui {sign}{biggest[1]:.0f} no resultado total"

    if t in ("bar", "bar_chart") and data:
        sorted_pts = sorted(
            ((str(d.get("label")), float(d.get("value", 0)))
             for d in data if isinstance(d, dict)),
            key=lambda x: x[1],
            reverse=True,
        )
        if sorted_pts:
            top = sorted_pts[0]
            return f"{top[0]} lidera com valor {top[1]:.0f}"

    if t in ("line", "area") and data:
        first = data[0] if isinstance(data[0], dict) else {}
        last = data[-1] if isinstance(data[-1], dict) else {}
        try:
            v0 = float(first.get("value", 0))
            v1 = float(last.get("value", 0))
            pct = ((v1 - v0) / v0 * 100) if v0 else 0
            return f"Indicador variou {pct:+.1f}% no periodo"
        except (TypeError, ValueError):
            pass

    return f"[REVISAR] action_title pendente para grafico {t}"


def _summarize_data(data: List[Dict[str, Any]], *, max_points: int = 5) -> str:
    """Compress data list to a string (avoid blowing up token count)."""
    if not data:
        return "[]"
    if len(data) <= max_points:
        return json.dumps(data, ensure_ascii=False, default=str)
    head = data[: max_points - 1]
    return (
        json.dumps(head, ensure_ascii=False, default=str)
        + f" ... (+{len(data) - len(head)} more)"
    )


__all__ = [
    "ChartInsightGenerator",
    "InsightResult",
    "EMIT_CHART_INSIGHT_TOOL",
    "_extract_title_fallback",
]
