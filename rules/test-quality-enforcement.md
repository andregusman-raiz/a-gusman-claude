---
description: "Anti-teatralidade — cada expect() DEVE poder falhar em cenario real"
paths:
  - "**/*.test.ts"
  - "**/*.spec.ts"
  - "**/*.test.tsx"
  - "tests/**"
---

# Test Quality Enforcement — Anti-Teatralidade

## Regra de Ouro
Cada `expect()` DEVE ser capaz de FALHAR em cenario real.
Se nunca pode falhar, e decoracao, nao teste. Remova.

## NUNCA fazer em testes (BLOCKING)

1. `.catch(() => false)` — mascara erro real; Playwright isVisible() nunca throws
2. `expect(x || true).toBe(true)` — tautologia; passa independente de x
3. `if (condition) { expect() }` sem else — pode nao testar nada se condition=false
4. `expect(arr.length).toBeGreaterThanOrEqual(0)` — array.length SEMPRE >= 0
5. `test()` sem nenhum `expect()` — zero verificacao, sempre passa
6. Copiar logica da implementacao no teste — circular, bug no codigo = bug no teste

## SEMPRE fazer em testes (OBRIGATORIO)

1. Hard-code valores esperados da spec (nunca calcular no teste)
2. Testar AMBOS paths: sucesso E falha/erro
3. Testar input invalido: null, undefined, vazio, negativo, unicode
4. Access control: testar COM e SEM permissao (>= 2 roles quando aplicavel)
5. Verificar RESULTADO, nao apenas que funcao foi chamada (behavior > interaction)

## Mutation Mental (antes de declarar done)

Para cada expect(), perguntar:
> "Se eu introduzir um bug na implementacao, este teste FALHA?"

Se a resposta e "nao" → teste e teatral → reescrever.

## Template Minimo por Funcao

```
describe('NomeDaFuncao')
  test happy path     → valor hard-coded da spec
  test error path     → input invalido, erro de rede, etc.
  test edge case 1    → vazio, limite, null
  test edge case 2    → negativo, overflow, unicode
  test access control → role sem permissao (se aplicavel)
```

## Deteccao Automatica (grep)

```bash
grep -rn "\.catch.*=>.*false" --include="*.test.ts"
grep -rn "|| true" --include="*.test.ts"
grep -rn "toBeGreaterThanOrEqual(0)" --include="*.test.ts"
```

Se qualquer grep retorna resultados → corrigir ANTES de commit.
