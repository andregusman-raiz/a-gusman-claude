---
name: pdf
description: "Criar, editar, analisar, merge, split e preencher PDFs. Trigger quando usuario menciona .pdf, quer extrair texto/tabelas, criar relatorio PDF, ou manipular documentos PDF."
model: sonnet
argument-hint: "[create|merge|split|extract|fill] [path ou descricao]"
metadata:
  filePattern: "*.pdf"
  bashPattern: "pdf|pypdf|reportlab|pdfplumber"
  priority: 80
---

# PDF Skill

Manipulacao completa de PDFs: criar, editar, merge, split, extrair texto/tabelas, OCR, watermark, protecao.

## Quick Reference

| Task | Best Tool | Install |
|------|-----------|---------|
| Merge/split/rotate | pypdf | `pip install pypdf` |
| Extract text/tables | pdfplumber | `pip install pdfplumber` |
| Create PDFs | reportlab | `pip install reportlab` |
| CLI text extract | pdftotext | `brew install poppler` |
| CLI manipulate | qpdf | `brew install qpdf` |
| OCR scanned PDFs | pytesseract | `pip install pytesseract` + `brew install tesseract` |
| Fill forms | pypdf | `pip install pypdf` |

## Python Libraries

### pypdf — Merge, Split, Rotate, Encrypt

```python
from pypdf import PdfReader, PdfWriter, PdfMerger

# Read
reader = PdfReader("input.pdf")
print(f"Pages: {len(reader.pages)}")
text = reader.pages[0].extract_text()

# Merge multiple PDFs
merger = PdfMerger()
for pdf in ["a.pdf", "b.pdf", "c.pdf"]:
    merger.append(pdf)
merger.write("merged.pdf")
merger.close()

# Split — extract pages 2-5
writer = PdfWriter()
for i in range(1, 5):  # 0-indexed
    writer.add_page(reader.pages[i])
writer.write("pages_2_to_5.pdf")

# Rotate page
writer = PdfWriter()
for page in reader.pages:
    page.rotate(90)  # 90, 180, 270
    writer.add_page(page)
writer.write("rotated.pdf")

# Encrypt with password
writer = PdfWriter()
writer.append_pages_from_reader(reader)
writer.encrypt("user_password", "owner_password")
writer.write("encrypted.pdf")

# Decrypt
reader = PdfReader("encrypted.pdf")
reader.decrypt("password")

# Fill form fields
reader = PdfReader("form.pdf")
writer = PdfWriter()
writer.append_pages_from_reader(reader)
writer.update_page_form_field_values(
    writer.pages[0],
    {"field_name": "value", "another_field": "value2"}
)
writer.write("filled_form.pdf")
```

### pdfplumber — Extract Text and Tables

```python
import pdfplumber

with pdfplumber.open("input.pdf") as pdf:
    # Extract text from all pages
    for page in pdf.pages:
        text = page.extract_text()
        print(text)

    # Extract tables
    for page in pdf.pages:
        tables = page.extract_tables()
        for table in tables:
            for row in table:
                print(row)

    # Extract table as pandas DataFrame
    import pandas as pd
    table = pdf.pages[0].extract_tables()[0]
    df = pd.DataFrame(table[1:], columns=table[0])
```

### reportlab — Create PDFs

**CRITICAL**: NEVER use Unicode subscript/superscript characters (e.g., superscript 2 for m2). ReportLab renders them as black boxes. Use `<super>2</super>` in Paragraph markup instead.

```python
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.units import cm, mm, inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image, ListFlowable, ListItem
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

# Simple Canvas approach
from reportlab.pdfgen import canvas
c = canvas.Canvas("simple.pdf", pagesize=A4)
c.setFont("Helvetica-Bold", 16)
c.drawString(72, 750, "Title")
c.setFont("Helvetica", 12)
c.drawString(72, 720, "Body text here")
c.save()

# Platypus approach (recommended for complex docs)
doc = SimpleDocTemplate("report.pdf", pagesize=A4,
    topMargin=2*cm, bottomMargin=2*cm,
    leftMargin=2.5*cm, rightMargin=2.5*cm)

styles = getSampleStyleSheet()
story = []

# Custom style
title_style = ParagraphStyle('CustomTitle',
    parent=styles['Heading1'],
    fontSize=24, textColor=HexColor('#1a1a2e'),
    spaceAfter=20)

story.append(Paragraph("Report Title", title_style))
story.append(Spacer(1, 12))
story.append(Paragraph("Body text with <b>bold</b> and <i>italic</i>.", styles['Normal']))

# Table
data = [
    ['Name', 'Value', 'Status'],
    ['Item A', '100', 'OK'],
    ['Item B', '200', 'Warning'],
]
table = Table(data, colWidths=[5*cm, 3*cm, 3*cm])
table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), HexColor('#1a1a2e')),
    ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#ffffff')),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#cccccc')),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#f8f9fa'), HexColor('#ffffff')]),
]))
story.append(table)
story.append(PageBreak())

# Build
doc.build(story)

# Superscript/subscript — CORRECT way
story.append(Paragraph("Area: 50 m<super>2</super>", styles['Normal']))
# WRONG — will render as black boxes:
# story.append(Paragraph("Area: 50 m\u00b2", styles['Normal']))
```

## CLI Tools

### pdftotext (poppler)
```bash
# Extract text
pdftotext input.pdf output.txt
pdftotext -layout input.pdf output.txt  # preserve layout
pdftotext -f 2 -l 5 input.pdf output.txt  # pages 2-5
```

### qpdf
```bash
# Merge
qpdf --empty --pages a.pdf b.pdf -- merged.pdf

# Split — extract pages
qpdf input.pdf --pages . 1-5 -- first5.pdf

# Decrypt
qpdf --decrypt input.pdf output.pdf

# Encrypt
qpdf --encrypt user_pass owner_pass 256 -- input.pdf encrypted.pdf

# Linearize (optimize for web)
qpdf --linearize input.pdf optimized.pdf
```

## Common Tasks

### OCR Scanned PDFs
```python
import pytesseract
from pdf2image import convert_from_path

images = convert_from_path("scanned.pdf", dpi=300)
for i, img in enumerate(images):
    text = pytesseract.image_to_string(img, lang='por')  # 'por' for Portuguese
    print(f"--- Page {i+1} ---\n{text}")
```

### Add Watermark
```python
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from io import BytesIO

# Create watermark
packet = BytesIO()
c = canvas.Canvas(packet, pagesize=A4)
c.setFont("Helvetica", 60)
c.setFillAlpha(0.15)
c.saveState()
c.translate(300, 400)
c.rotate(45)
c.drawCentredString(0, 0, "CONFIDENCIAL")
c.restoreState()
c.save()
packet.seek(0)

watermark = PdfReader(packet).pages[0]
reader = PdfReader("input.pdf")
writer = PdfWriter()

for page in reader.pages:
    page.merge_page(watermark)
    writer.add_page(page)

writer.write("watermarked.pdf")
```

### PDF to Images
```python
from pdf2image import convert_from_path
images = convert_from_path("input.pdf", dpi=150)
for i, img in enumerate(images):
    img.save(f"page_{i+1}.png", "PNG")
```

## Regras Anti-Overflow (OBRIGATORIAS para qualquer PDF gerado)

> Historico do incidente (2026-04-11, Cubo Tech):
> - **v1**: badges "280-360" viraram "280-36" + "0" em linha separada, equipment bleed entre colunas.
> - **v2 (primeira tentativa de fix)**: usei U+2011 (non-breaking hyphen) em ranges numericos E em palavras compostas (`capacidade-alvo`, `semi-integral`, `escola-instituto`). Resultado: Helvetica built-in NAO tem glyph para U+2011, todos viraram **quadrados pretos** `■`. Alem disso, Paragraph ignora U+2011 para fins de quebra de linha.
> - **v3 (fix correto)**: hifen ASCII normal `-` para tudo (ranges E palavras compostas) + `splitLongWords=0` no ParagraphStyle das celulas/KPIs.
>
> **Licao**: o controle de quebra em Paragraph vem de `splitLongWords`, nao de qual caractere hifen usar. U+2011 e armadilha tripla: (1) nao tem glyph em Helvetica built-in, (2) Paragraph ignora para break control, (3) confunde palavras compostas (que DEVEM poder quebrar entre linhas) com ranges numericos (que NAO devem).

### R1. Toda celula de tabela com texto variavel/longo DEVE ser `Paragraph`

ReportLab Table so faz wrap automatico quando a celula contem um flowable (Paragraph). Strings cruas NAO quebram linha — o texto transborda para a celula vizinha.

```python
# ERRADO — string crua, vai vazar
Table([
    ["Lab", "Area", "Equipment"],
    ["FabLab", "100 m2", "Impressoras 3D, corte laser, CNC, bancada de solda, oficina eletronica"],
])

# CORRETO — Paragraph dentro da celula, wrap automatico
from reportlab.platypus import Paragraph
cell = ParagraphStyle("cell", fontName="Helvetica", fontSize=9, leading=12)
Table([
    [Paragraph("<b>Lab</b>", cell), Paragraph("<b>Area</b>", cell), Paragraph("<b>Equipment</b>", cell)],
    [Paragraph("FabLab", cell), Paragraph("100 m<super>2</super>", cell),
     Paragraph("Impressoras 3D, corte laser, CNC, bancada de solda, oficina eletronica", cell)],
])
```

Helper obrigatorio:

```python
from reportlab.platypus import Paragraph, Table
from reportlab.lib.styles import ParagraphStyle

_cell = ParagraphStyle("cell", fontName="Helvetica", fontSize=9, leading=12)
_hdr = ParagraphStyle("hdr", fontName="Helvetica-Bold", fontSize=9, leading=12, textColor="white")

def safe_table(header, rows, col_widths):
    """Wrap TODAS as celulas em Paragraph para garantir wrap automatico."""
    data = [[Paragraph(h, _hdr) for h in header]]
    for r in rows:
        data.append([c if hasattr(c, "wrap") else Paragraph(str(c), _cell) for c in r])
    return Table(data, colWidths=col_widths, repeatRows=1)
```

### R2. Use `splitLongWords=0` no ParagraphStyle de celulas/KPIs  NUNCA `\u2011`

**Contra-intuitivo mas critico**: nao tente "non-breaking hyphen" U+2011. Ele tem 3 problemas:
1. **Helvetica built-in nao tem glyph** — vira quadrado preto `■` no PDF
2. **Paragraph ignora U+2011 para break control** — quebra a palavra igual se nao couber
3. **Confunde palavras compostas com ranges** — `capacidade-alvo` e `280-360` precisam de tratamento diferente

**Solucao real**: use hifen ASCII normal `-` em tudo (ranges E palavras compostas), e controle quebra via `splitLongWords=0` no ParagraphStyle das celulas curtas onde "280-360" nao pode quebrar:

```python
# ERRADO — U+2011 vira quadrado preto
("280\u2011360", "alunos")
"capacidade\u2011alvo de ~280\u2011360 alunos"  # ambos viram ■

# ERRADO — hifen ASCII em Paragraph com splitLongWords=1 (default) quebra se nao couber
cell_default = ParagraphStyle("cell", fontSize=9, leading=12)
Paragraph("280-360", cell_default)  # pode virar "280-\n360"

# CORRETO — hifen ASCII + splitLongWords=0
cell_atomic = ParagraphStyle("cell", fontSize=9, leading=12, splitLongWords=0)
Paragraph("280-360", cell_atomic)       # ok, palavra atomica
Paragraph("R$ 5,5-10,6M", cell_atomic)  # ok, atomica
Paragraph("capacidade-alvo", cell_atomic)  # ok, atomica (e pode quebrar em espaco se tiver mais texto)
```

**Distincao importante** entre palavras compostas e ranges:

| Caso | Texto | Comportamento desejado |
|------|-------|------------------------|
| Range numerico | `280-360`, `R$ 5,5-10,6M` | NAO pode quebrar (semantica de par) |
| Palavra composta | `escola-instituto`, `semi-integral`, `capacidade-alvo` | Pode quebrar entre linhas naturalmente no body (normalmente nao quebra porque cabe) |
| Palavra composta em KPI badge | `chief-of-staff` | NAO pode quebrar (visual de KPI) |

`splitLongWords=0` resolve os tres casos quando aplicado em celulas de tabela, KPI badges e qualquer espaco onde a atomicidade visual importa. No body (paragrafos longos), o default `splitLongWords=1` esta ok porque a linha e larga e "escola-instituto" nunca vai precisar quebrar no meio.

**Estilos recomendados** (copiar em qualquer novo gerador de PDF):

```python
from reportlab.lib.styles import ParagraphStyle

# Para celulas de tabela, KPIs, badges — atomicidade obrigatoria
cell_atomic = ParagraphStyle(
    "cell", fontName="Helvetica", fontSize=9, leading=12,
    splitLongWords=0  # <-- aqui esta o fix
)
kpi_num = ParagraphStyle(
    "kpi_num", fontName="Helvetica-Bold", fontSize=18,
    alignment=TA_CENTER, splitLongWords=0
)

# Para paragrafos de body — default eh ok
body = ParagraphStyle("body", fontName="Helvetica", fontSize=10, leading=13)
# NAO precisa splitLongWords=0; palavras compostas quebram naturalmente se necessario
```

### R3. NUNCA `canvas.drawString` para KPI badges com texto dinamico

`drawCentredString` em caixa de largura fixa nao quebra linha — ou o texto cabe ou ele desenha fora da caixa / por cima do elemento vizinho. Se o texto for maior que a caixa, ReportLab aplica quebra caotica no ultimo caractere que cabe.

```python
# ERRADO — texto longo em badge estreita vira "R$ 5.50" + "0-8.500"
c.setFont("Helvetica-Bold", 18)
c.drawCentredString(x + w/2, y, "R$ 5.500-8.500")

# CORRETO — badge como Table(Paragraph), altura dinamica
def kpi_badge(num, label, width):
    return Table(
        [[Paragraph(num, kpi_num_style)], [Paragraph(label, kpi_label_style)]],
        colWidths=[width],
    )
```

So usar `canvas.drawString` para:
- Textos curtos e fixos (titulos de pagina, paginacao, data)
- Elementos decorativos conhecidos em tempo de design
- Capas com layout artistico (mesmo assim, medir `stringWidth` antes se o texto for dinamico)

### R4. Largura de coluna proporcional a `CONTENT_W` com pesos explicitos

```python
PAGE_W, PAGE_H = A4
MARGIN_L = 18 * mm
MARGIN_R = 18 * mm
CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R

# Pesos explicitos — NUNCA chutar larguras em mm absolutos
col_widths = [
    CONTENT_W * 0.24,  # Lab (nome curto)
    CONTENT_W * 0.10,  # Area (numero + unidade)
    CONTENT_W * 0.48,  # Equipment (texto longo — coluna larga)
    CONTENT_W * 0.18,  # Trilhas (tags curtas)
]
# Total = 1.00 = CONTENT_W
```

Regra pratica para dimensionar pesos:
- Medir o campo mais longo de cada coluna em caracteres (ou usar `stringWidth`)
- Coluna com textos >50 char precisa de peso >=0.35
- Coluna de numero/sigla pode ter peso <=0.15
- Verificar que `sum(pesos) == 1.00`

### R5. Verificacao obrigatoria pos-geracao

Antes de entregar qualquer PDF ao usuario:

```bash
pdftotext -layout output.pdf /tmp/check.txt
# Verificar manualmente linhas suspeitas:
# - Numeros quebrados: "280\s+360", "R\$\s+\d+,\d+\s+M"
# - Colunas coladas: palavras longas sem espaco correto
# - Tabelas truncadas: celulas cortadas no meio da palavra
grep -nE "^\s*(280|R\$)\s*$" /tmp/check.txt  # detecta numero orfao
awk 'length > 120' /tmp/check.txt  # detecta linhas suspeitamente longas
```

### R6. Template reutilizavel

Para documentos tipo "relatorio profissional com capa, secoes numeradas, tabelas e KPIs", usar o template em `~/Claude/.claude/skills/pdf/templates/professional_report.py` como ponto de partida. Ele ja implementa R1-R5.

---

## Regras Gerais de Uso

1. Sempre verificar se o PDF esta encriptado antes de processar
2. Para PDFs grandes (100+ paginas), processar em batches
3. Preferir pdfplumber para extracao de tabelas (melhor que pypdf)
4. Preferir reportlab Platypus (flowables) sobre Canvas para docs complexos
5. NUNCA usar caracteres Unicode especiais em reportlab — usar markup XML
6. Testar output visualmente apos criacao (abrir e verificar)
7. SEMPRE aplicar R1-R5 (Anti-Overflow Rules) em qualquer PDF com tabelas ou KPIs
