"""Final acceptance — 7 testes da secao 36 do guia mestre.

PR 1.2 do plano `reflective-zooming-sonnet.md`. Implementa o criterio
final de aceitacao do deck antes da entrega.

Os 7 testes (secao 36 do guia):
  1. Lendo apenas os titulos, a historia faz sentido. (pyramid_validator)
  2. Cada slide tem uma unica conclusao. (one_message_validator — stub)
  3. Cada conclusao e sustentada por evidencia ou logica clara. (audit existente)
  4. Publico entende a recomendacao. (manual via multimodal review)
  5. Publico sabe qual decisao tomar. (briefing.decisao_esperada no ultimo slide)
  6. Visual reduz esforco, nao aumenta. (audit existente: WCAG, contrast)
  7. Deck parece peca unica, nao colagem. (P1.5 kind_concentration)

Bloqueio:
  - score < 5/7 → entrega bloqueada (passed=False)
  - score >= 5/7 → entrega autorizada com warnings

Stubs:
  - `one_message_validator` ainda nao existe (Fase 1.4). Heuristica
    minima local: contar slides com mais de 1 acao claramente distinta
    via regex. Quando o validator real chegar, plugar via parametro
    `one_message_fn`.
"""
from __future__ import annotations

import re
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

from .audit import AuditWarning


# ---------------------------------------------------------------------------
# Helpers para os testes
# ---------------------------------------------------------------------------
_DECISION_RE = re.compile(
    r"\b(?:decis(?:ao|oes)|recomend(?:a|acao|amos|ado)|aprov(?:ar|acao)|"
    r"proxim(?:o|os)\s+passo|next\s+step|acao\s+(?:imediata|requerida)|"
    r"call\s+to\s+action|votar|sancion|ratific|"
    r"investir|alocar|priorizar|escolher|optar)",
    re.IGNORECASE,
)

# Multi-conclusao: detecta titulos com 2 acoes/conclusoes via "e"/";"/"+"
_MULTI_ACTION_HINT = re.compile(
    r"\b(?:reduz|aumenta|cresce|cai|melhora|gera|elimina|"
    r"recomend|propoe|prove|demonstra|deve|precisa|requer)\b"
    r".+?[;,+]\s*\b(?:reduz|aumenta|cresce|cai|melhora|gera|elimina|"
    r"recomend|propoe|prove|demonstra|deve|precisa|requer)",
    re.IGNORECASE,
)


def _default_one_message_check(titles: List[str]) -> Dict[str, Any]:
    """Stub heuristico para teste 2.

    Conta slides cujo title sugere 2+ conclusoes distintas (acao+acao).
    """
    violations: List[int] = []
    for i, t in enumerate(titles, 1):
        if t and _MULTI_ACTION_HINT.search(t):
            violations.append(i)
    return {
        "passed": len(violations) == 0,
        "violations": violations,
    }


def _check_evidence_supported(deck_warnings: List[AuditWarning]) -> Dict[str, Any]:
    """Teste 3: cada conclusao sustentada por evidencia ou logica.

    Heuristica via warnings existentes:
      - source_line warnings (P1.3) = afirmacao categorica sem fonte
      - title medium = action title sem numero
    Se ha violacoes, falha.
    """
    bad = [
        w for w in deck_warnings
        if w.category in {"source_line", "title"}
        and w.severity in {"medium", "high"}
    ]
    return {
        "passed": len(bad) == 0,
        "violations_count": len(bad),
    }


def _check_visual_reduces_effort(deck_warnings: List[AuditWarning]) -> Dict[str, Any]:
    """Teste 6: visual reduz esforco (WCAG, sem overlap, sem out_of_bounds)."""
    severe_visual = [
        w for w in deck_warnings
        if w.category in {
            "contrast", "out_of_bounds", "overlap",
            "intra_slide_overlap", "arbitrary_wrap",
        }
        and w.severity == "high"
    ]
    return {
        "passed": len(severe_visual) == 0,
        "violations_count": len(severe_visual),
    }


def _check_unified_deck(deck_warnings: List[AuditWarning],
                       layout_kinds: Optional[List[str]]) -> Dict[str, Any]:
    """Teste 7: deck parece peca unica (P1.5 kind_concentration ok).

    Falha se ha warning de kind_concentration ou se layout_kinds esta
    monotonico (>50% mesmo kind).
    """
    has_concentration_warning = any(
        w.category == "kind_concentration"
        for w in deck_warnings
    )
    monotonic = False
    if layout_kinds:
        from collections import Counter
        counter = Counter(layout_kinds)
        if counter:
            top_kind, top_n = counter.most_common(1)[0]
            ratio = top_n / len(layout_kinds)
            if ratio > 0.50:
                monotonic = True
    return {
        "passed": not has_concentration_warning and not monotonic,
        "concentration_warning": has_concentration_warning,
        "monotonic": monotonic,
    }


def _check_decision_clarity(titles: List[str],
                            briefing: Optional[Any]) -> Dict[str, Any]:
    """Teste 5: publico sabe qual decisao tomar.

    Heuristica:
      - Se briefing tem decisao_esperada, ultimo slide deve referenciar
        sinais de decisao (verbo decisor) OU keyword da decisao_esperada.
      - Se briefing nao tem, basta detectar verbo de decisao no ultimo.
    """
    if not titles:
        return {"passed": False, "reason": "deck vazio"}
    last = (titles[-1] or "").strip()
    has_decision_verb = bool(_DECISION_RE.search(last))

    if briefing is None or not getattr(briefing, "decisao_esperada", None):
        return {
            "passed": has_decision_verb,
            "reason": (
                "ultimo slide com verbo de decisao"
                if has_decision_verb
                else "ultimo slide sem verbo de decisao"
            ),
        }

    decisao = briefing.decisao_esperada.lower()
    decisao_words = set(re.findall(r"\b[a-zA-ZáéíóúÁÉÍÓÚ]{4,}\b", decisao))
    last_words = set(re.findall(r"\b[a-zA-ZáéíóúÁÉÍÓÚ]{4,}\b", last.lower()))
    keyword_overlap = bool(decisao_words & last_words)

    passed = has_decision_verb or keyword_overlap
    return {
        "passed": passed,
        "has_decision_verb": has_decision_verb,
        "keyword_overlap": keyword_overlap,
    }


# ---------------------------------------------------------------------------
# Pipeline principal
# ---------------------------------------------------------------------------
_MIN_PASS = 5  # >= 5/7 para autorizar entrega


def run_final_acceptance(
    deck_path: Path,
    briefing: Optional[Any],
    *,
    titles: List[str],
    layout_kinds: Optional[List[str]] = None,
    deck_warnings: Optional[List[AuditWarning]] = None,
    one_message_fn: Optional[Callable[[List[str]], Dict[str, Any]]] = None,
    pyramid_validator_fn: Optional[
        Callable[[List[str], Optional[Any]], List[AuditWarning]]
    ] = None,
) -> Dict[str, Any]:
    """Executa os 7 testes da secao 36 do guia mestre.

    Args:
        deck_path: caminho do PPTX final (referencial — nao re-renderiza).
        briefing: instancia opcional de Briefing para enriquecer testes 5 e 1.
        titles: action titles de cada slide em ordem.
        layout_kinds: kinds (1 por slide) — usado pelo teste 7.
        deck_warnings: warnings ja coletados pelo audit (audit_deck +
                       detect_anti_patterns). Se None, testes 3, 6, 7 ficam
                       degradados (assumem passed=True por falta de sinal).
        one_message_fn: callable customizada para teste 2 (default = stub
                        regex). Aceitara `lib.one_message_validator` quando
                        a Fase 1.4 desembarcar.
        pyramid_validator_fn: callable customizada para teste 1 (default =
                              `pyramid_validator.validate_pyramid_coherence`).

    Returns:
        Dict com:
          - tests: dict numerado 1..7 -> bool
          - score: int 0..7
          - passed: bool (score >= 5)
          - details: List[str] com diagnostico por teste
          - blocked: bool (oposto de passed)
    """
    deck_warnings = deck_warnings or []
    details: List[str] = []
    tests: Dict[int, bool] = {}

    # Teste 1 — pyramid coherence
    if pyramid_validator_fn is None:
        try:
            from .pyramid_validator import validate_pyramid_coherence
            pyramid_validator_fn = validate_pyramid_coherence
        except ImportError:
            pyramid_validator_fn = None

    if pyramid_validator_fn is not None:
        pyramid_warnings = pyramid_validator_fn(titles, briefing)
        # Se houver warning medium/high de pyramid_coherence => falha
        pyramid_fail = any(
            w.category == "pyramid_coherence"
            and w.severity in {"medium", "high"}
            for w in pyramid_warnings
        )
        tests[1] = not pyramid_fail
        details.append(
            f"Teste 1 (Pyramid): {'OK' if tests[1] else 'FALHA — historia nao funciona so com titles'}"
        )
    else:
        tests[1] = True  # degradado
        details.append("Teste 1 (Pyramid): SKIPPED (validator indisponivel)")

    # Teste 2 — one message per slide
    one_check_fn = one_message_fn or _default_one_message_check
    om_result = one_check_fn(titles)
    tests[2] = bool(om_result.get("passed", True))
    details.append(
        f"Teste 2 (One message): {'OK' if tests[2] else 'FALHA — slides com 2+ conclusoes'}"
    )

    # Teste 3 — evidencia/logica
    ev = _check_evidence_supported(deck_warnings)
    tests[3] = ev["passed"]
    if tests[3]:
        details.append("Teste 3 (Evidencia): OK")
    else:
        ev_count = ev["violations_count"]
        details.append(
            f"Teste 3 (Evidencia): FALHA — {ev_count} afirmacoes sem fonte"
        )

    # Teste 4 — recomendacao compreensivel (manual / heuristica leve)
    # Heuristica: ultimo slide existe e nao e generico
    if titles and titles[-1].strip():
        last = titles[-1].strip()
        too_generic = len(last.split()) < 4
        tests[4] = not too_generic
        if tests[4]:
            details.append("Teste 4 (Recomendacao): OK")
        else:
            details.append(
                f"Teste 4 (Recomendacao): FALHA — ultimo slide muito generico ({last!r})"
            )
    else:
        tests[4] = False
        details.append("Teste 4 (Recomendacao): FALHA — sem slide final")

    # Teste 5 — publico sabe qual decisao tomar
    dc = _check_decision_clarity(titles, briefing)
    tests[5] = dc["passed"]
    if tests[5]:
        details.append("Teste 5 (Decisao): OK")
    else:
        dc_reason = dc.get("reason", "sem decisao clara")
        details.append(f"Teste 5 (Decisao): FALHA — {dc_reason}")

    # Teste 6 — visual reduz esforco
    vis = _check_visual_reduces_effort(deck_warnings)
    tests[6] = vis["passed"]
    if tests[6]:
        details.append("Teste 6 (Visual): OK")
    else:
        vis_count = vis["violations_count"]
        details.append(
            f"Teste 6 (Visual): FALHA — {vis_count} defeitos visuais high severity"
        )

    # Teste 7 — deck unificado
    un = _check_unified_deck(deck_warnings, layout_kinds)
    tests[7] = un["passed"]
    if not tests[7]:
        reason_parts = []
        if un.get("concentration_warning"):
            reason_parts.append("kind_concentration warning")
        if un.get("monotonic"):
            reason_parts.append("layouts monotonicos")
        details.append(
            f"Teste 7 (Unidade): FALHA — {', '.join(reason_parts) or 'monotonia visual'}"
        )
    else:
        details.append("Teste 7 (Unidade): OK")

    score = sum(1 for v in tests.values() if v)
    passed = score >= _MIN_PASS

    return {
        "tests": tests,
        "score": score,
        "passed": passed,
        "blocked": not passed,
        "details": details,
        "deck_path": str(deck_path),
        "min_pass": _MIN_PASS,
    }


__all__ = [
    "run_final_acceptance",
]
