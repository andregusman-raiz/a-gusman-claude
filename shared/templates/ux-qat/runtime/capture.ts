/**
 * UX-QAT Capture Pipeline
 *
 * Captures screenshots for each screen x breakpoint x theme combination.
 * Handles viewport resizing, theme switching, and network idle waiting.
 */

import * as path from 'path';
import type { ScreenConfig, CapturePoint } from '../types/ux-qat.types';
import {
  type PlaywrightSession,
  navigateTo,
  setViewport,
  takeScreenshot,
  takeFullPageScreenshot,
  evalInPage,
  screenshotsDir,
  screenshotName,
  log,
} from './utils';

// ============================================================
// Types
// ============================================================

export interface CaptureOptions {
  breakpoints: number[];
  themes: string[];
  runId: string;
  uxqatDir: string;
  waitAfterNav?: number; // ms, default 2000
}

export interface CaptureResult {
  screen: string;
  capturePoints: CapturePoint[];
  errors: string[];
}

// ============================================================
// Theme Switching
// ============================================================

function setTheme(session: PlaywrightSession, theme: string): void {
  if (theme === 'light') {
    evalInPage(session, `(document.documentElement.classList.remove("dark"), document.documentElement.setAttribute("data-theme", "light"), "done")`);
  } else if (theme === 'dark') {
    evalInPage(session, `(document.documentElement.classList.add("dark"), document.documentElement.setAttribute("data-theme", "dark"), "done")`);
  } else {
    evalInPage(session, `(document.documentElement.setAttribute("data-theme", "${theme}"), "done")`);
  }
}

// ============================================================
// Wait Helpers
// ============================================================

function waitForStable(_session: PlaywrightSession, ms: number): void {
  // playwright-cli eval doesn't support async/arrow functions
  // Use a synchronous sleep via shell instead
  const { execSync } = require('child_process');
  execSync(`sleep ${(ms / 1000).toFixed(1)}`, { timeout: ms + 5000 });
}

function waitForNetworkIdle(session: PlaywrightSession): void {
  // Check font loading status (simple expression)
  try {
    evalInPage(session, `document.fonts ? document.fonts.status : "no-api"`);
  } catch {
    // Non-critical
  }
  // Simple delay for network settle
  waitForStable(session, 1000);
}

// ============================================================
// Capture Pipeline
// ============================================================

export function captureScreen(
  session: PlaywrightSession,
  screen: ScreenConfig,
  options: CaptureOptions
): CaptureResult {
  const { breakpoints, themes, runId, uxqatDir, waitAfterNav = 2000 } = options;
  const ssDir = screenshotsDir(uxqatDir, runId);
  const capturePoints: CapturePoint[] = [];
  const errors: string[] = [];

  const screenBreakpoints = screen.breakpointOverrides || breakpoints;
  const screenThemes = screen.themeOverrides || themes;

  log('info', 'Capture', `Capturing ${screen.name}: ${screenBreakpoints.length} bp x ${screenThemes.length} themes`);

  // Navigate to screen
  try {
    navigateTo(session, screen.path);
    waitForStable(session, waitAfterNav);
    waitForNetworkIdle(session);
  } catch (err) {
    const msg = `Failed to navigate to ${screen.path}: ${err instanceof Error ? err.message : String(err)}`;
    log('error', 'Capture', msg);
    errors.push(msg);
    return { screen: screen.name, capturePoints, errors };
  }

  // Capture each breakpoint x theme
  for (const breakpoint of screenBreakpoints) {
    for (const theme of screenThemes) {
      try {
        setViewport(session, breakpoint);
        waitForStable(session, 500);

        setTheme(session, theme);
        waitForStable(session, 300);

        waitForNetworkIdle(session);

        // Viewport screenshot
        const viewportFile = screenshotName(screen.name, breakpoint, theme, 'viewport');
        const viewportPath = path.join(ssDir, viewportFile);
        takeScreenshot(session, viewportPath);

        // Full-page screenshot
        const fullFile = screenshotName(screen.name, breakpoint, theme, 'full');
        const fullPath = path.join(ssDir, fullFile);
        takeFullPageScreenshot(session, fullPath);

        capturePoints.push({
          screen: screen.name,
          breakpoint,
          theme,
          screenshotPath: fullPath,
          viewportScreenshotPath: viewportPath,
          timestamp: new Date().toISOString(),
        });

        log('debug', 'Capture', `  ${breakpoint}x${theme} captured`);
      } catch (err) {
        const msg = `Capture failed ${screen.name}@${breakpoint}x${theme}: ${err instanceof Error ? err.message : String(err)}`;
        log('warn', 'Capture', msg);
        errors.push(msg);
      }
    }
  }

  log('info', 'Capture', `${screen.name}: ${capturePoints.length} captures, ${errors.length} errors`);
  return { screen: screen.name, capturePoints, errors };
}

export function captureAll(
  session: PlaywrightSession,
  screens: ScreenConfig[],
  options: CaptureOptions
): Map<string, CaptureResult> {
  const results = new Map<string, CaptureResult>();
  for (const screen of screens) {
    results.set(screen.name, captureScreen(session, screen, options));
  }
  return results;
}
