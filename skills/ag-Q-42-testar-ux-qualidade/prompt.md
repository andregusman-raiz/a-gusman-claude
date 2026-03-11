# UX-QAT PDCA Orchestrator — Execution Prompt

## Ciclo PDCA Completo

Voce esta executando o ciclo PDCA de UX Quality Acceptance Testing.

### PLAN
1. Verificar estrutura `tests/ux-qat/` (config, design-tokens, rubrics, knowledge)
2. Verificar URL acessivel e ferramentas disponiveis (playwright-cli, axe-core)
3. Carregar knowledge base (baselines, failure-patterns, learnings)
4. Carregar design tokens do projeto
5. Planejar capture points (telas × breakpoints × temas)
6. Criar diretorio de run

### DO
Para cada capture point:
1. **L1 Renderizacao**: Navegar, verificar carregamento, sem overflow, sem JS errors
2. **L2 Interacao**: Testar hover/focus/click, touch targets, animacoes
3. **L3 Percepcao** (se layers inclui L3): Capturar screenshot, enviar ao Judge com rubric + design tokens
4. **L4 Compliance**: Rodar axe-core (WCAG) + Lighthouse (perf/a11y/bp)

Short-circuit: L1 falha → skip L2-L4. L2 critico falha → skip L3-L4.

### CHECK
1. Classificar falhas: RENDER | INTERACTION | PERCEPTION | COMPLIANCE | RUBRIC | FLAKY
2. Comparar com baselines (delta > -1.0 = regressao)
3. Match com failure patterns conhecidos
4. Detectar flaky (variancia > 1.0 em 5+ runs)

### ACT
1. Atualizar baselines (so para cima, nunca para baixo)
2. Registrar novos failure patterns
3. Adicionar learnings
4. Gerar summary.json + report.md
5. Imprimir resumo ao usuario

## Design Tokens

Design tokens sao a SOURCE OF TRUTH para avaliacao visual. O Judge compara screenshots contra tokens, nao contra preferencia pessoal.

Tokens cobrem: cores, tipografia, espacamento, bordas, sombras, breakpoints, transicoes.

## Rubrics

Cada tipo de tela tem rubric com criterios especificos:
- **dashboard**: hierarquia-informacao, densidade-dados, consistencia-visual, responsividade, interatividade, feedback-estado
- **form-flow**: clareza-labels, validacao-visual, fluxo-progressao, acessibilidade-input, feedback-submissao, responsividade
- **landing-page**: hero-impact, hierarquia-visual, tipografia, imagery-media, cta-conversao, performance-percebida
- **navigation**: wayfinding, consistencia, responsividade, acessibilidade, feedback-estado
- **data-table**: legibilidade, funcionalidade, responsividade, densidade, acoes
- **auth-flow**: clareza, seguranca-percebida, error-recovery, oauth-sso, acessibilidade
- **empty-error-states**: comunicacao, acao-seguinte, consistencia, ilustracao, responsividade

Plus 8 universal penalties aplicadas a TODAS as rubricas.

## Penalties Universais

| Penalty | Deducao | Condicao |
|---------|---------|----------|
| overflow-horizontal | -3 | Scroll horizontal em 375px |
| texto-ilegivel | -2 | Contraste < 3:1 |
| touch-target-pequeno | -2 | Area < 44x44px |
| z-index-war | -2 | Sobreposicao incorreta |
| font-flash | -1 | FOUT/FOIT > 1s |
| layout-shift | -1 | CLS > 0.1 |
| inconsistencia-cor | -1 | Cor fora do palette |
| orphan-element | -1 | Elemento desconectado |
