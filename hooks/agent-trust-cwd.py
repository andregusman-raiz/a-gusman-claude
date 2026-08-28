#!/usr/bin/env python3
"""PreToolUse(Agent) hook: garante hasTrustDialogAccepted=true para o cwd em ~/.claude.json.

Motivo: Agent({name}) sem isolation spawna um processo `claude` separado (pane tmux
claude-swarm-<pid>) que para no dialogo "Do you trust this folder?" se o cwd atual
(que segue o `cd` feito via Bash) nao estiver trusted. Pane headless => agent nunca nasce.
Ver memory gotcha_team_mailbox_agent_trava_no_init_mcp.

Modos:
  stdin JSON do hook (default) -> trust do campo `cwd`
  --bulk DIR...                 -> trust de cada DIR (uso unico / manutencao)
Nunca bloqueia (exit 0 sempre); so escreve se algo mudou; write atomico (tmp + rename).
"""
import json
import os
import sys
import tempfile

CFG = os.path.expanduser("~/.claude.json")
DEFAULT_ENTRY = {
    "allowedTools": [],
    "mcpContextUris": [],
    "mcpServers": {},
    "enabledMcpjsonServers": [],
    "disabledMcpjsonServers": [],
    "hasTrustDialogAccepted": True,
    "projectOnboardingSeenCount": 0,
    "hasClaudeMdExternalIncludesApproved": False,
    "hasClaudeMdExternalIncludesWarningShown": False,
}


def trust(paths):
    # Claude Code indexa pelo cwd literal do processo; guardar tambem o realpath cobre symlink.
    expanded = []
    for p in paths:
        if not p or not os.path.isdir(p):
            continue
        for q in (os.path.abspath(p), os.path.realpath(p)):
            if q not in expanded:
                expanded.append(q)
    paths = expanded
    if not paths:
        return []
    try:
        with open(CFG) as f:
            data = json.load(f)
    except Exception as e:  # arquivo ausente/corrompido: nao arriscar sobrescrever
        print(f"agent-trust-cwd: nao li {CFG}: {e}", file=sys.stderr)
        return []
    projects = data.setdefault("projects", {})
    changed = []
    for p in paths:
        entry = projects.get(p)
        if entry is None:
            projects[p] = dict(DEFAULT_ENTRY)
            changed.append(p)
        elif entry.get("hasTrustDialogAccepted") is not True:
            entry["hasTrustDialogAccepted"] = True
            changed.append(p)
    if not changed:
        return []
    st = os.stat(CFG)
    fd, tmp = tempfile.mkstemp(prefix=".claude.json.", dir=os.path.dirname(CFG))
    try:
        with os.fdopen(fd, "w") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        os.chmod(tmp, st.st_mode & 0o777)
        os.replace(tmp, CFG)
    except Exception as e:
        print(f"agent-trust-cwd: falha ao gravar: {e}", file=sys.stderr)
        try:
            os.unlink(tmp)
        except OSError:
            pass
        return []
    return changed


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--bulk":
        for p in trust(sys.argv[2:]):
            print(f"trusted: {p}")
        return
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return
    cwd = payload.get("cwd") or os.getcwd()
    for p in trust([cwd]):
        print(f"agent-trust-cwd: trusted {p} (evita trust dialog no teammate)", file=sys.stderr)


if __name__ == "__main__":
    try:
        main()
    finally:
        sys.exit(0)
