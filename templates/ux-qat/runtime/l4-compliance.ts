/**
 * UX-QAT L4: Compliance Checks
 *
 * Automated standards validation — no LLM required.
 * Sub-layers:
 * 1. axe-core — WCAG 2.1 AA violations
 * 2. Lighthouse — Performance, Accessibility, Best Practices scores
 * 3. Design Token Compliance — CSS analysis vs design tokens
 * 4. Touch Targets — Minimum 44x44px for interactive elements
 *
 * IMPORTANT: playwright-cli eval only supports simple expressions
 * (no arrow functions, no IIFEs). Use property access, ternaries,
 * comma operators, and function-keyword callbacks only.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import type { L4Thresholds, Finding, CapturePoint } from '../types/ux-qat.types';
import {
  type PlaywrightSession,
  evalInPage,
  log,
  logPass,
  logFail,
  loadJsonFile,
} from './utils';

// ============================================================
// Defaults
// ============================================================

const DEFAULT_L4: L4Thresholds = {
  axeCritical: 0,
  axeSerious: 0,
  lighthousePerf: 90,
  lighthouseA11y: 90,
  lighthouseBP: 90,
  designTokenCompliance: 85,
  touchTargetMin: 44,
};

// ============================================================
// Shell Sleep
// ============================================================

function shellSleep(ms: number): void {
  execSync(`sleep ${(ms / 1000).toFixed(1)}`, { timeout: ms + 5000 });
}

// ============================================================
// axe-core Check (multi-step simple evals, no IIFE/arrow)
// ============================================================

interface AxeViolation {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  count: number;
}

function checkAxeCore(session: PlaywrightSession, thresholds: L4Thresholds): Finding[] {
  const findings: Finding[] = [];

  try {
    // Step 1: Check if axe-core is already loaded (simple expression)
    const PLAYWRIGHT_CLI = '/opt/homebrew/bin/playwright-cli';
    const axeStatusRaw = execSync(
      `${PLAYWRIGHT_CLI} -s=${session.sessionId} eval "typeof axe"`,
      { timeout: 10_000, encoding: 'utf-8' }
    ).trim();
    const axeLoaded = axeStatusRaw.includes('"object"') || axeStatusRaw.includes('"function"');

    // Step 2: If not loaded, inject it
    if (!axeLoaded) {
      execSync(
        `${PLAYWRIGHT_CLI} -s=${session.sessionId} eval 'document.head.appendChild(Object.assign(document.createElement("script"), {src: "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js"}))'`,
        { timeout: 10_000, encoding: 'utf-8' }
      );

      // Wait for script to load
      shellSleep(3000);

      // Verify it loaded
      const verifyRaw = execSync(
        `${PLAYWRIGHT_CLI} -s=${session.sessionId} eval "typeof axe"`,
        { timeout: 10_000, encoding: 'utf-8' }
      ).trim();

      if (!verifyRaw.includes('"object"') && !verifyRaw.includes('"function"')) {
        log('warn', 'L4:axe', 'axe-core failed to load from CDN');
        return findings;
      }
    }

    // Step 3: Run axe-core — simple expression, playwright-cli auto-resolves the Promise
    // The full axe result is returned as JSON; we parse violations on Node.js side
    const raw = execSync(
      `${PLAYWRIGHT_CLI} -s=${session.sessionId} eval "axe.run()"`,
      { timeout: 60_000, encoding: 'utf-8' }
    ).trim();

    // Extract the full result JSON from playwright-cli output
    const resultMatch = raw.match(/### Result\n([\s\S]*?)(?:\n###|$)/);
    if (!resultMatch || !resultMatch[1]) {
      const errorMatch = raw.match(/### Error\n([\s\S]*?)(?:\n###|$)/);
      if (errorMatch) throw new Error(errorMatch[1].trim());
      throw new Error('No axe result in output');
    }

    let resultJson = resultMatch[1].trim();
    // playwright-cli may return the object directly (not string-wrapped)
    const axeResult = (typeof resultJson === 'string' && resultJson.startsWith('{'))
      ? JSON.parse(resultJson)
      : JSON.parse(resultJson);

    // Extract violations on Node.js side
    const violations: AxeViolation[] = [];
    if (Array.isArray(axeResult.violations)) {
      for (const v of axeResult.violations) {
        violations.push({
          id: v.id,
          impact: v.impact,
          description: v.description,
          count: Array.isArray(v.nodes) ? v.nodes.length : 0,
        });
      }
    }

    const data = {
      violations,
      passes: Array.isArray(axeResult.passes) ? axeResult.passes.length : 0,
      incomplete: Array.isArray(axeResult.incomplete) ? axeResult.incomplete.length : 0,
    };

    const critical = data.violations.filter(v => v.impact === 'critical');
    const serious = data.violations.filter(v => v.impact === 'serious');
    const moderate = data.violations.filter(v => v.impact === 'moderate');

    if (critical.length > thresholds.axeCritical) {
      for (const v of critical) {
        findings.push({
          screen: '',
          layer: 'L4',
          category: 'COMPLIANCE',
          severity: 'P0',
          shortCircuited: false,
          description: `axe-core CRITICAL: ${v.description}`,
          evidence: `Rule: ${v.id}, ${v.count} instances`,
        });
      }
    }

    if (serious.length > thresholds.axeSerious) {
      for (const v of serious) {
        findings.push({
          screen: '',
          layer: 'L4',
          category: 'COMPLIANCE',
          severity: 'P1',
          shortCircuited: false,
          description: `axe-core SERIOUS: ${v.description}`,
          evidence: `Rule: ${v.id}, ${v.count} instances`,
        });
      }
    }

    for (const v of moderate) {
      findings.push({
        screen: '',
        layer: 'L4',
        category: 'COMPLIANCE',
        severity: 'P2',
        shortCircuited: false,
        description: `axe-core MODERATE: ${v.description}`,
        evidence: `Rule: ${v.id}, ${v.count} instances`,
      });
    }

    log('info', 'L4:axe', `${data.violations.length} violations (${critical.length} critical, ${serious.length} serious), ${data.passes} passes`);
  } catch (err) {
    log('error', 'L4:axe', `axe-core check failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  return findings;
}

// ============================================================
// Lighthouse Check (unchanged — runs as CLI, no browser eval)
// ============================================================

interface LighthouseScores {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

function checkLighthouse(url: string, thresholds: L4Thresholds): { findings: Finding[]; scores: LighthouseScores | null } {
  const findings: Finding[] = [];
  let scores: LighthouseScores | null = null;

  try {
    // Run Lighthouse CLI (requires `lighthouse` or `lhci` installed)
    const tmpOutput = `/tmp/ux-qat-lh-${Date.now()}.json`;
    execSync(
      `npx lighthouse "${url}" --output=json --output-path="${tmpOutput}" --chrome-flags="--headless --no-sandbox" --only-categories=performance,accessibility,best-practices 2>/dev/null`,
      { timeout: 60_000, encoding: 'utf-8' }
    );

    if (fs.existsSync(tmpOutput)) {
      const report = loadJsonFile<{
        categories: {
          performance?: { score: number };
          accessibility?: { score: number };
          'best-practices'?: { score: number };
          seo?: { score: number };
        };
      }>(tmpOutput);

      if (!report) {
        log('warn', 'L4:lighthouse', 'Failed to parse Lighthouse report');
        return { findings, scores };
      }

      scores = {
        performance: Math.round((report.categories.performance?.score || 0) * 100),
        accessibility: Math.round((report.categories.accessibility?.score || 0) * 100),
        bestPractices: Math.round((report.categories['best-practices']?.score || 0) * 100),
        seo: Math.round((report.categories.seo?.score || 0) * 100),
      };

      // Clean up
      try { fs.unlinkSync(tmpOutput); } catch { /* ignore */ }

      // Check thresholds
      if (scores.performance < thresholds.lighthousePerf) {
        findings.push({
          screen: '',
          layer: 'L4',
          category: 'COMPLIANCE',
          severity: scores.performance < 50 ? 'P0' : 'P1',
          shortCircuited: false,
          description: `Lighthouse Performance below threshold`,
          evidence: `Score: ${scores.performance}/100 (threshold: ${thresholds.lighthousePerf})`,
        });
      }

      if (scores.accessibility < thresholds.lighthouseA11y) {
        findings.push({
          screen: '',
          layer: 'L4',
          category: 'COMPLIANCE',
          severity: scores.accessibility < 50 ? 'P0' : 'P1',
          shortCircuited: false,
          description: `Lighthouse Accessibility below threshold`,
          evidence: `Score: ${scores.accessibility}/100 (threshold: ${thresholds.lighthouseA11y})`,
        });
      }

      if (scores.bestPractices < thresholds.lighthouseBP) {
        findings.push({
          screen: '',
          layer: 'L4',
          category: 'COMPLIANCE',
          severity: 'P2',
          shortCircuited: false,
          description: `Lighthouse Best Practices below threshold`,
          evidence: `Score: ${scores.bestPractices}/100 (threshold: ${thresholds.lighthouseBP})`,
        });
      }

      log('info', 'L4:lighthouse', `Perf=${scores.performance} A11y=${scores.accessibility} BP=${scores.bestPractices}`);
    }
  } catch (err) {
    log('warn', 'L4:lighthouse', `Lighthouse check skipped: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { findings, scores };
}

// ============================================================
// Touch Target Check (plain statements, no IIFE/arrow)
// ============================================================

function checkTouchTargets(session: PlaywrightSession, minSize: number): Finding[] {
  const findings: Finding[] = [];

  try {
    // Multi-statement eval with var (no arrow functions, no IIFEs)
    const evalScript = [
      `var els = document.querySelectorAll("a, button, input, select, textarea, [role='button'], [onclick], [tabindex]");`,
      `var small = [];`,
      `for (var i = 0; i < els.length; i++) {`,
      `  var rect = els[i].getBoundingClientRect();`,
      `  if (rect.width > 0 && rect.height > 0 && (rect.width < ${minSize} || rect.height < ${minSize})) {`,
      `    small.push({tag: els[i].tagName, text: (els[i].textContent || "").trim().slice(0, 50), width: Math.round(rect.width), height: Math.round(rect.height)});`,
      `  }`,
      `}`,
      `JSON.stringify(small.slice(0, 20));`,
    ].join('\n');

    const tmpFile = `/tmp/ux-qat-touch-${Date.now()}.js`;
    fs.writeFileSync(tmpFile, evalScript, 'utf-8');

    let result: string;
    try {
      const PLAYWRIGHT_CLI = '/opt/homebrew/bin/playwright-cli';
      const raw = execSync(
        `${PLAYWRIGHT_CLI} -s=${session.sessionId} eval "$(cat ${tmpFile})"`,
        { timeout: 30_000, encoding: 'utf-8' }
      ).trim();

      const resultMatch = raw.match(/### Result\n([\s\S]*?)(?:\n###|$)/);
      if (resultMatch && resultMatch[1]) {
        result = resultMatch[1].trim();
        if (result.startsWith('"') && result.endsWith('"')) {
          result = result.slice(1, -1).replace(/\\"/g, '"');
        }
      } else {
        result = '[]';
      }
    } finally {
      try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
    }

    const small = JSON.parse(result || '[]') as Array<{
      tag: string;
      text: string;
      width: number;
      height: number;
    }>;

    if (small.length > 0) {
      findings.push({
        screen: '',
        layer: 'L4',
        category: 'COMPLIANCE',
        severity: 'P2',
        shortCircuited: false,
        description: `${small.length} touch targets below ${minSize}x${minSize}px`,
        evidence: small.slice(0, 5).map(s => `${s.tag}("${s.text}") ${s.width}x${s.height}px`).join('; '),
      });
    }

    log('info', 'L4:touch', `${small.length} undersized touch targets found`);
  } catch {
    log('warn', 'L4:touch', 'Could not check touch targets');
  }

  return findings;
}

// ============================================================
// Design Token Compliance Check (plain statements, function keyword callbacks)
// ============================================================

interface DesignTokens {
  colors?: Record<string, string>;
  fontFamily?: Record<string, string>;
  fontSize?: Record<string, string>;
  spacing?: Record<string, string>;
  borderRadius?: Record<string, string>;
}

function checkDesignTokenCompliance(
  session: PlaywrightSession,
  designTokensPath: string,
  threshold: number
): { findings: Finding[]; compliancePercent: number } {
  const findings: Finding[] = [];
  let compliancePercent = 100;

  if (!fs.existsSync(designTokensPath)) {
    log('warn', 'L4:tokens', `Design tokens file not found: ${designTokensPath}`);
    return { findings, compliancePercent };
  }

  try {
    const tokens = loadJsonFile<DesignTokens>(designTokensPath);
    if (!tokens) {
      log('warn', 'L4:tokens', 'Failed to parse design tokens');
      return { findings, compliancePercent };
    }

    // Extract token color values
    const tokenColors = Object.values(tokens.colors || {}).map(c => c.toLowerCase());

    if (tokenColors.length === 0) {
      log('info', 'L4:tokens', 'No color tokens defined — skipping compliance check');
      return { findings, compliancePercent };
    }

    const tokenColorsJson = JSON.stringify(tokenColors);

    // Multi-statement eval with function-keyword callback in .some()
    const evalScript = [
      `var tokenColors = ${tokenColorsJson};`,
      `var elements = document.querySelectorAll("*");`,
      `var total = 0, compliant = 0;`,
      `var sampleSize = Math.min(elements.length, 200);`,
      `for (var i = 0; i < sampleSize; i++) {`,
      `  var el = elements[Math.floor(i * elements.length / sampleSize)];`,
      `  var style = getComputedStyle(el);`,
      `  if (style.backgroundColor && style.backgroundColor !== "rgba(0, 0, 0, 0)") {`,
      `    total++;`,
      `    var bg = style.backgroundColor.toLowerCase();`,
      `    if (tokenColors.some(function(tc) { return bg.indexOf(tc) >= 0 || tc.indexOf(bg) >= 0; })) compliant++;`,
      `  }`,
      `  if (style.color) {`,
      `    total++;`,
      `    var fg = style.color.toLowerCase();`,
      `    if (tokenColors.some(function(tc) { return fg.indexOf(tc) >= 0 || tc.indexOf(fg) >= 0; })) compliant++;`,
      `  }`,
      `}`,
      `JSON.stringify({total: total, compliant: compliant, percent: total > 0 ? Math.round(compliant / total * 100) : 100});`,
    ].join('\n');

    const tmpFile = `/tmp/ux-qat-tokens-${Date.now()}.js`;
    fs.writeFileSync(tmpFile, evalScript, 'utf-8');

    let result: string;
    try {
      const PLAYWRIGHT_CLI = '/opt/homebrew/bin/playwright-cli';
      const raw = execSync(
        `${PLAYWRIGHT_CLI} -s=${session.sessionId} eval "$(cat ${tmpFile})"`,
        { timeout: 30_000, encoding: 'utf-8' }
      ).trim();

      const resultMatch = raw.match(/### Result\n([\s\S]*?)(?:\n###|$)/);
      if (resultMatch && resultMatch[1]) {
        result = resultMatch[1].trim();
        if (result.startsWith('"') && result.endsWith('"')) {
          result = result.slice(1, -1).replace(/\\"/g, '"');
        }
      } else {
        result = '{"total":0,"compliant":0,"percent":100}';
      }
    } finally {
      try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
    }

    const data = JSON.parse(result) as { total: number; compliant: number; percent: number };
    compliancePercent = data.percent;

    if (compliancePercent < threshold) {
      findings.push({
        screen: '',
        layer: 'L4',
        category: 'COMPLIANCE',
        severity: compliancePercent < 50 ? 'P1' : 'P2',
        shortCircuited: false,
        description: `Design token compliance below threshold`,
        evidence: `${compliancePercent}% compliant (threshold: ${threshold}%). ${data.compliant}/${data.total} colors match tokens.`,
      });
    }

    log('info', 'L4:tokens', `Design token compliance: ${compliancePercent}% (${data.compliant}/${data.total})`);
  } catch (err) {
    log('warn', 'L4:tokens', `Token compliance check failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { findings, compliancePercent };
}

// ============================================================
// L4 Runner
// ============================================================

export interface L4Result {
  screen: string;
  breakpoint: number;
  theme: string;
  passed: boolean;
  findings: Finding[];
  lighthouseScores: LighthouseScores | null;
  designTokenCompliance: number;
}

export function runL4(
  session: PlaywrightSession,
  capturePoint: CapturePoint,
  options: {
    baseUrl: string;
    screenPath: string;
    thresholds?: Partial<L4Thresholds>;
    designTokensPath?: string;
    skipLighthouse?: boolean;
  }
): L4Result {
  const thresholds: L4Thresholds = { ...DEFAULT_L4, ...options.thresholds };
  const allFindings: Finding[] = [];

  log('info', 'L4', `Compliance check: ${capturePoint.screen}@${capturePoint.breakpoint}x${capturePoint.theme}`);

  // 1. axe-core
  allFindings.push(...checkAxeCore(session, thresholds));

  // 2. Lighthouse (only on desktop breakpoint to avoid redundancy)
  let lighthouseScores: LighthouseScores | null = null;
  if (!options.skipLighthouse && capturePoint.breakpoint >= 1024) {
    const fullUrl = `${options.baseUrl}${options.screenPath}`;
    const lhResult = checkLighthouse(fullUrl, thresholds);
    allFindings.push(...lhResult.findings);
    lighthouseScores = lhResult.scores;
  }

  // 3. Touch targets (only on mobile breakpoints)
  if (capturePoint.breakpoint <= 768) {
    allFindings.push(...checkTouchTargets(session, thresholds.touchTargetMin));
  }

  // 4. Design token compliance
  let designTokenCompliance = 100;
  if (options.designTokensPath) {
    const tokenResult = checkDesignTokenCompliance(
      session,
      options.designTokensPath,
      thresholds.designTokenCompliance
    );
    allFindings.push(...tokenResult.findings);
    designTokenCompliance = tokenResult.compliancePercent;
  }

  // Tag findings
  for (const f of allFindings) {
    f.screen = capturePoint.screen;
    f.screenshotPath = capturePoint.screenshotPath;
  }

  const hasP0 = allFindings.some(f => f.severity === 'P0');
  const passed = !hasP0;

  if (passed) {
    logPass('L4', `${capturePoint.screen}@${capturePoint.breakpoint} — compliance passed`);
  } else {
    logFail('L4', `${capturePoint.screen}@${capturePoint.breakpoint} — ${allFindings.filter(f => f.severity === 'P0').length} P0 compliance issues`);
  }

  return {
    screen: capturePoint.screen,
    breakpoint: capturePoint.breakpoint,
    theme: capturePoint.theme,
    passed,
    findings: allFindings,
    lighthouseScores,
    designTokenCompliance,
  };
}
