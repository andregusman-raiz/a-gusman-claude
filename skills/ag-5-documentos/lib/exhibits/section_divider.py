"""Section divider — separador entre blocos do deck.

Variantes:
  - 'classic':      numero gigante + titulo + sublabel (default)
  - 'with_preview': classic + mini-viz prévia do conteudo do bloco
                    (3-4 icones ou mini-cards)

Input spec:
    {
        "number": "02",                           # str, 0X format
        "title":  "Diagnostico atual",            # titulo do bloco
        "sublabel": "8 slides | 12 minutos",      # opcional, contexto temporal
        "variant": "with_preview",                # 'classic' | 'with_preview'
        "preview_items": [                        # SO usado em 'with_preview'
            {"icon_label": "ROI",     "text": "ROI de 3x"},
            {"icon_label": "Tempo",   "text": "30 dias"},
            {"icon_label": "Pessoas", "text": "5 squads"},
            {"icon_label": "Stack",   "text": "Next + AI"},
        ],
    }

P1.6a — Variant with_preview:
  Mini-viz prévia (3-4 mini-cards) sob o titulo permite ao reader
  antecipar o que vira no bloco. Reduz monotonia em decks longos.

P1.7 — Brand semantics:
  - Numero gigante (chip): brand.accent_strong (laranja em raiz)
  - Title sublabel:        brand.accent_moderate (teal em raiz)
  - Mini-card accents:     brand.accent_moderate
"""
from __future__ import annotations

from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

from ..mckinsey_pptx import (
    CONTENT_W, MARGIN_L, SLIDE_H, SLIDE_W,
    add_rect, add_tb, set_bg,
)
from ..palette_overrides import Brand, get_brand
from ..raiz_tokens import FONT_SIZE


EXAMPLE_INPUT = {
    "number": "02",
    "title": "Diagnostico atual",
    "sublabel": "8 slides | 12 minutos",
    "variant": "with_preview",
    "preview_items": [
        {"icon_label": "ROI",     "text": "3x retorno"},
        {"icon_label": "Tempo",   "text": "30 dias"},
        {"icon_label": "Pessoas", "text": "5 squads"},
        {"icon_label": "Stack",   "text": "Next + AI"},
    ],
}


def _render_classic(slide, spec, brand, accent_strong, accent_moderate):
    """Variante classica: numero gigante + titulo + sublabel."""
    number = str(spec.get("number") or "0X").strip()
    title = str(spec.get("title") or "").strip()
    sublabel = str(spec.get("sublabel") or "").strip()

    # Numero gigante (esquerda) — accent_strong
    add_tb(slide, MARGIN_L, Inches(2.5), Inches(3.5), Inches(2.5),
           number,
           size=120, bold=True, color=accent_strong,
           font=brand.font_heading, align=PP_ALIGN.LEFT,
           anchor=MSO_ANCHOR.MIDDLE, line_spacing=0.95)

    # Title (centro vertical, ao lado do numero)
    add_tb(slide, MARGIN_L + Inches(3.8), Inches(2.8), Inches(8.5), Inches(1.2),
           title,
           size=44, bold=True, color=brand.fg_primary,
           font=brand.font_heading, line_spacing=1.05)

    # Sublabel (italico, accent_moderate)
    if sublabel:
        add_tb(slide, MARGIN_L + Inches(3.8), Inches(4.1), Inches(8.5), Inches(0.5),
               sublabel,
               size=14, italic=True, color=accent_moderate,
               font=brand.font_body, line_spacing=1.2)

        # Divisor moderate sob o sublabel
        add_rect(slide, MARGIN_L + Inches(3.8), Inches(4.55),
                 Inches(2.0), Inches(0.04), fill=accent_moderate)


def _render_with_preview(slide, spec, brand, accent_strong, accent_moderate):
    """Variante with_preview: classic + mini-viz prévia (3-4 mini-cards)."""
    # Render classic primeiro (mas em posicao mais alta)
    number = str(spec.get("number") or "0X").strip()
    title = str(spec.get("title") or "").strip()
    sublabel = str(spec.get("sublabel") or "").strip()

    # Numero gigante esquerda (mais alto que classic)
    add_tb(slide, MARGIN_L, Inches(1.6), Inches(3.5), Inches(2.5),
           number,
           size=120, bold=True, color=accent_strong,
           font=brand.font_heading, align=PP_ALIGN.LEFT,
           anchor=MSO_ANCHOR.MIDDLE, line_spacing=0.95)

    # Title ao lado
    add_tb(slide, MARGIN_L + Inches(3.8), Inches(1.9), Inches(8.5), Inches(1.2),
           title,
           size=44, bold=True, color=brand.fg_primary,
           font=brand.font_heading, line_spacing=1.05)

    if sublabel:
        add_tb(slide, MARGIN_L + Inches(3.8), Inches(3.2), Inches(8.5), Inches(0.5),
               sublabel,
               size=13, italic=True, color=accent_moderate,
               font=brand.font_body, line_spacing=1.2)

    # Mini-viz preview: 3-4 mini-cards horizontais
    items = spec.get("preview_items", [])[:4]   # max 4
    if not items:
        return

    n = len(items)
    card_h = Inches(1.4)
    card_gap = Inches(0.25)
    available_w = CONTENT_W - (n - 1) * card_gap
    card_w = available_w / n

    base_y = Inches(4.4)
    for i, item in enumerate(items):
        x = MARGIN_L + i * (card_w + card_gap)

        # Card outline (moderate tier)
        add_rect(slide, x, base_y, card_w, card_h,
                 fill=brand.surface, line=accent_moderate, line_w=Pt(0.75))

        # Top accent bar (strong tier sutil)
        add_rect(slide, x, base_y, card_w, Inches(0.06), fill=accent_strong)

        # Icon label (kicker style)
        icon = str(item.get("icon_label") or "").strip().upper()
        if icon:
            add_tb(slide, x, base_y + Inches(0.2),
                   card_w, Inches(0.35),
                   icon,
                   size=FONT_SIZE["kicker"] + 1, bold=True, color=accent_moderate,
                   font=brand.font_heading, align=PP_ALIGN.CENTER,
                   line_spacing=1.0)

        # Text
        text = str(item.get("text") or "").strip()
        add_tb(slide, x + Inches(0.15), base_y + Inches(0.6),
               card_w - Inches(0.3), Inches(0.7),
               text,
               size=FONT_SIZE["body"], bold=True, color=brand.fg_primary,
               font=brand.font_heading, align=PP_ALIGN.CENTER,
               anchor=MSO_ANCHOR.MIDDLE, line_spacing=1.2)


def render(slide, spec: dict, brand: Brand = None) -> None:
    """Renderiza section divider em slide.

    Variantes: 'classic' (default), 'with_preview' (mini-viz preview).
    """
    b = brand or get_brand()

    # P1.7 — Brand semantics
    accent_strong = getattr(b, "accent_strong", b.accent)
    accent_moderate = getattr(b, "accent_moderate", b.accent)

    variant = (spec.get("variant") or "classic").lower().strip()

    if variant == "with_preview":
        _render_with_preview(slide, spec, b, accent_strong, accent_moderate)
    else:
        _render_classic(slide, spec, b, accent_strong, accent_moderate)
