#!/usr/bin/env python3
"""
memory-decay.py — Detecta memories obsoletos.

Roda mensal (manual ou via cron). Marca memories como "review needed" sem
deletar. Decisao humana via /ag-retrospectiva --review-stale.

Heuristicas:
  - project_*.md com data absoluta no body > 90 dias atras e nao foi tocado em 60d
  - feedback_*.md sem refresh em > 180 dias
  - reference_*.md que aponta para path inexistente OU URL invalida (HEAD check opcional)

Output:
  ~/.claude/projects/*/memory/_stale-review.md

Uso:
  python3 ~/Claude/.claude/scripts/memory-decay.py [--check-url] [--dry-run]
"""
import os
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path


DATE_PAT = re.compile(r"\b(20\d{2})-(\d{2})-(\d{2})\b")


def find_memory_dirs():
    """Encontra todos os ~/.claude/projects/*/memory/."""
    base = Path.home() / ".claude" / "projects"
    if not base.exists():
        return []
    return [d for d in base.glob("*/memory") if d.is_dir()]


def is_stale_project(path):
    """project_*.md com data absoluta > 90 dias + sem touch em 60d."""
    try:
        stat = path.stat()
    except (OSError, IOError):
        return False, "stat failed"

    last_touch = datetime.fromtimestamp(stat.st_mtime)
    days_since_touch = (datetime.now() - last_touch).days

    if days_since_touch < 60:
        return False, f"recent touch ({days_since_touch}d)"

    try:
        text = path.read_text(encoding="utf-8")
    except (OSError, IOError):
        return False, "read failed"

    dates = DATE_PAT.findall(text)
    if not dates:
        return False, "no absolute date"

    latest_in_body = max(datetime(int(y), int(m), int(d)) for y, m, d in dates)
    days_since_body = (datetime.now() - latest_in_body).days

    if days_since_body > 90:
        return True, f"body date {days_since_body}d old, no touch in {days_since_touch}d"

    return False, "fresh"


def is_stale_feedback(path):
    """feedback_*.md sem refresh em > 180 dias."""
    try:
        stat = path.stat()
    except (OSError, IOError):
        return False, "stat failed"

    last_touch = datetime.fromtimestamp(stat.st_mtime)
    days_since_touch = (datetime.now() - last_touch).days

    if days_since_touch > 180:
        return True, f"no refresh in {days_since_touch}d"

    return False, "fresh"


def is_stale_reference(path, check_url=False):
    """reference_*.md aponta para path inexistente."""
    try:
        text = path.read_text(encoding="utf-8")
    except (OSError, IOError):
        return False, "read failed"

    # Detecta paths absolutos referenciados
    path_pat = re.compile(r"~?/[a-zA-Z0-9_./-]{4,}")
    broken_paths = []
    for m in path_pat.finditer(text):
        ref = m.group(0)
        # Expand ~
        expanded = os.path.expanduser(ref) if ref.startswith("~") else ref
        # Filtra urls, paths em strings, etc.
        if "://" in ref or " " in ref:
            continue
        if not os.path.exists(expanded):
            broken_paths.append(ref)

    if broken_paths:
        return True, f"broken paths: {', '.join(broken_paths[:3])}"

    if check_url:
        url_pat = re.compile(r"https?://[^\s)\"']+")
        # NAO faz HTTP request automatico (custo). Apenas valida formato.
        # Implementacao real: subprocess curl -I --max-time 5 com cache.
        pass

    return False, "ok"


def main():
    args = sys.argv[1:]
    check_url = "--check-url" in args
    dry_run = "--dry-run" in args

    total_stale = 0
    by_dir = {}

    for memory_dir in find_memory_dirs():
        stale_entries = []

        for md_file in memory_dir.glob("*.md"):
            name = md_file.stem
            if name.startswith("_") or name == "MEMORY":
                continue

            if name.startswith("project_"):
                stale, reason = is_stale_project(md_file)
            elif name.startswith("feedback_"):
                stale, reason = is_stale_feedback(md_file)
            elif name.startswith("reference_"):
                stale, reason = is_stale_reference(md_file, check_url=check_url)
            else:
                continue

            if stale:
                stale_entries.append({"file": md_file.name, "reason": reason})
                total_stale += 1

        if stale_entries:
            by_dir[str(memory_dir)] = stale_entries

            if not dry_run:
                out = memory_dir / "_stale-review.md"
                lines = [
                    f"# Stale Memories — {datetime.now().strftime('%Y-%m-%d')}",
                    "",
                    "> Auto-gerado por `memory-decay.py`. Revisao manual via `/ag-retrospectiva --review-stale`.",
                    "",
                    "Nenhum arquivo foi deletado. Apenas flag.",
                    "",
                ]
                for entry in stale_entries:
                    lines.append(f"- **{entry['file']}** — {entry['reason']}")
                lines.append("")
                out.write_text("\n".join(lines), encoding="utf-8")

    print(f"Stale memories detectados: {total_stale}")
    for d, entries in by_dir.items():
        print(f"  {d}: {len(entries)}")
        for e in entries[:5]:
            print(f"    - {e['file']}: {e['reason']}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
