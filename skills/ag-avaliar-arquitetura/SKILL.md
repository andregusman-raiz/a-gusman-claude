---
name: ag-avaliar-arquitetura
description: "Maquina autonoma de saude arquitetural. 5D (STRUCTURE/COUPLING/DEBT/PATTERNS/SCALE), imports circulares, tech debt, consistencia. AQS >= 80."
model: opus
context: fork
argument-hint: "[path do projeto] [--threshold N] [--audit-only] [--resume]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TaskCreate, TaskUpdate, TaskList
metadata:
  filePattern: "architect-*.json,architect-*.md"
  bashPattern: "architect"
  priority: 90
---

# ARCHITECT — Saude Arquitetural

> **Reasoning protocol (Opus, equivalente a `reasoning_effort=xhigh`)**: Audit arquitetural raso = falso confort. Para cada dimensao (STRUCTURE/COUPLING/DEBT/PATTERNS/SCALE): Exhaust riscos plausiveis; Verify com Read de pelo menos 5 arquivos relevantes por dimensao; Falsify (esta dimensao realmente tem o problema que aparenta?); Connect achados a impacto operacional concreto; Report com paths/linhas exatos para cada finding. Findings sem path:linha = nao contam. Detalhes: `.claude/rules/deep-reasoning-directive.md`.

```
/architect ~/Claude/GitHub/raiz-platform
/architect ~/Claude/GitHub/salarios-platform --threshold 90
```

5 dimensoes: STRUCTURE (camadas), COUPLING (dependencias), DEBT (tech debt), PATTERNS (consistencia), SCALE (performance).
So modo local. Produz Architecture Certificate + Tech Debt Register + Fix PR.

## Dimensao PATTERNS — Checklist obrigatorio de Separation of Concerns

Para projetos React/Next/TS, a dimensao PATTERNS DEVE executar este checklist concreto (nao abstrato):

### 1. Fetch / mutation em componentes apresentacionais
```bash
# Componentes em pastas "burras" nunca devem chamar API direto
grep -rEn 'fetch\(|axios\.|supabase\.|prisma\.' \
  src/components/ui/ src/components/atoms/ src/components/presentational/ \
  2>/dev/null | grep -v ".test." | grep -v ".stories."
```
Resultado > 0 → finding HIGH (severidade ALTO).

### 2. Regra de negocio em UI components
```bash
# Calculos, validacoes, business rules dentro de componentes JSX
# Heuristica: funcoes nao-trivial dentro de .tsx (> 10 linhas, > 2 branches)
# Combinada com: file path em /components/ui ou /presentational
# AST custom: countFunctionsInFile + filterByComplexity
```
Cada match e candidato a extracao para hook (`useX`) ou service (`services/X.ts`).

### 3. Props drilling > 3 niveis (candidato a container)
```bash
# Buscar componentes que passam props sem usa-los (pass-through)
# AST: para cada componente, contar props recebidos vs usados localmente
# Se > 50% dos props sao apenas re-passados → candidato a container
```

### 4. Context usado para state que deveria ser local
- `useContext` em > 5 componentes para mesma fatia de state → candidato a state local + lifting
- Context com 1 unico consumer → eliminar Context

### 5. Inversao de dependencia em camadas
Para projetos com clean architecture / DDD:
- `domain/` NUNCA importa `infra/`, `ui/`, `api/`
- `application/` NUNCA importa `ui/`
- `infra/` pode importar `domain/` (implementa portas)
- Detectar via `madge --json` + filter por path patterns

### 6. Server Components vs Client Components (Next.js App Router)
- `"use client"` em arquivo que NAO precisa de interatividade (no useState/useEffect/event handlers) → finding MEDIO
- `"use server"` em handler que poderia ser Route Handler → finding BAIXO
- Server Component renderizando Client Component grande sem boundary → finding MEDIO

### 7. Mistura de responsabilidades em Server Actions / API routes
- API route fazendo: validation + business logic + DB query + email + analytics em 1 funcao → finding HIGH
- Sugestao: extrair para `services/` ou `use-cases/`

### Output esperado da PATTERNS

Para cada finding, registrar:
- `path:linha`
- Categoria (1-7 acima)
- Severidade (HIGH/MED/LOW)
- Fix sugerido em 1 linha (ex: "Extrair `calculateDiscount` para `services/pricing.ts`")
- Estimativa de impacto (LOC + numero de arquivos afetados)

Cobre prompts benchmark: separacao de responsabilidades, container/presentational, fetch direto em UI.
