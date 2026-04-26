"""Quote slide — citacao em tipografia editorial.

Input spec:
    {
        "quote":  "Empresas que sistematizam delegacao reportam 3.2x mais ganho.",
        "author": "Jamie Dimon",
        "role":   "CEO, JPMorgan Chase",
        "source": "McKinsey AI Report, 2026",
    }
"""
from __future__ import annotations

from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

from ..mckinsey_pptx import (
    CONTENT_W, MARGIN_L, SLIDE_H, SLIDE_W,
    add_rect, add_tb,
)
from ..palette_overrides import Brand, get_brand
from ..raiz_tokens import FONT_SIZE


EXAMPLE_INPUT = {
    "quote":  "Empresas que sistematizam delegacao para IA reportam 3.2x mais ganho de produtividade vs. empresas que dependem de uso individual.",
    "author": "Jamie Dimon",
    "role":   "CEO, JPMorgan Chase",
    "source": "McKinsey AI Report, 2026",
}


def render(slide, spec: dict, brand: Brand = None) -> None:
    """Renderiza quote slide editorial."""
    b = brand or get_brand()

    quote = str(spec.get("quote") or "").strip()
    author = str(spec.get("author") or "").strip()
    role = str(spec.get("role") or "").strip()
    source = str(spec.get("source") or "").strip()

    # Aspas decorativas grandes (left)
    add_tb(slide, MARGIN_L + Inches(0.5), Inches(1.6),
           Inches(1.5), Inches(1.5),
           "“", size=140, bold=True, color=b.accent,
           font=b.font_heading, align=PP_ALIGN.LEFT, line_spacing=1.0)

    # Citacao (centralizada, italico)
    add_tb(slide, MARGIN_L + Inches(1.5), Inches(2.4),
           CONTENT_W - Inches(3), Inches(2.5),
           quote, size=FONT_SIZE["h2"] + 4, italic=True, color=b.fg_primary,
           font=b.font_heading, align=PP_ALIGN.LEFT,
           anchor=MSO_ANCHOR.MIDDLE, line_spacing=1.4)

    # Linha decorativa
    add_rect(slide, MARGIN_L + Inches(1.5), Inches(5.4),
             Inches(0.4), Inches(0.04), fill=b.accent)

    # Author
    if author:
        add_tb(slide, MARGIN_L + Inches(1.5), Inches(5.5),
               CONTENT_W - Inches(3), Inches(0.4),
               author, size=FONT_SIZE["label"] + 2, bold=True, color=b.fg_primary,
               font=b.font_heading)
    if role:
        add_tb(slide, MARGIN_L + Inches(1.5), Inches(5.95),
               CONTENT_W - Inches(3), Inches(0.3),
               role, size=FONT_SIZE["body_sm"], italic=True, color=b.fg_muted,
               font=b.font_body)
    # Source rodape
    if source:
        add_tb(slide, MARGIN_L, SLIDE_H - Inches(0.85),
               CONTENT_W, Inches(0.3),
               f"Fonte: {source}",
               size=FONT_SIZE["caption"], italic=True, color=b.fg_muted,
               font=b.font_body, align=PP_ALIGN.CENTER)
