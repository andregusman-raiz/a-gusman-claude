/**
 * Rule-Based Scorer — L1 (Smoke) + L2 (Structural) deterministic checks
 *
 * Executes before LLM Judge. Short-circuits if L1 fails.
 */

export interface RuleCheck {
  name: string;
  passed: boolean;
  detail: string;
  severity: 'critical' | 'major' | 'minor';
}

export interface RuleBasedResult {
  layer: 'L1' | 'L2';
  passed: boolean;
  checks: RuleCheck[];
  shortCircuit: boolean;
  penalty: number; // 0-3 points deducted from L3 score
}

// --- L1: Smoke (Infrastructure) ---

export function runL1Checks(output: string, error?: string): RuleBasedResult {
  const checks: RuleCheck[] = [];

  checks.push({
    name: 'output_not_empty',
    passed: output.length > 0,
    detail: output.length > 0 ? `Length: ${output.length}` : 'Empty output',
    severity: 'critical',
  });

  checks.push({
    name: 'no_runtime_error',
    passed: !error,
    detail: error ?? 'No errors',
    severity: 'critical',
  });

  const errorPatterns = [/internal server error/i, /500 error/i, /something went wrong/i, /page not found/i, /404/];
  const hasErrorPage = errorPatterns.some(p => p.test(output));
  checks.push({
    name: 'not_error_page',
    passed: !hasErrorPage,
    detail: hasErrorPage ? 'Detected error page content' : 'OK',
    severity: 'critical',
  });

  const criticalFailed = checks.some(c => c.severity === 'critical' && !c.passed);
  return {
    layer: 'L1',
    passed: !criticalFailed,
    checks,
    shortCircuit: criticalFailed,
    penalty: criticalFailed ? 10 : 0,
  };
}

// --- L2: Structural ---

export function runL2Checks(
  output: string,
  scenario: { expectedLanguage?: string; expectedFormat?: string; functionalChecks?: { mustContain?: string[]; mustNotContain?: string[]; minLength?: number; maxLength?: number } }
): RuleBasedResult {
  const checks: RuleCheck[] = [];
  let penalty = 0;

  // Language match
  if (scenario.expectedLanguage) {
    const langPatterns: Record<string, RegExp[]> = {
      'pt-BR': [/[àáâãéêíóôõúüç]/i, /\b(que|para|com|uma?|os?|as?)\b/i],
      'en': [/\b(the|and|for|that|with|this)\b/i],
    };
    const patterns = langPatterns[scenario.expectedLanguage];
    if (patterns) {
      const matchCount = patterns.filter(p => p.test(output)).length;
      const passed = matchCount >= 1;
      checks.push({ name: 'language_match', passed, detail: passed ? `Detected ${scenario.expectedLanguage}` : `Language mismatch`, severity: 'major' });
      if (!passed) penalty += 2;
    }
  }

  // Length bounds
  if (scenario.functionalChecks?.minLength) {
    const passed = output.length >= scenario.functionalChecks.minLength;
    checks.push({ name: 'min_length', passed, detail: `${output.length} vs min ${scenario.functionalChecks.minLength}`, severity: 'major' });
    if (!passed) penalty += 1;
  }

  // Must contain / must not contain
  for (const term of scenario.functionalChecks?.mustContain ?? []) {
    const passed = output.toLowerCase().includes(term.toLowerCase());
    checks.push({ name: `must_contain_${term}`, passed, detail: passed ? `Contains "${term}"` : `Missing "${term}"`, severity: 'major' });
    if (!passed) penalty += 1;
  }

  for (const term of scenario.functionalChecks?.mustNotContain ?? []) {
    const passed = !output.toLowerCase().includes(term.toLowerCase());
    checks.push({ name: `must_not_contain_${term}`, passed, detail: passed ? 'OK' : `Contains forbidden "${term}"`, severity: 'major' });
    if (!passed) penalty += 1.5;
  }

  const hasMajorFail = checks.some(c => c.severity === 'major' && !c.passed);
  return {
    layer: 'L2',
    passed: !hasMajorFail,
    checks,
    shortCircuit: false,
    penalty: Math.min(3, penalty),
  };
}
