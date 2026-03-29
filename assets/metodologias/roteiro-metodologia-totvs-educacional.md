# Roteiro Metodológico — TOTVS Educacional Frontend

> Documento de referência completo descrevendo toda a metodologia aplicada na construção do protótipo, desde a concepção até a preparação para integração com o TOTVS RM. Este documento serve como handoff para qualquer desenvolvedor que for executar a próxima fase.

**Data**: 21 de Março de 2026
**Status**: Protótipo completo, pronto para integração
**Deploy**: Vercel (preview)
**Stack**: Next.js 16.2 + TypeScript + Tailwind CSS + Base UI (shadcn)

---

## Parte 1 — Visão Geral do Projeto

### 1.1 Objetivo

Construir um dashboard educacional completo que funciona como **frontend unificado** para o ERP TOTVS RM Educacional. O sistema substitui a interface nativa do TOTVS (pesada, lenta, não-mobile) por uma aplicação web moderna que consome as mesmas APIs.

### 1.2 Estratégia: Mock-First

A decisão arquitetural central foi **construir 100% da UI com dados mock** antes de qualquer integração com o TOTVS real. Isso permitiu:

1. **Validar UX com stakeholders** sem depender de credenciais/infra TOTVS
2. **Iterar rapidamente** — sem latência de API, sem bugs de integração
3. **Definir contratos** — os mocks definem exatamente o shape que a API deve retornar
4. **Derriscar** — quando a integração começar, a UI já está 100% pronta e testada

### 1.3 Números do Protótipo

| Métrica | Valor |
|---------|-------|
| Arquivos fonte (.ts/.tsx) | 125 |
| Páginas/rotas | 35 |
| Módulos | 6 (Secretaria, Pedagógico, Financeiro, Relatórios, Acadêmico, Explorar) |
| Sub-módulos | 22+ |
| Server Actions | 19 |
| Schemas Zod | 16 |
| Mock Data files | 7 |
| Componentes UI | 25+ |
| Specs documentadas | 14 |
| Docs de apoio | 4 |

---

## Parte 2 — Fases de Construção (O Que Foi Feito)

### Fase 1: Estrutura Base (pré-existente)

O protótipo inicial já continha:

**Secretaria**:
- Dashboard com KPIs (alunos, turmas, frequência, matrículas pendentes)
- Lista de alunos com filtros/paginação + detalhe por RA (5 tabs)
- Turmas em cards com progress bar de ocupação
- Enturmação dual-panel (alunos sem turma ↔ turmas disponíveis)
- Documentos (geração de boletim/histórico/declaração)
- Matrícula form wizard 5 etapas
- Pipeline de matrículas (funnel bar + KPIs + tabela filtrada)
- Detalhe de matrícula (stepper + tabs resumo/docs/contrato/financeiro)

**Pedagógico**:
- Dashboard do professor (turmas do dia + pendências)
- Diário de classe (chamada P/F/FJ)
- Lançamento de notas (inputs numéricos com cor semântica)
- Frequência consolidada (tabela aluno × período)
- Ocorrências (cards tipados + formulário)

**Financeiro**:
- Dashboard (KPIs + aging inadimplência + top 5 serviços)
- Faturamento por serviço (stacked bars + tabela)
- Detalhe por serviço
- Bolsas e descontos
- Contratos educacionais
- Renegociação
- Relatório mensal
- Financeiro por aluno

**Acadêmico**: Grade curricular + Calendário
**Explorar**: Drill-down Filial → Série → Turma → Aluno
**Relatórios**: Desempenho + Frequência

### Fase 2: Sistema de Notas Completo (esta sessão)

**Problema identificado**: A página de notas era apenas um formulário de lançamento. Não existia visão consolidada, análise estatística, ou comparações.

**Solução implementada** (7 arquivos novos + 3 modificados):

| Arquivo | Descrição |
|---------|-----------|
| `mock-data-notas.ts` | Interface NotaAluno + ~320 registros gerados por seed (20 alunos × 4 disciplinas × 2 bimestres × 2 filiais) + 10 helpers estatísticos |
| `schemas/notas.ts` | Schema Zod `lancarNotaSchema` |
| `actions/notas.ts` | Server action com persistência no mock-store |
| `notas/painel/page.tsx` | Dashboard analítico: 6 KPIs + histograma distribuição + ranking disciplinas + alertas risco |
| `notas/aluno/[ra]/page.tsx` | Boletim individual: grid disciplina×bimestre + evolução barras + posição na turma + percentil |
| `notas/comparativo/page.tsx` | 3 tabs: turma vs turma, filial vs filial, evolução temporal |
| `nota-distribution-chart.tsx` | Componente histograma 5 faixas com highlight + modo compact |

**Dados gerados**: Distribuição pseudo-gaussiana com seed, truncada [0,10], arredondada a 0.5. Matemática com bias -0.3 (mais difícil), Ciências +0.2. Recuperação: 40% chance se nota < 5. Duas filiais com médias diferentes (7.2 vs 6.8).

### Fase 3: Dashboard Inteligente de Matrículas (esta sessão)

**Problema identificado**: Dados de matrícula, financeiro e serviços existiam em silos separados sem JOIN. Não havia visão de captação, evasão, retenção, ticket médio dinâmico ou adesão de serviços.

**Solução implementada** (5 arquivos novos + 2 modificados):

| Arquivo | Descrição |
|---------|-----------|
| `mock-data-dashboard-matriculas.ts` | 420 alunos unificados cruzando matrícula × financeiro × serviços × bolsas × evasão + 15 helpers computados |
| `mini-funnel.tsx` | Componente funil reutilizável com barras proporcionais + % conversão |
| `matriculas/dashboard/page.tsx` | 8 KPIs + captação por canal + adesão serviços + indicadores mensais + evasão por motivo + bolsas/descontos |
| `matriculas/captacao/page.tsx` | Funil conversão 6 estágios + canais com ticket médio + novos por série (stacked) + captação mensal |
| `matriculas/retencao/page.tsx` | 4 KPIs + evasão por motivo + retenção por tempo + tabela alunos em risco (filtro) + cruzamento evasão×inadimpl. por série |

**Dados gerados**: 420 alunos (consistente com `FINANCEIRO_KPIS.totalAlunos`), 67 inadimplentes (15.9%), 21 evadidos (5%), ticket médio ~R$ 2.100. Distribuição: 65% renovação, 25% nova, 10% transferência. Canais: indicação 30%, site 25%, campanha 20%. 10 tipos de serviço com taxa de adesão realista.

### Fase 4: Auditoria UX Completa (esta sessão)

**Método**: Captura sistemática de 30 screenshots via Playwright CLI (todas as rotas incluindo sub-páginas) em viewport 1440×900. Análise visual especializada de cada screenshot.

**Resultado**:

| Módulo | Score | Destaque | Problema |
|--------|-------|----------|----------|
| Secretaria Dashboard | 8.5 | Layout exemplar | KPIs hardcoded |
| Turmas | 9.0 | Cards com progress bar | — |
| Pipeline | 9.0 | Funnel + KPIs + tabela | Falta % conversão |
| Boletim Aluno | 9.0 | Percentil + evolução | — |
| Faturamento | 9.0 | Stacked bars + tabs | Label truncado |
| Pedagógico Dashboard | 7.5 | Visão do professor | Muito vazio |
| Calendário | 7.0 | Grid mensal | Falta vista semanal |
| Contratos | 7.0 | Dropdown inline | Perigoso (acidental) |

**Score global**: 8.2/10

**7 problemas transversais identificados**:
1. Inconsistência de dados entre módulos (847 vs 420 vs 20 alunos)
2. Sidebar ficando longa (22+ items)
3. KPI cards com 3 padrões visuais diferentes
4. Tabelas sem empty states consistentes
5. Breadcrumbs com slugs crus
6. Sem cross-link entre módulos (financeiro ↔ pedagógico do mesmo aluno)
7. Date format inconsistente (mm/dd/yyyy no form)

### Fase 5: Correções UX — 4 Sprints (esta sessão)

**Sprint 1 — P0: Correções Críticas**
- Unificou "847 alunos" → 420 (computado de SERIES_DATA)
- Corrigiu date picker com `lang="pt-BR"`
- Corrigiu breadcrumbs: +7 labels (matriculas, faturamento, painel, comparativo, dashboard, captacao, retencao)

**Sprint 2 — P1: Consistência Visual**
- Criou `<KPICard>` compartilhado (`components/ui/kpi-card.tsx`)
- Migrou 5 dashboards para o componente único
- Removeu 4 implementações locais duplicadas

**Sprint 3 — P2: UX Gaps**
- Pedagógico Dashboard: +4 KPIs (turmas, alunos, chamadas, notas pendentes)
- Frequência: threshold 75% + contagem infrequentes + badge "Infrequente"
- Ocorrências: card de Mérito com borda/fundo emerald

**Sprint 4 — P3: Polish**
- Contratos: Select → Badge + DropdownMenu (mais seguro)
- Relatório Financeiro: alerta de tendência de inadimplência crescente

### Fase 6: Preparação para Integração (esta sessão)

**9 items de qualidade implementados**:

| # | Item | Descrição |
|---|------|-----------|
| 1 | Error Boundaries | 6 `error.tsx` (1 por route group) + `ErrorState` component |
| 2 | Loading States | 6 `loading.tsx` + `LoadingState` com skeleton |
| 3 | Smoke Test | Script bash validando 34 rotas (HTTP 200) |
| 4 | Checklist Pré-Requisitos | 12 items bloqueantes com responsável/status |
| 5 | Data Flow Diagram | Read path + write path + tabela TOTVS×módulos |
| 6 | Adapter Layer | Feature flags + REST client + SOAP client + 3 providers |
| 7 | API Contracts | 16 interfaces TypeScript para responses TOTVS + 4 mappings |
| 8 | Adapters | 3 adapters (aluno, nota, parcela) TOTVS → App domain |
| 9 | Validação Consistência | Script com 10 checks cross-module |

---

## Parte 3 — Arquitetura Técnica

### 3.1 Estrutura de Diretórios

```
src/
├── app/
│   ├── (app)/                          # Route group com layout (sidebar + topbar)
│   │   ├── secretaria/                 # 10 rotas
│   │   │   ├── page.tsx                # Dashboard
│   │   │   ├── alunos/page.tsx         # Lista
│   │   │   ├── alunos/[ra]/page.tsx    # Detalhe
│   │   │   ├── turmas/page.tsx
│   │   │   ├── enturmacao/page.tsx
│   │   │   ├── documentos/page.tsx
│   │   │   ├── matricula/page.tsx      # Form wizard
│   │   │   ├── matriculas/page.tsx     # Pipeline
│   │   │   ├── matriculas/[id]/page.tsx
│   │   │   ├── matriculas/dashboard/   # NOVO: Dashboard unificado
│   │   │   ├── matriculas/captacao/    # NOVO: Análise captação
│   │   │   ├── matriculas/retencao/    # NOVO: Retenção/evasão
│   │   │   ├── error.tsx               # NOVO: Error boundary
│   │   │   └── loading.tsx             # NOVO: Loading skeleton
│   │   ├── pedagogico/                 # 9 rotas
│   │   │   ├── page.tsx                # Dashboard professor
│   │   │   ├── diario/page.tsx
│   │   │   ├── notas/page.tsx          # Lançamento
│   │   │   ├── notas/painel/page.tsx   # NOVO: Dashboard analítico
│   │   │   ├── notas/comparativo/      # NOVO: 3 tabs comparação
│   │   │   ├── notas/aluno/[ra]/       # NOVO: Boletim individual
│   │   │   ├── frequencia/page.tsx
│   │   │   ├── ocorrencias/page.tsx
│   │   │   ├── error.tsx               # NOVO
│   │   │   └── loading.tsx             # NOVO
│   │   ├── financeiro/                 # 9 rotas
│   │   ├── relatorios/                 # 2 rotas
│   │   ├── academico/                  # 2 rotas
│   │   └── explorar/                   # 2 rotas
│   ├── actions/                        # 6 server action files, 19 actions total
│   └── page.tsx                        # Redirect → /secretaria
├── components/
│   ├── ui/                             # 21 componentes base (shadcn/Base UI)
│   │   ├── kpi-card.tsx                # NOVO: Compartilhado
│   │   ├── error-state.tsx             # NOVO
│   │   ├── loading-state.tsx           # NOVO
│   │   └── ...
│   ├── layout/
│   │   ├── app-shell.tsx               # Shell + breadcrumbs + responsividade
│   │   ├── sidebar.tsx                 # Dark sidebar com sections
│   │   └── topbar.tsx                  # Unidade selector + notificações
│   ├── secretaria/
│   │   ├── mini-funnel.tsx             # NOVO: Funil reutilizável
│   │   └── ...
│   ├── pedagogico/
│   │   ├── nota-distribution-chart.tsx # NOVO: Histograma
│   │   └── ...
│   ├── financeiro/
│   │   └── status-contrato-dropdown.tsx # MODIFICADO: Badge + DropdownMenu
│   └── explorar/
├── lib/
│   ├── mock-data.ts                    # 20 alunos, 13 turmas, 4 escolas + helpers
│   ├── mock-data-financeiro.ts         # 60 parcelas, 7 bolsas, 15 contratos, KPIs
│   ├── mock-data-notas.ts             # NOVO: ~320 registros + 10 helpers
│   ├── mock-data-matriculas.ts         # 20 matrículas pipeline
│   ├── mock-data-servicos.ts           # ~150 lançamentos, 10 tipos serviço
│   ├── mock-data-dashboard-matriculas.ts # NOVO: 420 alunos unificados
│   ├── mock-store.ts                   # Maps mutáveis in-memory
│   ├── schemas/                        # 6 arquivos, 16 schemas Zod
│   ├── totvs/                          # NOVO: Camada de integração
│   │   ├── api-contracts.ts            # 16 interfaces TOTVS
│   │   ├── feature-flags.ts            # Toggle mock/real
│   │   ├── adapters/                   # 3 adapters (TOTVS → App)
│   │   ├── clients/                    # REST + SOAP clients
│   │   └── providers/                  # 3 providers (mock → real)
│   └── utils.ts                        # cn() (clsx + tailwind-merge)
├── docs/
│   ├── specs/                          # 14 specs técnicas
│   ├── dicionario-dados-totvs-rm.md    # Tabelas/campos TOTVS
│   ├── data-flow.md                    # NOVO: Diagramas read/write
│   ├── checklist-pre-requisitos.md     # NOVO: 12 bloqueios
│   └── roteiro-metodologia-completa.md # ESTE ARQUIVO
└── scripts/
    ├── smoke-test.sh                   # NOVO: 34 rotas
    └── validate-mock-data.ts           # NOVO: 10 checks
```

### 3.2 Padrões de Design

**UI Patterns (consistentes em todo o app)**:
- KPI Cards: barra colorida top 0.5px + valor grande mono + label 11px + icon com bg transparente
- Tabelas: header com bg-muted/30, font-mono para dados numéricos, cores semânticas
- Barras horizontais: usadas para comparação (turmas, serviços, aging, captação, evasão)
- 3-tier color: emerald (bom) / amber (atenção) / red (crítico)
- Cores brand: #F7941D (laranja Raiz), #5BB5A2 (teal Raiz)
- Badges: outline com cores inline para status
- Filtros: Select no topo da página, dentro de Card
- Navegação: sidebar dark + breadcrumb + botões outline no header

**Data Patterns**:
- Mock data com seed determinístico (reproduzível)
- Interfaces TypeScript como contrato entre mock e real
- Server Actions com `safeAction(schema, data, handler)` pattern
- `ActionResult<T>` = `{ success, data }` | `{ success: false, error: { code, message } }`
- Feature flags para toggle mock/real por módulo
- Providers como abstração entre UI e data source

**Component Patterns**:
- Base UI (não Radix) — `render` prop em vez de `asChild`
- Select `onValueChange` aceita `string | null` — guard com `if (v !== null)`
- Button com `render={<Link href="..." />}` para links
- Error boundaries por route group
- Loading skeletons por route group

### 3.3 Design System

| Token | Valor | Uso |
|-------|-------|-----|
| Sidebar bg | `bg-sidebar` (dark) | Sidebar fixa |
| Active nav | `#F7941D` / 90% opacity | Item ativo no sidebar |
| Brand orange | `#F7941D` | CTAs primários, destaques |
| Brand teal | `#5BB5A2` | Sucesso, renovação, saúde |
| Bom | `text-emerald-700` | Nota ≥7, freq ≥85%, meta atingida |
| Atenção | `text-amber-700` | Nota 5-7, freq 75-85%, risco médio |
| Crítico | `text-red-700` | Nota <5, freq <75%, inadimplente |
| Mono | `font-mono` | RA, valores, notas, datas, IDs |
| Labels | `text-[11px] text-muted-foreground` | Labels de KPI, subtítulos |
| Headers | `text-xl font-semibold` | Títulos de página |

---

## Parte 4 — Modelo de Dados

### 4.1 Entidades (Mock)

| Entidade | Registros | Fonte | Consumidores |
|----------|-----------|-------|-------------|
| ESCOLAS | 4 | mock-data.ts | Explorar, contexto filial |
| TURMAS | 13 | mock-data.ts | Secretaria, Pedagógico |
| ALUNOS | 20 | mock-data.ts | Secretaria, cross-module |
| NOTAS | ~320 | mock-data-notas.ts | Pedagógico (4 páginas) |
| PARCELAS | 60 | mock-data-financeiro.ts | Financeiro (6 páginas) |
| BOLSAS | 7 | mock-data-financeiro.ts | Financeiro, Dashboard Mat. |
| CONTRATOS | 15 | mock-data-financeiro.ts | Financeiro |
| RENEGOCIACOES | 4 | mock-data-financeiro.ts | Financeiro |
| MATRICULAS_PIPELINE | 20 | mock-data-matriculas.ts | Pipeline (3 páginas) |
| LANCAMENTOS | ~150 | mock-data-servicos.ts | Faturamento (2 páginas) |
| ALUNOS_DASH | 420 | mock-data-dashboard-matriculas.ts | Dashboard Mat. (3 páginas) |
| OCORRENCIAS | 5 | mock-data.ts | Pedagógico |

### 4.2 Inconsistências Conhecidas (aceitas para protótipo)

| Inconsistência | Motivo | Impacto |
|---------------|--------|---------|
| ALUNOS tem 20 registros, FINANCEIRO_KPIS diz 420 | ALUNOS é amostra, 420 é total agregado | Baixo — amostra é suficiente para UI |
| RAs financeiro (20260001) vs secretaria (2026001) | Mocks criados em momentos diferentes | Médio — cross-link não funciona |
| BOLSAS somam R$ 5.760/mês vs FINANCEIRO_KPIS R$ 8.360 | KPIs incluem descontos além de bolsas formais | Baixo — dados são independentes |
| Turmas no mock de notas (6A, 6B, 7A, 7B) não existem em TURMAS | Notas usa turmas simplificadas | Baixo — isolado no módulo pedagógico |

### 4.3 Mapeamento Mock → TOTVS

| Mock Entity | Tabela TOTVS | DataServer | Status |
|------------|-------------|------------|--------|
| ALUNOS | SALUNO | EduAlunoData | Sem permissão (pendente TI) |
| TURMAS | STURMA | EduTurmaDiscData | ReadView OK |
| NOTAS | SNOTAS | EduNotasData | Não testado |
| FREQUENCIA | SFREQUENCIA | EduFrequenciaDiariaWSData | ReadRecord OK, ReadView BUG |
| PARCELAS | FLAN | FinLanData? | Não testado |
| BOLSAS | SBOLSAS | — | Não testado |
| CONTRATOS | FCFO | — | Não testado |
| ESCOLAS | GColigada/GFilial | GColigadaData | ReadView OK |

---

## Parte 5 — Server Actions (API Layer)

### 5.1 Inventário Completo

| Módulo | Action | Schema | Tabela TOTVS | Transport |
|--------|--------|--------|-------------|-----------|
| **Secretaria** | `enturmarAluno` | `{ ra, codTurma }` | SMATRICPL | SOAP |
| | `criarMatricula` | `{ nome, cpf?, sexo, mae, tel, serie, turma? }` | PPESSOA+SALUNO+SMATRICPL | SOAP ×3 |
| **Pedagógico** | `lancarNotas` | `{ turma, disciplina, etapa, notas[] }` | SNOTAS | SOAP EduNotasData |
| | `registrarFrequencia` | `{ turma, disciplina, data, presencas[] }` | SFREQUENCIA | SOAP EduFreqDiariaWSData |
| | `criarOcorrencia` | `{ ra, turma, tipo, descricao }` | SOCORRENCIAS | SOAP |
| | `lancarNota` | `{ ra, disciplina, etapa, nota }` | SNOTAS | SOAP |
| **Financeiro** | `alterarVencimento` | `{ idLan, novoVencimento, motivo }` | FLAN | SOAP |
| | `alterarDesconto` | `{ idLan, valorDesconto, motivo }` | FLAN | SOAP |
| | `gerarBoleto` | `{ idLan }` | FBOL | Bank API |
| | `criarBolsa` | `{ ra, tipo, %, vigencia, motivo }` | SBOLSAS | SOAP |
| | `editarBolsa` | `{ id, + criarBolsa }` | SBOLSAS | SOAP |
| | `criarRenegociacao` | `{ ra, parcelas[], desc%, novasParcelas }` | FLAN ×N | SOAP (txn) |
| | `atualizarStatusContrato` | `{ id, status, motivo? }` | FCFO | SOAP |
| **Pipeline** | `criarMatriculaPipeline` | `{ nome, cpf?, sexo, mae, tel, serie }` | PPESSOA+SALUNO | SOAP |
| | `avancarEstagio` | `{ id, estagio }` | SMATRICPL | SOAP |
| | `cancelarMatricula` | `{ id, motivo }` | SMATRICPL | SOAP |
| | `registrarDocumento` | `{ id, tipoDoc }` | Custom | App-only |
| | `gerarContrato` | `{ id }` | FCFO+FLAN×12 | SOAP ×13 |
| | `registrarAssinatura` | `{ id }` | FCFO | SOAP |
| | `registrarPagamento` | `{ id }` | FLAN | SOAP |

### 5.2 Regras de Negócio Documentadas no Código

1. **Frequência**: TOTVS só armazena FALTAS. Filtrar "P" antes de enviar.
2. **Contrato status**: State machine — `pendente→ativo→encerrado` ou `→cancelado`. Estados finais irreversíveis.
3. **Renegociação**: Máximo 30% desconto. Parcelas originais marcadas como "renegociada" e congeladas.
4. **Notas**: Situação calculada automaticamente (≥7 Aprovado, 5-7 Recuperação, <5 Reprovado).
5. **Pipeline**: Avanço de estágio validado por dependências (docs, contrato, pagamento).

---

## Parte 6 — Infraestrutura de Qualidade

### 6.1 Error Handling

```
Cada route group tem:
  error.tsx → <ErrorState onRetry={reset} />  (retry button)
  loading.tsx → <LoadingState />  (skeleton: header + 4 KPIs + 6 rows)
```

### 6.2 Smoke Test (`scripts/smoke-test.sh`)

- 34 rotas validadas (todas as páginas + sub-páginas dinâmicas)
- Aceita HTTP 200 e 307 (redirect)
- Output: `Total: 34 | Pass: N | Fail: M`
- Exit code 1 se qualquer falha
- Uso: `bash scripts/smoke-test.sh [BASE_URL]`

### 6.3 Validação de Consistência (`scripts/validate-mock-data.ts`)

10 checks:
1. FINANCEIRO_KPIS.totalAlunos = 420
2. ALUNOS_DASH.length = 420
3. Soma TURMAS.qtdAlunos = 420
4. Dashboard inadimplentes = 67
5. Ticket médio calculado ≈ FINANCEIRO_KPIS.ticketMedio
6. Turmas referenciadas existem
7. Escolas referenciadas existem
8. Notas referenciam alunos válidos
9. Bolsas ativas ≈ FINANCEIRO_KPIS.valorBolsasMensal
10. Serviços contratados cobrem ≥5 tipos

### 6.4 Build Gate

```bash
npm run build   # Next.js build — 0 erros TypeScript obrigatório
```

---

## Parte 7 — Camada de Integração (Preparada)

### 7.1 Arquitetura

```
UI (Pages) → Providers → Feature Flags → Mock Data (atual)
                                       → TOTVS API (futuro)
                                          ├── REST Client
                                          ├── SOAP Client
                                          └── Adapters (TOTVS → App)
```

### 7.2 Feature Flags

```typescript
flags.secretaria.alunos.read     // false → mock, true → TOTVS REST
flags.pedagogico.notas.read      // false → mock, true → TOTVS SOAP
flags.financeiro.parcelas.read   // false → mock, true → TOTVS SOAP
// ... 12 flags no total
```

Quando `read = true`, o provider chama o TOTVS client + adapter. Quando `false`, retorna dados do mock-store.

### 7.3 API Contracts (16 interfaces)

Representam o shape **exato** retornado pelo TOTVS:
- `TOTVSAluno` (SALUNO) → campos CODCOLIGADA, CODFILIAL, RA, NOME, CPF, etc.
- `TOTVSNota` (SNOTAS) → CODDISCIPLINA, ETAPA, NOTA, NOTARECUPERACAO, SITUACAO
- `TOTVSParcela` (FLAN) → IDLAN, DTVENC, VLRORIG, VLRDESC, STATLP
- `TOTVSBolsa` (SBOLSAS) → TIPO, PERCENTUAL, VLRMES, DTVIGINI/FIM
- `TOTVSContrato` (FCFO) → NUMCONTRATO, ANOLETIVO, VLRANUAL, STATUS
- + mappings: TOTVS_STATUS_ALUNO, TOTVS_STATUS_PARCELA, TOTVS_TIPO_BOLSA, etc.

### 7.4 Adapters (3 implementados)

Cada adapter transforma o shape TOTVS no shape que a UI espera:
- `aluno.adapter.ts`: `TOTVSAluno → AppAluno` (mapeia SEXO "M"/"F" → label, DATANASC → formato BR)
- `nota.adapter.ts`: `TOTVSNota → NotaAluno` (mapeia ETAPA "1B" → "1° Bimestre", SITUACAO "A" → "Aprovado")
- `parcela.adapter.ts`: `TOTVSParcela → Parcela` (mapeia STATLP "PG" → "paga", VLRDISP → valorAberto)

### 7.5 SOAP Client

Gotchas documentadas no código:
1. Path DEVE ser `/wsDataServer/IwsDataServer`
2. ReadView com `IN (...)` falha
3. Colunas ambíguas devem ser qualificadas
4. EduFrequenciaDiariaWSData ReadView tem bug — usar ReadRecord
5. Respostas contêm `&lt;` em vez de `<` — decode automático no client

### 7.6 Cache Strategy (planejada)

| Dado | TTL | Storage |
|------|-----|---------|
| Token OAuth | expires_in - 30s | In-memory |
| Turmas/alunos | 24h | Upstash Redis |
| Frequência | 0 (real-time) | Sem cache |
| Notas | 5min | Upstash Redis |
| Parcelas | 15min | Upstash Redis |

---

## Parte 8 — Specs Técnicas (14 documentos)

| Spec | Conteúdo |
|------|----------|
| spec-00 | Infraestrutura de integração: servidor, auth, DataServers, dual-token, cache |
| spec-01 | Secretaria: alunos, turmas, enturmação, documentos |
| spec-02 | Pedagógico: diário, notas, frequência |
| spec-03 | Financeiro: parcelas, bolsas, contratos, renegociação |
| spec-04 | Acadêmico: grade, calendário |
| spec-05 | Explorar: drill-down hierárquico |
| spec-06 | Migração mock → real: 5 fases, 15-21 dias |
| spec-07 | Autenticação e sessão |
| spec-08 | Notas e ocorrências |
| spec-09 | Permissões e perfis |
| spec-10 | Performance budget e SLAs |
| spec-11 | Tratamento de dados inconsistentes |
| spec-12 | Mobile responsiveness |
| spec-13 | Monitoring e observabilidade |
| spec-14 | Páginas complementares |

---

## Parte 9 — Pré-Requisitos para Iniciar Integração

### 9.1 Bloqueios por Terceiros

| # | Item | Responsável | Bloqueia |
|---|------|------------|----------|
| 1 | IP whitelist SOAP | TI TOTVS | Fase 2 |
| 2 | Permissão EduAlunoData | Admin TOTVS | Fase 1 |
| 3 | JWT extensão 300s → 480min | TI TOTVS | Opcional |
| 4 | Ambiente homologação escrita | TI TOTVS | Fase 4 |
| 5 | Testar DataServers financeiros | Dev | Fase 3 |
| 6 | VPS proxy SOAP | Infra | Fase 2 (se Vercel) |
| 7 | Upstash Redis | Infra | Fase 0 |
| 8 | Env vars (TOTVS_HOST, credentials) | Infra | Fase 0 |

### 9.2 Roadmap de Migração

| Fase | Escopo | Duração | Dependência |
|------|--------|---------|-------------|
| 0 — Infra | Auth client, SOAP/REST, cache, feature flags | 1-2 dias | #7, #8 |
| 1 — Secretaria Read | Turmas, alunos via REST | 2-3 dias | #2 |
| 2 — Pedagógico Read | Diário, frequência via SOAP | 3-4 dias | #1 ou #6 |
| 3 — Financeiro Read | Parcelas, bolsas, contratos via SOAP | 3-4 dias | #5 |
| 4 — Write Ops | Notas, frequência, vencimento via SOAP SaveRecord | 4-5 dias | #4 |
| 5 — Explorar | Drill-down, calendário, grade | 2-3 dias | — |

**Total estimado**: 15-21 dias úteis (3-4 semanas)

### 9.3 Critérios Go/No-Go

| Fase | Critério de sucesso |
|------|---------------------|
| 0 | Auth client retorna token válido |
| 1 | Lista 20+ alunos via REST |
| 2 | Frequência via SOAP em <2s |
| 3 | Parcelas listadas via SOAP |
| 4 | SaveRecord de nota executa sem erro |
| 5 | Drill-down retorna dados reais |

---

## Parte 10 — Como Continuar (Instruções para o Próximo Dev)

### 10.1 Setup Local

```bash
cd ~/Claude/projetos/totvs-educacional-frontend/app
npm install
npm run dev          # → http://localhost:3000
npm run build        # Verificar 0 erros
bash scripts/smoke-test.sh  # 34/34 pass
```

### 10.2 Para Iniciar Fase 0

1. Solicitar items #1, #2, #4 para TI TOTVS (email/ticket)
2. Provisionar Upstash Redis (#7)
3. Configurar env vars: `TOTVS_HOST`, `TOTVS_SERVICE_USER`, `TOTVS_SERVICE_PASS`
4. Implementar `src/lib/totvs/clients/auth.client.ts` (token management)
5. Testar com: `curl -X POST https://TOTVS_HOST/api/connect/token/ -d "..."`
6. Quando token funcionar → flag `secretaria.turmas.read = true` → testar

### 10.3 Para Cada Módulo

1. Implementar adapter se não existe
2. Implementar provider (substituir mock pelo TOTVS client + adapter)
3. Ligar feature flag (`read = true`)
4. Testar localmente
5. Se OK → deploy preview → validar no Vercel
6. Se falhar → desligar flag → investigar

### 10.4 Rollback

Se qualquer integração falhar em produção:
- Desligar feature flag → app volta ao mock instantaneamente
- Zero downtime, zero risco para usuário final
- Investigar e corrigir antes de religar

---

## Apêndice A — Deploy History

| Data | Deploy | Conteúdo |
|------|--------|----------|
| 2026-03-21 | Preview (1) | Sistema de notas completo |
| 2026-03-21 | Preview (2) | Dashboard matrículas + 4 sprints UX |
| 2026-03-21 | Preview (3) | 9 items de qualidade + adapter layer |

## Apêndice B — Ferramentas Utilizadas

| Ferramenta | Uso |
|-----------|-----|
| Next.js 16.2 + Turbopack | Framework + bundler |
| TypeScript strict | Tipagem |
| Tailwind CSS | Styling |
| Base UI (shadcn) | Componentes primitivos |
| Zod | Validação de schemas |
| Lucide React | Ícones |
| Playwright CLI | Screenshots para auditoria UX |
| Vercel | Deploy (preview + prod) |
| Claude Code (Opus) | Implementação assistida |
