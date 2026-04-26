"""Histogram — distribuicao de uma variavel continua (PR 3.4, item #23).

Renderiza barras verticais a partir de bins computados sobre `data`. Sem
matplotlib (consistencia com bar_chart_comparison): usa add_rect direto.

Input content:
    {
        "action_title": "Distribuicao de tempo de resposta concentrada em 100-300ms",
        "data":         [120.0, 140.0, 250.0, ...],   # List[float]
        "bins":         10,                            # opcional, default 10
        "x_label":      "Tempo de resposta (ms)",
        "y_label":      "Frequencia",
        "source":       "Logs producao Q1/2026",
        "takeaway":     "85% dos requests resolvem em < 300ms",  # opcional
    }

Regras:
  - bins padrao: 10. Permitido 3-30.
  - paleta sequencial (accent_moderate base, accent_moderate_dark topo)
  - eixos discretos (X labels nos limites de bins, Y eixo com 3 ticks)
  - source obrigatorio. action_title obrigatorio.
"""
from __future__ import annotations

import logging
from typing import List, Optional

from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

from ..mckinsey_pptx import (
    CONTENT_W, MARGIN_L, SLIDE_H,
    action_title, add_rect, add_tb, source_line, takeaway_bar,
)
from ..palette_overrides import Brand, get_brand
from ..raiz_tokens import FONT_SIZE


_LOG = logging.getLogger(__name__)

DEFAULT_BINS = 10
MIN_BINS = 3
MAX_BINS = 30


EXAMPLE_INPUT = {
    "action_title": "Distribuicao de tempo de resposta concentrada em 100-300ms",
    "data": [
        50.0, 80.0, 100.0, 120.0, 140.0, 150.0, 170.0, 180.0, 200.0,
        210.0, 230.0, 250.0, 260.0, 280.0, 290.0, 310.0, 320.0, 350.0,
        400.0, 420.0, 450.0, 480.0, 520.0, 600.0, 750.0, 900.0,
    ],
    "bins": 10,
    "x_label": "Tempo de resposta (ms)",
    "y_label": "Frequencia",
    "source": "Logs producao Q1/2026 (n=2.487 amostras)",
    "takeaway": "85% das requests resolvem em menos de 300ms",
}


def _validate(content: dict) -> list[str]:
    errors: list[str] = []
    if not content.get("action_title"):
        errors.append("histogram_distribution: 'action_title' obrigatorio")
    data = content.get("data")
    if not isinstance(data, list) or not data:
        errors.append("histogram_distribution: 'data' deve ser list[float] nao-vazia")
    elif not all(isinstance(v, (int, float)) for v in data):
        errors.append("histogram_distribution: 'data' deve conter apenas numeros")
    if not content.get("source"):
        errors.append("histogram_distribution: 'source' obrigatorio")
    return errors


def _compute_bins(data: List[float], bins: int) -> tuple[list[int], list[float]]:
    """Retorna (counts, edges).

    edges tem len = bins + 1.
    """
    lo = min(data)
    hi = max(data)
    if hi == lo:  # Edge case: todos iguais → 1 bin com largura 1.0
        return [len(data)] + [0] * (bins - 1), [lo + i for i in range(bins + 1)]
    width = (hi - lo) / bins
    edges = [lo + i * width for i in range(bins + 1)]
    counts = [0] * bins
    for v in data:
        # Index do bin (clamp para [0, bins-1])
        idx = int((v - lo) / width)
        if idx >= bins:
            idx = bins - 1
        counts[idx] += 1
    return counts, edges


def render(slide, content: dict, brand: Optional[Brand] = None) -> None:
    """Renderiza histograma vertical."""
    errors = _validate(content)
    if errors:
        raise ValueError("histogram_distribution invalido: " + "; ".join(errors))

    b = brand or get_brand()

    bins = int(content.get("bins") or DEFAULT_BINS)
    bins = max(MIN_BINS, min(MAX_BINS, bins))

    data: List[float] = list(content["data"])
    counts, edges = _compute_bins(data, bins)
    max_count = max(counts) if counts else 1

    # Header
    next_y = action_title(slide, content["action_title"], brand=b)

    # Takeaway bar (opcional)
    takeaway = content.get("takeaway")
    if takeaway:
        next_y = takeaway_bar(slide, str(takeaway), next_y, brand=b)

    # Plot area
    plot_x = MARGIN_L + Inches(0.8)   # espaco para Y axis label
    plot_y = next_y + Inches(0.1)
    plot_w = CONTENT_W - Inches(1.0)
    plot_h = SLIDE_H - plot_y - Inches(1.4)  # reserva rodape (eixo X + source)

    # Y axis baseline
    add_rect(slide, plot_x, plot_y + plot_h, plot_w, Pt(0.75),
             fill=b.fg_muted)
    # Y axis vertical line
    add_rect(slide, plot_x, plot_y, Pt(0.75), plot_h, fill=b.fg_muted)

    # Bars
    bar_gap_emu = Inches(0.04)
    bar_w = (plot_w - bar_gap_emu * (bins - 1)) / bins
    for i, count in enumerate(counts):
        bx = plot_x + i * (bar_w + bar_gap_emu)
        h_ratio = count / max_count if max_count else 0
        bh = int(plot_h * h_ratio)
        by = plot_y + plot_h - bh
        add_rect(slide, bx, by, bar_w, bh,
                 fill=b.accent_moderate, line=b.accent_dark,
                 line_w=Pt(0.5))

        # Count label acima da barra
        if count > 0:
            add_tb(slide, bx, by - Inches(0.25), bar_w, Inches(0.22),
                   str(count), size=FONT_SIZE["caption"], bold=True,
                   color=b.fg_primary, font=b.font_body,
                   align=PP_ALIGN.CENTER)

    # X axis labels (lo, mid, hi)
    label_y = plot_y + plot_h + Inches(0.08)
    add_tb(slide, plot_x - Inches(0.3), label_y, Inches(0.6), Inches(0.25),
           f"{edges[0]:.0f}", size=FONT_SIZE["caption"], color=b.fg_muted,
           font=b.font_body, align=PP_ALIGN.CENTER)
    add_tb(slide, plot_x + plot_w / 2 - Inches(0.3), label_y,
           Inches(0.6), Inches(0.25),
           f"{edges[bins // 2]:.0f}", size=FONT_SIZE["caption"], color=b.fg_muted,
           font=b.font_body, align=PP_ALIGN.CENTER)
    add_tb(slide, plot_x + plot_w - Inches(0.3), label_y,
           Inches(0.6), Inches(0.25),
           f"{edges[bins]:.0f}", size=FONT_SIZE["caption"], color=b.fg_muted,
           font=b.font_body, align=PP_ALIGN.CENTER)

    # X axis title
    x_label = content.get("x_label", "")
    if x_label:
        add_tb(slide, plot_x, label_y + Inches(0.27), plot_w, Inches(0.25),
               x_label, size=FONT_SIZE["body_sm"], bold=True, italic=True,
               color=b.fg_muted, font=b.font_body, align=PP_ALIGN.CENTER)

    # Y axis title (rotacionado nao trivial em pptx — usar texto vertical compacto)
    y_label = content.get("y_label", "")
    if y_label:
        add_tb(slide, MARGIN_L, plot_y + plot_h / 2 - Inches(0.15),
               Inches(0.7), Inches(0.3),
               y_label, size=FONT_SIZE["caption"], bold=True, italic=True,
               color=b.fg_muted, font=b.font_body, align=PP_ALIGN.LEFT,
               anchor=MSO_ANCHOR.MIDDLE)

    # Source
    source_line(slide, content["source"], brand=b)
