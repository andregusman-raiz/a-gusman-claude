/**
 * UX-QAT Types — Visual Quality Acceptance Testing
 *
 * Core type definitions for the UX-QAT framework.
 * Used by rubrics, config, agents, and report generation.
 */

// ============================================================
// Component & Project Types
// ============================================================

export type UxComponentType =
  | 'dashboard'
  | 'form-flow'
  | 'landing-page'
  | 'navigation'
  | 'data-table'
  | 'auth-flow'
  | 'empty-error-states'
  | 'chat-interface'
  | 'content-page'
  | 'settings'
  | 'onboarding'
  | 'custom';

export type ProjectType =
  | 'saas-education'
  | 'e-commerce'
  | 'fintech'
  | 'healthcare'
  | 'social-media'
  | 'admin-panel'
  | 'custom';

export type Platform = 'web' | 'mobile-web' | 'desktop' | 'pwa';

// ============================================================
// Rubric Types
// ============================================================

export interface UxCriterionDef {
  name: string;
  weight: number; // 0.0 - 1.0, sum of all criteria weights = 1.0
  description: string;
  scale: {
    '1-2': string; // Critico — problemas graves
    '3-4': string; // Ruim — problemas evidentes
    '5': string;   // Aceitavel — funcional mas sem polish
    '6-7': string; // Bom — minor issues
    '8-9': string; // Muito Bom — polish notavel
    '10': string;  // Excepcional — referencia de mercado
  };
}

export interface UxPenalty {
  name: string;
  condition: string;
  deduction: number; // negative (e.g., -2)
  appliesTo: string; // 'all' | specific criterion name
}

export interface L1Config {
  maxLoadTime: number;     // ms, default 5000
  checkOverflow: boolean;
  checkBrokenImages: boolean;
  checkConsoleLogs: boolean;
  checkFontLoad: boolean;
  checkLayoutCollapse: boolean;
  mainContainerSelectors: string[];
}

export interface L2Interaction {
  type: 'click' | 'fill' | 'hover' | 'focus' | 'press' | 'select' | 'scroll';
  selector: string;
  value?: string;            // for fill/select
  expect: string;            // description of expected state change
  expectSelector?: string;   // selector to verify
  critical?: boolean;        // if true, failure short-circuits L3-L4
}

export interface L4Thresholds {
  axeCritical: number;       // max critical violations (default: 0)
  axeSerious: number;        // max serious violations (default: 0)
  lighthousePerf: number;    // min performance score (default: 90)
  lighthouseA11y: number;    // min accessibility score (default: 90)
  lighthouseBP: number;      // min best practices score (default: 90)
  designTokenCompliance: number; // min % (default: 85)
  touchTargetMin: number;    // min px (default: 44)
}

export interface UxQatRubricV2 {
  id: string;
  version: string;
  type: UxComponentType;
  domain: string;
  platform: Platform;

  criteria: UxCriterionDef[];
  penalties: UxPenalty[];

  designTokensPath?: string;
  goldenScreenshotsPath?: string;
  antiPatternsPath?: string;

  breakpoints: number[];
  themes: string[];

  l1Overrides?: Partial<L1Config>;
  l2Interactions?: L2Interaction[];
  l4Thresholds?: Partial<L4Thresholds>;
}

// ============================================================
// Config Types
// ============================================================

export interface ScreenConfig {
  name: string;
  path: string;
  rubric: string;           // ref to rubric type or custom rubric path
  rubricType?: string;      // resolved UxComponentType for L3 rubric lookup
  auth: false | { role: string; credentials?: string };
  interactions?: L2Interaction[];
  breakpointOverrides?: number[];
  themeOverrides?: string[];
  l1Overrides?: Partial<L1Config>;
  l4Thresholds?: Partial<L4Thresholds>;
  goldenSamplePath?: string;
  antiPatternsPath?: string;
}

export interface UxQatConfig {
  projectName: string;
  projectType: ProjectType;
  platform?: Platform;
  targetAudience?: string;
  baseUrl: string;

  breakpoints: number[];
  themes: string[];

  designTokens: {
    source: string;         // path to design-tokens.json
  };

  screens: ScreenConfig[];

  // Rubric registry: maps rubric name to full rubric definition
  rubrics?: Record<string, UxQatRubricV2>;

  thresholds: {
    l3MinScore: number;
    l4AxeCritical: number;
    l4AxeSerious: number;
    l4LighthousePerf: number;
    l4LighthouseA11y: number;
    regressionDelta: number;
  };

  costControl: {
    maxScreenshotsPerRun: number;
    l3Model: 'sonnet' | 'opus';
    skipL3OnDeploy: boolean;
  };

  integrations: {
    argos: boolean;
    lighthouse: boolean;
    sentry: boolean;
  };
}

// ============================================================
// Judge Types
// ============================================================

export interface UxJudgeCriterionResult {
  name: string;
  score: number;       // 1-10
  weight: number;
  reasoning: string;
  suggestion?: string;
}

export interface UxJudgePenaltyResult {
  name: string;
  deduction: number;
  evidence: string;
}

export interface UxJudgeResult {
  screen: string;
  breakpoint: number;
  theme: string;
  overallScore: number;
  criteria: UxJudgeCriterionResult[];
  penalties: UxJudgePenaltyResult[];
  finalScore: number;
}

// ============================================================
// PDCA Types
// ============================================================

export type FailureCategory =
  | 'RENDER'
  | 'INTERACTION'
  | 'PERCEPTION'
  | 'COMPLIANCE'
  | 'REGRESSION'
  | 'FLAKY';

export type Severity = 'P0' | 'P1' | 'P2' | 'P3';

export interface Finding {
  screen: string;
  layer: 'L1' | 'L2' | 'L3' | 'L4';
  category: FailureCategory;
  severity: Severity;
  score?: number;
  baselineDelta?: number;
  shortCircuited: boolean;
  description: string;
  evidence?: string;
  screenshotPath?: string;
  suggestedAction?: string;
}

export interface Baseline {
  screen: string;
  breakpoint: number;
  theme: string;
  score: number;
  lastUpdated: string;
  history: { date: string; score: number }[];
}

export interface FailurePattern {
  id: string;
  category: FailureCategory;
  indicators: string[];
  severity: Severity;
  affectedScreens: string[];
  status: 'open' | 'investigating' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
}

export interface RunSummary {
  runId: string;
  timestamp: string;
  baseUrl: string;
  layers: ('L1' | 'L2' | 'L3' | 'L4')[];
  trigger: 'deploy' | 'weekly' | 'manual' | 'pr';

  total: number;
  passed: number;
  failed: number;
  skipped: number;
  shortCircuited: number;

  averageScore: number;
  passRate: number;
  estimatedCost: number;

  findings: Finding[];
  baselineUpdates: { screen: string; oldScore: number; newScore: number }[];
  newPatterns: string[];
}

// ============================================================
// Capture Point
// ============================================================

export interface CapturePoint {
  screen: string;
  breakpoint: number;
  theme: string;
  screenshotPath: string;
  viewportScreenshotPath: string;
  timestamp: string;
}

// ============================================================
// Cost Intelligence
// ============================================================

export type ScenarioROI =
  | 'high-value'
  | 'moderate'
  | 'low-value'
  | 'always-passes'
  | 'always-fails'
  | 'too-expensive';

export interface CostMetrics {
  scenarioId: string;
  totalRuns: number;
  totalCost: number;
  issuesDetected: number;
  averageSeverity: number;
  roi: ScenarioROI;
  recommendation: string;
}
