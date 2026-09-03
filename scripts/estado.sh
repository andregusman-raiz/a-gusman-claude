#!/usr/bin/env bash
# estado.sh — UM comando para o estado da frota, lido do snapshot que o cockpit ja deriva a cada 60 s.
# 03/09 (diagnostico §13 A1, ordem do dono): 1.623 chamadas Bash/dia eram papeis a medir filas/ledger/PRs a mao, cada um
# com o seu criterio (3 divergencias entre coordenadores num dia). Aqui todos leem o MESMO numero. Sem gh, sem LLM.
# Uso: estado.sh [filas|prs|decisoes|terminais|tudo] [PAPEL]
S="$HOME/Claude/docs/ai-state/cockpit/snapshot.json"; Q="${1:-tudo}"; P="${2:-}"
[ -f "$S" ] || { echo "sem snapshot (cockpit-snapshot nao correu)"; exit 1; }
python3 - "$S" "$Q" "$P" <<'PY'
import json,sys,datetime
d=json.load(open(sys.argv[1])); q=sys.argv[2]; P=sys.argv[3]
age=int((datetime.datetime.now(datetime.timezone.utc)-datetime.datetime.fromisoformat(d['ts'].replace('Z','+00:00'))).total_seconds()//60)
print(f"snapshot {d['ts']} (ha {age} min)"+("  ⚠ VELHO" if age>3 else ""))
if q in ('filas','tudo'):
    print("\nFILAS (contagem · puxadas · candidatas · presas):")
    for fr,f in sorted(d['filas'].items()):
        c=f['contagem']; print(f"  {fr:12} fila={c.get('fila',0):<3} puxada={c.get('puxada',0):<2} bloq={c.get('bloqueada',0):<3} done={c.get('done',0):<3} | candidatas: {', '.join(e['task'] for e in f['elegiveis'][:4]) or '—'} | presas: {len(f['presas'])}")
        for pu in f['puxadas']:
            if not P or pu['por']==P: print(f"      puxada {pu['task']} por {pu['por']} ha {pu['ha_min']} min")
if q in ('prs','tudo'):
    print("\nPRs (claims vivos por estado):",d['prs']['por_status'])
    for p in sorted(d['prs']['abertos'],key=lambda x:-(x.get('pr') or 0))[:12]: print(f"  #{p['pr']} {p.get('frente') or '—':12} {p['status']:12} {str(p.get('status_nota') or '')[:70]}")
if q in ('decisoes','tudo'):
    dc=d['decisoes']; print(f"\nDECISOES: abertas={dc['abertas_total']} no console={[x['task'] for x in dc['no_console']]} decididas hoje={len(dc['decididas_hoje'])}")
    for b,xs in sorted(dc['por_bloco'].items()): print(f"  bloco {b}: {', '.join(x['id'] for x in xs)}")
if q in ('terminais','tudo'):
    print("\nTERMINAIS (modo · em maos · ultimo RESULT):")
    for t in d['terminais']:
        if t.get('satelite'): continue
        u=t.get('ultimo_result') or {}
        print(f"  {t['papel']:11} {t['modo']:16} puxadas={len(t['puxadas'])} ultimo={u.get('status','—')} {u.get('task','')} ha {u.get('ha_min','?')} min")
if d.get('inalcancaveis'): print("\nINALCANCAVEIS:",d['inalcancaveis'])
PY
