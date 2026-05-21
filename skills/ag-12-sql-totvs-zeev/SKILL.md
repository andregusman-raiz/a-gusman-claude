---
name: ag-12-sql-totvs-zeev
description: "Maquina especialista em dados Raiz: data-engine API canonical (/v1/kpis/*, /reports/<panel>/data, Envelope v2, KPI Registry Ouro M01..A*) + SQL TOTVS RM + Neon PostgreSQL + Zeev BPM + PBI_RAIZ. Use para: descobrir KPI Ouro, consumir painel canonical, escrever query nova (cascade painel>KPI>dinamica>raw), otimizar SQL lenta, anti-patterns, relatorios, processos Zeev. Tier 0: data-engine. Aplica ADR-041 (TOTVS via Neon Mirror enforced)."
metadata:
  filePattern:
    - "**/*.sql"
    - "**/queries*.ts"
    - "**/analytics/**"
    - "**/reports/**"
    - "**/relatorios/**"
    - "**/zeev*"
    - "**/bpm*"
    - "**/raiz_data_engine/**"
    - "**/dbt/models/**"
    - "**/contracts/**"
  bashPattern:
    - "\\bSELECT\\b.*\\bFROM\\b"
    - "\\bsql\\b.*\\boptim"
    - "\\bzeev\\b"
    - "\\bkpi_ouro_id\\b"
    - "/v1/kpis"
    - "/reports/.*/data"
    - "value_raw|value_formatted"
  priority: 5
  cache_policy:
    enabled: true
    marker_after: "## Inline KB — Quick Reference (Opus 4.7 ADR-0001 P1.2)"
    estimated_tokens: 4800
---

# Data Engine + SQL Optimization — TOTVS RM, Zeev BPM, PostgreSQL, PBI_RAIZ

## 🎯 TIER 0 — Data Engine API (PREFERIR sobre SQL direto)

> raiz-data-engine é a **camada canonical** que já decodifica regras de negócio,
> agrega Bronze→Prata→Ouro, aplica governança e expõe `value_raw + value_formatted`
> consistente com BI Raiz. Se a resposta já existe na API canonical → consumi-la,
> nunca reescrever SQL equivalente em outro projeto.

### Arquitetura em 4 camadas (consultar ANTES de escolher fonte)

```
Bronze (mirrors raw)  →  Prata (dbt int/fact/dim)  →  Ouro (KPI Registry, 65+ IDs)  →  API
                                                                                       │
                                          ┌────────────────────────────────────────────┤
                                          ▼                            ▼                ▼
                                    DISCOVERY                    EXECUTION         GOVERNANCE
                              /v1/kpis/catalog            /v1/kpis/{id}/value     X-API-Key
                              /v1/kpis/search             /reports/<panel>/data    rate-tiers
                              /<domain>/dictionary        /query/preflight + execute  PII mask
                              /v1/manifest                                              audit
                              /openapi.json (x-raiz-lineage)
```

| Camada | Conteúdo | Source of truth |
|---|---|---|
| **Bronze** | Scrapers, TOTVS REST/SOAP, BI Raiz | sistemas externos |
| **Prata** | dbt `fact_*` + `dim_*` em `prata.*` | Neon mirror (PBI_RAIZ + TOTVS RM) |
| **Ouro** | KPI Registry (65 KPIs) | `raiz_data_engine/reports/core/kpi_registry/` |
| **API** | Envelope v2 universal `{value_raw, value_formatted}` | `raiz_data_engine/api/` |

### Cascade de Decisão (regra inegociável)

Ordem de preferência ao buscar dado:

1. `GET /reports/<panel>/data` — bundle multi-KPI cacheado (14 painéis ativos)
2. `GET /v1/kpis/{id}/value?filters=...` — execução canônica do KPI Ouro
3. `POST /query/preflight` → `POST /query/execute` — SQL dinâmico governado (audit + PII)
4. SQL direto TOTVS RM / Neon / PBI_RAIZ — **último recurso**, só se nada acima cobre

**Se IA/plataforma já consome data-engine:** prefira Tier 0. SQL direto vira fallback documentado, não default.

### IDs canônicos KPI Ouro (referência rápida — `kpi_id`)

| Prefixo | Domínio | Faixa | Exemplos |
|---|---|---|---|
| **M** | Matrículas | M01–M15 | M01 Alunos Matriculados, M07 Taxa Ocupação |
| **C** | Cobrança / Comercial | C01–C08 | C04 % Inadimplência Canonical |
| **E** | Endividamento / Educacional | E01–E05 | E04 Saldo Devedor |
| **R/F/S** | RH / Financeiro / Satisfação | extras Q9.C.0 | — |
| **L/B/Z** | Layers / Benefícios / Zeev | extras | — |
| **I/Q/N** | INEP / Quality / NPS | extras | — |
| **D/A** | DRE / Avaliações | extras | A12 ENEM Redação |

> Regra: persistir/logar/cachear sempre por `kpi_id` (estável). `label_pt` muda; ID não.

### Endpoints canonical (memorizar)

| Endpoint | Para que | Auth |
|---|---|---|
| `GET /v1/kpis/catalog` | catálogo completo (rich schema, fórmula SQL, known_gaps) | público |
| `GET /v1/kpis/catalog?domain=<d>&status=canonical` | filtrado | público |
| `GET /v1/kpis/search?q=...&prefix=M&limit=50` | full-text (key+label+description) | público |
| `GET /v1/kpis/{id}` | lookup individual (atalho) | público |
| `GET /v1/kpis/{id}/consumers` | painéis + APIs que usam | público |
| `GET /v1/kpis/{id}/value?filters=...` | execução SQL canônica do KPI Ouro | público |
| `GET /<domain>/dictionary` | dictionary (kpis + tables + conventions) | público |
| `GET /reports/<panel>/data` | bundle de painel pronto | público |
| `GET /v1/manifest` | catalog de manifests | público |
| `GET /schema/tables` | lista schema catalog cross-source | X-API-Key |
| `GET /v1/schema/table/{table_name}` | lookup público individual de tabela | público |
| `POST /query/preflight` | valida SQL antes de executar | X-API-Key |
| `POST /query/execute` | SQL dinâmico governado, usar `source=neon` | X-API-Key |
| `GET /openapi.json` | OpenAPI + extensão `x-raiz-lineage` | público |
| `GET /metrics/canonical` | Prometheus | público |

Base prod: `https://raiz-data-engine-production.up.railway.app`

### Política runtime TOTVS/RH para agentes

- ADR-041: não usar SQL direto TOTVS RM em runtime Railway.
- `/query/execute` é fallback governado Neon-only para agentes; enviar `source=neon`.
- Se o usuário trouxer SQL RM bruto, converter manualmente para mirror Neon ou retornar gap acionável. Não selecionar fonte TOTVS RM direta no endpoint dinâmico.
- Mirrors RH disponíveis:
  - `PFFINANC` → `public.pffinanc_mirror`
  - `PEVENTO` → `public.pevento_mirror`
  - `PFUNC` → `public.pfunc_mirror`
  - `PFUNCAO` → `public.pfuncao_mirror`
  - `GFORMULA` → `public.gformula_mirror`
- `GFORMULA` está disponível no Neon/schema registry para análise técnica de fórmulas RM. Usar `source=neon`; não usar `source=totvs_rm` em runtime. `FORMULACOMPILADA` binária não é espelhada; usar `texto`, `titulo` e metadados.

### TOTVS GCONSSQL via wsDataServer

Descoberta incorporada: cadastrar sentença SQL custom em `GCONSSQL` via `wsDataServer`/`GlbConsSqlData` desbloqueia fontes sem DataServer de negócio, como `MovMovimentoData`, desde que tratado como registry governado.

Uso permitido:
- sync/backfill controlado, nunca endpoint de SQL livre;
- SQL versionado no `raiz-data-engine`;
- sentença `COUNT` + sentença `PAGE`;
- filtro obrigatório por `CODCOLIGADA`;
- paginação determinística `OFFSET/FETCH`;
- staging no Neon + count parity antes de publish;
- PII somente com RBAC/LGPD formal.

Uso proibido:
- `SELECT *`;
- `INSERT/UPDATE/DELETE/MERGE/DROP/ALTER/CREATE/EXEC`;
- execução runtime direta contra TOTVS;
- logar payload de linha, token, senha, CPF, RA, chapa ou nome.

Fonte canônica no repo:
- `scripts/ops/config/totvs_governed_sentence_registry.json`
- `scripts/ops/sql/totvs_governed_sentence_registry/`
- `docs/runbooks/totvs-governed-gconssql-registry.md`

Piloto recomendado: `RDE.TOTVS.TMOV.COUNT/PAGE` e `RDE.TOTVS.TITMMOV.COUNT/PAGE` para alimentar `public.tmov_mirror` e `public.titmmov_mirror`.

### Envelope v2 universal

Todo número da API canonical retorna:
```json
{ "value_raw": 1838.0, "value_formatted": "1.838" }
```
- `value_raw` → cálculo / agregação no cliente
- `value_formatted` → display direto (parity com BI Raiz)
- **NUNCA re-formatar `value_raw` no consumer** (mascaramento PII já server-side)

### Rate Limit tiers (slowapi IP-level + 60 RPM/10K dia por key)

| Path | Limite |
|---|---|
| `/health /metrics /readyz` | whitelist |
| `auth/*` | 5/min |
| `admin/*` | 30/min |
| `api/*` (default) | 200/min |
| outros | 100/min |

Retry-on-429 com backoff exponencial + jitter. Batchar lookups (usar `search?prefix=M` em vez de N gets).

### known_gaps — LER SEMPRE antes de prometer número

Cada entry de `/v1/kpis/{id}` traz `known_gaps[]` com semantic drift declarado.
Exemplo M01:
- `matriculados_brutos: sem TAG_MATVALIDA — inclui contratos não confirmados`
- `pre_matriculados: TAG_MATVALIDA=FALSE, contrato sem 1ª parcela paga`

Resposta da IA sem citar known_gaps relevantes = "certo na conta, errado no negócio".

### Lineage via `x-raiz-lineage` (OpenAPI extension)

`/openapi.json` injeta mapping endpoint → tabela Bronze/Prata/Ouro. Usar para:
- explicar resposta: "este número vem de `prata.int_alunos_qualificados` filtrado por…"
- auditar prompt→data trail
- debugar drift cross-source

### Painéis ativos (14) — `/reports/<panel>/data`

`matriculas`, `dre_dashboard`, `faturamento`, `inadimplencia`, `funnel`, `beneficios`,
`pessoas_rh`, `quadro_docente`, `erros_operacionais`, `pesquisa_satisfacao`,
`layers_comunidade`, `layers_payments`, `zeev`, `avaliacoes_inep`,
+ `painel_kpi_executivo_resumido`, `painel_resumo_operacional` (consolidados).

### Pact contracts (consumer formal)

Plataforma consumidora estável (não one-shot) → adicionar `contracts/consumer/<nome>.json`
em `raiz-data-engine/contracts/consumer/`. Modelo: `raiz-platform.json`. Trava endpoints + schemas
bidirecionalmente. Para agente IA: mesma lógica previne hallucination em prod.

### Painel novo = registry declarativo (não custom code)

Se a tarefa é **criar painel novo no data-engine**, único caminho aceito:
```bash
/ag-painel-novo-canonico criar painel <nome> com KPIs M01,M02,E03
# OU
python scripts/scaffold_panel.py --panel-id <slug> --kpi-ouro-ids "M01,M02" --all-from-registry
```
CI gate `painel-readiness-strict.yml` BLOQUEIA: queries.py presente, aggregator custom,
MetricSpec sem `kpi_ouro_id`, score <9.0. Insistir em custom = PR reprovado.

---

## Inline KB — Quick Reference (Opus 4.7 ADR-0001 P1.2)

> KB inline para eliminar Read round-trip em prompts comuns. Para KB completa e atualizada, consultar `~/Claude/assets/knowledge-base/totvs/`.

### Tabelas TOTVS mais usadas

| Tabela | Propósito | Colunas-chave |
|---|---|---|
| `PPESSOA` | Cadastro pessoa (aluno, funcionário, responsável) | CODIGO, NOME, CPF, DTNASCIMENTO |
| `SALUNO` | Aluno educacional | CODCOLIGADA, RA, CODPESSOA, CODCURSO, CODHABILITACAO |
| `SMATRICULA` | Matrícula por período | CODCOLIGADA, RA, IDPERLET, CODSTATUS, DTMATRICULA |
| `PFUNC` | Funcionário RH (680 cols — NUNCA SELECT *) | CODCOLIGADA, CHAPA, CODPESSOA, CODSITUACAO |
| `PFFINANC` | Ficha financeira (histórico) | CODCOLIGADA, CHAPA, ANOCOMP, MESCOMP |
| `PEVENTO` | Eventos folha (código evento) | CODCOLIGADA, CODEVENTO, DESCRICAO, TIPO |
| `FLAN` | Lançamentos financeiros | CODCOLIGADA, IDLAN, CODCFO, STATUSLAN, VALORORIGINAL |
| `GCOLIGADA` | Coligadas (32 ativas) | CODCOLIGADA, NOME, CNPJ |

### Enums críticos (SStatus por coligada)

```
COL=1 (Raiz):     matriculado = CODSTATUS IN (2, 3)
COL=2 (QI):       matriculado = CODSTATUS IN (2, 3)
COL=10 (SIR):     matriculado = CODSTATUS IN (14, 15, 25, 32) ← stratificado por filial
  FIL=1 (QI Recreio):   IN (2, 3)
  FIL=3,4,6 (Sá Pereira): IN (14, 15)
  FIL=7 (SAP):           IN (25, 32)
```

### Guards obrigatórios TOTVS

1. `WHERE CODCOLIGADA = N` **sempre** (multi-tenant)
2. `FROM TBL (NOLOCK)` **sempre** em leitura
3. `SELECT col1, col2, ...` — **NUNCA `SELECT *`**
4. DateTime sargable: `WHERE DT >= '2026-01-01' AND DT < '2027-01-01'` (não `YEAR(DT)=2026`)
5. COL=10: use `(CODCOLIGADA, CODFILIAL)` pair para mapeamento de marca

### Neon (PostgreSQL) — patterns

| Tabela | Rows | Paginação obrigatória |
|---|---|---|
| hubspot_deal | 335K | sim (>5K) |
| hubspot_contact | 518K | sim |
| hubspot_lead_raiz | 57K | sim |
| hubspot_totvs_match | 41K | sim |
| pbi_painel_matriculas | 32K | sim |
| ficha_financeira | 436K | sim |
| holerite | 47.5K | sim |

Pattern:
```python
OFFSET = 0; BATCH = 1000
while True:
    rows = query(f"SELECT ... ORDER BY id LIMIT {BATCH} OFFSET {OFFSET}")
    if not rows: break
    process(rows); OFFSET += BATCH
```

### Data Source Router (domain → source)

| Domínio | Fonte Primária |
|---|---|
| Matrículas, educacional, metas | PBI_RAIZ (business rules decoded) |
| Financeiro, acordos | PBI_RAIZ |
| RH, folha, ponto, compras | TOTVS RM |
| HubSpot deals/contacts/leads | Neon |
| Zeev BPM | Neon (mirror) |

**Regra:** consultar tabela acima ANTES de escrever query. Domínio ambíguo → PARAR e perguntar.

### PBI_RAIZ (bridge)

- `SELECT * FROM INFORMATION_SCHEMA.TABLES` para discovery
- NULL-safe filter: `WHERE (col <> 'X' OR col IS NULL)` (SQL Server exclui NULL silencioso)
- Tabelas `Tabela_*` já tem regras de negócio decoded (não replicar em SQL raw)

<!-- cache_control: ephemeral -->

---

## Knowledge Base Unificada (OBRIGATÓRIO consultar)

### TOTVS RM — KB MECE

```
~/Claude/assets/knowledge-base/totvs/unified/     ← COMECE AQUI
├── schema.json         # 69 tabelas, 1992 campos, FKs, PII flags
├── glossary.json       # 1,211 termos técnico → negócio PT-BR
├── queries.json        # 28 queries catalogadas com metadata
├── apis.json           # 55 REST + 29 SOAP DataServers
├── rules.json          # Regras de negócio (matrícula, notas, financeiro, PII)
├── enums.json          # Valores reais de lookup (SStatus, GColigada, etc.)
├── domains/            # 8 docs por domínio de negócio
└── guides/
    ├── gotchas.md              # 24 lições aprendidas
    └── query-cookbook.md        # Queries por caso de uso
```

Fontes brutas: `~/Claude/assets/knowledge-base/totvs/raw/`

### Zeev BPM — KB MECE

```
~/Claude/assets/knowledge-base/zeev/unified/      ← COMECE AQUI
├── apis.json           # 98 endpoints + 261 modelos
├── integration.json    # Estado integração raiz-platform (routes, agent tool, env vars)
├── rules.json          # Auth (impersonation), limites, gaps da API
├── glossary.json       # 20 termos Zeev → negócio
├── domains/            # 6 docs por domínio
└── guides/
    ├── gotchas.md              # 20 lições aprendidas
    └── agent-tool-cookbook.md   # 10 ações do zeev_bpm
```

Fontes brutas: `~/Claude/assets/knowledge-base/zeev/raw/`

---

## Pre-Generation Gates (OBRIGATÓRIO antes de gerar qualquer SQL)

Executar TODOS os gates sequencialmente. Se qualquer gate falhar → PARAR e reportar.

### GATE 1 — Source Selection (Tier 0 prioritário)

Mapear o domínio para a fonte correta ANTES de tocar em SQL. **Tier 0 (data-engine API) vence sempre que cobre.**

| Tier | Fonte | Quando |
|---|---|---|
| **0** | **raiz-data-engine API canonical** | KPI existe no Registry Ouro **OU** painel `/reports/<panel>/data` cobre a pergunta |
| 1 | PBI_RAIZ (RAIZDB01) | Matrículas/financeiro/educacional sem KPI Ouro canonical; tabelas `Tabela_*` |
| 1 | TOTVS RM (Cloud) | RH, folha, ponto, compras, contábil (PFUNC, PFFINANC, PEVENTO, ...) — via Neon Mirror em runtime (ADR-041) |
| 1 | Neon raw (PostgreSQL) | HubSpot deals/contacts/leads, Layers, Zeev, hubspot_totvs_match |
| 2 | `/query/execute` (data-engine) | SQL dinâmico governado quando Tier 0 não cobre mas precisa de PII/audit |
| 3 | SQL direto (psql / sqlcmd / pymssql) | Último recurso: backfill, admin, DDL, exploração ad-hoc |

Regras:
- Se Tier 0 cobre → usar Tier 0 e parar (cita `kpi_id` + `source.primary` + `known_gaps`).
- Se domínio é ambíguo → PARAR e perguntar ao usuário.
- NUNCA escrever SQL equivalente em projeto-cliente quando a API canonical já entrega.

### GATE 2 — Schema Validation (TOTVS RM only)
1. Ler `~/Claude/assets/knowledge-base/totvs/unified/schema.json` para CADA tabela mencionada
2. Verificar nomes EXATOS de colunas — NUNCA inventar nomes de campos
3. Se tabela não está no schema.json (69 tabelas): STOP e declarar "tabela não catalogada na KB"
4. Verificar flags PII em schema.json — se query toca campos PII, aplicar regras de mascaramento

### GATE 3 — Multi-Tenant Guard
1. TOTVS RM: toda query DEVE ter `CODCOLIGADA` no WHERE — injetar se ausente
2. COL=10 (Escolas Integradas Raiz): 3 marcas com status DIFERENTES:
   - FIL=1 (Qi Recreio): CODSTATUS IN (2, 3)
   - FIL=3,4,6 (Sá Pereira): CODSTATUS IN (14, 15)
   - FIL=7 (SAP): CODSTATUS IN (25, 32)
3. Atribuição de marca SEMPRE por `(CODCOLIGADA, CODFILIAL)` pair — NUNCA só CODCOLIGADA

### GATE 4 — Anti-Pattern Rejection
Rejeitar e reescrever automaticamente:
- `SELECT *` → expandir para colunas nomeadas (consultar schema.json)
- Sem `(NOLOCK)` em leitura TOTVS RM → adicionar a todo FROM/JOIN
- Neon query com >5K rows esperados sem paginação → adicionar LIMIT 1000 + OFFSET loop
- `BETWEEN` em DateTime → reescrever como `>= AND <`
- `YEAR()`, `CONVERT(DATE, ...)` em filtro → reescrever como range sargable

### GATE 5 — PBI_RAIZ Domain Check
Se domínio é matrículas/financeiro/educacional E Tier 0 não cobre:
1. Verificar se PBI_RAIZ tem a tabela equivalente (ver guide pbi-raiz-bridge.md)
2. Preferir PBI_RAIZ — já tem regras de negócio decodificadas (evita reverse-engineering de DAX)
3. SQL gotcha PBI_RAIZ: NULL-safe filter obrigatório: `(col <> 'X' OR col IS NULL)`
4. Discovery: `/api/pbi-raiz/tables`, `/api/pbi-raiz/columns/{table}`

### GATE 6 — Data Engine Routing (Tier 0 enforcement)

Antes de escrever **qualquer** SQL contra TOTVS/Neon/PBI_RAIZ, executar a cascade:

1. **Discovery KPI** — `GET /v1/kpis/search?q=<termo>&domain=<d>` (ou catalog se já souber `kpi_id`)
2. **Painel pronto?** — listar `/reports/<panel>/data` ativos; se algum bundle responde a pergunta inteira → consumir bundle
3. **KPI canônico?** — `GET /v1/kpis/{id}/value?filters=...` se for métrica isolada
4. **Query dinâmica?** — `POST /query/preflight` antes de `POST /query/execute` (governance: PII mask + audit + rate limit)
5. **Raw SQL?** — só se 1-4 falham, e documentar no PR/commit por que Tier 0 não cobriu (vira backlog de KPI Ouro)

Cada chamada a data-engine deve **citar lineage** no output: `kpi_id`, `source.primary`, `known_gaps[]` relevantes.

### GATE 7 — ADR-041 enforcement (TOTVS via Neon Mirror)

`pymssql.connect()` direto em TOTVS RM é **PROIBIDO em runtime Railway** (ADR-041).
Exceções permitidas:
- Backfill inicial do mirror (rodando via GitHub Actions, **não** Railway)
- Emergência P0 com aprovação explícita do usuário

Substituir sempre por: `DATABASE_URL` Neon → tabelas `pbi_painel_matriculas`, `pbi_ficha_financeira`, `dre_lancamento` (mirror de PBI_RAIZ + TOTVS RM). Issues #1433 e #1504 fechadas WONTFIX.

### GATE 8 — `known_gaps` awareness antes de prometer número

Toda resposta numérica vinda de KPI Ouro DEVE:
1. Ler `known_gaps[]` do KPI (`GET /v1/kpis/{id}`)
2. Anexar à resposta caso haja gap material (semantic drift declarado)
3. Citar `kpi_id` + `version` + `status` (canonical/draft/deprecated)

Exemplo: pergunta "quantos alunos matriculados em maio?" usando M01:
- Resposta correta: "1.838 (kpi=M01 v1.0 canonical, source=`prata.int_alunos_qualificados`). Nota: 3 known_gaps em `matriculados_brutos`, `pre_matriculados`, `matriculados_inadimplentes` — confirmar com produto se inclui pré-matriculados."
- Resposta incorreta: "1.838" sem contexto.

### GATE 9 — Cache cliente alinhado ao TTL servidor

| Endpoint | TTL recomendado cliente | Observação |
|---|---|---|
| `/v1/kpis/catalog` | 60–120s | servidor usa `KPI_CATALOG_CACHE_TTL=60s` |
| `/v1/kpis/{id}` | 60s | metadata muda raramente |
| `/v1/kpis/{id}/value` | <30s | dados Ouro rolam ao longo do dia |
| `/reports/<panel>/data` | <5min | cron diário 03:00 UTC, dbt refresh |

Usar `ETag`/`If-None-Match` quando disponível. NUNCA cache >1h em endpoint de valor (cron + dbt invalidam silencioso).

### GATE 10 — Rate limit awareness

5 tiers slowapi IP-level + 60 RPM/10K dia por API key. IA com tool-loop DEVE:
- retry-on-429 com backoff exponencial + jitter
- batchar lookups: `search?prefix=M&limit=200` em vez de N gets a `/v1/kpis/{id}`
- usar painel bundle (`/reports/<panel>/data`) para evitar N requests de KPIs do mesmo painel

---

## Workflow A — "Quero um dado/relatório" (data consumer)

Pipeline canônico para responder pergunta de negócio com data-engine:

```
1. Parse intent         → domain (matriculas|financeiro|...) + métrica + filtros + período
2. Load context         → GET /<domain>/dictionary (conventions + tables + known_gaps)
3. KPI resolution       → GET /v1/kpis/search?q=<termo>&domain=<d>
                          escolher por (label, description, owner, prefix)
4. Pre-flight           → GET /v1/kpis/{id}     (ler known_gaps, version, status)
5. Execute              → preferir /reports/<panel>/data; fallback /v1/kpis/{id}/value
                          último recurso: POST /query/preflight → POST /query/execute
6. Format response      → usar value_formatted; citar kpi_id + source.primary + known_gaps
7. Cite lineage         → x-raiz-lineage do OpenAPI para "fonte: prata.X → ouro.Y"
8. Track consumption    → se virou produto: Pact contract + consumers.yaml
```

## Workflow B — "Quero otimizar SQL existente" (legacy / out-of-engine)

1. **Executar Gates 1-10 acima** (obrigatório, não pular)
2. **Tier 0 first** — checar se KPI Ouro equivalente já existe (`/v1/kpis/search`). Se sim → propor substituição para chamada API antes de otimizar.
3. Consultar `schema.json` → confirmar nomes reais de tabelas/campos
4. Consultar `glossary.json` → entender significado de campos crípticos
5. Consultar `queries.json` → verificar se já existe query similar catalogada
6. Consultar `rules.json` → verificar regras de PII, risk scoring, multi-tenant
7. Consultar `gotchas.md` → evitar armadilhas conhecidas
8. Aplicar patterns de otimização (seção abaixo) preservando semântica
9. Se a query equivalente já existe como KPI Ouro: registrar a substituição como ADR/backlog em `docs/plans` do raiz-data-engine

## Workflow C — "Quero criar painel novo no data-engine"

Único caminho aceito (CI gate `painel-readiness-strict.yml` BLOQUEIA custom):

```bash
# 1. Workflow oficial via skill canonical
/ag-painel-novo-canonico criar painel <nome> com KPIs M01,M02,E03

# 2. OU direto via scaffold registry-aware
python scripts/scaffold_panel.py \
  --panel-id <slug> \
  --kpi-ouro-ids "M01,M02,E03" \
  --all-from-registry

# 3. Validar gate strict S1-S4 antes do PR
python scripts/ci/validate_painel_strict.py --panel-path raiz_data_engine/reports/<slug>
```

Checks que BLOQUEIAM merge:
- S1: `queries.py` ausente (painel é declarativo)
- S2: aggregator standard (sem custom)
- S3: 100% MetricSpec com `kpi_ouro_id`
- S4: score >=9.0

Se algum KPI necessário **não existe** no registry → criar issue de expansão (Q11+) ANTES do painel.

---

## Regras de Otimização SQL (preservação semântica obrigatória)

A query otimizada DEVE retornar resultados IDÊNTICOS à original.

### Pattern 1: Function on Filter Column

| Original (lento) | Otimizado |
|------------------|-----------|
| `WHERE YEAR(dt) = 2026` | `WHERE dt >= '2026-01-01' AND dt < '2027-01-01'` |
| `WHERE CONVERT(DATE, ts) = '2026-03-25'` | `WHERE ts >= '2026-03-25' AND ts < '2026-03-26'` |

### Pattern 2: SELECT * → SELECT colunas

PFunc tem 524 colunas. Consultar schema.json para nomes exatos.

### Pattern 3: EXISTS vs IN para subqueries

EXISTS para ao primeiro match. IN varre tudo.

### Pattern 4: NOLOCK para leituras (SQL Server)

Dashboards e relatórios read-only. NUNCA em cálculos financeiros.

### Pattern 5: CODCOLIGADA OBRIGATÓRIO

TODA query TOTVS RM DEVE filtrar por CODCOLIGADA (multi-tenant).

### Pattern 6: Paginação

SQL Server: OFFSET/FETCH. Zeev API: limit+offset. PostgreSQL: LIMIT+OFFSET.

---

## Cruzamento TOTVS + Zeev

Dados podem ser cruzados via CODCOLIGADA, CPF/Email (PII!), ou numero_solicitacao.
Padrão: consultar TOTVS via SQL → enriquecer com dados Zeev via API.

---

## Risk Scoring SQL Server (DOC-17)

| Score | Nível | maxRows | Timeout |
|-------|-------|---------|---------|
| 0-25 | LOW | 1000 | 180s |
| 26-69 | MEDIUM | 500 | 180s |
| 70-84 | HIGH | 500 | 15s |
| 85-100 | CRITICAL | 200 | 10s |

---

## Conexões

| Sistema | Host | Auth |
|---------|------|------|
| **raiz-data-engine (prod)** | `https://raiz-data-engine-production.up.railway.app` | X-API-Key (60 RPM, 10K dia) + tiers slowapi IP |
| **raiz-data-engine (local)** | `http://localhost:8000` | sem auth em dev |
| TOTVS RM (SQL) — backfill/admin only | 189.126.153.77:38000 | SQL Auth (ADR-041: proibido em runtime Railway) |
| TOTVS RM (em runtime) | Neon Mirror via `DATABASE_URL` | ADR-041 enforced |
| Zeev Nativa | raizeducacao.zeev.it/api/2/ | Bearer (impersonation) |
| Zeev Dados | metabases.raizeducacao.com.br/api-dados | X-API-Key |

---

## Anti-patterns Data-Engine (evitar SEMPRE)

| Anti-pattern | Por que dói | Substituir por |
|---|---|---|
| `SELECT * FROM pbi_painel_matriculas ...` em projeto-cliente | Bypassa registry, perde paridade BI, sem audit | `GET /v1/kpis/M01/value` ou `/reports/matriculas/data` |
| Hardcode de `label_pt` ("Alunos Matriculados") em prompts/cache | label muda; ID não | persistir `kpi_id` (M01) |
| Re-formatar `value_raw` (multiplicar por 100, mascarar PII) no cliente | quebra parity; PII server-side | usar `value_formatted` |
| Loop sequencial `GET /v1/kpis/{id}` | rate-limit + latência | `search?prefix=M&limit=200` 1 hit |
| `pymssql.connect()` em runtime Railway | ADR-041 enforced | Neon Mirror via `DATABASE_URL` |
| Cachear `/reports/<panel>/data` > 1h | cron 03:00 UTC + dbt invalidam | TTL <5min ou ETag |
| Criar painel novo com custom `queries.py` / aggregator | CI gate strict bloqueia | `scaffold_panel.py --all-from-registry` |
| Responder número sem citar `known_gaps[]` | "certo na conta, errado no negócio" | sempre anexar gaps materiais |
| Ignorar `consumers.yaml` ao adotar KPI | auto-introspection diz "0 consumers" | adicionar manifest com `kpi_ouro_id` |
| Bypass `/query/preflight` em SQL dinâmico | sem governance (audit, PII, risk) | sempre preflight antes de execute |

---

## Tools de discovery para sessões IA

Endpoints mais valiosos para expor como tools customizadas (MCP / function calling):

| Tool | Endpoint | Quando IA chama |
|---|---|---|
| `kpi_search` | `/v1/kpis/search` | Resolver termo PT-BR → `kpi_id` |
| `kpi_describe` | `/v1/kpis/{id}` + `/consumers` | "O que é M07?" / "onde aparece?" |
| `domain_context` | `/<domain>/dictionary` | Carregar contexto de domínio antes de gerar SQL |
| `kpi_value` | `/v1/kpis/{id}/value` | Resposta numérica canônica |
| `panel_data` | `/reports/<panel>/data` | Bundle multi-KPI ready-to-render |
| `dynamic_query` | `/query/preflight` + `/query/execute` com `source=neon` | Última fronteira governada |
| `schema_tables` | `/schema/tables` com `X-API-Key` | Schema-aware SQL synthesis |
| `schema_table` | `/v1/schema/table/{table_name}` | Lookup público individual de tabela |
| `manifest` | `/v1/manifest` | Lista de painéis + filtros válidos |
| `openapi_lineage` | `/openapi.json` (lê `x-raiz-lineage`) | Cita Bronze→Prata→Ouro na resposta |

Padrão de payload retornado para a IA: sempre incluir `kpi_id` + `source.primary` + `known_gaps` + `version` para não precisar segunda chamada.

---

## Referências

### Data-engine canonical (PRIMARY)

- `~/Claude/GitHub/raiz-data-engine/docs/canonical/PLATFORM_OVERVIEW.md` — 1-page onboarding
- `~/Claude/GitHub/raiz-data-engine/docs/canonical/data-engine-bronze-prata-ouro-dictionary.md` — contrato 4 camadas
- `~/Claude/GitHub/raiz-data-engine/docs/canonical/consumers.yaml` — autogerado (115 KPIs × 14 painéis)
- `~/Claude/GitHub/raiz-data-engine/docs/canonical/v2-source-registry.yaml` — tier policy Prata/Ouro
- `~/Claude/GitHub/raiz-data-engine/docs/api/v1-kpis-catalog.md` — catalog endpoint completo
- `~/Claude/GitHub/raiz-data-engine/docs/api/domain-dictionaries.md` — 4 domain dictionaries
- `~/Claude/GitHub/raiz-data-engine/contracts/consumer/raiz-platform.json` — modelo Pact
- `~/Claude/GitHub/raiz-data-engine/raiz_data_engine/api/v1/` — 20+ módulos Python
- `~/Claude/GitHub/raiz-data-engine/raiz_data_engine/reports/core/kpi_registry/kpis_ouro_fichas.yaml` — registry YAML
- ADRs canonical: **Q9.B** (catalog), **INEV.F2.C** (search), **049** (registry), **041** (TOTVS via Neon)
- CLAUDE.md do projeto: `~/Claude/GitHub/raiz-data-engine/CLAUDE.md` (Diretriz Mestra escalabilidade)

### KB legada (FALLBACK quando Tier 0 não cobre)

- KB TOTVS unificada: `~/Claude/assets/knowledge-base/totvs/unified/`
- KB Zeev unificada: `~/Claude/assets/knowledge-base/zeev/unified/`
- Scraper TOTVS: `~/Claude/totvs-scraper/`
- [AltimateAI/data-engineering-skills](https://github.com/AltimateAI/data-engineering-skills)

### Skills relacionadas

- `/ag-painel-novo-canonico` — criar painel novo via scaffold (W4 Q10.H)
- `/ag-arquiteto-raiz` — par técnico sênior para decisões arquiteturais
- `/ag-referencia-stack-decisions` — stack canonical Raiz
