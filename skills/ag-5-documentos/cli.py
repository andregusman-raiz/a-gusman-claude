"""CLI entry point para `ag-5-documentos` — invocacao externa.

Uso:

  # Build deck via briefing JSON em stdin
  echo '{"titulo":"...","outline":[...]}' | python cli.py build --output deck.pptx

  # Build deck via briefing YAML file
  python cli.py build --briefing briefing.yaml --output deck.pptx

  # Apenas auditar deck existente (nao gera novo)
  python cli.py audit --pptx existing.pptx --output-json audit.json

  # Dry-run: valida briefing sem gerar arquivo
  python cli.py validate --briefing briefing.yaml

Exit codes:
  0   — sucesso
  1   — erro de input (briefing invalido, file not found)
  2   — falha de validacao (deck gerado mas com blocking issues)
  3   — erro interno (exception nao tratada)

Integracao Node bridge (Phase 2b):
    spawn('python', ['cli.py', 'build', '--briefing', file, '--output', out])

Skill: `~/Claude/.claude/skills/ag-5-documentos/`
"""
from __future__ import annotations

# matplotlib Agg backend — obrigatorio antes de qualquer import que possa
# carregar matplotlib (charts subsystem). Necessario para rodar headless.
import os
os.environ.setdefault("MPLBACKEND", "Agg")
try:
    import matplotlib
    matplotlib.use("Agg", force=True)
except Exception:  # matplotlib pode nao estar instalado em todos os ambientes
    pass

import argparse
import json
import sys
import traceback
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml

# Garantir que `lib.*` resolve mesmo se cli.py for invocado de outro CWD
_SKILL_ROOT = Path(__file__).resolve().parent
if str(_SKILL_ROOT) not in sys.path:
    sys.path.insert(0, str(_SKILL_ROOT))


# Exit codes (consistencia com Node bridge)
EXIT_OK = 0
EXIT_INPUT_ERROR = 1
EXIT_BLOCKING = 2
EXIT_INTERNAL = 3


# ---------------------------------------------------------------------------
# Helpers — separados para poder mockar em testes
# ---------------------------------------------------------------------------
def _briefing_to_outline(briefing_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Converte briefing dict (livre) -> outline list[dict] para builder.

    Suporta dois formatos:
      - Briefing Pydantic (pergunta_principal, mensagem_central, outline=[SlideOutline])
      - Briefing simples / Node bridge (outline=[{kind, title, ...}])
    """
    outline = briefing_data.get("outline") or []
    if not isinstance(outline, list):
        raise ValueError("briefing.outline deve ser uma lista")

    normalized: List[Dict[str, Any]] = []
    for i, raw in enumerate(outline):
        if not isinstance(raw, dict):
            raise ValueError(f"briefing.outline[{i}] deve ser dict")
        item = dict(raw)
        # Normalizar nomes de campo aceitos pelo builder
        if "kind" in item and "kind_hint" not in item:
            item["kind_hint"] = item["kind"]
        if "message" in item and "title" not in item:
            item["title"] = item["message"]
        normalized.append(item)
    return normalized


def _try_parse_briefing_strict(briefing_data: Dict[str, Any]):
    """Tenta validar briefing contra schema Pydantic estrito.

    Retorna (briefing_obj_or_None, error_or_None). Erros nao lancam — caller
    decide se eh fatal (validate) ou warn (build com formato simples).
    """
    try:
        from lib.briefing_schema import Briefing
    except ImportError as exc:
        return None, str(exc)
    try:
        return Briefing(**briefing_data), None
    except Exception as exc:
        return None, str(exc)


def _build_deck(
    briefing_data: Dict[str, Any],
    output_path: Path,
    *,
    no_llm: bool,
    storyline_override: Optional[str],
) -> Dict[str, Any]:
    """Roda pipeline build_v1 com builder minimal. Retorna metadata."""
    from cli.minimal_builder import build_minimal_deck
    from lib.palette_overrides import get_brand
    from lib.pipeline import ExecutiveDeckPipeline

    # no-LLM: setamos flags conhecidos por validators que invocam Anthropic
    if no_llm:
        os.environ["AG5_DISABLE_LLM_VALIDATORS"] = "1"
        os.environ.setdefault("ANTHROPIC_API_KEY", "")

    output_path = Path(output_path).expanduser()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    title = (
        briefing_data.get("titulo")
        or briefing_data.get("title")
        or briefing_data.get("mensagem_central")
        or output_path.stem
    )
    outline = _briefing_to_outline(briefing_data)

    brand_name = (briefing_data.get("marca") or "raiz").lower()
    brand = get_brand(brand_name)

    slug = output_path.stem.replace(" ", "-")
    pipeline = ExecutiveDeckPipeline(
        slug=slug,
        out_dir=output_path.parent,
        brand=brand,
        skip_review=True,  # CLI nao faz fase de auditoria multimodal
    )
    pipeline.write_md(f"# {title}\n\n(generated via cli)\n")
    pipeline.synthesize_outline(outline, apply_executive_synthesis=False)

    # build_v1 espera builder que escreve em pipeline.v1_pptx; redirect ao final
    def _builder(v1_pptx_path: Path, brand_arg) -> None:
        build_minimal_deck(v1_pptx_path, brand_arg, outline=pipeline.outline,
                           title=title)

    pipeline.build_v1(_builder)

    # Mover v1 -> output_path final
    if pipeline.v1_pptx != output_path:
        # python-pptx ja salvou em v1_pptx; copiar para path solicitado
        import shutil
        shutil.copy(pipeline.v1_pptx, output_path)

    # Audit subset (sem PDF / multimodal — cobertura suficiente para gate Node)
    findings: List[Dict[str, Any]] = []
    blocking: List[str] = []
    try:
        from cli.audit_existing import audit_pptx
        audit_data = audit_pptx(output_path)
        findings = audit_data.get("findings", [])
        if audit_data.get("blocking_count", 0) > 0:
            blocking = [
                f.get("message", "blocking issue")
                for f in findings
                if str(f.get("severity")).lower() == "high"
            ]
    except Exception as exc:
        findings = [{
            "severity": "medium",
            "category": "audit_error",
            "message": f"audit pos-build falhou: {exc}",
        }]

    return {
        "schema_version": "1.0",
        "mode": "criar",
        "output_path": str(output_path),
        "num_slides": len(outline) + (1 if title else 0),
        "storyline_aplicado": storyline_override or briefing_data.get("storyline_kind") or "none",
        "findings": findings,
        "blocking_for_delivery": blocking,
        "blocked": bool(blocking),
    }


def _audit_existing_deck(pptx: Path) -> Dict[str, Any]:
    from cli.audit_existing import audit_pptx
    return audit_pptx(pptx)


def _validate_briefing(briefing_data: Dict[str, Any]) -> Dict[str, Any]:
    """Valida briefing sem gerar deck. Tenta schema Pydantic primeiro,
    cai para validacao mais permissiva (campos minimos)."""
    briefing, err = _try_parse_briefing_strict(briefing_data)
    if briefing is not None:
        return {
            "schema_version": "1.0",
            "mode": "validate",
            "schema_strict": True,
            "outline_count": len(briefing.outline) if briefing.outline else 0,
            "audience": briefing.audience,
            "format": briefing.format,
        }

    # Validacao permissiva — verificar campos minimos para `build` funcionar
    outline = briefing_data.get("outline")
    if not isinstance(outline, list) or len(outline) == 0:
        raise ValueError(
            f"briefing nao tem outline valido (lista nao-vazia). "
            f"Erro schema estrito: {err}"
        )
    for i, item in enumerate(outline):
        if not isinstance(item, dict):
            raise ValueError(f"briefing.outline[{i}] deve ser dict")
    return {
        "schema_version": "1.0",
        "mode": "validate",
        "schema_strict": False,
        "outline_count": len(outline),
        "schema_strict_error": err,
    }


# ---------------------------------------------------------------------------
# Command handlers
# ---------------------------------------------------------------------------
def cmd_build(args: argparse.Namespace) -> int:
    from cli.loader import load_briefing
    briefing_data = load_briefing(args.briefing)

    output_path = Path(args.output).expanduser()
    result = _build_deck(
        briefing_data,
        output_path,
        no_llm=args.no_llm,
        storyline_override=args.storyline,
    )

    if args.output_json:
        json_path = Path(args.output_json).expanduser()
        json_path.parent.mkdir(parents=True, exist_ok=True)
        json_path.write_text(
            json.dumps(result, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    else:
        sys.stdout.write(json.dumps(result, ensure_ascii=False) + "\n")

    if result.get("blocked") and args.fail_on_blocking:
        sys.stderr.write(
            f"BLOCKED: {len(result.get('blocking_for_delivery', []))} "
            f"blocking finding(s)\n"
        )
        return EXIT_BLOCKING
    return EXIT_OK


def cmd_audit(args: argparse.Namespace) -> int:
    pptx = Path(args.pptx).expanduser()
    if not pptx.exists():
        raise FileNotFoundError(f"PPTX nao encontrado: {pptx}")

    result = _audit_existing_deck(pptx)

    json_path = Path(args.output_json).expanduser()
    json_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(
        json.dumps(result, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    sys.stdout.write(
        f"audit OK: {result['num_slides']} slides, "
        f"{result['blocking_count']} blocking, "
        f"{result['warning_count']} warning(s)\n"
    )
    if result.get("blocking_count", 0) > 0 and getattr(args, "fail_on_blocking", False):
        return EXIT_BLOCKING
    return EXIT_OK


def cmd_validate(args: argparse.Namespace) -> int:
    from cli.loader import load_briefing
    briefing_data = load_briefing(args.briefing)
    result = _validate_briefing(briefing_data)
    sys.stdout.write(json.dumps(result, ensure_ascii=False) + "\n")
    return EXIT_OK


# ---------------------------------------------------------------------------
# Argument parser
# ---------------------------------------------------------------------------
def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="ag-5-documentos-cli",
        description="External CLI entry point for ag-5-documentos skill.",
    )
    sub = parser.add_subparsers(dest="cmd", required=True)

    # build
    build = sub.add_parser("build", help="Gera deck PPTX a partir de briefing.")
    build.add_argument("--briefing", help="Path para briefing YAML/JSON. Stdin se omitido.")
    build.add_argument("--output", required=True, help="Path de saida do .pptx")
    build.add_argument("--output-json", help="Path opcional para response JSON.")
    build.add_argument("--fail-on-blocking", action="store_true",
                       help="Exit 2 quando audit detectar blocking findings.")
    build.add_argument("--storyline", help="Override storyline kind.")
    build.add_argument("--no-llm", action="store_true",
                       help="Pula validators LLM (regex fallback only).")
    build.set_defaults(func=cmd_build)

    # audit
    audit = sub.add_parser("audit", help="Audita PPTX existente, sem regerar.")
    audit.add_argument("--pptx", required=True, help="Path do .pptx existente")
    audit.add_argument("--output-json", required=True, help="Path do audit JSON.")
    audit.add_argument("--fail-on-blocking", action="store_true")
    audit.set_defaults(func=cmd_audit)

    # validate
    validate = sub.add_parser("validate", help="Valida briefing sem gerar PPTX.")
    validate.add_argument("--briefing", required=True, help="Path do briefing YAML/JSON")
    validate.set_defaults(func=cmd_validate)

    return parser


def main(argv: Optional[List[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return args.func(args)
    except FileNotFoundError as exc:
        sys.stderr.write(f"ERROR: {exc}\n")
        return EXIT_INPUT_ERROR
    except (yaml.YAMLError, json.JSONDecodeError, ValueError) as exc:
        sys.stderr.write(f"ERROR: invalid input — {exc}\n")
        return EXIT_INPUT_ERROR
    except KeyboardInterrupt:
        sys.stderr.write("ERROR: interrupted\n")
        return EXIT_INTERNAL
    except Exception:
        traceback.print_exc(file=sys.stderr)
        return EXIT_INTERNAL


if __name__ == "__main__":
    sys.exit(main())
