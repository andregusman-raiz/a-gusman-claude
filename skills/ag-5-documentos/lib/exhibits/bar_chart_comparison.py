"""Bar chart comparison — re-export adaptado de timeline_charts.bar_chart_horizontal.

Input spec:
    {
        "title": "Crescimento ARR (2024 vs 2025)",
        "rows": [
            ("Klarna",  10.0, 18.0),
            ("Cursor",  0.0,  100.0),
            ("Anthropic", 200.0, 800.0),
        ],
        "max_val":  1000.0,
        "labels":   ("2024", "2025"),
    }
"""
from __future__ import annotations

from pptx.util import Inches

from ..palette_overrides import Brand, get_brand
from ..timeline_charts import bar_chart_horizontal


EXAMPLE_INPUT = {
    "title":   "Crescimento ARR (2024 vs 2025)",
    "rows":    [
        ("Klarna",     10.0, 18.0),
        ("Cursor",      0.0, 100.0),
        ("Anthropic", 200.0, 800.0),
        ("OpenAI",   1500.0, 3700.0),
    ],
    "max_val": 4000.0,
    "labels":  ("2024", "2025"),
}


def render(slide, spec: dict, brand: Brand = None) -> None:
    """Adapter para bar_chart_horizontal."""
    rows = spec.get("rows", [])
    if not rows:
        return
    bar_chart_horizontal(
        slide, Inches(1.5), Inches(2.7), Inches(10), Inches(3.8),
        rows,
        title=spec.get("title", ""),
        max_val=float(spec.get("max_val", 100.0)),
        labels=spec.get("labels", ("Prior", "Current")),
        brand=brand,
    )
