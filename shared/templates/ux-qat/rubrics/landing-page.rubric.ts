import type { UxQatRubricV2 } from '../types/ux-qat.types';
import { UNIVERSAL_PENALTIES } from './index';

export const landingPageRubric: UxQatRubricV2 = {
  id: 'landing-page-v1',
  version: '1.0.0',
  type: 'landing-page',
  domain: 'general',
  platform: 'web',

  criteria: [
    {
      name: 'hero-impact',
      weight: 0.25,
      description: 'CTA visivel acima do fold, proposta de valor clara em < 5 segundos.',
      scale: {
        '1-2': 'Nenhum CTA visivel, proposta de valor ausente ou confusa',
        '3-4': 'CTA existe mas nao se destaca, proposta de valor vaga',
        '5': 'CTA visivel, proposta de valor presente mas generica',
        '6-7': 'CTA destacado, proposta de valor clara e concisa',
        '8-9': 'Hero impactante — CTA impossivel de ignorar, valor imediato',
        '10': 'Hero referencia — emocionalmente engajante, CTA irresistivel, valor cristalino',
      },
    },
    {
      name: 'hierarquia-visual',
      weight: 0.20,
      description: 'Secoes com fluxo natural top-to-bottom, ritmo visual adequado.',
      scale: {
        '1-2': 'Sem secoes distinguiveis, conteudo em bloco monolitico',
        '3-4': 'Secoes existem mas sem ritmo, transicoes abruptas',
        '5': 'Secoes claras com separacao basica (espacamento)',
        '6-7': 'Fluxo natural, alternancia de secoes, whitespace estrategico',
        '8-9': 'Hierarquia excelente — narrative flow, secoes com proposito claro',
        '10': 'Storytelling visual impecavel, cada secao conduz a proxima naturalmente',
      },
    },
    {
      name: 'tipografia',
      weight: 0.15,
      description: 'Legibilidade, contraste adequado, hierarquia clara de headings.',
      scale: {
        '1-2': 'Texto ilegivel, contraste insuficiente, sem hierarquia de headings',
        '3-4': 'Legivel mas com problemas de contraste ou tamanho inconsistente',
        '5': 'Tipografia funcional, hierarquia basica, contraste OK',
        '6-7': 'Boa tipografia, hierarquia clara h1→h2→h3, contraste bom',
        '8-9': 'Tipografia elegante, pairings harmoniosos, ritmo vertical consistente',
        '10': 'Tipografia excepcional — expressiva, legivel, reforça a marca',
      },
    },
    {
      name: 'imagery-media',
      weight: 0.15,
      description: 'Imagens de qualidade, relevantes ao conteudo, performance otimizada.',
      scale: {
        '1-2': 'Imagens quebradas, genericas de stock, ou ausentes completamente',
        '3-4': 'Imagens presentes mas baixa qualidade ou irrelevantes',
        '5': 'Imagens adequadas, relevantes, mas sem otimizacao de performance',
        '6-7': 'Imagens de qualidade, relevantes, com lazy loading',
        '8-9': 'Imagery profissional, reforça a mensagem, WebP/AVIF, responsive',
        '10': 'Visual storytelling — imagens personalizadas que definem a marca',
      },
    },
    {
      name: 'cta-conversao',
      weight: 0.15,
      description: 'Botoes de acao destacados, repetidos estrategicamente, fricção reduzida.',
      scale: {
        '1-2': 'Nenhum CTA ou CTA invisivel/confuso',
        '3-4': 'CTA existe mas nao se destaca do restante da pagina',
        '5': 'CTA visivel, cor diferenciada, texto generico ("clique aqui")',
        '6-7': 'CTA destacado com texto de acao claro, posicionamento estrategico',
        '8-9': 'CTAs primario/secundario claros, repetidos em secoes chave, micro-copy excelente',
        '10': 'Conversao otimizada — CTAs contextuais, social proof adjacente, zero fricção',
      },
    },
    {
      name: 'performance-percebida',
      weight: 0.10,
      description: 'LCP rapido, loading states, scroll suave, sem layout shift.',
      scale: {
        '1-2': 'Pagina demora > 5s para mostrar conteudo, layout shifts severos',
        '3-4': 'Carrega em 3-5s, layout shifts visiveis, sem loading state',
        '5': 'LCP < 3s, minor layout shifts, scroll funcional',
        '6-7': 'LCP < 2.5s, CLS < 0.1, scroll suave',
        '8-9': 'LCP < 1.5s, zero CLS, above-fold instantaneo, lazy loading abaixo',
        '10': 'Performance excepcional — instantaneo, animacoes 60fps, PWA-ready',
      },
    },
  ],

  penalties: UNIVERSAL_PENALTIES,

  breakpoints: [375, 768, 1024, 1440],
  themes: ['light'],
};
