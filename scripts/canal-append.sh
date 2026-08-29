#!/usr/bin/env bash
# canal-append.sh — ponto unico de escrita em ALERTAS.md / PEDIDOS.md / ORDENS.md.
# Contrato: docs/ai-state/de-pr-queue (reforma de pendencias, 2026-08-28).
set -euo pipefail

Q="${DE_PR_QUEUE_DIR:-$HOME/Claude/docs/ai-state/de-pr-queue}"
T="${PAPEL_TERMINAIS_DIR:-$HOME/Claude/docs/ai-state/terminais}"
REGISTRY="$T/registry.json"
CLAIMS="$Q/claims.json"
ROTA_STATE="$T/.roteamento-state.json"
ROTA_LOG="$T/roteamento.log"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERMINAL_SEND_BIN="${TERMINAL_SEND_BIN:-$SCRIPT_DIR/terminal-send.sh}"
CMUX_BIN="${CMUX_BIN:-/Applications/cmux.app/Contents/Resources/bin/cmux}"

usage() {
  cat <<'EOF'
Uso: canal-append.sh <ALERTAS|PEDIDOS|ORDENS> "<texto>" [--papel X] [--tipo T] [--ref R]
     [--no-rota] [--rota PAPEL]

Unico ponto de escrita permitido nos 3 canais vivos da fila DE. Carimba
`[AAAA-MM-DD HH:MM]` em UTC (o chamador NUNCA passa hora) e apenda a
linha final:

  [data hora] <PAPEL> <TIPO>[ <ref>]: <texto>

  --papel   Papel/token do chamador. Resolvido por $CMUX_WORKSPACE_ID no
            registry (docs/ai-state/terminais/registry.json) quando
            omitido; sem match no registry E sem esta flag -> recusa.
            Processos automaticos usam token maiusculo (WATCHDOG, RENDER,
            SYNC) em vez de papel de terminal.
  --tipo    ALERTA|ONLINE|PEDIDO|RETRATADO|RESOLVIDO|INFO (default INFO).
            RESOLVIDO exige --ref.
  --ref     Referencia fechada por este registro: para RESOLVIDO/RETRATADO,
            o `[data hora] PAPEL` da linha original OU o id (P-/O-/D-/A-nnn).
  --no-rota Desliga o roteamento lateral automatico so para esta chamada.
  --rota P  Forca P como destinatario adicional do roteamento lateral
            (somado ao que o texto detectar; ainda validado contra o
            registry e sujeito ao teto/dedup abaixo).

Roteamento lateral automatico (apos o append, nunca antes): o texto e
escaneado por (a) mencao direta a um PAPEL com estado=aberto no registry
(fronteira de palavra, nunca o proprio autor) e (b) `#NNNN` (PR, 4+
digitos) resolvido via claims.json (campo `pr` -> `terminal`; se o
terminal nao contiver um papel conhecido, cai para `scope`/`frente` ->
papel do registry que declara aquela frente). Para cada destinatario
resolvido, diferente do autor: `terminal-send.sh <PAPEL> "<resumo> — ver
<CANAL> [<ts>]"`. Dedup por (destinatario, canal, assinatura do texto)
em docs/ai-state/terminais/.roteamento-state.json (cooldown 30min).
Texto citando mais de 3 destinatarios e tratado como broadcast (nao
roteia, so avisa em stdout). Falha do send (papel fechado/nao resolve)
NUNCA derruba o append (que ja aconteceu) — so loga em
docs/ai-state/terminais/roteamento.log e segue (exit 0). Desligar
globalmente: env CANAL_ROTA_DISABLED=1.

Regras de texto: uma linha (sem quebra), <=300 chars. Acima disso a
escrita e recusada (exit 5) — escreva a prosa em
docs/ai-state/de-pr-queue/log/<hoje>.md e passe aqui so o resumo +
"ver log/<hoje>.md §HH:MM".

Escrita ALERTAS: um unico write() em modo append (O_APPEND), sem lock —
ALERTAS e append-only por design (nenhum escritor faz read-modify-write
nele), entao POSIX ja garante atomicidade entre escritores concorrentes.

Escrita PEDIDOS/ORDENS: estes 2 canais TEM escritor read-modify-write
(pedido-novo.sh/pedido-responder.sh/ordem-nova.sh — leem o arquivo
inteiro, inserem/alteram uma linha, escrevem via tmp+os.replace). Um
append simples nesses canais pode cair na janela entre o read e o
replace desse RMW e ser descartado silenciosamente (o replace troca o
arquivo por uma versao lida ANTES do append). Por isso, para PEDIDOS e
ORDENS, o append toma o MESMO lock exclusivo (`<arquivo>.lock`, fcntl
flock) que o RMW usa, com timeout de 5s — bloqueia ate o RMW liberar,
nunca perde a linha, e nunca imprime "OK" sem ter escrito de fato.

Exit codes: 0 ok | 2 uso invalido | 3 papel nao resolvido | 4 lock de
PEDIDOS/ORDENS preso (>5s) — nada foi escrito | 5 texto fora do formato
(quebra de linha ou >300 chars).
EOF
}

TIPOS_VALIDOS="ALERTA ONLINE PEDIDO RETRATADO RESOLVIDO INFO"

PAPEL_OVERRIDE=""
TIPO="INFO"
REF=""
NO_ROTA=0
ROTA_FORCE=""
POSITIONAL=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h) usage; exit 0 ;;
    --papel)
      [[ $# -ge 2 ]] || { echo "RECUSADO: --papel exige valor" >&2; exit 2; }
      PAPEL_OVERRIDE="$2"; shift 2 ;;
    --tipo)
      [[ $# -ge 2 ]] || { echo "RECUSADO: --tipo exige valor" >&2; exit 2; }
      TIPO="$2"; shift 2 ;;
    --ref)
      [[ $# -ge 2 ]] || { echo "RECUSADO: --ref exige valor" >&2; exit 2; }
      REF="$2"; shift 2 ;;
    --no-rota) NO_ROTA=1; shift ;;
    --rota)
      [[ $# -ge 2 ]] || { echo "RECUSADO: --rota exige valor" >&2; exit 2; }
      ROTA_FORCE="$2"; shift 2 ;;
    --) shift; while [[ $# -gt 0 ]]; do POSITIONAL+=("$1"); shift; done ;;
    *) POSITIONAL+=("$1"); shift ;;
  esac
done

if [[ "${#POSITIONAL[@]}" -lt 2 ]]; then
  usage
  exit 2
fi
CANAL="${POSITIONAL[0]}"
TEXTO="${POSITIONAL[1]}"

case "$CANAL" in
  ALERTAS) FILE="$Q/ALERTAS.md" ;;
  PEDIDOS) FILE="$Q/PEDIDOS.md" ;;
  ORDENS) FILE="$Q/ORDENS.md" ;;
  *) echo "RECUSADO: canal invalido '$CANAL' — use ALERTAS|PEDIDOS|ORDENS" >&2; exit 2 ;;
esac
[[ -f "$FILE" ]] || { echo "RECUSADO: canal nao encontrado: $FILE" >&2; exit 1; }

case " $TIPOS_VALIDOS " in
  *" $TIPO "*) ;;
  *) echo "RECUSADO: --tipo invalido '$TIPO' — use um de: $TIPOS_VALIDOS" >&2; exit 2 ;;
esac

if [[ "$TIPO" == "RESOLVIDO" && -z "$REF" ]]; then
  echo "RECUSADO: --tipo RESOLVIDO exige --ref <ref> ([data hora] PAPEL da linha original, ou id P-/O-/D-/A-nnn)" >&2
  exit 2
fi

HOJE="$(date -u +%Y-%m-%d)"
LOG_DIA="$Q/log/${HOJE}.md"
LOG_HINT="escreva a prosa em $LOG_DIA e passe aqui so o resumo + \"ver log/${HOJE}.md §HH:MM\""

# F0b (pedido do dono via RESUMO): texto que estoura o teto tinha destino
# NENHUM em ALERTAS/ORDENS -- so a recusa, e quem chamava tinha que truncar
# na mao (6x num dia). Agora ALERTAS/ORDENS AUTO-ROTEIAM o texto INTEIRO
# (sem teto) para log/<hoje>.md e deixam so um resumo + pointer no canal.
# PEDIDOS mantem o teto tal como estava (fluxo estruturado de
# pedido-novo.sh/pedido-responder.sh nao comporta prosa livre).
TEXTO_ORIGINAL="$TEXTO"
TEXTO_OVERFLOW=0
if [[ "$TEXTO" == *$'\n'* || ${#TEXTO} -gt 300 ]]; then
  TEXTO_OVERFLOW=1
fi

if [[ "$TEXTO_OVERFLOW" -eq 1 && "$CANAL" != "ALERTAS" && "$CANAL" != "ORDENS" ]]; then
  if [[ "$TEXTO" == *$'\n'* ]]; then
    echo "RECUSADO: texto contem quebra de linha — $LOG_HINT" >&2
  else
    echo "RECUSADO: texto com ${#TEXTO} chars (> 300) — $LOG_HINT" >&2
  fi
  exit 5
fi

PAPEL=""
if [[ -n "$PAPEL_OVERRIDE" ]]; then
  if [[ ! "$PAPEL_OVERRIDE" =~ ^[A-Z][A-Z0-9-]*$ ]]; then
    echo "RECUSADO: --papel '$PAPEL_OVERRIDE' fora do formato (maiusculas/numeros/hifen, ex: DE-COORD, WATCHDOG)" >&2
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
    echo "RECUSADO: CMUX_WORKSPACE_ID ($CMUX_WORKSPACE_ID) nao resolvido no registry — use --papel explicito" >&2
    exit 3
  fi
else
  echo "RECUSADO: sem --papel e sem CMUX_WORKSPACE_ID no ambiente — passe --papel <PAPEL|TOKEN>" >&2
  exit 3
fi

TS="$(date -u +'%Y-%m-%d %H:%M')"

if [[ "$TEXTO_OVERFLOW" -eq 1 ]]; then
  # ALERTAS/ORDENS (unicos que chegam aqui com overflow, ver checagem acima):
  # grava o texto INTEIRO (sem teto) em log/<hoje>.md num unico write()
  # atomico (O_APPEND — mesmo idioma de de-claims-sync.sh), e substitui
  # TEXTO pelo resumo curto + pointer que de fato vai para o canal.
  mkdir -p "$Q/log"
  LOG_DIA="$LOG_DIA" PAPEL="$PAPEL" CANAL="$CANAL" TEXTO_ORIGINAL="$TEXTO_ORIGINAL" python3 <<'PYEOF'
import os
import time

path = os.environ["LOG_DIA"]
papel = os.environ["PAPEL"]
canal = os.environ["CANAL"]
texto = os.environ["TEXTO_ORIGINAL"]
ts_hhmm = time.strftime("%H:%MZ", time.gmtime())
entry = f"\n## {ts_hhmm} [{papel} via canal-append {canal}]\n{texto}\n"
fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)
try:
    os.write(fd, entry.encode("utf-8"))
finally:
    os.close(fd)
PYEOF
  TS_HHMM="$(date -u +%H:%M)"
  RESUMO_CURTO="${TEXTO_ORIGINAL//$'\n'/ }"
  RESUMO_CURTO="${RESUMO_CURTO:0:220}"
  TEXTO="${RESUMO_CURTO}... (integra em log/${HOJE}.md §${TS_HHMM}Z)"
fi

if [[ -n "$REF" ]]; then
  LINE="[$TS] $PAPEL $TIPO $REF: $TEXTO"
else
  LINE="[$TS] $PAPEL $TIPO: $TEXTO"
fi

# PEDIDOS/ORDENS tem escritor RMW (pedido-novo/pedido-responder/ordem-nova)
# que le o arquivo inteiro e substitui via tmp+os.replace sob flock em
# "<arquivo>.lock". Um append sem lock nesses 2 canais pode cair na janela
# do RMW e ser descartado quando o replace troca o arquivo (bug real,
# reproduzido com sleep injetado no RMW). ALERTAS e append-only puro (nenhum
# escritor faz RMW nele) — continua sem lock, por design.
case "$CANAL" in
  PEDIDOS|ORDENS) NEEDS_LOCK=1 ;;
  *) NEEDS_LOCK=0 ;;
esac

FILE="$FILE" LINE="$LINE" NEEDS_LOCK="$NEEDS_LOCK" python3 - <<'PYEOF'
import fcntl, os, sys, time

path = os.environ["FILE"]
line = (os.environ["LINE"] + "\n").encode("utf-8")
needs_lock = os.environ["NEEDS_LOCK"] == "1"
LOCK_TIMEOUT = 5.0


def do_append():
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o644)
    try:
        os.write(fd, line)  # write() unico, O_APPEND: atomico p/ escritores concorrentes
    finally:
        os.close(fd)


if not needs_lock:
    do_append()
else:
    # MESMO nome de lockfile que pedido-novo.sh/pedido-responder.sh/
    # ordem-nova.sh usam (`<arquivo>.lock`) — nome diferente = lock
    # diferente = nenhuma protecao.
    lock_path = path + ".lock"
    lock_fd = os.open(lock_path, os.O_CREAT | os.O_RDWR, 0o644)
    deadline = time.monotonic() + LOCK_TIMEOUT
    try:
        while True:
            try:
                fcntl.flock(lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
                break
            except BlockingIOError:
                if time.monotonic() >= deadline:
                    print(
                        f"RECUSADO: lock de {path} nao liberado em {LOCK_TIMEOUT}s "
                        "(pedido-novo/pedido-responder/ordem-nova escrevendo?) — "
                        "NADA foi escrito",
                        file=sys.stderr,
                    )
                    sys.exit(4)
                time.sleep(0.05)
        do_append()
    finally:
        fcntl.flock(lock_fd, fcntl.LOCK_UN)
        os.close(lock_fd)
PYEOF

echo "OK: append em $CANAL"
echo "$LINE"

# --- roteamento lateral automatico (ITEM 1, reforma de pendencias 2026-08-28) ---
# Roda SEMPRE depois do append acima ter concluido — falha aqui NUNCA pode
# fazer o script sair != 0 (o append ja aconteceu e e o efeito que importa).
# `set +e` local: nenhum comando desta secao deve disparar o `set -e` global.
route_lateral() {
  set +e

  if [[ "$NO_ROTA" -eq 1 || "${CANAL_ROTA_DISABLED:-0}" == "1" ]]; then
    set -e
    return 0
  fi

  ROTA_OUT=$(REGISTRY_LIB_DIR="$SCRIPT_DIR" REGISTRY="$REGISTRY" CLAIMS="$CLAIMS" \
    ROTA_STATE="$ROTA_STATE" CANAL="$CANAL" TEXTO="$TEXTO" PAPEL="$PAPEL" \
    ROTA_FORCE="$ROTA_FORCE" python3 <<'PYEOF'
import hashlib
import json
import os
import re
import sys
import time

sys.path.insert(0, os.environ["REGISTRY_LIB_DIR"])
from registry_lib import mutate, RegistryLockTimeout  # noqa: E402

REGISTRY = os.environ["REGISTRY"]
CLAIMS = os.environ["CLAIMS"]
STATE = os.environ["ROTA_STATE"]
CANAL = os.environ["CANAL"]
TEXTO = os.environ["TEXTO"]
PAPEL = os.environ["PAPEL"]
ROTA_FORCE = os.environ.get("ROTA_FORCE") or ""
COOLDOWN_S = 30 * 60


def safe_load(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


reg = safe_load(REGISTRY) or {}
terminais = reg.get("terminais") or {}
abertos = {p: e for p, e in terminais.items() if e.get("estado") == "aberto"}

candidatos = []  # ordem de deteccao, sem duplicar
vistos = set()


def add_candidato(papel):
    if papel == PAPEL or papel in vistos or papel not in abertos:
        return
    vistos.add(papel)
    candidatos.append(papel)


# (a) mencao direta a papel aberto, fronteira de palavra, nunca o autor.
for papel in sorted(abertos, key=len, reverse=True):
    if re.search(r'\b' + re.escape(papel) + r'\b', TEXTO):
        add_candidato(papel)

# (b) #NNNN (PR, 4+ digitos) -> claims.json: pr -> terminal; sem papel no
# terminal -> scope/frente -> papel do registry que declara essa frente.
claims_doc = safe_load(CLAIMS) or {}
claims = claims_doc.get("claims") or {}
pr_nums = []
for m in re.finditer(r'#(\d{4,})', TEXTO):
    n = int(m.group(1))
    if n not in pr_nums:
        pr_nums.append(n)

if pr_nums and claims:
    papeis_por_len = sorted(abertos, key=len, reverse=True)
    for n in pr_nums:
        for claim in claims.values():
            if claim.get("pr") != n:
                continue
            terminal_txt = str(claim.get("terminal") or "")
            achou = None
            for papel in papeis_por_len:
                if re.search(r'\b' + re.escape(papel) + r'\b', terminal_txt):
                    achou = papel
                    break
            if achou is None:
                frente = claim.get("frente")
                if frente:
                    for papel, e in abertos.items():
                        if e.get("frente") == frente:
                            achou = papel
                            break
            if achou:
                add_candidato(achou)

# --rota: forca destinatario adicional (ainda validado contra o registry).
if ROTA_FORCE:
    add_candidato(ROTA_FORCE)

if not candidatos:
    sys.exit(0)

if len(candidatos) > 3:
    print(f"ROTA_SKIP_BROADCAST\t{len(candidatos)}\t{','.join(candidatos)}")
    sys.exit(0)

# Bootstrap do state file — registry_lib.mutate exige que o arquivo ja
# exista (read-modify-write). O_CREAT|O_EXCL: dois chamadores concorrentes
# tentando criar ao mesmo tempo, so um vence, o outro cai no FileExistsError
# e segue (mesmo padrao de de-claims-sync.sh para o proprio state file).
if not os.path.exists(STATE):
    try:
        fd = os.open(STATE, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o644)
        with os.fdopen(fd, "w") as f:
            json.dump({
                "_schema": (
                    "docs/ai-state/terminais/.roteamento-state.json — dedup/cooldown "
                    "de roteamento lateral (canal-append.sh ITEM 1: chave nudges "
                    "'dest|canal|sig' -> {ts_epoch,ts,canal,destinatario}, cooldown "
                    "30min) e notificacao de bloqueios (bloqueios-notificar.sh ITEM 2: "
                    "chave bloqueios 'tipo:origem:destino' -> {ts_epoch,ts}, cooldown 6h)."
                ),
                "nudges": {},
                "bloqueios": {},
            }, f, ensure_ascii=False, indent=2)
            f.write("\n")
    except FileExistsError:
        pass

sig = hashlib.sha1(TEXTO.strip().lower().encode("utf-8")).hexdigest()[:16]
now = time.time()

for dest in candidatos:
    key = f"{dest}|{CANAL}|{sig}"
    resultado = {}

    def claim_cooldown(state, _key=key, _now=now, _out=resultado):
        nudges = state.setdefault("nudges", {})
        rec = nudges.get(_key)
        if rec and (_now - float(rec.get("ts_epoch", 0))) < COOLDOWN_S:
            _out["send"] = False
            return
        nudges[_key] = {
            "ts_epoch": _now,
            "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(_now)),
            "canal": CANAL,
            "destinatario": dest,
        }
        _out["send"] = True

    try:
        mutate(STATE, claim_cooldown)
    except RegistryLockTimeout:
        # lock preso: nao aposta em enviar sem controle de dedup — pula este
        # destinatario neste ciclo (append ja aconteceu, nada se perde).
        print(f"ROTA_LOCK_PRESO\t{dest}")
        continue

    if resultado.get("send"):
        print(f"ROTA_SEND\t{dest}")
    else:
        print(f"ROTA_DEDUP\t{dest}")
PYEOF
)
  PYRC=$?

  if [[ $PYRC -ne 0 ]]; then
    echo "AVISO: roteamento lateral (deteccao) falhou (rc=$PYRC) — append ja concluido, ignorando" >&2
    set -e
    return 0
  fi

  while IFS=$'\t' read -r TAG A B; do
    [[ -z "$TAG" ]] && continue
    case "$TAG" in
      ROTA_SEND)
        DEST="$A"
        RESUMO="$TEXTO"
        if [[ ${#RESUMO} -gt 200 ]]; then RESUMO="${RESUMO:0:197}..."; fi
        MSG="$RESUMO — ver $CANAL [$TS]"
        SEND_OUT=$("$TERMINAL_SEND_BIN" "$DEST" "$MSG" 2>&1)
        SEND_RC=$?
        if [[ $SEND_RC -ne 0 ]]; then
          printf '[%s] ROTEAMENTO FALHOU dest=%s canal=%s rc=%s :: %s\n' \
            "$TS" "$DEST" "$CANAL" "$SEND_RC" "$(echo "$SEND_OUT" | tr '\n' ' ' | cut -c1-300)" >> "$ROTA_LOG"
          # FALLBACK DE INBOX: nudge que falha vira silencio — foram 12 falhas em
          # 28/08 (tela do destino sem marcador, rc=4) e nenhum destinatario soube.
          # O terminal-send ja usa inbox quando adia por menu; aqui a recusa (qualquer
          # motivo) cai no MESMO lugar, com sinal na sidebar. NAO se usa --force: a
          # checagem de marcador existe justamente porque endereco errado ja causou
          # incidente (D2); o certo e entregar por outro caminho, nao atropelar o guard.
          INBOX_D="$HOME/Claude/docs/ai-state/terminais/inbox-${DEST}"
          mkdir -p "$INBOX_D" 2>/dev/null
          INBOX_F="$INBOX_D/$(date -u +%Y%m%dT%H%M%SZ)-rota-${PAPEL:-desconhecido}.md"
          {
            printf '# nudge nao entregue %s — roteamento lateral\n' "$(date -u +%Y-%m-%dT%H:%MZ)"
            printf 'de: %s · canal: %s · motivo: rc=%s\n\n' "${PAPEL:-desconhecido}" "$CANAL" "$SEND_RC"
            printf '%s\n' "$MSG"
          } > "$INBOX_F" 2>/dev/null
          DEST_UUID=$("${TERMINAL_RESOLVE_BIN:-$SCRIPT_DIR/terminal-resolve.sh}" "$DEST" 2>/dev/null | python3 -c 'import json,sys
try: print(json.load(sys.stdin).get("workspace_uuid_live") or "")
except Exception: print("")' 2>/dev/null)
          if [[ -n "$DEST_UUID" ]]; then
            "$CMUX_BIN" set-status inbox "📥 ${PAPEL:-peer}: nudge na inbox" \
                --workspace "$DEST_UUID" --priority 75 >/dev/null 2>&1 || true
          fi
          printf '[%s] ROTEAMENTO->INBOX dest=%s arquivo=%s\n' "$TS" "$DEST" "$INBOX_F" >> "$ROTA_LOG"
          echo "AVISO: nudge para $DEST nao entregue (rc=$SEND_RC) — gravado em $INBOX_F e sinalizado na sidebar" >&2
        fi
        ;;
      ROTA_SKIP_BROADCAST)
        echo "AVISO: texto cita $A destinatario(s) (>3: $B) — tratado como broadcast, NAO roteado" >&2
        ;;
      ROTA_DEDUP|ROTA_LOCK_PRESO)
        : # sem acao — informativo, nao precisa de stderr
        ;;
    esac
  done <<< "$ROTA_OUT"

  set -e
  return 0
}

route_lateral
