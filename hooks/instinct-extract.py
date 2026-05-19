#!/usr/bin/env python3
"""
instinct-extract.py — Stop hook NAO-BLOQUEANTE.

Le transcript da sessao apos Stop, detecta candidatos a memory (instincts)
com confidence scoring, escreve em:

  ~/.claude/projects/*/memory/_instinct-candidates.md

NUNCA escreve direto em MEMORY.md ou em feedback_*.md. Apenas sugere.
Usuario promove via /ag-retrospectiva --instincts.

Sinais detectados (com peso):
  - User correction: "nao", "stop", "errado", "isso esta errado" (peso 0.4)
  - User confirmation forte: "perfeito", "exato", "isso e isso", "exatamente" (peso 0.3)
  - Pattern repeticao: mesma sequencia de tool calls em 3+ turnos (peso 0.2)
  - Decisao explicita do usuario: "sempre use X em vez de Y" (peso 0.5)
  - Novidade: nao bate com nenhuma linha de MEMORY.md atual (multiplicador 1.2)

Confidence = soma_ponderada * novidade_mult. Threshold para sugerir: 0.70.

Exit: SEMPRE 0 (nao-bloqueante).

Bypass: INSTINCT_EXTRACT_DISABLED=1
"""
import json
import os
import re
import sys
from pathlib import Path
from datetime import datetime


CORRECTION_PAT = re.compile(
    r"\b(?:n[ãa]o|nao|stop|para|errado|incorreto|errou|isso\s+est[áa]\s+errado"
    r"|wrong|incorrect|wait|no,)\b",
    re.IGNORECASE,
)

CONFIRMATION_PAT = re.compile(
    r"\b(?:perfeito|perfect|exato|exato!|isso\s+mesmo|isso\s+[ée]\s+isso"
    r"|exatamente|exactly|spot\s+on|nailed\s+it|great\s+call)\b",
    re.IGNORECASE,
)

DECISION_PAT = re.compile(
    r"\b(?:sempre\s+(?:use|usar|fa[çc]a|prefer[ai])"
    r"|nunca\s+(?:use|usar|fa[çc]a)"
    r"|always\s+(?:use|prefer|do)"
    r"|never\s+(?:use|do)"
    r"|de\s+agora\s+em\s+diante"
    r"|from\s+now\s+on"
    r"|a\s+regra\s+[ée])\b",
    re.IGNORECASE,
)


def read_transcript(path):
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


def get_user_messages(msgs):
    """Retorna lista de (idx, texto) de mensagens user reais (sem tool_result)."""
    out = []
    for i, m in enumerate(msgs):
        if m.get("type") != "user":
            continue
        content = m.get("message", {}).get("content", "")
        if isinstance(content, list):
            texts = []
            has_tool_result = False
            for c in content:
                if isinstance(c, dict):
                    if c.get("type") == "tool_result":
                        has_tool_result = True
                    elif c.get("type") == "text":
                        texts.append(c.get("text", ""))
            if has_tool_result and not texts:
                continue
            if texts:
                out.append((i, "\n".join(texts)))
        elif isinstance(content, str) and content.strip():
            # Filtra system reminders
            cleaned = re.sub(r"<system-reminder>.*?</system-reminder>", "", content, flags=re.DOTALL)
            if cleaned.strip():
                out.append((i, cleaned.strip()))
    return out


def find_context_around(msgs, user_idx, window=2):
    """Retorna texto do assistente nos `window` turnos antes do user msg."""
    context_parts = []
    count = 0
    for j in range(user_idx - 1, -1, -1):
        if count >= window:
            break
        m = msgs[j]
        if m.get("type") == "assistant":
            content = m.get("message", {}).get("content", [])
            if isinstance(content, list):
                for c in content:
                    if isinstance(c, dict) and c.get("type") == "text":
                        text = c.get("text", "").strip()
                        if text:
                            context_parts.insert(0, text[:500])
                            count += 1
                            break
    return "\n---\n".join(context_parts)


def load_memory_index(project_dir):
    """Carrega MEMORY.md para checar novidade."""
    memory_dir = Path(project_dir) / "memory"
    memory_index = memory_dir / "MEMORY.md"
    if not memory_index.exists():
        return ""
    try:
        return memory_index.read_text(encoding="utf-8")
    except (OSError, IOError):
        return ""


def novelty_multiplier(candidate_text, memory_text):
    """1.2 se candidate nao bate com nenhuma linha de memory, 0.8 se bate."""
    if not memory_text:
        return 1.2
    # Token overlap simples
    cand_tokens = set(re.findall(r"\w+", candidate_text.lower()))
    if len(cand_tokens) < 3:
        return 1.0
    memory_lines = memory_text.splitlines()
    max_overlap = 0
    for line in memory_lines:
        line_tokens = set(re.findall(r"\w+", line.lower()))
        if not line_tokens:
            continue
        overlap = len(cand_tokens & line_tokens) / max(len(cand_tokens), 1)
        if overlap > max_overlap:
            max_overlap = overlap
    if max_overlap > 0.5:
        return 0.8
    if max_overlap < 0.2:
        return 1.2
    return 1.0


def extract_candidates(msgs, memory_text):
    """Detecta candidatos com confidence scoring."""
    candidates = []
    user_msgs = get_user_messages(msgs)

    for idx, text in user_msgs:
        if len(text) < 8:
            continue

        score = 0.0
        signals = []

        if CORRECTION_PAT.search(text):
            score += 0.4
            signals.append("correction")
        if CONFIRMATION_PAT.search(text):
            score += 0.3
            signals.append("confirmation")
        if DECISION_PAT.search(text):
            score += 0.5
            signals.append("decision")

        if score == 0:
            continue

        mult = novelty_multiplier(text, memory_text)
        confidence = min(1.0, score * mult)

        if confidence >= 0.70:
            context = find_context_around(msgs, idx, window=1)
            candidates.append({
                "confidence": round(confidence, 2),
                "signals": signals,
                "novelty_multiplier": round(mult, 2),
                "user_text": text[:500],
                "context": context[:600],
            })

    return candidates


def write_candidates(project_dir, candidates):
    if not candidates:
        return
    memory_dir = Path(project_dir) / "memory"
    memory_dir.mkdir(parents=True, exist_ok=True)
    out = memory_dir / "_instinct-candidates.md"

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    lines = [f"# Instinct Candidates — coletados em {timestamp}",
             "",
             "> Auto-gerado por `instinct-extract.py`. Promova/descarte via `/ag-retrospectiva --instincts`.",
             ""]

    for i, c in enumerate(candidates, start=1):
        lines.append(f"## Candidate {i} — confidence {c['confidence']}")
        lines.append("")
        lines.append(f"- Sinais: {', '.join(c['signals'])}")
        lines.append(f"- Novelty multiplier: {c['novelty_multiplier']}")
        lines.append("")
        lines.append("**User text:**")
        lines.append("```")
        lines.append(c["user_text"])
        lines.append("```")
        lines.append("")
        if c["context"]:
            lines.append("**Assistant context (turno anterior):**")
            lines.append("```")
            lines.append(c["context"])
            lines.append("```")
            lines.append("")

    # Append (nao overwrite) — candidates acumulam ate revisao
    if out.exists():
        existing = out.read_text(encoding="utf-8")
        lines = [existing.rstrip(), "", "---", ""] + lines

    out.write_text("\n".join(lines), encoding="utf-8")


def main():
    if os.environ.get("INSTINCT_EXTRACT_DISABLED") == "1":
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

    # project dir = pai do transcript (Claude Code armazena em ~/.claude/projects/<encoded>/<session>.jsonl)
    project_dir = os.path.dirname(transcript)
    if not project_dir:
        return 0

    msgs = read_transcript(transcript)
    if not msgs or len(msgs) < 4:
        return 0

    memory_text = load_memory_index(project_dir)
    candidates = extract_candidates(msgs, memory_text)

    if not candidates:
        return 0

    try:
        write_candidates(project_dir, candidates)
    except (OSError, IOError):
        # Silent fail — hook nao-bloqueante
        pass

    return 0


if __name__ == "__main__":
    sys.exit(main())
