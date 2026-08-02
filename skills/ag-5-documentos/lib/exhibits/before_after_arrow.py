"""Before/After com seta dominante — 2 estados de transformacao com delta.

Input spec:
    {
        "before": {
            "label":  "Antes (manual)",
            "metric": "8h/dia",
            "items":  ["20 emails", "12 reunioes", "5 relatorios"],
        },
        "after": {
            "label":  "Depois (com IA)",
            "metric": "1.5h/dia",
            "items":  ["IA pre-classifica", "Reuniao com pre-brief", "Relatorio gerado"],
        },
        "delta": "-81%",
        "delta_label": "tempo gasto",
    }
"""
from __future__ import annotations

from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

from ..mckinsey_pptx import (
    CONTENT_W, MARGIN_L, SLIDE_H,
    add_rect, add_tb, no_shadow,
)
from ..palette_overrides import Brand, get_brand
from ..raiz_tokens import FONT_SIZE, rgb


EXAMPLE_INPUT = {
    "before": {
        "label":  "Antes (sem IA)",
        "metric": "8h/dia",
        "items":  ["20 emails", "12 reunioes back-to-back", "5 relatorios manuais"],
    },
    "after": {
        "label":  "Depois (com IA agentica)",
        "metric": "1.5h/dia",
        "items":  ["IA pre-classifica e responde", "Reuniao com pre-brief gerado", "Relatorio gerado em 3min"],
    },
    "delta": "-81%",
    "delta_label": "tempo gasto",
}


def render(slide, spec: dict, brand: Brand = None) -> None:
    """Renderiza side-by-side com seta dominante e delta."""
    b = brand or get_brand()

    before = spec.get("before", {})
    after = spec.get("after", {})
    delta = str(spec.get("delta") or "").strip()
    delta_label = str(spec.get("delta_label") or "").strip()

    # 2 cards lado a lado + seta no meio
    base_y = Inches(2.4)
    card_h = Inches(4.2)
    card_w = Inches(5.2)
    gap = Inches(1.0)

    # BEFORE (esquerda, cinza)
    bx = MARGIN_L + Inches(0.3)
    add_rect(slide, bx, base_y, card_w, card_h,
             fill=b.bg_light, line=b.border, line_w=Pt(0.75))
    add_rect(slide, bx, base_y, card_w, Inches(0.5), fill=b.fg_muted)
    add_tb(slide, bx + Inches(0.2), base_y + Inches(0.05),
           card_w - Inches(0.4), Inches(0.4),
           str(before.get("label", "Antes")),
           size=FONT_SIZE["h3"], bold=True, color=b.surface,
           font=b.font_heading, anchor=MSO_ANCHOR.MIDDLE)
    # Metric
    add_tb(slide, bx, base_y + Inches(0.7), card_w, Inches(1.0),
           str(before.get("metric", "")),
           size=FONT_SIZE["hero"] - 6, bold=True, color=b.fg_primary,
           font=b.font_heading, align=PP_ALIGN.CENTER)
    # Items
    cur_y = base_y + Inches(2.0)
    for it in before.get("items", []):
        add_tb(slide, bx + Inches(0.3), cur_y, card_w - Inches(0.6), Inches(0.4),
               f"·  {it}", size=FONT_SIZE["body_sm"], color=b.fg_primary,
               font=b.font_body, line_spacing=1.3)
        cur_y += Inches(0.4)

    # SETA DOMINANTE (centro)
    arrow_x = bx + card_w + Inches(0.05)
    arrow_y = base_y + card_h / 2 - Inches(0.5)
    arrow = slide.shapes.add_shape(
        MSO_SHAPE.RIGHT_ARROW,
        arrow_x, arrow_y, gap - Inches(0.1), Inches(1.0)
    )
    arrow.fill.solid(); arrow.fill.fore_color.rgb = rgb(b.accent)
    arrow.line.fill.background()
    no_shadow(arrow)

    # Delta acima da seta
    if delta:
        add_tb(slide, arrow_x - Inches(0.3), arrow_y - Inches(0.7),
               gap + Inches(0.4), Inches(0.5),
               delta, size=FONT_SIZE["h2"], bold=True, color=b.accent,
               font=b.font_heading, align=PP_ALIGN.CENTER)
    if delta_label:
        add_tb(slide, arrow_x - Inches(0.3), arrow_y + Inches(1.05),
               gap + Inches(0.4), Inches(0.4),
               delta_label, size=FONT_SIZE["caption"], italic=True,
               color=b.fg_muted, font=b.font_body, align=PP_ALIGN.CENTER)

    # AFTER (direita, accent)
    ax = arrow_x + gap + Inches(0.05)
    add_rect(slide, ax, base_y, card_w, card_h,
             fill=b.surface, line=b.accent, line_w=Pt(2.0))
    add_rect(slide, ax, base_y, card_w, Inches(0.5), fill=b.accent)
    add_tb(slide, ax + Inches(0.2), base_y + Inches(0.05),
           card_w - Inches(0.4), Inches(0.4),
           str(after.get("label", "Depois")),
           size=FONT_SIZE["h3"], bold=True, color=b.surface,
           font=b.font_heading, anchor=MSO_ANCHOR.MIDDLE)
    add_tb(slide, ax, base_y + Inches(0.7), card_w, Inches(1.0),
           str(after.get("metric", "")),
           size=FONT_SIZE["hero"] - 6, bold=True, color=b.accent,
           font=b.font_heading, align=PP_ALIGN.CENTER)
    cur_y = base_y + Inches(2.0)
    for it in after.get("items", []):
        add_tb(slide, ax + Inches(0.3), cur_y, card_w - Inches(0.6), Inches(0.4),
               f"·  {it}", size=FONT_SIZE["body_sm"], color=b.fg_primary,
               font=b.font_body, line_spacing=1.3)
        cur_y += Inches(0.4)
