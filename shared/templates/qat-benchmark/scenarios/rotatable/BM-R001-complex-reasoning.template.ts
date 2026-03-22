/**
 * BM-R001 — Complex Reasoning: Multi-step math problem
 *
 * Rotatable scenario (70% pool). Tests agentic capability and accuracy.
 * Can be rotated out in future runs — part of anti-contamination pool.
 */

import type { BenchmarkScenario } from '../../qat-benchmark.config.template';

export const BM_R001: BenchmarkScenario = {
  id: 'BM-R001',
  name: 'Complex Reasoning: Problema de matematica multi-step',
  category: 'rotatable',
  prompt: 'Uma escola tem 450 alunos. 60% estao no ensino fundamental e o restante no ensino medio. No ensino fundamental, 40% praticam esportes. No ensino medio, 55% praticam esportes. Quantos alunos praticam esportes no total? Mostre o raciocinio passo a passo.',
  dimensions: ['D1', 'D3', 'D6', 'D8'],
  expectedFormat: 'markdown',
  expectedLanguage: 'pt-BR',
  timeoutMs: 30_000,
  tags: ['reasoning', 'math', 'multi-step', 'pt-BR'],
  enabled: true,
  functionalChecks: {
    mustContain: ['207', 'passo'],
    minLength: 150,
  },
};
