#!/usr/bin/env python3
"""bash-cmd-normalize — normalizacao segura de comando Bash para hooks PreToolUse.

Origem do bug (2026-08-27, reportado por DE-COORD): guards que fazem match
TEXTUAL cru (`[[ "$CMD" == *"git push --force"* ]]`, grep de `pkill`, etc.)
tratam qualquer MENCAO ao padrao como se fosse execucao — ex.: escrever
documentacao via heredoc (`cat > doc.md <<'EOF' ... git push --force ... EOF`)
e bloqueado como se o comando estivesse sendo executado. 2o falso-positivo do
dia (ALERTAS.md 22:40Z).

Cura ja usada em ~/.claude/hooks/de-pr-queue-guard.py (generalizada aqui):
  1. Remover corpos de heredoc ANTES de casar (o conteudo entre `<<EOF`/`<<'EOF'`
     e o terminator nunca e "comando", e' dado literal).
  2. Exigir POSICAO DE COMANDO (inicio de comando / apos ; && || | $( — nao
     apos "echo ", nao dentro de uma string sendo passada como argumento a
     OUTRO comando) para padroes do tipo "<comando> <flag>" (git push --force,
     pkill/killall). Substring cru confunde `echo 'git push --force'` (documentacao)
     com o comando real.

Decisao de design: NAO apagamos o CONTEUDO de strings entre aspas (simples ou
duplas). Apagar o conteudo apagaria um --force passado citado (`git push
'--force'` FUNCIONA em bash — aspas nao mudam o valor do argumento) e
transformaria uma catch real em falso-negativo, que e' pior que o
falso-positivo que estamos corrigindo. Em vez disso, o parser abaixo e'
quote-aware: sabe que `;`, `&&`, `||`, `|`, `#` e quebras de linha DENTRO de
aspas nao sao separadores/comentarios reais, entao no faz a segmentacao/
remocao de comentario errada, mas preserva o texto integralmente (inclusive
aspas) para os checks de substring/flag ainda funcionarem.

API python:
  strip_heredocs(cmd)      -> remove corpos de heredoc (<<EOF / <<'EOF' / <<-EOF)
  strip_comments(text)     -> remove de '#' (fora de aspas, em posicao de
                               comentario) ate fim de linha; preserva aspas
  collapse_line_continuations(text) -> barra invertida + quebra de linha vira espaco
                               (continuacao de linha do shell)
  normalize(cmd)           -> strip_comments(collapse_line_continuations(
                               strip_heredocs(cmd))) — texto "efetivo" para
                               checks simples de substring/grep e para o
                               tokenizador (command_segments/rule_matches)
  normalize_shell_text(cmd) -> normalize(cmd) + quebras de linha remanescentes
                               viram `;` — para os checks REGEX baseados em
                               posicao (CMD_POS) que nao usam re.MULTILINE
  command_segments(text)   -> divide (fora de aspas) em "comandos simples" por
                               ; && || | e quebra de linha — para checks que
                               exigem posicao de comando
  rule_matches(cmd, name)  -> True/False para uma regra registrada em RULES
                               (hoje: "git-push-force", "pkill", "railway-kv"),
                               incluindo literais extraidos de `eval "..."`.
  find_referenced_scripts(text) -> caminhos citados via bash|sh|zsh|dash|ksh
                               <arquivo> ou source|. <arquivo>
  find_first_wrapped_match(cmd, cwd, predicate, max_depth=2)
                           -> (script_path, conteudo) do primeiro script
                               referenciado (recursivo ate max_depth, sem
                               repetir path) cujo conteudo satisfaz
                               `predicate(texto_normalizado)`; fail-open se
                               arquivo ausente/ilegivel; (None, None) se nada
                               casar.
  rule_matches_recursive(cmd, name, cwd, max_depth=2)
                           -> rule_matches no comando top-level OU em
                               qualquer script referenciado (fecha o vetor do
                               incidente #6340: `bash /tmp/x.sh` escondendo o
                               comando proibido fora do texto top-level).

Fix 2026-08-27 (2a rodada, vetor #6340 + 3 indirecoes adicionais, pedido do
dono/coordenador da fila): os guards anteriores so olhavam o comando Bash
TOP-LEVEL. Rodar o comando proibido dentro de um script (`bash /tmp/x.sh`)
ou escondido atras de `env VAR=1 <cmd>` / `VAR=1 <cmd>` (sem "env"), `xargs
<cmd>` ou `eval "<cmd literal>"` fazia o match de posicao de comando falhar
em silencio. Fechado generalizando `_effective_first_words` (env/assignment/
wrapper/xargs) + skip de opcoes globais do git (`git -C <dir> push`, `git -c
k=v push`) + extracao de literal de `eval "..."` (SO quando nao ha `$` no
literal — `eval "$CMD"` com variavel NAO e resolvivel em texto estatico,
fica documentado como limitacao, nao inventamos heuristica) + scan
recursivo (profundidade <= 2, sem repetir path) do conteudo de scripts
referenciados. NAO cobrem (limitacoes conhecidas, fora do alcance de um
guard textual): `curl | bash`, comando montado via `base64 -d | bash`,
variavel de shell contendo o comando (`CMD="git push --force"; $CMD` ou
`eval "$CMD"`), `bash -c "<literal>"` (mesma tecnica do eval serviria mas
nao foi implementada nesta rodada), e qualquer `$(...)`/substituicao
dinamica resolvida so em runtime.

CLI (stdin = comando cru, texto puro OU JSON {"tool_input":{"command":...},
"cwd":...} — schema do hook PreToolUse):
  normalize             -> stdout: comando normalizado (heredoc+comentario fora)
  check <rule-name>     -> stdout: "1" (bate a regra, TOP-LEVEL ou em script
                            referenciado — usa cwd do JSON se presente) ou "0"
  guards-info           -> stdout 12 linhas: NORM em base64 | "1"/"0"
                            (git-push-force) | "1"/"0" (pkill) | "1"/"0"
                            (railway-kv) | "1"/"0" (cmux-send, NAO recursivo
                            por desenho) | "1"/"0" (cmux-new-workspace, idem)
                            | "1"/"0" (vercel-prod) | "1"/"0" (no-verify) |
                            "1"/"0" (git-rebase-i) | "1"/"0"
                            (git-checkout-dot) | "1"/"0" (git-restore-dot) |
                            "1"/"0" (git-clean-f)
                            — as 3 primeiras flags e as 6 ultimas (fix
                            2026-08-28, achado A1) incluem o scan recursivo
                            de scripts referenciados; so as 2 flags de cmux
                            olham exclusivamente o comando TOP-LEVEL
                            (fix 2026-08-28, cockpit de terminais: os
                            scripts da factory — terminal-send.sh/open.sh —
                            chamam `cmux send`/`new-workspace` legitimamente
                            por dentro; recursar neles geraria falso-
                            positivo. O agente que digita `cmux send` DIRETO
                            no Bash e' o alvo, e esse comando sempre aparece
                            no top-level).
"""
from __future__ import annotations

import base64
import json
import os
import re
import sys

# posicao de comando para os checks REGEX (nao-tokenizados): inicio de
# comando (^ / apos ; & | ( / $( / then / do / else), tolerando UMA vez
# "env" e zero-ou-mais atribuicoes `VAR=val` (com ou sem "env" na frente —
# `env RDE_X=1 cmd` e `RDE_X=1 cmd` bare sao equivalentes no bash; fix
# 2026-08-27, vetor de indirecao reportado pelo terminal DE-MIG).
CMD_POS = (
    r"(?:^|[;&|(]|\$\(|\bthen\b|\bdo\b|\belse\b)\s*"
    r"(?:env\s+)?(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)*"
)

_HEREDOC_RE = re.compile(r"<<(-?)\s*(['\"]?)([A-Za-z_][A-Za-z0-9_]*)\2")


def strip_heredocs(cmd: str) -> str:
    """Remove corpos de heredoc (<<EOF / <<'EOF' / <<-EOF), incluindo a linha
    do terminator. Best-effort (nao e' um parser de shell completo) — mesma
    logica de ~/.claude/hooks/de-pr-queue-guard.py, generalizada para tambem
    tratar `<<-` (strip de tabs) corretamente."""
    lines = cmd.split("\n")
    kept: list[str] = []
    terminator: str | None = None
    strip_leading_tabs = False
    for line in lines:
        if terminator is not None:
            check = line.lstrip("\t") if strip_leading_tabs else line
            if check.strip() == terminator:
                terminator = None
            continue
        m = _HEREDOC_RE.search(line)
        if m:
            terminator = m.group(3)
            strip_leading_tabs = m.group(1) == "-"
        kept.append(line)
    return "\n".join(kept)


def strip_comments(text: str) -> str:
    """Remove de `#` (fora de aspas, precedido por espaco/inicio-de-linha) ate
    o fim da linha. Quote-aware: '#' dentro de aspas simples/duplas NAO inicia
    comentario em bash. Preserva quebras de linha e o restante do texto
    (inclusive aspas) intacto."""
    out: list[str] = []
    i, n = 0, len(text)
    in_single = in_double = False
    at_boundary = True
    while i < n:
        c = text[i]
        if in_single:
            out.append(c)
            if c == "'":
                in_single = False
            i += 1
            continue
        if in_double:
            if c == "\\" and i + 1 < n:
                out.append(c)
                out.append(text[i + 1])
                i += 2
                continue
            out.append(c)
            if c == '"':
                in_double = False
            i += 1
            continue
        if c == "'":
            in_single = True
            out.append(c)
            i += 1
            at_boundary = False
            continue
        if c == '"':
            in_double = True
            out.append(c)
            i += 1
            at_boundary = False
            continue
        if c == "\\" and i + 1 < n:
            out.append(c)
            out.append(text[i + 1])
            i += 2
            at_boundary = False
            continue
        if c == "#" and at_boundary:
            nl = text.find("\n", i)
            if nl == -1:
                break
            i = nl  # deixa o '\n' ser processado na proxima iteracao
            continue
        if c.isspace():
            at_boundary = True
            out.append(c)
            i += 1
            continue
        at_boundary = False
        out.append(c)
        i += 1
    return "".join(out)


def collapse_line_continuations(text: str) -> str:
    """Colapsa `\\` + quebra de linha em um espaco (continuacao de linha do
    shell), igual o shell interpreta antes de tokenizar. Sem isso, um comando
    real formatado em multiplas linhas com `\\` no fim de cada uma (ex.:
    incidente #6340: `git -C <dir> \\` + newline + `push \\` + newline +
    `--force-with-lease=... \\` + newline + `origin ...`) produz tokens
    espurios (a barra invertida sobra como 'palavra' isolada) que desalinham
    a deteccao baseada em posicao de palavra (_effective_first_words)."""
    return re.sub(r"\\\r?\n[ \t]*", " ", text)


def normalize(cmd: str) -> str:
    """Texto 'efetivo' do comando: sem corpos de heredoc, sem continuacao de
    linha, sem comentarios fora de aspas. Aspas e conteudo citado permanecem
    intactos (ver docstring do modulo — nao apagamos strings para nao
    mascarar flag real citada)."""
    return strip_comments(collapse_line_continuations(strip_heredocs(cmd)))


def normalize_shell_text(cmd: str) -> str:
    """Texto para os checks REGEX baseados em posicao (CMD_POS): igual a
    normalize(), mas quebras de linha REMANESCENTES (nao eram continuacao —
    ja colapsada acima) viram `;`. Necessario porque `^` de regex (sem
    re.MULTILINE) so ancora no INICIO da string inteira, e newline pura nao
    esta na classe CMD_POS `[;&|(]` — sem isso, um comando/script real
    multi-linha (`cmd1\\ncmd2`) so teria a PRIMEIRA linha reconhecida como
    'posicao de comando'. O engine por TOKEN (rule_matches/command_segments)
    ja trata newline como separador nativamente e nao precisa disso."""
    text = normalize(cmd)
    return text.replace("\r\n", "\n").replace("\n", ";")


def command_segments(text: str) -> list[str]:
    """Divide `text` (ja normalizado — sem heredoc/comentario) em 'comandos
    simples' por `;`, `&&`, `||`, `|` e quebra de linha, respeitando aspas
    (um separador DENTRO de aspas nao quebra segmento — evita o falso-positivo
    classico de `echo 'ok; rm -rf /'` virar 2 segmentos)."""
    segments: list[str] = []
    buf: list[str] = []
    i, n = 0, len(text)
    in_single = in_double = False
    while i < n:
        c = text[i]
        if in_single:
            buf.append(c)
            if c == "'":
                in_single = False
            i += 1
            continue
        if in_double:
            if c == "\\" and i + 1 < n:
                buf.append(c)
                buf.append(text[i + 1])
                i += 2
                continue
            buf.append(c)
            if c == '"':
                in_double = False
            i += 1
            continue
        if c == "'":
            in_single = True
            buf.append(c)
            i += 1
            continue
        if c == '"':
            in_double = True
            buf.append(c)
            i += 1
            continue
        if c == "\\" and i + 1 < n:
            buf.append(c)
            buf.append(text[i + 1])
            i += 2
            continue
        if text[i : i + 2] in ("&&", "||"):
            segments.append("".join(buf))
            buf = []
            i += 2
            continue
        if c in ";\n|":
            segments.append("".join(buf))
            buf = []
            i += 1
            continue
        buf.append(c)
        i += 1
    segments.append("".join(buf))
    return [s.strip() for s in segments if s.strip()]


def _unquote(tok: str) -> str:
    if len(tok) >= 2 and tok[0] == tok[-1] and tok[0] in ("'", '"'):
        return tok[1:-1]
    return tok


def _tokenize_prefix(segment: str, max_tokens: int) -> list[str]:
    """Tokeniza os primeiros `max_tokens` tokens de um segmento, respeitando
    aspas (nao quebra token no meio de uma string citada). Tokens sao
    'des-aspados' antes de retornar (valor efetivo do argumento)."""
    tokens: list[str] = []
    buf: list[str] = []
    i, n = 0, len(segment)
    in_single = in_double = False
    while i < n and len(tokens) < max_tokens:
        c = segment[i]
        if in_single:
            buf.append(c)
            if c == "'":
                in_single = False
            i += 1
            continue
        if in_double:
            if c == "\\" and i + 1 < n:
                buf.append(c)
                buf.append(segment[i + 1])
                i += 2
                continue
            buf.append(c)
            if c == '"':
                in_double = False
            i += 1
            continue
        if c.isspace():
            if buf:
                tokens.append("".join(buf))
                buf = []
            i += 1
            continue
        if c == "'":
            in_single = True
            buf.append(c)
            i += 1
            continue
        if c == '"':
            in_double = True
            buf.append(c)
            i += 1
            continue
        buf.append(c)
        i += 1
    if buf and len(tokens) < max_tokens:
        tokens.append("".join(buf))
    return [_unquote(t) for t in tokens]


_WRAPPERS = {"sudo", "nice", "time", "eval"}

# opcoes globais do git que podem aparecer entre `git` e o subcomando (`-C
# <dir>`, `-c chave=valor` — token separado; `--git-dir=`, `--work-tree=`,
# `--namespace=` — valor colado no proprio token). Fix 2026-08-27: sem isso,
# `git -C <worktree> push --force` (incidente #6340) tinha ("git","-C") como
# primeiras palavras efetivas em vez de ("git","push") e escapava da regra.
_GIT_GLOBAL_OPT_WITH_ARG = {"-C", "-c"}
_GIT_GLOBAL_OPT_SINGLE_RE = re.compile(r"^(?:--git-dir=|--work-tree=|--namespace=)")


def _skip_git_global_opts(toks: list[str], idx: int) -> int:
    while idx < len(toks):
        t = toks[idx]
        if t in _GIT_GLOBAL_OPT_WITH_ARG:
            idx += 2  # flag + seu argumento (token separado)
            continue
        if _GIT_GLOBAL_OPT_SINGLE_RE.match(t):
            idx += 1
            continue
        break
    return idx


def _effective_first_words(segment: str, max_words: int) -> list[str]:
    """Primeiras `max_words` palavras 'reais' do segmento: ignora agrupadores
    iniciais `(`/`$(`, keywords de shell (then/do/else/elif/if/while/until),
    wrappers simples (sudo, nice, time, eval), atribuicoes de variavel
    (`VAR=val`, com ou sem `env` na frente — `env VAR=1 cmd` E `VAR=1 cmd`
    bare sao equivalentes no bash) e `xargs [flags...]` antes de tokenizar.
    Quando a palavra restante e' `git`, tambem pula opcoes globais do git
    (`-C <dir>`, `-c k=v`, `--git-dir=`, `--work-tree=`, `--namespace=`)
    antes de expor o subcomando (`push`) como 2a palavra efetiva."""
    s = segment.strip()
    s = re.sub(r"^(?:\(|\$\()+\s*", "", s)
    s = re.sub(r"^(?:then|do|else|elif|if|while|until)\b\s*", "", s)
    # buffer generoso: env/atribuicoes + xargs+flags + opcoes globais do git
    # podem consumir varios tokens antes da palavra que realmente importa.
    toks = _tokenize_prefix(s, max_tokens=max_words + 20)
    idx = 0
    while idx < len(toks):
        t = toks[idx]
        if t == "env":
            idx += 1
            continue
        if re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", t):
            idx += 1
            continue
        if t in _WRAPPERS:
            idx += 1
            continue
        if t == "xargs":
            idx += 1
            while idx < len(toks) and toks[idx].startswith("-"):
                idx += 1
            continue
        break
    if idx < len(toks) and toks[idx] == "git":
        git_idx = _skip_git_global_opts(toks, idx + 1)
        return ["git"] + toks[git_idx : git_idx + max_words - 1]
    return toks[idx : idx + max_words]


# `eval "git push --force ..."` / `eval 'git push --force ...'` — extrai o
# literal QUANDO nao ha `$` dentro (referencia a variavel nao e' resolvivel
# em texto estatico: `eval "$CMD"` fica de fora, documentado como limitacao).
# `eval git push --force` (sem aspas) ja e' coberto de graca por "eval" estar
# em _WRAPPERS (tokeniza normalmente, sem essa extracao).
_EVAL_LITERAL_RE = re.compile(
    CMD_POS + r"eval\s+(?P<q>['\"])(?P<body>(?:\\.|(?!(?P=q)).)*)(?P=q)"
)


def extract_eval_literal_segments(text: str) -> list[str]:
    """Extrai o argumento de `eval \"...\"` / `eval '...'` quando e' um
    LITERAL estatico (sem `$` dentro) e devolve como segmentos 'virtuais'
    adicionais para os mesmos checks baseados em regra rodarem sobre ele.
    `text` deve vir de normalize() (heredoc/comentario ja fora)."""
    out: list[str] = []
    for m in _EVAL_LITERAL_RE.finditer(text):
        body = m.group("body")
        if "$" in body:
            continue  # variavel/substituicao — nao coberto por design
        out.extend(command_segments(body))
    return out


RULES = {
    # git push --force / --force-with-lease / -f — so conta se "git push" e' o
    # PROPRIO comando do segmento (nao um argumento citado a echo/printf/etc.)
    "git-push-force": {
        "words": [("git", "push")],
        "flag": re.compile(r"--force\b|(?:^|\s)-f(?:\s|$)"),
    },
    # pkill/killall como comando do segmento (nao texto passado a outro comando)
    "pkill": {
        "words": [("pkill",), ("killall",)],
        "flag": None,
    },
    # railway variables --kv vaza secrets em texto puro no output/transcript
    # (paridade com de-parity-guard.py do Codex — nao existia no lado Claude).
    "railway-kv": {
        "words": [("railway", "variables")],
        "flag": re.compile(r"--kv\b"),
    },
    # cmux send/send-key/new-workspace CRU (auditoria 2026-08-28: 15 sends
    # crus em 48h, 8 do proprio DE-COORD, bypassando o marcador de destino
    # e o log de terminal-send.sh). "words" so exige o 1o token ser "cmux"
    # (ou o basename de um path terminando em /cmux — ver rule_matches);
    # o subcomando e checado via "flag" (regex no segmento inteiro) porque
    # `cmux --json new-workspace ...` tem uma flag global ANTES do
    # subcomando — checar so a 2a palavra tokenizada perderia esse caso.
    "cmux-send": {
        "words": [("cmux",)],
        "flag": re.compile(r"(?:^|\s)send(?:-key)?\b"),
    },
    "cmux-new-workspace": {
        "words": [("cmux",)],
        "flag": re.compile(r"\bnew-workspace\b"),
    },
    # --- fix 2026-08-28 (A1, achado critico pre-existente da auditoria): as 6
    # regras abaixo eram `[[ "$NORM" == *"..."* ]]` (substring cru) em
    # bash-guards.sh — qualquer MENCAO textual ("echo 'vercel --prod e
    # perigoso'", "git commit -m 'explica git checkout -- .'") bloqueava como
    # se fosse execucao real. Migradas para o mesmo mecanismo de posicao-de-
    # comando das regras acima (git-push-force/pkill/railway-kv/cmux-*).
    #
    # vercel --prod: tupla de 2 palavras adjacentes (fiel ao substring
    # original "vercel --prod" — nao amplia para `vercel deploy --prod`,
    # que o substring original tambem nao cobria).
    "vercel-prod": {
        "words": [("vercel", "--prod")],
        "flag": None,
    },
    # --no-verify: so em `git commit`/`git push` (unicos subcomandos onde a
    # flag bypassa hook de seguranca). flag_mode="token" (em vez do
    # regex.search(seg) das regras acima) porque `git commit` aceita `-m
    # "<mensagem livre>"` — uma mensagem que MENCIONA --no-verify vira 1
    # token so (quote-aware) e nao bate == "--no-verify"; regex.search cru
    # bateria a substring dentro da mensagem citada (falso-positivo real,
    # diferente de push/pkill/rebase/checkout/restore/clean, que nao tem
    # argumento de texto livre equivalente).
    "no-verify": {
        "words": [("git", "commit"), ("git", "push")],
        "flag": re.compile(r"^--no-verify$"),
        "flag_mode": "token",
    },
    # git rebase -i / --interactive (nao suportado, destrutivo). Cobre
    # combos curtos tipo -ip (prefixo -i) igual o substring original cobria.
    "git-rebase-i": {
        "words": [("git", "rebase")],
        "flag": re.compile(r"(?:^|\s)-i\S*(?:\s|$)|--interactive\b"),
    },
    # git checkout -- . / git checkout -- * — tupla de 4 palavras adjacentes
    # (fiel aos 2 substrings originais).
    "git-checkout-dot": {
        "words": [("git", "checkout", "--", "."), ("git", "checkout", "--", "*")],
        "flag": None,
    },
    # git restore . — tupla de 3 palavras adjacentes (fiel ao substring
    # original "git restore ." — nao amplia para `git restore --staged .`).
    "git-restore-dot": {
        "words": [("git", "restore", ".")],
        "flag": None,
    },
    # git clean -f (e combos tipo -fd/-fx, prefixo -f) — fiel ao substring
    # original, que tambem so cobria prefixo -f (nao "--force" nem "-df").
    "git-clean-f": {
        "words": [("git", "clean")],
        "flag": re.compile(r"(?:^|\s)-f\S*(?:\s|$)"),
    },
}


def rule_matches(cmd: str, rule_name: str) -> bool:
    rule = RULES[rule_name]
    max_words = max(len(w) for w in rule["words"])
    norm = normalize(cmd)
    segments = command_segments(norm)
    segments += extract_eval_literal_segments(norm)
    for seg in segments:
        words = tuple(_effective_first_words(seg, max_words))
        # Variante por basename do 1o token: cobre chamada por path absoluto
        # (`/Applications/cmux.app/.../bin/cmux send ...`) alem do bare
        # `cmux send ...` que depende de PATH/alias. Aditivo (so amplia
        # match), nao muda comportamento de regra nenhuma pre-existente.
        candidates = [words]
        if words:
            base0 = words[0].rsplit("/", 1)[-1]
            if base0 != words[0]:
                candidates.append((base0,) + words[1:])
        for w in candidates:
            for want in rule["words"]:
                if w[: len(want)] == want:
                    flag = rule["flag"]
                    if flag is None:
                        return True
                    if rule.get("flag_mode") == "token":
                        # exact-token match: tokeniza o segmento inteiro
                        # (quote-aware — string citada vira 1 token so) e
                        # exige que a flag seja um token proprio, nunca uma
                        # substring dentro de um argumento livre citado
                        # (ex.: git commit -m "texto com --no-verify dentro").
                        toks = _tokenize_prefix(seg, max_tokens=500)
                        if any(flag.fullmatch(t) for t in toks):
                            return True
                    elif flag.search(seg):
                        return True
    return False


MAX_SCRIPT_SCAN_BYTES = 200_000

# interpretadores que rodam um arquivo de script como argumento — usado para
# detectar a indirecao `bash /tmp/script.sh` (comando top-level nao contem a
# substring proibida; o conteudo do script contem). Portado de
# ~/Claude/.codex/hooks/de-parity-guard.py (incidente #6340, 27/08).
_INTERP_SCRIPT_RE = re.compile(
    CMD_POS + r"(?:\S*/)?(?:bash|sh|zsh|dash|ksh)\s+(?:-\S+\s+)*(?P<path>[^\s;&|<>]+)"
)
_DOT_SCRIPT_RE = re.compile(
    CMD_POS + r"(?:source|\.)\s+(?P<path>[^\s;&|<>]+)"
)


def find_referenced_scripts(text: str) -> list[str]:
    """Extrai caminhos de scripts que o comando executa via interpretador
    (`bash|sh|zsh|dash|ksh <arquivo>`) ou via `source|. <arquivo>`. `text`
    deve vir de normalize_shell_text() (heredoc/comentario fora, quebra de
    linha virou `;`) para o CMD_POS casar em cada linha de um script/comando
    multi-linha."""
    paths = []
    for rx in (_INTERP_SCRIPT_RE, _DOT_SCRIPT_RE):
        for m in rx.finditer(text):
            p = m.group("path")
            if p and not p.startswith("-"):
                paths.append(p)
    return paths


def resolve_script_path(p: str, cwd: str) -> str:
    expanded = os.path.expanduser(p)
    path = expanded if os.path.isabs(expanded) else os.path.join(cwd or ".", expanded)
    return os.path.normpath(path)


def find_first_wrapped_match(cmd: str, cwd: str, predicate, max_depth: int = 2):
    """Percorre scripts referenciados (bash/sh/zsh/dash/ksh/source/.) a partir
    de `cmd`, ate profundidade `max_depth` (script A -> script B citado
    dentro de A -> para; nao segue um 3o nivel), aplicando
    `predicate(conteudo_bruto) -> bool` ao conteudo de cada um. Retorna
    `(script_path, conteudo)` do PRIMEIRO que casar, ou `(None, None)`.
    Fail-open: arquivo ausente/ilegivel/erro de qualquer tipo -> pula esse
    caminho, nunca levanta excecao. Protege contra loop (script que
    referencia a si mesmo ou um ciclo A<->B): nunca repete o mesmo path
    RESOLVIDO (absoluto) na mesma cadeia, alem do teto de profundidade."""
    return _find_first_wrapped_match(cmd, cwd, predicate, max_depth, set())


def _find_first_wrapped_match(cmd, cwd, predicate, depth_left, seen):
    if depth_left <= 0:
        return None, None
    try:
        candidates = find_referenced_scripts(normalize_shell_text(cmd))
    except Exception:
        return None, None
    for script_path in candidates:
        try:
            resolved = resolve_script_path(script_path, cwd)
        except Exception:
            continue
        if resolved in seen:
            continue
        seen.add(resolved)
        try:
            if not os.path.isfile(resolved):
                continue
            with open(resolved, "r", errors="replace") as f:
                content = f.read(MAX_SCRIPT_SCAN_BYTES)
        except Exception:
            continue  # fail-open: arquivo ausente/ilegivel nao bloqueia
        # heredoc/comentario fora ANTES do predicate — mesma protecao anti
        # falso-positivo do resto do modulo (script que so MENCIONA o padrao
        # dentro de um heredoc/comentario, ex.: usado para GERAR outro
        # arquivo, nao deve casar). rule_matches() ja normaliza por conta
        # propria (double-normalize e' no-op ali); predicates regex crus
        # (de-pr-queue-guard.py) dependiam disso e SEM esta linha geravam
        # falso-positivo (visto ao vivo: run_tests.sh bloqueado por um
        # heredoc que so ESCREVIA outro script de teste).
        content_norm = normalize(content)
        try:
            hit = predicate(content_norm)
        except Exception:
            hit = False
        if hit:
            return script_path, content_norm
        nested_path, nested_content = _find_first_wrapped_match(
            content, cwd, predicate, depth_left - 1, seen
        )
        if nested_path is not None:
            return nested_path, nested_content
    return None, None


def rule_matches_recursive(cmd: str, rule_name: str, cwd: str, max_depth: int = 2) -> bool:
    """rule_matches no comando TOP-LEVEL, OU (se nao bater ali) em qualquer
    script referenciado via bash/sh/zsh/dash/ksh/source/. (recursivo, ate
    max_depth, sem repetir path) — fecha o vetor do incidente #6340."""
    if rule_matches(cmd, rule_name):
        return True
    hit_path, _ = find_first_wrapped_match(
        cmd, cwd, lambda text: rule_matches(text, rule_name), max_depth
    )
    return hit_path is not None


def _read_stdin_payload() -> tuple[str, str]:
    """Retorna (command, cwd) do stdin. Aceita JSON
    {"tool_input":{"command":...}, "cwd":...} (schema do hook PreToolUse) ou
    texto puro (cwd vazio nesse caso)."""
    raw = sys.stdin.read()
    try:
        data = json.loads(raw)
    except Exception:
        return raw, ""
    if isinstance(data, dict):
        cmd = (data.get("tool_input") or {}).get("command")
        if cmd is None:
            cmd = data.get("command")
        cwd = data.get("cwd") or ""
        return cmd or "", cwd
    return raw, ""


def _read_stdin_command() -> str:
    return _read_stdin_payload()[0]


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        sys.stderr.write("usage: bash-cmd-normalize.py {normalize|check <rule>|guards-info}\n")
        return 2
    mode = argv[1]
    cmd, cwd = _read_stdin_payload()

    if mode == "normalize":
        sys.stdout.write(normalize(cmd))
        return 0

    if mode == "check":
        if len(argv) < 3 or argv[2] not in RULES:
            sys.stderr.write("usage: check <rule-name> (rules: %s)\n" % ", ".join(RULES))
            return 2
        print("1" if rule_matches_recursive(cmd, argv[2], cwd) else "0")
        return 0

    if mode == "guards-info":
        norm = normalize(cmd)
        force = rule_matches_recursive(cmd, "git-push-force", cwd)
        pkill = rule_matches_recursive(cmd, "pkill", cwd)
        railway_kv = rule_matches_recursive(cmd, "railway-kv", cwd)
        # NAO recursivo (ver comentario em RULES): so top-level.
        cmux_send = rule_matches(cmd, "cmux-send")
        cmux_new_ws = rule_matches(cmd, "cmux-new-workspace")
        # fix 2026-08-28 (A1): as 6 regras migradas de substring cru em
        # bash-guards.sh — recursivas (mesmo fechamento de indirecao das 3
        # primeiras: `bash /tmp/x.sh` escondendo o comando nao escapa mais).
        vercel_prod = rule_matches_recursive(cmd, "vercel-prod", cwd)
        no_verify = rule_matches_recursive(cmd, "no-verify", cwd)
        git_rebase_i = rule_matches_recursive(cmd, "git-rebase-i", cwd)
        git_checkout_dot = rule_matches_recursive(cmd, "git-checkout-dot", cwd)
        git_restore_dot = rule_matches_recursive(cmd, "git-restore-dot", cwd)
        git_clean_f = rule_matches_recursive(cmd, "git-clean-f", cwd)
        print(base64.b64encode(norm.encode()).decode())
        print("1" if force else "0")
        print("1" if pkill else "0")
        print("1" if railway_kv else "0")
        print("1" if cmux_send else "0")
        print("1" if cmux_new_ws else "0")
        print("1" if vercel_prod else "0")
        print("1" if no_verify else "0")
        print("1" if git_rebase_i else "0")
        print("1" if git_checkout_dot else "0")
        print("1" if git_restore_dot else "0")
        print("1" if git_clean_f else "0")
        return 0

    sys.stderr.write("unknown mode: %s\n" % mode)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
