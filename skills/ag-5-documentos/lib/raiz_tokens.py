"""Carrega tokens oficiais da rAIz Design Library.

Fonte de verdade: ~/Claude/assets/design-library/tokens/*.json
Qualquer hex/font aqui e canonico. NUNCA hardcodar cores no codigo.

Se os tokens mudarem, este modulo re-le do disco — sem rebuild.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Tuple

from pptx.dml.color import RGBColor

_TOKENS_DIR = Path.home() / "Claude/assets/design-library/tokens"


def _load(name: str) -> dict:
    path = _TOKENS_DIR / f"{name}.json"
    if not path.exists():
        raise FileNotFoundError(
            f"rAIz tokens nao encontrados em {path}. "
            f"Verifique ~/Claude/assets/design-library/tokens/."
        )
    return json.loads(path.read_text(encoding="utf-8"))


# Raw dicts (machine-readable)
COLORS = _load("colors")
TYPO   = _load("typography")
SPACE  = _load("spacing") if (_TOKENS_DIR / "spacing.json").exists() else {}
RADII  = _load("radii")  if (_TOKENS_DIR / "radii.json").exists() else {}


def rgb(hex_color: str) -> RGBColor:
    """Converte '#RRGGBB' para pptx RGBColor."""
    h = hex_color.lstrip("#")
    if len(h) == 3:  # #RGB shortcut
        h = "".join(c * 2 for c in h)
    if len(h) != 6:
        raise ValueError(f"Hex invalido: {hex_color!r}")
    return RGBColor(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


# -----------------------------------------------------------------------
# DEFAULT BRAND — rAIz Educacao
# -----------------------------------------------------------------------
# Usar via `palette_overrides.raiz` (factory). Estes sao os hex crus
# carregados do JSON oficial; overrides de cliente redefinem em seus modulos.

# Brand principal
RAIZ_ORANGE        = COLORS["brand"]["orange"]["base"]["hex"]   # #F7941D
RAIZ_ORANGE_DARK   = COLORS["brand"]["orange"]["dark"]["hex"]   # #D97B10
RAIZ_ORANGE_LIGHT  = COLORS["brand"]["orange"]["light"]["hex"]  # #FDE8C8

RAIZ_TEAL          = COLORS["brand"]["teal"]["base"]["hex"]     # #5BB5A2
RAIZ_TEAL_DARK     = COLORS["brand"]["teal"]["dark"]["hex"]     # #3D9A87
RAIZ_TEAL_LIGHT    = COLORS["brand"]["teal"]["light"]["hex"]    # #D4EFE9

# Semantic
BG_LIGHT           = COLORS["semantic"]["background"]["light"]  # #F8F9FA
SURFACE            = COLORS["semantic"]["surface"]["light"]     # #FFFFFF
FG_PRIMARY         = COLORS["semantic"]["foreground"]["light"]  # #1A202C
FG_MUTED           = COLORS["semantic"]["muted"]["light"]       # #718096
BORDER_LINE        = COLORS["semantic"]["border"]["light"]      # #E2E8F0
SIDEBAR            = COLORS["semantic"]["sidebar"]["light"]     # #1E2433

# Status
STATUS_SUCCESS     = COLORS["status"]["success"]["hex"]         # #2D9E6B
STATUS_WARNING     = COLORS["status"]["warning"]["hex"]         # #E8A820
STATUS_DANGER      = COLORS["status"]["danger"]["hex"]          # #DC3545
STATUS_INFO        = COLORS["status"]["info"]["hex"]            # #3B82F6

# Typography
FONT_HEADING = TYPO["fonts"]["heading"]["family"]  # "IBM Plex Sans"
FONT_BODY    = TYPO["fonts"]["sans"]["family"]     # "IBM Plex Sans"
FONT_MONO    = TYPO["fonts"]["mono"]["family"]     # "IBM Plex Mono"

# Tipografia canonica PPTX (mapeada da escala text-xs → text-[30px])
FONT_SIZE = {
    "kicker":    9,    # SECTION KICKER no chrome
    "caption":   9,    # captions, source lines
    "body_sm":   10,   # body compact, bullets
    "body":      11,   # body padrao em slides
    "subtitle":  12,   # subtitulo abaixo do action title
    "takeaway":  12,   # takeaway bar
    "label":     13,   # labels destacados em cards
    "h3":        15,   # titulos de cards/quadrantes
    "h2":        18,   # titulos secundarios
    "h1":        24,   # action title (escala text-2xl)
    "hero":      36,   # KPIs medios
    "hero_xl":   52,   # KPIs grandes em capa
}


def describe_brand() -> str:
    """Util para debug: retorna descritivo do brand default."""
    return (
        f"rAIz Educacao — orange {RAIZ_ORANGE} / teal {RAIZ_TEAL} · "
        f"font {FONT_HEADING} · bg {BG_LIGHT} · sidebar {SIDEBAR}"
    )


__all__ = [
    "COLORS", "TYPO", "SPACE", "RADII",
    "rgb", "describe_brand",
    "RAIZ_ORANGE", "RAIZ_ORANGE_DARK", "RAIZ_ORANGE_LIGHT",
    "RAIZ_TEAL", "RAIZ_TEAL_DARK", "RAIZ_TEAL_LIGHT",
    "BG_LIGHT", "SURFACE", "FG_PRIMARY", "FG_MUTED", "BORDER_LINE", "SIDEBAR",
    "STATUS_SUCCESS", "STATUS_WARNING", "STATUS_DANGER", "STATUS_INFO",
    "FONT_HEADING", "FONT_BODY", "FONT_MONO", "FONT_SIZE",
]
