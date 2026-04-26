"""MECE validator (PR 2.1) — detecta sobreposicao semantica e lacunas.

MECE = Mutuamente Exclusivos + Coletivamente Exaustivos. Conceito canonical
de McKinsey aplicado a exhibits estruturais: stack hierarchy, matrix 2x2,
process flow, listas paralelas. Itens sobrepostos quebram a leitura
hierarquica e sugerem framework mal pensado.

Estrategia:
  - Path A (preferido): Anthropic SDK com tool_use estruturado, modelo
    claude-sonnet-4-6, prompt cache obrigatorio no system prompt
    (validador estavel; varia apenas a lista de items + contexto).
  - Path B (fallback): heuristica regex baseada em SYNONYM_GROUPS de
    lang_validator.py. Detecta itens cujas keywords pertencem ao
    mesmo grupo de sinonimos (ex: "leads" + "captacao") como
    sobreposicao provavel.

Custo Anthropic estimado: ~$0.02-0.05 por exhibit (com prompt cache).
Custo regex: zero. Severity sempre 'medium' (warning, nao bloqueante).

API publica:
  - validate_mece(items, context=None) -> Dict[str, Any]
  - validate_mece_warnings(items, context=None, slide_num=0) -> List[AuditWarning]
"""
from __future__ import annotations

import os
import re
from typing import Any, Dict, List, Optional

from .audit import AuditWarning
from .lang_validator import SYNONYM_GROUPS, _build_phrase_pattern


# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------
_ANTHROPIC_MODEL = "claude-sonnet-4-6"
_MAX_TOKENS = 1024
_DEFAULT_SEVERITY = "medium"
_CATEGORY = "mece"


# ---------------------------------------------------------------------------
# System prompt (cacheable)
# ---------------------------------------------------------------------------
_SYSTEM_PROMPT = """\
Voce e um validador MECE (Mutuamente Exclusivo + Coletivamente Exaustivo),
conceito canonical da McKinsey aplicado a frameworks executivos.

Sua tarefa: avaliar se uma lista de itens e MECE. Detectar:

1. SOBREPOSICOES (violacao de Mutuamente Exclusivo)
   - Dois ou mais itens que se sobrepoem semanticamente.
   - Ex: "Leads" + "Captacao" — leads e o input do funil de captacao,
     ha overlap semantico.
   - Ex: "Custo" + "Despesa" — termos sinonimos no contexto contabil.

2. LACUNAS (violacao de Coletivamente Exaustivo)
   - Categorias importantes que faltam dado o contexto declarado.
   - Ex: contexto "funil comercial" com itens [leads, propostas, fechamento]
     mas sem "qualificacao" — lacuna entre leads e propostas.

3. NIVEL DE ABSTRACAO MISTURADO
   - Itens em niveis hierarquicos diferentes (categoria + sub-categoria
     no mesmo nivel).
   - Ex: ["receita", "custo", "EBITDA", "depreciacao"] — depreciacao e
     componente de custo, nao deveria estar no mesmo nivel.

Score (0-10):
  10 = MECE perfeito, sem overlap nem gap
  7-9 = MECE funcional, ajustes pontuais
  4-6 = problemas estruturais (overlap claro OU gap critico)
  0-3 = framework quebrado, refazer categorizacao

Importante: is_mece = true APENAS se score >= 7.
Seja rigoroso mas justo — overlap parcial em contexto educacional e OK,
overlap em apresentacao executiva NAO e OK.
"""


# ---------------------------------------------------------------------------
# Tool schema (tool_use)
# ---------------------------------------------------------------------------
_TOOL_SCHEMA = {
    "name": "report_mece_evaluation",
    "description": (
        "Reporta avaliacao MECE de uma lista de itens estruturais. "
        "Retorna score, sobreposicoes, lacunas, sugestoes."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "mece_score": {
                "type": "integer",
                "minimum": 0,
                "maximum": 10,
                "description": "Score 0-10 da qualidade MECE.",
            },
            "overlaps": {
                "type": "array",
                "items": {"type": "string"},
                "description": (
                    "Lista de sobreposicoes detectadas. Cada item descreve "
                    "o par sobreposto e a razao (ex: \"'leads' e 'captacao' "
                    "sao parte do mesmo funil\")."
                ),
            },
            "gaps": {
                "type": "array",
                "items": {"type": "string"},
                "description": (
                    "Lista de lacunas — categorias importantes que faltam "
                    "dado o contexto."
                ),
            },
            "suggestions": {
                "type": "array",
                "items": {"type": "string"},
                "description": (
                    "Sugestoes acionaveis para tornar a lista MECE."
                ),
            },
            "is_mece": {
                "type": "boolean",
                "description": (
                    "True se score >= 7 e nao ha overlap critico; False "
                    "caso contrario."
                ),
            },
        },
        "required": ["mece_score", "overlaps", "gaps", "suggestions", "is_mece"],
    },
}


# ---------------------------------------------------------------------------
# Path A — Anthropic LLM
# ---------------------------------------------------------------------------
def _validate_via_llm(
    items: List[str],
    context: Optional[str],
) -> Optional[Dict[str, Any]]:
    """Usa Anthropic API com tool_use para validar MECE.

    Retorna dict do tool_input ou None se SDK nao instalado / sem API key.
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    try:
        import anthropic  # type: ignore
    except ImportError:
        return None

    client = anthropic.Anthropic(api_key=api_key)
    user_content = _build_user_content(items, context)

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
            tool_choice={"type": "tool", "name": "report_mece_evaluation"},
            messages=[{"role": "user", "content": user_content}],
        )
    except Exception:
        # Falha de rede/API: nao bloqueia, fallback regex.
        return None

    for block in response.content:
        if getattr(block, "type", None) == "tool_use":
            return dict(block.input)
    return None


def _build_user_content(items: List[str], context: Optional[str]) -> str:
    lines: List[str] = []
    if context:
        lines.append(f"Contexto da estrutura: {context}")
        lines.append("")
    lines.append("Itens a validar (lista paralela / categorias):")
    for i, it in enumerate(items, 1):
        lines.append(f"  {i}. {it}")
    lines.append("")
    lines.append(
        "Avalie se a lista e MECE. Use a ferramenta "
        "report_mece_evaluation para reportar score, overlaps, gaps "
        "e sugestoes."
    )
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Path B — Fallback regex (SYNONYM_GROUPS de lang_validator)
# ---------------------------------------------------------------------------
def _normalize_for_match(text: str) -> str:
    """Normaliza para matching: lowercase, sem acentos basicos."""
    t = (text or "").lower()
    accents = {
        "á": "a", "à": "a", "â": "a", "ã": "a", "ä": "a",
        "é": "e", "è": "e", "ê": "e", "ë": "e",
        "í": "i", "ì": "i", "î": "i", "ï": "i",
        "ó": "o", "ò": "o", "ô": "o", "õ": "o", "ö": "o",
        "ú": "u", "ù": "u", "û": "u", "ü": "u",
        "ç": "c",
    }
    for k, v in accents.items():
        t = t.replace(k, v)
    return t


def _item_keywords(item: str) -> set:
    """Extrai keywords (substantivos significativos) do item."""
    norm = _normalize_for_match(item)
    # Tokenizar, filtrar stopwords e palavras < 3 chars
    stopwords = {
        "de", "da", "do", "das", "dos", "e", "ou", "em", "no", "na",
        "nos", "nas", "para", "por", "com", "sem", "a", "o", "as", "os",
        "um", "uma", "uns", "umas", "que", "se", "the", "of", "and",
    }
    tokens = re.findall(r"\b[a-z]{3,}\b", norm)
    return {t for t in tokens if t not in stopwords}


def _validate_via_regex(
    items: List[str],
    context: Optional[str],
) -> Dict[str, Any]:
    """MVP estrutural sem LLM. Usa SYNONYM_GROUPS de lang_validator."""
    n = len(items)
    overlaps: List[str] = []
    gaps: List[str] = []
    suggestions: List[str] = []
    score = 10  # comeca otimo, desconta defeitos

    if n < 2:
        return {
            "mece_score": 10,
            "overlaps": [],
            "gaps": [],
            "suggestions": [],
            "is_mece": True,
        }

    # Critério 1: detectar sobreposicao via SYNONYM_GROUPS
    item_kws = [(i, items[i], _item_keywords(items[i])) for i in range(n)]

    for group in SYNONYM_GROUPS:
        # Para cada grupo, encontrar quais itens contem keywords do grupo
        group_norm = {_normalize_for_match(g) for g in group}
        matches: List[int] = []
        for idx, original, kws in item_kws:
            # Se qualquer keyword do item ESTA no grupo de sinonimos
            if kws & group_norm:
                matches.append(idx)
            else:
                # Tambem casa por substring (ex: "captacao" em "captacoes")
                norm_orig = _normalize_for_match(original)
                if any(g in norm_orig for g in group_norm if len(g) >= 4):
                    matches.append(idx)
        # Remover duplicatas mantendo ordem
        matches = list(dict.fromkeys(matches))
        if len(matches) >= 2:
            pair_descriptions = [
                f"'{items[matches[i]]}' e '{items[matches[j]]}'"
                for i in range(len(matches))
                for j in range(i + 1, len(matches))
            ]
            for desc in pair_descriptions[:3]:  # max 3 pares por grupo
                overlaps.append(
                    f"{desc} pertencem ao mesmo grupo semantico "
                    f"(sinonimos provaveis)"
                )
            score -= 2 * min(len(pair_descriptions), 3)

    # Critério 2: detectar repeticao direta de keywords entre itens
    # (caso nao caia em SYNONYM_GROUPS mas tem palavras em comum)
    for i in range(n):
        for j in range(i + 1, n):
            kws_i = item_kws[i][2]
            kws_j = item_kws[j][2]
            shared = kws_i & kws_j
            # Filtrar palavras muito genericas
            generic = {"gestao", "processo", "sistema", "novo", "nova",
                       "modelo", "tipo", "area"}
            shared = shared - generic
            if shared:
                # So conta como overlap se a palavra compartilhada for
                # substantiva e nao ja capturada acima
                desc = (
                    f"'{items[i]}' e '{items[j]}' compartilham keyword(s): "
                    f"{', '.join(sorted(shared))}"
                )
                already = any(
                    items[i] in o and items[j] in o for o in overlaps
                )
                if not already:
                    overlaps.append(desc)
                    score -= 1

    # Sugestoes baseadas em overlaps detectados
    if overlaps:
        suggestions.append(
            "Renomear ou consolidar itens sobrepostos para garantir "
            "exclusividade mutua."
        )

    # Critério 3: contexto simples — se context tem < 3 itens, pode haver gap
    if context and n < 3:
        suggestions.append(
            f"Lista com apenas {n} itens — verificar se cobre exaustivamente "
            f"o contexto '{context[:40]}'."
        )

    score = max(0, min(10, score))
    return {
        "mece_score": score,
        "overlaps": overlaps,
        "gaps": gaps,
        "suggestions": suggestions,
        "is_mece": score >= 7 and len(overlaps) == 0,
    }


# ---------------------------------------------------------------------------
# API publica
# ---------------------------------------------------------------------------
def validate_mece(
    items: List[str],
    context: Optional[str] = None,
) -> Dict[str, Any]:
    """Valida se lista de itens e MECE.

    Args:
        items: lista de itens (ex: categorias de matrix 2x2, etapas de
               process flow, niveis de stack hierarchy).
        context: descricao do contexto/dominio (ex: "funil comercial",
                 "estrutura financeira"). Ajuda LLM a avaliar exhaustao.

    Returns:
        Dict com schema:
          {
            "is_mece": bool,
            "mece_score": int (0-10),
            "overlaps": List[str],
            "gaps": List[str],
            "suggestions": List[str],
          }

    Estrategia:
        Tenta Anthropic LLM primeiro (mais preciso semanticamente);
        se indisponivel (sem API key, sem SDK, falha de rede), faz
        fallback regex baseado em SYNONYM_GROUPS.
    """
    if not items:
        return {
            "is_mece": True,
            "mece_score": 10,
            "overlaps": [],
            "gaps": [],
            "suggestions": [],
        }

    # Filtrar itens vazios
    items_clean = [it for it in items if it and it.strip()]
    if len(items_clean) < 2:
        return {
            "is_mece": True,
            "mece_score": 10,
            "overlaps": [],
            "gaps": [],
            "suggestions": [],
        }

    result = _validate_via_llm(items_clean, context)
    if result is None:
        result = _validate_via_regex(items_clean, context)

    # Garantir todas as chaves
    result.setdefault("is_mece", False)
    result.setdefault("mece_score", 0)
    result.setdefault("overlaps", [])
    result.setdefault("gaps", [])
    result.setdefault("suggestions", [])
    return result


def validate_mece_warnings(
    items: List[str],
    context: Optional[str] = None,
    slide_num: int = 0,
) -> List[AuditWarning]:
    """Wrapper que retorna AuditWarnings (para integracao com audit_deck).

    Args:
        items: lista de itens estruturais.
        context: contexto do exhibit.
        slide_num: numero do slide (1-indexed) ou 0 para deck-level.

    Returns:
        Lista de AuditWarning categoria 'mece', severity 'medium'.
    """
    if not items or len(items) < 2:
        return []

    result = validate_mece(items, context)
    warnings: List[AuditWarning] = []

    if result.get("is_mece", True):
        return warnings

    score = result.get("mece_score", 0)
    overlaps = result.get("overlaps", []) or []
    gaps = result.get("gaps", []) or []

    if overlaps:
        overlap_summary = "; ".join(overlaps[:3])
        warnings.append(AuditWarning(
            slide_num=slide_num,
            category=_CATEGORY,
            severity=_DEFAULT_SEVERITY,
            message=(
                f"[MECE] score {score}/10 — sobreposicoes detectadas: "
                f"{overlap_summary}"
            ),
        ))

    if gaps:
        gaps_summary = "; ".join(gaps[:2])
        warnings.append(AuditWarning(
            slide_num=slide_num,
            category=_CATEGORY,
            severity=_DEFAULT_SEVERITY,
            message=f"[MECE] lacunas: {gaps_summary}",
        ))

    return warnings


__all__ = [
    "validate_mece",
    "validate_mece_warnings",
]
