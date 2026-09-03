#!/usr/bin/env python3
"""posto-gate.py — Stop: papel do cockpit com TAREFA EM MAOS (row `puxada` por ele) nao termina o turno sem RESULT.

Contrato (_POLITICAS-COMUNS §Resultados): "Terminar e' result.sh, nao uma mensagem"; "bloqueio conta como resultado".
Medido 02-03/09 (diagnostico §11 #3, §13 A5): DE-MIG 26 turnos com CR-6446 em maos e 0 RESULT; DE-COORD 195 min de caderno
cheio/ledger vazio; 2 pulls em 24 h. O `completion-gate` cobra verificacao de CODIGO; este cobra o LEDGER.
Regra: se o papel tem row `puxada` (puxada_por=papel) e o ultimo RESULT dele nessa task e' ANTERIOR a `puxada_em` (ou nao
existe), o Stop e' bloqueado UMA vez por (papel, task, puxada_em) com a instrucao exata. Segundo Stop passa (evita loop).
Bypass: POSTO_GATE_DISABLED=1.
"""
import glob, json, os, sys

if os.environ.get("POSTO_GATE_DISABLED") == "1":
    sys.exit(0)
ws = os.environ.get("CMUX_WORKSPACE_ID") or ""
if not ws:
    sys.exit(0)
AI = os.environ.get("POSTO_GATE_AI") or os.path.expanduser("~/Claude/docs/ai-state")   # override so para teste (controlo positivo)
try:
    reg = json.load(open(f"{AI}/terminais/registry.json")).get("terminais") or {}
except Exception:
    sys.exit(0)
papel = next((p for p, e in reg.items() if e.get("workspace_uuid") == ws), None)
if not papel or papel in ("RESUMO", "COMANDO", "DECISAO"):
    sys.exit(0)
# ultimo RESULT do papel por task
last = {}
try:
    for l in open(f"{AI}/roadmap/results.jsonl", errors="replace"):
        try:
            e = json.loads(l)
        except Exception:
            continue
        if e.get("papel") == papel and e.get("task"):
            last[e["task"]] = e.get("ts", "")
except Exception:
    sys.exit(0)
pend = []
for q in glob.glob(f"{AI}/roadmap/filas/fila-*.jsonl"):
    try:
        for l in open(q, errors="replace"):
            r = json.loads(l)
            if r.get("status") == "puxada" and r.get("puxada_por") == papel:
                t = r.get("task"); pe = str(r.get("puxada_em") or "")
                if last.get(t, "") < pe:
                    pend.append((t, pe, os.path.basename(q)[5:-6]))
    except Exception:
        continue
if not pend:
    sys.exit(0)
# uma vez por (papel, task, puxada_em)
st_p = os.environ.get("POSTO_GATE_STATE") or os.path.expanduser("~/.claude/state/posto-gate.json")
try:
    st = json.load(open(st_p))
except Exception:
    st = {}
keys = [f"{papel}|{t}|{pe}" for t, pe, _ in pend]
novos = [k for k in keys if k not in st]
if not novos:
    sys.exit(0)
for k in novos:
    st[k] = 1
try:
    os.makedirs(os.path.dirname(st_p), exist_ok=True)
    json.dump(st, open(st_p, "w"))
except Exception:
    pass
t, pe, fr = pend[0]
print(
    f"BLOQUEADO pelo posto-gate: {papel} tem {len(pend)} tarefa(s) EM MAOS sem RESULT desde a puxada — {t} [{fr}] puxada em {pe[11:16]}Z.\n"
    f"Terminar e' registar, nao parar: bash ~/.claude/scripts/result.sh {papel} {t} done|blocked|posto '<prova ou motivo>' "
    f"— `posto` se estas a espera de terceiro (diz o que vigias e como expira). Este aviso sai UMA vez por puxada; o proximo Stop passa. "
    f"Bypass: POSTO_GATE_DISABLED=1.",
    file=sys.stderr,
)
sys.exit(2)
