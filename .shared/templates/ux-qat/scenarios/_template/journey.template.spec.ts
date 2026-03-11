// UX-QAT Journey: {{SCREEN_NAME}}
// Gerado por ag-43 — NÃO editar manualmente
// Executado pelo ag-42 durante ciclo PDCA

import type { ScreenConfig } from '../../types/ux-qat.types';
import { interactions } from './interactions.template';

/**
 * Configuracao da tela para UX-QAT.
 *
 * O ag-42 usa este arquivo para:
 * 1. Navegar ate a rota
 * 2. Aplicar breakpoints e temas
 * 3. Executar interacoes L2
 * 4. Capturar screenshots para L3
 * 5. Rodar axe-core/Lighthouse para L4
 */
export const screenConfig: ScreenConfig = {
  name: '{{SCREEN_NAME}}',
  path: '{{ROUTE}}',
  rubric: '{{TYPE}}',
  rubricType: '{{TYPE}}',
  interactions,
  breakpointOverrides: [375, 768, 1024, 1440],
  themeOverrides: ['light'],
  auth: false, // true se requer login

  // Overrides opcionais:
  // l1Overrides: { maxLoadTime: 3000 },
  // l4Thresholds: { axeCritical: 0, lighthousePerf: 90 },
  // goldenSamplePath: './golden-sample.png',
  // antiPatternsPath: './anti-patterns.md',
};
