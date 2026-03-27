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

## Regras de Uso

1. Sempre verificar se o PDF esta encriptado antes de processar
2. Para PDFs grandes (100+ paginas), processar em batches
3. Preferir pdfplumber para extracao de tabelas (melhor que pypdf)
4. Preferir reportlab Platypus (flowables) sobre Canvas para docs complexos
5. NUNCA usar caracteres Unicode especiais em reportlab — usar markup XML
6. Testar output visualmente apos criacao (abrir e verificar)
