"""Pipeline 7-fase para decks executivos (P0.1, P0.4, P0.8, P1.4 da auditoria).

Workflow:

  FASE 1 — SINTESE   : MD primeiro (estrutura e conteudo, review editorial)
                       [P0.8] audience gate — auto-mask nomes proprios internos
                       quando audience='external'/'board_external'
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

Audience gate (P0.8):
  Quando audience='external' ou 'board_external', auto-mask nomes proprios
  internos detectados via regex (capitalizados sem 'Raiz' prefix).
  Ex: 'JusRaiz' -> 'plataforma juridica interna'. Usuario recebe warning
  para revisar manualmente.
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


# ---------------------------------------------------------------------------
# Audience gate (P0.8) — auto-mask nomes proprios internos para audiencias externas
# ---------------------------------------------------------------------------
# Audiencias permitidas
_AUDIENCES_INTERNAL = frozenset({"internal", "team", "tech"})
_AUDIENCES_EXTERNAL = frozenset({"external", "board_external", "investor", "press"})

# Termos sempre permitidos (brand canonical)
_BRAND_ALLOWLIST = frozenset({"Raiz", "RaizEducacao", "RAIZ", "rAIz"})

# Pattern para detectar nomes proprios internos provaveis:
# - CamelCase ou Pascal com 2+ sequencias (ex: JusRaiz, AutomataRaiz, AppRaiz)
# - Nome capitalizado seguido de termo tecnico (ex: 'Sistema X', 'Plataforma Y')
_INTERNAL_NAME_RE = re.compile(
    r"\b([A-Z][a-z]+(?:[A-Z][a-z]+)+)\b"   # CamelCase: JusRaiz, AppRaiz
    r"|\b([A-Z]{2,}[a-z]*[A-Z][a-z]+)\b"   # ALLCAPS+camel: HRRaiz
)


def detect_internal_names(text: str,
                          allowlist: frozenset = _BRAND_ALLOWLIST) -> List[str]:
    """Retorna lista de nomes proprios internos detectados (excluindo brand)."""
    matches = []
    for m in _INTERNAL_NAME_RE.finditer(text):
        name = m.group(0)
        if name in allowlist:
            continue
        if name not in matches:
            matches.append(name)
    return matches


def mask_internal_names(text: str,
                        replacement: str = "plataforma interna",
                        allowlist: frozenset = _BRAND_ALLOWLIST) -> tuple:
    """Aplica auto-mask de nomes proprios internos.

    Retorna tupla (texto_mascarado, lista_de_nomes_detectados_para_warning).
    """
    detected = detect_internal_names(text, allowlist=allowlist)
    masked = text
    for name in detected:
        # Substituir via word boundary para evitar match parcial
        masked = re.sub(rf"\b{re.escape(name)}\b", replacement, masked)
    return masked, detected


def apply_audience_gate(slides: List[Dict[str, Any]],
                        audience: str = "internal",
                        replacement: str = "plataforma interna") -> tuple:
    """Aplica audience gate em lista de slides.

    Args:
        slides: lista de slides (cada um com title, message, bullets)
        audience: 'internal' (no-op) ou 'external'/'board_external' (auto-mask)
        replacement: texto de substituicao para nomes internos

    Returns:
        (slides_filtrados, warnings) — warnings = list de tuplas (slide_idx, names)
    """
    audience = (audience or "internal").lower().strip()
    if audience not in _AUDIENCES_EXTERNAL:
        return list(slides), []

    filtered: List[Dict[str, Any]] = []
    warnings: List[tuple] = []  # (slide_idx, [names])

    for idx, s in enumerate(slides):
        new_s = dict(s)
        all_detected: List[str] = []

        # Mascara em title, message
        for field in ("title", "message"):
            val = s.get(field)
            if val and isinstance(val, str):
                masked, detected = mask_internal_names(val, replacement=replacement)
                new_s[field] = masked
                all_detected.extend(detected)

        # Mascara em bullets
        bullets = s.get("bullets") or []
        if bullets:
            new_bullets = []
            for b in bullets:
                if isinstance(b, str):
                    masked, detected = mask_internal_names(b, replacement=replacement)
                    new_bullets.append(masked)
                    all_detected.extend(detected)
                else:
                    new_bullets.append(b)
            new_s["bullets"] = new_bullets

        if all_detected:
            warnings.append((idx, list(set(all_detected))))

        filtered.append(new_s)

    return filtered, warnings


def synthesize_executive(slides: List[Dict[str, Any]],
                         keyword_threshold: float = 0.70,
                         max_merge_chain: int = 3,
                         audience: str = "internal") -> List[Dict[str, Any]]:
    """Funde slides com 70%+ de overlap de keywords.

    Estrategia:
      - Para cada par consecutivo, calcular jaccard similarity das keywords
      - Se >= threshold, marcar candidato a fundir
      - Funde concatenando bullets e mantendo o titulo do primeiro

    Argumentos:
      slides: lista de dicts com 'title', 'message', 'bullets'
      keyword_threshold: threshold (default 0.70)
      max_merge_chain: max slides numa cadeia de merge (default 3)
      audience: 'internal'|'external'|'board_external' (P0.8 audience gate)

    Retorna nova lista (nao muta original).
    """
    if not slides:
        return []

    # P0.8 — audience gate ANTES do merge (se external, mascarar nomes)
    audience_warnings: List[tuple] = []
    if audience and audience.lower() in _AUDIENCES_EXTERNAL:
        slides, audience_warnings = apply_audience_gate(slides, audience=audience)
        if audience_warnings:
            import warnings as _w
            for idx, names in audience_warnings:
                _w.warn(
                    f"[P0.8 audience gate] Slide #{idx+1}: nomes proprios internos "
                    f"detectados {names} mascarados para audience='{audience}'. "
                    "Revise manualmente se a substituicao for adequada.",
                    stacklevel=2,
                )

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
    # P0.8 — audience gate (afeta sintese executiva)
    audience: str = "internal"   # 'internal' | 'external' | 'board_external' | 'investor' | 'press'

    # State (preenchido em runtime)
    outline: List[Dict[str, Any]] = field(default_factory=list)
    viz_kinds: List[str] = field(default_factory=list)
    audience_warnings: List[tuple] = field(default_factory=list)

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
                           apply_executive_synthesis: bool = True,
                           audience: Optional[str] = None) -> List[Dict[str, Any]]:
        """Recebe lista bruta de slides e aplica sintese executiva (P0.4).

        Cada item e dict com 'title', 'message', 'bullets', 'source_section', etc.
        Retorna lista possivelmente reduzida (slides fundidos).

        P0.8 — Se audience for external/board_external (passado aqui ou na
        construcao da pipeline), aplica auto-mask de nomes proprios internos
        antes do merge.
        """
        # P0.8 — usa audience override se fornecido, senao da pipeline
        eff_audience = (audience or self.audience or "internal")

        if apply_executive_synthesis:
            self.outline = synthesize_executive(slides, audience=eff_audience)
        else:
            # Sem merge — mas ainda aplica audience gate se external
            if eff_audience.lower() in _AUDIENCES_EXTERNAL:
                gated, warns = apply_audience_gate(slides, audience=eff_audience)
                self.outline = gated
                self.audience_warnings = warns
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
    "apply_audience_gate",
    "detect_internal_names",
    "mask_internal_names",
]
