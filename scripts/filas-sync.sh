#!/usr/bin/env bash
# filas-sync.sh — re-deriva as filas a partir dos programas .md SEM perder estado: linha E- nova no .md → nova row (status fila);
# row existente mantém status/puxada; row cuja linha sumiu do .md fica (histórico). Achado do COMANDO 23:2xZ: E-20/E-35a no .md
# e fora das filas (invisíveis ao despacho); derivação era one-shot (20:20Z). Corre no tick, sem LLM.
set -uo pipefail
python3 - "$HOME/Claude/docs/ai-state/roadmap" <<'PY'
import re,json,os,sys,fcntl
D=sys.argv[1]; add=[]
# 01/09 (COMANDO): papeis DERIVADOS do registry.json — antes eram lista hardcoded e o defeito
# repetiu-se: 31/08 com SALARIOS (ver comentario abaixo) e 01/09 com FGTS (E-200..E-203 ficaram
# com builder vazio e o tick ofereceu trabalho da VM do FGTS a DE-DATA, que recusou). O proprio
# comentario ja nomeava a reparacao certa: 'derivar os papeis do registry.json em vez desta lista'.
# Fallback explicito se o registry nao ler: mantem o comportamento antigo em vez de ficar sem papeis.
try:
    _PAPEIS=sorted(json.load(open(os.path.join(os.path.dirname(D),'terminais','registry.json')))['terminais'].keys(), key=len, reverse=True)
except Exception as _e:
    print(f'filas-sync: registry ilegivel ({_e!r}) — a usar lista de recurso', file=sys.stderr)
    _PAPEIS=['DE-BUILD-B','DE-COORD','DE-DATA','DE-SYNC','DE-MIG','SALARIOS','FUNIL','FGTS']
_BUILDER_RE=r'· ((?:'+'|'.join(re.escape(_p) for _p in _PAPEIS)+r'|Codex[^·]*))'

import glob, datetime
now_iso=datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
# COMANDO 23:4xZ: task que muda de programa duplicava (E-35b em funil E prontidao) — "existe" é em QUALQUER fila
todas=set()
for qq in glob.glob(f'{D}/filas/fila-*.jsonl'):
    for l in open(qq):
        try: todas.add(json.loads(l)['task'])
        except Exception: pass
# 01/09: a lista de programas era HARDCODED — terceira lista assim num dia (papéis no empurra, papéis
# no pull, programas aqui), todas a falhar da mesma forma: o que não está na lista não existe, em
# silêncio. Um programa novo (fgts) ficava sem fila e ninguém dava por isso. Agora deriva-se do
# directório: é programa o .md que tem pelo menos uma linha de Entrega no formato "  E-nn · ".
_ignora={'ROADMAP','MEDICOES','MUDOU','DESPACHO'}
_progs=[]
for _f in sorted(glob.glob(f'{D}/*.md')):
    _b=os.path.basename(_f)[:-3]
    if _b in _ignora or _b.startswith(('_','RELATORIO-','PLANO-')): continue
    try:
        if re.search(r'^  E-\d+', open(_f).read(), re.M): _progs.append(_b)
    except Exception: pass
for prog in _progs:
    md=f'{D}/{prog}.md'; q=f'{D}/filas/fila-{prog}.jsonl'
    if not os.path.exists(md): continue
    have=todas
    novos=[]
    # janela: "FORA DA JANELA: cadeia E-26→E-34" ou lista de E-nn → marca fora_da_janela nas rows (existentes e novas)
    rows=[json.loads(l) for l in open(q) if l.strip()] if os.path.exists(q) else []
    txt=open(md).read(); fora=set()
    dentro=set()
    for m in re.finditer(r'JANELA[^\n]*?(?=FORA DA JANELA|$)',txt):
        dentro|=set(re.findall(r'E-\d+[a-z]?',m.group(0)))
    for m in re.finditer(r'FORA DA JANELA[^\n]*',txt):
        seg=m.group(0); nums=[int(x) for x in re.findall(r'E-(\d+)',seg)]
        if len(nums)>=2: fora|={f"E-{i}" for i in range(min(nums),max(nums)+1)}   # cadeia E-a→…→E-b = intervalo
        fora|=set(re.findall(r'E-\d+[a-z]?',seg))
    fora-=dentro   # o que a mesma linha declara DENTRO da janela (ex.: E-29 na FATIA 1) fica puxável
    if fora and rows:
        ch=False
        for r in rows:
            fj=r['task'] in fora
            if r.get('fora_da_janela')!=fj: r['fora_da_janela']=fj; ch=True
        if ch:
            with open(q,'w') as fh:
                fcntl.flock(fh,fcntl.LOCK_EX)
                for r in rows: fh.write(json.dumps(r,ensure_ascii=False)+'\n')
    for l in open(md):
        m=re.match(r'  (E-\d+[a-z]?(?:-[a-z0-9]+)?)(?: \[[^\]]*\])? · (.*)',l)   # tolera "E-20 [em build no Codex] · …"
        if not m: continue
        eid,rest=m.groups()
        if eid in have: continue
        st='fila'
        if re.search(r'· (pronta|PRONTA)',rest): st='fila'   # rótulo do .md NÃO vale como estado; results.jsonl decide
        elif re.search(r'estacionad',rest): st='estacionada'
        deps=re.findall(r'bloqueada por (E-\d+[a-z]?)',rest)
        # 31/08: a lista de papeis era hardcoded e SALARIOS (papel novo) nao estava la -> builder_sugerido
        # VAZIO -> fila-pull.sh so filtra quando o campo esta preenchido -> a E-60 (bloqueada, do SALARIOS)
        # foi oferecida ao FUNIL. Falha FAIL-OPEN: papel novo tem o trabalho oferecido a toda a gente.
        # Reparacao minima (P9) em 31/08. ESTRUTURAL FEITA 01/09: _BUILDER_RE vem do registry (topo).
        builder=(re.search(_BUILDER_RE,rest) or [None,''])[1].strip(' ·')
        prova=(rest.split('prova:')[1].strip()[:200] if 'prova:' in rest else '')
        todas.add(eid); novos.append({"fora_da_janela": eid in fora, "task":eid,"frente":prog,"resumo":rest.split('·')[0].strip()[:140],"status":st,"depende_de":deps,"builder_sugerido":builder,"prova":prova,"derivada_em":__import__('datetime').datetime.now(__import__('datetime').timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')})
    if novos:
        with open(q,'a') as fh:
            fcntl.flock(fh,fcntl.LOCK_EX)
            for r in novos: fh.write(json.dumps(r,ensure_ascii=False)+'\n')
        add += [f"{prog}:{r['task']}" for r in novos]
print('filas-sync: novas', add or 0)

# ── Entregas ÓRFÃS: trabalhadas no registo e ausentes de toda a fila ────────────────────────────
# 01/09 (ordem do dono): a fila responde a "o que há para fazer" e o registo a "o que se fez", e nada
# obrigava o segundo a passar pelo primeiro. Medido: a folha executou E-106/E-107 sem que existissem
# em fila nenhuma — quem olhava a fila via 7 fechadas e 3 bloqueadas e concluía "parada", enquanto ela
# registava trabalho de dez em dez minutos. Duas fontes para a mesma pergunta, e a divergência era
# invisível. Aqui só entram ENTREGAS CANÓNICAS (E-nnn puro): as fatias (E-29-bateria), os registos
# operacionais (tick-*, POSTO-*, CR-*) e o trabalho pontual NÃO viram linha — inflariam a fila sem
# nada a puxar; esses já aparecem ao coordenador pelo diff de resultados.
_JAN='2026-08-30'   # janela de recuperação: não ressuscita histórico antigo
_orfas=[]
try:
    _todas=set()
    for _qq in glob.glob(f'{D}/filas/fila-*.jsonl'):
        for _l in open(_qq):
            try: _todas.add(json.loads(_l)['task'])
            except Exception: pass
    _ult={}
    for _l in open(f'{D}/results.jsonl'):
        try: _e=json.loads(_l)
        except Exception: continue
        if _e.get('status') in ('posto','anulado'): continue
        _t=_e.get('task','')
        if _e.get('ts','')>=_JAN and re.fullmatch(r'E-\d+[a-z]?', _t or '') and _t not in _todas:
            _ult[_t]=_e
    # frente: gama declarada no programa (E-100..E-109) > frente do papel no registry > revisao (triagem)
    _gama=[]
    for _pr in _progs:
        try: _txt=open(f'{D}/{_pr}.md').read()
        except Exception: continue
        _m=re.search(r'GAMA DE IDs[^\n]*?E-(\d+)\.\.E-(\d+)', _txt)
        if _m: _gama.append((_pr,int(_m.group(1)),int(_m.group(2))))
    try:
        _reg=json.load(open(f'{D}/../terminais/registry.json'))['terminais']
    except Exception: _reg={}
    _st={'done':'done','blocked':'bloqueada','failed':'bloqueada','retracted':'fila'}
    for _t,_e in sorted(_ult.items()):
        _n=int(re.match(r'E-(\d+)',_t).group(1))
        _fr=next((g[0] for g in _gama if g[1]<=_n<=g[2]), None)
        if not _fr:
            _f2=(_reg.get(_e.get('papel'),{}) or {}).get('frente') or ''
            _fr=_f2 if os.path.exists(f'{D}/filas/fila-{_f2}.jsonl') else 'revisao'
        _q=f'{D}/filas/fila-{_fr}.jsonl'
        _row={"task":_t,"frente":_fr,
              "resumo":f"[recuperada do registo] trabalhada por {_e.get('papel')} sem existir na fila — {str(_e.get('nota') or '')[:110]}",
              "status":_st.get(_e.get('status'),'fila'),"depende_de":[],"builder_sugerido":_e.get('papel') or "",
              "prova":str(_e.get('prova') or '')[:200],"origem":"results-orfa","derivado_em":now_iso}
        with open(_q,'a') as _fh:
            fcntl.flock(_fh,fcntl.LOCK_EX); _fh.write(json.dumps(_row,ensure_ascii=False)+'\n')
        _orfas.append(f"{_fr}:{_t}")
except Exception as _ex:
    print('filas-sync: recuperacao de orfas FALHOU —', repr(_ex))
print('filas-sync: orfas recuperadas', _orfas or 0)

PY
