# Testing Patterns (Cross-Project)

## Principio: Anti-Teatralidade

Cada `expect()` DEVE ser capaz de FALHAR em cenario real.
Se nunca pode falhar, e decoracao, nao teste. Remova.

### NUNCA (BLOCKING)
```typescript
// 1. Mascara erro real
.catch(() => false)

// 2. Tautologia — passa independente de x
expect(x || true).toBe(true)

// 3. Pode nao testar nada se condition=false
if (condition) { expect() } // sem else

// 4. Array.length SEMPRE >= 0
expect(arr.length).toBeGreaterThanOrEqual(0)

// 5. Zero verificacao
test('name', () => { /* sem expect */ })

// 6. Circular — bug no codigo = bug no teste
const result = calculate(x); expect(result).toBe(calculate(x));
```

### SEMPRE (OBRIGATORIO)
1. Hard-code valores esperados da spec
2. Testar AMBOS paths: sucesso E falha
3. Testar input invalido: null, undefined, vazio, negativo
4. Access control: COM e SEM permissao (>= 2 roles)
5. Verificar RESULTADO, nao apenas que funcao foi chamada

### Mutation Mental
Antes de declarar done, para cada expect():
> "Se eu introduzir um bug na implementacao, este teste FALHA?"

## Testes Obrigatorios para Novos Modulos

| Tipo | Arquivo | Blocking? |
|------|---------|-----------|
| Smoke | `*.smoke.test.ts` | SIM |
| Error Boundary | `*.error.test.ts` | SIM |
| Access Control | `*.access.test.ts` | SIM (rotas protegidas) |
| Unit (logica) | `*.test.ts` | Recomendado |

### Smoke Test Template
```typescript
describe('ModuleName - Smoke', () => {
  test('imports without error', () => {
    expect(() => require('./module')).not.toThrow();
  });

  test('endpoint returns valid status', async () => {
    const res = await fetch('/api/module');
    expect([200, 401, 403]).toContain(res.status);
  });
});
```

### Access Control Template
```typescript
describe('ModuleName - Access Control', () => {
  test('authorized user gets data', async () => {
    const res = await authenticatedRequest('admin', '/api/module');
    expect(res.status).toBe(200);
  });

  test('unauthorized user gets 403', async () => {
    const res = await authenticatedRequest('guest', '/api/module');
    expect(res.status).toBe(403);
  });

  test('unauthenticated gets 401', async () => {
    const res = await fetch('/api/module');
    expect(res.status).toBe(401);
  });
});
```

## Coverage

### Thresholds (minimo)
- Lines: 60%
- Functions: 60%
- Branches: 60%
- Statements: 60%

### Nota sobre test runners
- **raiz-platform**: Jest + @swc/jest
- **rAIz-AI-Prof**: Vitest + v8 coverage
- Patterns sao os mesmos — apenas runner e config diferem

## Deteccao Automatica
```bash
grep -rn "\.catch.*=>.*false" --include="*.test.ts"
grep -rn "|| true" --include="*.test.ts"
grep -rn "toBeGreaterThanOrEqual(0)" --include="*.test.ts"
```
Se qualquer grep retorna resultados → corrigir ANTES de commit.

## Jest vs Vitest

### ADR-002: Ambos aceitos
| Aspecto | Jest | Vitest |
|---------|------|--------|
| Projetos | raiz-platform | rAIz-AI-Prof |
| Transform | @swc/jest | Vite (nativo ESM) |
| Config | jest.config.ts | vitest.config.ts |
| Coverage | istanbul | v8 |
| Speed | Mais lento (transform) | Mais rapido (ESM nativo) |
| Compatibilidade | Maduro, mais plugins | API compativel com Jest |

### Regra: usar o runner do projeto
- Nao misturar Jest e Vitest no mesmo projeto
- Patterns de teste sao os mesmos — apenas runner e config diferem
- Migrar Jest → Vitest quando projeto fizer major refactor

## Mocking Strategies

### MSW para HTTP (preferido)
```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.get('/api/users', () => {
    return HttpResponse.json({ data: [{ id: '1', name: 'Test User' }] });
  }),
  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ data: { id: '2', ...body } }, { status: 201 });
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Module Mocking (jest.mock / vi.mock)
```typescript
// Vitest
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockResolvedValue({ data: [], error: null }),
  }),
}));

// Jest
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockResolvedValue({ data: [], error: null }),
  }),
}));
```

### Regra de ouro
- Mock apenas dependencias EXTERNAS (DB, APIs, filesystem)
- NUNCA mock logica de negocio que esta sendo testada
- Preferir MSW para HTTP (intercepta na camada de rede, mais realista)
- Module mock apenas quando MSW nao cobre (ex: Supabase client direto)

## Mutation Testing

### Stryker (target 80%)
```bash
# Rodar mutation testing
npx stryker run

# Rodar em arquivo especifico
npx stryker run --mutate 'src/lib/auth.service.ts'
```

### O que mede
- Mutation score = % de mutantes detectados pelos testes
- Mutante = mudanca sintetica no codigo (ex: `>` vira `<`, `true` vira `false`)
- Se teste NAO falha com mutante → teste e fraco (teatral)

### Thresholds
| Score | Avaliacao |
|-------|-----------|
| > 80% | Excelente — testes detectam bugs reais |
| 60-80% | Aceitavel — melhorar edge cases |
| < 60% | Fraco — testes sao decorativos |

### Workflow semanal
- CI roda Stryker semanalmente (mutation-testing.yml)
- Resultados em HTML report
- Priorizar modulos criticos (auth, payments, data access)

## Async Test Patterns

### waitFor (polling até condicao)
```typescript
import { waitFor } from '@testing-library/react';

await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
}, { timeout: 5000 });
```

### act (state updates)
```typescript
import { act } from '@testing-library/react';

await act(async () => {
  fireEvent.click(submitButton);
});
// Apos act(), verificar o resultado
expect(screen.getByText('Success')).toBeInTheDocument();
```

### findBy* (waitFor + getBy combinados)
```typescript
// Prefira findBy* em vez de waitFor + getBy
const element = await screen.findByText('Data loaded');
expect(element).toBeInTheDocument();
```

### NUNCA em testes async
- `setTimeout` para esperar render (use waitFor/findBy)
- `await new Promise(r => setTimeout(r, 1000))` (flaky)
- Ignorar act warnings (indica state update nao wrappado)

## Coverage Goals by Project Type

| Tipo | Lines | Functions | Branches | Notas |
|------|-------|-----------|----------|-------|
| Library/SDK | 80% | 80% | 75% | API publica 100% |
| App (full-stack) | 60% | 60% | 60% | Focar em logica critica |
| CLI tool | 70% | 70% | 65% | Happy path + error handling |
| E2E suite | N/A | N/A | N/A | Medir por cenarios cobertos |

### Nota sobre coverage
- Coverage alta NAO garante testes bons (pode ser teatral)
- Coverage baixa GARANTE que ha codigo nao testado
- Combinar coverage com mutation testing para avaliacao real
