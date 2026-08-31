#!/usr/bin/env bash
# filas-sync.sh — re-deriva as filas a partir dos programas .md SEM perder estado: linha E- nova no .md → nova row (status fila);
# row existente mantém status/puxada; row cuja linha sumiu do .md fica (histórico). Achado do COMANDO 23:2xZ: E-20/E-35a no .md
# e fora das filas (invisíveis ao despacho); derivação era one-shot (20:20Z). Corre no tick, sem LLM.
set -uo pipefail
python3 - "$HOME/Claude/docs/ai-state/roadmap" <<'PY'
import re,json,os,sys,fcntl
D=sys.argv[1]; add=[]
import glob
# COMANDO 23:4xZ: task que muda de programa duplicava (E-35b em funil E prontidao) — "existe" é em QUALQUER fila
todas=set()
for qq in glob.glob(f'{D}/filas/fila-*.jsonl'):
    for l in open(qq):
        try: todas.add(json.loads(l)['task'])
        except Exception: pass
for prog in ('funil','parcelas','prontidao','sustentacao','salarios'):
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
        builder=(re.search(r'· ((?:DE-[A-Z-]+|FUNIL|Codex[^·]*))',rest) or [None,''])[1].strip(' ·')
        prova=(rest.split('prova:')[1].strip()[:200] if 'prova:' in rest else '')
        todas.add(eid); novos.append({"fora_da_janela": eid in fora, "task":eid,"frente":prog,"resumo":rest.split('·')[0].strip()[:140],"status":st,"depende_de":deps,"builder_sugerido":builder,"prova":prova,"derivada_em":__import__('datetime').datetime.now(__import__('datetime').timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')})
    if novos:
        with open(q,'a') as fh:
            fcntl.flock(fh,fcntl.LOCK_EX)
            for r in novos: fh.write(json.dumps(r,ensure_ascii=False)+'\n')
        add += [f"{prog}:{r['task']}" for r in novos]
print('filas-sync: novas', add or 0)
PY
