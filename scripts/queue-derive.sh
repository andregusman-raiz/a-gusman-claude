#!/usr/bin/env bash
# queue-derive.sh — snapshot do QUEUE.md GERADO do GitHub (falha 6: estado manual diverge; snapshot estava em 28/08).
# Escreve/atualiza SÓ o bloco entre <!-- queue-derive:ini --> e <!-- queue-derive:fim --> no topo do QUEUE.md.
set -uo pipefail
R="${DE_REPO:-Raiz-Educacao-SA/raiz-data-engine}"; Q="$HOME/Claude/docs/ai-state/de-pr-queue/QUEUE.md"
S=$(gh pr list -R "$R" --state open --json number,isDraft,reviewDecision,mergeStateStatus --limit 100 2>/dev/null | python3 -c "
import sys,json,datetime
d=json.load(sys.stdin); nd=[p for p in d if not p['isDraft']]
cr=sum(1 for p in nd if p.get('reviewDecision')=='CHANGES_REQUESTED'); ok=sum(1 for p in nd if p.get('reviewDecision')=='APPROVED' and p.get('mergeStateStatus')=='CLEAN')
m=$(:) if False else 0
print(f\"{len(nd)} abertos não-draft · {cr} em CR · {ok} APPROVED+CLEAN · gerado {datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%MZ')} por queue-derive.sh (NUNCA editar à mão)\")")
M=$(gh pr list -R "$R" --state merged --search "merged:>=$(date -u -v-24H +%Y-%m-%dT%H:%M:%SZ)" --json number --jq length 2>/dev/null)
LINE="> **$S · $M merges/24 h**"
python3 - "$Q" "$LINE" <<'PY'
import sys,re
q,line=sys.argv[1],sys.argv[2]
s=open(q).read()
blk=f"<!-- queue-derive:ini -->\n{line}\n<!-- queue-derive:fim -->"
if '<!-- queue-derive:ini -->' in s:
    s=re.sub(r'<!-- queue-derive:ini -->.*?<!-- queue-derive:fim -->', blk, s, flags=re.S)
else:
    lines=s.splitlines(True)
    # substitui a linha 5 (snapshot manual velho) se começar por '> **'
    if len(lines)>4 and lines[4].startswith('> **'): lines[4]=blk+'\n'
    else: lines.insert(4, blk+'\n')
    s=''.join(lines)
open(q,'w').write(s); print('QUEUE snapshot derivado')
PY
