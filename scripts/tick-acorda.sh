#!/usr/bin/env bash
# tick-acorda.sh — o tick ACORDA por evento (dono 30/08). rev 2 (23:5xZ, achado do COMANDO): a rev 1 restaurava o estado
# INTEIRO se UM envio do lote falhasse → re-alarmava tudo a cada tick, indefinidamente. Agora: estado commitado POR EVENTO
# (só o que foi entregue sai da lista); envio falhado tenta de novo até 3× e depois é abandonado com linha no tick.log.
# Regra: 1 evento -> 1 destinatário -> 1 mensagem-ponteiro, SÓ no delta. Sem LLM.
set -uo pipefail
AI="$HOME/Claude/docs/ai-state"; ST="$HOME/.claude/state/tick-acorda.json"; SEND="$HOME/Claude/.claude/scripts/terminal-send.sh"; TL="$AI/terminais/tick.log"
EV="$(mktemp)"; OK="$(mktemp)"; KO="$(mktemp)"
python3 - "$AI" "$ST" >"$EV" <<'PY'
import json,os,sys,subprocess,re
AI,STp=sys.argv[1],sys.argv[2]
st=json.load(open(STp)) if os.path.exists(STp) else {}
sent=set(st.get('sent',[])); tries=st.get('tries',{})
out=[]  # (dest, msg, key)
def ev(dest,msg,key):
    if key in sent: return
    if tries.get(key,0)>=3: return
    out.append((dest,msg,key))
# 1) deploy FAILED novo
try:
    j=subprocess.run(['railway','deployment','list','--json'],cwd=os.path.expanduser('~/Claude/GitHub/raiz-data-engine'),capture_output=True,text=True,timeout=60).stdout
    d=json.loads(j or '[]'); d=d if isinstance(d,list) else d.get('deployments',[])
    for x in [x.get('node',x) for x in d[:5]]:
        if x.get('status')=='FAILED' and x.get('id'):
            ev('DE-COORD',f"tick/acorda: deploy FAILED {x['id'][:8]} ({str(x.get('createdAt',''))[11:16]}Z) — leia o log do deployment e o predeploy; fila pode estar travada.",f"deploy|{x['id']}"); break
except Exception: pass
# 2) COMUNICACAO-EM-FALTA novas (máx 4/tick)
try:
    n=0
    for l in open(f'{AI}/terminais/COMUNICACAO-EM-FALTA.md'):
        if 'EM FALTA' not in l or not l.startswith('|'): continue
        c=[x.strip() for x in l.strip('|\n').split('|')]; key=f"emfalta|{c[0]}|{c[1]}"
        if key in sent or tries.get(key,0)>=3: continue
        dest=(c[2].split('/')[0] or 'COMANDO').strip()
        ev(dest,f"tick/acorda: comunicação obrigatória EM FALTA: {c[1]} ({c[0]}) — leia terminais/COMUNICACAO-EM-FALTA.md e emita/regista.",key); n+=1
        if n>=4: break
except Exception: pass
# 2b) RESULT blocked/failed/retracted novo -> COMANDO
try:
    rf=f'{AI}/roadmap/results.jsonl'
    if os.path.exists(rf):
        for l in open(rf):
            try: e=json.loads(l)
            except: continue
            if e.get('status')=='posto': continue   # mecanismo: o STATUS é o campo (31/08)
            if str(e.get('task','')).lower().startswith('posto') and str(e.get('ts',''))<'2026-08-31T06:00': continue   # compat: posto-* registados como blocked ANTES do status existir
            if e.get('papel')=='tick': continue   # 01/09: retractação AUTOMÁTICA (CR sem push) não é evento raro — já aparece na fila e no MUDOU
            if e.get('status') in ('blocked','failed','retracted'):
                ev('COMANDO',f"tick/acorda: RESULT {e.get('status')} em {e.get('task')} ({e.get('papel')}): {str(e.get('nota',''))[:120]} — leia roadmap/results.jsonl",f"result|{e.get('ts')}|{e.get('task')}")
except Exception: pass
# 2c) HUMAN_REVIEW_REQUIRED do bot (review COMMENTED)
try:
    R=os.environ.get('DE_REPO','Raiz-Educacao-SA/raiz-data-engine')
    j=subprocess.run(['gh','pr','list','-R',R,'--state','open','--json','number,reviews','--limit','60'],capture_output=True,text=True,timeout=60).stdout
    novos=[]
    for pr in json.loads(j or '[]'):
        k=sum(1 for r in pr.get('reviews',[]) if 'HUMAN_REVIEW_REQUIRED' in (r.get('body') or ''))
        if k:
            key=f"human|{pr['number']}|{k}"
            if key not in sent and tries.get(key,0)<3: novos.append((key,f"#{pr['number']}×{k}"))
    if novos:
        ev('DE-COORD',f"tick/acorda: HUMAN_REVIEW_REQUIRED do bot (review COMMENTED, invisível ao reviewDecision) em {' '.join(n for _,n in novos[:6])} — triar o humano (dono/Marcelo) e acionar de-aprovador-externo se for o caso.","human|"+"+".join(k for k,_ in novos))
        # NAO mutar a chave aqui: ev() testa a chave e o ledger tem de gravar A MESMA
        # (31/08: a mutacao gravava human|A+B|A|B e ev() testava human|A+B -> nunca casava,
        #  logo o alarme repetia para sempre; os individuais sao expandidos no leitor abaixo)
except Exception: pass
# 2d) conflito de retractacao cruzada nas filas (01/09)
# O fila_empurra marca a row quando alguem retrata um `done` que NAO e seu (colisao de identificador):
# nao reabre, e regista `conflito_retractacao`. Sem leitor, esse campo era um bilhete numa gaveta —
# a mesma familia do campo de excepcao que codigo nenhum consultava. Agora acorda quem tria.
try:
    import glob as _g
    for _q in _g.glob(f'{AI}/roadmap/filas/fila-*.jsonl'):
        for _l in open(_q):
            try: _r=json.loads(_l)
            except Exception: continue
            _c=_r.get('conflito_retractacao')
            if not _c: continue
            _k=f"confret|{_r.get('task')}|{_c}"
            if _k in sent or tries.get(_k,0)>=3: continue
            ev('COMANDO', f"tick/acorda: conflito de retractacao em {_r.get('task')} ({_c}) — alguem retratou um done que nao e seu; a linha NAO foi reaberta. Ver {os.path.basename(_q)}", _k)
except Exception: pass
# 2e) triagem de PR: tarefas CR-* com dono DE-COORD (01/09). O DE-COORD é tier 0 — não recebe empurrão e
# não puxa; 11 tarefas ficaram na fila-revisao sem que nada o acordasse. Contrato dele: acorda_por "tick da fila".
try:
    import glob as _g2
    _tri=[]
    for _q in _g2.glob(f'{AI}/roadmap/filas/fila-*.jsonl'):
        for _l in open(_q):
            try: _r=json.loads(_l)
            except Exception: continue
            if str(_r.get('task','')).startswith('CR-') and _r.get('status')=='fila' and _r.get('builder_sugerido')=='DE-COORD':
                _k=f"triagem|{_r['task']}"
                if _k not in sent and tries.get(_k,0)<3: _tri.append((_k,_r['task']))
    if _tri:
        _agg='triagem|'+'+'.join(k for k,_ in _tri[:8])
        ev('DE-COORD',f"tick/acorda: {len(_tri)} PR(s) com alteracoes pedidas sem dono na fila-revisao: {' '.join(t for _,t in _tri[:8])} — atribui builder (edita builder_sugerido) ou responde tu. Ver roadmap/filas/fila-revisao.jsonl",_agg)
except Exception: pass
# 2f) linha E- nova em qualquer fila -> OTIMIZADOR (01/09). O contrato dele declara posto "acorda quando uma
# linha E- nasce" e NADA emitia esse evento (7,6 h calado com 6 Entregas novas). Baseline na 1ª corrida: sem emitir.
try:
    _KP=os.path.expanduser('~/.claude/state/tick-acorda.tasks.json')
    _agora=set()
    for _q in _g2.glob(f'{AI}/roadmap/filas/fila-*.jsonl'):
        for _l in open(_q):
            try: _t=json.loads(_l).get('task','')
            except Exception: continue
            if re.fullmatch(r'E-\d+[a-z]?',_t): _agora.add(_t)
    if not os.path.exists(_KP):
        json.dump(sorted(_agora),open(_KP,'w'))       # baseline: grava e cala-se (lição do MUDOU 133)
    else:
        _antes=set(json.load(open(_KP)))
        _novas=sorted(_agora-_antes)
        _pend=[t for t in _novas if f"novaE|{t}" not in sent and tries.get(f"novaE|{t}",0)<3]
        if _pend:
            _agg='novaE|'+'+'.join(f"novaE|{t}" for t in _pend[:8])
            ev('OTIMIZADOR',f"tick/acorda: Entrega(s) nova(s) no roadmap: {' '.join(_pend[:8])} — o teu posto declara revisao do roadmap futuro",_agg)
        json.dump(sorted(_agora),open(_KP,'w'))
except Exception: pass
# 3) passo do tick com rc!=0 (novo)
try:
    bad=[l.strip() for l in open(f'{AI}/terminais/tick.log') if ' rc=' in l and 'rc=0 ' not in l and not l.strip().endswith('rc=0')]
    if bad: ev('COMANDO',f"tick/acorda: passo do tick falhou: {bad[-1][-90:]} — leia terminais/tick.log",f"badstep|{bad[-1][:40]}")
except Exception: pass
# 01/09 (medido): o corte `out[:6]` era SILENCIOSO — 9 eventos gerados, o 9º (triagem ao DE-COORD) caía
# todos os ciclos atrás de 8 RESULTs ao COMANDO, e ninguém via. Agora: teto POR DESTINATÁRIO (4) em vez de
# global, e o que fica adiado sai escrito no tick.log — adiado não é perdido (os eventos regeneram-se
# no ciclo seguinte), mas adiado sem dizer é.
_por=dict(); _emit=[]; _adiados=0
for d,m,k in out:
    if _por.get(d,0)>=4: _adiados+=1; continue
    _por[d]=_por.get(d,0)+1; _emit.append((d,m,k))
if _adiados:
    import datetime as _dt
    open(f'{AI}/terminais/tick.log','a').write(f"{_dt.datetime.now(_dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')} step=tick-acorda ADIADOS {_adiados} evento(s) por teto de 4/destinatario (regeneram no proximo ciclo)\n")
for d,m,k in _emit: print(f"{d}\t{m[:380]}\t{k}")
PY
while IFS=$'\t' read -r DEST MSG KEY; do
  [ -z "${DEST:-}" ] && continue
  if bash "$SEND" "$DEST" "$MSG" >/dev/null 2>&1; then echo "$KEY" >> "$OK"; else echo "$KEY" >> "$KO"; fi
done < "$EV"
python3 - "$ST" "$OK" "$KO" "$TL" <<'PY'
import json,os,sys,datetime
STp,okp,kop,tl=sys.argv[1:5]
st=json.load(open(STp)) if os.path.exists(STp) else {}
sent=set(st.get('sent',[])); tries=st.get('tries',{})
for l in open(okp):
    k=l.strip()
    if not k: continue
    sent.add(k)
    # agregado human|<k1>+<k2>: gravar TAMBEM cada chave individual human|<pr>|<n>,
    # senao cada nova combinacao de PRs gera chave nova e o alarme nunca silencia.
    # A contagem <n> faz parte da chave: comentario NOVO do bot muda n -> volta a disparar.
    for _pref in ('human|','triagem|','novaE|'):
        if k.startswith(_pref):
            for part in k[len(_pref):].split('+'):
                if part.startswith(_pref): sent.add(part)
    tries.pop(k,None)
for l in open(kop):
    k=l.strip()
    if not k: continue
    tries[k]=tries.get(k,0)+1
    if tries[k]>=3:
        open(tl,'a').write(f"{datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')} step=tick-acorda ABANDONADO após 3 falhas: {k[:80]}\n")
st['sent']=sorted(sent)[-500:]; st['tries']=tries
# open(...,'w') TRUNCA antes do dump: leitor concorrente ve ficheiro VAZIO e le-o como
# "nada enviado ainda" -> re-alarma tudo. tmp no MESMO dir + os.replace = troca atomica.
# (decisao COMANDO 31/08 15:0xZ; padrao ja medido 4/25 vs 25/25 noutro ledger)
import tempfile as _tf
_fd,_tmp=_tf.mkstemp(dir=os.path.dirname(STp) or '.'); os.close(_fd)
with open(_tmp,'w') as _f: json.dump(st,_f)
os.replace(_tmp,STp)
PY
rm -f "$EV" "$OK" "$KO"
