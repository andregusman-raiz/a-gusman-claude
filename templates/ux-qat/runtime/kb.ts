/**
 * UX-QAT Knowledge Base Manager
 *
 * CRUD operations for the persistent KB:
 *   - baselines/{screen}-{breakpoint}-{theme}.json
 *   - failure-patterns/{pattern-id}.json
 *   - golden-samples/{rubric-type}.md
 *   - anti-patterns/{category}.md
 *   - learnings/{date}-{topic}.md
 *
 * KB lives at {project}/.ux-qat/knowledge/ and is versioned (git).
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  Baseline,
  FailurePattern,
  Finding,
  FailureCategory,
  Severity,
} from '../types/ux-qat.types';
import { log, loadJsonFile, writeJsonFile, ensureDir } from './utils';

// ============================================================
// KB Paths
// ============================================================

export function kbDir(uxqatDir: string): string {
  return path.join(uxqatDir, 'knowledge');
}

function baselinesDir(uxqatDir: string): string {
  return path.join(kbDir(uxqatDir), 'baselines');
}

function patternsDir(uxqatDir: string): string {
  return path.join(kbDir(uxqatDir), 'failure-patterns');
}

function goldenDir(uxqatDir: string): string {
  return path.join(kbDir(uxqatDir), 'golden-samples');
}

function antiPatternsDir(uxqatDir: string): string {
  return path.join(kbDir(uxqatDir), 'anti-patterns');
}

function learningsDir(uxqatDir: string): string {
  return path.join(kbDir(uxqatDir), 'learnings');
}

// ============================================================
// Baseline CRUD
// ============================================================

function baselineKey(screen: string, breakpoint: number, theme: string): string {
  return `${screen}-${breakpoint}-${theme}`;
}

function baselinePath(uxqatDir: string, screen: string, breakpoint: number, theme: string): string {
  return path.join(baselinesDir(uxqatDir), `${baselineKey(screen, breakpoint, theme)}.json`);
}

export function loadBaseline(
  uxqatDir: string,
  screen: string,
  breakpoint: number,
  theme: string
): Baseline | null {
  const p = baselinePath(uxqatDir, screen, breakpoint, theme);
  return loadJsonFile<Baseline>(p);
}

export function loadAllBaselines(uxqatDir: string): Map<string, Baseline> {
  const dir = baselinesDir(uxqatDir);
  const baselines = new Map<string, Baseline>();

  if (!fs.existsSync(dir)) return baselines;

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const baseline = loadJsonFile<Baseline>(path.join(dir, file));
    if (baseline) {
      const key = baselineKey(baseline.screen, baseline.breakpoint, baseline.theme);
      baselines.set(key, baseline);
    }
  }

  log('info', 'KB', `Loaded ${baselines.size} baselines`);
  return baselines;
}

export function saveBaseline(
  uxqatDir: string,
  screen: string,
  breakpoint: number,
  theme: string,
  score: number
): { oldScore: number | null; newScore: number } {
  const existing = loadBaseline(uxqatDir, screen, breakpoint, theme);
  const now = new Date().toISOString();

  const baseline: Baseline = {
    screen,
    breakpoint,
    theme,
    score,
    lastUpdated: now,
    history: existing?.history || [],
  };

  // Add current score to history
  baseline.history.push({ date: now, score });

  // Keep last 20 entries
  if (baseline.history.length > 20) {
    baseline.history = baseline.history.slice(-20);
  }

  const p = baselinePath(uxqatDir, screen, breakpoint, theme);
  ensureDir(path.dirname(p));
  writeJsonFile(p, baseline);

  log('info', 'KB', `Baseline updated: ${screen}@${breakpoint}x${theme} = ${score}`);
  return { oldScore: existing?.score ?? null, newScore: score };
}

export function shouldUpdateBaseline(
  current: number,
  baseline: Baseline | null,
  improvementThreshold: number = 1.0,
  stableRunsRequired: number = 3
): boolean {
  if (!baseline) return true; // No baseline yet — create

  const delta = current - baseline.score;

  // Only update if improvement > threshold
  if (delta <= improvementThreshold) return false;

  // Check if score is stable (last N runs are within 0.5 of each other)
  const recentHistory = baseline.history.slice(-stableRunsRequired);
  if (recentHistory.length < stableRunsRequired) return true; // Not enough history

  const scores = recentHistory.map(h => h.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  return (max - min) <= 0.5; // Stable enough
}

// ============================================================
// Failure Pattern CRUD
// ============================================================

export function loadPattern(uxqatDir: string, patternId: string): FailurePattern | null {
  const p = path.join(patternsDir(uxqatDir), `${patternId}.json`);
  return loadJsonFile<FailurePattern>(p);
}

export function loadAllPatterns(uxqatDir: string): FailurePattern[] {
  const dir = patternsDir(uxqatDir);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const patterns: FailurePattern[] = [];

  for (const file of files) {
    const pattern = loadJsonFile<FailurePattern>(path.join(dir, file));
    if (pattern) patterns.push(pattern);
  }

  log('info', 'KB', `Loaded ${patterns.length} failure patterns`);
  return patterns;
}

export function savePattern(uxqatDir: string, pattern: FailurePattern): void {
  const dir = patternsDir(uxqatDir);
  ensureDir(dir);
  writeJsonFile(path.join(dir, `${pattern.id}.json`), pattern);
  log('info', 'KB', `Pattern saved: ${pattern.id} (${pattern.status})`);
}

export function createPatternFromFindings(
  findings: Finding[],
  category: FailureCategory,
  severity: Severity
): FailurePattern {
  const screens = [...new Set(findings.map(f => f.screen))];
  const indicators = findings.map(f => f.description).slice(0, 5);
  const id = `${category.toLowerCase()}-${Date.now()}`;

  return {
    id,
    category,
    indicators,
    severity,
    affectedScreens: screens,
    status: 'open',
    createdAt: new Date().toISOString(),
  };
}

export function resolvePattern(uxqatDir: string, patternId: string): void {
  const pattern = loadPattern(uxqatDir, patternId);
  if (!pattern) return;

  pattern.status = 'resolved';
  pattern.resolvedAt = new Date().toISOString();
  savePattern(uxqatDir, pattern);
}

// ============================================================
// Golden Sample CRUD
// ============================================================

export function loadGoldenSample(uxqatDir: string, rubricType: string): string | null {
  const p = path.join(goldenDir(uxqatDir), `${rubricType}.md`);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf-8');
}

export function saveGoldenSample(uxqatDir: string, rubricType: string, content: string): void {
  const dir = goldenDir(uxqatDir);
  ensureDir(dir);
  fs.writeFileSync(path.join(dir, `${rubricType}.md`), content, 'utf-8');
  log('info', 'KB', `Golden sample saved: ${rubricType}`);
}

// ============================================================
// Anti-Pattern CRUD
// ============================================================

export function loadAntiPatterns(uxqatDir: string, category: string): string | null {
  const p = path.join(antiPatternsDir(uxqatDir), `${category}.md`);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf-8');
}

export function appendAntiPattern(uxqatDir: string, category: string, entry: string): void {
  const dir = antiPatternsDir(uxqatDir);
  ensureDir(dir);
  const p = path.join(dir, `${category}.md`);

  const existing = fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : `# Anti-Patterns: ${category}\n\n`;
  const updated = existing + `\n## ${new Date().toISOString().slice(0, 10)}\n\n${entry}\n`;
  fs.writeFileSync(p, updated, 'utf-8');
  log('info', 'KB', `Anti-pattern appended: ${category}`);
}

// ============================================================
// Learnings CRUD
// ============================================================

export function saveLearning(uxqatDir: string, topic: string, content: string): void {
  const dir = learningsDir(uxqatDir);
  ensureDir(dir);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `${date}-${topic.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}.md`;
  fs.writeFileSync(path.join(dir, filename), content, 'utf-8');
  log('info', 'KB', `Learning saved: ${filename}`);
}

export function loadRecentLearnings(uxqatDir: string, limit: number = 10): string[] {
  const dir = learningsDir(uxqatDir);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .sort()
    .reverse()
    .slice(0, limit);

  return files.map(f => {
    const content = fs.readFileSync(path.join(dir, f), 'utf-8');
    return `### ${f}\n${content}`;
  });
}

// ============================================================
// KB Initialization
// ============================================================

export function initializeKB(uxqatDir: string): void {
  const dirs = [
    baselinesDir(uxqatDir),
    patternsDir(uxqatDir),
    goldenDir(uxqatDir),
    antiPatternsDir(uxqatDir),
    learningsDir(uxqatDir),
  ];

  for (const dir of dirs) {
    ensureDir(dir);
  }

  log('info', 'KB', `KB initialized at ${kbDir(uxqatDir)}`);
}
