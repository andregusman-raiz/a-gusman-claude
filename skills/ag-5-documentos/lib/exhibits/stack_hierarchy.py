"""Stack hierarchy — N camadas em pilha vertical com profundidade visual.

Input spec:
    {
        "title": "4 camadas de IA empresarial",
        "layers": [
            {"name": "Apps",          "desc": "Produtos prontos (ChatGPT, Cursor)",  "highlight": False},
            {"name": "Modelos",       "desc": "GPT-4, Claude, Gemini",                "highlight": False},
            {"name": "Orquestracao",  "desc": "Agentic workflows, MCP, RAG",          "highlight": True},
            {"name": "Infraestrutura","desc": "GPUs, vector DBs, observability",      "highlight": False},
        ],
        "emphasis_index": 2,    # OPCIONAL — P1.6e
                                # Indice da camada destacada (largura/cor maior).
                                # Default: -1 = sem emfase explicita (usa highlight do layer).
                                # Quando setado: layers nao-destacadas ficam progressivamente
                                # menores, invertendo a logica visual (ex: "Generativa maior
                                # que Agentica" = setar emphasis_index para Agentica).
    }

P1.6e — emphasis_index:
  Quando informado, sobrepoe a logica de profundidade visual fixa.
  Camada com emphasis_index recebe largura maxima + cor accent_strong.
  Outras camadas ficam menores progressivamente.
  Resolve casos onde ordem semantica != ordem visual (ex: importancia
  invertida).
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
    """Renderiza stack vertical com camadas escalonadas.

    P1.6e — emphasis_index: se informado (>=0), camada com esse indice
    recebe largura maxima e accent_strong. Outras encolhem progressivamente.
    """
    b = brand or get_brand()

    title = str(spec.get("title") or "").strip()
    layers = spec.get("layers", [])
    if not layers:
        return

    # P1.6e — emphasis_index (default -1 = sem emfase explicita)
    emphasis_idx = int(spec.get("emphasis_index", -1))
    has_explicit_emphasis = (0 <= emphasis_idx < len(layers))

    # P1.7 — brand semantics (com fallback)
    accent_strong = getattr(b, "accent_strong", b.accent)
    accent_moderate = getattr(b, "accent_moderate", b.accent)

    if title:
        add_tb(slide, MARGIN_L, Inches(2.0), CONTENT_W, Inches(0.5),
               title, size=FONT_SIZE["h2"], bold=True, color=b.fg_primary,
               font=b.font_heading)

    base_y = Inches(2.7)
    layer_h = Inches(0.85)
    layer_gap = Inches(0.08)

    n = len(layers)
    base_w = Inches(8.0)
    indent_step = Inches(0.4)

    for i, layer in enumerate(layers):
        if has_explicit_emphasis:
            # P1.6e — distancia ao indice destacado define largura
            distance = abs(i - emphasis_idx)
            offset = distance * indent_step / 2
            w = base_w - distance * indent_step
            x = MARGIN_L + Inches(0.5) + offset
            y = base_y + i * (layer_h + layer_gap)

            is_h = (i == emphasis_idx)
            fill = accent_strong if is_h else b.surface
        else:
            # Modo classico: profundidade pela ordem (cima = mais estreita)
            offset = (n - 1 - i) * indent_step / 2
            w = base_w - (n - 1 - i) * indent_step
            x = MARGIN_L + Inches(0.5) + offset
            y = base_y + i * (layer_h + layer_gap)

            is_h = layer.get("highlight", False)
            # P1.7 — highlight nao-explicito usa moderate (disciplina)
            fill = accent_moderate if is_h else b.surface

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
