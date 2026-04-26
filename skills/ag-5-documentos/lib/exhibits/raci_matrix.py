"""RACI matrix — tabela R/A/C/I em celulas coloridas (PR 3.4, item #23).

Renderiza tabela com tasks em rows, stakeholders em columns, celulas com
letra R/A/C/I + cor:
  - R (Responsible) = teal       (RAIZ_TEAL)
  - A (Accountable) = orange     (RAIZ_ORANGE) — accent QI
  - C (Consulted)   = gray       (FG_MUTED claro)
  - I (Informed)    = light gray (BG_LIGHT/borda)

Input content:
    {
        "action_title": "Governanca clara: 1 Accountable por entrega",
        "tasks":         ["Spec PRD", "Build", "QA", "Deploy", "Comunicar"],
        "stakeholders":  ["PM", "Dev", "QA", "DevOps", "Diretor"],
        "assignments":   {
            (0, 0): "A",  (0, 1): "C",
            (1, 1): "R",  (1, 0): "A",
            ...
        },
        "source": "Plano de governanca interna 2026-Q2",
    }

Limites: 2-12 tasks, 2-7 stakeholders.
Header bold, gridlines suaves, 1 letra por celula (centralizada bold).
"""
from __future__ import annotations

import logging
from typing import Dict, List, Optional, Tuple

from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

from ..mckinsey_pptx import (
    CONTENT_W, MARGIN_L, SLIDE_H, SLIDE_W,
    action_title, add_rect, add_tb, source_line,
)
from ..palette_overrides import Brand, get_brand
from ..raiz_tokens import (
    FONT_SIZE,
    RAIZ_TEAL, RAIZ_ORANGE,
)


_LOG = logging.getLogger(__name__)

MIN_TASKS = 2
MAX_TASKS = 12
MIN_STAKEHOLDERS = 2
MAX_STAKEHOLDERS = 7

ROLE_COLORS = {
    "R": (RAIZ_TEAL,    "#FFFFFF"),  # bg, fg
    "A": (RAIZ_ORANGE,  "#FFFFFF"),
    "C": ("#9CA3AF",    "#FFFFFF"),  # gray-400
    "I": ("#E5E7EB",    "#1A202C"),  # gray-200, dark text
}

ROLE_LEGEND = {
    "R": "Responsible (faz)",
    "A": "Accountable (decide)",
    "C": "Consulted (consultado)",
    "I": "Informed (informado)",
}


EXAMPLE_INPUT = {
    "action_title": "Governanca clara: 1 Accountable por entrega no plano 2026-Q2",
    "tasks": ["Spec PRD", "Build", "QA", "Deploy", "Comunicar"],
    "stakeholders": ["PM", "Dev", "QA", "DevOps", "Diretor"],
    "assignments": {
        (0, 0): "A", (0, 1): "C",                                     (0, 4): "I",
                     (1, 1): "R", (1, 0): "A",                        (1, 4): "I",
                                  (2, 2): "R", (2, 1): "C", (2, 0): "A",
                                               (3, 3): "R", (3, 1): "C", (3, 0): "A",
        (4, 0): "R",                                                  (4, 4): "A",
    },
    "source": "Plano de governanca rAIz 2026-Q2",
}


def _validate(content: dict) -> list[str]:
    errors: list[str] = []
    if not content.get("action_title"):
        errors.append("raci_matrix: 'action_title' obrigatorio")
    tasks = content.get("tasks")
    if not isinstance(tasks, list):
        errors.append("raci_matrix: 'tasks' deve ser lista")
    elif not (MIN_TASKS <= len(tasks) <= MAX_TASKS):
        errors.append(
            f"raci_matrix: 'tasks' precisa entre {MIN_TASKS}-{MAX_TASKS}, "
            f"recebido {len(tasks)}"
        )
    stakeholders = content.get("stakeholders")
    if not isinstance(stakeholders, list):
        errors.append("raci_matrix: 'stakeholders' deve ser lista")
    elif not (MIN_STAKEHOLDERS <= len(stakeholders) <= MAX_STAKEHOLDERS):
        errors.append(
            f"raci_matrix: 'stakeholders' precisa entre {MIN_STAKEHOLDERS}-"
            f"{MAX_STAKEHOLDERS}, recebido {len(stakeholders)}"
        )
    assignments = content.get("assignments")
    if not isinstance(assignments, dict):
        errors.append("raci_matrix: 'assignments' deve ser dict")
    else:
        for key, role in assignments.items():
            if role not in ROLE_COLORS:
                errors.append(
                    f"raci_matrix: role invalido {role!r} em {key!r} "
                    f"(esperado R/A/C/I)"
                )
                break
    if not content.get("source"):
        errors.append("raci_matrix: 'source' obrigatorio")
    return errors


def _check_accountable_per_task(
    assignments: Dict[Tuple[int, int], str], n_tasks: int
) -> List[int]:
    """Retorna lista de tasks com numero de Accountables != 1 (anti-pattern RACI)."""
    counts: dict[int, int] = {i: 0 for i in range(n_tasks)}
    for (t_idx, _), role in assignments.items():
        if role == "A" and 0 <= t_idx < n_tasks:
            counts[t_idx] += 1
    return [i for i, c in counts.items() if c != 1]


def render(slide, content: dict, brand: Optional[Brand] = None) -> None:
    """Renderiza RACI matrix."""
    errors = _validate(content)
    if errors:
        raise ValueError("raci_matrix invalido: " + "; ".join(errors))

    b = brand or get_brand()
    tasks: List[str] = content["tasks"]
    stakeholders: List[str] = content["stakeholders"]
    assignments: Dict[Tuple[int, int], str] = content["assignments"]
    n_tasks = len(tasks)
    n_holders = len(stakeholders)

    # Warning: tarefa sem Accountable ou com mais de 1
    bad_tasks = _check_accountable_per_task(assignments, n_tasks)
    if bad_tasks:
        _LOG.warning(
            "raci_matrix: %d tasks com 0 ou >1 Accountable (anti-pattern RACI): %s",
            len(bad_tasks), bad_tasks,
        )

    # Header
    next_y = action_title(slide, content["action_title"], brand=b)

    # Layout
    table_top = next_y + Inches(0.15)
    legend_h = Inches(0.4)
    table_bottom = SLIDE_H - Inches(1.0) - legend_h
    table_h = table_bottom - table_top

    task_col_w = Inches(2.4)
    grid_w = CONTENT_W - task_col_w
    cell_w = grid_w / n_holders

    header_h = Inches(0.5)
    row_h = (table_h - header_h) / n_tasks
    max_row_h = Inches(0.55)
    if row_h > max_row_h:
        row_h = max_row_h

    # Border externa
    total_h = header_h + row_h * n_tasks
    add_rect(slide, MARGIN_L, table_top, CONTENT_W, total_h,
             fill=b.surface, line=b.border, line_w=Pt(0.75))

    # Header bg
    add_rect(slide, MARGIN_L, table_top, CONTENT_W, header_h,
             fill=b.bg_light, line=b.bg_light, line_w=Pt(0.0))

    # Stakeholder headers
    for j, holder in enumerate(stakeholders):
        x = MARGIN_L + task_col_w + j * cell_w
        add_tb(slide, x + Inches(0.05), table_top + Inches(0.08),
               cell_w - Inches(0.1), header_h - Inches(0.16),
               str(holder), size=FONT_SIZE["table"], bold=True,
               color=b.fg_primary, font=b.font_heading,
               align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)

    # Task labels (col 0)
    for i, task in enumerate(tasks):
        y = table_top + header_h + i * row_h
        add_tb(slide, MARGIN_L + Inches(0.1), y + Inches(0.04),
               task_col_w - Inches(0.2), row_h - Inches(0.08),
               str(task), size=FONT_SIZE["table"], bold=True,
               color=b.fg_primary, font=b.font_heading,
               align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.MIDDLE)
        # Linha divisoria sutil
        add_rect(slide, MARGIN_L, y, CONTENT_W, Pt(0.5), fill=b.border)

    # Cells
    for (t_idx, h_idx), role in assignments.items():
        if not (0 <= t_idx < n_tasks and 0 <= h_idx < n_holders):
            continue
        x = MARGIN_L + task_col_w + h_idx * cell_w
        y = table_top + header_h + t_idx * row_h
        bg_color, fg_color = ROLE_COLORS[role]

        cell_pad = Inches(0.06)
        add_rect(slide,
                 x + cell_pad, y + cell_pad,
                 cell_w - 2 * cell_pad, row_h - 2 * cell_pad,
                 fill=bg_color, line=bg_color, line_w=Pt(0.0))
        add_tb(slide,
               x + cell_pad, y + cell_pad,
               cell_w - 2 * cell_pad, row_h - 2 * cell_pad,
               role, size=FONT_SIZE["h3"], bold=True,
               color=fg_color, font=b.font_heading,
               align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)

    # Vertical separators (gridlines suaves entre colunas de stakeholders)
    for j in range(n_holders + 1):
        x = MARGIN_L + task_col_w + j * cell_w
        add_rect(slide, x, table_top, Pt(0.5), total_h, fill=b.border)

    # Legenda compact (abaixo da tabela)
    leg_y = table_bottom + Inches(0.08)
    leg_x = MARGIN_L
    chip_w = Inches(0.28)
    for role in ["R", "A", "C", "I"]:
        bg, fg = ROLE_COLORS[role]
        add_rect(slide, leg_x, leg_y, chip_w, Inches(0.28),
                 fill=bg, line=bg, line_w=Pt(0.0))
        add_tb(slide, leg_x, leg_y, chip_w, Inches(0.28),
               role, size=FONT_SIZE["caption"], bold=True, color=fg,
               font=b.font_heading,
               align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        add_tb(slide, leg_x + chip_w + Inches(0.05), leg_y,
               Inches(2.0), Inches(0.28),
               ROLE_LEGEND[role], size=FONT_SIZE["caption"],
               color=b.fg_muted, font=b.font_body,
               anchor=MSO_ANCHOR.MIDDLE)
        leg_x += Inches(2.4)

    source_line(slide, content["source"], brand=b)
