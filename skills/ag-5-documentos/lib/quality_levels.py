"""Hierarquia 4 niveis de qualidade (PR 1.4 / regras canonical secao 35).

Cada slide e avaliado em 4 niveis independentes (decomposto por
responsabilidade — alinhado a McKinsey/Pyramid + design system):

  1. DECISAO   — o slide leva a decisao? (titulo conclusivo, recomendacao,
                  call-to-action, encerramento com implicacao pratica)
  2. STORYLINE — o slide encaixa na sequencia narrativa? (top-down,
                  alinhado a mensagem central, transicao logica)
  3. SLIDE     — uma mensagem so, dados sustentam, body proporcional
                  ao titulo (regras SEMPRE-04, SEMPRE-05, SEMPRE-07)
  4. DESIGN    — visual reduz esforco (contraste, layout, paleta,
                  consistencia, sem overlap, sem out-of-bounds)

Score 0..100 por nivel, com pesos heuristicos. Saida agregada usada para:
  - audit_deck() formato detalhado
  - final_acceptance teste 7 (deck unificado)
  - dashboards de qualidade

Sem chamada de LLM. Reaproveita warnings ja coletados (audit, lang,
pyramid, one_message) para nao duplicar processamento.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Iterable, List, Optional, Sequence

from .audit import AuditWarning


# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------
LEVEL_DECISION = "decision"
LEVEL_STORYLINE = "storyline"
LEVEL_SLIDE = "slide"
LEVEL_DESIGN = "design"

ALL_LEVELS: List[str] = [
    LEVEL_DECISION, LEVEL_STORYLINE, LEVEL_SLIDE, LEVEL_DESIGN,
]

# Mapeamento warning category -> nivel (qual nivel a categoria penaliza).
_CATEGORY_TO_LEVEL: Dict[str, str] = {
    # Decision-level
    "title": LEVEL_DECISION,                    # action title sem numero
    "pyramid_coherence": LEVEL_DECISION,        # historia nao funciona
    # Storyline-level
    "kind_concentration": LEVEL_STORYLINE,      # monotonia visual
    "layout_repetition": LEVEL_STORYLINE,
    "deck_viz_ratio": LEVEL_STORYLINE,
    "lang_consistency": LEVEL_STORYLINE,
    # Slide-level
    "one_message": LEVEL_SLIDE,
    "source_line": LEVEL_SLIDE,
    "anti_pattern": LEVEL_SLIDE,
    "lang_weak": LEVEL_SLIDE,
    "short_text": LEVEL_SLIDE,
    # Design-level
    "contrast": LEVEL_DESIGN,
    "out_of_bounds": LEVEL_DESIGN,
    "overlap": LEVEL_DESIGN,
    "intra_slide_overlap": LEVEL_DESIGN,
    "arbitrary_wrap": LEVEL_DESIGN,
}

# Penalty por severity em pontos (de 100)
_SEVERITY_PENALTY: Dict[str, int] = {
    "high": 25,
    "medium": 10,
    "low": 3,
}


# ---------------------------------------------------------------------------
# Estruturas
# ---------------------------------------------------------------------------
@dataclass
class LevelScore:
    """Score 0..100 e diagnostico por nivel."""
    level: str
    score: int
    violations: int = 0
    severity_breakdown: Dict[str, int] = field(default_factory=dict)
    notes: List[str] = field(default_factory=list)


@dataclass
class QualityAssessment:
    """Assessment agregado de um slide ou deck inteiro."""
    levels: Dict[str, LevelScore] = field(default_factory=dict)

    @property
    def overall(self) -> int:
        """Media simples dos 4 niveis."""
        if not self.levels:
            return 0
        scores = [lvl.score for lvl in self.levels.values()]
        return int(round(sum(scores) / len(scores)))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "levels": {
                k: {
                    "score": v.score,
                    "violations": v.violations,
                    "severity_breakdown": dict(v.severity_breakdown),
                    "notes": list(v.notes),
                }
                for k, v in self.levels.items()
            },
            "overall": self.overall,
        }


# ---------------------------------------------------------------------------
# Core scoring
# ---------------------------------------------------------------------------
def _classify_warning(w: AuditWarning) -> Optional[str]:
    return _CATEGORY_TO_LEVEL.get(w.category)


def _initial_levels() -> Dict[str, LevelScore]:
    return {
        lvl: LevelScore(level=lvl, score=100, violations=0,
                        severity_breakdown={"high": 0, "medium": 0, "low": 0},
                        notes=[])
        for lvl in ALL_LEVELS
    }


def _apply_warnings(levels: Dict[str, LevelScore],
                    warnings: Iterable[AuditWarning]) -> None:
    for w in warnings:
        lvl = _classify_warning(w)
        if lvl is None:
            continue
        target = levels[lvl]
        target.violations += 1
        sev = w.severity or "low"
        target.severity_breakdown[sev] = (
            target.severity_breakdown.get(sev, 0) + 1
        )
        target.score = max(
            0,
            target.score - _SEVERITY_PENALTY.get(sev, _SEVERITY_PENALTY["low"]),
        )
        # Mantem os 3 primeiros notes para diagnostico
        if len(target.notes) < 3:
            target.notes.append(
                f"[{sev}] {w.category}: {w.message[:120]}"
            )


def _bonus_for_decision_clarity(levels: Dict[str, LevelScore],
                                last_title: Optional[str]) -> None:
    """Boost no nivel DECISION se o ultimo title declara decisao."""
    if not last_title:
        return
    import re as _re
    decision_re = _re.compile(
        r"\b(?:decis|recomend|aprov|proxim|next\s+step|"
        r"investir|alocar|priorizar|votar)",
        _re.IGNORECASE,
    )
    if decision_re.search(last_title):
        # Pequeno bonus (+5) por fechamento explicito; nao passa de 100.
        decision = levels[LEVEL_DECISION]
        decision.score = min(100, decision.score + 5)
        decision.notes.append(
            "[bonus] ultimo title contem verbo de decisao"
        )


# ---------------------------------------------------------------------------
# API publica
# ---------------------------------------------------------------------------
def assess_quality_levels(
    warnings: Sequence[AuditWarning],
    *,
    last_title: Optional[str] = None,
) -> Dict[str, LevelScore]:
    """Avalia warnings e retorna scores nos 4 niveis.

    Args:
        warnings: warnings ja coletados (audit + lang + pyramid + one_message).
        last_title: action title do ultimo slide. Se contem decisao, ganha
                    bonus no nivel DECISION.

    Returns:
        Dict[level_name -> LevelScore].
    """
    levels = _initial_levels()
    _apply_warnings(levels, warnings)
    _bonus_for_decision_clarity(levels, last_title)
    return levels


def assess_deck(
    deck_warnings: Sequence[AuditWarning],
    *,
    titles: Optional[Sequence[str]] = None,
) -> QualityAssessment:
    """Aplica `assess_quality_levels` ao deck inteiro e retorna assessment.

    Args:
        deck_warnings: warnings de audit_deck + detect_anti_patterns +
                       lang + pyramid + one_message.
        titles: lista de action titles em ordem (para bonus DECISION).
    """
    last_title = (titles[-1] if titles else None)
    levels = assess_quality_levels(deck_warnings, last_title=last_title)
    return QualityAssessment(levels=levels)


def assess_slide(
    slide_warnings: Sequence[AuditWarning],
) -> QualityAssessment:
    """Avalia um slide isolado a partir de seus warnings."""
    levels = assess_quality_levels(slide_warnings, last_title=None)
    return QualityAssessment(levels=levels)


def format_assessment_report(qa: QualityAssessment) -> str:
    """Formata QualityAssessment como markdown legivel."""
    lines = ["## Quality Levels Assessment\n"]
    lines.append(f"**Overall:** {qa.overall}/100\n")
    for lvl_name in ALL_LEVELS:
        lvl = qa.levels.get(lvl_name)
        if lvl is None:
            continue
        sev = lvl.severity_breakdown
        lines.append(
            f"\n### {lvl_name.upper()} — {lvl.score}/100 "
            f"({lvl.violations} violacoes: "
            f"H{sev.get('high', 0)}/M{sev.get('medium', 0)}/L{sev.get('low', 0)})"
        )
        for note in lvl.notes:
            lines.append(f"  - {note}")
    return "\n".join(lines)


__all__ = [
    "LEVEL_DECISION", "LEVEL_STORYLINE", "LEVEL_SLIDE", "LEVEL_DESIGN",
    "ALL_LEVELS",
    "LevelScore", "QualityAssessment",
    "assess_quality_levels", "assess_deck", "assess_slide",
    "format_assessment_report",
]
