#!/usr/bin/env bash
# decisao-ref.sh — corrige/anexa METADADO de uma decisão já existente (não decide).
# Contrato: docs/ai-state/terminais (reforma de pendencias, 2026-08-28, builder B,
# pendência 2 do RETOMADA — pedido do COMANDO, origem DE-COORD e VISAO).
set -euo pipefail

T="${DECISOES_DIR:-$HOME/Claude/docs/ai-state/terminais}"
DECISOES_JSON="$T/decisoes.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat <<'EOF'
Uso: decisao-ref.sh D-nnn [--pr N]... [--pr-remove N]... [--decidida-em <ISO|AAAA-MM-DD>]
     [--recomendacao "<texto>"] [--efeito "<texto>"] [--bloco 1|2|3|4] [--motivo "<texto>"]
     [--bloqueado-por PAPEL --motivo "<texto>"] [--desbloquear]
     [--papel X] [--forcar]

Corrige/anexa METADADO de uma decisão já existente em decisoes.json. NÃO decide — isso é
decisao-decidir.sh (muda `estado`/`decisao`). Este script nunca toca `estado` nem `decisao`.
Toda mutação via registry_lib.mutate (flock + tmp + os.replace) — nunca open(path,"w") direto.

  --pr N            adiciona N a refs.pr (repetível). Idempotente: já presente não duplica.
  --pr-remove N      remove N de refs.pr (repetível).
  --decidida-em D   só permitido se o `estado` atual já é decidida/decidida_executada/
                    decidida_por_alcada/arquivada — RECUSA em decisão "aberta" (corrigir data
                    de algo que ainda não foi decidido não faz sentido). Aceita
                    "AAAA-MM-DDTHH:MM:SSZ" (ISO, hora opcional com segundos) ou "AAAA-MM-DD"
                    (sem hora — assume 12:00Z e marca `decidida_em_estimada:true`). RECUSA data
                    no futuro. `decidida_em` recebe exatamente a data informada (nunca "agora")
                    — corrige sem falsear; `atualizado_em` sim recebe o carimbo de agora.
  --recomendacao T  preenche `recomendacao` se estiver vazio. Se já preenchido, exige --forcar
                    (o valor antigo vai para `anomalias`, nunca é descartado em silêncio).
  --efeito T        mesma regra do --recomendacao, para o campo `efeito`.
  --bloco N         1|2|3|4 — corrige o bloco de ranking; valor antigo vai para anomalias.
  --motivo T        texto livre anexado às anomalias registradas por esta chamada (de onde
                    veio a informação — narrativa, log, pedido de outro papel). OBRIGATÓRIO
                    junto de --bloqueado-por (vira o campo `bloqueio.motivo`).
  --bloqueado-por P grava campo estruturado `bloqueio: {papel, motivo, desde}` (ITEM 2, reforma
                    2026-08-28) — decisão D-nnn está travada aguardando ação de P. Exige
                    --motivo junto. P precisa existir em registry.json (qualquer estado);
                    recusa auto-bloqueio (P == papel do chamador). Mutuamente exclusivo com
                    --desbloquear. Trocar de bloqueador não exige --forcar (valor antigo vai
                    para anomalias, nunca é descartado em silêncio).
  --desbloquear     limpa `bloqueio` (volta a null). Recusa se já não há bloqueio ativo (nenhuma
                    mudança real).
  --papel X         papel/token do chamador. Resolvido por $CMUX_WORKSPACE_ID no registry
                    (docs/ai-state/terminais/registry.json) quando omitido; sem match e sem
                    esta flag -> recusa.
  --forcar          permite sobrescrever `recomendacao`/`efeito` já preenchidos.

Exit codes: 0 ok | 2 uso inválido/nenhum argumento de mudança/--bloqueado-por sem --motivo/
            --bloqueado-por junto de --desbloquear | 3 papel não resolvido | 4 id inexistente |
            5 lock preso | 6 --decidida-em inválido (aberta/futuro/formato/campo já preenchido
            sem --forcar) | 7 --bloqueado-por inválido (papel inexistente no registry ou
            auto-bloqueio).

Ao final roda decisoes-render.sh (view/ARQUIVO refletem a correção imediatamente) e imprime
o diff dos campos alterados.
EOF
}

ID=""
PR_ADD=()
PR_REMOVE=()
DECIDIDA_EM_RAW=""
RECOMENDACAO=""
HAS_RECOMENDACAO=0
EFEITO=""
HAS_EFEITO=0
BLOCO=""
MOTIVO=""
PAPEL_OVERRIDE=""
FORCAR=0
BLOQUEADO_POR=""
HAS_BLOQUEADO_POR=0
DESBLOQUEAR=0
POSITIONAL=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h) usage; exit 0 ;;
    --pr) [[ $# -ge 2 ]] || { echo "RECUSADO: --pr exige valor" >&2; exit 2; }; PR_ADD+=("$2"); shift 2 ;;
    --pr-remove) [[ $# -ge 2 ]] || { echo "RECUSADO: --pr-remove exige valor" >&2; exit 2; }; PR_REMOVE+=("$2"); shift 2 ;;
    --decidida-em) [[ $# -ge 2 ]] || { echo "RECUSADO: --decidida-em exige valor" >&2; exit 2; }; DECIDIDA_EM_RAW="$2"; shift 2 ;;
    --recomendacao) [[ $# -ge 2 ]] || { echo "RECUSADO: --recomendacao exige valor" >&2; exit 2; }; RECOMENDACAO="$2"; HAS_RECOMENDACAO=1; shift 2 ;;
    --efeito) [[ $# -ge 2 ]] || { echo "RECUSADO: --efeito exige valor" >&2; exit 2; }; EFEITO="$2"; HAS_EFEITO=1; shift 2 ;;
    --bloco) [[ $# -ge 2 ]] || { echo "RECUSADO: --bloco exige valor" >&2; exit 2; }
      case "$2" in
        1|2|3|4) ;;
        *) echo "RECUSADO: --bloco inválido '$2' — use 1|2|3|4" >&2; exit 2 ;;
      esac
      BLOCO="$2"; shift 2 ;;
    --motivo) [[ $# -ge 2 ]] || { echo "RECUSADO: --motivo exige valor" >&2; exit 2; }; MOTIVO="$2"; shift 2 ;;
    --bloqueado-por) [[ $# -ge 2 ]] || { echo "RECUSADO: --bloqueado-por exige valor" >&2; exit 2; }; BLOQUEADO_POR="$2"; HAS_BLOQUEADO_POR=1; shift 2 ;;
    --desbloquear) DESBLOQUEAR=1; shift ;;
    --papel) [[ $# -ge 2 ]] || { echo "RECUSADO: --papel exige valor" >&2; exit 2; }; PAPEL_OVERRIDE="$2"; shift 2 ;;
    --forcar) FORCAR=1; shift ;;
    --) shift; while [[ $# -gt 0 ]]; do POSITIONAL+=("$1"); shift; done ;;
    *) POSITIONAL+=("$1"); shift ;;
  esac
done

if [[ "$HAS_BLOQUEADO_POR" -eq 1 && "$DESBLOQUEAR" -eq 1 ]]; then
  echo "RECUSADO: --bloqueado-por e --desbloquear são mutuamente exclusivos" >&2
  exit 2
fi
if [[ "$HAS_BLOQUEADO_POR" -eq 1 ]]; then
  if [[ ! "$BLOQUEADO_POR" =~ ^[A-Z][A-Z0-9-]*$ ]]; then
    echo "RECUSADO: --bloqueado-por '$BLOQUEADO_POR' fora do formato (maiúsculas/números/hífen, ex: DE-COORD)" >&2
    exit 2
  fi
  if [[ -z "$MOTIVO" ]]; then
    echo "RECUSADO: --bloqueado-por exige --motivo junto (vira o campo bloqueio.motivo)" >&2
    exit 2
  fi
fi

if [[ "${#POSITIONAL[@]}" -lt 1 ]]; then usage; exit 2; fi
ID="${POSITIONAL[0]}"

if [[ ! "$ID" =~ ^D-[0-9]+$ ]]; then
  echo "RECUSADO: id inválido '$ID' — formato esperado D-nnn" >&2
  exit 2
fi

# Nenhum argumento de mudança -> recusa antes de tocar no JSON.
if [[ "${#PR_ADD[@]}" -eq 0 && "${#PR_REMOVE[@]}" -eq 0 && -z "$DECIDIDA_EM_RAW" \
      && "$HAS_RECOMENDACAO" -eq 0 && "$HAS_EFEITO" -eq 0 && -z "$BLOCO" \
      && "$HAS_BLOQUEADO_POR" -eq 0 && "$DESBLOQUEAR" -eq 0 ]]; then
  echo "RECUSADO: nenhum argumento de mudança — passe pelo menos um de --pr/--pr-remove/--decidida-em/--recomendacao/--efeito/--bloco/--bloqueado-por/--desbloquear" >&2
  exit 2
fi

[[ -f "$DECISOES_JSON" ]] || { echo "RECUSADO: $DECISOES_JSON não encontrado — rode a migração primeiro" >&2; exit 1; }

REGISTRY="$T/registry.json"
PAPEL=""
if [[ -n "$PAPEL_OVERRIDE" ]]; then
  if [[ ! "$PAPEL_OVERRIDE" =~ ^[A-Z][A-Z0-9-]*$ ]]; then
    echo "RECUSADO: --papel '$PAPEL_OVERRIDE' fora do formato (maiúsculas/números/hífen, ex: DE-COORD, WATCHDOG)" >&2
    exit 2
  fi
  PAPEL="$PAPEL_OVERRIDE"
elif [[ -n "${CMUX_WORKSPACE_ID:-}" ]]; then
  if [[ -f "$REGISTRY" ]]; then
    PAPEL=$(REGISTRY_LIB_DIR="$SCRIPT_DIR" python3 - "$REGISTRY" "$CMUX_WORKSPACE_ID" <<'PYEOF'
import os, sys
sys.path.insert(0, os.environ["REGISTRY_LIB_DIR"])
from registry_lib import load
registry_path, ws = sys.argv[1], sys.argv[2]
try:
    reg = load(registry_path)
    for papel, e in (reg.get("terminais") or {}).items():
        if e.get("workspace_uuid") == ws:
            print(papel)
            break
except Exception:
    pass
PYEOF
)
  fi
  if [[ -z "$PAPEL" ]]; then
    echo "RECUSADO: CMUX_WORKSPACE_ID ($CMUX_WORKSPACE_ID) não resolvido no registry — use --papel explícito" >&2
    exit 3
  fi
else
  echo "RECUSADO: sem --papel e sem CMUX_WORKSPACE_ID no ambiente — passe --papel <PAPEL|TOKEN>" >&2
  exit 3
fi

PR_ADD_JSON="[]"
if [[ "${#PR_ADD[@]}" -gt 0 ]]; then
  PR_ADD_JSON=$(printf '%s\n' "${PR_ADD[@]}" | python3 -c 'import sys, json; print(json.dumps(sorted({int(x) for x in sys.stdin if x.strip()})))')
fi
PR_REMOVE_JSON="[]"
if [[ "${#PR_REMOVE[@]}" -gt 0 ]]; then
  PR_REMOVE_JSON=$(printf '%s\n' "${PR_REMOVE[@]}" | python3 -c 'import sys, json; print(json.dumps(sorted({int(x) for x in sys.stdin if x.strip()})))')
fi

set +e
OUT=$(REGISTRY_LIB_DIR="$SCRIPT_DIR" \
  DECISOES_JSON="$DECISOES_JSON" REGISTRY="$REGISTRY" \
  ID="$ID" PAPEL="$PAPEL" MOTIVO="$MOTIVO" FORCAR="$FORCAR" \
  PR_ADD_JSON="$PR_ADD_JSON" PR_REMOVE_JSON="$PR_REMOVE_JSON" \
  DECIDIDA_EM_RAW="$DECIDIDA_EM_RAW" \
  HAS_RECOMENDACAO="$HAS_RECOMENDACAO" RECOMENDACAO="$RECOMENDACAO" \
  HAS_EFEITO="$HAS_EFEITO" EFEITO="$EFEITO" \
  BLOCO="$BLOCO" \
  HAS_BLOQUEADO_POR="$HAS_BLOQUEADO_POR" BLOQUEADO_POR="$BLOQUEADO_POR" DESBLOQUEAR="$DESBLOQUEAR" \
  python3 <<'PYEOF'
import datetime
import json
import os
import re
import sys

sys.path.insert(0, os.environ["REGISTRY_LIB_DIR"])
from registry_lib import mutate, RegistryLockTimeout, load as load_registry  # noqa: E402

DECISOES_JSON = os.environ["DECISOES_JSON"]
REGISTRY = os.environ["REGISTRY"]
ID = os.environ["ID"]
PAPEL = os.environ["PAPEL"]
MOTIVO = os.environ.get("MOTIVO") or ""
FORCAR = os.environ["FORCAR"] == "1"
PR_ADD = json.loads(os.environ["PR_ADD_JSON"])
PR_REMOVE = json.loads(os.environ["PR_REMOVE_JSON"])
DECIDIDA_EM_RAW = os.environ.get("DECIDIDA_EM_RAW") or ""
HAS_RECOMENDACAO = os.environ["HAS_RECOMENDACAO"] == "1"
RECOMENDACAO = os.environ.get("RECOMENDACAO") or ""
HAS_EFEITO = os.environ["HAS_EFEITO"] == "1"
EFEITO = os.environ.get("EFEITO") or ""
BLOCO_RAW = os.environ.get("BLOCO") or ""
BLOCO = int(BLOCO_RAW) if BLOCO_RAW else None
HAS_BLOQUEADO_POR = os.environ["HAS_BLOQUEADO_POR"] == "1"
BLOQUEADO_POR = os.environ.get("BLOQUEADO_POR") or ""
DESBLOQUEAR = os.environ["DESBLOQUEAR"] == "1"

# Validacao de --bloqueado-por contra o registry: fora da transacao do
# decisoes.json de proposito (nao depende do conteudo dele, e falha rapido
# sem tomar o lock exclusivo). Leitura via registry_lib.load (lock
# compartilhado) — nunca open(path) cru.
if HAS_BLOQUEADO_POR:
    try:
        papeis_registry = set((load_registry(REGISTRY).get("terminais") or {}).keys())
    except Exception:
        papeis_registry = set()
    if BLOQUEADO_POR not in papeis_registry:
        print(f"RECUSADO: papel bloqueador '{BLOQUEADO_POR}' não existe no registry ({REGISTRY})", file=sys.stderr)
        sys.exit(7)
    if BLOQUEADO_POR == PAPEL:
        print(f"RECUSADO: auto-bloqueio recusado — {PAPEL} não pode se declarar bloqueador da própria decisão", file=sys.stderr)
        sys.exit(7)

NOW = datetime.datetime.now(datetime.timezone.utc)
now_iso = NOW.strftime('%Y-%m-%dT%H:%M:00Z')

ISO_RE = re.compile(
    r'^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?Z?)?$'
)
ESTADOS_FECHADOS = {"decidida", "decidida_executada", "decidida_por_alcada", "arquivada"}

status = {}


def parse_decidida_em(raw):
    """(iso_str, estimada) a partir de 'AAAA-MM-DD[THH:MM[:SS]][Z]' ou 'AAAA-MM-DD'.
    Levanta ValueError com mensagem legível se o formato ou a data forem inválidos."""
    m = ISO_RE.match(raw.strip())
    if not m:
        raise ValueError(f"formato inválido '{raw}' — use AAAA-MM-DD ou AAAA-MM-DDTHH:MM:SSZ")
    y, mo, d, h, mi, s = m.groups()
    estimada = h is None
    hh = int(h) if h else 12
    mm = int(mi) if mi else 0
    ss = int(s) if s else 0
    try:
        dt = datetime.datetime(int(y), int(mo), int(d), hh, mm, ss, tzinfo=datetime.timezone.utc)
    except ValueError as e:
        raise ValueError(f"data inválida '{raw}': {e}")
    if dt > NOW:
        raise ValueError(f"data no futuro '{raw}' (agora={now_iso}) — recusado")
    iso = dt.strftime('%Y-%m-%dT%H:%M:%SZ')
    return iso, estimada


def do_ref(reg):
    alvo = None
    for d in reg["decisoes"]:
        if d["id"] == ID:
            alvo = d
            break
    if alvo is None:
        status["error"] = f"RECUSADO: {ID} não existe em decisoes.json"
        status["code"] = 4
        return

    diff = []  # [(campo, antes, depois)]
    changed = False
    alvo["anomalias"] = list(alvo.get("anomalias") or [])
    motivo_sufixo = f" (origem: {MOTIVO})" if MOTIVO else ""

    # --pr / --pr-remove — idempotente, nunca duplica.
    if PR_ADD or PR_REMOVE:
        refs = alvo.setdefault("refs", {"pr": [], "papel": []})
        prs = set(refs.get("pr") or [])
        antes = sorted(prs)
        for p in PR_ADD:
            prs.add(p)
        for p in PR_REMOVE:
            prs.discard(p)
        depois = sorted(prs)
        if depois != antes:
            refs["pr"] = depois
            diff.append(("refs.pr", antes, depois))
            changed = True

    # --bloco — corrige o bloco de ranking; guarda o valor antigo em anomalias.
    if BLOCO is not None:
        antes_bloco = alvo.get("bloco")
        if antes_bloco != BLOCO:
            alvo["anomalias"].append(
                f"bloco corrigido de {antes_bloco!r} para {BLOCO} por {PAPEL} em {now_iso}{motivo_sufixo}"
            )
            alvo["bloco"] = BLOCO
            diff.append(("bloco", antes_bloco, BLOCO))
            changed = True

    # --recomendacao / --efeito — só sobre campo vazio, a menos que --forcar.
    for campo, has_flag, valor in (
        ("recomendacao", HAS_RECOMENDACAO, RECOMENDACAO),
        ("efeito", HAS_EFEITO, EFEITO),
    ):
        if not has_flag:
            continue
        atual = alvo.get(campo)
        if atual and atual.strip():
            if not FORCAR:
                status["error"] = (
                    f"RECUSADO: {ID}.{campo} já preenchido ('{atual}') — use --forcar para sobrescrever"
                )
                status["code"] = 6
                return
            alvo["anomalias"].append(
                f"{campo} sobrescrito por {PAPEL} em {now_iso}{motivo_sufixo}: valor antigo = '{atual}'"
            )
        alvo[campo] = valor
        diff.append((campo, atual, valor))
        changed = True

    # --decidida-em — só em decisão já fechada; nunca falseia com "agora".
    if DECIDIDA_EM_RAW:
        estado_atual = alvo.get("estado")
        if estado_atual not in ESTADOS_FECHADOS:
            status["error"] = (
                f"RECUSADO: --decidida-em só é permitido em decisão decidida/decidida_executada/"
                f"decidida_por_alcada/arquivada — {ID} está '{estado_atual}' (aberta)"
            )
            status["code"] = 6
            return
        try:
            decidida_em_iso, estimada = parse_decidida_em(DECIDIDA_EM_RAW)
        except ValueError as e:
            status["error"] = f"RECUSADO: {e}"
            status["code"] = 6
            return
        antes_decidida = alvo.get("decidida_em")
        alvo["decidida_em"] = decidida_em_iso
        alvo["decidida_em_estimada"] = estimada
        alvo["anomalias"].append(
            f"decidida_em informado por {PAPEL} em {now_iso}: {DECIDIDA_EM_RAW}{motivo_sufixo}"
        )
        diff.append(("decidida_em", antes_decidida, decidida_em_iso))
        changed = True

    # --bloqueado-por — grava bloqueio: {papel, motivo, desde} (ITEM 2, reforma
    # 2026-08-28). Trocar de bloqueador nao exige --forcar; o valor antigo vai
    # para anomalias, nunca e descartado em silencio.
    if HAS_BLOQUEADO_POR:
        antes_bloqueio = alvo.get("bloqueio")
        novo_bloqueio = {"papel": BLOQUEADO_POR, "motivo": MOTIVO, "desde": now_iso}
        if antes_bloqueio == novo_bloqueio:
            pass  # mesmo papel+motivo ja vigente — nao regrava 'desde' a toa
        else:
            if antes_bloqueio:
                alvo["anomalias"].append(
                    f"bloqueio trocado de {antes_bloqueio!r} para papel={BLOQUEADO_POR!r} "
                    f"por {PAPEL} em {now_iso}"
                )
            alvo["bloqueio"] = novo_bloqueio
            diff.append(("bloqueio", antes_bloqueio, novo_bloqueio))
            changed = True

    # --desbloquear — limpa bloqueio (volta a null). Sem bloqueio ativo cai
    # no "nenhuma mudanca real" generico abaixo.
    if DESBLOQUEAR:
        antes_bloqueio = alvo.get("bloqueio")
        if antes_bloqueio:
            alvo["anomalias"].append(
                f"bloqueio removido por {PAPEL} em {now_iso}{motivo_sufixo}: era {antes_bloqueio!r}"
            )
            alvo["bloqueio"] = None
            diff.append(("bloqueio", antes_bloqueio, None))
            changed = True

    if not changed:
        status["error"] = f"RECUSADO: nenhuma mudança real aplicável a {ID} (valores já eram os informados)"
        status["code"] = 6
        return

    alvo["atualizado_em"] = now_iso
    status["ok"] = True
    status["titulo"] = alvo["titulo"]
    status["diff"] = diff


try:
    mutate(DECISOES_JSON, do_ref)
except RegistryLockTimeout as e:
    print(f"RECUSADO: {e}", file=sys.stderr)
    sys.exit(5)

if status.get("error"):
    print(status["error"], file=sys.stderr)
    sys.exit(status["code"])

print(f"OK: {ID} atualizado ({status['titulo']}) — {len(status['diff'])} campo(s) alterado(s):")
for campo, antes, depois in status["diff"]:
    print(f"  {campo}: {antes!r} -> {depois!r}")
PYEOF
)
RC=$?
set -e
echo "$OUT"
if [[ $RC -ne 0 ]]; then
  exit $RC
fi

RENDER="$SCRIPT_DIR/decisoes-render.sh"
if [[ -x "$RENDER" ]]; then
  DECISOES_DIR="$T" "$RENDER" >&2 || echo "AVISO: decisoes-render.sh falhou após corrigir $ID — rode manualmente" >&2
fi
