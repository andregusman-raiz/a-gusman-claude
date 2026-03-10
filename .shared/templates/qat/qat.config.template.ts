/**
 * QAT Configuration
 *
 * Copie este arquivo para `tests/qat/qat.config.ts` no seu projeto
 * e ajuste os valores para o seu dominio.
 *
 * Uso: import { qatConfig } from './qat.config';
 */

export interface QatScenario {
  /** ID unico do cenario (ex: 'QAT-01') */
  id: string;
  /** Nome descritivo do cenario */
  name: string;
  /** Tipo de output esperado — determina qual rubrica usar */
  type:
    | 'chat'
    | 'image'
    | 'image-edit'
    | 'presentation'
    | 'video'
    | 'chart'
    | 'infographic'
    | 'automation'
    | 'plus-menu'
    | 'cli';
  /** Timeout em ms para aguardar geracao do output */
  timeoutMs: number;
  /** Criterios de avaliacao (nomes dos criterios da rubrica) */
  criteria: string[];
  /** Habilitado? Cenarios desabilitados sao skippados */
  enabled: boolean;
  // --- V2 fields ---
  /** Persona do usuario (ex: 'Professor de ensino fundamental') */
  persona?: string;
  /** Input realista do usuario */
  userInput?: string;
  /** Contexto adicional (documentos carregados, configuracoes, etc.) */
  context?: string;
  /** Path para rubrica especifica (v2). Se ausente, usa rubrica generica por type */
  rubricPath?: string;
  /** Path para golden sample de referencia */
  goldenSamplePath?: string;
  /** Path para anti-patterns de referencia */
  antiPatternsPath?: string;
  /** Categoria para agrupamento (ex: 'core-journey', 'edge-case', 'regression') */
  category?: 'core-journey' | 'quality-gate' | 'regression' | 'edge-case' | 'comparative';
  /** Criterios de negocio programaticos (L4) */
  businessCriteria?: {
    mustContain?: string[];
    mustNotContain?: string[];
    minLength?: number;
    maxLength?: number;
  };
}

export interface QatConfig {
  /** URL base da aplicacao deployada */
  baseUrl: string;
  /** API key para o modelo Judge (Claude) */
  judgeApiKey: string;
  /** Modelo a usar como Judge */
  judgeModel: string;
  /** Score minimo para considerar cenario como PASS (1-10) */
  passThreshold: number;
  /** Timeout global em ms (fallback se cenario nao define) */
  defaultTimeoutMs: number;
  /** Path do storage state de auth (reutilizar do E2E) */
  authStorageState: string;
  /** Diretorio para salvar resultados */
  resultsDir: string;
  /** Lista de cenarios QAT */
  scenarios: QatScenario[];
  // --- V2 fields ---
  /** Path para diretorio de baselines (knowledge base) */
  baselinePath?: string;
  /** Path para diretorio de knowledge (golden samples, anti-patterns, failure patterns) */
  knowledgePath?: string;
  /** Habilitar validacao em 4 camadas (L1→L4). Default: true */
  enableLayeredValidation?: boolean;
  /** Habilitar classificacao automatica de falhas. Default: true */
  enableFailureClassification?: boolean;
  /** Habilitar criacao automatica de GitHub Issues para P0/P1. Default: false */
  enableAutoIssues?: boolean;
  /** GitHub repo para auto-issues (ex: 'owner/repo') */
  githubRepo?: string;
}

/**
 * CUSTOMIZE: Ajuste estes valores para o seu projeto.
 * Env vars sobrescrevem os defaults.
 */
export const qatConfig: QatConfig = {
  baseUrl: process.env.QAT_BASE_URL ?? 'http://localhost:3000',
  judgeApiKey: process.env.QAT_JUDGE_API_KEY ?? process.env.ANTHROPIC_API_KEY ?? '',
  judgeModel: process.env.QAT_JUDGE_MODEL ?? 'claude-sonnet-4-20250514',
  passThreshold: Number(process.env.QAT_PASS_THRESHOLD) || 6,
  defaultTimeoutMs: 120_000,
  authStorageState: 'tests/e2e/.auth/user.json',
  resultsDir: 'tests/qat/results',

  /**
   * CUSTOMIZE: Defina os cenarios do seu projeto.
   * Cada cenario deve ter um arquivo correspondente em scenarios/.
   */
  scenarios: [
    // Exemplo — remova e substitua pelos cenarios do seu projeto:
    // {
    //   id: 'QAT-01',
    //   name: 'Chat: pergunta simples',
    //   type: 'chat',
    //   timeoutMs: 60_000,
    //   criteria: ['completude', 'corretude', 'estrutura', 'utilidade'],
    //   enabled: true,
    // },
    // {
    //   id: 'QAT-02',
    //   name: 'Content Studio: gerar imagem',
    //   type: 'image',
    //   timeoutMs: 120_000,
    //   criteria: ['relevancia', 'qualidade-visual', 'composicao'],
    //   enabled: true,
    // },
  ],
};
