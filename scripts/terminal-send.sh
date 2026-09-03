#!/usr/bin/env bash
# terminal-send.sh — envia mensagem a um papel, lendo a tela do DESTINO.
#
# F0b (docs/workspace/SPEC-metodologia-cockpit-2026-08-28.md §7.3 item 1):
# `--force` foi REMOVIDO — era o vetor do incidente D-064 (28/08): mensagem
# enviada a um terminal com AskUserQuestion aberto virou RESPOSTA a uma
# pergunta do dono. A checagem de MARCADOR (exit 4, "tela nao mostra
# basename/frente/titulo") tambem foi removida: ela recusava mensagem
# legitima e o texto SUMIA (nao ia para lugar nenhum) — 67 recusas/dia
# medidas (ev-harness §8). A UNICA guarda que sobrevive e a de MENU ABERTO:
# nunca pulavel, com retry (a pergunta do dono pode fechar sozinha em
# segundos) e falha REGISTRADA (nunca silenciosa) se continuar aberta.
set -euo pipefail

CMUX_BIN="${CMUX_BIN:-/Applications/cmux.app/Contents/Resources/bin/cmux}"
export CMUX_QUIET=1
T="$HOME/Claude/docs/ai-state/terminais"
REGISTRY="$T/registry.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG="$T/send.log"

usage() {
  cat <<'EOF'
Uso: terminal-send.sh <PAPEL> "<mensagem>"

Resolve o papel (terminal-resolve.sh -> workspace_uuid AO VIVO, nunca
`[selected]`/indice posicional), le a TELA DO DESTINO e recusa enviar
enquanto ela mostrar um menu de decisao aberto (AskUserQuestion/permissao/
selector) — reter-tenta ate 3x em ~60s e so entao falha, registrando em
docs/ai-state/terminais/send.log. Sem essa condicao, envia (send +
send-key enter) e confirma a entrega lendo a tela de novo.

Nao ha flag de bypass: a guarda de menu aberto NAO e pulavel (incidente
D-064, 28/08 — um Enter no lugar errado respondeu pelo dono). Mensagem
maior que TERMINAL_SEND_MAXLEN (default 600) e recusada — escreva o
conteudo em arquivo e mande so o path.
EOF
}

ARGS=()
for a in "$@"; do
  case "$a" in
    --help|-h) usage; exit 0 ;;
    -*)
      echo "RECUSADO: flag desconhecida '$a'. terminal-send.sh nao aceita mais --force" >&2
      echo "(removido em F0b — vetor do incidente D-064; ver SPEC-metodologia-cockpit-2026-08-28.md §7.3.1)." >&2
      exit 2
      ;;
    *) ARGS+=("$a") ;;
  esac
done

if [[ "${#ARGS[@]}" -lt 2 ]]; then usage; exit 2; fi
PAPEL="${ARGS[0]}"
MSG="${ARGS[1]}"

MAXLEN=${TERMINAL_SEND_MAXLEN:-600}
if [[ ${#MSG} -gt $MAXLEN && "${FORCE_LONG:-0}" != "1" ]]; then
  echo "RECUSADO: mensagem com ${#MSG} chars (> $MAXLEN). cmux send trunca texto longo — escreva o conteudo em arquivo (canal-append.sh LOG, PEDIDOS.md ou handoff) e mande so o path. FORCE_LONG=1 ignora." >&2
  exit 5
fi

[[ -f "$REGISTRY" ]] || { echo "registry nao encontrado: $REGISTRY" >&2; exit 1; }

RESOLVE_JSON=$("$SCRIPT_DIR/terminal-resolve.sh" "$PAPEL" 2>/dev/null) || {
  echo "ERRO: $PAPEL nao resolvido (fechado ou nao encontrado)" >&2
  exit 3
}

UUID=$(echo "$RESOLVE_JSON" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("workspace_uuid_live") or d.get("workspace_uuid") or "")')
SESSION_ID_ALVO=$(echo "$RESOLVE_JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("session_id") or "")')

[[ -z "$UUID" ]] && { echo "ERRO: workspace vivo nao encontrado para $PAPEL" >&2; exit 3; }
# Dono 30/08/2026 ("in-messages somente"): sessao Claude -> sessao Claude NAO usa a tela. O canal de tela morre em menu aberto
# (108 recusas/dia, >=187 min de COMANDO inalcancavel) e pode colidir com o dono a digitar (D-064). Entre sessoes Claude o
# transporte e SendMessage ao socket do destino (fila, msg_id, notify_when_idle). A tela fica para scripts sem LLM (tick,
# CLAUDECODE vazio), terminais Codex e o console do dono. Diagnostico: docs/workspace/DIAGNOSTICO-comunicacao-terminais-2026-08-30.md
if [[ -n "${CLAUDECODE:-}" && -z "${TERMINAL_SEND_TELA_OK:-}" ]]; then
  SOCK=$(python3 -c "import json,os,sys
try:
  e=json.load(open(os.path.expanduser('~/Claude/docs/ai-state/terminais/enderecos.json'))).get('$PAPEL')
  s=e and e.get('sock'); print(s if s and os.path.exists(s) else '')
except Exception: print('')" 2>/dev/null)
  if [[ -n "$SOCK" ]]; then
    echo "RECUSADO (canal de tela desligado entre sessoes Claude — dono 30/08): envie com a tool SendMessage(to: \"uds:$SOCK\", message: <=200 chars, ponteiro para artefacto). Codex/console do dono continuam pela tela." >&2
    ORIG=$(python3 -c "import json,os
r=json.load(open(os.path.expanduser('~/Claude/docs/ai-state/terminais/registry.json')))['terminais']; w=os.environ.get('CMUX_WORKSPACE_ID','')
print(next((p for p,t in r.items() if t.get('workspace_uuid')==w),'?'))" 2>/dev/null)
    printf '%s %s-%s from=%s to=%s RECUSADO-TELA-USE-SENDMESSAGE sock=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "${ORIG:-?}" "$(date -u +%Y%m%dT%H%M%SZ)" "${ORIG:-?}" "$PAPEL" "$SOCK" >> "$LOG" 2>/dev/null || true
    exit 6
  fi
fi

# --- GUARDA DE MENU ABERTO (unica guarda que sobrevive a F0b) ---
# Incidente 2026-08-28 (2x): mensagem enviada a um terminal com AskUserQuestion
# aberto virou RESPOSTA a pergunta do dono (D-064 respondida por engano, depois
# anulada). Duas fontes, checadas a cada tentativa: (a) padrao textual na tela
# do DESTINO (regex de menu/selecao) e (b) feed estruturado do cmux (question/
# permission/exit_plan pendente casando workstream_id -> session_id do papel).
# Retry: a pergunta do dono pode ser respondida por ELE nesses segundos — falhar
# na 1a tentativa perderia mensagem legitima por coincidencia de timing. Falha
# APOS os retries e SEMPRE registrada em send.log (nunca silenciosa, nunca vai
# para inbox — inbox foi descontinuada em F0a).
# assinaturas que so' o processo escreve (nunca um humano): base da regra AUTO-SUBMETIDO abaixo
PROPRIO_RE='^(LEMBRETE \(tick/|TAREFA \(tick/|tick/acorda:|POSTO: (calado|fechaste|sem evento)|MUDOU \([0-9]+\)|leia (QUEUE|roadmap/|terminais/))'
# 02/09 (medido no DE-MIG): o TUI renderiza TAMBEM as mensagens antigas do utilizador com "❯ " — a guarda
# antiga (grep de qualquer "❯ texto" na viewport) tomava a ULTIMA mensagem ENTREGUE por "texto por enviar"
# e recusava tudo a seguir: 30 das 43 janelas de recusa comecaram <=15 min depois de um envio nosso bem
# sucedido. A caixa de input viva e' o que fica entre os DOIS ULTIMOS separadores (────) da viewport.
input_box() {
  printf '%s\n' "$1" | python3 -c '
import sys,re
L=sys.stdin.read().split("\n")
sep=[i for i,l in enumerate(L) if re.match(r"^\s*─{10,}",l)]
if len(sep)>=2:
    box=L[sep[-2]+1:sep[-1]]
elif len(sep)==1:
    box=L[max(0,sep[-1]-3):sep[-1]]
else:
    box=[]
out=[]
for l in box:
    l2=re.sub(r"^\s*❯\s?","",l,count=1) if re.match(r"^\s*❯",l) else l
    if l2.strip(): out.append(l2)
print("\n".join(out))
'
}
MENU_RE='Esc to cancel|Enter to (select|confirm|submit)|to select|↑/↓|\(Recommended\)|\(Recomendado\)|❯ *[0-9]+\.|Do you want to|Yes, and don|No, and tell'
MENU_RETRIES="${TERMINAL_SEND_MENU_RETRIES:-3}"
MENU_RETRY_SLEEP_S="${TERMINAL_SEND_MENU_RETRY_SLEEP_S:-20}"

feed_menu_reason() {
  # Imprime uma razao nao-vazia se o feed do cmux mostra question/permission/
  # exit_plan pendente para a sessao do papel; vazio se nao ha ou se o feed
  # estiver indisponivel (fail-open: nao inventa bloqueio por erro de leitura).
  [[ -z "$SESSION_ID_ALVO" ]] && return 0
  CMUX_BIN="$CMUX_BIN" SESSION_ID="$SESSION_ID_ALVO" python3 <<'PYEOF' 2>/dev/null
import json, os, subprocess
sid = os.environ.get("SESSION_ID") or ""
if not sid:
    raise SystemExit(0)
try:
    out = subprocess.run([os.environ["CMUX_BIN"], "rpc", "feed.list", "{}"],
                         capture_output=True, text=True, timeout=8).stdout
    d = json.loads(out)
except Exception:
    raise SystemExit(0)   # feed indisponivel: nao inventa bloqueio
items = d.get("items", d if isinstance(d, list) else [])
for i in items:
    if i.get("kind") not in ("question", "permission", "exit_plan"):
        continue
    if i.get("resolved_at") or i.get("status") in ("expired", "resolved", "answered"):
        continue
    ws = str(i.get("workstream_id") or i.get("request_id") or "")
    if sid and sid in ws:
        print(f'feed:{i.get("kind")}:{str(i.get("title") or "")[:40]}')
        break
PYEOF
}

RAZAO=""
TENTATIVA=1
while [[ "$TENTATIVA" -le "$MENU_RETRIES" ]]; do
  # 02/09 (medido pelo RESUMO a pedido do dono): `--lines N` IMPLICA `--scrollback` (help do cmux),
  # logo esta leitura via HISTORICO, nao a tela viva — uma linha de prompt renderizada ha horas fazia a
  # guarda recusar o envio a um terminal com o prompt VAZIO. Caso apanhado: DE-DATA as 16:21 com texto no
  # scrollback e viewport limpa. A guarda passa a decidir pela VIEWPORT (sem --lines); o scrollback fica
  # so' para o menu, onde historico nao induz falso positivo do mesmo modo.
  SCREEN=$("$CMUX_BIN" read-screen --workspace "$UUID" 2>/dev/null || true)
  SCREEN_HIST=$("$CMUX_BIN" read-screen --workspace "$UUID" --lines 15 2>/dev/null || true)
  RAZAO=""
  if echo "$SCREEN_HIST" | grep -qE "$MENU_RE"; then
    RAZAO="tela:menu-visivel"
  elif [[ -n "$(input_box "$SCREEN")" ]]; then
    # 02/09 19:0xZ (medido no DE-MIG, a pedido do dono — "nao tem nada meu, e' falso positivo"): a caixa VAZIA
    # do TUI mostra um texto FANTASMA (sugestao/historico) que o read-screen devolve igual a texto digitado.
    # Prova por efeito: escrever 1 char deu caixa=[~] (o fantasma sumiu), apagar devolveu o fantasma; Enter
    # na caixa "com texto" nao fez nada. Logo "texto na caixa" NAO e' prova de rascunho. Discrimina-se pelo
    # mesmo efeito, antes de decidir: escreve-se uma sonda e le-se a caixa —
    #   caixa == sonda            -> era fantasma (ou vazia): apaga a sonda e SEGUE
    #   caixa == rascunho + sonda -> rascunho REAL de alguem: apaga a sonda e RECUSA (D-064)
    #   sonda nao aparece         -> a pane nao aceita input: RECUSA com razao propria (inalcancavel de facto)
    SONDA='~'
    "$CMUX_BIN" send --workspace "$UUID" "$SONDA" >/dev/null 2>&1; sleep 0.7
    BOX_S=$(input_box "$("$CMUX_BIN" read-screen --workspace "$UUID" 2>/dev/null || true)")
    if [[ "$BOX_S" == "$SONDA" ]]; then
      "$CMUX_BIN" send-key --workspace "$UUID" backspace >/dev/null 2>&1; sleep 0.3
      printf '%s FANTASMA-NO-PROMPT papel=%s uuid=%s texto=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$PAPEL" "$UUID" "$(input_box "$SCREEN" | head -1 | cut -c1-50 | tr ' ' '_')" >> "$LOG"
      RAZAO=""
    elif [[ "$BOX_S" == *"$SONDA" ]]; then
      "$CMUX_BIN" send-key --workspace "$UUID" backspace >/dev/null 2>&1
      RAZAO="tela:texto-por-enviar-no-prompt"
    else
      RAZAO="tela:pane-nao-aceita-input"
    fi
  fi
  if [[ "$RAZAO" == "tela:texto-por-enviar-no-prompt" ]]; then
    # 01/09 17:3xZ (RESUMO): a regra "input parcial (❯ com texto) = não enviar" vivia só na memória, não no
    # código. Medido: FUNIL com "❯ roda o sync manualmente…" (texto do DONO, sem Enter) e o vigia a 1 min de
    # lhe escrever — `cmux send` colaria o aviso ao texto dele e o `send-key enter` submeteria os dois como
    # UM comando. É o D-064 pelo outro lado. Prompt com texto = tela ocupada pelo dono; sem bypass.
    RAZAO="tela:texto-por-enviar-no-prompt"
    # 02/09 (auditoria do RESUMO, dono): 18,4 h-terminal sem canal em 2 dias, 30 de 43 janelas de recusa
    # comecaram <=15 min depois de um envio NOSSO — o `send-key enter` nao submeteu, o texto do tick ficou
    # no prompt, e a partir dai esta mesma guarda recusou TODOS os envios seguintes (DE-MIG: 27 recusas em
    # 4,7 h com a TAREFA do empurra presa; CR-6446 oferecida e desfeita 33x). O tick trancava-se a si proprio.
    # Regra: se TODAS as linhas da caixa de input sao assinatura do processo (nada que um humano escreva),
    # submeter e' terminar a entrega anterior, nao responder por ninguem — D-064 nao se aplica.
    INPUT_BOX=$(input_box "$SCREEN")
    if [[ -n "$INPUT_BOX" ]] && ! printf '%s\n' "$INPUT_BOX" | grep -vE '^[[:space:]]*$' | grep -qvE "$PROPRIO_RE"; then
      "$CMUX_BIN" send-key --workspace "$UUID" enter; sleep 1
      SCREEN2=$("$CMUX_BIN" read-screen --workspace "$UUID" 2>/dev/null || true)
      if [[ -z "$(input_box "$SCREEN2")" ]]; then
        printf '%s AUTO-SUBMETIDO papel=%s uuid=%s texto-proprio-preso=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$PAPEL" "$UUID" "$(printf '%s' "$INPUT_BOX" | head -1 | cut -c1-60 | tr ' ' '_')" >> "$LOG"
        RAZAO=""
      fi
    fi
  fi
  if [[ -z "$RAZAO" ]]; then
    FEED_HIT="$(feed_menu_reason || true)"
    [[ -n "$FEED_HIT" ]] && RAZAO="$FEED_HIT"
  fi
  [[ -z "$RAZAO" ]] && break
  if [[ "$TENTATIVA" -lt "$MENU_RETRIES" ]]; then
    sleep "$MENU_RETRY_SLEEP_S"
  fi
  TENTATIVA=$((TENTATIVA + 1))
done

if [[ -n "$RAZAO" ]]; then
  mkdir -p "$T"
  printf '%s FALHA-MENU-ABERTO papel=%s uuid=%s razao=%s tentativas=%s\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$PAPEL" "$UUID" "$RAZAO" "$MENU_RETRIES" >> "$LOG"
  # 02/09: a recusa era silenciosa e sem prazo — DE-MIG ficou 14 h sem canal e ninguem soube. Deriva-se do
  # proprio send.log a lista de terminais com >=3 recusas seguidas; o cockpit e o diag leem o ficheiro.
  bash "$SCRIPT_DIR/inalcancaveis-derive.sh" "$LOG" "$T/INALCANCAVEIS.md" 2>/dev/null || true
  # 03/09 00:1xZ (medido: D-205 apresentada ao dono como MENU no DECISAO desde 23:40Z; 4 ticks a recusar por
  # menu-visivel e o aviso ao dono dizia "inalcancavel" — o certo e' "tens uma pergunta ABERTA na tela do X").
  if [[ "$RAZAO" == "tela:menu-visivel" ]]; then
    case "$PAPEL" in COMANDO|DECISAO|RESUMO)
      bash "$SCRIPT_DIR/notify-dono.sh" "menu-aberto:$PAPEL" "$PAPEL tem uma pergunta ABERTA na tua tela (menu de decisao) a espera da tua resposta — o processo nao lhe fala ate responderes" >/dev/null 2>&1 || true ;;
    esac
  fi
  [[ "$RAZAO" == "tela:pane-nao-aceita-input" ]] && bash "$SCRIPT_DIR/notify-dono.sh" "pane-morta:$PAPEL" "$PAPEL nao aceita input (sonda nao apareceu na caixa) — terminal inalcancavel de facto; ver INALCANCAVEIS.md" >/dev/null 2>&1 || true
  echo "RECUSADO: $PAPEL continua com MENU DE DECISAO aberto ou TEXTO POR ENVIAR no prompt apos $MENU_RETRIES tentativas ($RAZAO)." >&2
  echo "Enviar agora faria seu texto virar a RESPOSTA dessa pergunta — ja aconteceu 2x em 28/08" >&2
  echo "(D-064 foi respondida por engano e precisou ser anulada). Esta guarda NAO tem bypass." >&2
  echo "Espere o dono responder e reenvie; falha registrada em $LOG." >&2
  exit 5
fi

"$CMUX_BIN" send --workspace "$UUID" "$MSG"
# 02/09: enter imediato depois de um paste longo era engolido pelo TUI e o texto ficava no prompt
# (medido: 76 de 244 envios "OK" de hoje nunca chegaram como mensagem ao destino). Pausa curta antes do enter.
sleep "${SEND_ENTER_DELAY_S:-0.5}"
"$CMUX_BIN" send-key --workspace "$UUID" enter

# CONFIRMACAO DE ENTREGA — o script confirma, o chamador nao improvisa.
# Sem isto cada terminal inventava a propria verificacao com `read-screen`, e em
# 28/08 um deles: (a) endereçou por `workspace:1` (indice posicional — se alguem
# reordena as janelas, le a tela de OUTRO terminal e conclui "entregue"),
# (b) leu "Press up to edit queued messages" como prova de recebimento (essa linha
# diz que ha algo na fila de input, nao que a SUA mensagem esta la), e
# (c) afirmou "sem menu aberto, nada foi respondido por engano" tendo olhado 6
# linhas do fim da tela. Tres inferencias frageis empilhadas para declarar sucesso.
sleep 2
CONFIRMA=""
# 02/09: a confirmacao antiga ("texto visivel na tela") era VERDADEIRA no modo de falha — o texto preso no
# prompt e' visivel. Submissao prova-se pelo contrario: a linha do prompt ficou VAZIA. Se ainda tem a
# nossa amostra, o enter foi engolido: repete-se UMA vez (e' o nosso texto, nao o de ninguem) e re-mede.
AMOSTRA=$(printf '%s' "$MSG" | tr -s ' ' | cut -c1-40)
VIEW=$("$CMUX_BIN" read-screen --workspace "$UUID" 2>/dev/null || true)
PROMPT_LINE=$(input_box "$VIEW")
if [[ -n "$AMOSTRA" ]] && printf '%s' "$PROMPT_LINE" | grep -qF -- "$(printf '%s' "$AMOSTRA" | cut -c1-25)"; then
  "$CMUX_BIN" send-key --workspace "$UUID" enter; sleep 1.5
  VIEW=$("$CMUX_BIN" read-screen --workspace "$UUID" 2>/dev/null || true)
  PROMPT_LINE=$(input_box "$VIEW")
fi
if [[ -n "$AMOSTRA" ]] && printf '%s' "$PROMPT_LINE" | grep -qF -- "$(printf '%s' "$AMOSTRA" | cut -c1-25)"; then
  CONFIRMA="PRESO-NO-PROMPT: enter nao submeteu (2 tentativas) — o destino NAO recebeu; texto do tick ficou no input"
elif printf '%s' "$VIEW" | grep -qF -- "$AMOSTRA"; then
  CONFIRMA="submetido: prompt vazio e texto na conversa do destino"
elif printf '%s' "$VIEW" | grep -qiE "queued messages|esc to interrupt|working|thinking"; then
  CONFIRMA="ENFILEIRADO: destino ocupado; prompt vazio (entra quando o turno acabar)"
else
  CONFIRMA="NAO CONFIRMADO: prompt vazio mas texto nao visivel em 2s"
fi

# Quem MANDOU, nao so quem recebeu. Sem isso o log responde "o papel X foi
# avisado?" mas nao "quem pediu o que a quem, e quanto tempo esperou" — as
# perguntas que faltavam na auditoria de 27/08. $CMUX_WORKSPACE_ID e injetado
# pelo cmux em cada pane; vira papel pelo registry.
ORIGEM=$(REGISTRY_LIB_DIR="$SCRIPT_DIR" python3 - "$REGISTRY" "${CMUX_WORKSPACE_ID:-}" <<'PYEOF'
import os, sys
sys.path.insert(0, os.environ["REGISTRY_LIB_DIR"])
from registry_lib import load
registry_path, ws = sys.argv[1], sys.argv[2]
if not ws:
    print("externo"); raise SystemExit(0)
try:
    for papel, e in (load(registry_path).get("terminais") or {}).items():
        if e.get("workspace_uuid") == ws:
            print(papel); raise SystemExit(0)
except SystemExit:
    raise
except Exception:
    pass
print(f"nao-registrado:{ws[:8]}")
PYEOF
)
MSG_ID="${ORIGEM}-$(date -u +%Y%m%dT%H%M%SZ)-$$"

mkdir -p "$T"
printf '%s %s from=%s to=%s uuid=%s confirma=%s :: %s\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$MSG_ID" "$ORIGEM" "$PAPEL" "$UUID" "${CONFIRMA%%:*}" "$MSG" >> "$LOG"
bash "$SCRIPT_DIR/inalcancaveis-derive.sh" "$LOG" "$T/INALCANCAVEIS.md" 2>/dev/null || true   # 03/09: sucesso tambem re-deriva (entrada velha sai)
echo "OK: mensagem enviada para $PAPEL ($UUID) [msg_id=$MSG_ID]"
echo "     $CONFIRMA"
