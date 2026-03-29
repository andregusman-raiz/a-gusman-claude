# Design Library — Catálogo de Soluções

> 24 soluções curadas dos projetos em produção da rAIz Educação.
> Cada solução tem spec.md com: o que resolve, código de referência, props, layout, e dependências.
>
> **App**: `cd ~/Claude/assets/design-library/catalog && npm run dev -- -p 3011`
> **Como usar com Claude Code**: `pattern: <id>` ao invocar build.

---

## Soluções por Categoria

### Data Display (5)

| # | ID | Nome | Fonte | Complexidade |
|---|-----|------|-------|-------------|
| 01 | `dashboard-kpi` | KPI Card com Sparkline | salarios-platform | Baixa |
| 02 | `table-filters-export` | Tabela + Filtros + Export | salarios + auditoria | Alta |
| 11 | `dragdrop-virtual-scroll` | Kanban + Virtual Scroll | raiz-agent-dashboard | Alta |
| 22 | `tv-realtime-counter` | TV Real-Time Counter | cmef-contador | Baixa |
| 23 | `skill-assessment-profiler` | Radar Chart + AI Report | skillcert-raiz | Alta |

### Forms (2)

| # | ID | Nome | Fonte | Complexidade |
|---|-----|------|-------|-------------|
| 03 | `forms-multistep` | Form Engine Dinâmico | ticket-raiz | Muito Alta |
| 24 | `contractor-management` | PJ Contractor Management | sistema-gestao-pj | Alta |

### Workflow (3)

| # | ID | Nome | Fonte | Complexidade |
|---|-----|------|-------|-------------|
| 04 | `status-workflow-timeline` | Status + Audit Trail | auditoria-raiz | Média |
| 06 | `workflow-builder` | BPMN Designer | ticket-raiz | Muito Alta |
| 17 | `contract-lifecycle` | Contract Lifecycle (CLM) | raiz-platform | Muito Alta |

### Layout (1)

| # | ID | Nome | Fonte | Complexidade |
|---|-----|------|-------|-------------|
| 05 | `app-shell-sidebar` | App Shell Responsivo | sophia-educacional | Média |

### AI (5)

| # | ID | Nome | Fonte | Complexidade |
|---|-----|------|-------|-------------|
| 07 | `chat-ai-streaming` | Chat AI Streaming | automata | Alta |
| 13 | `rag-knowledge-base` | RAG Knowledge Base | raiz-platform | Alta |
| 16 | `meeting-transcript-ai` | Meeting Transcript AI | raiz-platform | Alta |
| 18 | `content-studio-ai` | Content Studio AI | raiz-platform | Muito Alta |
| 21 | `ai-app-builder` | AI App Builder | raiz-platform | Muito Alta |

### Media (1)

| # | ID | Nome | Fonte | Complexidade |
|---|-----|------|-------|-------------|
| 08 | `pageflip-3d` | Page-Flip 3D | fliphtml-raiz | Média |

### Tools (3)

| # | ID | Nome | Fonte | Complexidade |
|---|-----|------|-------|-------------|
| 09 | `qr-designer` | QR Designer | qrcode-facil-replica | Média |
| 14 | `social-media-publisher` | Social Media Publisher | raiz-platform | Alta |
| 20 | `data-catalog-governance` | Data Catalog + API Factory | raiz-platform | Muito Alta |

### Export (1)

| # | ID | Nome | Fonte | Complexidade |
|---|-----|------|-------|-------------|
| 12 | `document-generation` | Export PDF/Word/Excel | raiz-docs | Média |

### Legal (1)

| # | ID | Nome | Fonte | Complexidade |
|---|-----|------|-------|-------------|
| 19 | `litigation-case-manager` | Litigation Manager | raiz-platform | Alta |

### Extras (1)

| # | ID | Nome | Fonte | Complexidade |
|---|-----|------|-------|-------------|
| 10 | `code-editor` | Code Editor Monaco | raiz-platform | Média |
| 15 | `bi-data-explorer` | BI Data Explorer | raiz-platform | Muito Alta |

---

## Specs

```
~/Claude/assets/design-library/solutions/<NN>-<id>/spec.md
```

## Tokens

Página de tokens no app: `/tokens` — paleta, tipografia, spacing, radii, layout.
