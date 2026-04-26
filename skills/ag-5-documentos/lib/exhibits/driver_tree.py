"""Driver tree — arvore hierarquica root -> drivers -> sub-drivers (PR 3.4, item #23).

Renderiza root a esquerda + drivers a direita conectados por linhas, com
sub-drivers em segundo nivel quando informados.

Input content:
    {
        "action_title": "Crescimento de receita 2026 vem 70% de digital",
        "root": {"label": "Receita 2026", "value": "+18% YoY"},
        "drivers": [
            {
                "label": "Digital",
                "value": "+32%",
                "contribution_pct": 70.0,
                "sub_drivers": [
                    {"label": "Mobile",   "value": "+45%"},
                    {"label": "Desktop",  "value": "+12%"},
                ],
            },
            {"label": "Servicos", "value": "+12%", "contribution_pct": 20.0},
            {"label": "Produtos", "value": "+5%",  "contribution_pct": 10.0},
        ],
        "source":   "Relatorio anual 2026",
        "takeaway": "Mobile e o motor: 45% de crescimento isolado",  # opcional
    }

Limites: 2-6 drivers; 0-4 sub_drivers por driver.
Caixas: rect com border accent + texto centralizado. Linhas: thin connector.
"""
from __future__ import annotations

from typing import List, Optional

from pptx.enum.shapes import MSO_CONNECTOR
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

from ..mckinsey_pptx import (
    CONTENT_W, MARGIN_L, SLIDE_H, SLIDE_W,
    action_title, add_rect, add_tb, no_shadow, source_line, takeaway_bar,
)
from ..palette_overrides import Brand, get_brand
from ..raiz_tokens import FONT_SIZE, rgb


MIN_DRIVERS = 2
MAX_DRIVERS = 6
MAX_SUB_DRIVERS = 4


EXAMPLE_INPUT = {
    "action_title": "Crescimento 2026 concentrado em digital (70% da contribuicao)",
    "root": {"label": "Receita 2026", "value": "+18% YoY"},
    "drivers": [
        {
            "label": "Digital",
            "value": "+32%",
            "contribution_pct": 70.0,
            "sub_drivers": [
                {"label": "Mobile",  "value": "+45%"},
                {"label": "Desktop", "value": "+12%"},
            ],
        },
        {"label": "Servicos", "value": "+12%", "contribution_pct": 20.0},
        {"label": "Produtos", "value": "+5%",  "contribution_pct": 10.0},
    ],
    "source": "Relatorio anual rAIz Educacao 2026",
    "takeaway": "Mobile lidera digital com +45% YoY",
}


def _validate(content: dict) -> list[str]:
    errors: list[str] = []
    if not content.get("action_title"):
        errors.append("driver_tree: 'action_title' obrigatorio")
    root = content.get("root")
    if not isinstance(root, dict) or "label" not in root:
        errors.append("driver_tree: 'root' precisa de dict com 'label'")
    drivers = content.get("drivers")
    if not isinstance(drivers, list):
        errors.append("driver_tree: 'drivers' deve ser lista")
    elif not (MIN_DRIVERS <= len(drivers) <= MAX_DRIVERS):
        errors.append(
            f"driver_tree: drivers precisa entre {MIN_DRIVERS}-{MAX_DRIVERS}, "
            f"recebido {len(drivers)}"
        )
    else:
        for i, d in enumerate(drivers):
            if not isinstance(d, dict) or "label" not in d:
                errors.append(f"driver_tree: driver[{i}] precisa de 'label'")
                break
            subs = d.get("sub_drivers", [])
            if subs and len(subs) > MAX_SUB_DRIVERS:
                errors.append(
                    f"driver_tree: driver[{i}].sub_drivers excede max ({MAX_SUB_DRIVERS})"
                )
                break
    if not content.get("source"):
        errors.append("driver_tree: 'source' obrigatorio")
    return errors


def _add_connector(slide, x1, y1, x2, y2, color: str) -> None:
    """Linha fina conectando 2 pontos."""
    line = slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, x1, y1, x2, y2)
    line.line.color.rgb = rgb(color)
    line.line.width = Pt(0.75)
    no_shadow(line)


def _add_box(slide, x, y, w, h, label: str, value: str, *,
             border_color: str, fill_color: str, label_color: str,
             value_color: str, font_heading: str, font_body: str,
             label_size: int, value_size: int) -> None:
    """Caixa com label (top, bold) + value (bottom, bold maior)."""
    add_rect(slide, x, y, w, h,
             fill=fill_color, line=border_color, line_w=Pt(1.25))
    add_tb(slide, x + Inches(0.05), y + Inches(0.06),
           w - Inches(0.1), h * 0.45,
           label, size=label_size, bold=True, color=label_color,
           font=font_heading, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    if value:
        add_tb(slide, x + Inches(0.05), y + h * 0.5,
               w - Inches(0.1), h * 0.45,
               value, size=value_size, bold=True, color=value_color,
               font=font_heading, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)


def render(slide, content: dict, brand: Optional[Brand] = None) -> None:
    """Renderiza driver tree horizontal."""
    errors = _validate(content)
    if errors:
        raise ValueError("driver_tree invalido: " + "; ".join(errors))

    b = brand or get_brand()
    root = content["root"]
    drivers: List[dict] = content["drivers"]
    n = len(drivers)

    next_y = action_title(slide, content["action_title"], brand=b)

    takeaway = content.get("takeaway")
    if takeaway:
        next_y = takeaway_bar(slide, str(takeaway), next_y, brand=b)

    # Layout horizontal: root (col1) -> drivers (col2) -> sub_drivers (col3)
    plot_y = next_y + Inches(0.15)
    plot_h = SLIDE_H - plot_y - Inches(1.0)

    # Decide colunas baseado se ha sub_drivers
    has_subs = any(d.get("sub_drivers") for d in drivers)

    col_w = (CONTENT_W - Inches(0.8)) / (3 if has_subs else 2)
    box_w = col_w - Inches(0.4)
    box_h = Inches(0.85)

    # Root box (centralizado verticalmente)
    root_x = MARGIN_L + Inches(0.1)
    root_y = plot_y + plot_h / 2 - box_h / 2
    _add_box(slide, root_x, root_y, box_w, box_h,
             root["label"], str(root.get("value", "")),
             border_color=b.accent_strong, fill_color=b.accent_light,
             label_color=b.fg_primary, value_color=b.accent_dark,
             font_heading=b.font_heading, font_body=b.font_body,
             label_size=FONT_SIZE["h3"], value_size=FONT_SIZE["h2"])

    # Drivers column
    driver_x = MARGIN_L + col_w + Inches(0.1)
    driver_step = plot_h / n
    driver_centers_y: list = []  # (cy, driver dict)

    for i, drv in enumerate(drivers):
        cy = plot_y + i * driver_step + driver_step / 2
        dy = cy - box_h / 2
        contrib = drv.get("contribution_pct")
        suffix = f"  ({contrib:.0f}%)" if contrib is not None else ""
        label = str(drv["label"]) + suffix
        _add_box(slide, driver_x, dy, box_w, box_h,
                 label, str(drv.get("value", "")),
                 border_color=b.accent_moderate, fill_color=b.surface,
                 label_color=b.fg_primary, value_color=b.fg_primary,
                 font_heading=b.font_heading, font_body=b.font_body,
                 label_size=FONT_SIZE["body"], value_size=FONT_SIZE["h3"])
        driver_centers_y.append((cy, drv, dy))

        # Connector root -> driver
        _add_connector(slide,
                       root_x + box_w, root_y + box_h / 2,
                       driver_x, cy, b.fg_muted)

    # Sub-drivers (se houver)
    if has_subs:
        sub_x = MARGIN_L + col_w * 2 + Inches(0.1)
        for cy, drv, dy in driver_centers_y:
            subs = drv.get("sub_drivers") or []
            if not subs:
                continue
            n_sub = len(subs)
            sub_box_h = Inches(0.55)
            sub_total_h = n_sub * sub_box_h + (n_sub - 1) * Inches(0.1)
            sub_start_y = cy - sub_total_h / 2
            for j, sub in enumerate(subs):
                sy = sub_start_y + j * (sub_box_h + Inches(0.1))
                _add_box(slide, sub_x, sy, box_w, sub_box_h,
                         str(sub.get("label", "")),
                         str(sub.get("value", "")),
                         border_color=b.border, fill_color=b.bg_light,
                         label_color=b.fg_primary, value_color=b.fg_muted,
                         font_heading=b.font_heading, font_body=b.font_body,
                         label_size=FONT_SIZE["body_sm"],
                         value_size=FONT_SIZE["body_sm"])
                # Connector driver -> sub
                _add_connector(slide,
                               driver_x + box_w, cy,
                               sub_x, sy + sub_box_h / 2, b.fg_muted)

    source_line(slide, content["source"], brand=b)
