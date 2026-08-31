#!/usr/bin/env bash
# board-sync.sh — preenche as colunas ROADMAP e PR/STATUS da sidebar status-board do cmux (sem LLM).
# DOR: o dono nao tinha tela (16 artefatos-plano, 0 leitores — diag 28/08 §8; ROADMAP.md lido por 0 sessoes).
# METRICA: o dono cita o board/ROADMAP em >=1 ordem por ciclo (M-4); description/progress de cada papel
#          batem com ROADMAP.md e gh pr list a cada execucao (drift = 0).
# DONO-MEDICAO: COMANDO.
# REMOVER-QUANDO: o cmux expuser ROADMAP/fila nativamente na sidebar, OU o dono nao olhar o board por 2 ciclos (M-4 = 0).
# TESTADO-EM: RESUMO (propria janela), 29/08 — depois COMANDO/DE-COORD. Chamado no fim de de-fila-tick.sh
#          (mesma cadencia, sem plist novo). Escreve SO no estado do cmux (description/progress) — nunca em arquivo.
set -uo pipefail
C="${CMUX_BIN:-/Applications/cmux.app/Contents/Resources/bin/cmux}"
T="${PAPEL_TERMINAIS_DIR:-$HOME/Claude/docs/ai-state/terminais}"
Q="${DE_PR_QUEUE_DIR:-$HOME/Claude/docs/ai-state/de-pr-queue}"
RM="${ROADMAP_MD:-$HOME/Claude/docs/ai-state/roadmap/ROADMAP.md}"
REPO="${DE_REPO:-Raiz-Educacao-SA/raiz-data-engine}"
DRY="${DRY_RUN:-0}"

PRS=$(gh pr list -R "$REPO" --state open --limit 60 \
  --json number,title,headRefName,headRefOid,reviewDecision,mergeStateStatus,isDraft,updatedAt,author 2>/dev/null || echo "[]")

PRS_JSON="$PRS" python3 - "$T/registry.json" "$RM" "$Q/.fila-snapshot.json" "$C" "$DRY" <<'PY'
import json, os, re, subprocess, sys, datetime
reg_p, rm_p, snap_p, C, DRY = sys.argv[1:6]
prs = json.loads(os.environ.get("PRS_JSON") or "[]")
reg = json.load(open(reg_p))["terminais"]
snap = {}
try: snap = json.load(open(snap_p)).get("prs", {})
except Exception: pass
rm = open(rm_p, encoding="utf-8").read().splitlines() if os.path.exists(rm_p) else []
# rev 6 (29/08): ROADMAP.md e INDICE; as Entregas vivem em roadmap/<programa>.md. Concatena na ordem em que o indice
# os cita (linhas "· roadmap/<x>.md ·"); ficheiros nao citados entram depois, por nome. Cada programa vira "## <programa>".
_dir = os.path.dirname(rm_p); _cit = re.findall(r"roadmap/([a-z0-9_-]+)\.md", "\n".join(rm))
_all = sorted(f[:-3] for f in os.listdir(_dir) if f.endswith(".md") and f[0].islower())  # programas = minusculos; indices/derivados (ROADMAP, DESPACHO, MUDOU, MEDICOES) e _intake ficam fora
for prog in [c for c in _cit if c in _all] + [a for a in _all if a not in _cit]:
    try: body = open(os.path.join(_dir, prog + ".md"), encoding="utf-8").read().splitlines()
    except Exception: continue
    titulo = next((l.lstrip("# ").strip() for l in body if l.startswith("# ")), prog)
    rm += ["", f"## PROGRAMA {prog} — {titulo[:80]}"] + [l for l in body if not l.startswith("# ")]

def line(prefix):
    for l in rm:
        if l.startswith(prefix): return l[len(prefix):].strip()
    return ""
quanto = line("QUANTO FALTA:") or line("CAMINHO CRÍTICO") or ""
decisao = line("DECISÃO DA VEZ (classe A):")
decisao_id = (re.match(r"\s*([A-Z]-\d+|Q\d+)", decisao) or [None, "?"])[1] if decisao else "?"
entregas = [l.strip() for l in rm if l.startswith("  E-")]

PAPEIS_RE = re.compile(r"\b(" + "|".join(sorted((re.escape(k) for k in reg.keys()), key=len, reverse=True)) + r")\b")
def dono_da_entrega(e):
    # 30/08: era PAPEIS_RE.search(head) — devolvia o PRIMEIRO nome de papel em QUALQUER sitio da
    # linha, prosa incluida. A E-45 diz "(pedido do FUNIL 27/08...)" e ia para o FUNIL, que e o
    # REQUERENTE; o executor e o DE-DATA. Casar TEXTO onde se devia ler RELACAO.
    # O roadmap ja poe o dono num CAMPO POSICIONAL: "E-22 · <desc> · DE-DATA · fila".
    # Le-se o campo: segmento cujas partes (separadas por /) sao TODAS nomes de papel. Prosa nunca
    # qualifica, porque traz outras palavras. Fallback ao comportamento antigo se nao houver campo.
    head = e.split(" · prova:")[0]
    for seg in reversed([s.strip() for s in head.split("·")]):
        if not seg: continue
        partes = [x.strip() for x in seg.split("/") if x.strip()]
        if partes and all(x in reg for x in partes):
            return partes[0]
    m = PAPEIS_RE.search(head); return m.group(1) if m else None
def entregas_de(papel, apoio=True):
    out = []
    for e in entregas:
        head = e.split(" · prova:")[0]
        if not re.search(r"\b" + re.escape(papel) + r"\b", head): continue
        dono = dono_da_entrega(e)
        if dono != papel and not apoio: continue
        eid = head.split(" · ")[0] + ("" if dono == papel else "(apoio)")
        resto = " · ".join(head.split(" · ")[1:])
        prova = e.split(" · prova:")[1].strip() if " · prova:" in e else ""
        out.append((eid, resto[:90], prova[:70]))
    out.sort(key=lambda x: "(apoio)" in x[0])
    return out

def ago(iso):
    try:
        d = datetime.datetime.fromisoformat(iso.replace("Z", "+00:00"))
        m = int((datetime.datetime.now(datetime.timezone.utc) - d).total_seconds() // 60)
        return f"{m}m" if m < 60 else (f"{m//60}h" if m < 1440 else f"{m//1440}d")
    except Exception: return "?"

def branch_of(path):
    try:
        return subprocess.run(["git", "-C", path, "branch", "--show-current"], capture_output=True, text=True, timeout=5).stdout.strip()
    except Exception: return ""

by_branch = {p["headRefName"]: p for p in prs}
by_num = {p["number"]: p for p in prs}

# worktrees do repo do DE: branch -> path; path -> papel (por nome do dir ou pelo worktree do registry)
wt_branch_to_path = {}
try:
    out = subprocess.run(["git", "-C", os.path.expanduser("~/Claude/GitHub/raiz-data-engine"), "worktree", "list", "--porcelain"], capture_output=True, text=True, timeout=10).stdout
    cur = None
    for l in out.splitlines():
        if l.startswith("worktree "): cur = l[9:].strip()
        elif l.startswith("branch ") and cur: wt_branch_to_path[l.split("refs/heads/")[-1].strip()] = cur
except Exception: pass
KEYS = {"DE-MIG": ("demig", "de-mig", "awsport", "mergequeue"), "DE-DATA": ("dedata", "de-data", "hubspot", "funnel"), "DE-SYNC": ("desync", "de-sync", "ws0", "syncs"), "FUNIL": ("funil",)}
def papel_of_path(path):
    low = path.lower()
    for papel, t in reg.items():
        w = (t.get("worktree") or "")
        if w and low.startswith(w.lower()): return papel
    for papel, keys in KEYS.items():
        if any(k in low for k in keys): return papel
    return None
# 31/08 (achado do FUNIL; corrigido COMANDO apos enumerar os consumidores): o bloco prs_by_papel
# (worktree-only) que aqui vivia era CODIGO MORTO — nunca lido; o board real usa pr_papel (l.~180),
# que e CLAIMS-FIRST (owner/terminal) e hoje atribui DE-BUILD-B via claim (#6417/#6439 medidos).
# O aviso de "sem papel" abaixo foi MOVIDO para depois de pr_papel e passou a medir a atribuicao
# REAL (claims>worktree>entrega>tokens) — como estava, media so papel_of_path e alarmava falso para
# PRs perfeitamente atribuidos por claim. Regra mantida (e do FUNIL, e boa): total = partes nomeadas
# + resto, e o resto tem de FALHAR visivel, nao diluir — aplicada ao total CERTO.
# condicao do ROADMAP que o gh nao mostra: PR com migration exige review HUMANA (DE-MIG) — APPROVED so do bot nao e luz verde
_det = {}
def detail(n):
    if n in _det: return _det[n]
    d = {"human_ok": False, "migration": False}
    try:
        repo = os.environ.get("DE_REPO", "Raiz-Educacao-SA/raiz-data-engine")
        r = subprocess.run(["gh", "pr", "view", str(n), "-R", repo, "--json", "reviews"], capture_output=True, text=True, timeout=20)
        j = json.loads(r.stdout or "{}")
        # files: gh pr view/api devolvem 100 por pagina — sem --paginate um PR de 424 arquivos "tem" 100 (sonda truncada, COMANDO 29/08)
        rf = subprocess.run(["gh", "api", f"repos/{repo}/pulls/{n}/files", "--paginate", "--jq", ".[].filename"], capture_output=True, text=True, timeout=40)
        j["files"] = [{"path": x} for x in rf.stdout.split()]
        bots = set(os.environ.get("DE_BOT_LOGINS", "raiz-pr-bot-aws").split(","))
        def is_bot(login): return login in bots or login.endswith("[bot]") or re.search(r"(^|[-_])bot([-_]|$)", login) is not None
        d["human_ok"] = any(v.get("state") == "APPROVED" and not is_bot(v.get("author", {}).get("login", "")) for v in j.get("reviews", []))
        d["migration"] = any(re.search(r"alembic/versions|migrations/", f.get("path", "")) for f in j.get("files", []))
    except Exception: pass
    _det[n] = d; return d
def falta_humana(p):
    if p.get("reviewDecision") != "APPROVED": return False
    d = detail(p["number"]); return d["migration"] and not d["human_ok"]

def pr_label(p):
    n = p["number"]; motivo = snap.get(str(n), {}).get("motivo", "")
    rd = p.get("reviewDecision") or "sem review"; ms = p.get("mergeStateStatus") or "?"
    if p.get("isDraft"): stage, txt = 3/8, "draft"
    elif rd == "CHANGES_REQUESTED": stage, txt = 6/8, "CR por responder"
    elif rd == "APPROVED" and falta_humana(p): stage, txt = 6/8, f"APPROVED (bot) · FALTA review DE-MIG (migration) · {ms}"
    elif rd == "APPROVED" and ms == "CLEAN": stage, txt = 7/8, "APPROVED+CLEAN → merge"
    elif rd == "APPROVED": stage, txt = 7/8, f"APPROVED · {ms}"
    else: stage, txt = 4/8, f"aguarda review · {ms}"
    if motivo: txt = f"{txt} · {motivo}"
    return f"#{n} {txt} · @{(p.get('headRefOid') or '')[:7]} · {ago(p.get('updatedAt',''))}", stage

# resumo da fila para o DE-COORD
n_open = len(prs); n_cr = sum(1 for p in prs if p.get("reviewDecision") == "CHANGES_REQUESTED")
n_ok_all = [p for p in prs if p.get("reviewDecision") == "APPROVED"]; n_falta = sum(1 for p in n_ok_all if falta_humana(p))
n_ok = len(n_ok_all) - n_falta; n_wait = n_open - n_cr - len(n_ok_all)
fila = f"fila: {n_open} abertos · {n_cr} CR por responder · {n_ok} prontos p/ merge · {n_falta} aprovados s/ review DE-MIG · {n_wait} aguardam review"

plan = []
# --- papel de cada PR (worktree do DE > token WS-n da Entrega > #PR citado na Entrega) ---
# fonte canônica PR->terminal: claims.json (branch -> terminal). NUNCA por autor (a frota inteira e um login: andregusman-raiz).
claims_by_branch, claims_by_pr = {}, {}
try:
    _cl = json.load(open(os.path.join(os.path.dirname(snap_p), "claims.json"))).get("claims", {})
    for br, c in (_cl.items() if isinstance(_cl, dict) else []):
        if not isinstance(c, dict): continue
        # 30/08: o produtor passou a escrever `owner` (1 -> 6 preenchidos hoje) e este consumidor
        # so lia `terminal`. Claim sem `terminal` caia na heuristica de tokens WS-n do branch, e o
        # #6402 (owner=DE-DATA, branch fix/ws0b-...) era atribuido ao 1o papel do registry com WS-0:
        # o DE-DATA aparecia "sem PR aberto" e outro papel levava credito de PR alheio.
        # A28(a) ja dizia que o vinculo papel<->PR "vem do claims.json e so de la".
        term = c.get("owner") or c.get("terminal")
        if term in reg: claims_by_branch[br] = term
        if term in reg and str(c.get("pr") or "").isdigit(): claims_by_pr[int(c["pr"])] = term
except Exception: pass
def papel_do_pr(p):
    pap = claims_by_pr.get(p["number"]) or claims_by_branch.get(p["headRefName"])
    if pap: return pap
    path = wt_branch_to_path.get(p["headRefName"]); pap = papel_of_path(path) if path else None
    if pap: return pap
    for papel, t in reg.items():
        if t.get("tier", 9) > 2: continue
        for eid, resto, prova in entregas_de(papel, apoio=False):
            if f"#{p['number']}" in resto + prova: return papel
            toks = {m.group(0).upper().replace("-", "") for m in re.finditer(r"WS-?\d+", resto, re.I)}
            ptoks = {m.group(0).upper().replace("-", "") for m in re.finditer(r"WS-?\d+", p.get("title", "") + " " + p.get("headRefName", ""), re.I)}
            if toks & ptoks: return papel
    return None
pr_papel = {p["number"]: papel_do_pr(p) for p in prs}
_sem_papel = [p["number"] for p in prs if not pr_papel.get(p["number"])]
if _sem_papel:
    print(f"⚠ {len(_sem_papel)} de {len(prs)} PR(s) SEM PAPEL na atribuicao real do board (claims>worktree>entrega>tokens): {_sem_papel}")
if DRY == "1" and os.environ.get("PRINT") != "1": print("pr→papel:", {n: v for n, v in pr_papel.items() if v})
def entrega_do_pr(p):
    pap = pr_papel.get(p["number"])
    if not pap: return ""
    ents = entregas_de(pap, apoio=False)
    for eid, resto, prova in ents:
        if f"#{p['number']}" in resto + prova: return eid
    ptoks = {m.group(0).upper().replace("-", "") for m in re.finditer(r"WS-?\d+", p.get("title", "") + " " + p.get("headRefName", ""), re.I)}
    for eid, resto, prova in ents:
        if ptoks & {m.group(0).upper().replace("-", "") for m in re.finditer(r"WS-?\d+", resto, re.I)}: return eid
    return ents[0][0] if len(ents) == 1 else ""

# --- FILA ÚNICA DO ROADMAP (description do COMANDO) ---
def probe(url):
    try: return subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "-m", "10", url], capture_output=True, text=True, timeout=15).stdout.strip()
    except Exception: return "?"
base = os.environ.get("DE_PROD_URL", "https://dataengine.raizeducacao.com.br")
rd = probe(base + "/health/readiness")
if rd == "200": prod = "PROD ok (readiness 200)"
else:
    hl = probe(base + "/health")
    prod = f"PROD readiness={rd} · liveness={hl}" + (" ⚠" if rd not in ("200", "401") or hl != "200" else " (readiness sob auth)")
by_entrega = {}
for p in prs:
    e = entrega_do_pr(p)
    if e: by_entrega.setdefault(e, []).append(p)
def short_status(p):
    rd = p.get("reviewDecision") or ""; ms = p.get("mergeStateStatus") or "?"
    if p.get("isDraft"): return "draft"
    if rd == "CHANGES_REQUESTED": return "CR por responder"
    if rd == "APPROVED" and falta_humana(p): return "APPROVED(bot) · falta review DE-MIG"
    if rd == "APPROVED": return f"APPROVED · {ms}"
    return f"aguarda review · {ms}"
# 30/08 23:0xZ (auditoria do FUNIL: "board seletivamente atual"): a linha E- do .md é PROSA de várias mãos e nunca recebe
# retratações; estado/prova/bloqueio vivem em results.jsonl (último registro vale) e filas/*.jsonl. O board passa a
# DERIVAR o estado dessas fontes, cortar a prosa no título e carimbar a idade do texto (git blame) — nunca mais
# mostra "· fila/pronta/em curso" nem "prova:/bloqueio:" escritos à mão.
import subprocess as _sp, glob as _gl
_ult = {}   # task -> último result
try:
    for _l in open(os.path.join(os.path.dirname(rm_p), "results.jsonl"), encoding="utf-8"):
        try: _e = json.loads(_l); _ult[_e["task"]] = _e
        except Exception: pass
except Exception: pass
_fila = {}  # task -> row da fila
for _q in _gl.glob(os.path.join(os.path.dirname(rm_p), "filas", "fila-*.jsonl")):
    for _l in open(_q, encoding="utf-8"):
        try: _r = json.loads(_l); _fila[_r["task"]] = _r
        except Exception: pass
_blame = {}  # (prog, eid) -> idade em horas do texto da linha
try:
    for _prog in _all:
        _f = os.path.join(_dir, _prog + ".md")
        _out = _sp.run(["git", "blame", "--line-porcelain", "--", _f], cwd=os.path.expanduser("~/Claude"), capture_output=True, text=True, timeout=30).stdout
        _t = None
        for _ln in _out.splitlines():
            if _ln.startswith("author-time "): _t = int(_ln.split()[1])
            elif _ln.startswith("\t  E-") and _t:
                _eid = _ln[1:].strip().split(" ")[0]; _blame[(_prog, _eid)] = (datetime.datetime.now(datetime.timezone.utc).timestamp() - _t) / 3600
except Exception: pass
def estado_derivado(eid):
    r = _ult.get(eid); f = _fila.get(eid) or {}
    if r and r.get("status") == "done": return "PRONTA", r
    if r and r.get("status") in ("blocked", "failed"): return "BLOQUEADA", r
    if r and r.get("status") == "retracted": return "RETRATADA", r
    st = f.get("status", "")
    return {"puxada": "EM CURSO", "done": "PRONTA", "bloqueada": "BLOQUEADA", "estacionada": "ESTACIONADA"}.get(st, "FILA"), None
road = [f"{prod} · QUANTO FALTA {quanto[:70]}", f"DECISÃO DA VEZ: {decisao[:90] or '—'}", ""]
# percorre o ROADMAP na ordem: faixas (## ...), contadores por faixa, marcos, caminho crítico, Entregas
for l in rm:
    if l.startswith("## "):
        road.append(""); road.append("§ " + l[3:].strip())
    elif l.startswith("QUANTO FALTA:") and road and road[-1].startswith("§ "):
        road.append("  " + l.strip())
    elif l.startswith(("MARCO", "SUSTENT", "CAMINHO")):
        road.append("· " + l.strip()[:160])
    elif l.startswith("  P") and "✅" in l or l.startswith("  P") and "⏳" in l:
        road.append("    " + l.strip())
    elif l.startswith("  E-"):
        e = l.strip(); parts = e.split(" · "); eid = parts[0]; titulo = (parts[1] if len(parts) > 1 else "").strip()[:90].rstrip(" ·")
        est, r = estado_derivado(eid)
        prs_e = sorted(by_entrega.get(eid, []), key=lambda p: p.get("updatedAt", ""), reverse=True)
        if r:   # PR citado no RESULT (campo pr ou "#NNNN" na nota) também conta como PR da Entrega
            _nums = {str(r.get("pr") or "").strip()} | set(re.findall(r"#(\d{4,5})", str(r.get("nota", "")) + " " + str(r.get("prova_cmd", ""))))
            _nums = {n for n in _nums if n}
            _known = {str(p["number"]) for p in prs_e}
            for _p in prs:
                if str(_p["number"]) in _nums and str(_p["number"]) not in _known: prs_e.append(_p)
            # `prs` só tem PRs ABERTOS: alerta só quando o PR citado ainda está aberto (merged/closed não aparecem aqui)
            if est == "PRONTA" and any(str(p["number"]) in _nums for p in prs):
                est = "PRONTA ⚠ PR ainda aberto (prova antes do merge?)"
        prtxt = " | ".join(f"#{p['number']} {short_status(p)} @{(p.get('headRefOid') or '')[:7]}" for p in prs_e[:2]) or "sem PR"
        _prog_atual = next((x[3:].split(" — ")[0].replace("PROGRAMA ", "").strip() for x in reversed(rm[:rm.index(l)+1]) if x.startswith("## PROGRAMA")), "")
        _age = _blame.get((_prog_atual, eid)); _agetxt = f"texto há {_age:.0f}h" if _age is not None else "texto s/ carimbo"
        _pux = _fila.get(eid, {}).get("puxada_por"); _quem = f" · {_pux}" if _pux and est == "EM CURSO" else ""
        road.append(f"{eid:<5} {titulo} · {est}{_quem} · {_agetxt}")
        if r: road.append(f"      → RESULT {r.get('status')} {r.get('papel')} {str(r.get('ts',''))[5:16]}Z: {str(r.get('nota') or r.get('prova_cmd') or '')[:110]}")
        road.append(f"      → {prtxt}")
_no_md = [t for t in _ult if t.startswith("E-") and not any(x.strip().startswith(t + " ") or x.strip().startswith(t + " ·") for x in entregas)]
if _no_md:
    road.append(""); road.append("§ RESULTS sem linha no roadmap (fatias/extras)")
    for t in sorted(_no_md):
        r = _ult[t]; road.append(f"{t:<7} {r.get('status')} {r.get('papel')} {str(r.get('ts',''))[5:16]}Z: {str(r.get('nota') or '')[:100]}")
if not entregas: road.append("— ROADMAP.md sem linhas E- —")
road_txt = "\n".join(road)

# --- FILA ÚNICA DE PRs (description do DE-COORD) ---
def rank(p):
    rd = p.get("reviewDecision") or ""; ms = p.get("mergeStateStatus") or ""
    if p.get("isDraft"): return 5
    if rd == "APPROVED" and not falta_humana(p): return 0
    if rd == "APPROVED": return 1
    if rd == "CHANGES_REQUESTED": return 3
    return 2
fila_lines = [fila, "ordem: prontos → aprovados s/ review humana → aguardam review → CR por responder → draft", ""]
for p in sorted(prs, key=lambda p: (rank(p), p.get("updatedAt", ""))):
    pap = pr_papel.get(p["number"]) or "—"; e = entrega_do_pr(p)
    motivo = snap.get(str(p["number"]), {}).get("motivo") or ""
    fila_lines.append(f"#{p['number']} {pap:<8} {e:<4} {short_status(p)[:38]:<38} @{(p.get('headRefOid') or '')[:7]} {ago(p.get('updatedAt',''))}" + (f" · {motivo[:30]}" if motivo else ""))
fila_txt = "\n".join(fila_lines)

for papel, t in reg.items():
    if t.get("tier", 9) > 2 or t.get("estado") != "aberto" or not t.get("workspace_uuid"): continue
    uuid = t["workspace_uuid"]
    ents = entregas_de(papel)
    if papel == "COMANDO":
        desc = road_txt
        label, stage = f"{prod} · decisão da vez {decisao_id}", None
    elif papel == "DE-COORD":
        desc = fila_txt
        label, stage = fila, None
    elif papel == "RESUMO":
        desc = "delegado de voz do dono sobre o COMANDO (A19) — não é papel"
        label, stage = f"delegado A19 · {decisao_id} com o dono", None
    else:
        mine = sorted([p for p in prs if pr_papel.get(p["number"]) == papel], key=lambda p: p.get("updatedAt", ""), reverse=True)
        pr = mine[0] if mine else None
        eids = " ".join(eid for eid, _, _ in ents) or "sem Entrega"
        desc = " | ".join(f"{eid} {resto}" for eid, resto, prova in ents) or "— sem Entrega no ROADMAP —"
        if pr:
            label, stage = pr_label(pr)
            label = f"{eids} · {label}" + (f" (+{len(mine)-1} PR)" if len(mine) > 1 else "")
        else: label, stage = (f"{eids} · sem PR aberto"), (2/8 if ents else 0.0)
    plan.append((papel, uuid, desc[:6000], label[:120], stage))

# --- modo DESPACHO (tick, sem LLM): builder OCIOSO x Entrega EXECUTÁVEL na sua faixa -> evento p/ DE-COORD ---
# DOR: 29/08 os builders ficaram ociosos o dia todo com Entregas de fila no nome (DE-DATA: E-10; DE-SYNC: E-19) e so a analise humana viu.
# REGRA (dono 29/08 19:3xZ): isso e falha de despacho, detectada por maquina; acorda o DE-COORD por evento (nao o dono, nao o RESUMO).
if os.environ.get("DESPACHO") == "1":
    import hashlib, time
    # sonda de prod persistida (alimenta o diag-24h: fração do tempo com readiness ≠ 200) — 1 linha por tick, sem LLM
    try:
        # 31/08 (apagão 11:35–11:56Z: só tínhamos o código): grava DNS/TCP/IP separados para distinguir "resolução daqui" de "edge recusa"
        _out = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code} %{time_namelookup} %{time_connect} %{time_total} %{remote_ip}", "-m", "10", os.environ.get("DE_PROD_URL", "https://dataengine.raizeducacao.com.br") + "/health/readiness"], capture_output=True, text=True, timeout=15).stdout.strip().split()
        _rc = _out[0] if _out else "ERR"
        _rec = {"ts": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "readiness": _rc, "namelookup_s": (_out[1] if len(_out) > 1 else None), "connect_s": (_out[2] if len(_out) > 2 else None), "total_s": (_out[3] if len(_out) > 3 else None), "remote_ip": (_out[4] if len(_out) > 4 else None), "observador": "laptop-dono"}
        with open(os.path.join(os.path.dirname(rm_p), "PROD-PROBE.jsonl"), "a") as _f: _f.write(json.dumps(_rec) + "\n")
    except Exception: pass
    OCIOSO_MIN = int(os.environ.get("DESPACHO_OCIOSO_MIN", "45"))
    try:
        ws = json.loads(subprocess.run([C, "rpc", "workspace.list", "{}"], capture_output=True, text=True, timeout=10).stdout or "{}")
        ws = ws.get("workspaces", ws if isinstance(ws, list) else [])
    except Exception: ws = []
    last_by_uuid = {w.get("id"): (w.get("latest_submitted_at") or "") for w in ws}
    # 31/08 (achado do DE-COORD, 2o despacho falso do dia): latest_submitted_at e a hora do PROMPT no
    # cmux — SendMessage nunca lhe toca, e um builder que trabalha por mensagens fica "ocioso" para
    # sempre (DE-DATA activo 18:12:46Z no msg-ledger, declarado "ocioso ha 57 min" as 18:20Z, com
    # E-55 oferecida CONTRA instrucao de espera). Actividade = max(prompt, ultima mensagem no ledger,
    # ultimo RESULT) — os tres canais em que a frota trabalha. Reparacao de defeito, nao mecanismo novo.
    last_msg_by_papel = {}
    try:
        for _l in open(os.path.expanduser("~/Claude/docs/ai-state/terminais/msg-ledger.jsonl")).readlines()[-4000:]:
            try: _e = json.loads(_l)
            except Exception: continue
            _f = _e.get("from"); _t = _e.get("ts") or ""
            if _f and _t > last_msg_by_papel.get(_f, ""): last_msg_by_papel[_f] = _t
    except Exception: pass
    try:
        for _l in open(os.path.expanduser("~/Claude/docs/ai-state/roadmap/results.jsonl")).readlines()[-2000:]:
            try: _e = json.loads(_l)
            except Exception: continue
            _f = _e.get("papel"); _t = _e.get("ts") or ""
            if _f and _t > last_msg_by_papel.get(_f, ""): last_msg_by_papel[_f] = _t
    except Exception: pass
    def idle_min(uuid, papel=None):
        ts = max(last_by_uuid.get(uuid, ""), last_msg_by_papel.get(papel or "", ""))
        try:
            d = datetime.datetime.fromisoformat(ts.replace("Z", "+00:00"))
            return int((datetime.datetime.now(datetime.timezone.utc) - d).total_seconds() // 60)
        except Exception: return None
    # E-49 (31/08): antes lia STATUS_EXEC = ("· fila", "· em curso") no TEXTO da linha do roadmap
    # -- rotulo de prosa, que sobrevive a entrega ja feita se ninguem reescrever a linha. filas-
    # sync.sh:47 ja tem a regra "rotulo do .md nao vale como estado; results.jsonl decide"; aqui
    # reusa-se estado_derivado(eid), a mesma funcao que a impressao do board ja usa, em vez de
    # duplicar/ignorar essa regra. Custo medido: FUNIL acusado de 244min ocioso citando 2 Entregas
    # que ele proprio entregara na vespera (E-10/E-19), porque a linha do roadmap nunca foi reescrita.
    achados = []
    for papel, t in reg.items():
        if t.get("tier", 9) not in (1, 2) or t.get("estado") != "aberto" or not t.get("workspace_uuid"): continue
        im = idle_min(t["workspace_uuid"], papel)
        execs = []
        for e in entregas:
            head = e.split(" · prova:")[0]
            if dono_da_entrega(e) != papel: continue
            eid = head.split(" · ")[0]
            est, _ = estado_derivado(eid)
            if est not in ("FILA", "EM CURSO"): continue
            # E-49 cont. (31/08, achado do DE-COORD apos o fix inicial): FILA/EM CURSO nao bastam --
            # fora_da_janela=True e depende_de nao satisfeito sao campos da MESMA fila, e um deles
            # ja acusou o FUNIL de ocioso citando E-12 (fora_da_janela=True, depende_de=[E-4] bloqueada).
            fq = _fila.get(eid) or {}
            if fq.get("fora_da_janela"): continue
            deps = fq.get("depende_de") or []
            if any(estado_derivado(d)[0] != "PRONTA" for d in deps): continue
            execs.append(eid)
        meus_prs = [p["number"] for p in prs if pr_papel.get(p["number"]) == papel]
        if os.environ.get("DRY_RUN") == "1": print(f"  {papel:<10} idle={im}min execs={execs} prs={meus_prs}")
        if not execs: continue
        if im is not None and im >= OCIOSO_MIN:
            achados.append(f"{papel} ocioso há {im} min (sem prompt novo) · Entregas executáveis: {', '.join(execs)}")
        elif not meus_prs and t.get("tier") == 1:  # tier 2 abre PR no repo proprio (funil-auditor), nao no DE
            achados.append(f"{papel} sem PR aberto no DE · Entregas em fila/em curso no nome: {', '.join(execs)}")
    out_p = os.path.join(os.path.dirname(rm_p), "DESPACHO.md")
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%MZ")
    body = "\n".join(achados) if achados else "— nenhum builder ocioso com Entrega executável —"
    sig = hashlib.sha1(body.encode()).hexdigest()[:12]
    prev_sig = ""
    try: prev_sig = [l for l in open(out_p).read().splitlines() if l.startswith("<!-- sig:")][0][9:21]
    except Exception: pass
    with open(out_p, "w", encoding="utf-8") as f:
        f.write(f"# DESPACHO (derivado pelo tick — não editar) · {now}\n<!-- sig:{sig} -->\n\n"
                f"Regra: builder tier 1-2 ocioso ≥{OCIOSO_MIN} min com Entrega 'fila'/'em curso' no seu nome = falha de despacho. "
                f"DE-COORD designa/nudga; COMANDO só se a Entrega estiver mal atribuída.\n\n{body}\n")
    print(f"despacho: {len(achados)} achado(s) · sig {sig}" + (" (mudou)" if sig != prev_sig else " (igual)"))
    if achados and sig != prev_sig:
        send = os.path.expanduser("~/.claude/scripts/terminal-send.sh")
        msg = f"tick/despacho: {len(achados)} builder(s) ocioso(s) com Entrega executável — leia docs/ai-state/roadmap/DESPACHO.md"
        try: subprocess.run(["bash", send, "DE-COORD", msg], capture_output=True, text=True, timeout=30)
        except Exception: pass
    sys.exit(0)

# --- modo impressão (board-tui.sh): fila única do ROADMAP + fila única de PRs + terminais ---
if os.environ.get("PRINT") == "1":
    import textwrap
    O, T, B, G, R, Y, D, N = "\033[38;5;208m", "\033[38;5;79m", "\033[38;5;111m", "\033[38;5;150m", "\033[38;5;203m", "\033[38;5;221m", "\033[2m", "\033[0m"
    W = max(60, int(os.environ.get("COLUMNS") or 120))
    def hdr(color, txt):
        txt = txt if len(txt) <= W-2 else txt[:W-3] + "…"
        print(f"{color}\033[1m{txt}\033[0m{color} {'─'*max(0, W-len(txt)-2)}{N}")
    def wrap(txt, indent=0, first=""):
        # quebra em vez de truncar; indentação pendurada
        return textwrap.fill(txt, width=W, initial_indent=first, subsequent_indent=" "*indent, break_long_words=False, break_on_hyphens=False)
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%H:%M:%SZ")
    pc = R if "⚠" in prod else G
    print(f"\033[1mSTATUS BOARD\033[0m {D}· fila única tiers 1-2 · {now} · redesenha só quando muda{N}")
    print(f"{pc}{prod}{N}")
    print(wrap(f"QUANTO FALTA: {quanto}", indent=14))
    print(f"{Y}" + wrap(f"DECISÃO DA VEZ: {decisao or '—'}", indent=16) + N)
    print(); hdr(O, f"ROADMAP — fila completa ({len(entregas)} linhas · em curso / fila / estacionada)")
    for l in road[3:]:
        if l.startswith("§ "): print(f"\033[1m{O}{l}{N}"); continue
        if l.startswith("  QUANTO") or l.startswith("    P"): print(f"{D}{wrap(l.strip(), indent=4, first='  ')}{N}"); continue
        if l.startswith("· "): print(f"{Y}{wrap(l[2:], indent=2)}{N}"); continue
        if l == "": print(); continue
        if l.startswith("      →"): print(f"{D}" + wrap(l.strip(), indent=8, first="      ") + N)
        else:
            eid, rest = l[:5], l[5:].strip()
            col = "\033[1m" if "· em curso" in rest else (D if "estacionad" in rest else "")
            line = wrap(rest, indent=6, first=f"{eid.strip():<6}")
            print(f"{O}{line[:6]}{N}{col}{line[6:]}{N}")
    # § RESULTADOS — últimos RESULT records (results.jsonl; a fonte de "o que foi entregue", nunca mensagem)
    _rf = os.path.join(os.path.dirname(rm_p), "results.jsonl")
    if os.path.exists(_rf):
        import datetime as _dt
        _rs = []
        for _l in open(_rf, encoding="utf-8"):
            try: _rs.append(json.loads(_l))
            except Exception: pass
        _cut = ( _dt.datetime.now(_dt.timezone.utc) - _dt.timedelta(hours=24) ).strftime("%Y-%m-%dT%H:%M:%SZ")
        _rs = [r for r in _rs if r.get("ts","") >= _cut and not str(r.get("task","")).lower().startswith("posto") and r.get("status") != "posto"]
        _d = sum(1 for r in _rs if r.get("status")=="done"); _b = [r for r in _rs if r.get("status")!="done"]
        print(); hdr(G if not _b else Y, f"RESULTADOS 24 h — {_d} done · {len(_b)} blocked/failed (roadmap/results.jsonl)")
        for r in _rs[-6:]:
            print(wrap(f"{r.get('ts','')[11:16]}Z {r.get('task')} {r.get('status')} ({r.get('papel')}) {str(r.get('nota',''))[:60]}", indent=4, first="  "))
    # § COMUNICAÇÃO — eventos obrigatórios × ledger (comunicacao-obrigatoria.sh; derivado, sem LLM)
    _cf = os.path.join(os.path.dirname(rm_p), "..", "terminais", "COMUNICACAO-EM-FALTA.md")
    if os.path.exists(_cf):
        _cl = [l.rstrip("\n") for l in open(_cf, encoding="utf-8")]
        _sum = next((l.strip("* ") for l in _cl if l.startswith("**")), "")
        _falta = [l for l in _cl if "EM FALTA" in l]
        print(); hdr(R if _falta else G, f"COMUNICAÇÃO OBRIGATÓRIA — {_sum[:90]}")
        for l in _falta[:8]:
            c = [x.strip() for x in l.strip("|").split("|")]
            if len(c) >= 4: print(f"{R}" + wrap(f"{c[0]} {c[1]} → {c[2]} · {c[3]}", indent=4, first="  ") + N)
        if len(_falta) > 8: print(f"{D}  … +{len(_falta)-8} em falta (terminais/COMUNICACAO-EM-FALTA.md){N}")
    print(); hdr(T, f"FILA DE PRs — DE ({n_open} abertos · {n_cr} CR por responder · {n_ok} prontos · {n_falta} aprovados s/ review DE-MIG · {n_wait} aguardam review)")
    print(f"{D}ordem: prontos → aprovados s/ review humana → aguardam review → CR por responder → draft{N}")
    for l in fila_lines[3:]:
        col = G if "APPROVED ·" in l else (Y if "APPROVED(bot)" in l else (R if "CR por responder" in l else (D if "draft" in l else N)))
        print(f"{col}" + wrap(l, indent=6) + N)
    print(); hdr(B, "TERMINAIS (tiers 0-2) · agora")
    for papel, uuid, desc, label, stage in sorted(plan, key=lambda x: (reg.get(x[0], {}).get("tier", 9), x[0])):
        t = reg.get(papel, {})
        pre = f"{t.get('tier','?')} {papel:<9} "
        line = wrap(label, indent=len(pre), first=pre)
        print(f"{B}{line[:len(pre)]}{N}{line[len(pre):]}")
    print(f"\n{D}fonte: ROADMAP.md (manuscrito do COMANDO) · gh pr list (ao vivo) · registry.json · board-sync.sh — {now}{N}")
    sys.exit(0)

for papel, uuid, desc, label, stage in plan:
    print(f"{papel:9s} desc={desc[:70]!r}({len(desc)}c) | progress={label[:60]!r} v={'' if stage is None else round(stage,2)}")
    if DRY == "1": continue
    subprocess.run([C, "workspace-action", "--action", "set-description", "--workspace", uuid, "--description", desc], capture_output=True, timeout=10)
    if stage is None:
        subprocess.run([C, "set-progress", "1.0", "--label", label, "--workspace", uuid], capture_output=True, timeout=10)
    else:
        subprocess.run([C, "set-progress", f"{stage:.2f}", "--label", label, "--workspace", uuid], capture_output=True, timeout=10)
print(f"board-sync: {len(plan)} papeis {'(dry-run)' if DRY=='1' else 'atualizados'} · {fila}")
PY
