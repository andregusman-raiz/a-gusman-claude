"""Funnel — barras horizontais decrescentes com % de conversao (PR 3.4, item #23).

Renderiza barras horizontais centralizadas (efeito funil), largura proporcional
ao value. Mostra label esquerda + valor direita + % conversao entre barras.

Input content:
    {
        "action_title": "Funnel de aquisicao perde 76% antes do checkout",
        "steps": [
            {"label": "Visitas",      "value": 10000},
            {"label": "Cadastros",    "value": 4500, "conversion_pct": 45.0},
            {"label": "Carrinho",     "value": 2400, "conversion_pct": 53.3},
            {"label": "Checkout",     "value": 1800, "conversion_pct": 75.0},
            {"label": "Pagos",        "value":  900, "conversion_pct": 50.0},
        ],
        "source":   "Analytics 2026-Q1",
        "takeaway": "Maior queda no cadastro (-55%)",  # opcional
    }

Cores: gradient teal_dark (topo) -> teal_light (base).
Conversao opcional: se step[i] nao informa conversion_pct, calcula do anterior.
"""
from __future__ import annotations

from typing import List, Optional

from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

from ..mckinsey_pptx import (
    CONTENT_W, MARGIN_L, SLIDE_H, SLIDE_W,
    action_title, add_rect, add_tb, source_line, takeaway_bar,
)
from ..palette_overrides import Brand, get_brand
from ..raiz_tokens import (
    FONT_SIZE,
    RAIZ_TEAL_DARK, RAIZ_TEAL, RAIZ_TEAL_LIGHT,
)


MIN_STEPS = 2
MAX_STEPS = 7


EXAMPLE_INPUT = {
    "action_title": "Funnel de aquisicao perde 91% antes do pagamento",
    "steps": [
        {"label": "Visitas",   "value": 10000},
        {"label": "Cadastros", "value":  4500, "conversion_pct": 45.0},
        {"label": "Carrinho",  "value":  2400, "conversion_pct": 53.3},
        {"label": "Checkout",  "value":  1800, "conversion_pct": 75.0},
        {"label": "Pagos",     "value":   900, "conversion_pct": 50.0},
    ],
    "source": "Analytics e-commerce 2026-Q1",
    "takeaway": "Maior gargalo entre visita e cadastro (-55%)",
}


def _validate(content: dict) -> list[str]:
    errors: list[str] = []
    if not content.get("action_title"):
        errors.append("funnel_steps: 'action_title' obrigatorio")
    steps = content.get("steps")
    if not isinstance(steps, list):
        errors.append("funnel_steps: 'steps' deve ser lista")
    elif not (MIN_STEPS <= len(steps) <= MAX_STEPS):
        errors.append(
            f"funnel_steps: 'steps' precisa entre {MIN_STEPS}-{MAX_STEPS} itens, "
            f"recebido {len(steps)}"
        )
    else:
        for i, s in enumerate(steps):
            if not isinstance(s, dict) or "label" not in s or "value" not in s:
                errors.append(f"funnel_steps: step[{i}] precisa de 'label' e 'value'")
                break
            if not isinstance(s["value"], (int, float)) or s["value"] < 0:
                errors.append(f"funnel_steps: step[{i}] value invalido")
                break
    if not content.get("source"):
        errors.append("funnel_steps: 'source' obrigatorio")
    return errors


def _palette_for_step(idx: int, total: int) -> str:
    """Retorna hex teal: topo escuro -> base claro."""
    # 3 tiers: dark, base, light
    if total <= 1:
        return RAIZ_TEAL
    ratio = idx / (total - 1)
    if ratio < 0.34:
        return RAIZ_TEAL_DARK
    if ratio < 0.67:
        return RAIZ_TEAL
    return RAIZ_TEAL_LIGHT


def render(slide, content: dict, brand: Optional[Brand] = None) -> None:
    """Renderiza funnel horizontal decrescente."""
    errors = _validate(content)
    if errors:
        raise ValueError("funnel_steps invalido: " + "; ".join(errors))

    b = brand or get_brand()
    steps: List[dict] = content["steps"]
    n = len(steps)

    next_y = action_title(slide, content["action_title"], brand=b)

    takeaway = content.get("takeaway")
    if takeaway:
        next_y = takeaway_bar(slide, str(takeaway), next_y, brand=b)

    # Plot area
    plot_y = next_y + Inches(0.1)
    plot_h = SLIDE_H - plot_y - Inches(1.0)
    bar_h = plot_h / n - Inches(0.18)
    if bar_h < Inches(0.4):
        bar_h = Inches(0.4)

    max_value = max(s["value"] for s in steps) or 1
    max_bar_w = CONTENT_W - Inches(3.5)   # margem para labels lateral
    label_left_w = Inches(1.6)
    value_right_w = Inches(1.6)

    center_x = MARGIN_L + label_left_w + max_bar_w / 2

    for i, step in enumerate(steps):
        value = float(step["value"])
        ratio = value / max_value
        bar_w = int(max_bar_w * ratio)
        if bar_w < Inches(0.5):
            bar_w = Inches(0.5)
        bx = center_x - bar_w / 2
        by = plot_y + i * (bar_h + Inches(0.18))

        # Bar
        add_rect(slide, bx, by, bar_w, bar_h,
                 fill=_palette_for_step(i, n), line=b.surface, line_w=Pt(1.0))

        # Label esquerda
        add_tb(slide, MARGIN_L, by, label_left_w, bar_h,
               str(step["label"]), size=FONT_SIZE["body"], bold=True,
               color=b.fg_primary, font=b.font_heading,
               align=PP_ALIGN.RIGHT, anchor=MSO_ANCHOR.MIDDLE)

        # Valor direita
        add_tb(slide, MARGIN_L + label_left_w + max_bar_w + Inches(0.1), by,
               value_right_w, bar_h,
               f"{int(value):,}".replace(",", "."),
               size=FONT_SIZE["body"], bold=True,
               color=b.fg_primary, font=b.font_heading,
               align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.MIDDLE)

        # Conversao entre passos (mostrar pct na borda esquerda do bar i>=1)
        if i > 0:
            pct = step.get("conversion_pct")
            if pct is None:
                # Calcular do step anterior
                prev = float(steps[i - 1]["value"]) or 1.0
                pct = (value / prev) * 100.0
            pct_str = f"-> {pct:.0f}%"
            # Posiciona acima da barra atual, centralizado no plot area
            pct_y = by - Inches(0.18)
            add_tb(slide, center_x - Inches(0.6), pct_y,
                   Inches(1.2), Inches(0.18),
                   pct_str, size=FONT_SIZE["caption"], italic=True,
                   color=b.fg_muted, font=b.font_body,
                   align=PP_ALIGN.CENTER)

    source_line(slide, content["source"], brand=b)
