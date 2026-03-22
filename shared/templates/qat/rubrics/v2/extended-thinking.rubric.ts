/**
 * Rubrica Especifica: Extended Thinking (Analise Profunda)
 *
 * Avalia respostas que exigem pensamento aprofundado e analise multicamada.
 * Diferencia-se de chat simples pela exigencia de profundidade, evidencias e estrutura argumentativa.
 *
 * Cenarios: QAT-08, QAT-09, QAT-10 (analises complexas)
 */

import type { QatRubricV2 } from '../specific-rubric.template';

export const extendedThinkingRubric: QatRubricV2 = {
  id: 'extended-thinking-v2',
  version: '2.0.0',
  type: 'chat',
  domain: 'educacao',
  criteria: [
    {
      name: 'profundidade-analitica',
      weight: 0.30,
      description: 'A analise vai alem do superficial? Explora causas, consequencias e inter-relacoes?',
      scale: {
        '1-2': 'Resposta superficial tipo lista de topicos sem analise',
        '3-4': 'Alguma analise mas trata cada ponto isoladamente, sem conexoes',
        '5': 'Analise razoavel de 1-2 dimensoes, ignora outras relevantes',
        '6-7': 'Analise multicamada (3+ dimensoes) com algumas conexoes entre elas',
        '8-9': 'Analise profunda com inter-relacoes explicitas entre dimensoes e causalidade',
        '10': 'Analise sistemica: identifica loops de retroalimentacao, trade-offs e pontos de alavancagem',
      },
    },
    {
      name: 'evidencias-referencias',
      weight: 0.25,
      description: 'A analise e sustentada por dados, pesquisas ou evidencias concretas?',
      scale: {
        '1-2': 'Zero evidencias. Opiniao pessoal ou senso comum',
        '3-4': 'Menciona dados vagos ("estudos mostram", "pesquisas indicam") sem especificar',
        '5': 'Cita 1-2 fontes reais mas sem dados quantitativos',
        '6-7': 'Cita fontes reais (INEP, SAEB, pesquisas) com alguns dados quantitativos',
        '8-9': 'Multiplas fontes verificaveis com dados especificos e atualizados',
        '10': 'Fontes academicas + dados governamentais + exemplos empiricos, todos verificaveis',
      },
    },
    {
      name: 'estrutura-argumentativa',
      weight: 0.20,
      description: 'A resposta segue uma logica argumentativa clara com introducao, desenvolvimento e sintese?',
      scale: {
        '1-2': 'Texto corrido sem fio condutor, saltos logicos',
        '3-4': 'Alguma organizacao mas sem fluxo logico (parece lista, nao argumento)',
        '5': 'Estrutura basica (intro + corpo) mas sem sintese ou conexao entre secoes',
        '6-7': 'Bem estruturada: intro contextualizante + secoes tematicas + conclusao',
        '8-9': 'Estrutura argumentativa com transicoes logicas, hierarquia clara, sintese integradora',
        '10': 'Estrutura impecavel: tese → evidencia → analise → contra-argumento → sintese → implicacoes',
      },
    },
    {
      name: 'aplicabilidade-recomendacoes',
      weight: 0.15,
      description: 'As recomendacoes sao praticas e acionaveis para o perfil do usuario?',
      scale: {
        '1-2': 'Sem recomendacoes ou recomendacoes genericas tipo "precisa melhorar"',
        '3-4': 'Recomendacoes existem mas sao vagas ou desconectadas da analise',
        '5': 'Recomendacoes concretas mas sem considerar viabilidade ou prioridade',
        '6-7': 'Recomendacoes priorizadas (curto/medio/longo prazo) e aplicaveis',
        '8-9': 'Recomendacoes com horizonte temporal, responsaveis e indicadores de sucesso',
        '10': 'Plano de acao completo com quick-wins, milestones e metricas de acompanhamento',
      },
    },
    {
      name: 'contextualizacao-educacional',
      weight: 0.10,
      description: 'A analise considera o contexto especifico da educacao brasileira?',
      scale: {
        '1-2': 'Analise generica aplicavel a qualquer pais',
        '3-4': 'Menciona Brasil mas com exemplos de outros contextos',
        '5': 'Contextualizada para Brasil mas ignora desafios estruturais (desigualdade, infra)',
        '6-7': 'Referencia legislacao, BNCC, politicas publicas quando relevante',
        '8-9': 'Profundamente contextualizada: desigualdades regionais, rede publica vs privada',
        '10': 'Integra dados do INEP/SAEB, programas governamentais e realidade territorial',
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
      name: 'superficialidade-disfarçada',
      condition: 'Lista longa de topicos sem analise real de nenhum (amplitude sem profundidade)',
      deduction: -2,
      appliesTo: 'profundidade-analitica',
    },
    {
      name: 'dados-inventados',
      condition: 'Cita estatisticas ou pesquisas que nao existem',
      deduction: -3,
      appliesTo: 'evidencias-referencias',
    },
  ],
  goldenSamplePath: 'knowledge/golden-samples/QAT-08.md',
  antiPatternsPath: 'knowledge/anti-patterns/QAT-08.md',
};
