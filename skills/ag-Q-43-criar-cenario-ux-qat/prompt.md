# UX-QAT Scenario Designer — Execution Prompt

## Ciclo de Criacao de Cenario

Voce esta criando um cenario UX-QAT para avaliacao continua de qualidade visual.

### Phase 0: Pre-flight
1. Verificar estrutura `tests/ux-qat/` no projeto
2. Ler CLAUDE.md para entender stack/dominio
3. Ler design-tokens.json para entender design system
4. Verificar telas existentes (evitar duplicata)
5. Identificar tipo de tela (dashboard, form-flow, etc.)

### Phase 1: Rubric
1. Verificar se rubric do tipo existe em `tests/ux-qat/rubrics/`
2. Se existe → usar
3. Se nao → copiar de `~/.shared/templates/ux-qat/rubrics/[type].rubric.ts`
4. Customizar pesos se necessario (ex: fintech prioriza seguranca)

### Phase 2: Interacoes L2
Mapear interacoes criticas por tipo:
- **dashboard**: hover cards, click filtros, resize widgets
- **form-flow**: focus inputs, validacao inline, submit, errors
- **landing-page**: scroll, hover CTAs, video autoplay
- **navigation**: hamburger toggle, dropdown, active state
- **data-table**: sort, filter, pagination, row hover
- **auth-flow**: input focus, password toggle, OAuth click
- **empty-error-states**: CTA click, retry, navigation link

Cada interacao: `{ name, selector, action, expected, critical }`

### Phase 3: Golden Screenshots
Se app deployada → capturar com playwright-cli por breakpoint
Se nao deployada → marcar PENDING

### Phase 4: Anti-Patterns Visuais
Documentar 3-5 anti-patterns cobrindo tipos diferentes:
- Overflow, Inconsistencia, Inacessibilidade, Layout quebrado, Performance visual

### Phase 5: Arquivos
Criar: context.md, interactions.ts, journey.spec.ts

### Phase 6: Config
Registrar tela em ux-qat.config.ts

### Phase 7: Validacao
Verificar completude e imprimir report

## Tipos de Tela e Rubrics

| Tipo | Rubric | Criterios Chave |
|------|--------|----------------|
| dashboard | dashboard-v1 | hierarquia, densidade, consistencia |
| form-flow | form-flow-v1 | labels, validacao, fluxo |
| landing-page | landing-page-v1 | hero, hierarquia, CTA |
| navigation | navigation-v1 | wayfinding, consistencia |
| data-table | data-table-v1 | legibilidade, funcionalidade |
| auth-flow | auth-flow-v1 | clareza, seguranca, recovery |
| empty-error-states | empty-error-states-v1 | comunicacao, acao |

## Breakpoints Padrao

375px (mobile), 768px (tablet), 1024px (desktop), 1440px (wide)

Projetos podem customizar (ex: admin-panel apenas 1024+1440).
