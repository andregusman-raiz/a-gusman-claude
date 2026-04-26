"""Pyramid Principle validator (PR 1.2 do plano `reflective-zooming-sonnet.md`).

Implementa secao 6 do guia mestre: validar coerencia narrativa lendo apenas
os action titles em sequencia.

Estrategia:
  - Path A (preferido): Anthropic SDK com tool_use estruturado, modelo
    claude-sonnet-4-6, prompt cache obrigatorio no system prompt (validador
    e estavel, varia apenas a lista de titles + mensagem central).
  - Path B (fallback): regex-based MVP que checa estruturalmente se:
      * Primeiro slide tem acao/conclusao (nao titulo-topico generico)
      * Ultimo slide tem decisao/recomendacao
      * >=70% dos intermediarios tem numero quantificado

Custo Anthropic estimado: ~$0.05-0.15 por deck (com prompt cache).

Custo regex: zero. Severity sempre 'medium' (warning, nao bloqueante)
para nao truncar entrega quando LLM offline.
"""
from __future__ import annotations

import os
import re
from typing import Any, Dict, List, Optional

from .audit import AuditWarning


# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------
_ANTHROPIC_MODEL = "claude-sonnet-4-6"
_MAX_TOKENS = 1024
_DEFAULT_SEVERITY = "medium"
_CATEGORY = "pyramid_coherence"

# Pattern para numero quantificado (reusado de audit.NUMBER_RE)
_NUMBER_RE = re.compile(
    r"(?:R\$\s*[\d.,]+|US?\$\s*[\d.,]+|\$\s*[\d.,]+|"
    r"\d+\s*x\b|\d{1,3}\s*%|\d{2,}\s*[a-zA-Z]+|"
    r"\b\d+[.,]?\d*\s*(?:MM?|K|mil|milhao|milhoes|bilhao|bilhoes|B|pp))",
    re.IGNORECASE,
)

# Pattern para verbos de acao/conclusao (primeiro slide)
_ACTION_VERB_RE = re.compile(
    r"\b(?:reduz|aumenta|cresce|cai|melhora|piora|gera|elimina|"
    r"recomend|propoe|prove|demonstra|mostra|revela|"
    r"deve|precisa|requer|exige|garant|assegur|"
    r"alcanc|atinge|chega|supera|"
    r"converge|justifica|confirma|valida)",
    re.IGNORECASE,
)

# Pattern para palavras de decisao/recomendacao (ultimo slide)
_DECISION_RE = re.compile(
    r"\b(?:decis(?:ao|oes)|recomend(?:a|acao|amos|ado)|aprov(?:ar|acao)|"
    r"proxim(?:o|os)\s+passo|next\s+step|acao\s+(?:imediata|requerida)|"
    r"call\s+to\s+action|votar|sancion|ratific|"
    r"investir|alocar|priorizar|escolher|optar)",
    re.IGNORECASE,
)

# Anti-pattern: titulos descritivos que sugerem topico-em-vez-de-conclusao
_TOPIC_TITLE_RE = re.compile(
    r"^\s*(?:sumario|introducao|contexto|agenda|definicao|"
    r"tipos?\s+de|conceitos|glossario|sobre|visao\s+geral|"
    r"o\s+que\s+e|capitulo|secao)\b",
    re.IGNORECASE,
)


# ---------------------------------------------------------------------------
# System prompt (cacheable)
# ---------------------------------------------------------------------------
_SYSTEM_PROMPT = """\
Voce e um validador de Pyramid Principle (Barbara Minto / McKinsey).

Sua tarefa: avaliar se uma sequencia de action titles de um deck conta uma
historia coerente quando lida sozinha. Voce deve ser rigoroso mas justo —
o objetivo e detectar gaps reais, nao gerar falsos positivos.

Criterios de avaliacao:

1. Top-down: a mensagem central aparece cedo (capa ou slide 1-2) e os
   slides intermediarios suportam essa mensagem.

2. SCQA na abertura: situacao -> complicacao -> questao -> resposta. A
   resposta (mensagem central) deve estar visivel no inicio.

3. Cada title e uma CONCLUSAO (action title), nao um TOPICO. Conclusoes
   tem verbo, dado ou implicacao. Topicos sao 'A jornada do cliente',
   'Tipos de risco', 'Sobre RAG' — esses sao SINAL DE GAP.

4. Suporte hierarquico: cada slide intermediario deve ser sustentado pelo
   anterior ou complementar a mensagem central. Saltos abruptos entre
   topicos desconectados = GAP.

5. Fechamento explicito: o ultimo slide tem decisao, recomendacao ou
   call-to-action claro.

Score (0-10):
  10 = historia impecavel, leria como artigo executivo
  7-9 = historia funciona, ajustes pontuais
  4-6 = problemas estruturais (slides intermediarios desconectados, sem fechamento)
  0-3 = colagem de slides sem narrativa

Importante: passes_pyramid_test = true APENAS se score >= 7.
"""


# ---------------------------------------------------------------------------
# Tool schema (tool_use)
# ---------------------------------------------------------------------------
_TOOL_SCHEMA = {
    "name": "report_pyramid_coherence",
    "description": (
        "Reporta avaliacao de coerencia narrativa do deck baseado nos "
        "action titles em sequencia. Retorna score, gaps detectados e "
        "sugestoes."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "coherence_score": {
                "type": "integer",
                "minimum": 0,
                "maximum": 10,
                "description": "Score 0-10 da coerencia narrativa.",
            },
            "gaps": {
                "type": "array",
                "items": {"type": "string"},
                "description": (
                    "Lista de gaps detectados. Cada item e uma frase "
                    "objetiva apontando o problema (ex: 'Slide 3 muda "
                    "abruptamente para topico desconectado')."
                ),
            },
            "suggestions": {
                "type": "array",
                "items": {"type": "string"},
                "description": (
                    "Sugestoes acionaveis para fechar os gaps."
                ),
            },
            "passes_pyramid_test": {
                "type": "boolean",
                "description": (
                    "True se score >= 7 e historia funciona; False caso "
                    "contrario."
                ),
            },
        },
        "required": [
            "coherence_score", "gaps", "suggestions",
            "passes_pyramid_test",
        ],
    },
}


# ---------------------------------------------------------------------------
# Path A — Anthropic LLM
# ---------------------------------------------------------------------------
def _validate_via_llm(titles: List[str],
                      central_message: Optional[str]) -> Optional[Dict[str, Any]]:
    """Usa Anthropic API com tool_use para validar coerencia.

    Retorna dict do tool_input ou None se SDK nao instalado / sem API key.

    O system prompt usa cache_control para minimizar custo em chamadas
    sucessivas (validador e estavel; so o user content varia).
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    try:
        import anthropic  # type: ignore
    except ImportError:
        return None

    client = anthropic.Anthropic(api_key=api_key)
    user_content = _build_user_content(titles, central_message)

    try:
        response = client.messages.create(
            model=_ANTHROPIC_MODEL,
            max_tokens=_MAX_TOKENS,
            system=[
                {
                    "type": "text",
                    "text": _SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            tools=[_TOOL_SCHEMA],
            tool_choice={"type": "tool", "name": "report_pyramid_coherence"},
            messages=[{"role": "user", "content": user_content}],
        )
    except Exception:
        # Falha de rede / API: nao bloqueia entrega, fallback regex.
        return None

    for block in response.content:
        if getattr(block, "type", None) == "tool_use":
            return dict(block.input)
    return None


def _build_user_content(titles: List[str],
                        central_message: Optional[str]) -> str:
    lines: List[str] = []
    if central_message:
        lines.append(f"Mensagem central do deck: {central_message}")
        lines.append("")
    lines.append("Action titles em sequencia (1 por slide):")
    for i, t in enumerate(titles, 1):
        lines.append(f"  {i}. {t}")
    lines.append("")
    lines.append(
        "Avalie a coerencia narrativa lendo APENAS os titles. Use a "
        "ferramenta report_pyramid_coherence para reportar score, gaps "
        "e sugestoes."
    )
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Path B — Fallback regex
# ---------------------------------------------------------------------------
def _validate_via_regex(titles: List[str],
                        central_message: Optional[str]) -> Dict[str, Any]:
    """MVP estrutural sem LLM. Retorna o mesmo schema do path A."""
    n = len(titles)
    gaps: List[str] = []
    suggestions: List[str] = []
    score = 10  # comeca otimo, desconta defeitos

    if n < 2:
        return {
            "coherence_score": 0,
            "gaps": ["Deck sem slides suficientes para avaliar coerencia."],
            "suggestions": [],
            "passes_pyramid_test": False,
        }

    # Critério 1: primeiro slide tem acao/conclusao
    first = (titles[0] or "").strip()
    if _TOPIC_TITLE_RE.search(first):
        gaps.append(
            f"Slide 1 parece titulo-topico ('{first[:50]}'), nao "
            "conclusao/acao."
        )
        suggestions.append(
            "Reescrever slide 1 com verbo de acao ou conclusao "
            "quantificada."
        )
        score -= 3
    elif not _ACTION_VERB_RE.search(first) and not _NUMBER_RE.search(first):
        gaps.append(
            f"Slide 1 sem verbo de acao nem numero ('{first[:50]}')."
        )
        suggestions.append(
            "Garantir que slide 1 declare a mensagem central com verbo "
            "ou numero."
        )
        score -= 2

    # Critério 2: ultimo slide tem decisao/recomendacao
    last = (titles[-1] or "").strip()
    if not _DECISION_RE.search(last):
        gaps.append(
            f"Ultimo slide ('{last[:50]}') sem decisao explicita ou "
            "call-to-action."
        )
        suggestions.append(
            "Reescrever ultimo slide como decisao ou proximos passos."
        )
        score -= 2

    # Critério 3: >=70% dos intermediarios com numero quantificado
    if n >= 4:
        intermediates = titles[1:-1]
        with_num = sum(1 for t in intermediates if _NUMBER_RE.search(t or ""))
        ratio = with_num / max(len(intermediates), 1)
        if ratio < 0.70:
            gaps.append(
                f"Apenas {ratio:.0%} dos slides intermediarios tem numero "
                f"quantificado (min 70%)."
            )
            suggestions.append(
                "Quantificar action titles intermediarios com %, R$, "
                "multiplicadores ou comparacoes."
            )
            score -= 2

    # Critério 4: alinhamento com mensagem central (heuristica leve)
    if central_message:
        msg_words = {
            w.lower() for w in re.findall(r"\b[a-zA-ZáéíóúÁÉÍÓÚ]{4,}\b",
                                          central_message)
        }
        # Esperamos overlap >0 nos primeiros 3 slides
        first_titles_text = " ".join(titles[:3]).lower()
        first_words = set(re.findall(r"\b[a-zA-ZáéíóúÁÉÍÓÚ]{4,}\b",
                                     first_titles_text))
        if msg_words and not (msg_words & first_words):
            gaps.append(
                "Mensagem central nao aparece nos 3 primeiros slides "
                "(top-down quebrado)."
            )
            suggestions.append(
                "Adiantar a mensagem central no slide 1 ou 2."
            )
            score -= 1

    score = max(0, min(10, score))
    return {
        "coherence_score": score,
        "gaps": gaps,
        "suggestions": suggestions,
        "passes_pyramid_test": score >= 7,
    }


# ---------------------------------------------------------------------------
# API publica
# ---------------------------------------------------------------------------
def validate_pyramid_coherence(
    titles: List[str],
    briefing: Optional[Any] = None,
) -> List[AuditWarning]:
    """Valida coerencia narrativa do deck via Pyramid Principle.

    Args:
        titles: lista de action titles em ordem (1 por slide).
        briefing: instancia de `briefing_schema.Briefing` (opcional).
                  Se fornecida, usa `briefing.mensagem_central` para
                  alinhamento top-down.

    Returns:
        Lista de AuditWarning. Sempre severity 'medium' (nao bloqueia
        entrega). Categoria 'pyramid_coherence'. slide_num=0 (deck-level).

    Estrategia:
        Tenta Anthropic LLM primeiro; se indisponivel (sem API key, sem
        SDK, falha de rede), faz fallback regex MVP.
    """
    if not titles:
        return []

    central_message: Optional[str] = None
    if briefing is not None:
        central_message = getattr(briefing, "mensagem_central", None)

    result = _validate_via_llm(titles, central_message)
    used_llm = result is not None
    if not used_llm:
        result = _validate_via_regex(titles, central_message)

    return _result_to_warnings(result, used_llm=used_llm)


def _result_to_warnings(result: Dict[str, Any],
                        used_llm: bool) -> List[AuditWarning]:
    warnings: List[AuditWarning] = []
    score = result.get("coherence_score", 0)
    passes = result.get("passes_pyramid_test", False)
    gaps = result.get("gaps", []) or []
    suggestions = result.get("suggestions", []) or []

    method_tag = "LLM" if used_llm else "regex-fallback"

    if not passes:
        # Mensagem agregada como warning principal
        gaps_summary = "; ".join(gaps[:3]) if gaps else "(sem detalhes)"
        warnings.append(AuditWarning(
            slide_num=0,
            category=_CATEGORY,
            severity=_DEFAULT_SEVERITY,
            message=(
                f"[Pyramid {method_tag}] score {score}/10 — "
                f"historia nao funciona lendo so titles. Gaps: {gaps_summary}"
            ),
        ))
        # Adicionar sugestoes top-1 como warning informativo
        for sugg in suggestions[:1]:
            warnings.append(AuditWarning(
                slide_num=0,
                category=_CATEGORY,
                severity="low",
                message=f"[Pyramid sugestao] {sugg}",
            ))
    else:
        # Passou — log informativo low severity (nao polui, mas registra)
        if score < 10:
            warnings.append(AuditWarning(
                slide_num=0,
                category=_CATEGORY,
                severity="low",
                message=f"[Pyramid {method_tag}] OK score {score}/10",
            ))

    return warnings


__all__ = [
    "validate_pyramid_coherence",
]
