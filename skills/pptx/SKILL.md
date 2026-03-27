---
name: pptx
description: "Criar, editar e analisar apresentacoes PowerPoint (.pptx). Trigger quando usuario quer criar slides, pitch deck, editar apresentacao existente, extrair conteudo de .pptx."
model: sonnet
argument-hint: "[create|edit|analyze|template] [path ou descricao]"
metadata:
  filePattern: "*.pptx,*.ppt"
  bashPattern: "pptx|powerpoint|slides|apresentacao|presentation|deck"
  priority: 80
---

# PPTX Skill

Criar, editar e analisar apresentacoes PowerPoint. Usa OOXML manipulation direto.

## Quick Reference

| Task | Best Tool | Notes |
|------|-----------|-------|
| Extract text | markitdown | `pip install markitdown` |
| Create from scratch | html2pptx workflow | HTML -> LibreOffice -> PPTX |
| Edit existing | OOXML unpack/edit/pack | Manipulacao XML direta |
| Template-based | OOXML inventory + replace | Reusar layout existente |
| Convert to PDF | LibreOffice | `libreoffice --headless --convert-to pdf` |
| Thumbnails/QA | LibreOffice + ImageMagick | Grid visual para revisao |

## Reading Content

### markitdown (text extraction)
```bash
pip install markitdown
```
```python
from markitdown import MarkItDown
md = MarkItDown()
result = md.convert("presentation.pptx")
print(result.text_content)
```

### Direct XML inspection
```bash
# PPTX is a ZIP file
unzip -l presentation.pptx
unzip -p presentation.pptx ppt/slides/slide1.xml | xmllint --format -
```

## Creating from Scratch — html2pptx Workflow

O metodo mais confiavel para criar PPTX do zero:

1. **Gerar HTML** com slides como sections
2. **Converter HTML -> PPTX** via LibreOffice
3. **Refinar** via OOXML editing se necessario

```bash
# 1. Create HTML file with slide content
cat > /tmp/slides.html << 'HTMLEOF'
<!DOCTYPE html>
<html>
<head><style>
  .slide { page-break-after: always; padding: 40px; font-family: Arial; }
  h1 { color: #1a1a2e; font-size: 36px; }
  h2 { color: #16213e; font-size: 28px; }
  ul { font-size: 20px; line-height: 1.8; }
  .subtitle { color: #666; font-size: 18px; }
</style></head>
<body>
  <div class="slide">
    <h1>Title Slide</h1>
    <p class="subtitle">Subtitle here</p>
  </div>
  <div class="slide">
    <h2>Content Slide</h2>
    <ul>
      <li>Point one</li>
      <li>Point two</li>
      <li>Point three</li>
    </ul>
  </div>
</body>
</html>
HTMLEOF

# 2. Convert to PPTX
libreoffice --headless --convert-to pptx /tmp/slides.html --outdir /tmp/

# 3. Verify
ls -la /tmp/slides.pptx
```

## Editing Existing — OOXML Workflow

PPTX e um ZIP com XMLs internos. Workflow: unpack -> edit XML -> validate -> repack.

```bash
# 1. Unpack
mkdir -p /tmp/pptx_work
cp presentation.pptx /tmp/pptx_work/
cd /tmp/pptx_work
unzip presentation.pptx -d unpacked/

# 2. Explore structure
find unpacked/ -name "*.xml" | head -20
# Key files:
# unpacked/ppt/slides/slide1.xml     — slide content
# unpacked/ppt/slideMasters/         — master layouts
# unpacked/ppt/slideLayouts/         — layout templates
# unpacked/ppt/theme/theme1.xml      — colors/fonts
# unpacked/[Content_Types].xml       — manifest

# 3. Edit slide XML (example: change title text)
# Use Read tool to inspect XML, then Edit tool for changes

# 4. Validate XML
xmllint --noout unpacked/ppt/slides/slide1.xml

# 5. Repack
cd unpacked
zip -r ../modified.pptx . -x ".*"
cd ..
```

### Common XML Edits

```xml
<!-- Change text in a text box -->
<a:t>New text here</a:t>

<!-- Change font color -->
<a:solidFill>
  <a:srgbClr val="1A1A2E"/>
</a:solidFill>

<!-- Change font size (in hundredths of a point) -->
<a:rPr sz="2400"/> <!-- 24pt -->
```

## Template Workflow (7 Steps)

1. **Thumbnail**: Generate slide thumbnails for visual inventory
2. **Inventory**: Map all slides, layouts, placeholders
3. **Plan**: Decide which slides to keep, reorder, modify
4. **Extract**: Unpack OOXML
5. **Modify**: Edit XML for text, images, colors
6. **Validate**: xmllint on all modified XMLs
7. **Pack & QA**: Rezip, generate thumbnails, visual compare

```bash
# Generate thumbnails for QA
libreoffice --headless --convert-to pdf presentation.pptx --outdir /tmp/
# Then use pdf2image or ImageMagick
convert -density 150 /tmp/presentation.pdf /tmp/slide_%03d.png

# Create thumbnail grid
montage /tmp/slide_*.png -geometry 300x225+5+5 -tile 4x /tmp/thumbnail_grid.png
```

## Design Principles

### Color Palettes (safe for presentations)

| Palette | Primary | Secondary | Accent | Text |
|---------|---------|-----------|--------|------|
| Corporate Blue | #1a1a2e | #16213e | #0f3460 | #e94560 |
| Modern Dark | #222831 | #393e46 | #00adb5 | #eeeeee |
| Clean Light | #f8f9fa | #e9ecef | #4361ee | #212529 |
| Nature Green | #2d6a4f | #40916c | #52b788 | #1b4332 |
| Warm Orange | #f4845f | #f7b267 | #f25c54 | #2d3436 |

### Typography Rules
- **Title**: 36-44pt, bold, primary color
- **Subtitle**: 20-24pt, regular, secondary color
- **Body**: 18-22pt, regular, text color
- **Caption**: 14-16pt, italic, muted color
- Max 6 lines per slide, max 6 words per line (6x6 rule)
- Sans-serif preferido (Arial, Calibri, Helvetica)

### Layout Tips
- Margins: minimo 1cm em todos os lados
- Alinhamento consistente entre slides
- Max 1 imagem hero por slide
- Graficos: simplificar ao maximo, legend sempre visivel
- Contraste minimo 4.5:1 texto/fundo

## QA — Visual Validation

```bash
# 1. Convert to images
libreoffice --headless --convert-to pdf output.pptx --outdir /tmp/
convert -density 150 /tmp/output.pdf /tmp/qa_slide_%03d.png

# 2. Create grid
montage /tmp/qa_slide_*.png -geometry 400x300+10+10 -tile 3x -background white /tmp/qa_grid.png

# 3. Visual inspection via Read tool (reads images)
# Read /tmp/qa_grid.png to visually verify all slides
```

## Convert to PDF

```bash
libreoffice --headless --convert-to pdf presentation.pptx --outdir /tmp/
```

## Regras de Uso

1. Sempre fazer backup do PPTX original antes de editar
2. Validar XML com xmllint apos cada edicao
3. Gerar thumbnails para QA visual antes de entregar
4. Respeitar a regra 6x6 (max 6 linhas, 6 palavras por linha)
5. Manter consistencia de cores/fontes entre slides
6. Testar abertura no PowerPoint/LibreOffice apos repack
