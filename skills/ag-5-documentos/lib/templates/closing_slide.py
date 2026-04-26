"""Template: slide de encerramento com tagline."""
from __future__ import annotations

from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

from ..mckinsey_pptx import SLIDE_W, SLIDE_H, add_rect, add_tb, set_bg
from ..palette_overrides import Brand


def render(slide, data: dict, brand: Brand) -> None:
    set_bg(slide, brand.primary)
    add_rect(slide, 0, 0, SLIDE_W, Inches(0.12), fill=brand.accent)

    # Wordmark
    add_tb(slide, Inches(0.6), Inches(0.45), Inches(5), Inches(0.4),
           data.get("wordmark", "inspira"),
           size=24, bold=True, color=brand.surface, font=brand.font_heading,
           line_spacing=1.0)
    add_tb(slide, Inches(0.6), Inches(0.82), Inches(5), Inches(0.25),
           data.get("wordmark_sub", "rede de educadores"),
           size=9, color=brand.accent, font=brand.font_body, line_spacing=1.0)

    # Tagline
    add_tb(slide, Inches(0.8), Inches(2.8), Inches(11), Inches(1.3),
           data.get("tagline_1", ""),
           size=50, bold=True, color=brand.surface, font=brand.font_heading,
           line_spacing=1.05)
    add_tb(slide, Inches(0.8), Inches(3.9), Inches(11), Inches(1.3),
           data.get("tagline_2", ""),
           size=50, bold=True, color=brand.surface, font=brand.font_heading,
           line_spacing=1.05)

    add_rect(slide, Inches(0.8), Inches(5.05), Inches(1.5), Inches(0.06),
             fill=brand.accent)

    add_tb(slide, Inches(0.8), Inches(5.2), Inches(11), Inches(0.5),
           data.get("quote", ""),
           size=14, italic=True, color=brand.accent, font=brand.font_body,
           line_spacing=1.3)

    # Footer
    add_tb(slide, Inches(0.6), SLIDE_H-Inches(0.65), Inches(8), Inches(0.3),
           data.get("cta", ""),
           size=11, bold=True, color=brand.surface, font=brand.font_body)
    add_tb(slide, Inches(0.6), SLIDE_H-Inches(0.35), Inches(8), Inches(0.25),
           data.get("metadata", ""),
           size=9, italic=True, color=brand.fg_muted, font=brand.font_body)
