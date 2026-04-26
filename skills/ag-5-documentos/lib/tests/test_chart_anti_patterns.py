"""Tests para ChartAntiPatternDetector + audit_chart_full (PR 4.2) — AP01..AP08."""
from __future__ import annotations

import sys
from pathlib import Path

_LIB = Path(__file__).resolve().parents[1]
if str(_LIB) not in sys.path:
    sys.path.insert(0, str(_LIB))

from chart_validator import (  # noqa: E402
    AntiPatternDetection,
    ChartAntiPatternDetector,
    audit_chart_full,
)


def _good_action_title() -> str:
    return "Receita cresceu 25% pressionando margem"


def _codes(detections):
    return [d.code for d in detections]


# ---- AP01: too_many_categories_pie ---------------------------------------

def test_ap01_pie_with_9_slices_detected():
    spec = {
        "type": "pie",
        "data": [{"label": f"L{i}", "value": i + 1} for i in range(9)],
        "action_title": _good_action_title(),
    }
    detections = ChartAntiPatternDetector().detect(spec)
    assert "AP01" in _codes(detections)
    ap01 = next(d for d in detections if d.code == "AP01")
    assert "Outros" in ap01.suggestion


def test_ap01_pie_with_3_slices_not_detected():
    spec = {
        "type": "pie",
        "data": [{"label": "A", "value": 50}, {"label": "B", "value": 30},
                 {"label": "C", "value": 20}],
        "action_title": _good_action_title(),
    }
    detections = ChartAntiPatternDetector().detect(spec)
    assert "AP01" not in _codes(detections)


# ---- AP02: line_chart_too_many_series ------------------------------------

def test_ap02_line_with_5_series_detected():
    spec = {
        "type": "line",
        "data": [{"date": f"2026-{i:02d}", "value": i, "series": f"s{i}"}
                 for i in range(1, 6)],
        "action_title": _good_action_title(),
    }
    detections = ChartAntiPatternDetector().detect(spec)
    assert "AP02" in _codes(detections)


def test_ap02_line_with_2_series_not_detected():
    spec = {
        "type": "line",
        "data": [{"date": "2026-01", "value": 1, "series": "a"},
                 {"date": "2026-02", "value": 2, "series": "b"}],
        "action_title": _good_action_title(),
    }
    detections = ChartAntiPatternDetector().detect(spec)
    assert "AP02" not in _codes(detections)


# ---- AP03: bar_unsorted ---------------------------------------------------

def test_ap03_bar_with_5_categories_no_sort_detected():
    spec = {
        "type": "bar",
        "data": [{"label": f"L{i}", "value": (i + 1) * 10} for i in range(5)],
        "action_title": _good_action_title(),
        "format": {"zero_baseline": True},
    }
    detections = ChartAntiPatternDetector().detect(spec)
    assert "AP03" in _codes(detections)


def test_ap03_bar_with_sort_desc_not_detected():
    spec = {
        "type": "bar",
        "data": [{"label": f"L{i}", "value": (i + 1) * 10} for i in range(5)],
        "action_title": _good_action_title(),
        "format": {"zero_baseline": True, "sort": "desc"},
    }
    detections = ChartAntiPatternDetector().detect(spec)
    assert "AP03" not in _codes(detections)


# ---- AP04: dual_axis_misleading ------------------------------------------

def test_ap04_combo_without_labels_detected():
    spec = {
        "type": "combo",
        "data": [{"label": "Q1", "value": 100}],
        "action_title": _good_action_title(),
        "format": {},
    }
    detections = ChartAntiPatternDetector().detect(spec)
    assert "AP04" in _codes(detections)


def test_ap04_combo_with_both_labels_not_detected():
    spec = {
        "type": "combo",
        "data": [{"label": "Q1", "value": 100}],
        "action_title": _good_action_title(),
        "format": {"y_label": "R$M", "y2_label": "%"},
    }
    detections = ChartAntiPatternDetector().detect(spec)
    assert "AP04" not in _codes(detections)


# ---- AP05: waterfall_missing_total ---------------------------------------

def test_ap05_waterfall_without_total_detected():
    spec = {
        "type": "waterfall",
        "data": [
            {"label": "Inicial", "value": 100, "type": "positive"},
            {"label": "Vendas",  "value": 30,  "type": "positive"},
        ],
        "action_title": _good_action_title(),
    }
    detections = ChartAntiPatternDetector().detect(spec)
    assert "AP05" in _codes(detections)


def test_ap05_waterfall_with_total_not_detected():
    spec = {
        "type": "waterfall",
        "data": [
            {"label": "Inicial", "value": 100, "type": "positive"},
            {"label": "Total",   "value": 100, "type": "total"},
        ],
        "action_title": _good_action_title(),
    }
    detections = ChartAntiPatternDetector().detect(spec)
    assert "AP05" not in _codes(detections)


# ---- AP06: zero_baseline_violated ----------------------------------------

def test_ap06_bar_zero_baseline_false_detected():
    spec = {
        "type": "bar",
        "data": [{"label": "A", "value": 100}, {"label": "B", "value": 110}],
        "action_title": _good_action_title(),
        "format": {"zero_baseline": False},
    }
    detections = ChartAntiPatternDetector().detect(spec)
    assert "AP06" in _codes(detections)
    ap06 = next(d for d in detections if d.code == "AP06")
    assert ap06.severity == "error"


def test_ap06_bar_zero_baseline_true_not_detected():
    spec = {
        "type": "bar",
        "data": [{"label": "A", "value": 100}],
        "action_title": _good_action_title(),
        "format": {"zero_baseline": True},
    }
    detections = ChartAntiPatternDetector().detect(spec)
    assert "AP06" not in _codes(detections)


# ---- AP07: negative_values_in_donut --------------------------------------

def test_ap07_donut_negative_value_detected():
    spec = {
        "type": "donut",
        "data": [{"label": "A", "value": -10}, {"label": "B", "value": 50}],
        "action_title": _good_action_title(),
    }
    detections = ChartAntiPatternDetector().detect(spec)
    assert "AP07" in _codes(detections)


def test_ap07_donut_all_positive_not_detected():
    spec = {
        "type": "donut",
        "data": [{"label": "A", "value": 30}, {"label": "B", "value": 70}],
        "action_title": _good_action_title(),
    }
    detections = ChartAntiPatternDetector().detect(spec)
    assert "AP07" not in _codes(detections)


# ---- AP08: highlight_all_bars --------------------------------------------

def test_ap08_highlight_all_labels_detected():
    spec = {
        "type": "bar",
        "data": [{"label": "A", "value": 1}, {"label": "B", "value": 2},
                 {"label": "C", "value": 3}],
        "action_title": _good_action_title(),
        "format": {"highlight": ["A", "B", "C"], "zero_baseline": True},
    }
    detections = ChartAntiPatternDetector().detect(spec)
    assert "AP08" in _codes(detections)


def test_ap08_highlight_one_not_detected():
    spec = {
        "type": "bar",
        "data": [{"label": "A", "value": 1}, {"label": "B", "value": 2},
                 {"label": "C", "value": 3}],
        "action_title": _good_action_title(),
        "format": {"highlight": ["B"], "zero_baseline": True},
    }
    detections = ChartAntiPatternDetector().detect(spec)
    assert "AP08" not in _codes(detections)


# ---- audit_chart_full integration ----------------------------------------

def test_audit_chart_full_returns_4_keys():
    spec = {
        "type": "bar",
        "data": [{"label": "A", "value": 100}],
        "action_title": _good_action_title(),
        "source": "x",
        "format": {"zero_baseline": True},
        "palette": "categorical",
    }
    result = audit_chart_full(spec)
    assert set(result.keys()) == {"errors", "anti_patterns",
                                   "blocked_for_delivery", "warnings"}
    assert result["blocked_for_delivery"] == []


def test_audit_chart_full_separates_blocked_from_warnings():
    spec = {
        "type": "stardust",       # V01 bloqueante
        "data": [{"label": "A", "value": 100}],  # V03 ok-ish
        "action_title": "Vendas",  # V04 bloqueante (formula fraca)
        "format": {},
    }
    result = audit_chart_full(spec)
    blocked_codes = [e.code for e in result["blocked_for_delivery"]]
    assert "V01" in blocked_codes and "V04" in blocked_codes
    assert all(e.bloqueante for e in result["blocked_for_delivery"])


def test_audit_chart_full_combines_warnings_and_anti_patterns():
    """Spec com 1 warning (V05) + 1 anti-pattern (AP01)."""
    spec = {
        "type": "donut",
        "data": [{"label": f"L{i}", "value": i + 1} for i in range(8)],
        "action_title": _good_action_title(),
        # sem source -> V05 dispara (warning)
    }
    result = audit_chart_full(spec)
    warning_codes = [
        (w.code if hasattr(w, "code") else None) for w in result["warnings"]
    ]
    assert "V05" in warning_codes  # validator warning
    assert "AP01" in warning_codes  # anti-pattern


# ---- AntiPatternDetection dataclass --------------------------------------

def test_anti_pattern_dataclass_has_expected_fields():
    d = AntiPatternDetection(code="AP01", severity="warning",
                              message="x", suggestion="y")
    assert d.code == "AP01"
    assert d.severity == "warning"
    assert d.suggestion == "y"
