---
name: ag-12-sql-totvs-zeev
description: |
  Maquina de otimizacao SQL e consulta de dados. Otimiza queries para SQL Server (TOTVS RM), PostgreSQL (Neon),
  e consulta APIs Zeev BPM. Use quando: (1) otimizar query lenta, (2) revisar SQL para anti-patterns,
  (3) gerar queries eficientes para relatórios, (4) análise de dados massivos,
  (5) consultar dados de processos Zeev, (6) cruzar dados TOTVS RM + Zeev.
  Baseado em AltimateAI/data-engineering-skills + práticas SQL Server + KB unificada MECE.
metadata:
  filePattern:
    - "**/*.sql"
    - "**/queries*.ts"
    - "**/analytics/**"
    - "**/reports/**"
    - "**/relatorios/**"
    - "**/zeev*"
    - "**/bpm*"
  bashPattern:
    - "\\bSELECT\\b.*\\bFROM\\b"
    - "\\bsql\\b.*\\boptim"
    - "\\bzeev\\b"
  priority: 5
---

# SQL Optimization & Data Queries — TOTVS RM, Zeev BPM, PostgreSQL

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

### GATE 1 — Source Selection
Mapear o domínio de negócio para a fonte correta ANTES de tocar em SQL:

| Domínio | Fonte Primária | Tabelas Chave |
|---------|---------------|---------------|
| Matrículas, educacional, metas | **PBI_RAIZ** (RAIZDB01) | Tabela_Z_PAINELMATRICULA_BI, Tabela_f_matriculas |
| Financeiro, cobrança, acordos | **PBI_RAIZ** (RAIZDB01) | Tabela_FICHAFINANCEIRA, Tabela_RPTCOBRANCA |
| RH, folha, ponto, compras, contábil | **TOTVS RM** (Cloud) | PFUNC, PFFINANC, PFHSTAFT, PEVENTO |
| HubSpot (deals, contacts, leads) | **Neon** (PostgreSQL) | hubspot_deal (335K), hubspot_contact (518K) |
| Layers, Zeev, audit trail | **Neon** (PostgreSQL) | layers_*, zeev_*, hubspot_totvs_match (41K) |

Se domínio ambíguo → PARAR e perguntar ao usuário. NUNCA adivinhar fonte.

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
Se domínio é matrículas/financeiro/educacional:
1. Verificar se PBI_RAIZ tem a tabela equivalente (ver guide pbi-raiz-bridge.md)
2. Preferir PBI_RAIZ — já tem regras de negócio decodificadas (evita reverse-engineering de DAX)
3. SQL gotcha PBI_RAIZ: NULL-safe filter obrigatório: `(col <> 'X' OR col IS NULL)`
4. Discovery: `/api/pbi-raiz/tables`, `/api/pbi-raiz/columns/{table}`

---

## Workflow ao receber query para otimizar

1. **Executar Gates 1-5 acima** (obrigatório, não pular)
2. Consultar schema.json → confirmar nomes reais de tabelas/campos
3. Consultar glossary.json → entender significado de campos crípticos
4. Consultar queries.json → verificar se já existe query similar catalogada
5. Consultar rules.json → verificar regras de PII, risk scoring, multi-tenant
6. Consultar gotchas.md → evitar armadilhas conhecidas

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
| TOTVS RM (SQL) | 189.126.153.77:38000 | SQL Auth |
| Zeev Nativa | raizeducacao.zeev.it/api/2/ | Bearer (impersonation) |
| Zeev Dados | metabases.raizeducacao.com.br/api-dados | X-API-Key |

---

## Referências

- KB TOTVS unificada: `~/Claude/assets/knowledge-base/totvs/unified/`
- KB Zeev unificada: `~/Claude/assets/knowledge-base/zeev/unified/`
- [AltimateAI/data-engineering-skills](https://github.com/AltimateAI/data-engineering-skills)
- Scraper TOTVS: `~/Claude/totvs-scraper/`
