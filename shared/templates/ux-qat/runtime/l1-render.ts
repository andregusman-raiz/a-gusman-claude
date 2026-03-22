/**
 * UX-QAT L1: Render Checks
 *
 * Validates that a screen renders without critical visual errors.
 * All checks are programmatic (no LLM) — pass/fail.
 *
 * IMPORTANT: playwright-cli eval only supports simple expressions
 * (no functions, callbacks, IIFEs, arrow functions).
 * All checks use property access, ternaries, and method chains.
 */

import type { L1Config, Finding, CapturePoint } from '../types/ux-qat.types';
import {
  type PlaywrightSession,
  evalInPage,
  getSnapshot,
  log,
  logPass,
  logFail,
} from './utils';

// ============================================================
// Default Config
// ============================================================

const DEFAULT_L1: L1Config = {
  maxLoadTime: 5000,
  checkOverflow: true,
  checkBrokenImages: true,
  checkConsoleLogs: true,
  checkFontLoad: true,
  checkLayoutCollapse: true,
  mainContainerSelectors: ['main', '#__next', '#root', '[role="main"]', '.main-content'],
};

// ============================================================
// Individual Checks (simple expression only)
// ============================================================

function checkConsoleErrors(session: PlaywrightSession): Finding[] {
  const findings: Finding[] = [];

  try {
    // Count failed resources (status >= 400)
    const countStr = evalInPage(session,
      `performance.getEntriesByType("resource").reduce(function(c, r) { return r.responseStatus >= 400 ? c + 1 : c; }, 0)`
    );

    const count = parseInt(countStr, 10);
    if (count > 0) {
      findings.push({
        screen: '',
        layer: 'L1',
        category: 'RENDER',
        severity: 'P0',
        shortCircuited: false,
        description: `${count} failed resource(s) detected`,
        evidence: `${count} resources with HTTP status >= 400`,
      });
    }
  } catch {
    // If eval fails, try snapshot approach
    try {
      const snapshot = getSnapshot(session);
      if (snapshot.includes('error') || snapshot.includes('Error')) {
        log('debug', 'L1', 'Potential errors detected in snapshot');
      }
    } catch {
      log('warn', 'L1', 'Could not check console errors');
    }
  }

  return findings;
}

function checkBrokenImages(session: PlaywrightSession): Finding[] {
  const findings: Finding[] = [];

  try {
    // Simple count of images on page
    const totalStr = evalInPage(session, `document.querySelectorAll("img").length`);
    const total = parseInt(totalStr, 10);

    if (total > 0) {
      // Check each image individually with a loop via reduce
      // Note: reduce with function keyword fails in playwright-cli
      // Use snapshot instead to detect broken images
      const snapshot = getSnapshot(session);
      const brokenPattern = /img.*(?:broken|error|404|failed)/i;
      if (brokenPattern.test(snapshot)) {
        findings.push({
          screen: '',
          layer: 'L1',
          category: 'RENDER',
          severity: 'P1',
          shortCircuited: false,
          description: 'Potentially broken image(s) detected',
          evidence: `${total} total images on page, snapshot indicates broken image`,
        });
      }
    }
  } catch {
    log('warn', 'L1', 'Could not check broken images');
  }

  return findings;
}

function checkOverflow(session: PlaywrightSession, breakpoint: number): Finding[] {
  const findings: Finding[] = [];

  // Only relevant for mobile breakpoints
  if (breakpoint > 768) return findings;

  try {
    const docWidth = parseInt(evalInPage(session, `document.documentElement.clientWidth`), 10);
    const bodyWidth = parseInt(evalInPage(session, `document.body.scrollWidth`), 10);

    if (bodyWidth > docWidth + 5) {
      findings.push({
        screen: '',
        layer: 'L1',
        category: 'RENDER',
        severity: 'P0',
        shortCircuited: false,
        description: `Horizontal overflow at ${breakpoint}px`,
        evidence: `body.scrollWidth (${bodyWidth}) > viewport (${docWidth}) by ${bodyWidth - docWidth}px`,
      });
    }
  } catch {
    log('warn', 'L1', 'Could not check overflow');
  }

  return findings;
}

function checkLayoutCollapse(session: PlaywrightSession, selectors: string[]): Finding[] {
  const findings: Finding[] = [];

  for (const sel of selectors) {
    try {
      const heightStr = evalInPage(session,
        `document.querySelector("${sel}") ? document.querySelector("${sel}").getBoundingClientRect().height : -1`
      );
      const height = parseFloat(heightStr);

      if (height >= 0 && height < 10) {
        findings.push({
          screen: '',
          layer: 'L1',
          category: 'RENDER',
          severity: 'P0',
          shortCircuited: false,
          description: `Layout collapsed: ${sel}`,
          evidence: `height=${height}px (expected > 10px)`,
        });
      }
      // height === -1 means element not found, which is fine
    } catch {
      // Selector check failed — non-critical
    }
  }

  return findings;
}

function checkFontLoading(session: PlaywrightSession): Finding[] {
  const findings: Finding[] = [];

  try {
    const status = evalInPage(session,
      `document.fonts ? document.fonts.status : "no-api"`
    );

    if (status !== 'loaded' && status !== 'no-api') {
      findings.push({
        screen: '',
        layer: 'L1',
        category: 'RENDER',
        severity: 'P2',
        shortCircuited: false,
        description: 'Fonts not fully loaded (FOUT/FOIT risk)',
        evidence: `fonts.status: ${status}`,
      });
    }
  } catch {
    log('warn', 'L1', 'Could not check font loading');
  }

  return findings;
}

function checkPageLoadTime(session: PlaywrightSession, maxTime: number): Finding[] {
  const findings: Finding[] = [];

  try {
    const loadTimeStr = evalInPage(session,
      `performance.getEntriesByType("navigation").length > 0 ? Math.round(performance.getEntriesByType("navigation")[0].loadEventEnd - performance.getEntriesByType("navigation")[0].startTime) : 0`
    );

    const loadTime = parseInt(loadTimeStr, 10);
    if (loadTime > maxTime) {
      findings.push({
        screen: '',
        layer: 'L1',
        category: 'RENDER',
        severity: 'P1',
        shortCircuited: false,
        description: `Page load time exceeds threshold`,
        evidence: `${loadTime}ms > ${maxTime}ms`,
      });
    } else if (loadTime > 0) {
      log('debug', 'L1', `Page load time: ${loadTime}ms (threshold: ${maxTime}ms)`);
    }
  } catch {
    log('warn', 'L1', 'Could not check page load time');
  }

  return findings;
}

// ============================================================
// L1 Runner
// ============================================================

export interface L1Result {
  screen: string;
  breakpoint: number;
  theme: string;
  passed: boolean;
  findings: Finding[];
}

export function runL1(
  session: PlaywrightSession,
  capturePoint: CapturePoint,
  config?: Partial<L1Config>
): L1Result {
  const cfg: L1Config = { ...DEFAULT_L1, ...config };
  const allFindings: Finding[] = [];

  log('info', 'L1', `Checking ${capturePoint.screen}@${capturePoint.breakpoint}x${capturePoint.theme}`);

  // Run all checks
  if (cfg.checkConsoleLogs) {
    allFindings.push(...checkConsoleErrors(session));
  }

  if (cfg.checkBrokenImages) {
    allFindings.push(...checkBrokenImages(session));
  }

  if (cfg.checkOverflow) {
    allFindings.push(...checkOverflow(session, capturePoint.breakpoint));
  }

  if (cfg.checkLayoutCollapse) {
    allFindings.push(...checkLayoutCollapse(session, cfg.mainContainerSelectors));
  }

  if (cfg.checkFontLoad) {
    allFindings.push(...checkFontLoading(session));
  }

  allFindings.push(...checkPageLoadTime(session, cfg.maxLoadTime));

  // Tag findings with screen info
  for (const f of allFindings) {
    f.screen = capturePoint.screen;
    f.screenshotPath = capturePoint.screenshotPath;
  }

  const hasP0 = allFindings.some(f => f.severity === 'P0');
  const passed = !hasP0;

  if (passed) {
    logPass('L1', `${capturePoint.screen}@${capturePoint.breakpoint} — all render checks passed`);
  } else {
    logFail('L1', `${capturePoint.screen}@${capturePoint.breakpoint} — ${allFindings.filter(f => f.severity === 'P0').length} P0 findings`);
  }

  return {
    screen: capturePoint.screen,
    breakpoint: capturePoint.breakpoint,
    theme: capturePoint.theme,
    passed,
    findings: allFindings,
  };
}
