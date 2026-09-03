#!/usr/bin/env bash
# inalcancaveis-derive.sh — deriva terminais/INALCANCAVEIS.md do send.log (>=3 recusas SEGUIDAS por papel).
# 03/09: corre em CADA envio (falha OU sucesso) — antes so na recusa, e uma entrada envelhecida (SALARIOS, 27 h) ficava la.
LOG="${1:-$HOME/Claude/docs/ai-state/terminais/send.log}"; OUT="${2:-$HOME/Claude/docs/ai-state/terminais/INALCANCAVEIS.md}"
python3 - "$LOG" "$OUT" <<'PYESC'
import re,sys,collections
log,out=sys.argv[1],sys.argv[2]
seq=collections.defaultdict(list)
for l in open(log,errors='replace'):
    m=re.match(r'(\S+) FALHA-MENU-ABERTO papel=(\S+) .*?razao=(\S+)',l)
    if m: seq[m.group(2)].append((m.group(1),'F',m.group(3))); continue
    m=re.match(r'(\S+) \S+ from=\S+ to=(\S+) ',l)
    if m: seq[m.group(2)].append((m.group(1),'ok',''))
rows=[]
for p,L in seq.items():
    n=0; first=None
    for ts,k,r in reversed(L):
        if k!='F': break
        n+=1; first=(ts,r)
    if n>=3: rows.append((p,first[0],n,first[1]))
with open(out,'w') as f:
    f.write('# Terminais INALCANCAVEIS pelo processo (derivado do send.log; >=3 recusas seguidas)\n\n')
    f.write('O tick, o vigia e o empurra nao conseguem falar com estes terminais. Enquanto durar, nada os acorda.\n\n')
    if rows:
        f.write('| papel | desde (UTC) | recusas seguidas | razao |\n|---|---|---|---|\n')
        for p,ts,n,r in sorted(rows,key=lambda x:x[1]): f.write(f'| {p} | {ts} | {n} | {r} |\n')
    else: f.write('(nenhum)\n')
PYESC
