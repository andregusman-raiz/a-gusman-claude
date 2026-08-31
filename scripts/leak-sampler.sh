#!/usr/bin/env bash
# leak-sampler.sh v8 — UMA sonda por intervalo. SEM rajada.
# Razao (RESUMO 07:24Z): as rajadas de 15/24/36/87 ocupavam capacidade de atendimento,
# subiam o threads_active e, como o peak NUNCA desce, inflacionavam PERMANENTEMENTE
# a metrica medida. 3 dos 6 degraus do ciclo 0631 foram fabricados por mim.
# Custo aceite: uma sonda so ve UM worker por vez -> perde-se o total do container.
# Ganho: a serie deixa de ser contaminada pelo proprio observador.
U=https://raiz-data-engine-production.up.railway.app
OUT="$HOME/.claude/state/leak/censo-$(date -u +%Y%m%d).jsonl"
while :; do
  TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  B=$(curl -s --max-time 8 "$U/health/threads" 2>/dev/null | head -c 300 | tr -d '\n')
  H=$(curl -s -o /dev/null -w '%{http_code}' --max-time 6 "$U/v1/health" 2>/dev/null)
  A=$(printf '%s' "$B" | grep -oE '"threads_active"[[:space:]]*:[[:space:]]*[0-9]+' | grep -oE '[0-9]+$')
  P=$(printf '%s' "$B" | grep -oE '"threads_peak"[[:space:]]*:[[:space:]]*[0-9]+' | grep -oE '[0-9]+$')
  PA=$(printf '%s' "$B" | grep -oE '"threads_peak_at"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"\([^"]*\)"$/\1/')
  printf '{"ts":"%s","peak_at":"%s","act":%s,"peak":%s,"v1_health":%s,"sondas_por_amostra":1}\n' \
    "$TS" "$PA" "${A:-null}" "${P:-null}" "$((10#${H:-0}))" >> "$OUT"   # 30/08: curl devolve "000" (nao vazio) no timeout e 000 nu e JSON invalido — 8 linhas hoje; 10# forca base 10
  sleep 30
done
