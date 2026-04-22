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

## REGRAS OBRIGATORIAS Anti-Overflow (R1-R8)

> Incidente 2026-04-21 (Organograma/FP&A/AI-first rAIz): textos ultrapassaram caixas em cards
> de grid 2x2 porque `python-pptx` nao mede largura renderizada — `word_wrap=True` apenas quebra
> palavras, mas nao valida se a altura da caixa comporta o numero de linhas resultante.
>
> **Essas regras sao obrigatorias em TODO PPTX gerado via python-pptx.**

### R1 — Texto SEMPRE via helper medido
Toda chamada a `add_textbox` em python-pptx DEVE passar por `add_text_safe()` ou
`add_paragraphs_safe()` em `skills/pptx/templates/pptx_utils.py`. O helper mede
via Pillow + fonte do sistema, faz word-wrap real e auto-encolhe o tamanho ate caber.

### R2 — Fundo claro como padrao
Default `LIGHT_THEME` (fundo off-white, texto near-black). Dark mode apenas quando
explicitamente solicitado. Paleta Raiz oficial usa laranja `#F7941D` + teal `#5BB5A2`
como accents sobre fundo claro — nunca como fundo de card inteiro (ilegibilidade).

### R3 — Fontes com arquivo fisico
Usar `Helvetica` ou `Arial` como `font_name` quando for medir via Pillow. Fontes
web-only (IBM Plex Sans sem TTF instalado) quebram a medicao. O helper usa fallback
para Helvetica.ttc do macOS automaticamente, mas o `font_name` passado ao pptx
deve corresponder ao que sera renderizado.

### R4 — Larguras baseadas em Emu, com padding explicito
- Cards de grid: calcular `(SW - 2*margin - gap) / N` em Emu, nunca hardcode
- Padding interno minimo: `2pt` em cada lado (margin_left/right/top/bottom do TextFrame)
- Altura do card: reservar minimo `lines * size * 1.3` em pt para o texto + padding

### R5 — Metric blocks sao caso especial
Numeros grandes (`metric`, ex: "400+", "~15", "262k") DEVEM ter caixa dedicada com
`fit_text_size(max=32, min=20)`. Nao compartilhar caixa com label — label em caixa
separada ao lado com `size=9-10, bold, color=muted`.

### R6 — Bullet text: 1 linha preferencial, max 2
Cada bullet deve caber em 1 linha a 9pt numa caixa de 2.8in de largura. Se o texto
natural passa → **encurtar o conteudo** em vez de reduzir fonte. Guardrail de
comprimento: max 12 palavras / 75 caracteres por bullet.

### R7 — Verificacao obrigatoria pos-geracao
Apos `prs.save(path)`, rodar `verify_deck(path)` do helper. Ele converte via LibreOffice
para PDF — se falha, o PPTX provavelmente tem problema de layout.
Para QA visual completo: `render_deck_to_pngs(path)` + inspecao das PNGs via Read tool.

### R8 — Usar `DeckBuilder` para decks profissionais
Quando disponivel, preferir `skills/pptx/templates/deck_builder.py` que ja aplica R1-R7.
Para casos simples de 1-2 slides, uso direto de `add_text_safe()` e suficiente.

### Caminho preferido (template-first)

```python
import sys
sys.path.insert(0, "/Users/andregusmandeoliveira/Claude/.claude/skills/pptx/templates")

from pptx_utils import (
    LIGHT_THEME, add_text_safe, add_paragraphs_safe,
    fit_text_size, verify_deck, render_deck_to_pngs,
)

T = LIGHT_THEME
# ... criar Presentation, slide ...

# toda caixa de texto passa pelo helper — auto-shrink se nao couber
add_text_safe(slide, Inches(0.5), Inches(1.2), Inches(12.3), Inches(1.0),
              "Action title do slide",
              size=18, bold=True, color=T["text"], font_name="Helvetica",
              warn_cb=lambda m: print("warn:", m))

# salvar + verify automatico
prs.save(OUT)
ok, warnings = verify_deck(OUT)
pngs, _ = render_deck_to_pngs(OUT)   # QA visual
```

### Guardrails de conteudo (complementa R6)

| Elemento | Max chars | Max palavras |
|----------|-----------|--------------|
| Eyebrow / Section label | 40 | 6 |
| Action title (1-2 linhas) | 180 | 28 |
| Subtitle / deck | 130 | 20 |
| Bullet de card | 75 | 12 |
| Metric label | 45 | 7 |
| Stack/footer de card | 90 | 14 |
| Takeaway bar | 200 | 30 |

Se o conteudo natural excede → reescrever, nunca reduzir font-size abaixo de 8pt.
