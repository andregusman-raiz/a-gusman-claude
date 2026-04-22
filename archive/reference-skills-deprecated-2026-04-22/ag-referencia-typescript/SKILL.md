---
name: ag-referencia-typescript
description: Patterns TypeScript strict mode, generics, utility types, e error handling
context: fork
user-invocable: false
---

# Skill: TypeScript Patterns

Referencia de patterns para TypeScript em modo strict.

## Quando Ativar

- Definindo tipos complexos
- Usando generics
- Implementando error handling tipado
- Trabalhando com Zod e inferencia

## Strict Mode (tsconfig recomendado)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  }
}
```

## Utility Types

```typescript
type UpdateUser = Partial<User>;
type RequiredUser = Required<User>;
type UserPreview = Pick<User, 'id' | 'name' | 'email'>;
type PublicUser = Omit<User, 'password' | 'secretKey'>;
type RolePermissions = Record<UserRole, Permission[]>;
type Config = Readonly<{ apiUrl: string; timeout: number }>;
type ServiceResult = ReturnType<typeof userService.findAll>;
type Users = Awaited<ReturnType<typeof userService.findAll>>;
```

## Generics

```typescript
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

interface ApiResponse<T = unknown> {
  data: T;
  error: string | null;
  status: number;
}

interface Repository<T, CreateInput, UpdateInput> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(input: CreateInput): Promise<T>;
  update(id: string, input: UpdateInput): Promise<T>;
  delete(id: string): Promise<void>;
}
```

## Discriminated Unions

```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return { success: false, error: 'Divisao por zero' };
  return { success: true, data: a / b };
}

const result = divide(10, 2);
if (result.success) {
  console.log(result.data); // TypeScript sabe que e number
}
```

## Zod + TypeScript

```typescript
import { z } from 'zod';

const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['admin', 'user', 'guest']),
});

type User = z.infer<typeof userSchema>;

// Validacao segura
const result = userSchema.safeParse(rawData);
if (result.success) {
  const user = result.data; // Tipado corretamente
}
```

## Error Handling

```typescript
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} com id ${id} nao encontrado`, 'NOT_FOUND', 404);
  }
}

class ValidationError extends AppError {
  constructor(details: z.ZodError) {
    super('Dados invalidos', 'VALIDATION_ERROR', 400);
  }
}
```

## Type Guards

```typescript
function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' && obj !== null && 'id' in obj && 'email' in obj;
}

function assertDefined<T>(val: T | null | undefined, name: string): asserts val is T {
  if (val == null) throw new AppError(`${name} e obrigatorio`, 'ASSERTION_FAILED');
}
```

## Async Patterns

```typescript
// Promise.allSettled para operacoes independentes
const results = await Promise.allSettled([fetchUsers(), fetchPosts()]);
const users = results[0].status === 'fulfilled' ? results[0].value : [];

// Retry com backoff
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try { return await fn(); }
    catch (error) {
      if (attempt === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, delay * Math.pow(2, attempt)));
    }
  }
  throw new Error('Unreachable');
}
```
