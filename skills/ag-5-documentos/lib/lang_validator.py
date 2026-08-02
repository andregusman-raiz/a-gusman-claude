"""Linguagem executiva validator (PR 1.3 / secao 22 do guia mestre).

Heuristica baseada em:
  - 22.2 — frases fracas que destroem credibilidade executiva
  - 22.3 — tabela de trocas (fraco -> forte)
  - 22.4 — verbos fracos vs verbos fortes
  - 22.5 — consistencia terminologica (mesmo conceito, mesma palavra)

Sem chamada de LLM — pattern matching + sugestoes de troca.
Plugado em `lib/audit.py::audit_slide()` para body bullets e takeaways.
"""
from __future__ import annotations

import re
from collections import Counter
from typing import List, Optional, Tuple

from .audit import AuditWarning


# ---------------------------------------------------------------------------
# 22.2 — Frases fracas (linguagem hesitante / vaga / consultorial)
# ---------------------------------------------------------------------------
WEAK_PHRASES: List[str] = [
    "pode ser",
    "poderia ser",
    "pode haver",
    "pode existir",
    "podem existir",
    "importante destacar",
    "importante notar",
    "importante mencionar",
    "vale destacar",
    "vale mencionar",
    "vale ressaltar",
    "vale a pena mencionar",
    "diversos fatores",
    "diversos aspectos",
    "varias razoes",
    "algumas oportunidades",
    "algumas melhorias",
    "alguns desafios",
    "melhorias significativas",
    "ganhos significativos",
    "transformacao disruptiva",
    "transformacao digital",  # so quando isolado, sem objeto especifico
    "otimizar processos",
    "otimizar operacoes",
    "alavancar sinergias",
    "capturar sinergias",
    "criar valor",
    "gerar valor",
    "ser interessante",
    "seria interessante",
    "de certa forma",
    "de alguma forma",
    "potencialmente",
    "eventualmente",
    "tipicamente",
    "geralmente",
    "talvez",
    "possivelmente",
    "provavelmente",
    "espera-se que",
    "acredita-se que",
    "ha indicios de que",
    "ha sinais de que",
    "tendencia de melhoria",
    "tendencia de crescimento",
    "necessidade de revisar",
    "necessidade de avaliar",
    "buscar oportunidades",
    "explorar possibilidades",
    "considerar a possibilidade",
    "avaliar a viabilidade",
    "rever a estrategia",
    "fortalecer a operacao",
    "robustecer o processo",
    "aprimorar a gestao",
]

# ---------------------------------------------------------------------------
# 22.4 — Verbos fracos (modais, hipoteticos, intencionais)
# ---------------------------------------------------------------------------
WEAK_VERBS: List[str] = [
    "podem",
    "poderiam",
    "poderia",
    "poderao",
    "deveriam",
    "deveria",
    "devera",
    "tendem a",
    "tende a",
    "tenderia a",
    "buscam",
    "busca",
    "buscaria",
    "visam",
    "visa",
    "visaria",
    "procuram",
    "procura",
    "procuraria",
    "objetivam",
    "objetiva",
    "almejam",
    "almeja",
    "pretendem",
    "pretende",
    "pretenderia",
    "espera-se",
    "estima-se",  # quando sem numero ao redor
    "considera-se",
]

# ---------------------------------------------------------------------------
# 22.3 — Tabela de trocas (fraco -> forte)
# ---------------------------------------------------------------------------
STRONG_REPLACEMENTS: dict = {
    # Conclusoes vagas -> conclusoes acionaveis
    "pode gerar beneficios":
        "Deve reduzir custo em X% ou acelerar Y meses",
    "pode trazer beneficios":
        "Deve reduzir custo em X% ou acelerar Y meses",
    "existem oportunidades":
        "Ha N oportunidades prioritarias com impacto R$X MM",
    "ha oportunidades":
        "Ha N oportunidades prioritarias com impacto R$X MM",
    "varias oportunidades":
        "N oportunidades prioritarias mapeadas (R$X MM)",
    "algumas oportunidades":
        "N oportunidades mapeadas com R$X MM em jogo",
    # Diagnosticos genericos -> diagnosticos especificos
    "o cenario e desafiador":
        "Queda de X% em [metrica] pressiona meta de [resultado]",
    "o mercado esta dificil":
        "Concorrencia ganhou X pp de share em N meses",
    "ha desafios significativos":
        "N desafios criticos: [item1, item2, item3]",
    # Acoes vagas -> acoes priorizadas
    "otimizar processos":
        "Eliminar N etapas de [processo X] reduzindo Y dias",
    "alavancar sinergias":
        "Capturar R$X MM em sinergias via [acao Y]",
    "criar valor":
        "Capturar R$X MM em [valor especifico] em N meses",
    "gerar valor":
        "Capturar R$X MM em [valor especifico] em N meses",
    "transformacao digital":
        "Migrar N processos para [plataforma X] reduzindo Y%",
    "transformacao disruptiva":
        "Substituir [processo atual] por [novo modelo] capturando R$X MM",
    # Metalinguagem (auto-referencia) -> conteudo direto
    "importante destacar":
        "[REMOVER] — afirmar diretamente o ponto",
    "importante notar":
        "[REMOVER] — afirmar diretamente o ponto",
    "vale destacar":
        "[REMOVER] — afirmar diretamente o ponto",
    "vale mencionar":
        "[REMOVER] — afirmar diretamente o ponto",
    "vale ressaltar":
        "[REMOVER] — afirmar diretamente o ponto",
    "vale a pena mencionar":
        "[REMOVER] — afirmar diretamente o ponto",
    "de certa forma":
        "[REMOVER] — ser especifico ou cortar a clausula",
    "de alguma forma":
        "[REMOVER] — ser especifico ou cortar a clausula",
    # Modais hesitantes -> afirmacoes diretas
    "potencialmente":
        "[REMOVER] — afirmar com numero ou cortar",
    "talvez":
        "[REMOVER] — afirmar com numero ou cortar",
    "possivelmente":
        "[REMOVER] — afirmar com numero ou cortar",
    "eventualmente":
        "[REMOVER ou] em N meses (especificar prazo)",
    # Verbos fracos comuns -> verbos fortes
    "podem reduzir":
        "Reduzem [se evidencia] / Devem reduzir [se projecao]",
    "podem gerar":
        "Geram / Devem gerar [com metrica]",
    "podem aumentar":
        "Aumentam / Devem aumentar [com metrica]",
    "tendem a crescer":
        "Crescem X% a.a. (CAGR) / Cresceram Y% em [periodo]",
    "buscam capturar":
        "Capturam / Visam capturar R$X MM em [periodo]",
    "visam aprimorar":
        "Aprimoram [metrica] em X% / Devem aprimorar via [acao]",
    "deveria considerar":
        "Deve [acao especifica] para capturar [resultado]",
}

# ---------------------------------------------------------------------------
# 22.5 — Pares sinonimos comuns que indicam falta de consistencia terminologica.
# Cada subset agrupa palavras que provavelmente referem-se ao mesmo conceito
# em deck educacional/corporativo. Detectar 2+ dentro do mesmo deck = warning.
# ---------------------------------------------------------------------------
SYNONYM_GROUPS: List[List[str]] = [
    # Educacional — venda/captacao/matricula/leads (funil comercial)
    ["venda", "vendas", "captacao", "captacoes", "matricula", "matriculas",
     "conversao", "conversoes", "lead", "leads", "prospect", "prospects"],
    # Aluno/cliente/familia
    ["aluno", "alunos", "cliente", "clientes", "familia", "familias",
     "responsavel", "responsaveis"],
    # Receita/faturamento/ticket
    ["receita", "faturamento", "ticket", "ticket medio", "preco medio"],
    # Custo/despesa/gasto
    ["custo", "custos", "despesa", "despesas", "gasto", "gastos"],
    # Estrategia/plano/iniciativa/projeto
    ["estrategia", "estrategias", "plano", "planos", "iniciativa",
     "iniciativas", "projeto", "projetos"],
    # Meta/objetivo/target
    ["meta", "metas", "objetivo", "objetivos", "target", "targets"],
    # Funil/pipeline/jornada
    ["funil", "funis", "pipeline", "pipelines", "jornada", "jornadas"],
]


# ---------------------------------------------------------------------------
# Detectores
# ---------------------------------------------------------------------------
def _norm(text: str) -> str:
    """Normaliza texto para matching: lowercase + remove acentos basicos."""
    t = (text or "").lower()
    # remocao basica de acentos comuns em PT-BR
    accent_map = {
        "a": "[aàáâãä]", "e": "[eèéêë]", "i": "[iìíîï]",
        "o": "[oòóôõö]", "u": "[uùúûü]", "c": "[cç]",
    }
    return t


def _build_phrase_pattern(phrase: str) -> re.Pattern:
    """Cria regex tolerante a acentos para a frase."""
    norm = phrase.lower()
    # Mapear acentos comuns
    char_map = {
        "a": "[aàáâãä]", "e": "[eèéêë]", "i": "[iìíîï]",
        "o": "[oòóôõö]", "u": "[uùúûü]", "c": "[cç]",
    }
    pat_chars = []
    for ch in norm:
        if ch in char_map:
            pat_chars.append(char_map[ch])
        elif ch == " ":
            pat_chars.append(r"\s+")
        elif ch.isalpha():
            pat_chars.append(ch)
        else:
            pat_chars.append(re.escape(ch))
    return re.compile(r"\b" + "".join(pat_chars) + r"\b", re.IGNORECASE)


# Pre-compilar patterns (perf)
_WEAK_PHRASE_PATTERNS: List[Tuple[str, re.Pattern]] = [
    (p, _build_phrase_pattern(p)) for p in WEAK_PHRASES
]
_WEAK_VERB_PATTERNS: List[Tuple[str, re.Pattern]] = [
    (v, _build_phrase_pattern(v)) for v in WEAK_VERBS
]
_REPLACEMENT_PATTERNS: List[Tuple[str, re.Pattern, str]] = [
    (k, _build_phrase_pattern(k), v) for k, v in STRONG_REPLACEMENTS.items()
]


def detect_weak_language(text: str,
                          slide_num: int = 0) -> List[AuditWarning]:
    """Detecta linguagem fraca em um trecho de texto.

    Categoria: 'lang_weak'
    Severity: 'medium' (sugestao, nao bloqueante)

    Cada warning inclui sugestao de troca quando match em STRONG_REPLACEMENTS;
    senao, sugestao generica de "afirmacao direta com numero".
    """
    warnings: List[AuditWarning] = []
    if not text or not text.strip():
        return warnings

    txt = text.strip()
    seen_matches: set = set()

    # 1) Tabela de trocas explicitas tem prioridade (mais especifico)
    for orig, pat, replacement in _REPLACEMENT_PATTERNS:
        if pat.search(txt):
            key = ("repl", orig)
            if key in seen_matches:
                continue
            seen_matches.add(key)
            preview = txt[:60]
            warnings.append(AuditWarning(
                slide_num, "lang_weak", "medium",
                f"[lang] '{orig}' em {preview!r} -> sugestao: '{replacement}'"
            ))

    # 2) Frases fracas sem replacement explicito
    for phrase, pat in _WEAK_PHRASE_PATTERNS:
        if pat.search(txt):
            key = ("phrase", phrase)
            if key in seen_matches or ("repl", phrase) in seen_matches:
                continue
            # Pular se ja foi capturado pela tabela de trocas
            already = any(("repl", k) in seen_matches
                          for k in STRONG_REPLACEMENTS
                          if phrase in k or k in phrase)
            if already:
                continue
            seen_matches.add(key)
            preview = txt[:60]
            warnings.append(AuditWarning(
                slide_num, "lang_weak", "medium",
                f"[lang] frase fraca '{phrase}' em {preview!r} -> "
                f"reescrever como afirmacao direta com numero"
            ))

    # 3) Verbos fracos
    for verb, pat in _WEAK_VERB_PATTERNS:
        if pat.search(txt):
            key = ("verb", verb)
            if key in seen_matches:
                continue
            seen_matches.add(key)
            preview = txt[:60]
            warnings.append(AuditWarning(
                slide_num, "lang_weak", "medium",
                f"[lang] verbo fraco '{verb}' em {preview!r} -> "
                f"trocar por verbo de acao no presente/preterito"
            ))

    return warnings


def detect_consistent_terms(slides: List[str]) -> List[AuditWarning]:
    """Detecta inconsistencia terminologica entre slides do deck.

    Heuristica: para cada SYNONYM_GROUP, contar quantas variantes aparecem
    no deck. Se >= 2 variantes do mesmo grupo aparecem (e cada uma >= 2x),
    e sinal de inconsistencia terminologica.

    Severity: 'medium' (sugestao, nao bloqueante).
    """
    warnings: List[AuditWarning] = []
    if not slides:
        return warnings

    # Concatenar todo o texto, normalizado
    full_text = " ".join(s.lower() for s in slides if s)
    if not full_text.strip():
        return warnings

    for group in SYNONYM_GROUPS:
        counts: Counter = Counter()
        for term in group:
            pat = _build_phrase_pattern(term)
            n = len(pat.findall(full_text))
            if n > 0:
                counts[term] = n

        # Filtra termos que aparecem >= 2x (evita falso positivo de uso casual)
        recurring = {t: c for t, c in counts.items() if c >= 2}
        if len(recurring) >= 2:
            # Inconsistencia detectada — sugerir o termo mais usado como canonico
            sorted_terms = sorted(recurring.items(), key=lambda kv: -kv[1])
            canonical = sorted_terms[0][0]
            other_terms = [t for t, _ in sorted_terms[1:]]
            warnings.append(AuditWarning(
                0, "lang_consistency", "medium",
                f"[lang] termos sinonimos misturados no deck: "
                f"{', '.join(f'{t}({c}x)' for t, c in sorted_terms)} -> "
                f"padronizar em '{canonical}'"
            ))

    return warnings


__all__ = [
    "WEAK_PHRASES",
    "WEAK_VERBS",
    "STRONG_REPLACEMENTS",
    "SYNONYM_GROUPS",
    "detect_weak_language",
    "detect_consistent_terms",
]
