---
description: "Design composicional para slides nivel consultoria com python-pptx"
paths:
  - "**/*.py"
  - "**/*.pptx"
---

# PPTX Visual Components

## Principio
Placeholder design = amador. Composicional design = consultoria.
NUNCA entregar apresentacao que use APENAS placeholders.
Meta: >= 60% dos slides com pelo menos 1 componente composicional.

## Regras Criticas de Composicao

### RC-1: NUNCA Perder Conteudo
Extrair texto ANTES de limpar. Reconstruir com dados originais COMPLETOS.
Conteudo original e SAGRADO — dados, numeros, protocolos NAO podem ser resumidos.

### RC-2: Titulos NUNCA Truncados
Se nao cabe: reduzir fonte (min 20pt). NUNCA cortar palavras.

### RC-3: Cores Consistentes
Definir UMA constante no inicio: `THEME_DARK = "053A37"`. Usar em TODOS os dividers.

### RC-4: Safe Zones
Se slide TEM titulo: componentes abaixo de `Inches(2.5)`.
Se slide limpo: componentes abaixo de `Inches(1.0)`.

### RC-5: Peso Visual no Split Panel
Lado direito: texto completo (nao resumo), fonte >= 14pt, ocupar >= 50% altura.

### RC-6: Cards em Fundo Escuro
bg_color mais escuro que fundo, title/body color claros (FFFFFF, CCCCCC).

## Componentes Disponíveis

### Atomicos
Badge, Card, Banner, Quote Box, H-Line, V-Bar, Textbox styled, Accent underline

### Compostos
Numbered Item, Section Divider (split), Card Grid 2x2, Column Cards, Footer Bar

## Padroes de Layout
- A: Agenda/Numbered List (badges + textboxes + hlines)
- B: Grid 2x2 com Cards (+ quote bottom)
- C: Section Divider Split Panel (EXTRAIR conteudo antes!)
- D: Paired Cards (Mito vs Realidade)
- E: N-Column Cards
- F: Resolution/Case (card + badge + quote + vbars)
- G: Call to Action (badges + textboxes + hlines + closing quote)

## Anti-Patterns
1. NUNCA clear_slide_shapes() sem extrair conteudo
2. NUNCA truncar titulo
3. NUNCA misturar cores de dividers
4. NUNCA componentes acima de SAFE_Y
5. NUNCA split panel com <3 linhas no lado direito
6. NUNCA slide conteudo so com placeholder
7. NUNCA 8+ bullets sem badge/card/divider
8. NUNCA section header so texto grande em fundo colorido
9. NUNCA cards claro em slide escuro
10. NUNCA todas secoes com mesmo tratamento visual
