"""Tests para ChartSpecValidator (PR 4.1) — V01..V13."""
from __future__ import annotations

import sys
from pathlib import Path

# Permite rodar tanto via pytest a partir do repo quanto local.
_LIB = Path(__file__).resolve().parents[1]
if str(_LIB) not in sys.path:
    sys.path.insert(0, str(_LIB))

from chart_validator import (  # noqa: E402
    CANONICAL_CHART_TYPES,
    ChartSpecValidator,
    ChartValidationError,
)


def _good_action_title() -> str:
    """Action title que passa formula_score >= 2 (conclusao + numero)."""
    return "Receita cresceu 25% pressionando margem"


def _base_bar_spec() -> dict:
    return {
        "type": "bar",
        "data": [
            {"label": "A", "value": 100},
            {"label": "B", "value": 80},
            {"label": "C", "value": 60},
        ],
        "action_title": _good_action_title(),
        "source": "Dados internos 2026-04",
        "format": {"zero_baseline": True, "highlight": []},
        "palette": "categorical",
    }


def _codes(errors):
    return [e.code for e in errors]


# ---- Happy path -----------------------------------------------------------

def test_happy_path_no_errors():
    spec = _base_bar_spec()
    errors = ChartSpecValidator(spec).validate()
    assert errors == [], f"esperava 0 erros, obteve {_codes(errors)}"


# ---- V01 type_exists ------------------------------------------------------

def test_v01_unknown_type_blocks():
    spec = _base_bar_spec()
    spec["type"] = "stardust_chart"
    errors = ChartSpecValidator(spec).validate()
    assert "V01" in _codes(errors)
    v01 = next(e for e in errors if e.code == "V01")
    assert v01.bloqueante is True and v01.level == "P0"


def test_v01_all_canonical_types_pass_v01():
    for t in CANONICAL_CHART_TYPES:
        spec = {"type": t, "data": [{"label": "x", "value": 1}],
                "action_title": _good_action_title()}
        errors = ChartSpecValidator(spec).validate()
        assert "V01" not in _codes(errors), f"type {t} deveria passar V01"


# ---- V02 data_not_empty ---------------------------------------------------

def test_v02_empty_data_blocks():
    spec = _base_bar_spec()
    spec["data"] = []
    errors = ChartSpecValidator(spec).validate()
    assert "V02" in _codes(errors)


# ---- V03 required_fields --------------------------------------------------

def test_v03_missing_required_fields_blocks():
    spec = _base_bar_spec()
    spec["data"] = [{"label": "A"}]  # falta 'value'
    errors = ChartSpecValidator(spec).validate()
    assert "V03" in _codes(errors)


def test_v03_waterfall_requires_type_field():
    spec = _base_bar_spec()
    spec["type"] = "waterfall"
    spec["data"] = [{"label": "A", "value": 10}]  # falta 'type'
    errors = ChartSpecValidator(spec).validate()
    assert "V03" in _codes(errors)


# ---- V04 action_title_quality --------------------------------------------

def test_v04_weak_title_blocks():
    spec = _base_bar_spec()
    spec["action_title"] = "Vendas"  # sem conclusao + numero + implicacao
    errors = ChartSpecValidator(spec).validate()
    assert "V04" in _codes(errors)


# ---- V05 source_present ---------------------------------------------------

def test_v05_quantitative_without_source_warns():
    spec = _base_bar_spec()
    spec.pop("source")
    errors = ChartSpecValidator(spec).validate()
    v05 = [e for e in errors if e.code == "V05"]
    assert len(v05) == 1 and v05[0].bloqueante is False


# ---- V06 data_size --------------------------------------------------------

def test_v06_pie_too_many_slices_warns():
    spec = _base_bar_spec()
    spec["type"] = "pie"
    spec["data"] = [{"label": f"L{i}", "value": i + 1} for i in range(7)]
    errors = ChartSpecValidator(spec).validate()
    assert "V06" in _codes(errors)


def test_v06_bar_within_limit_passes():
    spec = _base_bar_spec()
    spec["data"] = [{"label": f"L{i}", "value": i + 1} for i in range(8)]
    errors = ChartSpecValidator(spec).validate()
    assert "V06" not in _codes(errors)


# ---- V07 value_non_negative -----------------------------------------------

def test_v07_donut_negative_value_warns():
    spec = _base_bar_spec()
    spec["type"] = "donut"
    spec["data"] = [{"label": "A", "value": -10}, {"label": "B", "value": 50}]
    errors = ChartSpecValidator(spec).validate()
    assert "V07" in _codes(errors)


# ---- V08 zero_baseline ----------------------------------------------------

def test_v08_bar_without_zero_baseline_warns():
    spec = _base_bar_spec()
    spec["format"]["zero_baseline"] = False
    errors = ChartSpecValidator(spec).validate()
    assert "V08" in _codes(errors)


# ---- V09 highlight_valid --------------------------------------------------

def test_v09_highlight_unknown_label_warns():
    spec = _base_bar_spec()
    spec["format"]["highlight"] = ["A", "Z"]
    errors = ChartSpecValidator(spec).validate()
    assert "V09" in _codes(errors)


# ---- V10 palette_semantic -------------------------------------------------

def test_v10_categorical_with_wrong_palette_warns():
    spec = _base_bar_spec()
    spec["palette"] = "sequential"
    errors = ChartSpecValidator(spec).validate()
    assert "V10" in _codes(errors)


# ---- V11 takeaway_length --------------------------------------------------

def test_v11_takeaway_too_long_warns():
    spec = _base_bar_spec()
    spec["takeaway_bar"] = " ".join(["palavra"] * 25)
    errors = ChartSpecValidator(spec).validate()
    assert "V11" in _codes(errors)


# ---- V12 title_word_count -------------------------------------------------

def test_v12_title_too_long_warns():
    spec = _base_bar_spec()
    spec["action_title"] = (
        "Receita cresceu 25 por cento neste trimestre pressionando "
        "margem operacional bruta liquida em todas regioes"
    )
    errors = ChartSpecValidator(spec).validate()
    assert "V12" in _codes(errors)


# ---- V13 waterfall_balance ------------------------------------------------

def test_v13_waterfall_unbalanced_warns():
    spec = {
        "type": "waterfall",
        "action_title": _good_action_title(),
        "source": "x",
        "data": [
            {"label": "Inicial", "value": 100, "type": "positive"},
            {"label": "Vendas",  "value": 50,  "type": "positive"},
            {"label": "Custos",  "value": -20, "type": "negative"},
            {"label": "Total",   "value": 999, "type": "total"},
        ],
    }
    errors = ChartSpecValidator(spec).validate()
    assert "V13" in _codes(errors)


def test_v13_waterfall_balanced_passes():
    spec = {
        "type": "waterfall",
        "action_title": _good_action_title(),
        "source": "x",
        "data": [
            {"label": "Inicial", "value": 100, "type": "positive"},
            {"label": "Vendas",  "value": 50,  "type": "positive"},
            {"label": "Custos",  "value": -20, "type": "negative"},
            {"label": "Total",   "value": 130, "type": "total"},
        ],
    }
    errors = ChartSpecValidator(spec).validate()
    assert "V13" not in _codes(errors)


# ---- ChartValidationError dataclass --------------------------------------

def test_error_dataclass_has_expected_fields():
    err = ChartValidationError(code="V01", level="P0", bloqueante=True,
                               message="x", field="type")
    assert err.code == "V01"
    assert err.level == "P0"
    assert err.bloqueante is True
    assert err.field == "type"
