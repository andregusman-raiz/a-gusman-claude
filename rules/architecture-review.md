---
description: "Clean Architecture dependency rule e checklist SOLID para code review"
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "lib/**/*.ts"
---

# Architecture Review Checklist

## Clean Architecture — Dependency Rule
Dependencias SEMPRE apontam para dentro (Presentation -> Application -> Domain).

### Violacoes Comuns (BLOCKING em code review)
- Controller/Route handler com logica de negocio -> mover para Use Case
- Use Case importando ORM/Prisma/Supabase direto -> usar Repository interface
- Domain entity importando framework (Next.js, Express) -> isolar dominio
- Infrastructure retornando tipos do framework para Application -> usar DTOs

## Checklist para ag-Q-14

### Estrutura
- [ ] Dependency rule respeitada? (grep imports de cada camada)
- [ ] Domain layer livre de dependencias externas?
- [ ] Use Cases orquestram, nao implementam detalhes?

### SOLID
- [ ] SRP: cada classe/modulo tem 1 responsabilidade?
- [ ] OCP: novo comportamento via extensao (Strategy), nao modificacao?
- [ ] DIP: dependencias injetadas via interface?

### Clean Code
- [ ] Funcoes <= 40 linhas? Arquivos <= 300 linhas?
- [ ] Zero numeros magicos?
- [ ] Nomes descritivos (sem abreviacoes obscuras)?

## Severity Prefixes (para comentarios de review)
- **blocker**: Impede merge. Violacao arquitetural, bug, seguranca.
- **suggestion**: Melhoria recomendada. Nao impede merge.
- **nit**: Estilo/preferencia. Ignoravel.
- **question**: Pedir esclarecimento antes de aprovar.
