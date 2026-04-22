---
name: ag-criar-cenario-qat
description: "[INTERNAL — invocada via ag-4-teste-final] Cria cenarios QAT de alta qualidade seguindo metodologia User Story → QAT Scenario. Gera spec com 4 camadas (L1-L4), rubrica v2 especifica, golden sample e anti-patterns."
model: sonnet
argument-hint: "[nome-do-cenario]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
disable-model-invocation: true
visibility: internal
---

# ag-criar-cenario-qat — Criar Cenario QAT (INTERNAL)

> **Internal skill** — invocada automaticamente por `ag-4-teste-final` via Agent tool. Não use diretamente via `/`. Para criar cenário QAT customizado use `/ag-4-teste-final qat [path]`.

## Papel

O Scenario Designer: transforma features em cenarios QAT que simulam usuarios reais. Cada cenario e um contrato de qualidade com 4 camadas de validacao, golden sample e anti-patterns.

Diferenca de ag-testar-qualidade-qat: ag-testar-qualidade-qat EXECUTA cenarios existentes. ag-criar-cenario-qat CRIA cenarios novos.
Diferenca de ag-testar-codigo: ag-testar-codigo cria testes unitarios/integracao. ag-criar-cenario-qat cria testes de QUALIDADE de output.

## Invocacao

```
/ag-criar-cenario-qat feature="Chat educacional" persona="Professor 5o ano"
/ag-criar-cenario-qat feature="Gerador de plano de aula" persona="Coordenador pedagogico" id=QAT-15
/ag-criar-cenario-qat feature="RAG sobre documento" persona="Pesquisador" resultado="Resumo com citacoes"
```

## Pre-requisitos

1. Estrutura `tests/qat/` no projeto (copiar de `~/.claude/shared/templates/qat/`)
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

- ag-testar-qualidade-qat: Complementar — ag-criar-cenario-qat cria, ag-testar-qualidade-qat executa
- ag-implementar-codigo: Pos-build — quando ag-implementar-codigo constroi feature nova, ag-criar-cenario-qat cria cenario QAT
- ag-revisar-codigo: Code review — ag-revisar-codigo verifica se PR de feature inclui cenario QAT
- ag-especificar-solucao: Pos-spec — quando spec define nova feature, ag-criar-cenario-qat pode criar cenario antecipado

## Referencia

- Agent completo: `~/.claude/agents/ag-criar-cenario-qat.md`
- Pattern: `~/.claude/shared/patterns/qat-scenario-design.md`
- KB Pattern: `~/.claude/shared/patterns/qat-knowledge-base.md`
- Templates: `~/.claude/shared/templates/qat/`

