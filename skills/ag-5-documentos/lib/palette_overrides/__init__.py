"""Palette overrides por cliente/brand.

Default: raiz (importa raiz_tokens).
Overrides conhecidos: inspira.

Uso:
    from lib.palette_overrides import get_brand
    brand = get_brand("inspira")   # ou "raiz" (default)
    primary = brand.primary
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from pptx.dml.color import RGBColor

from .. import raiz_tokens as rz
from ..pptx_utils import resolve_font_family


@dataclass(frozen=True)
class Brand:
    """Representa um brand completo (paleta + fontes).

    Todos os campos sao hex strings (#RRGGBB). Conversao para RGBColor
    deve usar raiz_tokens.rgb(...) no consumidor.

    [P1.7] Brand semantics tiers:
      - accent_strong  — usar em pontos-chave de identidade (capa, hero
                         side-bars, divisores criticos). Pouca recorrencia.
      - accent_moderate — accent secundario disciplinado (takeaway bars,
                          dividers cyan, accents secundarios).
      - accent_neutral — body backgrounds, navy escuro, areas neutras.

    Quando definir accent_strong/moderate/neutral nos overrides, exhibits
    canonicos (cover/section_divider/hero_number/takeaway_bar) escolhem
    o tier semantico apropriado em vez de usar accent monoliticamente.
    """
    name: str
    # Principais
    primary: str          # cor dominante (sidebar, headers em dark bg)
    accent: str           # brand accent (CTA, takeaway bar, linhas) — backward compat
    primary_dark: str     # hover/pressed
    accent_dark: str
    accent_light: str     # background tint
    # Semantic
    bg_light: str
    surface: str
    fg_primary: str
    fg_muted: str
    border: str
    # Status (semaforo — usado APENAS em status pills)
    success: str
    warning: str
    danger: str
    info: str
    # Typography
    font_heading: str
    font_body: str
    # Metadata
    description: str
    # [P1.7] Brand semantics tiers (defaults derivados de accent quando nao informado)
    accent_strong:   str = ""   # capa, hero, divisor critico — high impact
    accent_moderate: str = ""   # takeaway bar, divider, callout — medium impact
    accent_neutral:  str = ""   # body bg, navy escuro — neutral

    def __post_init__(self):
        # Default fallback: tiers nao definidos -> derive from main accent/primary
        # Usa object.__setattr__ porque dataclass e frozen
        if not self.accent_strong:
            object.__setattr__(self, "accent_strong", self.accent)
        if not self.accent_moderate:
            object.__setattr__(self, "accent_moderate", self.accent)
        if not self.accent_neutral:
            object.__setattr__(self, "accent_neutral", self.primary)


def raiz_brand() -> Brand:
    """Brand default — rAIz Educacao (orange + teal + Montserrat).

    [P1.7] Brand semantics:
      - accent_strong  = RAIZ_ORANGE (#F7941D) — capa, hero, divisor critico
      - accent_moderate = RAIZ_TEAL (#5BB5A2) — takeaway bar, dividers cyan
      - accent_neutral = SIDEBAR (#1E2433) — navy body backgrounds

    Resultado: deck preserva identidade Raiz (laranja em pontos-chave)
    sem virar laranja-decorativo (anti-pattern McKinsey).
    """
    return Brand(
        name="raiz",
        primary      = rz.SIDEBAR,           # #1E2433 (dark surface)
        accent       = rz.RAIZ_ORANGE,       # #F7941D — backward compat
        primary_dark = rz.SIDEBAR,
        accent_dark  = rz.RAIZ_ORANGE_DARK,
        accent_light = rz.RAIZ_ORANGE_LIGHT,
        bg_light     = rz.BG_LIGHT,
        surface      = rz.SURFACE,
        fg_primary   = rz.FG_PRIMARY,
        fg_muted     = rz.FG_MUTED,
        border       = rz.BORDER_LINE,
        success      = rz.STATUS_SUCCESS,
        warning      = rz.STATUS_WARNING,
        danger       = rz.STATUS_DANGER,
        info         = rz.STATUS_INFO,
        font_heading = resolve_font_family(rz.FONT_HEADING, fallback="Helvetica"),
        font_body    = resolve_font_family(rz.FONT_BODY,    fallback="Helvetica"),
        description  = "rAIz Educacao — orange + teal · Montserrat",
        # P1.7 — brand semantics tiers
        accent_strong   = rz.RAIZ_ORANGE,   # #F7941D — high impact (capa, hero)
        accent_moderate = rz.RAIZ_TEAL,     # #5BB5A2 — medium (takeaway, divider)
        accent_neutral  = rz.SIDEBAR,       # #1E2433 — neutral (body bg)
    )


def inspira() -> Brand:
    """Override para Inspira Rede de Educadores (navy + cyan)."""
    return Brand(
        name="inspira",
        primary      = "#1E2433",   # navy
        accent       = "#3CBFE0",   # cyan institucional
        primary_dark = "#0B1728",
        accent_dark  = "#2A9FBD",
        accent_light = "#E3F4FA",
        bg_light     = rz.BG_LIGHT,
        surface      = rz.SURFACE,
        fg_primary   = rz.FG_PRIMARY,
        fg_muted     = rz.FG_MUTED,
        border       = rz.BORDER_LINE,
        success      = rz.STATUS_SUCCESS,
        warning      = rz.STATUS_WARNING,
        danger       = rz.STATUS_DANGER,
        info         = rz.STATUS_INFO,
        font_heading = "Calibri",   # cliente usa Calibri no PDSI oficial
        font_body    = "Calibri",
        description  = "Inspira Rede de Educadores — navy + cyan · Calibri",
    )


_REGISTRY = {
    "raiz":    raiz_brand,
    "inspira": inspira,
}


def get_brand(name: Optional[str] = None) -> Brand:
    """Retorna Brand pelo nome. Default: raiz. Desconhecido -> raiz com warning."""
    name = (name or "raiz").lower().strip()
    factory = _REGISTRY.get(name)
    if factory is None:
        import warnings
        warnings.warn(f"Brand '{name}' nao registrado, usando 'raiz' default.", stacklevel=2)
        factory = raiz_brand
    return factory()


# Backward-compat alias (NAO removido para nao quebrar callers externos
# que possam importar 'raiz' como factory). Note: o submodulo
# palette_overrides/raiz.py (P1.7) sobrescreve este nome no namespace do
# package quando importado, mas _REGISTRY ja tem a referencia capturada.
raiz = raiz_brand


__all__ = ["Brand", "get_brand", "raiz_brand", "raiz", "inspira"]
