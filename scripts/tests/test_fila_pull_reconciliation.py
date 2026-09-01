#!/usr/bin/env python3
"""Controlo positivo (E-88): prova que o guard de reconciliação de fila-pull.sh DISPARA.

Nunca toca o estado partilhado real (~/Claude/docs/ai-state/roadmap) — copia o
script para um sandbox com o `D=` redirigido para um diretório temporário e
fixtures isoladas.

Bug histórico guardado (achado do FUNIL, corrigido 2026-08-31): `if changed:
persist()` do ramo "nada elegível" vivia, na versão com bug, depois de ambos os
`sys.exit(0)` — nunca corria. Uma tarefa marcada "fila" no disco mas já `done`
em results.jsonl (o único caso em que a reconciliação É precisa) ficava presa
"fila" para sempre, exceto se OUTRA tarefa também estivesse elegível na mesma
chamada (aí o `persist()` do ramo "pick encontrado" gravava as duas juntas e
mascarava o bug).

Cobre os 3 caminhos de saída nomeados no PROVA da E-88:
  1. --peek        : nunca persiste (mesmo havendo reconciliação a fazer)
  2. not pick       : persiste SÓ SE algo mudou — este é o caminho do bug
  3. pick encontrado: persiste sempre (nunca esteve com bug; controlo negativo)

Uso: python3 test_fila_pull_reconciliation.py
Saída: PASS/FAIL por caminho x versão (bug-viva deve dar RED, corrigida GREEN);
exit 0 só se TODAS as asserções baterem.
"""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

REAL_SCRIPT = Path.home() / "Claude/.claude/scripts/fila-pull.sh"

# Trecho exato do ramo "not pick" na versão corrigida (l.99-102 em
# fila-pull.sh hoje). Se isto não bater, o script mudou de forma e o patch do
# bug histórico abaixo já não é válido — falhar alto, não silenciosamente.
FIXED_NOT_PICK_BLOCK = (
    '    if not pick:\n'
    '        if changed: persist()\n'
    '        bloq=sum(1 for x in rows if x.get("status")=="fila")\n'
    '        print(f"FILA-VAZIA: nenhuma tarefa elegível em {os.path.basename(q)}'
    ' ({bloq} na fila, bloqueadas por dependência)"); sys.exit(0)\n'
)
# Reintroduz o bug histórico: persist() sai do "if changed", vira código morto.
BUGGY_NOT_PICK_BLOCK = (
    '    if not pick:\n'
    '        bloq=sum(1 for x in rows if x.get("status")=="fila")\n'
    '        print(f"FILA-VAZIA: nenhuma tarefa elegível em {os.path.basename(q)}'
    ' ({bloq} na fila, bloqueadas por dependência)"); sys.exit(0)\n'
)


def make_sandboxed_script(tmp: Path, *, inject_bug: bool) -> Path:
    src = REAL_SCRIPT.read_text(encoding="utf-8")
    marker = 'D="$HOME/Claude/docs/ai-state/roadmap"'
    assert marker in src, "fila-pull.sh mudou o caminho hardcoded — atualizar o teste"
    src = src.replace(marker, f'D="{tmp}"')
    if inject_bug:
        assert FIXED_NOT_PICK_BLOCK in src, (
            "fila-pull.sh mudou o ramo 'not pick' — o patch do bug historico nao bate mais, "
            "atualizar FIXED_NOT_PICK_BLOCK/BUGGY_NOT_PICK_BLOCK antes de confiar neste teste"
        )
        src = src.replace(FIXED_NOT_PICK_BLOCK, BUGGY_NOT_PICK_BLOCK)
    out = tmp / "fila-pull-sandbox.sh"
    out.write_text(src, encoding="utf-8")
    out.chmod(0o755)
    return out


def write_jsonl(path: Path, rows: list[dict]) -> None:
    path.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows), encoding="utf-8")


def read_jsonl(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def run_case(*, inject_bug: bool, peek: bool, fixture_status_after_done: bool) -> str:
    """Monta fixture isolada, corre o script sandboxed, devolve o status final da row no disco."""
    with tempfile.TemporaryDirectory(prefix="fila-pull-test-") as tmpdir:
        tmp = Path(tmpdir)
        (tmp / "filas").mkdir()
        script = make_sandboxed_script(tmp, inject_bug=inject_bug)

        frente = "testfrente"
        task = "E-TESTFAKE-RECON"
        fila_path = tmp / "filas" / f"fila-{frente}.jsonl"
        results_path = tmp / "results.jsonl"

        write_jsonl(
            fila_path,
            [{"task": task, "status": "fila", "frente": frente, "depende_de": [], "builder_sugerido": ""}],
        )
        write_jsonl(results_path, [{"task": task, "status": "done"}] if fixture_status_after_done else [])

        args = ["bash", str(script), frente, "DE-SYNC"]
        if peek:
            args.append("--peek")
        proc = subprocess.run(args, capture_output=True, text=True, timeout=15)
        assert proc.returncode == 0, f"script saiu com rc={proc.returncode}, stderr={proc.stderr!r}"

        rows_after = read_jsonl(fila_path)
        assert len(rows_after) == 1, f"fixture corrompida: {rows_after!r}"
        return rows_after[0]["status"]


def run_pick_case(*, inject_bug: bool) -> dict:
    """Caminho 3: tarefa genuinamente elegível (results.jsonl vazio) deve ser sempre puxada e persistida."""
    with tempfile.TemporaryDirectory(prefix="fila-pull-test-pick-") as tmpdir:
        tmp = Path(tmpdir)
        (tmp / "filas").mkdir()
        script = make_sandboxed_script(tmp, inject_bug=inject_bug)

        frente = "testfrente"
        task = "E-TESTFAKE-PICK"
        fila_path = tmp / "filas" / f"fila-{frente}.jsonl"
        results_path = tmp / "results.jsonl"

        write_jsonl(
            fila_path,
            [{"task": task, "status": "fila", "frente": frente, "depende_de": [], "builder_sugerido": ""}],
        )
        write_jsonl(results_path, [])

        proc = subprocess.run(
            ["bash", str(script), frente, "DE-SYNC"], capture_output=True, text=True, timeout=15
        )
        assert proc.returncode == 0, f"script saiu com rc={proc.returncode}, stderr={proc.stderr!r}"
        rows_after = read_jsonl(fila_path)
        assert len(rows_after) == 1
        return rows_after[0]


def main() -> int:
    failures: list[str] = []

    def check(label: str, condition: bool, detail: str) -> None:
        mark = "PASS" if condition else "FAIL"
        print(f"[{mark}] {label} — {detail}")
        if not condition:
            failures.append(label)

    # Caminho 2 (o do bug): reconciliação sem nada mais elegível.
    status_buggy = run_case(inject_bug=True, peek=False, fixture_status_after_done=True)
    check(
        "RED (bug vivo): row fica 'fila' presa no disco",
        status_buggy == "fila",
        f"esperado status='fila' (bug reproduzido), obtido '{status_buggy}'",
    )

    status_fixed = run_case(inject_bug=False, peek=False, fixture_status_after_done=True)
    check(
        "GREEN (corrigido): row reconcilia para 'done' no disco",
        status_fixed == "done",
        f"esperado status='done' (guard disparou), obtido '{status_fixed}'",
    )

    # Caminho 1: --peek nunca persiste, em nenhuma das duas versões.
    for inject_bug in (True, False):
        status_peek = run_case(inject_bug=inject_bug, peek=True, fixture_status_after_done=True)
        check(
            f"--peek nunca muta o disco (inject_bug={inject_bug})",
            status_peek == "fila",
            f"esperado status='fila' inalterado, obtido '{status_peek}'",
        )

    # Caminho 3: tarefa genuinamente elegível é sempre puxada e persistida (controlo negativo do bug).
    for inject_bug in (True, False):
        row = run_pick_case(inject_bug=inject_bug)
        ok = row.get("status") == "puxada" and row.get("puxada_por") == "DE-SYNC" and bool(row.get("puxada_em"))
        check(
            f"pick encontrado sempre persiste (inject_bug={inject_bug})",
            ok,
            f"row final = {row!r}",
        )

    print()
    if failures:
        print(f"FALHOU: {len(failures)}/6 asserções — {failures}")
        return 1
    print("PASSOU: 6/6 — os 3 caminhos provados, red-antes/green-depois confirmado no caminho do bug.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
