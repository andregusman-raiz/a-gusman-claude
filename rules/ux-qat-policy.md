# UX-QAT Policy — Visual Quality Acceptance Testing

## Quando usar UX-QAT

| Cenario | Agente | Camadas |
|---------|--------|---------|
| Tela nova criada | ag-Q-43 (criar cenario) | - |
| Deploy em producao | ag-Q-42 (L1+L2+L4) | L1, L2, L4 |
| Review semanal | ag-Q-42 (full) | L1, L2, L3, L4 |
| PR com mudancas visuais | ag-Q-42 (affected) | L1, L2, L3 |
| Regressao visual reportada | ag-Q-42 (tela especifica) | L1, L2, L3, L4 |

## Regras

1. **Toda tela nova** deve ter cenario UX-QAT criado via ag-Q-43
2. **L1+L2+L4** rodam em cada deploy (custo zero, programatico)
3. **L3 (AI Judge)** roda semanalmente ou on-demand (~$2-4/run)
4. **Design tokens** sao source of truth — NUNCA avaliar sem eles
5. **Short-circuit** obrigatorio — L1 falha, skip L2-L4
6. **Baselines** so atualizam para cima — regressao nao reseta baseline

## Diferenca de ag-Q-16 e ag-Q-40

- **ag-Q-16**: Review UX pontual (Nielsen heuristics) — rapido, sem PDCA
- **ag-Q-40**: QAT de conteudo/texto — dominio diferente
- **ag-Q-42**: UX-QAT visual com PDCA — avaliacao CONTINUA de qualidade visual

ag-Q-16 continua valido para reviews rapidos. ag-Q-42 substitui ag-Q-16 para avaliacao sistematica.

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
- Misturar cenarios UX-QAT com QAT (ag-Q-40/41) — dominios diferentes
- Ignorar short-circuit — desperdicio de custo
- Atualizar baseline para baixo — regressao e sinal
