"""Callout box — caixa de impacto standalone.

Diferente do takeaway_bar (rodape do slide), o callout_box e um exhibit autonomo
que ocupa a slide inteira com uma frase central de impacto.

Regras:
  - Border 2pt na cor accent
  - Background neutral leve
  - Icone opcional (renderizado como caractere unicode/emoji)
  - 1 frase unica (>=140 chars dispara warning)
  - Centralizado vertical e horizontalmente

Input spec:
    {
        "message": "Vencer 2026 exige decisao em <30 dias.",
        "accent_color": None,        # opcional, default brand.accent
        "icon": "!",                 # opcional, caractere ou emoji
    }
"""
from __future__ import annotations

import logging
from typing import Optional

from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

from ..mckinsey_pptx import (
    CONTENT_W, MARGIN_L, SLIDE_H, SLIDE_W,
    add_rect, add_tb,
)
from ..palette_overrides import Brand, get_brand
from ..raiz_tokens import FONT_SIZE


_LOG = logging.getLogger(__name__)

MAX_MESSAGE_CHARS = 140


EXAMPLE_INPUT = {
    "message": "Vencer 2026 exige decisao executiva em menos de 30 dias.",
    "accent_color": None,
    "icon": "!",
}


def _validate(content: dict) -> list[str]:
    errors: list[str] = []
    msg = content.get("message")
    if not msg or not isinstance(msg, str):
        errors.append("callout_box: 'message' eh obrigatorio (string nao-vazia)")
    return errors


def render(slide, content: dict, brand: Optional[Brand] = None) -> None:
    """Renderiza callout box.

    Args:
        slide: pptx.slide.Slide alvo
        content: dict com message + accent_color? + icon?
        brand: Brand opcional

    Raises:
        ValueError: se 'message' ausente
    """
    errors = _validate(content)
    if errors:
        raise ValueError("callout_box content invalido: " + "; ".join(errors))

    b = brand or get_brand()
    message: str = content["message"].strip()
    accent: str = content.get("accent_color") or b.accent
    icon: Optional[str] = content.get("icon")

    if len(message) > MAX_MESSAGE_CHARS:
        _LOG.warning(
            "callout_box: message com %d chars excede limite (%d). "
            "Frase mais longa reduz impacto visual.",
            len(message), MAX_MESSAGE_CHARS,
        )

    # Container ocupa area central (deixa espaco para chrome no topo/rodape)
    box_w = CONTENT_W - Inches(1.0)
    box_h = Inches(3.6)
    box_x = MARGIN_L + Inches(0.5)
    box_y = (SLIDE_H - box_h) / 2

    # Background neutral leve
    add_rect(slide, box_x, box_y, box_w, box_h,
             fill=b.bg_light, line=accent, line_w=Pt(2.0))

    # Icone opcional (esquerda, centralizado vertical)
    text_x = box_x + Inches(0.5)
    text_w = box_w - Inches(1.0)
    if icon:
        icon_w = Inches(1.0)
        add_tb(slide, box_x + Inches(0.3), box_y, icon_w, box_h,
               icon, size=FONT_SIZE["hero"], bold=True, color=accent,
               font=b.font_heading, align=PP_ALIGN.CENTER,
               anchor=MSO_ANCHOR.MIDDLE)
        text_x = box_x + icon_w + Inches(0.4)
        text_w = box_w - icon_w - Inches(0.7)

    # Mensagem central
    add_tb(slide, text_x, box_y, text_w, box_h,
           message, size=FONT_SIZE["h2"], bold=True, color=b.fg_primary,
           font=b.font_heading, align=PP_ALIGN.LEFT,
           anchor=MSO_ANCHOR.MIDDLE, line_spacing=1.3)
