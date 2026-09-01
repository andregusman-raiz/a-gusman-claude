#!/usr/bin/env bash
# estado-diff.sh — o que MUDOU desde o ultimo tick, derivado dos ARTEFACTOS.
# Substitui a dependencia de os terminais reportarem: mensagem e opcional, mudanca de artefacto nao e.
# Absorve o terminais-posto.sh: seccao MUDOU (efeito) + seccao PARADO (silencio COM trabalho).
# Sem LLM. Nunca age: mede, escreve MUDOU.md e avisa o COMANDO so quando ha diferenca.
set -uo pipefail
AI="$HOME/Claude/docs/ai-state"; REPO=Raiz-Educacao-SA/raiz-data-engine
SNAP="$HOME/.claude/state/estado-snapshot.json"; OUT="$AI/roadmap/MUDOU.md"
mkdir -p "$(dirname "$SNAP")"
PRS=$(gh pr list --repo $REPO --state open --json number,mergeStateStatus,reviewDecision,title --limit 60 2>/dev/null || echo '[]')
PROD=$(for p in /health /v1/health /openapi.json; do printf '%s=%s ' "$p" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 12 https://raiz-data-engine-production.up.railway.app$p 2>/dev/null)"; done)
AI="$AI" SNAP="$SNAP" OUT="$OUT" PRS="$PRS" PROD="$PROD" python3 <<'PY'
import json,os,glob,re,subprocess
from datetime import datetime,timezone
AI,SNAP,OUT=os.environ['AI'],os.environ['SNAP'],os.environ['OUT']
now=datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%MZ')
novo={'prod':os.environ['PROD'].strip(),'prs':{},'claims':{},'entregas':{},'resultados':{}}
for pr in json.loads(os.environ['PRS'] or '[]'):
    novo['prs'][str(pr['number'])]=f"{pr['mergeStateStatus']}/{pr.get('reviewDecision') or '-'}"
try:
    for b,c in json.load(open(f'{AI}/de-pr-queue/claims.json'))['claims'].items():
        novo['claims'][b]=str(c.get('status') or c.get('estado') or '')[:60]
except Exception: pass
for f in glob.glob(f'{AI}/roadmap/*.md'):
    if f.endswith(('ROADMAP.md','MUDOU.md')): continue
    for l in open(f,errors='replace'):
        m=re.match(r'^  (E-[0-9]+[a-z]?) ·.*?· (em curso|fila|estacionada|pronta|PRONTA|BLOQUEADA|bloqueada)\b',l)
        if m: novo['entregas'][m.group(1)]=m.group(2).lower()
# 01/09 (ordem do dono): este derivador lia SÓ o rótulo do .md, e o rótulo não é o estado — o estado
# está no results.jsonl. Consequência medida: quando um trabalho TERMINAVA BEM, nenhum mecanismo
# avisava o COMANDO (o despertador do tick só dispara em blocked/failed/retracted, e o painel é preciso
# ir ver). O aviso dependia de o papel mandar mensagem — prática, não mecanismo: a folha produziu 4 PRs
# e 2 entregas e registou 1 resultado, "não esteve parada, esteve calada". Agora o desfecho de cada
# tarefa entra no diff como qualquer outra mudança, sem alarme novo e sem depender de ninguém se lembrar.
try:
    for l in open(f'{AI}/roadmap/results.jsonl'):
        try: e=json.loads(l)
        except Exception: continue
        if e.get('status') in ('posto','anulado'): continue   # vigília declarada e registo retirado não são desfecho
        t=e.get('task')
        if t: novo['resultados'][t]=f"{e.get('status')} ({e.get('papel')})"
except Exception: pass
velho=json.load(open(SNAP)) if os.path.exists(SNAP) else None
json.dump(novo,open(SNAP,'w'),ensure_ascii=False,indent=1)
if velho is None: print('estado-diff: primeiro snapshot gravado, sem diff'); raise SystemExit(0)
L=[]
if velho.get('prod')!=novo['prod']: L.append(f"PROD: {velho.get('prod')} -> {novo['prod']}")
for k in ('prs','claims','entregas','resultados'):
    a,b=velho.get(k,{}),novo[k]
    for i in sorted(set(a)|set(b)):
        if a.get(i)!=b.get(i):
            rot={'prs':'PR #','claims':'claim ','entregas':'','resultados':'RESULT '}[k]
            L.append(f"{rot}{i}: {a.get(i) or 'NOVO'} -> {b.get(i) or 'SAIU'}")
if not L: print('estado-diff: nada mudou'); raise SystemExit(0)
open(OUT,'w').write(f"# MUDOU desde o tick anterior · {now}\n\n"+'\n'.join(f'- {x}' for x in L)+'\n')
print(f'estado-diff: {len(L)} mudancas'); [print('  '+x) for x in L[:20]]
subprocess.run([os.path.expanduser('~/.claude/scripts/terminal-send.sh'),'COMANDO',
  f"MUDOU ({len(L)}): "+' · '.join(L[:3])+(' …' if len(L)>3 else '')+" — le roadmap/MUDOU.md"],capture_output=True,timeout=120)
PY
bash "$HOME/.claude/scripts/terminais-posto.sh" 2>&1 | sed 's/^/[posto] /'
