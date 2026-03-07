---
description: "14 regras OOXML criticas para geracao de PPTX com python-pptx"
paths:
  - "**/*.py"
---

# Regras OOXML para PPTX

## REGRA 1 — solidFill ANTES de latin/cs
Ordem OOXML: `solidFill → effectLst → highlight → latin → ea → cs → sym`
Ao criar: SubElement solidFill primeiro, depois latin/cs.
Ao modificar: `rPr.insert(0, sf)` — NUNCA SubElement.

## REGRA 2 — Background dentro de cSld
`<p:bg>` e filho de `<p:cSld>`, NAO de `<p:sld>`. PowerPoint ignora silenciosamente se errado.

## REGRA 3 — Layout-Aware Theming
SEMPRE detectar layout antes de aplicar cores. Mesmo idx pode ser titulo num layout e body em outro.

## REGRA 4 — Contraste Fundo/Fonte
- DARK bg → texto BRANCO + accent GOLD
- LIGHT bg → texto ESCURO + accent GREEN
- NUNCA confiar na cor default do theme

## REGRA 5 — Fonte Explicita em TODOS os Runs
Sempre: `<a:latin typeface='Arial'/>` e `<a:cs typeface='Arial'/>` em todo rPr.

## REGRA 6 — Subtitle Max 9pt + Auto-Shrink
PH subtitle geralmente tem ~0.41" altura. normAutofit obrigatorio.

## REGRA 7 — Overflow Guard
Calcular se texto cabe ANTES de inserir. Reduzir fonte progressivamente (default → min).

## REGRA 8 — Ghost Text Prevention
NUNCA placeholder vazio "". Usar " " (espaco) para prevenir texto-fantasma do master.

## REGRA 9 — Paginacao vs Logo
Verificar posicao do logo antes de posicionar slide number.

## REGRA 10 — Image Placeholder: Esconder, Nao Deletar
Mover off-screen: `shape.left = Emu(-10000000)`. NUNCA `spTree.remove()`.

## REGRA 11 — Slide Reorder via XML
Reordenar via `sldIdLst`. Text transforms ANTES, design DEPOIS.

## REGRA 12 — Fluxo Obrigatorio
Ler → Mapear → Text transforms → Notes → Reorder → Design → Font pass → Salvar → Validar.

## REGRA 13 — Inspecionar Template ANTES de Programar
Escanear layouts e PHs (idx, pos, size) antes de escrever codigo.

## REGRA 14 — NUNCA Perder Conteudo
Extrair TODOS os textos ANTES de limpar shapes. Reconstruir com dados originais.
