---
name: ag-Q-13-testar-codigo
description: "Cria e executa testes unitarios e de integracao. Verifica logica, nao experiencia de usuario. Registra falhas em errors-log.md."
model: sonnet
argument-hint: "[projeto-path] [scope]"
disable-model-invocation: true
---

# ag-Q-13 — Testar Codigo

Spawn the `ag-Q-13-testar-codigo` agent to create and run unit/integration tests.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-Q-13-testar-codigo`
- `mode`: `bypassPermissions`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
Scope: [modulo especifico, arquivo, ou "full" para suite completa]
Framework: [vitest, jest, pytest, ou "auto-detect"]
Modo: [--from-spec (Red/TDD) | pos-implementacao (Green) | default]

$ARGUMENTS

Criar e executar testes. Para suite completa, usar Agent Teams (unit + integration + e2e em paralelo).
Registrar falhas em errors-log.md. Seguir anti-teatralidade: cada expect() DEVE poder falhar.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user
- Supports parallel test execution via Agent Teams for full suites
- Follows anti-theatricality rules: no `.catch(() => false)`, no `|| true`, no always-true expects

## Tipos de Teste Esperados

| Tipo | Escopo | Exemplo |
|------|--------|---------|
| Unit | Funcao isolada, logica pura | `calculateDiscount(price, coupon)` |
| Integration | Componentes juntos, DB, APIs | Service + Repository + real DB |
| Smoke | Importa sem erro, endpoint retorna status valido | `import { MyService }` sem crash |
| Error boundary | Input invalido, erro tratado | `null`, `undefined`, string vazia |
| Access control | Role com/sem permissao (min 2 roles) | admin=200, viewer=403, anon=401 |

**NAO faz E2E (browser, UI)** — isso e do ag-Q-22.

## Template por Funcao (minimo)

```typescript
describe('NomeDaFuncao', () => {
  test('happy path — valor hard-coded da spec', () => {
    expect(fn(validInput)).toBe(expectedOutput); // hard-coded, NUNCA calculado
  });
  test('error path — input invalido retorna erro', () => {
    expect(() => fn(null)).toThrow('Expected error message');
  });
  test('edge case — vazio', () => {
    expect(fn('')).toBe(defaultValue);
  });
  test('edge case — limite/negativo', () => {
    expect(fn(-1)).toBe(boundaryResult);
  });
  // Se app tem roles:
  test('access control — role sem permissao', () => {
    expect(fn(viewerContext)).rejects.toThrow('Forbidden');
  });
});
```

## Theatrical Testing Detection (pos-escrita)

Rodar ANTES de declarar done:
```bash
grep -rn "\.catch.*=>.*false" --include="*.test.ts"
grep -rn "|| true" --include="*.test.ts"
grep -rn "toBeGreaterThanOrEqual(0)" --include="*.test.ts"
```
Se qualquer grep retorna resultados → corrigir ANTES de commit.

## Modos de Operacao

### --from-spec (Red/TDD)
1. Ler SPEC.md ou task_plan.md
2. Se test-map.md existir → seguir mapeamento RF-NN/RNF-NN/EC-NN
3. Gerar testes que DEVEM FALHAR (Red phase)
4. Confirmar que TODOS falham
5. NUNCA implementar codigo — apenas testes

### pos-implementacao (Green)
1. Executar testes existentes (incluindo Phase 0)
2. Todos devem PASSAR (Green phase)
3. Se algum falha → reportar para ag-B-09 ou ag-B-08
4. Atualizar test-map.md se existir (red → green)

## Interacao com Outros Agentes
- **ag-P-07** → envia spec para modo --from-spec (Phase 0)
- **ag-B-08** → apos build, verifica se testes passam (Green)
- **ag-B-09** → se testes revelam bugs, escalar para depuracao
- **ag-Q-22** → E2E/browser tests (dominio separado)

## Output

- Arquivos de teste no projeto (unit e integracao)
- test-report.md com cobertura e resultados
- Zero instancias de anti-patterns teatrais
- errors-log.md atualizado se bugs encontrados

## Anti-Patterns

- NUNCA testar apenas happy path — se so testa quando funciona, nao sabe quando quebra
- NUNCA criar testes dependentes de ordem — testes devem ser independentes e idempotentes
- NUNCA usar `.catch(() => false)` — mascara falhas reais; isVisible() nunca throws
- NUNCA usar `expect(a || b).toBe(true)` — tautologia; passa com qualquer truthy
- NUNCA testar apenas com role de maior privilegio — testar COM e SEM acesso (min 2 roles)

## Quality Gate

- [ ] Happy path E error path testados?
- [ ] Edge cases cobertos (null, vazio, negativo, limites)?
- [ ] Todos os testes passam?
- [ ] errors-log.md atualizado se bugs encontrados?
- [ ] Zero anti-patterns teatrais (grep verification)?
