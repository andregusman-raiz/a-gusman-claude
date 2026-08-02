#!/usr/bin/env python3
"""prefer-workflows-guard.py — UserPromptSubmit hook que injeta a diretiva de DELEGAÇÃO.

Pedido do usuário (2026-06-28): "spawn agents e subagents e workflows sempre que possivel.
coloque um hook para garantir essa premissa sempre."

Comportamento (evento UserPromptSubmit):
  - Imprime no stdout (additive context, exit 0) uma diretiva curta que obriga a preferir
    Agent/subagents/Workflow para QUALQUER tarefa não-trivial, antes de trabalhar solo.
  - Não bloqueia nada (exit 0); é um reforço de roteamento, não um gate.

A diretiva resume a Matriz de Decisão do workspace (Skill/Agent/Workflow/Team) e o padrão
de fan-out: read-only paralelo livre; escrita paralela no mesmo repo = worktree obrigatório.

Bypass (sessão): PREFER_WORKFLOWS_DISABLED=1
"""

from __future__ import annotations

import os
import sys

DIRECTIVE = (
    "<system-reminder>\n"
    "DELEGAÇÃO OBRIGATÓRIA (premissa permanente do usuário): antes de trabalhar solo, "
    "pergunte 'isto pode ser um Agent/subagent/Workflow?'. Para QUALQUER tarefa não-trivial "
    "— busca/leitura multi-arquivo, build/fix/refactor, review, análise cross-subsistema, "
    "migração, auditoria, ou qualquer trabalho multi-step — SPAWNE em vez de fazer inline:\n"
    "- 1 busca/análise read-only ampla → Agent (Explore/general-purpose), passando PATHS.\n"
    "- N tarefas read-only independentes → N Agents em paralelo (1 mensagem, vários tool-uses).\n"
    "- decompor+cobrir, comparar abordagens, review adversarial, varrer escala → Workflow "
    "(fan-out parallel/pipeline + síntese), opt-in já dado pelo usuário ('sempre que possível').\n"
    "- N escritas paralelas no MESMO repo → worktree por teammate OBRIGATÓRIO (/ag-team-safe).\n"
    "Solo só em: turno conversacional, fato único que você já sabe, ou edição mecânica trivial. "
    "Relaye a CONCLUSÃO dos agents, nunca os dumps. Bypass: PREFER_WORKFLOWS_DISABLED=1.\n"
    "</system-reminder>"
)


def main() -> int:
    if os.environ.get("PREFER_WORKFLOWS_DISABLED") == "1":
        return 0
    # stdout em UserPromptSubmit (exit 0) é anexado ao contexto do turno.
    sys.stdout.write(DIRECTIVE + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
