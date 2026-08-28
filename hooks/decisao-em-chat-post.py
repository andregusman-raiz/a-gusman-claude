#!/usr/bin/env python3
"""decisao-em-chat-post.py — PostToolUse(AskUserQuestion).

Companion de decisao-em-chat-guard.py (PreToolUse do mesmo tool). Le a
resposta do dono em tool_response, casa cada pergunta com o estado gravado
pelo Pre-hook (docs/ai-state/terminais/.decisao-em-chat/<session_id>.json) e:

  - se a pergunta virou D-nnn: bash decisao-decidir.sh D-nnn "<resposta>"
  - se degradou para ALERTAS (sem D-nnn): apenda RESOLVIDO referenciando a
    linha original (--ref "[ts] PAPEL"), ou so um INFO textual se nem o ref
    sobreviveu.

Formato observado do tool_response do AskUserQuestion (Claude Code, texto
puro, nao JSON estruturado):
  'Your questions have been answered: "<Q>"="<A>". You can now continue...'
  — com 1 par "Q"="A" por pergunta respondida, concatenados na mesma string
  quando multiSelect/varias perguntas. Parseado via regex tolerante; payload
  em formato diferente (dict/list) tambem e tentado antes de desistir.

NUNCA bloqueia (PostToolUse nao bloqueia o resultado, so pode avisar) —
sempre exit 0, best-effort, fail-open em qualquer excecao.

Overrides so para teste isolado (default = paths reais em producao):
  PAPEL_TERMINAIS_DIR       (default ~/Claude/docs/ai-state/terminais)
  DECISAO_CHAT_SCRIPTS_DIR  (default ~/Claude/.claude/scripts)
"""
import json
import os
import re
import subprocess
import sys

HOME = os.path.expanduser("~")
T = os.environ.get("PAPEL_TERMINAIS_DIR", os.path.join(HOME, "Claude", "docs", "ai-state", "terminais"))
SCRIPTS = os.environ.get("DECISAO_CHAT_SCRIPTS_DIR", os.path.join(HOME, "Claude", ".claude", "scripts"))
STATE_DIR = os.path.join(T, ".decisao-em-chat")

# Casa "<Q>"="<A>" tolerando qualquer coisa exceto aspas dentro de Q/A (o
# tool_response real do Claude Code nao escapa aspas internas — limitacao
# documentada, igual ao resto dos guards textuais deste harness).
PAIR_RE = re.compile(r'"([^"]+)"\s*=\s*"([^"]*)"')


def truncate(text: str, n: int) -> str:
    text = " ".join((text or "").split())
    if len(text) <= n:
        return text
    return text[: n - 1].rstrip() + "…"


def run(cmd, timeout=15):
    try:
        return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    except Exception as e:
        class _R:
            returncode = -1
            stdout = ""
            stderr = str(e)
        return _R()


def extract_pairs(tool_response) -> list:
    """Retorna [(question, answer), ...] a partir do tool_response, em
    qualquer formato razoavel (string, dict com 'content'/'text', list)."""
    texts = []
    if isinstance(tool_response, str):
        texts.append(tool_response)
    elif isinstance(tool_response, dict):
        for key in ("content", "text", "output", "result"):
            v = tool_response.get(key)
            if isinstance(v, str):
                texts.append(v)
            elif isinstance(v, list):
                for item in v:
                    if isinstance(item, dict) and isinstance(item.get("text"), str):
                        texts.append(item["text"])
                    elif isinstance(item, str):
                        texts.append(item)
    elif isinstance(tool_response, list):
        for item in tool_response:
            if isinstance(item, dict) and isinstance(item.get("text"), str):
                texts.append(item["text"])
            elif isinstance(item, str):
                texts.append(item)

    pairs = []
    for t in texts:
        pairs.extend(PAIR_RE.findall(t))
    return pairs


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0

    session_id = data.get("session_id") or "nosession"
    state_path = os.path.join(STATE_DIR, f"{session_id}.json")
    if not os.path.isfile(state_path):
        return 0  # nada correlacionavel (papel != cockpit, ou COMANDO, ou pre-hook falhou)

    try:
        with open(state_path, encoding="utf-8") as f:
            state = json.load(f)
    except Exception as e:
        print(f"[decisao-em-chat-post] AVISO: estado ilegivel ({e}).", file=sys.stderr)
        return 0

    entries = state.get("questions") or []
    if not entries:
        try:
            os.remove(state_path)
        except Exception:
            pass
        return 0

    pairs = extract_pairs(data.get("tool_response"))
    if not pairs:
        print("[decisao-em-chat-post] AVISO: nao consegui extrair par pergunta=resposta do tool_response.", file=sys.stderr)
        return 0

    decidir = os.path.join(SCRIPTS, "decisao-decidir.sh")
    canal = os.path.join(SCRIPTS, "canal-append.sh")

    matched_any = False
    for question, answer in pairs:
        question_norm = " ".join(question.split())
        entry = next((e for e in entries if e.get("question") == question_norm), None)
        if entry is None:
            continue
        matched_any = True
        resposta = truncate(answer, 200)
        d_id = entry.get("id")
        if d_id and os.path.isfile(decidir) and os.access(decidir, os.X_OK):
            r = run(["bash", decidir, d_id, resposta])
            if r.returncode != 0:
                print(f"[decisao-em-chat-post] AVISO: decisao-decidir.sh {d_id} falhou (exit={r.returncode}): {r.stderr}", file=sys.stderr)
        elif os.path.isfile(canal) and os.access(canal, os.X_OK):
            ref = entry.get("ref")
            texto = truncate(f"resposta em chat: {resposta}", 300)
            if ref:
                run(["bash", canal, "ALERTAS", texto, "--papel", state.get("papel", "desconhecido"), "--tipo", "RESOLVIDO", "--ref", ref])
            else:
                run(["bash", canal, "ALERTAS", texto, "--papel", state.get("papel", "desconhecido"), "--tipo", "INFO"])

    if matched_any:
        try:
            os.remove(state_path)
        except Exception:
            pass

    return 0  # NUNCA bloqueia


if __name__ == "__main__":
    sys.exit(main())
