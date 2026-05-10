#!/usr/bin/env python3
"""
Completion Gate — Stop hook bloqueante.

Bloqueia encerramento quando Claude declara tarefa "feita/pronta/completa"
mas editou arquivos de codigo (.ts/.tsx/.js/.jsx/.py) sem rodar verificacao
(typecheck/lint/test/build) na mesma sessao.

Inspirado no /goal mode do Codex: "passar testes nao e prova de done — audit
real e". Aqui a regra inversa: declarar done sem ter rodado audit = bloqueio.

Exit codes:
  0 — allow stop
  2 — block stop, stderr feedback forca Claude a rodar verificacao

Bypass:
  COMPLETION_GATE_DISABLED=1   (sessao)
  Usuario diz "pode parar", "tá bom assim", "encerre", "fim" no ultimo turno.

Filosofia:
- Sempre considerar o turno (mensagens entre o ultimo prompt do usuario e o
  ponto atual do assistente), nao a sessao inteira.
- Soft-fail: erros de parsing nunca bloqueiam (return 0).
- stop_hook_active=true significa que o hook ja bloqueou uma vez nesta cadeia
  — retornar 0 para nao causar loop infinito.
"""
import json
import os
import re
import sys


CODE_EXT = re.compile(r"\.(ts|tsx|js|jsx|mjs|cjs|py|rs|go)$", re.IGNORECASE)

EDIT_TOOLS = {"Edit", "Write", "MultiEdit", "NotebookEdit"}

CHECK_PATTERNS = re.compile(
    r"\b(?:tsc|typecheck|type-check|tsgo)\b"
    r"|\b(?:eslint|lint|biome|ruff|flake8|pylint|mypy|pyright)\b"
    r"|\b(?:vitest|jest|pytest|playwright|test)\b"
    r"|\bbun\s+(?:run\s+)?(?:typecheck|lint|test|check|build)\b"
    r"|\bnpm\s+(?:run\s+)?(?:typecheck|lint|test|check|build)\b"
    r"|\bpnpm\s+(?:run\s+)?(?:typecheck|lint|test|check|build)\b"
    r"|\bnext\s+build\b"
    r"|\bnpx\s+tsc\b"
    r"|\bbunx\s+tsc\b",
    re.IGNORECASE,
)

DONE_PATTERNS = re.compile(
    r"\b(?:tarefa|trabalho|implementacao|implementação|fix|correcao|correção|"
    r"feature|build|refactor|refatoracao|refatoração|migracao|migração)\s+"
    r"(?:completa|concluid[ao]|conclu[íi]d[ao]|pronta?|feita?|finalizada?)\b"
    r"|\b(?:tudo\s+)?(?:pronto|feito|concluido|conclu[íi]do)\b"
    r"|\b(?:done|finished|completed|all\s+set|ready)\b"
    r"|\bimplementacao\s+conclu[íi]da\b"
    r"|\bfix\s+aplicado\b"
    r"|\bmudancas?\s+(?:aplicadas?|salvas?)\b"
    r"|\bmigracao\s+aplicada\b",
    re.IGNORECASE,
)

USER_BYPASS_PAT = re.compile(
    r"\b(?:pode\s+(?:parar|encerrar|finalizar)"
    r"|tá\s+bom\s+assim"
    r"|t[aá]\s+ok"
    r"|encerre"
    r"|finalize"
    r"|fim"
    r"|chega\s+por\s+aqui"
    r"|skip\s+check"
    r"|sem\s+(?:typecheck|lint|test)"
    r"|n[aã]o\s+precisa\s+(?:rodar|verificar))\b",
    re.IGNORECASE,
)

BLOCK_TEMPLATE = """BLOQUEADO pelo Completion Gate (CLAUDE.md / Definition of Done).

Voce declarou tarefa concluida mas editou arquivos de codigo sem rodar
verificacao na sessao:

  Arquivos editados ({n_edits}): {edits}
  Verificacao executada: NENHUMA

ANTES de encerrar, rode pelo menos UM destes (escolha conforme o projeto):

  bun run typecheck && bun run lint && bun run test
  npm run typecheck && npm run lint && npm run test
  npx tsc --noEmit  +  npx eslint <arquivos>
  pytest -v  +  ruff check .  +  mypy .

Se algum check falhar: corrija e re-rode ate passar (max 3 ciclos).
Se decidir nao rodar (ex: edicao puramente de docs/config): justifique por
que ao usuario antes de declarar pronto.

Bypass legitimo (so se aplicavel):
  - Usuario disse "pode parar" / "encerre" no ultimo turno
  - Edicoes foram apenas .md/.json/.yaml (nao codigo executavel)
  - export COMPLETION_GATE_DISABLED=1 (sessao)
"""


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


def find_turn_start(msgs):
    """Indice da ultima mensagem do tipo 'user' (inicio do turno atual)."""
    for i in range(len(msgs) - 1, -1, -1):
        if msgs[i].get("type") == "user":
            content = msgs[i].get("message", {}).get("content", "")
            if isinstance(content, list):
                has_tool_result = any(
                    isinstance(c, dict) and c.get("type") == "tool_result"
                    for c in content
                )
                if has_tool_result:
                    continue
            return i
    return 0


def extract_turn_signals(msgs, start_idx):
    """Coleta no turno: arquivos editados (codigo), comandos bash de check,
    texto agregado do assistente."""
    edits = []
    ran_check = False
    assistant_text_parts = []

    for m in msgs[start_idx:]:
        t = m.get("type")
        if t == "assistant":
            content = m.get("message", {}).get("content", [])
            if not isinstance(content, list):
                continue
            for c in content:
                if not isinstance(c, dict):
                    continue
                if c.get("type") == "text":
                    assistant_text_parts.append(c.get("text", ""))
                elif c.get("type") == "tool_use":
                    name = c.get("name", "")
                    inp = c.get("input", {}) or {}
                    if name in EDIT_TOOLS:
                        path = (
                            inp.get("file_path")
                            or inp.get("notebook_path")
                            or ""
                        )
                        if path and CODE_EXT.search(path):
                            edits.append(path)
                    elif name == "Bash":
                        cmd = inp.get("command", "") or ""
                        if CHECK_PATTERNS.search(cmd):
                            ran_check = True
        elif t == "user":
            content = m.get("message", {}).get("content", "")
            if isinstance(content, list):
                for c in content:
                    if (
                        isinstance(c, dict)
                        and c.get("type") == "tool_result"
                    ):
                        result_content = c.get("content", "")
                        if isinstance(result_content, list):
                            for rc in result_content:
                                if (
                                    isinstance(rc, dict)
                                    and rc.get("type") == "text"
                                ):
                                    pass

    return edits, ran_check, "\n".join(assistant_text_parts)


def get_last_user_text(msgs):
    """Texto do ultimo prompt humano real (ignora tool_results)."""
    for m in reversed(msgs):
        if m.get("type") != "user":
            continue
        content = m.get("message", {}).get("content", "")
        if isinstance(content, list):
            text_parts = []
            has_tool_result = False
            for c in content:
                if isinstance(c, dict):
                    if c.get("type") == "tool_result":
                        has_tool_result = True
                    elif c.get("type") == "text":
                        text_parts.append(c.get("text", ""))
            if has_tool_result and not text_parts:
                continue
            return "\n".join(text_parts)
        elif isinstance(content, str):
            return content
    return ""


def main() -> int:
    if os.environ.get("COMPLETION_GATE_DISABLED") == "1":
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

    last_user = get_last_user_text(msgs)
    last_user_clean = re.sub(
        r"<system-reminder>.*?</system-reminder>",
        "",
        last_user,
        flags=re.DOTALL,
    )
    if USER_BYPASS_PAT.search(last_user_clean):
        return 0

    start = find_turn_start(msgs)
    edits, ran_check, assistant_text = extract_turn_signals(msgs, start)

    if not edits:
        return 0

    if ran_check:
        return 0

    if not DONE_PATTERNS.search(assistant_text):
        return 0

    edits_unique = []
    seen = set()
    for e in edits:
        if e not in seen:
            seen.add(e)
            edits_unique.append(e)
    edits_display = ", ".join(edits_unique[:5])
    if len(edits_unique) > 5:
        edits_display += f" (+{len(edits_unique) - 5} mais)"

    msg = BLOCK_TEMPLATE.format(
        n_edits=len(edits_unique), edits=edits_display
    )
    print(msg, file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
