#!/bin/bash
# bash-guards.sh — PreToolUse(Bash): bloqueia padroes CLI perigosos + protecao de branch.
# BLOCKING (exit 2). Le payload JSON do stdin (tool_input.command).
# Consolidado 2026-06-11: absorve branch-guard.sh (protecao main/master/develop).
# Bypass: BASH_GUARDS_DISABLED=1
# Compat macOS: usa grep -E (BSD nao tem -P).
#
# Anti-falso-positivo (fix 2026-08-27, gotcha reportado por DE-COORD): os checks
# textuais abaixo rodam sobre $NORM (comando sem corpos de heredoc e sem
# comentarios `# ...` fora de aspas — ver lib/bash-cmd-normalize.py), nao sobre
# o $CMD cru. Sem isso, escrever documentacao via heredoc que MENCIONA um
# padrao perigoso (`cat > doc.md <<'EOF' ... git push --force ... EOF`) era
# bloqueado como se fosse execucao. git-push-force e pkill/killall, alem disso,
# exigem POSICAO DE COMANDO (via bash-cmd-normalize.py check) — nao basta a
# substring aparecer em qualquer lugar (`echo 'git push --force'` documentando
# o comando, por exemplo, nao deve bloquear).
#
# Fecho de indirecao (fix 2026-08-27, 2a rodada — incidente #6340, portado de
# ~/Claude/.codex/hooks/de-parity-guard.py): o comando Bash top-level pode
# esconder o padrao proibido dentro de um SCRIPT (`bash /tmp/x.sh`, `sh`,
# `. arquivo`, `source arquivo`) ou atras de `env VAR=1 <cmd>`/`VAR=1 <cmd>`
# (com ou sem "env"), `xargs <cmd>` ou `eval "<cmd literal>"`. guards-info
# agora roda os 3 checks (git-push-force, pkill, railway-kv) de forma
# RECURSIVA (rule_matches_recursive em bash-cmd-normalize.py): top-level +
# conteudo de scripts referenciados, ate profundidade 2, sem repetir path,
# fail-open se o arquivo nao existir/nao puder ser lido. `eval "$VAR"`
# (variavel, nao literal) e `bash -c "<literal>"` continuam FORA do alcance
# de um guard textual — ver docstring do lib compartilhado.
#
# cmux send/new-workspace cru (fix 2026-08-28, auditoria terminais 48h — achado
# 2: 15 `cmux send` crus bypassando terminal-send.sh, 8 do proprio DE-COORD):
# bloqueia SO comando top-level (nao recursivo — os scripts da factory chamam
# `$CMUX_BIN send` internamente, que nao e o literal "cmux" e nao casaria de
# qualquer forma). Bypass: CMUX_RAW_ALLOWED=1.
#
# A1 — achado CRITICO pre-existente (auditoria adversarial 2026-08-28, fora da
# reforma de pendencias): 6 regras ("vercel --prod", "--no-verify", "git rebase
# -i", "git checkout -- .", "git restore .", "git clean -f") ainda eram
# `[[ "$NORM" == *"..."* ]]` — substring cru, sem posicao-de-comando. Qualquer
# MENCAO textual bloqueava como execucao (`echo 'nunca rodar vercel --prod
# direto'`, `git commit -m "explica que git checkout -- . e perigoso"`,
# `echo 'proibido: git rebase -i'`) — a promessa do header (linha 14-16) nao
# valia pra essas 6. Migradas para RULES/rule_matches_recursive em
# lib/bash-cmd-normalize.py (mesmo mecanismo do git-push-force/pkill/
# railway-kv acima — ver comentario "vercel-prod"/"no-verify"/etc no RULES
# dict la). Os 6 blocks abaixo agora leem VERCEL_PROD_HIT..GIT_CLEAN_F_HIT
# (linhas 7-12 de guards-info) em vez de `case "$NORM" in *"..."* )`.

set -uo pipefail
[ "${BASH_GUARDS_DISABLED:-0}" = "1" ] && exit 0

SDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB="$SDIR/lib/bash-cmd-normalize.py"

INPUT="$(cat)"
CMD="$(printf '%s' "$INPUT" | python3 -c 'import json,sys
try:
    d=json.load(sys.stdin); print(d.get("tool_input",{}).get("command",""))
except Exception:
    print("")' 2>/dev/null)"
[ -z "$CMD" ] && exit 0

# 03/09 (incidente: `git checkout -- claims.json` apagou 14 h de claims de varias sessoes; diagnostico §7/§13 A4, ordem do
# dono): estado partilhado VIVO em docs/ai-state nunca se repoe por git a partir de uma sessao — o commit e' sempre mais velho
# do que as escritas dos outros. Recuperacao deliberada leva bypass explicito: AI_STATE_GIT_OK=1.
# Controlo negativo medido no proprio lote: a mensagem de commit que DESCREVE a guarda disparou-a — por isso as strings entre
# aspas sao removidas e o verbo git tem de estar em posicao de comando (inicio, `;`, `&&`, `|`, `$(`).
if [ -z "${AI_STATE_GIT_OK:-}" ] && AI_CMD="$CMD" python3 - <<'PYAI'
import os, re, sys
c = os.environ.get("AI_CMD", "")
c = re.sub(r'"(?:\\.|[^"\\])*"|\'[^\']*\'', "", c, flags=re.S)          # fora com o que esta entre aspas (mensagens, notas)
verbo = re.search(r"(?:^|[;&|(]|\$\()\s*git\s+(?:-C\s+\S+\s+)?(checkout|restore|reset\s+--hard)\b", c, re.M)
alvo = re.search(r"docs/ai-state|claims\.json|results\.jsonl|decisoes\.json|fila-[a-z]+\.jsonl", c)
sys.exit(0 if (verbo and alvo) else 1)
PYAI
then
  echo "BLOCKED: git checkout/restore/reset sobre docs/ai-state (estado partilhado VIVO). O commit e' mais velho do que as escritas das outras sessoes — repor por git apaga-as (claims.json, 02/09: 14 h perdidas). Para desfazer a TUA escrita, edita o ficheiro; para recuperacao deliberada: AI_STATE_GIT_OK=1." >&2
  exit 2
fi

# guards-info: 1 unico spawn python3 devolve (linha1) NORM em base64,
# (linha2) 1/0 "git push --force*" em posicao de comando, (linha3) idem
# pkill/killall, (linha4) idem "railway variables --kv". Cada flag JA inclui
# o scan recursivo (fix 2026-08-27, incidente #6340) de scripts referenciados
# via bash/sh/zsh/dash/ksh/source/. (ate profundidade 2) — por isso passamos
# o $INPUT (JSON completo, com cwd para resolver script relativo), nao so o
# $CMD ja extraido. Falha do python (crash/ausencia) -> fail-open: NORM cai
# para o CMD cru (comportamento pre-fix) e os tres flags ficam 0.
GINFO="$(printf '%s' "$INPUT" | python3 "$LIB" guards-info 2>/dev/null)"
NORM_B64="$(printf '%s' "$GINFO" | sed -n '1p')"
FORCE_PUSH_HIT="$(printf '%s' "$GINFO" | sed -n '2p')"
PKILL_HIT="$(printf '%s' "$GINFO" | sed -n '3p')"
RAILWAY_KV_HIT="$(printf '%s' "$GINFO" | sed -n '4p')"
CMUX_SEND_HIT="$(printf '%s' "$GINFO" | sed -n '5p')"
WS_IDX_HIT="$(printf '%s' "$GINFO" | sed -n '13p')"
CMUX_NEWWS_HIT="$(printf '%s' "$GINFO" | sed -n '6p')"
VERCEL_PROD_HIT="$(printf '%s' "$GINFO" | sed -n '7p')"
NO_VERIFY_HIT="$(printf '%s' "$GINFO" | sed -n '8p')"
GIT_REBASE_I_HIT="$(printf '%s' "$GINFO" | sed -n '9p')"
GIT_CHECKOUT_DOT_HIT="$(printf '%s' "$GINFO" | sed -n '10p')"
GIT_RESTORE_DOT_HIT="$(printf '%s' "$GINFO" | sed -n '11p')"
GIT_CLEAN_F_HIT="$(printf '%s' "$GINFO" | sed -n '12p')"
NORM="$(printf '%s' "$NORM_B64" | base64 -d 2>/dev/null)"
[ -z "$NORM" ] && NORM="$CMD"
[ "$FORCE_PUSH_HIT" = "1" ] || FORCE_PUSH_HIT="0"
[ "$PKILL_HIT" = "1" ] || PKILL_HIT="0"
[ "$RAILWAY_KV_HIT" = "1" ] || RAILWAY_KV_HIT="0"
[ "$CMUX_SEND_HIT" = "1" ] || CMUX_SEND_HIT="0"
[ "$WS_IDX_HIT" = "1" ] || WS_IDX_HIT="0"
[ "$CMUX_NEWWS_HIT" = "1" ] || CMUX_NEWWS_HIT="0"
[ "$VERCEL_PROD_HIT" = "1" ] || VERCEL_PROD_HIT="0"
[ "$NO_VERIFY_HIT" = "1" ] || NO_VERIFY_HIT="0"
[ "$GIT_REBASE_I_HIT" = "1" ] || GIT_REBASE_I_HIT="0"
[ "$GIT_CHECKOUT_DOT_HIT" = "1" ] || GIT_CHECKOUT_DOT_HIT="0"
[ "$GIT_RESTORE_DOT_HIT" = "1" ] || GIT_RESTORE_DOT_HIT="0"
[ "$GIT_CLEAN_F_HIT" = "1" ] || GIT_CLEAN_F_HIT="0"

block() { echo "BLOCKED: $1" >&2; exit 2; }

# Resolve o PAPEL do chamador ($CMUX_WORKSPACE_ID -> registry.json) so quando
# necessario (bloqueio de cmux cru) — usado so para o log de auditoria do
# conduta-check.sh (M7), nunca para decidir se bloqueia. Falha/ausencia ->
# "desconhecido", nunca aborta o guard.
GUARD_BLOCK_LOG="$HOME/Claude/docs/ai-state/terminais/guard-blocks.log"
log_guard_block() {
  local regra="$1"
  local papel="desconhecido"
  local registry="$HOME/Claude/docs/ai-state/terminais/registry.json"
  if [ -n "${CMUX_WORKSPACE_ID:-}" ] && [ -f "$registry" ]; then
    papel="$(REGISTRY_LIB_DIR="$SDIR/../scripts" REGISTRY="$registry" WS="$CMUX_WORKSPACE_ID" python3 -c '
import os, sys
sys.path.insert(0, os.environ["REGISTRY_LIB_DIR"])
try:
    from registry_lib import load
    reg = load(os.environ["REGISTRY"])
except Exception:
    print("desconhecido"); raise SystemExit(0)
ws = os.environ["WS"]
for p, e in (reg.get("terminais") or {}).items():
    if e.get("workspace_uuid") == ws:
        print(p); raise SystemExit(0)
print("desconhecido")
' 2>/dev/null)"
    [ -z "$papel" ] && papel="desconhecido"
  fi
  mkdir -p "$(dirname "$GUARD_BLOCK_LOG")" 2>/dev/null
  printf '%s %s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$papel" "$regra" >> "$GUARD_BLOCK_LOG" 2>/dev/null || true
}

# --- gusman-os ask: NUNCA tocar o Data Engine direto (defense-in-depth) ---
# So dispara quando GUSMAN_OS_ASK_CONTEXT=1 (setado SO no spawn do ask do WhatsApp pelo kernel).
# O terminal normal do dono (sem o marcador) NAO e afetado — pode usar railway/psql no DE a vontade.
# Razao: o ask roda em bypassPermissions com cwd=~/Claude, cujo corpus ENSINA o caminho proibido
# (railway run psql $DATABASE_URL); o dado do DE deve vir SO do proxy local http://127.0.0.1:4577/de/data/.
if [ "${GUSMAN_OS_ASK_CONTEXT:-0}" = "1" ]; then
  case "$NORM" in
    *raiz-data-engine*) block "ask-context: acesso direto ao repo do Data Engine proibido. Use o proxy local: curl http://127.0.0.1:4577/de/data/<path> (rule: nunca mexer no DE direto)." ;;
    *"railway "*) block "ask-context: railway (run/ssh/connect) no DE proibido. Dados do DE so via proxy local /de/data." ;;
  esac
  printf '%s' "$NORM" | grep -qE '(^|[^A-Za-z_])psql([^A-Za-z0-9_]|$)' && block "ask-context: psql direto proibido. Dados do DE so via proxy local http://127.0.0.1:4577/de/data/."
  printf '%s' "$NORM" | grep -q 'DATABASE_URL' && block "ask-context: DATABASE_URL proibido. Dados do DE so via proxy local /de/data."
  # Escrita no Zeev SO pelo caminho deterministico (aprovar #X → confirma). O -p nunca toca a API do
  # Zeev direto (impersonation = pode aprovar qualquer um). Bloqueia host/token/impersonate/PUT.
  printf '%s' "$NORM" | grep -qiE 'zeev\.it|/api/2/(tokens/impersonate|assignments)|ZEEV_SERVICE_TOKEN' && block "ask-context: API do Zeev proibida aqui. Aprovacao so pelo comando 'aprovar #X' (maker-checker)."
  # Leitura de segredos no sandbox (a chave/PEM do DE, .env): so o daemon usa; o -p nao precisa.
  printf '%s' "$NORM" | grep -qiE 'secrets/|private-key|\.pem([^A-Za-z0-9]|$)' && block "ask-context: leitura de segredos proibida. Dados/escrita via proxy ou comando dedicado."
fi

# --- Operacoes destrutivas / bypass de pipeline ---
# fix 2026-08-28 (A1): os 6 checks abaixo eram substring cru sobre $NORM
# (`[[ "$NORM" == *"..."* ]]`) — migrados para as flags calculadas em
# guards-info (posicao-de-comando, via RULES em lib/bash-cmd-normalize.py).
[ "$VERCEL_PROD_HIT" = "1" ] && block "Use CI/CD pipeline em vez de vercel --prod direto (rule deploy-routing)."
[ "$FORCE_PUSH_HIT" = "1" ] && block "Force push e perigoso. Use --force-with-lease apenas com aprovacao explicita."
[ "$RAILWAY_KV_HIT" = "1" ] && block "railway variables --kv vaza secrets em texto puro no output/transcript. Use 'railway variables --json | jq keys' se precisar so dos nomes."
[ "$NO_VERIFY_HIT" = "1" ] && block "--no-verify pula hooks de seguranca."
[ "$GIT_REBASE_I_HIT" = "1" ] && block "git rebase -i e interativo (nao suportado) e destrutivo. Use merge."
[ "$GIT_CHECKOUT_DOT_HIT" = "1" ] && block "git checkout -- . descarta TODAS as mudancas unstaged. Commit primeiro."
[ "$GIT_RESTORE_DOT_HIT" = "1" ] && block "git restore . descarta mudancas. Commit ou branch primeiro."
[ "$GIT_CLEAN_F_HIT" = "1" ] && block "git clean -f apaga permanentemente arquivos untracked."

# --- pkill/killall: 4 incidentes de agents matando processo alheio (daemon de producao 2x, pytest de reviewer) ---
# Matar processo: SEMPRE por PID explicito capturado no proprio spawn ($!). Bypass: PKILL_GUARD_DISABLED=1
if [ "${PKILL_GUARD_DISABLED:-0}" != "1" ]; then
  [ "$PKILL_HIT" = "1" ] && block "pkill/killall proibido (4 incidentes: matou daemon de producao/processo de outra sessao). Mate SO por PID explicito capturado no proprio spawn (kill \$PID). Bypass pontual: PKILL_GUARD_DISABLED=1."
fi

# --- cmux send/new-workspace cru: 15 sends crus em 48h bypassando marcador de
# destino + log de terminal-send.sh (auditoria 2026-08-28, achado 2). Bypass: CMUX_RAW_ALLOWED=1
if [ "${CMUX_RAW_ALLOWED:-0}" != "1" ]; then
  if [ "$WS_IDX_HIT" = "1" ] && [ "${CMUX_RAW_ALLOWED:-0}" != "1" ]; then
  cat >&2 <<'EOF'
BLOQUEADO: --workspace com INDICE posicional (workspace:N ou N).
Identidade de terminal e por UUID, sempre. Indice muda a cada reordenacao —
em 28/08 um terminal usou `--workspace workspace:1` para CONFIRMAR entrega de
mensagem ao COMANDO: acertou por coincidencia, mas a mesma linha amanha le a
tela de OUTRO terminal e conclui "entregue". E o incidente do destino errado
na versao verificacao, que e pior: da falso positivo em vez de erro visivel.
Use:  ~/.claude/scripts/terminal-resolve.sh <PAPEL>   (imprime o UUID)
      ~/.claude/scripts/terminal-send.sh <PAPEL> "<msg>"  (ja confirma a entrega)
Bypass consciente: CMUX_RAW_ALLOWED=1
EOF
  exit 2
fi

if [ "$CMUX_SEND_HIT" = "1" ]; then
    log_guard_block "cmux-send-cru"
    block "use ~/Claude/.claude/scripts/terminal-send.sh <PAPEL> \"<msg>\" em vez de 'cmux send' cru — o script checa marcador de destino/input pendente e loga em send.log (auditoria: 15 sends crus em 48h, 8 do proprio DE-COORD). Bypass consciente: CMUX_RAW_ALLOWED=1"
  fi
  if [ "$CMUX_NEWWS_HIT" = "1" ]; then
    log_guard_block "cmux-new-workspace-cru"
    block "use ~/Claude/.claude/scripts/terminal-open.sh <PAPEL> em vez de 'cmux new-workspace' cru — respeita o teto de 15 sessoes e o registry (sem isso o papel abre sem entrar no registry.json). Bypass consciente: CMUX_RAW_ALLOWED=1"
  fi
fi

# --- Protecao de branch (ex-branch-guard.sh) ---
if [[ "$NORM" == *"git commit"* ]]; then
  # Resolve o diretorio-alvo: se o comando comeca com `cd <dir> && ...`,
  # a branch a checar e a do worktree/repo de destino, nao a do CWD do hook
  # (que e o CWD da sessao — tipicamente ~/Claude em main). Sem isto, commit
  # em worktree feature e bloqueado por falso-positivo de "main".
  TARGET_DIR="."
  if printf '%s' "$NORM" | grep -qE '^[[:space:]]*cd[[:space:]]'; then
    TARGET_DIR=$(printf '%s' "$NORM" | sed -E 's/^[[:space:]]*cd[[:space:]]+//; s/[[:space:]]*(&&|;).*//' | tr -d "\"'")
    [ -z "$TARGET_DIR" ] && TARGET_DIR="."
  fi
  BRANCH=$(git -C "$TARGET_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
  case "$BRANCH" in
    main|master|develop)
      # Excecao unica: commit inicial em repo sem historico (baseline)
      if git rev-parse HEAD >/dev/null 2>&1; then
        block "Commit em '$BRANCH' proibido. Crie feature branch: git checkout -b feat/nome"
      fi ;;
  esac
fi
# Push explicito para ref protegida (nao casa branches tipo feat/main-page)
if printf '%s' "$NORM" | grep -qE 'git push.*(origin|upstream)[[:space:]]+(main|master|develop)([[:space:]]|$|:)'; then
  block "Push direto em branch protegida. Use PR: gh pr create"
fi

# --- SQL Safety (TOTVS RM multi-tenant) ---
if printf '%s' "$NORM" | grep -qiE 'SELECT[[:space:]]+\*[[:space:]]+FROM[[:space:]]+(PFUNC|SMATRICULA|SMATRICPL|SHABILITACAOALUNO|PPESSOA|SPARCELA|FLAN)([^A-Z0-9_]|$)'; then
  block "SELECT * em tabela TOTVS grande (PFUNC tem 680 cols). Especifique colunas; consulte schema.json."
fi
if printf '%s' "$NORM" | grep -qiE 'FROM[[:space:]]+(PFUNC|SMATRICULA|SMATRICPL|SPARCELA|FLAN|SHABILITACAOALUNO|PFHSTAFT)([^A-Z0-9_]|$)' && \
   ! printf '%s' "$NORM" | grep -qi 'CODCOLIGADA'; then
  block "Query em tabela TOTVS multi-tenant sem filtro CODCOLIGADA. Adicione WHERE CODCOLIGADA = N."
fi

# --- Warning nao-bloqueante ---
if [[ "$NORM" == *"git stash"* && "$NORM" != *"git stash list"* && "$NORM" != *"git stash show"* && "$NORM" != *"git stash pop"* ]]; then
  echo "WARNING: git stash pode perder trabalho. Prefira WIP commit." >&2
fi

# pbcopy/pbpaste entre terminais: nao ha como o cmux/hook verificar QUEM le o
# clipboard do lado de la (nao e canal auditavel) — so aviso, nunca bloqueio.
if printf '%s' "$NORM" | grep -qE '(^|[;&|[:space:]])pb(copy|paste)([[:space:]]|$)'; then
  echo "WARNING: pbcopy/pbpaste nao e canal auditavel entre terminais do cockpit — texto entre papeis vai por terminal-send.sh (curto) ou arquivo (ALERTAS/PEDIDOS/ORDENS/handoff, longo)." >&2
fi

exit 0
