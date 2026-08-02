import type { UxQatRubricV2 } from '../types/ux-qat.types';
import { UNIVERSAL_PENALTIES } from './index';

export const formFlowRubric: UxQatRubricV2 = {
  id: 'form-flow-v1',
  version: '1.0.0',
  type: 'form-flow',
  domain: 'general',
  platform: 'web',

  criteria: [
    {
      name: 'clareza-labels',
      weight: 0.20,
      description: 'Labels visiveis, helper text adequado, placeholder informativo.',
      scale: {
        '1-2': 'Labels ausentes ou confusos, usuario nao sabe o que preencher',
        '3-4': 'Labels existem mas ambiguos, sem helper text onde necessario',
        '5': 'Labels claros mas sem helper text ou formatacao esperada',
        '6-7': 'Labels claros com helper text, minor issues (ex: placeholder = label)',
        '8-9': 'Labels excelentes, helper text contextual, formatacao explicita',
        '10': 'Clareza referencia — cada campo auto-explicativo com exemplos',
      },
    },
    {
      name: 'validacao-visual',
      weight: 0.25,
      description: 'Erros inline com cor, icone e mensagem clara. Validacao em tempo real.',
      scale: {
        '1-2': 'Sem validacao visual, erros so aparecem no submit (ou nunca)',
        '3-4': 'Validacao existe mas generica ("campo invalido") ou so borda vermelha',
        '5': 'Validacao com mensagem mas sem destaque visual adequado',
        '6-7': 'Validacao inline com cor + mensagem, mas delay ou flickering',
        '8-9': 'Validacao em tempo real, cor + icone + mensagem clara, scroll to error',
        '10': 'Validacao impecavel — real-time, contextual, com sugestao de correcao',
      },
    },
    {
      name: 'fluxo-progressao',
      weight: 0.20,
      description: 'Steps visiveis em multi-step, back/next claro, progresso indicado.',
      scale: {
        '1-2': 'Multi-step sem indicacao de progresso, usuario perdido',
        '3-4': 'Steps existem mas confusos, nao claro quantos faltam',
        '5': 'Progresso basico (step 2 of 5) mas sem visual atraente',
        '6-7': 'Progress bar ou stepper claro, back/next visiveis',
        '8-9': 'Stepper excelente com validacao por step, transicoes suaves',
        '10': 'Fluxo perfeito — draft saving, resume, branching logico, zero fricção',
      },
    },
    {
      name: 'acessibilidade-input',
      weight: 0.15,
      description: 'Focus visible, tab order logico, touch targets adequados.',
      scale: {
        '1-2': 'Focus invisivel, tab order quebrado, inputs minusculos',
        '3-4': 'Focus visivel mas fraco, tab order parcialmente correto',
        '5': 'Focus e tab order OK, touch targets marginal (38-43px)',
        '6-7': 'Focus claro, tab order correto, touch targets >= 44px',
        '8-9': 'Excelente — focus ring contrastante, tab logico, autofill suportado',
        '10': 'Referencia — WCAG AAA, screen reader labels, error announcements',
      },
    },
    {
      name: 'feedback-submissao',
      weight: 0.10,
      description: 'Loading state ao submeter, confirmacao de sucesso, tratamento de erro.',
      scale: {
        '1-2': 'Nenhum feedback — clica e nada acontece, ou pagina recarrega',
        '3-4': 'Loading existe mas sem feedback de sucesso/erro claro',
        '5': 'Loading + sucesso basico, erro generico',
        '6-7': 'Loading com disable de botao, sucesso claro, erro com acao',
        '8-9': 'Toast/redirect com confirmacao, erro com campos destacados',
        '10': 'Feedback impecavel — optimistic UI, retry automatico, undo disponivel',
      },
    },
    {
      name: 'responsividade',
      weight: 0.10,
      description: 'Layout adapta sem perder campos ou funcionalidade.',
      scale: {
        '1-2': 'Campos cortados ou sobrepostos em mobile',
        '3-4': 'Layout adapta mas campos ficam muito estreitos ou amontoados',
        '5': 'Funcional em mobile, campos empilhados corretamente',
        '6-7': 'Boa adaptacao, inputs full-width em mobile, spacing adequado',
        '8-9': 'Excelente — reordenacao inteligente, grupos preservados',
        '10': 'Mobile-first, experiencia de preenchimento igualmente boa',
      },
    },
  ],

  penalties: UNIVERSAL_PENALTIES,

  breakpoints: [375, 768, 1024, 1440],
  themes: ['light'],
};
