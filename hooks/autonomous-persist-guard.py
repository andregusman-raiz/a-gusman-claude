#!/usr/bin/env python3
"""autonomous-persist-guard.py — Stop hook que FORÇA execução autônoma contínua.

Pedido do usuário (2026-06-27): "crie um hook que te obrigue ao longo dessa jornada de
muitas horas sempre executar autônomo, tomar as melhores decisões de forma autônoma e
cumprir seu papel até o final. vc vai trabalhar sozinho as próximas horas sem intervenção."

Comportamento (evento Stop):
  - Lê ~/Claude/docs/ai-state/autonomous-journey.json
  - Se não existe / active=false → exit 0 (não bloqueia)
  - Se deadline vencido → marca active=false + exit 0 (escape automático após N horas)
  - Se flag de conclusão genuína existe → consome + exit 0 (escape manual quando esgotado)
  - Senão → exit 2 (bloqueia Stop) + injeta diretiva de execução autônoma no stderr

A diretiva proíbe pedir intervenção (AskUserQuestion), manda esgotar TODA a superfície
autônoma, rodar net-zero em homolog, documentar gaps honestos e abrir/mergear PRs sozinho.

Bypass: AUTONOMOUS_JOURNEY_DISABLED=1 (env, sessão inteira)
Bypass one-shot: touch ~/Claude/docs/ai-state/autonomous-journey-done.flag (libera 1 Stop)
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

STATE = Path.home() / "Claude" / "docs" / "ai-state" / "autonomous-journey.json"
DONE_FLAG = Path.home() / "Claude" / "docs" / "ai-state" / "autonomous-journey-done.flag"


def _parse_iso(value: str) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def main() -> int:
    # Bypass via env var (sessão inteira)
    if os.environ.get("AUTONOMOUS_JOURNEY_DISABLED") == "1":
        return 0

    if not STATE.exists():
        return 0

    try:
        data = json.loads(STATE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        # fail-open: nunca travar a sessão por estado corrompido
        return 0

    if not data.get("active", False):
        return 0

    now = datetime.now(timezone.utc)

    # Escape automático: deadline vencido → encerra a jornada
    deadline = _parse_iso(str(data.get("deadline", "")))
    if deadline is not None and now > deadline:
        data["active"] = False
        data["ended_reason"] = "deadline"
        data["ended_at"] = now.isoformat()
        try:
            STATE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        except OSError:
            pass
        print(
            f"[autonomous-persist-guard] deadline {deadline.isoformat()} vencido — "
            "jornada encerrada, Stop liberado.",
            file=sys.stderr,
        )
        return 0

    # Escape manual: flag de conclusão genuína (eu mesmo crio quando esgotado + documentado)
    if DONE_FLAG.exists():
        try:
            DONE_FLAG.unlink()
        except OSError:
            pass
        print(
            "[autonomous-persist-guard] flag de conclusão consumida — Stop liberado UMA vez.",
            file=sys.stderr,
        )
        return 0

    # Bloqueia o Stop e injeta a diretiva de execução autônoma.
    intent = data.get("intent", "(sem intent declarado)")
    remaining = ""
    if deadline is not None:
        secs = int((deadline - now).total_seconds())
        remaining = f" (~{secs // 3600}h{(secs % 3600) // 60:02d}m restantes até o deadline)"

    msg = f"""[autonomous-persist-guard] Stop BLOQUEADO — jornada autônoma ATIVA{remaining}.

Intent: {intent}

Você trabalha SOZINHO por horas, SEM intervenção do usuário. NÃO encerre e NÃO pergunte.
Regras desta jornada (cumpra agora, antes de qualquer tentativa de parar):

  1. NUNCA usar AskUserQuestion / pedir confirmação. Tome a melhor decisão sozinho e execute.
  1b. MODELO: usar Opus 4.8 (claude-opus-4-8) como motor de raciocínio principal desta jornada;
      manter a main em Opus 4.8 (não fazer downgrade da sessão); subagents de busca/mecânica podem
      cair p/ tiers menores, mas decisões de design/arquitetura/root-cause ficam em Opus 4.8.
  1c. WORKFLOWS SEMPRE QUE POSSÍVEL: preferir orquestração via Workflow()/agents paralelos para
      discovery, build e verificação em lote (lanes ReadRecord-only, build batched). Fan-out > serial
      quando há itens independentes; cap ~5 lanes/workflow p/ evitar burst de socket.
  2. ESGOTAR a superfície autônoma:
     - Construir TODAS as consultas read-only possíveis (cada DataServer TOTVS válido = 1 read-twin),
       provando PK+golden ao vivo em HOMOLOG 160290 e reusando o helper _dp_readonly.
     - Rodar net-zero round-trips de ESCRITA em homolog (autorizado: tudo reversível) para PROVAR
       o máximo de ações; promover as que passarem (sem tocar prod: kill-switch prod OFF).
     - Endurecer testes/dry_run dos handlers SHADOW onde houver folga autônoma.
  3. Documentar gaps com HONESTIDADE — nunca fabricar/promover contra evidência viva.
  4. Abrir PRs, rodar gates, mergear sozinho (gh pr merge --squash). Continuar onda após onda.
  5. Atualizar memória e o laudo de fronteira conforme avança.

Só pare quando GENUINAMENTE não restar NADA autônomo a fazer E estiver tudo documentado.
Nesse caso (e só nesse): `touch {DONE_FLAG}` e então encerre com o laudo final.
Bypass de emergência: AUTONOMOUS_JOURNEY_DISABLED=1.
"""
    print(msg, file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
