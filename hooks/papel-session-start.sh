#!/bin/bash
# papel-session-start.sh — SessionStart: se a sessao resolve para um PAPEL do
# cockpit de terminais ($CMUX_WORKSPACE_ID -> registry.json), anuncia ONLINE
# no canal ALERTAS, marca heartbeat (se o papel declara um) e imprime no
# stdout (vira contexto da sessao) o contrato do papel em ~10 linhas: Missao
# + Regras que nunca quebra + link para CONDUTA.md.
#
# Cura achado 3 da auditoria 48h (2026-08-28): 9/13 papeis abriram sem
# anunciar ONLINE, e a causa dominante era "regra conhecida mas sem
# mecanismo" — o papel nunca CHEGA a ler papeis/<PAPEL>.md por conta propria.
# Este hook injeta o contrato automaticamente no boot da sessao.
#
# Sessao sem papel registrado (terminal ad-hoc, nao-cockpit) -> silencioso,
# exit 0, sem side effect.
#
# Fix 2026-08-28 (A2, auditoria adversarial): SessionStart dispara em TODO
# `source` (startup|resume|compact|clear), nao so na abertura real da
# sessao — sem filtro, 4 disparos (startup+resume+compact+clear) geravam 4
# ONLINE identicos, e sessoes long-lived (resume/compact o dia inteiro)
# nunca redisparavam startup, entao CONDUTA-SCORE lia "ONLINE: NAO" mesmo
# com o papel vivo. Duas mitigacoes independentes:
#   (a) so tenta anunciar quando `source` in {startup, clear} (sessao nova
#       de fato); em resume/compact PULA o append, mas mantem (b) heartbeat
#       e (c) contrato — a sessao ainda precisa desse contexto.
#   (b) dedup por (papel, dia): mesmo em startup/clear, so apenda se ainda
#       nao houve ONLINE deste papel HOJE (estado em
#       .papel-online-state/<PAPEL>.json, carimbado em UTC).
# Override PAPEL_ONLINE_FORCE=1 forca o anuncio (ignora fonte e dedup) —
# uso pontual/teste; nunca setado por padrao em producao.
#
# NAO bloqueante (SessionStart nunca bloqueia sessao). Falha em qualquer
# etapa -> loga em stderr e segue (fail-open); nunca aborta a sessao.
set -uo pipefail

# T e' overridable (PAPEL_TERMINAIS_DIR) so para permitir teste isolado com
# registry sintetico, sem tocar docs/ai-state/terminais real — default
# inalterado em producao.
T="${PAPEL_TERMINAIS_DIR:-$HOME/Claude/docs/ai-state/terminais}"
REGISTRY="$T/registry.json"
SCRIPTS="$HOME/Claude/.claude/scripts"
PAPEIS_DIR="$T/papeis"

[ -f "$REGISTRY" ] || exit 0
WS="${CMUX_WORKSPACE_ID:-}"
[ -z "$WS" ] && exit 0

PAYLOAD="$(cat 2>/dev/null || true)"
SESSION_ID="$(printf '%s' "$PAYLOAD" | python3 -c 'import json,sys
try:
    d=json.load(sys.stdin); print(d.get("session_id","") or "")
except Exception:
    print("")' 2>/dev/null)"
SOURCE="$(printf '%s' "$PAYLOAD" | python3 -c 'import json,sys
try:
    d=json.load(sys.stdin); print(d.get("source","") or "")
except Exception:
    print("")' 2>/dev/null)"

INFO="$(REGISTRY="$REGISTRY" WS="$WS" python3 <<'PYEOF' 2>/dev/null
import json, os
try:
    reg = json.load(open(os.environ["REGISTRY"]))
except Exception:
    print(""); raise SystemExit(0)
ws = os.environ["WS"]
for papel, e in (reg.get("terminais") or {}).items():
    if e.get("workspace_uuid") == ws:
        print(papel + "\t" + (e.get("heartbeat") or ""))
        raise SystemExit(0)
print("")
PYEOF
)"
[ -z "$INFO" ] && exit 0
PAPEL="$(printf '%s' "$INFO" | cut -f1)"
HEARTBEAT_REL="$(printf '%s' "$INFO" | cut -f2)"

# --- (a) anunciar ONLINE em ALERTAS — so em startup/clear (sessao nova de
# fato) e so 1x por (papel, dia), a menos que PAPEL_ONLINE_FORCE=1 ---
ONLINE_FORCE="${PAPEL_ONLINE_FORCE:-0}"
SHOULD_TRY_ONLINE=0
if [ "$ONLINE_FORCE" = "1" ]; then
  SHOULD_TRY_ONLINE=1
elif [ "$SOURCE" = "startup" ] || [ "$SOURCE" = "clear" ]; then
  SHOULD_TRY_ONLINE=1
fi

if [ "$SHOULD_TRY_ONLINE" = "1" ]; then
  ONLINE_STATE_DIR="$T/.papel-online-state"
  ONLINE_STATE_FILE="$ONLINE_STATE_DIR/${PAPEL}.json"
  HOJE_UTC="$(date -u +%F)"
  JA_ONLINE_HOJE=0
  if [ "$ONLINE_FORCE" != "1" ] && [ -f "$ONLINE_STATE_FILE" ]; then
    PREV_DATE="$(python3 -c 'import json,sys
try:
    print(json.load(open(sys.argv[1])).get("date",""))
except Exception:
    print("")' "$ONLINE_STATE_FILE" 2>/dev/null)"
    [ "$PREV_DATE" = "$HOJE_UTC" ] && JA_ONLINE_HOJE=1
  fi

  if [ "$JA_ONLINE_HOJE" = "0" ]; then
    SID_SHORT=""
    [ -n "$SESSION_ID" ] && SID_SHORT="${SESSION_ID:0:8}"
    MSG="papel assumido"
    [ -n "$SID_SHORT" ] && MSG="papel assumido; sessao ${SID_SHORT}"
    if [ -x "$SCRIPTS/canal-append.sh" ]; then
      # F0b (coordenador, medicao 2026-08-29): ALERTAS congelado (chmod 444,
      # F0a) -- alvo agora e' LOG (log/<hoje>.md, sem teto). rc SEMPRE
      # registrado em hooks.log (sucesso E falha) -- um chamador que falha
      # calado (o `|| true` antigo) e' exatamente o defeito que a causa 6 do
      # diagnostico ("vermelho que ninguem le") descreve; nao se repete aqui.
      HOOKS_LOG="${HOOKS_LOG_PATH:-$HOME/.claude/state/hooks.log}"
      bash "$SCRIPTS/canal-append.sh" LOG "$MSG" --papel "$PAPEL" >/dev/null 2>&1
      RC=$?
      mkdir -p "$(dirname "$HOOKS_LOG")" 2>/dev/null
      printf '%s \xc2\xb7 papel-session-start \xc2\xb7 %s \xc2\xb7 %s \xc2\xb7 LOG\n' \
        "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$PAPEL" "$RC" >> "$HOOKS_LOG" 2>/dev/null
      [ "$RC" -ne 0 ] && echo "[papel-session-start] AVISO: canal-append.sh LOG falhou rc=$RC (papel=$PAPEL) — ver hooks.log" >&2
    fi
    mkdir -p "$ONLINE_STATE_DIR" 2>/dev/null
    ONLINE_STATE_TMP="$ONLINE_STATE_FILE.tmp"
    if python3 -c 'import json,sys
json.dump({"date": sys.argv[1]}, open(sys.argv[2], "w"))' "$HOJE_UTC" "$ONLINE_STATE_TMP" 2>/dev/null; then
      mv -f "$ONLINE_STATE_TMP" "$ONLINE_STATE_FILE" 2>/dev/null
    fi
  fi
fi

# --- (b) heartbeat declarado pelo registry ---
if [ -n "$HEARTBEAT_REL" ]; then
  HB_PATH="$HOME/Claude/$HEARTBEAT_REL"
  mkdir -p "$(dirname "$HB_PATH")" 2>/dev/null
  touch "$HB_PATH" 2>/dev/null || echo "[papel-session-start] AVISO: nao consegui touch em $HB_PATH" >&2
fi

# --- (c) contrato em ~10 linhas, extraido de papeis/<PAPEL>.md ---
PAPEL_MD="$PAPEIS_DIR/${PAPEL}.md"
if [ -f "$PAPEL_MD" ]; then
  CONTRATO="$(PAPEL_MD="$PAPEL_MD" PAPEL="$PAPEL" python3 <<'PYEOF' 2>/dev/null
import os, re

path = os.environ["PAPEL_MD"]
papel = os.environ["PAPEL"]
try:
    text = open(path, encoding="utf-8").read()
except Exception:
    print("")
    raise SystemExit(0)

def extract_section(text, headers, max_lines):
    """Primeira secao cujo header (## X) bate um dos `headers` (case-insensitive,
    match por prefixo) ate o proximo `## `. Trunca em max_lines."""
    lines = text.splitlines()
    start = None
    for i, l in enumerate(lines):
        if l.strip().startswith("## "):
            title = l.strip()[3:].strip().lower()
            if any(title.startswith(h) for h in headers):
                start = i + 1
                break
    if start is None:
        return []
    out = []
    for l in lines[start:]:
        if l.strip().startswith("## "):
            break
        if l.strip():
            out.append(l.rstrip())
        if len(out) >= max_lines:
            break
    return out

missao = extract_section(text, ["missão", "missao"], 4)
regras = extract_section(text, ["regras que nunca quebra", "nunca"], 6)

out = [f"## Contrato do papel {papel} (SessionStart — resumo, ver arquivo completo)"]
if missao:
    out.append("**Missão:**")
    out.extend(f"  {l}" for l in missao)
if regras:
    out.append("**Regras que nunca quebra:**")
    out.extend(f"  {l}" for l in regras)
out.append(f"Fonte completa: docs/ai-state/terminais/papeis/{papel}.md")
out.append("Conduta do cockpit (mecanismos + bypass): docs/ai-state/terminais/CONDUTA.md")
print("\n".join(out))
PYEOF
)"
  [ -n "$CONTRATO" ] && printf '%s\n' "$CONTRATO"
fi

exit 0
