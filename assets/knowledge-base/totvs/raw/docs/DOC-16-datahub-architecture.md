# DOC-16: Data Hub — Arquitetura de Integracao TOTVS RM via MSSQL

> Referencia tecnica para integracao com TOTVS RM via SQL Server direto.
> Data: 2026-03-24

## Visao Geral

Arquitetura de referencia para um **Data Hub** que integra com o MSSQL do TOTVS RM. Organizado em 6 subsistemas independentes.

## Arquitetura

```
Data Hub (TOTVS RM)
├── SQL Runner        → Executa SQL contra MSSQL do RM
│   ├── db-executor   → Interface IDbExecutor (Mock + MssqlDbExecutor real)
│   ├── sql-compiler  → Compila SQL com parametros seguros (@p0, @p1...)
│   ├── param-resolver→ Valida e coerce parametros (tipo, range, regex, enum)
│   ├── preflight     → Analisa risco/complexidade antes de executar
│   ├── execution-audit→ Log de auditoria (start, complete, blocked)
│   └── result-shaper → Formata resultados + mascaramento PII
│
├── SQL Parser        → Analisa SQL estaticamente
│   ├── preprocessor  → Normaliza SQL (remove comentarios, whitespace)
│   ├── ast-parser    → Parse AST (CTEs, JOINs, subqueries)
│   ├── heuristics    → Analise regex (tabelas, params, flags, risk signals)
│   ├── pii-detector  → Detecta PII brasileiro (CPF, CNPJ, email, salario...)
│   └── risk-scoring  → Score 0-100 + nivel LOW/MED/HIGH
│
├── API Factory       → Gera APIs REST a partir de Data Products
│   ├── clients       → CRUD de API clients (key rotation, grants)
│   ├── grants        → Controle de acesso por Data Product
│   ├── stats         → Metricas de uso
│   └── OpenAPI       → Geracao automatica de spec
│
├── Copilot (Chat AI) → Chat com contexto de Data Products
│   ├── dp-context-builder → Monta catalogo de DPs para system prompt
│   ├── dp-retriever  → Busca DPs relevantes para a pergunta
│   ├── dp-executor   → Executa DPs via chat
│   ├── insight-generator→ Gera insights a partir dos resultados
│   └── response-composer→ Compoe resposta final formatada
│
├── Scheduler         → Jobs agendados
│   ├── scheduled-jobs→ CRUD + pause/resume/run
│   └── temporal-resolver → Resolve expressoes cron
│
└── Integration       → Cache e eventos
    ├── cache-layer   → Cache em memoria com TTL
    ├── dp-events     → Sistema de eventos entre modulos
    └── init          → Inicializacao do modulo
```

## Conexao MSSQL

### Env Vars

| Variavel | Default | Descricao |
|----------|---------|-----------|
| `TOTVS_MSSQL_HOST` | - | Host do SQL Server (obrigatorio em prod) |
| `TOTVS_MSSQL_PORT` | 1433 | Porta |
| `TOTVS_MSSQL_USER` | - | Usuario |
| `TOTVS_MSSQL_PASSWORD` | - | Senha |
| `TOTVS_MSSQL_DATABASE` | - | Database |
| `TOTVS_MSSQL_ENCRYPT` | true | Criptografia |
| `TOTVS_MSSQL_TRUST_SERVER_CERTIFICATE` | false | Trust cert |
| `TOTVS_MSSQL_CONNECTION_TIMEOUT` | 15000 | Timeout conexao (ms) |
| `TOTVS_MSSQL_REQUEST_TIMEOUT` | 180000 | Timeout request (ms) |
| `TOTVS_MSSQL_POOL_MIN` | 0 | Pool min |
| `TOTVS_MSSQL_POOL_MAX` | 10 | Pool max |

### Comportamento do Executor

- **Com `TOTVS_MSSQL_HOST`**: usa executor real (via `mssql`/tedious)
- **Sem host em dev**: usa executor mock (dados TOTVS-like para desenvolvimento)
- **Sem host em prod**: throws `NOT_CONFIGURED` error
- **Pool**: lazy init, exponential backoff (2s→30s) em erros consecutivos
- **TOP injection**: automatico em SELECT sem TOP/DISTINCT (maxRows+1 para detectar truncacao)
- **Read-only enforcement**: bloqueia INSERT/UPDATE/DELETE/DROP/EXEC em modo readOnly

## Configuracao Centralizada

Todas as constantes sao configuraveis via env vars com defaults sensiveis:

### Runner
| Config | Env Var | Default |
|--------|---------|---------|
| Timeout padrao | `TOTVS_RUNNER_DEFAULT_TIMEOUT_MS` | 180.000 (3min) |
| Max rows padrao | `TOTVS_RUNNER_DEFAULT_MAX_ROWS` | 1.000 |
| Max rows risco alto (score>=85) | `TOTVS_RUNNER_HIGH_RISK_MAX_ROWS` | 200 |
| Max rows risco medio (score>=70) | `TOTVS_RUNNER_MEDIUM_RISK_MAX_ROWS` | 500 |
| Timeout risco alto | `TOTVS_RUNNER_HIGH_RISK_TIMEOUT_MS` | 15.000 |
| Timeout critico (score>=85) | `TOTVS_RUNNER_CRITICAL_RISK_TIMEOUT_MS` | 10.000 |

### API Factory
| Config | Env Var | Default |
|--------|---------|---------|
| Max rows/request | `TOTVS_API_DEFAULT_MAX_ROWS` | 10.000 |
| Rate limit (RPM) | `TOTVS_API_DEFAULT_RATE_LIMIT_RPM` | 60 |
| Quota diaria | `TOTVS_API_DEFAULT_DAILY_QUOTA` | 10.000 |

### Cache
| Config | Env Var | Default |
|--------|---------|---------|
| TTL curto | `TOTVS_CACHE_SHORT_TTL_MS` | 30.000 (30s) |
| TTL padrao | `TOTVS_CACHE_STANDARD_TTL_MS` | 300.000 (5min) |
| TTL longo | `TOTVS_CACHE_LONG_TTL_MS` | 900.000 (15min) |
| TTL estendido | `TOTVS_CACHE_EXTENDED_TTL_MS` | 3.600.000 (1h) |
| Max entries | `TOTVS_CACHE_MAX_ENTRIES` | 1.000 |

### Scheduler
| Config | Env Var | Default |
|--------|---------|---------|
| Max falhas consecutivas | `TOTVS_SCHEDULER_MAX_CONSECUTIVE_FAILURES` | 5 |
| Lock stale timeout | `TOTVS_SCHEDULER_STALE_LOCK_TIMEOUT_MS` | 300.000 |
| Max retries | `TOTVS_SCHEDULER_MAX_RETRIES` | 2 |

## Tabelas do Data Hub (PostgreSQL/Supabase)

| Grupo | Tabelas |
|-------|---------|
| Core | `rm_sentences`, `rm_parse_results` |
| Parse | `risk_items`, `pii_signals` |
| Governance | `domains`, `owners`, `sensitivity`, `status` |
| Data Products | `data_products`, `dp_params`, `dp_column_schema`, `dp_execution` |
| API Factory | `api_clients`, `api_grants`, `api_usage_logs` |
| Scheduler | `scheduled_jobs`, `job_runs`, `job_locks` |
