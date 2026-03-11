/**
 * QAT-Benchmark Configuration
 *
 * Copie este arquivo para `tests/qat-benchmark/qat-benchmark.config.ts` no seu projeto
 * e ajuste os valores para o seu dominio.
 *
 * Uso: import { benchmarkConfig } from './qat-benchmark.config';
 */

// --- Types ---

export type DimensionId = 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6' | 'D7' | 'D8';

export interface DimensionWeight {
  id: DimensionId;
  name: string;
  weight: number; // 0-1, soma de todos = 1.0
  criteria: string[];
}

export interface BenchmarkScenario {
  /** ID unico: BM-XX (fixed) ou BM-RXXX (rotatable) */
  id: string;
  name: string;
  category: 'fixed' | 'rotatable';
  /** Prompt enviado ao sistema */
  prompt: string;
  /** System prompt (se aplicavel) */
  systemPrompt?: string;
  /** Contexto adicional (docs, historico) */
  context?: string;
  /** Dimensoes a avaliar neste cenario */
  dimensions: DimensionId[];
  /** Formato esperado do output */
  expectedFormat?: 'markdown' | 'json' | 'text' | 'code' | 'list';
  /** Idioma esperado */
  expectedLanguage?: string;
  /** Timeout em ms */
  timeoutMs: number;
  /** Tags para agrupamento */
  tags: string[];
  /** Habilitado */
  enabled: boolean;
  /** Checks funcionais L4 */
  functionalChecks?: {
    mustContain?: string[];
    mustNotContain?: string[];
    minLength?: number;
    maxLength?: number;
  };
  /** Path para rubrica especifica (se diferente da default por dimensao) */
  rubricPath?: string;
  /** Path para golden sample */
  goldenSamplePath?: string;
}

export type JuryMode = 'full' | 'dual-position' | 'single';

export interface JudgeConfig {
  model: string;
  apiKeyEnvVar: string;
  provider: 'anthropic' | 'openai' | 'google';
}

export interface BenchmarkConfig {
  /** URL base da aplicacao deployada */
  baseUrl: string;

  /** Configuracao do adapter da app */
  appAdapter: {
    type: 'playwright';
    /** Seletor CSS/testid do input de chat */
    inputSelector: string;
    /** Seletor CSS/testid do output de chat */
    outputSelector: string;
    /** Auth storage state */
    authStorageState: string;
    /** Tempo extra apos output aparecer (ms) */
    settleTimeMs: number;
  };

  /** Configuracao do adapter baseline */
  baselineAdapter: {
    type: 'claude-api';
    model: string;
    apiKeyEnvVar: string;
    maxTokens: number;
  };

  /** Configuracao do Judge Jury */
  jury: {
    mode: JuryMode;
    judges: JudgeConfig[];
    /** Timeout por chamada de judge (ms) */
    judgeTimeoutMs: number;
    /** Retry se judge falhar */
    retryCount: number;
  };

  /** 8 dimensoes com pesos */
  dimensions: DimensionWeight[];

  /** Score minimo para PASS (1-10) */
  passThreshold: number;

  /** Parity minimo para considerar aceitavel */
  parityThreshold: number;

  /** Diretorio para salvar resultados */
  resultsDir: string;

  /** Path para knowledge base */
  knowledgePath: string;

  /** Anti-contaminacao */
  antiContamination: {
    /** Percentual de cenarios fixos (0-1) */
    fixedRatio: number;
    /** Total de cenarios por run */
    targetScenariosPerRun: number;
  };

  /** Cenarios */
  scenarios: BenchmarkScenario[];
}

// --- Default Dimensions ---

export const DEFAULT_DIMENSIONS: DimensionWeight[] = [
  {
    id: 'D1', name: 'Content Accuracy', weight: 0.15,
    criteria: ['factual_correctness', 'no_hallucination', 'source_grounding', 'precision'],
  },
  {
    id: 'D2', name: 'Teaching Quality', weight: 0.15,
    criteria: ['scaffolding', 'level_adaptation', 'examples', 'engagement'],
  },
  {
    id: 'D3', name: 'Agentic Capability', weight: 0.15,
    criteria: ['tool_use', 'multi_step_reasoning', 'planning', 'context_awareness'],
  },
  {
    id: 'D4', name: 'Calibration', weight: 0.10,
    criteria: ['uncertainty_expression', 'knows_limits', 'asks_clarification', 'confidence_accuracy'],
  },
  {
    id: 'D5', name: 'Safety', weight: 0.10,
    criteria: ['harmful_rejection', 'bias_avoidance', 'privacy_respect', 'guardrails'],
  },
  {
    id: 'D6', name: 'Efficiency', weight: 0.10,
    criteria: ['latency', 'conciseness', 'token_efficiency', 'cost'],
  },
  {
    id: 'D7', name: 'Robustness', weight: 0.10,
    criteria: ['typo_handling', 'ambiguity_resolution', 'adversarial_resistance', 'edge_cases'],
  },
  {
    id: 'D8', name: 'Response UX', weight: 0.15,
    criteria: ['formatting', 'structure', 'tone', 'language_match', 'readability'],
  },
];

// --- Config Instance ---

/**
 * CUSTOMIZE: Ajuste estes valores para o seu projeto.
 * Env vars sobrescrevem os defaults.
 */
export const benchmarkConfig: BenchmarkConfig = {
  baseUrl: process.env.QAT_BENCHMARK_BASE_URL ?? 'http://localhost:3000',

  appAdapter: {
    type: 'playwright',
    inputSelector: '[data-testid="chat-input"]',    // CUSTOMIZE
    outputSelector: '[data-testid="chat-output"]',  // CUSTOMIZE
    authStorageState: 'tests/e2e/.auth/user.json',
    settleTimeMs: 2000,
  },

  baselineAdapter: {
    type: 'claude-api',
    model: process.env.QAT_BENCHMARK_BASELINE_MODEL ?? 'claude-opus-4-6',
    apiKeyEnvVar: 'QAT_BENCHMARK_ANTHROPIC_KEY',
    maxTokens: 4096,
  },

  jury: {
    mode: (process.env.QAT_BENCHMARK_JURY_MODE as JuryMode) ?? 'dual-position',
    judges: [
      { model: 'claude-opus-4-6', apiKeyEnvVar: 'QAT_BENCHMARK_ANTHROPIC_KEY', provider: 'anthropic' },
      { model: 'gpt-4o', apiKeyEnvVar: 'QAT_BENCHMARK_OPENAI_KEY', provider: 'openai' },
      { model: 'gemini-2.5-pro', apiKeyEnvVar: 'QAT_BENCHMARK_GOOGLE_KEY', provider: 'google' },
    ],
    judgeTimeoutMs: 60_000,
    retryCount: 2,
  },

  dimensions: DEFAULT_DIMENSIONS,

  passThreshold: Number(process.env.QAT_BENCHMARK_PASS_THRESHOLD) || 6,
  parityThreshold: Number(process.env.QAT_BENCHMARK_PARITY_THRESHOLD) || 0.85,

  resultsDir: 'tests/qat-benchmark/results',
  knowledgePath: 'tests/qat-benchmark/knowledge',

  antiContamination: {
    fixedRatio: 0.3,
    targetScenariosPerRun: 40,
  },

  scenarios: [
    // CUSTOMIZE: Adicione cenarios do seu projeto.
    // Cenarios fixos (BM-01 a BM-12) + rotaveis (BM-R001+)
    // Ver templates em scenarios/fixed/ e scenarios/rotatable/
  ],
};
