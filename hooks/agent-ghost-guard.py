#!/usr/bin/env python3
"""agent-ghost-guard.py — PreToolUse(Agent): impede o spawn nomeado que nao nasce.

Medido 2026-08-28: `Agent` com campo `name` (Team/mailbox) devolveu
"Spawned successfully... running" em ~1s para **7 de 7** agentes que nunca
existiram — inbox com 0 itens, ausentes do config.json do time, zero transcript
no disco, um deles "rodando" 11h sem um unico evento. No mesmo dia, `Task`/
subagent nativo (sem `name`) concluiu **16 de 16**. A varredura completa achou
29 ghosts em 48h, em 5 sessoes distintas — nao e problema de um papel, e do
mecanismo.

O ack do spawn confirma ENFILEIRAMENTO, nao execucao. O coordenador acha que
delegou, espera resultado que nao vem, e inventa causa para o silencio
("travou no dialogo", "esta lendo arquivo grande"). E verde por ausencia de
erro na camada de orquestracao — o pior tipo, porque nada falha.

A regra estava escrita em 16 contratos de papel e isso NAO basta: "uma decisao
por vez" tambem estava em 5 arquivos e o ranking rodou uma unica vez no dia.
Regra que depende de disciplina de LLM em loop regride a cada reativacao.

Este guard NAO proibe `name` — ele existe legitimamente para conversar com o
agente depois (SendMessage). O guard exige que quem usa `name` declare que vai
PROVAR o nascimento, via env AGENT_NAME_OK=1, e lembra como provar.

Bypass: AGENT_NAME_OK=1 (por chamada) | AGENT_GHOST_GUARD_DISABLED=1 (sessao)
"""

import json
import os
import sys


def main():
    if os.environ.get("AGENT_GHOST_GUARD_DISABLED") == "1":
        return 0
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0

    ti = payload.get("tool_input") or {}
    nome = (ti.get("name") or "").strip()
    if not nome:
        return 0  # caminho nativo, o que funciona: 16/16

    if os.environ.get("AGENT_NAME_OK") == "1":
        print(
            f"[ghost-guard] spawn nomeado '{nome}' liberado por AGENT_NAME_OK=1. "
            f"Prove o nascimento em ~60s (transcript novo em ~/.claude/projects/<cwd>/ "
            f"ou arquivo da propriedade dele) — o ack nao e prova.",
            file=sys.stderr,
        )
        return 0

    print(
        f"BLOQUEADO pelo agent-ghost-guard: Agent com name='{nome}'.\n"
        f"\n"
        f"Medido em 28/08: spawn nomeado devolveu ack de sucesso para 0 de 7 agentes\n"
        f"que NUNCA nasceram (inbox vazia, zero transcript, um 'rodando' 11h sem\n"
        f"nenhum evento). Task/subagent nativo, sem name: 16/16 concluiram.\n"
        f"Varredura de 48h: 29 ghosts em 5 sessoes.\n"
        f"\n"
        f"Se o agente so precisa ENTREGAR: remova o campo `name`.\n"
        f"Se precisa conversar depois (SendMessage), rode assim e PROVE o nascimento:\n"
        f"  AGENT_NAME_OK=1  (e em ~60s: transcript novo em ~/.claude/projects/<cwd>/\n"
        f"                    ou `stat -f %SB` num arquivo da propriedade dele)\n"
        f"Agente com zero evento e ghost, nao lento: some com o tempo em vez de aparecer.\n"
        f"Checar ghosts existentes: ~/.claude/scripts/ghost-agents-check.sh",
        file=sys.stderr,
    )
    return 2


if __name__ == "__main__":
    sys.exit(main())
