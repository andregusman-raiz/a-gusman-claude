/**
 * UX-QAT L3: Visual Judge (AI-as-Judge)
 *
 * Evaluates screenshots against design tokens + rubric using a multimodal LLM.
 * Assembles the prompt from:
 * 1. Judge system prompt template
 * 2. Design tokens (JSON)
 * 3. Rubric criteria + penalties
 * 4. BM25-selected guidelines from ui-ux-pro-max
 * 5. Golden sample (if available)
 * 6. Anti-patterns (if available)
 *
 * Returns structured UxJudgeResult with scores per criterion + penalties.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import type {
  UxQatRubricV2,
  UxJudgeResult,
  UxJudgeCriterionResult,
  UxJudgePenaltyResult,
  CapturePoint,
  Finding,
} from '../types/ux-qat.types';
import {
  log,
  logPass,
  logFail,
} from './utils';
import { selectGuidelines } from './guideline-selector';
import { assembleJudgeResult, evaluatePenalties } from './scoring';

// ============================================================
// Types
// ============================================================

export interface L3Options {
  rubric: UxQatRubricV2;
  designTokensPath: string;
  projectType: string;
  platform: string;
  targetAudience?: string;
  goldenSamplePath?: string;
  antiPatternsPath?: string;
  model?: 'sonnet' | 'opus';
  judgePromptPath?: string;
}

export interface L3Result {
  screen: string;
  breakpoint: number;
  theme: string;
  passed: boolean;
  judgeResult: UxJudgeResult | null;
  findings: Finding[];
  cost: number; // estimated cost in USD
  rawResponse?: string;
}

// ============================================================
// Prompt Assembly
// ============================================================

const DEFAULT_JUDGE_PROMPT_PATH = path.join(
  process.env.HOME || '~',
  '.claude', 'skills', 'ag42', 'judge-prompt.md'
);

function assemblePrompt(
  capturePoint: CapturePoint,
  options: L3Options
): string {
  // Load judge prompt template
  const promptPath = options.judgePromptPath || DEFAULT_JUDGE_PROMPT_PATH;
  let template = '';
  if (fs.existsSync(promptPath)) {
    template = fs.readFileSync(promptPath, 'utf-8');
  } else {
    log('warn', 'L3', `Judge prompt not found at ${promptPath} — using inline template`);
    template = getInlineTemplate();
  }

  // Load design tokens
  let designTokens = '{}';
  if (fs.existsSync(options.designTokensPath)) {
    designTokens = fs.readFileSync(options.designTokensPath, 'utf-8');
  }

  // Serialize rubric criteria
  const rubricCriteria = JSON.stringify(
    options.rubric.criteria.map(c => ({
      name: c.name,
      weight: c.weight,
      description: c.description,
      scale: c.scale,
    })),
    null,
    2
  );

  // Serialize penalties
  const penaltiesDef = JSON.stringify(
    options.rubric.penalties.map(p => ({
      name: p.name,
      condition: p.condition,
      deduction: p.deduction,
    })),
    null,
    2
  );

  // Select relevant guidelines via BM25
  const componentTypes = [options.rubric.type];
  const guidelines = selectGuidelines(
    options.rubric.type,
    componentTypes,
    options.platform,
    10
  );

  // Load golden sample if available
  let goldenSample = 'Nenhum golden sample disponivel para esta rubric.';
  if (options.goldenSamplePath && fs.existsSync(options.goldenSamplePath)) {
    goldenSample = fs.readFileSync(options.goldenSamplePath, 'utf-8');
  }

  // Load anti-patterns if available
  let antiPatterns = 'Nenhum anti-pattern registrado.';
  if (options.antiPatternsPath && fs.existsSync(options.antiPatternsPath)) {
    antiPatterns = fs.readFileSync(options.antiPatternsPath, 'utf-8');
  }

  // Replace template variables
  let prompt = template
    .replace('{projectType}', options.projectType)
    .replace('{platform}', options.platform)
    .replace('{targetAudience}', options.targetAudience || 'general')
    .replace('{designTokens}', designTokens)
    .replace('{rubricCriteria}', rubricCriteria + '\n\nPenalties:\n' + penaltiesDef)
    .replace('{selectedGuidelines}', guidelines.join('\n'))
    .replace('{goldenSample}', goldenSample)
    .replace('{antiPatterns}', antiPatterns);

  return prompt;
}

// ============================================================
// LLM Call via Claude CLI
// ============================================================

interface JudgeResponse {
  criteria: Array<{
    name: string;
    score: number;
    reasoning: string;
    suggestion: string | null;
  }>;
  penalties: Array<{
    name: string;
    applied: boolean;
    deduction: number;
    evidence: string;
  }>;
  weightedScore: number;
  finalScore: number;
  summary: string;
  topFindings: string[];
}

function callJudge(
  screenshotPath: string,
  systemPrompt: string,
  model: string = 'sonnet'
): { response: JudgeResponse | null; rawText: string; cost: number } {
  const modelId = model === 'opus' ? 'claude-opus-4-6' : 'claude-sonnet-4-6';

  // Write prompt to temp file
  const promptFile = `/tmp/ux-qat-judge-prompt-${Date.now()}.md`;
  fs.writeFileSync(promptFile, systemPrompt, 'utf-8');

  try {
    // Use Claude CLI to send screenshot + prompt
    // The prompt instructs to output JSON
    const userMessage = `Analyze this screenshot and provide your evaluation in the JSON format specified in the system prompt. Screenshot is attached as an image.`;

    const result = execSync(
      `claude -m "${modelId}" --output-format json -p "$(cat ${promptFile})\n\n${userMessage}" --image "${screenshotPath}" 2>/dev/null`,
      {
        encoding: 'utf-8',
        timeout: 120_000,
        maxBuffer: 10 * 1024 * 1024,
      }
    );

    // Clean up
    try { fs.unlinkSync(promptFile); } catch { /* ignore */ }

    // Parse response — extract JSON from potential markdown wrapping
    let jsonText = result.trim();

    // Handle claude CLI JSON output format
    try {
      const cliOutput = JSON.parse(jsonText);
      if (cliOutput.result) {
        jsonText = cliOutput.result;
      }
    } catch {
      // Not CLI JSON wrapper — raw text
    }

    // Extract JSON block if wrapped in markdown
    const jsonMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonText) as JudgeResponse;

    // Estimate cost (~$0.05-0.10 per screenshot with Sonnet)
    const estimatedCost = model === 'opus' ? 0.15 : 0.07;

    return { response: parsed, rawText: result, cost: estimatedCost };
  } catch (err) {
    // Clean up
    try { fs.unlinkSync(promptFile); } catch { /* ignore */ }

    log('error', 'L3', `Judge call failed: ${err instanceof Error ? err.message : String(err)}`);
    return { response: null, rawText: '', cost: 0 };
  }
}

// ============================================================
// L3 Runner
// ============================================================

export function runL3(
  capturePoint: CapturePoint,
  options: L3Options
): L3Result {
  const findings: Finding[] = [];
  const model = options.model || 'sonnet';

  log('info', 'L3', `Judging ${capturePoint.screen}@${capturePoint.breakpoint}x${capturePoint.theme} (model: ${model})`);

  // Verify screenshot exists
  if (!fs.existsSync(capturePoint.screenshotPath)) {
    log('error', 'L3', `Screenshot not found: ${capturePoint.screenshotPath}`);
    return {
      screen: capturePoint.screen,
      breakpoint: capturePoint.breakpoint,
      theme: capturePoint.theme,
      passed: false,
      judgeResult: null,
      findings: [{
        screen: capturePoint.screen,
        layer: 'L3',
        category: 'PERCEPTION',
        severity: 'P2',
        shortCircuited: false,
        description: 'Screenshot not found — cannot evaluate',
        evidence: capturePoint.screenshotPath,
      }],
      cost: 0,
    };
  }

  // Assemble prompt
  const systemPrompt = assemblePrompt(capturePoint, options);

  // Call Judge
  const { response, rawText, cost } = callJudge(
    capturePoint.screenshotPath,
    systemPrompt,
    model
  );

  if (!response) {
    return {
      screen: capturePoint.screen,
      breakpoint: capturePoint.breakpoint,
      theme: capturePoint.theme,
      passed: false,
      judgeResult: null,
      findings: [{
        screen: capturePoint.screen,
        layer: 'L3',
        category: 'PERCEPTION',
        severity: 'P2',
        shortCircuited: false,
        description: 'L3 Judge call failed — no response',
      }],
      cost: 0,
      rawResponse: rawText,
    };
  }

  // Map response to typed results
  const criteriaResults: UxJudgeCriterionResult[] = response.criteria.map(c => {
    // Find weight from rubric
    const rubricCriterion = options.rubric.criteria.find(rc => rc.name === c.name);
    return {
      name: c.name,
      score: Math.max(1, Math.min(10, c.score)),
      weight: rubricCriterion?.weight || (1 / response.criteria.length),
      reasoning: c.reasoning,
      suggestion: c.suggestion || undefined,
    };
  });

  // Evaluate penalties against rubric definitions
  const penaltyResults = evaluatePenalties(options.rubric, response);

  // Assemble final result
  const judgeResult = assembleJudgeResult(
    capturePoint.screen,
    capturePoint.breakpoint,
    capturePoint.theme,
    criteriaResults,
    penaltyResults
  );

  // Generate findings from low scores
  const minScore = options.rubric.l4Thresholds?.designTokenCompliance
    ? 6.0
    : 6.0; // default min acceptable

  if (judgeResult.finalScore < minScore) {
    findings.push({
      screen: capturePoint.screen,
      layer: 'L3',
      category: 'PERCEPTION',
      severity: judgeResult.finalScore < 4 ? 'P1' : 'P2',
      score: judgeResult.finalScore,
      shortCircuited: false,
      description: `L3 score below threshold: ${judgeResult.finalScore}/${minScore}`,
      evidence: response.summary || `Top findings: ${response.topFindings?.join('; ') || 'N/A'}`,
      screenshotPath: capturePoint.screenshotPath,
      suggestedAction: criteriaResults
        .filter(c => c.suggestion)
        .slice(0, 3)
        .map(c => c.suggestion)
        .join('; '),
    });
  }

  // Add penalty findings
  for (const p of penaltyResults) {
    findings.push({
      screen: capturePoint.screen,
      layer: 'L3',
      category: 'PERCEPTION',
      severity: Math.abs(p.deduction) >= 3 ? 'P1' : 'P2',
      shortCircuited: false,
      description: `Penalty: ${p.name} (${p.deduction})`,
      evidence: p.evidence,
      screenshotPath: capturePoint.screenshotPath,
    });
  }

  const passed = judgeResult.finalScore >= minScore;

  if (passed) {
    logPass('L3', `${capturePoint.screen}@${capturePoint.breakpoint}: score=${judgeResult.finalScore}`);
  } else {
    logFail('L3', `${capturePoint.screen}@${capturePoint.breakpoint}: score=${judgeResult.finalScore} < ${minScore}`);
  }

  return {
    screen: capturePoint.screen,
    breakpoint: capturePoint.breakpoint,
    theme: capturePoint.theme,
    passed,
    judgeResult,
    findings,
    cost,
    rawResponse: rawText,
  };
}

// ============================================================
// Inline Template (fallback)
// ============================================================

function getInlineTemplate(): string {
  return `# L3 Visual Judge

## Context
Type: {projectType} | Platform: {platform} | Audience: {targetAudience}

## Design Tokens
{designTokens}

## Rubric
{rubricCriteria}

## Guidelines
{selectedGuidelines}

## Instructions
Evaluate the screenshot using the rubric above.
For each criterion provide: score (1-10), reasoning (specific visual evidence), suggestion (if score < 8).
Apply penalties when conditions are met.
Output JSON with: criteria[], penalties[], weightedScore, finalScore, summary, topFindings[].

## Golden Sample
{goldenSample}

## Anti-Patterns
{antiPatterns}
`;
}
