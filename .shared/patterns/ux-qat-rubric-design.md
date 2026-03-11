# UX-QAT Rubric Design

> Como criar e customizar rubrics visuais para o framework UX-QAT.

## Estrutura de uma Rubric

```typescript
interface UxQatRubricV2 {
  id: string;              // 'dashboard-v1'
  version: string;         // '1.0.0'
  type: UxComponentType;   // 'dashboard'
  domain: string;          // 'general' ou 'fintech'
  platform: Platform;      // 'web'
  criteria: UxCriterionDef[];  // 4-6 criterios com pesos
  penalties: UxPenalty[];      // 8 universais + custom
  breakpoints: number[];       // [375, 768, 1024, 1440]
  themes: string[];            // ['light'] ou ['light', 'dark']
}
```

## Criterios

Cada criterio define:
- **name**: identificador snake_case
- **weight**: peso no score final (soma = 1.0)
- **description**: o que avalia
- **scale**: 6 faixas de score (1-2, 3-4, 5, 6-7, 8-9, 10)

### Regras para pesos

- 4-6 criterios por rubric (nao mais, nao menos)
- Soma dos pesos = 1.0
- Criterio mais importante: 0.25-0.30
- Criterio menos importante: 0.10-0.15
- Nenhum criterio < 0.05 (irrelevante) ou > 0.35 (domina demais)

### Regras para escalas

- **1-2**: Claramente quebrado, inutilizavel
- **3-4**: Funciona minimamente mas com problemas evidentes
- **5**: Funcional e basico (baseline aceitavel)
- **6-7**: Bom, atende expectativas
- **8-9**: Excelente, acima do esperado
- **10**: Referencia, benchmark do mercado

Cada faixa deve ter descricao ESPECIFICA e OBSERVAVEL (nao subjetiva).

## 7 Rubrics Padrao

| Tipo | Criterios | Foco |
|------|-----------|------|
| dashboard | hierarquia, densidade, consistencia, responsividade, interatividade, feedback | Informacao acessivel |
| form-flow | labels, validacao, fluxo, acessibilidade, feedback, responsividade | Preenchimento sem fricao |
| landing-page | hero, hierarquia, tipografia, imagery, CTA, performance | Conversao |
| navigation | wayfinding, consistencia, responsividade, acessibilidade, feedback | Orientacao |
| data-table | legibilidade, funcionalidade, responsividade, densidade, acoes | Dados acessiveis |
| auth-flow | clareza, seguranca, recovery, oauth, acessibilidade | Confianca |
| empty-error-states | comunicacao, acao, consistencia, ilustracao, responsividade | Recuperacao |

## 8 Penalties Universais

Aplicadas a TODAS as rubrics:

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

## Customizacao por Dominio

Projetos podem customizar rubrics:
- **Pesos**: fintech prioriza seguranca-percebida
- **Thresholds L4**: healthcare precisa WCAG AAA
- **Breakpoints**: admin-panel sem mobile
- **Penalties custom**: adicionar penalties especificas do dominio

## Criacao de Rubric Custom

1. Copiar rubric mais proxima do tipo desejado
2. Renomear criterios conforme necessario
3. Ajustar pesos (soma = 1.0)
4. Reescrever escalas com descricoes especificas
5. Adicionar penalties custom se necessario
6. Registrar no `RUBRIC_REGISTRY` do index.ts
