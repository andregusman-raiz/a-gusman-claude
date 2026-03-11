/**
 * UX-QAT Report Generator
 *
 * Generates human-readable Markdown report and machine-readable JSON
 * from a UX-QAT run summary.
 */

import type { RunSummary, Finding } from '../types/ux-qat.types';
import { writeMarkdownFile, writeJsonFile, log } from './utils';

// ============================================================
// Types (imported from runner)
// ============================================================

interface ScreenResult {
  screen: string;
  findings: Finding[];
  shortCircuited: boolean;
  shortCircuitReason?: string;
  l1Results: Array<{ passed: boolean; breakpoint: number; theme: string }>;
  l2Results: Array<{
    passed: boolean;
    criticalFailed: boolean;
    interactionResults: Array<{ name: string; success: boolean; critical: boolean }>;
  }>;
  l4Results: Array<{
    passed: boolean;
    lighthouseScores: { performance: number; accessibility: number; bestPractices: number } | null;
    designTokenCompliance: number;
  }>;
}

// ============================================================
// Markdown Report
// ============================================================

export function generateReport(
  summary: RunSummary,
  screenResults: ScreenResult[],
  outputPath: string
): void {
  const lines: string[] = [];

  // Header
  lines.push(`# UX-QAT Report`);
  lines.push('');
  lines.push(`> **Run**: ${summary.runId}`);
  lines.push(`> **Date**: ${new Date(summary.timestamp).toLocaleString()}`);
  lines.push(`> **URL**: ${summary.baseUrl}`);
  lines.push(`> **Trigger**: ${summary.trigger}`);
  lines.push(`> **Layers**: ${summary.layers.join(', ')}`);
  lines.push('');

  // Summary Box
  const p0 = summary.findings.filter(f => f.severity === 'P0').length;
  const p1 = summary.findings.filter(f => f.severity === 'P1').length;
  const p2 = summary.findings.filter(f => f.severity === 'P2').length;
  const p3 = summary.findings.filter(f => f.severity === 'P3').length;
  const verdict = p0 > 0 ? 'FAIL' : p1 > 0 ? 'WARN' : 'PASS';
  const emoji = p0 > 0 ? '***FAIL***' : p1 > 0 ? '**WARN**' : '**PASS**';

  lines.push(`## Result: ${emoji}`);
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Total Capture Points | ${summary.total} |`);
  lines.push(`| Passed | ${summary.passed} |`);
  lines.push(`| Failed | ${summary.failed} |`);
  lines.push(`| Skipped | ${summary.skipped} |`);
  lines.push(`| Short-circuited | ${summary.shortCircuited} |`);
  lines.push(`| Pass Rate | ${summary.passRate}% |`);
  lines.push('');

  lines.push('### Findings by Severity');
  lines.push('');
  lines.push('| Severity | Count | Description |');
  lines.push('|----------|-------|-------------|');
  lines.push(`| P0 (BLOCKING) | ${p0} | Critical render/compliance failures |`);
  lines.push(`| P1 (HIGH) | ${p1} | Interaction failures, regressions |`);
  lines.push(`| P2 (MEDIUM) | ${p2} | Moderate compliance, low perception |`);
  lines.push(`| P3 (LOW) | ${p3} | Minor inconsistencies |`);
  lines.push('');

  // Per-Screen Results
  lines.push('---');
  lines.push('');
  lines.push('## Screen Results');
  lines.push('');

  for (const sr of screenResults) {
    lines.push(`### ${sr.screen}`);
    lines.push('');

    if (sr.shortCircuited) {
      lines.push(`> Short-circuited: ${sr.shortCircuitReason}`);
      lines.push('');
    }

    // L1 Summary
    if (sr.l1Results.length > 0) {
      const l1Passed = sr.l1Results.filter(r => r.passed).length;
      const l1Status = l1Passed === sr.l1Results.length ? 'PASS' : 'FAIL';
      lines.push(`**L1 Render**: ${l1Status} (${l1Passed}/${sr.l1Results.length} breakpoints)`);
      lines.push('');
    }

    // L2 Summary
    if (sr.l2Results.length > 0) {
      const l2Passed = sr.l2Results.filter(r => r.passed).length;
      const l2Status = l2Passed === sr.l2Results.length ? 'PASS' : sr.l2Results.some(r => r.criticalFailed) ? 'CRITICAL FAIL' : 'WARN';
      const totalInteractions = sr.l2Results.reduce((sum, r) => sum + r.interactionResults.length, 0);
      const passedInteractions = sr.l2Results.reduce((sum, r) => sum + r.interactionResults.filter(i => i.success).length, 0);
      lines.push(`**L2 Interaction**: ${l2Status} (${passedInteractions}/${totalInteractions} interactions)`);
      lines.push('');
    }

    // L4 Summary
    if (sr.l4Results.length > 0) {
      const l4Passed = sr.l4Results.filter(r => r.passed).length;
      const l4Status = l4Passed === sr.l4Results.length ? 'PASS' : 'FAIL';
      lines.push(`**L4 Compliance**: ${l4Status}`);

      // Lighthouse scores (from first result that has them)
      const lhResult = sr.l4Results.find(r => r.lighthouseScores);
      if (lhResult?.lighthouseScores) {
        const lh = lhResult.lighthouseScores;
        lines.push(`  - Lighthouse: Perf=${lh.performance} A11y=${lh.accessibility} BP=${lh.bestPractices}`);
      }

      // Design token compliance (average)
      const tokenResults = sr.l4Results.filter(r => r.designTokenCompliance < 100);
      if (tokenResults.length > 0) {
        const avgCompliance = Math.round(tokenResults.reduce((sum, r) => sum + r.designTokenCompliance, 0) / tokenResults.length);
        lines.push(`  - Design Token Compliance: ${avgCompliance}%`);
      }
      lines.push('');
    }

    // Findings for this screen
    const screenFindings = sr.findings.filter(f => f.severity === 'P0' || f.severity === 'P1');
    if (screenFindings.length > 0) {
      lines.push('**Findings**:');
      lines.push('');
      for (const f of screenFindings) {
        lines.push(`- **[${f.severity}/${f.category}]** ${f.description}`);
        if (f.evidence) {
          lines.push(`  - Evidence: ${f.evidence}`);
        }
        if (f.suggestedAction) {
          lines.push(`  - Action: ${f.suggestedAction}`);
        }
      }
      lines.push('');
    }
  }

  // All Findings (detailed)
  if (summary.findings.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## All Findings');
    lines.push('');
    lines.push('| # | Screen | Layer | Category | Severity | Description |');
    lines.push('|---|--------|-------|----------|----------|-------------|');

    summary.findings.forEach((f, i) => {
      lines.push(`| ${i + 1} | ${f.screen} | ${f.layer} | ${f.category} | ${f.severity} | ${f.description} |`);
    });
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push('');
  lines.push(`*Generated by UX-QAT v1.0 | ${new Date().toISOString()}*`);

  writeMarkdownFile(outputPath, lines.join('\n'));
  log('info', 'Report', `Report written to ${outputPath}`);
}

// ============================================================
// Scores-by-Screen Export
// ============================================================

export function exportScoresByScreen(
  summary: RunSummary,
  outputPath: string
): void {
  const screenScores: Record<string, {
    passRate: number;
    findings: number;
    p0: number;
    p1: number;
  }> = {};

  // Group findings by screen
  const findingsByScreen = new Map<string, Finding[]>();
  for (const f of summary.findings) {
    const arr = findingsByScreen.get(f.screen) || [];
    arr.push(f);
    findingsByScreen.set(f.screen, arr);
  }

  for (const [screen, findings] of findingsByScreen) {
    screenScores[screen] = {
      passRate: findings.length === 0 ? 100 : 0,
      findings: findings.length,
      p0: findings.filter(f => f.severity === 'P0').length,
      p1: findings.filter(f => f.severity === 'P1').length,
    };
  }

  writeJsonFile(outputPath, {
    runId: summary.runId,
    timestamp: summary.timestamp,
    screens: screenScores,
  });
}
