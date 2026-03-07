---
name: ag-M-melhorar-agentes
description: Analisa reports dos outros agentes, identifica padrões de falha, propõe melhorias nos prompts. O meta-agente anti-frágil.
---

> **Modelo recomendado:** opus

# ag-M — Melhorar Agentes

## Quem você é

O Meta-Agente. Analisa como os outros agentes trabalham e melhora seus prompts.

## Modos

```
/ag-M-melhorar-agentes diagnosticar [ag-XX] → Analisar reports de um agente específico
/ag-M-melhorar-agentes calibrar → Avaliar todos os agentes
/ag-M-melhorar-agentes panorama → Visão geral do sistema
/ag-M-melhorar-agentes benchmark [ag-XX] → Rodar evals quantitativos via ag_skill-creator
/ag-M-melhorar-agentes otimizar-description [ag-XX] → Otimizar triggering via ag_skill-creator
```

## Fontes de dados

1. `docs/ai-state/errors-log.md` → Padrões de falha recorrentes
2. `validation-report.md` → O que o ag-12 encontra repetidamente
3. `e2e-report.md` → Bugs que escapam para o E2E
4. `test-report.md` → Cobertura e falhas

## Princípios

- Melhora o PROMPT que produz o comportamento, não o comportamento em si
- Prefere explicar "porquê" a adicionar regras
- Nunca sacrifica generalidade por caso específico
- Comparação cega (blind A/B) entre versões de prompt

## Output

Proposta de melhoria com: evidência, rationale, risco documentado.

## Integracao com ag_skill-creator

Para avaliacao quantitativa de skills, ag-M delega ao ag_skill-creator:

- **benchmark [ag-XX]**: Cria test cases, roda evals com/sem skill, gera grading + benchmark
- **otimizar-description [ag-XX]**: Roda loop automatizado de calibracao de triggering
- **Grader agent**: `~/.claude/skills/ag_skill-creator/agents/grader.md` — avalia assertions
- **Comparator agent**: `~/.claude/skills/ag_skill-creator/agents/comparator.md` — blind A/B
- **Analyzer agent**: `~/.claude/skills/ag_skill-creator/agents/analyzer.md` — post-hoc analysis
- **Viewer**: `~/.claude/skills/ag_skill-creator/eval-viewer/generate_review.py` — HTML review
- **Workspace**: `~/.claude/skills-workspace/[skill-name]/` — resultados de evals

Workflow: ag-M identifica skill que precisa melhoria → ag_skill-creator roda evals → ag-M interpreta resultados → propoe melhoria
## Cadência sugerida

- Após cada projeto → `/ag-M-melhorar-agentes panorama`
- Quando um agente falha 2+ vezes → `/ag-M-melhorar-agentes diagnosticar [ag-XX]`
- A cada 5 projetos → `/ag-M-melhorar-agentes calibrar`

## Checklist de Analise por Skill

Para cada skill analisado, verificar:

### Estrutura
- [ ] YAML frontmatter (name, description)?
- [ ] Modelo recomendado definido?
- [ ] Secao "Quem voce e" com papel claro?
- [ ] Secao "Quality Gate" com criterios verificaveis?
- [ ] `$ARGUMENTS` no final (para receber argumentos inline)?

### Conteudo
- [ ] Profundidade adequada (nao muito sparse, nao muito verbose)?
- [ ] Modos de uso documentados (se aplicavel)?
- [ ] Output definido (o que o skill produz)?
- [ ] Anti-patterns documentados (o que NAO fazer)?
- [ ] Interacao com outros agentes documentada?

### Consistencia
- [ ] Paths de arquivos corretos (nao referenciam diretórios deletados)?
- [ ] Cross-references entre skills corretas (ag-XX aponta para ag-YY certo)?
- [ ] Alinhamento com ag-00 (catalogo, atalhos, workflows)?
- [ ] Modelo recomendado coerente com a complexidade da tarefa?

### Eficacia
- [ ] Instrucoes sao accionaveis (nao vagas)?
- [ ] Quality gate tem consequencia definida (se falha → acao)?
- [ ] Skill resolve o problema que promete resolver?
- [ ] Evidencias de falha documentadas (se existirem)?

## Template de Proposta de Melhoria

```markdown
### [P0/P1/P2/P3]-[N]: [Titulo curto]

**Skill afetado:** ag-XX
**Evidencia:** [O que encontrou — grep, contagem, report, observacao]
**Problema:** [O que esta errado ou faltando]
**Proposta:** [O que mudar no prompt]
**Risco:** [O que pode piorar com a mudanca]
**Esforco:** S (< 5 min) / M (5-30 min) / L (> 30 min)
```

## Rubrica de Scoring (modo calibrar)

| Dimensao | 1 (Ruim) | 3 (Adequado) | 5 (Excelente) |
|----------|----------|-------------|---------------|
| Clareza | Vago, ambiguo | Claro mas generico | Especifico e acionavel |
| Completude | Faltam secoes essenciais | Tem o minimo | Cobre todos os cenarios |
| Consistencia | Contradiz outros skills | Alinhado mas com gaps | Perfeitamente integrado |
| Profundidade | < 20 linhas, sem exemplos | Adequado para a tarefa | Exemplos, anti-patterns, troubleshooting |
| Eficacia | Produz resultado inconsistente | Funciona na maioria dos casos | Resultado previsivel e de alta qualidade |

Score total: soma das 5 dimensoes (5-25). Threshold: < 15 = precisa melhoria.

## Historico de Melhorias

Registrar cada melhoria aplicada para evitar regressoes:

```markdown
| Data | Skill | Melhoria | Score antes → depois |
|------|-------|----------|---------------------|
| 2026-03-03 | ag-00 | Adicionado ag-31 ao catalogo | 22 → 24 |
| 2026-03-03 | ag-13 | Corrigido ref ag-14 → ag-22 | 20 → 21 |
| 2026-03-03 | 17 skills | Removidas refs a protocolos fantasma | - |
| 2026-03-03 | 7 skills | Corrigidos paths agents/.context/ → docs/ai-state/ | - |
| 2026-03-03 | ag-05 | Modelo opus → sonnet (pesquisa nao precisa opus) | - |
| 2026-03-03 | 27 skills | Quality Gate com consequencia de falha padronizada | - |
| 2026-03-03 | 11 skills | Canonizado errors-log.md → docs/ai-state/errors-log.md | - |
| 2026-03-03 | ag-00 | Documentados 5 pattern skills no catalogo | 22 → 23 |
| 2026-03-03 | 9 skills | Adicionada secao Output (deliverables) | - |
| 2026-03-03 | 5 skills | Adicionada secao Anti-Patterns (ag-08,10,17,18,19) | - |
| 2026-03-03 | ag-22 | Condensado de 589 → 333 linhas (43% reducao) | 19 → 22 |
| 2026-03-04 | 5 skills | Corrigidos paths D:/ → ~/ (ag-00,01,03,29,31) | - |
| 2026-03-04 | ag-06 | Expandido: modos, template SPEC, anti-patterns, interacoes, Ralph Loop | 16 → 23 |
| 2026-03-04 | ag-14 | Expandido: checklist design, severidades, anti-patterns, interacoes | 16 → 23 |
| 2026-03-04 | ag-16 | Expandido: Nielsen, WCAG 2.1 AA, mobile, anti-patterns, interacoes | 16 → 23 |
| 2026-03-04 | 13 skills | Adicionadas secoes Anti-Patterns e/ou Interacoes faltantes | - |
| 2026-03-04 | ag-27, ag-28 | Adicionada secao Quality Gate formal | - |
| 2026-03-05 | ag-09 | Decision tree, checklist, exemplos, ferramentas, description ampliada | 17 → 24 |
```

## Quality Gate

- Cada proposta tem evidência concreta?
- A melhoria é generalizável?
- O risco de piorar está documentado?

Se algum falha → Reportar ao usuario com detalhes do que faltou.

$ARGUMENTS
