/**
 * UX-QAT Runtime Utilities
 *
 * Shared helpers for Playwright CLI wrapper, logging, path resolution,
 * and common operations used across L1-L4 engines.
 */

import { execSync, type ExecSyncOptions } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// Types
// ============================================================

export interface PlaywrightSession {
  sessionId: string;
  baseUrl: string;
}

export interface ConsoleEntry {
  type: 'error' | 'warning' | 'log';
  text: string;
  url?: string;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// ============================================================
// Playwright CLI Wrapper
// ============================================================

const PLAYWRIGHT_CLI = '/opt/homebrew/bin/playwright-cli';

function execPlaywright(args: string, opts?: ExecSyncOptions): string {
  const result = execSync(`${PLAYWRIGHT_CLI} ${args}`, {
    timeout: 30_000,
    ...opts,
    encoding: 'utf-8',
  });
  return (result as string).trim();
}

export function createSession(baseUrl: string): PlaywrightSession {
  const sessionId = `uxqat-${Date.now()}`;
  execPlaywright(`-s=${sessionId} open "${baseUrl}"`);
  return { sessionId, baseUrl };
}

export function navigateTo(session: PlaywrightSession, urlPath: string): string {
  const fullUrl = urlPath.startsWith('http')
    ? urlPath
    : `${session.baseUrl}${urlPath}`;
  return execPlaywright(`-s=${session.sessionId} goto "${fullUrl}"`);
}

export function takeScreenshot(session: PlaywrightSession, outputPath: string): string {
  ensureDir(path.dirname(outputPath));
  const result = execPlaywright(`-s=${session.sessionId} screenshot`);
  // Extract the saved screenshot path from output (e.g., ".playwright-cli/page-xxx.png")
  const match = result.match(/\(([^)]+\.png)\)/);
  if (match && match[1] && fs.existsSync(match[1])) {
    fs.copyFileSync(match[1], outputPath);
  }
  return result;
}

export function takeFullPageScreenshot(session: PlaywrightSession, outputPath: string): string {
  ensureDir(path.dirname(outputPath));
  // Use eval to take full-page screenshot since playwright-cli doesn't have a --full-page flag
  const result = execPlaywright(
    `-s=${session.sessionId} eval "const b = await page.screenshot({fullPage: true}); require('fs').writeFileSync('${outputPath.replace(/'/g, "\\'")}', b);"`
  );
  return result;
}

export function setViewport(session: PlaywrightSession, width: number, height: number = 900): string {
  return execPlaywright(`-s=${session.sessionId} resize ${width} ${height}`);
}

export function getSnapshot(session: PlaywrightSession): string {
  return execPlaywright(`-s=${session.sessionId} snapshot`);
}

export function clickElement(session: PlaywrightSession, selector: string): string {
  return execPlaywright(`-s=${session.sessionId} click "${selector}"`);
}

export function fillElement(session: PlaywrightSession, selector: string, value: string): string {
  return execPlaywright(`-s=${session.sessionId} fill "${selector}" "${value}"`);
}

export function hoverElement(session: PlaywrightSession, selector: string): string {
  return execPlaywright(`-s=${session.sessionId} hover "${selector}"`);
}

export function evalInPage(session: PlaywrightSession, expression: string): string {
  // playwright-cli's eval wraps in page.evaluate(), so strip any IIFE wrapper
  // e.g. "(() => { ... })()" → the inner body as a function expression
  let expr = expression.trim();

  // Strip IIFE: (() => { body })() → body content as a function
  const iifeMatch = expr.match(/^\(\(\)\s*=>\s*\{([\s\S]*)\}\)\(\)$/);
  if (iifeMatch) {
    // Wrap as async function body — playwright-cli supports async eval
    expr = `(async () => { ${iifeMatch[1]} })()`;
  }

  // Also handle: (() => { return new Promise(...) })()
  const promiseIife = expr.match(/^\(\(\)\s*=>\s*\{[\s\S]*return new Promise[\s\S]*\}\)\(\)$/);
  if (promiseIife) {
    // Already handled by iifeMatch above
  }

  // Escape for shell — use a temp file approach for complex expressions
  const tmpFile = `/tmp/ux-qat-eval-${Date.now()}.js`;
  const fs = require('fs');
  fs.writeFileSync(tmpFile, expr, 'utf-8');

  try {
    const raw = execPlaywright(`-s=${session.sessionId} eval "$(cat ${tmpFile})"`);

    // playwright-cli wraps results in markdown: ### Result\n<value>\n### ...
    const resultMatch = raw.match(/### Result\n([\s\S]*?)(?:\n###|$)/);
    if (resultMatch && resultMatch[1]) {
      let val = resultMatch[1].trim();
      // Remove surrounding quotes if present
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1).replace(/\\"/g, '"');
      }
      return val;
    }

    // Check for error
    const errorMatch = raw.match(/### Error\n([\s\S]*?)(?:\n###|$)/);
    if (errorMatch) {
      throw new Error(errorMatch[1].trim());
    }

    return raw;
  } finally {
    try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}

export function closeSession(session: PlaywrightSession): void {
  try {
    execPlaywright(`-s=${session.sessionId} close`);
  } catch {
    // Session may already be closed
  }
}

// ============================================================
// File & Path Utilities
// ============================================================

export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function resolveProjectRoot(startFrom?: string): string {
  let dir = startFrom || process.cwd();
  while (dir !== '/') {
    if (fs.existsSync(path.join(dir, '.ux-qat'))) {
      return dir;
    }
    if (fs.existsSync(path.join(dir, 'ux-qat'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  throw new Error('UX-QAT: No .ux-qat/ or ux-qat/ directory found in parent chain');
}

export function resolveUxQatDir(projectRoot: string): string {
  const dotDir = path.join(projectRoot, '.ux-qat');
  if (fs.existsSync(dotDir)) return dotDir;
  const plainDir = path.join(projectRoot, 'ux-qat');
  if (fs.existsSync(plainDir)) return plainDir;
  throw new Error(`UX-QAT: No config directory found in ${projectRoot}`);
}

export function generateRunId(): string {
  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `run-${ts}`;
}

export function resultsDir(uxqatDir: string, runId: string): string {
  const dir = path.join(uxqatDir, 'results', runId);
  ensureDir(dir);
  return dir;
}

export function screenshotsDir(uxqatDir: string, runId: string): string {
  const dir = path.join(uxqatDir, 'results', runId, 'screenshots');
  ensureDir(dir);
  return dir;
}

// ============================================================
// Logging
// ============================================================

const COLORS = {
  info: '\x1b[34m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  debug: '\x1b[90m',
  reset: '\x1b[0m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
};

export function log(level: LogLevel, component: string, message: string): void {
  const color = COLORS[level];
  const prefix = `${color}[UX-QAT:${component}]${COLORS.reset}`;
  const timestamp = new Date().toISOString().slice(11, 19);
  console.log(`${COLORS.debug}${timestamp}${COLORS.reset} ${prefix} ${message}`);
}

export function logPass(component: string, message: string): void {
  console.log(`${COLORS.green}[PASS]${COLORS.reset} ${COLORS.cyan}[${component}]${COLORS.reset} ${message}`);
}

export function logFail(component: string, message: string): void {
  console.log(`${COLORS.error}[FAIL]${COLORS.reset} ${COLORS.cyan}[${component}]${COLORS.reset} ${message}`);
}

export function logSkip(component: string, message: string): void {
  console.log(`${COLORS.warn}[SKIP]${COLORS.reset} ${COLORS.cyan}[${component}]${COLORS.reset} ${message}`);
}

// ============================================================
// Config & Design Token Loading
// ============================================================

export function loadJsonFile<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

export function writeJsonFile(filePath: string, data: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

export function writeMarkdownFile(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf-8');
}

// ============================================================
// Screenshot Naming
// ============================================================

export function screenshotName(screen: string, breakpoint: number, theme: string, suffix = ''): string {
  const safeName = screen.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const sfx = suffix ? `-${suffix}` : '';
  return `${safeName}-${breakpoint}-${theme}${sfx}.png`;
}
