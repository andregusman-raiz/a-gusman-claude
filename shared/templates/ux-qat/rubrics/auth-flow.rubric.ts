import type { UxQatRubricV2 } from '../types/ux-qat.types';
import { UNIVERSAL_PENALTIES } from './index';

export const authFlowRubric: UxQatRubricV2 = {
  id: 'auth-flow-v1',
  version: '1.0.0',
  type: 'auth-flow',
  domain: 'general',
  platform: 'web',

  criteria: [
    {
      name: 'clareza',
      weight: 0.25,
      description: 'O que preencher, como preencher, onde clicar — tudo obvio.',
      scale: {
        '1-2': 'Campos sem labels, usuario nao sabe o que e email vs username',
        '3-4': 'Labels existem mas fluxo confuso (login vs register ambiguo)',
        '5': 'Campos claros, fluxo basico compreensivel',
        '6-7': 'Fluxo claro, links para forgot password/register visiveis',
        '8-9': 'Excelente — auto-focus no primeiro campo, links contextuais, micro-copy',
        '10': 'Referencia — zero fricçao, magic link option, passwordless como alternativa',
      },
    },
    {
      name: 'seguranca-percebida',
      weight: 0.20,
      description: 'Usuario se sente seguro ao inserir credenciais.',
      scale: {
        '1-2': 'Sem indicadores de seguranca, parece phishing',
        '3-4': 'HTTPS presente mas sem indicadores visuais de confianca',
        '5': 'Lock icon basico, HTTPS, sem password strength meter',
        '6-7': 'Password strength meter, show/hide toggle, HTTPS evidente',
        '8-9': 'Branding consistente, trust badges, 2FA proeminente, strength meter detalhado',
        '10': 'Seguranca referencia — biometric option, passkeys, zero-knowledge design',
      },
    },
    {
      name: 'error-recovery',
      weight: 0.25,
      description: 'Mensagens de erro claras, form preserva dados, recuperacao guiada.',
      scale: {
        '1-2': 'Erros silenciosos ou genericos ("Error"), form reseta ao falhar',
        '3-4': 'Mensagem de erro existe mas vaga, campo de senha reseta',
        '5': 'Mensagem especifica ("email invalido"), form preserva dados',
        '6-7': 'Erro inline no campo correto, form preserva tudo, retry facil',
        '8-9': 'Erros contextuais com sugestao, rate limit explicado, lockout claro',
        '10': 'Error recovery perfeita — diagnostico preciso, alternativas oferecidas, zero perda',
      },
    },
    {
      name: 'oauth-sso',
      weight: 0.15,
      description: 'Botoes de login social visiveis, branded corretamente, fluxo suave.',
      scale: {
        '1-2': 'OAuth/SSO indisponivel mesmo quando faria sentido',
        '3-4': 'Botoes existem mas fora do padrao da marca (Google azul, Apple branco)',
        '5': 'Botoes corretos mas mal posicionados (abaixo do fold)',
        '6-7': 'Botoes branded, posicionados acima do form, separador "ou"',
        '8-9': 'Excelente — branded, proeminentes, redirect suave, account linking',
        '10': 'Referencia — smart default (detecta provider anterior), one-tap sign-in',
      },
    },
    {
      name: 'acessibilidade',
      weight: 0.15,
      description: 'Autofill, password manager, tab order, screen reader support.',
      scale: {
        '1-2': 'Autofill bloqueado, tab order quebrado, sem autocomplete attr',
        '3-4': 'Autofill funciona parcialmente, tab order confuso entre forms',
        '5': 'Autocomplete attrs presentes, tab order basico OK',
        '6-7': 'Autofill + password manager suportados, tab order logico',
        '8-9': 'Excelente — WebAuthn hints, aria-labels, error announcements',
        '10': 'WCAG AAA — screen reader flow impecavel, biometric alt, high contrast',
      },
    },
  ],

  penalties: UNIVERSAL_PENALTIES,

  breakpoints: [375, 768, 1024, 1440],
  themes: ['light'],
};
