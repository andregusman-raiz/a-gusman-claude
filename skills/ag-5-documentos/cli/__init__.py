"""CLI helpers para `ag-5-documentos` — invocacao externa.

Modulos:
  - loader: carrega briefing de stdin/file (JSON ou YAML)
  - audit_existing: audit de PPTX existente sem rebuild
  - minimal_builder: builder simples para construir deck a partir de outline

Entry point: `cli.py` no diretorio raiz da skill.
"""
__all__ = ["loader", "audit_existing", "minimal_builder"]
