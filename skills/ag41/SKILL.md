---
name: ag-41-criar-cenario-qat
description: Cria cenarios QAT de alta qualidade seguindo metodologia User Story → QAT Scenario. Gera spec com 4 camadas (L1-L4), rubrica v2 especifica, golden sample e anti-patterns.
disable-model-invocation: true
---

> **Modelo recomendado:** sonnet

# ag-41 — Criar Cenario QAT

## Papel

O Scenario Designer: transforma features em cenarios QAT que simulam usuarios reais. Cada cenario e um contrato de qualidade com 4 camadas de validacao, golden sample e anti-patterns.

Diferenca de ag-40: ag-40 EXECUTA cenarios existentes. ag-41 CRIA cenarios novos.
Diferenca de ag-13: ag-13 cria testes unitarios/integracao. ag-41 cria testes de QUALIDADE de output.

## Invocacao

```
/ag41 feature="Chat educacional" persona="Professor 5o ano"
/ag41 feature="Gerador de plano de aula" persona="Coordenador pedagogico" id=QAT-15
/ag41 feature="RAG sobre documento" persona="Pesquisador" resultado="Resumo com citacoes"
```

## Pre-requisitos

1. Estrutura `tests/qat/` no projeto (copiar de `~/.shared/templates/qat/`)
2. `tests/qat/qat.config.ts` existente
3. `tests/qat/rubrics/v2/` com rubricas disponiveis

## Ciclo de Criacao

```
Phase 0: Preflight (estrutura QAT, proximo ID, contexto do projeto)
Phase 1: Design (User Story DADO/QUANDO/ENTAO, tipo, criterios, rubrica)
Phase 2: Golden Sample (output ideal score 9-10, justificativa)
Phase 3: Anti-Patterns (3-5 contra-exemplos com scores esperados)
Phase 4: Implementar spec (4 camadas L1-L4 com Playwright)
Phase 5: Registrar em qat.config.ts
Phase 6: Validacao (typecheck, completude, report)
```

## Output

- `tests/qat/scenarios/qat-XX-nome.spec.ts` (cenario 4 camadas)
- `tests/qat/knowledge/golden-samples/QAT-XX.md` (output de referencia)
- `tests/qat/knowledge/anti-patterns/QAT-XX.md` (contra-exemplos)
- `tests/qat/rubrics/v2/nome.rubric.ts` (se criada nova rubrica)
- `tests/qat/qat.config.ts` atualizado

## Interacao com outros agentes

- ag-40: Complementar — ag-41 cria, ag-40 executa
- ag-08: Pos-build — quando ag-08 constroi feature nova, ag-41 cria cenario QAT
- ag-14: Code review — ag-14 verifica se PR de feature inclui cenario QAT
- ag-06: Pos-spec — quando spec define nova feature, ag-41 pode criar cenario antecipado

## Referencia

- Agent completo: `~/.claude/agents/ag-41-criar-cenario-qat.md`
- Pattern: `~/.shared/patterns/qat-scenario-design.md`
- KB Pattern: `~/.shared/patterns/qat-knowledge-base.md`
- Templates: `~/.shared/templates/qat/`

$ARGUMENTS
