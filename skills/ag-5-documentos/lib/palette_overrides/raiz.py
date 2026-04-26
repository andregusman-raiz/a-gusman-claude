"""Constantes nomeadas para brand semantics rAIz (P1.7).

Re-exports da paleta canonica rAIz com tier semantico. Permite imports
explicitos quando exhibits precisam declarar intencao de uso (ex:
`from lib.palette_overrides.raiz import ACCENT_STRONG`).

P1.7 — Brand semantics:
  ACCENT_STRONG   = RAIZ_ORANGE  (#F7941D) — capa, hero, divisor critico
  ACCENT_MODERATE = RAIZ_TEAL    (#5BB5A2) — takeaway bar, divider cyan
  ACCENT_NEUTRAL  = SIDEBAR      (#1E2433) — navy body backgrounds

Uso recomendado:
  cover_slide         -> ACCENT_STRONG (laranja)
  section_divider     -> chip ACCENT_STRONG + texto ACCENT_MODERATE
  hero_number         -> side panel ACCENT_STRONG + numbers ACCENT_MODERATE
  takeaway_bar        -> ACCENT_MODERATE
  default exhibits    -> ACCENT_MODERATE (manter disciplina McKinsey)

Resultado: deck preserva identidade Raiz (laranja em pontos-chave)
sem virar laranja-decorativo.
"""
from __future__ import annotations

from .. import raiz_tokens as rz
from . import raiz_brand as _raiz_factory


# Brand canonical (chama factory ja existente em __init__.py)
def get_raiz_brand():
    """Atalho: retorna instancia Brand canonical raiz."""
    return _raiz_factory()


# Constantes semantic tier — uso explicito por exhibits
ACCENT_STRONG = rz.RAIZ_ORANGE        # #F7941D — high impact
ACCENT_STRONG_DARK = rz.RAIZ_ORANGE_DARK  # #D97B10
ACCENT_STRONG_LIGHT = rz.RAIZ_ORANGE_LIGHT  # #FDE8C8

ACCENT_MODERATE = rz.RAIZ_TEAL        # #5BB5A2 — medium impact
ACCENT_MODERATE_DARK = rz.RAIZ_TEAL_DARK   # #3D9A87
ACCENT_MODERATE_LIGHT = rz.RAIZ_TEAL_LIGHT  # #D4EFE9

ACCENT_NEUTRAL = rz.SIDEBAR           # #1E2433 — navy neutral

# Mapping de exhibit kind -> tier preferred (referencia, nao bloqueante)
EXHIBIT_TIER_MAP = {
    "cover_slide":           "strong",
    "closing_slide":         "strong",
    "section_divider":       "strong",       # chip
    "section_divider_text":  "moderate",     # texto
    "hero_number_panel":     "strong",       # side panel
    "hero_number_value":     "moderate",     # numero em si
    "takeaway_bar":          "moderate",
    "matrix_2x2":            "moderate",
    "timeline_horizontal":   "moderate",
    "bar_chart_comparison":  "moderate",
    "stack_hierarchy":       "moderate",
    "process_flow":          "moderate",
    "risk_heatmap":          "moderate",
    "decision_slide":        "moderate",
    "before_after_arrow":    "moderate",
    "quote_slide":           "moderate",
}


def tier_color(tier: str) -> str:
    """Retorna hex para tier semantico ('strong' | 'moderate' | 'neutral')."""
    if tier == "strong":
        return ACCENT_STRONG
    if tier == "moderate":
        return ACCENT_MODERATE
    if tier == "neutral":
        return ACCENT_NEUTRAL
    return ACCENT_MODERATE   # default disciplinado


def tier_for_exhibit(kind: str, default: str = "moderate") -> str:
    """Retorna tier preferred para exhibit kind (do mapping canonical)."""
    return EXHIBIT_TIER_MAP.get(kind, default)


__all__ = [
    "ACCENT_STRONG",   "ACCENT_STRONG_DARK",  "ACCENT_STRONG_LIGHT",
    "ACCENT_MODERATE", "ACCENT_MODERATE_DARK","ACCENT_MODERATE_LIGHT",
    "ACCENT_NEUTRAL",
    "EXHIBIT_TIER_MAP",
    "tier_color", "tier_for_exhibit",
    "get_raiz_brand",
]
