#!/usr/bin/env bash
# roadmap-restante.sh — UNICA fonte da meta do COMANDO: estado deriva do ultimo RESULT por task.
# Imprime "ROADMAP: faltam N de M" (+ lista) e sai 1 se N>0. Sem LLM. Usado pelo /goal e pelo orq-goal-guard.
python3 - <<'PY'
import json,pathlib
R=pathlib.Path.home()/"Claude/docs/ai-state/roadmap"; u={}
for l in (R/"results.jsonl").read_text().splitlines():
    try: d=json.loads(l)
    except Exception: continue
    t=d.get("task") or d.get("tarefa")
    if t: u[t]=d.get("estado") or d.get("status") or ""
T=set()
for f in R.glob("filas/fila-*.jsonl"):
    for l in f.read_text().splitlines():
        if l.strip():
            try: T.add(json.loads(l).get("task"))
            except Exception: pass
F=sorted(t for t in T if t and u.get(t) not in ("done","estacionada"))
print(f"ROADMAP: faltam {len(F)} de {len(T)}" + (" — "+" ".join(F) if F else " — COMPLETO"))
raise SystemExit(1 if F else 0)
PY
