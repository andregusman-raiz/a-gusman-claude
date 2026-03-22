import type { UxPenalty, UxQatRubricV2 } from '../types/ux-qat.types';

// ============================================================
// Universal Penalties (applied to ALL rubrics)
// ============================================================

export const UNIVERSAL_PENALTIES: UxPenalty[] = [
  {
    name: 'overflow-horizontal',
    condition: 'Scroll horizontal visivel em mobile (375px)',
    deduction: -3,
    appliesTo: 'all',
  },
  {
    name: 'texto-ilegivel',
    condition: 'Contraste de texto < 3:1 em texto principal',
    deduction: -2,
    appliesTo: 'all',
  },
  {
    name: 'touch-target-pequeno',
    condition: 'Elemento interativo com area < 44x44px',
    deduction: -2,
    appliesTo: 'all',
  },
  {
    name: 'z-index-war',
    condition: 'Elementos sobrepostos incorretamente (modal atras de header, tooltip cortado)',
    deduction: -2,
    appliesTo: 'all',
  },
  {
    name: 'font-flash',
    condition: 'FOUT/FOIT visivel apos 1s de carregamento',
    deduction: -1,
    appliesTo: 'all',
  },
  {
    name: 'layout-shift',
    condition: 'CLS > 0.1 (elementos mudam de posicao durante carregamento)',
    deduction: -1,
    appliesTo: 'all',
  },
  {
    name: 'inconsistencia-cor',
    condition: 'Cor utilizada que nao pertence ao design token palette',
    deduction: -1,
    appliesTo: 'all',
  },
  {
    name: 'orphan-element',
    condition: 'Elemento visualmente desconectado do grupo logico (botao solto, card sem secao)',
    deduction: -1,
    appliesTo: 'all',
  },
];

// ============================================================
// Rubric Exports
// ============================================================

export { dashboardRubric } from './dashboard.rubric';
export { formFlowRubric } from './form-flow.rubric';
export { landingPageRubric } from './landing-page.rubric';
export { navigationRubric } from './navigation.rubric';
export { dataTableRubric } from './data-table.rubric';
export { authFlowRubric } from './auth-flow.rubric';
export { emptyErrorStatesRubric } from './empty-error-states.rubric';

// ============================================================
// Rubric Registry (lookup by type)
// ============================================================

export const RUBRIC_REGISTRY: Record<string, () => Promise<{ default: UxQatRubricV2 }>> = {
  dashboard: () => import('./dashboard.rubric').then((m) => ({ default: m.dashboardRubric })),
  'form-flow': () => import('./form-flow.rubric').then((m) => ({ default: m.formFlowRubric })),
  'landing-page': () => import('./landing-page.rubric').then((m) => ({ default: m.landingPageRubric })),
  navigation: () => import('./navigation.rubric').then((m) => ({ default: m.navigationRubric })),
  'data-table': () => import('./data-table.rubric').then((m) => ({ default: m.dataTableRubric })),
  'auth-flow': () => import('./auth-flow.rubric').then((m) => ({ default: m.authFlowRubric })),
  'empty-error-states': () =>
    import('./empty-error-states.rubric').then((m) => ({ default: m.emptyErrorStatesRubric })),
};
