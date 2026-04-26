"""Process flow — etapas com dependencias e setas.

Input spec:
    {
        "title": "Pipeline de adocao IA",
        "steps": [
            {"label": "1. Diagnostico", "desc": "Mapear processos", "owner": "PMO"},
            {"label": "2. Pilot", "desc": "1 caso, 30 dias", "owner": "TI"},
            {"label": "3. Scale", "desc": "5 casos paralelos", "owner": "Lider"},
            {"label": "4. Govern", "desc": "Comite + metricas", "owner": "Board"},
        ],
    }
"""
from __future__ import annotations

from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

from ..mckinsey_pptx import (
    CONTENT_W, MARGIN_L, SLIDE_H, SLIDE_W,
    add_rect, add_tb, no_shadow,
)
from ..palette_overrides import Brand, get_brand
from ..raiz_tokens import FONT_SIZE, rgb


EXAMPLE_INPUT = {
    "title": "Pipeline de adocao IA agentica",
    "steps": [
        {"label": "1. Diagnostico", "desc": "Mapear processos", "owner": "PMO"},
        {"label": "2. Pilot",       "desc": "1 caso, 30 dias",  "owner": "TI"},
        {"label": "3. Scale",       "desc": "5 casos paralelos","owner": "Lider"},
        {"label": "4. Govern",      "desc": "Comite + metricas","owner": "Board"},
    ],
}


def render(slide, spec: dict, brand: Brand = None) -> None:
    """Renderiza process flow horizontal com setas."""
    b = brand or get_brand()

    steps = spec.get("steps", [])
    if not steps:
        return

    # Title
    title = str(spec.get("title") or "").strip()
    if title:
        add_tb(slide, MARGIN_L, Inches(2.0), CONTENT_W, Inches(0.5),
               title, size=FONT_SIZE["h2"], bold=True, color=b.fg_primary,
               font=b.font_heading, align=PP_ALIGN.LEFT)

    n = len(steps)
    base_y = Inches(3.2)
    box_h = Inches(2.5)
    arrow_w = Inches(0.5)
    total_arrow = arrow_w * (n - 1) if n > 1 else 0
    box_w = (CONTENT_W - total_arrow) / n

    for i, step in enumerate(steps):
        x = MARGIN_L + i * (box_w + arrow_w)

        # Card
        add_rect(slide, x, base_y, box_w, box_h,
                 fill=b.surface, line=b.border, line_w=Pt(0.75))
        # Header accent
        add_rect(slide, x, base_y, box_w, Inches(0.45), fill=b.accent)

        # Label
        add_tb(slide, x + Inches(0.1), base_y + Inches(0.05),
               box_w - Inches(0.2), Inches(0.4),
               str(step.get("label", "")),
               size=FONT_SIZE["h3"] - 1, bold=True, color=b.surface,
               font=b.font_heading, align=PP_ALIGN.CENTER,
               anchor=MSO_ANCHOR.MIDDLE)

        # Desc
        add_tb(slide, x + Inches(0.15), base_y + Inches(0.7),
               box_w - Inches(0.3), Inches(1.0),
               str(step.get("desc", "")),
               size=FONT_SIZE["body_sm"], color=b.fg_primary,
               font=b.font_body, line_spacing=1.3)

        # Owner (rodape do card)
        owner = step.get("owner")
        if owner:
            add_rect(slide, x + Inches(0.1), base_y + box_h - Inches(0.5),
                     box_w - Inches(0.2), Inches(0.4),
                     fill=b.bg_light)
            add_tb(slide, x + Inches(0.1), base_y + box_h - Inches(0.5),
                   box_w - Inches(0.2), Inches(0.4),
                   f"Owner: {owner}",
                   size=FONT_SIZE["caption"], italic=True, color=b.fg_muted,
                   font=b.font_body, align=PP_ALIGN.CENTER,
                   anchor=MSO_ANCHOR.MIDDLE)

        # Seta entre steps
        if i < n - 1:
            ax = x + box_w
            ay = base_y + box_h / 2 - Inches(0.2)
            arr = slide.shapes.add_shape(
                MSO_SHAPE.RIGHT_ARROW,
                ax, ay, arrow_w, Inches(0.4)
            )
            arr.fill.solid(); arr.fill.fore_color.rgb = rgb(b.accent)
            arr.line.fill.background()
            no_shadow(arr)
