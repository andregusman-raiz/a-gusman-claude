---
description: "Convencoes de naming para projetos TypeScript/React"
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "domain/**/*"
---

# Naming Conventions

## Arquivos
- `snake_case` para domain/logic files
- `PascalCase` para componentes React

## Domain Modules (DDD)
Cada dominio segue: `domain/{nome}/v{n}/`
- Schema: `{nome}_v{n}.schema.ts`
- Store: `{nome}_v{n}.store.ts`
- Service: `{nome}_v{n}.service.ts`
- Generator (LLM): `{nome}_v{n}.generator.ts`
- Types: `{nome}_v{n}.types.ts`

Exemplo concreto: `domain/questoes/v2/questoes_v2.service.ts`

## Imports
- Cross-domain: `@/domain/auth/v1/auth_v1.service`
- Same domain: `./questoes_v2.schema`
- React hooks: `useNome.ts` (ex: `useAuth.ts`)

## TypeScript
- `interface` para objetos, `type` para unions/intersections
- Zod para validacao de schemas com versionamento (v0, v1, etc.)
- Evitar `any` — usar tipos explicitos
