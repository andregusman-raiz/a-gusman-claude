#!/usr/bin/env bash
# radar-prazos.sh — gera RADAR-PRAZOS.md a partir de prazos.json.
set -euo pipefail

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'EOF'
Uso: radar-prazos.sh

Sem argumentos. Le docs/ai-state/terminais/prazos.json (lista de
{id,data,titulo,efeito,dono,origem,estado}) e escreve
docs/ai-state/terminais/RADAR-PRAZOS.md — tabela ordenada por dias
restantes, com "⚠" para <=14 dias e "🔴" para <=7 dias. So considera
itens com estado != "feito". Idempotente: sobrescreve o .md mesmo se ja
existir (inclusive um criado por outro processo).

Se prazos.json nao existir, cria um vazio ([]) e escreve um .md
avisando que nao ha prazos cadastrados (nunca falha por ausencia do
arquivo).
EOF
  exit 0
fi

T="$HOME/Claude/docs/ai-state/terminais"
PRAZOS="$T/prazos.json"
OUT="$T/RADAR-PRAZOS.md"
mkdir -p "$T"

if [[ ! -f "$PRAZOS" ]]; then
  echo "[]" > "$PRAZOS"
fi

PRAZOS="$PRAZOS" OUT="$OUT" python3 <<'PYEOF'
import json, os, datetime

PRAZOS = os.environ["PRAZOS"]
OUT = os.environ["OUT"]

with open(PRAZOS) as f:
    try:
        items = json.load(f)
    except Exception:
        items = []

now = datetime.datetime.now().astimezone()

def parse_date(s):
    try:
        d = datetime.datetime.fromisoformat(s)
    except Exception:
        return None
    if d.tzinfo is None:
        d = d.replace(tzinfo=now.tzinfo)
    return d

rows = []
for it in items:
    if it.get("estado") == "feito":
        continue
    d = parse_date(it.get("data", ""))
    dias = (d - now).total_seconds() / 86400.0 if d else None
    rows.append((dias, it))

rows.sort(key=lambda r: (r[0] is None, r[0] if r[0] is not None else 0))

lines = []
lines.append("# Radar de Prazos")
lines.append("")
lines.append(f"Gerado em {now.strftime('%Y-%m-%d %H:%M %Z')} por radar-prazos.sh.")
lines.append("")
lines.append("| | Data | Dias | Titulo | Efeito | Dono | Origem |")
lines.append("|---|---|---|---|---|---|---|")

if not rows:
    lines.append("| | | | _nenhum prazo cadastrado_ | | | |")
else:
    for dias, it in rows:
        if dias is None:
            marca = "?"
            dias_fmt = "?"
        else:
            dias_fmt = str(round(dias))
            if dias <= 7:
                marca = "🔴"
            elif dias <= 14:
                marca = "⚠"
            else:
                marca = ""
        lines.append("| {marca} | {data} | {dias} | {titulo} | {efeito} | {dono} | {origem} |".format(
            marca=marca,
            data=it.get("data", ""),
            dias=dias_fmt,
            titulo=str(it.get("titulo", "")).replace("|", "\\|"),
            efeito=str(it.get("efeito", "")).replace("|", "\\|"),
            dono=str(it.get("dono", "")).replace("|", "\\|"),
            origem=str(it.get("origem", "")).replace("|", "\\|"),
        ))

with open(OUT, "w") as f:
    f.write("\n".join(lines) + "\n")

print(f"RADAR-PRAZOS.md escrito: {OUT} ({len(rows)} prazo(s))")
PYEOF
