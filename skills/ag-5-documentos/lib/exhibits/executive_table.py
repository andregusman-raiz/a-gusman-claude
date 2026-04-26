"""Executive table — tabela executiva McKinsey-grade (9 regras secao 21).

Regras embutidas:
  1. Header bold, fundo accent claro
  2. Zebra opcional (only_if rows > 5)
  3. Numericos right-aligned, units no header
  4. Max 7 colunas (warning se exceder)
  5. Sem gridlines internas (apenas border externa)
  6. Cor accent so em destaque (max 1 col destacada)
  7. Source line obrigatoria
  8. Total row bold (opcional via flag)
  9. Action title obrigatorio

Input spec (content):
    {
        "action_title": "Receita 2026 cresce 18% liderada por digital",
        "headers": [
            {"label": "Linha de negocio", "align": "left"},
            {"label": "Receita", "unit": "R$ M", "align": "right", "highlight": True},
            {"label": "Crescimento", "unit": "%",  "align": "right"},
            {"label": "Margem",      "unit": "%",  "align": "right"},
        ],
        "rows": [
            ["Digital",     "245", "+32", "28"],
            ["Servicos",    "180", "+12", "22"],
            ["Produtos",    "95",  "+5",  "18"],
        ],
        "totals_row": ["Total",  "520", "+18", "24"],   # opcional
        "source": "Relatorio anual 2026"
    }
"""
from __future__ import annotations

import logging
from typing import Optional

from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

from ..mckinsey_pptx import (
    CONTENT_W, MARGIN_L, SLIDE_H, SLIDE_W,
    action_title, add_rect, add_tb, source_line,
)
from ..palette_overrides import Brand, get_brand
from ..raiz_tokens import FONT_SIZE


_LOG = logging.getLogger(__name__)

MAX_COLUMNS = 7
ZEBRA_THRESHOLD = 5
HIGHLIGHT_COL_LIMIT = 1


EXAMPLE_INPUT = {
    "action_title": "Receita 2026 cresce 18% liderada por linha digital",
    "headers": [
        {"label": "Linha de negocio", "align": "left"},
        {"label": "Receita", "unit": "R$ M", "align": "right", "highlight": True},
        {"label": "Crescimento", "unit": "%", "align": "right"},
        {"label": "Margem",      "unit": "%", "align": "right"},
    ],
    "rows": [
        ["Digital",     "245", "+32", "28"],
        ["Servicos",    "180", "+12", "22"],
        ["Produtos",    "95",  "+5",  "18"],
    ],
    "totals_row": ["Total", "520", "+18", "24"],
    "source": "Relatorio Executivo Anual 2026",
}


def _align_for(align: str) -> int:
    return {"left": PP_ALIGN.LEFT, "right": PP_ALIGN.RIGHT,
            "center": PP_ALIGN.CENTER}.get(align, PP_ALIGN.LEFT)


def _validate(content: dict) -> list[str]:
    errors: list[str] = []
    if not content.get("action_title"):
        errors.append("executive_table: action_title eh obrigatorio")
    headers = content.get("headers")
    if not isinstance(headers, list) or not headers:
        errors.append("executive_table: 'headers' deve ser lista nao-vazia")
    rows = content.get("rows")
    if not isinstance(rows, list):
        errors.append("executive_table: 'rows' deve ser lista")
    if not content.get("source"):
        errors.append("executive_table: 'source' eh obrigatorio (regra 7)")
    return errors


def _count_highlights(headers: list[dict]) -> int:
    return sum(1 for h in headers if h.get("highlight"))


def render(slide, content: dict, brand: Optional[Brand] = None) -> None:
    """Renderiza tabela executiva.

    Args:
        slide: pptx.slide.Slide alvo
        content: dict com action_title, headers, rows, totals_row?, source
        brand: Brand opcional

    Raises:
        ValueError: se schema invalido
    """
    errors = _validate(content)
    if errors:
        raise ValueError("executive_table content invalido: " + "; ".join(errors))

    b = brand or get_brand()
    headers: list[dict] = content["headers"]
    rows: list[list[str]] = content["rows"]
    totals_row: Optional[list[str]] = content.get("totals_row")
    source: str = content["source"]

    # Regra 4: max 7 colunas
    n_cols = len(headers)
    if n_cols > MAX_COLUMNS:
        _LOG.warning(
            "executive_table: %d colunas excede limite McKinsey (%d). "
            "Considere quebrar em multiplas tabelas ou agrupar.",
            n_cols, MAX_COLUMNS,
        )

    # Regra 6: max 1 col destacada
    n_highlights = _count_highlights(headers)
    if n_highlights > HIGHLIGHT_COL_LIMIT:
        _LOG.warning(
            "executive_table: %d colunas com highlight excede limite (%d). "
            "Apenas 1 destaque por tabela mantem foco visual.",
            n_highlights, HIGHLIGHT_COL_LIMIT,
        )

    # Header
    action_title(slide, content["action_title"], brand=b)

    # Layout
    table_top = Inches(1.7)
    table_bottom = SLIDE_H - Inches(1.0)
    table_h = table_bottom - table_top
    col_w = CONTENT_W / max(n_cols, 1)

    n_rows = len(rows) + (1 if totals_row else 0)
    header_h = Inches(0.5)
    row_h = (table_h - header_h) / max(n_rows, 1) if n_rows else Inches(0.4)
    # Cap row height
    max_row_h = Inches(0.45)
    if row_h > max_row_h:
        row_h = max_row_h

    # Border externa (regra 5)
    total_table_h = header_h + row_h * n_rows
    add_rect(slide, MARGIN_L, table_top, CONTENT_W, total_table_h,
             fill=b.surface, line=b.border, line_w=Pt(0.75))

    # Header bg accent claro (regra 1)
    add_rect(slide, MARGIN_L, table_top, CONTENT_W, header_h,
             fill=b.accent_light, line=b.accent_light, line_w=Pt(0.0))

    # Header cells
    for i, h in enumerate(headers):
        x = MARGIN_L + i * col_w
        label = str(h.get("label", ""))
        unit = h.get("unit")
        if unit:
            label = f"{label} ({unit})"   # Regra 3: unit no header
        align = _align_for(h.get("align", "left"))
        is_highlight = bool(h.get("highlight"))

        if is_highlight and i <= n_cols - 1:
            # Highlight column header — top accent strip
            add_rect(slide, x, table_top, col_w, Inches(0.06), fill=b.accent)

        pad_x = Inches(0.15)
        add_tb(slide, x + pad_x, table_top + Inches(0.08),
               col_w - 2 * pad_x, header_h - Inches(0.16),
               label, size=FONT_SIZE["table"], bold=True,
               color=b.fg_primary, font=b.font_heading,
               align=align, anchor=MSO_ANCHOR.MIDDLE)

    # Body rows
    use_zebra = len(rows) > ZEBRA_THRESHOLD   # Regra 2
    for r_idx, row in enumerate(rows):
        y = table_top + header_h + r_idx * row_h
        if use_zebra and r_idx % 2 == 1:
            add_rect(slide, MARGIN_L, y, CONTENT_W, row_h,
                     fill=b.bg_light, line=b.bg_light, line_w=Pt(0.0))
        for c_idx, cell_val in enumerate(row[:n_cols]):
            x = MARGIN_L + c_idx * col_w
            header = headers[c_idx]
            align = _align_for(header.get("align", "left"))
            color = b.accent_dark if header.get("highlight") else b.fg_primary
            pad_x = Inches(0.15)
            add_tb(slide, x + pad_x, y + Inches(0.03),
                   col_w - 2 * pad_x, row_h - Inches(0.06),
                   str(cell_val), size=FONT_SIZE["table"],
                   color=color, font=b.font_body,
                   align=align, anchor=MSO_ANCHOR.MIDDLE)

    # Totals row (regra 8, opcional)
    if totals_row:
        y = table_top + header_h + len(rows) * row_h
        # Linha divisoria sutil
        add_rect(slide, MARGIN_L, y, CONTENT_W, Inches(0.02), fill=b.border)
        for c_idx, cell_val in enumerate(totals_row[:n_cols]):
            x = MARGIN_L + c_idx * col_w
            header = headers[c_idx]
            align = _align_for(header.get("align", "left"))
            pad_x = Inches(0.15)
            add_tb(slide, x + pad_x, y + Inches(0.05),
                   col_w - 2 * pad_x, row_h - Inches(0.1),
                   str(cell_val), size=FONT_SIZE["table"], bold=True,
                   color=b.fg_primary, font=b.font_heading,
                   align=align, anchor=MSO_ANCHOR.MIDDLE)

    # Source (regra 7, obrigatorio)
    source_line(slide, source, brand=b)
