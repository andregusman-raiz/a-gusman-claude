import type { UxQatRubricV2 } from '../types/ux-qat.types';
import { UNIVERSAL_PENALTIES } from './index';

export const dataTableRubric: UxQatRubricV2 = {
  id: 'data-table-v1',
  version: '1.0.0',
  type: 'data-table',
  domain: 'general',
  platform: 'web',

  criteria: [
    {
      name: 'legibilidade',
      weight: 0.25,
      description: 'Alinhamento correto, padding adequado, separacao visual de linhas.',
      scale: {
        '1-2': 'Dados amontoados, sem separacao, ilegivel',
        '3-4': 'Separacao basica mas padding insuficiente, alinhamento inconsistente',
        '5': 'Legivel mas sem polish (zebra stripes ou borders, nao ambos)',
        '6-7': 'Boa legibilidade, alinhamento correto (numeros a direita, texto a esquerda)',
        '8-9': 'Excelente — spacing otimo, hierarquia de colunas, truncation elegante',
        '10': 'Referencia — alta densidade legivel, tipografia otimizada para dados',
      },
    },
    {
      name: 'funcionalidade',
      weight: 0.25,
      description: 'Sort, filter, search e pagination funcionais e intuitivos.',
      scale: {
        '1-2': 'Sem sort, filter ou pagination — tabela estatica',
        '3-4': 'Sort existe mas sem indicador visual, pagination basica',
        '5': 'Sort + pagination funcionais, filter basico',
        '6-7': 'Sort com indicador, filter por coluna, search global funcional',
        '8-9': 'Sort multi-coluna, filter combinavel, search com highlight, pagination rica',
        '10': 'Funcionalidade de referencia — virtual scroll, export, column reorder, presets',
      },
    },
    {
      name: 'responsividade',
      weight: 0.20,
      description: 'Tabela usavel em mobile sem perda de funcionalidade critica.',
      scale: {
        '1-2': 'Tabela impossivel de usar em mobile, scroll bidimensional, texto cortado',
        '3-4': 'Scroll horizontal existe mas sem indicacao, colunas essenciais escondidas',
        '5': 'Scroll horizontal funcional com indicacao, colunas priorizadas',
        '6-7': 'Adaptacao inteligente — cards em mobile ou colunas colapsaveis',
        '8-9': 'Excelente — responsive cards, expandable rows, column prioritization',
        '10': 'Mobile-first — experiencia de dados igualmente rica em todos breakpoints',
      },
    },
    {
      name: 'densidade',
      weight: 0.15,
      description: 'Equilibrio entre informacao visivel e espaco por linha.',
      scale: {
        '1-2': 'Linhas enormes com pouca info OU tudo comprimido sem espaco',
        '3-4': 'Densidade inconsistente, algumas colunas desperdicam espaco',
        '5': 'Densidade aceitavel, cada coluna tem proposito',
        '6-7': 'Boa densidade, toggle compact/comfortable disponivel',
        '8-9': 'Densidade otimizada, informacao secundaria em tooltip/expand',
        '10': 'Densidade perfeita — maximo de dados uteis com maximo de clareza',
      },
    },
    {
      name: 'acoes',
      weight: 0.15,
      description: 'Bulk actions, row actions e inline edit funcionais e acessiveis.',
      scale: {
        '1-2': 'Sem acoes por linha, operacoes individuais impossiveis',
        '3-4': 'Acoes existem mas confusas (muitos icones sem label)',
        '5': 'Acoes basicas funcionais (edit, delete) com confirmacao',
        '6-7': 'Row actions + bulk select + confirmation dialogs',
        '8-9': 'Actions contextuais, bulk com progresso, inline edit suave',
        '10': 'Referencia — keyboard shortcuts, contextual menus, undo/redo',
      },
    },
  ],

  penalties: UNIVERSAL_PENALTIES,

  breakpoints: [375, 768, 1024, 1440],
  themes: ['light'],
};
