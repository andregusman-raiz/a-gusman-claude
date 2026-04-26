"""ChartSpecValidator + ChartAntiPatternDetector — gates para charts CEO.

Implementa SPEC `~/Claude/docs/specs/ag-5-documentos-graficos-ceo/SPEC.md` Etapa 6:
- 13 validators (V01-V13) — gates de qualidade do ChartSpec
- 8 anti-pattern detectors (AP01-AP08) — heuristicas que sugerem correcao

Por enquanto opera em `dict` (ChartSpec ainda nao existe como dataclass — sera
introduzido em PR-A da SPEC). Schema esperado:

    {
      "type": str,                 # ex: "bar", "line", "donut", "waterfall"
      "data": List[dict],          # cada dict com campos do tipo
      "action_title": str,         # titulo no formato McKinsey
      "source": Optional[str],
      "takeaway_bar": Optional[str],
      "format": {
          "highlight": List[str],
          "sort": Optional[str],
          "zero_baseline": bool,
          "y_label": Optional[str],
          "y2_label": Optional[str],
      },
      "palette": Optional[str],    # "categorical" | "diverging" | "sequential"
    }

Nomes/codigos batem EXATAMENTE com a SPEC para retrofit pos-ChartSpec.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


# Lista canonical de chart types (provisoria ate CHART_REGISTRY existir).
CANONICAL_CHART_TYPES = {
    "bar", "bar_chart", "grouped_bar", "stacked_bar", "stacked100_bar",
    "line", "area", "combo", "pie", "donut", "scatter", "heatmap",
    "waterfall", "bullet", "infographic", "treemap", "driver_tree", "slope",
}

# Campos obrigatorios por tipo (subset cobrindo tipos mais comuns).
REQUIRED_FIELDS_BY_TYPE: Dict[str, List[str]] = {
    "bar":            ["label", "value"],
    "bar_chart":      ["label", "value"],
    "grouped_bar":    ["label", "value", "group"],
    "stacked_bar":    ["label", "value", "stack"],
    "stacked100_bar": ["label", "value", "stack"],
    "line":           ["date", "value"],
    "area":           ["date", "value"],
    "combo":          ["label", "value"],
    "pie":            ["label", "value"],
    "donut":          ["label", "value"],
    "scatter":        ["x", "y"],
    "heatmap":        ["row", "col", "value"],
    "waterfall":      ["label", "value", "type"],
    "bullet":         ["metric", "actual", "target"],
    "infographic":    ["label", "value"],
    "treemap":        ["label", "value"],
    "driver_tree":    ["label", "value"],
    "slope":          ["label", "start", "end"],
}

# Limites de tamanho por tipo (V06).
SIZE_LIMITS: Dict[str, int] = {
    "pie": 5, "donut": 5,
    "bar": 10, "bar_chart": 10, "grouped_bar": 10,
    "stacked_bar": 10, "stacked100_bar": 10,
}

# Tipos onde valor negativo nao faz sentido (V07/AP07).
NON_NEGATIVE_TYPES = {"pie", "donut"}

# Tipos categoricos — paleta esperada e "categorical" (V10).
CATEGORICAL_TYPES = {
    "bar", "bar_chart", "grouped_bar", "stacked_bar", "stacked100_bar",
    "pie", "donut", "infographic",
}

# Tipos que exigem zero baseline (V08/AP06).
ZERO_BASELINE_TYPES = {"bar", "bar_chart", "grouped_bar", "stacked_bar", "stacked100_bar"}


@dataclass
class ChartValidationError:
    """Erro detectado por ChartSpecValidator (V01..V13)."""
    code: str
    level: str           # "P0" | "P1" | "P2"
    bloqueante: bool
    message: str
    field: Optional[str] = None


@dataclass
class AntiPatternDetection:
    """Anti-pattern detectado (AP01..AP08)."""
    code: str
    severity: str        # "warning" | "error"
    message: str
    suggestion: str


def _word_count(text: str) -> int:
    return len([w for w in (text or "").split() if w.strip()])


def _has_quantitative(data: List[dict]) -> bool:
    """True se algum item de data tem valor numerico."""
    for item in data or []:
        if not isinstance(item, dict):
            continue
        for v in item.values():
            if isinstance(v, (int, float)) and not isinstance(v, bool):
                return True
    return False


# Heuristica formula McKinsey [Conclusao] + [Numero] + [Implicacao]. Replica
# leve do `mckinsey_pptx.validate_action_title_quality()` para evitar import
# transitivo de lxml/pptx (modulo precisa rodar em ambiente sem dependencias
# pesadas — o validator e plain Python). Mantem mesma semantica do V04.
import re as _re

_NUMBER_RE = _re.compile(
    r"(?:R\$\s*[\d.,]+|US?\$\s*[\d.,]+|\$\s*[\d.,]+|"
    r"\d+\s*x\b|\d{1,3}\s*%|\d{2,}\s*[A-Za-z]+|"
    r"\b\d+[.,]?\d*\s*(?:MM?|K|mil|milhao|milhoes|bilhao|bilhoes|B|pp))",
    _re.IGNORECASE,
)
_CONCLUSION_RE = _re.compile(
    r"\b(?:caiu|cai|caem|cresceu|cresce|crescem|reduz|reduziu|"
    r"aumentou|aumenta|aumentam|representa|representam|"
    r"pressiona|pressionam|exige|exigem|deve|devem|"
    r"limita|limitam|gera|geram|capturou|captura|"
    r"perde|perdeu|perdem|ganha|ganhou|ganham|"
    r"acelera|acelerou|atinge|atingiu|"
    r"desafia|desafiou|supera|superou|"
    r"concentra|concentrou|fragmenta|fragmentou|"
    r"transforma|transformou|posiciona|posicionou|"
    r"\bcaindo|crescendo|reduzindo|aumentando|capturando|gerando|"
    r"pressionando|exigindo|limitando|concentrando|fragmentando|"
    r"perdendo|ganhando|acelerando|atingindo|superando)\b",
    _re.IGNORECASE,
)
_IMPLICATION_RE = _re.compile(
    r"\b(?:portanto|exigindo|pressionando|exige|pressiona|"
    r"deve|deveria|para\s+capturar|para\s+atingir|para\s+evitar|"
    r"limitando|concentrando|gerando|expondo|"
    r"impedindo|forcando|obrigando|requer|requerendo|"
    r"sob\s+risco|sob\s+pressao|sob\s+ameaca|"
    r"impactando|comprometendo|inviabilizando)\b",
    _re.IGNORECASE,
)


def _formula_score(title: str) -> int:
    """Retorna 0..3 — 1 ponto cada para conclusao, numero, implicacao."""
    title = (title or "").strip()
    if not title:
        return 0
    has_num = bool(_NUMBER_RE.search(title))
    has_concl = bool(_CONCLUSION_RE.search(title))
    has_impl = bool(_IMPLICATION_RE.search(title))
    return int(has_num) + int(has_concl) + int(has_impl)


class ChartSpecValidator:
    """Valida um ChartSpec contra os 13 gates da SPEC Etapa 6.1."""

    def __init__(self, spec: Dict[str, Any]):
        self.spec = spec or {}
        self.errors: List[ChartValidationError] = []

    # ----- runners ---------------------------------------------------------

    def validate(self) -> List[ChartValidationError]:
        """Executa V01..V13 e retorna lista de erros encontrados."""
        self.errors = []
        self._v01_type_exists()
        self._v02_data_not_empty()
        self._v03_required_fields()
        self._v04_action_title_quality()
        self._v05_source_present()
        self._v06_data_size()
        self._v07_value_non_negative()
        self._v08_zero_baseline()
        self._v09_highlight_valid()
        self._v10_palette_semantic()
        self._v11_takeaway_length()
        self._v12_title_word_count()
        self._v13_waterfall_balance()
        return self.errors

    def _add(self, code: str, level: str, bloqueante: bool, msg: str,
             field: Optional[str] = None) -> None:
        self.errors.append(ChartValidationError(
            code=code, level=level, bloqueante=bloqueante,
            message=msg, field=field,
        ))

    # ----- validators ------------------------------------------------------

    def _v01_type_exists(self) -> None:
        t = self.spec.get("type")
        if not t or t not in CANONICAL_CHART_TYPES:
            self._add("V01", "P0", True,
                      f"chart type '{t}' nao esta em CHART_REGISTRY",
                      field="type")

    def _v02_data_not_empty(self) -> None:
        data = self.spec.get("data")
        if not data or not isinstance(data, list) or len(data) == 0:
            self._add("V02", "P0", True,
                      "spec.data deve ter ao menos 1 item",
                      field="data")

    def _v03_required_fields(self) -> None:
        t = self.spec.get("type")
        data = self.spec.get("data") or []
        if t not in REQUIRED_FIELDS_BY_TYPE or not data:
            return
        required = REQUIRED_FIELDS_BY_TYPE[t]
        for idx, item in enumerate(data):
            if not isinstance(item, dict):
                self._add("V03", "P0", True,
                          f"data[{idx}] nao e dict", field=f"data[{idx}]")
                continue
            missing = [f for f in required if f not in item]
            if missing:
                self._add("V03", "P0", True,
                          f"data[{idx}] sem campos obrigatorios {missing} para tipo '{t}'",
                          field=f"data[{idx}]")

    def _v04_action_title_quality(self) -> None:
        title = self.spec.get("action_title", "")
        score = _formula_score(title)
        if score < 2:
            self._add("V04", "P0", True,
                      f"action_title formula fraca ({score}/3): {title!r}",
                      field="action_title")

    def _v05_source_present(self) -> None:
        data = self.spec.get("data") or []
        source = self.spec.get("source")
        if _has_quantitative(data) and not source:
            self._add("V05", "P1", False,
                      "data tem numero quantitativo mas spec.source ausente",
                      field="source")

    def _v06_data_size(self) -> None:
        t = self.spec.get("type")
        data = self.spec.get("data") or []
        limit = SIZE_LIMITS.get(t)
        if limit is not None and len(data) > limit:
            self._add("V06", "P1", False,
                      f"tipo '{t}' aceita ate {limit} itens; recebido {len(data)}",
                      field="data")

    def _v07_value_non_negative(self) -> None:
        t = self.spec.get("type")
        if t not in NON_NEGATIVE_TYPES:
            return
        for idx, item in enumerate(self.spec.get("data") or []):
            v = item.get("value") if isinstance(item, dict) else None
            if isinstance(v, (int, float)) and v < 0:
                self._add("V07", "P1", False,
                          f"data[{idx}].value < 0 nao suportado em '{t}'",
                          field=f"data[{idx}].value")

    def _v08_zero_baseline(self) -> None:
        t = self.spec.get("type")
        if t not in ZERO_BASELINE_TYPES:
            return
        fmt = self.spec.get("format") or {}
        if fmt.get("zero_baseline") is False:
            self._add("V08", "P1", False,
                      f"bar chart deve ter format.zero_baseline=True (recebido False)",
                      field="format.zero_baseline")

    def _v09_highlight_valid(self) -> None:
        fmt = self.spec.get("format") or {}
        highlight = fmt.get("highlight") or []
        if not highlight:
            return
        labels = {item.get("label") for item in (self.spec.get("data") or [])
                  if isinstance(item, dict) and "label" in item}
        for h in highlight:
            if h not in labels:
                self._add("V09", "P1", False,
                          f"format.highlight contem '{h}' que nao existe em data",
                          field="format.highlight")

    def _v10_palette_semantic(self) -> None:
        t = self.spec.get("type")
        if t not in CATEGORICAL_TYPES:
            return
        palette = self.spec.get("palette")
        if palette is not None and palette != "categorical":
            self._add("V10", "P1", False,
                      f"tipo categorico '{t}' deveria usar palette='categorical' (recebido {palette!r})",
                      field="palette")

    def _v11_takeaway_length(self) -> None:
        takeaway = self.spec.get("takeaway_bar")
        if takeaway and _word_count(takeaway) > 20:
            self._add("V11", "P1", False,
                      f"takeaway_bar tem {_word_count(takeaway)} palavras (max 20)",
                      field="takeaway_bar")

    def _v12_title_word_count(self) -> None:
        title = self.spec.get("action_title") or ""
        if _word_count(title) > 14:
            self._add("V12", "P1", False,
                      f"action_title tem {_word_count(title)} palavras (max 14)",
                      field="action_title")

    def _v13_waterfall_balance(self) -> None:
        if self.spec.get("type") != "waterfall":
            return
        data = self.spec.get("data") or []
        deltas = [item.get("value", 0) for item in data
                  if isinstance(item, dict) and item.get("type") != "total"]
        totals = [item.get("value", 0) for item in data
                  if isinstance(item, dict) and item.get("type") == "total"]
        if not totals:
            return
        sum_deltas = sum(d for d in deltas if isinstance(d, (int, float)))
        declared = totals[-1]
        if isinstance(declared, (int, float)):
            if abs(sum_deltas - declared) > max(0.01, abs(declared) * 0.001):
                self._add("V13", "P2", False,
                          f"waterfall: soma deltas ({sum_deltas}) != total declarado ({declared})",
                          field="data")
