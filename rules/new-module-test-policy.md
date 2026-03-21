---
description: "Testes obrigatorios ao criar novo modulo: smoke, error boundary, access control"
paths:
  - "src/lib/services/**"
  - "src/app/api/**"
  - "src/components/**"
  - "tests/**"
  - "__tests__/**"
---

# Policy: Testes Obrigatorios para Novos Modulos

## Regra Principal
Todo novo modulo (nova pasta em `src/lib/services/`, `src/app/api/`, ou `src/components/`)
DEVE incluir os seguintes testes como parte do PR de criacao.

## Testes Obrigatorios

### 1. Smoke Test (BLOCKING)
Arquivo: `__tests__/[modulo].smoke.test.ts` ou `tests/e2e/smoke/[modulo].spec.ts`

- Verifica que o modulo importa sem erro
- Verifica que endpoints retornam status code valido (200/401/403)
- Para componentes: renderiza sem crash

### 2. Error Boundary Test (BLOCKING)
Arquivo: `__tests__/[modulo].error.test.ts`

- Verifica comportamento com input invalido
- Verifica que erros sao tratados (nao propagam uncaught)
- Verifica que error boundary renderiza fallback (para componentes)

### 3. Access Control Test (BLOCKING para rotas protegidas)
Arquivo: `__tests__/[modulo].access.test.ts`

Testar com pelo menos 2 roles:
- Role com acesso: deve retornar dados
- Role sem acesso: deve retornar 403 ou redirect
- Sem auth: deve retornar 401

### 4. Unit Tests para Logica de Negocio (RECOMENDADO)
Arquivo: `__tests__/[service].test.ts`

- Testar funcoes puras e logica de negocio
- Happy path + edge cases
- Mock apenas dependencias externas (DB, APIs)

## Quando aplicar

| Tipo de Mudanca | Smoke | Error | Access | Unit |
|-----------------|-------|-------|--------|------|
| Novo modulo/feature | SIM | SIM | SIM | SIM |
| Nova rota API | SIM | SIM | SIM | - |
| Novo componente | SIM | SIM | - | - |
| Novo service | SIM | - | - | SIM |
| Bug fix | - | - | - | Regressao |
| Refactor | - | - | - | Existentes passam |

## Checklist para PR Review

Ao revisar PR que cria novo modulo, verificar:
- [ ] Smoke test existe e passa?
- [ ] Error boundary test existe?
- [ ] Access control testado com >= 2 roles? (se rota protegida)
- [ ] Nenhum anti-pattern teatral? (catch false, OR-chain, conditional sem else)

## Anti-Patterns Proibidos em Testes Novos

- `.catch(() => false)` — mascara falhas
- `expect(a || b).toBe(true)` — aceita qualquer truthy
- `if (visible) { expect() }` sem else — pode nao testar nada
- `expect(arr.length).toBeGreaterThanOrEqual(0)` — nunca falha
- 100% mock sem teste real — testa o mock, nao o codigo

## Enforcement

- ag-Q-14 (code review) deve verificar esta policy em PRs
- ag-Q-13 (testar) deve gerar estes testes ao criar modulo novo
- ag-Q-12 (validar) deve verificar que testes existem para modulos novos
