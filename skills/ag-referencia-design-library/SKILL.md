---
name: ag-referencia-design-library
description: "Design Library da rAIz Educacao — 24 solucoes curadas, design system oficial, tokens CSS, componentes base. Consultar ANTES de construir qualquer UI. Reference skill carregado on-demand."
context: fork
metadata:
  filePattern: "design-system*,design-library*,*.tsx,*.css"
  bashPattern: "design.library|design.system|tokens|paleta|componente.*ui"
  priority: 80
---

# Design Library — Referencia Obrigatoria para Construcao de Software

> **Regra**: ANTES de especificar ou implementar qualquer feature, consultar esta library.
> Se existe solucao catalogada, USAR como base. Nao reinventar.

## 3 Niveis de Reutilizacao

A library NAO e apenas UI. Contem 3 niveis:

| Nivel | O que e | Quando consultar | O que reutilizar |
|-------|---------|-----------------|-----------------|
| **Componente UI** | Pattern visual (KPI card, tabela, form, app shell) | Fase BUILD do ag-1 | Layout, CSS, props, componente TSX |
| **Modulo de Produto** | Feature completa com tipos, fluxos, estado, API | Fases PRD + SPEC + PLAN do ag-1 | Types, state machine, fluxo de negocio, API contract |
| **Produto Replicavel** | Produto inteiro replicavel como SaaS | ag-6-iniciar ao criar projeto novo | Arquitetura completa, scaffold, integrações |

### Classificacao das 24 Solutions

**Componentes UI** (consultar na fase BUILD):
- `01-dashboard-kpi`, `02-table-filters-export`, `05-app-shell-sidebar`, `08-pageflip-3d`, `10-code-editor`, `22-tv-realtime-counter`

**Modulos de Produto** (consultar na fase PRD + SPEC):
- `03-forms-multistep`, `04-status-workflow-timeline`, `06-workflow-builder`, `07-chat-ai-streaming`, `09-qr-designer`, `11-dragdrop-virtual-scroll`, `12-document-generation`, `13-rag-knowledge-base`, `14-social-media-publisher`, `16-meeting-transcript-ai`, `17-contract-lifecycle`, `19-litigation-case-manager`, `23-skill-assessment-profiler`, `24-contractor-management`

**Produtos Replicaveis** (consultar ao iniciar projeto):
- `15-bi-data-explorer`, `18-content-studio-ai`, `20-data-catalog-governance`, `21-ai-app-builder`

## Localizacao dos Assets

```
~/Claude/assets/
├── UI_UX/raiz-educacao-design-system.md    ← Design System Oficial (tokens, cores, tipografia)
├── design-library/
│   ├── catalog.md                           ← Indice das 24 solucoes
│   ├── solutions/NN-id/spec.md             ← Spec de cada solucao (props, layout, CSS, deps)
│   ├── catalog/src/components/ui/          ← 13 componentes base (shadcn customizados)
│   ├── catalog/src/components/elements/    ← Previews por categoria
│   ├── catalog/src/components/solutions/   ← Componentes de solucao (KPI card, sparkline)
│   ├── tokens/                              ← (planejado) Design tokens exportaveis
│   └── elements/                            ← (planejado) Showcase individual
```

## As 24 Solucoes Catalogadas

| ID | Nome | Categoria | Complexidade |
|----|------|-----------|-------------|
| `dashboard-kpi` | KPI Card com Sparkline | data-display | Baixa |
| `table-filters-export` | Tabela + Filtros + Export | data-display | Alta |
| `forms-multistep` | Form Engine Dinamico | forms | Muito Alta |
| `status-workflow-timeline` | Status + Audit Trail | workflow | Media |
| `app-shell-sidebar` | App Shell Responsivo | layout | Media |
| `workflow-builder` | BPMN Designer | workflow | Muito Alta |
| `chat-ai-streaming` | Chat AI Streaming | ai | Alta |
| `pageflip-3d` | Page-Flip 3D | media | Media |
| `qr-designer` | QR Designer | tools | Media |
| `code-editor` | Code Editor Monaco | extras | Media |
| `dragdrop-virtual-scroll` | Kanban + Virtual Scroll | data-display | Alta |
| `document-generation` | Export PDF/Word/Excel | export | Media |
| `rag-knowledge-base` | RAG Knowledge Base | ai | Alta |
| `social-media-publisher` | Social Media Publisher | tools | Alta |
| `bi-data-explorer` | BI Data Explorer | data-display | Muito Alta |
| `meeting-transcript-ai` | Meeting Transcript AI | ai | Alta |
| `contract-lifecycle` | Contract Lifecycle (CLM) | workflow | Muito Alta |
| `content-studio-ai` | Content Studio AI | ai | Muito Alta |
| `litigation-case-manager` | Litigation Manager | legal | Alta |
| `data-catalog-governance` | Data Catalog + API Factory | tools | Muito Alta |
| `ai-app-builder` | AI App Builder | ai | Muito Alta |
| `tv-realtime-counter` | TV Real-Time Counter | data-display | Baixa |
| `skill-assessment-profiler` | Radar Chart + AI Report | data-display | Alta |
| `contractor-management` | PJ Contractor Management | forms | Alta |

## Como Consultar

### 1. Identificar solucao existente (por necessidade)

| Preciso de... | Solucao | Nivel | Reutilizar |
|---------------|---------|-------|-----------|
| Dashboard com metricas | `01-dashboard-kpi` | UI | Layout, sparkline, CSS |
| Tabela com filtros e export | `02-table-filters-export` | UI | Componente completo |
| Formulario dinamico | `03-forms-multistep` | Modulo | Types, validacao, state machine |
| Timeline de status/auditoria | `04-status-workflow-timeline` | Modulo | Fluxo, audit trail, types |
| Layout com sidebar | `05-app-shell-sidebar` | UI | Shell responsivo completo |
| Workflow visual (BPMN) | `06-workflow-builder` | Modulo | React Flow, node types, fluxo |
| Chat com AI/streaming | `07-chat-ai-streaming` | Modulo | Streaming, tool calls, types |
| Viewer de PDF/flipbook | `08-pageflip-3d` | UI | pdf.js config, page-flip |
| QR code com designer | `09-qr-designer` | Modulo | Designer, UTM, campanhas |
| Code editor | `10-code-editor` | UI | Monaco config, temas |
| Kanban/drag-drop | `11-dragdrop-virtual-scroll` | Modulo | DnD, virtual scroll, state |
| Gerar PDF/DOCX/XLSX | `12-document-generation` | Modulo | Templates, API, pipeline |
| RAG/knowledge base | `13-rag-knowledge-base` | Modulo | Upload, polling, folders, state machine |
| Social media publisher | `14-social-media-publisher` | Modulo | Calendario, agendamento, plataformas |
| BI/data viz | `15-bi-data-explorer` | Produto | Arquitetura completa |
| Meeting transcript + AI | `16-meeting-transcript-ai` | Modulo | Transcricao, sumarizacao, types |
| Gestao de contratos (CLM) | `17-contract-lifecycle` | Modulo | Risk matrix, negociacao, assinatura, types |
| Content studio AI | `18-content-studio-ai` | Produto | Editor, slides, imagens, pipeline |
| Gestao juridica | `19-litigation-case-manager` | Modulo | Caso, timeline, documentos, types |
| Data catalog + API factory | `20-data-catalog-governance` | Produto | Catalogo, governance, API gen |
| AI app builder | `21-ai-app-builder` | Produto | Scaffold, preview, deploy |
| TV contador real-time | `22-tv-realtime-counter` | UI | Display, polling |
| Assessment + radar chart | `23-skill-assessment-profiler` | Modulo | Radar, scoring, AI report |
| Gestao PJ/contractors | `24-contractor-management` | Modulo | Onboarding, pagamento, import CSV |

### 2. Ler spec da solucao

Cada spec contem:
- **What it solves** — problema que resolve
- **Best implementation** — path para codigo de referencia
- **Key features** — capacidades detalhadas
- **Props interface** — TypeScript interface
- **Layout structure** — diagrama ASCII
- **CSS patterns** — padroes de estilo
- **Dependencies** — libs necessarias
- **Usage example** — exemplo de uso

### 3. Aplicar Design System

Ao implementar, SEMPRE usar tokens do design system oficial:

```
~/Claude/assets/UI_UX/raiz-educacao-design-system.md
```

| Token | Valor | Uso |
|-------|-------|-----|
| Raiz Orange | `#F7941D` | CTA, accents, badges |
| Raiz Teal | `#5BB5A2` | Success, secondary |
| Font | IBM Plex Sans | Todo texto |
| Font Mono | IBM Plex Mono | Codigo, metricas |
| Radius | `0.5rem` (8px) | Base para cards, inputs |
| Spacing | Escala 4px | `p-4`, `gap-3`, `mt-6` |

## Regras de Uso

1. **Consultar ANTES de especificar** — se existe solucao, referenciar na SPEC
2. **Adaptar, nao copiar cego** — cada projeto tem contexto, mas a base vem daqui
3. **Manter consistencia** — tokens do design system sao obrigatorios em todos os projetos
4. **Reportar gaps** — se precisa de algo que nao existe, criar nova solution spec
5. **Nao duplicar** — se a solucao existe mas com nome diferente no projeto, alinhar nomenclatura
