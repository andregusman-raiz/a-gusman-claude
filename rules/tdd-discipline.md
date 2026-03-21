---
description: "Red-Green-Refactor — NUNCA gerar teste e implementacao juntos"
paths:
  - "**/*.test.ts"
  - "**/*.spec.ts"
  - "**/*.test.tsx"
  - "tests/**"
---

# TDD Discipline

## Regra de Ouro
> NUNCA deixar IA escrever o teste E a implementacao. Isso cria testes circulares.

## Divisao de Responsabilidades

| Fase | Quem | O que faz |
|------|------|-----------|
| RED | Dev/Spec | Define o teste com valores hard-coded da spec |
| GREEN | IA | Implementa o minimo para o teste passar |
| REFACTOR | IA + Dev | IA sugere refactoring, dev aprova |

## Ao Usar ag-Q-13 (testar-codigo)
- Se `mode: red` -> agent escreve APENAS testes, nunca implementacao
- Se `mode: green` -> agent implementa APENAS para testes existentes passarem
- NUNCA rodar ag-Q-13 em modo que gera ambos simultaneamente

## Property-Based Testing (quando usar)
- Funcoes puras com dominio definido (ex: serialize/deserialize, encode/decode)
- Propriedades universais: round-trip, comutatividade, idempotencia
- Ferramenta: `fast-check` (TS/JS), `hypothesis` (Python)
- NAO substitui testes unitarios — complementa

## Contract Testing (quando usar)
- APIs consumidas por outros servicos/times
- Ferramenta: Pact (consumer-driven contracts)
- Consumer define expectativas -> Provider verifica
- Rodar em CI para detectar breaking changes antes de deploy

## NUNCA
- Gerar teste a partir do codigo-fonte (circular)
- Copiar logica da implementacao no assert (bug no codigo = bug no teste)
- Usar `any` em mocks — tipar corretamente
- Pular RED phase "para ir mais rapido"
