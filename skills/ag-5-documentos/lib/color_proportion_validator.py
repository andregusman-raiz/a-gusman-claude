"""Color proportion validator (PR 2.3) — proporcao 70/20/10 + strategic bold.

Implementa secao 17.2, 17.3, 17.4 do guia mestre:
  - 70% neutro (text/bg/borders), 20% accent (brand), 10% destaque (semantic)
  - Funcoes semanticas de cor (problema/ganho/secundario)
  - "Uma cor forte por slide" — anti-pattern detector
  - Strategic bold (max 30% bullets em bold)

Heuristica baseada em area de fill por shape (nao pixel-perfect mas eficaz).

API publica:
  - audit_slide_color_proportion(slide, slide_num=0)
      -> List[AuditWarning]
  - audit_strategic_bold(slide, slide_num=0)
      -> List[AuditWarning]
"""
from __future__ import annotations

from typing import List, Optional, Set, Tuple

from .audit import AuditWarning


# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------
_CATEGORY_COLOR = "color_proportion"
_CATEGORY_BOLD = "strategic_bold"
_DEFAULT_SEVERITY = "low"

# Cores neutral canonical (text, bg, borders)
_NEUTRAL_HEX_PREFIXES = (
    "FFFFFF", "F8F8F8", "F5F5F5", "F0F0F0",  # white/off-white
    "1E2433", "0B1B2B", "2A3441",            # navy text/sidebar
    "1A1A1A", "2C2C2C", "374151",            # near-black text
    "9CA3AF", "6B7280", "4B5563",            # gray scale
    "E5E7EB", "D1D5DB",                       # light borders
)

# Cores accent brand (orange + teal Raiz)
_ACCENT_BRAND_HEX_PREFIXES = (
    "F7941D", "D97B10", "FDE8C8",  # orange
    "5BB5A2", "3D9A87", "D4EFE9",  # teal
)

# Cores destaque semantic (red/green/yellow para meaning)
_HIGHLIGHT_SEMANTIC_HEX_PREFIXES = (
    "DC2626", "EF4444", "B91C1C",  # red (problema)
    "059669", "10B981", "047857",  # green (ganho)
    "F59E0B", "FBBF24", "EAB308",  # yellow (atencao)
)

# Strategic bold threshold
_BOLD_RATIO_MAX = 0.30  # max 30% dos bullets podem ser bold


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _shape_fill_hex(shape) -> Optional[str]:
    """Retorna hex (uppercase) do fill solid de um shape, ou None."""
    try:
        # python-pptx: fill.type pode ser enum MSO_FILL_TYPE; SOLID = 1
        fill_type = shape.fill.type
        if fill_type is None:
            return None
        # Comparacao numerica funciona para enum int-like
        if int(fill_type) != 1:
            return None
        color = shape.fill.fore_color.rgb
        if color is None:
            return None
        # RGBColor extends tuple; str(color) -> 'RRGGBB'
        return str(color).upper()
    except (AttributeError, TypeError, KeyError, ValueError):
        return None


def _classify_hex(hex_str: str) -> str:
    """Classifica hex em 'neutral', 'brand', 'highlight', 'other'."""
    hex_upper = hex_str.upper()
    if any(hex_upper.startswith(p) for p in _NEUTRAL_HEX_PREFIXES):
        return "neutral"
    if any(hex_upper.startswith(p) for p in _ACCENT_BRAND_HEX_PREFIXES):
        return "brand"
    if any(hex_upper.startswith(p) for p in _HIGHLIGHT_SEMANTIC_HEX_PREFIXES):
        return "highlight"
    return "other"


def _shape_area(shape) -> int:
    """Area em EMU^2."""
    try:
        return (shape.width or 0) * (shape.height or 0)
    except (AttributeError, TypeError):
        return 0


# ---------------------------------------------------------------------------
# API publica — Color proportion 70/20/10
# ---------------------------------------------------------------------------
def audit_slide_color_proportion(slide, slide_num: int = 0,
                                   ) -> List[AuditWarning]:
    """Audita proporcao de cores no slide vs 70/20/10 canonical.

    Heuristica: soma areas (em EMU^2) de fills por categoria.
    Note: nao inclui cores de texto (fonts) — apenas fills de shapes.

    Args:
        slide: pptx.slide.Slide
        slide_num: numero do slide (1-indexed)

    Retorna lista de AuditWarning. Severity: 'low'.
    """
    warnings: List[AuditWarning] = []

    area_by_class = {"neutral": 0, "brand": 0, "highlight": 0, "other": 0}
    distinct_brand_hexes: Set[str] = set()
    distinct_highlight_hexes: Set[str] = set()

    for shape in slide.shapes:
        hex_str = _shape_fill_hex(shape)
        if hex_str is None:
            continue
        klass = _classify_hex(hex_str)
        area = _shape_area(shape)
        area_by_class[klass] += area
        if klass == "brand":
            distinct_brand_hexes.add(hex_str.upper())
        elif klass == "highlight":
            distinct_highlight_hexes.add(hex_str.upper())

    total = sum(area_by_class.values())
    if total == 0:
        return warnings  # slide sem fills classificaveis

    # Proporcoes
    pct_brand = area_by_class["brand"] / total
    pct_highlight = area_by_class["highlight"] / total

    # Regra 1: brand color < 30% (canonical 20%, com tolerancia +10%)
    if pct_brand > 0.30:
        warnings.append(AuditWarning(
            slide_num, _CATEGORY_COLOR, _DEFAULT_SEVERITY,
            f"[PR2.3] Cor accent brand em {pct_brand*100:.0f}% do slide "
            f"(canonical: ~20%, max 30% — risco de virar 'orange-decorativo')"
        ))

    # Regra 2: highlight color < 15% (canonical 10%)
    if pct_highlight > 0.15:
        warnings.append(AuditWarning(
            slide_num, _CATEGORY_COLOR, _DEFAULT_SEVERITY,
            f"[PR2.3] Cor highlight semantic em {pct_highlight*100:.0f}% do slide "
            f"(canonical: ~10%, max 15%)"
        ))

    # Regra 3: "uma cor forte por slide" — max 1 highlight distinct + 2 brand distinct
    if len(distinct_highlight_hexes) > 1:
        warnings.append(AuditWarning(
            slide_num, _CATEGORY_COLOR, _DEFAULT_SEVERITY,
            f"[PR2.3] {len(distinct_highlight_hexes)} cores highlight distintas "
            f"(canonical: 1 cor de destaque por slide)"
        ))

    return warnings


# ---------------------------------------------------------------------------
# API publica — Strategic bold (max 30% bullets em bold)
# ---------------------------------------------------------------------------
def audit_strategic_bold(slide, slide_num: int = 0) -> List[AuditWarning]:
    """Audita uso strategic de bold em paragrafos/bullets.

    Heuristica: conta paragrafos com pelo menos 1 run em bold vs total.
    Se mais de 30% estao em bold -> warning (perde enfase).

    Args:
        slide: pptx.slide.Slide
        slide_num: numero do slide (1-indexed)

    Retorna lista de AuditWarning. Severity: 'low'.
    """
    warnings: List[AuditWarning] = []

    total_paras = 0
    bold_paras = 0

    for shape in slide.shapes:
        if not shape.has_text_frame:
            continue
        for para in shape.text_frame.paragraphs:
            txt = (para.text or "").strip()
            if not txt:
                continue
            # Skip paragrafos muito curtos (provavel label/header)
            if len(txt) < 10:
                continue
            total_paras += 1
            for run in para.runs:
                try:
                    if run.font.bold:
                        bold_paras += 1
                        break
                except (AttributeError, TypeError):
                    continue

    if total_paras < 3:
        # Slide com poucos paragrafos: bold strategic nao se aplica
        return warnings

    bold_ratio = bold_paras / total_paras
    if bold_ratio > _BOLD_RATIO_MAX:
        warnings.append(AuditWarning(
            slide_num, _CATEGORY_BOLD, _DEFAULT_SEVERITY,
            f"[PR2.3] {bold_paras}/{total_paras} paragrafos em bold ({bold_ratio*100:.0f}%) "
            f"(canonical: <={_BOLD_RATIO_MAX*100:.0f}% para preservar enfase strategic)"
        ))

    return warnings


__all__ = [
    "audit_slide_color_proportion",
    "audit_strategic_bold",
]
