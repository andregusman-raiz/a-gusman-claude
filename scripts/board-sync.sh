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
  --json number,title,headRefName,reviewDecision,mergeStateStatus,isDraft,updatedAt,author 2>/dev/null || echo "[]")

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

def entregas_de(papel):
    out = []
    for e in entregas:
        head = e.split(" · prova:")[0]
        if re.search(r"\b" + re.escape(papel) + r"\b", head):
            eid = head.split(" · ")[0]
            resto = " · ".join(head.split(" · ")[1:])
            prova = e.split(" · prova:")[1].strip() if " · prova:" in e else ""
            out.append((eid, resto[:90], prova[:70]))
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
    return f"#{n} {txt} · {ago(p.get('updatedAt',''))}", stage

# resumo da fila para o DE-COORD
n_open = len(prs); n_cr = sum(1 for p in prs if p.get("reviewDecision") == "CHANGES_REQUESTED")
n_ok_all = [p for p in prs if p.get("reviewDecision") == "APPROVED"]; n_falta = sum(1 for p in n_ok_all if falta_humana(p))
n_ok = len(n_ok_all) - n_falta; n_wait = n_open - n_cr - len(n_ok_all)
fila = f"fila: {n_open} abertos · {n_cr} CR por responder · {n_ok} prontos p/ merge · {n_falta} aprovados s/ review DE-MIG · {n_wait} aguardam review"

plan = []
for papel, t in reg.items():
    if t.get("tier", 9) > 2 or t.get("estado") != "aberto" or not t.get("workspace_uuid"): continue
    uuid = t["workspace_uuid"]
    ents = entregas_de(papel)
    if papel == "COMANDO":
        desc = f"QUANTO FALTA {quanto[:60]} · decisão da vez: {decisao_id}"
        label, stage = f"{n_open} PRs abertos · decisão da vez {decisao_id}", None
    elif papel == "DE-COORD":
        desc = "integrador: cada PR entra 1 vez, na ordem, com NNN reservado; promove contadores do ROADMAP"
        label, stage = fila, None
    elif papel == "RESUMO":
        desc = "delegado de voz do dono sobre o COMANDO (A19) até a SPEC implantada — não é papel"
        label, stage = "F1b em curso · Q2/D-090/D-091/A-011 com o dono", None
    else:
        desc = " | ".join(f"{eid} {resto} · prova: {prova}" if prova else f"{eid} {resto}" for eid, resto, prova in ents) or "— sem Entrega no ROADMAP —"
        # PR do papel: branch atual do cwd/worktree, senao PR citado na Entrega
        pr = None
        for path in (t.get("worktree"), t.get("cwd")):
            if path and os.path.isdir(path):
                b = branch_of(path)
                if b in by_branch: pr = by_branch[b]; break
        if pr is None and prs_by_papel.get(papel):
            pr = sorted(prs_by_papel[papel], key=lambda p: p.get("updatedAt",""), reverse=True)[0]
        if pr is None:  # token WS-n da linha E- do papel casa com titulo/branch do PR (ate o #PR entrar no ROADMAP)
            toks = {m.group(0).upper().replace("-", "") for e in ents for m in re.finditer(r"WS-?\d+", e[1], re.I)}
            cands = [p for p in prs if toks & {m.group(0).upper().replace("-", "") for m in re.finditer(r"WS-?\d+", p.get("title", "") + " " + p.get("headRefName", ""), re.I)}]
            if cands: pr = sorted(cands, key=lambda p: p.get("updatedAt", ""), reverse=True)[0]
        if pr is None:
            for _, resto, prova in ents:
                m = re.search(r"#(\d{4})", resto + prova)
                if m and int(m.group(1)) in by_num: pr = by_num[int(m.group(1))]; break
        if pr:
            label, stage = pr_label(pr)
            n_more = len(prs_by_papel.get(papel, [])) - 1
            if n_more > 0: label = f"{label} (+{n_more} PR)"
        else: label, stage = ("sem PR aberto · " + (ents[0][0] if ents else "sem Entrega")), (2/8 if ents else 0.0)
    plan.append((papel, uuid, desc[:200], label[:120], stage))

for papel, uuid, desc, label, stage in plan:
    print(f"{papel:9s} desc={desc[:70]!r} | progress={label[:60]!r} v={'' if stage is None else round(stage,2)}")
    if DRY == "1": continue
    subprocess.run([C, "workspace-action", "--action", "set-description", "--workspace", uuid, "--description", desc], capture_output=True, timeout=10)
    if stage is None:
        subprocess.run([C, "set-progress", "1.0", "--label", label, "--workspace", uuid], capture_output=True, timeout=10)
    else:
        subprocess.run([C, "set-progress", f"{stage:.2f}", "--label", label, "--workspace", uuid], capture_output=True, timeout=10)
print(f"board-sync: {len(plan)} papeis {'(dry-run)' if DRY=='1' else 'atualizados'} · {fila}")
PY
