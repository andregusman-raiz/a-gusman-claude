/**
 * UX-QAT Runtime — Public API
 *
 * Entry point for all runtime modules.
 * Import from here for clean access to the UX-QAT engine.
 */

// Core runner
export { runUxQat, type RunOptions, type ScreenResult, type LayerSet } from './runner';

// Individual layers
export { runL1, type L1Result } from './l1-render';
export { runL2, type L2Result } from './l2-interaction';
export { runL3, type L3Options, type L3Result } from './l3-judge';
export { runL4, type L4Result } from './l4-compliance';

// Capture pipeline
export { captureScreen, captureAll, type CaptureOptions, type CaptureResult } from './capture';

// Report generation
export { generateReport, exportScoresByScreen } from './report';

// Scoring engine
export {
  calculateWeightedScore,
  applyPenalties,
  evaluatePenalties,
  assembleJudgeResult,
  isRegression,
  isImprovement,
  averageScore,
  lowestScore,
  scoresByScreen,
} from './scoring';

// Guideline selector
export { selectGuidelines, clearCache as clearGuidelineCache } from './guideline-selector';

// PDCA orchestrator
export { runPDCA, type PDCAOptions, type PDCAResult } from './pdca';

// Knowledge Base
export {
  initializeKB,
  loadAllBaselines,
  loadBaseline,
  saveBaseline,
  shouldUpdateBaseline,
  loadAllPatterns,
  loadPattern,
  savePattern,
  resolvePattern,
  createPatternFromFindings,
  loadGoldenSample,
  saveGoldenSample,
  loadAntiPatterns,
  appendAntiPattern,
  saveLearning,
  loadRecentLearnings,
} from './kb';

// Classifier
export {
  classifyFindings,
  classifyFinding,
  detectRegressions,
  detectFlaky,
  prioritize,
  type PrioritySummary,
  type RegressionResult,
} from './classifier';

// Continuous Improvement
export {
  analyzeJudgeVariance,
  detectScenarioGaps,
  calculateCostMetrics,
  exportTrends,
  type RubricRefinementResult,
  type ScenarioGap,
  type TrendData,
} from './improvement';

// Utilities
export {
  createSession,
  closeSession,
  navigateTo,
  setViewport,
  takeScreenshot,
  takeFullPageScreenshot,
  generateRunId,
  resolveProjectRoot,
  resolveUxQatDir,
  log,
  logPass,
  logFail,
  logSkip,
  loadJsonFile,
  writeJsonFile,
  type PlaywrightSession,
} from './utils';
