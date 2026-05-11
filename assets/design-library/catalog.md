# Design Library — Catálogo

> **Duas camadas**:
> - **solutions/** (24) — módulos verticais extraídos de projetos em produção (dashboards, workflow, RAG, CLM)
> - **elements/** (14 categorias, 86 variantes, **código shadcn implementado**) — camada de apresentação (auth, hero, pricing, nav, CTA, footer, FAQ, onboarding, states) — taxonomia base VibeUI
>
> Cada solução tem `spec.md` com: o que resolve, código de referência, props, layout, dependências.
>
> **App**: `cd ~/Claude/assets/design-library/catalog && npm run dev -- -p 3011`
> **Como usar com Claude Code**: `pattern: <id>` ao invocar build.
> **Skills**: `/ag-11-ux-ui` (builder) + `/ag-referencia-design-presentation` (taxonomia 92 layouts)
>
> **Regra de roteamento**:
> - Módulo vertical / feature interna → `solutions/`
> - Camada de apresentação (landing, auth, onboarding, states) → `elements/`

---

## Soluções por Categoria

### Data Display (5)

| # | ID | Nome | Fonte | Complexidade |
|---|-----|------|-------|-------------|
| 01 | `dashboard-kpi` | KPI Card com Sparkline | payroll-app | Baixa |
| 02 | `table-filters-export` | Tabela + Filtros + Export | salarios + auditoria | Alta |
| 11 | `dragdrop-virtual-scroll` | Kanban + Virtual Scroll | agent-dashboard | Alta |
| 22 | `tv-realtime-counter` | TV Real-Time Counter | cmef-contador | Baixa |
| 23 | `skill-assessment-profiler` | Radar Chart + AI Report | skillcert-raiz | Alta |

### Forms (2)

| # | ID | Nome | Fonte | Complexidade |
|---|-----|------|-------|-------------|
| 03 | `forms-multistep` | Form Engine Dinâmico | ticket-app | Muito Alta |
| 24 | `contractor-management` | PJ Contractor Management | sistema-gestao-pj | Alta |

### Workflow (3)

| # | ID | Nome | Fonte | Complexidade |
|---|-----|------|-------|-------------|
| 04 | `status-workflow-timeline` | Status + Audit Trail | auditoria-raiz | Média |
| 06 | `workflow-builder` | BPMN Designer | ticket-app | Muito Alta |
| 17 | `contract-lifecycle` | Contract Lifecycle (CLM) | example-platform | Muito Alta |

### Layout (1)

| # | ID | Nome | Fonte | Complexidade |
|---|-----|------|-------|-------------|
| 05 | `app-shell-sidebar` | App Shell Responsivo | edu-portal | Média |

### AI (5)

| # | ID | Nome | Fonte | Complexidade |
|---|-----|------|-------|-------------|
| 07 | `chat-ai-streaming` | Chat AI Streaming | example-automata | Alta |
| 13 | `rag-knowledge-base` | RAG Knowledge Base | example-platform | Alta |
| 16 | `meeting-transcript-ai` | Meeting Transcript AI | example-platform | Alta |
| 18 | `content-studio-ai` | Content Studio AI | example-platform | Muito Alta |
| 21 | `ai-app-builder` | AI App Builder | example-platform | Muito Alta |

### Media (1)

| # | ID | Nome | Fonte | Complexidade |
|---|-----|------|-------|-------------|
| 08 | `pageflip-3d` | Page-Flip 3D | fliphtml-raiz | Média |

### Tools (3)

| # | ID | Nome | Fonte | Complexidade |
|---|-----|------|-------|-------------|
| 09 | `qr-designer` | QR Designer | qrcode-facil-replica | Média |
| 14 | `social-media-publisher` | Social Media Publisher | example-platform | Alta |
| 20 | `data-catalog-governance` | Data Catalog + API Factory | example-platform | Muito Alta |

### Export (1)

| # | ID | Nome | Fonte | Complexidade |
|---|-----|------|-------|-------------|
| 12 | `document-generation` | Export PDF/Word/Excel | docs-app | Média |

### Legal (1)

| # | ID | Nome | Fonte | Complexidade |
|---|-----|------|-------|-------------|
| 19 | `litigation-case-manager` | Litigation Manager | example-platform | Alta |

### Extras (1)

| # | ID | Nome | Fonte | Complexidade |
|---|-----|------|-------|-------------|
| 10 | `code-editor` | Code Editor Monaco | example-platform | Média |
| 15 | `bi-data-explorer` | BI Data Explorer | example-platform | Muito Alta |

---

## Specs

```
~/Claude/assets/design-library/solutions/<NN>-<id>/spec.md
```

## Tokens

Página de tokens no app: `/tokens` — paleta, tipografia, spacing, radii, layout.
