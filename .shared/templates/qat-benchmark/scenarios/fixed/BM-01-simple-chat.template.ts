/**
 * BM-01 — Simple Chat: Basic question in Portuguese
 *
 * Fixed scenario (30% core). Tests basic chat quality, language match, formatting.
 * Part of the anti-contamination fixed set — NEVER modify this scenario.
 */

import type { BenchmarkScenario } from '../../qat-benchmark.config.template';

export const BM_01: BenchmarkScenario = {
  id: 'BM-01',
  name: 'Simple Chat: Explicar fotossintese',
  category: 'fixed',
  prompt: 'Explique o processo de fotossintese de forma simples, como se estivesse explicando para um aluno do 5o ano do ensino fundamental.',
  systemPrompt: undefined, // Use app default
  context: undefined,
  dimensions: ['D1', 'D2', 'D4', 'D8'],
  expectedFormat: 'markdown',
  expectedLanguage: 'pt-BR',
  timeoutMs: 30_000,
  tags: ['chat', 'education', 'simple', 'pt-BR'],
  enabled: true,
  functionalChecks: {
    mustContain: ['luz', 'planta'],
    mustNotContain: ['as a language model'],
    minLength: 100,
    maxLength: 3000,
  },
};
