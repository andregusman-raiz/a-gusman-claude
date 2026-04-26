"""Auditor visual — detecta problemas de layout em PPTX antes da entrega.

Fase 6 do pipeline: executa validators em cada slide + converte para PDF
e retorna relatorio. Claude orquestrador deve fazer Read multimodal do PDF
para complementar com avaliacao visual McKinsey (Fase 6 — auto-review
multimodal real, nao auto-aprovacao).

Defeitos detectados (P0/P1 da auditoria 2026-04-25):
  - Overlap entre textboxes (>40% de uma sobre outra)
  - Shape fora da area da slide
  - Wrap orfao
  - [P0.5] Contraste WCAG AA texto vs background < 4.5:1
  - [P0.2] Viz ratio non-textual < 30% (deck-level)
  - [P0.3] Action title sem numero quando dado disponivel
  - [P1.2] 3+ slides consecutivos com mesmo layout
  - [P1.3] Source line ausente em slide com afirmacao categorica
  - Anti-patterns canonical (4 cores accent, card-grid > 6, bullet > 18 palavras)
"""
from __future__ import annotations

import re
import shutil
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from pptx import Presentation
from pptx.util import Emu


# ---------------------------------------------------------------------------
# SOFFICE (LibreOffice headless) helpers
# ---------------------------------------------------------------------------
def _find_soffice() -> Optional[str]:
    for path in [
        "/opt/homebrew/bin/soffice",
        "/usr/local/bin/soffice",
        "/Applications/LibreOffice.app/Contents/MacOS/soffice",
    ]:
        if Path(path).exists():
            return path
    which = shutil.which("soffice")
    return which


def convert_to_pdf(pptx_path: Path, *, out_dir: Optional[Path] = None) -> Path:
    """Converte PPTX -> PDF via LibreOffice headless."""
    soffice = _find_soffice()
    if not soffice:
        raise RuntimeError(
            "LibreOffice (soffice) nao encontrado. "
            "Instale via `brew install --cask libreoffice`."
        )

    out_dir = out_dir or pptx_path.parent
    out_dir.mkdir(parents=True, exist_ok=True)

    result = subprocess.run(
        [soffice, "--headless", "--convert-to", "pdf",
         "--outdir", str(out_dir), str(pptx_path)],
        capture_output=True, text=True, timeout=120,
    )
    if result.returncode != 0:
        raise RuntimeError(f"soffice falhou: {result.stderr}")

    pdf_path = out_dir / f"{pptx_path.stem}.pdf"
    if not pdf_path.exists():
        raise RuntimeError(f"PDF esperado nao encontrado: {pdf_path}")
    return pdf_path


# ---------------------------------------------------------------------------
# Geometric audit (existente)
# ---------------------------------------------------------------------------
@dataclass
class AuditWarning:
    slide_num: int
    category: str        # overlap | out_of_bounds | short_text | contrast | title | layout_repetition | source_line | anti_pattern
    severity: str        # high | medium | low
    message: str


def _bbox_overlap_ratio(a, b) -> float:
    """Ratio 0..1 = area de intersecao / area da menor caixa."""
    ax1, ay1 = a.left, a.top
    ax2, ay2 = a.left + a.width, a.top + a.height
    bx1, by1 = b.left, b.top
    bx2, by2 = b.left + b.width, b.top + b.height

    ox1, oy1 = max(ax1, bx1), max(ay1, by1)
    ox2, oy2 = min(ax2, bx2), min(ay2, by2)
    if ox2 <= ox1 or oy2 <= oy1:
        return 0.0
    overlap_area = (ox2 - ox1) * (oy2 - oy1)
    area_a = (ax2 - ax1) * (ay2 - ay1)
    area_b = (bx2 - bx1) * (by2 - by1)
    smallest = min(area_a, area_b) or 1
    return overlap_area / smallest


# ---------------------------------------------------------------------------
# WCAG AA contrast (P0.5)
# ---------------------------------------------------------------------------
def _hex_to_rgb_tuple(hex_color: str) -> Tuple[int, int, int]:
    h = hex_color.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def _relative_luminance(rgb: Tuple[int, int, int]) -> float:
    """WCAG relative luminance formula."""
    def chan(c: int) -> float:
        c /= 255.0
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = rgb
    return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b)


def wcag_contrast_ratio(fg_hex: str, bg_hex: str) -> float:
    """Calcula contrast ratio WCAG. Min recomendado: 4.5:1 (AA), 7:1 (AAA)."""
    L1 = _relative_luminance(_hex_to_rgb_tuple(fg_hex))
    L2 = _relative_luminance(_hex_to_rgb_tuple(bg_hex))
    lighter, darker = max(L1, L2), min(L1, L2)
    return (lighter + 0.05) / (darker + 0.05)


def _detect_shape_bg(shape, slide_bg_hex: str) -> str:
    """Tenta detectar cor de background do shape. Default: slide_bg."""
    try:
        if shape.fill.type is not None and shape.fill.type == 1:  # solid
            color = shape.fill.fore_color.rgb
            if color is not None:
                return f"#{int(color):06X}"
    except (AttributeError, TypeError, KeyError):
        pass
    return slide_bg_hex


def _detect_run_color(run) -> Optional[str]:
    """Retorna hex da cor do run, ou None se default/inherited."""
    try:
        if run.font.color and run.font.color.type is not None:
            rgb_obj = run.font.color.rgb
            if rgb_obj is not None:
                return f"#{int(rgb_obj):06X}"
    except (AttributeError, TypeError, KeyError):
        pass
    return None


def _detect_slide_bg(slide, default_hex: str = "#F8F9FA") -> str:
    """Detecta cor de background do slide. Default: bg_light raiz."""
    try:
        bg = slide.background
        if bg.fill.type == 1:  # solid
            color = bg.fill.fore_color.rgb
            if color is not None:
                return f"#{int(color):06X}"
    except (AttributeError, TypeError, KeyError):
        pass
    return default_hex


def check_text_contrast(slide, slide_num: int,
                        slide_bg_hex: str = "#F8F9FA",
                        threshold: float = 4.5) -> List[AuditWarning]:
    """Verifica contraste de texto vs background (WCAG AA = 4.5:1).

    Retorna warnings 'contrast' high se ratio < threshold.
    """
    warnings: List[AuditWarning] = []
    for shape in slide.shapes:
        if not shape.has_text_frame:
            continue
        # Detectar bg do shape (se shape tem fill, use ele; senao slide bg)
        shape_bg = _detect_shape_bg(shape, slide_bg_hex)
        for para in shape.text_frame.paragraphs:
            for run in para.runs:
                text = (run.text or "").strip()
                if not text:
                    continue
                fg = _detect_run_color(run)
                if fg is None:
                    continue  # default color, skip
                ratio = wcag_contrast_ratio(fg, shape_bg)
                if ratio < threshold:
                    warnings.append(AuditWarning(
                        slide_num, "contrast", "high",
                        f"Texto {text[:30]!r} contraste {ratio:.2f}:1 "
                        f"(fg {fg} sobre bg {shape_bg}) — min WCAG AA = {threshold}:1"
                    ))
    return warnings


# ---------------------------------------------------------------------------
# Action title validator (P0.3)
# ---------------------------------------------------------------------------
NUMBER_RE = re.compile(
    r"(?:R\$\s*[\d.,]+|US?\$\s*[\d.,]+|\$\s*[\d.,]+|"
    r"\d+\s*x\b|\d{1,3}\s*%|\d{2,}\s*(?:atendentes|empresas|clientes|alunos)|"
    r"\b\d+[.,]?\d*\s*(?:MM?|K|mil|milhao|milhoes|bilhao|bilhoes|B|pp))",
    re.IGNORECASE,
)

# Anti-patterns: titulos que comecam com construcoes descritivas (nao insight-led)
ANTI_PATTERN_TITLE_PREFIXES = [
    r"^Os?\s",
    r"^As?\s",
    r"^Um(?:a)?\s",
    r"^Sumario\b",
    r"^Definico(?:es|cao)\b",
    r"^Tipos?\s+de\s",
    r"^Glossario\b",
    r"^Conceitos?\s",
    r"^A jornada tem\b",
    r"^\d+\s+(?:elementos|capacidades|estagios|camadas|fases)\b",
]


def title_has_number(title: str) -> bool:
    """Verifica se titulo contem numero quantificado."""
    return bool(NUMBER_RE.search(title))


def title_has_anti_pattern(title: str) -> Optional[str]:
    """Retorna o pattern matched ou None."""
    title_strip = title.strip()
    for pat in ANTI_PATTERN_TITLE_PREFIXES:
        if re.search(pat, title_strip, re.IGNORECASE):
            return pat
    return None


def validate_action_title(title: str, source_data: Optional[List[str]] = None) -> Optional[AuditWarning]:
    """Valida action title.

    Falha se:
      - Tem anti-pattern (Os/Sumario/etc) E nao tem numero
      - Source data tem numero E title nao usa
    """
    title = title.strip()
    if not title:
        return None
    has_num = title_has_number(title)
    anti = title_has_anti_pattern(title)

    if anti and not has_num:
        return AuditWarning(
            0, "title", "medium",
            f"Action title descritivo (anti-pattern '{anti}') sem numero: {title!r}"
        )
    if source_data and not has_num:
        # Se source tem numero disponivel
        for sd in source_data:
            if NUMBER_RE.search(sd):
                return AuditWarning(
                    0, "title", "medium",
                    f"Action title sem numero, mas source tem dado: {title!r}"
                )
    return None


# ---------------------------------------------------------------------------
# Source line check (P1.3)
# ---------------------------------------------------------------------------
CATEGORICAL_PATTERNS = [
    r"\b\d+\s+(?:capacidades|estagios|niveis|camadas|categorias|tipos|elementos|princip)\b",
    r"\b(?:os|as)\s+\d+\b",
    r"\bmaturidade\s+(?:em|com|de)\s+\d+\b",
]


def slide_has_categorical_claim(slide_text: str) -> bool:
    """Detecta se slide faz afirmacao categorica que precisa source."""
    for pat in CATEGORICAL_PATTERNS:
        if re.search(pat, slide_text, re.IGNORECASE):
            return True
    return False


def slide_has_source_line(slide) -> bool:
    """Verifica se slide tem source line (texto que comeca com 'Fonte:' ou similar)."""
    for shape in slide.shapes:
        if shape.has_text_frame:
            text = (shape.text_frame.text or "").lower()
            if re.search(r"\b(fonte|source|ref):", text):
                return True
            if re.search(r"\[framework\s+(proprietario|raiz|.*)\]", text):
                return True
    return False


def check_source_line_for_categorical(slide, slide_num: int) -> Optional[AuditWarning]:
    """Se slide tem afirmacao categorica mas sem source line."""
    text = ""
    for shape in slide.shapes:
        if shape.has_text_frame:
            text += " " + (shape.text_frame.text or "")
    if slide_has_categorical_claim(text) and not slide_has_source_line(slide):
        # Extract first 60 chars do texto para context
        t = text.strip()[:80]
        return AuditWarning(
            slide_num, "source_line", "medium",
            f"Afirmacao categorica sem source line: {t!r}..."
        )
    return None


# ---------------------------------------------------------------------------
# Layout repetition (P1.2) — operate em layout-types informados externamente
# ---------------------------------------------------------------------------
def detect_layout_repetition_from_kinds(layout_kinds: List[str],
                                         max_consecutive: int = 2) -> List[AuditWarning]:
    """Recebe lista de layout-types (1 por slide), retorna warnings se 3+ consecutivos iguais."""
    warnings: List[AuditWarning] = []
    streak_kind = None
    streak_n = 0
    for i, kind in enumerate(layout_kinds, 1):
        if kind == streak_kind:
            streak_n += 1
            if streak_n > max_consecutive:
                warnings.append(AuditWarning(
                    i, "layout_repetition", "medium",
                    f"3+ slides consecutivos com mesmo layout '{kind}'"
                ))
        else:
            streak_kind = kind
            streak_n = 1
    return warnings


# ---------------------------------------------------------------------------
# Slide-level audit
# ---------------------------------------------------------------------------
def audit_slide(prs, slide_num: int, slide,
                slide_bg_hex: str = "#F8F9FA",
                check_contrast: bool = True) -> List[AuditWarning]:
    """Retorna lista de warnings para o slide informado (1-indexed)."""
    from pptx.enum.text import PP_ALIGN
    w: List[AuditWarning] = []

    slide_w = prs.slide_width
    slide_h = prs.slide_height

    text_shapes = []
    for shp in slide.shapes:
        if shp.has_text_frame:
            txt = (shp.text_frame.text or "").strip()
            if txt:
                text_shapes.append((shp, txt))

    # Out of bounds
    for shp, txt in text_shapes:
        if shp.left < 0 or shp.top < 0:
            w.append(AuditWarning(
                slide_num, "out_of_bounds", "medium",
                f"Shape com texto {txt[:40]!r} tem left/top negativo."))
        if shp.left + shp.width > slide_w + Emu(100):
            w.append(AuditWarning(
                slide_num, "out_of_bounds", "high",
                f"Shape {txt[:40]!r} vaza a direita da slide."))
        if shp.top + shp.height > slide_h + Emu(100):
            w.append(AuditWarning(
                slide_num, "out_of_bounds", "high",
                f"Shape {txt[:40]!r} vaza abaixo da slide."))

    # Overlap
    seen_pairs = set()
    for i, (a, ta) in enumerate(text_shapes):
        for b, tb in text_shapes[i+1:]:
            key = (id(a), id(b))
            if key in seen_pairs:
                continue
            seen_pairs.add(key)
            ratio = _bbox_overlap_ratio(a, b)
            if ratio > 0.40:
                sev = "high" if ratio > 0.60 else "medium"
                w.append(AuditWarning(
                    slide_num, "overlap", sev,
                    f"Overlap {ratio*100:.0f}% entre "
                    f"{ta[:30]!r} e {tb[:30]!r}"))

    # Short orphan
    for shp, txt in text_shapes:
        if len(txt) > 15 or " " in txt or shp.width <= Emu(3_000_000):
            continue
        tf = shp.text_frame
        is_left = any(
            p.alignment in (None, PP_ALIGN.LEFT)
            for p in tf.paragraphs if p.text.strip()
        )
        if is_left:
            w.append(AuditWarning(
                slide_num, "short_text", "low",
                f"Possivel wrap orfao: texto curto {txt!r} em caixa larga"))

    # Contrast WCAG AA (P0.5)
    if check_contrast:
        w.extend(check_text_contrast(slide, slide_num, slide_bg_hex))

    # Source line (P1.3)
    src_warning = check_source_line_for_categorical(slide, slide_num)
    if src_warning:
        w.append(src_warning)

    return w


def audit_deck(pptx_path: Path,
               check_contrast: bool = True,
               viz_kinds: Optional[List[str]] = None,
               min_viz_ratio: float = 0.30) -> List[AuditWarning]:
    """Audita o deck inteiro.

    Args:
        viz_kinds: opcional, lista de layout-kinds (1 por slide). Se fornecida,
                   habilita gates P0.2 (viz ratio) e P1.2 (layout repetition).
        min_viz_ratio: threshold do gate P0.2 (default 0.30 = 30%).
    """
    prs = Presentation(str(pptx_path))
    all_warnings: List[AuditWarning] = []
    slide_bg = "#F8F9FA"

    for i, slide in enumerate(prs.slides, 1):
        try:
            slide_bg = _detect_slide_bg(slide, default_hex=slide_bg)
        except Exception:
            pass
        all_warnings.extend(audit_slide(prs, i, slide,
                                         slide_bg_hex=slide_bg,
                                         check_contrast=check_contrast))

    # Deck-level: viz ratio (P0.2) + layout repetition (P1.2)
    if viz_kinds is not None:
        # P0.2 — viz ratio
        from .visualization import NON_TEXTUAL_VIZ_TYPES
        n = len(viz_kinds)
        n_visual = sum(1 for k in viz_kinds if k in NON_TEXTUAL_VIZ_TYPES)
        ratio = (n_visual / n) if n else 0.0
        if ratio < min_viz_ratio:
            all_warnings.append(AuditWarning(
                0, "deck_viz_ratio", "high",
                f"Deck tem apenas {ratio:.0%} slides com viz nao-textual "
                f"(min recomendado: {min_viz_ratio:.0%})"
            ))
        # P1.2 — layout repetition
        all_warnings.extend(detect_layout_repetition_from_kinds(viz_kinds))

    return all_warnings


# ---------------------------------------------------------------------------
# Anti-pattern detectors (P1 + auditoria)
# ---------------------------------------------------------------------------
def detect_anti_patterns(pptx_path: Path) -> List[AuditWarning]:
    """Roda anti-pattern detectors do canonical da auditoria.

    - Title > 92 chars sem auto-quebra (informativo)
    - Bullet > 18 palavras
    - Card-grid > 6 cards (estimado por count de shapes retangulares similares)
    """
    prs = Presentation(str(pptx_path))
    warnings: List[AuditWarning] = []

    for i, slide in enumerate(prs.slides, 1):
        for shape in slide.shapes:
            if not shape.has_text_frame:
                continue
            for para in shape.text_frame.paragraphs:
                text = (para.text or "").strip()
                if not text:
                    continue
                # Bullet > 18 palavras
                wc = len(text.split())
                if wc > 18 and len(text) > 80:
                    warnings.append(AuditWarning(
                        i, "anti_pattern", "low",
                        f"Bullet com {wc} palavras (max recomendado 18): {text[:50]!r}..."
                    ))
    return warnings


# ---------------------------------------------------------------------------
# Report formatter
# ---------------------------------------------------------------------------
def format_audit_report(warnings: List[AuditWarning]) -> str:
    """Formata lista de warnings para exibicao (markdown)."""
    if not warnings:
        return "Audit limpo — nenhum defeito detectado."
    lines = ["## Audit Report\n"]
    by_slide: Dict[int, List[AuditWarning]] = {}
    for wrn in warnings:
        by_slide.setdefault(wrn.slide_num, []).append(wrn)
    for sn in sorted(by_slide):
        lines.append(f"\n### Slide {sn if sn > 0 else 'DECK-LEVEL'}")
        for wrn in by_slide[sn]:
            badge = {"high": "[HIGH]", "medium": "[MED]", "low": "[LOW]"}.get(wrn.severity, "·")
            lines.append(f"- {badge} **{wrn.category}**: {wrn.message}")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Multimodal review checklist (P1.4)
# ---------------------------------------------------------------------------
MULTIMODAL_REVIEW_CHECKLIST = """\
## Auto-review multimodal — checklist 14 itens (P1.4)

Apos converter PPTX -> PDF e fazer Read multimodal pagina-a-pagina,
validar cada item. Bloquear entrega se < 80% passar (11/14).

VISUALIZATION (criticos)
  [ ] 1. >= 30% dos slides tem visualizacao nao-textual (chart/diagrama/timeline/matrix)
  [ ] 2. >= 50% dos action titles contem numero quantificado
  [ ] 3. >= 80% dos slides tem 1 numero quantificado em algum lugar
  [ ] 4. Pelo menos 5 slide-types diferentes usados no deck
  [ ] 5. Capa e fechamento tem tratamento visual diferenciado

LAYOUT
  [ ] 6. Nenhum layout repetido por 3+ slides consecutivos
  [ ] 7. Pelo menos 1 breathing slide a cada 6 slides densos
  [ ] 8. Slide final tem <= 2 frases + visual

TEXTO/TIPOGRAFIA
  [ ] 9. Todos os textos passam contrast check WCAG AA (>= 4.5:1)
  [ ] 10. Pagination consistente, sem duplicatas
  [ ] 11. Section labels alinhados com posicao estrutural
  [ ] 12. Source line em todo slide com afirmacao categorica
  [ ] 13. Takeaways tem evidencia ou marcados como [premissa]

REGRESSAO
  [ ] 14. Nenhum defeito visual de v1 reapareceu (overlap, vazamento, texto invisivel)

Score: ___/14 (>= 11 obrigatorio para entrega).
"""


# ---------------------------------------------------------------------------
# McKinsey checklist (legacy — mantido para compat)
# ---------------------------------------------------------------------------
MCKINSEY_CHECKLIST = """\
## Checklist McKinsey (revisar visualmente cada slide no PDF)

1. [ ] Action title — frase com verbo/conclusao, nao topico
2. [ ] Takeaway bar accent presente em slides de conteudo
3. [ ] Source line presente em slides com dados externos
4. [ ] Pagination N/total visivel no rodape
5. [ ] Nenhum wrap orfao
6. [ ] Nenhum overlap entre caixas
7. [ ] Nenhum texto vazando fora de card/container
8. [ ] Paleta disciplinada (max 5 cores)
9. [ ] Tipografia consistente — fonte brand
10. [ ] Charts reais (line/timeline/bar, nao caixas paralelas)
"""


__all__ = [
    "AuditWarning",
    "audit_slide", "audit_deck", "detect_anti_patterns",
    "format_audit_report", "convert_to_pdf",
    "wcag_contrast_ratio", "check_text_contrast",
    "validate_action_title", "title_has_number", "title_has_anti_pattern",
    "check_source_line_for_categorical",
    "detect_layout_repetition_from_kinds",
    "MCKINSEY_CHECKLIST", "MULTIMODAL_REVIEW_CHECKLIST",
]
