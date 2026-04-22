#!/usr/bin/env python3
"""
Gap Acceptance Guard — Stop hook bloqueante.

Bloqueia quando Claude aceita silenciosamente gap/divergencia/cobertura parcial
sem transformar em pergunta explicita ao usuario. Implementa o Gap Reporting
Protocol documentado em CLAUDE.md.

Exit codes:
  0 — allow stop
  2 — block stop, stderr feedback forca Claude a reescrever fechamento

Bypass temporario: GAP_GUARD_DISABLED=1
Bypass por turno: usuario diz "aceita o gap" / "pode seguir" / "ok seguir"
"""
import json
import os
import re
import sys


def read_transcript(path: str):
    msgs = []
    try:
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    msgs.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
    except (OSError, IOError):
        return []
    return msgs


def extract_last_texts(msgs):
    last_assistant = ""
    last_user = ""
    for m in reversed(msgs):
        t = m.get("type")
        if t == "assistant" and not last_assistant:
            content = m.get("message", {}).get("content", [])
            if isinstance(content, list):
                texts = [
                    c.get("text", "")
                    for c in content
                    if isinstance(c, dict) and c.get("type") == "text"
                ]
                last_assistant = "\n".join(texts)
        elif t == "user" and not last_user:
            content = m.get("message", {}).get("content", "")
            if isinstance(content, list):
                parts = []
                for c in content:
                    if isinstance(c, dict) and c.get("type") == "text":
                        parts.append(c.get("text", ""))
                    elif isinstance(c, str):
                        parts.append(c)
                content = "\n".join(parts)
            last_user = str(content)
        if last_assistant and last_user:
            break
    return last_assistant, last_user


ACCEPTANCE_PAT = re.compile(
    r"aceit[aá]vel"
    r"|pode ser corrigido depois"
    r"|corrigir depois"
    r"|cobertura suficiente"
    r"|gap (?:é |e )?ok"
    r"|ok o gap"
    r"|por enquanto basta"
    r"|bom o suficiente"
    r"|good enough"
    r"|nada cr[íi]tico"
    r"|despr[eí]z[íi]vel"
    r"|irrelevante para",
    re.IGNORECASE,
)

CONTEXT_PAT = re.compile(
    r"\bgap\b"
    r"|diferen[çc]a"
    r"|\d+\s*%"
    r"|faltam\b"
    r"|faltando\b"
    r"|missing\b"
    r"|cobertura"
    r"|parcial"
    r"|diverg[eê]ncia"
    r"|mapead"
    r"|sem mapeamento"
    r"|fora do mapeamento",
    re.IGNORECASE,
)

QUESTION_PAT = re.compile(
    r"\?\s*$"
    r"|devo (?:prosseguir|continuar|aceitar)"
    r"|posso aceitar"
    r"|quer (?:que eu|investigar)"
    r"|aguardo (?:sua|decis[ãa]o)"
    r"|qual op[cç][ãa]o"
    r"|voc[eê] decide"
    r"|o que prefere"
    r"|prefere (?:corrigir|aceitar|investigar)"
    r"|seguir assim ou"
    r"|aceita (?:o gap|assim)\?"
    r"|corrigir (?:agora|primeiro)\?",
    re.IGNORECASE | re.MULTILINE,
)

USER_BYPASS_PAT = re.compile(
    r"\b(?:aceit[oa] (?:o )?gap"
    r"|pode seguir"
    r"|ok seguir"
    r"|segue assim"
    r"|aceita assim"
    r"|autorizo"
    r"|pode aceitar o gap"
    r"|ignore o gap"
    r"|gap ok)\b",
    re.IGNORECASE,
)

BLOCK_MESSAGE = """BLOQUEADO pelo Gap Reporting Protocol (CLAUDE.md).

Detectei aceitacao silenciosa de gap/divergencia sem pergunta ao usuario.
Frases como "gap aceitavel", "pode ser corrigido depois", "cobertura suficiente"
sao proibidas sem aprovacao explicita.

Reescreva o fechamento no formato obrigatorio:
  1. Esperado vs Atual (numeros exatos)
  2. O que esta faltando e por que (causa raiz se conhecida)
  3. Opcoes: (a) corrigir agora, (b) aceitar e documentar, (c) investigar mais
  4. Pergunta direta ao usuario sobre qual opcao seguir

Mesmo se o gap parecer trivial, TRANSFORME em pergunta:
  "Seguir assim ou investigar as N excecoes?"

Bypass (so quando genuino): usuario diz "aceita o gap" / "pode seguir" / "ok seguir".
Bypass de emergencia (sessao): export GAP_GUARD_DISABLED=1
"""


def main() -> int:
    if os.environ.get("GAP_GUARD_DISABLED") == "1":
        return 0

    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return 0

    if data.get("stop_hook_active"):
        return 0

    transcript = data.get("transcript_path", "")
    if not transcript or not os.path.exists(transcript):
        return 0

    msgs = read_transcript(transcript)
    if not msgs:
        return 0

    last_assistant, last_user = extract_last_texts(msgs)

    last_user_clean = re.sub(
        r"<system-reminder>.*?</system-reminder>",
        "",
        last_user,
        flags=re.DOTALL,
    )

    if USER_BYPASS_PAT.search(last_user_clean):
        return 0

    if len(last_assistant) < 100:
        return 0

    acc = ACCEPTANCE_PAT.search(last_assistant)
    ctx = CONTEXT_PAT.search(last_assistant)
    has_q = QUESTION_PAT.search(last_assistant)

    if acc and ctx and not has_q:
        print(BLOCK_MESSAGE, file=sys.stderr)
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
