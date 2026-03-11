import type { UxQatRubricV2 } from '../types/ux-qat.types';
import { UNIVERSAL_PENALTIES } from './index';

export const navigationRubric: UxQatRubricV2 = {
  id: 'navigation-v1',
  version: '1.0.0',
  type: 'navigation',
  domain: 'general',
  platform: 'web',

  criteria: [
    {
      name: 'wayfinding',
      weight: 0.25,
      description: 'Usuario sabe onde esta, de onde veio e para onde pode ir.',
      scale: {
        '1-2': 'Sem indicacao de localizacao, usuario completamente perdido',
        '3-4': 'Alguma indicacao mas confusa (breadcrumbs incompletos, active state fraco)',
        '5': 'Localizacao identificavel mas requer esforço cognitivo',
        '6-7': 'Active state claro, breadcrumbs funcionais, navegacao previsivel',
        '8-9': 'Wayfinding excelente — active state obvio, breadcrumbs, hierarquia clara',
        '10': 'Navegacao referencia — usuario NUNCA se sente perdido, contexto sempre visivel',
      },
    },
    {
      name: 'consistencia',
      weight: 0.25,
      description: 'Padrao de navegacao uniforme em todas as telas e secoes.',
      scale: {
        '1-2': 'Cada tela tem navegacao diferente, sem padrao',
        '3-4': 'Padrao parcial, algumas telas divergem significativamente',
        '5': 'Padrao basico seguido, minor inconsistencias entre secoes',
        '6-7': 'Consistente com desvios raros e justificados',
        '8-9': 'Altamente consistente, mesmo padrao em todas as telas',
        '10': 'Perfeita consistencia — design system de navegacao impecavel',
      },
    },
    {
      name: 'responsividade',
      weight: 0.20,
      description: 'Menu mobile funcional, hamburger/bottom nav, transicoes suaves.',
      scale: {
        '1-2': 'Navegacao quebra em mobile, itens sobrepostos ou cortados',
        '3-4': 'Hamburger existe mas abre mal, itens amontoados',
        '5': 'Hamburger funcional, abre/fecha, mas sem animacao ou feedback',
        '6-7': 'Menu mobile bem implementado, transicoes suaves, touch-friendly',
        '8-9': 'Excelente — bottom nav ou hamburger com animacao, gestures suportados',
        '10': 'Mobile-first impecavel, navegacao adaptativa por contexto e breakpoint',
      },
    },
    {
      name: 'acessibilidade',
      weight: 0.15,
      description: 'Keyboard navigation, aria-labels, focus trap em menus overlay.',
      scale: {
        '1-2': 'Sem keyboard nav, sem aria labels, focus trap ausente',
        '3-4': 'Tab funciona parcialmente, aria labels incompletos',
        '5': 'Keyboard nav basica funciona, aria labels presentes',
        '6-7': 'Tab + Enter + Escape funcionam, focus trap em overlays',
        '8-9': 'Excelente — skip nav link, roving tabindex, announce changes',
        '10': 'WCAG AAA — screen reader experience comparavel a visual',
      },
    },
    {
      name: 'feedback-estado',
      weight: 0.15,
      description: 'Active state, hover effects, current page indicator visiveis.',
      scale: {
        '1-2': 'Nenhum feedback visual em estados (hover, active, current)',
        '3-4': 'Hover existe mas sutil, active/current state confuso',
        '5': 'Estados basicos visiveis mas com baixo contraste',
        '6-7': 'Hover claro, active/current destacado, transicoes suaves',
        '8-9': 'Feedback rico — hover, active, current, visited, com animacoes',
        '10': 'Feedback excepcional — micro-interacoes, ripple/glow, contexto visual',
      },
    },
  ],

  penalties: UNIVERSAL_PENALTIES,

  breakpoints: [375, 768, 1024, 1440],
  themes: ['light'],
};
