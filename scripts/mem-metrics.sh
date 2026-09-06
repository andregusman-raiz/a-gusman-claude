#!/bin/bash
# mem-metrics.sh — fonte unica de metricas de memoria REAIS no macOS (Apple Silicon)
#
# POR QUE ESTE SCRIPT EXISTE (incidente 2026-07-28, kernel panic por watchdog):
#   `memory_pressure` reporta "System-wide memory free percentage" contando paginas
#   INATIVAS como livres. No panic de 28/07 ele teria reportado ~36% "livre" enquanto
#   o kernel ja estava em loop de `vm-compressor-space-shortage` matando daemons.
#   Metrica cega => guard nunca dispara => panic.
#
#   Os sinais que REALMENTE antecedem o colapso sao:
#     1. swap em uso (so cresce quando o reclaim normal ja falhou)
#     2. tamanho do compressor (limite de SEGMENTOS estoura antes do de paginas)
#     3. paginas realmente livres (free + speculative + purgeable), NAO inactive
#
#   Bug corrigido de tabela: page size no Apple Silicon e 16384, nao 4096.
#
# FIX 2026-08-10 (AVAIL_MB subestimado): AVAIL_MB media so free+speculative+purgeable
#   (~100-900MB neste Mac de 36GB) e era exibido como "memoria disponivel" no painel
#   /machine e nos logs — mas exclui paginas file-backed reclamaveis (cache), entao
#   nao reflete o que o usuario/Activity Monitor chamam de "disponivel". A fonte certa
#   e `kern.memorystatus_level` (mesmo sysctl que `memory_pressure` reporta como
#   "System-wide memory free percentage" e que o jetsam do kernel usa): percentual
#   direto da RAM total. AVAIL_MB agora = RAM_MB * memorystatus_level / 100 (fallback
#   para a formula antiga so se o sysctl nao existir, ex. macOS pre-jetsam-level).
#   O sinal PRIMARIO de alerta (SEG_PCT/COMP_PCT) NAO mudou — so o co-fator que usava
#   "AVAIL_MB < 512" virou "memorystatus_level baixo" (ver LEVEL_WARN/LEVEL_CRIT abaixo).
#
# Uso: eval "$(bash mem-metrics.sh)"  ou  bash mem-metrics.sh
# Saida: KEY=VALUE (shell-eval friendly). LEVEL=OK|WARN|CRIT
# Ver: memory-guard.sh, mem-watchdog.sh, ~/.claude/statusline.sh

set -uo pipefail

PAGESIZE=$(sysctl -n hw.pagesize 2>/dev/null || echo 16384)
RAM_MB=$(( $(sysctl -n hw.memsize 2>/dev/null || echo 0) / 1048576 ))

VMS=$(vm_stat 2>/dev/null)
_pages() { echo "$VMS" | grep "$1" | awk '{print $NF}' | tr -d '.' | head -1; }

FREE_P=$(_pages "Pages free:");            FREE_P=${FREE_P:-0}
SPEC_P=$(_pages "Pages speculative:");     SPEC_P=${SPEC_P:-0}
PURG_P=$(_pages "Pages purgeable:");       PURG_P=${PURG_P:-0}
COMP_P=$(_pages "Pages occupied by compressor:"); COMP_P=${COMP_P:-0}
[ "$COMP_P" = "0" ] && COMP_P=$(_pages "Pages stored in compressor:")
COMP_P=${COMP_P:-0}

# FREE_INSTANT_MB = paginas instantaneamente livres sem custo de reclaim (free+speculative+
# purgeable). Subestima "disponivel" de proposito (nao conta cache reclamavel) — mantido
# so como fallback de AVAIL_MB quando kern.memorystatus_level nao existe no sistema.
FREE_INSTANT_MB=$(( (FREE_P + SPEC_P + PURG_P) * PAGESIZE / 1048576 ))

# memorystatus_level: percentual (0-100) de memoria disponivel visto pelo kernel — mesma
# fonte que `memory_pressure` usa para "System-wide memory free percentage". Inclui
# paginas reclamaveis (file-backed cache), entao reflete a memoria REALMENTE disponivel,
# nao so as paginas ja instantaneamente livres.
MEMSTATUS_LEVEL=$(sysctl -n kern.memorystatus_level 2>/dev/null)
case "$MEMSTATUS_LEVEL" in
  ''|*[!0-9]*) MEMSTATUS_LEVEL=-1 ;;
esac

if [ "$MEMSTATUS_LEVEL" -ge 0 ]; then
  AVAIL_MB=$(( RAM_MB * MEMSTATUS_LEVEL / 100 ))
else
  AVAIL_MB=$FREE_INSTANT_MB
fi
COMP_MB=$(( COMP_P * PAGESIZE / 1048576 ))
COMP_PCT=0
[ "$RAM_MB" -gt 0 ] && COMP_PCT=$(( COMP_MB * 100 / RAM_MB ))

# swap: locale pt-BR usa virgula decimal; sufixo pode ser M ou G
SWAP_RAW=$(sysctl -n vm.swapusage 2>/dev/null | sed -E 's/.*used = ([0-9.,]+)([MG]).*/\1 \2/')
SWAP_NUM=$(echo "$SWAP_RAW" | awk '{print $1}' | tr ',' '.' | cut -d. -f1)
SWAP_UNIT=$(echo "$SWAP_RAW" | awk '{print $2}')
SWAP_MB=${SWAP_NUM:-0}
[ "$SWAP_UNIT" = "G" ] && SWAP_MB=$(( SWAP_MB * 1024 ))

# Segmentos do compressor — O sinal do paniclog ("100% of segments limit (BAD)").
# O limite que estoura primeiro e o de SEGMENTOS, nao o de paginas; por isso ele manda
# em COMP_PCT na decisao de LEVEL. 0 quando o sysctl nao existe (macOS antigo) — ai
# COMP_PCT segura sozinho.
SEG_TOTAL=$(sysctl -n vm.compressor.segment.total 2>/dev/null || echo 0)
SEG_LIMIT=$(sysctl -n vm.compressor.segment.limit 2>/dev/null || echo 0)
SEG_TOTAL=${SEG_TOTAL:-0}; SEG_LIMIT=${SEG_LIMIT:-0}
SEG_PCT=0
[ "$SEG_LIMIT" -gt 0 ] && SEG_PCT=$(( SEG_TOTAL * 100 / SEG_LIMIT ))

CLAUDE_N=$(ps aux 2>/dev/null | awk '$11 ~ /\/claude$/ || $11 == "claude"' | wc -l | tr -d ' ')
CODEX_N=$(pgrep -x codex 2>/dev/null | wc -l | tr -d ' ')
NODE_N=$(pgrep -f node 2>/dev/null | wc -l | tr -d ' ')
PROC_N=$(( $(ps -A 2>/dev/null | wc -l | tr -d ' ') - 1 ))

# ---------------------------------------------------------------------------
# LIMIARES — recalibrados 2026-08-08 com 1.900 amostras reais (06-08/08, 34h).
#
# A calibracao anterior (swap>=8G, comp>=30%, avail<1G && swap>512M) marcava
# CRIT em 1876/1900 amostras = 98,7% do tempo, OK em ZERO. Guard sempre vermelho
# nao protege nada: so bloqueia todo Agent/Task/Workflow e ensina a ignora-lo.
# Por que cada sinal antigo era cego:
#   - swap: no macOS e CUMULATIVO, praticamente nunca encolhe. Baseline saudavel
#     medido aqui: p10=5,4G / p50=20,5G / p90=26G. Limiar de 8G = quase sempre.
#     => saiu do LEVEL; segue reportado (contexto, nao gatilho).
#   - avail (ATE 2026-08-10): media so free+speculative+purgeable, excluindo cache
#     reclamavel de proposito — por isso 300-900MB era o "normal" (p50=338MB,
#     p90=949MB) mesmo com dezenas de GB de RAM realmente disponiveis. Corrigido
#     para usar kern.memorystatus_level (ver bloco FIX 2026-08-10 no topo do
#     arquivo); o co-fator abaixo passou de "AVAIL_MB < floor MB" para
#     "memorystatus_level <= LEVEL_WARN/LEVEL_CRIT" — mesmo papel (sinal
#     complementar, nunca dispara sozinho), fonte que nao subestima.
#   - comp_pct: sinal bom, mas mal ajustado. Distribuicao real: p50=24, p75=33,
#     p90=36, p95=40, p99=43, max=45 — tudo isso sem nenhum panic.
#
# Sinal primario agora = SEG_PCT (vm.compressor.segment.total/limit): e literalmente
# a linha que fechou o diagnostico do panic ("100% of segments limit (BAD)").
# Baseline atual ~24%. CRIT em 80% deixa margem real antes do colapso.
#
# Backtest dos limiares abaixo nas mesmas 1.900 amostras (sem SEG, que nao era
# logado): OK 76,3% | WARN 21,2% | CRIT 2,5%.
#
# Tudo ajustavel por env (sessao ou export permanente) — sem editar script:
#   MEM_SEG_CRIT_PCT / MEM_SEG_WARN_PCT / MEM_COMP_CRIT_PCT / MEM_COMP_WARN_PCT
#   MEM_LEVEL_WARN_PCT / MEM_LEVEL_CRIT_PCT (co-fator via memorystatus_level)
#   MEM_AVAIL_FLOOR_MB (co-fator de fallback quando memorystatus_level nao existe)
# ---------------------------------------------------------------------------
SEG_WARN=${MEM_SEG_WARN_PCT:-60}
SEG_CRIT=${MEM_SEG_CRIT_PCT:-80}
COMP_WARN=${MEM_COMP_WARN_PCT:-38}
COMP_CRIT=${MEM_COMP_CRIT_PCT:-46}
LEVEL_WARN=${MEM_LEVEL_WARN_PCT:-20}
LEVEL_CRIT=${MEM_LEVEL_CRIT_PCT:-10}
AVAIL_FLOOR=${MEM_AVAIL_FLOOR_MB:-512}

# co-fator "memoria baixa": memorystatus_level quando disponivel (source correta),
# senao cai para o floor antigo em MB sobre FREE_INSTANT_MB (macOS sem o sysctl).
if [ "$MEMSTATUS_LEVEL" -ge 0 ]; then
  LOW_MEM_WARN=$([ "$MEMSTATUS_LEVEL" -le "$LEVEL_WARN" ] && echo 1 || echo 0)
  LOW_MEM_CRIT=$([ "$MEMSTATUS_LEVEL" -le "$LEVEL_CRIT" ] && echo 1 || echo 0)
else
  LOW_MEM_WARN=$([ "$FREE_INSTANT_MB" -lt "$AVAIL_FLOOR" ] && echo 1 || echo 0)
  LOW_MEM_CRIT=$([ "$FREE_INSTANT_MB" -lt "$AVAIL_FLOOR" ] && echo 1 || echo 0)
fi

LEVEL=OK; REASON=""
if [ "$SEG_PCT" -ge "$SEG_WARN" ] || [ "$COMP_PCT" -ge "$COMP_WARN" ] \
   || { [ "$COMP_PCT" -ge $(( COMP_WARN - 5 )) ] && [ "$LOW_MEM_WARN" -eq 1 ]; }; then
  LEVEL=WARN
  REASON="seg=${SEG_PCT}% comp=${COMP_PCT}% avail=${AVAIL_MB}MB(level=${MEMSTATUS_LEVEL}%) swap=${SWAP_MB}MB"
fi
if [ "$SEG_PCT" -ge "$SEG_CRIT" ] || [ "$COMP_PCT" -ge "$COMP_CRIT" ] \
   || { [ "$COMP_PCT" -ge $(( COMP_CRIT - 4 )) ] && [ "$LOW_MEM_CRIT" -eq 1 ]; }; then
  LEVEL=CRIT
  REASON="seg=${SEG_PCT}% comp=${COMP_PCT}% avail=${AVAIL_MB}MB(level=${MEMSTATUS_LEVEL}%) swap=${SWAP_MB}MB — zona do panic 2026-07-28"
fi

cat <<EOF
PAGESIZE=$PAGESIZE
RAM_MB=$RAM_MB
AVAIL_MB=$AVAIL_MB
MEMSTATUS_LEVEL=$MEMSTATUS_LEVEL
FREE_INSTANT_MB=$FREE_INSTANT_MB
COMP_MB=$COMP_MB
COMP_PCT=$COMP_PCT
SEG_TOTAL=$SEG_TOTAL
SEG_LIMIT=$SEG_LIMIT
SEG_PCT=$SEG_PCT
SWAP_MB=$SWAP_MB
CLAUDE_N=$CLAUDE_N
CODEX_N=$CODEX_N
NODE_N=$NODE_N
PROC_N=$PROC_N
LEVEL=$LEVEL
REASON="$REASON"
EOF
