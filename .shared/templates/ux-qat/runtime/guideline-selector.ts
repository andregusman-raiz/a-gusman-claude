/**
 * UX-QAT Guideline Selector
 *
 * BM25-inspired selection of relevant guidelines from ui-ux-pro-max
 * data files (ux-guidelines.csv, ui-reasoning.csv) for the L3 Judge prompt.
 *
 * The selector reads CSV files, tokenizes queries and documents,
 * and returns the top-N most relevant guidelines as context for the Judge.
 */

import * as fs from 'fs';
import * as path from 'path';
import { log } from './utils';

// ============================================================
// Types
// ============================================================

interface Guideline {
  id: string;
  category: string;
  text: string;
  source: string; // 'ux-guidelines' | 'ui-reasoning'
}

interface ScoredGuideline extends Guideline {
  score: number;
}

// ============================================================
// BM25 Parameters
// ============================================================

const K1 = 1.5;
const B = 0.75;

// ============================================================
// CSV Parser (lightweight, no dependency)
// ============================================================

function parseCSV(content: string): string[][] {
  const lines = content.split('\n').filter(l => l.trim());
  return lines.map(line => {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim());
    return fields;
  });
}

// ============================================================
// Tokenizer
// ============================================================

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

// ============================================================
// BM25 Scoring
// ============================================================

function computeBM25(
  queryTokens: string[],
  documents: Array<{ tokens: string[] }>,
): number[] {
  const N = documents.length;
  const avgDL = documents.reduce((sum, d) => sum + d.tokens.length, 0) / N;

  // Document frequency per term
  const df = new Map<string, number>();
  for (const doc of documents) {
    const uniqueTokens = new Set(doc.tokens);
    for (const t of uniqueTokens) {
      df.set(t, (df.get(t) || 0) + 1);
    }
  }

  // Score each document
  return documents.map(doc => {
    const dl = doc.tokens.length;
    let score = 0;

    // Term frequency in this document
    const tf = new Map<string, number>();
    for (const t of doc.tokens) {
      tf.set(t, (tf.get(t) || 0) + 1);
    }

    for (const qt of queryTokens) {
      const termFreq = tf.get(qt) || 0;
      if (termFreq === 0) continue;

      const docFreq = df.get(qt) || 0;
      const idf = Math.log((N - docFreq + 0.5) / (docFreq + 0.5) + 1);
      const tfNorm = (termFreq * (K1 + 1)) / (termFreq + K1 * (1 - B + B * (dl / avgDL)));

      score += idf * tfNorm;
    }

    return score;
  });
}

// ============================================================
// Guideline Loading
// ============================================================

const UI_UX_PRO_MAX_DIR = path.join(
  process.env.HOME || '~',
  '.claude', 'skills', 'ui-ux-pro-max', 'data'
);

function loadGuidelines(): Guideline[] {
  const guidelines: Guideline[] = [];

  // Load ux-guidelines.csv
  const uxPath = path.join(UI_UX_PRO_MAX_DIR, 'ux-guidelines.csv');
  if (fs.existsSync(uxPath)) {
    const rows = parseCSV(fs.readFileSync(uxPath, 'utf-8'));
    // Skip header
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length >= 2) {
        guidelines.push({
          id: `ux-${i}`,
          category: row[0] || 'general',
          text: row.slice(1).join(' ').trim(),
          source: 'ux-guidelines',
        });
      }
    }
    log('debug', 'GuidelineSelector', `Loaded ${rows.length - 1} UX guidelines`);
  } else {
    log('warn', 'GuidelineSelector', `UX guidelines not found at ${uxPath}`);
  }

  // Load ui-reasoning.csv
  const uiPath = path.join(UI_UX_PRO_MAX_DIR, 'ui-reasoning.csv');
  if (fs.existsSync(uiPath)) {
    const rows = parseCSV(fs.readFileSync(uiPath, 'utf-8'));
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length >= 2) {
        guidelines.push({
          id: `ui-${i}`,
          category: row[0] || 'general',
          text: row.slice(1).join(' ').trim(),
          source: 'ui-reasoning',
        });
      }
    }
    log('debug', 'GuidelineSelector', `Loaded ${rows.length - 1} UI reasoning rules`);
  } else {
    log('warn', 'GuidelineSelector', `UI reasoning not found at ${uiPath}`);
  }

  return guidelines;
}

// ============================================================
// Public API
// ============================================================

let cachedGuidelines: Guideline[] | null = null;

export function selectGuidelines(
  screenType: string,
  componentTypes: string[],
  platform: string,
  topN: number = 10
): string[] {
  // Lazy load
  if (!cachedGuidelines) {
    cachedGuidelines = loadGuidelines();
  }

  if (cachedGuidelines.length === 0) {
    log('warn', 'GuidelineSelector', 'No guidelines available — L3 Judge will run without guidelines context');
    return [];
  }

  // Build query
  const query = `${screenType} ${componentTypes.join(' ')} ${platform}`;
  const queryTokens = tokenize(query);

  // Tokenize documents
  const docs = cachedGuidelines.map(g => ({
    guideline: g,
    tokens: tokenize(`${g.category} ${g.text}`),
  }));

  // BM25 scoring
  const scores = computeBM25(queryTokens, docs);

  // Rank and select top-N
  const scored: ScoredGuideline[] = docs.map((d, i) => ({
    ...d.guideline,
    score: scores[i],
  }));

  scored.sort((a, b) => b.score - a.score);

  const selected = scored.slice(0, topN).filter(g => g.score > 0);

  log('info', 'GuidelineSelector', `Selected ${selected.length} guidelines for "${query}"`);

  return selected.map(g => `[${g.source}/${g.category}] ${g.text}`);
}

export function clearCache(): void {
  cachedGuidelines = null;
}
