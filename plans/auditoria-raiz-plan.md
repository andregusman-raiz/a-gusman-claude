# Plano: auditoria-raiz — Sistema de Gestão de Auditoria

## Contexto

O Grupo Raiz recebeu **111 solicitações de auditoria externa** (financeira/contábil) distribuídas em 11 áreas. O sistema deve gerenciar o ciclo de vida completo: atribuição, coleta de evidências, prazos, aprovações e visão executiva — com integração TOTVS RM para automatizar extração de dados e Zeev BPM para workflows de aprovação.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router, Server Components) |
| UI | shadcn/ui + Tailwind 4 + Geist + Recharts |
| DB | Drizzle ORM + Neon Postgres |
| Auth | Clerk (multi-org = multi-coligada) |
| Integração | TOTVS RM (SOAP/REST), Zeev BPM (REST) |
| Storage | Vercel Blob (evidências/anexos) |
| Deploy | Vercel (porta local 3007) |

---

## Modelo de Dados (Drizzle — 14 tabelas)

```
coligada                    # Grupo econômico (multi-tenant)
├── id, nome, cnpj, codColigada (TOTVS), ativa

auditoria                   # Ciclo de auditoria (ex: "Auditoria 2025")
├── id, coligadaId, titulo, dataBase, dataInicio, dataLimite, status, auditorExterno

area_responsavel            # Áreas (T.I, Contabilidade, Financeiro, etc.)
├── id, nome, sigla, responsavelId (→ usuario)

solicitacao                 # Cada item da auditoria (111 itens)
├── id, auditoriaId, numero (#1-111), descricao, areaId
├── tipo (documento | recomendacao | evidencia)
├── prioridade (p0-p3), prazo, status (pendente | em_andamento | em_revisao | entregue | rejeitada)
├── responsavelId, revisorId
├── fonteAutomatica (totvs_dataserver | totvs_rest | zeev | manual)
├── configAutomacao (JSON: dataserver, filtros, periodo)

evidencia                   # Arquivos/documentos anexados
├── id, solicitacaoId, tipo (arquivo | link | relatorio_gerado)
├── nome, blobUrl, mimeType, tamanho, hash
├── uploadPor, validadoPor, validadoEm, status (pendente | aceita | rejeitada)

comentario                  # Histórico de comunicação por solicitação
├── id, solicitacaoId, autorId, texto, criadoEm

historico_status            # Audit trail de mudanças de status
├── id, solicitacaoId, statusAnterior, statusNovo, autorId, motivo, criadoEm

automacao_log               # Log de execuções automáticas (TOTVS/Zeev)
├── id, solicitacaoId, fonte, status (sucesso | erro | parcial)
├── payload (JSON), erro, executadoEm, duracaoMs

usuario                     # Usuários do sistema (sync Clerk)
├── id, clerkId, nome, email, cargo, areaId, coligadaId, role (admin | gestor | operador | auditor)

notificacao                 # Alertas de prazo, rejeição, etc.
├── id, usuarioId, tipo, titulo, lida, solicitacaoId, criadoEm

dashboard_cache             # Cache de métricas agregadas (atualizado por cron)
├── id, coligadaId, auditoriaId, metricas (JSON), atualizadoEm
```

**Relações-chave:**
- `coligada` 1:N `auditoria` 1:N `solicitacao` N:1 `area_responsavel`
- `solicitacao` 1:N `evidencia`, 1:N `comentario`, 1:N `historico_status`
- `usuario` pertence a `coligada` + `area_responsavel`

---

## Módulos & Páginas

### 1. Dashboard Executivo (`/`)
- KPIs: total solicitações, % atendidas, % atrasadas, por área
- Gráfico de progresso por área (barras empilhadas)
- Timeline de prazos críticos (próximos 7/15/30 dias)
- Filtro por coligada (multi-tenant)

### 2. Solicitações (`/solicitacoes`)
- Tabela com filtros: área, status, prioridade, tipo, responsável
- Bulk actions: atribuir responsável, alterar prioridade
- Detalhe (`/solicitacoes/[id]`):
  - Descrição completa, metadados
  - Upload de evidências (drag & drop → Vercel Blob)
  - Histórico de status (timeline)
  - Comentários (thread)
  - Botão "Gerar Automático" (quando fonte TOTVS configurada)
  - Workflow de revisão: operador envia → gestor revisa → auditor aceita/rejeita

### 3. Áreas (`/areas`)
- Cards por área com progresso (gauge)
- Drill-down: solicitações da área, responsáveis, prazos

### 4. Automações (`/automacoes`)
- Mapeamento: solicitação ↔ DataServer TOTVS ou endpoint
- Config de período/filtros por solicitação
- Log de execuções (sucesso/erro)
- Botão "Executar agora" + Cron (diário/semanal)

### 5. Relatórios (`/relatorios`)
- Export Excel da base completa (como a planilha original, mas com status)
- Relatório de progresso por auditoria
- Relatório de SLA (prazos cumpridos vs atrasados)

### 6. Configuração (`/config`)
- Gestão de coligadas
- Gestão de áreas e responsáveis
- Conexões TOTVS RM (credenciais por coligada)
- Conexão Zeev (token)

---

## Integrações TOTVS RM

Mapeamento solicitação → DataServer/API para extração automática:

| # | Solicitação | Fonte TOTVS | Método |
|---|------------|-------------|--------|
| 1 | Provisões férias/13º | FopFuncData (PFunc) | SOAP ReadView |
| 2-6 | Contas a pagar/receber | FinLancamentoData (FLAN) | SOAP ReadView + filtro status |
| 7,30,32 | Imobilizado | Imobiliário DataServers | SOAP ReadView |
| 11-13 | Relatórios financeiros | FinLancamentoData | SOAP + wsConsultaSQL |
| 25-26 | Folha analítica/sistêmica | FopFuncData | SOAP ReadView |
| 27-29 | Admitidos/demitidos/ativos | FopFuncData (filtro status) | REST /rh/v1/employeehistorystatus |
| 34 | Faturamento | wsMov | SOAP |
| 37 | Razão geral | CtbLancamentoData | SOAP ReadView |
| 44 | Balancetes | CtbContaData + CtbLancamentoData | SOAP |
| 55 | Guias FGTS/INSS | FopFuncData (encargos) | SOAP |

**~25 das 111 solicitações** podem ser automatizadas via TOTVS RM.
As demais são documentos manuais (contratos, atas, políticas) ou recomendações de processo.

---

## Integração Zeev BPM

- **Criar instância** de workflow quando solicitação muda para `em_revisao`
- **Consultar status** de aprovação via `/api/2/instances/{id}`
- **Receber callback** quando tarefa é completada (webhook → `/api/webhooks/zeev`)
- **Comentários** sincronizados via `/api/2/messages`

---

## Estrutura de Pastas

```
~/Claude/GitHub/auditoria-raiz/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Login/registro Clerk
│   │   │   ├── sign-in/
│   │   │   └── sign-up/
│   │   ├── (dashboard)/         # Layout com sidebar
│   │   │   ├── page.tsx         # Dashboard executivo
│   │   │   ├── solicitacoes/
│   │   │   │   ├── page.tsx     # Lista com filtros
│   │   │   │   └── [id]/page.tsx # Detalhe + evidências
│   │   │   ├── areas/
│   │   │   │   └── page.tsx     # Cards por área
│   │   │   ├── automacoes/
│   │   │   │   └── page.tsx     # Config + logs
│   │   │   ├── relatorios/
│   │   │   │   └── page.tsx     # Exports + relatórios
│   │   │   └── config/
│   │   │       └── page.tsx     # Coligadas, áreas, conexões
│   │   ├── api/
│   │   │   ├── solicitacoes/    # CRUD + bulk actions
│   │   │   ├── evidencias/      # Upload Blob + validação
│   │   │   ├── automacoes/      # Trigger TOTVS extraction
│   │   │   ├── webhooks/zeev/   # Callback Zeev BPM
│   │   │   └── cron/            # Sync TOTVS, alertas prazo
│   │   └── layout.tsx
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.ts        # Drizzle schema (14 tabelas)
│   │   │   ├── index.ts         # Conexão singleton
│   │   │   ├── queries.ts       # Queries reutilizáveis
│   │   │   └── seed.ts          # Seed com 111 solicitações da planilha
│   │   ├── totvs/
│   │   │   ├── client.ts        # SOAP/REST client (reuso salarios-platform)
│   │   │   ├── dataservers.ts   # Mapeamento DataServer por solicitação
│   │   │   └── extractors.ts    # Lógica de extração por tipo
│   │   ├── zeev/
│   │   │   ├── client.ts        # API client Zeev
│   │   │   └── workflows.ts     # Criar/consultar instâncias
│   │   ├── auth.ts              # Clerk helpers + multi-coligada
│   │   ├── blob.ts              # Vercel Blob upload helpers
│   │   └── utils.ts             # cn(), formatters
│   └── components/
│       ├── ui/                  # shadcn/ui components
│       ├── dashboard/           # KPIs, charts, gauges
│       ├── solicitacoes/        # Tabela, filtros, detalhe
│       ├── evidencias/          # Upload, preview, validação
│       └── layout/              # Sidebar, topbar, coligada-switcher
├── drizzle.config.ts
├── next.config.ts
├── package.json
├── tsconfig.json
└── docs/
    └── spec.md
```

---

## Seed Inicial

O `seed.ts` importará as 111 solicitações diretamente da planilha Excel, criando:
- 11 áreas responsáveis
- 111 solicitações com tipo, área e número
- Mapeamento de automação para as ~25 solicitações TOTVS-compatíveis

---

## Fases de Implementação

### Fase 1 — Scaffold + Schema + Seed (MVP)
1. Criar projeto Next.js 16 + shadcn + Drizzle/Neon
2. Schema completo (14 tabelas)
3. Seed com 111 solicitações da planilha
4. Auth Clerk (multi-org)
5. Layout (sidebar, topbar, coligada-switcher)
6. Dashboard executivo (KPIs + gráficos)
7. CRUD solicitações (lista + detalhe)
8. Upload evidências (Vercel Blob)

### Fase 2 — Automação TOTVS
9. Client TOTVS (reuso salarios-platform)
10. Mapeamento DataServer por solicitação
11. Extração automática (~25 solicitações)
12. Log de automação

### Fase 3 — Workflow + Relatórios
13. Integração Zeev (criar/consultar workflows)
14. Notificações de prazo
15. Export Excel + relatórios
16. Cron jobs (sync + alertas)

---

## Porta Localhost

**3007** — `npm run dev -- -p 3007`

(Próxima disponível após salarios-platform:3006)
