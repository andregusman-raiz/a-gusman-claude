---
name: ag-avaliar-ux-design-library
description: "Avalia qualidade UX de um projeto comparando screenshots reais contra a Design Library (24 solucoes + design system). Captura telas via Playwright, pontua aderencia a tokens/patterns, identifica desvios. Produz UX Compliance Report."
model: sonnet
context: fork
argument-hint: "[URL ou path] [--scope rotas] [--threshold N]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
metadata:
  filePattern: "ux-compliance-*.md,design-compliance*"
  bashPattern: "avaliar.*ux|compliance.*design|design.*library.*review"
  priority: 85
disable-model-invocation: true
---

# ag-avaliar-ux-design-library — Avaliacao UX contra Design Library

## Papel

Avalia a qualidade visual/UX de um projeto comparando o que foi implementado contra o padrao da empresa (Design Library + Design System). Captura screenshots reais, compara contra as solution specs, e produz um UX Compliance Report com score e acoes.

**Diferenca de outros skills:**
- `ag-revisar-ux`: Review pontual com heuristicas de Nielsen (generico)
- `ag-testar-ux-qualidade`: UX-QAT PDCA com design tokens (testes continuos)
- `ag-meridian D4-LOOKS`: Score visual generico (4 viewports)
- **Este skill**: Compara contra a PROPRIA Design Library da empresa (padrao interno)

## Invocacao

```
/ag-avaliar-ux-design-library http://localhost:3000
/ag-avaliar-ux-design-library http://localhost:3005 --scope "/dashboard,/consultas"
/ag-avaliar-ux-design-library ~/Claude/GitHub/salarios-platform --threshold 80
```

## Pre-requisitos

1. Playwright MCP disponivel (para screenshots)
2. App rodando (localhost ou URL deployada)
3. Design Library acessivel em `~/Claude/assets/design-library/`
4. Design System em `~/Claude/assets/UI_UX/raiz-educacao-design-system.md`

## Pipeline (5 fases)

```
DISCOVER → CAPTURE → MATCH → EVALUATE → REPORT
```

### Fase 1: DISCOVER — Mapear telas do projeto

1. Navegar para URL da app via Playwright MCP
2. Capturar snapshot de acessibilidade (browser_snapshot)
3. Identificar rotas/paginas disponiveis na navegacao
4. Se `--scope` especificado, filtrar rotas
5. Classificar cada tela por tipo: dashboard, form, table, chat, workflow, layout, etc.

### Fase 2: CAPTURE — Screenshots de cada tela

Para cada tela identificada:

1. Navegar via `browser_navigate`
2. Aguardar carregamento completo (`browser_wait_for`)
3. Capturar screenshot full-page:
   ```
   browser_take_screenshot({ type: "png", filename: "ux-compliance/{slug}-desktop.png", fullPage: true })
   ```
4. Capturar em mobile (375px):
   ```
   browser_resize({ width: 375, height: 812 })
   browser_take_screenshot({ type: "png", filename: "ux-compliance/{slug}-mobile.png" })
   browser_resize({ width: 1440, height: 900 })  # restaurar
   ```
5. Capturar snapshot de acessibilidade (para analise estrutural)
6. Capturar console errors (`browser_console_messages`)

### Fase 3: MATCH — Associar telas a solucoes da Design Library

Para cada tela capturada:

1. Ler `~/Claude/assets/design-library/catalog.md`
2. Identificar qual(is) solution(s) a tela DEVERIA seguir:

| Tipo de tela detectado | Solution esperada |
|----------------------|-------------------|
| Dashboard com KPIs | `01-dashboard-kpi` |
| Tabela com dados | `02-table-filters-export` |
| Formulario multi-step | `03-forms-multistep` |
| Timeline/historico | `04-status-workflow-timeline` |
| Layout principal | `05-app-shell-sidebar` |
| Workflow visual | `06-workflow-builder` |
| Chat/AI | `07-chat-ai-streaming` |
| Viewer PDF | `08-pageflip-3d` |
| Kanban/board | `11-dragdrop-virtual-scroll` |
| Export/docs | `12-document-generation` |
| RAG/busca | `13-rag-knowledge-base` |
| Graficos/BI | `15-bi-data-explorer` |
| Contratos | `17-contract-lifecycle` |

3. Ler a spec da solution matched: `~/Claude/assets/design-library/solutions/NN-id/spec.md`
4. Se NENHUMA solution matched → marcar como "sem padrao" (gap na library)

### Fase 4: EVALUATE — Pontuar aderencia

Para cada tela, avaliar 6 dimensoes (0-10 cada):

#### D1: Token Compliance (cores, fonts, spacing)
Ler `~/Claude/assets/UI_UX/raiz-educacao-design-system.md` e verificar no screenshot + snapshot:
- [ ] Cores da marca (Orange #F7941D, Teal #5BB5A2) presentes?
- [ ] IBM Plex Sans como font principal?
- [ ] Spacing consistente com escala 4px?
- [ ] Border radius padrao (8px)?
- [ ] Dark mode funcional (se aplicavel)?

#### D2: Solution Adherence (comparacao com spec)
Se solution matched:
- [ ] Layout segue o diagrama ASCII da spec?
- [ ] Props obrigatorias implementadas?
- [ ] Features-chave presentes (ex: sparkline no KPI, filtros na tabela)?
- [ ] CSS patterns alinhados com a spec?

#### D3: Component Quality (componentes base)
- [ ] Usa shadcn/ui ou componentes do catalog? (vs HTML raw)
- [ ] Botoes com estados (hover, disabled, loading)?
- [ ] Inputs com labels e validacao visual?
- [ ] Cards com estrutura consistente?
- [ ] Icones do mesmo set (Lucide)?

#### D4: Responsividade
- [ ] Desktop (1440px) legivel e alinhado?
- [ ] Mobile (375px) funcional sem scroll horizontal?
- [ ] Elementos nao sobrepostos?
- [ ] Touch targets >= 44px em mobile?

#### D5: Acessibilidade Visual
- [ ] Contraste suficiente (WCAG AA 4.5:1)?
- [ ] Focus states visiveis?
- [ ] Nao depende apenas de cor para transmitir info?
- [ ] Alt text em imagens (via snapshot)?

#### D6: Consistencia Cross-Tela
- [ ] Mesma sidebar/nav em todas as paginas?
- [ ] Mesma paleta de cores (sem cores random)?
- [ ] Mesma tipografia (sem fonts diferentes)?
- [ ] Espacamentos uniformes entre paginas?

### Score UXC (UX Compliance)

```
UXC = D1*0.20 + D2*0.25 + D3*0.20 + D4*0.15 + D5*0.10 + D6*0.10
```

| UXC | Status | Significado |
|-----|--------|-------------|
| 90-100 | Excelente | Totalmente alinhado com Design Library |
| 80-89 | Bom | Pequenos desvios, aceitavel (threshold default) |
| 65-79 | Regular | Desvios significativos, precisa ajustes |
| 50-64 | Fraco | Implementacao diverge bastante do padrao |
| < 50 | Critico | Nao segue o padrao da empresa |

### Fase 5: REPORT — Gerar relatorio

Salvar em `docs/ux-compliance-{date}.md`:

```markdown
# UX Compliance Report — {Projeto}

**Data**: YYYY-MM-DD
**URL**: {url}
**Telas avaliadas**: N
**UXC Score**: XX/100

## Resumo por Tela

| Tela | Solution Ref | D1 | D2 | D3 | D4 | D5 | D6 | Score | Status |
|------|-------------|----|----|----|----|----|----|-------|--------|
| /dashboard | dashboard-kpi | 8 | 7 | 9 | 8 | 7 | 9 | 79 | Regular |
| /usuarios | table-filters | 9 | 8 | 8 | 7 | 8 | 9 | 82 | Bom |

## Desvios Criticos (P0)

- [screenshot] Tela X usa cor #FF0000 em vez de #F7941D (token violation)
- [screenshot] Form sem labels (a11y violation)

## Desvios Importantes (P1)

- Tela Y nao usa KPI card padrao (reinventou componente)
- Spacing inconsistente no header (12px vs 16px padrao)

## Gaps na Design Library

- Tela Z nao tem solution equivalente → sugerir criacao de solution spec #25

## Screenshots

- `ux-compliance/dashboard-desktop.png`
- `ux-compliance/dashboard-mobile.png`
- ...

## Acoes Recomendadas

1. [P0] Corrigir cores para tokens do design system
2. [P1] Substituir KPI custom por `dashboard-kpi` solution
3. [P2] Adicionar nova solution spec para tela Z
```

## Integracoes

### Com ag-1-construir
Pode ser chamado na fase REVIEW para verificar compliance antes de SHIP:
```
REVIEW = ag-revisar-codigo + ag-avaliar-ux-design-library (se UI)
```

### Com ag-7-qualidade (MERIDIAN)
Complementa D4-LOOKS com verificacao contra padrao interno:
- MERIDIAN D4: "a tela parece boa?" (generico)
- Este skill: "a tela segue NOSSO padrao?" (especifico)

### Com ag-2-corrigir
Desvios P0/P1 podem ser passados como input para correcao automatica:
```
/ag-2-corrigir lista: [desvios do UX Compliance Report]
```

## Regras

1. SEMPRE capturar screenshots REAIS — nunca avaliar sem evidencia visual
2. SEMPRE comparar contra a Design Library — nao usar padrao generico
3. Se solution nao existe → e um GAP na library, nao um erro do projeto
4. Score e relativo ao padrao interno — 100 = perfeitamente alinhado, nao "bonito"
5. Mobile e obrigatorio — se nao cabe em 375px, e desvio
6. Report com screenshots como evidencia — desvio sem screenshot nao conta
