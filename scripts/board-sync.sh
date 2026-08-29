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

def line(prefix):
    for l in rm:
        if l.startswith(prefix): return l[len(prefix):].strip()
    return ""
quanto = line("QUANTO FALTA:")
decisao = line("DECISÃO DA VEZ (classe A):")
decisao_id = (re.match(r"\s*([A-Z]-\d+|Q\d+)", decisao) or [None, "?"])[1] if decisao else "?"
entregas = [l.strip() for l in rm if l.startswith("  E-")]

PAPEIS_RE = re.compile(r"\b(COMANDO|DE-COORD|DE-MIG|DE-DATA|DE-SYNC|FUNIL)\b")
def dono_da_entrega(e):
    head = e.split(" · prova:")[0]
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
prs_by_papel = {}
for p in prs:
    path = wt_branch_to_path.get(p["headRefName"])
    pap = papel_of_path(path) if path else None
    if pap: prs_by_papel.setdefault(pap, []).append(p)

# condicao do ROADMAP que o gh nao mostra: PR com migration exige review HUMANA (DE-MIG) — APPROVED so do bot nao e luz verde
_det = {}
def detail(n):
    if n in _det: return _det[n]
    d = {"human_ok": False, "migration": False}
    try:
        r = subprocess.run(["gh", "pr", "view", str(n), "-R", os.environ.get("DE_REPO", "Raiz-Educacao-SA/raiz-data-engine"), "--json", "reviews,files"], capture_output=True, text=True, timeout=20)
        j = json.loads(r.stdout or "{}")
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
def papel_do_pr(p):
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
try:
    code = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "-m", "10", os.environ.get("DE_PROD_READY_URL", "https://dataengine.raizeducacao.com.br/ready")], capture_output=True, text=True, timeout=15).stdout.strip()
except Exception: code = "?"
prod = "PROD ok" if code == "200" else f"PROD /ready={code} ⚠"
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
road = [f"{prod} · QUANTO FALTA {quanto[:70]}", f"DECISÃO DA VEZ: {decisao[:90] or '—'}", ""]
for e in entregas:
    head = e.split(" · prova:")[0]; parts = head.split(" · "); eid = parts[0]; resto = " · ".join(parts[1:])
    prova = e.split(" · prova:")[1].strip() if " · prova:" in e else ""
    prs_e = sorted(by_entrega.get(eid, []), key=lambda p: p.get("updatedAt", ""), reverse=True)
    prtxt = " | ".join(f"#{p['number']} {short_status(p)} @{(p.get('headRefOid') or '')[:7]}" for p in prs_e[:2]) or "sem PR"
    road.append(f"{eid:<5} {resto[:95]}")
    road.append(f"      → {prtxt}" + (f" · prova: {prova[:60]}" if prova else ""))
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

# --- modo impressão (board-tui.sh): fila única do ROADMAP + fila única de PRs + terminais ---
if os.environ.get("PRINT") == "1":
    O, T, B, G, R, Y, D, N = "\033[38;5;208m", "\033[38;5;79m", "\033[38;5;111m", "\033[38;5;150m", "\033[38;5;203m", "\033[38;5;221m", "\033[2m", "\033[0m"
    W = int(os.environ.get("COLUMNS") or 120)
    try: H = int(os.environ.get("LINES") or subprocess.run(["tput", "lines"], capture_output=True, text=True, timeout=3).stdout.strip() or 45)
    except Exception: H = 45
    def hdr(color, txt): print(f"{color}\033[1m{txt}\033[0m{color} {'─'*max(0, W-len(txt)-2)}{N}")
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%H:%M:%SZ")
    pc = R if "⚠" in prod else G
    print(f"\033[1mSTATUS BOARD\033[0m {D}· fila única tiers 1-2 · {now}{N}   {pc}{prod}{N}   QUANTO FALTA {quanto[:80]}")
    print(f"{Y}DECISÃO DA VEZ:{N} {decisao[:W-16] or '—'}")
    print(); hdr(O, f"ROADMAP — Entregas em curso ({len(entregas)})")
    for i, l in enumerate(road[3:]):
        if l.startswith("      →"): print(f"{D}{l[:W]}{N}")
        else: print(f"{O}{l[:5]}{N}{l[5:W]}")
    print(); hdr(T, f"FILA DE PRs — DE ({n_open} abertos · {n_cr} CR por responder · {n_ok} prontos · {n_falta} aprovados s/ review DE-MIG · {n_wait} aguardam review)")
    # orçamento de linhas: cabeçalho(2)+vazio+hdr roadmap+2/E+vazio+hdr PRs+vazio+hdr terminais+1 linha+rodapé
    usados = 2 + 1 + 1 + 2*len(entregas) + 1 + 1 + 1 + 1 + 1 + 1
    pr_budget = max(3, H - usados)
    lines_pr = fila_lines[3:]
    show = lines_pr if len(lines_pr) <= pr_budget else lines_pr[:pr_budget-1]
    for l in show:
        col = G if "APPROVED ·" in l else (Y if "APPROVED(bot)" in l else (R if "CR por responder" in l else (D if "draft" in l else N)))
        print(f"{col}{l[:W]}{N}")
    if len(show) < len(lines_pr): print(f"{D}… +{len(lines_pr)-len(show)} PRs (todos 'CR por responder' → autores) — aumente o pane para ver{N}")
    print(); hdr(B, "TERMINAIS (tiers 0-2) · agora")
    cells = []
    for papel, uuid, desc, label, stage in sorted(plan, key=lambda x: (reg.get(x[0], {}).get("tier", 9), x[0])):
        if papel in ("RESUMO", "COMANDO", "DE-COORD"): continue
        cells.append(f"{B}{papel}{N} {label.split(' · @')[0][:44]}")
    print("  ·  ".join(cells)[:W*2])
    print(f"{D}fonte: ROADMAP.md · gh pr list · registry.json · board-sync.sh — {now} · a cada {os.environ.get('BOARD_TUI_REFRESH','60')}s{N}")
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
