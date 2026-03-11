/**
 * UX-QAT Config Template
 *
 * Copy this file to your project's .ux-qat/config/ux-qat.config.ts
 * and customize for your project.
 */

import type { UxQatConfig } from '../types/ux-qat.types';

export const config: UxQatConfig = {
  // === Project Identity ===
  projectName: 'my-project',
  projectType: 'saas-education', // saas-education | e-commerce | fintech | healthcare | social-media | admin-panel | custom
  baseUrl: 'http://localhost:3000',

  // === Breakpoints (viewport widths in px) ===
  breakpoints: [375, 768, 1024, 1440],

  // === Themes to test ===
  themes: ['light'], // Add 'dark', 'high-contrast' if supported

  // === Design Tokens ===
  designTokens: {
    source: './design-tokens.json',
  },

  // === Screens to evaluate ===
  screens: [
    // Example: Dashboard
    // {
    //   name: 'dashboard',
    //   path: '/dashboard',
    //   rubric: 'dashboard',
    //   auth: { role: 'admin' },
    //   interactions: [
    //     { type: 'click', selector: '[data-testid="filter-btn"]', expect: 'dropdown visible' },
    //   ],
    // },

    // Example: Login (no auth needed)
    // {
    //   name: 'login',
    //   path: '/login',
    //   rubric: 'auth-flow',
    //   auth: false,
    // },
  ],

  // === Thresholds ===
  thresholds: {
    l3MinScore: 6.0,          // Minimum L3 Judge score to PASS
    l4AxeCritical: 0,         // Max axe-core critical violations
    l4AxeSerious: 0,          // Max axe-core serious violations
    l4LighthousePerf: 90,     // Min Lighthouse performance score
    l4LighthouseA11y: 90,     // Min Lighthouse accessibility score
    regressionDelta: -1.5,    // Score drop to classify as REGRESSION
  },

  // === Cost Control ===
  costControl: {
    maxScreenshotsPerRun: 40,  // Safety cap for screenshots per run
    l3Model: 'sonnet',         // 'sonnet' (cost-effective) | 'opus' (deep analysis)
    skipL3OnDeploy: true,      // Skip L3 on deploy triggers (run L1+L2+L4 only)
  },

  // === Integrations ===
  integrations: {
    argos: false,              // Feed screenshots to Argos CI for pixel diff
    lighthouse: true,          // Run Lighthouse CI for L4
    sentry: false,             // Capture Sentry errors during evaluation
  },
};
