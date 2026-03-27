---
description: "Quando e como usar UX-QAT visual — ag-testar-ux-qualidade/43 vs ag-revisar-ux vs ag-testar-qualidade-qat"
paths:
  - "tests/ux-qat/**"
  - "src/app/**/*.tsx"
  - "src/components/**/*.tsx"
---

# UX-QAT Policy — Visual Quality Acceptance Testing

## Quando usar UX-QAT

| Cenario | Agente | Camadas |
|---------|--------|---------|
| Tela nova criada | ag-criar-cenario-ux-qat (criar cenario) | - |
| Deploy em producao | ag-testar-ux-qualidade (L1+L2+L4) | L1, L2, L4 |
| Review semanal | ag-testar-ux-qualidade (full) | L1, L2, L3, L4 |
| PR com mudancas visuais | ag-testar-ux-qualidade (affected) | L1, L2, L3 |
| Regressao visual reportada | ag-testar-ux-qualidade (tela especifica) | L1, L2, L3, L4 |

## Regras

1. **Toda tela nova** deve ter cenario UX-QAT criado via ag-criar-cenario-ux-qat
2. **L1+L2+L4** rodam em cada deploy (custo zero, programatico)
3. **L3 (AI Judge)** roda semanalmente ou on-demand (~$2-4/run)
4. **Design tokens** sao source of truth — NUNCA avaliar sem eles
5. **Short-circuit** obrigatorio — L1 falha, skip L2-L4
6. **Baselines** so atualizam para cima — regressao nao reseta baseline

## Diferenca de ag-revisar-ux e ag-testar-qualidade-qat

- **ag-revisar-ux**: Review UX pontual (Nielsen heuristics) — rapido, sem PDCA
- **ag-testar-qualidade-qat**: QAT de conteudo/texto — dominio diferente
- **ag-testar-ux-qualidade**: UX-QAT visual com PDCA — avaliacao CONTINUA de qualidade visual

ag-revisar-ux continua valido para reviews rapidos. ag-testar-ux-qualidade substitui ag-revisar-ux para avaliacao sistematica.

## Estrutura no Projeto

```
tests/ux-qat/
├── ux-qat.config.ts        # Config: telas, breakpoints, temas
├── design-tokens.json       # Design tokens do projeto
├── rubrics/                 # Rubrics por tipo de tela
├── scenarios/               # Cenarios por tela
│   └── [screen]/
│       ├── context.md
│       ├── interactions.ts
│       └── journey.spec.ts
├── knowledge/               # Knowledge base
│   ├── baselines.json
│   ├── failure-patterns.json
│   ├── learnings.md
│   ├── golden-screenshots/
│   └── anti-patterns/
└── results/                 # Resultados de runs
    └── YYYY-MM-DD-HHmmss/
```

## NUNCA

- Rodar L3 em CI automatico por PR (custo)
- Avaliar screenshots mockados (UX-QAT avalia telas REAIS)
- Misturar cenarios UX-QAT com QAT (ag-testar-qualidade-qat/41) — dominios diferentes
- Ignorar short-circuit — desperdicio de custo
- Atualizar baseline para baixo — regressao e sinal
