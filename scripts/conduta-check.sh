#!/usr/bin/env bash
# conduta-check.sh — mede conduta do cockpit por papel ABERTO e escreve
# docs/ai-state/terminais/CONDUTA-SCORE.md (view gerada, tmp+replace).
#
# E' a auditoria forense de 48h (2026-08-28) automatizada: por papel, mede
# 5 sinais mecanicos (nenhum depende de disciplina para SER MEDIDO, so os
# 4 primeiros dependem de disciplina para SER BOM):
#   1. ONLINE anunciado hoje?           — ALERTAS.md tem "<PAPEL> ONLINE" hoje (M1)
#   2. handoff_age_h                    — liveness.json (M6)
#   3. cmux send/new-workspace cru 24h  — guard-blocks.log (M3)
#   4. decisao em chat sem D-nnn 24h    — ALERTAS.md "DECISÃO EM CHAT sem D-nnn" (M4 fallback)
#   5. roteamento lateral 24h           — send.log (ITEM 3, reforma 2026-08-28: mede a
#      ESTRELA — 390 msgs/dia, 166 verticais, 0 laterais entre papeis registrados)
#
# Score 0-100 = soma de 5 componentes de 20 pts cada (ver calc_score() no
# heredoc python) — o componente "lateral" so existe para papeis com `frente`
# declarada no registry (quem tem par possivel); sem frente vira "n/a" e o
# score e recalculado sobre os 4 componentes restantes (/80 -> /100), nunca
# penaliza tier 3 isolado nem os hubs (COMANDO/RESUMO/DE-COORD) por nao serem
# laterais — essa e literalmente a funcao deles. Papel SEM NENHUM sinal de
# atividade hoje (nao online, sem handoff, zero cmux/chat/msgs) aparece
# "sem dados" na coluna Score, nunca com nota alta por ausencia de violacao —
# ausencia de erro != presenca de efeito.
#
# So leitura — nunca escreve em nenhuma fonte, so na propria CONDUTA-SCORE.md.
# Idempotente.
#
# Chamado por canais-render.sh (se presente — ver run_one "conduta-check.sh"
# la) a cada 10 min; standalone tambem funciona (cron/manual).
set -uo pipefail

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'EOF'
Uso: conduta-check.sh

Sem argumentos. Le registry.json (papeis com estado=aberto), liveness.json
(handoff_age_h), docs/ai-state/de-pr-queue/ALERTAS.md (ONLINE hoje + decisao
em chat sem D-nnn), docs/ai-state/terminais/guard-blocks.log (cmux send cru)
e docs/ai-state/terminais/send.log (roteamento lateral 24h), e escreve
docs/ai-state/terminais/CONDUTA-SCORE.md com uma secao "Topologia (24h)"
(total/% vertical/% lateral/pares laterais do cockpit inteiro) + uma tabela
de score 0-100 por papel + explicacao dos 5 componentes. So leitura sobre as
fontes; escrita atomica (tmp+os.replace) so na propria CONDUTA-SCORE.md.
EOF
  exit 0
fi

T="${PAPEL_TERMINAIS_DIR:-$HOME/Claude/docs/ai-state/terminais}"
Q="${DE_PR_QUEUE_DIR:-$HOME/Claude/docs/ai-state/de-pr-queue}"
OUT="${CONDUTA_SCORE_OUT:-$T/CONDUTA-SCORE.md}"

REGISTRY="$T/registry.json" LIVENESS="$T/liveness.json" ALERTAS="$Q/ALERTAS.md" \
GUARD_LOG="$T/guard-blocks.log" SEND_LOG="$T/send.log" OUT="$OUT" python3 <<'PYEOF'
import calendar, json, os, re, time

REGISTRY = os.environ["REGISTRY"]
LIVENESS = os.environ["LIVENESS"]
ALERTAS = os.environ["ALERTAS"]
GUARD_LOG = os.environ["GUARD_LOG"]
SEND_LOG = os.environ["SEND_LOG"]
OUT = os.environ["OUT"]

now = time.time()
ts = time.strftime("%Y-%m-%d %H:%M UTC", time.gmtime(now))
hoje = time.strftime("%Y-%m-%d", time.gmtime(now))
cutoff_24h = now - 24 * 3600
VERTICAL_DESTS = {"COMANDO", "RESUMO", "DE-COORD"}


def safe_load(path, default):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def safe_read(path):
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            return f.read()
    except Exception:
        return ""


reg = safe_load(REGISTRY, {})
terminais = reg.get("terminais") or {}
abertos = {p: e for p, e in terminais.items() if e.get("estado") == "aberto"}

live = safe_load(LIVENESS, {})
live_terminais = (live.get("terminais") or {})

alertas_text = safe_read(ALERTAS)
alertas_lines = alertas_text.splitlines()

guard_lines = safe_read(GUARD_LOG).splitlines()

send_lines = safe_read(SEND_LOG).splitlines()

ONLINE_RE = re.compile(r"^\[(\d{4}-\d{2}-\d{2}) \d{2}:\d{2}\]\s+(\S+)\s+ONLINE\b")
CHAT_DECISAO_RE = re.compile(r"^\[(\d{4}-\d{2}-\d{2}) \d{2}:\d{2}\]\s+(\S+)\s+ALERTA:\s*DECIS[ÃA]O EM CHAT sem D-nnn")
GUARD_LINE_RE = re.compile(r"^(\S+)\s+(\S+)\s+(\S+)$")  # ts papel regra
# "2026-08-28T14:41:10Z DE-DATA-...-96616 from=DE-DATA to=DE-COORD uuid=... :: msg"
SEND_LINE_RE = re.compile(r"^(\S+)\s+\S+\s+from=(\S+)\s+to=(\S+)\s+uuid=\S+\s+::")


def parse_send_epoch(ts_str):
    try:
        return calendar.timegm(time.strptime(ts_str, "%Y-%m-%dT%H:%M:%SZ"))
    except Exception:
        return None


# Uma unica passada por send.log — extrai as mensagens dos ultimos 24h como
# (from, to) e classifica ANTES de qualquer consulta por papel: a secao
# "Topologia" e as colunas por papel usam a MESMA lista, nunca duas leituras
# (nunca duas contagens divergentes do mesmo arquivo).
mensagens_24h = []  # [(from, to)]
for line in send_lines:
    m = SEND_LINE_RE.match(line.strip())
    if not m:
        continue
    ts_str, origem, destino = m.groups()
    epoch = parse_send_epoch(ts_str)
    if epoch is None or epoch < cutoff_24h:
        continue
    mensagens_24h.append((origem, destino))


def online_today(papel):
    for line in alertas_lines:
        m = ONLINE_RE.match(line)
        if m and m.group(1) == hoje and m.group(2) == papel:
            return True
    return False


def chat_sem_d_24h(papel):
    # ALERTAS carimba em UTC "[YYYY-MM-DD HH:MM]" mas nao da pra converter
    # pra epoch sem timezone extra; aproxima por "e' de hoje" (mesma
    # granularidade grosseira usada no resto do harness pra este tipo de
    # contagem de auditoria, nao para decisao de bloqueio).
    n = 0
    for line in alertas_lines:
        m = CHAT_DECISAO_RE.match(line)
        if m and m.group(1) == hoje and m.group(2) == papel:
            n += 1
    return n


def cmux_cru_24h(papel):
    n = 0
    for line in guard_lines:
        m = GUARD_LINE_RE.match(line.strip())
        if not m:
            continue
        ts_str, p, regra = m.groups()
        if p != papel or not regra.startswith("cmux-"):
            continue
        try:
            t = time.strptime(ts_str, "%Y-%m-%dT%H:%M:%SZ")
            epoch = time.mktime(t) - time.timezone
        except Exception:
            continue
        if epoch >= cutoff_24h:
            n += 1
    return n


def msgs_laterais_24h(papel):
    """Enviadas por `papel` para destino != COMANDO/RESUMO/DE-COORD, 24h."""
    return sum(1 for origem, destino in mensagens_24h if origem == papel and destino not in VERTICAL_DESTS)


def msgs_recebidas_24h(papel):
    """Recebidas por `papel`, qualquer origem, 24h."""
    return sum(1 for _origem, destino in mensagens_24h if destino == papel)


def calc_score(online_ok, handoff_age_h, cmux_cru_n, chat_sem_d_n, tem_frente, lateral_ok):
    """5 componentes de 20pts. O componente 'lateral' so existe se `tem_frente`
    (papel declara `frente` no registry — e o unico sinal disponivel de "tem
    par possivel"; tier 3 isolado e os hubs COMANDO/RESUMO/DE-COORD nao tem
    frente, entao ficam 'n/a' nesse componente e o total e recalculado sobre
    os 4 restantes (/80 -> /100) — nunca penalizados por nao serem laterais,
    que e literalmente o papel deles."""
    s_online = 20 if online_ok else 0
    if handoff_age_h is None:
        s_handoff = 8  # sem NENHUM handoff ainda — ambiguo (recem-aberto?), nao 0 nem 20
    elif handoff_age_h <= 8:
        s_handoff = 20
    else:
        s_handoff = 0
    s_cmux = max(0, 20 - 8 * cmux_cru_n)
    s_chat = max(0, 20 - 12 * chat_sem_d_n)
    parts = {"online": s_online, "handoff": s_handoff, "cmux": s_cmux, "chat": s_chat}
    soma4 = s_online + s_handoff + s_cmux + s_chat
    if not tem_frente:
        parts["lateral"] = None
        total = round(soma4 * 100 / 80)
    else:
        s_lateral = 20 if lateral_ok else 0
        parts["lateral"] = s_lateral
        total = soma4 + s_lateral
    return total, parts


# Denominador do componente lateral: "papeis abertos com frente relacionada"
# — so faz sentido cobrar lateralidade de quem TEM frente E existe pelo menos
# UM OUTRO papel aberto com frente tambem (um par possivel na ecologia do
# cockpit, nao necessariamente a MESMA frente — o achado original e
# DE-MIG x DE-DATA, frentes DIFERENTES, e mesmo assim contam como par
# possivel: e a mesma classe de trabalho, migrations-aws/hubspot-funil/etc,
# todos tier 1/2 do DE). Sem nenhum outro papel com frente no registry
# inteiro, o denominador nao existe -> n/a mesmo tendo frente proprio.
papeis_com_frente = {p for p, e in abertos.items() if e.get("frente")}

# --- Topologia (24h): mede a estrela no cockpit inteiro, calculada ANTES do
# loop por papel porque o score de cada papel reusa a MESMA definicao de
# "lateral genuino" (nunca duas contagens divergentes do mesmo dado). "Lateral
# genuino" exige os DOIS lados fora do trio de hubs — msg de um hub PARA um
# worker (ex: ORDEM de COMANDO) e tao vertical quanto a subida, so que descendo
# o mesmo raio da estrela; e os DOIS lados tem que ser papel CONHECIDO do
# registry, nunca externo/nao-registrado — mesmo criterio do diagnostico que
# mediu 166 verticais / 0 laterais em 2026-08-28 (as "14 laterais" de la eram
# justamente from=externo/nao-registrado, nao papel a papel de verdade).
papeis_conhecidos = set(terminais.keys())  # qualquer estado — nao so aberto (msg pode ser de/para papel fechado)
total_msgs = len(mensagens_24h)
vertical_msgs = sum(1 for _o, d in mensagens_24h if d in VERTICAL_DESTS)


def eh_lateral_genuino(o, d):
    return (
        o not in VERTICAL_DESTS and d not in VERTICAL_DESTS
        and o in papeis_conhecidos and d in papeis_conhecidos and o != d
    )


pares_laterais = sorted({(o, d) for o, d in mensagens_24h if eh_lateral_genuino(o, d)})
lateral_msgs = sum(1 for o, d in mensagens_24h if eh_lateral_genuino(o, d))
pct_vertical = (vertical_msgs / total_msgs * 100) if total_msgs else 0.0
pct_lateral = (lateral_msgs / total_msgs * 100) if total_msgs else 0.0
# Papeis que participaram de PELO MENOS um par lateral genuino (fonte unica de
# verdade para o componente de score — NUNCA a versao solta de
# msgs_recebidas_lateral_24h/msgs_laterais_24h, que nao exige contraparte
# registrada e creditaria "lateral" por trafego de subagent/externo).
papeis_em_par_lateral = {p for par in pares_laterais for p in par}

rows = []
sem_dados_rows = []
for papel in sorted(abertos):
    entry = abertos[papel]
    tier = entry.get("tier")
    frente = entry.get("frente")
    live_info = live_terminais.get(papel, {})
    handoff_age_h = live_info.get("handoff_age_h")
    online_ok = online_today(papel)
    cmux_n = cmux_cru_24h(papel)
    chat_n = chat_sem_d_24h(papel)
    lat_env_n = msgs_laterais_24h(papel)
    lat_rec_n = msgs_recebidas_24h(papel)

    # "verde por ausencia": zero sinal de atividade hoje (nao so zero violacao)
    # -> "sem dados", nunca nota alta por omissao. Ver
    # gotcha_verde_por_ausencia_sucesso_sem_efeito na memoria do harness.
    tem_algum_sinal = (
        online_ok or handoff_age_h is not None or cmux_n > 0 or chat_n > 0
        or lat_env_n > 0 or lat_rec_n > 0
    )
    if not tem_algum_sinal:
        sem_dados_rows.append({
            "papel": papel, "tier": tier, "frente": frente,
            "lat_env_n": lat_env_n, "lat_rec_n": lat_rec_n,
        })
        continue

    tem_frente = bool(frente) and len(papeis_com_frente - {papel}) > 0
    lateral_ok = papel in papeis_em_par_lateral
    score, parts = calc_score(online_ok, handoff_age_h, cmux_n, chat_n, tem_frente, lateral_ok)
    rows.append({
        "papel": papel, "tier": tier, "frente": frente, "online": online_ok,
        "handoff_age_h": handoff_age_h, "cmux_n": cmux_n, "chat_n": chat_n,
        "lat_env_n": lat_env_n, "lat_rec_n": lat_rec_n,
        "score": score, "parts": parts,
    })

lines = []
lines.append(f"# CONDUTA-SCORE.md — auditoria automatizada do cockpit de terminais")
lines.append("")
lines.append(f"> VIEW GERADA por conduta-check.sh — nao editar a mao. Gerado: {ts}.")
lines.append("> Formula: Score 0-100 = ONLINE hoje (20) + handoff <=8h (20) + sem cmux cru 24h "
              "(20, -8/ocorrencia) + sem decisao-em-chat-sem-D 24h (20, -12/ocorrencia) + "
              "roteamento lateral 24h (20 — so para papel com `frente` E que exista pelo menos "
              "outro papel aberto TAMBEM com frente — denominador 'papeis abertos com frente "
              "relacionada'; enviou OU recebeu de alguem que nao e hub). Sem esse par possivel "
              "(hub COMANDO/RESUMO/DE-COORD, tier 3 isolado, ou unico papel com frente no "
              "registry): componente lateral fica 'n/a' e o total e recalculado sobre os 4 "
              "restantes (soma/80*100) — nunca penalizado por "
              "nao ser lateral. Papel sem NENHUM sinal de atividade hoje (nao online, sem "
              "handoff, zero cmux/chat/msgs) aparece 'sem dados' — nunca com nota (ausencia de "
              "violacao != presenca de efeito; nao entra na media nem na lista 'abaixo de 50').")
lines.append("")
lines.append("## Topologia (24h)")
lines.append("")
lines.append(f"Total de mensagens: {total_msgs}. Verticais (-> COMANDO/RESUMO/DE-COORD): "
              f"{vertical_msgs} ({pct_vertical:.0f}%). Laterais entre papeis registrados "
              f"(nao-hub -> nao-hub): {lateral_msgs} ({pct_lateral:.0f}%).")
if pares_laterais:
    lines.append("")
    lines.append("Pares laterais que existiram: " + ", ".join(f"{o}→{d}" for o, d in pares_laterais))
else:
    lines.append("")
    lines.append("Pares laterais que existiram: nenhum.")
lines.append("")
lines.append("## Score por papel")
lines.append("")
lines.append("| Papel | Tier | Frente | Score | ONLINE hoje | handoff_age_h | cmux cru 24h | "
              "chat sem D 24h | msgs laterais 24h | msgs recebidas 24h |")
lines.append("|---|---|---|---|---|---|---|---|---|---|")
if not rows and not sem_dados_rows:
    lines.append("| _nenhum papel aberto no registry_ | | | | | | | | | |")
else:
    for r in sorted(rows, key=lambda x: x["score"]):
        h = "—" if r["handoff_age_h"] is None else f"{r['handoff_age_h']:.1f}h"
        frente_txt = r["frente"] or "—"
        lines.append(
            f"| {r['papel']} | {r['tier']} | {frente_txt} | {r['score']} | "
            f"{'sim' if r['online'] else 'NAO'} | {h} | {r['cmux_n']} | {r['chat_n']} | "
            f"{r['lat_env_n']} | {r['lat_rec_n']} |"
        )
    for r in sorted(sem_dados_rows, key=lambda x: x["papel"]):
        frente_txt = r["frente"] or "—"
        lines.append(
            f"| {r['papel']} | {r['tier']} | {frente_txt} | **sem dados** | NAO | — | 0 | 0 | "
            f"{r['lat_env_n']} | {r['lat_rec_n']} |"
        )

if rows:
    media = sum(r["score"] for r in rows) / len(rows)
    piores = [r["papel"] for r in rows if r["score"] < 50]
    lines.append("")
    resumo = f"Média (papéis com dados): {media:.0f}/100. Abaixo de 50: {', '.join(piores) if piores else 'nenhum'}."
    if sem_dados_rows:
        resumo += f" Sem dados: {', '.join(sorted(r['papel'] for r in sem_dados_rows))}."
    lines.append(resumo)
elif sem_dados_rows:
    lines.append("")
    lines.append(f"Nenhum papel com dados hoje. Sem dados: {', '.join(sorted(r['papel'] for r in sem_dados_rows))}.")

lines.append("")
lines.append("Fontes: registry.json (papeis abertos, `frente`), liveness.json (handoff_age_h, M6), "
              "ALERTAS.md (ONLINE hoje = M1, decisão-em-chat-sem-D = fallback do M4), "
              "guard-blocks.log (cmux cru bloqueado = M3), send.log (roteamento lateral 24h, "
              "topologia da estrela — ITEM 3 da reforma 2026-08-28).")

tmp = OUT + ".tmp"
with open(tmp, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
os.replace(tmp, OUT)
print(f"CONDUTA-SCORE.md escrito: {OUT} ({len(rows)} com score, {len(sem_dados_rows)} sem dados)")
PYEOF
