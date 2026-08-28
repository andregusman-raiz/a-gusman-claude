#!/usr/bin/env bash
# de-prs-tui.sh — painel de PRs do Data Engine (raiz-data-engine) para o Dock do cmux.
#
# LEITURA PURA: nunca chama `gh`. As 4 fontes ficam em DE_PR_QUEUE_DIR (default
# ~/Claude/docs/ai-state/de-pr-queue), todas alimentadas por outros processos:
#   claims.json               -> claim ativo por branch (pr, terminal, frente, status, claimed_at)
#   .claims-sync-state.json   -> gh_cache: por PR {reviewDecision, mergeable, title, fetched_at}
#                                 (TTL 10min, alimentado por de-claims-sync.sh)
#   ROADMAP.md                -> secao "## Imediato" (copia literal da "Fila em 5 linhas")
#   QUEUE.md                  -> fallback do "Imediato" se ROADMAP.md faltar/nao tiver a secao
#
# Se o gh_cache estiver frio (>10min) o painel MOSTRA a idade e um aviso — nunca
# busca sozinho (quem atualiza e de-claims-sync.sh, rodando em outro processo).
#
# Degradacao: fonte ausente/ilegivel -> a secao correspondente diz explicitamente
# "sem dado (arquivo X ausente)" e o script continua (exit 0); nunca inventa valor
# (campo ausente = "—"), nunca esvazia a tela sem explicar o motivo.
#
# Largura adaptativa: `${COLUMNS:-$(tput cols)}` (COLUMNS explicito, ex. em teste,
# sempre vence; senao usa o tamanho real do terminal do Dock).
set -euo pipefail

Q="${DE_PR_QUEUE_DIR:-$HOME/Claude/docs/ai-state/de-pr-queue}"
REFRESH="${DE_PRS_TUI_REFRESH:-30}"
ONCE=0
NO_ROADMAP=0

usage() {
  cat <<'EOF'
Uso: de-prs-tui.sh [--once] [--no-roadmap] [--refresh N] [--help]

Painel de terminal (Dock do cmux) com os PRs ativos do raiz-data-engine.
So le disco (claims.json, .claims-sync-state.json, ROADMAP.md/QUEUE.md) —
nunca chama `gh`. Pensado para rodar como Dock control (loop proprio) ou
uma vez so via --once (testes/pipe).

Flags:
  --once          imprime uma vez e sai (nao entra no loop de refresh)
  --no-roadmap    omite a secao "ROADMAP · imediato" (so a lista de PRs)
  --refresh N     segundos entre redesenhos no modo loop (default: 30,
                  ou DE_PRS_TUI_REFRESH)
  --help, -h      esta mensagem

Variaveis de ambiente:
  DE_PR_QUEUE_DIR     diretorio das 4 fontes (default ~/Claude/docs/ai-state/de-pr-queue)
  DE_PRS_TUI_REFRESH  default do --refresh
  COLUMNS             forca a largura do layout (senao usa `tput cols`)

Sai limpo (sem processo orfao) em SIGINT/SIGTERM. Exit code sempre 0, mesmo
com fonte ausente — degradacao e reportada dentro do painel, nunca por
codigo de saida (o painel roda em loop no Dock; sair com erro so derrubaria
o control sem avisar o dono).
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --once) ONCE=1; shift ;;
    --no-roadmap) NO_ROADMAP=1; shift ;;
    --refresh)
      [[ $# -ge 2 ]] || { echo "de-prs-tui.sh: --refresh exige um valor" >&2; exit 2; }
      REFRESH="$2"; shift 2 ;;
    --help|-h) usage; exit 0 ;;
    *) echo "de-prs-tui.sh: arg desconhecido: $1" >&2; usage >&2; exit 2 ;;
  esac
done

case "$REFRESH" in
  ''|*[!0-9]*) echo "de-prs-tui.sh: --refresh precisa ser inteiro positivo (recebido: '$REFRESH')" >&2; exit 2 ;;
esac
[[ "$REFRESH" -ge 1 ]] || { echo "de-prs-tui.sh: --refresh precisa ser >= 1" >&2; exit 2; }

render_once() {
  local width
  width="${COLUMNS:-$(tput cols 2>/dev/null || echo 80)}"
  case "$width" in
    ''|*[!0-9]*) width=80 ;;
  esac

  COLUMNS="$width" DE_PRS_TUI_Q="$Q" DE_PRS_TUI_NO_ROADMAP="$NO_ROADMAP" MAX_FRENTES="${DE_PRS_TUI_MAX_FRENTES:-6}" python3 <<'PYEOF'
import json, os, re, sys, time, textwrap
from datetime import datetime, timezone

Q = os.environ["DE_PRS_TUI_Q"]
NO_ROADMAP = os.environ.get("DE_PRS_TUI_NO_ROADMAP") == "1"
try:
    WIDTH = int(os.environ.get("COLUMNS", "80"))
except ValueError:
    WIDTH = 80
WIDTH = max(WIDTH, 40)

CLAIMS = os.path.join(Q, "claims.json")
STATE = os.path.join(Q, ".claims-sync-state.json")
ROADMAP_MD = os.path.join(Q, "ROADMAP.md")
QUEUE_MD = os.path.join(Q, "QUEUE.md")

TERMINAL_STATUSES = {"merged", "closed", "cancelado-dedup", "closed-nao-remendar"}
CACHE_TTL_MIN = 10
ROADMAP_STALE_MIN = 60
COMPACT_THRESHOLD = 70
MAX_FRENTES = int(os.environ.get("MAX_FRENTES", "6"))
MAX_ITEMS = 3
PR_W, STATUS_W, AGE_W = 6, 18, 4

avisos = []


def now_utc():
    return datetime.now(timezone.utc)


def parse_iso(ts):
    if not ts or not isinstance(ts, str):
        return None
    t = ts.strip().replace("Z", "+00:00")
    if " " in t and "T" not in t:
        t = t.replace(" ", "T", 1)
    try:
        d = datetime.fromisoformat(t)
        if d.tzinfo is None:
            d = d.replace(tzinfo=timezone.utc)
        return d
    except Exception:
        return None


def age_minutes(dt):
    if dt is None:
        return None
    return (now_utc() - dt).total_seconds() / 60.0


def age_minutes_of_file(path):
    try:
        return (time.time() - os.path.getmtime(path)) / 60.0
    except OSError:
        return None


def age_short(m):
    """Idade curta ('2h','4h','3d') a partir de minutos. None -> '—'."""
    if m is None:
        return "—"
    if m < 0:
        m = 0
    if m < 60:
        return f"{round(m)}min"
    h = m / 60.0
    if h < 48:
        return f"{round(h)}h"
    return f"{round(h / 24.0)}d"


def age_label(m):
    """Idade para o cabecalho ('3min','1.4h'). None -> 'desconhecida'."""
    if m is None:
        return "desconhecida"
    if m < 60:
        return f"{m:.0f}min"
    return f"{m / 60.0:.1f}h"


def truncate(s, n):
    s = s or ""
    if len(s) <= n:
        return s
    if n <= 1:
        return s[:n]
    return s[: n - 1].rstrip() + "…"


def read_text(path):
    try:
        with open(path, encoding="utf-8") as f:
            return f.read()
    except OSError:
        return None


# ---------------------------------------------------------------- claims.json
claims = {}
claims_unavailable = False
if not os.path.isfile(CLAIMS):
    claims_unavailable = True
    avisos.append(f"claims.json ausente ({CLAIMS}) — sem PRs para listar")
else:
    try:
        with open(CLAIMS, encoding="utf-8") as f:
            data = json.load(f)
        claims = data.get("claims", {}) if isinstance(data, dict) else {}
        if not isinstance(claims, dict):
            claims = {}
    except Exception as e:
        claims_unavailable = True
        avisos.append(f"claims.json ilegivel ({type(e).__name__}) — sem PRs para listar")

# --------------------------------------------------- .claims-sync-state.json
cache = {}
cache_missing = not os.path.isfile(STATE)
if cache_missing:
    avisos.append(f".claims-sync-state.json ausente ({STATE}) — status/mergeable vem so do claims.json")
else:
    try:
        with open(STATE, encoding="utf-8") as f:
            state_data = json.load(f)
        cache = state_data.get("gh_cache", {}) if isinstance(state_data, dict) else {}
        if not isinstance(cache, dict):
            cache = {}
    except Exception as e:
        avisos.append(f".claims-sync-state.json ilegivel ({type(e).__name__}) — status/mergeable vem so do claims.json")

cache_ages = []
for entry in cache.values():
    if isinstance(entry, dict):
        m = age_minutes(parse_iso(entry.get("fetched_at")))
        if m is not None:
            cache_ages.append(m)
freshest_cache_age = min(cache_ages) if cache_ages else None
if freshest_cache_age is not None and freshest_cache_age > CACHE_TTL_MIN:
    avisos.append(
        f"gh_cache com {age_label(freshest_cache_age)} (> {CACHE_TTL_MIN}min) — rode de-claims-sync, este painel nao busca sozinho"
    )
elif freshest_cache_age is None and not cache_missing:
    avisos.append("gh_cache vazio (.claims-sync-state.json sem entradas) — status/mergeable vem so do claims.json")

# ------------------------------------------------------------------- linhas
rows = []
for branch, c in claims.items():
    if not isinstance(c, dict):
        continue
    status_raw = c.get("status")
    if status_raw in TERMINAL_STATUSES:
        continue
    pr = c.get("pr")
    if not isinstance(pr, int):
        continue
    entry = cache.get(str(pr))
    entry = entry if isinstance(entry, dict) else {}
    review = entry.get("reviewDecision") or ""
    mergeable = entry.get("mergeable") or ""
    status_text = review if review else (status_raw or "—")
    blocked = mergeable == "CONFLICTING"
    # ordem de urgencia do plano: bloqueado -> CHANGES_REQUESTED -> REVIEW_REQUIRED
    # -> APPROVED -> draft/resto. "bloqueado" (CONFLICTING) e o topo, incondicional.
    if blocked:
        rank = 0
    elif review == "CHANGES_REQUESTED":
        rank = 1
    elif review == "REVIEW_REQUIRED":
        rank = 2
    elif review == "APPROVED":
        rank = 3
    else:
        rank = 5
    dt = parse_iso(c.get("claimed_at"))
    am = age_minutes(dt)
    rows.append({
        "pr": pr,
        "status": status_text,
        "blocked": blocked,
        "rank": rank,
        "age": age_short(am),
        "age_sort": am if am is not None else 0.0,
        "terminal": c.get("terminal") or "—",
        "frente": c.get("frente") or "sem frente",
    })

rows.sort(key=lambda r: (r["rank"], -r["age_sort"], r["pr"]))

COMPACT = WIDTH < COMPACT_THRESHOLD


def render_row(r):
    marker = " ⛔" if r["blocked"] else ""
    if COMPACT:
        status = truncate(r["status"], max(6, WIDTH - 14))
        l1 = truncate(f"#{r['pr']} {status}{marker}  {r['age']}", WIDTH)
        rest = max(6, WIDTH - 6)
        term_w = max(6, rest // 2)
        term = truncate(r["terminal"], term_w)
        frente_w = max(4, WIDTH - 6 - len(term) - 3)
        frente = truncate(r["frente"], frente_w)
        l2 = truncate(f"  {term} · {frente}", WIDTH)
        return [l1, l2]
    pr_s = f"#{r['pr']}"
    status_s = truncate(r["status"], STATUS_W)
    rest = WIDTH - (PR_W + 1 + STATUS_W + 1 + AGE_W + 1)
    rest = max(rest, 12)
    term_w = max(8, rest // 2)
    frente_w = max(6, rest - term_w - 3)
    term_s = truncate(r["terminal"], term_w)
    frente_s = truncate(r["frente"], frente_w)
    line = f"{pr_s:<{PR_W}} {status_s:<{STATUS_W}} {r['age']:<{AGE_W}} {term_s:<{term_w}} {frente_s}{marker}"
    return [truncate(line, WIDTH)]


# --------------------------------------------------------------- roadmap
def extract_imediato(text):
    m = re.search(r"(?ms)^## Imediato\s*\n(.*?)(?=\n## )", text)
    if m:
        return m.group(1).strip("\n")
    m = re.search(r"(?ms)^## \S*\s*Fila em 5 linhas.*?(?=\n## |\Z)", text)
    return m.group(0).strip("\n") if m else None


def extract_frentes(text):
    """Secao '## Frentes' do ROADMAP.md: frente -> itens.

    Ja e calculada pelo roadmap-render.sh (claims nao-merged por frente, com
    'bloqueado por' vindo do cache do gh) e nunca era exibida. E a metade do
    roadmap que responde ONDE cada frente esta; o '## Imediato' so responde o hoje.
    """
    m = re.search(r"(?ms)^## Frentes\s*\n(.*?)(?=\n## |\Z)", text or "")
    if not m:
        return []
    frentes, atual = [], None
    for ln in m.group(1).split("\n"):
        t = ln.strip()
        if not t:
            continue
        mf = re.match(r"^\*\*(.+?)\*\*$", t)
        if mf:
            atual = {"nome": mf.group(1).strip(), "itens": []}
            frentes.append(atual)
        elif t.startswith("-") and atual is not None:
            atual["itens"].append(t.lstrip("- ").strip())
    return frentes


def extract_resumo(block):
    if not block:
        return None
    m = re.search(r">\s*\*\*(.+?)\*\*", block)
    return m.group(1).strip() if m else None


def numbered_items(block):
    if not block:
        return []
    return re.findall(r"(?m)^\d+\.\s+(.*)$", block)


def clean_md(s):
    s = re.sub(r"\*\*(.+?)\*\*", r"\1", s)
    s = s.replace("`", "")
    return re.sub(r"\s+", " ", s).strip()


roadmap_text = None
roadmap_source = None
roadmap_age_min = None
if not NO_ROADMAP:
    if os.path.isfile(ROADMAP_MD):
        roadmap_text = read_text(ROADMAP_MD)
        if roadmap_text is not None:
            roadmap_source = "ROADMAP.md"
            roadmap_age_min = age_minutes_of_file(ROADMAP_MD)
    if roadmap_text is None and os.path.isfile(QUEUE_MD):
        roadmap_text = read_text(QUEUE_MD)
        if roadmap_text is not None:
            roadmap_source = "QUEUE.md (fallback)"
            roadmap_age_min = age_minutes_of_file(QUEUE_MD)
    if roadmap_text is None:
        avisos.append(f"ROADMAP.md e QUEUE.md ausentes em {Q} — sem secao de roadmap")
    elif roadmap_age_min is not None and roadmap_age_min > ROADMAP_STALE_MIN:
        avisos.append(f"{roadmap_source} com {age_label(roadmap_age_min)} (> {ROADMAP_STALE_MIN}min) — pode estar desatualizado")

imediato_block = extract_imediato(roadmap_text) if roadmap_text else None
frentes = extract_frentes(roadmap_text) if roadmap_text else []
resumo = extract_resumo(imediato_block)
itens = numbered_items(imediato_block)

# ------------------------------------------------------------------ montagem
out = []
bar = "─" * WIDTH
cache_hdr = age_label(freshest_cache_age) if freshest_cache_age is not None else ("ausente" if cache_missing else "vazio")
if NO_ROADMAP:
    roadmap_hdr = "off"
else:
    roadmap_hdr = age_label(roadmap_age_min) if roadmap_age_min is not None else "ausente"
out.append(truncate(f"PRs · raiz-data-engine — cache {cache_hdr} · roadmap {roadmap_hdr}", WIDTH))
out.append(bar)

if claims_unavailable:
    out.append("sem dado (arquivo claims.json ausente)")
elif not rows:
    out.append("0 PRs ativos (nenhum claim nao-encerrado com PR em claims.json)")
else:
    for r in rows:
        out.extend(render_row(r))

out.append(bar)
count_txt = "0 PR(s) — claims.json ausente" if claims_unavailable else f"{len(rows)} PR(s) ativo(s) (claims.json)"
if resumo:
    out.append(truncate(f"{count_txt} · fila: {resumo}", WIDTH))
else:
    out.append(count_txt)

if not NO_ROADMAP:
    out.append(bar)
    out.append("ROADMAP · imediato")
    if imediato_block is None:
        out.append("  sem dado (ROADMAP.md/QUEUE.md ausentes ou secao 'Fila em 5 linhas' nao encontrada)")
    elif not itens:
        out.append(f"  (sem itens numerados na secao — ver {roadmap_source or 'ROADMAP.md'})")
    else:
        shown = itens[:MAX_ITEMS]
        for i, raw in enumerate(shown, start=1):
            txt = clean_md(raw)
            wrapped = textwrap.wrap(txt, max(20, WIDTH - 5)) or [""]
            for j, wline in enumerate(wrapped[:2]):
                prefix = f"{i}. " if j == 0 else "   "
                suffix = "…" if j == 1 and len(wrapped) > 2 else ""
                out.append(truncate(f"  {prefix}{wline}{suffix}", WIDTH))
        if len(itens) > MAX_ITEMS:
            out.append(f"  (+{len(itens) - MAX_ITEMS} item(ns) — ver {roadmap_source or 'ROADMAP.md'})")


    if frentes:
        out.append(bar)
        bloq = sum(1 for f in frentes for it in f["itens"] if "bloqueado por" in it.lower())
        sem_pr = sum(1 for f in frentes for it in f["itens"] if it.startswith("(sem PR)"))
        out.append(truncate(f"ROADMAP · frentes ({len(frentes)}) — {bloq} bloqueado(s), {sem_pr} sem PR", WIDTH))
        for f in frentes[:MAX_FRENTES]:
            itens_f = f["itens"]
            marca = " BLOQ" if any("bloqueado por" in it.lower() for it in itens_f) else ""
            out.append(truncate(f"  {f['nome']}{marca}", WIDTH))
            for it in itens_f[:2]:
                txt = clean_md(it)
                mb = re.search(r"bloqueado por:\s*(.+)$", txt, re.I)
                if mb:
                    pr = re.match(r"(#\d+)", txt)
                    txt = ((pr.group(1) + " ") if pr else "") + "bloqueado: " + mb.group(1).strip()
                out.append(truncate(f"    - {txt}", WIDTH))
            if len(itens_f) > 2:
                out.append(f"    - (+{len(itens_f) - 2})")
        if len(frentes) > MAX_FRENTES:
            out.append(truncate(f"  (+{len(frentes) - MAX_FRENTES} frente(s) — ver ROADMAP.md)", WIDTH))

if avisos:
    out.append(bar)
    for a in avisos:
        out.append(truncate(f"⚠ {a}", WIDTH))

print("\n".join(out))
PYEOF
}

SLEEP_PID=""
cleanup() {
  [[ -n "$SLEEP_PID" ]] && kill "$SLEEP_PID" 2>/dev/null
  exit 0
}
trap cleanup INT TERM

if [[ "$ONCE" == "1" ]]; then
  render_once
  exit 0
fi

while true; do
  clear 2>/dev/null || true
  render_once
  sleep "$REFRESH" &
  SLEEP_PID="$!"
  wait "$SLEEP_PID"
  SLEEP_PID=""
done
