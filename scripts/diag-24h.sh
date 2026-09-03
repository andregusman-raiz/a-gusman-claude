#!/usr/bin/env bash
# diag-24h.sh — DIAGNÓSTICO DIÁRIO OBRIGATÓRIO do sistema multi-terminal do Data Engine e clientes (ordem do dono 30/08/2026).
# DOR: 24h com prod degradada ≈21h, 1 Entrega provada/40, 159k palavras de log, 1.436 sends — e só viu quem parou para medir.
# METRICA: DIAG-24H gerado todo dia; §Falhas/§Oportunidades preenchidos pelo OTIMIZADOR e cada papel deixa seu bloco; itens do dia anterior verificados por comando.
# DONO-MEDICAO: COMANDO. REMOVER-QUANDO: o dono retirar a obrigação. TESTADO-EM: RESUMO 30/08 (run manual).
# Sem LLM aqui: coleta números, verifica recomendações anteriores por comando, escreve o arquivo e ACORDA o OTIMIZADOR por evento (terminal-send).
# Roda 1x/dia (carimbo em ~/.claude/state/diag-24h.last) — chamado pelo de-fila-tick.sh; DIAG_FORCE=1 força.
set -uo pipefail
AI="$HOME/Claude/docs/ai-state"; OUT="$AI/diag"; mkdir -p "$OUT"; STAMP="$HOME/.claude/state/diag-24h.last"; mkdir -p "$(dirname "$STAMP")"
HOUR_UTC="${DIAG_HOUR_UTC:-09}"   # 06:00 local (America/Sao_Paulo) — antes do dia útil
TODAY=$(date -u +%Y-%m-%d); NOW=$(date -u +%Y-%m-%dT%H:%MZ); PRAZO=$(date -u -v+3H +%H:%MZ)   # prazo relativo à geração (run forçado tardio não gera prazo no passado)
if [ "${DIAG_FORCE:-0}" != "1" ]; then
  [ "$(date -u +%H)" -ge "$HOUR_UTC" ] || exit 0
  [ "$(cat "$STAMP" 2>/dev/null)" != "$TODAY" ] || exit 0
fi
F="$OUT/DIAG-24H-$TODAY.md"; PREV=$(ls "$OUT"/DIAG-24H-*.md 2>/dev/null | grep -v "$TODAY" | tail -1)
REPO="${DE_REPO:-Raiz-Educacao-SA/raiz-data-engine}"; SINCE=$(date -u -v-24H +%Y-%m-%dT%H:%M:%SZ)
Y=$(date -u -v-1d +%Y-%m-%d); L1="$AI/de-pr-queue/log/$Y.md"; L2="$AI/de-pr-queue/log/$TODAY.md"
# ---------- §1 números (mecânicos) ----------
logstats() { f=$1; [ -f "$f" ] || { echo "(sem log $f)"; return; }; printf '%s: %s linhas · %s palavras · ' "$(basename "$f")" "$(wc -l < "$f" | tr -d ' ')" "$(wc -w < "$f" | tr -d ' ')"; grep -oE "^## [0-9:]+Z[^\[]*\[[A-Z-]+" "$f" | grep -oE "\[[A-Z-]+" | tr -d '[' | sort | uniq -c | sort -rn | awk '{printf "%s=%s ", $2, $1}'; echo; }
SENDS=$(grep -cE "^$(date -u -v-24H +%Y-%m-%dT%H)|^$TODAY|^$Y" "$AI/terminais/send.log" 2>/dev/null || echo 0)
SENDS_BY=$(awk -v s="$SINCE" '$1 >= s' "$AI/terminais/send.log" 2>/dev/null | grep -oE "from=[A-Z-]+" | sort | uniq -c | sort -rn | awk '{printf "%s=%s ", $2, $1}')
SENDS24=$(awk -v s="$SINCE" '$1 >= s' "$AI/terminais/send.log" 2>/dev/null | wc -l | tr -d ' ')
RETR=$(cat "$L1" "$L2" 2>/dev/null | grep -ciE "retrat|retiro|corrijo|corrig|errei|erro meu|estava errad")
DEC=$(grep -E "^- (Abertas|Stale|Decididas)" "$AI/terminais/DECISOES-PENDENTES.md" 2>/dev/null | tr '\n' ' ')
MERGED=$(gh pr list -R "$REPO" --state merged --search "merged:>=$SINCE" --json number --jq 'length' 2>/dev/null || echo "?")
OPEN=$(gh pr list -R "$REPO" --state open --json number --jq 'length' 2>/dev/null || echo "?")
OLD7=$(gh pr list -R "$REPO" --state open --json createdAt --jq "[.[] | select(.createdAt < \"$(date -u -v-7d +%Y-%m-%dT%H:%M:%SZ)\")] | length" 2>/dev/null || echo "?")
DEPLOYS=$(cd "$HOME/Claude/GitHub/raiz-data-engine" 2>/dev/null && railway deployment list --service "${DE_RAILWAY_SERVICE:-raiz-data-engine}" --json 2>/dev/null | python3 -c "
import sys,json,collections; d=json.load(sys.stdin); d=d if isinstance(d,list) else d.get('deployments',[]); c=collections.Counter(); n=0
for x in d:
    x=x.get('node',x)
    if (x.get('createdAt') or '')>='$SINCE': n+=1; c[x.get('status')]+=1
print(n, dict(c))" 2>/dev/null || echo "?")
PROBE="$AI/roadmap/PROD-PROBE.jsonl"; PRODDOWN=$(awk -v s="$SINCE" -F'"' '$4 >= s' "$PROBE" 2>/dev/null | python3 -c "
import sys,json; L=[json.loads(l) for l in sys.stdin if l.strip()]; n=len(L); bad=sum(1 for x in L if str(x.get('readiness'))!='200')
print(f'{bad}/{n} sondas ≠200 (≈{(bad/n*100 if n else 0):.0f}% do tempo)' if n else 'sem sondas (PROD-PROBE.jsonl vazio)')" 2>/dev/null)
THREADERR=$(cd "$HOME/Claude/GitHub/raiz-data-engine" 2>/dev/null && railway logs --service "${DE_RAILWAY_SERVICE:-raiz-data-engine}" --json -S "$SINCE" -f "can't start new thread" -n 5000 2>/dev/null | wc -l | tr -d ' ')
ENT=$(grep -hE "^  E-" "$AI"/roadmap/[a-z]*.md 2>/dev/null | grep -oE "· (em curso|fila|estacionad[ao]|pronta|PRONTA)" | sort | uniq -c | awk '{printf "%s=%s ", $3, $1}'); ENTTOT=$(grep -hcE "^  E-" "$AI"/roadmap/[a-z]*.md 2>/dev/null | awk '{s+=$1} END{print s+0}')
MEM=$(find "$HOME/.claude/projects/-Users-andregusmandeoliveira-Claude/memory" -name "*.md" -newermt "$(date -u -v-24H +%Y-%m-%dT%H:%M:%S)" 2>/dev/null | wc -l | tr -d ' ')
COMPACT=$(python3 - "$Y" "$TODAY" <<'PY'
import json,os,glob,sys
y,t=sys.argv[1],sys.argv[2]
reg=json.load(open(os.path.expanduser('~/Claude/docs/ai-state/terminais/registry.json'))).get('terminais',{})
out=[]
for papel,tt in reg.items():
    sid=tt.get('session_id') or ''
    if not sid: continue
    n=0
    for f in glob.glob(os.path.expanduser(f'~/.claude/projects/*/{sid}*.jsonl')):
        for l in open(f, errors='ignore'):
            if '"compact' in l and (y in l or t in l): n+=1
    out.append(f"{papel}={n}")
print(' '.join(out) or '-')
PY
)
# ---------- §2 verificação mecânica das recomendações (checklist fixa; acrescentar linhas conforme o diag anterior) ----------
chk() { printf '| %s | %s |\n' "$1" "$2"; }
VER=$( {
echo "| verificação | medido $NOW |"; echo "|---|---|"
chk "strict na main (O2)" "$(gh api repos/$REPO/branches/main/protection --jq '.required_status_checks.strict' 2>/dev/null)"
chk "allow_auto_merge (G1 hold=estado)" "$(gh api repos/$REPO --jq '.allow_auto_merge' 2>/dev/null)"
chk "rulesets/merge queue (Q2)" "$(gh api repos/$REPO/rulesets --jq 'length' 2>/dev/null)"
chk "PRs abertos >7d (O4)" "$OLD7"
# 01/09 (3a face do dia, achado COMANDO/FUNIL): blocked DEPOIS de done nunca desce a row — row `done`
# velha engana quem LE a row (o dep-check dos consumidores le o LEDGER e esta seguro). Sonda: NAO corrige,
# so lista — a reconciliacao silenciosa apagaria done posto a mao (P9 pesa; decisao adiada de proposito).
DIVROWS=$(python3 - <<'PYD'
import json,glob,os
AI=os.path.expanduser('~/Claude/docs/ai-state'); ult={}
try:
    for l in open(f'{AI}/roadmap/results.jsonl'):
        try: e=json.loads(l)
        except: continue
        if e.get('status') in ('posto','anulado'): continue
        ult[e.get('task')]=e.get('status')
except Exception: pass
mapa={'done':'done','blocked':'bloqueada','failed':'bloqueada'}
tot=[]; per=[]
for q in glob.glob(f'{AI}/roadmap/filas/fila-*.jsonl'):
    for l in open(q):
        try: r=json.loads(l)
        except: continue
        t=r.get('task'); esp=mapa.get(ult.get(t) or '')
        if not esp or r.get('status') in (esp,'puxada'): continue
        tot.append(t)
        if r.get('status')=='done' and esp=='bloqueada': per.append(t)
print(f"{len(tot)} divergentes; PERIGOSAS (row done, ledger blocked): {len(per)} {' '.join(sorted(set(per))[:6])}")
PYD
)
chk "LEDGER<->ROWS (sonda, nao corrige)" "$DIVROWS"
# 02/09 (auditoria do dono): a decisao sai do console mas a row so reabre com RESULT novo do AUTOR —
# medido 7 rows bloqueadas a citar D-nnn ja decidida, uma ha 133 h. Nada no tick cruzava as duas fontes.
# Sonda: LISTA, nao corrige (so o autor pode levantar o proprio blocked).
BLOQDEC=$(python3 - <<'PYD'
import json,glob,os,re,datetime
AI=os.path.expanduser('~/Claude/docs/ai-state'); NOW=datetime.datetime.now(datetime.timezone.utc)
try:
    dj=json.load(open(f'{AI}/terminais/decisoes.json')); decs=dj.get('decisoes',dj)
    decs=list(decs.values()) if isinstance(decs,dict) else (decs or [])
    byid={d.get('id'):d for d in decs if isinstance(d,dict)}
except Exception: byid={}
ult={}
try:
    for _l in open(f'{AI}/roadmap/results.jsonl',errors='replace'):
        try: _e=json.loads(_l)
        except Exception: continue
        if _e.get('status') and _e['status'] not in ('posto','anulado'): ult[_e.get('task')]=_e
except Exception: pass
out=[]
for q in sorted(glob.glob(f'{AI}/roadmap/filas/fila-*.jsonl')):
    fr=os.path.basename(q)[5:-6]
    for l in open(q,errors='replace'):
        try: r=json.loads(l)
        except Exception: continue
        if r.get('status')!='bloqueada': continue
        # 03/09 (refutado pelo FUNIL): mencao em texto historico da row nao e' uso. So o MOTIVO ATUAL (ultimo blocked
        # no ledger) e so se a decisao foi tomada DEPOIS desse blocked.
        _ub=ult.get(r.get('task')) or {}
        if _ub.get('status') not in ('blocked','failed'): continue
        txt=str(_ub.get('nota') or '')
        for did in sorted(set(re.findall(r'D-\d+',txt))):
            d=byid.get(did) or {}
            if not d.get('decidida_em') or str(d['decidida_em'])<=str(_ub.get('ts') or ''): continue
            try: h=int((NOW-datetime.datetime.fromisoformat(str(d['decidida_em']).replace('Z','+00:00'))).total_seconds()//3600)
            except Exception: h='?'
            out.append(f"{fr}/{r.get('task')}<-{did}({h}h)")
# 03/09 (COMANDO): a sonda so varria as FILAS; o lado dos PRs (claims.json) — onde vive quase todo o trabalho do DE —
# era invisivel por desenho. Segunda fonte: claim aberto cujo status cita D-nnn decidida DEPOIS do ultimo carimbo do claim.
try:
    cj=json.load(open(f'{AI}/de-pr-queue/claims.json')).get('claims',{})
    for b,c in cj.items():
        st=str(c.get('status') or '')
        # 03/09 (COMANDO, antes de levar ao dono): mencao nao e' uso — SUPERSEDED/merged/anulado citam a decisao que os
        # FECHOU; claim sem PR nao e' bloqueio vivo do lado dos PRs. Sobrevivem os que valem (#6301←D-027, #6435←D-133, #6446←D-162).
        if re.search(r'merge[ad]|fechad|closed|supersed|anulad|cancelad|absorv',st.lower()): continue
        if not c.get('pr'): continue
        ts=str(c.get('synced_at') or c.get('claimed_at') or '')
        for did in sorted(set(re.findall(r'D-\d+',st))):
            d=byid.get(did) or {}
            if not d.get('decidida_em') or str(d['decidida_em'])<=ts: continue
            try: h=int((NOW-datetime.datetime.fromisoformat(str(d['decidida_em']).replace('Z','+00:00'))).total_seconds()//3600)
            except Exception: h='?'
            out.append(f"claim#{c.get('pr')}<-{did}({h}h)")
except Exception: pass
print((f"{len(out)} item(s): "+" · ".join(out[:8])) if out else "0 (nenhuma row/claim bloqueado cita decisao ja decidida)")
PYD
)
chk "BLOQUEIO com decisao JA decidida (sonda, o autor e que levanta)" "$BLOQDEC"
# 02/09 (decisao do dono): a superficie do dono e' RESUMO/COMANDO/DECISAO. Duas violacoes medem-se
# sem tocar em nada: (a) terminal FORA dos tres com texto do dono por enviar no prompt — a pergunta
# foi ao sitio errado E o texto corta o tick aquele terminal; (b) nota de ledger que pede ato do dono
# dentro de um terminal. Sonda: LISTA, nao age.
CANAL=$(python3 - <<'PYD'
import json,os,re,subprocess,datetime
AI=os.path.expanduser('~/Claude/docs/ai-state'); CMUX='/Applications/cmux.app/Contents/Resources/bin/cmux'
SUP={'RESUMO','COMANDO','DECISAO'}
out=[]
try: reg=json.load(open(f'{AI}/terminais/registry.json'))['terminais']
except Exception: reg={}
for papel,t in sorted(reg.items()):
    if t.get('estado')!='aberto' or papel in SUP or not t.get('workspace_uuid'): continue
    try:
        r=subprocess.run([CMUX,'read-screen','--workspace',t['workspace_uuid'],'--lines','8'],capture_output=True,text=True,timeout=4)
        ls=[l.rstrip() for l in r.stdout.splitlines() if l.strip()]
    except Exception: continue
    for l in reversed(ls):
        if l.lstrip().startswith('\u276f'):
            if l.lstrip()[1:].strip(): out.append(f"{papel}:texto-no-prompt")
            break
notas=0
cut=(datetime.datetime.now(datetime.timezone.utc)-datetime.timedelta(hours=24)).strftime('%Y-%m-%dT%H:%M:%SZ')
try:
    for l in open(f'{AI}/roadmap/results.jsonl',errors='replace'):
        try: e=json.loads(l)
        except Exception: continue
        if str(e.get('ts',''))<cut: continue
        n=str(e.get('nota') or '')
        if re.search(r'dono',n,re.I) and re.search(r'\bno (teu|seu) terminal|terminal dele|corre no terminal|sess[aeo][ao] dele',n,re.I):
            notas+=1
except Exception: pass
tot=len(out)+notas
print((f"{tot}: "+(' · '.join(out[:6]) if out else '')+(f" · {notas} nota(s) a pedir ato do dono em terminal" if notas else '')) if tot else "0 (nenhuma violacao de canal)")
PYD
)
chk "VIOLACAO DE CANAL do dono (RESUMO/COMANDO/DECISAO)" "$CANAL"
chk "caps threads nativas no Railway (D-097)" "$(cd "$HOME/Claude/GitHub/raiz-data-engine" 2>/dev/null && railway variables --service "${DE_RAILWAY_SERVICE:-raiz-data-engine}" --json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(len([k for k in d if any(s in k for s in ('OPENBLAS','OMP_NUM','MKL_NUM','NUMEXPR','ARROW_NUM'))]),'/5')" 2>/dev/null)"
chk "tick tem board-sync/DESPACHO/aprovador (branch spec/board-sync mergeada)" "$(grep -c 'board-sync\|DESPACHO\|de-aprovador' "$HOME/Claude/.claude/scripts/de-fila-tick.sh" 2>/dev/null) refs"
chk "cap mecânico de palavras no canal-append (T1)" "$(grep -cE 'wc -w|MAX_WORDS' "$HOME/Claude/.claude/scripts/canal-append.sh" 2>/dev/null)"
chk "defaults noturnos na ALCADA (G2)" "$(grep -ciE 'noturn' "$AI/terminais/ALCADA.md" 2>/dev/null)"
chk "lead time/idade nas linhas E- (O9)" "$(grep -hcE '^  E-.*(há [0-9]+h|desde 20)' "$AI"/roadmap/[a-z]*.md 2>/dev/null | awk '{s+=$1} END{print s+0}')"
chk "decisões stale >24h (O10)" "$(grep -oE 'Stale[^:]*: [0-9]+' "$AI/terminais/DECISOES-PENDENTES.md" 2>/dev/null | grep -oE '[0-9]+$')"
chk "E-44 gate curto — status" "$(grep -hE '^  E-44' "$AI"/roadmap/[a-z]*.md 2>/dev/null | grep -oE '· (em curso|fila|pronta|PRONTA|estacionad[ao])' | head -1)"
chk "thread-errors em prod (24h)" "$THREADERR"
chk "TICK pós-passos executados (24h, terminais/tick.log)" "$(awk -v s="$SINCE" '$1 >= s' "$AI/terminais/tick.log" 2>/dev/null | grep -oE 'step=[a-z0-9-]+' | sort | uniq -c | awk '{printf "%s×%s ", $2, $1}')"
chk "TICK pós-passos com rc≠0 (24h) [cmd: awk janela tick.log | grep -c rc=[1-9]]" "$(awk -v s="$SINCE" '$1 >= s' "$AI/terminais/tick.log" 2>/dev/null | grep -c 'rc=[1-9]' | tr -d ' ')"
chk "TICK eventos ADIADOS por teto de destinatário (24h) [cmd: awk janela tick.log | grep -c ADIADOS] — >0 sustentado = um destinatário recebe menos do que gera" "$(awk -v s="$SINCE" '$1 >= s' "$AI/terminais/tick.log" 2>/dev/null | grep -c ADIADOS)"
chk "DESPACHO.md idade" "$(python3 -c "import os,time; p='$AI/roadmap/DESPACHO.md'; print(f'{(time.time()-os.path.getmtime(p))/60:.0f} min' if os.path.exists(p) else 'ausente')")"
chk "REGRA critério temporal ≤30 min + prova causal instalada (dono 30/08)" "$(grep -ciE '30 min.*prova causal|prova causal.*30 min|menor que prova o efeito' "$AI/terminais/ALCADA.md" "$AI/terminais/papeis/_POLITICAS-COMUNS.md" 2>/dev/null | awk -F: '{s+=$2} END{print s+0}') refs"
chk "REGRA congelamento só merge/deploy, nunca construção instalada (dono 30/08)" "$(grep -ciE 'congelamento.*(nunca|não|nao).*(constru|builder)|bloqueia s[óo] merge' "$AI/terminais/ALCADA.md" "$AI/terminais/papeis/_POLITICAS-COMUNS.md" 2>/dev/null | awk -F: '{s+=$2} END{print s+0}') refs"
chk "EFEITO: congelamento ativo × builders sem atribuição (DESPACHO)" "auto_merge=$(gh api repos/$REPO --jq '.allow_auto_merge' 2>/dev/null) · builders acusados=$(grep -cE 'ocioso|sem atribui' "$AI/roadmap/DESPACHO.md" 2>/dev/null)"
chk "EFEITO: janelas/critérios pré-registados >30 min hoje" "$(grep -hoiE '(crit[ée]rio|janela)[^.\n]{0,80}\b([2-9]|[1-9][0-9]) ?h\b' "$L2" "$AI"/de-pr-queue/_incidentes/*/README.md 2>/dev/null | wc -l | tr -d ' ') menções"
} )
# ---------- papéis que devem deixar bloco ----------
PAPEIS=$(python3 -c "import json,os; r=json.load(open(os.path.expanduser('$AI/terminais/registry.json')))['terminais']; print(' '.join(p for p,t in r.items() if t.get('estado')=='aberto' and t.get('tier',9)<=2 and p!='RESUMO'))")
FALTAM=""; if [ -n "$PREV" ]; then for p in $PAPEIS; do grep -q "^### $p" "$PREV" || FALTAM="$FALTAM $p"; done; fi
{
cat <<EOM
# DIAG-24H · $TODAY · gerado $NOW por diag-24h.sh (sem LLM) · janela: últimas 24 h
> Obrigatório (ordem do dono 30/08/2026): OTIMIZADOR preenche §3 e §4 até $PRAZO (3 h após a geração); COMANDO decide/despacha §5; cada papel do DE/clientes deixa seu bloco em §6 no mesmo dia. O tick de amanhã acusa quem não deixou.
> Papéis obrigados hoje: $PAPEIS

## 1. Números (mecânicos)
- Log: $(logstats "$L1")
- Log: $(logstats "$L2")
- Sends 24 h: $SENDS24 · por papel: $SENDS_BY
- Retratações/correções (linhas): $RETR · Memórias novas/alteradas: $MEM · Compactações por papel: $COMPACT
- Decisões: $DEC
- PRs: mergeados 24 h $MERGED · abertos $OPEN · >7 dias $OLD7
- Deploys Railway 24 h: $DEPLOYS
- Prod (sondas do tick): $PRODDOWN · thread-errors 24 h: $THREADERR
- Roadmap: $ENTTOT Entregas · $ENT
- Subagentes (delegação controlada, dono 30/08): $(python3 - "$Y" "$TODAY" <<'PY'
import json,os,glob,sys,re,collections
y,t=sys.argv[1],sys.argv[2]; reg=json.load(open(os.path.expanduser('~/Claude/docs/ai-state/terminais/registry.json')))['terminais']
P=os.path.expanduser('~/.claude/projects'); out=[]
for papel,tt in reg.items():
    sid=tt.get('session_id')
    if not sid or tt.get('estado')!='aberto' or tt.get('tier',9)>2: continue
    n=0; ghosts=0
    for f in glob.glob(f'{P}/*/{sid}*.jsonl'):
        for l in open(f,errors='ignore'):
            if '"tool_use"' in l and '"name":"Agent"' in l and (t in l or y in l): n+=1
    sub=glob.glob(f'{P}/{sid}/subagents/agent-*.jsonl'); 
    out.append(f"{papel}={n}")
print(' '.join(out) or '-')
PY
)
- RESULT records 24 h (roadmap/results.jsonl): $(awk -v s="$SINCE" -F'"' '$4>=s' "$AI/roadmap/results.jsonl" 2>/dev/null | python3 -c "
import sys,json,collections
c=collections.Counter()
for l in sys.stdin:
    try: c[json.loads(l).get('status')]+=1
    except Exception: pass
print(dict(c) or 0)")
- Comunicação obrigatória (eventos × ledger, graça 15 min): $(bash "$HOME/.claude/scripts/comunicacao-obrigatoria.sh" 2>/dev/null | sed "s/^comunicacao-obrigatoria: //") — detalhe em terminais/COMUNICACAO-EM-FALTA.md

## 2. Verificação mecânica das recomendações anteriores
$VER
$( [ -n "$FALTAM" ] && echo "- ⚠ Papéis que NÃO deixaram bloco no diag anterior ($(basename "$PREV")):$FALTAM" )

## 3. Falhas e erros evitáveis (OTIMIZADOR — cada linha: falha · custo · MECANISMO que evita, não disciplina)
_(a preencher)_

## 4. Oportunidades — token / velocidade / execução do roadmap, sem perder qualidade e governança (OTIMIZADOR)
_(a preencher; cada uma com ganho esperado, mecanismo e quem)_

## 5. Decisão e despacho (COMANDO): o que entra hoje, quem, prazo; o que sobe ao dono (classe A)
_(a preencher)_

## 6. Blocos por papel (3 linhas: pior falha do dia · como seria evitável · 1 proposta) — obrigatório
EOM
for p in $PAPEIS; do echo "### $p"; echo "_(pendente)_"; echo; done
} > "$F.new"
# 03/09 06:5xZ (incidente do RESUMO: um re-render com DIAG_FORCE apagou os 10 blocos de §6 do retrospectivo e as §3-§5;
# recuperado do git). O que os papeis ESCREVEM (§3-§6) sobrevive a qualquer regeneracao: §1-§2 sao derivados e
# refrescam; §3 em diante vem do ficheiro anterior do mesmo dia, se existir.
if [ -f "$F" ] && grep -q '^## 3\.' "$F"; then
  { sed -n '1,/^## 3\./p' "$F.new" | sed '$d'; sed -n '/^## 3\./,$p' "$F"; } > "$F.merged" && mv "$F.merged" "$F.new"
fi
mv "$F.new" "$F"
echo "$TODAY" > "$STAMP"
printf '%s\n' "- $(date -u +%H:%MZ) tick/diag-24h: DIAG-24H-$TODAY.md gerado (§1 números + §2 verificação); OTIMIZADOR acordado para §3/§4; papéis: $PAPEIS" >> "$L2"
bash "$HOME/.claude/scripts/terminal-send.sh" OTIMIZADOR "tick/diag-24h: DIAG-24H-$TODAY.md gerado — leia docs/ai-state/diag/DIAG-24H-$TODAY.md e preencha §3 (falhas c/ mecanismo) e §4 (oportunidades token/velocidade/roadmap) até $PRAZO; depois avise o COMANDO para §5." >/dev/null 2>&1 || true
bash "$HOME/.claude/scripts/terminal-send.sh" COMANDO "tick/diag-24h: DIAG-24H-$TODAY.md gerado (docs/ai-state/diag/). Tua parte: §5 decidir/despachar após o OTIMIZADOR; e cobrar o bloco §6 de cada papel do DE/clientes hoje." >/dev/null 2>&1 || true
echo "diag-24h: $F"
