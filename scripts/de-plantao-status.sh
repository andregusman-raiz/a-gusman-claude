#!/usr/bin/env bash
# Prova observável de que o plantão DE-COORD está vivo. Não depende do que o Claude diz.
Q=~/Claude/docs/ai-state/de-pr-queue
HB=$(cat "$Q/.heartbeat" 2>/dev/null || echo 0)
NOW=$(date +%s); AGE=$(( (NOW - HB) / 60 ))
echo "═══ PLANTÃO DE-COORD ═══"
if [ "$HB" = 0 ]; then echo "❌ heartbeat AUSENTE — plantão nunca iniciou"
elif [ "$AGE" -le 12 ]; then echo "✅ VIVO — último tick há ${AGE} min ($(date -r "$HB" '+%H:%M:%S'))"
elif [ "$AGE" -le 30 ]; then echo "⚠️  ATRASADO — último tick há ${AGE} min ($(date -r "$HB" '+%H:%M:%S')); a rede de 10min deveria ter pego"
else echo "❌ MUDO há ${AGE} min ($(date -r "$HB" '+%H:%M:%S')) — sessão caiu ou loop morreu. Reabrir pelo PLANTAO-BOOT.md"; fi
echo
echo "── atividade recente (o que o plantão escreveu) ──"
for f in ALERTAS.md ORDENS.md "log/$(date +%F).md"; do
  [ -f "$Q/$f" ] && printf '  %-22s %s (%s linhas)\n' "$f" "$(date -r "$Q/$f" '+%H:%M:%S')" "$(wc -l < "$Q/$f" | tr -d ' ')"
done
echo
echo "── fila ──"
cd ~/Claude/GitHub/raiz-data-engine 2>/dev/null && echo "  $(gh pr list --state open --limit 100 --json number --jq 'length') PRs abertos"
echo "  QUEUE.md: $(du -h "$Q/QUEUE.md" 2>/dev/null | cut -f1) (meta ≤30K)"
