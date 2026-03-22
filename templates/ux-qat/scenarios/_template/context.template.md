# UX-QAT Scenario: {{SCREEN_NAME}}

## Tela
- **Rota**: {{ROUTE}}
- **Tipo**: {{TYPE}} (dashboard|form-flow|landing-page|navigation|data-table|auth-flow|empty-error-states)
- **Rubric**: {{RUBRIC_ID}}
- **Auth**: {{AUTH_REQUIRED}} (true|false)

## Design Intent

{{DESCRIPTION}}
Descreva o que esta tela deve comunicar ao usuario. Qual e a experiencia ideal.
Qual acao principal o usuario deve realizar.

## Breakpoints

- **375px** (mobile): {{MOBILE_ADAPTATIONS}}
- **768px** (tablet): {{TABLET_ADAPTATIONS}}
- **1024px** (desktop): {{DESKTOP_ADAPTATIONS}}
- **1440px** (wide): {{WIDE_ADAPTATIONS}}

## Interacoes Criticas

1. {{INTERACTION_1}} — {{WHY_CRITICAL}}
2. {{INTERACTION_2}} — {{WHY_CRITICAL}}
3. {{INTERACTION_3}} — {{WHY_CRITICAL}}

## Componentes Chave

| Componente | Selector | Visivel em |
|------------|----------|-----------|
| {{COMPONENT_1}} | `[data-testid="..."]` | all |
| {{COMPONENT_2}} | `[data-testid="..."]` | >= 768px |
| {{COMPONENT_3}} | `[data-testid="..."]` | mobile only |

## Dependencias

- **Design tokens**: v{{VERSION}}
- **Componentes**: {{COMPONENT_LIST}}
- **API endpoints**: {{API_DEPS}} (se aplicavel)

## Notas

- Criado por: ag-43
- Data: {{DATE}}
- Versao: 1.0
