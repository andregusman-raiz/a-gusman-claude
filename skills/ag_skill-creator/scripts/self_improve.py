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

import glob as glob_module
import json
import re
import subprocess
import sys
from pathlib import Path
from datetime import datetime


# Detect workspace: scripts live under ~/Claude/.claude/skills/ag_skill-creator/scripts/
SCRIPT_DIR = Path(__file__).parent
CLAUDE_DIR = SCRIPT_DIR.parent.parent.parent  # .claude/
SKILLS_DIR = CLAUDE_DIR / "skills"
AGENTS_DIR = CLAUDE_DIR / "agents"
WORKSPACE_DIR = CLAUDE_DIR / "skills-workspace"
REGISTRY_PATH = SCRIPT_DIR / "agent_registry.json"


def _load_agent_registry() -> dict:
    """Load agent short-name -> full-name registry from JSON file."""
    if REGISTRY_PATH.exists():
        return json.loads(REGISTRY_PATH.read_text())
    return {}


def _resolve_agent_name(skill_name: str) -> str:
    """
    Resolve a skill/agent name to its canonical full name.

    Handles three input styles:
      1. Full name with category:   ag-B-09-depurar-erro  (already canonical)
      2. Short name without category: ag-B-09-depurar-erro  (strip suffix, lookup)
      3. Numeric short name only:   ag-09                 (lookup in registry)

    Returns the full name (without .md) if found, or the original value unchanged.
    """
    # Style 1: already has category letter prefix (ag-X-NN-...)
    if re.match(r'^ag-[A-Z]-\d+', skill_name):
        return skill_name

    registry = _load_agent_registry()

    # Extract numeric part to build the short key "ag-NN"
    m = re.match(r'^ag-(\d+)', skill_name)
    if m:
        short_key = f"ag-{m.group(1)}"
        if short_key in registry:
            return registry[short_key]

    # Fallback: scan agents directory for any file matching the numeric part
    m2 = re.search(r'(\d+)', skill_name)
    if m2:
        num = m2.group(1)
        matches = list(AGENTS_DIR.glob(f"ag-*-{num}-*.md"))
        if len(matches) == 1:
            return matches[0].stem  # filename without .md
        if len(matches) > 1:
            print(f"  WARN: multiple agent files match numeric '{num}': {[m.name for m in matches]}")
            return matches[0].stem

    # Could not resolve — return as-is and let find_skill_file() surface the error
    return skill_name


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


def find_skill_file(skill_name: str) -> Path:
    """Find the skill/agent definition file (SKILL.md or agent .md).

    Resolution order:
      1. Skill directory: .claude/skills/<skill_name>/SKILL.md (exact)
      2. Agent file exact: .claude/agents/<skill_name>.md
      3. Resolve via registry/scan then retry agent file
    """
    # 1. Try skill directory first (exact match)
    skill_md = SKILLS_DIR / skill_name / "SKILL.md"
    if skill_md.exists():
        return skill_md

    # 2. Try exact agent file
    agent_md = AGENTS_DIR / f"{skill_name}.md"
    if agent_md.exists():
        return agent_md

    # 3. Resolve via registry / directory scan and retry
    resolved = _resolve_agent_name(skill_name)
    if resolved != skill_name:
        resolved_md = AGENTS_DIR / f"{resolved}.md"
        if resolved_md.exists():
            print(f"  INFO: resolved '{skill_name}' -> '{resolved}'")
            return resolved_md

    raise FileNotFoundError(
        f"Skill/agent not found for '{skill_name}'. Tried:\n"
        f"  {skill_md}\n"
        f"  {agent_md}\n"
        f"  {AGENTS_DIR / (resolved + '.md')}"
    )


def _claude_env() -> dict:
    """Return env dict with CLAUDECODE unset so claude -p can run from hooks."""
    import os
    env = os.environ.copy()
    env.pop("CLAUDECODE", None)
    return env


def _extract_json_from_response(text: str) -> dict:
    """Extract JSON from claude -p response.

    Handles two formats:
      1. --output-format json: returns {"type":"result","result":"..."} wrapper
      2. Raw text with JSON embedded in markdown code fences or plain
    """
    # Try parsing as direct JSON first
    try:
        data = json.loads(text)
        # If it's the wrapper format, extract the result text and re-parse
        if isinstance(data, dict) and "result" in data:
            inner = data["result"]
            if isinstance(inner, str):
                return _extract_json_from_response(inner)
            return inner
        return data
    except json.JSONDecodeError:
        pass

    # Try extracting JSON from markdown code fences
    m = re.search(r'```(?:json)?\s*\n?({.*?})\s*\n?```', text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError:
            pass

    # Try finding first { ... } block
    m = re.search(r'(\{.*\})', text, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError:
            pass

    return {}


def run_grade(skill_name: str, evals_path: Path, iteration: int) -> dict:
    """Fase 2: Grade skill contra evals usando claude -p."""
    skill_path = find_skill_file(skill_name)
    workspace = WORKSPACE_DIR / skill_name / f"auto-iteration-{iteration}"
    workspace.mkdir(parents=True, exist_ok=True)

    evals = json.loads(evals_path.read_text())
    env = _claude_env()

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
Respond with ONLY valid JSON (no markdown, no explanation): {{"expectations": [{{"text": "...", "passed": true/false, "evidence": "..."}}]}}
"""
        # Run via claude -p
        try:
            result = subprocess.run(
                ["claude", "-p", prompt, "--output-format", "json"],
                capture_output=True, text=True, timeout=180, env=env
            )
            if result.returncode == 0 and result.stdout.strip():
                grading = _extract_json_from_response(result.stdout)
                if grading:
                    results.append({"eval_id": eval_item["id"], "grading": grading})
                else:
                    print(f"  WARN: could not parse JSON for eval {eval_item['id']}")
                    results.append({"eval_id": eval_item["id"], "error": "JSON parse failed"})
            else:
                print(f"  WARN: claude -p falhou para eval {eval_item['id']}: {result.stderr[:200]}")
                results.append({"eval_id": eval_item["id"], "error": result.stderr[:200]})
        except subprocess.TimeoutExpired:
            print(f"  WARN: timeout no eval {eval_item['id']}")
            results.append({"eval_id": eval_item["id"], "error": "timeout"})
        except Exception as e:
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
    errored_evals = 0

    for r in results:
        if "error" in r:
            # Eval that errored (claude -p failed, timeout, etc.) counts as 1 failed assertion
            errored_evals += 1
            total += 1
            failed_assertions.append(f"[EVAL ERROR] {r['eval_id']}: {r['error'][:100]}")
            continue
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
        "errored_evals": errored_evals,
    }


def run_improve(skill_name: str, analysis: dict, evals_path: Path) -> bool:
    """Fase 4: Melhorar skill se pass_rate < threshold."""
    skill_path = find_skill_file(skill_name)
    current_skill = skill_path.read_text()

    # Only include failed assertion texts (not full evals) to keep prompt manageable
    failed_list = "\n".join(f"  - {fa}" for fa in analysis["failed_assertions"][:15])

    prompt = f"""You are a skill improvement agent. A skill was evaluated against real debugging scenarios and needs improvement.

CURRENT SKILL (this is the full file you must improve):
{current_skill}

ANALYSIS:
- Pass rate: {analysis['pass_rate']:.0%} ({analysis['passed']}/{analysis['total_assertions']} assertions passed)
- Failed assertions:
{failed_list}

The failed assertions show gaps in the skill's guidance. The skill needs better coverage for:
1. Multi-cause bugs (multiple independent root causes)
2. Deploy-related issues (code deployed but old version still serving)
3. Complex multi-layer bugs (frontend + backend + config combined)
4. Permission/access control inconsistencies across layers

Improve the skill to address these gaps. Keep everything that already works.
Focus on adding: decision trees, checklists, examples for the failure patterns above.

IMPORTANT: Output the COMPLETE improved skill file content. No markdown code fences. No explanations. Just the full improved file.
"""

    env = _claude_env()
    try:
        # Use shell to pipe prompt via stdin with cat, and use sonnet model for speed
        prompt_file = Path("/tmp/self-improve-prompt.txt")
        prompt_file.write_text(prompt)
        result = subprocess.run(
            'cat /tmp/self-improve-prompt.txt | claude -p --model sonnet',
            capture_output=True, text=True, timeout=900, env=env, shell=True
        )
        print(f"  claude -p returncode={result.returncode}, stdout={len(result.stdout)} chars, stderr={len(result.stderr)} chars")
        if result.stderr.strip():
            print(f"  stderr: {result.stderr[:500]}")

        if result.returncode == 0 and result.stdout.strip():
            # Extract text from JSON wrapper if present
            improved_text = result.stdout
            try:
                wrapper = json.loads(improved_text)
                if isinstance(wrapper, dict) and "result" in wrapper:
                    improved_text = wrapper["result"]
            except json.JSONDecodeError:
                pass  # Not JSON-wrapped, use as-is

            # Strip markdown code fences if present
            stripped = improved_text.strip()
            if stripped.startswith("```") and stripped.endswith("```"):
                # Remove first line (```markdown or ```) and last line (```)
                lines = stripped.split("\n")
                stripped = "\n".join(lines[1:-1]).strip()
                improved_text = stripped

            if len(improved_text) > 500:
                # Backup current
                backup_path = WORKSPACE_DIR / skill_name / "skill-backups" / f"SKILL-{datetime.now().strftime('%Y%m%d-%H%M%S')}.md"
                backup_path.parent.mkdir(parents=True, exist_ok=True)
                backup_path.write_text(current_skill)

                # Write improved
                skill_path.write_text(improved_text)
                print(f"Skill melhorada. Backup em: {backup_path}")
                return True
            else:
                print(f"WARN: claude -p retornou output muito curto ({len(improved_text)} chars)")
                print(f"  First 200 chars: {improved_text[:200]}")
                return False
        else:
            print(f"WARN: claude -p retornou output invalido (rc={result.returncode}, stdout={len(result.stdout)} chars)")
            if result.stdout:
                print(f"  First 300 chars: {result.stdout[:300]}")
            return False
    except subprocess.TimeoutExpired:
        print("WARN: timeout na melhoria (600s)")
        return False


def find_errors_logs(project_path: Path) -> list[Path]:
    """Find all errors-log.md files in project (all known locations).

    Search order:
      1. Hardcoded high-priority paths (fast, no filesystem walk)
      2. Worktree paths via glob pattern
      3. Recursive glob fallback across entire project tree
    """
    candidates = [
        # Original paths
        project_path / ".agents" / ".context" / "errors-log.md",
        project_path / "docs" / "ai-state" / "errors-log.md",
        project_path / "raiz-bugs" / "docs" / "ai-state" / "errors-log.md",
        # Additional paths
        project_path / "agents" / ".context" / "errors-log.md",
    ]
    found = [c for c in candidates if c.exists()]
    found_set = {str(p) for p in found}

    # Worktree paths: .claude/worktrees/*/errors-log.md
    worktree_pattern = str(project_path / ".claude" / "worktrees" / "*" / "errors-log.md")
    for p in glob_module.glob(worktree_pattern):
        path = Path(p)
        if str(path) not in found_set:
            found.append(path)
            found_set.add(str(path))

    # Recursive fallback: find any errors-log.md under project (depth-limited by glob)
    recursive_pattern = str(project_path / "**" / "errors-log.md")
    for p in glob_module.glob(recursive_pattern, recursive=True):
        path = Path(p)
        if str(path) not in found_set:
            found.append(path)
            found_set.add(str(path))

    return found


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Skill Self-Improvement Pipeline")
    # Accept skill name as positional OR as --skill flag for backwards compatibility
    parser.add_argument("skill_positional", nargs="?", default=None,
                        metavar="SKILL", help="Skill/agent name (positional, e.g., ag-B-09-depurar-erro)")
    parser.add_argument("--skill", default=None, help="Skill/agent name (flag form)")
    parser.add_argument("--project", default=None, help="Project path with errors-log.md")
    parser.add_argument("--threshold", type=float, default=0.80, help="Pass rate threshold (default: 0.80)")
    parser.add_argument("--dry-run", action="store_true", help="Only harvest and analyze, don't improve")
    args = parser.parse_args()

    # Resolve skill name: positional takes precedence over flag
    skill_name = args.skill_positional or args.skill
    if not skill_name:
        parser.error("Skill name is required — provide it positionally or via --skill")

    # Resolve project: default to current working directory if omitted (useful for dry-run tests)
    project_path = Path(args.project).expanduser() if args.project else Path.cwd()

    # Normalise: resolve via registry if needed
    skill_name = _resolve_agent_name(skill_name)

    print(f"=== Skill Self-Improvement: {skill_name} ===")
    print(f"Project: {project_path}")
    print(f"Threshold: {args.threshold:.0%}")
    print()

    # Phase 1: Harvest
    print("--- FASE 1: HARVEST ---")
    evals_path = run_harvest(project_path, skill_name)

    evals = json.loads(evals_path.read_text())
    if not evals.get("evals"):
        print("Nenhum eval gerado. Nada a fazer.")
        return

    if args.dry_run:
        print(f"\n[DRY RUN] {len(evals['evals'])} evals harvested. Parando aqui.")
        return

    # Phase 2: Grade
    print("\n--- FASE 2: GRADE ---")
    grade_result = run_grade(skill_name, evals_path, iteration=1)

    # Phase 3: Analyze
    print("\n--- FASE 3: ANALYZE ---")
    analysis = run_analyze(grade_result["results"])
    print(f"Pass rate: {analysis['pass_rate']:.0%} ({analysis['passed']}/{analysis['total_assertions']})")

    if analysis["failed_assertions"]:
        print(f"Failed assertions ({len(analysis['failed_assertions'])}):")
        for fa in analysis["failed_assertions"][:10]:
            print(f"  - {fa}")

    # Phase 4: Improve (if needed)
    action_taken = "no-action"
    validation_analysis = None
    if analysis["pass_rate"] < args.threshold:
        print(f"\n--- FASE 4: IMPROVE (pass_rate {analysis['pass_rate']:.0%} < threshold {args.threshold:.0%}) ---")
        improved = run_improve(skill_name, analysis, evals_path)
        if improved:
            action_taken = "improved"
            print("\n--- FASE 5: VALIDATE ---")
            grade_result_2 = run_grade(skill_name, evals_path, iteration=2)
            analysis_2 = run_analyze(grade_result_2["results"])
            print(f"Pass rate apos melhoria: {analysis_2['pass_rate']:.0%}")

            validation_analysis = analysis_2
            if analysis_2["pass_rate"] <= analysis["pass_rate"]:
                print("WARN: Melhoria nao melhorou pass rate. Revertendo.")
                action_taken = "reverted"
                # Find most recent backup and restore
                backups = sorted((WORKSPACE_DIR / skill_name / "skill-backups").glob("SKILL-*.md"))
                if backups:
                    find_skill_file(skill_name).write_text(backups[-1].read_text())
                    print("Revertido para versao anterior.")
            else:
                action_taken = "improved-validated"
                print(f"Melhoria validada: {analysis['pass_rate']:.0%} -> {analysis_2['pass_rate']:.0%}")
        else:
            action_taken = "improve-failed"
            print("Melhoria falhou. Skill mantida.")
    else:
        print(f"\nPass rate {analysis['pass_rate']:.0%} >= threshold {args.threshold:.0%}. Skill OK, nenhuma melhoria necessaria.")

    # Save report
    report = {
        "timestamp": datetime.now().isoformat(),
        "skill": skill_name,
        "project": str(project_path),
        "evals_count": len(evals["evals"]),
        "analysis": analysis,
        "threshold": args.threshold,
        "action": action_taken,
    }
    # Include validation results if improvement was attempted
    if action_taken in ("improved-validated", "reverted") and validation_analysis is not None:
        report["validation"] = validation_analysis
    report_path = WORKSPACE_DIR / skill_name / "self-improve-reports" / f"report-{datetime.now().strftime('%Y%m%d')}.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False))
    print(f"\nReport salvo em: {report_path}")


if __name__ == "__main__":
    main()
