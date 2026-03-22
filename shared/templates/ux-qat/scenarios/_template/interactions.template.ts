import type { L2Interaction } from '../../types/ux-qat.types';

/**
 * Interacoes L2 para {{SCREEN_NAME}}.
 *
 * Cada interacao define:
 * - type: tipo de interacao (click, fill, hover, focus, press, select, scroll)
 * - selector: CSS selector do elemento
 * - value: valor para fill/select (opcional)
 * - expect: descricao do resultado esperado
 * - expectSelector: selector para verificar resultado (opcional)
 * - critical: se true, falha causa short-circuit (skip L3-L4)
 *
 * Adaptar seletores ao projeto real usando data-testid ou CSS selectors estaveis.
 */
export const interactions: L2Interaction[] = [
  // === Interacoes criticas (short-circuit se falhar) ===
  {
    type: 'click',
    selector: '[data-testid="{{SELECTOR_1}}"]',
    expect: '{{EXPECTED_RESULT_1}}',
    expectSelector: '[data-testid="{{EXPECTED_1}}"]',
    critical: true,
  },

  // === Interacoes secundarias ===
  {
    type: 'hover',
    selector: '[data-testid="{{SELECTOR_2}}"]',
    expect: '{{EXPECTED_RESULT_2}}',
    expectSelector: '[data-testid="{{EXPECTED_2}}"]',
    critical: false,
  },

  {
    type: 'focus',
    selector: '[data-testid="{{SELECTOR_3}}"]',
    expect: '{{EXPECTED_RESULT_3}}',
    expectSelector: '[data-testid="{{EXPECTED_3}}"]',
    critical: false,
  },
];
