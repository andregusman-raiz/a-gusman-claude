/**
 * Rubrica Especifica: Chat Educacional
 *
 * Avalia respostas de chat no contexto educacional brasileiro.
 * Substitui a rubrica generica "chat" para cenarios educacionais.
 *
 * Cenarios: QAT-01, QAT-02, QAT-03 (chats educacionais)
 */

import type { QatRubricV2 } from '../specific-rubric.template';

export const chatEducacionalRubric: QatRubricV2 = {
  id: 'chat-educacional-v2',
  version: '2.0.0',
  type: 'chat',
  domain: 'educacao',
  criteria: [
    {
      name: 'completude-pedagogica',
      weight: 0.25,
      description: 'A resposta cobre todos os aspectos da pergunta educacional?',
      scale: {
        '1-2': 'Resposta vazia, irrelevante, ou cobre <20% do pedido',
        '3-4': 'Resposta parcial — cobre 1-2 aspectos mas ignora outros pedidos explicitamente',
        '5': 'Cobre os pontos principais superficialmente, sem profundidade',
        '6-7': 'Cobre a maioria dos pontos com alguma profundidade. Faltam 1-2 aspectos menores',
        '8-9': 'Cobre todos os pontos pedidos com profundidade adequada ao nivel do usuario',
        '10': 'Cobre tudo + oferece perspectivas adicionais relevantes nao solicitadas',
      },
    },
    {
      name: 'corretude-informacional',
      weight: 0.25,
      description: 'As informacoes, dados, ferramentas e referencias estao corretos?',
      scale: {
        '1-2': 'Informacoes majoritariamente incorretas ou inventadas',
        '3-4': 'Mistura de informacoes corretas e incorretas. Ferramentas inexistentes citadas',
        '5': 'Informacoes genericamente corretas mas imprecisas (sem dados, sem nomes)',
        '6-7': 'Informacoes corretas. Ferramentas reais mencionadas. Poucos dados especificos',
        '8-9': 'Informacoes corretas com dados/exemplos especificos verificaveis',
        '10': 'Tudo correto, com fontes/referencias citadas e dados atualizados',
      },
    },
    {
      name: 'aplicabilidade-pratica',
      weight: 0.25,
      description: 'O professor consegue aplicar as sugestoes na proxima semana?',
      scale: {
        '1-2': 'Zero exemplos praticos. Conselhos abstratos ou irrealistas',
        '3-4': 'Exemplos vagos sem detalhamento de como implementar',
        '5': 'Exemplos existem mas sao genericos (nao contextualizados para escola publica)',
        '6-7': 'Exemplos praticos aplicaveis, mas sem considerar limitacoes reais (infra, custo)',
        '8-9': 'Exemplos concretos e aplicaveis, considerando contexto de escola publica brasileira',
        '10': 'Exemplos step-by-step com alternativas para diferentes niveis de infraestrutura',
      },
    },
    {
      name: 'contextualizacao-brasileira',
      weight: 0.15,
      description: 'A resposta considera a realidade da educacao brasileira?',
      scale: {
        '1-2': 'Resposta generica sem nenhuma referencia ao contexto brasileiro',
        '3-4': 'Menciona Brasil superficialmente mas exemplos sao de outros contextos',
        '5': 'Alguns exemplos brasileiros mas ignora desafios locais (infra, formacao)',
        '6-7': 'Contextualizada para Brasil. Menciona legislacao/BNCC/LGPD quando relevante',
        '8-9': 'Profundamente contextualizada: escola publica, desafios reais, ferramentas acessiveis',
        '10': 'Referencia politicas publicas, programas governamentais, dados do INEP/SAEB',
      },
    },
    {
      name: 'estrutura-comunicacao',
      weight: 0.10,
      description: 'A resposta esta bem estruturada e comunicada para um professor?',
      scale: {
        '1-2': 'Texto corrido sem estrutura, dificil de ler',
        '3-4': 'Alguma estrutura mas desorganizada ou com excesso de jargao tecnico',
        '5': 'Estruturada mas com linguagem academica demais para professor pratico',
        '6-7': 'Bem estruturada (headers, listas, secoes) com linguagem acessivel',
        '8-9': 'Estrutura excelente com fluxo logico, linguagem coloquial-profissional',
        '10': 'Estrutura impecavel + convite para aprofundamento + tom empático',
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
      name: 'alucinacao-ferramenta',
      condition: 'Cita ferramenta que nao existe ou com funcionalidades inventadas',
      deduction: -2,
      appliesTo: 'corretude-informacional',
    },
    {
      name: 'tom-condescendente',
      condition: 'Trata professor como leigo em educacao (explica o que e uma aula, o que e avaliacao)',
      deduction: -1,
      appliesTo: 'estrutura-comunicacao',
    },
  ],
  goldenSamplePath: 'knowledge/golden-samples/QAT-01.md',
  antiPatternsPath: 'knowledge/anti-patterns/QAT-01.md',
};
