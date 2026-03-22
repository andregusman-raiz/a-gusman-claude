/**
 * QAT Rubrics — Rubricas de avaliacao por tipo de entregavel
 *
 * Copie para `tests/qat/fixtures/rubrics.ts` no seu projeto.
 * CUSTOMIZE: Ajuste os criterios e prompts para o dominio do seu projeto.
 *
 * Cada rubrica define:
 * - criteria: nomes dos criterios avaliados
 * - prompt: instrucao para o Judge avaliar o output
 */

export interface QatRubric {
  /** Tipo de output que esta rubrica avalia */
  type: string;
  /** Nomes dos criterios (devem coincidir com os cenarios em qat.config.ts) */
  criteria: string[];
  /** Prompt enviado ao Judge junto com o output */
  prompt: string;
}

/**
 * Prompt base compartilhado por todas as rubricas.
 * Instrui o Judge a retornar JSON estruturado.
 */
const BASE_JUDGE_INSTRUCTION = `
Voce e um avaliador de qualidade. Avalie o output apresentado usando os criterios fornecidos.

Para CADA criterio, atribua um score de 1 a 10:
- 1-2: Inutilizavel (vazio, irrelevante, corrompido)
- 3-4: Muito fraco (parcial, impreciso, mal formatado)
- 5: Abaixo do aceitavel
- 6: Aceitavel (threshold minimo)
- 7-8: Bom (atende expectativas)
- 9-10: Excelente (supera expectativas)

Retorne APENAS um JSON valido no seguinte formato (sem markdown, sem explicacao fora do JSON):
{
  "criteria": [
    { "name": "nome_do_criterio", "score": N, "feedback": "explicacao breve" }
  ],
  "overallScore": N.N,
  "summary": "avaliacao geral em 1-2 frases"
}

O overallScore deve ser a media ponderada dos criterios (todos com peso igual).
`.trim();

/**
 * CUSTOMIZE: Ajuste as rubricas para o dominio do seu projeto.
 * Adicione/remova tipos conforme necessario.
 */
export const rubrics: Record<string, QatRubric> = {
  chat: {
    type: 'chat',
    criteria: ['completude', 'corretude', 'estrutura', 'utilidade'],
    prompt: `${BASE_JUDGE_INSTRUCTION}

## Criterios para avaliacao de CHAT:

1. **completude** (1-10): A resposta cobre todos os aspectos da pergunta? Faltou algo importante?
2. **corretude** (1-10): As informacoes estao corretas e atualizadas? Ha erros factuais?
3. **estrutura** (1-10): A resposta esta bem organizada? Usa paragrafos, listas, headers quando apropriado?
4. **utilidade** (1-10): A resposta e util para o usuario? Resolve o problema ou responde a pergunta?

## Regras adicionais:
- Se a pergunta foi em portugues e a resposta em outro idioma, penalize completude e utilidade (-3 pontos cada)
- Se a resposta e generica demais (poderia servir para qualquer pergunta), penalize utilidade (-2)
- Se a resposta contem alucinacoes obvias, penalize corretude (-4)`,
  },

  image: {
    type: 'image',
    criteria: ['relevancia', 'qualidade-visual', 'composicao'],
    prompt: `${BASE_JUDGE_INSTRUCTION}

## Criterios para avaliacao de IMAGEM GERADA:

1. **relevancia** (1-10): A imagem corresponde ao que foi solicitado? O tema, objetos, cenario sao corretos?
2. **qualidade-visual** (1-10): A imagem tem resolucao adequada? Ha artefatos, distorcoes, borrao excessivo?
3. **composicao** (1-10): A composicao e agradavel? Proporcoes corretas, iluminacao coerente, sem elementos estranhos?

## Regras adicionais:
- Se houver texto na imagem com erros ortograficos, penalize qualidade-visual (-2)
- Se houver watermark ou artefatos de geracao visivel, penalize qualidade-visual (-3)
- Se a imagem estiver completamente irrelevante ao prompt, score geral maximo = 3`,
  },

  'image-edit': {
    type: 'image-edit',
    criteria: ['fidelidade', 'qualidade', 'coerencia'],
    prompt: `${BASE_JUDGE_INSTRUCTION}

## Criterios para avaliacao de EDICAO DE IMAGEM:

1. **fidelidade** (1-10): A edicao foi aplicada corretamente conforme solicitado?
2. **qualidade** (1-10): A area editada tem qualidade visual compativel com o restante da imagem?
3. **coerencia** (1-10): A edicao e coerente com o contexto visual? Iluminacao, perspectiva, cores se harmonizam?

## Regras adicionais:
- Se a edicao nao foi aplicada (imagem inalterada), score geral maximo = 2
- Se a edicao introduziu artefatos visiveis na borda da edicao, penalize qualidade (-3)`,
  },

  presentation: {
    type: 'presentation',
    criteria: ['estrutura', 'conteudo', 'design', 'coerencia'],
    prompt: `${BASE_JUDGE_INSTRUCTION}

## Criterios para avaliacao de APRESENTACAO (PPTX):

1. **estrutura** (1-10): A apresentacao tem numero adequado de slides? Sequencia logica? Intro-corpo-conclusao?
2. **conteudo** (1-10): O conteudo e relevante, correto, e suficientemente detalhado?
3. **design** (1-10): O visual e profissional? Fontes legveis, cores harmonicas, imagens bem posicionadas?
4. **coerencia** (1-10): Os slides sao coerentes entre si? Mesmo estilo visual, tema consistente?

## Regras adicionais:
- Se a apresentacao tem apenas 1 slide quando mais eram esperados, penalize estrutura (-5)
- Se o conteudo e generado via lorem ipsum ou placeholder, penalize conteudo (-6)
- Se nao ha elementos visuais (apenas texto puro), penalize design (-3)`,
  },

  video: {
    type: 'video',
    criteria: ['relevancia', 'fluidez', 'qualidade-visual'],
    prompt: `${BASE_JUDGE_INSTRUCTION}

## Criterios para avaliacao de VIDEO:

1. **relevancia** (1-10): O video corresponde ao que foi solicitado? O tema e conteudo sao adequados?
2. **fluidez** (1-10): O video reproduz sem travamentos, cortes abruptos, ou transicoes quebradas?
3. **qualidade-visual** (1-10): A resolucao e adequada? Imagens claras, texto legivel, sem artefatos?

## Regras adicionais:
- Se o video tem duracao < 3s quando mais era esperado, penalize relevancia (-3)
- Se o video nao reproduz (corrompido), score geral = 1`,
  },

  chart: {
    type: 'chart',
    criteria: ['precisao-dados', 'clareza', 'legibilidade'],
    prompt: `${BASE_JUDGE_INSTRUCTION}

## Criterios para avaliacao de GRAFICO:

1. **precisao-dados** (1-10): Os dados apresentados estao corretos? Eixos com valores adequados? Proporcoes corretas?
2. **clareza** (1-10): O grafico comunica a informacao de forma clara? Tipo de grafico adequado para os dados?
3. **legibilidade** (1-10): Labels, legendas, e titulos sao legveis? Cores distinguiveis? Tamanho adequado?

## Regras adicionais:
- Se o grafico mostra dados incorretos ou inventados, penalize precisao-dados (-5)
- Se nao tem titulo ou labels nos eixos, penalize legibilidade (-3)`,
  },

  infographic: {
    type: 'infographic',
    criteria: ['design', 'conteudo', 'hierarquia-visual'],
    prompt: `${BASE_JUDGE_INSTRUCTION}

## Criterios para avaliacao de INFOGRAFICO:

1. **design** (1-10): O design e profissional e visualmente atraente? Cores, tipografia, icones adequados?
2. **conteudo** (1-10): As informacoes apresentadas sao relevantes, corretas, e bem sintetizadas?
3. **hierarquia-visual** (1-10): A hierarquia de informacao e clara? O olho segue um fluxo logico?

## Regras adicionais:
- Se o infografico e apenas texto formatado sem elementos visuais, penalize design (-4)
- Se a informacao e generica/placeholder, penalize conteudo (-5)`,
  },

  automation: {
    type: 'automation',
    criteria: ['completude', 'corretude-config', 'executabilidade'],
    prompt: `${BASE_JUDGE_INSTRUCTION}

## Criterios para avaliacao de AUTOMACAO:

1. **completude** (1-10): Todos os passos necessarios da automacao foram configurados?
2. **corretude-config** (1-10): As configuracoes (triggers, acoes, condicoes) estao corretas para o objetivo?
3. **executabilidade** (1-10): A automacao parece funcional? Sem referencias quebradas ou campos vazios obrigatorios?

## Regras adicionais:
- Se a automacao tem campos obrigatorios vazios, penalize executabilidade (-4)
- Se os triggers nao correspondem ao pedido, penalize corretude-config (-3)`,
  },

  'plus-menu': {
    type: 'plus-menu',
    criteria: ['completude', 'precisao', 'formatacao'],
    prompt: `${BASE_JUDGE_INSTRUCTION}

## Criterios para avaliacao de PLUS MENU (OCR/documento):

1. **completude** (1-10): O processamento capturou todo o conteudo do documento?
2. **precisao** (1-10): O texto extraido/processado esta correto? Sem erros de OCR ou interpretacao?
3. **formatacao** (1-10): A formatacao do output preserva a estrutura original? Paragrafos, tabelas, listas?

## Regras adicionais:
- Se o output esta vazio apesar de documento valido, score geral = 1
- Se ha muitos erros de OCR (>20% do texto), penalize precisao (-4)`,
  },

  cli: {
    type: 'cli',
    criteria: ['precisao', 'concisao', 'cobertura'],
    prompt: `${BASE_JUDGE_INSTRUCTION}

## Criterios para avaliacao de CLI (comando):

1. **precisao** (1-10): O resultado do comando esta correto? Informacoes fidedignas ao conteudo original?
2. **concisao** (1-10): O output e conciso e direto ao ponto? Sem repeticoes ou informacoes irrelevantes?
3. **cobertura** (1-10): O output cobre os pontos principais? Nenhum aspecto importante foi omitido?

## Regras adicionais:
- Se o output e uma copia literal do input sem processamento, penalize precisao (-5)
- Se o output e excessivamente longo (mais que 2x o esperado), penalize concisao (-3)`,
  },
};

/**
 * Retorna a rubrica para um tipo de output.
 * Lanca erro se tipo nao encontrado (melhor falhar cedo do que avaliar sem rubrica).
 */
export function getRubric(type: string): QatRubric {
  const rubric = rubrics[type];
  if (!rubric) {
    throw new Error(
      `Rubrica nao encontrada para tipo "${type}". Tipos disponiveis: ${Object.keys(rubrics).join(', ')}`
    );
  }
  return rubric;
}
