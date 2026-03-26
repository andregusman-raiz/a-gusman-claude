---
name: ag-12-sql-totvs
description: |
  Maquina de otimizacao SQL. Otimiza queries para SQL Server (TOTVS RM) e PostgreSQL (Neon).
  Use quando: (1) otimizar query lenta, (2) revisar SQL para anti-patterns,
  (3) gerar queries eficientes para relatórios, (4) análise de dados massivos.
  Baseado em AltimateAI/data-engineering-skills + práticas SQL Server.
metadata:
  filePattern:
    - "**/*.sql"
    - "**/queries*.ts"
    - "**/analytics/**"
    - "**/reports/**"
    - "**/relatorios/**"
  bashPattern:
    - "\\bSELECT\\b.*\\bFROM\\b"
    - "\\bsql\\b.*\\boptim"
  priority: 5
---

# SQL Optimization — SQL Server (TOTVS RM) & PostgreSQL (Neon)

## Regras de Otimização (preservação semântica obrigatória)

A query otimizada DEVE retornar resultados IDÊNTICOS à original.

---

## Pattern 1: Function on Filter Column

**Problema**: Funções em colunas no WHERE impedem uso de índices.

| Original (lento) | Otimizado | Por que seguro |
|------------------|-----------|----------------|
| `WHERE YEAR(dt) = 2026` | `WHERE dt >= '2026-01-01' AND dt < '2027-01-01'` | Range equivalente |
| `WHERE CONVERT(DATE, ts) = '2026-03-25'` | `WHERE ts >= '2026-03-25' AND ts < '2026-03-26'` | Range equivalente |
| `WHERE MONTH(dt) = 3 AND YEAR(dt) = 2026` | `WHERE dt >= '2026-03-01' AND dt < '2026-04-01'` | Range equivalente |

## Pattern 2: SELECT * → SELECT colunas

**Problema**: Tabelas do RM têm 30-80 colunas. `SELECT *` lê tudo.

```sql
-- ERRADO (PFUNC tem 60+ colunas)
SELECT * FROM PFUNC WHERE CODSITUACAO = 1

-- CERTO
SELECT CHAPA, NOME, CPF, CODCOLIGADA, CODFILIAL, CODSITUACAO, DATAADMISSAO, SALARIO
FROM PFUNC WHERE CODSITUACAO = 1
```

## Pattern 3: EXISTS vs IN para subqueries

```sql
-- LENTO (IN varre todo o result set)
SELECT * FROM PFUNC WHERE CHAPA IN (SELECT CHAPA FROM PFFINANC WHERE NROPERIODO = '202603')

-- RÁPIDO (EXISTS para ao primeiro match)
SELECT f.* FROM PFUNC f
WHERE EXISTS (SELECT 1 FROM PFFINANC p WHERE p.CHAPA = f.CHAPA AND p.NROPERIODO = '202603')
```

## Pattern 4: NOLOCK para leituras (SQL Server)

```sql
-- Dashboards e relatórios (read-only) — reduz contention
SELECT CHAPA, NOME, SALARIO
FROM PFUNC WITH (NOLOCK)
WHERE CODSITUACAO = 1 AND CODCOLIGADA = 2
```

**NUNCA usar NOLOCK** em queries que alimentam cálculos financeiros (FGTS, folha).

## Pattern 5: Paginação com OFFSET/FETCH

```sql
-- SQL Server 2012+
SELECT CHAPA, NOME, SALARIO
FROM PFUNC
WHERE CODCOLIGADA = 2
ORDER BY NOME
OFFSET 0 ROWS FETCH NEXT 50 ROWS ONLY
```

## Pattern 6: CTEs para queries complexas

```sql
-- Custo por unidade (relatório drill-down)
WITH FolhaPorFuncionario AS (
  SELECT CHAPA, CODCOLIGADA,
    SUM(CASE WHEN TIPO = 'P' THEN VALOR ELSE 0 END) as proventos,
    SUM(CASE WHEN TIPO = 'D' THEN VALOR ELSE 0 END) as descontos
  FROM PFFINANC WITH (NOLOCK)
  WHERE NROPERIODO = '202603'
  GROUP BY CHAPA, CODCOLIGADA
),
HeadcountPorUnidade AS (
  SELECT CODCOLIGADA, COUNT(*) as headcount
  FROM PFUNC WITH (NOLOCK)
  WHERE CODSITUACAO = 1
  GROUP BY CODCOLIGADA
)
SELECT
  g.NOME as escola,
  h.headcount,
  SUM(f.proventos) as total_proventos,
  SUM(f.descontos) as total_descontos,
  SUM(f.proventos) / NULLIF(h.headcount, 0) as custo_medio
FROM FolhaPorFuncionario f
JOIN HeadcountPorUnidade h ON f.CODCOLIGADA = h.CODCOLIGADA
JOIN GCOLIGADA g ON f.CODCOLIGADA = g.CODCOLIGADA
GROUP BY g.NOME, h.headcount
ORDER BY total_proventos DESC
```

## Pattern 7: Auto Create Statistics (SQL Server)

Verificar que o banco tem statistics atualizadas:
```sql
-- Verificar se Auto Create Statistics está habilitado
SELECT name, is_auto_create_stats_on FROM sys.databases WHERE name = DB_NAME()

-- Atualizar statistics de tabelas críticas (executar periodicamente)
UPDATE STATISTICS PFUNC
UPDATE STATISTICS PFFINANC
UPDATE STATISTICS PFRUBRICA
```

## Pattern 8: Índices recomendados para TOTVS RM

Queries frequentes do salarios-platform e fgts-platform:

```sql
-- Funcionários ativos por coligada (dashboard KPI)
-- Index: PFUNC(CODCOLIGADA, CODSITUACAO) INCLUDE (CHAPA, NOME, SALARIO)

-- Folha por período (holerites)
-- Index: PFFINANC(CODCOLIGADA, NROPERIODO) INCLUDE (CHAPA, CODEVENTO, VALOR, TIPO)

-- Rubricas FGTS (conferência)
-- Index: PFRUBRICA(INCIDENCIAFGTS) INCLUDE (CODEVENTO, DESCRICAO, TIPO)
```

**NOTA**: Criar índices no RM requer aprovação da TI TOTVS (DOC-10).

## Tabelas de Referência Rápida

### Volume estimado (Grupo Raiz)

| Tabela | Registros aprox. | Crescimento |
|--------|-----------------|-------------|
| PFUNC | ~3.000 | Lento (admissões/demissões) |
| PFFINANC | ~90.000/mês | Linear (folha mensal) |
| PFHSTSAL | ~15.000 total | Lento (promoções) |
| GCOLIGADA | ~40 | Estável |
| GFILIAL | ~50 | Estável |

### Timeouts recomendados

| Volume | Timeout |
|--------|---------|
| < 1.000 rows | 10s |
| 1K - 10K | 30s |
| 10K - 100K | 60s |
| > 100K | Usar paginação ou DuckDB |

## Referências

- Baseado em [AltimateAI/data-engineering-skills](https://github.com/AltimateAI/data-engineering-skills) (Snowflake → adaptado para SQL Server)
- KB TOTVS: `~/Claude/assets/knowledge-base/totvs/`
- Schema: DOC-2 (MSSQL), DOC-11 (DataServer objects), DOC-13 (modelo relacional)
