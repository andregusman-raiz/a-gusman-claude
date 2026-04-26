"""Bullet block validator (PR 2.1) — heuristica para qualidade de bullets.

Valida blocos de bullets (listas/cards) com regras canonical de
apresentacoes executivas:

  1. COUNT: 3-5 bullets por bloco. Menos de 3 = bloco fraco / poderia
     ser paragrafo. Mais de 5 = sobrecarga cognitiva, dividir em 2 slides.

  2. PARALELISMO GRAMATICAL: todos os bullets comecam com VERBO ou todos
     comecam com SUBSTANTIVO. Misturar quebra ritmo de leitura.
     Ex (BOM): ["Reduzir custo X", "Ampliar canal Y", "Capturar lead Z"]
     Ex (RUIM): ["Reduzir custo", "Canal Y ampliado", "Z capturados"]

  3. COMPRIMENTO: cada bullet <= 25 palavras (1-2 linhas em slide
     padrao 16:9). Bullets longos viram paragrafos disfarcados.

  4. STRATEGIC BOLD: <= 3 palavras destacadas por bullet (markers ** **
     ou metadata BOLD). Bold demais = sem hierarquia visual.

API publica:
  - validate_bullet_block(bullets, slide_num=0) -> List[AuditWarning]

Severity: 'medium' (sugestao, nao bloqueante).
Sem chamada de LLM — heuristica pura.
"""
from __future__ import annotations

import re
from typing import List, Optional

from .audit import AuditWarning


# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------
_CATEGORY = "bullet_quality"
_DEFAULT_SEVERITY = "medium"

_MIN_BULLETS = 3
_MAX_BULLETS = 5
_MAX_WORDS_PER_BULLET = 25
_MAX_BOLD_WORDS_PER_BULLET = 3

# Verbos no infinitivo PT-BR (terminados em -ar/-er/-ir) e formas comuns
# conjugadas. Heuristica simples — nao usa POS tagger.
_INFINITIVE_RE = re.compile(r"^(?:\w+(?:ar|er|ir))(?:\s|$)", re.IGNORECASE)

# Verbos conjugados frequentes em apresentacoes (presente/preterito)
_COMMON_CONJUGATED_VERBS = {
    # Presente 3a pessoa
    "reduz", "aumenta", "cresce", "cai", "gera", "entrega", "captura",
    "elimina", "investe", "aloca", "prioriza", "lanca", "expande",
    "consolida", "automatiza", "padroniza", "implementa", "executa",
    "operacionaliza", "monitora", "controla", "audita", "valida",
    "garante", "assegura", "alcanca", "atinge", "supera", "atende",
    "transforma", "migra", "integra", "conecta", "sincroniza",
    # Plural
    "reduzem", "aumentam", "geram", "entregam", "capturam", "investem",
    "priorizam", "lancam", "expandem", "consolidam", "automatizam",
    "padronizam", "implementam", "executam", "monitoram", "auditam",
    "atendem", "transformam", "migram", "integram",
    # Preterito
    "reduziu", "aumentou", "cresceu", "caiu", "gerou", "entregou",
    "capturou", "eliminou", "investiu", "alocou", "lancou", "expandiu",
    "transformou", "migrou", "integrou", "conectou",
    # Imperativo (formato exec)
    "reduzir", "aumentar", "crescer", "gerar", "entregar", "capturar",
    "eliminar", "investir", "alocar", "priorizar", "lancar", "expandir",
    "consolidar", "automatizar", "padronizar", "implementar", "executar",
    "operacionalizar", "monitorar", "controlar", "auditar", "validar",
    "garantir", "assegurar", "alcancar", "atingir", "superar", "atender",
    "transformar", "migrar", "integrar", "conectar", "sincronizar",
    "definir", "construir", "estabelecer", "criar", "desenvolver",
    "ampliar", "fortalecer", "manter", "renovar", "modernizar",
}

# Stopwords/articles que nao devem ser considerados como inicio de
# bullet substantivado (filtrar antes de classificar)
_LEADING_ARTICLES = {"o", "a", "os", "as", "um", "uma", "uns", "umas"}


def _normalize_token(token: str) -> str:
    """Normaliza token: lowercase + remover acentos basicos."""
    t = token.lower()
    accents = {
        "á": "a", "à": "a", "â": "a", "ã": "a",
        "é": "e", "è": "e", "ê": "e",
        "í": "i", "ì": "i", "î": "i",
        "ó": "o", "ò": "o", "ô": "o", "õ": "o",
        "ú": "u", "ù": "u", "û": "u",
        "ç": "c",
    }
    for k, v in accents.items():
        t = t.replace(k, v)
    return t


def _strip_markdown_bold(text: str) -> str:
    """Remove markers ** ** mantendo o texto interno."""
    return re.sub(r"\*\*([^*]+)\*\*", r"\1", text or "")


def _count_bold_words(text: str) -> int:
    """Conta palavras destacadas em ** ** (heuristica markdown).

    Considera bold continuo: '**dois palavras**' = 2 palavras bold.
    """
    if not text:
        return 0
    total = 0
    for match in re.finditer(r"\*\*([^*]+)\*\*", text):
        chunk = match.group(1).strip()
        if chunk:
            total += len(chunk.split())
    return total


def _first_token(text: str) -> Optional[str]:
    """Retorna o primeiro token significativo do bullet (sem marcador
    visual como '-', '*', numero seguido de '.').

    Ignora articles iniciais para detectar a primeira "palavra real".
    """
    if not text:
        return None
    # Strip markdown bold markers para nao interferir
    cleaned = _strip_markdown_bold(text).strip()
    # Remover bullet markers comuns
    cleaned = re.sub(r"^[\-\*•●◦\d\.\)]+\s*", "", cleaned)
    # Tokenizar
    tokens = re.findall(r"\b[a-zA-ZáéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ]+\b", cleaned)
    if not tokens:
        return None
    # Pular articles iniciais
    for tok in tokens:
        norm = _normalize_token(tok)
        if norm not in _LEADING_ARTICLES:
            return tok
    return tokens[0]


def _classify_first_token(token: Optional[str]) -> str:
    """Classifica o primeiro token como 'verb', 'noun' ou 'unknown'.

    Heuristica:
      - Token em _COMMON_CONJUGATED_VERBS -> 'verb'
      - Token termina em -ar/-er/-ir e tem > 4 chars -> 'verb' (infinitivo)
      - Senao -> 'noun' (assume substantivo)
    """
    if not token:
        return "unknown"
    norm = _normalize_token(token)
    if norm in _COMMON_CONJUGATED_VERBS:
        return "verb"
    # Infinitivo terminado em -ar/-er/-ir, com 5+ chars (filtra "lar", "mar")
    if len(norm) >= 5 and norm.endswith(("ar", "er", "ir")):
        return "verb"
    return "noun"


# ---------------------------------------------------------------------------
# API publica
# ---------------------------------------------------------------------------
def validate_bullet_block(
    bullets: List[str],
    slide_num: int = 0,
) -> List[AuditWarning]:
    """Valida bloco de bullets segundo regras de apresentacao executiva.

    Args:
        bullets: lista de strings (1 string por bullet).
        slide_num: numero do slide (1-indexed) ou 0 para deck-level.

    Returns:
        Lista de AuditWarning categoria 'bullet_quality', severity 'medium'.

    Validacoes:
      1. Count entre 3 e 5
      2. Paralelismo gramatical (todos verbo OU todos substantivo)
      3. Comprimento <= 25 palavras
      4. Strategic bold <= 3 palavras destacadas por bullet
    """
    warnings: List[AuditWarning] = []

    # Filtrar bullets vazios
    items = [b for b in (bullets or []) if b and b.strip()]
    n = len(items)

    if n == 0:
        return warnings

    # 1. COUNT
    if n < _MIN_BULLETS:
        warnings.append(AuditWarning(
            slide_num=slide_num,
            category=_CATEGORY,
            severity=_DEFAULT_SEVERITY,
            message=(
                f"[bullet_quality] {n} bullets — minimo recomendado "
                f"{_MIN_BULLETS}. Bloco fraco / considerar paragrafo unico."
            ),
        ))
    elif n > _MAX_BULLETS:
        warnings.append(AuditWarning(
            slide_num=slide_num,
            category=_CATEGORY,
            severity=_DEFAULT_SEVERITY,
            message=(
                f"[bullet_quality] {n} bullets — maximo recomendado "
                f"{_MAX_BULLETS}. Sobrecarga cognitiva, dividir em 2 slides."
            ),
        ))

    # 2. PARALELISMO GRAMATICAL
    if n >= 2:
        classes = [_classify_first_token(_first_token(b)) for b in items]
        # Filtrar 'unknown' para classificar
        known = [c for c in classes if c != "unknown"]
        if len(known) >= 2:
            verb_count = sum(1 for c in known if c == "verb")
            noun_count = sum(1 for c in known if c == "noun")
            # Misturado se ambos > 0 e nenhum domina (>= 80%)
            total_known = verb_count + noun_count
            dominant_ratio = max(verb_count, noun_count) / total_known
            if verb_count > 0 and noun_count > 0 and dominant_ratio < 0.80:
                # Listar bullets discordantes (minoria)
                if verb_count >= noun_count:
                    minority_class = "noun"
                    discordant = [
                        items[i] for i, c in enumerate(classes)
                        if c == "noun"
                    ]
                    expected = "verbo"
                else:
                    minority_class = "verb"
                    discordant = [
                        items[i] for i, c in enumerate(classes)
                        if c == "verb"
                    ]
                    expected = "substantivo"
                preview = "; ".join(d[:30] for d in discordant[:2])
                warnings.append(AuditWarning(
                    slide_num=slide_num,
                    category=_CATEGORY,
                    severity=_DEFAULT_SEVERITY,
                    message=(
                        f"[bullet_quality] paralelismo quebrado — "
                        f"{verb_count} bullets com verbo, {noun_count} com "
                        f"substantivo. Padronizar em {expected}. "
                        f"Discordantes: {preview}"
                    ),
                ))

    # 3. COMPRIMENTO
    for i, b in enumerate(items, 1):
        # Remover bold markers para contagem (palavras bold contam normal)
        cleaned = _strip_markdown_bold(b)
        word_count = len(cleaned.split())
        if word_count > _MAX_WORDS_PER_BULLET:
            preview = b[:60]
            warnings.append(AuditWarning(
                slide_num=slide_num,
                category=_CATEGORY,
                severity=_DEFAULT_SEVERITY,
                message=(
                    f"[bullet_quality] bullet {i} com {word_count} palavras "
                    f"(max {_MAX_WORDS_PER_BULLET}) — virou paragrafo. "
                    f"Cortar: {preview!r}"
                ),
            ))

    # 4. STRATEGIC BOLD
    for i, b in enumerate(items, 1):
        bold_count = _count_bold_words(b)
        if bold_count > _MAX_BOLD_WORDS_PER_BULLET:
            preview = b[:60]
            warnings.append(AuditWarning(
                slide_num=slide_num,
                category=_CATEGORY,
                severity=_DEFAULT_SEVERITY,
                message=(
                    f"[bullet_quality] bullet {i} com {bold_count} palavras "
                    f"em bold (max {_MAX_BOLD_WORDS_PER_BULLET}) — sem "
                    f"hierarquia visual: {preview!r}"
                ),
            ))

    return warnings


__all__ = [
    "validate_bullet_block",
]
