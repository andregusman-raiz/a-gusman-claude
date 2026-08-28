#!/usr/bin/env bash
# alertas-render.sh — gera ALERTAS-ABERTOS.md a partir de ALERTAS.md.
set -euo pipefail

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'EOF'
Uso: alertas-render.sh

Sem argumentos. Le docs/ai-state/de-pr-queue/ALERTAS.md e escreve
docs/ai-state/de-pr-queue/ALERTAS-ABERTOS.md (view gerada, atomica —
tmp + os.replace).

Entrada reconhecida: linha que casa
`^\[20\d\d-\d\d-\d\d \d\d:\d\d\] [A-Z0-9-]+ [A-Z]+` (aceita os 30+
verbos ad-hoc do arquivo). Classificacao do 3o token (TIPO):
  - ONLINE / INFO / SNAPSHOT       -> informativo (nao abre entrada)
  - RESOLVIDO / RETRATADO* (RETRATAÇÃO) -> fechamento: procura, SO no
    que vem depois do proprio "[ts] PAPEL TIPO" (nunca no cabecalho da
    propria linha, que coincidiria por acaso com um candidato do mesmo
    minuto/papel), o `[data hora] PAPEL` de uma entrada aberta anterior
    (ou um id P-/O-/D-/A-nnn) e fecha essa entrada
  - qualquer outro verbo (ALERTA, BOMBA, VETO, e os ad-hoc)
    -> aberto por padrao

Idade: calculada contra `now` UTC. Timestamp no futuro (o cabecalho de
ALERTAS.md documenta um dia inteiro de horas carimbadas de cabeca,
2026-08-28 00:15-13:15Z) e' tratado como valido para ORDENACAO mas
marcado "(hora incerta)".

🔴 marca entrada aberta ha mais de 6h cujo texto cita
produ(cao)/congelad(o)/bloquead(o).

Se ALERTAS.md nao existir: mensagem de erro, exit 1, NADA e escrito
(a view antiga, se houver, fica preservada).
EOF
  exit 0
fi

Q="${DE_PR_QUEUE_DIR:-$HOME/Claude/docs/ai-state/de-pr-queue}"
SRC="$Q/ALERTAS.md"
OUT="$Q/ALERTAS-ABERTOS.md"

if [[ ! -f "$SRC" ]]; then
  echo "ERRO: $SRC nao encontrado — view antiga preservada, nada escrito" >&2
  exit 1
fi

SRC="$SRC" OUT="$OUT" python3 - <<'PYEOF'
import datetime
import os
import re
import tempfile

SRC = os.environ["SRC"]
OUT = os.environ["OUT"]

HEADER_RE = re.compile(
    r'^\[(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})\] ([A-Z0-9-]+) ([A-Z]+)(.*)$'
)
INFORMATIVO = {"ONLINE", "INFO", "SNAPSHOT"}
# Entradas nascidas com hora carimbada de cabeca (ver cabecalho ALERTAS.md).
BAD_DATE = "2026-08-28"
BAD_FROM, BAD_TO = "00:15", "13:15"

now = datetime.datetime.now(datetime.timezone.utc)


def parse_ts(data, hora):
    try:
        return datetime.datetime.strptime(
            f"{data} {hora}", "%Y-%m-%d %H:%M"
        ).replace(tzinfo=datetime.timezone.utc)
    except ValueError:
        return None


with open(SRC, encoding="utf-8") as f:
    raw_lines = [ln.rstrip("\n") for ln in f]

total_lines = len(raw_lines)
entries = []
for i, line in enumerate(raw_lines):
    m = HEADER_RE.match(line)
    if not m:
        continue
    data, hora, papel, tipo, resto = m.groups()
    ts = parse_ts(data, hora)
    incerta = False
    idade_h = None
    if ts is None:
        incerta = True
    else:
        idade_h = (now - ts).total_seconds() / 3600.0
        if idade_h < 0:
            incerta = True
            idade_h = 0.0
        if data == BAD_DATE and BAD_FROM <= hora <= BAD_TO:
            incerta = True
    # resumo = resto sem o "REF:" ou ":" inicial
    resumo = resto
    m2 = re.match(r'^\s+\S+:\s?(.*)$', resto)  # "TIPO REF: texto"
    if m2:
        resumo = m2.group(1)
    else:
        m3 = re.match(r'^:\s?(.*)$', resto)  # "TIPO: texto"
        if m3:
            resumo = m3.group(1)
    resumo = resumo.strip()
    entries.append({
        "idx": i,
        "data": data,
        "hora": hora,
        "papel": papel,
        "tipo": tipo,
        "resumo": resumo,
        "raw": line,
        "resto": resto,  # so o que vem DEPOIS do proprio "PAPEL TIPO" — usado
                          # para achar a ref citada, nunca o cabecalho da
                          # propria linha (evita fechar por coincidencia
                          # quando o fechamento nasce no mesmo minuto/papel
                          # de uma entrada nao referenciada)
        "idade_h": idade_h,
        "incerta": incerta,
    })

matched_count = len(entries)
fora_do_formato = total_lines - matched_count

is_closer = lambda t: t == "RESOLVIDO" or t.startswith("RETRAT")
is_info = lambda t: t in INFORMATIVO

closed_idx = set()
id_re = re.compile(r'\b[PODA]-\d{3}\b')

candidates = [e for e in entries if not is_closer(e["tipo"]) and not is_info(e["tipo"])]

for e in entries:
    if not is_closer(e["tipo"]):
        continue
    # Busca SO no que vem depois do proprio "[ts] PAPEL TIPO" (campo --ref +
    # texto) — nunca no `raw` inteiro. `raw` sempre comeca com o cabecalho da
    # propria linha, que casaria por coincidencia com um candidato do MESMO
    # minuto/papel nao referenciado (bug observado: RESOLVIDO carimbado no
    # mesmo minuto/papel de um ALERTA nao relacionado fechava os dois).
    escopo = e["resto"]
    # 1) referencia por [data hora] PAPEL de uma entrada anterior
    for c in candidates:
        if c["idx"] >= e["idx"]:
            continue
        prefix = f"[{c['data']} {c['hora']}] {c['papel']}"
        if prefix in escopo:
            closed_idx.add(c["idx"])
    # 2) referencia por id solto (P-/O-/D-/A-nnn) citado no texto do proprio
    #    fechamento (cobre o caso de RESOLVIDO/RETRATADO que cita id da ledger)
    for ref_id in id_re.findall(escopo):
        for c in candidates:
            if c["idx"] >= e["idx"]:
                continue
            if ref_id in c["raw"]:
                closed_idx.add(c["idx"])

abertos = [e for e in candidates if e["idx"] not in closed_idx]
informativos = [e for e in entries if is_info(e["tipo"])]
informativos_24h = [
    e for e in informativos
    if e["idade_h"] is not None and e["idade_h"] <= 24
]

PROD_RE = re.compile(r'produ|congelad|bloquead', re.IGNORECASE)


def fmt_idade(e):
    if e["idade_h"] is None:
        s = "?"
    else:
        h = e["idade_h"]
        if h < 1:
            s = f"{int(round(h * 60))}min"
        else:
            s = f"{int(round(h))}h"
    if e["incerta"]:
        s += " (hora incerta)"
    return s


def marca(e):
    if e["idade_h"] is not None and e["idade_h"] > 6 and PROD_RE.search(e["raw"]):
        return "🔴 "
    return ""


abertos_sorted = sorted(
    abertos, key=lambda e: (e["idade_h"] if e["idade_h"] is not None else 999999.0), reverse=True
)
informativos_sorted = sorted(
    informativos_24h, key=lambda e: (e["idade_h"] if e["idade_h"] is not None else 999999.0)
)

lines = []
lines.append("# ALERTAS-ABERTOS.md — view gerada (NAO EDITAR A MAO)")
lines.append("")
lines.append(
    "> Gerada por `alertas-render.sh` a partir de `ALERTAS.md`. Fechamento acontece por "
    "linha `RESOLVIDO`/`RETRATADO` que cita `[data hora] PAPEL` da entrada original, ou id."
)
lines.append("")
lines.append(f"## Abertos ({len(abertos_sorted)})")
lines.append("")
if not abertos_sorted:
    lines.append("_nenhum aberto_")
else:
    lines.append("| idade | papel | tipo | resumo |")
    lines.append("|---|---|---|---|")
    for e in abertos_sorted:
        resumo = e["resumo"][:160].replace("|", "\\|")
        lines.append(f"| {marca(e)}{fmt_idade(e)} | {e['papel']} | {e['tipo']} | {resumo} |")
lines.append("")
lines.append(f"## Informativos ultimas 24h ({len(informativos_sorted)})")
lines.append("")
if not informativos_sorted:
    lines.append("_nenhum_")
else:
    lines.append("| idade | papel | tipo | resumo |")
    lines.append("|---|---|---|---|")
    for e in informativos_sorted:
        resumo = e["resumo"][:160].replace("|", "\\|")
        lines.append(f"| {fmt_idade(e)} | {e['papel']} | {e['tipo']} | {resumo} |")
lines.append("")
lines.append("## Contagens")
lines.append("")
lines.append(f"- Abertos: {len(abertos_sorted)}")
lines.append(f"- Fechados nesta renderizacao (RESOLVIDO/RETRATADO aplicados): {len(closed_idx)}")
lines.append(f"- Informativos (24h): {len(informativos_sorted)} / {len(informativos)} no total")
lines.append(f"- Linhas no formato estrito reconhecido: {matched_count} / {total_lines} ({fora_do_formato} fora do formato)")
lines.append("")
size_kb = os.path.getsize(SRC) / 1024.0
lines.append(
    f"gerado por alertas-render.sh em {now.strftime('%Y-%m-%d %H:%M UTC')}, "
    f"fonte ALERTAS.md ({size_kb:.0f} KB)"
)

dirpath = os.path.dirname(OUT) or "."
fd, tmp = tempfile.mkstemp(dir=dirpath, prefix=".alertas-abertos-", suffix=".tmp")
try:
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
        f.flush()
        os.fsync(f.fileno())
    os.chmod(tmp, 0o644)
    os.replace(tmp, OUT)
except BaseException:
    try:
        os.unlink(tmp)
    except OSError:
        pass
    raise

print(f"ALERTAS-ABERTOS.md escrito: {OUT} ({len(abertos_sorted)} aberto(s), {fora_do_formato} linha(s) fora do formato)")
PYEOF
