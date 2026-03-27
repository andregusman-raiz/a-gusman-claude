---
name: docx
description: "Criar, editar e analisar documentos Word (.docx). Trigger quando usuario quer criar relatorio, memo, carta, editar Word existente, tracked changes, ou extrair conteudo de .docx."
model: sonnet
argument-hint: "[create|edit|redline|analyze] [path ou descricao]"
metadata:
  filePattern: "*.docx,*.doc"
  bashPattern: "docx|word|documento|document|redline"
  priority: 80
---

# DOCX Skill

Criar, editar e analisar documentos Word. docx-js para criacao, OOXML para edicao, pandoc para extracao.

## Workflow Decision Tree

```
Quer o que?
├── Ler/extrair texto     → pandoc ou python-docx
├── Criar do zero         → docx-js (Node) ou python-docx
├── Editar existente      → OOXML unpack/edit/pack
├── Tracked changes       → OOXML XML direto (w:ins, w:del)
├── Converter para PDF    → LibreOffice headless
└── Converter para imagem → LibreOffice + ImageMagick
```

## Reading Content

### pandoc (text extraction)
```bash
# To plain text
pandoc input.docx -t plain -o output.txt

# To markdown
pandoc input.docx -t markdown -o output.md

# To HTML
pandoc input.docx -t html -o output.html
```

### python-docx (structured reading)
```python
from docx import Document
doc = Document("input.docx")

# Paragraphs
for para in doc.paragraphs:
    print(f"[{para.style.name}] {para.text}")

# Tables
for table in doc.tables:
    for row in table.rows:
        print([cell.text for cell in row.cells])
```

### Raw XML inspection
```bash
unzip -p input.docx word/document.xml | xmllint --format -
```

## Creating with docx-js (Node)

```bash
npm install docx
```

```typescript
import { Document, Packer, Paragraph, TextRun, HeadingLevel,
         Table, TableRow, TableCell, WidthType, BorderStyle,
         AlignmentType, PageBreak, Header, Footer,
         ImageRun, NumberFormat } from "docx";
import * as fs from "fs";

const doc = new Document({
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 }, // A4 in twips
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }, // 1 inch
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({ text: "Header Text", alignment: AlignmentType.RIGHT })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          children: [new TextRun("Page "), new TextRun({ children: [PageNumber.CURRENT] })],
          alignment: AlignmentType.CENTER,
        })],
      }),
    },
    children: [
      // Title
      new Paragraph({
        text: "Document Title",
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),

      // Heading
      new Paragraph({
        text: "Section 1",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
      }),

      // Body text with formatting
      new Paragraph({
        children: [
          new TextRun("Normal text, "),
          new TextRun({ text: "bold text", bold: true }),
          new TextRun(", "),
          new TextRun({ text: "italic text", italics: true }),
          new TextRun(", "),
          new TextRun({ text: "colored text", color: "FF0000" }),
        ],
        spacing: { after: 200 },
      }),

      // Bulleted list
      new Paragraph({ text: "First item", bullet: { level: 0 } }),
      new Paragraph({ text: "Second item", bullet: { level: 0 } }),
      new Paragraph({ text: "Sub-item", bullet: { level: 1 } }),

      // Numbered list
      new Paragraph({
        text: "Step one",
        numbering: { reference: "numbered-list", level: 0 },
      }),

      // Table
      new Table({
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: "Header 1", bold: true })],
                width: { size: 3000, type: WidthType.DXA },
                shading: { fill: "1a1a2e" },
              }),
              new TableCell({
                children: [new Paragraph({ text: "Header 2", bold: true })],
                width: { size: 3000, type: WidthType.DXA },
                shading: { fill: "1a1a2e" },
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph("Value 1")] }),
              new TableCell({ children: [new Paragraph("Value 2")] }),
            ],
          }),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }),

      // Page break
      new Paragraph({ children: [new PageBreak()] }),

      // Image
      new Paragraph({
        children: [
          new ImageRun({
            data: fs.readFileSync("image.png"),
            transformation: { width: 400, height: 300 },
            type: "png",
          }),
        ],
      }),
    ],
  }],
  // Numbering definitions
  numbering: {
    config: [{
      reference: "numbered-list",
      levels: [{
        level: 0,
        format: NumberFormat.DECIMAL,
        text: "%1.",
        alignment: AlignmentType.START,
      }],
    }],
  },
});

// Generate file
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync("output.docx", buffer);
```

### Critical docx-js Rules

1. **Page size**: Always in twips (1 inch = 1440 twips, A4 = 11906 x 16838)
2. **Lists**: Require numbering config at document level
3. **Tables**: Every cell MUST have at least one Paragraph child
4. **Images**: Must read file as Buffer, specify dimensions explicitly
5. **Styles**: Use HeadingLevel enum, not raw strings
6. **Sections**: Multiple sections for different page orientations/margins
7. **TOC**: Add `new TableOfContents("TOC", {...})` — will populate on open in Word

## Editing Existing — OOXML Workflow

```bash
# 1. Unpack
mkdir -p /tmp/docx_work
cp document.docx /tmp/docx_work/
cd /tmp/docx_work
unzip document.docx -d unpacked/

# 2. Key files
# unpacked/word/document.xml      — main content
# unpacked/word/styles.xml        — style definitions
# unpacked/word/numbering.xml     — list definitions
# unpacked/word/header1.xml       — header
# unpacked/word/footer1.xml       — footer
# unpacked/word/media/            — images
# unpacked/[Content_Types].xml    — manifest

# 3. Edit XML (use Read + Edit tools)

# 4. Validate
xmllint --noout unpacked/word/document.xml

# 5. Repack
cd unpacked
zip -r ../modified.docx . -x ".*"
```

## Redlining — Tracked Changes

Tracked changes usam namespaces `w:ins` (insertion) e `w:del` (deletion) no XML.

### XML Patterns

```xml
<!-- Inserted text -->
<w:ins w:id="1" w:author="Author Name" w:date="2026-03-26T10:00:00Z">
  <w:r>
    <w:rPr><w:color w:val="FF0000"/></w:rPr>
    <w:t>new inserted text</w:t>
  </w:r>
</w:ins>

<!-- Deleted text -->
<w:del w:id="2" w:author="Author Name" w:date="2026-03-26T10:00:00Z">
  <w:r>
    <w:rPr>
      <w:strike/>
      <w:color w:val="FF0000"/>
    </w:rPr>
    <w:delText>deleted text</w:delText>
  </w:r>
</w:del>

<!-- Format change -->
<w:rPrChange w:id="3" w:author="Author Name" w:date="2026-03-26T10:00:00Z">
  <w:rPr><!-- original formatting --></w:rPr>
</w:rPrChange>
```

### Workflow for Redlining

1. Unpack original DOCX
2. Parse `word/document.xml`
3. For each change: wrap in `w:ins` or `w:del` with author/date
4. Increment `w:id` for each change (must be unique)
5. Validate and repack
6. Open in Word — changes appear in Track Changes panel

## Converting

```bash
# To PDF
libreoffice --headless --convert-to pdf document.docx --outdir /tmp/

# To images (via PDF)
libreoffice --headless --convert-to pdf document.docx --outdir /tmp/
convert -density 200 /tmp/document.pdf /tmp/page_%03d.png

# From markdown
pandoc input.md -o output.docx

# From HTML
pandoc input.html -o output.docx
```

## Regras de Uso

1. Sempre fazer backup antes de editar OOXML
2. Validar XML com xmllint apos cada edicao
3. docx-js para criacao nova, OOXML para edicao de existente
4. Tracked changes exigem IDs unicos e timestamps validos
5. Testar abertura no Word/LibreOffice apos gerar
6. Para docs complexos com TOC, avisar usuario que TOC atualiza ao abrir no Word
