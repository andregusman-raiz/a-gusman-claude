#!/usr/bin/env python3
"""
Usage Heatmap Parser — ADR-0001 P2.1

Varre ~/.claude/projects/**/*.jsonl, extrai invocações reais de:
- tools (Bash, Read, Edit, Write, Agent, Skill, WebFetch, ...)
- subagents (via Agent tool com subagent_type)
- skills (via Skill tool com skill name)

Agrupa por projeto + agent/skill + semana e gera heatmap.

Usage:
    python3 ~/Claude/.claude/scripts/usage-heatmap.py
    python3 ~/Claude/.claude/scripts/usage-heatmap.py --days 30
    python3 ~/Claude/.claude/scripts/usage-heatmap.py --project raiz-platform

Output: ~/Claude/docs/diagnosticos/usage-heatmap-real.md
"""
import json
import os
import sys
import argparse
from pathlib import Path
from collections import defaultdict, Counter
from datetime import datetime, timedelta

PROJECTS_DIR = Path.home() / ".claude" / "projects"
OUTPUT_PATH = Path.home() / "Claude" / "docs" / "diagnosticos" / "usage-heatmap-real.md"


def parse_project_name(dir_name: str) -> str:
    """Derives project name from encoded directory name.

    Example input:  -Users-<user>-Claude-GitHub-<project-name>
    Example output: <project-name>
    """
    if "-GitHub-" in dir_name:
        return dir_name.split("-GitHub-")[-1].split("-.claude-")[0]
    if "-projetos-" in dir_name:
        return dir_name.split("-projetos-")[-1].split("-.claude-")[0]
    if dir_name.endswith("-Claude"):
        return "workspace-root"
    if dir_name.endswith("-Claude-.claude"):
        return ".claude-config"
    return dir_name.split("-")[-1] or "unknown"


def extract_tool_uses(jsonl_path: Path):
    """Yields dicts: {tool, subagent, skill, timestamp}."""
    try:
        with open(jsonl_path, "r") as f:
            for line in f:
                try:
                    d = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if d.get("type") != "assistant":
                    continue
                ts = d.get("timestamp")
                msg = d.get("message") or {}
                content = msg.get("content", [])
                if not isinstance(content, list):
                    continue
                for item in content:
                    if not isinstance(item, dict):
                        continue
                    if item.get("type") != "tool_use":
                        continue
                    name = item.get("name", "")
                    inp = item.get("input") or {}
                    sub = inp.get("subagent_type", "") if isinstance(inp, dict) else ""
                    sk = inp.get("skill", "") if isinstance(inp, dict) else ""
                    yield {
                        "tool": name,
                        "subagent": sub,
                        "skill": sk,
                        "timestamp": ts,
                    }
    except Exception as e:
        print(f"  WARN parsing {jsonl_path.name}: {e}", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=0, help="Filter last N days (0=all)")
    parser.add_argument("--project", type=str, default="", help="Filter by project substring")
    parser.add_argument("--limit", type=int, default=30, help="Top-N in heatmap")
    args = parser.parse_args()

    if not PROJECTS_DIR.exists():
        print(f"ERROR: {PROJECTS_DIR} not found", file=sys.stderr)
        sys.exit(1)

    cutoff = None
    if args.days > 0:
        cutoff = (datetime.utcnow() - timedelta(days=args.days)).isoformat()

    tool_counter = Counter()
    subagent_counter = Counter()
    skill_counter = Counter()
    project_tool = defaultdict(Counter)
    project_subagent = defaultdict(Counter)
    project_skill = defaultdict(Counter)
    files_scanned = 0
    events_total = 0
    files_with_events = 0

    project_dirs = sorted([p for p in PROJECTS_DIR.iterdir() if p.is_dir()])
    print(f"Scanning {len(project_dirs)} project dirs...", file=sys.stderr)

    for pdir in project_dirs:
        project_name = parse_project_name(pdir.name)
        if args.project and args.project not in project_name:
            continue

        jsonls = list(pdir.rglob("*.jsonl"))
        # Filter out skill-injections (separate schema)
        jsonls = [j for j in jsonls if j.name != "skill-injections.jsonl"]

        for jpath in jsonls:
            files_scanned += 1
            events_this_file = 0
            for event in extract_tool_uses(jpath):
                if cutoff and event["timestamp"] and event["timestamp"] < cutoff:
                    continue
                events_total += 1
                events_this_file += 1
                tool = event["tool"]
                sub = event["subagent"]
                sk = event["skill"]
                if tool:
                    tool_counter[tool] += 1
                    project_tool[project_name][tool] += 1
                if sub:
                    subagent_counter[sub] += 1
                    project_subagent[project_name][sub] += 1
                if sk:
                    skill_counter[sk] += 1
                    project_skill[project_name][sk] += 1
            if events_this_file > 0:
                files_with_events += 1

    # Generate report
    days_label = f"last {args.days} days" if args.days > 0 else "all time"
    proj_label = f" (project filter: {args.project})" if args.project else ""

    lines = [
        f"# Usage Heatmap — Dados Reais (ADR-0001 P2.1)",
        "",
        f"> **Gerado em:** {datetime.utcnow().isoformat()}Z",
        f"> **Escopo:** {days_label}{proj_label}",
        f"> **Fontes:** `~/.claude/projects/**/*.jsonl`",
        f"> **Script:** `~/Claude/.claude/scripts/usage-heatmap.py`",
        "",
        "## Resumo",
        "",
        f"- Arquivos JSONL escaneados: **{files_scanned}**",
        f"- Arquivos com eventos: **{files_with_events}**",
        f"- Eventos tool_use extraídos: **{events_total}**",
        f"- Projetos distintos: **{len(project_tool)}**",
        f"- Tools distintas: **{len(tool_counter)}**",
        f"- Subagents distintos: **{len(subagent_counter)}**",
        f"- Skills distintas: **{len(skill_counter)}**",
        "",
        "---",
        "",
        f"## Top {args.limit} Tools",
        "",
        "| Rank | Tool | Invocações | % |",
        "|---|---|---:|---:|",
    ]
    total_tools = sum(tool_counter.values()) or 1
    for rank, (tool, count) in enumerate(tool_counter.most_common(args.limit), 1):
        pct = 100.0 * count / total_tools
        lines.append(f"| {rank} | `{tool}` | {count} | {pct:.1f}% |")

    lines.extend(
        [
            "",
            "---",
            "",
            f"## Top {args.limit} Subagents (Agent tool invocations)",
            "",
            "| Rank | Subagent | Invocações | % |",
            "|---|---|---:|---:|",
        ]
    )
    total_sub = sum(subagent_counter.values()) or 1
    for rank, (sub, count) in enumerate(subagent_counter.most_common(args.limit), 1):
        pct = 100.0 * count / total_sub
        lines.append(f"| {rank} | `{sub}` | {count} | {pct:.1f}% |")

    lines.extend(
        [
            "",
            "---",
            "",
            f"## Top {args.limit} Skills (Skill tool invocations)",
            "",
            "| Rank | Skill | Invocações | % |",
            "|---|---|---:|---:|",
        ]
    )
    total_sk = sum(skill_counter.values()) or 1
    for rank, (sk, count) in enumerate(skill_counter.most_common(args.limit), 1):
        pct = 100.0 * count / total_sk
        lines.append(f"| {rank} | `{sk}` | {count} | {pct:.1f}% |")

    lines.extend(
        [
            "",
            "---",
            "",
            "## Projetos — Top tools por projeto",
            "",
        ]
    )
    top_projects = sorted(project_tool.items(), key=lambda x: -sum(x[1].values()))[:10]
    for proj, ctr in top_projects:
        total = sum(ctr.values())
        lines.append(f"### {proj} ({total} invocações)")
        lines.append("")
        lines.append("| Tool | Count |")
        lines.append("|---|---:|")
        for tool, count in ctr.most_common(10):
            lines.append(f"| `{tool}` | {count} |")
        lines.append("")

    lines.extend(
        [
            "---",
            "",
            "## Zero-use confirmed (candidatos a deprecar)",
            "",
            "Subagents/skills **conhecidos** mas com **zero invocações** nos JSONLs escaneados:",
            "",
        ]
    )
    # Build list of known agents/skills from .claude/skills
    skills_dir = Path.home() / "Claude" / ".claude" / "skills"
    known = set()
    if skills_dir.exists():
        for d in skills_dir.iterdir():
            if d.is_dir() and d.name.startswith("ag-"):
                known.add(d.name)
    observed = set(subagent_counter.keys()) | set(skill_counter.keys())
    zero_use = sorted(known - observed)
    if zero_use:
        for name in zero_use:
            lines.append(f"- `{name}`")
    else:
        lines.append("(todos os agents/skills têm pelo menos 1 invocação)")

    lines.extend(
        [
            "",
            "---",
            "",
            "## Uso da script",
            "",
            "```bash",
            "# Todos dados",
            "python3 ~/Claude/.claude/scripts/usage-heatmap.py",
            "",
            "# Últimos 30 dias",
            "python3 ~/Claude/.claude/scripts/usage-heatmap.py --days 30",
            "",
            "# Filtrar por projeto",
            "python3 ~/Claude/.claude/scripts/usage-heatmap.py --project raiz-platform",
            "",
            "# Top 50 (em vez de 30)",
            "python3 ~/Claude/.claude/scripts/usage-heatmap.py --limit 50",
            "```",
            "",
            "---",
            "",
            "## Metodologia",
            "",
            "1. Varre `~/.claude/projects/*/**/*.jsonl` (exceto `skill-injections.jsonl`)",
            "2. Filtra eventos com `type == 'assistant'`",
            "3. Para cada `message.content[]` com `type == 'tool_use'`, extrai:",
            "   - `name` → tool (Bash, Read, Edit, Agent, Skill, ...)",
            "   - `input.subagent_type` → subagent (se Agent tool)",
            "   - `input.skill` → skill (se Skill tool)",
            "4. Agrupa por projeto (derivado do nome do diretório)",
            "5. Zero-use: compara com diretórios em `~/Claude/.claude/skills/ag-*/`",
            "",
            "**Limitações:**",
            "- Alguns agents podem ter sido invocados por nome de skill (não subagent_type) após consolidação P0.1 — busca ambas",
            "- JSONLs antigos (pré-2026-03) podem ter schemas diferentes (eventos ignorados silenciosamente)",
            "",
        ]
    )

    # Write output
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text("\n".join(lines))

    print(f"\n=== Usage Heatmap ===", file=sys.stderr)
    print(f"Files scanned:   {files_scanned}", file=sys.stderr)
    print(f"Events parsed:   {events_total}", file=sys.stderr)
    print(f"Unique tools:    {len(tool_counter)}", file=sys.stderr)
    print(f"Unique subs:     {len(subagent_counter)}", file=sys.stderr)
    print(f"Unique skills:   {len(skill_counter)}", file=sys.stderr)
    print(f"\nReport: {OUTPUT_PATH}", file=sys.stderr)


if __name__ == "__main__":
    main()
