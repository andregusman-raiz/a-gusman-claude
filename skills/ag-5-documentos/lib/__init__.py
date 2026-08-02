"""ag-5-documentos v2 — McKinsey-grade executive decks com tokens rAIz.

Pipeline obrigatorio (4 fases): MD -> PPTX v1 -> screenshot+audit -> PPTX v2.
NUNCA entregar v1 (exceto com --skip-review ou --draft).

Imports canonicos:
    from lib.pipeline import executive_pipeline
    from lib.mckinsey_pptx import chrome, action_title, takeaway_bar, ...
    from lib.raiz_tokens import COLORS, TYPO, rgb
"""
__version__ = "2.0.0"
