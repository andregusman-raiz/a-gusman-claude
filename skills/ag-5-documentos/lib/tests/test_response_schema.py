"""Tests para response_schema (PR 5.1)."""
from __future__ import annotations

import pytest
import yaml
from pydantic import ValidationError

from lib.response_schema import (
    CriarResposta,
    RevisarResposta,
    emit_criar,
    emit_revisar,
    build_criar_payload,
    build_revisar_payload,
)


def _criar_payload_min() -> dict:
    return {
        "deck_metadata": {
            "title": "Resultados Q3",
            "audience": "ceo",
            "format": "executive",
            "tom": "consultivo",
            "storyline": "scqa",
            "num_slides": 8,
        },
        "storyline_aplicado": "scqa",
        "outline": [
            {"idx": 1, "kind": "cover", "action_title": "Resultados Q3 superam metas em 12%"},
            {"idx": 2, "kind": "exec_summary", "action_title": "3 alavancas explicam o resultado"},
        ],
        "final_acceptance_score": {"tests_passed": 6, "tests_total": 7, "ratio": 0.857},
    }


def _revisar_payload_min() -> dict:
    return {
        "deck_path": "/tmp/deck.pptx",
        "num_slides": 10,
        "score_geral": {"pyramid_ok": True, "score": 85},
    }


# ---------------------------------------------------------------------------
# 1. criar valido
# ---------------------------------------------------------------------------
def test_criar_payload_minimal_valid():
    yaml_str = emit_criar(_criar_payload_min())
    parsed = yaml.safe_load(yaml_str)
    assert parsed["mode"] == "criar"
    assert parsed["schema_version"] == "1.0"
    assert parsed["storyline_aplicado"] == "scqa"
    assert len(parsed["outline"]) == 2
    assert parsed["final_acceptance_score"]["tests_passed"] == 6


# ---------------------------------------------------------------------------
# 2. revisar valido
# ---------------------------------------------------------------------------
def test_revisar_payload_minimal_valid():
    yaml_str = emit_revisar(_revisar_payload_min())
    parsed = yaml.safe_load(yaml_str)
    assert parsed["mode"] == "revisar"
    assert parsed["deck_path"] == "/tmp/deck.pptx"
    assert parsed["num_slides"] == 10
    assert parsed["issues_blocking"] == []
    assert parsed["score_geral"]["score"] == 85


# ---------------------------------------------------------------------------
# 3. missing required campo -> ValidationError
# ---------------------------------------------------------------------------
def test_criar_missing_required_raises():
    bad = _criar_payload_min()
    del bad["deck_metadata"]
    with pytest.raises(ValidationError):
        emit_criar(bad)


def test_revisar_missing_required_raises():
    bad = _revisar_payload_min()
    del bad["score_geral"]
    with pytest.raises(ValidationError):
        emit_revisar(bad)


# ---------------------------------------------------------------------------
# 4. chart_specs opcional aceita None ou lista
# ---------------------------------------------------------------------------
def test_criar_chart_specs_optional():
    payload = _criar_payload_min()
    payload["chart_specs"] = [
        {"slide_idx": 3, "chart_type": "bar_horizontal", "data": {}},
    ]
    yaml_str = emit_criar(payload)
    parsed = yaml.safe_load(yaml_str)
    assert parsed["chart_specs"][0]["slide_idx"] == 3


def test_criar_chart_specs_none_serializes_null():
    payload = _criar_payload_min()
    payload["chart_specs"] = None
    yaml_str = emit_criar(payload)
    parsed = yaml.safe_load(yaml_str)
    assert parsed["chart_specs"] is None


# ---------------------------------------------------------------------------
# 5. YAML round-trip preserva tipos
# ---------------------------------------------------------------------------
def test_yaml_roundtrip_preserves_data():
    payload = _criar_payload_min()
    payload["validators_aplicados"] = ["pyramid", "mece", "action_title"]
    payload["audit_warnings"] = [
        {"severity": "warning", "code": "WK01", "message": "weak language detected"},
    ]
    yaml_str = emit_criar(payload)
    parsed = yaml.safe_load(yaml_str)

    # Re-validar com Pydantic apos round-trip
    rebuilt = CriarResposta(**parsed)
    assert rebuilt.validators_aplicados == ["pyramid", "mece", "action_title"]
    assert rebuilt.audit_warnings[0]["code"] == "WK01"


# ---------------------------------------------------------------------------
# 6. integration smoke — build payload helpers
# ---------------------------------------------------------------------------
def test_build_criar_payload_from_pipeline_outputs():
    class FakeWarning:
        def __init__(self, severity, code, message):
            self.severity = severity
            self.code = code
            self.message = message

    payload = build_criar_payload(
        deck_metadata={"title": "X", "num_slides": 5, "audience": "ceo",
                       "format": "executive", "tom": "consultivo", "storyline": "scqa"},
        storyline="scqa",
        outline=[{"idx": 1, "kind": "cover", "action_title": "T"}],
        final_acceptance={"tests_passed": 5, "tests_total": 7},
        audit_warnings=[FakeWarning("warning", "WK01", "x")],
        validators_aplicados=["pyramid"],
    )
    yaml_str = emit_criar(payload)
    parsed = yaml.safe_load(yaml_str)
    assert parsed["final_acceptance_score"]["ratio"] == round(5 / 7, 3)
    assert parsed["audit_warnings"][0]["code"] == "WK01"


def test_build_revisar_payload_separates_severities():
    class FakeWarning:
        def __init__(self, severity, code, message):
            self.severity = severity
            self.code = code
            self.message = message

    payload = build_revisar_payload(
        deck_path="/tmp/x.pptx",
        num_slides=3,
        audit_warnings=[
            FakeWarning("error", "ERR01", "blocker"),
            FakeWarning("warning", "WK01", "soft"),
            FakeWarning("critical", "CRIT", "must fix"),
        ],
        score_components={"pyramid_ok": True, "mece_ok": True, "anatomy_ok": False},
    )
    yaml_str = emit_revisar(payload)
    parsed = yaml.safe_load(yaml_str)
    assert len(parsed["issues_blocking"]) == 2  # error + critical
    assert len(parsed["issues_warning"]) == 1
    assert parsed["score_geral"]["pyramid_ok"] is True
