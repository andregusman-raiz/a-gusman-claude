---
description: "Design system profissional para geracao de documentos Office (PPTX, DOCX, XLSX)"
paths:
  - "**/*.py"
  - "**/*.pptx"
  - "**/*.docx"
  - "**/*.xlsx"
---

# Office Design System — Padrao Corporativo

## Filosofia
Documentos gerados devem ter qualidade de consultoria (McKinsey/BCG).
"Ruthless clarity" — cada elemento visual CONTRIBUI para a compreensao.

## PPTX — PowerPoint

### Layout Base
- Slide: 13.333" x 7.5" (widescreen 16:9)
- Content area: margem 0.5" em todos os lados
- Footer bar: 0.4" no bottom

### REGRA #1 — CENTRALIZACAO MATEMATICA (INVIOLAVEL)
```python
SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)
left = (SLIDE_W - element_width) / 2  # Centralizar horizontal
top = (SLIDE_H - element_height) / 2  # Centralizar vertical
```
NUNCA estimar visualmente. Conferir: `left + width/2 == SLIDE_W/2`.

### REGRA #2 — PROPORCAO E ESCALA DE FONTES
Fontes NUNCA sao fixas — variam conforme tipo de slide e conteudo.
- Capa: titulo 40-56pt, subtitulo 20-28pt, info 12-16pt
- Conteudo: action title 24-32pt, corpo 16-22pt, tabela 11-16pt
- Auto-sizing: `n_items <= 3 → 22pt | 4 → 20pt | 5 → 18pt | 6 → 16pt | 7+ → 14pt`

### REGRA #3 — DISTRIBUICAO VERTICAL
- MODO A (texto/bullets): flow abaixo do titulo, gap fixo 0.3-0.5"
- MODO B (tabelas/cards/graficos): centralizar na zona de conteudo

### REGRA #4 — ACENTUACAO PT-BR (INVIOLAVEL)
Todo texto em portugues DEVE usar acentuacao correta. UTF-8 nativo.
NUNCA: "Educacao", "gestao", "operacoes"
SEMPRE: "Educação", "gestão", "operações"

### Tecnico python-pptx
- ZERO merge_cells (causa repair)
- ZERO Unicode exotico (bullets via texto: `\u2022  ` + text)
- Fontes EXPLICITAS em todo run: `run.font.name = 'Calibri'`
- Background: `<p:bg>` filho de `<p:cSld>`, NAO `<p:sld>`
- Overflow guard: calcular se texto cabe ANTES de inserir

## DOCX — Word
- Margens: 2.5cm (ABNT) ou 3cm esquerda (formal)
- Estilos nativos SEMPRE: `doc.add_heading()`, `style='List Bullet'`
- Tabelas: header cor primaria + texto branco, linhas alternadas #F5F5F5

## XLSX — Excel
- Headers na linha 2, freeze panes, Coluna A como margem
- Formatacao: `R$ #,##0.00`, `0.0%`, `DD/MM/YYYY`
- Validar: zero #REF!, #NAME?, #VALUE!, #DIV/0!

## Regras Universais
1. Um run por paragrafo
2. Salvar incrementalmente (5 slides / 1 capitulo / 1 aba)
3. Centralizacao matematica sempre
4. Acentuacao PT-BR obrigatoria
