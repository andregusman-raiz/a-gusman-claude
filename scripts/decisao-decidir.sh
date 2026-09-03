#!/usr/bin/env bash
# decisao-decidir.sh — fecha uma decisão do ledger (decisoes.json).
# Contrato: docs/ai-state/terminais (reforma de pendencias, 2026-08-28, builder B).
set -euo pipefail

T="${DECISOES_DIR:-$HOME/Claude/docs/ai-state/terminais}"
DECISOES_JSON="$T/decisoes.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat <<'EOF'
Uso: decisao-decidir.sh D-nnn "<decisão>" --origem-decisao <ORIGEM> [--executada] [--alcada N] [--arquivar] [--forcar]

  --origem-decisao OBRIGATORIO. ONDE a decisao foi tomada. Sem ele, "o dono
                decidiu" e indistinguivel de "alguem escreveu que ele decidiu"
                (medido 02/09: 59 de 67 decisoes do dia sem proveniencia).
                Valores: console:COMANDO | console:DECISAO | console:RESUMO |
                externo:github | externo:railway | externo:neon | externo:aws |
                alcada:<PAPEL> (decidida por alcada, sem o dono) |
                par:<PAPEL> (papel com autoridade propria, ex. governanca da metrica).
                A superficie do dono e' RESUMO/COMANDO/DECISAO (_POLITICAS-COMUNS):
                console:<outro papel> e ACEITE mas fica marcado como fora da
                superficie — o registo diz a verdade, nao esconde a excepcao.

Marca uma decisão como fechada em decisoes.json: seta `estado`,
`decidida_em` (UTC, carimbado pelo script) e `decisao` (o texto
passado). Roda decisoes-render.sh ao final para a view e o
ARQUIVO-decisoes.md refletirem a mudança imediatamente.

  --executada   estado = decidida_executada (decisão já aplicada/em execução)
  --alcada N    estado = decidida_por_alcada (degrau N de alçada, ex: COMANDO)
  --arquivar    estado = arquivada (sem decisão de mérito — encerrada/absorvida)
  --forcar      permite redecidir um id que já não está "aberta". Sobrescreve
                `decisao`; NAO re-carimba `decidida_em` se ja existia — preserva
                e IMPRIME o valor preservado. Use --decidida-em para a mudar.
  --decidida-em <ISO>  define `decidida_em` — DELEGADO ao decisao-ref.sh (a validacao de
                formato/futuro/estado vive com o CAMPO). EXIGE --papel.
                Obrigatorio quando a decisao e NOVA sobre uma ficha ja decidida.

Sem nenhuma das três flags: estado = decidida (default).

Recusa (exit != 0, sem stack trace) quando: id não existe; id já não está
"aberta" e --forcar não foi passado; ambos --executada e --alcada juntos
(escolha uma classificação); lock do decisoes.json preso além do timeout
(mensagem legível, não traceback).
EOF
}

EXECUTADA=0
ALCADA=""
ARQUIVAR=0
FORCAR=0
DECIDIDA_EM_EXPLICITA=""
ORIGEM_DECISAO=""
PAPEL_FWD=""
POSITIONAL=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h) usage; exit 0 ;;
    --executada) EXECUTADA=1; shift ;;
    --alcada) [[ $# -ge 2 ]] || { echo "RECUSADO: --alcada exige valor" >&2; exit 2; }; ALCADA="$2"; shift 2 ;;
    --arquivar) ARQUIVAR=1; shift ;;
    --forcar) FORCAR=1; shift ;;
    --papel) [[ $# -ge 2 ]] || { echo "RECUSADO: --papel exige valor" >&2; exit 2; }; PAPEL_FWD="$2"; shift 2 ;;
    --decidida-em) [[ $# -ge 2 ]] || { echo "RECUSADO: --decidida-em exige valor ISO" >&2; exit 2; }; DECIDIDA_EM_EXPLICITA="$2"; shift 2 ;;
    --origem-decisao) [[ $# -ge 2 ]] || { echo "RECUSADO: --origem-decisao exige valor" >&2; exit 2; }; ORIGEM_DECISAO="$2"; shift 2 ;;
    --) shift; while [[ $# -gt 0 ]]; do POSITIONAL+=("$1"); shift; done ;;
    *) POSITIONAL+=("$1"); shift ;;
  esac
done

if [[ "${#POSITIONAL[@]}" -lt 2 ]]; then usage; exit 2; fi
ID="${POSITIONAL[0]}"
DECISAO_TEXTO="${POSITIONAL[1]}"

# 02/09 (decisao do dono; auditoria do RESUMO): proveniencia da DECISAO e' campo, nao prosa.
if [[ -z "$ORIGEM_DECISAO" ]]; then
  echo "RECUSADO: --origem-decisao e obrigatorio (onde a decisao foi tomada)." >&2
  echo "          console:COMANDO|DECISAO|RESUMO · externo:github|railway|neon|aws · alcada:<PAPEL> · par:<PAPEL>" >&2
  echo "          Nada foi escrito." >&2
  exit 2
fi
if [[ ! "$ORIGEM_DECISAO" =~ ^(console:[A-Z][A-Z0-9-]*|externo:(github|railway|neon|aws|outro)|alcada:[A-Z][A-Z0-9-]*|par:[A-Z][A-Za-z0-9-]*)$ ]]; then
  echo "RECUSADO: --origem-decisao invalida: '$ORIGEM_DECISAO'" >&2
  echo "          Formatos: console:<PAPEL> · externo:github|railway|neon|aws|outro · alcada:<PAPEL> · par:<PAPEL>" >&2
  exit 2
fi
# A32 (dono 03/09): o DECISAO decide o reversivel por alcada; a linha REVERSAO e o que torna "reversivel" verificavel e o que o
# papel de origem executa se o dono vetar em 24 h. Sem ela, a decisao e irreversivel por definicao e sobe ao dono.
if [[ "$ORIGEM_DECISAO" == "alcada:DECISAO" ]] && ! printf '%s' "$DECISAO_TEXTO" | grep -qiE '^[[:space:]]*REVERS[AÃ]O:[[:space:]]*[^[:space:]]'; then
  echo "RECUSADO (A32): decisao por alcada do DECISAO tem de comecar por 'REVERSAO: <como se desfaz em 1 linha> — <decisao>'. Se nao ha como desfazer, e irreversivel: sobe ao dono (console:DECISAO)." >&2
  exit 2
fi
if [[ "$ORIGEM_DECISAO" == console:* ]]; then
  _P="${ORIGEM_DECISAO#console:}"
  case "$_P" in RESUMO|COMANDO|DECISAO) : ;;
    *) echo "AVISO: console:$_P esta FORA da superficie do dono (RESUMO/COMANDO/DECISAO) — registado assim mesmo." >&2 ;;
  esac
fi

if [[ ! "$ID" =~ ^D-[0-9]+$ ]]; then
  echo "RECUSADO: id inválido '$ID' — formato esperado D-nnn" >&2
  exit 2
fi

N_FLAGS=$EXECUTADA
if [[ -n "$ALCADA" ]]; then N_FLAGS=$((N_FLAGS + 1)); fi
N_FLAGS=$((N_FLAGS + ARQUIVAR))
if [[ "$N_FLAGS" -gt 1 ]]; then
  echo "RECUSADO: use no máximo uma de --executada / --alcada / --arquivar" >&2
  exit 2
fi

ESTADO="decidida"
if [[ "$EXECUTADA" -eq 1 ]]; then
  ESTADO="decidida_executada"
elif [[ -n "$ALCADA" ]]; then
  ESTADO="decidida_por_alcada"
elif [[ "$ARQUIVAR" -eq 1 ]]; then
  ESTADO="arquivada"
fi

[[ -f "$DECISOES_JSON" ]] || { echo "RECUSADO: $DECISOES_JSON não encontrado — rode a migração primeiro" >&2; exit 1; }

if [[ -n "$DECIDIDA_EM_EXPLICITA" && -z "$PAPEL_FWD" ]]; then
  echo "RECUSADO: --decidida-em exige --papel <PAPEL> — a validacao da data e delegada ao" >&2
  echo "          decisao-ref.sh, que precisa do papel para registar a proveniencia." >&2
  echo "          Recusado ANTES de gravar: nada foi escrito." >&2
  exit 2
fi

set +e
OUT=$(REGISTRY_LIB_DIR="$SCRIPT_DIR" \
  DECISOES_JSON="$DECISOES_JSON" \
  ID="$ID" DECISAO_TEXTO="$DECISAO_TEXTO" ESTADO="$ESTADO" ALCADA="$ALCADA" FORCAR="$FORCAR" DECIDIDA_EM_EXPLICITA="$DECIDIDA_EM_EXPLICITA" ORIGEM_DECISAO="$ORIGEM_DECISAO" \
  python3 <<'PYEOF'
import datetime
import os
import sys

sys.path.insert(0, os.environ["REGISTRY_LIB_DIR"])
from registry_lib import mutate, RegistryLockTimeout  # noqa: E402

DECISOES_JSON = os.environ["DECISOES_JSON"]
ID = os.environ["ID"]
DECISAO_TEXTO = os.environ["DECISAO_TEXTO"]
ESTADO = os.environ["ESTADO"]
ALCADA = os.environ.get("ALCADA") or ""
ORIGEM_DECISAO = os.environ.get("ORIGEM_DECISAO") or ""
FORCAR = os.environ["FORCAR"] == "1"
DATA_EXPLICITA = (os.environ.get("DECIDIDA_EM_EXPLICITA") or "").strip()
now_iso = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:00Z')

status = {}


def do_decide(reg):
    alvo = None
    for d in reg["decisoes"]:
        if d["id"] == ID:
            alvo = d
            break
    if alvo is None:
        status["error"] = f"RECUSADO: {ID} não existe em decisoes.json"
        status["code"] = 3
        return
    if alvo["estado"] != "aberta" and not FORCAR:
        status["error"] = (
            f"RECUSADO: {ID} já está '{alvo['estado']}' (decidida_em={alvo.get('decidida_em')}) "
            f"— use --forcar para redecidir"
        )
        status["code"] = 4
        return
    alvo["estado"] = ESTADO
    alvo["origem_decisao"] = ORIGEM_DECISAO
    anterior = (alvo.get("decidida_em") or "").strip()
    if DATA_EXPLICITA:
        status["nota_data"] = (
            f"decidida_em NAO tocada aqui — delegada ao decisao-ref.sh (a regra de validacao "
            f"vive com o CAMPO, nao com o script). Actual: {anterior or '(vazia)'}"
        )
    elif anterior:
        status["nota_data"] = (
            f"decidida_em PRESERVADA: {anterior} — nao foi re-carimbada. "
            f"Passa --decidida-em <ISO> se esta e uma decisao NOVA."
        )
    else:
        alvo["decidida_em"] = now_iso
        status["nota_data"] = f"decidida_em carimbada agora: {now_iso} (nao havia anterior)"
    texto = DECISAO_TEXTO
    if ALCADA:
        texto = f"(alçada {ALCADA}) {texto}"
    alvo["decisao"] = texto
    alvo["atualizado_em"] = now_iso
    status["ok"] = True
    status["titulo"] = alvo["titulo"]


try:
    mutate(DECISOES_JSON, do_decide)
except RegistryLockTimeout as e:
    print(f"RECUSADO: {e}", file=sys.stderr)
    sys.exit(5)

if status.get("error"):
    print(status["error"], file=sys.stderr)
    sys.exit(status["code"])

print(f"OK: {ID} -> {ESTADO} ({status['titulo']})")
if status.get("nota_data"):
    print(f"    {status['nota_data']}")
PYEOF
)
RC=$?
set -e
echo "$OUT"
if [[ $RC -ne 0 ]]; then
  exit $RC
fi

# --decidida-em delega no decisao-ref.sh: a validacao (formato / data futura / estado) vive
# com o CAMPO e nao duplicada aqui. A ordem funciona porque o ref so recusa enquanto o estado
# e "aberta", e a esta altura ja foi fechado acima.
if [[ -n "$DECIDIDA_EM_EXPLICITA" ]]; then
  REF="$SCRIPT_DIR/decisao-ref.sh"
  if [[ ! -x "$REF" && ! -f "$REF" ]]; then
    echo "RECUSADO: --decidida-em precisa do decisao-ref.sh em $REF (validacao vive la)" >&2
    exit 2
  fi
  echo "    delegando decidida_em ao decisao-ref.sh (validacao de formato/futuro/estado)..."
  if ! bash "$REF" "$ID" --decidida-em "$DECIDIDA_EM_EXPLICITA" \
        --papel "$PAPEL_FWD" \
        --motivo "definida via decisao-decidir.sh --decidida-em no mesmo gesto da decisao"; then
    echo "AVISO: o estado e o texto de $ID FORAM gravados, mas a data NAO — o decisao-ref.sh recusou-a acima." >&2
    echo "       decidida_em ficou como estava. Corrige com: decisao-ref.sh $ID --decidida-em <ISO>" >&2
    exit 6
  fi
fi

RENDER="$SCRIPT_DIR/decisoes-render.sh"
if [[ -x "$RENDER" ]]; then
  DECISOES_DIR="$T" "$RENDER" >&2 || echo "AVISO: decisoes-render.sh falhou após decidir $ID — rode manualmente" >&2
fi

# 03/09 (diagnostico §6/§11 #5, ordem do dono): 9 decisoes tomadas nao chegaram a quem estava parado nelas (ate 43 h).
# A decisao registada ACORDA, no mesmo gesto, quem a cita no ultimo blocked/posto: evento no 2o canal (Monitor) +
# tela (best-effort). Sem LLM, sem esperar o tick.
python3 - "$ID" "$DECISAO_TEXTO" <<'PYW' 2>/dev/null || true
import json,os,re,datetime,subprocess
did,txt=sys_argv=None,None
import sys; did,txt=sys.argv[1],sys.argv[2]
AI=os.path.expanduser('~/Claude/docs/ai-state'); now=datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
last={}
for l in open(f'{AI}/roadmap/results.jsonl',errors='replace'):
    try: e=json.loads(l)
    except Exception: continue
    if e.get('status') in ('anulado',): continue
    last[e.get('task')]=e
alvos={}
for t,e in last.items():
    if e.get('status') in ('blocked','failed','posto') and re.search(r'\b'+re.escape(did)+r'\b',str(e.get('nota') or '')) and e.get('papel') not in (None,'tick','DECISAO'):
        alvos.setdefault(e['papel'],[]).append(t)
for papel,tasks in alvos.items():
    msg=f"tick/decisao: {did} DECIDIDA agora — {txt[:110]} — a tua {', '.join(tasks[:3])} cita-a como bloqueio; regista RESULT novo (posto/done) ou re-bloqueia com motivo novo."
    with open(f'{AI}/roadmap/filas/atribuicoes.jsonl','a') as f:
        f.write(json.dumps({"ts": now, "papel": papel, "task": tasks[0], "frente": "decisao", "msg": msg}, ensure_ascii=False)+'\n')
    subprocess.run(['bash',os.path.expanduser('~/Claude/.claude/scripts/terminal-send.sh'),papel,msg],capture_output=True,timeout=90)
    print(f"acordado: {papel} ({', '.join(tasks[:3])})")
PYW
