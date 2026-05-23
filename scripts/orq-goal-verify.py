#!/usr/bin/env python3
"""orq-goal-verify.py — Avalia checks declarativos de orq-goal-active.json.

Lê o arquivo de goal ativo (path via argv[1]) e roda cada check declarado.
Output: JSON com {ok, pending, failed, passed} no stdout.

Tipos de check suportados:
  - gh_pr_open: verifica se há PR aberto matching head_branch (e opcionalmente repo)
  - gh_pr_merged: PR merged (pode exigir status=success)
  - file_exists: arquivo existe no filesystem
  - score_threshold: lê campo em state file JSON e compara com min
  - phase_done: lê orq-goal-{slug}.json e checa phases[id].status == "done"
  - deploy_url_active: HTTP 200 em URL
  - command_success: executa shell command e checa exit 0

Bypass por check: cada check pode ter "skip": true no JSON → conta como pass.

Usage:
  python3 orq-goal-verify.py /path/to/orq-goal-active.json
  python3 orq-goal-verify.py --pending /path/to/orq-goal-active.json  (lista só pendentes em texto)

Exit codes:
  0 = sucesso (verificação rodou, output em stdout)
  1 = erro de leitura/parse
"""

from __future__ import annotations

import json
import os
import shlex
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any


def _run(cmd: str, timeout: int = 15) -> tuple[int, str]:
    try:
        result = subprocess.run(
            shlex.split(cmd),
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return result.returncode, (result.stdout or "") + (result.stderr or "")
    except subprocess.TimeoutExpired:
        return 124, "timeout"
    except FileNotFoundError as e:
        return 127, str(e)


def check_gh_pr_open(args: dict[str, Any]) -> tuple[bool, str]:
    head_branch = args.get("head_branch")
    if not head_branch:
        return False, "head_branch ausente"
    repo_arg = f"--repo {args['repo']} " if args.get("repo") else ""
    cmd = f"gh pr list {repo_arg}--head {shlex.quote(head_branch)} --state open --json number,url --limit 1"
    code, out = _run(cmd, timeout=20)
    if code != 0:
        return False, f"gh exit {code}: {out.strip()[:120]}"
    try:
        data = json.loads(out or "[]")
    except json.JSONDecodeError:
        return False, "gh output não-JSON"
    if isinstance(data, list) and len(data) > 0:
        return True, f"PR #{data[0].get('number')} aberto"
    return False, "nenhum PR aberto match"


def check_gh_pr_merged(args: dict[str, Any]) -> tuple[bool, str]:
    pr_number = args.get("pr_number")
    head_branch = args.get("head_branch")
    repo_arg = f"--repo {args['repo']} " if args.get("repo") else ""
    if pr_number:
        cmd = f"gh pr view {repo_arg}{pr_number} --json state,mergedAt"
    elif head_branch:
        cmd = f"gh pr list {repo_arg}--head {shlex.quote(head_branch)} --state merged --json number,mergedAt --limit 1"
    else:
        return False, "pr_number ou head_branch ausente"
    code, out = _run(cmd, timeout=20)
    if code != 0:
        return False, f"gh exit {code}"
    try:
        data = json.loads(out or "{}")
    except json.JSONDecodeError:
        return False, "gh output não-JSON"
    if pr_number:
        return (data.get("state") == "MERGED"), f"state={data.get('state')}"
    if isinstance(data, list) and data:
        return True, f"PR #{data[0].get('number')} merged"
    return False, "nenhum PR merged match"


def check_file_exists(args: dict[str, Any]) -> tuple[bool, str]:
    path_str = args.get("path")
    if not path_str:
        return False, "path ausente"
    p = Path(os.path.expanduser(path_str))
    if p.exists():
        return True, f"existe ({p.stat().st_size}B)"
    return False, "não existe"


def check_score_threshold(args: dict[str, Any]) -> tuple[bool, str]:
    file_path = args.get("file")
    field = args.get("field")
    minimum = args.get("min")
    if not file_path or not field or minimum is None:
        return False, "file/field/min ausente"
    p = Path(os.path.expanduser(file_path))
    if not p.exists():
        return False, f"file não existe: {file_path}"
    try:
        data = json.loads(p.read_text())
    except (OSError, json.JSONDecodeError) as e:
        return False, f"erro lendo {file_path}: {e}"
    # field como "a.b.c" ou ".a.b.c"
    keys = [k for k in field.lstrip(".").split(".") if k]
    val: Any = data
    for k in keys:
        if isinstance(val, dict) and k in val:
            val = val[k]
        else:
            return False, f"field {field} não encontrado"
    try:
        if float(val) >= float(minimum):
            return True, f"{field}={val} >= {minimum}"
        return False, f"{field}={val} < {minimum}"
    except (TypeError, ValueError):
        return False, f"valor não numérico: {val}"


def check_phase_done(args: dict[str, Any]) -> tuple[bool, str]:
    state_file = args.get("state_file")
    phase_id = args.get("phase_id")
    if not state_file or phase_id is None:
        return False, "state_file/phase_id ausente"
    p = Path(os.path.expanduser(state_file))
    if not p.is_absolute():
        p = Path.home() / "Claude" / "docs" / "ai-state" / state_file
    if not p.exists():
        return False, f"state_file não existe: {p}"
    try:
        data = json.loads(p.read_text())
    except (OSError, json.JSONDecodeError) as e:
        return False, f"erro lendo: {e}"
    phases = data.get("phases", [])
    for phase in phases:
        if phase.get("id") == phase_id:
            status = phase.get("status")
            return (status == "done"), f"phase {phase_id} status={status}"
    return False, f"phase {phase_id} não encontrada"


def check_deploy_url_active(args: dict[str, Any]) -> tuple[bool, str]:
    url = args.get("url")
    expected_status = args.get("expected_status", 200)
    if not url:
        return False, "url ausente"
    try:
        req = urllib.request.Request(url, method="HEAD")
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status == expected_status:
                return True, f"HTTP {resp.status}"
            return False, f"HTTP {resp.status} != {expected_status}"
    except urllib.error.HTTPError as e:
        if e.code == expected_status:
            return True, f"HTTP {e.code}"
        return False, f"HTTPError {e.code}"
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        return False, f"connection error: {e}"


def check_command_success(args: dict[str, Any]) -> tuple[bool, str]:
    cmd = args.get("command")
    if not cmd:
        return False, "command ausente"
    code, out = _run(cmd, timeout=int(args.get("timeout", 30)))
    if code == 0:
        return True, "exit 0"
    return False, f"exit {code}: {out.strip()[:100]}"


CHECKERS = {
    "gh_pr_open": check_gh_pr_open,
    "gh_pr_merged": check_gh_pr_merged,
    "file_exists": check_file_exists,
    "score_threshold": check_score_threshold,
    "phase_done": check_phase_done,
    "deploy_url_active": check_deploy_url_active,
    "command_success": check_command_success,
}


def main() -> int:
    args = sys.argv[1:]
    pending_only = False
    if "--pending" in args:
        pending_only = True
        args.remove("--pending")
    if not args:
        print(json.dumps({"ok": False, "error": "missing goal_file path"}))
        return 1
    goal_file = Path(args[0])
    if not goal_file.exists():
        print(json.dumps({"ok": False, "error": f"goal file not found: {goal_file}"}))
        return 1
    try:
        goal = json.loads(goal_file.read_text())
    except (OSError, json.JSONDecodeError) as e:
        print(json.dumps({"ok": False, "error": f"parse error: {e}"}))
        return 1

    checks = goal.get("checks", [])
    passed: list[dict[str, Any]] = []
    pending: list[dict[str, Any]] = []
    failed: list[dict[str, Any]] = []

    for check in checks:
        check_type = check.get("type", "unknown")
        if check.get("skip"):
            passed.append({"type": check_type, "detail": "skipped"})
            continue
        # status pré-marcado pelo agente conta como autoritativo
        prior_status = check.get("status")
        if prior_status == "pass":
            passed.append({"type": check_type, "detail": "marked pass by orchestrator"})
            continue
        checker = CHECKERS.get(check_type)
        if not checker:
            failed.append({"type": check_type, "detail": f"unknown check type"})
            continue
        try:
            ok, detail = checker(check.get("args", {}))
        except Exception as e:  # noqa: BLE001
            failed.append({"type": check_type, "detail": f"exception: {e}"})
            continue
        entry = {"type": check_type, "detail": detail}
        if ok:
            passed.append(entry)
        elif prior_status == "fail":
            failed.append(entry)
        else:
            pending.append(entry)

    all_ok = len(pending) == 0 and len(failed) == 0 and len(checks) > 0
    result = {
        "ok": all_ok,
        "passed": passed,
        "pending": pending,
        "failed": failed,
        "total_checks": len(checks),
    }

    if pending_only:
        for item in pending:
            print(f"{item['type']}: {item['detail']}")
        return 0

    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    sys.exit(main())
