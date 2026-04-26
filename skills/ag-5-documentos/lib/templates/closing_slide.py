"""Template: slide de encerramento — 1 frase + 1 visual (P1.6b).

Refactor v2 (P1.6b):
  Closing slide nao deve ter 5 frases (anti-pattern v4 deck).
  Aceita:
    - headline:  str   — 1 frase principal (40-60pt)
    - visual:    dict  — silhueta, gradient ou abstract shape
    - subtext:   str   — 1 frase opcional (max), nao mais que isso

Schema valido:
    {
      "wordmark":        "inspira",                   # opcional
      "wordmark_sub":    "rede de educadores",        # opcional
      "headline":        "Vamos construir juntos.",   # OBRIGATORIO
      "subtext":         "Junho 2026.",               # OPCIONAL, max 1 frase
      "visual":          {                             # OPCIONAL
          "kind": "gradient",  # "gradient" | "silhouette" | "shape"
          "color_from": "#F7941D",
          "color_to":   "#5BB5A2",
      },
      "cta":             "raiz.com.br/proximos-passos",  # opcional rodape
      "metadata":        "Confidencial · 2026",          # opcional rodape
    }

Rejeicao automatica: se input tem >2 frases em headline+subtext,
levantar ValueError instructing caller para condensar.

P1.7 — Brand semantics:
  - Top accent bar  : brand.accent_strong (high impact)
  - Wordmark sub    : brand.accent_strong
  - Subtext italico : brand.accent_moderate (disciplina)
"""
from __future__ import annotations

import re

from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

from ..mckinsey_pptx import SLIDE_W, SLIDE_H, add_rect, add_tb, set_bg
from ..palette_overrides import Brand


def _count_sentences(text: str) -> int:
    """Conta frases (separadas por ponto/excl/inter)."""
    if not text:
        return 0
    parts = [p.strip() for p in re.split(r"[.!?]+", text) if p.strip()]
    return len(parts)


def _validate_text_budget(data: dict) -> None:
    """P1.6b — rejeita input com >2 frases em headline+subtext combinados."""
    headline = str(data.get("headline") or "").strip()
    subtext = str(data.get("subtext") or "").strip()
    total = _count_sentences(headline) + _count_sentences(subtext)
    if total > 2:
        raise ValueError(
            f"[P1.6b] closing_slide aceita max 2 frases combinadas "
            f"(headline + subtext). Recebido: {total}. "
            "Condensar mensagem ou mover excedente para slide anterior."
        )
    if not headline:
        raise ValueError("[P1.6b] closing_slide requer 'headline' obrigatorio (1 frase).")


def render(slide, data: dict, brand: Brand) -> None:
    """Renderiza closing slide minimalista — 1 frase + 1 visual."""
    # P1.6b — validar text budget antes de qualquer render
    _validate_text_budget(data)

    # P1.7 — Brand semantics
    accent_strong = getattr(brand, "accent_strong", brand.accent)
    accent_moderate = getattr(brand, "accent_moderate", brand.accent)

    set_bg(slide, brand.primary)
    add_rect(slide, 0, 0, SLIDE_W, Inches(0.12), fill=accent_strong)

    # Wordmark (opcional)
    if data.get("wordmark"):
        add_tb(slide, Inches(0.6), Inches(0.45), Inches(5), Inches(0.4),
               data.get("wordmark", ""),
               size=24, bold=True, color=brand.surface, font=brand.font_heading,
               line_spacing=1.0)
    if data.get("wordmark_sub"):
        add_tb(slide, Inches(0.6), Inches(0.82), Inches(5), Inches(0.25),
               data.get("wordmark_sub", ""),
               size=9, color=accent_strong, font=brand.font_body, line_spacing=1.0)

    # Visual (opcional) — gradient bar acima do headline (sutil)
    visual = data.get("visual") or {}
    if visual:
        kind = visual.get("kind", "gradient")
        if kind == "gradient" or kind == "shape":
            # Linha gradient como bar acima do headline (proxy simples)
            color = visual.get("color_from") or accent_strong
            add_rect(slide, Inches(0.8), Inches(2.5), Inches(2.5), Inches(0.08),
                     fill=color)

    # Headline — 1 frase principal (40-60pt)
    add_tb(slide, Inches(0.8), Inches(2.8), Inches(11.4), Inches(1.8),
           data.get("headline", ""),
           size=50, bold=True, color=brand.surface, font=brand.font_heading,
           line_spacing=1.1)

    # Subtext italico (opcional, max 1 frase)
    if data.get("subtext"):
        add_rect(slide, Inches(0.8), Inches(5.05), Inches(1.5), Inches(0.06),
                 fill=accent_moderate)
        add_tb(slide, Inches(0.8), Inches(5.2), Inches(11), Inches(0.6),
               data.get("subtext", ""),
               size=14, italic=True, color=accent_moderate, font=brand.font_body,
               line_spacing=1.3)

    # Rodape: cta + metadata (opcional)
    if data.get("cta"):
        add_tb(slide, Inches(0.6), SLIDE_H-Inches(0.65), Inches(8), Inches(0.3),
               data.get("cta", ""),
               size=11, bold=True, color=brand.surface, font=brand.font_body)
    if data.get("metadata"):
        add_tb(slide, Inches(0.6), SLIDE_H-Inches(0.35), Inches(8), Inches(0.25),
               data.get("metadata", ""),
               size=9, italic=True, color=brand.fg_muted, font=brand.font_body)
