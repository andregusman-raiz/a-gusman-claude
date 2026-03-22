/**
 * Rubrica Especifica: Geracao de Codigo
 *
 * Avalia outputs de geracao de codigo (automacoes, scripts, snippets).
 * Aplicavel tanto a geracao de codigo educacional quanto a automacoes internas.
 *
 * Cenarios: QAT-50, QAT-51, QAT-52 (geracao de codigo/automacao)
 */

import type { QatRubricV2 } from '../specific-rubric.template';

export const geracaoCodigoRubric: QatRubricV2 = {
  id: 'geracao-codigo-v2',
  version: '2.0.0',
  type: 'automation',
  domain: 'tecnologia',
  criteria: [
    {
      name: 'corretude-funcional',
      weight: 0.30,
      description: 'O codigo gerado funciona? Resolve o problema solicitado?',
      scale: {
        '1-2': 'Codigo com erros de sintaxe ou que nao executa',
        '3-4': 'Executa mas nao resolve o problema (output errado)',
        '5': 'Resolve parcialmente — funciona para caso simples, falha em edge cases',
        '6-7': 'Funciona corretamente para o caso solicitado, trata inputs basicos',
        '8-9': 'Funciona + trata edge cases + validacao de input + error handling',
        '10': 'Funciona + robusto + testes incluidos + documentacao inline',
      },
    },
    {
      name: 'qualidade-codigo',
      weight: 0.25,
      description: 'O codigo segue boas praticas (naming, estrutura, legibilidade)?',
      scale: {
        '1-2': 'Codigo ilegivel, sem indentacao, variaveis tipo a, b, c',
        '3-4': 'Legivel mas com anti-patterns obvios (var em JS, any em TS, SQL injection)',
        '5': 'Razoavel mas com oportunidades claras de melhoria (funcoes muito longas)',
        '6-7': 'Boas praticas: naming descritivo, funcoes focadas, tipagem adequada',
        '8-9': 'Clean code: SOLID principles, separation of concerns, DRY',
        '10': 'Exemplar: poderia ser usado como referencia de ensino',
      },
    },
    {
      name: 'completude-solucao',
      weight: 0.20,
      description: 'A solucao esta completa ou faltam partes essenciais?',
      scale: {
        '1-2': 'Apenas snippet incompleto, nao e solucao funcional',
        '3-4': 'Faltam imports, configuracao ou partes essenciais para rodar',
        '5': 'Solucao funcional mas sem instrucoes de uso ou dependencias',
        '6-7': 'Completa: codigo + imports + instrucoes basicas de uso',
        '8-9': 'Completa + instrucoes de instalacao + exemplos de uso + config',
        '10': 'Completa + README + testes + CI config + exemplos variados',
      },
    },
    {
      name: 'seguranca',
      weight: 0.15,
      description: 'O codigo evita vulnerabilidades comuns (injection, XSS, secrets em hardcode)?',
      scale: {
        '1-2': 'Vulnerabilidades criticas (SQL injection, hardcoded secrets, eval())',
        '3-4': 'Vulnerabilidades moderadas (XSS, no input validation)',
        '5': 'Sem vulnerabilidades obvias mas sem praticas proativas de seguranca',
        '6-7': 'Input validation basico, parametrized queries, no hardcoded secrets',
        '8-9': 'Seguranca proativa: sanitizacao, rate limiting, env vars, error masking',
        '10': 'OWASP Top 10 addressed, security headers, CSP, audit logging',
      },
    },
    {
      name: 'explicacao-didatica',
      weight: 0.10,
      description: 'O codigo vem acompanhado de explicacao que ajuda o usuario a entender?',
      scale: {
        '1-2': 'Codigo sem nenhuma explicacao',
        '3-4': 'Explicacao minima ("aqui esta o codigo")',
        '5': 'Comentarios no codigo mas sem explicacao do approach',
        '6-7': 'Explicacao do approach + comentarios nos trechos nao obvios',
        '8-9': 'Explicacao passo-a-passo + alternativas consideradas + trade-offs',
        '10': 'Tutorial completo: contexto, approach, implementacao, testes, proximos passos',
      },
    },
  ],
  penalties: [
    {
      name: 'idioma-errado',
      condition: 'Codigo ou explicacao em idioma diferente do prompt',
      deduction: -2,
      appliesTo: 'all',
    },
    {
      name: 'vulnerabilidade-critica',
      condition: 'SQL injection, hardcoded secrets, ou eval() com user input',
      deduction: -4,
      appliesTo: 'seguranca',
    },
    {
      name: 'dependencia-fantasma',
      condition: 'Importa biblioteca que nao existe ou com API inventada',
      deduction: -3,
      appliesTo: 'corretude-funcional',
    },
  ],
  goldenSamplePath: 'knowledge/golden-samples/QAT-50.md',
  antiPatternsPath: 'knowledge/anti-patterns/QAT-50.md',
};
