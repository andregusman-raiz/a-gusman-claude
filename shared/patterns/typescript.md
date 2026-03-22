# TypeScript Patterns (Cross-Project)

## Strict Mode

### Objetivo: strict true em todos os projetos
- Usar `strict: true` no IDE (tsconfig.json)
- Debt tracking: `tsconfig.typecheck.json` com `strict: false` para CI gate
- Meta: migrar progressivamente ate eliminar tsconfig.typecheck.json

### Debt Management
```bash
# Contar erros atuais
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l

# Top errors por tipo
npx tsc --noEmit 2>&1 | grep -oP "TS\d+" | sort | uniq -c | sort -rn | head -10

# Erros por arquivo (priorizar hot files)
npx tsc --noEmit 2>&1 | grep "error TS" | cut -d'(' -f1 | sort | uniq -c | sort -rn | head -20
```

## Convencoes de Tipo

### Preferencias
```typescript
// interface para objetos
interface User {
  id: string;
  name: string;
  email: string;
}

// type para unions/intersections
type Status = 'active' | 'inactive' | 'pending';
type WithTimestamps<T> = T & { createdAt: Date; updatedAt: Date };
```

### Evitar `any`
```typescript
// MAL
function process(data: any) { ... }

// BOM
function process(data: unknown) {
  const parsed = schema.parse(data); // Zod valida
}
```

### Zod para Validacao
```typescript
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
});

type User = z.infer<typeof userSchema>;
```

## Imports

### Antes de commitar, verificar:
1. Remover imports nao utilizados (causa erro no lint-staged)
2. Verificar que exports removidos nao sao usados em outros arquivos
3. Rodar `npx tsc --noEmit` nos arquivos modificados

### Circular Imports
- Extrair types para arquivo separado (`*.types.ts`)
- Nunca importar service de dentro de outro service diretamente

## Naming

| Tipo | Padrao | Exemplo |
|------|--------|---------|
| Arquivo logica | snake_case | `auth_service.ts` |
| Componente React | PascalCase | `ChatInput.tsx` |
| Service | `*.service.ts` | `chat.service.ts` |
| Schema | `*.schema.ts` | `user.schema.ts` |
| Types | `*.types.ts` | `auth.types.ts` |
| Hook | `use*.ts` | `useAuth.ts` |
| Repository | `*.repository.ts` | `user.repository.ts` |
| Test | `*.test.ts` | `auth.test.ts` |
| E2E | `*.spec.ts` | `login.spec.ts` |

## Advanced Generics

### Constrained Generics
```typescript
// Restringir T a objetos com id
function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}

// Restringir key a chaves de T
function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => { result[key] = obj[key]; });
  return result;
}
```

### Conditional Types
```typescript
// Tipo condicional: extrai tipo de retorno de funcao async
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

// Tipo condicional: diferencia por discriminant
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };
```

### Mapped Types
```typescript
// Tornar todos os campos opcionais e nullable
type NullablePartial<T> = { [K in keyof T]?: T[K] | null };

// Tornar campos readonly exceto os especificados
type ReadonlyExcept<T, K extends keyof T> = Readonly<Omit<T, K>> & Pick<T, K>;
```

## Type Guards and Predicates

### is Pattern (narrowing)
```typescript
interface Admin { role: 'admin'; permissions: string[] }
interface Member { role: 'member'; teamId: string }
type User = Admin | Member;

function isAdmin(user: User): user is Admin {
  return user.role === 'admin';
}

// Uso: TypeScript sabe que user e Admin dentro do if
if (isAdmin(user)) {
  console.log(user.permissions); // tipo correto
}
```

### asserts Pattern (throw se invalido)
```typescript
function assertDefined<T>(value: T | null | undefined, name: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`Expected ${name} to be defined`);
  }
}

// Apos assertDefined, TypeScript sabe que user nao e null
const user = await getUser(id);
assertDefined(user, 'user');
console.log(user.name); // sem null check necessario
```

## Branded Types (Domain Validation)

### Pattern: tipos nominais para IDs e valores validados
```typescript
// Definicao do brand
type Brand<T, B extends string> = T & { __brand: B };

type UserId = Brand<string, 'UserId'>;
type Email = Brand<string, 'Email'>;
type PositiveInt = Brand<number, 'PositiveInt'>;

// Funcoes construtoras (validacao na entrada)
function toUserId(id: string): UserId {
  if (!id.match(/^[0-9a-f-]{36}$/)) throw new Error('Invalid UUID');
  return id as UserId;
}

function toEmail(email: string): Email {
  if (!email.includes('@')) throw new Error('Invalid email');
  return email as Email;
}

// Uso: impossivel passar string comum onde UserId e esperado
function getUser(id: UserId): Promise<User> { ... }
getUser('abc');          // ERRO de tipo
getUser(toUserId(id));   // OK
```

## Result Type (Discriminated Union for Error Handling)

### Pattern: alternativa a try/catch para erros esperados
```typescript
type Result<T, E = Error> =
  | { ok: true; data: T }
  | { ok: false; error: E };

// Funcao que retorna Result em vez de throw
async function parseConfig(raw: string): Result<Config, ValidationError> {
  const parsed = configSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    return { ok: false, error: new ValidationError(parsed.error) };
  }
  return { ok: true, data: parsed.data };
}

// Uso: forcado a tratar o erro pelo tipo
const result = await parseConfig(input);
if (!result.ok) {
  logger.error('Config invalid', result.error);
  return;
}
// result.data e tipado como Config aqui
```

### Quando usar Result vs try/catch
| Cenario | Pattern |
|---------|---------|
| Erro esperado (validacao, not found) | Result type |
| Erro inesperado (network, crash) | try/catch |
| Composicao de multiplas operacoes faliveis | Result type |
| Boundary de API (handler de rota) | try/catch |

## Utility Type Patterns

### Extract e Exclude
```typescript
type AllStatus = 'active' | 'inactive' | 'pending' | 'deleted';
type ActiveStatus = Extract<AllStatus, 'active' | 'pending'>; // 'active' | 'pending'
type ArchivedStatus = Exclude<AllStatus, 'active' | 'pending'>; // 'inactive' | 'deleted'
```

### Awaited (unwrap Promise)
```typescript
type UserData = Awaited<ReturnType<typeof getUser>>; // tipo retornado por getUser()
```

### ReturnType e Parameters
```typescript
function createItem(name: string, type: ItemType, options?: Options) { ... }

type CreateItemReturn = ReturnType<typeof createItem>;
type CreateItemParams = Parameters<typeof createItem>; // [string, ItemType, Options?]
```

### Record (mapa tipado)
```typescript
type ErrorMessages = Record<ErrorCode, string>;

const messages: ErrorMessages = {
  VALIDATION_ERROR: 'Dados invalidos',
  UNAUTHORIZED: 'Nao autenticado',
  FORBIDDEN: 'Sem permissao',
  // TypeScript EXIGE todos os ErrorCode aqui
};
```
