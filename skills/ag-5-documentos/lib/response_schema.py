"""Padrao de resposta YAML canonical para `criar` / `revisar` (PR 5.1).

Implementa secoes 28-29 do guia mestre executive (item #37 do roadmap).

Dois schemas Pydantic v2:
  - `CriarResposta`: emitida ao final do modo `criar` (nova geracao de deck).
  - `RevisarResposta`: emitida no modo `revisar` (auditoria de deck existente).

Funcoes helpers:
  - `emit_criar(payload)`  -> str YAML
  - `emit_revisar(payload)` -> str YAML

Hook backward-compatible: o pipeline so emite YAML quando flag explicita
(`emit_yaml=True` em `Pipeline.audit()` ou caller passa o resultado do
final acceptance + outline para `emit_criar`). Comportamento existente nao
muda — a integracao e opt-in.

Estrutura alinhada com SPEC chart-CEO em
`docs/specs/ag-5-documentos-graficos-ceo/SPEC.md` (chart_specs por slide_idx).
"""
from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

import yaml
from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class CriarResposta(BaseModel):
    """Schema canonical para o modo `criar` (geracao de deck novo)."""

    model_config = ConfigDict(extra="forbid")

    schema_version: Literal["1.0"] = "1.0"
    mode: Literal["criar"] = "criar"
    deck_metadata: Dict[str, Any] = Field(
        ...,
        description="Metadata do deck: title, audience, format, tom, storyline, num_slides.",
    )
    storyline_aplicado: str = Field(
        ...,
        description="Nome canonical do storyline (ex: scqa, problem_solution, recommendation_first).",
    )
    outline: List[Dict[str, Any]] = Field(
        ...,
        description="Lista de slides: idx, kind, action_title, viz_kind?, content.",
    )
    chart_specs: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Specs de graficos por slide_idx (alinhado com SPEC chart-CEO).",
    )
    validators_aplicados: List[str] = Field(
        default_factory=list,
        description="Validators executados: pyramid, mece, action_title, anatomy, ...",
    )
    final_acceptance_score: Dict[str, Any] = Field(
        ...,
        description="{tests_passed: int, tests_total: int, ratio: float}.",
    )
    audit_warnings: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Warnings retornados por audit_deck (severity + code + message).",
    )


class RevisarResposta(BaseModel):
    """Schema canonical para o modo `revisar` (auditoria de deck existente)."""

    model_config = ConfigDict(extra="forbid")

    schema_version: Literal["1.0"] = "1.0"
    mode: Literal["revisar"] = "revisar"
    deck_path: str
    num_slides: int = Field(..., ge=0)
    issues_blocking: List[Dict[str, Any]] = Field(default_factory=list)
    issues_warning: List[Dict[str, Any]] = Field(default_factory=list)
    chart_audit: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Output de audit_chart_full por slide quando aplicavel.",
    )
    sugestoes_correcao: List[Dict[str, Any]] = Field(default_factory=list)
    score_geral: Dict[str, Any] = Field(
        ...,
        description="{pyramid_ok, mece_ok, action_titles_ok, anatomy_ok, chart_ok, score: 0-100}.",
    )


# ---------------------------------------------------------------------------
# Emissores YAML
# ---------------------------------------------------------------------------
def _to_yaml(model: BaseModel) -> str:
    data = model.model_dump(mode="python")
    return yaml.safe_dump(
        data,
        sort_keys=False,
        allow_unicode=True,
        default_flow_style=False,
    )


def emit_criar(payload: Dict[str, Any]) -> str:
    """Valida payload contra `CriarResposta` e serializa para YAML.

    Lanca `pydantic.ValidationError` se payload nao bater com o schema.
    """
    model = CriarResposta(**payload)
    return _to_yaml(model)


def emit_revisar(payload: Dict[str, Any]) -> str:
    """Valida payload contra `RevisarResposta` e serializa para YAML."""
    model = RevisarResposta(**payload)
    return _to_yaml(model)


# ---------------------------------------------------------------------------
# Helpers de integracao com pipeline
# ---------------------------------------------------------------------------
def build_criar_payload(
    *,
    deck_metadata: Dict[str, Any],
    storyline: str,
    outline: List[Dict[str, Any]],
    final_acceptance: Dict[str, Any],
    audit_warnings: Optional[List[Any]] = None,
    chart_specs: Optional[List[Dict[str, Any]]] = None,
    validators_aplicados: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Monta payload `CriarResposta` a partir de outputs do pipeline.

    Converte AuditWarning (dataclass) em dict transparente.
    """
    warnings_serialized: List[Dict[str, Any]] = []
    for w in audit_warnings or []:
        if hasattr(w, "__dict__"):
            warnings_serialized.append(
                {k: v for k, v in w.__dict__.items() if not k.startswith("_")}
            )
        elif isinstance(w, dict):
            warnings_serialized.append(w)

    tests_passed = int(final_acceptance.get("tests_passed", 0))
    tests_total = int(final_acceptance.get("tests_total", 7))
    ratio = round(tests_passed / tests_total, 3) if tests_total else 0.0

    return {
        "deck_metadata": deck_metadata,
        "storyline_aplicado": storyline,
        "outline": outline,
        "chart_specs": chart_specs,
        "validators_aplicados": validators_aplicados or [],
        "final_acceptance_score": {
            "tests_passed": tests_passed,
            "tests_total": tests_total,
            "ratio": ratio,
        },
        "audit_warnings": warnings_serialized,
    }


def build_revisar_payload(
    *,
    deck_path: str,
    num_slides: int,
    audit_warnings: List[Any],
    chart_audit: Optional[Dict[str, Any]] = None,
    sugestoes: Optional[List[Dict[str, Any]]] = None,
    score_components: Optional[Dict[str, bool]] = None,
) -> Dict[str, Any]:
    """Monta payload `RevisarResposta`. Separa blocking de warning por severity."""
    blocking: List[Dict[str, Any]] = []
    warning: List[Dict[str, Any]] = []
    for w in audit_warnings or []:
        item = (
            {k: v for k, v in w.__dict__.items() if not k.startswith("_")}
            if hasattr(w, "__dict__")
            else dict(w)
        )
        sev = str(item.get("severity", "warning")).lower()
        if sev in ("error", "blocking", "high", "critical"):
            blocking.append(item)
        else:
            warning.append(item)

    components = score_components or {}
    score = sum(1 for v in components.values() if v) * (100 // max(len(components), 1)) if components else 0

    return {
        "deck_path": deck_path,
        "num_slides": num_slides,
        "issues_blocking": blocking,
        "issues_warning": warning,
        "chart_audit": chart_audit,
        "sugestoes_correcao": sugestoes or [],
        "score_geral": {
            **components,
            "score": min(score, 100),
        },
    }


__all__ = [
    "CriarResposta",
    "RevisarResposta",
    "emit_criar",
    "emit_revisar",
    "build_criar_payload",
    "build_revisar_payload",
]
