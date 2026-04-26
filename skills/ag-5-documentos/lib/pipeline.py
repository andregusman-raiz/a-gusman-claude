"""Pipeline 7-fase para decks executivos (P0.1, P0.4, P1.4 da auditoria 2026-04-25).

Workflow:

  FASE 1 — SINTESE   : MD primeiro (estrutura e conteudo, review editorial)
  FASE 2 — OUTLINE   : extrai slides do MD (estruturado)
  FASE 3 — VIZ       : visualization-first design (P0.1) — decide tipo de viz por slide
  FASE 4 — LAYOUT    : decisao de layout custom por slide (alimentado por viz)
  FASE 5 — RENDER    : PPTX v1 com tokens rAIz / brand override
  FASE 6 — AUDIT     : screenshot + auditor visual (PDF + multimodal review)
  FASE 7 — DELIVERY  : PPTX v2 (apos fixes aplicados ate <= 3 iteracoes)

Fluxo backward-compatible: callers antigos continuam usando
write_md/build_v1/audit/promote_to_v2. Novos callers podem usar:

    pipe.synthesize_outline(slides_data)        # FASE 2
    pipe.assign_visualizations()                 # FASE 3 (P0.1)
    pipe.audit_with_viz(viz_kinds)               # FASE 6 com gates P0.2 + P1.2

Bypass: skip_review=True passa direto v1 -> v2 sem auditoria.

Sintese executiva (P0.4):
  Antes da geracao, fundir secoes que compartilham 70%+ keywords ou tem
  relacao hierarquica. Reduz mapeamento 1:1 secao->slide.
"""
from __future__ import annotations

import re
import shutil
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

from .audit import (
    AuditWarning, audit_deck, convert_to_pdf, detect_anti_patterns,
    format_audit_report, validate_action_title,
    MCKINSEY_CHECKLIST, MULTIMODAL_REVIEW_CHECKLIST,
)
from .palette_overrides import Brand, get_brand
from .visualization import (
    VizSpec, select_visualization, viz_ratio_non_textual, viz_summary,
    detect_layout_repetition,
)


# ---------------------------------------------------------------------------
# Sintese executiva (P0.4) — funde secoes proximas
# ---------------------------------------------------------------------------
_STOPWORDS_PT = frozenset({
    "a", "o", "as", "os", "um", "uma", "uns", "umas",
    "de", "da", "do", "das", "dos", "em", "no", "na", "nos", "nas",
    "para", "por", "com", "sem", "sobre", "sob", "entre", "ate", "ate",
    "e", "ou", "mas", "que", "se", "ja", "nao", "sim",
    "ser", "estar", "ter", "ir", "fazer", "haver",
    "este", "esta", "esses", "essas", "isso", "isto",
    "the", "of", "to", "in", "for", "with", "and", "or",
})


def _keywords(text: str, top_n: int = 10) -> List[str]:
    """Extrai keywords (palavras significativas) do texto."""
    words = re.findall(r"\b[a-zA-ZáéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ]{4,}\b", text.lower())
    words = [w for w in words if w not in _STOPWORDS_PT]
    counter = Counter(words)
    return [w for w, _ in counter.most_common(top_n)]


def _jaccard(a: List[str], b: List[str]) -> float:
    """Jaccard similarity entre 2 listas."""
    set_a, set_b = set(a), set(b)
    if not set_a and not set_b:
        return 0.0
    return len(set_a & set_b) / len(set_a | set_b)


def synthesize_executive(slides: List[Dict[str, Any]],
                         keyword_threshold: float = 0.70,
                         max_merge_chain: int = 3) -> List[Dict[str, Any]]:
    """Funde slides com 70%+ de overlap de keywords.

    Estrategia:
      - Para cada par consecutivo, calcular jaccard similarity das keywords
      - Se >= threshold, marcar candidato a fundir
      - Funde concatenando bullets e mantendo o titulo do primeiro

    Argumentos:
      slides: lista de dicts com 'title', 'message', 'bullets'
      keyword_threshold: threshold (default 0.70)
      max_merge_chain: max slides numa cadeia de merge (default 3)

    Retorna nova lista (nao muta original).
    """
    if not slides:
        return []

    fused: List[Dict[str, Any]] = []
    skip = set()
    n = len(slides)

    for i, s in enumerate(slides):
        if i in skip:
            continue
        kw_a = _keywords(
            f"{s.get('title', '')} {s.get('message', '')} "
            f"{' '.join(s.get('bullets', []) or [])}"
        )
        chain = [i]
        # Procurar candidatos a fundir nos proximos
        for j in range(i + 1, min(i + max_merge_chain, n)):
            if j in skip:
                continue
            t = slides[j]
            kw_b = _keywords(
                f"{t.get('title', '')} {t.get('message', '')} "
                f"{' '.join(t.get('bullets', []) or [])}"
            )
            sim = _jaccard(kw_a, kw_b)
            if sim >= keyword_threshold:
                chain.append(j)
                skip.add(j)

        if len(chain) == 1:
            fused.append(s)
        else:
            # Merge: titulo do primeiro, bullets de todos, message concatenada
            merged = dict(s)  # copy
            all_bullets: List[str] = []
            messages: List[str] = []
            for idx in chain:
                all_bullets.extend(slides[idx].get("bullets", []) or [])
                if slides[idx].get("message"):
                    messages.append(slides[idx]["message"])
            merged["bullets"] = all_bullets
            merged["message"] = " | ".join(messages)
            merged["_merged_from"] = chain
            fused.append(merged)

    return fused


# ---------------------------------------------------------------------------
# Pipeline principal
# ---------------------------------------------------------------------------
@dataclass
class ExecutiveDeckPipeline:
    slug: str
    out_dir: Path
    brand: Brand = field(default_factory=get_brand)
    skip_review: bool = False

    # State (preenchido em runtime)
    outline: List[Dict[str, Any]] = field(default_factory=list)
    viz_kinds: List[str] = field(default_factory=list)

    def __post_init__(self):
        self.out_dir = Path(self.out_dir).expanduser()
        self.out_dir.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # Paths canonicos
    # ------------------------------------------------------------------
    @property
    def md_path(self) -> Path:
        return self.out_dir / f"{self.slug}.md"

    @property
    def outline_path(self) -> Path:
        return self.out_dir / f"{self.slug}-outline.json"

    @property
    def viz_path(self) -> Path:
        return self.out_dir / f"{self.slug}-viz.json"

    @property
    def v1_pptx(self) -> Path:
        return self.out_dir / f"{self.slug}-v1.pptx"

    @property
    def v1_pdf(self) -> Path:
        return self.out_dir / f"{self.slug}-v1.pdf"

    @property
    def v2_pptx(self) -> Path:
        return self.out_dir / f"{self.slug}-v2.pptx"

    @property
    def v2_pdf(self) -> Path:
        return self.out_dir / f"{self.slug}-v2.pdf"

    # ------------------------------------------------------------------
    # FASE 1 — MD (sintese conteudo)
    # ------------------------------------------------------------------
    def write_md(self, content: str) -> Path:
        """Escreve o conteudo em Markdown. Primeiro entregavel parcial."""
        self.md_path.write_text(content, encoding="utf-8")
        return self.md_path

    # ------------------------------------------------------------------
    # FASE 2 — OUTLINE (extrair slides estruturados do MD)
    # ------------------------------------------------------------------
    def synthesize_outline(self, slides: List[Dict[str, Any]],
                           apply_executive_synthesis: bool = True) -> List[Dict[str, Any]]:
        """Recebe lista bruta de slides e aplica sintese executiva (P0.4).

        Cada item e dict com 'title', 'message', 'bullets', 'source_section', etc.
        Retorna lista possivelmente reduzida (slides fundidos).
        """
        if apply_executive_synthesis:
            self.outline = synthesize_executive(slides)
        else:
            self.outline = list(slides)
        # Persistir
        try:
            import json
            self.outline_path.write_text(
                json.dumps(self.outline, ensure_ascii=False, indent=2,
                          default=str),
                encoding="utf-8"
            )
        except Exception:
            pass
        return self.outline

    # ------------------------------------------------------------------
    # FASE 3 — VIZ (visualization-first design — P0.1)
    # ------------------------------------------------------------------
    def assign_visualizations(self) -> List[Dict[str, Any]]:
        """Para cada slide do outline, escolhe a viz canonica.

        Atualiza self.outline com chave 'viz' (VizSpec) por item, e popula
        self.viz_kinds com lista de kinds (1 por slide).
        """
        if not self.outline:
            raise RuntimeError("FASE 2 pulada: chame synthesize_outline() antes.")
        self.outline = [select_visualization(s) for s in self.outline]
        self.viz_kinds = [
            (s["viz"].kind if isinstance(s.get("viz"), VizSpec) else "card_grid")
            for s in self.outline
        ]
        # Persistir
        try:
            import json
            data = []
            for s in self.outline:
                viz = s.get("viz")
                data.append({
                    "title":   s.get("title"),
                    "message": s.get("message"),
                    "viz_kind": viz.kind if viz else None,
                    "viz_rationale": viz.rationale if viz else None,
                    "viz_confidence": viz.confidence if viz else None,
                })
            self.viz_path.write_text(
                json.dumps(data, ensure_ascii=False, indent=2),
                encoding="utf-8"
            )
        except Exception:
            pass
        return self.outline

    def viz_quality_report(self) -> Dict[str, Any]:
        """Retorna metricas do viz selection (para gates P0.2 e P1.2)."""
        return {
            "ratio_non_textual": viz_ratio_non_textual(self.outline),
            "kind_counts":       viz_summary(self.outline),
            "layout_repetition_indices": detect_layout_repetition(self.outline),
            "n_slides":          len(self.outline),
        }

    # ------------------------------------------------------------------
    # FASE 5 — RENDER (PPTX v1)
    # ------------------------------------------------------------------
    def build_v1(self, builder_fn: Callable[[Path, Brand], None]) -> Path:
        """Invoca o builder fornecido pelo caller.

        builder_fn(pptx_out_path, brand) deve criar o arquivo PPTX
        no path informado. Compatibilidade backward — builder antigo
        continua funcionando sem viz_kinds.
        """
        if self.md_path.exists() is False:
            raise RuntimeError(
                f"FASE 1 pulada: {self.md_path} nao existe. "
                "Chame write_md() antes de build_v1()."
            )
        builder_fn(self.v1_pptx, self.brand)
        if not self.v1_pptx.exists():
            raise FileNotFoundError(
                f"Builder nao gerou {self.v1_pptx}. "
                "Verifique builder_fn."
            )
        return self.v1_pptx

    # ------------------------------------------------------------------
    # FASE 6 — AUDIT (screenshot + multimodal)
    # ------------------------------------------------------------------
    def audit(self) -> dict:
        """Audita v1 com gates expandidos.

        Inclui:
          - Audit geometrico (overlap, out_of_bounds, short_text)
          - WCAG AA contrast check (P0.5)
          - Source line check (P1.3)
          - Anti-pattern detection
          - PDF generation (para Read multimodal)
          - Viz ratio gate (P0.2) se viz_kinds presente
          - Layout repetition gate (P1.2) se viz_kinds presente
          - Multimodal review checklist (P1.4) — para Claude completar via Read
        """
        if not self.v1_pptx.exists():
            raise RuntimeError("FASE 5 pulada: v1.pptx nao existe.")

        pdf = convert_to_pdf(self.v1_pptx, out_dir=self.out_dir)
        warnings = audit_deck(
            self.v1_pptx,
            check_contrast=True,
            viz_kinds=self.viz_kinds if self.viz_kinds else None,
            min_viz_ratio=0.30,
        )
        warnings.extend(detect_anti_patterns(self.v1_pptx))

        viz_quality = self.viz_quality_report() if self.outline else {}

        return {
            "pdf_path":               pdf,
            "warnings":               warnings,
            "report_md":              format_audit_report(warnings),
            "mckinsey_checklist":     MCKINSEY_CHECKLIST,
            "multimodal_checklist":   MULTIMODAL_REVIEW_CHECKLIST,
            "high_severity_count":    sum(1 for w in warnings if w.severity == "high"),
            "viz_quality":            viz_quality,
            "blocked_for_delivery":   self._blocked_for_delivery(warnings, viz_quality),
        }

    def _blocked_for_delivery(self, warnings: List[AuditWarning],
                               viz_quality: Dict[str, Any]) -> List[str]:
        """Retorna lista de razoes que bloqueiam entrega (P0.2, P0.5)."""
        blockers: List[str] = []
        # P0.2 — viz ratio
        ratio = viz_quality.get("ratio_non_textual", 1.0)
        if self.viz_kinds and ratio < 0.30:
            blockers.append(
                f"P0.2 BLOQUEIO: viz ratio {ratio:.0%} < 30% — "
                f"regerar slides com visualizacao nao-textual"
            )
        # P0.5 — contrast WCAG
        contrast_high = [w for w in warnings if w.category == "contrast" and w.severity == "high"]
        if contrast_high:
            blockers.append(
                f"P0.5 BLOQUEIO: {len(contrast_high)} textos com contraste "
                f"< WCAG AA (4.5:1)"
            )
        # Out of bounds high
        oob_high = [w for w in warnings if w.category == "out_of_bounds" and w.severity == "high"]
        if oob_high:
            blockers.append(
                f"GEOMETRIA BLOQUEIO: {len(oob_high)} shapes vazando da slide"
            )
        return blockers

    # ------------------------------------------------------------------
    # FASE 7 — DELIVERY (promover v1 -> v2)
    # ------------------------------------------------------------------
    def promote_to_v2(self) -> dict:
        """Copia v1 -> v2 e gera PDF final. Este e o deliverable oficial."""
        if not self.v1_pptx.exists():
            raise RuntimeError("FASE 5 pulada: v1.pptx nao existe.")

        shutil.copy(self.v1_pptx, self.v2_pptx)
        pdf_v2 = convert_to_pdf(self.v2_pptx, out_dir=self.out_dir)
        return {
            "markdown":            self.md_path,
            "outline":             self.outline_path if self.outline_path.exists() else None,
            "viz_plan":            self.viz_path if self.viz_path.exists() else None,
            "deliverable_pptx":    self.v2_pptx,
            "deliverable_preview": pdf_v2,
            "v1_path":             self.v1_pptx,
        }

    # ------------------------------------------------------------------
    # Pipeline orquestrador (alto nivel)
    # ------------------------------------------------------------------
    def run_full(self,
                 md_content: str,
                 builder_fn: Callable[[Path, Brand], None],
                 max_iterations: int = 3) -> dict:
        """Pipeline backward-compat — sem viz selection automatico.

        Para usar P0.1 (visualization-first), chamar synthesize_outline +
        assign_visualizations explicitamente antes de build_v1.
        """
        self.write_md(md_content)
        self.build_v1(builder_fn)

        if self.skip_review:
            return self.promote_to_v2()

        audit_result = self.audit()
        result = self.promote_to_v2()
        result["audit"] = audit_result
        return result


__all__ = [
    "ExecutiveDeckPipeline",
    "synthesize_executive",
]
