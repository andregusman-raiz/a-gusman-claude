"""Decision slide — pergunta + 2-3 opcoes com trade-offs.

Input spec:
    {
        "question": "Quando comecar projeto IA agentica em 2026?",
        "options": [
            {"label": "A. Agora",        "pros": ["Vantagem 18m"], "cons": ["Risco alto"], "color_hint": "success"},
            {"label": "B. Em 6 meses",   "pros": ["Mercado mais maduro"], "cons": ["Concorrencia entrega antes"], "color_hint": "warning"},
            {"label": "C. Esperar",      "pros": ["Zero risco curto prazo"], "cons": ["Game over em 24m"], "color_hint": "danger"},
        ],
        "recommendation": "A",
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
    "question": "Quando comecar a iniciativa IA agentica?",
    "options": [
        {"label": "A. Agora — janeiro 2026",
         "pros": ["Vantagem competitiva 18m", "Time aprendendo cedo"],
         "cons": ["Risco maior", "Investimento $1.2M"],
         "color_hint": "success"},
        {"label": "B. Em 6 meses (Q3 2026)",
         "pros": ["Mercado mais maduro", "Custo menor"],
         "cons": ["Concorrencia chega antes", "Catching up"],
         "color_hint": "warning"},
        {"label": "C. Esperar 12 meses (2027)",
         "pros": ["Zero risco curto prazo"],
         "cons": ["Game over em 24m", "Rebranding caro depois"],
         "color_hint": "danger"},
    ],
    "recommendation": "A",
}


def _color_for(b: Brand, hint: str) -> str:
    return {
        "success": b.success, "warning": b.warning,
        "danger":  b.danger,  "info":    b.info,
    }.get(hint, b.accent)


def render(slide, spec: dict, brand: Brand = None) -> None:
    """Renderiza decision slide."""
    b = brand or get_brand()

    question = str(spec.get("question") or "").strip()
    options = spec.get("options", [])
    rec = str(spec.get("recommendation") or "").strip()

    # Pergunta
    add_tb(slide, MARGIN_L, Inches(2.0), CONTENT_W, Inches(0.7),
           question, size=FONT_SIZE["h1"] + 2, bold=True, color=b.fg_primary,
           font=b.font_heading, align=PP_ALIGN.CENTER, line_spacing=1.2)

    # Opcoes (2-3, distribuidas horizontalmente)
    n = max(1, min(3, len(options)))
    col_gap = Inches(0.3)
    total_gap = col_gap * (n - 1) if n > 1 else 0
    col_w = (CONTENT_W - total_gap) / n
    base_y = Inches(3.2)
    h = Inches(3.4)

    for i, opt in enumerate(options[:n]):
        x = MARGIN_L + i * (col_w + col_gap)
        label = opt.get("label", f"Opcao {chr(65+i)}")
        color = _color_for(b, opt.get("color_hint", "info"))
        is_rec = rec and (label.startswith(rec + ".") or rec == label)

        # Container
        add_rect(slide, x, base_y, col_w, h,
                 fill=b.surface, line=color if is_rec else b.border,
                 line_w=Pt(2.0 if is_rec else 0.75))
        # Top accent
        add_rect(slide, x, base_y, col_w, Inches(0.5), fill=color)

        # Label
        add_tb(slide, x + Inches(0.2), base_y + Inches(0.1),
               col_w - Inches(0.4), Inches(0.4),
               label, size=FONT_SIZE["h3"], bold=True, color=b.surface,
               font=b.font_heading, anchor=MSO_ANCHOR.MIDDLE)

        # Pros/Cons
        cur_y = base_y + Inches(0.7)
        # PROS header
        add_tb(slide, x + Inches(0.2), cur_y, col_w - Inches(0.4), Inches(0.25),
               "PROS", size=FONT_SIZE["caption"], bold=True, color=b.success,
               font=b.font_heading)
        cur_y += Inches(0.28)
        for p in opt.get("pros", []):
            add_tb(slide, x + Inches(0.3), cur_y, col_w - Inches(0.5), Inches(0.4),
                   f"+ {p}", size=FONT_SIZE["body_sm"], color=b.fg_primary,
                   font=b.font_body, line_spacing=1.2)
            cur_y += Inches(0.32)

        cur_y += Inches(0.1)
        # CONS header
        add_tb(slide, x + Inches(0.2), cur_y, col_w - Inches(0.4), Inches(0.25),
               "CONS", size=FONT_SIZE["caption"], bold=True, color=b.danger,
               font=b.font_heading)
        cur_y += Inches(0.28)
        for c in opt.get("cons", []):
            add_tb(slide, x + Inches(0.3), cur_y, col_w - Inches(0.5), Inches(0.4),
                   f"- {c}", size=FONT_SIZE["body_sm"], color=b.fg_primary,
                   font=b.font_body, line_spacing=1.2)
            cur_y += Inches(0.32)

    # Recommendation footer
    if rec:
        add_tb(slide, MARGIN_L, SLIDE_H - Inches(0.95),
               CONTENT_W, Inches(0.4),
               f"Recomendacao: {rec}",
               size=FONT_SIZE["body"], bold=True, italic=True,
               color=b.accent, font=b.font_heading, align=PP_ALIGN.CENTER)
