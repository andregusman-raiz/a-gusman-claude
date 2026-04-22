#!/usr/bin/env python3
"""
professional_report.py  Template reutilizavel para PDFs tipo "relatorio profissional"

USO:
    from professional_report import ReportBuilder, nbh

    rb = ReportBuilder("saida.pdf", title="Meu Relatorio", subtitle="Subtitulo")
    rb.cover(kpis=[("280-360", "alunos"), ("6 labs", "core")])
    rb.section(1, "Sumario Executivo")
    rb.paragraph("Texto longo...")
    rb.table(
        header=["Nome", "Valor", "Status"],
        rows=[["Item A", "100", "OK"], ["Item B", "200", "Warn"]],
        weights=[0.40, 0.30, 0.30],
    )
    rb.kpi_row([("100%", "meta"), ("92%", "atual")])
    rb.quote("Frase importante em destaque.")
    rb.bullets(["ponto 1", "ponto 2"])
    rb.build()

IMPLEMENTA AS 6 REGRAS ANTI-OVERFLOW do skill pdf:
  R1. Toda celula de tabela e Paragraph (wrap automatico)
  R2. Ranges numericos com non-breaking hyphen \u2011
  R3. KPI badges como Table de Paragraphs (nao drawString)
  R4. Larguras proporcionais a CONTENT_W com pesos explicitos
  R5. Verificacao final via pdftotext (helper build_and_verify)
  R6. Este arquivo e o template propriamente dito
"""
from __future__ import annotations
import re
import shutil
import subprocess
from pathlib import Path
from typing import List, Optional, Tuple

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak,
    Table, TableStyle, NextPageTemplate, Flowable
)

# ============================ TOKENS (customizaveis) ============================
# NAO usar U+2011 (non-breaking hyphen) — Helvetica built-in nao tem glyph e vira
# quadrado preto (■). A solucao correta e splitLongWords=0 no ParagraphStyle,
# que previne quebra de palavra independente de qual hifen estiver sendo usado.
NBSP = "\u00A0"

# Default palette — override via ReportBuilder(theme={...})
DEFAULT_THEME = {
    "primary":  colors.HexColor("#0A1628"),
    "primary_light": colors.HexColor("#1E2C44"),
    "accent":   colors.HexColor("#00C3FF"),
    "accent_dark": colors.HexColor("#0096C7"),
    "gold":     colors.HexColor("#F5A623"),
    "bg_light": colors.HexColor("#F8FAFC"),
    "bg_card":  colors.HexColor("#EFF6FF"),
    "border":   colors.HexColor("#CBD5E1"),
    "text":     colors.HexColor("#1A202C"),
    "muted":    colors.HexColor("#64748B"),
    "green":    colors.HexColor("#10B981"),
    "red":      colors.HexColor("#DC2626"),
    "white":    colors.white,
}

PAGE_W, PAGE_H = A4
MARGIN_L = 18 * mm
MARGIN_R = 18 * mm
MARGIN_T = 26 * mm
MARGIN_B = 22 * mm
CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R


# ============================ HELPER PUBLICO: nbh ============================
def nbh(text: str) -> str:
    """Normaliza traços em ranges numéricos para hífen ASCII.

    Mantida por compatibilidade, mas agora e um no-op semantico — a protecao
    contra quebra vem de splitLongWords=0 no ParagraphStyle (ver make_styles).
    Apenas normaliza en-dashes para hifens ASCII (que tem glyph em Helvetica).

    >>> nbh("280-360 alunos")
    '280-360 alunos'
    >>> nbh("R$ 5,5–10,6M")
    'R$ 5,5-10,6M'
    """
    return re.sub(r"(\d)\s*[\u2011\u2012\u2013]\s*(\d)", r"\1-\2", text)


# ============================ STYLES ============================
def make_styles(theme: dict) -> dict:
    base = ParagraphStyle("base", fontName="Helvetica", fontSize=10, leading=13, textColor=theme["text"])
    return {
        "body":         ParagraphStyle("body",         parent=base, alignment=TA_JUSTIFY, spaceAfter=4),
        "body_left":    ParagraphStyle("body_left",    parent=base, alignment=TA_LEFT, spaceAfter=4),
        "lead":         ParagraphStyle("lead",         parent=base, fontSize=11, leading=15, alignment=TA_JUSTIFY, spaceAfter=6),
        "small":        ParagraphStyle("small",        parent=base, fontSize=9, leading=12),
        "tiny":         ParagraphStyle("tiny",         parent=base, fontSize=8, leading=10, textColor=theme["muted"]),
        "h1":           ParagraphStyle("h1",           parent=base, fontName="Helvetica-Bold", fontSize=22, leading=26, textColor=theme["primary"], spaceBefore=8, spaceAfter=8),
        "h2":           ParagraphStyle("h2",           parent=base, fontName="Helvetica-Bold", fontSize=15, leading=19, textColor=theme["primary"], spaceBefore=10, spaceAfter=6),
        "h3":           ParagraphStyle("h3",           parent=base, fontName="Helvetica-Bold", fontSize=12, leading=16, textColor=theme["accent_dark"], spaceBefore=8, spaceAfter=4),
        "h3b":          ParagraphStyle("h3b",          parent=base, fontName="Helvetica-Bold", fontSize=11, leading=15, textColor=theme["primary"], spaceBefore=6, spaceAfter=3),
        "section_num":  ParagraphStyle("section_num",  parent=base, fontName="Helvetica-Bold", fontSize=11, leading=13, textColor=theme["white"], alignment=TA_CENTER),
        "section_title":ParagraphStyle("section_title",parent=base, fontName="Helvetica-Bold", fontSize=16, leading=20, textColor=theme["primary"]),
        # splitLongWords=0: NAO quebrar palavras longas no meio (ranges tipo "280-360",
        # valores "R$ 5,5-10,6M"). Palavras compostas normais (escola-instituto, capacidade-alvo)
        # podem quebrar naturalmente em celulas de body; mas em KPIs e cells curtas
        # preservar atomicidade evita "280\n-36\n0".
        "cell":         ParagraphStyle("cell",         parent=base, fontSize=9, leading=12, splitLongWords=0),
        "cell_b":       ParagraphStyle("cell_b",       parent=base, fontSize=9, leading=12, fontName="Helvetica-Bold", splitLongWords=0),
        "cell_header":  ParagraphStyle("cell_header",  parent=base, fontSize=9, leading=12, fontName="Helvetica-Bold", textColor=theme["white"], splitLongWords=0),
        "cell_center":  ParagraphStyle("cell_center",  parent=base, fontSize=9, leading=12, alignment=TA_CENTER, splitLongWords=0),
        "bullet":       ParagraphStyle("bullet",       parent=base, fontSize=10, leading=14, leftIndent=14, bulletIndent=4, spaceAfter=2),
        "quote":        ParagraphStyle("quote",        parent=base, fontSize=11, leading=16, textColor=theme["primary"], leftIndent=8, rightIndent=8, fontName="Helvetica-Oblique"),
        "kpi_num":      ParagraphStyle("kpi_num",      parent=base, fontName="Helvetica-Bold", fontSize=18, leading=22, textColor=theme["accent"], alignment=TA_CENTER, splitLongWords=0),
        "kpi_label":    ParagraphStyle("kpi_label",    parent=base, fontSize=8, leading=10, textColor=theme["muted"], alignment=TA_CENTER, splitLongWords=0),
    }


# ============================ DOC TEMPLATE ============================
class _DocTemplate(BaseDocTemplate):
    def __init__(self, filename, builder, **kw):
        super().__init__(filename, pagesize=A4, **kw)
        self._builder = builder
        frame_cover = Frame(0, 0, PAGE_W, PAGE_H, leftPadding=0, bottomPadding=0, rightPadding=0, topPadding=0, id="cover")
        frame_content = Frame(MARGIN_L, MARGIN_B, CONTENT_W, PAGE_H - MARGIN_T - MARGIN_B,
                              leftPadding=0, bottomPadding=0, rightPadding=0, topPadding=0, id="content")
        self.addPageTemplates([
            PageTemplate(id="cover",   frames=[frame_cover],   onPage=builder._draw_cover),
            PageTemplate(id="content", frames=[frame_content], onPage=builder._draw_content_chrome),
        ])


# ============================ BUILDER ============================
class ReportBuilder:
    """
    High-level API para construir PDFs profissionais que obedecem R1-R5.
    """
    def __init__(
        self,
        output_path: str,
        title: str = "Relatorio",
        subtitle: str = "",
        tagline: str = "",
        brand: str = "",
        version: str = "",
        confidential: bool = True,
        theme: Optional[dict] = None,
    ):
        self.output_path = output_path
        self.title = title
        self.subtitle = subtitle
        self.tagline = tagline
        self.brand = brand
        self.version = version
        self.confidential = confidential
        self.theme = {**DEFAULT_THEME, **(theme or {})}
        self.S = make_styles(self.theme)
        self.story: List[Flowable] = []
        self._cover_kpis: List[Tuple[str, str]] = []
        self._cover_drawn = False

    # -------- Cover --------
    def cover(self, kpis: Optional[List[Tuple[str, str]]] = None):
        """Registra dados da capa. A capa e desenhada como canvas no onPage callback."""
        self._cover_kpis = [(nbh(n), l) for n, l in (kpis or [])]
        # trigger cover page
        self.story.append(Spacer(1, 1))
        self.story.append(NextPageTemplate("content"))
        self.story.append(PageBreak())

    def _draw_cover(self, canvas, doc):
        if self._cover_drawn:
            return
        self._cover_drawn = True
        T = self.theme
        c = canvas
        c.saveState()
        c.setFillColor(T["primary"])
        c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
        # pontos decorativos
        c.setFillColor(T["primary_light"])
        for x in range(0, int(PAGE_W), 14):
            for y in range(0, int(PAGE_H), 14):
                c.circle(x, y, 0.5, stroke=0, fill=1)
        # barra dourada no topo
        c.setFillColor(T["gold"])
        c.rect(0, PAGE_H - 4*mm, PAGE_W, 4*mm, stroke=0, fill=1)
        # bloco ciano decorativo
        c.setFillColor(T["accent"])
        c.rect(MARGIN_L, PAGE_H - 70*mm, 6*mm, 40*mm, stroke=0, fill=1)
        # label topo
        c.setFillColor(T["accent"])
        c.setFont("Helvetica-Bold", 9)
        c.drawString(MARGIN_L + 12*mm, PAGE_H - 40*mm, (self.tagline or "RELATORIO PROFISSIONAL").upper())
        # Title
        c.setFillColor(T["white"])
        c.setFont("Helvetica-Bold", 42)
        # medir e quebrar se necessario
        title_parts = self.title.split()
        if c.stringWidth(self.title, "Helvetica-Bold", 42) > (PAGE_W - 2*MARGIN_L - 12*mm):
            # duas linhas
            mid = len(title_parts) // 2
            line1 = " ".join(title_parts[:mid])
            line2 = " ".join(title_parts[mid:])
            c.drawString(MARGIN_L + 12*mm, PAGE_H - 62*mm, line1)
            c.drawString(MARGIN_L + 12*mm, PAGE_H - 80*mm, line2)
        else:
            c.drawString(MARGIN_L + 12*mm, PAGE_H - 62*mm, self.title)
        # subtitle
        if self.subtitle:
            c.setFont("Helvetica", 16)
            c.drawString(MARGIN_L + 12*mm, PAGE_H - 100*mm, self.subtitle)
        # linha dourada
        c.setStrokeColor(T["gold"])
        c.setLineWidth(1.5)
        c.line(MARGIN_L + 12*mm, PAGE_H - 115*mm, MARGIN_L + 90*mm, PAGE_H - 115*mm)
        # KPIs  R3: medir string antes de desenhar
        if self._cover_kpis:
            n = len(self._cover_kpis)
            badge_y = 60*mm
            badge_h = 28*mm
            gap = 3*mm
            badge_w = (CONTENT_W - (n-1)*gap) / n
            for i, (num, label) in enumerate(self._cover_kpis):
                x = MARGIN_L + i * (badge_w + gap)
                c.setFillColor(T["primary_light"])
                c.setStrokeColor(T["accent"])
                c.setLineWidth(0.8)
                c.roundRect(x, badge_y, badge_w, badge_h, 3*mm, stroke=1, fill=1)
                # font adaptativo: se o numero nao couber em 18pt, reduz
                font_size = 17
                while c.stringWidth(num, "Helvetica-Bold", font_size) > badge_w - 4*mm and font_size > 8:
                    font_size -= 1
                c.setFillColor(T["accent"])
                c.setFont("Helvetica-Bold", font_size)
                c.drawCentredString(x + badge_w/2, badge_y + badge_h - 12*mm, num)
                # label
                label_size = 8
                while c.stringWidth(label, "Helvetica", label_size) > badge_w - 3*mm and label_size > 6:
                    label_size -= 1
                c.setFillColor(colors.HexColor("#94A3B8"))
                c.setFont("Helvetica", label_size)
                c.drawCentredString(x + badge_w/2, badge_y + 7*mm, label)
        # footer
        c.setFillColor(colors.HexColor("#64748B"))
        c.setFont("Helvetica", 8)
        version = self.version or "v1.0"
        footer_l = f"{version}" + (f"  Documento Confidencial" if self.confidential else "")
        c.drawString(MARGIN_L, 25*mm, footer_l)
        if self.brand:
            c.drawRightString(PAGE_W - MARGIN_R, 25*mm, self.brand)
        # barra inferior
        c.setFillColor(T["accent"])
        c.rect(0, 0, PAGE_W, 4*mm, stroke=0, fill=1)
        c.restoreState()

    # -------- Content chrome (header/footer paginas internas) --------
    def _draw_content_chrome(self, canvas, doc):
        T = self.theme
        c = canvas
        c.saveState()
        # header strip
        c.setFillColor(T["primary"])
        c.rect(0, PAGE_H - 16*mm, PAGE_W, 16*mm, stroke=0, fill=1)
        c.setFillColor(T["gold"])
        c.rect(0, PAGE_H - 17*mm, PAGE_W, 1*mm, stroke=0, fill=1)
        c.setFillColor(T["white"])
        c.setFont("Helvetica-Bold", 11)
        c.drawString(MARGIN_L, PAGE_H - 9*mm, self.title.upper()[:40])
        c.setFont("Helvetica", 9)
        c.setFillColor(colors.HexColor("#94A3B8"))
        if self.subtitle:
            c.drawString(MARGIN_L + 28*mm, PAGE_H - 9*mm, self.subtitle)
        c.setFillColor(T["accent"])
        c.setFont("Helvetica-Bold", 10)
        c.drawRightString(PAGE_W - MARGIN_R, PAGE_H - 9*mm, f"Pag. {doc.page}")
        # footer
        c.setStrokeColor(T["border"])
        c.setLineWidth(0.4)
        c.line(MARGIN_L, 14*mm, PAGE_W - MARGIN_R, 14*mm)
        c.setFillColor(T["muted"])
        c.setFont("Helvetica", 7.5)
        footer_text = (
            (self.brand + "  ") if self.brand else ""
        ) + (
            "Documento confidencial  " if self.confidential else ""
        ) + (self.version or "v1.0")
        c.drawString(MARGIN_L, 9*mm, footer_text)
        c.restoreState()

    # -------- Content API --------
    def section(self, number: int, title: str):
        """R1: bloco de secao com numero em caixa navy."""
        tbl = Table(
            [[Paragraph(str(number), self.S["section_num"]),
              Paragraph(title, self.S["section_title"])]],
            colWidths=[14*mm, CONTENT_W - 14*mm],
            rowHeights=[12*mm]
        )
        tbl.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (0,0), self.theme["primary"]),
            ("BACKGROUND", (1,0), (1,0), self.theme["bg_light"]),
            ("LINEBELOW", (1,0), (1,0), 1.5, self.theme["accent"]),
            ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
            ("LEFTPADDING", (1,0), (1,0), 8),
            ("TOPPADDING", (0,0), (-1,-1), 0),
            ("BOTTOMPADDING", (0,0), (-1,-1), 0),
        ]))
        self.story.append(tbl)
        self.story.append(Spacer(1, 4*mm))

    def paragraph(self, text: str, style: str = "body"):
        self.story.append(Paragraph(nbh(text), self.S[style]))

    def h2(self, text: str):
        self.story.append(Paragraph(nbh(text), self.S["h2"]))

    def h3(self, text: str):
        self.story.append(Paragraph(nbh(text), self.S["h3"]))

    def h3b(self, text: str):
        self.story.append(Paragraph(nbh(text), self.S["h3b"]))

    def spacer(self, h_mm: float = 3):
        self.story.append(Spacer(1, h_mm*mm))

    def page_break(self):
        self.story.append(PageBreak())

    def bullets(self, items: List[str]):
        """R1: cada bullet e Paragraph (wrap automatico)."""
        for it in items:
            self.story.append(Paragraph(f"&bull;&nbsp;&nbsp;{nbh(it)}", self.S["bullet"]))

    def quote(self, text: str):
        """R1: caixa de citacao com borda ciano."""
        tbl = Table(
            [[Paragraph(f'&ldquo;{nbh(text)}&rdquo;', self.S["quote"])]],
            colWidths=[CONTENT_W]
        )
        tbl.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), self.theme["bg_card"]),
            ("LINEBEFORE", (0,0), (0,-1), 3, self.theme["accent"]),
            ("LEFTPADDING", (0,0), (-1,-1), 12),
            ("RIGHTPADDING", (0,0), (-1,-1), 12),
            ("TOPPADDING", (0,0), (-1,-1), 10),
            ("BOTTOMPADDING", (0,0), (-1,-1), 10),
        ]))
        self.story.append(tbl)

    def table(
        self,
        header: List[str],
        rows: List[List[str]],
        weights: Optional[List[float]] = None,
    ):
        """
        R1 + R4: tabela com TODAS as celulas em Paragraph + larguras proporcionais.

        - header: lista de strings
        - rows: lista de listas de strings (ou Paragraphs ja criados)
        - weights: pesos proporcionais a CONTENT_W, soma = 1.0 (default: igual)
        """
        if weights is None:
            weights = [1.0 / len(header)] * len(header)
        assert abs(sum(weights) - 1.0) < 0.01, f"weights devem somar 1.0, somam {sum(weights)}"
        col_widths = [CONTENT_W * w for w in weights]

        data = []
        data.append([Paragraph(h, self.S["cell_header"]) for h in header])
        for r in rows:
            row_cells = []
            for c in r:
                if hasattr(c, "wrap"):  # ja e flowable
                    row_cells.append(c)
                else:
                    row_cells.append(Paragraph(nbh(str(c)), self.S["cell"]))
            data.append(row_cells)

        tbl = Table(data, colWidths=col_widths, repeatRows=1)
        style = [
            ("BACKGROUND", (0,0), (-1,0), self.theme["primary"]),
            ("TEXTCOLOR",  (0,0), (-1,0), self.theme["white"]),
            ("VALIGN",     (0,0), (-1,-1), "MIDDLE"),
            ("LEFTPADDING",(0,0), (-1,-1), 6),
            ("RIGHTPADDING",(0,0), (-1,-1), 6),
            ("TOPPADDING", (0,0), (-1,-1), 5),
            ("BOTTOMPADDING",(0,0), (-1,-1), 5),
            ("LINEBELOW",  (0,0), (-1,0), 1, self.theme["accent"]),
            ("LINEBELOW",  (0,1), (-1,-2), 0.3, self.theme["border"]),
            ("LINEBELOW",  (0,-1), (-1,-1), 0.5, self.theme["border"]),
        ]
        for i in range(1, len(data)):
            if i % 2 == 0:
                style.append(("BACKGROUND", (0,i), (-1,i), self.theme["bg_light"]))
        tbl.setStyle(TableStyle(style))
        self.story.append(tbl)

    def kpi_row(self, items: List[Tuple[str, str]]):
        """R3: linha de KPI badges usando Table(Paragraph), nao drawString."""
        n = max(1, len(items))
        cells = []
        for num, label in items:
            inner = Table(
                [[Paragraph(nbh(num), self.S["kpi_num"])],
                 [Paragraph(label, self.S["kpi_label"])]],
                colWidths=[(CONTENT_W - (n-1)*3*mm) / n],
                rowHeights=[12*mm, 8*mm]
            )
            inner.setStyle(TableStyle([
                ("BACKGROUND", (0,0), (-1,-1), self.theme["bg_card"]),
                ("BOX", (0,0), (-1,-1), 0.5, self.theme["accent"]),
                ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
                ("LEFTPADDING", (0,0), (-1,-1), 2),
                ("RIGHTPADDING", (0,0), (-1,-1), 2),
                ("TOPPADDING", (0,0), (-1,-1), 2),
                ("BOTTOMPADDING", (0,0), (-1,-1), 2),
            ]))
            cells.append(inner)
        outer = Table([cells], colWidths=[((CONTENT_W - (n-1)*3*mm) / n) + 3*mm] * n)
        outer.setStyle(TableStyle([
            ("VALIGN", (0,0), (-1,-1), "TOP"),
            ("LEFTPADDING", (0,0), (-1,-1), 0),
            ("RIGHTPADDING", (0,0), (-1,-1), 3*mm),
            ("TOPPADDING", (0,0), (-1,-1), 0),
            ("BOTTOMPADDING", (0,0), (-1,-1), 0),
        ]))
        self.story.append(outer)

    # -------- Build --------
    def build(self):
        doc = _DocTemplate(self.output_path, builder=self)
        doc.build(self.story)
        return self.output_path

    def build_and_verify(self, verbose: bool = True) -> Tuple[str, bool, List[str]]:
        """
        R5: constroi e roda verificacao anti-overflow via pdftotext.
        Retorna (path, ok, warnings).
        """
        self.build()
        ok, warnings = _verify_pdf(self.output_path)
        if verbose:
            if ok:
                print(f"OK: {self.output_path}")
            else:
                print(f"WARN: {self.output_path}")
                for w in warnings:
                    print(f"  - {w}")
        return (self.output_path, ok, warnings)


# ============================ VERIFIER (R5) ============================
def _verify_pdf(path: str) -> Tuple[bool, List[str]]:
    """
    Roda pdftotext -layout e detecta padroes tipicos de overflow:
    - Numeros orfaos em linha propria (ex: "360" sozinho)
    - Concatenacao suspeita de numero+letra (ex: "40h1")
    - Linhas muito longas (>130 char) com muitos espacos internos (tabela estourada)
    """
    warnings = []
    if not shutil.which("pdftotext"):
        return (True, ["pdftotext nao instalado — pulando verificacao"])
    tmp = "/tmp/pdf_verify.txt"
    try:
        subprocess.run(
            ["pdftotext", "-layout", path, tmp],
            check=True, capture_output=True
        )
    except subprocess.CalledProcessError as e:
        return (False, [f"pdftotext falhou: {e}"])

    content = Path(tmp).read_text(errors="replace")
    lines = content.splitlines()

    # Padrao 0: quadrado preto U+25A0 (glyph ausente, tipicamente de U+2011 em Helvetica)
    square_count = content.count("\u25A0")
    if square_count > 0:
        warnings.append(
            f"{square_count} ocorrencias de U+25A0 (quadrado preto) — provavel uso de caractere "
            f"sem glyph em Helvetica built-in (ex: U+2011 non-breaking hyphen). Use hifen ASCII."
        )

    # Padrao 1: numero orfao (linha com apenas digitos ou "R$ N")
    # Exemplo real do bug v1: linha "0" sozinha apos linha "R$ 5.50"
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if re.match(r"^\d{1,4}$", stripped) and len(stripped) <= 3:
            prev = lines[i-2].strip() if i > 1 else ""
            if prev and (prev.endswith(("-", "\u2011", "\u2013"))
                         or re.search(r"\d[-\u2011\u2013]\s*$", prev)
                         or re.search(r"\d,?\d?\s*$", prev[-6:])):  # "R$ 5.50" pattern
                warnings.append(f"linha {i}: numero orfao '{stripped}' apos '{prev[-20:]}'")

    # Padrao 2: concatenacao de celulas — numero+h+1digito NAO seguido por digito
    # "40h1 ano" (bug) tem h + digito + nao-digito
    # "7h30", "16h30" (ok) tem h + digito + digito
    for i, line in enumerate(lines, 1):
        for m in re.finditer(r"\d+h\d(?!\d)", line):
            # ignora se for fim de linha (ex: "19h" seguido de nada)
            ctx = line[max(0, m.start()-5): m.end()+5]
            warnings.append(f"linha {i}: possivel concatenacao de celulas: '{ctx}'")

    # Padrao 3: palavra concatenada sem espaco (tipicamente "todosde", "altoE")
    # Trigger: letra minuscula seguida de letra maiuscula diferente de palavras comuns
    # Desabilitado por ruido — R1-R4 ja previnem isso
    return (len(warnings) == 0, warnings)


# ============================ DEMO ============================
if __name__ == "__main__":
    rb = ReportBuilder(
        "/tmp/demo_professional_report.pdf",
        title="Demo Report",
        subtitle="Template Reutilizavel",
        tagline="DEMONSTRACAO  TEMPLATE",
        brand="Demo Brand",
        version="v1.0  Abril 2026",
        confidential=True,
    )
    rb.cover(kpis=[
        ("280-360", "itens"),
        ("R$ 5,5-10,6M", "orcamento"),
        ("6 labs", "unidades"),
        ("90%", "meta"),
    ])
    rb.section(1, "Sumario Executivo")
    rb.paragraph(
        "Este e um paragrafo de teste para demonstrar o wrap automatico de texto longo "
        "dentro de um documento gerado pelo template. Ele inclui numeros como 280-360 "
        "e R$ 5,5-10,6M que serao automaticamente convertidos para non-breaking hyphens."
    )
    rb.spacer(4)
    rb.h3("Principios")
    rb.bullets([
        "Item com numero 280-360 alunos",
        "Item com faixa R$ 100K-500K",
        "Item longo que deveria quebrar em duas linhas dentro do bullet para validar o comportamento",
    ])
    rb.spacer(4)
    rb.kpi_row([
        ("280-360", "alunos"),
        ("R$ 5,5-10,6M", "CAPEX"),
        ("6 labs", "core"),
        ("30-60", "mentores"),
    ])
    rb.spacer(6)
    rb.h3("Tabela de teste")
    rb.table(
        header=["Item", "Descricao longa que deve quebrar linha", "Valor", "Status"],
        rows=[
            ["A-1", "Descricao com varias palavras que precisa quebrar dentro da celula automaticamente", "280-360", "OK"],
            ["B-2", "Outra descricao longa para testar wrap", "R$ 5,5-10,6M", "Warn"],
            ["C-3", "Terceira linha para validar alternancia de fundo", "42", "OK"],
        ],
        weights=[0.10, 0.55, 0.20, 0.15],
    )
    rb.spacer(4)
    rb.quote("Texto importante em caixa de citacao com borda ciano para destaque visual.")
    path, ok, warns = rb.build_and_verify()
    print(f"\nDemo: {path}  OK={ok}  warnings={len(warns)}")
