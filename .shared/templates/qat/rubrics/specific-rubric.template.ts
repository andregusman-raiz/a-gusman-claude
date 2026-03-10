/**
 * QAT v2 Rubric Template — Rubrica Especifica
 *
 * Rubricas especificas avaliam output no contexto do DOMINIO e da PERSONA.
 * Cada cenario importante deve ter sua propria rubrica.
 *
 * Copie e customize para cada cenario/dominio:
 *   tests/qat/rubrics/v1/chat-educacional.ts
 *   tests/qat/rubrics/v1/report-executivo.ts
 *   etc.
 */

// ============================================================
// Interfaces v2
// ============================================================

export interface QatCriterionDef {
  /** Nome do criterio (snake-case, ex: 'adequacao-nivel') */
  name: string;
  /** Peso relativo (0.0-1.0, default 1.0) */
  weight: number;
  /** Descricao para o Judge: o que avaliar */
  description: string;
  /** Escala detalhada por faixa de score */
  scale: Record<string, string>;
}

export interface QatPenalty {
  /** Nome da penalidade (snake-case) */
  name: string;
  /** Condicao que ativa a penalidade */
  condition: string;
  /** Deducao numerica (ex: -3) */
  deduction: number;
  /** Criterio afetado ('all' ou nome do criterio) */
  appliesTo: string;
}

export interface QatRubricV2 {
  /** ID unico da rubrica (ex: 'chat-educacional') */
  id: string;
  /** Versao semantica (ex: '1.0', '1.1', '2.0') */
  version: string;
  /** Tipo base de output (chat, image, presentation, etc.) */
  type: string;
  /** Dominio especifico (educacao, juridico, saude, etc.) */
  domain: string;
  /** Criterios de avaliacao (3-6 recomendado) */
  criteria: QatCriterionDef[];
  /** Penalidades que reduzem score independente dos criterios */
  penalties: QatPenalty[];
  /** Path para golden sample (opcional) */
  goldenSamplePath?: string;
  /** Path para anti-patterns (opcional) */
  antiPatternsPath?: string;
}

// ============================================================
// CUSTOMIZE: Defina sua rubrica abaixo
// ============================================================

export const rubric: QatRubricV2 = {
  id: 'CUSTOMIZE-rubric-id',
  version: '1.0',
  type: 'chat', // chat | image | presentation | chart | etc.
  domain: 'CUSTOMIZE-domain', // educacao | juridico | saude | etc.

  criteria: [
    {
      name: 'CUSTOMIZE-criterio-1',
      weight: 1.0,
      description: 'CUSTOMIZE: O que este criterio avalia?',
      scale: {
        '1-2': 'CUSTOMIZE: O que significa score 1-2 para este criterio',
        '3-4': 'CUSTOMIZE: O que significa score 3-4',
        '5': 'CUSTOMIZE: O que significa score 5 (abaixo do aceitavel)',
        '6-7': 'CUSTOMIZE: O que significa score 6-7 (aceitavel/bom)',
        '8-9': 'CUSTOMIZE: O que significa score 8-9 (muito bom)',
        '10': 'CUSTOMIZE: O que significa score 10 (excelente)',
      },
    },
    {
      name: 'CUSTOMIZE-criterio-2',
      weight: 1.0,
      description: 'CUSTOMIZE: O que este criterio avalia?',
      scale: {
        '1-2': 'CUSTOMIZE',
        '3-4': 'CUSTOMIZE',
        '5': 'CUSTOMIZE',
        '6-7': 'CUSTOMIZE',
        '8-9': 'CUSTOMIZE',
        '10': 'CUSTOMIZE',
      },
    },
    {
      name: 'CUSTOMIZE-criterio-3',
      weight: 0.8, // Peso menor se criterio e menos importante
      description: 'CUSTOMIZE: O que este criterio avalia?',
      scale: {
        '1-2': 'CUSTOMIZE',
        '3-4': 'CUSTOMIZE',
        '5': 'CUSTOMIZE',
        '6-7': 'CUSTOMIZE',
        '8-9': 'CUSTOMIZE',
        '10': 'CUSTOMIZE',
      },
    },
  ],

  penalties: [
    {
      name: 'idioma-errado',
      condition: 'Idioma da resposta diferente do idioma do prompt',
      deduction: -3,
      appliesTo: 'all',
    },
    {
      name: 'CUSTOMIZE-penalty',
      condition: 'CUSTOMIZE: Condicao que ativa penalidade',
      deduction: -2,
      appliesTo: 'CUSTOMIZE-criterio-1',
    },
  ],

  goldenSamplePath: 'knowledge/golden-samples/CUSTOMIZE.md',
  antiPatternsPath: 'knowledge/anti-patterns/CUSTOMIZE.md',
};

// ============================================================
// Helper: Gerar prompt do Judge a partir da rubrica
// ============================================================

const BASE_JUDGE_INSTRUCTION = `
Voce e um avaliador de qualidade especialista no dominio: ${rubric.domain}.
Avalie o output usando os criterios fornecidos.

Para CADA criterio, atribua um score de 1 a 10 seguindo a escala detalhada.
O overallScore deve ser a media ponderada (pesos indicados por criterio).

Retorne APENAS JSON valido:
{
  "criteria": [
    { "name": "nome", "score": N, "feedback": "explicacao breve" }
  ],
  "overallScore": N.N,
  "summary": "avaliacao geral em 1-2 frases"
}
`.trim();

export function buildJudgePrompt(
  rubricDef: QatRubricV2,
  goldenSample?: string,
  antiPatterns?: string
): string {
  let prompt = BASE_JUDGE_INSTRUCTION + '\n\n';

  // Criterios com escalas
  prompt += '## Criterios de Avaliacao\n\n';
  for (const c of rubricDef.criteria) {
    prompt += `### ${c.name} (peso: ${c.weight})\n`;
    prompt += `${c.description}\n\n`;
    prompt += `Escala:\n`;
    for (const [range, desc] of Object.entries(c.scale)) {
      prompt += `- **${range}**: ${desc}\n`;
    }
    prompt += '\n';
  }

  // Penalidades
  if (rubricDef.penalties.length > 0) {
    prompt += '## Penalidades\n\n';
    for (const p of rubricDef.penalties) {
      const target = p.appliesTo === 'all' ? 'todos os criterios' : p.appliesTo;
      prompt += `- SE "${p.condition}" ENTAO ${p.deduction} em ${target}\n`;
    }
    prompt += '\n';
  }

  // Golden sample
  if (goldenSample) {
    prompt += '## Referencia de Qualidade (Golden Sample)\n';
    prompt += 'Este e um exemplo de output EXCELENTE (score 9-10) para este cenario:\n\n';
    prompt += goldenSample + '\n\n';
    prompt += 'Use como referencia de calibracao. O output avaliado nao precisa ser identico.\n\n';
  }

  // Anti-patterns
  if (antiPatterns) {
    prompt += '## Anti-patterns (outputs que DEVEM receber nota baixa)\n\n';
    prompt += antiPatterns + '\n\n';
  }

  return prompt;
}
