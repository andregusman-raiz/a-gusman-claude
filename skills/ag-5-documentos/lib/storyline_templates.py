"""Storyline templates pre-construidos — 6 padroes canonicos.

PR 1.1 (parte 2) do plano `reflective-zooming-sonnet.md`. Implementa
secoes 13.1-13.5 do guia mestre (biblioteca de storylines).

Cada template segue a estrutura:
  - name (identificador)
  - description (quando usar)
  - outline_skeleton (5-9 blocos com message + kind_hint sugerido)
  - validator_config (futura calibracao Fase 2+)
  - viz_hints (lista canonica para esta narrativa)

Uso:
    from .briefing_schema import Briefing
    from .storyline_templates import apply_storyline

    b = Briefing(
        ...
        outline=[],   # vazio
        storyline_kind="recomendacao",
    )
    b_full = apply_storyline(b, "recomendacao")
    assert len(b_full.outline) >= 5

API publica:
  - STORYLINE_TEMPLATES: dict completo
  - get_storyline_template(kind) -> dict
  - apply_storyline(briefing, kind) -> Briefing (novo, com outline preenchido)
"""
from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict, List

from .briefing_schema import Briefing, SlideOutline, StorylineKind


# ---------------------------------------------------------------------------
# Templates (secoes 13.1-13.5 + 33.5 do guia mestre)
# ---------------------------------------------------------------------------
# Convencao: cada bloco do outline_skeleton tem:
#   slide_n (sequencial), message (action title generico),
#   kind_hint (viz canonica), quero_mostrar_que (intencao narrativa).
# Mensagens sao TEMPLATES — caller deve customizar antes de gerar deck.

_RECOMENDACAO: Dict[str, Any] = {
    "name": "recomendacao_estrategica",
    "description": (
        "Secao 13.1 do guia. Use quando a audiencia precisa aprovar uma "
        "recomendacao concreta e havera 2-3 alternativas avaliadas."
    ),
    "outline_skeleton": [
        {
            "slide_n": 1,
            "message": "Recomendamos [acao] para capturar [valor quantificado] em [prazo]",
            "kind_hint": "decision_slide",
            "quero_mostrar_que": "Recomendacao + valor + prazo (a tese em 1 slide)",
        },
        {
            "slide_n": 2,
            "message": "Contexto: [tendencia + janela de urgencia + custo de inacao]",
            "kind_hint": "hero_number",
            "quero_mostrar_que": "Por que agora e nao depois",
        },
        {
            "slide_n": 3,
            "message": "Diagnostico: [problema] tem [N] drivers concentrados",
            "kind_hint": "stack_hierarchy",
            "quero_mostrar_que": "Decomposicao MECE do problema",
        },
        {
            "slide_n": 4,
            "message": "Avaliamos [N] alternativas em [criterios]",
            "kind_hint": "matrix_2x2",
            "quero_mostrar_que": "Comparacao das alternativas (impacto x custo)",
        },
        {
            "slide_n": 5,
            "message": "Recomendamos [opcao escolhida] porque [3 razoes quantificadas]",
            "kind_hint": "before_after_arrow",
            "quero_mostrar_que": "Justificativa da escolha vs status quo",
        },
        {
            "slide_n": 6,
            "message": "Execucao em [N] fases entrega [valor incremental] em [prazos]",
            "kind_hint": "timeline_horizontal",
            "quero_mostrar_que": "Roadmap com gates",
        },
        {
            "slide_n": 7,
            "message": "Pedimos [decisao especifica] em [data]",
            "kind_hint": "decision_slide",
            "quero_mostrar_que": "Call to action explicito",
        },
    ],
    "validator_config": {
        "must_have_decision_slide": True,
        "must_have_alternatives": True,
        "min_quantified_titles_pct": 0.60,
    },
    "viz_hints": [
        "decision_slide",
        "matrix_2x2",
        "before_after_arrow",
        "timeline_horizontal",
        "stack_hierarchy",
        "hero_number",
    ],
}


_DIAGNOSTICO: Dict[str, Any] = {
    "name": "diagnostico_executivo",
    "description": (
        "Secao 13.2 do guia. Use quando a audiencia precisa entender por "
        "que algo esta acontecendo e como atuar nas causas."
    ),
    "outline_skeleton": [
        {
            "slide_n": 1,
            "message": "[Problema] esta concentrado em [N] drivers que respondem por [%]",
            "kind_hint": "hero_number",
            "quero_mostrar_que": "Tese central: problema NAO e difuso, e concentrado",
        },
        {
            "slide_n": 2,
            "message": "Sintoma evoluiu de [baseline] para [atual] em [periodo]",
            "kind_hint": "bar_chart_comparison",
            "quero_mostrar_que": "Magnitude e velocidade do problema",
        },
        {
            "slide_n": 3,
            "message": "Driver 1: [causa] explica [%] do gap",
            "kind_hint": "stack_hierarchy",
            "quero_mostrar_que": "Decomposicao do driver mais relevante",
        },
        {
            "slide_n": 4,
            "message": "Driver 2: [causa] explica [%] adicional",
            "kind_hint": "bar_chart_comparison",
            "quero_mostrar_que": "Segundo driver com magnitude relativa",
        },
        {
            "slide_n": 5,
            "message": "Priorizacao: atacar [drivers prioritarios] captura [% do gap]",
            "kind_hint": "matrix_2x2",
            "quero_mostrar_que": "Impacto x esforco para focar acao",
        },
        {
            "slide_n": 6,
            "message": "Plano 90 dias: [3-5 acoes] entregam [valor quantificado]",
            "kind_hint": "timeline_horizontal",
            "quero_mostrar_que": "Roadmap acionavel de curto prazo",
        },
    ],
    "validator_config": {
        "must_have_root_cause": True,
        "must_have_quantified_drivers": True,
    },
    "viz_hints": [
        "hero_number",
        "bar_chart_comparison",
        "stack_hierarchy",
        "matrix_2x2",
        "timeline_horizontal",
    ],
}


_STATUS: Dict[str, Any] = {
    "name": "status_de_projeto",
    "description": (
        "Secao 13.3 do guia. Use em status weekly/mensal para audiencia "
        "que ja conhece o contexto e precisa decidir mitigacoes."
    ),
    "outline_skeleton": [
        {
            "slide_n": 1,
            "message": "Projeto em [status: verde/amarelo/vermelho] por [motivo principal]",
            "kind_hint": "hero_number",
            "quero_mostrar_que": "Sinal claro do estado atual",
        },
        {
            "slide_n": 2,
            "message": "Entregas: [N de M] concluidas, [valor capturado ate aqui]",
            "kind_hint": "bar_chart_comparison",
            "quero_mostrar_que": "Progresso vs plano",
        },
        {
            "slide_n": 3,
            "message": "Riscos: [top 3] com [impacto + probabilidade]",
            "kind_hint": "risk_heatmap",
            "quero_mostrar_que": "Visao priorizada dos riscos",
        },
        {
            "slide_n": 4,
            "message": "Decisoes pendentes: [N] que dependem da audiencia",
            "kind_hint": "decision_slide",
            "quero_mostrar_que": "O que precisa ser decidido nesta sessao",
        },
        {
            "slide_n": 5,
            "message": "Proximos passos em [periodo] e gate de [data]",
            "kind_hint": "timeline_horizontal",
            "quero_mostrar_que": "Foco da proxima janela",
        },
    ],
    "validator_config": {
        "must_have_status_indicator": True,
        "must_have_decisions_required": True,
    },
    "viz_hints": [
        "hero_number",
        "bar_chart_comparison",
        "risk_heatmap",
        "decision_slide",
        "timeline_horizontal",
    ],
}


_TREINAMENTO: Dict[str, Any] = {
    "name": "treinamento_executivo",
    "description": (
        "Secao 13.4 do guia. Use para capacitar audiencia em um tema "
        "novo com aplicacao concreta no trabalho deles."
    ),
    "outline_skeleton": [
        {
            "slide_n": 1,
            "message": "[Tema] muda como voces trabalham em [N] dimensoes",
            "kind_hint": "hero_number",
            "quero_mostrar_que": "Tese: por que este treino importa para a audiencia",
        },
        {
            "slide_n": 2,
            "message": "Ganho concreto: [valor quantificado] em workflows [especificos]",
            "kind_hint": "before_after_arrow",
            "quero_mostrar_que": "Antes vs depois (motivacao)",
        },
        {
            "slide_n": 3,
            "message": "Caso real 1: [persona] obteve [resultado] em [tempo]",
            "kind_hint": "quote_slide",
            "quero_mostrar_que": "Prova social com narrativa concreta",
        },
        {
            "slide_n": 4,
            "message": "Caso real 2: [persona] obteve [resultado] em [tempo]",
            "kind_hint": "quote_slide",
            "quero_mostrar_que": "Segundo caso para diversificar perfil",
        },
        {
            "slide_n": 5,
            "message": "Demo: [tarefa] passa de [tempo atual] para [tempo novo]",
            "kind_hint": "process_flow",
            "quero_mostrar_que": "Como funciona na pratica (passo a passo)",
        },
        {
            "slide_n": 6,
            "message": "Aplicacao no seu dia: [3 acoes] na proxima semana",
            "kind_hint": "stack_hierarchy",
            "quero_mostrar_que": "Acionabilidade imediata",
        },
        {
            "slide_n": 7,
            "message": "Continuidade: [recursos + cadencia] para aprofundar",
            "kind_hint": "timeline_horizontal",
            "quero_mostrar_que": "Caminho de aprendizado pos-sessao",
        },
    ],
    "validator_config": {
        "must_have_concrete_example": True,
        "must_have_actionable_takeaway": True,
    },
    "viz_hints": [
        "hero_number",
        "before_after_arrow",
        "quote_slide",
        "process_flow",
        "stack_hierarchy",
        "timeline_horizontal",
    ],
}


_BUSINESS_CASE: Dict[str, Any] = {
    "name": "business_case",
    "description": (
        "Secao 13.5 do guia. Use para justificar investimento com "
        "retorno quantificado, cenarios e payback."
    ),
    "outline_skeleton": [
        {
            "slide_n": 1,
            "message": "Iniciativa [nome] gera [valor] com payback de [N meses]",
            "kind_hint": "hero_number",
            "quero_mostrar_que": "Tese do business case em 1 numero",
        },
        {
            "slide_n": 2,
            "message": "Problema custa [valor anual] hoje em [3 dimensoes]",
            "kind_hint": "stack_hierarchy",
            "quero_mostrar_que": "Custo do status quo",
        },
        {
            "slide_n": 3,
            "message": "Solucao captura [valor] via [mecanismos especificos]",
            "kind_hint": "before_after_arrow",
            "quero_mostrar_que": "Onde o valor sai (mecanismo)",
        },
        {
            "slide_n": 4,
            "message": "Investimento de [valor] distribuido em [fases]",
            "kind_hint": "timeline_horizontal",
            "quero_mostrar_que": "Estrutura do investimento ao longo do tempo",
        },
        {
            "slide_n": 5,
            "message": "Cenarios: base [valor], pessimista [valor], otimista [valor]",
            "kind_hint": "bar_chart_comparison",
            "quero_mostrar_que": "Sensibilidade da analise",
        },
        {
            "slide_n": 6,
            "message": "Proximo passo: [decisao + data + responsaveis]",
            "kind_hint": "decision_slide",
            "quero_mostrar_que": "O que precisa acontecer agora",
        },
    ],
    "validator_config": {
        "must_have_payback": True,
        "must_have_scenarios": True,
        "must_have_investment_breakdown": True,
    },
    "viz_hints": [
        "hero_number",
        "stack_hierarchy",
        "before_after_arrow",
        "timeline_horizontal",
        "bar_chart_comparison",
        "decision_slide",
    ],
}


_COMITE: Dict[str, Any] = {
    "name": "comite_executivo",
    "description": (
        "Secao 13.5 / 33.5 do guia. Use em comite/conselho onde decisao "
        "binaria e requerida hoje, com pouco tempo para contexto."
    ),
    "outline_skeleton": [
        {
            "slide_n": 1,
            "message": "Decisao requerida hoje: [opcao A vs B] sobre [tema]",
            "kind_hint": "decision_slide",
            "quero_mostrar_que": "Decisao binaria explicita logo no inicio",
        },
        {
            "slide_n": 2,
            "message": "Contexto mudou: [evento] em [periodo] tornou decisao urgente",
            "kind_hint": "before_after_arrow",
            "quero_mostrar_que": "Por que agora",
        },
        {
            "slide_n": 3,
            "message": "Opcoes: A entrega [valor], B entrega [valor], C [valor]",
            "kind_hint": "matrix_2x2",
            "quero_mostrar_que": "Comparacao objetiva das opcoes",
        },
        {
            "slide_n": 4,
            "message": "Recomendacao: [opcao] por [3 razoes quantificadas]",
            "kind_hint": "stack_hierarchy",
            "quero_mostrar_que": "Justificativa da recomendacao do time executor",
        },
        {
            "slide_n": 5,
            "message": "Execucao: [marcos] e [donos] em [prazos]",
            "kind_hint": "timeline_horizontal",
            "quero_mostrar_que": "Como sera implementado se aprovado",
        },
        {
            "slide_n": 6,
            "message": "Comite aprova [opcao] com [condicoes]?",
            "kind_hint": "decision_slide",
            "quero_mostrar_que": "Voto formal do comite",
        },
    ],
    "validator_config": {
        "must_have_binary_decision": True,
        "must_have_recommendation": True,
        "max_slides": 8,
    },
    "viz_hints": [
        "decision_slide",
        "before_after_arrow",
        "matrix_2x2",
        "stack_hierarchy",
        "timeline_horizontal",
    ],
}


# ---------------------------------------------------------------------------
# Registry publico
# ---------------------------------------------------------------------------
STORYLINE_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "recomendacao":   _RECOMENDACAO,
    "diagnostico":    _DIAGNOSTICO,
    "status":         _STATUS,
    "treinamento":    _TREINAMENTO,
    "business_case":  _BUSINESS_CASE,
    "comite":         _COMITE,
}


def get_storyline_template(kind: StorylineKind) -> Dict[str, Any]:
    """Retorna template (deepcopy para evitar mutacao acidental)."""
    if kind not in STORYLINE_TEMPLATES:
        raise ValueError(
            f"storyline_kind desconhecido: '{kind}'. "
            f"Validos: {sorted(STORYLINE_TEMPLATES.keys())}"
        )
    return deepcopy(STORYLINE_TEMPLATES[kind])


def _skeleton_to_outline(skeleton: List[Dict[str, Any]]) -> List[SlideOutline]:
    """Converte skeleton (lista de dicts) em SlideOutline objects."""
    return [SlideOutline(**block) for block in skeleton]


def apply_storyline(briefing: Briefing,
                    kind: StorylineKind) -> Briefing:
    """Aplica skeleton ao outline se vazio. Retorna NOVO Briefing.

    Comportamento:
      - Se `briefing.outline` ja tem itens: retorna briefing inalterado
        (caller decidiu outline custom; storyline_kind so serve como tag).
      - Se `briefing.outline` esta vazio: popula com o skeleton do template.

    Nota: nao muta o briefing original (Pydantic v2 immutable-ish).
    """
    template = get_storyline_template(kind)

    if briefing.outline:
        # Outline ja preenchido: nao sobrescrever
        return briefing

    new_outline = _skeleton_to_outline(template["outline_skeleton"])
    # Pydantic v2: model_copy(update={...}) cria nova instancia
    return briefing.model_copy(update={"outline": new_outline})


# ---------------------------------------------------------------------------
# PR-F retrofit (chart-CEO SPEC) — chart_type recommendations per storyline.
#
# Maps storyline_kind -> ordered list of chart types (CHART_REGISTRY keys) that
# typically resolve the storyline's narrative arc. Pipeline.assign_visualizations
# can use this to suggest chart_type when slide.viz.kind matches a CHART_REGISTRY
# entry; storyline drives which chart fits each block.
#
# Source: SPEC Etapa 3 (Storylines Canonicas x Mapeamento de Graficos).
# ---------------------------------------------------------------------------
STORYLINE_CHART_HINTS: Dict[str, List[str]] = {
    "recomendacao": [
        # Recomendacao Estrategica (12-16 slides). Order matches SPEC Etapa 3.1.
        "bar",          # situacao atual
        "waterfall",    # diagnostico de causas
        "driver_tree",  # decomposicao causal alternativa
        "waterfall",    # business case (financial bridge)
    ],
    "diagnostico": [
        # Diagnostico Executivo (8-12 slides). SPEC Etapa 3.2.
        "line",            # KPI principal YoY
        "bar",             # breakdown por categoria
        "stacked100_bar",  # composicao percentual
        "donut",           # distribuicao
        "treemap",         # hierarquia por area
        "grouped_bar",     # comparacao benchmarks
        "heatmap",         # matriz prioridade
        "combo",           # detalhe por segmento (bar + line)
    ],
    "status": [
        # Status de Projeto (6-10 slides). SPEC Etapa 3.3.
        "bullet",       # progresso vs plano (3-5 KPIs)
        "waterfall",    # budget burn
        "bar",          # entregas por categoria
    ],
    "treinamento": [
        # Treinamento Executivo. Domínio textual; charts pontuais.
        "line",         # serie temporal quando ha dado
        "bar",          # comparacao pontual
    ],
    "business_case": [
        # Business Case (8-14 slides). SPEC Etapa 3.5.
        "donut",         # tamanho de mercado
        "treemap",       # tamanho de mercado alternativo
        "line",          # crescimento historico
        "area",          # crescimento com volume
        "combo",         # projecao receita
        "waterfall",     # P&L sumario
        "heatmap",       # analise sensibilidade
        "driver_tree",   # ROI decomposicao
        "grouped_bar",   # comparativo concorrentes
    ],
    "comite": [
        # Comite Executivo (5-8 slides, alta densidade). SPEC Etapa 3.6.
        "bullet",       # scorecard
        "infographic",  # N metricas em 1 slide
        "line",         # KPI evolucao com hero number
    ],
}


def get_chart_hints(storyline_kind: str) -> List[str]:
    """Returns ordered list of chart_type recommendations for a storyline.

    Empty list when storyline_kind is unknown — caller falls back to the
    auto-detector (visualization.select_visualization).
    """
    return list(STORYLINE_CHART_HINTS.get(storyline_kind, []))


__all__ = [
    "STORYLINE_TEMPLATES",
    "STORYLINE_CHART_HINTS",
    "get_storyline_template",
    "get_chart_hints",
    "apply_storyline",
]
