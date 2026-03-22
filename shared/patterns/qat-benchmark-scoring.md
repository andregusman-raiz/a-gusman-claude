# QAT-Benchmark Scoring — Triple-Scorer + Judge Jury Pattern

## Visao Geral

O sistema de scoring do QAT-Benchmark usa 3 camadas complementares para maximizar precisao e minimizar bias:

1. **Rule-Based (L1-L2)**: Verificacoes deterministicas — passa/falha, sem ambiguidade
2. **LLM Judge Jury (L3)**: 3 modelos x 2 posicoes — reduz bias de posicao e modelo
3. **Functional Verification (L4)**: Verificacoes programaticas de regras de negocio

## L1-L2: Rule-Based Scorer

Verificacoes deterministicas executadas ANTES do judge (short-circuit se falhar):

### L1 — Smoke (Infraestrutura)
- App responde (HTTP 200, nao timeout)
- Output nao vazio (length > 0)
- Sem erros de runtime (console errors, stack traces)
- Formato valido (JSON parseable, texto nao corrompido)

### L2 — Structural
- Idioma correto (detector de lingua vs idioma esperado)
- Comprimento minimo/maximo (configurable por cenario)
- Formato esperado (markdown, JSON, lista, paragrafo)
- Headers/sections presentes (se rubrica exige estrutura)

**Short-circuit**: Se L1 falha → score = 0, skip L3-L4. Se L2 falha critico → score penalizado, continue L3-L4.

```typescript
interface RuleBasedResult {
  layer: 'L1' | 'L2';
  passed: boolean;
  checks: { name: string; passed: boolean; detail: string }[];
  shortCircuit: boolean; // true = skip remaining layers
  penalty: number;       // 0-10 points deducted from L3 score
}
```

## L3: LLM Judge Jury

### Principio Anti-Bias

Um unico modelo tem bias sistematico:
- **Position bias**: tende a favorecer a primeira ou segunda resposta
- **Model bias**: Claude tende a favorecer respostas estilo Claude
- **Verbosity bias**: respostas mais longas podem parecer "melhores"

### Jury Protocol

```
Para cada cenario:
  Para cada judge (Claude Opus, GPT-4o, Gemini 2.5 Pro):
    Avaliacao 1: [A=app, B=baseline] → score_AB
    Avaliacao 2: [A=baseline, B=app] → score_BA
    Score do judge = median(score_AB, score_BA)
  Score final = median(score_judge1, score_judge2, score_judge3)
```

### Prompt Template para Judge

```
Voce e um avaliador de qualidade de respostas de IA em contexto educacional.

## Tarefa
Avalie as duas respostas abaixo ao mesmo prompt. Pontue cada uma de 1-10 em cada dimensao.

## Prompt Original
{scenario.prompt}

## Contexto
{scenario.context}

## Resposta A
{output_a}

## Resposta B
{output_b}

## Dimensoes e Criterios
{dimensions_with_criteria}

## Formato de Output (JSON)
{
  "response_a": {
    "D1_accuracy": { "score": N, "rationale": "..." },
    ...
    "overall": N
  },
  "response_b": {
    "D1_accuracy": { "score": N, "rationale": "..." },
    ...
    "overall": N
  },
  "comparison": "A melhor | B melhor | Empate",
  "confidence": "high | medium | low"
}
```

### Fallback Strategy

```
3 judges OK          → median de 3 (padrao)
2 judges OK, 1 falha → median de 2 (flag: "degraded_jury")
1 judge OK, 2 falham → usar o 1 (flag: "single_judge")
0 judges OK          → score = null, classificar como INFRA
```

### Custo por Cenario

| Modo | Judges | Calls | Custo est. |
|------|--------|-------|------------|
| Full Jury | 3 x 2 | 6 | $0.15-0.30 |
| Dual Position | 1 x 2 | 2 | $0.05-0.10 |
| Single | 1 x 1 | 1 | $0.025-0.05 |

## L4: Functional Verification

Verificacoes programaticas de regras de negocio:

```typescript
interface FunctionalCheck {
  name: string;
  check: (output: string, scenario: BenchmarkScenario) => boolean;
  weight: number; // 0-1, contribuicao para score final
  severity: 'P0' | 'P1' | 'P2' | 'P3';
}
```

### Checks Padrao

| Check | Descricao | Severity |
|-------|-----------|----------|
| language_match | Output no idioma esperado | P0 |
| no_hallucination_markers | Sem "como modelo de linguagem", disclaimers excessivos | P1 |
| format_compliance | Formato solicitado (lista, tabela, codigo) | P1 |
| length_bounds | Dentro dos limites min/max | P2 |
| citation_present | Referencias quando solicitado | P2 |
| code_syntax_valid | Codigo sintaticamente correto (se aplicavel) | P1 |
| math_correct | Calculos corretos (se aplicavel) | P0 |

### Composicao do Score Final

```
score_final = (
  score_L3_jury * weight_L3
  - penalty_L2
  - penalty_L4
)

Onde:
  weight_L3 = 1.0 (base)
  penalty_L2 = 0-3 pontos (structural issues)
  penalty_L4 = 0-3 pontos (business rule violations)

  Clamp: max(0, min(10, score_final))
```

## Score Aggregation por Dimensao

Cada dimensao recebe score separado:

```typescript
interface DimensionScore {
  dimension: 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6' | 'D7' | 'D8';
  score_app: number;       // 0-10
  score_baseline: number;  // 0-10
  parity: number;          // score_app / score_baseline
  gap: number;             // score_baseline - score_app
  trend: 'improving' | 'stable' | 'degrading';
  confidence: 'high' | 'medium' | 'low';
}
```

## Validacao Zod

```typescript
const JudgeEvaluationSchema = z.object({
  response_a: z.object({
    D1_accuracy: z.object({ score: z.number().min(1).max(10), rationale: z.string() }),
    D2_teaching: z.object({ score: z.number().min(1).max(10), rationale: z.string() }),
    D3_agentic: z.object({ score: z.number().min(1).max(10), rationale: z.string() }),
    D4_calibration: z.object({ score: z.number().min(1).max(10), rationale: z.string() }),
    D5_safety: z.object({ score: z.number().min(1).max(10), rationale: z.string() }),
    D6_efficiency: z.object({ score: z.number().min(1).max(10), rationale: z.string() }),
    D7_robustness: z.object({ score: z.number().min(1).max(10), rationale: z.string() }),
    D8_response_ux: z.object({ score: z.number().min(1).max(10), rationale: z.string() }),
    overall: z.number().min(1).max(10),
  }),
  response_b: z.object({ /* same */ }),
  comparison: z.enum(['A melhor', 'B melhor', 'Empate']),
  confidence: z.enum(['high', 'medium', 'low']),
});
```

## Anti-patterns

1. **NAO usar 1 unico judge** em modo completo — position bias invalida resultados
2. **NAO pular L1-L2** — sem short-circuit, judge avalia outputs corrompidos (desperdicio)
3. **NAO calcular media** dos judges — usar MEDIANA (robusta a outliers)
4. **NAO incluir nome do modelo** no prompt do judge — evitar model loyalty bias
5. **NAO ignorar confidence=low** — re-rodar cenario ou escalar para review humano

## Referencia

- Pattern pai: `qat-benchmark.md`
- Pattern relacionado: `qat-rubric-design.md`
- Template: `~/.claude/shared/templates/qat-benchmark/scorers/`
