# UX-QAT Methodology — Visual Quality Acceptance Testing

> Framework de 4 camadas com ciclo PDCA para avaliacao continua de qualidade UX/UI.

## Problema

Tres capacidades UX isoladas:
- **ui-ux-pro-max**: Cria designs — mas nao avalia
- **ag-16**: Avalia UX pontualmente — mas nao e continuo nem automatizado
- **QAT (ag-40/41)**: Avalia qualidade de conteudo — mas ignora dimensao visual

**Gap**: Ninguem avalia qualidade visual/interacao de forma continua, automatizada, com ciclo de melhoria.

## Solucao

**UX-QAT**: 4 camadas de avaliacao + PDCA continuo.

### Principios

1. **Multi-sistema**: Configuravel para qualquer plataforma (SaaS, E-commerce, LMS, etc.)
2. **Design Tokens como Source of Truth**: Resiliente a mudancas visuais (vs golden screenshots frageis)
3. **AI-as-Judge Visual**: LLM multimodal avalia screenshots contra design system
4. **Short-circuit**: L1 falha → skip L2-L4 (economia de custo)
5. **PDCA continuo**: Nao e medicao passiva — e melhoria ativa

### 4 Camadas

| Camada | O que avalia | Como | Custo |
|--------|-------------|------|-------|
| L1 Renderizacao | Pagina carrega, sem overflow, sem JS errors | Playwright CLI | $0 |
| L2 Interacao | Hover/focus/click respondem, touch targets OK | Playwright CLI | $0 |
| L3 Percepcao Visual | Qualidade visual contra design tokens e rubric | AI Judge multimodal | ~$0.05-0.10/screenshot |
| L4 Compliance | WCAG AA, Lighthouse scores | axe-core + Lighthouse | $0 |

### Short-circuit

```
L1 FAIL → SKIP L2, L3, L4 (economia ~75%)
L2 CRITICAL FAIL → SKIP L3, L4 (economia ~50%)
L3 FAIL → continua L4 (compliance independente)
```

### Tiered Execution

| Trigger | Camadas | Custo |
|---------|---------|-------|
| Cada deploy | L1 + L2 + L4 | ~$0.00 |
| Semanal / on-demand | L1 + L2 + L3 + L4 | ~$2-4 |
| PR com mudancas visuais | L1 + L2 + L3 (affected) | ~$0.50-1.00 |

## Agentes

- **ag-42**: PDCA Orchestrator — executa ciclo completo
- **ag-43**: Scenario Designer — cria cenarios para telas

## Estrutura no Projeto

```
tests/ux-qat/
├── ux-qat.config.ts        # Config
├── design-tokens.json       # Design tokens
├── rubrics/                 # Rubrics por tipo
├── scenarios/[screen]/      # Cenarios por tela
├── knowledge/               # KB (baselines, patterns, learnings)
└── results/                 # Resultados de runs
```

## Referencia

- SPEC: `~/Claude/docs/specs/SPEC-UX-QAT.md`
- Templates: `~/.claude/shared/templates/ux-qat/`
- Agents: `~/.claude/agents/ag-Q-42-*.md`, `ag-Q-43-*.md`
