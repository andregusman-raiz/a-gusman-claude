"""Hero number — numero gigante 60-100pt + tese curta.

Input spec:
    {
        "number": "$40M",       # str — numero/valor a exibir grande
        "context": "economia/ano da Klarna ao substituir 700 atendentes por 1 IA",
                                # HARD LIMIT: 1 frase, max 12 palavras (P1.6d)
                                # Excedente sera truncado e movido para takeaway.
        "kicker": "ECONOMIA ANUAL",   # opcional, label acima do numero
        "source":  "Reuters, 2024",   # opcional, fonte
        "size_pt": 100,         # opcional, tamanho da fonte do numero (60-100)
    }

P1.6d — Caption HARD LIMIT:
  - Maximo 1 frase, 12 palavras (caracteres ate primeiro ponto/excl/inter)
  - Se input > 12 palavras: truncar com elipse "…"
  - NAO empilhar texto adicional abaixo do hero number
  - Excess sera retornado em spec['_overflow_to_takeaway'] para caller
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


CAPTION_MAX_WORDS = 12  # P1.6d HARD LIMIT


def _enforce_caption_limit(text: str, max_words: int = CAPTION_MAX_WORDS) -> tuple:
    """Aplica HARD LIMIT no caption: 1 frase, max N palavras.

    Returns (caption_truncado, overflow_text).
    overflow_text e o que foi cortado (para enviar a takeaway_bar).
    """
    if not text:
        return "", ""
    # Pegar apenas a primeira frase (ate ponto/excl/inter)
    import re as _re
    first_sentence_match = _re.match(r"([^.!?]+[.!?]?)", text.strip())
    first = first_sentence_match.group(1).strip() if first_sentence_match else text.strip()
    rest = text.strip()[len(first):].strip()

    words = first.split()
    if len(words) <= max_words:
        return first, rest
    truncated = " ".join(words[:max_words]) + "…"
    overflow = " ".join(words[max_words:])
    if rest:
        overflow = (overflow + " " + rest).strip()
    return truncated, overflow


def render(slide, spec: dict, brand: Brand = None) -> None:
    """Renderiza hero number layout em slide.

    Convencao de posicionamento:
      - Kicker (top-left, 0.6in)
      - Numero centralizado (linha do meio do slide)
      - Caption HARD LIMIT 12 palavras (P1.6d)
      - Source (rodape, italico cinza)

    P1.7 — Brand semantics:
      - Side panel/kicker: brand.accent_strong (laranja em raiz)
      - Numero/divisor accent: brand.accent_moderate (teal em raiz)
    """
    b = brand or get_brand()

    number = str(spec.get("number") or "").strip()
    context_raw = str(spec.get("context") or "").strip()
    kicker = str(spec.get("kicker") or "").strip()
    source = str(spec.get("source") or "").strip()
    size_pt = int(spec.get("size_pt") or 100)
    size_pt = max(60, min(110, size_pt))

    # P1.6d — Aplicar HARD LIMIT no caption
    context, overflow = _enforce_caption_limit(context_raw, CAPTION_MAX_WORDS)
    if overflow:
        # Expor overflow para caller — pode ir para takeaway_bar
        spec["_overflow_to_takeaway"] = overflow

    # P1.7 — accent_strong para kicker (high impact label)
    accent_strong = getattr(b, "accent_strong", b.accent)
    accent_moderate = getattr(b, "accent_moderate", b.accent)

    # Kicker (label acima do numero) — strong tier
    if kicker:
        add_tb(slide, MARGIN_L, Inches(2.0), CONTENT_W, Inches(0.4),
               kicker.upper(),
               size=FONT_SIZE["kicker"] + 2, bold=True, color=accent_strong,
               font=b.font_heading, align=PP_ALIGN.CENTER, line_spacing=1.0)

    # Numero gigante (centro vertical do slide)
    add_tb(slide, MARGIN_L, Inches(2.5), CONTENT_W, Inches(2.0),
           number,
           size=size_pt, bold=True, color=b.fg_primary,
           font=b.font_heading, align=PP_ALIGN.CENTER,
           anchor=MSO_ANCHOR.MIDDLE, line_spacing=1.0)

    # Divisor accent — moderate tier (P1.7 disciplinado)
    add_rect(slide, MARGIN_L + Inches(3.0), Inches(4.65),
             Inches(7.3), Inches(0.06), fill=accent_moderate)

    # Caption (1 frase, hard limit aplicado)
    add_tb(slide, MARGIN_L, Inches(4.85), CONTENT_W, Inches(0.7),
           context,
           size=FONT_SIZE["h2"], color=b.fg_primary, italic=False,
           font=b.font_body, align=PP_ALIGN.CENTER, line_spacing=1.3)

    # Source (rodape)
    if source:
        add_tb(slide, MARGIN_L, SLIDE_H - Inches(0.9), CONTENT_W, Inches(0.3),
               f"Fonte: {source}",
               size=FONT_SIZE["caption"], italic=True, color=b.fg_muted,
               font=b.font_body, align=PP_ALIGN.CENTER)
