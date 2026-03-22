# Agent Testing Patterns (Cross-Project)

## Principio: Todo Modulo Novo Nasce com Testes

NUNCA criar modulo sem pelo menos smoke + error boundary tests.
Testes sao parte do PR de criacao, nao afterthought.

## Organizacao de Testes

### Estrutura de Diretorios
```
src/
├── lib/
│   └── services/
│       ├── auth.service.ts
│       └── __tests__/
│           ├── auth.smoke.test.ts     # Import + basic response
│           ├── auth.error.test.ts     # Error handling paths
│           ├── auth.access.test.ts    # Role-based access
│           └── auth.test.ts           # Unit tests (logic)
├── app/
│   └── api/
│       └── users/
│           ├── route.ts
│           └── __tests__/
│               └── users.test.ts
└── components/
    └── ChatInput/
        ├── ChatInput.tsx
        └── __tests__/
            └── ChatInput.test.tsx
```

### Nomenclatura
| Tipo | Sufixo | Blocking? |
|------|--------|-----------|
| Smoke | `.smoke.test.ts` | SIM |
| Error Boundary | `.error.test.ts` | SIM |
| Access Control | `.access.test.ts` | SIM (rotas protegidas) |
| Unit | `.test.ts` | Recomendado |
| E2E | `.spec.ts` | Recomendado |

## Smoke Test Pattern

### Service Smoke
```typescript
// src/lib/services/__tests__/user.smoke.test.ts
import { describe, test, expect } from 'vitest';

describe('UserService - Smoke', () => {
  test('module imports without error', async () => {
    const module = await import('../user.service');
    expect(module).toBeDefined();
    expect(module.createUser).toBeTypeOf('function');
    expect(module.getUserById).toBeTypeOf('function');
  });

  test('exported functions have correct arity', () => {
    // Garante que refatoracao nao mudou assinatura
    expect(createUser.length).toBe(1); // 1 param: input
    expect(getUserById.length).toBe(1); // 1 param: id
  });
});
```

### API Route Smoke
```typescript
// src/app/api/users/__tests__/users.smoke.test.ts
import { describe, test, expect } from 'vitest';
import { GET, POST } from '../route';
import { createMockRequest } from '@/test/helpers';

describe('Users API - Smoke', () => {
  test('GET returns valid status code', async () => {
    const req = createMockRequest('GET');
    const res = await GET(req);
    expect([200, 401, 403]).toContain(res.status);
  });

  test('POST with empty body returns 422', async () => {
    const req = createMockRequest('POST', {});
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  test('response has correct content-type', async () => {
    const req = createMockRequest('GET');
    const res = await GET(req);
    expect(res.headers.get('content-type')).toContain('application/json');
  });
});
```

### Component Smoke
```typescript
// src/components/ChatInput/__tests__/ChatInput.smoke.test.tsx
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatInput } from '../ChatInput';

describe('ChatInput - Smoke', () => {
  test('renders without crash', () => {
    render(<ChatInput onSend={() => {}} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  test('submit button exists', () => {
    render(<ChatInput onSend={() => {}} />);
    expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument();
  });
});
```

## Error Boundary Test Pattern

### Service Errors
```typescript
// src/lib/services/__tests__/user.error.test.ts
import { describe, test, expect, vi } from 'vitest';
import { createUser, getUserById } from '../user.service';

describe('UserService - Error Handling', () => {
  test('createUser rejects invalid email', async () => {
    const result = await createUser({ email: 'not-an-email', name: 'Test' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_INPUT');
    }
  });

  test('createUser handles duplicate email', async () => {
    // First create succeeds
    await createUser({ email: 'dup@test.com', name: 'First' });

    // Second with same email fails
    const result = await createUser({ email: 'dup@test.com', name: 'Second' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('DUPLICATE_EMAIL');
    }
  });

  test('getUserById returns NOT_FOUND for nonexistent id', async () => {
    const result = await getUserById('00000000-0000-0000-0000-000000000000');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  test('handles null input gracefully', async () => {
    // Should not throw — should return error result
    const result = await createUser(null as any);
    expect(result.ok).toBe(false);
  });

  test('handles undefined fields gracefully', async () => {
    const result = await createUser({ email: undefined as any, name: undefined as any });
    expect(result.ok).toBe(false);
  });
});
```

### Component Error Boundary
```typescript
// src/components/ChatInput/__tests__/ChatInput.error.test.tsx
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInput } from '../ChatInput';

describe('ChatInput - Error Handling', () => {
  test('does not crash with empty onSend', () => {
    // onSend that does nothing — should not error
    render(<ChatInput onSend={() => {}} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.submit(input.closest('form')!);
    // Component should still be mounted
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  test('handles onSend throwing an error', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const throwingOnSend = () => { throw new Error('Network error'); };

    render(<ChatInput onSend={throwingOnSend} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });

    // Should not propagate — component handles it
    expect(() => {
      fireEvent.submit(input.closest('form')!);
    }).not.toThrow();

    errorSpy.mockRestore();
  });

  test('disables submit when input is empty', () => {
    render(<ChatInput onSend={() => {}} />);
    const button = screen.getByRole('button', { name: /enviar/i });
    expect(button).toBeDisabled();
  });
});
```

## Access Control Test Pattern

```typescript
// src/app/api/admin/users/__tests__/admin-users.access.test.ts
import { describe, test, expect } from 'vitest';
import { GET, DELETE } from '../route';
import { createAuthenticatedRequest, createAnonymousRequest } from '@/test/helpers';

describe('Admin Users API - Access Control', () => {
  test('superadmin can list users', async () => {
    const req = createAuthenticatedRequest('GET', { role: 'superadmin' });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toBeInstanceOf(Array);
  });

  test('core_team can list users', async () => {
    const req = createAuthenticatedRequest('GET', { role: 'core_team' });
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  test('external_agent gets 403', async () => {
    const req = createAuthenticatedRequest('GET', { role: 'external_agent' });
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  test('client gets 403', async () => {
    const req = createAuthenticatedRequest('GET', { role: 'client' });
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  test('unauthenticated gets 401', async () => {
    const req = createAnonymousRequest('GET');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  test('superadmin can delete user', async () => {
    const req = createAuthenticatedRequest('DELETE', {
      role: 'superadmin',
      params: { id: 'user-to-delete' },
    });
    const res = await DELETE(req);
    expect([200, 204]).toContain(res.status);
  });

  test('core_team cannot delete user', async () => {
    const req = createAuthenticatedRequest('DELETE', {
      role: 'core_team',
      params: { id: 'user-to-delete' },
    });
    const res = await DELETE(req);
    expect(res.status).toBe(403);
  });
});
```

## Mocking Strategies

### MSW for API Mocking
```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('https://api.external.com/data', () => {
    return HttpResponse.json({
      items: [{ id: 1, name: 'Mock Item' }],
    });
  }),

  http.post('https://api.external.com/data', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 2, ...body }, { status: 201 });
  }),

  // Simulate error
  http.get('https://api.external.com/error', () => {
    return HttpResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }),
];

// src/test/setup.ts
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Supabase Mock
```typescript
// src/test/mocks/supabase.ts
import { vi } from 'vitest';

export function createMockSupabase() {
  const mockData: Record<string, any[]> = {};

  const from = (table: string) => ({
    select: (columns?: string) => ({
      eq: (col: string, val: any) => ({
        single: () => {
          const item = mockData[table]?.find(r => r[col] === val);
          return Promise.resolve({
            data: item ?? null,
            error: item ? null : { code: 'PGRST116', message: 'Not found' },
          });
        },
        then: (resolve: any) => resolve({
          data: mockData[table]?.filter(r => r[col] === val) ?? [],
          error: null,
        }),
      }),
    }),
    insert: (record: any) => ({
      select: () => ({
        single: () => {
          const row = { id: crypto.randomUUID(), ...record };
          mockData[table] = [...(mockData[table] ?? []), row];
          return Promise.resolve({ data: row, error: null });
        },
      }),
    }),
  });

  return { from, _mockData: mockData };
}
```

### jest.mock for Modules
```typescript
// Inline mock — use sparingly
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => createMockSupabase()),
}));

// Prefer: dependency injection over mocking
// Instead of mocking, pass supabase as parameter
async function createUser(supabase: SupabaseClient, input: CreateUserInput) {
  // Testable without mocks — just pass mock client
}
```

## Anti-Theatrical Patterns

### NUNCA (Remover imediatamente se encontrar)
```typescript
// 1. Catch-and-swallow
const isVisible = await page.isVisible('.el').catch(() => false); // NUNCA

// 2. OR-chain tautology
expect(result || true).toBe(true); // NUNCA — sempre true

// 3. Conditional without else
if (await page.isVisible('.btn')) {     // NUNCA — pode nao testar
  expect(await page.textContent('.btn')).toBe('Click');
}

// 4. Always-true assertion
expect(items.length).toBeGreaterThanOrEqual(0); // NUNCA — length >= 0 sempre

// 5. Test without assertion
test('does something', async () => {   // NUNCA — nenhum expect
  await fetchData();
});
```

### SEMPRE
```typescript
// 1. Hard-coded expected values
expect(calculateTax(100)).toBe(10); // SIM — valor da spec, nao calculado

// 2. Test both paths
test('succeeds with valid input', async () => { /* ... */ });
test('fails with invalid input', async () => { /* ... */ });

// 3. Explicit else path
const button = page.getByRole('button', { name: 'Submit' });
await expect(button).toBeVisible(); // Falha se nao visivel — sem catch

// 4. Mutation mental
// "Se eu mudar calculateTax para retornar 0, este teste falha?" → SIM ✓
```

## E2E Test Structure (Playwright)

### Base Page Object
```typescript
// tests/e2e/pages/base.page.ts
import { Page, expect } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async navigateTo(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async expectNoConsoleErrors() {
    const errors: string[] = [];
    this.page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    // After test, check:
    expect(errors).toHaveLength(0);
  }

  async getToast() {
    return this.page.getByRole('status');
  }
}
```

### Fixtures
```typescript
// tests/e2e/fixtures.ts
import { test as base } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { DashboardPage } from './pages/dashboard.page';

type Fixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  authenticatedPage: DashboardPage;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginAs('test@example.com', 'test-password');
    const dashboard = new DashboardPage(page);
    await use(dashboard);
  },
});

export { expect } from '@playwright/test';
```

### Error Capture
```typescript
// tests/e2e/helpers/error-capture.ts
import { Page } from '@playwright/test';

export function captureErrors(page: Page) {
  const errors: string[] = [];
  const networkFailures: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  page.on('response', response => {
    if (response.status() >= 500) {
      networkFailures.push(`${response.status()} ${response.url()}`);
    }
  });

  return { errors, networkFailures };
}
```

## Test Helpers

### Request Factory
```typescript
// src/test/helpers.ts
export function createMockRequest(
  method: string,
  body?: Record<string, unknown>,
  headers?: Record<string, string>
): Request {
  return new Request('http://localhost:3000/api/test', {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function createAuthenticatedRequest(
  method: string,
  options: { role: string; params?: Record<string, string> }
): Request {
  return createMockRequest(method, undefined, {
    'x-test-role': options.role,
    'x-test-user-id': `test-${options.role}-user`,
  });
}

export function createAnonymousRequest(method: string): Request {
  return createMockRequest(method);
}
```

## Checklist por Modulo Novo

- [ ] Smoke test: importa sem erro, funcoes existem
- [ ] Error boundary: input invalido, null, undefined
- [ ] Access control: >= 2 roles testados (se rota protegida)
- [ ] Nenhum anti-pattern teatral (grep antes do commit)
- [ ] Coverage > 60% em linhas e branches
- [ ] Tests passam isolados (`vitest run path/to/test`)
