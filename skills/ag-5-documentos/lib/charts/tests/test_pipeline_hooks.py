"""Tests for chart pipeline integration hooks (PR-F).

Covers:
    - viz_spec_to_chart_spec: maps VizSpec -> ChartSpec when kind in registry
    - compute_chart_region: returns valid SlideRegion
    - iter_chart_slides: yields only slides with chart-typed viz
    - ChartInsightGenerator: regex fallback (LLM call mocked off)
"""
from __future__ import annotations

import sys
from pathlib import Path

_PKG_ROOT = Path(__file__).resolve().parents[3]
if str(_PKG_ROOT) not in sys.path:
    sys.path.insert(0, str(_PKG_ROOT))

from lib.charts.base import ChartFormat, ChartSpec  # noqa: E402
from lib.charts.insight import (  # noqa: E402
    ChartInsightGenerator,
    EMIT_CHART_INSIGHT_TOOL,
    _extract_title_fallback,
)
from lib.charts.pipeline_hooks import (  # noqa: E402
    compute_chart_region,
    iter_chart_slides,
    viz_spec_to_chart_spec,
)
from lib.visualization import VizSpec  # noqa: E402


# ---------------------------------------------------------------------------
# viz_spec_to_chart_spec
# ---------------------------------------------------------------------------
def test_viz_to_chart_spec_returns_none_when_kind_not_in_registry():
    viz = VizSpec(kind="bullet_list", rationale="x", confidence=0.5)
    out = viz_spec_to_chart_spec(viz, {"message": "x", "title": "x"})
    assert out is None


def test_viz_to_chart_spec_returns_chart_spec_for_bar_kind():
    viz = VizSpec(
        kind="bar",
        rationale="numeric comparison",
        confidence=0.85,
        data_input={"data": [
            {"label": "A", "value": 10},
            {"label": "B", "value": 20},
        ]},
    )
    item = {
        "title": "Receita cresceu 25% pressionando margem",
        "message": "x",
        "source": "PBI_RAIZ",
    }
    out = viz_spec_to_chart_spec(viz, item)
    assert out is not None
    assert out.type == "bar"
    assert out.action_title == "Receita cresceu 25% pressionando margem"
    assert out.source == "PBI_RAIZ"
    assert len(out.data) == 2


def test_viz_to_chart_spec_uses_chart_data_when_present():
    viz = VizSpec(kind="bar", rationale="x", confidence=0.5, data_input={})
    item = {
        "title": "Receita cresceu 25% pressionando margem",
        "chart_data": [{"label": "A", "value": 5}],
    }
    out = viz_spec_to_chart_spec(viz, item)
    assert out is not None
    assert out.data == [{"label": "A", "value": 5}]


def test_viz_to_chart_spec_returns_none_for_none_input():
    assert viz_spec_to_chart_spec(None, {}) is None


# ---------------------------------------------------------------------------
# compute_chart_region
# ---------------------------------------------------------------------------
def test_compute_chart_region_returns_positive_emu_dimensions():
    region = compute_chart_region({"slide_n": 3})
    assert region.x > 0
    assert region.y > 0
    assert region.width > 0
    assert region.height > 0


# ---------------------------------------------------------------------------
# iter_chart_slides
# ---------------------------------------------------------------------------
def test_iter_chart_slides_yields_only_chart_kind_slides():
    outline = [
        {"slide_n": 1, "title": "x cresceu 10% pressionando y", "viz": VizSpec(
            kind="hero_number", rationale="x", confidence=1.0)},
        {"slide_n": 2, "title": "Receita cresceu 25% pressionando margem",
         "viz": VizSpec(kind="bar", rationale="x", confidence=0.8,
                        data_input={"data": [{"label": "A", "value": 1}]})},
        {"slide_n": 3, "title": "y", "viz": VizSpec(
            kind="bullet_list", rationale="x", confidence=0.2)},
        {"slide_n": 4, "title": "Margem subiu 4pp pressionando custos",
         "viz": VizSpec(kind="line", rationale="x", confidence=0.7,
                        data_input={"data": [{"date": "Q1", "value": 100}]})},
    ]
    yielded = list(iter_chart_slides(outline))
    indices = [idx for idx, _, _ in yielded]
    assert indices == [1, 3]
    types = [spec.type for _, _, spec in yielded]
    assert types == ["bar", "line"]


def test_iter_chart_slides_handles_empty_outline():
    assert list(iter_chart_slides([])) == []
    assert list(iter_chart_slides(None)) == []


# ---------------------------------------------------------------------------
# ChartInsightGenerator — regex fallback
# ---------------------------------------------------------------------------
def test_extract_title_fallback_returns_existing_action_title():
    spec = ChartSpec(
        type="bar",
        action_title="Receita cresceu 25% pressionando margem",
        data=[{"label": "A", "value": 1}],
    )
    out = _extract_title_fallback(spec)
    assert out == "Receita cresceu 25% pressionando margem"


def test_extract_title_fallback_waterfall_picks_biggest_delta():
    spec = ChartSpec(
        type="waterfall",
        action_title="",  # missing -> fallback fires
        data=[
            {"label": "Volume", "value": 100, "type": "positive"},
            {"label": "Mix",    "value": -300, "type": "negative"},
            {"label": "Preco",  "value": 50,  "type": "positive"},
        ],
    )
    out = _extract_title_fallback(spec)
    assert "Mix" in out  # biggest absolute delta


def test_extract_title_fallback_bar_picks_top():
    spec = ChartSpec(
        type="bar",
        action_title="",
        data=[
            {"label": "A", "value": 10},
            {"label": "B", "value": 50},
            {"label": "C", "value": 30},
        ],
    )
    out = _extract_title_fallback(spec)
    assert "B" in out  # top by value


def test_extract_title_fallback_line_computes_pct_change():
    spec = ChartSpec(
        type="line",
        action_title="",
        data=[
            {"date": "Q1", "value": 100},
            {"date": "Q2", "value": 125},
        ],
    )
    out = _extract_title_fallback(spec)
    assert "25" in out  # 25% change


def test_extract_title_fallback_unknown_type_returns_revisar():
    spec = ChartSpec(
        type="unknown_type",
        action_title="",
        data=[{"foo": 1}],
    )
    out = _extract_title_fallback(spec)
    assert "REVISAR" in out


def test_insight_generator_falls_back_when_insight_auto_false(tmp_path):
    spec = ChartSpec(
        type="bar",
        action_title="Receita cresceu 25% pressionando margem",
        data=[{"label": "A", "value": 10}],
        insight_auto=False,  # disabled -> always fallback
    )
    gen = ChartInsightGenerator(cache_dir=tmp_path)
    out = gen.generate(spec)
    assert out.action_title == "Receita cresceu 25% pressionando margem"
    assert out.from_llm is False
    assert out.from_cache is False
    assert out.spec_hash != ""


def test_insight_generator_cache_roundtrip(tmp_path):
    spec = ChartSpec(
        type="bar",
        action_title="Receita cresceu 25% pressionando margem",
        data=[{"label": "A", "value": 10}],
        insight_auto=False,
    )
    gen = ChartInsightGenerator(cache_dir=tmp_path)
    h = gen._spec_hash(spec)
    payload = {"action_title": "FROM CACHE", "takeaway_bar": "cached"}
    gen._write_cache(h, payload)
    out = gen.generate(spec)
    assert out.from_cache is True
    assert out.action_title == "FROM CACHE"


def test_emit_chart_insight_tool_schema_has_required_fields():
    schema = EMIT_CHART_INSIGHT_TOOL["input_schema"]
    assert "action_title" in schema["properties"]
    assert "takeaway_bar" in schema["properties"]
    assert "action_title" in schema["required"]
    assert "takeaway_bar" in schema["required"]
