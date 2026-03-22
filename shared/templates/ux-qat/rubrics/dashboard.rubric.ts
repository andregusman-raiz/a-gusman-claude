import type { UxQatRubricV2 } from '../types/ux-qat.types';
import { UNIVERSAL_PENALTIES } from './index';

export const dashboardRubric: UxQatRubricV2 = {
  id: 'dashboard-v1',
  version: '1.0.0',
  type: 'dashboard',
  domain: 'general',
  platform: 'web',

  criteria: [
    {
      name: 'hierarquia-informacao',
      weight: 0.25,
      description: 'KPIs e metricas principais visiveis e priorizados. Informacao mais importante se destaca.',
      scale: {
        '1-2': 'KPIs nao identificaveis, sem hierarquia visual, tudo com mesmo peso',
        '3-4': 'KPIs existem mas nao se destacam, hierarquia confusa',
        '5': 'KPIs visiveis mas sem destaque claro, hierarquia basica',
        '6-7': 'KPIs destacados, hierarquia clara mas minor issues (ex: cores similares)',
        '8-9': 'Hierarquia excelente, KPIs imediatamente identificaveis, agrupamento logico',
        '10': 'Hierarquia referencia — informacao flui naturalmente do mais ao menos importante',
      },
    },
    {
      name: 'densidade-dados',
      weight: 0.20,
      description: 'Equilibrio entre informacao util e espaco. Nem sobrecarregado nem vazio.',
      scale: {
        '1-2': 'Tela vazia ou completamente sobrecarregada, inutilizavel',
        '3-4': 'Muita informacao amontoada OU muito espaco desperdicado',
        '5': 'Densidade aceitavel mas sem otimizacao de espaco',
        '6-7': 'Boa densidade, informacao organizada em cards/secoes logicas',
        '8-9': 'Densidade otima, cada elemento tem proposito claro, whitespace estrategico',
        '10': 'Densidade perfeita — maximo de informacao util com maximo de clareza',
      },
    },
    {
      name: 'consistencia-visual',
      weight: 0.20,
      description: 'Cards, graficos, cores e tipografia seguem padrao uniforme do design system.',
      scale: {
        '1-2': 'Estilos completamente inconsistentes, parece multiplas apps',
        '3-4': 'Inconsistencias evidentes em cores, espacamento ou tipografia',
        '5': 'Basicamente consistente mas com variacoes notaveis',
        '6-7': 'Consistente com minor desvios (ex: padding levemente diferente)',
        '8-9': 'Altamente consistente, design system seguido com rigor',
        '10': 'Perfeita aderencia ao design system, zero desvios',
      },
    },
    {
      name: 'responsividade',
      weight: 0.15,
      description: 'Layout adapta para mobile sem perder dados ou funcionalidade critica.',
      scale: {
        '1-2': 'Quebra completamente em mobile, overflow, elementos sobrepostos',
        '3-4': 'Layout adapta mas perde dados ou funcionalidade importantes',
        '5': 'Funcional em mobile mas experiencia degradada (scroll excessivo)',
        '6-7': 'Boa adaptacao, dados preservados, minor issues de layout',
        '8-9': 'Excelente adaptacao, priorizacao inteligente de conteudo por breakpoint',
        '10': 'Mobile-first impecavel, experiencia igualmente boa em todos breakpoints',
      },
    },
    {
      name: 'interatividade',
      weight: 0.10,
      description: 'Filtros, drill-down, tooltips e controles interativos funcionais e intuitivos.',
      scale: {
        '1-2': 'Sem interatividade, dashboard puramente estatico',
        '3-4': 'Interacoes existem mas sao confusas ou quebradas',
        '5': 'Interacoes basicas funcionam (filtros simples)',
        '6-7': 'Interacoes claras com feedback visual adequado',
        '8-9': 'Interacoes ricas (drill-down, tooltips informativos, filtros combinaveis)',
        '10': 'Interatividade de referencia — cada dado e exploravel e contextualizado',
      },
    },
    {
      name: 'feedback-estado',
      weight: 0.10,
      description: 'Estados de loading, empty, error visiveis e informativos.',
      scale: {
        '1-2': 'Sem feedback — tela congela, sem loading, erros silenciosos',
        '3-4': 'Loading basico mas sem empty states ou error states',
        '5': 'Loading e error states existem mas genericos',
        '6-7': 'States contextualizados com acoes sugeridas',
        '8-9': 'Skeleton loading, empty states com CTA, error com retry',
        '10': 'States impecaveis — skeleton, progressive loading, error com diagnostico',
      },
    },
  ],

  penalties: UNIVERSAL_PENALTIES,

  breakpoints: [375, 768, 1024, 1440],
  themes: ['light'],
};
