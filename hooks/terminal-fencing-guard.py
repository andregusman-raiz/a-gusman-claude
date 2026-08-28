#!/usr/bin/env python3
"""terminal-fencing-guard.py — PreToolUse(Write|Edit|MultiEdit).

Fencing token para canais de ESCRITOR UNICO do cockpit de terminais.

Problema que resolve (auditoria 2026-08-27, P0.3): o watchdog pode concluir que
um papel tier 0 morreu e reabri-lo (`revive`), mas por politica NUNCA mata
processo. Se o detector errar, passam a existir duas instancias do mesmo papel
— e as duas escrevem no manifesto da fila. O dano do split-brain nao e "duas
sessoes abertas", e "dois donos do QUEUE.md/claims.json".

O registry ja guarda qual instancia detem o papel (`workspace_uuid`). O cmux
exporta a identidade do pane em `CMUX_WORKSPACE_ID`. Este guard so compara os
dois: quem nao e a instancia registrada nao escreve no canal exclusivo.

Regras (deliberadamente estreitas — guard que bloqueia demais e desligado):
  - Path fora de `canais_exclusivos` do registry -> passa.
  - Papel sem `workspace_uuid` no registry (fechado) -> passa: ninguem detem.
  - Sem `CMUX_WORKSPACE_ID` no ambiente (sessao remota/cloud/headless) -> passa
    com AVISO em stderr. Bloquear aqui quebraria peers legitimos fora do cmux.
  - `CMUX_WORKSPACE_ID` != `workspace_uuid` registrado -> BLOQUEIA (exit 2).

Bypass: TERMINAL_FENCING_DISABLED=1
"""

import json
import os
import sys

REGISTRY = os.path.expanduser("~/Claude/docs/ai-state/terminais/registry.json")
WORKSPACE_ROOT = os.path.expanduser("~/Claude")


def read_payload():
    try:
        return json.load(sys.stdin)
    except Exception:
        return {}


def target_path(payload):
    ti = payload.get("tool_input") or {}
    for key in ("file_path", "path", "notebook_path"):
        if ti.get(key):
            return ti[key]
    return None


def main():
    if os.environ.get("TERMINAL_FENCING_DISABLED") == "1":
        return 0

    path = target_path(read_payload())
    if not path:
        return 0

    try:
        with open(REGISTRY) as f:
            reg = json.load(f)
    except Exception:
        return 0  # sem registry nao ha o que cercar; guard nunca bloqueia por falta de dado

    canais = reg.get("canais_exclusivos") or {}
    if not canais:
        return 0

    try:
        abs_path = os.path.realpath(os.path.expanduser(path))
    except Exception:
        return 0

    dono = None
    canal_rel = None
    for rel, papel in canais.items():
        if abs_path == os.path.realpath(os.path.join(WORKSPACE_ROOT, rel)):
            dono, canal_rel = papel, rel
            break
    if not dono:
        return 0

    entry = (reg.get("terminais") or {}).get(dono) or {}
    registrado = entry.get("workspace_uuid")
    if not registrado:
        return 0  # papel fechado: canal sem dono vivo

    atual = os.environ.get("CMUX_WORKSPACE_ID")
    if not atual:
        print(
            f"[fencing] AVISO: escrevendo em {canal_rel} (canal exclusivo de {dono}) "
            f"de uma sessao sem CMUX_WORKSPACE_ID. Nao consigo provar que voce e a "
            f"instancia registrada do papel. Confirme antes de gravar.",
            file=sys.stderr,
        )
        return 0

    if atual == registrado:
        return 0

    print(
        f"[fencing] BLOQUEADO: {canal_rel} e canal de escritor unico do papel {dono}.\n"
        f"  instancia registrada : {registrado}\n"
        f"  esta sessao          : {atual}\n"
        f"Voce nao e a instancia que detem {dono}. Escrever aqui e o dano real do\n"
        f"split-brain (dois donos do manifesto). Caminhos corretos:\n"
        f"  - registre em docs/ai-state/de-pr-queue/ALERTAS.md (multi-writer, e o canal de decisao); ou\n"
        f"  - fale com o papel: ~/.claude/scripts/terminal-send.sh {dono} \"<msg>\"; ou\n"
        f"  - se {dono} morreu de verdade, reabra pelo registry "
        f"(~/.claude/scripts/terminal-open.sh {dono}) em vez de escrever no lugar dele.\n"
        f"Bypass consciente: TERMINAL_FENCING_DISABLED=1",
        file=sys.stderr,
    )
    return 2


if __name__ == "__main__":
    sys.exit(main())
