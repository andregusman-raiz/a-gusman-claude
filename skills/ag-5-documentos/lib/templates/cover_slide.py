"""Template: capa executiva.

data = {
  "wordmark":        "inspira",               # primeira linha do wordmark
  "wordmark_sub":    "rede de educadores",    # segunda linha
  "dept":            "DIRETORIA DE TI",
  "subdept":         "Plano de Seguranca da Informacao",
  "title_1":         "Jornada de Maturidade",
  "title_2":         "Cibernetica 2025 -> 2027",
  "subtitle":        "Apresentacao executiva · Diretoria N1 e Comite Executivo",
  "chips":           ["NIST CSF 2.0", "ISO 27001:2022", "ISO 22301", "LGPD"],
  "kpi_label":       "SCORE NIST CSF 2.0",
  "kpi_value_1":     "1,99",
  "kpi_sub_1":       "2025 (hoje)",
  "kpi_value_2":     "3,54",
  "kpi_sub_2":       "2027 (meta) · +78%",
  "footer":          "Confidencial — Apenas liderancas internas · Abril 2026",
}
"""
from __future__ import annotations

from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

from ..mckinsey_pptx import (
    SLIDE_W, SLIDE_H,
    add_rect, add_tb, set_bg,
)
from ..palette_overrides import Brand


def render(slide, data: dict, brand: Brand) -> None:
    set_bg(slide, brand.primary)

    # Top accent
    add_rect(slide, 0, 0, SLIDE_W, Inches(0.12), fill=brand.accent)

    # Wordmark top-left
    add_tb(slide, Inches(0.6), Inches(0.45), Inches(5), Inches(0.4),
           data.get("wordmark", "inspira"),
           size=24, bold=True, color=brand.surface,
           font=brand.font_heading, line_spacing=1.0)
    add_tb(slide, Inches(0.6), Inches(0.82), Inches(5), Inches(0.25),
           data.get("wordmark_sub", "rede de educadores"),
           size=9, color=brand.accent, font=brand.font_body, line_spacing=1.0)

    # Vertical divider
    add_rect(slide, Inches(3.6), Inches(0.48), Inches(0.015), Inches(0.55),
             fill=brand.accent)

    add_tb(slide, Inches(3.8), Inches(0.52), Inches(5), Inches(0.3),
           data.get("dept", ""),
           size=10, bold=True, color=brand.surface,
           font=brand.font_heading, line_spacing=1.0)
    add_tb(slide, Inches(3.8), Inches(0.82), Inches(5), Inches(0.3),
           data.get("subdept", ""),
           size=10, color=brand.accent, font=brand.font_body, line_spacing=1.0)

    # Big title
    add_tb(slide, Inches(0.6), Inches(2.2), Inches(8.5), Inches(1.1),
           data.get("title_1", ""),
           size=44, bold=True, color=brand.surface,
           font=brand.font_heading, line_spacing=1.05)
    add_tb(slide, Inches(0.6), Inches(3.05), Inches(8.5), Inches(1.1),
           data.get("title_2", ""),
           size=44, bold=True, color=brand.accent,
           font=brand.font_heading, line_spacing=1.05)

    # Accent line
    add_rect(slide, Inches(0.6), Inches(4.15), Inches(1.2), Inches(0.04),
             fill=brand.accent)

    # Subtitle
    add_tb(slide, Inches(0.6), Inches(4.35), Inches(9), Inches(0.5),
           data.get("subtitle", ""),
           size=16, color=brand.surface, font=brand.font_body, line_spacing=1.2)

    # Compliance chips
    y_chip = Inches(5.7)
    chips = data.get("chips", [])
    cx = Inches(0.6)
    for i, label in enumerate(chips):
        col = brand.accent if i == 0 else brand.surface
        w = Inches(1.55)
        add_rect(slide, cx, y_chip, w, Inches(0.36),
                 fill=None, line=col, line_w=Pt(1))
        from pptx.enum.text import MSO_ANCHOR
        add_tb(slide, cx, y_chip, w, Inches(0.36),
               label, size=9, bold=True, color=col,
               font=brand.font_body,
               align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        cx += w + Inches(0.15)

    # Right KPI card
    kpi_x, kpi_y, kpi_w, kpi_h = Inches(9.6), Inches(2.2), Inches(3.2), Inches(3.5)
    add_rect(slide, kpi_x, kpi_y, kpi_w, kpi_h,
             fill=None, line=brand.accent, line_w=Pt(1.25))

    add_tb(slide, kpi_x, kpi_y+Inches(0.3), kpi_w, Inches(0.3),
           data.get("kpi_label", ""),
           size=9, bold=True, color=brand.accent,
           font=brand.font_heading, align=PP_ALIGN.CENTER)
    add_tb(slide, kpi_x, kpi_y+Inches(0.75), kpi_w, Inches(0.8),
           data.get("kpi_value_1", ""),
           size=52, bold=True, color=brand.surface,
           font=brand.font_heading, align=PP_ALIGN.CENTER, line_spacing=1.0)
    add_tb(slide, kpi_x, kpi_y+Inches(1.58), kpi_w, Inches(0.3),
           data.get("kpi_sub_1", ""),
           size=10, color=brand.fg_muted, font=brand.font_body,
           align=PP_ALIGN.CENTER)
    add_tb(slide, kpi_x, kpi_y+Inches(1.88), kpi_w, Inches(0.3),
           "↓",
           size=22, bold=True, color=brand.accent,
           font=brand.font_heading, align=PP_ALIGN.CENTER, line_spacing=1.0)
    add_tb(slide, kpi_x, kpi_y+Inches(2.2), kpi_w, Inches(0.8),
           data.get("kpi_value_2", ""),
           size=52, bold=True, color=brand.accent,
           font=brand.font_heading, align=PP_ALIGN.CENTER, line_spacing=1.0)
    add_tb(slide, kpi_x, kpi_y+Inches(3.05), kpi_w, Inches(0.25),
           data.get("kpi_sub_2", ""),
           size=10, color=brand.fg_muted, font=brand.font_body,
           align=PP_ALIGN.CENTER)

    # Footer confidential
    add_tb(slide, Inches(0.6), SLIDE_H-Inches(0.55), Inches(8), Inches(0.3),
           data.get("footer", ""),
           size=9, italic=True, color=brand.fg_muted, font=brand.font_body)
