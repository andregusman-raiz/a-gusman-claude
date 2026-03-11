# UX-QAT Visual Judge — AI-as-Judge Multimodal

> Como funciona o L3 (Percepcao Visual) com LLM multimodal avaliando screenshots.

## Arquitetura

```
Screenshot (PNG) + Design Tokens (JSON) + Rubric (criterios/pesos)
    ↓
  LLM Multimodal (Sonnet default, Opus calibracao)
    ↓
  UxJudgeResult (scores por criterio + penalties + findings)
```

## Inputs do Judge

1. **Screenshot**: Capturado pelo Playwright CLI no breakpoint/tema especifico
2. **Design Tokens**: JSON com cores, tipografia, espacamento, sombras (source of truth)
3. **Rubric**: Criterios com escalas 1-10 e pesos
4. **Guidelines**: Top-10 guidelines relevantes do ui-ux-pro-max (BM25 selection)
5. **Golden Sample**: Screenshot de referencia score 9-10 (calibracao)
6. **Anti-Patterns**: Falhas visuais conhecidas para detectar

## Output do Judge

```typescript
interface UxJudgeResult {
  criteria: {
    name: string;
    score: number;      // 1-10
    reasoning: string;  // evidencia visual especifica
    suggestion: string | null; // acao para melhorar (se score < 8)
  }[];
  penalties: {
    name: string;
    applied: boolean;
    deduction: number;
    evidence: string;
  }[];
  weightedScore: number;  // media ponderada dos criterios
  finalScore: number;     // weightedScore + penalties (min 1.0)
  summary: string;        // 2-3 frases
  topFindings: string[];  // top 3 achados
}
```

## Regras de Avaliacao

1. Avaliar o que VE no screenshot, nao o que supoe
2. Comparar com design tokens, nao com preferencia pessoal
3. Ser ESPECIFICO nas evidencias ("botao azul #3498db no canto superior direito")
4. Score 5 = funcional sem polish (baseline aceitavel)
5. Score 8+ requer evidencia positiva especifica
6. Penalties cumulativas mas finalScore >= 1.0
7. Se nao consegue ver claramente, dizer — nao inventar

## Calibracao

### Few-shot Examples

Para cada rubric, manter 2-3 exemplos de avaliacao ideal:
- 1 screenshot score alto (8-9) + reasoning esperado
- 1 screenshot score medio (5-6) + reasoning esperado
- 1 screenshot score baixo (2-3) + reasoning esperado

### Golden Samples

Screenshots que representam o estado ideal da tela. O Judge compara contra eles para calibrar notas.

### Anti-Patterns

Exemplos de falhas visuais conhecidas. Se detectados, penalties sao aplicadas automaticamente.

## Guideline Selection (BM25)

Para cada tela, selecionar top-10 guidelines do ui-ux-pro-max:
```
query = "{screen_type} {component_types} {platform}"
→ BM25 search em ux-guidelines.csv + ui-reasoning.csv
→ Top-10 guidelines como context para o Judge
```

## Custos

- Sonnet: ~$0.05-0.10 por screenshot (input: ~2K tokens texto + imagem)
- Opus (calibracao): ~$0.15-0.30 por screenshot
- Run completo (10 telas × 4 breakpoints): ~$2-4

## Consistencia

Variancia aceitavel: < 1.0 ponto entre runs para mesma tela.
Se variancia > 1.0 → marcar como FLAKY, investigar rubric ou screenshot.

## Modelo Recomendado

- **Sonnet**: Default para execucao (custo/qualidade otimo)
- **Opus**: Calibracao, rubric refinement, golden sample creation
- **Haiku**: NAO usar — qualidade insuficiente para avaliacao visual
