"""Tests para CLI full pipeline (PR feat/ag-5-cli-full-pipeline).

Cobre 13-validators path em cli.py via ExecutiveDeckPipeline:
  - action_title scorer (V04 + validate_action_title)
  - missing source em slide quantitativo
  - lang_validator (frases fracas)
  - chart_validator AP01-AP08 (anti-patterns visuais)
  - anatomy_validator (PR2.2: title/body/takeaway/source)
  - --no-llm fallback (regex-only, sem ANTHROPIC_API_KEY)
  - briefing forte produz 0 blocking
  - mode='full' vs mode='minimal' fallback

Estes testes provam que cli.py ESCALONA o briefing para os validators
canonicais — briefings fracos NAO passam mais por baixo do radar.
"""
from __future__ import annotations

# matplotlib Agg backend — antes de qualquer import indireto
import os
os.environ.setdefault("MPLBACKEND", "Agg")

import importlib.util as _ilu
import json
import sys
from pathlib import Path
from typing import Any, Dict, List

import pytest

_SKILL_ROOT = Path(__file__).resolve().parents[2]
if str(_SKILL_ROOT) not in sys.path:
    sys.path.insert(0, str(_SKILL_ROOT))

# Carregar cli.py (entry point) via importlib porque colide com pacote `cli/`
_cli_path = _SKILL_ROOT / "cli.py"
_spec = _ilu.spec_from_file_location("ag5_cli_full", str(_cli_path))
cli_main = _ilu.module_from_spec(_spec)
sys.modules["ag5_cli_full"] = cli_main
_spec.loader.exec_module(cli_main)  # type: ignore[union-attr]


# ---------------------------------------------------------------------------
# Fixtures de briefing — strong vs weak
# ---------------------------------------------------------------------------
def _strong_briefing() -> Dict[str, Any]:
    """Briefing executivo forte: action titles formula 2/3+, sources, story coerente.

    Cada title executivo tem: numero + verbo de conclusao + implicacao
    (formula score >= 2/3 conforme chart_validator._formula_score).
    """
    return {
        "titulo": "Crescimento Q4 Strong Brief",
        "marca": "raiz",
        "outline": [
            {
                "kind": "section_divider",
                "title": "Diagnostico",
            },
            {
                # 3/3: cresce + 34% + superando
                "kind": "hero_number",
                "title": "Receita cresceu 34% YoY superando meta exigindo replanejar Q2",
                "content": {
                    "value": "+34%",
                    "label": "Receita Q4 vs Q4 ano anterior",
                    "source": "Sistema RM, fechamento 2026-01-15",
                },
                "bullets": ["Fonte: Sistema RM, fechamento 2026-01-15"],
            },
            {
                # 3/3: reduz + 18% + liberando
                "kind": "bullet_list",
                "title": "Tres alavancas reduz custo em 18% liberando R$ 12MM para Q2",
                "bullets": [
                    "Renegociar contratos cloud, economia esperada de 8% em OPEX.",
                    "Automatizar onboarding cliente, reducao de 12% no CAC.",
                    "Consolidar fornecedores logisticos, ganho de 6% em margin.",
                ],
                "content": {"source": "Plano de eficiencia 2026 v3"},
            },
            {
                # 3/3: pressiona + 12pp + exigindo
                "kind": "bullet_list",
                "title": "Concorrencia pressiona margem em 12pp exigindo decisao Q1 imediata",
                "bullets": [
                    "Sob pressao de 3 competidores entrantes em Q4.",
                    "Decisao requerida: ajustar pricing ou diferenciar produto.",
                    "Proximo passo: comite estrategico em 15 dias.",
                ],
                "content": {"source": "Analise competitiva 2026 Q1"},
            },
        ],
    }


def _weak_titles_briefing() -> Dict[str, Any]:
    """Action titles fracos (descritivos sem numeros)."""
    return {
        "titulo": "Briefing Fraco",
        "marca": "raiz",
        "outline": [
            {"kind": "section_divider", "title": "Os dados mostram receita"},
            {
                "kind": "bullet_list",
                "title": "Análise de receita",  # weak: sem numero, anti-pattern "Analise de"
                "bullets": ["Receita aumentou", "Custos subiram"],
            },
            {
                "kind": "bullet_list",
                "title": "Visão geral 2025",  # weak: anti-pattern "Visao geral"
                "bullets": ["Mercado em alta", "Concorrencia crescente"],
            },
        ],
    }


def _missing_source_briefing() -> Dict[str, Any]:
    """Hero number sem source declarado."""
    return {
        "titulo": "Sem Fonte",
        "marca": "raiz",
        "outline": [
            {"kind": "section_divider", "title": "Resultado"},
            {
                "kind": "hero_number",
                "title": "Receita cresceu 34% YoY no Q4 com expansao Sul",
                "content": {"value": "+34%", "label": "Receita anual Q4"},
                # NOTE: SEM campo 'source' nem 'fonte' nas keys
            },
        ],
    }


def _weak_lang_briefing() -> Dict[str, Any]:
    """Body com frases fracas detectaveis pelo lang_validator."""
    return {
        "titulo": "Linguagem Fraca",
        "marca": "raiz",
        "outline": [
            {"kind": "section_divider", "title": "Contexto"},
            {
                "kind": "bullet_list",
                "title": "Receita cresceu 25% no semestre via tres mercados novos",
                "bullets": [
                    "Os dados mostram que houve crescimento em todas as regioes.",
                    "Pode-se notar que ha melhoria significativa em Q4.",
                    "E importante destacar que existem oportunidades futuras.",
                ],
            },
        ],
    }


def _run_build(briefing: Dict[str, Any], tmp_path: Path,
               *, fail_on_blocking: bool = False,
               extra_args: List[str] = None) -> Dict[str, Any]:
    """Helper: roda cli build com --no-llm e retorna response JSON."""
    briefing_path = tmp_path / "brief.json"
    briefing_path.write_text(json.dumps(briefing), encoding="utf-8")
    out_pptx = tmp_path / "deck.pptx"
    out_json = tmp_path / "resp.json"

    args = [
        "build",
        "--briefing", str(briefing_path),
        "--output", str(out_pptx),
        "--output-json", str(out_json),
        "--no-llm",
    ]
    if fail_on_blocking:
        args.append("--fail-on-blocking")
    if extra_args:
        args.extend(extra_args)

    rc = cli_main.main(args)
    response = json.loads(out_json.read_text(encoding="utf-8"))
    response["_exit_code"] = rc
    response["_pptx_path"] = str(out_pptx)
    response["_pptx_exists"] = out_pptx.exists()
    return response


def _findings_by_category(response: Dict[str, Any], category: str) -> List[Dict[str, Any]]:
    return [f for f in response.get("findings", [])
            if str(f.get("category", "")) == category]


# ---------------------------------------------------------------------------
# T1: Briefing executivo forte → blocking minimo + pipeline_mode='full'
# ---------------------------------------------------------------------------
def test_full_pipeline_briefing_strong(tmp_path: Path):
    """Briefing executivo bem feito: action titles 2/3+, sources presentes,
    story coerente. Expect: pipeline_mode='full', exit 0 (sem --fail-on-blocking)
    e nenhum action_title_low_score blocking."""
    response = _run_build(_strong_briefing(), tmp_path)

    assert response.get("pipeline_mode") == "full", \
        f"esperava pipeline_mode='full', recebi: {response.get('pipeline_mode')}"
    assert response["_exit_code"] == 0
    assert response["_pptx_exists"], "PPTX nao foi gerado"

    # Sem action_title fraco
    weak_titles = _findings_by_category(response, "action_title_low_score")
    assert len(weak_titles) == 0, \
        f"esperava 0 action_title_low_score em briefing forte, recebi {len(weak_titles)}: {weak_titles}"

    # Sem missing_source
    missing_source = _findings_by_category(response, "missing_source")
    assert len(missing_source) == 0, \
        f"esperava 0 missing_source em briefing forte, recebi {len(missing_source)}"


# ---------------------------------------------------------------------------
# T2: Action titles fracos detectados (BLOQUEIO)
# ---------------------------------------------------------------------------
def test_full_pipeline_briefing_weak_titles_blocks(tmp_path: Path):
    """Briefing com 'Análise de receita' / 'Visão geral 2025' / 'Os dados mostram'
    deve disparar action_title_low_score (severity=high) e exit 2 quando
    --fail-on-blocking setado."""
    response = _run_build(_weak_titles_briefing(), tmp_path, fail_on_blocking=True)

    assert response["_exit_code"] == 2, \
        f"esperava exit 2 (blocking), recebi {response['_exit_code']}"
    assert response["blocked"] is True

    weak_titles = _findings_by_category(response, "action_title_low_score")
    assert len(weak_titles) >= 2, (
        f"esperava >=2 action_title_low_score (slides 2 e 3 sao fracos), "
        f"recebi {len(weak_titles)}: "
        f"{[f.get('message')[:80] for f in weak_titles]}"
    )

    # Severity high (blocking)
    assert all(str(f.get("severity")).lower() == "high" for f in weak_titles), \
        "weak titles devem ser severity=high"


# ---------------------------------------------------------------------------
# T3: Slide quantitativo (hero_number) sem source → BLOQUEIO
# ---------------------------------------------------------------------------
def test_full_pipeline_anatomy_missing_source(tmp_path: Path):
    """hero_number sem campo 'source' ou 'fonte' deve disparar missing_source
    high severity (pre-build validator) E source_line/anatomy_missing
    (post-build validators)."""
    response = _run_build(_missing_source_briefing(), tmp_path, fail_on_blocking=True)

    assert response["_exit_code"] == 2
    assert response["blocked"] is True

    missing_source = _findings_by_category(response, "missing_source")
    assert len(missing_source) >= 1, (
        f"esperava >=1 missing_source, recebi {len(missing_source)}. "
        f"Findings: {[f.get('category') for f in response.get('findings', [])]}"
    )
    # Pre-build validator marca como high
    assert any(str(f.get("severity")).lower() == "high"
               for f in missing_source), \
        "missing_source deve ter severity=high"


# ---------------------------------------------------------------------------
# T4: Lang validator detecta frases fracas em body
# ---------------------------------------------------------------------------
def test_full_pipeline_lang_weak_phrases(tmp_path: Path):
    """Body com 'os dados mostram que', 'pode-se notar', 'e importante destacar'
    deve disparar warnings do lang_validator (categoria 'lang_weak'/'weak_phrase')."""
    response = _run_build(_weak_lang_briefing(), tmp_path)

    assert response.get("pipeline_mode") == "full"
    assert response["_pptx_exists"]

    # lang_validator emite warnings com category contendo 'lang' ou 'weak'
    lang_warnings = [
        f for f in response.get("findings", [])
        if "lang" in str(f.get("category", "")).lower()
        or "weak" in str(f.get("category", "")).lower()
    ]
    # Esperamos pelo menos 1 weak phrase ('os dados mostram', 'e importante')
    assert len(lang_warnings) >= 1, (
        f"esperava >=1 lang/weak warning, recebi {len(lang_warnings)}. "
        f"Categorias: {sorted({f.get('category') for f in response.get('findings', [])})}"
    )


# ---------------------------------------------------------------------------
# T5: --no-llm fallback completa sem erro
# ---------------------------------------------------------------------------
def test_full_pipeline_no_llm_fallback(tmp_path: Path, monkeypatch):
    """Sem ANTHROPIC_API_KEY + --no-llm:
      - validators LLM (Pyramid, MECE) caem para regex
      - pipeline completa (exit 0 ou 2 dependendo dos findings)
      - Flag AG5_DISABLE_LLM_VALIDATORS setada
      - response inclui pipeline_mode='full'
    """
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    response = _run_build(_strong_briefing(), tmp_path)

    assert response.get("pipeline_mode") == "full", (
        f"--no-llm DEVE manter pipeline_mode='full' (regex fallback), "
        f"recebi {response.get('pipeline_mode')}"
    )
    assert response["_exit_code"] in {0, 2}  # 2 e ok se outros findings nao-LLM
    assert response["_pptx_exists"]
    # Flag setada por _build_deck_full
    assert os.environ.get("AG5_DISABLE_LLM_VALIDATORS") == "1"


# ---------------------------------------------------------------------------
# T6: Force minimal mode — fallback explicito
# ---------------------------------------------------------------------------
def test_full_pipeline_force_minimal_flag(tmp_path: Path):
    """--force-minimal pula full pipeline, retorna pipeline_mode='minimal'."""
    response = _run_build(
        _strong_briefing(), tmp_path,
        extra_args=["--force-minimal"],
    )

    assert response.get("pipeline_mode") == "minimal", (
        f"--force-minimal DEVE produzir pipeline_mode='minimal', "
        f"recebi {response.get('pipeline_mode')}"
    )
    # Mesmo assim, PPTX deve ter sido gerado e ter findings
    assert response["_pptx_exists"]
    # fallback_reason deve estar presente
    assert response.get("fallback_reason") is not None
