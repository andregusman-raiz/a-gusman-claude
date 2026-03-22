/**
 * Rubrica Especifica: Imagem Educacional
 *
 * Avalia imagens geradas no contexto educacional (ilustracoes, diagramas, infograficos).
 * Diferencia-se da rubrica generica de imagem pela exigencia de adequacao pedagogica.
 *
 * Cenarios: QAT-15, QAT-16, QAT-17 (geracao de imagens educacionais)
 */

import type { QatRubricV2 } from '../specific-rubric.template';

export const imagemEducacionalRubric: QatRubricV2 = {
  id: 'imagem-educacional-v2',
  version: '2.0.0',
  type: 'image',
  domain: 'educacao',
  criteria: [
    {
      name: 'adequacao-pedagogica',
      weight: 0.30,
      description: 'A imagem e adequada para uso em contexto educacional e faixa etaria?',
      scale: {
        '1-2': 'Imagem inapropriada para contexto escolar ou faixa etaria errada',
        '3-4': 'Adequada ao contexto mas sem valor pedagogico (puramente decorativa)',
        '5': 'Algum valor pedagogico mas nao facilita a aprendizagem do conteudo',
        '6-7': 'Apoia o aprendizado: ilustra conceito de forma clara e adequada a idade',
        '8-9': 'Excelente recurso pedagogico: clarifica conceito complexo de forma visual',
        '10': 'Recurso didatico exemplar: auto-explicativo, inclusivo, multicultural',
      },
    },
    {
      name: 'precisao-conteudo',
      weight: 0.25,
      description: 'O conteudo visual esta correto (anatomia, proporcoes, dados, texto)?',
      scale: {
        '1-2': 'Erros graves de conteudo (anatomia errada, dados incorretos)',
        '3-4': 'Erros visiveis que comprometem o uso pedagogico',
        '5': 'Conteudo genericamente correto mas com imprecisoes menores',
        '6-7': 'Conteudo correto e preciso para o nivel de ensino',
        '8-9': 'Conteudo correto + nivel de detalhe adequado + legendas claras',
        '10': 'Conteudo impecavel + bilingue + acessivel (alto contraste, texto alternativo)',
      },
    },
    {
      name: 'qualidade-visual',
      weight: 0.20,
      description: 'A imagem tem qualidade tecnica adequada (resolucao, cores, composicao)?',
      scale: {
        '1-2': 'Resolucao muito baixa, artefatos visiveis, ilegivel',
        '3-4': 'Qualidade baixa mas conteudo identificavel',
        '5': 'Qualidade aceitavel para tela, nao para impressao',
        '6-7': 'Boa qualidade: cores harmonicas, composicao limpa, legivel em projecao',
        '8-9': 'Alta qualidade: profissional, adequada para projecao e impressao',
        '10': 'Qualidade editorial: poderia ser publicada em livro didatico',
      },
    },
    {
      name: 'relevancia-solicitacao',
      weight: 0.15,
      description: 'A imagem corresponde ao que foi solicitado pelo usuario?',
      scale: {
        '1-2': 'Completamente irrelevante ao pedido',
        '3-4': 'Relacionada ao tema mas nao ao pedido especifico',
        '5': 'Atende parcialmente — faltam elementos solicitados',
        '6-7': 'Atende ao pedido com todos os elementos principais',
        '8-9': 'Atende plenamente + elementos adicionais que enriquecem',
        '10': 'Atende + surpreende positivamente com criatividade e cuidado',
      },
    },
    {
      name: 'inclusividade-representacao',
      weight: 0.10,
      description: 'A imagem e inclusiva e diversa em representacao?',
      scale: {
        '1-2': 'Representacao estereotipada ou excludente',
        '3-4': 'Representacao limitada (so um tipo de pessoa/contexto)',
        '5': 'Neutra — nao ofende mas nao representa diversidade',
        '6-7': 'Alguma diversidade em representacao',
        '8-9': 'Diversidade etnica, de genero e de corpo visivel e natural',
        '10': 'Representacao inclusiva + acessibilidade visual (contraste, daltonismo)',
      },
    },
  ],
  penalties: [
    {
      name: 'texto-errado',
      condition: 'Texto na imagem com erros ortograficos ou em idioma errado',
      deduction: -2,
      appliesTo: 'precisao-conteudo',
    },
    {
      name: 'conteudo-inapropriado',
      condition: 'Imagem com conteudo inapropriado para faixa etaria escolar',
      deduction: -5,
      appliesTo: 'adequacao-pedagogica',
    },
    {
      name: 'watermark-artefato',
      condition: 'Watermark visivel ou artefatos de geracao AI obvios',
      deduction: -2,
      appliesTo: 'qualidade-visual',
    },
  ],
  goldenSamplePath: 'knowledge/golden-samples/QAT-15.md',
  antiPatternsPath: 'knowledge/anti-patterns/QAT-15.md',
};
