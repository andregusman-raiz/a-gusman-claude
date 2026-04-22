# SQL Multi-Database Governance

## Data Source Router (canônico — consultar ANTES de qualquer query)

| Domínio | Fonte Primária | Tabelas Chave | Alternativa |
|---------|---------------|---------------|-------------|
| Matrículas, educacional, metas | **PBI_RAIZ** (RAIZDB01) | Tabela_Z_PAINELMATRICULA_BI, Tabela_f_matriculas | TOTVS RM (fallback) |
| Financeiro, cobrança, acordos | **PBI_RAIZ** (RAIZDB01) | Tabela_FICHAFINANCEIRA, Tabela_RPTCOBRANCA, Tabela_VW_ACORDOS | TOTVS RM (fallback) |
| RH, folha, ponto, compras, contábil | **TOTVS RM** (C3U7RQ160286A\RM) | PFUNC, PFFINANC, PFHSTAFT, PEVENTO | — |
| HubSpot (deals, contacts, leads) | **Neon** (PostgreSQL) | hubspot_deal (335K), hubspot_contact (518K), hubspot_lead_raiz (57K) | — |
| Layers, Zeev, audit trail | **Neon** (PostgreSQL) | layers_*, zeev_*, hubspot_totvs_match (41K) | — |
| Business rules decodificadas (PBI parity) | **PBI_RAIZ** | Tabelas com prefixo Tabela_ | TMDL DAX (referência) |

**Se domínio for ambíguo**: PARAR e perguntar ao usuário qual fonte usar. NUNCA adivinhar.

---

## TOTVS RM (SQL Server) — Guards Obrigatórios

### 1. CODCOLIGADA em toda query
TODA query contra tabelas TOTVS RM DEVE ter `WHERE CODCOLIGADA = N`.
Sem exceções. Tabelas são multi-tenant.

### 2. NOLOCK em toda leitura
Todo FROM e JOIN contra TOTVS RM em modo read DEVE ter `(NOLOCK)`:
```sql
SELECT f.NOME FROM PFUNC f (NOLOCK) WHERE f.CODCOLIGADA = 2
```
Exceção: cálculos financeiros que exigem consistent read.

### 3. SELECT * proibido
NUNCA usar `SELECT *` em tabelas TOTVS RM. PFUNC tem 680 colunas — causa timeout.
Consultar `~/Claude/assets/knowledge-base/totvs/unified/schema.json` para nomes exatos.

### 4. DateTime sargable
```sql
-- ERRADO (quebra índice)
WHERE YEAR(DTCONTRATO) = 2026
WHERE DTMATRICULA BETWEEN '2026-01-01' AND '2026-12-31'

-- CORRETO
WHERE DTCONTRATO >= '2026-01-01' AND DTCONTRATO < '2027-01-01'
```

### 5. COL=10 — Status filter estendido obrigatório
CODCOLIGADA=10 (Escolas Integradas Raiz) tem 3 marcas por filial com status DIFERENTES:
- FIL=1 (Qi Recreio): CODSTATUS IN (2, 3)
- FIL=3,4,6 (Sá Pereira): CODSTATUS IN (14, 15)
- FIL=7 (SAP): CODSTATUS IN (25, 32)

Queries de alunos em COL=10 SEM filtro estendido perdem marcas inteiras.
SEMPRE usar `(CODCOLIGADA, CODFILIAL)` pair para atribuição de marca.

### 6. Brand mapping por (coligada, filial) — NUNCA só coligada
```sql
-- ERRADO (não distingue marcas dentro de COL=10)
WHERE m.CODCOLIGADA = 10

-- CORRETO
INNER JOIN marca_coligada mc ON mc.cod_coligada = m.CODCOLIGADA AND mc.cod_filial = m.CODFILIAL
```
Tabela `marca_coligada` no Neon tem 89 entries para este mapeamento.

---

## Neon (PostgreSQL Serverless) — Guards Obrigatórios

### 1. Paginação para qualquer query >5K rows esperados
Tabelas que NUNCA podem ser single-shot:
- `hubspot_deal` (335K), `hubspot_contact` (518K), `hubspot_lead_raiz` (57K)
- `hubspot_totvs_match` (41K), `pbi_painel_matriculas` (32K)

Pattern obrigatório:
```python
OFFSET = 0
BATCH = 1000  # max 5000
while True:
    rows = query(f"SELECT ... ORDER BY id LIMIT {BATCH} OFFSET {OFFSET}")
    if not rows: break
    process(rows)
    OFFSET += BATCH
```

### 2. Railway API para queries rotineiras
Usar endpoints do raiz-data-engine para queries padrão.
Psql direto apenas para: admin, DDL, queries <1K rows, ou quando Railway está sobrecarregado.

---

## PBI_RAIZ (SQL Server) — Guards Obrigatórios

### 1. Fonte preferencial para matrículas/financeiro/educacional
PBI_RAIZ já tem business rules decodificadas (que no Power BI são DAX).
NÃO replicar lógica de negócio em SQL raw — usar as tabelas PBI_RAIZ que já têm regras aplicadas.

### 2. NULL-safe filter obrigatório
```sql
-- ERRADO (exclui NULLs silenciosamente no SQL Server)
WHERE TIPO_CANCELAMENTO <> 'ERRO CADASTRO'

-- CORRETO
WHERE (TIPO_CANCELAMENTO <> 'ERRO CADASTRO' OR TIPO_CANCELAMENTO IS NULL)
```

### 3. Discovery via raiz-data-engine
- `/api/pbi-raiz/tables` — listar tabelas disponíveis
- `/api/pbi-raiz/columns/{table}` — listar colunas
- `/api/pbi-raiz/query` — executar query com governança
