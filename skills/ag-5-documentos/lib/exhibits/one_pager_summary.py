"""One-pager Summary — slide unico com sumario executivo (PR 3.3 item #28).

Layout matriz 2x2:
  - Top-left:  action_title + recomendacao principal (texto)
  - Top-right: ate 3 KPI cards (kpi_card helper)
  - Bottom-left + Bottom-right: span - 3 takeaways em bullets (linha unica horizontal)
  - Footer:    takeaway_bar + source

Usado tipicamente como slide #2 (apos cover), inserido por
`exec_summary_generator.auto_insert_summary()`.

Input spec:
    {
        "action_title":   "Sumario Executivo",
        "recommendation": "Acelerar transicao digital em 2026 com investimento de R$ 50M",
        "kpis": [
            {"label": "Receita 2026", "value": "R$ 520M", "delta": "+18%"},
            {"label": "Margem",       "value": "24%",     "delta": "+3pp"},
            {"label": "NPS",          "value": "72"},
        ],
        "takeaways": [
            "Digital cresce 32% e lidera receita",
            "Servicos mantem margem em 22%",
            "Produtos exigem reposicionamento",
        ],
        "source": "Relatorio Executivo 2026",
    }
"""
from __future__ import annotations

from typing import Optional

from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

from ..mckinsey_pptx import (
    CONTENT_W, MARGIN_L, SLIDE_H, SLIDE_W,
    action_title, add_rect, add_tb, kpi_card, source_line, takeaway_bar,
)
from ..palette_overrides import Brand, get_brand
from ..raiz_tokens import FONT_SIZE


MAX_KPIS = 3
MAX_TAKEAWAYS = 3


EXAMPLE_INPUT = {
    "action_title":   "Sumario Executivo",
    "recommendation": "Acelerar transicao digital em 2026 com investimento de R$ 50M",
    "kpis": [
        {"label": "Receita 2026", "value": "R$ 520M", "delta": "+18%"},
        {"label": "Margem op.",    "value": "24%",    "delta": "+3pp"},
        {"label": "NPS",           "value": "72"},
    ],
    "takeaways": [
        "Digital cresce 32% e lidera receita 2026",
        "Servicos mantem margem em 22% com retencao alta",
        "Produtos exigem reposicionamento ate Q3",
    ],
    "source": "Relatorio Executivo 2026",
}


def _validate(content: dict) -> list[str]:
    errors: list[str] = []
    if not content.get("action_title"):
        errors.append("one_pager_summary: action_title eh obrigatorio")
    if not content.get("recommendation"):
        errors.append("one_pager_summary: recommendation eh obrigatorio")
    if not isinstance(content.get("takeaways"), list):
        errors.append("one_pager_summary: 'takeaways' deve ser lista")
    if not isinstance(content.get("kpis"), list):
        errors.append("one_pager_summary: 'kpis' deve ser lista")
    return errors


def render(slide, content: dict, brand: Optional[Brand] = None) -> None:
    """Renderiza one-pager summary.

    Args:
        slide: pptx.slide.Slide alvo
        content: dict com action_title, recommendation, kpis, takeaways, source
        brand: Brand opcional

    Raises:
        ValueError: se schema invalido
    """
    errors = _validate(content)
    if errors:
        raise ValueError("one_pager_summary content invalido: " + "; ".join(errors))

    b = brand or get_brand()
    recommendation: str = content["recommendation"]
    kpis: list[dict] = content["kpis"][:MAX_KPIS]
    takeaways: list[str] = content["takeaways"][:MAX_TAKEAWAYS]
    source: str = content.get("source", "")

    # Header
    action_title(slide, content["action_title"], brand=b)

    # ---- Top-half: recomendacao (left) + KPIs (right) ----
    top_y = Inches(1.6)
    top_h = Inches(2.4)
    left_w = CONTENT_W * 0.45
    right_w = CONTENT_W - left_w - Inches(0.3)

    # Top-left: recommendation card
    rec_x = MARGIN_L
    add_rect(slide, rec_x, top_y, left_w, top_h,
             fill=b.surface, line=b.border, line_w=Pt(0.75))
    # Top accent strip
    add_rect(slide, rec_x, top_y, left_w, Inches(0.08), fill=b.accent)
    add_tb(slide, rec_x + Inches(0.25), top_y + Inches(0.25),
           left_w - Inches(0.5), Inches(0.3),
           "RECOMENDACAO", size=FONT_SIZE["body_sm"] - 1, bold=True,
           color=b.accent, font=b.font_heading, align=PP_ALIGN.LEFT)
    add_tb(slide, rec_x + Inches(0.25), top_y + Inches(0.65),
           left_w - Inches(0.5), top_h - Inches(0.85),
           recommendation, size=FONT_SIZE["h3"], bold=True,
           color=b.fg_primary, font=b.font_heading,
           align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, line_spacing=1.3)

    # Top-right: KPI cards lado a lado
    if kpis:
        kpi_x_start = MARGIN_L + left_w + Inches(0.3)
        n = len(kpis)
        gap = Inches(0.15)
        kpi_w = (right_w - gap * (n - 1)) / n if n > 1 else right_w
        for i, kpi in enumerate(kpis):
            x = kpi_x_start + i * (kpi_w + gap)
            sublabel = str(kpi.get("delta", ""))
            kpi_card(
                slide, x, top_y, kpi_w, top_h,
                value=str(kpi["value"]),
                label=str(kpi["label"]),
                sublabel=sublabel,
                accent=b.accent,
                brand=b,
                value_size=FONT_SIZE["hero"] - 4,
            )

    # ---- Bottom-half: takeaways em colunas ----
    bot_y = top_y + top_h + Inches(0.3)
    bot_h = Inches(2.0)
    if takeaways:
        n_t = len(takeaways)
        gap_t = Inches(0.2)
        col_w = (CONTENT_W - gap_t * (n_t - 1)) / n_t if n_t > 1 else CONTENT_W
        for i, t in enumerate(takeaways):
            x = MARGIN_L + i * (col_w + gap_t)
            # Card neutro
            add_rect(slide, x, bot_y, col_w, bot_h,
                     fill=b.bg_light, line=b.border, line_w=Pt(0.5))
            # Numero grande (1, 2, 3)
            add_tb(slide, x + Inches(0.2), bot_y + Inches(0.15),
                   Inches(0.5), Inches(0.5),
                   str(i + 1), size=FONT_SIZE["h1"], bold=True,
                   color=b.accent, font=b.font_heading,
                   align=PP_ALIGN.LEFT)
            # Texto takeaway
            add_tb(slide, x + Inches(0.2), bot_y + Inches(0.7),
                   col_w - Inches(0.4), bot_h - Inches(0.85),
                   t, size=FONT_SIZE["body"], color=b.fg_primary,
                   font=b.font_body, align=PP_ALIGN.LEFT,
                   anchor=MSO_ANCHOR.TOP, line_spacing=1.3)

    # Footer: source line (takeaway_bar omitida pois recommendation ja cumpre o papel)
    if source:
        source_line(slide, source, brand=b)
