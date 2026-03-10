/**
 * Rubrica Especifica: Relatorio Executivo
 *
 * Avalia relatorios gerados pelo sistema (PDF, DOCX, ou texto longo).
 * Foco em clareza, dados, acionabilidade e formato profissional.
 *
 * Cenarios: QAT-20, QAT-21 (geracao de relatorios)
 */

import type { QatRubricV2 } from '../specific-rubric.template';

export const relatorioExecutivoRubric: QatRubricV2 = {
  id: 'relatorio-executivo-v2',
  version: '2.0.0',
  type: 'presentation',
  domain: 'educacao',
  criteria: [
    {
      name: 'completude-conteudo',
      weight: 0.25,
      description: 'O relatorio cobre todos os pontos solicitados com profundidade adequada?',
      scale: {
        '1-2': 'Relatorio vazio, stub ou com menos de 200 palavras',
        '3-4': 'Cobre 1-2 pontos dos solicitados, ignora o restante',
        '5': 'Cobre pontos principais superficialmente sem dados de suporte',
        '6-7': 'Cobertura completa dos pontos solicitados com dados basicos',
        '8-9': 'Cobertura completa + analise + comparativos + tendencias',
        '10': 'Cobertura exaustiva + insights nao solicitados + benchmarks',
      },
    },
    {
      name: 'precisao-dados',
      weight: 0.25,
      description: 'Os dados e metricas apresentados sao corretos e consistentes?',
      scale: {
        '1-2': 'Dados majoritariamente inventados ou inconsistentes entre si',
        '3-4': 'Alguns dados corretos mas com inconsistencias internas',
        '5': 'Dados corretos mas sem fontes ou contexto temporal',
        '6-7': 'Dados corretos, consistentes, com periodo de referencia',
        '8-9': 'Dados verificaveis com fontes citadas e comparativos historicos',
        '10': 'Dados com fontes + intervalos de confianca + limitacoes explicitas',
      },
    },
    {
      name: 'formato-profissional',
      weight: 0.20,
      description: 'O formato e profissional e adequado para apresentacao a gestores?',
      scale: {
        '1-2': 'Texto corrido sem formatacao, parece rascunho',
        '3-4': 'Alguma formatacao mas inconsistente ou amadora',
        '5': 'Formato basico com secoes mas sem elementos visuais (tabelas, graficos)',
        '6-7': 'Profissional: executive summary, secoes, tabelas, graficos descritos',
        '8-9': 'Formato executivo: sumario, KPIs destacados, tabelas comparativas, recomendacoes',
        '10': 'Formato consultoria: capa, indice, executive summary, detalhamento, anexos',
      },
    },
    {
      name: 'acionabilidade',
      weight: 0.20,
      description: 'O relatorio transforma dados em recomendacoes acionaveis?',
      scale: {
        '1-2': 'Apenas apresenta dados sem analise ou recomendacao',
        '3-4': 'Recomendacoes genericas tipo "precisa melhorar"',
        '5': 'Recomendacoes concretas mas sem prioridade ou responsavel',
        '6-7': 'Recomendacoes priorizadas com proximos passos claros',
        '8-9': 'Plano de acao com responsaveis, prazos e indicadores de sucesso',
        '10': 'Plano de acao + quick-wins + riscos + cenarios alternativos',
      },
    },
    {
      name: 'linguagem-tom',
      weight: 0.10,
      description: 'A linguagem e apropriada para o publico-alvo (gestores educacionais)?',
      scale: {
        '1-2': 'Linguagem informal, giriass ou jargao tecnico excessivo',
        '3-4': 'Linguagem adequada mas com trechos confusos ou ambiguos',
        '5': 'Linguagem correta mas monotona ou excessivamente academica',
        '6-7': 'Linguagem profissional, clara, adaptada para gestores',
        '8-9': 'Tom executivo: direto, conciso, sem rodeios, orientado a decisao',
        '10': 'Tom executivo + diplomatico + construtivo (aponta problemas sem alarmar)',
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
      name: 'dados-inconsistentes',
      condition: 'Mesma metrica com valores diferentes em secoes distintas do relatorio',
      deduction: -2,
      appliesTo: 'precisao-dados',
    },
    {
      name: 'placeholder-detectado',
      condition: 'Contem textos tipo "[inserir dado]", "XXX", "lorem ipsum"',
      deduction: -3,
      appliesTo: 'completude-conteudo',
    },
  ],
  goldenSamplePath: 'knowledge/golden-samples/QAT-20.md',
  antiPatternsPath: 'knowledge/anti-patterns/QAT-20.md',
};
