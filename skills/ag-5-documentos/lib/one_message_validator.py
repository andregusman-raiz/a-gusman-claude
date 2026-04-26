"""One-message-per-slide validator (PR 1.4 / regra SEMPRE-04 da secao 35).

Heuristica (sem chamada de LLM): detecta slides que carregam 2+ ideias
distintas ao mesmo tempo. Sinais analisados:

  1. Multiple action verbs em conflito — title contem 2+ verbos de acao
     ligados por conector aditivo ("e", "+", ";", ",") sem subordinacao.
     Ex: "Aumentar receita e reduzir custo em 2026" -> 2 acoes distintas.

  2. 2+ stats sem unificacao — body/title traz 2+ numeros quantificados
     em sentencas diferentes sem que um suporte o outro.
     Ex: "Receita +12%. Margem +3pp. NPS sobe 8 pts." -> 3 metricas
     em 3 sentencas paralelas.

  3. Body com "AND" logico nao-paralelo — paragrafo contem conector
     coordenativo entre clausulas independentes (e/alem disso/tambem)
     ligando 2 verbos finitos com sujeitos distintos.
     Ex: "O time entrega X. Alem disso, a operacao captura Y."

Severity: medium (sugestao de divisao em 2 slides).

API publica:
  - detect_multi_message(title, body=None, slide_num=0) -> List[AuditWarning]
  - check_titles(titles) -> Dict[str, Any]   # plug em final_acceptance
"""
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Sequence

from .audit import AuditWarning


# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------
_CATEGORY = "one_message"
_DEFAULT_SEVERITY = "medium"

# Verbos de acao reconhecidos como sinal de "conclusao/acao". Reusa um
# subconjunto coerente com pyramid_validator/final_acceptance.
_ACTION_VERBS: List[str] = [
    "reduz", "reduzir", "aumenta", "aumentar", "cresce", "crescer",
    "cai", "cair", "melhora", "melhorar", "piora", "piorar",
    "gera", "gerar", "elimina", "eliminar", "captura", "capturar",
    "recomenda", "recomendar", "propoe", "propor",
    "investe", "investir", "aloca", "alocar", "prioriza", "priorizar",
    "deve", "precisa", "requer", "exige",
    "garante", "garantir", "assegura", "assegurar",
    "alcanca", "alcancar", "atinge", "atingir",
    "supera", "superar", "lanca", "lancar",
    "expande", "expandir", "consolida", "consolidar",
    "automatiza", "automatizar", "padroniza", "padronizar",
]

# Conectores aditivos (paralelo logico, nao subordinacao)
_ADDITIVE_CONNECTORS = [
    " e ", "; ", ", e ", " + ", " alem de ", " alem disso", " tambem ",
]

# Numero quantificado (reaproveita pattern de audit/pyramid)
_NUMBER_RE = re.compile(
    r"(?:R\$\s*[\d.,]+|US?\$\s*[\d.,]+|\$\s*[\d.,]+|"
    r"\d+\s*x\b|\d{1,3}\s*%|\d{2,}\s*[a-zA-Z]+|"
    r"\b\d+[.,]?\d*\s*(?:MM?|K|mil|milhao|milhoes|bilhao|bilhoes|B|pp))",
    re.IGNORECASE,
)

# Pattern de multipla acao em conflito (title)
_VERB_PATTERN = re.compile(
    r"\b(" + "|".join(_ACTION_VERBS) + r")\b",
    re.IGNORECASE,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _count_action_verbs(text: str) -> int:
    """Conta ocorrencias unicas (lema simplificado) de verbos de acao."""
    if not text:
        return 0
    found = _VERB_PATTERN.findall(text)
    # Normaliza para lema reduzido (3 primeiras letras) para tratar
    # 'reduz/reduzir/reduzem' como mesmo verbo.
    lemmas = {v.lower()[:4] for v in found}
    return len(lemmas)


def _has_additive_connector(text: str) -> bool:
    if not text:
        return False
    low = text.lower()
    return any(conn in low for conn in _ADDITIVE_CONNECTORS)


def _count_quantified_stats(text: str) -> int:
    """Numero de matches distintos de stats no texto."""
    if not text:
        return 0
    matches = _NUMBER_RE.findall(text)
    return len(matches)


def _split_sentences(text: str) -> List[str]:
    """Divide em sentencas por ponto/quebra. Heuristica simples."""
    if not text:
        return []
    chunks = re.split(r"[.!?\n]+", text)
    return [c.strip() for c in chunks if c.strip()]


# ---------------------------------------------------------------------------
# Sinal 1 — multiplos verbos de acao em paralelo (title)
# ---------------------------------------------------------------------------
def _detect_multiple_actions_in_title(title: str) -> Optional[str]:
    """Retorna mensagem de violacao ou None."""
    if not title:
        return None
    # Conta verbos distintos
    n_verbs = _count_action_verbs(title)
    if n_verbs >= 2 and _has_additive_connector(title):
        return (
            f"Title carrega {n_verbs} acoes distintas conectadas por aditivo "
            f"({title.strip()[:80]!r}) — dividir em 2 slides."
        )
    return None


# ---------------------------------------------------------------------------
# Sinal 2 — 2+ stats em sentencas paralelas (title+body)
# ---------------------------------------------------------------------------
def _detect_parallel_stats(title: str, body: Optional[str]) -> Optional[str]:
    """Detecta 2+ numeros em sentencas distintas sem unificacao."""
    pieces: List[str] = []
    if title:
        pieces.append(title)
    if body:
        pieces.append(body)
    full = " ".join(pieces)
    if not full:
        return None

    sentences = _split_sentences(full)
    sentences_with_stat = [s for s in sentences if _NUMBER_RE.search(s)]
    if len(sentences_with_stat) < 3:
        # 2 stats isolados podem ser uma unica conclusao + dado;
        # so 3+ sentencas paralelas com numero sinalizam fragmentacao.
        return None

    # Falta unificacao: nenhum conector causal/comparativo (porque, logo,
    # entao, resultando, devido, ja que). Se houver pelo menos 1, considera
    # que a relacao esta declarada.
    causal_re = re.compile(
        r"\b(?:porque|logo|entao|portanto|resultando|devido|"
        r"ja\s+que|consequentemente|por\s+isso)\b",
        re.IGNORECASE,
    )
    if causal_re.search(full):
        return None

    n = len(sentences_with_stat)
    return (
        f"Slide carrega {n} stats em sentencas paralelas sem conector "
        f"causal/comparativo — unificar em 1 conclusao ou separar em slides."
    )


# ---------------------------------------------------------------------------
# Sinal 3 — body com "AND" logico nao-paralelo
# ---------------------------------------------------------------------------
_NON_PARALLEL_PATTERNS = [
    re.compile(
        r"\b\w+\s+(?:" + "|".join(_ACTION_VERBS) + r")\s+.+?[.,;]\s*"
        r"(?:alem\s+disso|tambem|adicionalmente|paralelamente)\s*[,]?\s+"
        r"\w+\s+(?:" + "|".join(_ACTION_VERBS) + r")",
        re.IGNORECASE,
    ),
]


def _detect_non_parallel_and(body: Optional[str]) -> Optional[str]:
    """Body com clausulas independentes ligadas por aditivo nao-paralelo."""
    if not body:
        return None
    for pat in _NON_PARALLEL_PATTERNS:
        match = pat.search(body)
        if match:
            snippet = match.group(0)[:80]
            return (
                f"Body com 2 clausulas independentes ligadas por aditivo "
                f"({snippet!r}) — separar em slides distintos."
            )
    return None


# ---------------------------------------------------------------------------
# API publica — slide-level
# ---------------------------------------------------------------------------
def detect_multi_message(
    title: str,
    body: Optional[str] = None,
    slide_num: int = 0,
) -> List[AuditWarning]:
    """Retorna warnings se o slide carrega 2+ ideias distintas.

    Args:
        title: action title do slide.
        body: corpo opcional (concatenacao de bullets/paragrafos).
        slide_num: numero do slide (1-indexed) para o warning.

    Returns:
        Lista de AuditWarning categoria 'one_message', severity 'medium'.
    """
    warnings: List[AuditWarning] = []
    sig1 = _detect_multiple_actions_in_title(title or "")
    if sig1:
        warnings.append(AuditWarning(
            slide_num, _CATEGORY, _DEFAULT_SEVERITY,
            f"[one_message] {sig1}",
        ))
    sig2 = _detect_parallel_stats(title or "", body)
    if sig2:
        warnings.append(AuditWarning(
            slide_num, _CATEGORY, _DEFAULT_SEVERITY,
            f"[one_message] {sig2}",
        ))
    sig3 = _detect_non_parallel_and(body)
    if sig3:
        warnings.append(AuditWarning(
            slide_num, _CATEGORY, _DEFAULT_SEVERITY,
            f"[one_message] {sig3}",
        ))
    return warnings


# ---------------------------------------------------------------------------
# Plug-in para final_acceptance (teste 2)
# ---------------------------------------------------------------------------
def check_titles(titles: Sequence[str]) -> Dict[str, Any]:
    """Wrapper para plug em final_acceptance.run_final_acceptance.

    Retorna dict no schema esperado:
      { 'passed': bool, 'violations': List[int] (1-indexed slide nums) }
    """
    violations: List[int] = []
    for i, t in enumerate(titles or [], 1):
        if _detect_multiple_actions_in_title(t or ""):
            violations.append(i)
    return {
        "passed": len(violations) == 0,
        "violations": violations,
    }


__all__ = [
    "detect_multi_message",
    "check_titles",
]
