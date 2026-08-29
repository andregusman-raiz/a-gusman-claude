#!/usr/bin/env bash
# de-aprovador-externo.sh — avisa por WhatsApp (gusman-os, POST /wa/send-contact) o aprovador humano EXTERNO
# quando um PR do raiz-data-engine depende da aprovacao manual dele. Sem LLM; roda no de-fila-tick.sh.
# DOR: 29/08 o #6379 ficou o dia com HUMAN_REVIEW_REQUIRED e ninguem da frota pode aprovar (1 login) — o
#      pedido ao humano dependia do dono lembrar. METRICA: PR com reviewer externo pedido recebe aviso em
#      <=1 tick (10 min) em horario comercial, 1x por (PR, head). DONO-MEDICAO: DE-COORD.
# REMOVER-QUANDO: houver 2a identidade aprovadora na frota (four-eyes interno) ou merge queue com aprovacao humana embutida.
# GATILHO CANONICO: `gh pr edit N --add-reviewer <login>` feito pelo DE-COORD (fica visivel no GitHub); o WA e so o aviso.
# GUARDAS: mapa login->contato fixo (sem telefone aqui), horario 08-19 America/Sao_Paulo, 1 aviso por (PR, head),
#          teto diario no daemon (GUSMAN_OS_WA_AUTO_MAX_PER_DAY), token lido do .env do gusman-os (nunca impresso).
set -uo pipefail
REPO="${DE_REPO:-Raiz-Educacao-SA/raiz-data-engine}"
STATE="${DE_APROVADOR_STATE:-$HOME/.gusman-os/state/de-aprovador-externo.json}"
DAEMON="${GUSMAN_OS_DAEMON_URL:-http://127.0.0.1:${GUSMAN_OS_DAEMON_PORT:-4577}}"
ENVF="${GUSMAN_OS_ENV_FILE:-$HOME/Claude/GitHub/gusman-os/.env}"
TOKEN="${GUSMAN_OS_DAEMON_TOKEN:-}"
if [ -z "$TOKEN" ] && [ -r "$ENVF" ]; then TOKEN=$(grep -E '^GUSMAN_OS_DAEMON_TOKEN=' "$ENVF" | head -1 | cut -d= -f2- | tr -d "\"'"); fi
if [ -z "$TOKEN" ]; then echo "sem GUSMAN_OS_DAEMON_TOKEN (env ou $ENVF) — nada enviado"; exit 0; fi
DRY="${DRY_RUN:-0}"
# login GitHub -> nome na allowlist do gusman-os (contacts.json). Sem telefone aqui, por desenho. (bash 3.2: sem declare -A)
LOGINS=("marcelosaraiva-raiz"); NOMES=("Marcelo Saraiva")
hour=$(TZ=America/Sao_Paulo date +%H); dow=$(TZ=America/Sao_Paulo date +%u)
if [ "$DRY" != "1" ] && { [ "$hour" -lt 8 ] || [ "$hour" -ge 19 ] || [ "$dow" -ge 6 ]; }; then echo "fora do horario comercial ($hour h, dia $dow) — nada enviado"; exit 0; fi
mkdir -p "$(dirname "$STATE")"; [ -s "$STATE" ] || echo '{}' > "$STATE"
TMP=$(mktemp "${TMPDIR:-/tmp}/de-aprovador.XXXXXX")
gh pr list -R "$REPO" --state open --limit 60 --json number,title,headRefOid,reviewRequests,reviews,url > "$TMP" 2>>"${DE_APROVADOR_ERR:-/dev/null}"
python3 - "$STATE" "$DAEMON" "$TOKEN" "$DRY" "$TMP" "${LOGINS[@]}" -- "${NOMES[@]}" <<'PY'
import sys, json, subprocess, os
state_p, daemon, token, dry, prs_file = sys.argv[1:6]
rest = sys.argv[6:]; sep = rest.index("--"); logins = rest[:sep]; nomes = rest[sep+1:]
contato = dict(zip(logins, nomes))
prs = json.load(open(prs_file))
try: state = json.load(open(state_p))
except Exception: state = {}
enviados = 0
for p in prs:
    head = (p.get("headRefOid") or "")[:12]
    pedidos = {(r.get("login") or "") for r in (p.get("reviewRequests") or [])}
    for login, nome in contato.items():
        if login not in pedidos: continue
        # aprovou este head? entao nada a pedir
        ok = any(r.get("author", {}).get("login") == login and r.get("state") == "APPROVED" and (r.get("commit") or {}).get("oid", "").startswith(head) for r in (p.get("reviews") or []))
        if ok: continue
        key = f"{p['number']}@{head}@{login}"
        if state.get(key): continue
        msg = (f"Oi Marcelo, aqui é o assistente do André (gusman-os). O PR #{p['number']} do raiz-data-engine — \"{p['title'][:70]}\" — "
               f"precisa da sua aprovação humana no GitHub (o bot escalou HUMAN_REVIEW_REQUIRED e ninguém da frota pode aprovar). "
               f"Head a aprovar: {head[:7]}. O contexto está no próprio PR: {p['url']} . Quando puder, aprove ou peça mudanças. Obrigado!")
        if dry == "1":
            print(f"DRY: enviaria a {nome} sobre #{p['number']}@{head[:7]}"); continue
        try:
            r = subprocess.run(["curl", "-s", "-m", "20", "-X", "POST", f"{daemon}/wa/send-contact", "-H", "content-type: application/json",
                                "-H", f"x-gusman-token: {token}", "-d", json.dumps({"name": nome, "message": msg, "idempotencyKey": key})],
                               capture_output=True, text=True, timeout=30)
            res = json.loads(r.stdout or "{}")
        except Exception as e: res = {"ok": False, "error": str(e)[:80]}
        if res.get("ok"):
            state[key] = {"ts": __import__("datetime").datetime.utcnow().isoformat() + "Z"}; enviados += 1
            print(f"ENVIADO: {nome} · #{p['number']}@{head[:7]}")
        else:
            print(f"FALHOU: {nome} · #{p['number']}@{head[:7]} · {res.get('error')}")
json.dump(state, open(state_p, "w"), indent=1)
print(f"aprovador-externo: {enviados} aviso(s) enviado(s) · {len(prs)} PRs vistos")
PY
rm -f "$TMP"
