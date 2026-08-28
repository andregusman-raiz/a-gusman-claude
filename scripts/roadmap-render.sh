#!/usr/bin/env bash
# roadmap-render.sh — gera docs/ai-state/de-pr-queue/ROADMAP.md (VIEW GERADA).
# Contrato: reforma da camada de pendencias (2026-08-28), builder C.
#
# Tres blocos, cada um de uma fonte diferente (nunca inventa dado):
#   ## Imediato       — copia LITERAL da secao "Fila em 5 linhas" do QUEUE.md
#   ## Frentes        — claims.json, claims nao-merged agrupados por 'frente';
#                        estado por claim vem do proprio claims.json (ja
#                        reconciliado por de-claims-sync.sh); "bloqueado por"
#                        exige 1 chamada de gh por PR nao-merged, cacheada 10min
#                        em .claims-sync-state.json (chave gh_cache, TTL 600s)
#   ## Ordens abertas — ORDENS.md, so as linhas no formato ledger "O-nnn | ..."
#                        sem despacho concluido (nunca inventa ordem que so
#                        existe em prosa)
#
# Idempotente: tmp+replace atomico. Conteudo estavel entre rodadas seguidas
# (a linha de rodape carrega o timestamp da geracao, que muda a cada rodada
# por desenho — isso e esperado, nao e uma falha de idempotencia do conteudo).
set -euo pipefail

REPO="${REPO:-Raiz-Educacao-SA/raiz-data-engine}"
Q="${DE_PR_QUEUE_DIR:-$HOME/Claude/docs/ai-state/de-pr-queue}"
QUEUE_MD="$Q/QUEUE.md"
CLAIMS="$Q/claims.json"
ORDENS_MD="$Q/ORDENS.md"
ROADMAP_MD="$Q/ROADMAP.md"
STATE="$Q/.claims-sync-state.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat <<'EOF'
Uso: roadmap-render.sh

Gera docs/ai-state/de-pr-queue/ROADMAP.md a partir de 3 fontes (nenhum
dado inventado):
  - QUEUE.md (secao "Fila em 5 linhas") -> ## Imediato (copia literal)
  - claims.json (nao-merged, por frente) -> ## Frentes
  - ORDENS.md (linhas O-nnn sem despacho concluido) -> ## Ordens abertas

Sem argumentos. Sem --apply: roda sempre, e um script de render puro
(tmp+replace atomico), pensado para ser chamado por outro wrapper de
render (ex.: canais-render.sh) ou por cron/launchd.

gh indisponivel: o bloco 'Frentes' usa so o cache existente (pode ficar
sem 'bloqueado por' para PRs nunca cacheados); nada quebra.

Variaveis: REPO, DE_PR_QUEUE_DIR (override para testes em sandbox).
EOF
}

for a in "$@"; do
  case "$a" in
    --help|-h) usage; exit 0 ;;
    *) echo "arg desconhecido: $a" >&2; exit 2 ;;
  esac
done

[[ -f "$QUEUE_MD" ]] || { echo "QUEUE.md nao encontrado: $QUEUE_MD" >&2; exit 1; }
[[ -f "$CLAIMS" ]] || { echo "claims.json nao encontrado: $CLAIMS" >&2; exit 1; }

GH_OK=0
if command -v gh >/dev/null 2>&1; then GH_OK=1; fi

REPO="$REPO" Q="$Q" QUEUE_MD="$QUEUE_MD" CLAIMS="$CLAIMS" ORDENS_MD="$ORDENS_MD" \
ROADMAP_MD="$ROADMAP_MD" STATE="$STATE" SCRIPT_DIR="$SCRIPT_DIR" GH_OK="$GH_OK" \
python3 <<'PYEOF'
import json, os, re, subprocess, sys, time
from datetime import datetime, timezone

REPO = os.environ["REPO"]
QUEUE_MD = os.environ["QUEUE_MD"]
CLAIMS = os.environ["CLAIMS"]
ORDENS_MD = os.environ["ORDENS_MD"]
ROADMAP_MD = os.environ["ROADMAP_MD"]
STATE = os.environ["STATE"]
SCRIPT_DIR = os.environ["SCRIPT_DIR"]
GH_OK = os.environ["GH_OK"] == "1"

sys.path.insert(0, SCRIPT_DIR)
from registry_lib import mutate, load

CACHE_TTL_S = 600


def now_utc():
    return datetime.now(timezone.utc)


def ensure_state():
    if os.path.exists(STATE):
        return
    payload = {
        "_schema": ("state compartilhado de de-claims-sync.sh + roadmap-render.sh "
                    "(contrato reforma-pendencias 2026-08-28). Chaves: 'alertado' "
                    "(de-claims-sync, cooldown de alertas AUTORIZACOES por id) e "
                    "'gh_cache' (roadmap-render, cache de gh pr view por PR, TTL 10min)."),
        "alertado": {},
        "gh_cache": {},
    }
    try:
        fd = os.open(STATE, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o644)
        with os.fdopen(fd, "w") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
            f.write("\n")
    except FileExistsError:
        pass


def age_str(path):
    try:
        age_min = (time.time() - os.path.getmtime(path)) / 60.0
    except OSError:
        return "desconhecida"
    if age_min < 60:
        return f"{age_min:.0f}min"
    return f"{age_min / 60.0:.1f}h"


# ============================================================
# 1) IMEDIATO — copia literal da "Fila em 5 linhas" do QUEUE.md
# ============================================================
queue_text = open(QUEUE_MD, encoding="utf-8").read()
qm = re.search(r'(?ms)^## 🔢 Fila em 5 linhas.*?(?=\n## )', queue_text)
if qm:
    imediato = qm.group(0).rstrip("\n")
else:
    imediato = "(secao 'Fila em 5 linhas' nao encontrada em QUEUE.md — nada copiado, ver QUEUE.md diretamente)"

# ============================================================
# 2) FRENTES — claims.json, nao-merged, agrupado por 'frente'
# ============================================================
with open(CLAIMS) as f:
    claims_data = json.load(f)
claims = claims_data.get("claims", {})
TERMINAL = {"merged", "closed", "cancelado-dedup", "closed-nao-remendar"}
nonterm = {b: c for b, c in claims.items() if c.get("status") not in TERMINAL}

ensure_state()
st_snapshot = load(STATE)
cache = dict(st_snapshot.get("gh_cache", {}))

need_fetch = []
for c in nonterm.values():
    pr = c.get("pr")
    if not isinstance(pr, int):
        continue
    entry = cache.get(str(pr))
    fresh = False
    if entry:
        try:
            fetched = datetime.fromisoformat(entry["fetched_at"].replace("Z", "+00:00"))
            fresh = (now_utc() - fetched).total_seconds() < CACHE_TTL_S
        except Exception:
            fresh = False
    if not fresh:
        need_fetch.append(pr)
need_fetch = sorted(set(need_fetch))

fetched_new = {}
if GH_OK:
    for pr in need_fetch:
        try:
            r = subprocess.run(
                ["gh", "pr", "view", str(pr), "-R", REPO, "--json", "title,reviewDecision,mergeable"],
                capture_output=True, text=True, timeout=20,
            )
            if r.returncode == 0:
                info = json.loads(r.stdout)
                fetched_new[str(pr)] = {
                    "fetched_at": now_utc().strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "title": info.get("title", "") or "",
                    "reviewDecision": info.get("reviewDecision", "") or "",
                    "mergeable": info.get("mergeable", "") or "",
                }
        except Exception:
            pass
elif need_fetch:
    print(f"AVISO: gh indisponivel -- {len(need_fetch)} PR(s) sem cache fresco "
          f"('bloqueado por'/titulo podem faltar ou ficar stale): {need_fetch}", file=sys.stderr)

if fetched_new:
    def merge_cache(s):
        gc = s.setdefault("gh_cache", {})
        gc.update(fetched_new)
        return s
    mutate(STATE, merge_cache)
    cache.update(fetched_new)


def bloqueio(pr):
    e = cache.get(str(pr))
    if not e:
        return None
    parts = []
    if e.get("reviewDecision") == "CHANGES_REQUESTED":
        parts.append("CHANGES_REQUESTED")
    if e.get("mergeable") == "CONFLICTING":
        parts.append("CONFLICTING")
    return "+".join(parts) if parts else None


frentes_agrupadas = {}
for b, c in nonterm.items():
    fr = c.get("frente") or "sem frente"
    frentes_agrupadas.setdefault(fr, []).append((b, c))

frentes_lines = []
for fr in sorted(frentes_agrupadas):
    frentes_lines.append(f"**{fr}**")
    for b, c in frentes_agrupadas[fr]:
        pr = c.get("pr")
        status = c.get("status", "?")
        if isinstance(pr, int):
            titulo = cache.get(str(pr), {}).get("title", "")
            titulo_curto = (titulo[:42] + "…") if len(titulo) > 43 else titulo
            linha = f"- #{pr} {status} {titulo_curto}".rstrip()
            bl = bloqueio(pr)
            if bl:
                linha += f" — bloqueado por: {bl}"
        else:
            linha = f"- (sem PR) {status} — {b}"
        frentes_lines.append(linha)
frentes_block = "\n".join(frentes_lines) if frentes_lines else "(nenhuma frente com claim nao-encerrado)"

# ============================================================
# 3) ORDENS ABERTAS — ORDENS.md, so linhas ledger "O-nnn | ..."
# ============================================================
ordens_lines = []
if os.path.isfile(ORDENS_MD):
    ordens_text = open(ORDENS_MD, encoding="utf-8").read()
    for line in ordens_text.splitlines():
        om = re.match(r'^(O-\d{3})\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*(.*)$', line)
        if not om:
            continue
        oid, _data, _origem, assunto, despacho = [x.strip() for x in om.groups()]
        clausulas = [c.strip() for c in despacho.split("+")] if despacho else []
        pendentes = [c for c in clausulas if re.search(r'#\d{3,6}', c) and "MERGED" not in c.upper()]
        concluido = bool(despacho) and bool(clausulas) and not pendentes
        if concluido:
            continue
        pendente_txt = "; ".join(pendentes) if pendentes else (despacho or "sem despacho")
        ordens_lines.append(f"- {oid}: {assunto[:60]} — pendente: {pendente_txt[:100]}")
if not ordens_lines:
    ordens_lines = ["(nenhuma ordem aberta sem despacho concluído)"]

# ============================================================
# Montagem + escrita atomica
# ============================================================
ts = now_utc().strftime("%Y-%m-%d %H:%M")
partes = [
    "# ROADMAP — Data Engine (VIEW GERADA por roadmap-render.sh, não editar à mão)",
    "",
    "## Imediato",
    imediato,
    "",
    "## Frentes",
    frentes_block,
    "",
    "## Ordens abertas",
    *ordens_lines,
    "",
    "---",
    (f"_gerado em {ts}Z por roadmap-render.sh · fontes: QUEUE.md (idade {age_str(QUEUE_MD)}), "
     f"claims.json (idade {age_str(CLAIMS)}), ORDENS.md (idade {age_str(ORDENS_MD)})_"),
]
conteudo = "\n".join(partes) + "\n"
tamanho = len(conteudo.encode("utf-8"))

tmp = ROADMAP_MD + ".tmp"
with open(tmp, "w", encoding="utf-8") as f:
    f.write(conteudo)
os.replace(tmp, ROADMAP_MD)

print(f"ROADMAP.md gerado ({tamanho} bytes): {ROADMAP_MD}")
if tamanho > 2048:
    print(f"AVISO: {tamanho} bytes > 2048 (2KB). A secao 'Fila em 5 linhas' do QUEUE.md "
          f"sozinha tem {len(imediato.encode('utf-8'))} bytes -- copia literal preservada "
          f"de proposito (nao trunco decisao ativa em voo); ver gap no relatorio do builder C.")
PYEOF
