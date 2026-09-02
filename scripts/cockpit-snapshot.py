#!/usr/bin/env python3
"""cockpit-snapshot.py — deriva UM JSON só-leitura com o estado vivo do cockpit (autorizado pelo dono 02/09,
excecao ao P9; o que remove: pedir "retrato" ao RESUMO/COMANDO). Sem LLM, sem gh/railway, sem mensagens.
Le: registry/enderecos, filas/*.jsonl, results.jsonl, programas roadmap/*.md, decisoes.json + fila-decisao,
claims.json, MUDOU.md e SO A CAUDA de msg-ledger/send.log/tick.log (nunca os 11 MB inteiros) + 6 linhas
da tela de cada janela (cmux read-screen, ~0,15 s cada — o mesmo instrumento do tick). Escreve
docs/ai-state/cockpit/snapshot.json (tmp + os.replace). Nunca escreve fora de cockpit/.
"""
import json
import os
import re
import glob
import subprocess
import datetime
import time

T0 = time.time()
AI = os.path.expanduser('~/Claude/docs/ai-state')
OUT_DIR = f'{AI}/cockpit'; OUT = f'{OUT_DIR}/snapshot.json'
CMUX = '/Applications/cmux.app/Contents/Resources/bin/cmux'
NOW = datetime.datetime.now(datetime.timezone.utc)
HOJE = NOW.strftime('%Y-%m-%d')

def jload(p, default):
    try:
        return json.load(open(p))
    except Exception:
        return default

def jsonl(p):
    out = []
    try:
        for l in open(p, errors='replace'):
            l = l.strip()
            if not l: continue
            try: out.append(json.loads(l))
            except Exception: pass
    except Exception: pass
    return out

def tail(p, n, maxbytes=400_000):
    """ultimas n linhas lendo so o fim do ficheiro."""
    try:
        with open(p, 'rb') as f:
            f.seek(0, 2); size = f.tell(); f.seek(max(0, size - maxbytes)); data = f.read()
        lines = data.decode('utf-8', 'replace').splitlines()
        if size > maxbytes: lines = lines[1:]
        return lines[-n:]
    except Exception:
        return []

def idade_min(ts):
    try:
        d = datetime.datetime.fromisoformat(str(ts).replace('Z', '+00:00'))
        return int((NOW - d).total_seconds() // 60)
    except Exception:
        return None

# ---------- ledger ----------
ledger = jsonl(f'{AI}/roadmap/results.jsonl')
ult = {}; ult_papel = {}
for e in ledger:
    if e.get('status') == 'anulado': continue
    ult[e.get('task')] = e
    if e.get('papel') and e.get('papel') != 'tick': ult_papel[e['papel']] = e
done = {t for t, e in ult.items() if e.get('status') == 'done'}
eventos_hoje = [e for e in ledger if str(e.get('ts', '')).startswith(HOJE)]

# ---------- registry / telas ----------
reg = jload(f'{AI}/terminais/registry.json', {}).get('terminais', {})
end = jload(f'{AI}/terminais/enderecos.json', {})
MENU_RE = re.compile(r'(Esc to cancel|Do you want to|1\. Yes|Enter to confirm|\[y/n\]|\(y/N\))', re.I)
SPIN_RE = re.compile(r'[✳✻✽✶✢·]\s*\w+…|\(\d+m? ?\d*s ·|tokens\)')

def tela(uuid):
    if not uuid: return []
    try:
        r = subprocess.run([CMUX, 'read-screen', '--workspace', uuid, '--lines', '8'], capture_output=True, text=True, timeout=4)
        ls = [l.rstrip() for l in r.stdout.splitlines() if l.strip() and not l.strip().startswith('─')]
        return ls[-6:]
    except Exception:
        return []

def modo(lines):
    txt = '\n'.join(lines)
    if not lines: return 'sem-tela'
    if MENU_RE.search(txt): return 'menu-aberto'
    if SPIN_RE.search(txt): return 'trabalhando'
    for l in reversed(lines):
        if l.lstrip().startswith('❯'):
            return 'texto-por-enviar' if l.lstrip()[1:].strip() else 'ocioso'
    return 'trabalhando'

filas_rows = {}
for q in sorted(glob.glob(f'{AI}/roadmap/filas/fila-*.jsonl')):
    filas_rows[os.path.basename(q)[5:-6]] = jsonl(q)

puxadas_por_papel = {}
for fr, rows in filas_rows.items():
    for r in rows:
        if r.get('status') == 'puxada' and r.get('puxada_por'):
            puxadas_por_papel.setdefault(r['puxada_por'], []).append({'task': r.get('task'), 'frente': fr, 'puxada_em': r.get('puxada_em'), 'ha_min': idade_min(r.get('puxada_em')), 'resumo': (r.get('resumo') or '')[:110]})

terminais = []
for papel, t in reg.items():
    if t.get('estado') != 'aberto': continue
    ls = tela(t.get('workspace_uuid'))
    ur = ult_papel.get(papel) or {}
    terminais.append({
        'papel': papel, 'tier': t.get('tier'), 'frente': t.get('frente'), 'agent': t.get('agent'),
        'titulo': t.get('workspace_title'), 'session': str(t.get('session_id') or '')[:8], 'pid': (end.get(papel) or {}).get('pid'),
        # 02/09 (ordem do dono, item 5 do diagnostico): tier 3 sem fila propria e' SATELITE — nao tem tick, nao puxa,
        # nao conta como ocioso nem como parado. Aparece a parte no cockpit; deixa de poluir o diagnostico.
        'satelite': (t.get('tier') not in (0,1,2)) and not os.path.exists(f"{AI}/roadmap/filas/fila-{(t.get('frente') or papel).lower()}.jsonl"),
        'tela': ls, 'modo': modo(ls),
        'ultimo_result': {'task': ur.get('task'), 'status': ur.get('status'), 'ts': ur.get('ts'), 'ha_min': idade_min(ur.get('ts')), 'nota': (ur.get('nota') or '')[:160]} if ur else None,
        'puxadas': puxadas_por_papel.get(papel, []),
        'cwd': (t.get('cwd') or '').replace(os.path.expanduser('~'), '~'), 'branch': t.get('branch'), 'model': t.get('model'),
    })
terminais.sort(key=lambda x: (x['tier'] if isinstance(x['tier'], int) else 9, x['papel']))

# ---------- filas ----------
def deps_pendentes(r):
    return [d for d in (r.get('depende_de') or []) if d not in done]

filas = {}
for fr, rows in filas_rows.items():
    c = {}
    for r in rows: c[r.get('status') or '?'] = c.get(r.get('status') or '?', 0) + 1
    em_fila = [r for r in rows if r.get('status') == 'fila']
    filas[fr] = {
        'contagem': c, 'total': len(rows),
        'puxadas': [{'task': r.get('task'), 'por': r.get('puxada_por'), 'ha_min': idade_min(r.get('puxada_em')), 'resumo': (r.get('resumo') or '')[:110]} for r in rows if r.get('status') == 'puxada'],
        # 02/09: "elegivel" aqui NAO e' o predicado do fila-pull (que ainda checa PR mergeado por gh — proibido no
        # derivador). Aplica-se o que e' barato e decisivo: ultimo RESULT da task blocked/failed/done exclui;
        # o resto e' CANDIDATA (o pull decide). O COMANDO leu a lista antiga como "a fila oferece" e nao oferecia.
        'elegiveis': [{'task': r.get('task'), 'builder': r.get('builder_sugerido'), 'resumo': (r.get('resumo') or '')[:110]} for r in em_fila if not deps_pendentes(r) and not r.get('fora_da_janela') and (ult.get(r.get('task')) or {}).get('status') not in ('blocked','failed','done')][:8],
        'presas': [{'task': r.get('task'), 'deps': deps_pendentes(r), 'fora_da_janela': bool(r.get('fora_da_janela')), 'resumo': (r.get('resumo') or '')[:90]} for r in em_fila if deps_pendentes(r) or r.get('fora_da_janela')][:12],
        'bloqueadas': [{'task': r.get('task'), 'bloqueio': (r.get('bloqueio') or r.get('nota_comando') or '')[:120]} for r in rows if r.get('status') == 'bloqueada'][:10],
    }

# ---------- roadmaps (programas) ----------
roadmaps = {}
for p in sorted(glob.glob(f'{AI}/roadmap/*.md')):
    nome = os.path.basename(p)[:-3]
    try: txt = open(p, errors='replace').read()
    except Exception: continue
    ents = []
    for m in re.finditer(r'^  (E-[0-9]+[a-z]?) · (.*?)(?: · ([A-Z][A-Z0-9-]+))?\s*$', txt, re.M):
        eid = m.group(1); st = (ult.get(eid) or {}).get('status') or 'fila'
        ents.append({'id': eid, 'resumo': m.group(2)[:100], 'builder': m.group(3), 'status': st})
    if not ents: continue
    cont = {}
    for e in ents: cont[e['status']] = cont.get(e['status'], 0) + 1
    roadmaps[nome] = {'total': len(ents), 'contagem': cont, 'entregas': ents, 'header': txt.splitlines()[0][:160] if txt else ''}

# ---------- decisões ----------
dj = jload(f'{AI}/terminais/decisoes.json', {})
decs = dj.get('decisoes', dj) if isinstance(dj, dict) else dj
decs = list(decs.values()) if isinstance(decs, dict) else (decs or [])
abertas = [d for d in decs if d.get('estado') in ('aberta', 'open', None) and not d.get('decidida_em')]
por_bloco = {}
for d in abertas: por_bloco.setdefault(str(d.get('bloco') or '?'), []).append({'id': d.get('id'), 'titulo': (d.get('titulo') or '')[:120], 'origem': d.get('origem'), 'ha_min': idade_min(d.get('aberta_em'))})
decididas_hoje = [{'id': d.get('id'), 'titulo': (d.get('titulo') or '')[:110], 'decisao': (d.get('decisao') or '')[:120], 'em': d.get('decidida_em')} for d in decs if str(d.get('decidida_em') or '').startswith(HOJE)]
decididas_hoje.sort(key=lambda x: x['em'] or '', reverse=True)
fila_dec = jsonl(f'{AI}/roadmap/filas/fila-decisao.jsonl')
dec_c = {}
for r in fila_dec: dec_c[r.get('status') or '?'] = dec_c.get(r.get('status') or '?', 0) + 1
no_console = [{'task': r.get('task'), 'por': r.get('puxada_por'), 'ha_min': idade_min(r.get('puxada_em')), 'resumo': (r.get('resumo') or '')[:120]} for r in fila_dec if r.get('status') == 'puxada']
decisoes = {'abertas_total': len(abertas), 'por_bloco': por_bloco, 'decididas_hoje': decididas_hoje[:20], 'fila': dec_c, 'no_console': no_console}

# ---------- PRs (claims) ----------
cj = jload(f'{AI}/de-pr-queue/claims.json', {})
claims = cj.get('claims', {}) if isinstance(cj, dict) else {}
prs = []
for b, c in claims.items():
    st_raw = str(c.get('status') or c.get('estado') or '')
    # status e narrativo em muitos claims (ate 4,5k chars): reduzir a um token curto para agrupar/exibir
    s0 = st_raw.lower()
    st = ('mergeado' if re.search(r'merge[ad]', s0) else 'estacionado' if 'estacionad' in s0 else
          'encerrado' if re.search(r'supersed|absorv|absorbed|cancelad|retratad|rebaixad|reescopad|fechad|closed|nao e nossa', s0) else
          'em review' if 'review' in s0 else 'retido' if re.search(r'retido|blocked|parado|aguarda|adiado|atras', s0) else
          'aberto' if re.search(r'abert|open|claim|construcao|preflight|despachad|medido|achado', s0) else 'outro')
    prs.append({'pr': c.get('pr'), 'branch': b[:60], 'frente': c.get('frente'), 'owner': c.get('owner'), 'terminal': c.get('terminal'), 'status': st, 'status_nota': st_raw[:120], 'ha_min': idade_min(c.get('synced_at') or c.get('claimed_at'))})
prs_ab = [p for p in prs if 'merge' not in p['status'].lower() and 'fechad' not in p['status'].lower() and 'closed' not in p['status'].lower()]
pc = {}
for p in prs_ab: pc[p['status'] or '?'] = pc.get(p['status'] or '?', 0) + 1

# ---------- interacoes ----------
msgs = []
for l in tail(f'{AI}/terminais/msg-ledger.jsonl', 60):
    try:
        m = json.loads(l); msgs.append({'ts': m.get('ts'), 'from': m.get('from'), 'to': m.get('to'), 'ids': m.get('ids'), 'preview': (m.get('preview') or '').replace('\\n', ' ').strip()[:140]})
    except Exception: pass
sends = []
for l in tail(f'{AI}/terminais/send.log', 40):
    mm = re.match(r'^(\S+) (\S+) (?:from=(\S+) )?(?:to=(\S+) )?.*?(?::: (.*)|(FALHA-[A-Z-]+|RECUSADO[^ ]*).*)$', l)
    if mm: sends.append({'ts': mm.group(1), 'from': mm.group(3), 'to': mm.group(4), 'txt': (mm.group(5) or mm.group(6) or '')[:140], 'falha': bool(mm.group(6))})
tick = [l for l in tail(f'{AI}/terminais/tick.log', 80)]
tick_acorda = [l for l in tick if 'dest=' in l or 'acorda' in l][-15:]
tick_passos = [l for l in tick if ' rc=' in l][-14:]
deploys = [l for l in tail(f'{AI}/terminais/tick.log', 400) if 'deploy' in l.lower()][-6:]

mudou = ''
try: mudou = open(f'{AI}/roadmap/MUDOU.md', errors='replace').read()[:1500]
except Exception: pass

snap = {
    'ts': NOW.strftime('%Y-%m-%dT%H:%M:%SZ'), 'hoje': HOJE,
    'terminais': terminais, 'filas': filas, 'roadmaps': roadmaps, 'decisoes': decisoes,
    'prs': {'abertos': prs_ab, 'por_status': pc, 'total_claims': len(prs)},
    'interacoes': {'msgs': msgs, 'sends': sends, 'tick_acorda': tick_acorda, 'tick_passos': tick_passos, 'deploys': deploys},
    'ledger_hoje': [{'ts': e.get('ts'), 'papel': e.get('papel'), 'task': e.get('task'), 'status': e.get('status'), 'nota': (e.get('nota') or '')[:120], 'pr': e.get('pr')} for e in eventos_hoje[-60:]],
    'inalcancaveis': [l for l in tail(f'{AI}/terminais/INALCANCAVEIS.md', 40) if l.startswith('| ') and not l.startswith('| papel')],
    'mudou': mudou,
    'gerado_em_ms': int((time.time() - T0) * 1000),
}
os.makedirs(OUT_DIR, exist_ok=True)
tmp = OUT + '.tmp'
with open(tmp, 'w') as f: json.dump(snap, f, ensure_ascii=False)
os.replace(tmp, OUT)
# 02/09 23:5xZ (incidente: `git checkout -- claims.json` apagou 14 h de edicoes de varias sessoes; nenhuma fonte de
# recuperacao existia — o snapshot ja tinha sido regenerado por cima). Retencao: 1 copia por hora, 24 h, em hist/.
# E' a unica fotografia periodica do estado partilhado; custa ~110 KB/h.
try:
    hd=f'{OUT_DIR}/hist'; os.makedirs(hd, exist_ok=True)
    hp=f"{hd}/snapshot-{NOW.strftime('%Y%m%dT%H')}.json"
    if not os.path.exists(hp):
        import shutil; shutil.copyfile(OUT, hp)
        for old in sorted(glob.glob(f'{hd}/snapshot-*.json'))[:-24]: os.remove(old)
except Exception: pass
print(f"snapshot ok {snap['ts']} terminais={len(terminais)} filas={len(filas)} roadmaps={len(roadmaps)} {snap['gerado_em_ms']}ms")
