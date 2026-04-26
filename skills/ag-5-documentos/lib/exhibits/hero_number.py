"""Hero number — numero gigante 60-100pt + tese curta.

Input spec:
    {
        "number": "$40M",       # str — numero/valor a exibir grande
        "context": "economia/ano da Klarna ao substituir 700 atendentes por 1 IA",
        "kicker": "ECONOMIA ANUAL",   # opcional, label acima do numero
        "source":  "Reuters, 2024",   # opcional, fonte
        "size_pt": 100,         # opcional, tamanho da fonte do numero (60-100)
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
    "number": "$40M",
    "context": "economia anual da Klarna ao substituir 700 atendentes por 1 IA",
    "kicker": "ECONOMIA ANUAL",
    "source": "Reuters, 2024",
    "size_pt": 110,
}


def render(slide, spec: dict, brand: Brand = None) -> None:
    """Renderiza hero number layout em slide.

    Convencao de posicionamento:
      - Kicker (top-left, 0.6in)
      - Numero centralizado (linha do meio do slide)
      - Tese (uma linha abaixo, max 2 linhas)
      - Source (rodape, italico cinza)
    """
    b = brand or get_brand()

    number = str(spec.get("number") or "").strip()
    context = str(spec.get("context") or "").strip()
    kicker = str(spec.get("kicker") or "").strip()
    source = str(spec.get("source") or "").strip()
    size_pt = int(spec.get("size_pt") or 100)
    size_pt = max(60, min(110, size_pt))

    # Kicker (label acima do numero)
    if kicker:
        add_tb(slide, MARGIN_L, Inches(2.0), CONTENT_W, Inches(0.4),
               kicker.upper(),
               size=FONT_SIZE["kicker"] + 2, bold=True, color=b.accent,
               font=b.font_heading, align=PP_ALIGN.CENTER, line_spacing=1.0)

    # Numero gigante (centro vertical do slide)
    add_tb(slide, MARGIN_L, Inches(2.5), CONTENT_W, Inches(2.0),
           number,
           size=size_pt, bold=True, color=b.fg_primary,
           font=b.font_heading, align=PP_ALIGN.CENTER,
           anchor=MSO_ANCHOR.MIDDLE, line_spacing=1.0)

    # Tese (max 2 linhas, sublinhar com accent)
    add_tb(slide, MARGIN_L + Inches(1.5), Inches(4.7),
           CONTENT_W - Inches(3.0), Inches(0.04),
           "", color=b.accent)  # placeholder
    add_rect(slide, MARGIN_L + Inches(3.0), Inches(4.65),
             Inches(7.3), Inches(0.06), fill=b.accent)

    add_tb(slide, MARGIN_L, Inches(4.85), CONTENT_W, Inches(1.2),
           context,
           size=FONT_SIZE["h2"], color=b.fg_primary, italic=False,
           font=b.font_body, align=PP_ALIGN.CENTER, line_spacing=1.3)

    # Source (rodape)
    if source:
        add_tb(slide, MARGIN_L, SLIDE_H - Inches(0.9), CONTENT_W, Inches(0.3),
               f"Fonte: {source}",
               size=FONT_SIZE["caption"], italic=True, color=b.fg_muted,
               font=b.font_body, align=PP_ALIGN.CENTER)
