#!/usr/bin/env python3
"""decisao-em-chat-guard.py — PreToolUse(AskUserQuestion).

Achado 1 da auditoria de terminais 48h (2026-08-28): 5 decisoes do dono
nasceram SO em chat (AskUserQuestion) e tiveram que ser resgatadas depois —
nunca viraram D-nnn em decisoes.json, dependiam do papel lembrar de copiar
manualmente. Este hook torna o registro AUTOMATICO: toda vez que um papel do
cockpit (exceto COMANDO e RESUMO — ver abaixo) chama AskUserQuestion, cada
pergunta vira uma entrada em decisoes.json via decisao-nova.sh (bloco 4 —
produto/operacao, o dono/COMANDO reclassifica se for outro bloco). Se
decisao-nova.sh ainda nao existir (builder B em paralelo), degrada para
canal-append.sh ALERTAS.

Fix 2026-08-28 (A3, auditoria adversarial): 2 exclusoes do papel, nao 1.
  - COMANDO: a pergunta ao dono E' o canal legitimo (original, inalterado).
  - RESUMO: por CONDUTA.md, RESUMO NUNCA cria decisao (ele so interpreta; se
    detecta um gap, pede ao terminal de ORIGEM). Achado ao vivo: com papel
    RESUMO o hook estava chamando decisao-nova.sh mesmo assim. Agora RESUMO
    NUNCA cunha — em vez disso tenta rotear via terminal-send.sh ao papel de
    origem citado na propria pergunta (busca por nome de papel conhecido no
    registry, fronteira de palavra); se nenhum papel for identificavel, so
    loga em stderr (best-effort, nunca bloqueia, nunca inventa destinatario).

Filtro de trivialidade (conservador, para os demais papeis): pergunta com
<40 chars E sem NENHUM marcador de decisao (`#\\d{4,}` — PR/issue,
nome de papel conhecido do registry, "produção"/"producao", "deploy",
"autoriz", "aprov", "merge") NAO cunha — so loga em stderr. Qualquer duvida
(marcador presente, ou >=40 chars) CUNHA — falso-positivo de cunhagem e
barato (o dono/COMANDO reclassifica/fecha), perder uma decisao real do dono
por causa de uma heuristica de tamanho nao e.

NUNCA bloqueia a pergunta — best-effort, sempre exit 0. Falha em qualquer
etapa (script ausente, registry ilegivel, papel nao resolvido) -> loga em
stderr e segue.

Estado gravado em docs/ai-state/terminais/.decisao-em-chat/<session_id>.json
para o PostToolUse companion (decisao-em-chat-post.py) fechar a decisao com
a resposta do dono.

Overrides so para teste isolado (default = paths reais em producao):
  PAPEL_TERMINAIS_DIR       (default ~/Claude/docs/ai-state/terminais)
  DECISAO_CHAT_SCRIPTS_DIR  (default ~/Claude/.claude/scripts)

Nao-bloqueante por desenho — sem env de bypass (nao ha o que desabilitar
alem de nunca poder bloquear; R3 do harness-coverage.md se aplica so a hooks
que retornam exit 2, que este nunca faz).
"""
import json
import os
import re
import subprocess
import sys
import time

HOME = os.path.expanduser("~")
T = os.environ.get("PAPEL_TERMINAIS_DIR", os.path.join(HOME, "Claude", "docs", "ai-state", "terminais"))
SCRIPTS = os.environ.get("DECISAO_CHAT_SCRIPTS_DIR", os.path.join(HOME, "Claude", ".claude", "scripts"))
REGISTRY = os.path.join(T, "registry.json")
STATE_DIR = os.path.join(T, ".decisao-em-chat")

D_ID_RE = re.compile(r"\bD-\d+\b")

# Filtro de trivialidade (A3): marcadores que SEMPRE forcam cunhagem mesmo
# com pergunta curta (<40 chars). Substring case-insensitive (ver
# is_trivial_question) — "nome de papel" e checado a parte, dinamicamente,
# contra o registry (ver load_known_papeis), nao esta nesta lista fixa.
PR_MARKER_RE = re.compile(r"#\d{4,}")
TRIVIA_OVERRIDE_KEYWORDS = ("produção", "producao", "deploy", "autoriz", "aprov", "merge")
TRIVIA_MAX_LEN = 40


def _load_registry():
    try:
        sys.path.insert(0, SCRIPTS)
        from registry_lib import load
        return load(REGISTRY)
    except Exception:
        try:
            with open(REGISTRY) as f:
                return json.load(f)
        except Exception:
            return {}


def resolve_papel(ws: str):
    if not ws:
        return None
    reg = _load_registry()
    for papel, e in (reg.get("terminais") or {}).items():
        if e.get("workspace_uuid") == ws:
            return papel
    return None


def load_known_papeis() -> list:
    """Lista de papeis conhecidos do registry — usada tanto pelo filtro de
    trivialidade ("nome de papel" como marcador de decisao) quanto pelo
    roteamento de RESUMO (achar o papel de origem citado na pergunta)."""
    reg = _load_registry()
    return list((reg.get("terminais") or {}).keys())


def is_trivial_question(question: str, known_papeis: list) -> bool:
    """Conservador por desenho: so declara trivial (NAO cunha) quando a
    pergunta e curta E nao tem NENHUM marcador de decisao. Qualquer duvida
    -> False (cunha). Ver docstring do modulo para a lista de marcadores."""
    text = question or ""
    if len(text) >= TRIVIA_MAX_LEN:
        return False
    if PR_MARKER_RE.search(text):
        return False
    lower = text.lower()
    if any(kw in lower for kw in TRIVIA_OVERRIDE_KEYWORDS):
        return False
    for papel in known_papeis:
        if not papel:
            continue
        if re.search(r"\b" + re.escape(papel) + r"\b", text, re.IGNORECASE):
            return False
    return True


def handle_resumo_question(question: str, known_papeis: list) -> dict:
    """RESUMO nunca cunha decisao (CONDUTA.md). Tenta rotear a pergunta ao
    papel de ORIGEM citado no proprio texto via terminal-send.sh; se nenhum
    papel conhecido aparecer na pergunta, so loga em stderr — nunca inventa
    destinatario, nunca cunha como fallback. Retorna {"routed": bool,
    "target": str|None}."""
    target = None
    for papel in known_papeis:
        if not papel or papel == "RESUMO":
            continue
        if re.search(r"\b" + re.escape(papel) + r"\b", question or "", re.IGNORECASE):
            target = papel
            break

    if target is None:
        print(
            f"[decisao-em-chat-guard] RESUMO: pergunta em chat sem papel de "
            f"origem identificavel — NAO cunha (RESUMO nunca cria decisao), "
            f"NAO roteia (destinatario ambiguo): {truncate(question, 160)}",
            file=sys.stderr,
        )
        return {"routed": False, "target": None}

    send = os.path.join(SCRIPTS, "terminal-send.sh")
    if os.path.isfile(send) and os.access(send, os.X_OK):
        msg = truncate(f"RESUMO detectou pergunta/gap em chat para {target}: {truncate(question, 200)}", 300)
        r = run(["bash", send, target, msg])
        if r.returncode == 0:
            return {"routed": True, "target": target}
        print(
            f"[decisao-em-chat-guard] AVISO: RESUMO tentou rotear a "
            f"{target} via terminal-send.sh mas falhou (exit={r.returncode}): "
            f"{r.stderr.strip()}",
            file=sys.stderr,
        )
        return {"routed": False, "target": target}

    print(
        f"[decisao-em-chat-guard] AVISO: RESUMO identificou {target} como "
        f"origem mas terminal-send.sh nao esta disponivel em {SCRIPTS} — "
        f"NAO cunha, NAO roteia: {truncate(question, 160)}",
        file=sys.stderr,
    )
    return {"routed": False, "target": target}


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


def register_question(papel: str, question: str, options: list) -> dict:
    """Tenta decisao-nova.sh; se ausente/falhar, degrada para canal-append.sh
    ALERTAS. Retorna {"id": "D-nnn"|None, "ref": "[ts] PAPEL"|None,
    "fallback": bool}."""
    q_trunc = truncate(question, 120)
    labels = ", ".join(truncate(o.get("label", ""), 40) for o in options if isinstance(o, dict))
    ts = time.strftime("%Y-%m-%d %H:%M", time.gmtime())
    efeito = truncate(f"pergunta feita em chat em {ts}Z; opções: {labels}", 200)

    nova = os.path.join(SCRIPTS, "decisao-nova.sh")
    if os.path.isfile(nova) and os.access(nova, os.X_OK):
        r = run(["bash", nova, q_trunc, "--papel", papel, "--efeito", efeito, "--bloco", "4"])
        out = (r.stdout or "") + "\n" + (r.stderr or "")
        m = D_ID_RE.search(out)
        if r.returncode == 0 and m:
            return {"id": m.group(0), "ref": None, "fallback": False}
        print(
            f"[decisao-em-chat-guard] AVISO: decisao-nova.sh rodou mas nao "
            f"retornou D-nnn reconhecivel (exit={r.returncode}); degradando "
            f"para canal-append.sh ALERTAS.",
            file=sys.stderr,
        )

    canal = os.path.join(SCRIPTS, "canal-append.sh")
    ref = None
    if os.path.isfile(canal) and os.access(canal, os.X_OK):
        texto = truncate(f"DECISÃO EM CHAT sem D-nnn: {q_trunc}", 300)
        r = run(["bash", canal, "ALERTAS", texto, "--papel", papel, "--tipo", "ALERTA"])
        if r.returncode == 0:
            # canal-append.sh ecoa a linha final "[ts] PAPEL TIPO: texto" —
            # extrai "[ts] PAPEL" pra servir de --ref caso vire RESOLVIDO depois.
            last_line = (r.stdout or "").strip().splitlines()[-1] if r.stdout else ""
            m = re.match(r"^(\[.+?\]\s+\S+)\s+ALERTA", last_line)
            if m:
                ref = m.group(1)
        else:
            print(
                f"[decisao-em-chat-guard] AVISO: canal-append.sh tambem falhou "
                f"(exit={r.returncode}): {r.stderr}",
                file=sys.stderr,
            )
    else:
        print("[decisao-em-chat-guard] AVISO: nem decisao-nova.sh nem canal-append.sh disponiveis.", file=sys.stderr)

    return {"id": None, "ref": ref, "fallback": True}


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0

    ws = os.environ.get("CMUX_WORKSPACE_ID", "")
    papel = resolve_papel(ws)
    if not papel or papel == "COMANDO":
        return 0  # sessao fora do cockpit, ou COMANDO (pergunta ao dono e' o canal legitimo)

    questions = ((data.get("tool_input") or {}).get("questions")) or []
    if not isinstance(questions, list) or not questions:
        return 0

    # A3: papeis conhecidos do registry — usado pelo filtro de trivialidade
    # (marcador "nome de papel") e pelo roteamento de RESUMO. Falha ao
    # carregar -> lista vazia (fail-open: so significa que esses 2 checks
    # ficam mais conservadores, nunca quebra o hook).
    known_papeis = load_known_papeis()

    session_id = data.get("session_id") or "nosession"
    entries = []
    for q in questions:
        if not isinstance(q, dict):
            continue
        question_text = q.get("question", "")
        if not question_text:
            continue
        options = q.get("options") or []

        if papel == "RESUMO":
            # RESUMO nunca cunha (CONDUTA.md) — tenta rotear ao papel de
            # origem citado na pergunta; senao so loga.
            routed = handle_resumo_question(question_text, known_papeis)
            entries.append({
                "question": " ".join(question_text.split()),
                "id": None,
                "ref": None,
                "resumo_routed_to": routed["target"] if routed["routed"] else None,
            })
            continue

        if is_trivial_question(question_text, known_papeis):
            print(
                f"[decisao-em-chat-guard] pergunta trivial (<{TRIVIA_MAX_LEN} "
                f"chars, sem marcador de decisao) — NAO cunhada: "
                f"{truncate(question_text, 160)}",
                file=sys.stderr,
            )
            entries.append({
                "question": " ".join(question_text.split()),
                "id": None,
                "ref": None,
                "trivial": True,
            })
            continue

        result = register_question(papel, question_text, options)
        entries.append({
            "question": " ".join(question_text.split()),
            "id": result["id"],
            "ref": result["ref"],
        })

    if not entries:
        return 0

    try:
        os.makedirs(STATE_DIR, exist_ok=True)
        state_path = os.path.join(STATE_DIR, f"{session_id}.json")
        tmp = state_path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump({"papel": papel, "ts": time.time(), "questions": entries}, f, ensure_ascii=False, indent=2)
        os.replace(tmp, state_path)
    except Exception as e:
        print(f"[decisao-em-chat-guard] AVISO: nao consegui gravar estado ({e}) — a resposta nao sera correlacionada.", file=sys.stderr)

    return 0  # NUNCA bloqueia


if __name__ == "__main__":
    sys.exit(main())
