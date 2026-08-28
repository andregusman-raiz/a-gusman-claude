#!/usr/bin/env bash
# canais-render.sh — wrapper: roda os geradores de view de todos os canais
# vivos (decisões, alertas, roadmap). Chamado pelo plist com.raiz.canais-render
# a cada 10 min. Tolerante a scripts ainda não criados por outros builders da
# reforma (alertas-render.sh / roadmap-render.sh) — nunca falha por ausência.
set -uo pipefail
# nota: sem "-e" aqui de propósito — cada gerador roda independente; um falhar
# não pode impedir os outros de rodar (ver loop abaixo).

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'EOF'
Uso: canais-render.sh

Sem argumentos. Roda, em sequência, cada gerador de view presente em
~/.claude/scripts/ (mesmo diretório deste script):

  decisoes-render.sh       docs/ai-state/terminais/DECISOES-PENDENTES.md
  alertas-render.sh        docs/ai-state/de-pr-queue/ALERTAS-ABERTOS.md
  roadmap-render.sh        docs/ai-state/de-pr-queue/ROADMAP.md
  conduta-check.sh         docs/ai-state/terminais/CONDUTA-SCORE.md (score por papel)
  bloqueios-notificar.sh   notifica papel bloqueador de decisao/registry (nao gera view)

decisoes-render.sh é o único obrigatório (propriedade deste builder);
os outros dois podem ainda não existir (outros builders da mesma
reforma) — ausência gera só uma linha em STDOUT (nunca stderr, para não
sujar o log de saúde do plist), nunca falha o wrapper. Exit code:
SEMPRE 0 — falha de um gerador individual não interrompe os demais nem
marca o job do launchd como falho (política "nunca falhe o ciclo
inteiro por causa de um canal").
EOF
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Avisos de AUSÊNCIA vão para STDOUT, não stderr: um script de outro builder
# ainda não entregue é estado TOLERADO/esperado durante a migração, não um
# erro operacional — o plist redireciona só stderr para o .err de saúde do
# job (ver PROVAS do contrato: .err vazio após execução normal). Erro real
# de um gerador (traceback, exit != 0 com o script presente) segue indo para
# stderr naturalmente, pois vem do próprio script chamado.
run_one() {
  local name="$1"
  local path="$SCRIPT_DIR/$name"
  if [[ -x "$path" ]]; then
    echo "== $name =="
    "$path" || echo "AVISO: $name terminou com erro (ver acima) — seguindo para o próximo canal" >&2
  else
    echo "== $name == AUSENTE em $SCRIPT_DIR — pulando (outro builder da reforma ainda não entregou; tolerado)"
  fi
}

run_one "decisoes-render.sh"
run_one "alertas-render.sh"
run_one "roadmap-render.sh"
run_one "conduta-check.sh"
run_one "bloqueios-notificar.sh"
run_one "ghost-agents-check.sh"

# "nunca falhe": o wrapper sempre sai 0 — sub-scripts ausentes são tolerados
# por design, e uma falha isolada de um gerador não deve derrubar o ciclo
# inteiro nem marcar o job do launchd como falho.
exit 0
