"""Visualization-first design — fase NOVA do pipeline executive (P0.1).

Decide, para CADA slide do outline, qual visualizacao canonica e mais
apropriada para a mensagem antes de escolher layout. Evita o anti-pattern
"tudo vira card-grid".

Critério tabular (auditoria 2026-04-25):

| Tipo de mensagem                      | Visualizacao canonica         |
|---------------------------------------|-------------------------------|
| Comparacao 2-4 segmentos              | bar_chart_comparison          |
| Trajetoria temporal / evolucao        | line_chart                    |
| Hierarquia / N camadas / stack        | stack_hierarchy               |
| 2 dimensoes x 2 estados / classificar | matrix_2x2                    |
| Sequencia de marcos / roadmap         | timeline_horizontal           |
| Antes vs Depois (transformacao)       | before_after_arrow            |
| Unico numero de impacto               | hero_number                   |
| Risco x impacto / probabilidade       | risk_heatmap                  |
| Citacao / quote                       | quote_slide                   |
| Pergunta + 2-3 opcoes (decisao)       | decision_slide                |
| Etapas com dependencias / fluxo       | process_flow                  |
| Distribuicao / share                  | donut_or_treemap (futuro)     |
| Lista pura sem relacao (ultimo caso)  | bullet_list                   |

Modulo input/output:

    Input:  outline list (de pipeline.py), cada item:
        {
            "slide_n": 7,
            "message": "Klarna substituiu 700 atendentes por 1 IA — economia $40M/ano",
            "key_number": "$40M",
            "source_section": "casos-de-uso",
            "data_available": ["NPS antes/depois", "headcount before/after"],
            "kind_hint": None  # opcional: forcar tipo
        }
    Output: mesmo dict + chave "viz" (VizSpec).

Uso:

    from lib.visualization import select_visualization, VizSpec

    enriched = [select_visualization(item) for item in outline]
    # cada enriched[i]["viz"] e um VizSpec
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


# ---------------------------------------------------------------------------
# Catalog de tipos canonicos
# ---------------------------------------------------------------------------
CANONICAL_VIZ_TYPES = {
    "bar_chart_comparison":  "Bar chart com 2-5 segmentos (comparacao)",
    "line_chart":            "Line chart com pontos no tempo (trajetoria)",
    "stack_hierarchy":       "Stack vertical com N camadas (hierarquia)",
    "matrix_2x2":            "Matrix 2x2 com 4 quadrantes nomeados",
    "timeline_horizontal":   "Timeline horizontal com marcos",
    "before_after_arrow":    "Antes vs Depois com seta dominante",
    "hero_number":           "Numero gigante 60-100pt + 1 frase + chart opcional",
    "risk_heatmap":          "Matriz risco x impacto (5x5 ou 3x3)",
    "quote_slide":           "Citacao em tipografia editorial",
    "decision_slide":        "Pergunta + 2-3 opcoes com trade-offs",
    "process_flow":          "Fluxograma com etapas e setas",
    "bullet_list":           "Lista pura (USAR SO COMO ULTIMO RECURSO)",
    "card_grid":             "Card grid (LEGACY — manter para compat)",
}

# Tipos considerados "visualization nao-textual" para o gate de 30% (P0.2)
NON_TEXTUAL_VIZ_TYPES = frozenset({
    "bar_chart_comparison",
    "line_chart",
    "stack_hierarchy",
    "matrix_2x2",
    "timeline_horizontal",
    "before_after_arrow",
    "hero_number",
    "risk_heatmap",
    "process_flow",
})


@dataclass
class VizSpec:
    """Spec de visualizacao para um slide."""
    kind: str              # uma das chaves de CANONICAL_VIZ_TYPES
    rationale: str         # por que esse tipo (1 frase)
    confidence: float      # 0.0..1.0
    data_input: Dict[str, Any] = field(default_factory=dict)  # dados extraidos da msg
    fallback: Optional[str] = None  # se kind nao for renderizavel, usar este


# ---------------------------------------------------------------------------
# Heuristicas de deteccao (regex e keywords PT-BR e EN)
# ---------------------------------------------------------------------------

# Patterns ordenados por especificidade — primeiro match ganha.
# Cada entry: (kind, rationale, regex_or_keywords, confidence)
DETECTION_RULES = [
    # decision (pergunta + opcoes)
    (
        "decision_slide",
        "Pergunta + opcoes detectadas — slide de decisao explicita",
        [
            r"\b(opcao|opcoes|cenario|cenarios|qual escolhe|qual decide|escolham?|decidam?)\b",
            r"\?.{0,20}(opcao|cenario)",
            r"\b(A vs B|A ou B)\b",
        ],
        0.85,
    ),
    # quote
    (
        "quote_slide",
        "Citacao detectada — quote slide editorial",
        [
            r'^["“”]',
            r"\b(disse|afirmou|segundo|de acordo com)\s+\w",
            r'(citacao|quote)',
        ],
        0.80,
    ),
    # before/after
    (
        "before_after_arrow",
        "Transformacao 2-estados detectada — before/after com seta",
        [
            r"\b(antes\s*(?:vs|x|->|→|e\s*depois|.{0,10}depois)|de\s+\w+\s+para\s+\w+)\b",
            r"\b(transformou|virou|migrou|substituiu)\b",
            r"\b(before|after)\b",
        ],
        0.80,
    ),
    # risk / heatmap
    (
        "risk_heatmap",
        "Risco x impacto detectado — heatmap",
        [
            r"\b(risco|riscos)\s*(?:x|vs|por|e)\s*(impacto|probabilidade)\b",
            r"\b(matriz de risco|heatmap)\b",
        ],
        0.85,
    ),
    # matrix 2x2 (classificacao)
    (
        "matrix_2x2",
        "Classificacao 2 dimensoes x 2 estados — matrix 2x2",
        [
            r"\b(matrix|matriz)\s*2\s*[x×]\s*2\b",
            r"\b(quadrante|quadrantes)\b",
            r"\b(lider(?:es)?|seguidor(?:es)?|estagnado|saido).{0,30}(lider|seguidor|estagnado|saido)",
            r"\b(alto|alta|baixo|baixa).{0,40}(alto|alta|baixo|baixa)",
        ],
        0.75,
    ),
    # timeline / roadmap
    (
        "timeline_horizontal",
        "Sequencia de marcos no tempo — timeline horizontal",
        [
            r"\b(roadmap|cronograma|timeline)\b",
            r"\b(2024|2025|2026|2027|2028).{0,30}(2024|2025|2026|2027|2028)",
            r"\b(mes\s*1|mes\s*\d|q[1-4])\b.{0,30}\b(mes\s*\d|q[1-4])\b",
            r"\b(fase\s*1|fase\s*[ivx]+)\b.{0,30}\b(fase\s*\d|fase\s*[ivx]+)\b",
        ],
        0.85,
    ),
    # process flow
    (
        "process_flow",
        "Etapas com dependencias detectadas — process flow",
        [
            r"\b(etapa|etapas|passo|passos|step|steps)\s+\d",
            r"\b(fluxo|fluxograma|workflow|pipeline)\b",
            r"→.{0,40}→",  # 2+ setas no texto
            r"->.{0,40}->",
        ],
        0.70,
    ),
    # stack / hierarchy
    (
        "stack_hierarchy",
        "Hierarquia ou camadas detectada — stack vertical",
        [
            r"\b(\d+\s*camadas?|camada\s+\d|stack)\b",
            r"\b(hierarquia|niveis?|nivel\s+\d)\b",
            r"\b(piramide|pyramid)\b",
            r"\b(layer\s+\d|layers)\b",
        ],
        0.75,
    ),
    # line chart (trajetoria)
    (
        "line_chart",
        "Trajetoria temporal detectada — line chart",
        [
            r"\b(crescimento|evolucao|trajetoria|tendencia|trend)\b.{0,30}\b(ano|mes|semestre|tempo)",
            r"\b(de\s+\d{4}\s+(?:a|para|ate)\s+\d{4})\b",
            r"\b(serie temporal|time series)\b",
        ],
        0.70,
    ),
    # bar chart (comparacao N entidades)
    (
        "bar_chart_comparison",
        "Comparacao 2-5 segmentos — bar chart",
        [
            r"\b(comparacao|comparar|versus|vs\b)",
            r"\b(top\s+\d|ranking)\b",
            r"\b(\d+\s*x|\d+\s*vezes)\s+(maior|menor|mais|menos)",
            r"\b\d+%\b.{0,40}\b\d+%\b",  # 2+ percentuais (comparacao)
        ],
        0.70,
    ),
]


# Patterns que reforcam HERO_NUMBER (precisa numero forte E texto curto)
HERO_NUMBER_NUMBER_RE = re.compile(
    r"(?:R\$\s*\d+[\d.,]*\s*(?:MM?|K|mil|milhao|milhoes|bilhao|bilhoes|B)?|"
    r"US?\$?\s*\d+[\d.,]*\s*[MMKB]?|"
    r"\$\s*\d+[\d.,]*\s*[MMKB]?|"
    r"\d+\s*x\b|"
    r"\d{1,3}\s*%|"
    r"\d{2,}\s*(?:atendentes|funcionarios|empresas|clientes|usuarios|alunos|leads)|"
    r"\b\d{1,3}[.,]\d+(?:\s*MM?|K|bilhoes|milhoes)?)",
    re.IGNORECASE,
)


def _detect_hero_number(message: str, key_number: Optional[str]) -> Optional[VizSpec]:
    """Detecta se mensagem deve ser hero_number.

    Criterio: tem numero forte (>= 1 match com regex) e tese curta (<= 16 palavras).
    Ou usuario indicou key_number explicitamente.
    """
    has_strong_number = bool(HERO_NUMBER_NUMBER_RE.search(message)) or bool(key_number)
    word_count = len(message.split())

    if has_strong_number and word_count <= 16:
        return VizSpec(
            kind="hero_number",
            rationale="Numero forte + tese curta — hero number 60-100pt",
            confidence=0.90,
            data_input={"number": key_number or _extract_first_number(message),
                        "context": message},
        )
    return None


def _extract_first_number(text: str) -> str:
    """Extrai a primeira string numerica/financeira do texto."""
    m = HERO_NUMBER_NUMBER_RE.search(text)
    return m.group(0) if m else ""


# ---------------------------------------------------------------------------
# Selector principal
# ---------------------------------------------------------------------------
def select_visualization(slide_item: Dict[str, Any]) -> Dict[str, Any]:
    """Recebe item do outline e retorna mesmo dict + chave 'viz' (VizSpec).

    Algoritmo:
      1) Se kind_hint informado, usa direto (confidence=1.0)
      2) Tenta detectar hero_number (numero forte + texto curto)
      3) Roda DETECTION_RULES em ordem; primeiro match ganha
      4) Fallback: card_grid se >=4 itens, senao bullet_list
    """
    msg = (slide_item.get("message") or "").strip()
    key_number = slide_item.get("key_number")
    kind_hint = slide_item.get("kind_hint")
    bullets = slide_item.get("bullets") or []

    # 1) Hint explicito
    if kind_hint and kind_hint in CANONICAL_VIZ_TYPES:
        viz = VizSpec(
            kind=kind_hint,
            rationale=f"Hint explicito do briefing: {kind_hint}",
            confidence=1.0,
            data_input={"number": key_number, "context": msg},
        )
        slide_item["viz"] = viz
        return slide_item

    # 2) Hero number
    hero = _detect_hero_number(msg, key_number)
    if hero is not None:
        slide_item["viz"] = hero
        return slide_item

    # 3) Rule-based
    msg_norm = _normalize(msg)
    for kind, rationale, patterns, conf in DETECTION_RULES:
        for pat in patterns:
            try:
                if re.search(pat, msg_norm, re.IGNORECASE):
                    slide_item["viz"] = VizSpec(
                        kind=kind, rationale=rationale,
                        confidence=conf,
                        data_input={"context": msg, "number": key_number},
                    )
                    return slide_item
            except re.error:
                continue

    # 4) Fallback
    if len(bullets) >= 4:
        slide_item["viz"] = VizSpec(
            kind="card_grid",
            rationale="Sem padrao detectado e >=4 itens — card grid (legacy)",
            confidence=0.30,
            data_input={"context": msg},
            fallback="bullet_list",
        )
    else:
        slide_item["viz"] = VizSpec(
            kind="bullet_list",
            rationale="Sem padrao detectado — bullet list (ultimo recurso)",
            confidence=0.20,
            data_input={"context": msg},
        )
    return slide_item


def _normalize(text: str) -> str:
    """Normaliza texto para matching: minusculas + remove acentos basicos."""
    table = str.maketrans({
        "á": "a", "à": "a", "â": "a", "ã": "a", "ä": "a",
        "é": "e", "ê": "e", "è": "e",
        "í": "i", "î": "i",
        "ó": "o", "ô": "o", "õ": "o",
        "ú": "u", "û": "u",
        "ç": "c",
        "Á": "A", "Â": "A", "Ã": "A",
        "É": "E", "Ê": "E",
        "Í": "I",
        "Ó": "O", "Ô": "O", "Õ": "O",
        "Ú": "U",
        "Ç": "C",
    })
    return text.translate(table).lower()


# ---------------------------------------------------------------------------
# Aggregations / quality gates
# ---------------------------------------------------------------------------
def viz_ratio_non_textual(slides: List[Dict[str, Any]]) -> float:
    """Retorna ratio (0..1) de slides com viz nao-textual.

    Usado pelo gate P0.2: minimo 30% (0.30).
    """
    if not slides:
        return 0.0
    n_visual = sum(
        1 for s in slides
        if (s.get("viz") and s["viz"].kind in NON_TEXTUAL_VIZ_TYPES)
    )
    return n_visual / len(slides)


def viz_summary(slides: List[Dict[str, Any]]) -> Dict[str, int]:
    """Conta quantos slides de cada tipo de viz."""
    counts: Dict[str, int] = {}
    for s in slides:
        viz = s.get("viz")
        kind = viz.kind if viz else "none"
        counts[kind] = counts.get(kind, 0) + 1
    return counts


def detect_layout_repetition(slides: List[Dict[str, Any]],
                             max_consecutive: int = 2) -> List[int]:
    """Retorna lista de indices onde ha 3+ slides consecutivos com mesmo viz.kind.

    Usado pelo gate P1.2 (max 2 slides consecutivos com mesmo layout-type).
    Retorna o indice do TERCEIRO ocorrencia (1-indexed).
    """
    bad_indices: List[int] = []
    if not slides:
        return bad_indices

    streak_kind = None
    streak_n = 0
    for i, s in enumerate(slides, 1):
        viz = s.get("viz")
        kind = viz.kind if viz else "none"
        if kind == streak_kind:
            streak_n += 1
            if streak_n > max_consecutive:
                bad_indices.append(i)
        else:
            streak_kind = kind
            streak_n = 1
    return bad_indices


__all__ = [
    "VizSpec",
    "CANONICAL_VIZ_TYPES",
    "NON_TEXTUAL_VIZ_TYPES",
    "select_visualization",
    "viz_ratio_non_textual",
    "viz_summary",
    "detect_layout_repetition",
]
