"""SCQA slide — Situation, Complication, Question, Answer (Pyramid Principle).

Estrutura narrativa McKinsey-grade em layout 2x2:
  - Situation     | Complication
  - Question      | Answer

Cada secao tem:
  - Kicker accent (S/C/Q/A label colorido em bold)
  - Titulo curto (12-14 palavras)
  - Body 1-2 linhas

Header: action_title obrigatorio.
Footer: takeaway_bar opcional + source_line.

Input spec:
    {
        "action_title": "Pyramid Principle reduz tempo de comunicacao em 40%",
        "situation":    {"title": "Empresa X cresceu 3x em 2 anos",
                         "body":  "Time atual de 50 PMs entrega 12 features/mes."},
        "complication": {"title": "Comunicacao escalando exponencialmente",
                         "body":  "Reunioes consomem 35% do tempo da gerencia."},
        "question":     {"title": "Como reduzir overhead sem perder alinhamento?",
                         "body":  "Buscar metodologia provada de comunicacao executiva."},
        "answer":       {"title": "Pyramid Principle como padrao de docs e decks",
                         "body":  "Conclusao primeiro, sustentacao em arvore logica."},
        "takeaway":     "SCQA + Pyramid: 40% menos reunioes, 2x velocidade decisao",
        "source":       "McKinsey, Minto Pyramid (2019)"
    }
"""
from __future__ import annotations

from typing import Optional

from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

from ..mckinsey_pptx import (
    CONTENT_W, MARGIN_L, SLIDE_H, SLIDE_W,
    action_title, add_rect, add_tb, source_line, takeaway_bar,
)
from ..palette_overrides import Brand, get_brand
from ..raiz_tokens import FONT_SIZE


SECTION_KEYS = ("situation", "complication", "question", "answer")
SECTION_LABELS = {
    "situation":    "S — SITUACAO",
    "complication": "C — COMPLICACAO",
    "question":     "Q — PERGUNTA",
    "answer":       "A — RESPOSTA",
}


EXAMPLE_INPUT = {
    "action_title": "SCQA framework reduz tempo de decisao executiva em 40%",
    "situation": {
        "title": "Empresa cresceu 3x em 24 meses, time PM dobrou",
        "body":  "50 PMs entregam 12 features/mes; comunicacao consome 35% do tempo da gerencia.",
    },
    "complication": {
        "title": "Reunioes de alinhamento crescem exponencialmente com scale",
        "body":  "Cada decisao multi-area exige 3-5 reunioes; backlog de docs rasos cresce.",
    },
    "question": {
        "title": "Como manter velocidade de decisao com time 2x maior?",
        "body":  "Buscar metodologia de comunicacao executiva provada em organizacoes scale.",
    },
    "answer": {
        "title": "Adotar SCQA + Pyramid Principle como padrao",
        "body":  "Conclusao primeiro, sustentacao em arvore logica MECE de 3 niveis.",
    },
    "takeaway": "SCQA reduz reunioes em 40% e dobra velocidade de decisao",
    "source":   "McKinsey, Barbara Minto — Pyramid Principle",
}


def validate_content(content: dict) -> list[str]:
    """Valida content schema. Retorna lista de erros (vazia se ok)."""
    errors: list[str] = []
    if not content.get("action_title"):
        errors.append("scqa: action_title eh obrigatorio")
    for key in SECTION_KEYS:
        sec = content.get(key)
        if not isinstance(sec, dict):
            errors.append(f"scqa: secao '{key}' deve ser dict com keys 'title' e 'body'")
            continue
        if not sec.get("title"):
            errors.append(f"scqa: secao '{key}' sem 'title'")
        if not sec.get("body"):
            errors.append(f"scqa: secao '{key}' sem 'body'")
    return errors


def _kicker_color(b: Brand, key: str) -> str:
    """Cor accent por secao para criar gradacao visual."""
    return {
        "situation":    b.info,
        "complication": b.warning,
        "question":     b.accent,
        "answer":       b.success,
    }.get(key, b.accent)


def _render_section(slide, b: Brand, x, y, w, h,
                    label: str, title: str, body: str, accent: str) -> None:
    """Renderiza um quadrante S/C/Q/A."""
    # Container
    add_rect(slide, x, y, w, h, fill=b.surface, line=b.border, line_w=Pt(0.75))
    # Top accent strip
    add_rect(slide, x, y, w, Inches(0.08), fill=accent)

    pad_x = Inches(0.25)
    pad_y = Inches(0.2)

    # Kicker (S/C/Q/A label)
    add_tb(slide, x + pad_x, y + pad_y, w - 2 * pad_x, Inches(0.3),
           label, size=FONT_SIZE["body_sm"] - 1, bold=True, color=accent,
           font=b.font_heading, align=PP_ALIGN.LEFT)

    # Section title
    add_tb(slide, x + pad_x, y + pad_y + Inches(0.32),
           w - 2 * pad_x, Inches(0.7),
           title, size=FONT_SIZE["h3"] - 2, bold=True, color=b.fg_primary,
           font=b.font_heading, align=PP_ALIGN.LEFT, line_spacing=1.2)

    # Body
    add_tb(slide, x + pad_x, y + pad_y + Inches(1.05),
           w - 2 * pad_x, h - pad_y - Inches(1.2),
           body, size=FONT_SIZE["body"] - 2, color=b.fg_primary,
           font=b.font_body, align=PP_ALIGN.LEFT,
           anchor=MSO_ANCHOR.TOP, line_spacing=1.35)


def render(slide, content: dict, brand: Optional[Brand] = None) -> None:
    """Renderiza SCQA slide em layout 2x2.

    Args:
        slide: pptx.slide.Slide alvo
        content: dict com action_title + 4 secoes (S/C/Q/A) + takeaway? + source?
        brand: Brand opcional (default: rAIz)

    Raises:
        ValueError: se content schema invalido
    """
    errors = validate_content(content)
    if errors:
        raise ValueError("SCQA content invalido: " + "; ".join(errors))

    b = brand or get_brand()

    # Action title (header)
    action_title(slide, content["action_title"], brand=b)

    # Layout 2x2
    grid_top = Inches(1.6)
    grid_bottom = SLIDE_H - Inches(1.2)  # reserva 1.2in para takeaway+source
    grid_h = grid_bottom - grid_top
    cell_w = (CONTENT_W - Inches(0.3)) / 2
    cell_h = (grid_h - Inches(0.3)) / 2
    gap = Inches(0.3)

    positions = {
        "situation":    (MARGIN_L, grid_top),
        "complication": (MARGIN_L + cell_w + gap, grid_top),
        "question":     (MARGIN_L, grid_top + cell_h + gap),
        "answer":       (MARGIN_L + cell_w + gap, grid_top + cell_h + gap),
    }

    for key in SECTION_KEYS:
        x, y = positions[key]
        sec = content[key]
        _render_section(
            slide, b, x, y, cell_w, cell_h,
            label=SECTION_LABELS[key],
            title=sec["title"],
            body=sec["body"],
            accent=_kicker_color(b, key),
        )

    # Takeaway bar (opcional)
    takeaway = content.get("takeaway")
    if takeaway:
        takeaway_bar(slide, takeaway, y=SLIDE_H - Inches(1.05), brand=b)

    # Source line (opcional)
    source = content.get("source")
    if source:
        source_line(slide, source, brand=b)
