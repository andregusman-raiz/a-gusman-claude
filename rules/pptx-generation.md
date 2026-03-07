# PPTX Generation — 13 Regras OOXML

## Regras Inviolaveis (cada uma causou bug real)

### 1. solidFill ANTES de latin/cs
```python
# CORRETO: insert(0, ...) garante posicao correta
rPr.insert(0, solidFill_element)

# ERRADO: SubElement coloca no final — PowerPoint ignora, texto fica PRETO
etree.SubElement(rPr, solidFill)
```

### 2. Background em cSld, NUNCA em sld
Background de slide deve ser inserido no elemento `cSld`, nao no `sld` raiz.

### 3. Fonte explicita em TODOS os runs
Todo run de texto DEVE ter fonte Arial (ou a definida no design system) com `latin` E `cs`.

### 4. Ghost text = " " (espaco), NUNCA string vazia
Placeholders que devem ficar vazios: setar texto como `" "` (um espaco).
String vazia faz o PowerPoint mostrar "Clique para editar...".

### 5. Text ANTES de reorder, design DEPOIS
Ao reconstruir slides composicionais:
1. Inserir todo o texto/conteudo primeiro
2. Aplicar reorder (z-order) depois
3. Aplicar design visual (sombras, gradientes) por ultimo

### 6. extract_slide_texts() ANTES de clear_slide_shapes()
Ao refazer slide existente, SEMPRE extrair texto antes de limpar shapes.

### 7. NUNCA deletar image placeholder
Mover off-screen (x=-10000, y=-10000). Deletar causa erro de reparo.

### 8. Subtitle em placeholder idx=10: max 9pt
Fontes maiores causam sobreposicao com titulo.

### 9. force_font_on_all_runs como final pass
Antes de salvar, iterar TODOS os slides/shapes/paragraphs/runs e garantir fonte explicita.

### 10. NUNCA truncar titulos
Se titulo e longo, reduzir tamanho da fonte (min 14pt). NUNCA cortar o texto.

### 11. Contraste minimo
Texto escuro em fundo escuro = invisivel. Verificar combinacoes.

### 12. Margins e padding consistentes
Cards: margin 12pt. Textboxes: min 0.5" das bordas do slide.

### 13. Diagnostico do template (para PPTX existente)
Antes de editar, mapear TODOS os layouts e placeholders.

## Library de Componentes

Usar `~/.claude/lib/pptx_components.py`:
```python
import sys, os
sys.path.insert(0, os.path.expanduser('~/.claude/lib'))
from pptx_components import (
    add_badge, add_card, add_banner, add_quote_box,
    add_hline, add_vbar, add_textbox_styled, add_accent_underline,
    add_numbered_item, add_section_divider, add_section_divider_rich,
    add_card_grid_2x2, add_column_cards, add_footer_bar,
    add_table_styled, add_two_column_compare, add_timeline,
    extract_slide_texts, clear_slide_shapes,
    validate_variety, check_overlap, check_accents
)
```
