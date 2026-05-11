# Guia: Segurança e PII — TOTVS RM

> Consolidação de DOC-16 (Data Hub Architecture) e DOC-17 (Security).

---

## Tokens SQL Bloqueados (modo read-only)

```
INSERT, UPDATE, DELETE, DROP, TRUNCATE, ALTER, CREATE, MERGE,
GRANT, REVOKE, EXEC, EXECUTE, SP_, XP_,
OPENROWSET, OPENDATASOURCE, BULK, DBCC, WAITFOR, DENY, USE
```

---

## Risk Scoring (0-100)

| Fator | Pontos |
|-------|--------|
| CTE | +10/CTE (cap 20) |
| JOIN | +5/JOIN (cap 30) |
| Subquery | +8 (cap 24) |
| SELECT * | +15 |
| Sem WHERE | +10 |
| Multi-statement | +20 |
| SQL mutante | +25 |
| >= 8 tabelas | +10 |
| >= 500 linhas | +10 |

### Limites por risco

| Score | Nível | maxRows | Timeout |
|-------|-------|---------|---------|
| 0-25 | LOW | 1000 | 180s |
| 26-69 | MEDIUM | 500 | 180s |
| 70-84 | HIGH | 500 | 15s |
| 85-100 | CRITICAL | 200 | 10s |

---

## PII — Dados Pessoais

### Campos PII por confiança

| Confiança | Campos |
|-----------|--------|
| Alta (0.95) | CPF, CGC, CNPJ |
| Alta (0.90) | SALARIO, VALORSALARIO |
| Média (0.85) | EMAIL, TELEFONE, CELULAR, RG |
| Média (0.85) | DATANASCIMENTO, DTNASC |
| Média (0.80) | NOME, RUA, BAIRRO, CEP |

### Tabelas com PII

PPESSOA, SALUNO, SPROFESSOR, PFUNC, GCOLIGADA

### Mascaramento

| Tipo | Exemplo |
|------|---------|
| CPF | `***.456.789-01` → `***.***.***-01` |
| Email | `maria@empresa.com` → `m***@empresa.com` |
| Telefone | `(11) 98765-4321` → `(XX) XXXXX-4321` |

---

## Scoping Multi-Tenant (CODCOLIGADA)

- TODA query DEVE filtrar por CODCOLIGADA
- Scoping automático: se `injectScoping: true` e query sem CODCOLIGADA, injeta `WHERE CODCOLIGADA = @pN`
- 20 coligadas ativas (ver enums.json > GColigada)

---

## Parâmetros Seguros

- Estilo TOTVS: `:PARAM_NAME` → compilado para `@p0, @p1...` (prepared statements)
- Validação de nomes: `/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/`
- Nunca interpolar strings SQL diretamente
