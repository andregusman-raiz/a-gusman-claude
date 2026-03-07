---
description: "Regras de ownership de arquivos para agents paralelos"
paths:
  - "**/*"
---

# Protocolo de Boundaries para Agents Paralelos

## Principio
Quando multiplos agents trabalham em paralelo, CADA agent tem ownership exclusivo.

## Regras de Ownership

### 1. Declarar Escopo Antes de Executar
Cada agent recebe:
- Lista EXPLICITA de arquivos que pode modificar
- Lista de arquivos que NAO pode tocar
- Escopo de commits

### 2. Sem Overlap
Se dois agents precisam do mesmo arquivo → NAO paralelizar.

### 3. Arquivos Compartilhados (Read-Only)
- package.json / lock files
- tsconfig.json / configs de build
- middleware / tipos compartilhados / .env

Se agent precisa modificar shared file → reportar ao coordinator.

### 4. Coordinator Responsabilidades
- Dividir tasks em grupos independentes
- Atribuir ownership explicito
- Verificar que nao ha overlap
- Merge apenas branches verdes
- Resolver conflicts

### 5. Validation Gate por Agent
Antes de merge:
- Typecheck passando
- Lint passando
- Commit com mensagem descritiva

### 6. Limites
- Max 5 agents paralelos
- Max 8 arquivos por agent
- Se total < 6 tasks → usar sequencial

## Anti-Patterns
- NUNCA agents sem escopo definido
- NUNCA dois agents no mesmo arquivo
- NUNCA merge branch sem validation
- NUNCA modificar package.json em paralelo
