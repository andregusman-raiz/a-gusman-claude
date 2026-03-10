/**
 * Rubrica Especifica: RAG Query (Consulta com Documentos)
 *
 * Avalia respostas que devem ser baseadas em documentos carregados pelo usuario.
 * Criterio CRITICO: fidelidade ao documento (anti-alucinacao).
 *
 * Cenarios: QAT-130, QAT-131, QAT-132 (consultas RAG)
 */

import type { QatRubricV2 } from '../specific-rubric.template';

export const ragQueryRubric: QatRubricV2 = {
  id: 'rag-query-v2',
  version: '2.0.0',
  type: 'chat',
  domain: 'educacao',
  criteria: [
    {
      name: 'fidelidade-documento',
      weight: 0.35,
      description: 'A resposta e fiel ao conteudo dos documentos carregados? Nao inventa dados?',
      scale: {
        '1-2': 'Resposta inventa dados que nao estao nos documentos (alucinacao grave)',
        '3-4': 'Mistura dados reais do documento com informacoes inventadas',
        '5': 'Usa dados do documento mas interpreta incorretamente ou fora de contexto',
        '6-7': 'Fiel ao documento. Todas as afirmacoes sao rastreavei ao conteudo carregado',
        '8-9': 'Fiel + cita paginas/secoes especificas para cada afirmacao',
        '10': 'Fiel + citacoes exatas entre aspas + referencia cruzada entre documentos',
      },
    },
    {
      name: 'cobertura-analise',
      weight: 0.25,
      description: 'A resposta cobre os pontos relevantes do documento em relacao a pergunta?',
      scale: {
        '1-2': 'Ignora o documento e responde genericamente',
        '3-4': 'Cobre 1-2 pontos do documento, ignora o restante',
        '5': 'Cobre pontos principais mas perde detalhes importantes',
        '6-7': 'Boa cobertura dos pontos relevantes a pergunta',
        '8-9': 'Cobertura completa + identifica padroes e lacunas no documento',
        '10': 'Cobertura exaustiva + analise comparativa + insights nao obvios',
      },
    },
    {
      name: 'rastreabilidade',
      weight: 0.20,
      description: 'O usuario consegue verificar cada afirmacao voltando ao documento?',
      scale: {
        '1-2': 'Nenhuma referencia ao documento fonte',
        '3-4': 'Menciona "conforme o documento" sem especificar onde',
        '5': 'Referencia generica a secoes ("na parte sobre objetivos")',
        '6-7': 'Cita paginas ou secoes especificas (p. 12, secao 3.2)',
        '8-9': 'Citacoes diretas entre aspas + referencia de pagina para cada ponto',
        '10': 'Citacoes + tabela resumo com mapeamento ponto-a-ponto para o documento',
      },
    },
    {
      name: 'utilidade-acionabilidade',
      weight: 0.15,
      description: 'A resposta transforma dados do documento em informacao acionavel?',
      scale: {
        '1-2': 'Apenas repete o documento sem adicionar valor',
        '3-4': 'Resume o documento mas sem analise ou recomendacoes',
        '5': 'Analise basica com recomendacoes genericas',
        '6-7': 'Analise com recomendacoes especificas derivadas dos dados do documento',
        '8-9': 'Identifica gaps, prioridades e proximos passos concretos',
        '10': 'Plano de acao derivado dos dados + indicadores de acompanhamento',
      },
    },
    {
      name: 'estrutura-apresentacao',
      weight: 0.05,
      description: 'A resposta esta bem organizada para facilitar a leitura?',
      scale: {
        '1-2': 'Texto corrido dificil de ler',
        '3-4': 'Alguma estrutura mas confusa',
        '5': 'Estruturada mas sem tabelas resumo ou destaques visuais',
        '6-7': 'Bem estruturada com headers, bullets e destaques',
        '8-9': 'Estrutura excelente com tabela resumo + detalhamento + recomendacao',
        '10': 'Formato profissional: executive summary + detalhamento + anexos de referencia',
      },
    },
  ],
  penalties: [
    {
      name: 'idioma-errado',
      condition: 'Resposta em idioma diferente do prompt',
      deduction: -3,
      appliesTo: 'all',
    },
    {
      name: 'alucinacao-grave',
      condition: 'Inventa dados quantitativos ou citacoes que nao estao no documento',
      deduction: -4,
      appliesTo: 'fidelidade-documento',
    },
    {
      name: 'ignora-documento',
      condition: 'Responde sem usar o conteudo dos documentos carregados',
      deduction: -3,
      appliesTo: 'cobertura-analise',
    },
  ],
  goldenSamplePath: 'knowledge/golden-samples/QAT-130.md',
  antiPatternsPath: 'knowledge/anti-patterns/QAT-130.md',
};
