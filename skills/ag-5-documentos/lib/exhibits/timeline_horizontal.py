"""Timeline horizontal — re-export do timeline_charts existente, adaptado a interface canonica.

Input spec:
    {
        "milestones": [
            {"year": "2025", "label": "Base Formal", "invest": "+R$ 675K", "bullets": ["a","b"]},
            ...
        ],
        "y_axis_inches": 4.0,  # opcional, posicao do eixo
    }
"""
from __future__ import annotations

from pptx.util import Inches

from ..palette_overrides import Brand, get_brand
from ..timeline_charts import timeline_horizontal


EXAMPLE_INPUT = {
    "milestones": [
        {"year": "2025", "label": "Base Formal",   "invest": "+R$ 675K/ano",
         "bullets": ["Política", "Treinamentos", "Comitê"]},
        {"year": "2026", "label": "Expansao",      "invest": "+R$ 1.2M/ano",
         "bullets": ["20 escolas", "MMR Q3", "Auditoria externa"]},
        {"year": "2027", "label": "Maturidade",    "invest": "+R$ 2M/ano",
         "bullets": ["100% rede", "Certificacao", "Benchmark"]},
    ],
    "y_axis_inches": 4.5,
}


def render(slide, spec: dict, brand: Brand = None) -> None:
    """Adapter para a funcao timeline_horizontal existente."""
    y_axis = Inches(spec.get("y_axis_inches", 4.5))
    milestones = spec.get("milestones", [])
    if not milestones:
        return
    timeline_horizontal(slide, milestones, y=y_axis, brand=brand)
