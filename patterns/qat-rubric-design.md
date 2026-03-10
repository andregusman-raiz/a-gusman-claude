# QAT Rubric Design — Como criar rubricas especificas

## Principio

> Rubrica generica gera score generico. Rubrica especifica detecta problemas reais.

Uma rubrica de "chat" nao serve para chat educacional, chat juridico e chat de codigo.
Cada contexto tem criterios diferentes do que significa "bom".

---

## Rubrica Generica vs Especifica

### Generica (EVITAR para cenarios importantes)

```typescript
// Serve para qualquer chat — nao detecta nada especifico
const chatRubric = {
  criteria: ['completude', 'corretude', 'estrutura', 'utilidade'],
  prompt: 'A resposta e completa? Correta? Bem estruturada? Util?'
};
```

**Problema**: Score 7 no generico pode ser 4 no especifico porque nao verifica:
- Adequacao ao nivel escolar
- Alinhamento com BNCC
- Aplicabilidade pratica pelo professor

### Especifica (USAR para cenarios importantes)

```typescript
const chatEducacionalRubric = {
  criteria: [
    'adequacao-nivel',        // Apropriado para a faixa etaria?
    'alinhamento-curricular', // Referencia BNCC/curriculo?
    'aplicabilidade',         // Professor pode usar amanha?
    'diferenciacao',          // Atende diferentes perfis de aluno?
    'fundamentacao',          // Baseado em evidencias pedagogicas?
  ],
  prompt: `Avalie como COORDENADOR PEDAGOGICO experiente...`,
  goldenSample: '...',
  antiPatterns: ['...'],
};
```

---

## Anatomia de uma Rubrica Especifica

### 1. Criterios (3-6 por rubrica)

Cada criterio deve ser:
- **Observavel**: O judge consegue verificar olhando para o output
- **Distinto**: Nao se sobrepoe com outros criterios
- **Relevante**: Importa para o objetivo do usuario
- **Mensuravel**: Tem escala clara (1-10 com descricoes por faixa)

### 2. Escalas detalhadas por criterio

```typescript
// NAO fazer (vago):
// "adequacao-nivel: 1-10"

// FAZER (especifico):
const escalaAdequacaoNivel = `
  1-2: Conteudo para nivel completamente errado (ex: graduacao para 3o ano)
  3-4: Nivel parcialmente adequado mas com termos/conceitos inacessiveis
  5:   Nivel geralmente ok mas com 2+ elementos inadequados
  6-7: Nivel adequado com pequenos ajustes necessarios
  8-9: Perfeitamente calibrado para a faixa etaria
  10:  Excepcionalmente adequado, com diferenciacao por niveis dentro da turma
`;
```

### 3. Penalidades especificas

```typescript
const penalidades = [
  'Idioma errado: -3 em todos os criterios',
  'Conteudo generico (serve para qualquer turma): -2 em aplicabilidade',
  'Nao menciona BNCC quando pedido: -3 em alinhamento-curricular',
  'Texto academico quando usuario e professor: -2 em adequacao-nivel',
];
```

### 4. Golden Sample (referencia de qualidade)

O judge recebe um exemplo de output EXCELENTE para calibrar sua avaliacao.
Sem golden sample, o judge usa seu proprio criterio (inconsistente).

### 5. Anti-patterns (contra-exemplos)

Exemplos de output que DEVEM receber nota baixa, com explicacao do porque.
Ajuda o judge a identificar problemas especificos.

---

## Template de Rubrica Especifica

```typescript
import type { QatRubricV2 } from '../fixtures/rubrics';

export const rubricChatEducacional: QatRubricV2 = {
  id: 'chat-educacional',
  version: '1.0',
  type: 'chat',
  domain: 'educacao',

  criteria: [
    {
      name: 'adequacao-nivel',
      weight: 1.0,
      description: 'O conteudo e apropriado para a faixa etaria e nivel escolar especificado?',
      scale: {
        '1-2': 'Nivel completamente errado (ex: conteudo de graduacao para ensino fundamental)',
        '3-4': 'Nivel parcialmente adequado mas com termos/conceitos inacessiveis',
        '5': 'Nivel geralmente ok mas com 2+ elementos inadequados para a faixa',
        '6-7': 'Nivel adequado, linguagem acessivel, com pequenos ajustes necessarios',
        '8-9': 'Perfeitamente calibrado para a faixa etaria especificada',
        '10': 'Excepcionalmente adequado, com diferenciacao por niveis de aprendizagem',
      },
    },
    {
      name: 'aplicabilidade',
      weight: 1.0,
      description: 'O professor pode usar este conteudo na proxima aula sem adaptacao significativa?',
      scale: {
        '1-2': 'Completamente teorico, sem nenhuma aplicacao pratica',
        '3-4': 'Tem ideias mas requer adaptacao significativa para uso real',
        '5': 'Parcialmente aplicavel mas faltam detalhes essenciais (duracao, materiais)',
        '6-7': 'Aplicavel com pequenos ajustes. Inclui materiais e duracao',
        '8-9': 'Pronto para uso imediato. Instrucoes claras, materiais especificados',
        '10': 'Pronto para uso + inclui adaptacoes para diferentes contextos',
      },
    },
    {
      name: 'fundamentacao',
      weight: 0.8,
      description: 'O conteudo e baseado em praticas pedagogicas estabelecidas?',
      scale: {
        '1-2': 'Informacao incorreta ou sem fundamento',
        '3-4': 'Baseado em senso comum, sem referencia a praticas estabelecidas',
        '5': 'Parcialmente fundamentado mas com lacunas',
        '6-7': 'Bem fundamentado, referencia praticas conhecidas',
        '8-9': 'Solidamente fundamentado com referencias especificas',
        '10': 'Excelente fundamentacao + referencias atualizadas',
      },
    },
  ],

  penalties: [
    { condition: 'Idioma diferente do prompt', impact: '-3 em todos os criterios' },
    { condition: 'Conteudo generico sem mencionar contexto do usuario', impact: '-2 em aplicabilidade' },
    { condition: 'Texto excessivamente academico para professor', impact: '-2 em adequacao-nivel' },
    { condition: 'Nao menciona BNCC/curriculo quando solicitado', impact: '-3 em fundamentacao' },
  ],

  goldenSamplePath: 'knowledge/golden-samples/QAT-01.md',
  antiPatternsPath: 'knowledge/anti-patterns/QAT-01.md',
};
```

---

## Quando usar Rubrica Generica vs Especifica

| Cenario | Rubrica | Motivo |
|---------|---------|--------|
| Core Journey (alta frequencia) | **Especifica** | Impacto alto, vale investir |
| Quality Gate (padrao minimo) | **Especifica** | Precisa detectar problemas reais |
| Edge Case (input dificil) | Generica ok | Objetivo e verificar robustez, nao qualidade |
| Regression (detectar quebra) | **Especifica** | Precisa comparar com baseline |
| Comparative (A/B models) | **Especifica** | Mesma rubrica para comparacao justa |
| Novo cenario (exploratorio) | Generica → evoluir | Comecar generico, refinar com dados |

---

## Processo de criacao

### Passo 1: Definir a persona
Quem avalia este output? (professor, coordenador, aluno)
O que importa para ESTA persona?

### Passo 2: Listar criterios candidatos
Brainstorm: quais aspectos fazem um output ser BOM para esta persona?
Filtrar: manter 3-6 criterios (mais que 6 = ruido)

### Passo 3: Definir escalas
Para cada criterio: o que e 1? 5? 10?
Ser especifico — "adequado" nao e descricao suficiente.

### Passo 4: Definir penalidades
O que DEVE reduzir o score independente dos criterios?
(idioma errado, conteudo placeholder, informacao perigosa)

### Passo 5: Criar golden sample
Escrever (ou selecionar de runs anteriores) um output que seria 9-10.
Nao precisa ser perfeito — precisa representar "excelente".

### Passo 6: Criar anti-patterns
Listar 2-3 outputs que DEVEM receber nota baixa.
Incluir o MOTIVO (ajuda o judge a calibrar).

### Passo 7: Validar com dados reais
Rodar 3x com a rubrica. Scores consistentes? (variacao < 1.5 pontos)
Se inconsistente → criterios ambiguos → refinar escalas.

---

## Versionamento

Rubricas evoluem. Manter versionamento para rastreabilidade.

```
tests/qat/rubrics/
├── v1/
│   ├── chat-educacional.ts
│   └── report-executivo.ts
├── v2/
│   ├── chat-educacional.ts    # Criterios refinados
│   └── report-executivo.ts
└── changelog.md               # Historico de mudancas
```

### Quando versionar
- Critério adicionado/removido → nova versao
- Escala modificada significativamente → nova versao
- Penalidade adicionada/removida → nova versao
- Ajuste de wording → patch (mesma versao, nota no changelog)

---

## Interface TypeScript v2

```typescript
export interface QatCriterionDef {
  name: string;
  weight: number;  // 0.0-1.0, default 1.0
  description: string;
  scale: Record<string, string>;  // '1-2': 'descricao', '3-4': '...'
}

export interface QatPenalty {
  condition: string;
  impact: string;  // '-3 em criterio X'
}

export interface QatRubricV2 {
  id: string;
  version: string;
  type: string;
  domain: string;
  criteria: QatCriterionDef[];
  penalties: QatPenalty[];
  goldenSamplePath?: string;
  antiPatternsPath?: string;
}
```

---

## Referencia

- Scenario Design: `~/.shared/patterns/qat-scenario-design.md`
- PDCA Cycle: `~/.shared/patterns/qat-pdca-cycle.md`
- Templates: `~/.shared/templates/qat/`
