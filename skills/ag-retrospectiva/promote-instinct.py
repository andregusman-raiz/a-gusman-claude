#!/usr/bin/env python3
"""
promote-instinct.py — Bridge entre _instinct-candidates.md e memory tipado.

Le ~/.claude/projects/*/memory/_instinct-candidates.md, apresenta cada
candidato com confidence/signals, e:
  1. Decide tipo (user/feedback/project/reference) via heuristica
  2. Gera frontmatter conforme schema do CLAUDE.md
  3. Cria <tipo>_<slug>.md no diretorio memory/
  4. Atualiza MEMORY.md index (linha)
  5. Remove candidato do _instinct-candidates.md

Modo:
  --interactive (default): pergunta usuario para cada candidato
  --auto-promote: promove todos com confidence >= 0.85
  --dry-run: apenas reporta o que faria

Uso (manual ou via /ag-retrospectiva --instincts):
  python3 ~/Claude/.claude/skills/ag-retrospectiva/promote-instinct.py [project_dir]
"""
import json
import os
import re
import sys
from pathlib import Path


TYPE_HEURISTICS = [
    # (regex no user_text, tipo)
    (re.compile(r"\b(?:sou|trabalho|profiss[ãa]o|funcao|cargo|role)\b", re.I), "user"),
    (re.compile(r"\b(?:nunca|sempre|prefer|stop|nao|n[ãa]o\s+faca)\b", re.I), "feedback"),
    (re.compile(r"\b(?:projeto|deadline|sprint|migra[çc][ãa]o|stakeholder|legal|compliance)\b", re.I), "project"),
    (re.compile(r"\b(?:linear|grafana|notion|figma|jira|slack\s+channel|dashboard)\b", re.I), "reference"),
]


def slugify(text, max_len=40):
    s = re.sub(r"[^\w\s-]", "", text.lower())
    s = re.sub(r"[-\s]+", "-", s).strip("-")
    return s[:max_len] or "candidate"


def infer_type(text):
    for pat, t in TYPE_HEURISTICS:
        if pat.search(text):
            return t
    return "feedback"  # default mais comum


def parse_candidates(content):
    """Parse blocos '## Candidate N' do _instinct-candidates.md."""
    blocks = re.split(r"\n## Candidate \d+", content)
    if len(blocks) < 2:
        return []
    candidates = []
    for block in blocks[1:]:
        confidence_m = re.search(r"confidence\s+([\d.]+)", block)
        signals_m = re.search(r"Sinais:\s*(.+)", block)
        user_text_m = re.search(r"\*\*User text:\*\*\s*\n```\s*\n(.*?)\n```", block, re.DOTALL)
        context_m = re.search(r"\*\*Assistant context.*?\*\*\s*\n```\s*\n(.*?)\n```", block, re.DOTALL)
        candidates.append({
            "confidence": float(confidence_m.group(1)) if confidence_m else 0.0,
            "signals": signals_m.group(1).strip() if signals_m else "",
            "user_text": user_text_m.group(1).strip() if user_text_m else "",
            "context": context_m.group(1).strip() if context_m else "",
            "raw": block.strip(),
        })
    return candidates


def promote(candidate, project_dir, dry_run=False):
    user_text = candidate["user_text"]
    if not user_text:
        return None

    type_ = infer_type(user_text)
    slug = slugify(user_text[:80])
    filename = f"{type_}_{slug}.md"
    memory_dir = Path(project_dir) / "memory"
    out_path = memory_dir / filename

    if out_path.exists():
        # Append timestamp para nao colidir
        from datetime import datetime
        ts = datetime.now().strftime("%Y%m%d")
        filename = f"{type_}_{slug}_{ts}.md"
        out_path = memory_dir / filename

    description = user_text[:120].replace("\n", " ")

    body_lines = [
        "---",
        f"name: {type_}-{slug}",
        f"description: {description}",
        "metadata:",
        f"  type: {type_}",
        f"  promoted_at: {os.environ.get('PROMOTED_AT', '')}",
        f"  confidence: {candidate['confidence']}",
        f"  signals: \"{candidate['signals']}\"",
        "---",
        "",
        f"{user_text}",
        "",
    ]

    if type_ in ("feedback", "project") and candidate["context"]:
        body_lines.extend([
            "**Why:** detectado via instinct-extract com sinais: "
            f"{candidate['signals']}. Confidence {candidate['confidence']}.",
            "",
            "**How to apply:** revalidar no proximo trabalho similar.",
            "",
            "**Contexto original:**",
            "```",
            candidate["context"],
            "```",
        ])

    if dry_run:
        return {"would_create": str(out_path), "type": type_}

    out_path.write_text("\n".join(body_lines), encoding="utf-8")

    # Atualiza MEMORY.md (append em ## Promoted instincts)
    memory_md = memory_dir / "MEMORY.md"
    if memory_md.exists():
        text = memory_md.read_text(encoding="utf-8")
        section = "## Promoted instincts (auto)"
        line = f"- [{description[:80]}]({filename})"
        if section in text:
            new_text = re.sub(
                rf"({re.escape(section)}\n)",
                rf"\1{line}\n",
                text,
                count=1,
            )
            memory_md.write_text(new_text, encoding="utf-8")
        else:
            memory_md.write_text(
                text.rstrip() + f"\n\n{section}\n{line}\n",
                encoding="utf-8",
            )

    return {"created": str(out_path), "type": type_}


def main():
    args = sys.argv[1:]
    dry_run = "--dry-run" in args
    auto_promote = "--auto-promote" in args
    interactive = not auto_promote and not dry_run

    project_dirs = [a for a in args if not a.startswith("--")]
    if not project_dirs:
        # Default: project ativo (CWD encoded)
        cwd = os.getcwd().replace("/", "-")
        candidates_path = Path.home() / ".claude" / "projects" / cwd / "memory" / "_instinct-candidates.md"
        if not candidates_path.exists():
            # Fallback: procurar candidates em qualquer project_dir
            base = Path.home() / ".claude" / "projects"
            found = list(base.glob("*/memory/_instinct-candidates.md"))
            if not found:
                print("Nenhum _instinct-candidates.md encontrado.", file=sys.stderr)
                return 1
            project_dirs = [str(f.parent.parent) for f in found]
        else:
            project_dirs = [str(candidates_path.parent.parent)]

    for pd in project_dirs:
        candidates_file = Path(pd) / "memory" / "_instinct-candidates.md"
        if not candidates_file.exists():
            continue

        content = candidates_file.read_text(encoding="utf-8")
        candidates = parse_candidates(content)
        if not candidates:
            continue

        print(f"\n# Project: {pd}")
        print(f"  Candidatos encontrados: {len(candidates)}")
        print()

        promoted = []
        kept = []

        for i, c in enumerate(candidates, start=1):
            print(f"  [{i}/{len(candidates)}] confidence={c['confidence']} signals={c['signals']}")
            print(f"      text: {c['user_text'][:140]}")

            if auto_promote and c["confidence"] >= 0.85:
                result = promote(c, pd, dry_run=dry_run)
                print(f"      -> AUTO-PROMOTED ({result})")
                promoted.append(c)
            elif dry_run:
                result = promote(c, pd, dry_run=True)
                print(f"      -> DRY-RUN ({result})")
            elif interactive:
                try:
                    ans = input("      Promover? (y/n/skip): ").strip().lower()
                except (EOFError, KeyboardInterrupt):
                    print("\nInterrompido.")
                    return 1
                if ans == "y":
                    result = promote(c, pd, dry_run=False)
                    print(f"      -> PROMOTED ({result})")
                    promoted.append(c)
                else:
                    kept.append(c)
            else:
                kept.append(c)

        if not dry_run and promoted:
            # Re-escreve _instinct-candidates.md somente com os kept
            if not kept:
                candidates_file.unlink()
                print(f"\n  Todos os {len(promoted)} candidatos promovidos. Arquivo removido.")
            else:
                lines = [f"# Instinct Candidates — pendentes apos promote {os.environ.get('PROMOTED_AT', '')}", ""]
                for i, c in enumerate(kept, start=1):
                    lines.append(f"## Candidate {i} — confidence {c['confidence']}")
                    lines.append("")
                    lines.append(c["raw"])
                    lines.append("")
                candidates_file.write_text("\n".join(lines), encoding="utf-8")
                print(f"\n  Promovidos: {len(promoted)}. Pendentes: {len(kept)}.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
