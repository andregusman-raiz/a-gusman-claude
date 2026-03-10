/**
 * Rubrica Especifica: Plano de Aula
 *
 * Avalia planos de aula gerados pelo sistema.
 * Criterios focados em aplicabilidade, alinhamento curricular e adequacao pedagogica.
 *
 * Cenarios: QAT-04, QAT-05, QAT-06 (geracao de planos de aula)
 */

import type { QatRubricV2 } from '../specific-rubric.template';

export const planoDeAulaRubric: QatRubricV2 = {
  id: 'plano-de-aula-v2',
  version: '2.0.0',
  type: 'chat',
  domain: 'educacao',
  criteria: [
    {
      name: 'estrutura-pedagogica',
      weight: 0.25,
      description: 'O plano segue estrutura pedagogica completa (objetivo, desenvolvimento, avaliacao)?',
      scale: {
        '1-2': 'Nao e um plano de aula — e apenas texto corrido ou lista de topicos',
        '3-4': 'Tem formato de plano mas faltam componentes essenciais (objetivos OU avaliacao)',
        '5': 'Componentes basicos presentes mas sem conexao entre eles',
        '6-7': 'Estrutura completa: objetivo, conteudo, metodologia, recursos, avaliacao',
        '8-9': 'Estrutura completa + sequencia didatica detalhada com tempos estimados',
        '10': 'Estrutura profissional + diferenciacao por nivel + plano B para imprevistos',
      },
    },
    {
      name: 'alinhamento-curricular',
      weight: 0.25,
      description: 'O plano esta alinhado com BNCC, curriculo e nivel de ensino adequado?',
      scale: {
        '1-2': 'Conteudo incompativel com o nivel de ensino solicitado',
        '3-4': 'Nivel de ensino correto mas sem referencia a BNCC ou curriculo',
        '5': 'Menciona BNCC genericamente sem codigo de habilidade especifico',
        '6-7': 'Cita codigos BNCC corretos para a disciplina e ano',
        '8-9': 'BNCC + competencias gerais + conexoes interdisciplinares',
        '10': 'BNCC + competencias + ODS + temas contemporaneos transversais',
      },
    },
    {
      name: 'aplicabilidade-realista',
      weight: 0.25,
      description: 'O plano e viavel para uma aula real em escola publica brasileira?',
      scale: {
        '1-2': 'Exige recursos inexistentes (lab de informatica, materiais caros)',
        '3-4': 'Viavel apenas em escola com infraestrutura acima da media',
        '5': 'Viavel mas sem considerar turmas grandes (35+ alunos)',
        '6-7': 'Viavel para escola publica, considera recursos basicos disponiveis',
        '8-9': 'Viavel + alternativas para diferentes niveis de recurso (com/sem internet)',
        '10': 'Viavel + inclusivo (adaptacoes para PCD) + alternativas + custo zero',
      },
    },
    {
      name: 'engajamento-metodologia',
      weight: 0.15,
      description: 'As atividades propostas sao engajantes e usam metodologias ativas?',
      scale: {
        '1-2': 'Apenas aula expositiva tradicional sem interacao',
        '3-4': 'Predomina exposicao com 1 atividade pratica tokenista',
        '5': 'Mix razoavel mas atividades sao genericas (ex: "discussao em grupo")',
        '6-7': 'Metodologias ativas concretas: gamificacao, projeto, sala invertida',
        '8-9': 'Atividades criativas e contextualizadas para a realidade dos alunos',
        '10': 'Sequencia engajante com hook, atividades variadas e closure significativo',
      },
    },
    {
      name: 'avaliacao-feedback',
      weight: 0.10,
      description: 'O plano inclui formas de avaliar a aprendizagem dos alunos?',
      scale: {
        '1-2': 'Sem mencao a avaliacao',
        '3-4': 'Apenas "prova ao final" ou "exercicios de fixacao"',
        '5': 'Avaliacao presente mas apenas somativa (nota no final)',
        '6-7': 'Avaliacao formativa durante a aula + somativa ao final',
        '8-9': 'Multiplas formas de avaliacao + rubricas + autoavaliacao do aluno',
        '10': 'Avaliacao continua + diagnostica + formativa + somativa + feedback loop',
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
      name: 'bncc-incorreta',
      condition: 'Cita codigo BNCC que nao existe ou nao corresponde a disciplina/ano',
      deduction: -2,
      appliesTo: 'alinhamento-curricular',
    },
    {
      name: 'tempo-irreal',
      condition: 'Plano exige mais tempo do que aula de 50min sem mencionar isso',
      deduction: -1,
      appliesTo: 'aplicabilidade-realista',
    },
  ],
  goldenSamplePath: 'knowledge/golden-samples/QAT-04.md',
  antiPatternsPath: 'knowledge/anti-patterns/QAT-04.md',
};
