#!/usr/bin/env python3
"""
Harvester: extrai entradas estruturadas do errors-log.md para alimentar o eval system.

Uso:
    python harvest_errors_log.py <errors-log-path> [--output <output-path>]

Parseia o formato padrao do ag-09:
    ## [Data] — ag-09-depurar-erro
    ### Erro: [descricao]
    - **Sintoma:** ...
    - **Causa raiz:** ...
    - **Tentativa N:** ... → ...
    - **Solucao:** ...
    - **Licao:** ...

Produz evals.json compativel com o skill-creator eval system.
"""

import json
import re
import sys
from pathlib import Path
from datetime import datetime


def parse_errors_log(content: str) -> list[dict]:
    """Parse errors-log.md and extract structured entries."""
    entries = []

    # Split by ## [Date] or ## Date headers
    sections = re.split(r'^## \[?(\d{4}-\d{2}-\d{2})\]?', content, flags=re.MULTILINE)

    # sections[0] is preamble, then alternating date/content
    for i in range(1, len(sections) - 1, 2):
        date = sections[i]
        section_content = sections[i + 1]

        # Find individual error entries (### Erro: ...)
        error_blocks = re.split(r'^### (?:Erro|Error):\s*(.+)', section_content, flags=re.MULTILINE)

        for j in range(1, len(error_blocks) - 1, 2):
            error_title = error_blocks[j].strip()
            error_body = error_blocks[j + 1]

            entry = {
                "date": date,
                "error": error_title,
                "symptom": extract_field(error_body, "Sintoma"),
                "root_cause": extract_field(error_body, "Causa raiz"),
                "attempts": extract_attempts(error_body),
                "solution": extract_field(error_body, r"Solu[çc][ãa]o"),
                "lesson": extract_field(error_body, r"Li[çc][ãa]o"),
                "resolved": bool(extract_field(error_body, r"Solu[çc][ãa]o")),
            }

            # Classify bug type from symptoms/cause
            entry["bug_type"] = classify_bug_type(entry)
            entries.append(entry)

    # Also parse non-standard entries (### Arquivo: or #### patterns)
    # These are common in the rAIz errors-log
    # Re-process ALL sections, not just the last one
    for i in range(1, len(sections) - 1, 2):
        sec_date = sections[i]
        sec_content = sections[i + 1]

        subsections = re.split(r'^#{3,4}\s+(?:Arquivo:|`[^`]+`)\s*[—-]\s*(.+)', sec_content, flags=re.MULTILINE)

        for k in range(1, len(subsections) - 1, 2):
            sub_title = subsections[k].strip()
            sub_body = subsections[k + 1]

            # Extract from simpler format
            erro = extract_field(sub_body, "Erro|Teste falhou|Teste falhando")
            causa = extract_field(sub_body, "Causa|Causa raiz")
            correcao = extract_field(sub_body, r"Corre[çc][ãa]o|A[çc][ãa]o sugerida")

            if erro or causa:
                # Avoid duplicates (already captured by ### Erro: pattern)
                dup = any(e["error"] == sub_title and e["date"] == sec_date for e in entries)
                if not dup:
                    entry = {
                        "date": sec_date,
                        "error": sub_title,
                        "symptom": erro or sub_title,
                        "root_cause": causa or "",
                        "attempts": [],
                        "solution": correcao or "",
                        "lesson": "",
                        "resolved": bool(correcao),
                        "bug_type": classify_bug_type({"symptom": erro or "", "root_cause": causa or "", "solution": correcao or ""}),
                    }
                    entries.append(entry)

    # Also parse top-level sections with **Sintoma:**/**Causa raiz:**/**Solucao aplicada:** (npm audit style)
    for i in range(1, len(sections) - 1, 2):
        sec_date = sections[i]
        sec_content = sections[i + 1]

        sintoma = extract_field(sec_content, "Sintoma")
        causa = extract_field(sec_content, "Causa raiz")
        solucao = extract_field(sec_content, r"Solu[çc][ãa]o aplicada|Solu[çc][ãa]o")
        licao = extract_field(sec_content, r"Li[çc][ãa]o")

        if sintoma and causa:
            # Get title from the section header text after the date
            title_match = re.match(r'\s*[—-]+\s*(.+)', sec_content.split('\n')[0])
            title = title_match.group(1).strip() if title_match else f"Erro {sec_date}"

            dup = any(e["date"] == sec_date and e["symptom"] == sintoma for e in entries)
            if not dup:
                entry = {
                    "date": sec_date,
                    "error": title,
                    "symptom": sintoma,
                    "root_cause": causa,
                    "attempts": extract_attempts(sec_content),
                    "solution": solucao or "",
                    "lesson": licao or "",
                    "resolved": bool(solucao),
                    "bug_type": classify_bug_type({"symptom": sintoma, "root_cause": causa, "solution": solucao or ""}),
                }
                entries.append(entry)

    return entries


def extract_field(text: str, field_pattern: str) -> str:
    """Extract a **Field:** value from markdown."""
    match = re.search(rf'\*\*(?:{field_pattern}):\*\*\s*(.+?)(?:\n|$)', text, re.IGNORECASE)
    return match.group(1).strip() if match else ""


def extract_attempts(text: str) -> list[dict]:
    """Extract attempt entries."""
    attempts = []
    for match in re.finditer(r'\*\*Tentativa\s+(\d+):\*\*\s*(.+?)→\s*(.+?)(?:\n|$)', text):
        attempts.append({
            "number": int(match.group(1)),
            "action": match.group(2).strip(),
            "result": match.group(3).strip(),
        })
    return attempts


def classify_bug_type(entry: dict) -> str:
    """Classify bug type based on symptoms and cause."""
    text = f"{entry.get('symptom', '')} {entry.get('root_cause', '')} {entry.get('solution', '')}".lower()

    if any(w in text for w in ['timeout', 'carregamento infinito', 'spinner', 'loading', 'nunca resolve']):
        return "silent-fail"
    if any(w in text for w in ['typeerror', 'referenceerror', 'cannot read', 'undefined', '500', 'crash']):
        return "crash"
    if any(w in text for w in ['build', 'tsc', 'typecheck', 'type error', 'ts2']):
        return "build-only"
    if any(w in text for w in ['intermitente', 'race condition', 'timing', 'flaky']):
        return "intermittent"
    if any(w in text for w in ['regressao', 'regression', 'funcionava', 'parou']):
        return "regression"
    if any(w in text for w in ['env', '.env', 'variavel', 'config', 'credential']):
        return "config"
    return "unknown"


def entries_to_evals(entries: list[dict], skill_name: str = "ag-09-depurar-erro") -> dict:
    """Convert harvested entries to evals.json format."""
    evals = []
    for i, entry in enumerate(entries):
        if not entry.get("resolved"):
            continue

        eval_item = {
            "id": i + 1,
            "prompt": f"{entry['symptom'] or entry['error']}",
            "expected_output": f"Diagnostico com causa raiz: {entry['root_cause']}. Solucao: {entry['solution']}",
            "files": [],
            "bug_type": entry["bug_type"],
            "source": f"errors-log.md [{entry['date']}]",
            "assertions": [
                {"text": "Leu errors-log.md ANTES de comecar a debugar", "type": "process"},
                {"text": f"Identificou causa raiz: {entry['root_cause']}", "type": "correctness"},
                {"text": "Registrou no errors-log.md com formato correto", "type": "process"},
            ],
        }

        # Add type-specific assertions
        if entry["bug_type"] == "silent-fail":
            eval_item["assertions"].append(
                {"text": "Investigou silent failure sem assumir que 'nao ha erro'", "type": "completeness"}
            )
        elif entry["bug_type"] == "build-only":
            eval_item["assertions"].append(
                {"text": "Investigou discrepancia build vs dev", "type": "completeness"}
            )
        elif entry["bug_type"] == "config":
            eval_item["assertions"].append(
                {"text": "Verificou env vars e configuracao", "type": "completeness"}
            )

        evals.append(eval_item)

    return {"skill_name": skill_name, "evals": evals}


def main():
    if len(sys.argv) < 2:
        print("Uso: python harvest_errors_log.py <errors-log-path> [--output <output-path>]")
        sys.exit(1)

    log_path = Path(sys.argv[1])
    output_path = Path(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[2] == "--output" else None

    if not log_path.exists():
        print(f"Arquivo nao encontrado: {log_path}")
        sys.exit(1)

    content = log_path.read_text(encoding="utf-8")
    entries = parse_errors_log(content)

    print(f"Encontradas {len(entries)} entradas no errors-log.md")

    # Print summary by type
    type_counts: dict[str, int] = {}
    for e in entries:
        t = e["bug_type"]
        type_counts[t] = type_counts.get(t, 0) + 1

    print("\nDistribuicao por tipo:")
    for t, c in sorted(type_counts.items(), key=lambda x: -x[1]):
        print(f"  {t}: {c}")

    # Generate evals
    evals = entries_to_evals(entries)
    print(f"\nGerados {len(evals['evals'])} eval cases de {len(entries)} entradas")

    if output_path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(evals, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"Salvo em: {output_path}")
    else:
        print(json.dumps(evals, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
