"""Matrix 2x2 — classificacao 2 dimensoes com 4 quadrantes nomeados.

Input spec:
    {
        "x_axis": "Maturidade IA",
        "x_low":  "Baixa",
        "x_high": "Alta",
        "y_axis": "Tamanho da empresa",
        "y_low":  "Pequena",
        "y_high": "Grande",
        "quadrants": [
            # (x_pos, y_pos, name, description)
            ("low",  "high", "Vulneraveis",  "Empresas grandes sem IA"),
            ("high", "high", "Lideres",      "Big tech maturo"),
            ("low",  "low",  "Sobrevivem",   "PMEs sem urgencia"),
            ("high", "low",  "Disruptors",   "PMEs IA-first"),
        ],
        "highlight": "Lideres",  # opcional — quadrante a destacar
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
    "x_axis": "Maturidade IA",
    "x_low":  "Baixa",
    "x_high": "Alta",
    "y_axis": "Porte da empresa",
    "y_low":  "PME",
    "y_high": "Grande",
    "quadrants": [
        ("low",  "high", "Vulneraveis",  "Grandes sem IA"),
        ("high", "high", "Lideres",      "Big tech maturo"),
        ("low",  "low",  "Sobrevivem",   "PMEs sem urgencia"),
        ("high", "low",  "Disruptors",   "PMEs IA-first"),
    ],
    "highlight": "Lideres",
}


def render(slide, spec: dict, brand: Brand = None) -> None:
    """Renderiza matrix 2x2 com 4 quadrantes nomeados."""
    b = brand or get_brand()

    # Area da matriz (ocupar lado esquerdo + parte central)
    box_x = MARGIN_L + Inches(0.5)
    box_y = Inches(2.2)
    box_w = Inches(9.0)
    box_h = Inches(4.4)

    half_w = box_w / 2
    half_h = box_h / 2

    # 4 quadrants
    highlight = spec.get("highlight")
    for x_pos, y_pos, name, desc in spec.get("quadrants", []):
        qx = box_x if x_pos == "low" else box_x + half_w
        qy = box_y if y_pos == "high" else box_y + half_h
        is_highlight = (highlight and name == highlight)
        fill = b.accent_light if is_highlight else b.surface
        line = b.accent if is_highlight else b.border

        add_rect(slide, qx, qy, half_w, half_h,
                 fill=fill, line=line, line_w=Pt(1.0))
        # Nome do quadrante
        add_tb(slide, qx + Inches(0.2), qy + Inches(0.2),
               half_w - Inches(0.4), Inches(0.5),
               name, size=FONT_SIZE["h3"], bold=True,
               color=b.accent if is_highlight else b.fg_primary,
               font=b.font_heading)
        # Descricao
        add_tb(slide, qx + Inches(0.2), qy + Inches(0.8),
               half_w - Inches(0.4), half_h - Inches(0.9),
               desc, size=FONT_SIZE["body_sm"], color=b.fg_muted,
               font=b.font_body, line_spacing=1.3)

    # Eixo Y label (esquerda, vertical-ish — usar texto rotated impossible, faz top/bottom)
    add_tb(slide, MARGIN_L, box_y - Inches(0.05),
           Inches(0.5), Inches(0.4),
           spec.get("y_high", ""), size=FONT_SIZE["caption"], bold=True,
           color=b.fg_muted, font=b.font_body, align=PP_ALIGN.CENTER)
    add_tb(slide, MARGIN_L, box_y + box_h - Inches(0.4),
           Inches(0.5), Inches(0.4),
           spec.get("y_low", ""), size=FONT_SIZE["caption"], bold=True,
           color=b.fg_muted, font=b.font_body, align=PP_ALIGN.CENTER)
    # Y axis title
    add_tb(slide, MARGIN_L - Inches(0.3), box_y + half_h - Inches(0.2),
           Inches(0.5), Inches(0.5),
           "↑", size=FONT_SIZE["h2"], color=b.accent,
           font=b.font_body, align=PP_ALIGN.CENTER)

    # Eixo X label (low / high abaixo)
    add_tb(slide, box_x - Inches(0.5), box_y + box_h + Inches(0.1),
           Inches(2.0), Inches(0.3),
           spec.get("x_low", ""), size=FONT_SIZE["caption"], bold=True,
           color=b.fg_muted, font=b.font_body, align=PP_ALIGN.CENTER)
    add_tb(slide, box_x + box_w - Inches(1.5), box_y + box_h + Inches(0.1),
           Inches(2.0), Inches(0.3),
           spec.get("x_high", ""), size=FONT_SIZE["caption"], bold=True,
           color=b.fg_muted, font=b.font_body, align=PP_ALIGN.CENTER)

    # Axis titles (X e Y)
    add_tb(slide, box_x, box_y + box_h + Inches(0.45),
           box_w, Inches(0.3),
           f"{spec.get('x_axis', '')} →",
           size=FONT_SIZE["body_sm"], bold=True, color=b.fg_primary,
           font=b.font_heading, align=PP_ALIGN.CENTER)

    add_tb(slide, MARGIN_L - Inches(0.4), box_y - Inches(0.45),
           Inches(3.0), Inches(0.3),
           f"↑ {spec.get('y_axis', '')}",
           size=FONT_SIZE["body_sm"], bold=True, color=b.fg_primary,
           font=b.font_heading)
