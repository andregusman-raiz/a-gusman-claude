import type { UxQatRubricV2 } from '../types/ux-qat.types';
import { UNIVERSAL_PENALTIES } from './index';

export const emptyErrorStatesRubric: UxQatRubricV2 = {
  id: 'empty-error-states-v1',
  version: '1.0.0',
  type: 'empty-error-states',
  domain: 'general',
  platform: 'web',

  criteria: [
    {
      name: 'comunicacao',
      weight: 0.30,
      description: 'Mensagem clara, tom adequado ao contexto, sem jargao tecnico.',
      scale: {
        '1-2': 'Sem mensagem, tela vazia, ou stack trace/codigo de erro tecnico',
        '3-4': 'Mensagem generica ("Error 500") ou vaga ("Something went wrong")',
        '5': 'Mensagem compreensivel mas sem contexto do que aconteceu',
        '6-7': 'Mensagem clara explicando o que aconteceu e por que',
        '8-9': 'Mensagem empatica, tom adequado, explica causa e consequencia',
        '10': 'Comunicacao referencia — humana, reconfortante, sem culpar usuario',
      },
    },
    {
      name: 'acao-seguinte',
      weight: 0.25,
      description: 'CTA para resolver ou navegar, nao deixar usuario em beco sem saida.',
      scale: {
        '1-2': 'Beco sem saida — nenhuma acao disponivel, usuario preso',
        '3-4': 'Link "voltar" generico, sem acao para resolver o problema',
        '5': 'Botao de retry ou link para home page',
        '6-7': 'CTA contextual para resolver (retry, criar primeiro item, contatar suporte)',
        '8-9': 'Multiplas opcoes contextuais, auto-retry com countdown',
        '10': 'Smart recovery — diagnostico + acao automatica + alternativas + suporte',
      },
    },
    {
      name: 'consistencia',
      weight: 0.20,
      description: 'Mesmo padrao visual de empty/error em todo o app.',
      scale: {
        '1-2': 'Cada tela trata empty/error de forma diferente (ou nao trata)',
        '3-4': 'Padrao parcial, algumas telas usam alert diferente',
        '5': 'Padrao basico seguido, minor variacoes de estilo',
        '6-7': 'Componente padronizado usado na maioria das telas',
        '8-9': 'Design system component consistente, variantes por tipo (empty, error, 404)',
        '10': 'Sistema completo — empty, error, offline, maintenance, 404, 403, todos padronizados',
      },
    },
    {
      name: 'ilustracao',
      weight: 0.15,
      description: 'Visual que reforca a mensagem sem ser generico.',
      scale: {
        '1-2': 'Sem visual, apenas texto em fundo branco',
        '3-4': 'Icone generico (warning triangle) sem contexto',
        '5': 'Ilustracao presente mas generica (stock illustration)',
        '6-7': 'Ilustracao contextual ao tipo de estado (vazio vs erro)',
        '8-9': 'Ilustracoes custom, on-brand, emocionalmente adequadas',
        '10': 'Visuais excepcionais — animados, contextuais, reforcam a mensagem',
      },
    },
    {
      name: 'responsividade',
      weight: 0.10,
      description: 'Layout de empty/error correto em todos breakpoints.',
      scale: {
        '1-2': 'Layout quebra em mobile, ilustracao corta, texto overflow',
        '3-4': 'Funcional mas ilustracao escondida ou texto muito pequeno em mobile',
        '5': 'Layout adapta, ilustracao redimensiona, texto legivel',
        '6-7': 'Boa adaptacao, espaco utilizado adequadamente',
        '8-9': 'Excelente — layout otimizado por breakpoint, ilustracao responsiva',
        '10': 'Perfeito em todos breakpoints, inclusive landscape mobile',
      },
    },
  ],

  penalties: UNIVERSAL_PENALTIES,

  breakpoints: [375, 768, 1024, 1440],
  themes: ['light'],
};
