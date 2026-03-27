---
name: ag-testar-codigo
description: "Cria e executa testes unitarios e de integracao. Verifica logica, nao experiencia de usuario. Registra falhas em errors-log.md."
model: sonnet
argument-hint: "[projeto-path] [scope]"
disable-model-invocation: true
---

# ag-testar-codigo — Testar Codigo

Spawn the `ag-testar-codigo` agent to create and run unit/integration tests.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-testar-codigo`
- `mode`: `bypassPermissions`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
Scope: [modulo especifico, arquivo, ou "full" para suite completa]
Framework: [vitest, jest, pytest, ou "auto-detect"]
Modo: [--from-spec (Red/TDD) | pos-implementacao (Green) | default]


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

**NAO faz E2E (browser, UI)** — isso e do ag-testar-e2e.

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
3. Se algum falha → reportar para ag-depurar-erro ou ag-implementar-codigo
4. Atualizar test-map.md se existir (red → green)

## Interacao com Outros Agentes
- **ag-planejar-execucao** → envia spec para modo --from-spec (Phase 0)
- **ag-implementar-codigo** → apos build, verifica se testes passam (Green)
- **ag-depurar-erro** → se testes revelam bugs, escalar para depuracao
- **ag-testar-e2e** → E2E/browser tests (dominio separado)

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

## Escalacao: Issues para Testes Falhando Persistentemente

Se testes falham E o agent nao consegue corrigir (ou nao e responsavel pelo fix):

```
Agent({
  subagent_type: "ag-registrar-issue",
  name: "issue-registrar",
  model: "haiku",
  run_in_background: true,
  prompt: "Repo: [detectar]\nOrigem: ag-testar-codigo\nSeveridade: [P1 se bloqueia CI, P2 se nao]\nTitulo: Test failure: [nome do teste]\nContexto: [test name, assertion que falha, expected vs actual, stack trace]\nArquivos: [arquivo de teste + arquivo testado]\nLabels: bug, test-failure"
})
```

- Testes que falham em CI (blocking) → P1, SEMPRE criar issue
- Testes que falham localmente (nao blocking) → registrar em errors-log.md, criar issue se persistir apos 2 runs

## Quality Gate

- [ ] Happy path E error path testados?
- [ ] Edge cases cobertos (null, vazio, negativo, limites)?
- [ ] Todos os testes passam?
- [ ] errors-log.md atualizado se bugs encontrados?
- [ ] Zero anti-patterns teatrais (grep verification)?
- [ ] Testes falhando persistentemente registrados como Issues via ag-registrar-issue?

### Property-Based Testing (Opcional)
Quando usar: funcoes puras com dominio definido (encode/decode, serialize, sort, filter).
Ferramenta: `fast-check` (TS/JS).
Propriedades universais a testar:
- **Round-trip**: `decode(encode(x)) === x`
- **Idempotencia**: `f(f(x)) === f(x)`
- **Comutatividade**: `f(a, b) === f(b, a)` (quando aplicavel)
- **Invariantes**: `sorted(arr).length === arr.length`

### Contract Testing (Para APIs entre servicos)
Quando usar: APIs consumidas por outros servicos ou times.
Ferramenta: Pact (consumer-driven contracts).
- Consumer define expectativas (mock do provider)
- Provider verifica que atende as expectativas
- Rodar em CI para detectar breaking changes antes de deploy

### TDD Discipline Reminder
| Fase | Responsavel | Acao |
|------|-------------|------|
| RED | Dev/Spec | Escreve teste com valor esperado hard-coded da spec |
| GREEN | ag-testar-codigo | Implementa minimo para teste passar |
| REFACTOR | ag-testar-codigo + Dev | Sugere refactoring, dev aprova |

> REGRA: NUNCA gerar teste E implementacao no mesmo run — cria circularidade.
