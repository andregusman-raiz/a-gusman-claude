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


@dataclass(frozen=True)
class Brand:
    """Representa um brand completo (paleta + fontes).

    Todos os campos sao hex strings (#RRGGBB). Conversao para RGBColor
    deve usar raiz_tokens.rgb(...) no consumidor.
    """
    name: str
    # Principais
    primary: str          # cor dominante (sidebar, headers em dark bg)
    accent: str           # brand accent (CTA, takeaway bar, linhas)
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


def raiz() -> Brand:
    """Brand default — rAIz Educacao (orange + teal + IBM Plex Sans)."""
    return Brand(
        name="raiz",
        primary      = rz.SIDEBAR,           # #1E2433 (dark surface)
        accent       = rz.RAIZ_ORANGE,       # #F7941D
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
        font_heading = rz.FONT_HEADING,
        font_body    = rz.FONT_BODY,
        description  = "rAIz Educacao — orange + teal · IBM Plex Sans",
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
    "raiz":    raiz,
    "inspira": inspira,
}


def get_brand(name: Optional[str] = None) -> Brand:
    """Retorna Brand pelo nome. Default: raiz. Desconhecido -> raiz com warning."""
    name = (name or "raiz").lower().strip()
    factory = _REGISTRY.get(name)
    if factory is None:
        import warnings
        warnings.warn(f"Brand '{name}' nao registrado, usando 'raiz' default.", stacklevel=2)
        factory = raiz
    return factory()


__all__ = ["Brand", "get_brand", "raiz", "inspira"]
