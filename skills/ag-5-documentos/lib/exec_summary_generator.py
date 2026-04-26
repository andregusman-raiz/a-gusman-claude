"""Executive Summary auto-gerador (PR 3.3 — itens #18, #28 do guia mestre).

Extrai, a partir de um deck outline (List[Dict]):
  1. Top 3 takeaways canonicos (heuristica: rank por densidade de KPIs / numbers / verbos de acao)
  2. 1 recomendacao principal (do storyline metadata, ou inferida do slide com kind 'decision')
  3. Metricas-chave (ate 3 KPIs com label + valor)

Tambem oferece `auto_insert_summary(deck_outline)` que insere o summary slide
em posicao 2 (apos cover) sem modificar o outline original.

Outline shape (vide pipeline.py):
    [
        {"title": "...", "message": "...", "bullets": ["..."], "source_section": "...",
         "kind": "<exhibit_kind>", "kpi": {"label": "...", "value": "...", "delta": "..."}, ...},
        ...
    ]
"""
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional


MAX_TAKEAWAYS = 3
MAX_KPIS = 3

# Verbos de acao que sinalizam takeaway forte (heuristica de rank)
ACTION_VERBS = (
    "reduzir", "aumentar", "crescer", "ganhar", "perder", "lancar", "decidir",
    "executar", "entregar", "investir", "cortar", "expandir", "consolidar",
    "transformar", "acelerar", "priorizar", "implementar", "migrar",
)

# Slide kinds que tipicamente carregam decisao/recomendacao
DECISION_KINDS = ("decision_slide", "callout_box", "scqa", "hero_number")

# Regex para detectar numero/KPI no texto (R$, %, 'Mn', 'M', 'mil', etc.)
_NUMBER_RE = re.compile(
    r"(?:R\$\s?)?\d+(?:[.,]\d+)?\s?(?:%|mil|milhoes?|m|mn|bn|bi|pp|x)?",
    re.IGNORECASE,
)


def _count_numbers(text: str) -> int:
    """Conta tokens numericos / KPIs em um texto."""
    if not text:
        return 0
    return len(_NUMBER_RE.findall(text))


def _count_action_verbs(text: str) -> int:
    if not text:
        return 0
    lower = text.lower()
    return sum(1 for v in ACTION_VERBS if v in lower)


def _slide_text(slide: Dict[str, Any]) -> str:
    """Concatena texto principal do slide para scoring."""
    parts = [
        str(slide.get("title", "")),
        str(slide.get("message", "")),
    ]
    bullets = slide.get("bullets") or []
    if isinstance(bullets, list):
        parts.extend(str(b) for b in bullets)
    return " ".join(p for p in parts if p)


def _score_takeaway(slide: Dict[str, Any]) -> float:
    """Score = densidade KPIs + verbos de acao + bonus se tem 'kpi'."""
    text = _slide_text(slide)
    if not text:
        return 0.0
    n_numbers = _count_numbers(text)
    n_verbs = _count_action_verbs(text)
    has_kpi = 1.5 if slide.get("kpi") else 0.0
    is_decision = 0.8 if slide.get("kind") in DECISION_KINDS else 0.0
    return n_numbers * 1.2 + n_verbs * 1.0 + has_kpi + is_decision


def _take_first_sentence(text: str, max_chars: int = 140) -> str:
    """Pega primeira frase ate '.', '!', '?' ou max_chars."""
    if not text:
        return ""
    text = text.strip()
    for sep in (". ", "! ", "? "):
        idx = text.find(sep)
        if 0 < idx <= max_chars:
            return text[: idx + 1].strip()
    if len(text) <= max_chars:
        return text
    return text[: max_chars - 1].rstrip() + "..."


def extract_takeaways(outline: List[Dict[str, Any]]) -> List[str]:
    """Top N takeaways ordenados por score. Cada takeaway = primeira frase do message/title."""
    scored = [
        (_score_takeaway(s), idx, s)
        for idx, s in enumerate(outline)
        if _slide_text(s)
    ]
    # Sort: maior score primeiro; idx como tiebreaker para estabilidade
    scored.sort(key=lambda t: (-t[0], t[1]))

    takeaways: List[str] = []
    seen: set[str] = set()
    for _score, _idx, slide in scored:
        text = str(slide.get("message") or slide.get("title") or "")
        sentence = _take_first_sentence(text)
        if not sentence:
            continue
        norm = sentence.lower().strip()
        if norm in seen:
            continue
        seen.add(norm)
        takeaways.append(sentence)
        if len(takeaways) >= MAX_TAKEAWAYS:
            break
    return takeaways


def extract_recommendation(outline: List[Dict[str, Any]]) -> str:
    """Tenta extrair recomendacao principal.

    Estrategia (em ordem de prioridade):
      1. Slide com campo 'recommendation' explicito (vem de decision_slide etc.)
      2. Slide com kind in DECISION_KINDS — usa 'message'
      3. Ultimo slide do outline com message
    """
    # 1. Prioridade maxima: campo 'recommendation' explicito
    for slide in outline:
        rec = slide.get("recommendation")
        if rec:
            return _take_first_sentence(str(rec), max_chars=180)

    # 2. Slide com kind decisao -> usa message
    for slide in outline:
        if slide.get("kind") in DECISION_KINDS:
            msg = slide.get("message")
            if msg:
                return _take_first_sentence(str(msg), max_chars=180)

    # 3. Fallback: ultimo slide com message
    for slide in reversed(outline):
        msg = slide.get("message")
        if msg:
            return _take_first_sentence(str(msg), max_chars=180)
    return ""


def extract_kpis(outline: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    """Extrai ate 3 KPIs do outline.

    Procura por:
      1. slides com campo 'kpi' (dict {label, value, delta?})
      2. slides com kind == 'hero_number' (campo 'value', 'label', 'delta')
    """
    kpis: List[Dict[str, str]] = []
    seen: set[str] = set()

    for slide in outline:
        kpi = slide.get("kpi")
        if isinstance(kpi, dict) and kpi.get("label") and kpi.get("value"):
            label = str(kpi["label"]).strip()
            if label.lower() in seen:
                continue
            seen.add(label.lower())
            entry: Dict[str, str] = {
                "label": label,
                "value": str(kpi["value"]),
            }
            if kpi.get("delta"):
                entry["delta"] = str(kpi["delta"])
            kpis.append(entry)
            if len(kpis) >= MAX_KPIS:
                return kpis

        if slide.get("kind") == "hero_number":
            label = str(slide.get("label") or slide.get("title") or "").strip()
            value = str(slide.get("value") or "").strip()
            if not label or not value:
                continue
            if label.lower() in seen:
                continue
            seen.add(label.lower())
            entry = {"label": label, "value": value}
            if slide.get("delta"):
                entry["delta"] = str(slide["delta"])
            kpis.append(entry)
            if len(kpis) >= MAX_KPIS:
                return kpis

    return kpis


def generate_summary(outline: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Gera dict de summary executivo a partir de outline.

    Returns:
        {
            "action_title": "Sumario Executivo",
            "recommendation": "...",
            "kpis": [{"label": ..., "value": ..., "delta"?: ...}, ...],
            "takeaways": ["...", "...", "..."],
            "source": "...",
        }

    Args:
        outline: lista de slide dicts (vide pipeline.py shape)
    """
    if not isinstance(outline, list):
        raise TypeError("generate_summary: outline deve ser list[dict]")

    takeaways = extract_takeaways(outline)
    recommendation = extract_recommendation(outline)
    kpis = extract_kpis(outline)

    # Source: primeira occurrence de 'source' no outline (ou string vazia)
    source = ""
    for slide in outline:
        s = slide.get("source")
        if s:
            source = str(s)
            break

    return {
        "action_title": "Sumario Executivo",
        "recommendation": recommendation,
        "kpis": kpis,
        "takeaways": takeaways,
        "source": source,
    }


def auto_insert_summary(
    deck_outline: List[Dict[str, Any]],
    *,
    position: int = 1,
) -> List[Dict[str, Any]]:
    """Insere summary slide no outline, NAO-DESTRUTIVO (retorna nova lista).

    Args:
        deck_outline: outline original
        position: indice de insercao (default 1, apos cover)

    Returns:
        Nova lista com summary slide inserido em `position`. Outline original intacto.
    """
    if not isinstance(deck_outline, list):
        raise TypeError("auto_insert_summary: deck_outline deve ser list[dict]")

    summary_content = generate_summary(deck_outline)
    summary_slide = {
        "title": "Sumario Executivo",
        "kind": "one_pager_summary",
        "content": summary_content,
        "_auto_generated": True,
    }

    # Copia rasa (preserve identidade dos itens originais)
    new_outline = list(deck_outline)
    pos = max(0, min(position, len(new_outline)))
    new_outline.insert(pos, summary_slide)
    return new_outline
