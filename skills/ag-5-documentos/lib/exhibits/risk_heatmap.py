"""Risk heatmap — matriz risco x impacto (3x3 ou 5x5).

Input spec:
    {
        "items": [
            {"name": "Vazamento dados", "prob": 2, "impact": 5},
            {"name": "Hallucination",    "prob": 4, "impact": 3},
            {"name": "Bias",             "prob": 3, "impact": 4},
        ],
        "scale": 5,  # 3 ou 5 (matriz NxN)
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
    "items": [
        {"name": "Vazamento dados",  "prob": 2, "impact": 5},
        {"name": "Hallucination",     "prob": 4, "impact": 3},
        {"name": "Bias algoritmico",  "prob": 3, "impact": 4},
        {"name": "Custo OPEX",        "prob": 5, "impact": 2},
    ],
    "scale": 5,
}


def _heat_color(b: Brand, prob: int, impact: int, scale: int) -> str:
    """Retorna cor do quadrante baseado em (prob*impact) / (scale*scale)."""
    ratio = (prob * impact) / (scale * scale)
    if ratio > 0.6:
        return b.danger
    elif ratio > 0.35:
        return b.warning
    elif ratio > 0.15:
        return b.info
    return b.success


def render(slide, spec: dict, brand: Brand = None) -> None:
    """Renderiza risk heatmap NxN."""
    b = brand or get_brand()

    scale = int(spec.get("scale", 5))
    scale = 5 if scale not in (3, 5) else scale
    items = spec.get("items", [])

    grid_x = MARGIN_L + Inches(1.5)
    grid_y = Inches(2.3)
    grid_w = Inches(8.0)
    grid_h = Inches(4.5)
    cell_w = grid_w / scale
    cell_h = grid_h / scale

    # Background heatmap (todos cells)
    for col in range(scale):
        for row in range(scale):
            prob = col + 1
            # impact: linha 0 = scale (top), linha scale-1 = 1 (bottom)
            impact = scale - row
            color = _heat_color(b, prob, impact, scale)
            tint_alpha_hint = {b.danger: "#FDECEC", b.warning: "#FEF6E7",
                               b.info: "#E7F0FD", b.success: "#EAF5EB"}.get(color, b.surface)
            x = grid_x + col * cell_w
            y = grid_y + row * cell_h
            add_rect(slide, x, y, cell_w, cell_h,
                     fill=tint_alpha_hint, line=b.border, line_w=Pt(0.5))

    # Items dot
    for it in items:
        prob = max(1, min(scale, int(it.get("prob", 1))))
        impact = max(1, min(scale, int(it.get("impact", 1))))
        col = prob - 1
        row = scale - impact
        cx = grid_x + col * cell_w + cell_w / 2
        cy = grid_y + row * cell_h + cell_h / 2

        # Dot
        dot = slide.shapes.add_shape(
            MSO_SHAPE.OVAL,
            cx - Inches(0.18), cy - Inches(0.18),
            Inches(0.36), Inches(0.36)
        )
        color = _heat_color(b, prob, impact, scale)
        dot.fill.solid(); dot.fill.fore_color.rgb = rgb(color)
        dot.line.color.rgb = rgb(b.surface); dot.line.width = Pt(2)
        no_shadow(dot)

        # Label (a direita do dot, max 16 chars)
        label = it.get("name", "")[:30]
        add_tb(slide, cx + Inches(0.22), cy - Inches(0.15),
               Inches(2.0), Inches(0.32),
               label, size=FONT_SIZE["caption"], bold=True, color=b.fg_primary,
               font=b.font_body)

    # Axis labels
    add_tb(slide, grid_x, grid_y + grid_h + Inches(0.15),
           grid_w, Inches(0.3),
           "Probabilidade →",
           size=FONT_SIZE["body_sm"], bold=True, color=b.fg_muted,
           font=b.font_heading, align=PP_ALIGN.CENTER)
    add_tb(slide, MARGIN_L, grid_y + grid_h / 2 - Inches(0.2),
           Inches(1.4), Inches(0.4),
           "↑ Impacto",
           size=FONT_SIZE["body_sm"], bold=True, color=b.fg_muted,
           font=b.font_heading, align=PP_ALIGN.CENTER)

    # Legenda compacta
    leg_y = grid_y + grid_h + Inches(0.55)
    legends = [(b.danger, "Critico"), (b.warning, "Alto"),
               (b.info, "Medio"), (b.success, "Baixo")]
    for i, (color, label) in enumerate(legends):
        lx = grid_x + i * Inches(2.0)
        add_rect(slide, lx, leg_y, Inches(0.2), Inches(0.2), fill=color)
        add_tb(slide, lx + Inches(0.25), leg_y - Inches(0.03),
               Inches(1.5), Inches(0.3),
               label, size=FONT_SIZE["caption"], color=b.fg_primary,
               font=b.font_body)
