#!/usr/bin/env python3
"""
Self-Improvement Pipeline: loop autonomo de melhoria de skills.

Uso:
    python self_improve.py --skill <skill-name> --project <project-path> [--threshold 0.80] [--dry-run]

Pipeline:
    1. HARVEST — extrai evals do errors-log.md do projeto
    2. GRADE — avalia skill atual contra os evals (via claude -p)
    3. ANALYZE — detecta padroes de falha
    4. IMPROVE — se pass_rate < threshold, melhora a skill
    5. VALIDATE — re-roda evals na skill melhorada

Requer: claude CLI no PATH
"""

import json
import subprocess
import sys
from pathlib import Path
from datetime import datetime


# Detect workspace: scripts live under <workspace>/.claude/skills/ag_skill-creator/scripts/
SCRIPT_DIR = Path(__file__).parent
CLAUDE_DIR = SCRIPT_DIR.parent.parent.parent  # .claude/
SKILLS_DIR = CLAUDE_DIR / "skills"
WORKSPACE_DIR = CLAUDE_DIR / "skills-workspace"


def run_harvest(project_path: Path, skill_name: str) -> Path:
    """Fase 1: Harvest errors-log.md do projeto (all locations)."""
    errors_logs = find_errors_logs(project_path)
    if not errors_logs:
        print("SKIP: errors-log.md nao encontrado")
        sys.exit(0)

    output_dir = WORKSPACE_DIR / skill_name / "auto-evals"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"harvested-{datetime.now().strftime('%Y%m%d')}.json"

    # Harvest from all errors-log files and merge
    all_evals = []
    for errors_log in errors_logs:
        tmp_path = output_dir / f"_tmp_{errors_log.name}"
        result = subprocess.run(
            [sys.executable, str(SCRIPT_DIR / "harvest_errors_log.py"), str(errors_log), "--output", str(tmp_path)],
            capture_output=True, text=True
        )
        print(result.stdout)
        if result.returncode == 0 and tmp_path.exists():
            data = json.loads(tmp_path.read_text())
            all_evals.extend(data.get("evals", []))
            tmp_path.unlink()

    # Deduplicate by prompt
    seen = set()
    unique_evals = []
    for e in all_evals:
        if e["prompt"] not in seen:
            seen.add(e["prompt"])
            e["id"] = len(unique_evals) + 1
            unique_evals.append(e)

    merged = {"skill_name": skill_name, "evals": unique_evals}
    output_path.write_text(json.dumps(merged, indent=2, ensure_ascii=False))
    print(f"Total: {len(unique_evals)} evals unicos de {len(errors_logs)} arquivos")

    return output_path


def run_grade(skill_name: str, evals_path: Path, iteration: int) -> dict:
    """Fase 2: Grade skill contra evals usando claude -p."""
    skill_path = SKILLS_DIR / skill_name / "SKILL.md"
    workspace = WORKSPACE_DIR / skill_name / f"auto-iteration-{iteration}"
    workspace.mkdir(parents=True, exist_ok=True)

    evals = json.loads(evals_path.read_text())

    results = []
    for eval_item in evals.get("evals", []):
        prompt = f"""You are evaluating a skill's ability to guide debugging.

SKILL (read this first):
{skill_path.read_text()}

EVAL PROMPT (a real user would say this):
"{eval_item['prompt']}"

ASSERTIONS TO CHECK (does the skill provide guidance for each?):
{json.dumps(eval_item.get('assertions', []), indent=2)}

For each assertion, determine if the skill's instructions would lead a model to satisfy it.
Respond with JSON: {{"expectations": [{{"text": "...", "passed": true/false, "evidence": "..."}}]}}
"""
        # Run via claude -p
        try:
            result = subprocess.run(
                ["claude", "-p", prompt, "--output-format", "json"],
                capture_output=True, text=True, timeout=120
            )
            if result.returncode == 0:
                grading = json.loads(result.stdout)
                results.append({"eval_id": eval_item["id"], "grading": grading})
            else:
                print(f"  WARN: claude -p falhou para eval {eval_item['id']}")
                results.append({"eval_id": eval_item["id"], "error": result.stderr[:200]})
        except (subprocess.TimeoutExpired, json.JSONDecodeError) as e:
            print(f"  WARN: erro no eval {eval_item['id']}: {e}")
            results.append({"eval_id": eval_item["id"], "error": str(e)})

    # Save results
    results_path = workspace / "grading_results.json"
    results_path.write_text(json.dumps(results, indent=2, ensure_ascii=False))

    return {"results": results, "workspace": str(workspace)}


def run_analyze(results: list[dict]) -> dict:
    """Fase 3: Analisar padroes de falha."""
    total = 0
    passed = 0
    failed_assertions = []

    for r in results:
        grading = r.get("grading", {})
        for exp in grading.get("expectations", []):
            total += 1
            if exp.get("passed"):
                passed += 1
            else:
                failed_assertions.append(exp.get("text", "unknown"))

    pass_rate = passed / total if total > 0 else 0

    return {
        "total_assertions": total,
        "passed": passed,
        "failed": total - passed,
        "pass_rate": pass_rate,
        "failed_assertions": failed_assertions,
    }


def run_improve(skill_name: str, analysis: dict, evals_path: Path) -> bool:
    """Fase 4: Melhorar skill se pass_rate < threshold."""
    skill_path = SKILLS_DIR / skill_name / "SKILL.md"
    current_skill = skill_path.read_text()

    prompt = f"""You are a skill improvement agent. A skill was evaluated and needs improvement.

CURRENT SKILL:
{current_skill}

ANALYSIS:
- Pass rate: {analysis['pass_rate']:.0%}
- Failed assertions: {json.dumps(analysis['failed_assertions'], indent=2)}

REAL EVAL CASES (from errors-log.md):
{evals_path.read_text()}

Improve the SKILL.md to address the failed assertions. Keep everything that works (pass rate was {analysis['pass_rate']:.0%}).
Focus on: decision trees, examples, checklists for the gaps found.

Output ONLY the improved SKILL.md content (full file, no markdown code fences).
"""

    try:
        result = subprocess.run(
            ["claude", "-p", prompt],
            capture_output=True, text=True, timeout=300
        )
        if result.returncode == 0 and len(result.stdout) > 500:
            # Backup current
            backup_path = WORKSPACE_DIR / skill_name / "skill-backups" / f"SKILL-{datetime.now().strftime('%Y%m%d-%H%M%S')}.md"
            backup_path.parent.mkdir(parents=True, exist_ok=True)
            backup_path.write_text(current_skill)

            # Write improved
            skill_path.write_text(result.stdout)
            print(f"Skill melhorada. Backup em: {backup_path}")
            return True
        else:
            print(f"WARN: claude -p retornou output invalido ({len(result.stdout)} chars)")
            return False
    except subprocess.TimeoutExpired:
        print("WARN: timeout na melhoria")
        return False


def find_errors_logs(project_path: Path) -> list[Path]:
    """Find all errors-log.md files in project (all known locations)."""
    candidates = [
        project_path / ".agents" / ".context" / "errors-log.md",
        project_path / "docs" / "ai-state" / "errors-log.md",
        project_path / "bugs" / "docs" / "ai-state" / "errors-log.md",
    ]
    return [c for c in candidates if c.exists()]


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Skill Self-Improvement Pipeline")
    parser.add_argument("--skill", required=True, help="Skill name (e.g., ag-09-depurar-erro)")
    parser.add_argument("--project", required=True, help="Project path with errors-log.md")
    parser.add_argument("--threshold", type=float, default=0.80, help="Pass rate threshold (default: 0.80)")
    parser.add_argument("--dry-run", action="store_true", help="Only harvest and analyze, don't improve")
    args = parser.parse_args()

    project_path = Path(args.project).expanduser()
    print(f"=== Skill Self-Improvement: {args.skill} ===")
    print(f"Project: {project_path}")
    print(f"Threshold: {args.threshold:.0%}")
    print()

    # Phase 1: Harvest
    print("--- FASE 1: HARVEST ---")
    evals_path = run_harvest(project_path, args.skill)

    evals = json.loads(evals_path.read_text())
    if not evals.get("evals"):
        print("Nenhum eval gerado. Nada a fazer.")
        return

    if args.dry_run:
        print(f"\n[DRY RUN] {len(evals['evals'])} evals harvested. Parando aqui.")
        return

    # Phase 2: Grade
    print("\n--- FASE 2: GRADE ---")
    grade_result = run_grade(args.skill, evals_path, iteration=1)

    # Phase 3: Analyze
    print("\n--- FASE 3: ANALYZE ---")
    analysis = run_analyze(grade_result["results"])
    print(f"Pass rate: {analysis['pass_rate']:.0%} ({analysis['passed']}/{analysis['total_assertions']})")

    if analysis["failed_assertions"]:
        print(f"Failed assertions ({len(analysis['failed_assertions'])}):")
        for fa in analysis["failed_assertions"][:10]:
            print(f"  - {fa}")

    # Phase 4: Improve (if needed)
    if analysis["pass_rate"] < args.threshold:
        print(f"\n--- FASE 4: IMPROVE (pass_rate {analysis['pass_rate']:.0%} < threshold {args.threshold:.0%}) ---")
        improved = run_improve(args.skill, analysis, evals_path)
        if improved:
            print("\n--- FASE 5: VALIDATE ---")
            grade_result_2 = run_grade(args.skill, evals_path, iteration=2)
            analysis_2 = run_analyze(grade_result_2["results"])
            print(f"Pass rate apos melhoria: {analysis_2['pass_rate']:.0%}")

            if analysis_2["pass_rate"] <= analysis["pass_rate"]:
                print("WARN: Melhoria nao melhorou pass rate. Revertendo.")
                # Find most recent backup and restore
                backups = sorted((WORKSPACE_DIR / args.skill / "skill-backups").glob("SKILL-*.md"))
                if backups:
                    (SKILLS_DIR / args.skill / "SKILL.md").write_text(backups[-1].read_text())
                    print("Revertido para versao anterior.")
        else:
            print("Melhoria falhou. Skill mantida.")
    else:
        print(f"\nPass rate {analysis['pass_rate']:.0%} >= threshold {args.threshold:.0%}. Skill OK, nenhuma melhoria necessaria.")

    # Save report
    report = {
        "timestamp": datetime.now().isoformat(),
        "skill": args.skill,
        "project": str(project_path),
        "evals_count": len(evals["evals"]),
        "analysis": analysis,
        "threshold": args.threshold,
        "action": "improved" if analysis["pass_rate"] < args.threshold else "no-action",
    }
    report_path = WORKSPACE_DIR / args.skill / "self-improve-reports" / f"report-{datetime.now().strftime('%Y%m%d')}.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False))
    print(f"\nReport salvo em: {report_path}")


if __name__ == "__main__":
    main()
