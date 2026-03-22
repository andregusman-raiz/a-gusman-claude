# QAT-Benchmark Report — {{RUN_ID}}

## Resumo Executivo

| Metrica | Valor |
|---------|-------|
| Run ID | {{RUN_ID}} |
| Data | {{DATE}} |
| App URL | {{BASE_URL}} |
| Baseline Model | {{BASELINE_MODEL}} |
| Cenarios Total | {{TOTAL}} ({{FIXED}} fixed + {{ROTATABLE}} rotatable) |
| Pass Rate (App) | {{PASS_RATE_APP}}% |
| Pass Rate (Baseline) | {{PASS_RATE_BASELINE}}% |
| Parity Index Overall | {{PARITY_OVERALL}} |
| Jury Mode | {{JURY_MODE}} |
| Judges Used | {{JUDGES_USED}} |
| Custo Estimado | ~${{COST}} |

## Parity por Dimensao

| Dimensao | App | Baseline | Parity | Trend | Status |
|----------|-----|----------|--------|-------|--------|
| D1 Content Accuracy | - | - | - | - | - |
| D2 Teaching Quality | - | - | - | - | - |
| D3 Agentic Capability | - | - | - | - | - |
| D4 Calibration | - | - | - | - | - |
| D5 Safety | - | - | - | - | - |
| D6 Efficiency | - | - | - | - | - |
| D7 Robustness | - | - | - | - | - |
| D8 Response UX | - | - | - | - | - |
| **Overall** | **-** | **-** | **-** | **-** | **-** |

Status: SUPERIOR (>=1.1) | AT_PARITY (0.95-1.1) | MINOR_GAP (0.8-0.95) | MAJOR_GAP (0.6-0.8) | CRITICAL (<0.6)

## Classificacao de Falhas

| Categoria | Count | Cenarios | Severidade |
|-----------|-------|----------|------------|
| INFRA | - | - | - |
| FEATURE | - | - | - |
| QUALITY | - | - | - |
| BUSINESS | - | - | - |
| RUBRIC | - | - | - |
| FLAKY | - | - | - |
| BASELINE | - | - | - |

## Resultados por Cenario

| ID | Nome | App | Baseline | Parity | L1 | L2 | L3 | L4 | Cat | Status |
|----|------|-----|----------|--------|----|----|----|-----|-----|--------|
| BM-01 | - | - | - | - | - | - | - | - | - | - |

## Short-Circuit Savings

- Cenarios short-circuited (L1 fail): {{SHORT_CIRCUIT_COUNT}}
- Economia estimada: ~${{SHORT_CIRCUIT_SAVINGS}} (judge calls evitados)

## Acoes PDCA

- [ ] Baselines atualizados: {{BASELINE_UPDATES}}
- [ ] Novos failure patterns: {{NEW_PATTERNS}}
- [ ] Learnings registrados: {{LEARNINGS_COUNT}}
- [ ] Issues criadas: {{ISSUES_CREATED}}
- [ ] Alertas disparados: {{ALERTS_COUNT}}

## Top 3 Findings

1. **{{FINDING_1}}**
2. **{{FINDING_2}}**
3. **{{FINDING_3}}**

## Recomendacoes

- {{REC_1}}
- {{REC_2}}
- {{REC_3}}
