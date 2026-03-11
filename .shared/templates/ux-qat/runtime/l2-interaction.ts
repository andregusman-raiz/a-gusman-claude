/**
 * UX-QAT L2: Interaction Checks
 *
 * Validates that interactive elements respond correctly.
 * Executes actions (click, fill, hover, focus) and asserts state changes.
 *
 * Short-circuit: if a critical interaction fails, skip L3-L4.
 *
 * IMPORTANT: playwright-cli eval only supports simple expressions
 * (no arrow functions, no IIFEs). Use property access, ternaries,
 * comma operators, and function-keyword callbacks only.
 */

import * as path from 'path';
import type { L2Interaction, Finding, CapturePoint } from '../types/ux-qat.types';
import {
  type PlaywrightSession,
  clickElement,
  fillElement,
  hoverElement,
  evalInPage,
  takeScreenshot,
  screenshotsDir,
  log,
  logPass,
  logFail,
} from './utils';

// ============================================================
// Shell Sleep (playwright-cli compatible)
// ============================================================

function shellSleep(ms: number): void {
  const { execSync } = require('child_process');
  execSync(`sleep ${(ms / 1000).toFixed(1)}`, { timeout: ms + 5000 });
}

// ============================================================
// Interaction Executor
// ============================================================

function executeInteraction(
  session: PlaywrightSession,
  interaction: L2Interaction
): { success: boolean; error?: string } {
  try {
    switch (interaction.type) {
      case 'click':
        clickElement(session, interaction.selector);
        break;
      case 'fill':
        fillElement(session, interaction.selector, interaction.value || '');
        break;
      case 'hover':
        hoverElement(session, interaction.selector);
        break;
      case 'focus':
        // Simple ternary expression — no arrow functions
        evalInPage(session,
          `document.querySelector("${interaction.selector}") ? (document.querySelector("${interaction.selector}").focus(), "focused") : "not-found"`
        );
        break;
      case 'press':
        // Comma operator expression — no arrow functions, no multi-line statements
        evalInPage(session,
          `document.querySelector("${interaction.selector}") ? (document.querySelector("${interaction.selector}").dispatchEvent(new KeyboardEvent("keydown", {key: "${interaction.value || 'Enter'}"})), "done") : "not-found"`
        );
        break;
      case 'select':
        // Comma operator expression — set value then dispatch change
        evalInPage(session,
          `document.querySelector("${interaction.selector}") ? (document.querySelector("${interaction.selector}").value = "${interaction.value || ''}", document.querySelector("${interaction.selector}").dispatchEvent(new Event("change")), "done") : "not-found"`
        );
        break;
      case 'scroll':
        // Simple expression with fallback to window
        evalInPage(session,
          `(document.querySelector("${interaction.selector}") || window).scrollBy(0, ${interaction.value || '300'})`
        );
        break;
      default:
        return { success: false, error: `Unknown interaction type: ${interaction.type}` };
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ============================================================
// State Verification (multiple simple evals, no IIFE)
// ============================================================

function verifyExpectedState(
  session: PlaywrightSession,
  interaction: L2Interaction
): { met: boolean; details: string } {
  if (!interaction.expectSelector) {
    // No explicit selector to check — just verify the action didn't throw
    return { met: true, details: 'Action completed without error' };
  }

  const sel = interaction.expectSelector;

  try {
    // Step 1: Check if element exists (simple ternary)
    const existsStr = evalInPage(session,
      `document.querySelector("${sel}") ? "found" : "not-found"`
    );

    if (existsStr === 'not-found') {
      return { met: false, details: `Expected element ${sel} not found in DOM` };
    }

    // Step 2: Check dimensions (simple ternary)
    const heightStr = evalInPage(session,
      `document.querySelector("${sel}") ? document.querySelector("${sel}").getBoundingClientRect().height : -1`
    );
    const height = parseFloat(heightStr);

    // Step 3: Check computed display (simple ternary)
    const display = evalInPage(session,
      `document.querySelector("${sel}") ? getComputedStyle(document.querySelector("${sel}")).display : "none"`
    );

    // Step 4: Check computed visibility (simple ternary)
    const visibility = evalInPage(session,
      `document.querySelector("${sel}") ? getComputedStyle(document.querySelector("${sel}")).visibility : "hidden"`
    );

    // Step 5: Check opacity (simple ternary)
    const opacity = evalInPage(session,
      `document.querySelector("${sel}") ? getComputedStyle(document.querySelector("${sel}")).opacity : "0"`
    );

    // Step 6: Get tag name (simple ternary)
    const tagName = evalInPage(session,
      `document.querySelector("${sel}") ? document.querySelector("${sel}").tagName : "UNKNOWN"`
    );

    // Step 7: Get text content (simple ternary with slice)
    const text = evalInPage(session,
      `document.querySelector("${sel}") ? (document.querySelector("${sel}").textContent || "").slice(0, 100) : ""`
    );

    const visible = height > 0 && display !== 'none' && visibility !== 'hidden' && opacity !== '0';

    if (!visible) {
      return { met: false, details: `Expected element ${sel} found but not visible (h=${height}, display=${display}, visibility=${visibility}, opacity=${opacity})` };
    }

    return { met: true, details: `Element ${sel} is visible (${tagName}: "${text.trim()}")` };
  } catch (err) {
    return { met: false, details: `Verification error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// ============================================================
// L2 Runner
// ============================================================

export interface L2Result {
  screen: string;
  breakpoint: number;
  theme: string;
  passed: boolean;
  criticalFailed: boolean;
  findings: Finding[];
  interactionResults: Array<{
    name: string;
    type: string;
    success: boolean;
    critical: boolean;
    details: string;
  }>;
}

export function runL2(
  session: PlaywrightSession,
  capturePoint: CapturePoint,
  interactions: L2Interaction[],
  options?: { runId?: string; uxqatDir?: string }
): L2Result {
  const findings: Finding[] = [];
  const interactionResults: L2Result['interactionResults'] = [];
  let criticalFailed = false;

  if (interactions.length === 0) {
    log('info', 'L2', `${capturePoint.screen}: No interactions defined — skipping L2`);
    return {
      screen: capturePoint.screen,
      breakpoint: capturePoint.breakpoint,
      theme: capturePoint.theme,
      passed: true,
      criticalFailed: false,
      findings: [],
      interactionResults: [],
    };
  }

  log('info', 'L2', `Testing ${interactions.length} interactions for ${capturePoint.screen}`);

  // Wait for page to be stable before interactions (shell sleep, not eval)
  shellSleep(500);

  for (const interaction of interactions) {
    const isCritical = interaction.critical || false;

    // Skip remaining if a critical interaction already failed
    if (criticalFailed) {
      interactionResults.push({
        name: `${interaction.type}:${interaction.selector}`,
        type: interaction.type,
        success: false,
        critical: isCritical,
        details: 'Skipped due to prior critical failure',
      });
      continue;
    }

    // Execute the interaction
    const execResult = executeInteraction(session, interaction);

    if (!execResult.success) {
      const severity = isCritical ? 'P1' : 'P2';
      findings.push({
        screen: capturePoint.screen,
        layer: 'L2',
        category: 'INTERACTION',
        severity,
        shortCircuited: false,
        description: `Interaction failed: ${interaction.type} on ${interaction.selector}`,
        evidence: execResult.error || 'Unknown error',
        screenshotPath: capturePoint.screenshotPath,
      });

      interactionResults.push({
        name: `${interaction.type}:${interaction.selector}`,
        type: interaction.type,
        success: false,
        critical: isCritical,
        details: execResult.error || 'Execution failed',
      });

      if (isCritical) {
        criticalFailed = true;
        logFail('L2', `CRITICAL interaction failed: ${interaction.type} on ${interaction.selector}`);
      }

      continue;
    }

    // Wait briefly for state change (shell sleep, not eval)
    shellSleep(300);

    // Verify expected state
    const verification = verifyExpectedState(session, interaction);

    if (!verification.met) {
      const severity = isCritical ? 'P1' : 'P2';
      findings.push({
        screen: capturePoint.screen,
        layer: 'L2',
        category: 'INTERACTION',
        severity,
        shortCircuited: false,
        description: `Expected state not met after ${interaction.type}: ${interaction.expect}`,
        evidence: verification.details,
        screenshotPath: capturePoint.screenshotPath,
      });

      interactionResults.push({
        name: `${interaction.type}:${interaction.selector}`,
        type: interaction.type,
        success: false,
        critical: isCritical,
        details: verification.details,
      });

      if (isCritical) {
        criticalFailed = true;
        logFail('L2', `CRITICAL state verification failed: ${interaction.expect}`);
      }
    } else {
      interactionResults.push({
        name: `${interaction.type}:${interaction.selector}`,
        type: interaction.type,
        success: true,
        critical: isCritical,
        details: verification.details,
      });
    }

    // Capture post-interaction screenshot if available
    if (options?.runId && options?.uxqatDir) {
      try {
        const ssDir = screenshotsDir(options.uxqatDir, options.runId);
        const safeName = `${interaction.type}-${interaction.selector}`.replace(/[^a-z0-9-]/gi, '_').slice(0, 60);
        const ssPath = path.join(ssDir, `${capturePoint.screen}-l2-${safeName}.png`);
        takeScreenshot(session, ssPath);
      } catch {
        // Screenshot failure is non-critical
      }
    }
  }

  const passed = findings.filter(f => f.severity === 'P0' || f.severity === 'P1').length === 0;
  const successCount = interactionResults.filter(r => r.success).length;

  if (passed && !criticalFailed) {
    logPass('L2', `${capturePoint.screen}: ${successCount}/${interactions.length} interactions passed`);
  } else {
    logFail('L2', `${capturePoint.screen}: ${successCount}/${interactions.length} passed, critical=${criticalFailed}`);
  }

  return {
    screen: capturePoint.screen,
    breakpoint: capturePoint.breakpoint,
    theme: capturePoint.theme,
    passed,
    criticalFailed,
    findings,
    interactionResults,
  };
}
