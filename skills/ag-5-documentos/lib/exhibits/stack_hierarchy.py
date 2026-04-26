"""Stack hierarchy — N camadas em pilha vertical com profundidade visual.

Input spec:
    {
        "title": "4 camadas de IA empresarial",
        "layers": [
            {"name": "Apps",        "desc": "Produtos prontos (ChatGPT, Cursor)",  "highlight": False},
            {"name": "Modelos",     "desc": "GPT-4, Claude, Gemini",                "highlight": False},
            {"name": "Orquestracao","desc": "Agentic workflows, MCP, RAG",          "highlight": True},
            {"name": "Infraestrutura","desc": "GPUs, vector DBs, observability",    "highlight": False},
        ],
    }
"""
from __future__ import annotations

from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

from ..mckinsey_pptx import (
    CONTENT_W, MARGIN_L, SLIDE_H,
    add_rect, add_tb,
)
from ..palette_overrides import Brand, get_brand
from ..raiz_tokens import FONT_SIZE


EXAMPLE_INPUT = {
    "title": "4 camadas de IA empresarial",
    "layers": [
        {"name": "Apps",          "desc": "Produtos prontos (ChatGPT, Cursor)",       "highlight": False},
        {"name": "Modelos",       "desc": "GPT-4, Claude, Gemini",                     "highlight": False},
        {"name": "Orquestracao",  "desc": "Agentic workflows, MCP, RAG",                "highlight": True},
        {"name": "Infra",         "desc": "GPUs, vector DBs, observability",            "highlight": False},
    ],
}


def render(slide, spec: dict, brand: Brand = None) -> None:
    """Renderiza stack vertical com camadas escalonadas."""
    b = brand or get_brand()

    title = str(spec.get("title") or "").strip()
    layers = spec.get("layers", [])
    if not layers:
        return

    if title:
        add_tb(slide, MARGIN_L, Inches(2.0), CONTENT_W, Inches(0.5),
               title, size=FONT_SIZE["h2"], bold=True, color=b.fg_primary,
               font=b.font_heading)

    base_y = Inches(2.7)
    layer_h = Inches(0.85)
    layer_gap = Inches(0.08)

    n = len(layers)
    # Stack escalonado: cada camada um pouco mais larga (efeito de profundidade)
    base_w = Inches(8.0)
    indent_step = Inches(0.4)

    for i, layer in enumerate(layers):
        # Camada de cima e mais estreita; vai ficando mais larga
        offset = (n - 1 - i) * indent_step / 2
        w = base_w - (n - 1 - i) * indent_step
        x = MARGIN_L + Inches(0.5) + offset
        y = base_y + i * (layer_h + layer_gap)

        is_h = layer.get("highlight", False)
        fill = b.accent if is_h else b.surface
        text_color = b.surface if is_h else b.fg_primary
        line = b.accent_dark if is_h else b.border

        add_rect(slide, x, y, w, layer_h, fill=fill, line=line, line_w=Pt(0.75))

        # Name (esquerda)
        add_tb(slide, x + Inches(0.3), y, Inches(2.5), layer_h,
               str(layer.get("name", "")),
               size=FONT_SIZE["h3"], bold=True, color=text_color,
               font=b.font_heading, anchor=MSO_ANCHOR.MIDDLE)

        # Desc (direita)
        add_tb(slide, x + Inches(2.9), y,
               w - Inches(3.1), layer_h,
               str(layer.get("desc", "")),
               size=FONT_SIZE["body_sm"], color=text_color,
               font=b.font_body, anchor=MSO_ANCHOR.MIDDLE, line_spacing=1.3)

    # Texto lateral: explicacao ou call-out (right side)
    desc_x = MARGIN_L + Inches(9.5)
    desc_w = CONTENT_W - Inches(9)
    if desc_w > Inches(2):
        add_tb(slide, desc_x, base_y, desc_w, n * (layer_h + layer_gap),
               "A vantagem competitiva\nesta na orquestracao —\nnao no modelo isolado.",
               size=FONT_SIZE["body_sm"], italic=True, color=b.fg_muted,
               font=b.font_body, line_spacing=1.5,
               anchor=MSO_ANCHOR.MIDDLE)
