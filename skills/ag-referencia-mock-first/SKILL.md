---
name: ag-referencia-mock-first
description: Metodologia Mock-First para frontends de integracao. 6 fases (mock data → UI → auditoria UX → preparacao integracao → validacao → execucao). Carregado on-demand como referencia.
model: sonnet
context: fork
argument-hint: "[fase ou duvida]"
allowed-tools: Read, Glob, Grep
metadata:
  filePattern: ["**/mock-data*.ts", "**/mock-store*.ts", "**/adapters/*.ts", "**/providers/*.ts", "**/feature-flags.ts", "**/api-contracts.ts"]
  bashPattern: []
---

# ag-referencia-mock-first — Metodologia Mock-First (Reference Skill)

## Quando usar

- Iniciando projeto que integra com API externa (ERP, CRM, legado)
- Planejando migração de mock data para API real
- Revisando se o protótipo está pronto para integração
- Definindo adapters, providers ou feature flags

## As 6 Fases

### Fase 1 — Estrutura e Mock Data
- Definir módulos e rotas (lista completa)
- Criar mock data com **seed determinístico** (reproduzível, 100-500 registros)
- Criar mock store mutável (Map in-memory para write-back)
- Criar schemas Zod para cada server action

### Fase 2 — UI Completa com Mock
- Construir todas as páginas consumindo mocks diretamente
- Padronizar design system (KPI Card, tabelas, cores, filtros)
- Server Actions com `safeAction(schema, data, handler)` pattern
- ActionResult<T> padronizado: `{ success, data }` | `{ success: false, error }`

### Fase 3 — Auditoria UX
- Capturar screenshots de **todas as rotas** via Playwright CLI
- Análise visual por critério (hierarquia, densidade, consistência, cores, empty states)
- Classificar problemas (P0 dados, P1 visual, P2 feature, P3 polish)
- Corrigir em sprints por prioridade

### Fase 4 — Preparação para Integração
- Error boundaries (`error.tsx`) em cada route group
- Loading states (`loading.tsx`) com skeleton
- API Contracts (interfaces TypeScript do shape externo)
- Adapters (ExternalType → AppType)
- Providers (flag → mock | API real)
- Feature Flags (toggle mock/real por módulo)
- REST/SOAP clients com gotchas documentadas no código

### Fase 5 — Validação e Qualidade
- Smoke test script (todas as rotas HTTP 200)
- Validação de consistência de dados (cross-references, totais)
- Build gate (0 erros TypeScript)
- Checklist de pré-requisitos externos
- Data flow diagram (read path + write path)

### Fase 6 — Integração (Execução)
- Migração progressiva por módulo (ligar flag → testar → deploy)
- Ordem: read simples → read filtrado → read detalhe → write simples → write complexo
- Critérios Go/No-Go por fase
- Rollback: desligar flag = volta ao mock instantaneamente

## Checklist — Pronto para Integrar?

- [ ] Todas as páginas funcionam com mock
- [ ] Auditoria UX feita (P0/P1 resolvidos)
- [ ] Error boundaries em todos os route groups
- [ ] Loading states em todos os route groups
- [ ] API contracts definidos
- [ ] Adapters implementados
- [ ] Providers implementados
- [ ] Feature flags configurados (todos false)
- [ ] Clients implementados com gotchas
- [ ] Smoke test passando
- [ ] Consistência de dados passando
- [ ] Build passando
- [ ] Data flow documentado
- [ ] Checklist pré-requisitos preenchido

## Referência completa

Documento detalhado: `~/Claude/assets/metodologia-mock-first-frontend.md`
