"""Briefing schema (Pydantic) — input estruturado para `ag-5-documentos`.

PR 1.1 do plano `reflective-zooming-sonnet.md`. Implementa secoes 5.1 a 5.4
do guia mestre (briefing YAML estruturado, pergunta principal, mensagem
central em 1 frase, storyline 5-9 blocos).

Backward compat:
  - `parse_briefing(content)` detecta YAML vs prosa automaticamente.
  - YAML valido -> instancia Briefing.
  - Prosa (template `briefing.md` antigo) -> retorna None (caller usa
    o pipeline tradicional baseado em Markdown).

Padroes obrigatorios:
  - Pydantic v2 (`from pydantic import BaseModel, ...`).
  - Limites validados: outline com 5..30 itens, mensagem central <= 200 chars.
  - Sem dependencias externas alem de pydantic + PyYAML (ja na stack).
"""
from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


# ---------------------------------------------------------------------------
# Tipos auxiliares (Literal de enums)
# ---------------------------------------------------------------------------
Audience = Literal[
    "internal", "external", "board_external", "investor", "press"
]

Format = Literal[
    "apresentacao_oral",
    "pre_read",
    "leave_behind",
    "workshop",
    "conselho",
    "comite_executivo",
    "treinamento",
]

Tom = Literal["provocativo", "didatico", "aspiracional", "tecnico"]

StorylineKind = Literal[
    "recomendacao",
    "diagnostico",
    "status",
    "treinamento",
    "business_case",
    "comite",
]


# ---------------------------------------------------------------------------
# SlideOutline — 1 bloco do storyline
# ---------------------------------------------------------------------------
class SlideOutline(BaseModel):
    """Bloco do storyline. Cada bloco vira 1 slide (ou 1 secao curta)."""

    model_config = ConfigDict(extra="ignore")

    slide_n: int = Field(..., ge=1, description="Posicao no deck (1-based)")
    message: str = Field(
        ...,
        min_length=8,
        max_length=240,
        description="Conclusao do slide em 1 frase. Action title.",
    )
    kind_hint: Optional[str] = Field(
        None,
        description=(
            "Tipo canonico de viz. Ex: hero_number, bar_chart_comparison, "
            "matrix_2x2, timeline_horizontal, before_after_arrow, "
            "risk_heatmap, quote_slide, decision_slide, process_flow."
        ),
    )
    quero_mostrar_que: str = Field(
        ...,
        min_length=8,
        max_length=240,
        description="Secao 19.1 do guia. Inteacao narrativa.",
    )
    bullets: Optional[List[str]] = Field(
        default=None,
        description="3-5 bullets max 18 palavras cada.",
    )
    data_inputs: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Dados quantificados para popular o slide.",
    )
    chart_intent: Optional[str] = Field(
        default=None,
        max_length=240,
        description=(
            "Declaracao 'quero mostrar que...' especifica para o chart "
            "(SPEC graficos-CEO Etapa 7 PR-F retrofit). Diferente de "
            "quero_mostrar_que (narrativa do slide); este campo descreve "
            "o que o chart em si deve revelar visualmente."
        ),
    )

    @field_validator("bullets")
    @classmethod
    def _bullets_size(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is None:
            return None
        if len(v) > 8:
            raise ValueError(
                "bullets deve ter <= 8 itens (recomendado 3-5)."
            )
        for i, bullet in enumerate(v):
            if not isinstance(bullet, str) or not bullet.strip():
                raise ValueError(
                    f"bullet[{i}] vazio ou nao-string."
                )
        return [b.strip() for b in v]


# ---------------------------------------------------------------------------
# Briefing — input completo para o pipeline
# ---------------------------------------------------------------------------
_OUTLINE_MIN = 5
_OUTLINE_MAX = 30


class Briefing(BaseModel):
    """Briefing estruturado para invocacao do modo `executive`.

    Mapeamento direto do guia mestre, secoes 5.1-5.4:
      - pergunta_principal (5.2)
      - mensagem_central (5.3, 1 frase)
      - storyline 5-9 blocos -> outline (5.4)

    Campos extras (`storyline_kind`, `restricoes_visuais`) habilitam
    aplicacao automatica de templates pre-construidos (PR 1.1, parte 2).
    """

    model_config = ConfigDict(extra="ignore")

    # Conteudo narrativo (secoes 5.2-5.4 do guia)
    pergunta_principal: str = Field(
        ...,
        min_length=8,
        max_length=240,
        description="Secao 5.2. Pergunta que o deck responde.",
    )
    mensagem_central: str = Field(
        ...,
        min_length=8,
        max_length=240,
        description="Secao 5.3. Em 1 frase. Quantificada quando possivel.",
    )
    decisao_esperada: str = Field(
        ...,
        min_length=8,
        max_length=240,
        description="Que decisao a audiencia precisa tomar (ou que acao).",
    )

    # Audiencia / formato
    audience: Audience = Field(..., description="Quem recebe.")
    format: Format = Field(
        ...,
        description=(
            "Formato de entrega: apresentacao oral, pre-read, leave-behind, "
            "workshop, conselho, comite executivo, ou treinamento."
        ),
    )
    duracao_min: int = Field(
        ...,
        ge=5,
        le=480,
        description="Duracao em minutos (5..480).",
    )
    tom: Tom = Field(..., description="Provocativo, didatico, etc.")

    # Storyline
    storyline_kind: Optional[StorylineKind] = Field(
        default=None,
        description=(
            "Se especificado, aplica template pre-construido em "
            "`storyline_templates.py` quando outline estiver vazio."
        ),
    )
    outline: List[SlideOutline] = Field(
        default_factory=list,
        description="5..30 blocos. Pode estar vazio se storyline_kind setado.",
    )

    # Identidade visual
    restricoes_visuais: Optional[List[str]] = Field(
        default=None,
        description="Ex: 'sem fotos', 'so charts', 'paleta monocromatica'.",
    )
    marca: Optional[str] = Field(
        default="raiz",
        description="Brand override (raiz, inspira, custom).",
    )

    # Dados disponiveis
    dados_disponiveis: Optional[List[str]] = Field(
        default=None,
        description="Lista de fontes / datasets disponiveis para o deck.",
    )

    # Validators ----------------------------------------------------------
    @model_validator(mode="after")
    def _validate_outline_size(self) -> "Briefing":
        """Outline pode estar vazio APENAS se storyline_kind for especificado.

        Caso outline seja preenchido, deve ter 5..30 itens (secao 5.4 do guia).
        """
        n = len(self.outline)
        has_kind = self.storyline_kind is not None
        if n == 0 and not has_kind:
            raise ValueError(
                "outline vazio exige storyline_kind setado para aplicacao "
                "de template pre-construido."
            )
        if n > 0 and (n < _OUTLINE_MIN or n > _OUTLINE_MAX):
            raise ValueError(
                f"outline deve ter {_OUTLINE_MIN}..{_OUTLINE_MAX} blocos "
                f"(recebido: {n})."
            )
        return self


# ---------------------------------------------------------------------------
# Parser principal: detecta YAML vs prosa
# ---------------------------------------------------------------------------
def parse_briefing(content: str) -> Optional[Briefing]:
    """Detecta YAML vs prosa, faz parse apropriado.

    Heuristica:
      - Se primeiro caractere significativo for '#' (Markdown header),
        considera prosa (template `briefing.md` legacy) -> retorna None.
      - Se conseguir `yaml.safe_load(content)` em dict, tenta validar
        como `Briefing` -> retorna instancia ou levanta ValueError.

    Retorna `None` quando o input e claramente prosa Markdown.
    """
    if not content or not content.strip():
        return None

    stripped = content.lstrip()
    # Markdown legacy briefing -> None (caller continua pipeline antigo)
    if stripped.startswith("#"):
        return None

    # Tenta YAML
    try:
        import yaml  # PyYAML ja esta na stack
    except ImportError as exc:  # pragma: no cover
        raise RuntimeError(
            "PyYAML necessario para parse de briefing YAML. "
            "Instale: pip install pyyaml"
        ) from exc

    try:
        data = yaml.safe_load(content)
    except yaml.YAMLError:
        return None

    if not isinstance(data, dict):
        return None

    return Briefing(**data)


__all__ = [
    "Briefing",
    "SlideOutline",
    "parse_briefing",
    "Audience",
    "Format",
    "Tom",
    "StorylineKind",
]
