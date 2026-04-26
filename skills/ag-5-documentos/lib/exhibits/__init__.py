"""Biblioteca de exhibits canonicos McKinsey-grade (P1.1).

Cada modulo exporta uma funcao `render(slide, spec, brand=None)` que recebe:
  - slide: pptx.slide.Slide (alvo de renderizacao)
  - spec:  dict com inputs especificos do exhibit
  - brand: Brand (palette_overrides), opcional

Tipos disponiveis (10):
  - matrix_2x2          — Classificacao 2 dimensoes
  - timeline_horizontal — Marcos sequenciais (re-export do timeline_charts)
  - hero_number         — Numero gigante 60-100pt + tese
  - quote_slide         — Citacao editorial
  - decision_slide      — Pergunta + 2-3 opcoes com trade-offs
  - process_flow        — Etapas com setas
  - risk_heatmap        — Matriz risco x impacto
  - bar_chart_comparison — Bar chart 2-5 segmentos (re-export)
  - stack_hierarchy     — Stack vertical com N camadas
  - before_after_arrow  — 2 estados com seta dominante e delta

Cada exhibit tambem expoe `EXAMPLE_INPUT` para documentacao e tests.
"""
from .bar_chart_comparison import render as render_bar_chart_comparison, EXAMPLE_INPUT as BAR_EXAMPLE
from .before_after_arrow import render as render_before_after_arrow, EXAMPLE_INPUT as BA_EXAMPLE
from .decision_slide import render as render_decision_slide, EXAMPLE_INPUT as DEC_EXAMPLE
from .hero_number import render as render_hero_number, EXAMPLE_INPUT as HERO_EXAMPLE
from .matrix_2x2 import render as render_matrix_2x2, EXAMPLE_INPUT as MATRIX_EXAMPLE
from .process_flow import render as render_process_flow, EXAMPLE_INPUT as FLOW_EXAMPLE
from .quote_slide import render as render_quote_slide, EXAMPLE_INPUT as QUOTE_EXAMPLE
from .risk_heatmap import render as render_risk_heatmap, EXAMPLE_INPUT as RISK_EXAMPLE
from .stack_hierarchy import render as render_stack_hierarchy, EXAMPLE_INPUT as STACK_EXAMPLE
from .timeline_horizontal import render as render_timeline_horizontal, EXAMPLE_INPUT as TIMELINE_EXAMPLE


# Mapa kind -> render fn (usado por pipeline.py)
RENDER_REGISTRY = {
    "bar_chart_comparison":  render_bar_chart_comparison,
    "before_after_arrow":    render_before_after_arrow,
    "decision_slide":        render_decision_slide,
    "hero_number":           render_hero_number,
    "matrix_2x2":            render_matrix_2x2,
    "process_flow":          render_process_flow,
    "quote_slide":           render_quote_slide,
    "risk_heatmap":          render_risk_heatmap,
    "stack_hierarchy":       render_stack_hierarchy,
    "timeline_horizontal":   render_timeline_horizontal,
}

EXAMPLE_INPUTS = {
    "bar_chart_comparison":  BAR_EXAMPLE,
    "before_after_arrow":    BA_EXAMPLE,
    "decision_slide":        DEC_EXAMPLE,
    "hero_number":           HERO_EXAMPLE,
    "matrix_2x2":            MATRIX_EXAMPLE,
    "process_flow":          FLOW_EXAMPLE,
    "quote_slide":           QUOTE_EXAMPLE,
    "risk_heatmap":          RISK_EXAMPLE,
    "stack_hierarchy":       STACK_EXAMPLE,
    "timeline_horizontal":   TIMELINE_EXAMPLE,
}


__all__ = [
    "RENDER_REGISTRY",
    "EXAMPLE_INPUTS",
    "render_bar_chart_comparison",
    "render_before_after_arrow",
    "render_decision_slide",
    "render_hero_number",
    "render_matrix_2x2",
    "render_process_flow",
    "render_quote_slide",
    "render_risk_heatmap",
    "render_stack_hierarchy",
    "render_timeline_horizontal",
]
