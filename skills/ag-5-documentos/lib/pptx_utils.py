"""Utilitarios PPTX — resolucao de fontes com fallback Helvetica.

Criado em 2026-04-25 junto com a migracao Montserrat (raiz_tokens FONT_SIZE).
Quando uma family declarada (ex: "Montserrat") nao esta instalada no sistema
host onde o PPTX e renderizado para PDF (LibreOffice/soffice/macOS preview),
o python-pptx ainda escreve o nome da fonte no XML — porem o renderizador
substitui por um fallback nao-deterministico que costuma quebrar metricas
(line-height, kerning, peso visual).

Para evitar isso, esta camada faz:

1. `is_font_available(family)` — varre diretorios canonicos de fontes (macOS,
   Linux, Windows-via-WSL) procurando arquivos .ttf/.otf que contenham a
   family no nome. Cache em memoria para nao reescanear.
2. `resolve_font_family(preferred, fallback="Helvetica")` — retorna `preferred`
   se disponivel, senao loga warning UMA vez por (preferred, fallback) e
   retorna fallback. Helvetica e' fallback canonico macOS (sempre presente)
   e geralmente disponivel em Linux via fontconfig (DejaVu mapping).
3. `_resolve_font_path(family)` — retorna o path absoluto do .ttf/.otf
   correspondente (None se nao achar). Util para Pillow `ImageFont.truetype`
   ao gerar exhibits raster.
"""
from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# Diretorios padrao por plataforma — ordem prioritaria
_FONT_DIRS = [
    Path.home() / "Library/Fonts",                          # macOS user
    Path("/Library/Fonts"),                                 # macOS system
    Path("/System/Library/Fonts"),                          # macOS system core
    Path("/System/Library/Fonts/Supplemental"),             # macOS supplemental
    Path.home() / ".local/share/fonts",                     # Linux user
    Path.home() / ".fonts",                                 # Linux legacy
    Path("/usr/share/fonts"),                               # Linux system
    Path("/usr/local/share/fonts"),                         # Linux extra
    Path("C:/Windows/Fonts"),                               # WSL/Windows
]

# Cache: family lower-case → path | None | False (=miss)
_FONT_CACHE: dict[str, Optional[Path]] = {}
_WARNED_FALLBACKS: set[tuple[str, str]] = set()


def _scan_for_family(family: str) -> Optional[Path]:
    """Procura recursivamente um arquivo .ttf/.otf cujo nome bate com family.

    Match case-insensitive. Aceita variacoes com hifen, underscore, espaco.
    Prefere -Regular sobre -Bold/-Italic quando ambos existem.
    """
    needle_compact = family.lower().replace(" ", "").replace("-", "").replace("_", "")
    candidates: list[Path] = []

    for base in _FONT_DIRS:
        if not base.exists():
            continue
        try:
            for path in base.rglob("*"):
                if path.suffix.lower() not in (".ttf", ".otf", ".ttc"):
                    continue
                stem = path.stem.lower().replace(" ", "").replace("-", "").replace("_", "")
                if needle_compact in stem:
                    candidates.append(path)
        except (OSError, PermissionError):
            continue

    if not candidates:
        return None

    # Prefere Regular > Medium > qualquer outro
    for keyword in ("regular", "medium", "book"):
        for c in candidates:
            if keyword in c.stem.lower():
                return c
    return candidates[0]


def _resolve_font_path(family: str) -> Optional[Path]:
    """Retorna path absoluto do .ttf/.otf da family ou None se ausente.

    Use quando precisar passar para Pillow `ImageFont.truetype` ou ferramentas
    que exigem path explicito. Cache em memoria.
    """
    key = family.lower().strip()
    if key in _FONT_CACHE:
        return _FONT_CACHE[key]
    found = _scan_for_family(family)
    _FONT_CACHE[key] = found
    return found


def is_font_available(family: str) -> bool:
    """True se uma fonte da family `family` esta disponivel no sistema."""
    return _resolve_font_path(family) is not None


def resolve_font_family(preferred: str, fallback: str = "Helvetica") -> str:
    """Retorna `preferred` se instalado, senao `fallback` (com warning unico).

    Use ao gerar PPTX para que o nome escrito no XML corresponda a uma fonte
    que o renderizador (LibreOffice/PowerPoint) consegue resolver localmente.
    """
    if is_font_available(preferred):
        return preferred

    pair = (preferred, fallback)
    if pair not in _WARNED_FALLBACKS:
        _WARNED_FALLBACKS.add(pair)
        logger.warning(
            "[pptx_utils] Fonte %r nao encontrada nos diretorios padrao "
            "(macOS Library/Fonts, Linux /usr/share/fonts, etc). "
            "Caindo para fallback %r. "
            "Para evitar este warning instale a fonte no sistema.",
            preferred, fallback,
        )
    return fallback


__all__ = [
    "is_font_available",
    "resolve_font_family",
    "_resolve_font_path",
]
