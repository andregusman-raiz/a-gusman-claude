"""Template: slide de encerramento — 1 frase + 1 visual (P1.6b) OU expandido (PR 3.5).

PR 3.5 — 4 elementos canonicos da secao 25 do guia mestre:
  1) final_message (h2, 24pt bold centralizado)
  2) takeaways (3 bullets, max 2 linhas cada, 14pt)
  3) next_steps (3-5 bullets com owner + deadline, 12pt)
  4) cta (caixa accent com 1 acao clara)

Quando QUALQUER um desses 4 campos novos esta presente, render usa o layout
expandido. Caso contrario, mantem layout legacy minimalista (P1.6b).

Legacy schema (continua funcionando inalterado):
    {
      "wordmark":        "inspira",                   # opcional
      "wordmark_sub":    "rede de educadores",        # opcional
      "headline":        "Vamos construir juntos.",   # OBRIGATORIO
      "subtext":         "Junho 2026.",               # OPCIONAL, max 1 frase
      "visual":          {                             # OPCIONAL
          "kind": "gradient",
          "color_from": "#F7941D",
          "color_to":   "#5BB5A2",
      },
      "cta":             "raiz.com.br/proximos-passos",  # rodape (string)
      "metadata":        "Confidencial · 2026",          # rodape
    }

Schema expandido (PR 3.5):
    {
      "final_message": "Comecamos juntos a transformacao em junho.",  # 1 frase h2
      "takeaways": [
          "Oportunidade de R$X bi em receita digital.",
          "Mobile lidera com +45% YoY.",
          "Janela competitiva fecha em 18 meses.",
      ],
      "next_steps": [
          {"action": "Aprovar SPEC tecnica", "owner": "Diretor TI",  "deadline": "30/05"},
          {"action": "Kickoff vendor",       "owner": "PMO",          "deadline": "07/06"},
          {"action": "Pilot em 2 unidades",  "owner": "Lider Digital","deadline": "15/07"},
      ],
      "cta": {"label": "Aprovar plano", "action": "decisao_comite_30_05_2026"},
      "accent_color": "#F7941D",  # opcional
    }

Rejeicao automatica:
  - Layout LEGACY: >2 frases em headline+subtext (P1.6b)
  - Layout EXPANDIDO: >5 next_steps OU 0 takeaways

P1.7 — Brand semantics:
  - Top accent bar  : brand.accent_strong (high impact)
  - Wordmark sub    : brand.accent_strong
  - Subtext italico : brand.accent_moderate (disciplina)
"""
from __future__ import annotations

import re

from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt

from ..mckinsey_pptx import SLIDE_W, SLIDE_H, add_rect, add_tb, set_bg
from ..palette_overrides import Brand


MAX_NEXT_STEPS = 5
MIN_NEXT_STEPS = 1
MIN_TAKEAWAYS = 1
MAX_TAKEAWAYS = 5
EXPANDED_TRIGGER_FIELDS = ("final_message", "takeaways", "next_steps")


def _is_expanded_layout(data: dict) -> bool:
    """Layout expandido (PR 3.5) quando final_message/takeaways/next_steps presentes.

    Nota: cta sozinho NAO triggera expandido — legacy ja aceita cta como string.
    Diferenciamos pelo TIPO: se cta e dict -> expandido; se str -> legacy.
    """
    if any(data.get(field) for field in EXPANDED_TRIGGER_FIELDS):
        return True
    cta = data.get("cta")
    return isinstance(cta, dict)


def _validate_expanded(data: dict) -> None:
    """Valida campos do schema expandido (PR 3.5)."""
    takeaways = data.get("takeaways") or []
    if not isinstance(takeaways, list):
        raise ValueError("[PR 3.5] closing_slide.takeaways deve ser lista")
    if takeaways and not (MIN_TAKEAWAYS <= len(takeaways) <= MAX_TAKEAWAYS):
        raise ValueError(
            f"[PR 3.5] closing_slide.takeaways precisa entre {MIN_TAKEAWAYS}-"
            f"{MAX_TAKEAWAYS} itens, recebido {len(takeaways)}"
        )

    steps = data.get("next_steps") or []
    if not isinstance(steps, list):
        raise ValueError("[PR 3.5] closing_slide.next_steps deve ser lista")
    if steps and len(steps) > MAX_NEXT_STEPS:
        raise ValueError(
            f"[PR 3.5] closing_slide.next_steps excede max ({MAX_NEXT_STEPS}), "
            f"recebido {len(steps)}"
        )
    for i, s in enumerate(steps):
        if not isinstance(s, dict) or "action" not in s:
            raise ValueError(
                f"[PR 3.5] closing_slide.next_steps[{i}] precisa de dict com 'action'"
            )

    cta = data.get("cta")
    if cta is not None and not isinstance(cta, (str, dict)):
        raise ValueError("[PR 3.5] closing_slide.cta deve ser str (legacy) ou dict")
    if isinstance(cta, dict) and "label" not in cta:
        raise ValueError("[PR 3.5] closing_slide.cta dict precisa de 'label'")


def _count_sentences(text: str) -> int:
    """Conta frases (separadas por ponto/excl/inter)."""
    if not text:
        return 0
    parts = [p.strip() for p in re.split(r"[.!?]+", text) if p.strip()]
    return len(parts)


def _validate_text_budget(data: dict) -> None:
    """P1.6b — rejeita input com >2 frases em headline+subtext combinados."""
    headline = str(data.get("headline") or "").strip()
    subtext = str(data.get("subtext") or "").strip()
    total = _count_sentences(headline) + _count_sentences(subtext)
    if total > 2:
        raise ValueError(
            f"[P1.6b] closing_slide aceita max 2 frases combinadas "
            f"(headline + subtext). Recebido: {total}. "
            "Condensar mensagem ou mover excedente para slide anterior."
        )
    if not headline:
        raise ValueError("[P1.6b] closing_slide requer 'headline' obrigatorio (1 frase).")


def render(slide, data: dict, brand: Brand) -> None:
    """Dispatcher: layout legacy minimalista OU expandido (PR 3.5).

    - Layout legacy (P1.6b): headline + visual + subtext + cta(str) + metadata
    - Layout expandido (PR 3.5): final_message + takeaways + next_steps + cta(dict)
    """
    if _is_expanded_layout(data):
        _validate_expanded(data)
        _render_expanded(slide, data, brand)
        return

    _render_legacy(slide, data, brand)


def _render_expanded(slide, data: dict, brand: Brand) -> None:
    """Layout PR 3.5 — 4 elementos canonicos da secao 25.

    1) final_message (h2, 24pt bold centralizado)
    2) takeaways (1-5 bullets, 14pt)
    3) next_steps (0-5 bullets com owner+deadline, 12pt)
    4) cta (caixa accent com label)
    """
    accent_strong = (data.get("accent_color")
                     or getattr(brand, "accent_strong", brand.accent))
    accent_moderate = getattr(brand, "accent_moderate", brand.accent)
    set_bg(slide, brand.primary)
    add_rect(slide, 0, 0, SLIDE_W, Inches(0.12), fill=accent_strong)

    # 1) Final message — h2 24pt centrado
    final_msg = str(data.get("final_message") or "").strip()
    if final_msg:
        add_tb(slide, Inches(0.8), Inches(0.7),
               SLIDE_W - Inches(1.6), Inches(1.0),
               final_msg, size=24, bold=True, color=brand.surface,
               font=brand.font_heading,
               align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE,
               line_spacing=1.15)

    # Accent line abaixo do final_message
    add_rect(slide, SLIDE_W / 2 - Inches(1.0), Inches(1.85),
             Inches(2.0), Inches(0.05), fill=accent_strong)

    # 2) Takeaways — bullets
    takeaways = data.get("takeaways") or []
    take_block_y = Inches(2.15)
    take_block_h = Inches(1.9)
    if takeaways:
        # Section title
        add_tb(slide, Inches(0.8), take_block_y,
               Inches(4.0), Inches(0.3),
               "TAKEAWAYS", size=10, bold=True, color=accent_moderate,
               font=brand.font_heading, line_spacing=1.0)
        item_h = (take_block_h - Inches(0.35)) / max(len(takeaways), 1)
        if item_h > Inches(0.55):
            item_h = Inches(0.55)
        for i, txt in enumerate(takeaways):
            ty = take_block_y + Inches(0.35) + i * item_h
            # Bullet marker
            add_rect(slide, Inches(0.85), ty + Inches(0.12),
                     Inches(0.08), Inches(0.08), fill=accent_strong)
            add_tb(slide, Inches(1.05), ty,
                   Inches(5.5), item_h,
                   str(txt), size=14, color=brand.surface,
                   font=brand.font_body, line_spacing=1.3,
                   anchor=MSO_ANCHOR.TOP)

    # 3) Next steps — bullets com owner + deadline
    steps = data.get("next_steps") or []
    steps_x = Inches(7.0)
    steps_y = Inches(2.15)
    steps_h = Inches(2.7)
    if steps:
        add_tb(slide, steps_x, steps_y,
               Inches(4.0), Inches(0.3),
               "PROXIMOS PASSOS", size=10, bold=True, color=accent_moderate,
               font=brand.font_heading, line_spacing=1.0)
        item_h = (steps_h - Inches(0.35)) / max(len(steps), 1)
        if item_h > Inches(0.6):
            item_h = Inches(0.6)
        for i, step in enumerate(steps):
            sy = steps_y + Inches(0.35) + i * item_h
            action = str(step.get("action") or "")
            owner = step.get("owner")
            deadline = step.get("deadline")
            meta = []
            if owner:
                meta.append(str(owner))
            if deadline:
                meta.append(str(deadline))
            meta_str = " · ".join(meta) if meta else ""
            # Bullet marker
            add_rect(slide, steps_x + Inches(0.05), sy + Inches(0.12),
                     Inches(0.08), Inches(0.08), fill=accent_strong)
            # Action
            add_tb(slide, steps_x + Inches(0.25), sy,
                   Inches(5.5), Inches(0.3),
                   action, size=12, bold=True, color=brand.surface,
                   font=brand.font_body, line_spacing=1.2)
            # Meta (owner + deadline)
            if meta_str:
                add_tb(slide, steps_x + Inches(0.25), sy + Inches(0.28),
                       Inches(5.5), Inches(0.25),
                       meta_str, size=10, italic=True, color=accent_moderate,
                       font=brand.font_body, line_spacing=1.0)

    # 4) CTA — caixa accent com label + opcional action
    cta = data.get("cta")
    if isinstance(cta, dict) and cta.get("label"):
        cta_y = SLIDE_H - Inches(1.5)
        cta_h = Inches(0.7)
        cta_x = Inches(0.8)
        cta_w = SLIDE_W - Inches(1.6)
        add_rect(slide, cta_x, cta_y, cta_w, cta_h,
                 fill=accent_strong, line=accent_strong, line_w=Pt(0.0))
        label = str(cta["label"])
        action_str = cta.get("action")
        cta_text = label
        if action_str:
            cta_text = f"{label}  →  {action_str}"
        add_tb(slide, cta_x, cta_y, cta_w, cta_h,
               cta_text, size=16, bold=True, color=brand.surface,
               font=brand.font_heading,
               align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)


def _render_legacy(slide, data: dict, brand: Brand) -> None:
    """Layout legacy (P1.6b) — 1 frase + 1 visual + subtext."""
    # P1.6b — validar text budget antes de qualquer render
    _validate_text_budget(data)

    # P1.7 — Brand semantics
    accent_strong = getattr(brand, "accent_strong", brand.accent)
    accent_moderate = getattr(brand, "accent_moderate", brand.accent)

    set_bg(slide, brand.primary)
    add_rect(slide, 0, 0, SLIDE_W, Inches(0.12), fill=accent_strong)

    # Wordmark (opcional)
    if data.get("wordmark"):
        add_tb(slide, Inches(0.6), Inches(0.45), Inches(5), Inches(0.4),
               data.get("wordmark", ""),
               size=24, bold=True, color=brand.surface, font=brand.font_heading,
               line_spacing=1.0)
    if data.get("wordmark_sub"):
        add_tb(slide, Inches(0.6), Inches(0.82), Inches(5), Inches(0.25),
               data.get("wordmark_sub", ""),
               size=9, color=accent_strong, font=brand.font_body, line_spacing=1.0)

    # Visual (opcional) — gradient bar acima do headline (sutil)
    visual = data.get("visual") or {}
    if visual:
        kind = visual.get("kind", "gradient")
        if kind == "gradient" or kind == "shape":
            # Linha gradient como bar acima do headline (proxy simples)
            color = visual.get("color_from") or accent_strong
            add_rect(slide, Inches(0.8), Inches(2.5), Inches(2.5), Inches(0.08),
                     fill=color)

    # Headline — 1 frase principal (40-60pt)
    add_tb(slide, Inches(0.8), Inches(2.8), Inches(11.4), Inches(1.8),
           data.get("headline", ""),
           size=50, bold=True, color=brand.surface, font=brand.font_heading,
           line_spacing=1.1)

    # Subtext italico (opcional, max 1 frase)
    if data.get("subtext"):
        add_rect(slide, Inches(0.8), Inches(5.05), Inches(1.5), Inches(0.06),
                 fill=accent_moderate)
        add_tb(slide, Inches(0.8), Inches(5.2), Inches(11), Inches(0.6),
               data.get("subtext", ""),
               size=14, italic=True, color=accent_moderate, font=brand.font_body,
               line_spacing=1.3)

    # Rodape: cta + metadata (opcional)
    if data.get("cta"):
        add_tb(slide, Inches(0.6), SLIDE_H-Inches(0.65), Inches(8), Inches(0.3),
               data.get("cta", ""),
               size=11, bold=True, color=brand.surface, font=brand.font_body)
    if data.get("metadata"):
        add_tb(slide, Inches(0.6), SLIDE_H-Inches(0.35), Inches(8), Inches(0.25),
               data.get("metadata", ""),
               size=9, italic=True, color=brand.fg_muted, font=brand.font_body)
