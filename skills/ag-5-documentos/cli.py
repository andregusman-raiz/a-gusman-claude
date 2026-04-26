"""CLI entry point para `ag-5-documentos` — invocacao externa.

Uso:

  # Build deck via briefing JSON em stdin (full pipeline = 13 validators)
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

Pipeline canonico (mode='full'):
  cli.py invoca `lib.pipeline.ExecutiveDeckPipeline` que aciona os 13 validators:
    - action_title scorer (regex + chart_validator V04)
    - anatomy_validator (PR2.2: title/body/source/takeaway)
    - audit_deck (geometric, contrast, lang, bullet, source_line, one_message)
    - detect_anti_patterns (26 anti-pattern detectors)
    - chart_validator V01-V13 + AP01-AP08 (quando charts presentes)
    - pyramid_validator (LLM ou regex fallback)
    - mece_validator (LLM ou regex fallback)
    - final_acceptance (7 testes secao 36 do guia mestre)

Fallback (mode='minimal'):
  Se ExecutiveDeckPipeline lancar excecao (briefing exotico ou bug),
  cli cai para `cli.minimal_builder.build_minimal_deck` + audit basico.
  Response inclui campo `mode` para o caller saber qual rota foi usada.

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
from dataclasses import asdict, is_dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

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

# Severidades que contam como blocking_for_delivery
_BLOCKING_SEVERITIES = {"high"}


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


def _warning_to_dict(w: Any) -> Dict[str, Any]:
    """Converte AuditWarning (dataclass) em dict serializavel."""
    if is_dataclass(w):
        return asdict(w)
    if hasattr(w, "__dict__"):
        return {k: v for k, v in w.__dict__.items() if not k.startswith("_")}
    if isinstance(w, dict):
        return dict(w)
    return {"message": str(w)}


# ---------------------------------------------------------------------------
# Pre-build validators — operam no outline ANTES do render
# ---------------------------------------------------------------------------
def _validate_outline_action_titles(outline: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Roda action_title scorer (chart_validator._formula_score) em cada title.

    Captura titles fracos ANTES do render: "Análise de receita", "Os dados mostram".
    Retorna findings serializaveis (severity high quando score<2 e title nao-vazio).
    """
    findings: List[Dict[str, Any]] = []
    try:
        from lib.chart_validator import _formula_score  # noqa: F401
        from lib.audit import validate_action_title
    except ImportError:
        return findings

    for idx, item in enumerate(outline, start=1):
        kind = (item.get("kind_hint") or item.get("kind") or "").lower()
        # section dividers nao precisam de action title formula
        if kind in {"section_divider", "cover", "title_only", "agenda"}:
            continue
        title = (item.get("title") or item.get("message") or "").strip()
        if not title:
            continue

        # Score 0..3 (numero, conclusao, implicacao)
        try:
            from lib.chart_validator import _formula_score as _score
            score = _score(title)
        except Exception:
            score = None

        # validate_action_title detecta anti-pattern + sem numero
        source_data = []
        content = item.get("content") or {}
        for v in content.values():
            if isinstance(v, str):
                source_data.append(v)
        warning = validate_action_title(title, source_data=source_data or None)
        if warning is not None:
            findings.append({
                "slide_num": idx,
                "category": "action_title_low_score",
                "severity": "high",
                "message": (
                    f"Action title fraco no slide {idx} "
                    f"(score={score}/3 se computavel): {title!r} — "
                    f"{warning.message}"
                ),
            })
        elif score is not None and score < 2:
            findings.append({
                "slide_num": idx,
                "category": "action_title_low_score",
                "severity": "high",
                "message": (
                    f"Action title formula fraca no slide {idx} "
                    f"({score}/3, esperado >=2): {title!r}"
                ),
            })
    return findings


def _validate_outline_quantitative_sources(outline: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Detecta slides quantitativos (hero_number, kpi, ratio) sem source declarado.

    Captura "+34%" sem campo `source` ou `fonte` no content/data_inputs.
    """
    findings: List[Dict[str, Any]] = []
    quantitative_kinds = {"hero_number", "kpi", "ratio", "stats", "number_focus"}
    for idx, item in enumerate(outline, start=1):
        kind = (item.get("kind_hint") or item.get("kind") or "").lower()
        if kind not in quantitative_kinds:
            continue
        content = item.get("content") or {}
        data_inputs = item.get("data_inputs") or {}
        # Busca por campos source/fonte/ref em qualquer nivel
        all_keys = set(content.keys()) | set(data_inputs.keys()) | set(item.keys())
        normalized = {k.lower() for k in all_keys}
        has_source = any(s in normalized for s in {"source", "fonte", "ref", "referencia"})
        # Tambem aceita source line declarado em bullets/takeaway
        body_text = " ".join(str(v) for v in content.values()
                              if isinstance(v, str))
        body_text += " " + " ".join(item.get("bullets") or [])
        body_text = body_text.lower()
        if "fonte:" in body_text or "source:" in body_text or "[framework" in body_text:
            has_source = True
        if not has_source:
            findings.append({
                "slide_num": idx,
                "category": "missing_source",
                "severity": "high",
                "message": (
                    f"Slide quantitativo {kind!r} (slide {idx}) sem source declarado. "
                    f"Adicione campo 'source' ou 'fonte' no content/data_inputs, "
                    f"ou inclua 'Fonte: ...' no bullets/takeaway."
                ),
            })
    return findings


# ---------------------------------------------------------------------------
# Post-build audit — invoca pipeline.audit() COMPLETO (13 validators)
# ---------------------------------------------------------------------------
def _post_build_audit(pipeline, briefing_obj: Optional[Any], outline: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """Chama pipeline.audit() e enriquece com anatomy_validator.

    Retorna (findings, extras) onde:
      - findings: lista de dicts (warnings + final_acceptance failures)
      - extras: {final_acceptance, viz_quality, blocked_for_delivery}
    """
    findings: List[Dict[str, Any]] = []
    extras: Dict[str, Any] = {}

    try:
        audit_result = pipeline.audit(briefing=briefing_obj)
    except Exception as exc:
        # PDF conversion (LibreOffice) pode falhar — degrade gracefully
        findings.append({
            "slide_num": 0,
            "category": "audit_error",
            "severity": "medium",
            "message": f"pipeline.audit() falhou: {exc}",
        })
        return findings, extras

    for w in audit_result.get("warnings", []) or []:
        findings.append(_warning_to_dict(w))

    extras["viz_quality"] = audit_result.get("viz_quality")
    extras["blocked_for_delivery_reasons"] = audit_result.get("blocked_for_delivery", [])

    final_acceptance = audit_result.get("final_acceptance") or {}
    if final_acceptance:
        extras["final_acceptance_score"] = final_acceptance.get("score")
        extras["final_acceptance_passed"] = final_acceptance.get("passed")
        extras["final_acceptance_details"] = final_acceptance.get("details")
        # Se nao passou, transformar em finding blocking
        if final_acceptance.get("blocked"):
            findings.append({
                "slide_num": 0,
                "category": "final_acceptance_failure",
                "severity": "high",
                "message": (
                    f"Final acceptance score {final_acceptance.get('score')}/"
                    f"{7} (min={final_acceptance.get('min_pass', 5)}). "
                    f"Detalhes: {'; '.join(final_acceptance.get('details', []))}"
                ),
            })

    # Anatomy validator (nao wired no audit_deck) — rodar manualmente
    findings.extend(_run_anatomy_validator(pipeline.v1_pptx, outline))

    return findings, extras


def _run_anatomy_validator(pptx_path: Path, outline: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Roda anatomy_validator em cada slide (4-element check)."""
    out: List[Dict[str, Any]] = []
    try:
        from pptx import Presentation
        from lib.anatomy_validator import validate_slide_anatomy
    except ImportError:
        return out
    if not pptx_path.exists():
        return out
    try:
        prs = Presentation(str(pptx_path))
    except Exception:
        return out

    # Mapa idx -> kind do outline (offset 1 se ha capa)
    kinds_by_idx: Dict[int, str] = {}
    has_cover = True  # builder gera capa quando title presente
    for i, item in enumerate(outline, start=1):
        kind = (item.get("kind_hint") or item.get("kind") or "").lower() or None
        # +1 para capa (kinds_by_idx alinhado com numeracao 1-indexed dos slides)
        kinds_by_idx[i + (1 if has_cover else 0)] = kind

    slide_w = prs.slide_width
    slide_h = prs.slide_height
    for i, slide in enumerate(prs.slides, start=1):
        kind = kinds_by_idx.get(i)
        try:
            warnings = validate_slide_anatomy(
                slide, slide_num=i, slide_kind=kind,
                slide_w_emu=slide_w, slide_h_emu=slide_h,
            )
        except Exception:
            continue
        for w in warnings:
            out.append(_warning_to_dict(w))
    return out


# ---------------------------------------------------------------------------
# Build deck — full pipeline com fallback minimal
# ---------------------------------------------------------------------------
def _build_deck_full(
    briefing_data: Dict[str, Any],
    output_path: Path,
    *,
    no_llm: bool,
    storyline_override: Optional[str],
) -> Dict[str, Any]:
    """Pipeline completo: 13 validators + final_acceptance.

    Usa ExecutiveDeckPipeline. Em caso de excecao, deixa caller decidir
    se cai pra minimal_builder.
    """
    from cli.minimal_builder import build_minimal_deck
    from lib.palette_overrides import get_brand
    from lib.pipeline import ExecutiveDeckPipeline

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

    # PRE-BUILD validators (capturam briefing fraco ANTES do render)
    pre_findings = _validate_outline_action_titles(outline)
    pre_findings.extend(_validate_outline_quantitative_sources(outline))

    brand_name = (briefing_data.get("marca") or "raiz").lower()
    brand = get_brand(brand_name)

    # Audience hint (opcional, suporta external mask)
    audience = briefing_data.get("audience") or "internal"

    # Tentativa de parse strict para alimentar pyramid + final_acceptance
    briefing_obj, _ = _try_parse_briefing_strict(briefing_data)

    slug = output_path.stem.replace(" ", "-")
    pipeline = ExecutiveDeckPipeline(
        slug=slug,
        out_dir=output_path.parent,
        brand=brand,
        skip_review=False,  # full pipeline com audit
        audience=audience,
    )
    pipeline.write_md(f"# {title}\n\n(generated via cli)\n")

    # synthesize_outline aceita briefing_obj quando outline vazio (storyline_kind)
    pipeline.synthesize_outline(
        outline,
        apply_executive_synthesis=False,
        briefing=briefing_obj,
        storyline_template=storyline_override,
    )

    # build_v1 espera builder que escreve em pipeline.v1_pptx
    def _builder(v1_pptx_path: Path, brand_arg) -> None:
        build_minimal_deck(v1_pptx_path, brand_arg, outline=pipeline.outline,
                           title=title)
    pipeline.build_v1(_builder)

    # Mover v1 -> output_path final (se diferente)
    if pipeline.v1_pptx != output_path:
        import shutil
        shutil.copy(pipeline.v1_pptx, output_path)

    # POST-BUILD audit (full pipeline, 13 validators)
    post_findings, extras = _post_build_audit(pipeline, briefing_obj, outline)

    # Mesclar pre + post findings
    all_findings = pre_findings + post_findings

    # blocking_for_delivery: severity=high
    blocking = [
        f.get("message", "blocking issue")
        for f in all_findings
        if str(f.get("severity")).lower() in _BLOCKING_SEVERITIES
    ]
    # Tambem incluir reasons explicitos do pipeline (P0.2 viz, P0.5 contrast, etc)
    blocking.extend(extras.get("blocked_for_delivery_reasons", []) or [])

    num_slides = len(outline) + (1 if title else 0)

    return {
        "schema_version": "1.0",
        "mode": "criar",
        "pipeline_mode": "full",
        "output_path": str(output_path),
        "num_slides": num_slides,
        "storyline_aplicado": (
            storyline_override
            or briefing_data.get("storyline_kind")
            or (getattr(briefing_obj, "storyline_kind", None) if briefing_obj else None)
            or "none"
        ),
        "findings": all_findings,
        "blocking_for_delivery": blocking,
        "blocked": bool(blocking),
        "final_acceptance_score": extras.get("final_acceptance_score"),
        "final_acceptance_passed": extras.get("final_acceptance_passed"),
        "final_acceptance_details": extras.get("final_acceptance_details"),
        "viz_quality": extras.get("viz_quality"),
    }


def _build_deck_minimal_fallback(
    briefing_data: Dict[str, Any],
    output_path: Path,
    *,
    no_llm: bool,
    storyline_override: Optional[str],
    fallback_reason: str,
) -> Dict[str, Any]:
    """Fallback ao minimal_builder + cli.audit_existing.

    Usado quando ExecutiveDeckPipeline lanca excecao. Mantem CLI funcional
    com audit basico (geometric + anti-patterns), porem sem 13 validators.
    """
    from cli.audit_existing import audit_pptx
    from cli.minimal_builder import build_minimal_deck
    from lib.palette_overrides import get_brand

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

    build_minimal_deck(output_path, brand, outline=outline, title=title)

    findings: List[Dict[str, Any]] = [{
        "slide_num": 0,
        "category": "pipeline_fallback",
        "severity": "medium",
        "message": (
            f"ExecutiveDeckPipeline falhou ({fallback_reason}); "
            f"cai para minimal_builder. Audit reduzido (sem 13 validators)."
        ),
    }]
    blocking: List[str] = []

    try:
        audit_data = audit_pptx(output_path)
        findings.extend(audit_data.get("findings", []))
        if audit_data.get("blocking_count", 0) > 0:
            blocking = [
                f.get("message", "blocking issue")
                for f in audit_data.get("findings", [])
                if str(f.get("severity")).lower() in _BLOCKING_SEVERITIES
            ]
    except Exception as exc:
        findings.append({
            "slide_num": 0,
            "category": "audit_error",
            "severity": "medium",
            "message": f"audit minimal pos-build falhou: {exc}",
        })

    return {
        "schema_version": "1.0",
        "mode": "criar",
        "pipeline_mode": "minimal",
        "fallback_reason": fallback_reason,
        "output_path": str(output_path),
        "num_slides": len(outline) + (1 if title else 0),
        "storyline_aplicado": storyline_override or briefing_data.get("storyline_kind") or "none",
        "findings": findings,
        "blocking_for_delivery": blocking,
        "blocked": bool(blocking),
    }


def _build_deck(
    briefing_data: Dict[str, Any],
    output_path: Path,
    *,
    no_llm: bool,
    storyline_override: Optional[str],
    force_minimal: bool = False,
) -> Dict[str, Any]:
    """Orquestrador: tenta full pipeline, cai para minimal em caso de excecao.

    Args:
      force_minimal: se True, pula full pipeline e usa minimal_builder direto.
                     Util para testes e troubleshooting.
    """
    if force_minimal:
        return _build_deck_minimal_fallback(
            briefing_data, output_path,
            no_llm=no_llm, storyline_override=storyline_override,
            fallback_reason="--force-minimal flag",
        )
    try:
        return _build_deck_full(
            briefing_data, output_path,
            no_llm=no_llm, storyline_override=storyline_override,
        )
    except Exception as exc:
        # Log no stderr para visibilidade, mas nao falhar o CLI inteiro
        sys.stderr.write(
            f"WARN: full pipeline falhou ({type(exc).__name__}: {exc}); "
            f"caindo para minimal_builder.\n"
        )
        return _build_deck_minimal_fallback(
            briefing_data, output_path,
            no_llm=no_llm, storyline_override=storyline_override,
            fallback_reason=f"{type(exc).__name__}: {exc}",
        )


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
        force_minimal=getattr(args, "force_minimal", False),
    )

    if args.output_json:
        json_path = Path(args.output_json).expanduser()
        json_path.parent.mkdir(parents=True, exist_ok=True)
        json_path.write_text(
            json.dumps(result, ensure_ascii=False, indent=2, default=str),
            encoding="utf-8",
        )
    else:
        sys.stdout.write(json.dumps(result, ensure_ascii=False, default=str) + "\n")

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
        json.dumps(result, ensure_ascii=False, indent=2, default=str),
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
    build.add_argument("--force-minimal", action="store_true",
                       help="Forca minimal_builder em vez do full pipeline (debug).")
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
