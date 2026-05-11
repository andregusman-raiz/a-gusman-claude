# DOC-17: Data Hub — Seguranca SQL, PII e Risk Scoring para TOTVS RM

> Referencia de seguranca para integracao com TOTVS RM via MSSQL.
> Data: 2026-03-24 | Atualizado: 2026-03-24 (security hardening)

## SQL Compiler — Seguranca

### Tokens Bloqueados (modo read-only)
```
INSERT, UPDATE, DELETE, DROP, TRUNCATE, ALTER, CREATE, MERGE,
GRANT, REVOKE, EXEC, EXECUTE, SP_, XP_,
OPENROWSET, OPENDATASOURCE, BULK, DBCC, WAITFOR, DENY, USE
```
- Deteccao feita FORA de string literals (evita falsos positivos)
- String literals sao extraidas antes da analise de seguranca
- Lista exportada como `DANGEROUS_TOKENS` e compartilhada entre sql-compiler e db-executor
- Tokens adicionais (2026-03-24): OPENROWSET/OPENDATASOURCE (exfiltracao), BULK (escrita), DBCC (admin), WAITFOR (DoS), DENY (permissoes), USE (troca de database)

### Parametros TOTVS RM
- Estilo TOTVS RM: `:PARAM_NAME` (colon) e `:$PARAM_NAME` (system var)
- Estilo SQL Server: `@PARAM_NAME`
- Compilados para: `@p0`, `@p1`, `@p2`... (prepared statements)
- Validacao de nomes: `/^[A-Za-z_$][A-Za-z0-9_$]{0,127}$/` (previne injection via param keys)

### Scoping Automatico (CODCOLIGADA)
- Se `injectScoping: true` e CODCOLIGADA nao esta no SQL
- Injeta `WHERE CODCOLIGADA = @pN` (antes de ORDER BY/GROUP BY)
- Se ja tem WHERE: injeta `CODCOLIGADA = @pN AND` apos WHERE

## Heuristic SQL Analyzer

### Flags Detectadas
| Flag | Regex |
|------|-------|
| `hasSelectStar` | `SELECT *` ou `SELECT alias.*` |
| `hasWhere` | `WHERE` |
| `hasTop` | `TOP N` |
| `hasCte` | `WITH name AS (` |
| `hasSubquery` | `(SELECT` |
| `hasAggregation` | `SUM/COUNT/AVG/MIN/MAX/STDEV/VAR` |
| `hasDistinct` | `DISTINCT` |
| `hasUnion` | `UNION` |
| `hasNolock` | `NOLOCK` |
| `hasIntoTemp` | `INTO #` ou `INTO @` |

### Risk Signals
| Codigo | Descricao |
|--------|-----------|
| `SELECT_STAR` | Retorna colunas desnecessarias |
| `NO_WHERE` | Pode processar tabela inteira |
| `MUTATING` | Operacao de escrita |
| `MULTI_STMT` | Multiplos statements (`;`) |
| `FUNC_IN_FILTER` | Funcao em coluna no WHERE (impede indice) |
| `LEADING_WILDCARD` | `LIKE '%...'` (impede indice) |

### Deteccao de Dialeto
- **SQL Server**: `NOLOCK`, `TOP`, `GETDATE()`, `ISNULL()`, `CONVERT()`, `[DB].dbo.Table`
- **Oracle**: `NVL()`, `ROWNUM`, `SYSDATE`, `DECODE()`, `DUAL`, `TO_DATE()`

## Risk Scoring (0-100)

### Formula de Pontos
| Fator | Pontos | Cap |
|-------|--------|-----|
| CTEs | 10/CTE | 20 |
| JOINs | 5/JOIN | 30 |
| Subqueries | 8/subquery | 24 |
| SELECT * | 15 | - |
| Sem WHERE | 10 | - |
| Multi-statement | 20 | - |
| SQL mutante | 25 | - |
| Funcao em filtro | 10 | - |
| Leading wildcard | 10 | - |
| UNION | 5 | 10 |
| Tabelas >= 8 | 10 | - |
| Tabelas >= 5 | 5 | - |
| SQL > 500 linhas | 10 | - |
| SQL > 100 linhas | 5 | - |
| sem_seg_estendida | 5 | - |

### Niveis de Risco
| Score | Nivel | Acao |
|-------|-------|------|
| 0-25 | LOW | Executa normalmente |
| 26-60 | MED | Warnings ao usuario |
| 61-100 | HIGH | Requer confirmacao; maxRows e timeout reduzidos |

### Impacto no Preflight
| Condicao | Acao |
|----------|------|
| `isMutating` | **BLOQUEADO** |
| `governanceStatus = QUARANTINED` + nao admin | **BLOQUEADO** |
| `sensitivityLevel = RESTRICTED` + nao admin | **BLOQUEADO** |
| `governanceStatus = UNREVIEWED` | Requer confirmacao |
| `riskLevel = HIGH` | Requer confirmacao |
| `sensitivityLevel = CONFIDENTIAL` | Requer confirmacao |
| `complexityScore >= 70` | Requer confirmacao |
| SELECT sem WHERE e sem TOP | Requer confirmacao |
| `complexityScore >= 85` | maxRows = 200, timeout = 10s |
| `complexityScore >= 70` | maxRows = 500 |

## PII Detector (Brasileiro + TOTVS RM)

### Deteccao por Coluna
| Pattern | Tipo PII | Confianca |
|---------|----------|-----------|
| `CPF` | cpf | 0.95 |
| `CNPJ`, `CGC` | cnpj | 0.85-0.95 |
| `EMAIL`, `EMAILFUNC` | email | 0.85-0.95 |
| `TELEFONE`, `CELULAR`, `FONE` | telefone | 0.70-0.85 |
| `NASCIMENTO`, `DTNASC` | nascimento | 0.85-0.90 |
| `ENDERECO`, `LOGRADOURO` | endereco | 0.80-0.85 |
| `CEP` | cep | 0.80 |
| `NOMEFUNC`, `NOMEALUNO` | nome_pessoa | 0.90 |
| `SALARIO`, `SALBASE`, `SALLIQ` | salario | 0.90-0.95 |
| `CONTABANC`, `CHAVEPIX` | dados_bancarios | 0.85-0.90 |
| `TIPOSANG`, `CID`, `ATESTADO` | dados_medicos | 0.50-0.85 |
| `CODPESSOA`, `CODFUNC` | id_pessoa | 0.60 |
| `NROIDENTIDADE`, `NROPASSAPORTE` | documento | 0.85 |
| `DTADMISSAO`, `DTDEMISSAO` | data_rh | 0.70 |
| `FILIACAOSINDICAL` | dado_sensivel | 0.90 |
| `RACA`, `COR`, `ETNIA` | dado_sensivel | 0.90 |

### Deteccao por Tabela TOTVS RM
| Tabela | Tipo PII | Confianca |
|--------|----------|-----------|
| `PPESSOA` | cpf | 0.85 |
| `PFUNC`, `PFUNCCOMPL` | cpf | 0.75-0.85 |
| `SALUNO`, `SALUNOCOMPL` | nome_pessoa | 0.70-0.80 |
| `GCFO`, `FCFO` | cnpj | 0.60 |
| `PFHSTSAL` | salario | 0.90 |
| `PFITFOPG` | dados_bancarios | 0.85 |
| `PFASO` | dados_medicos | 0.80 |
| `PFAFAST` | dados_medicos | 0.85 |
| `PFSINDICAL` | dado_sensivel | 0.90 |
| `PFFICHATRIB` | salario | 0.85 |

### Score PII (formula)
```
piiScore = min(maxConfidence * 100 + typeBoost + countBoost, 100)
  typeBoost  = min((uniqueTypes - 1) * 10, 20)   // diversidade de tipos
  countBoost = min((totalSignals - 1) * 5, 15)    // volume de sinais
```

### Mascaramento PII
| Tipo | Exemplo Original | Mascarado |
|------|-----------------|-----------|
| CPF | 123.456.789-01 | \*\*\*.\*\*\*.\*\*\*-01 |
| CNPJ | 12.345.678/0001-90 | \*\*.\*\*\*.\*\*\*/01-90 |
| Email | maria@empresa.com | m\*\*\*@empresa.com |
| Telefone | (11) 98765-4321 | (XX) XXXXX-4321 |
| Nome | Maria Silva Santos | Maria \*\*\* |
| Nascimento | 15/03/1990 | \*\*/\*\*/\*\*\*\* |
| RG | 12.345.67 | \*\*\*.\*\*\*.\*\* |
| Endereco | Rua das Flores, 123 | Rua \*\*\* |
| CEP | 01234-567 | \*\*\*\*\*-\*\*\* |

## Copilot — Contexto para AI

### System Prompt Builder
- Catalogo de Data Products publicados injetado no system prompt
- Agrupado por dominio (RH, Financeiro, Educacional, etc.)
- **Nunca expoe SQL** nem nomes de tabelas internas ao usuario
- Inclui: nome, slug, descricao, parametros obrigatorios, labels de colunas, sensibilidade
- Aliases naturais para melhor retrieval (ex: "funcionarios ativos" → DP slug correspondente)

### Business Glossary
- Termos aprovados com definicao e formula
- Injetados no contexto do agente para consistencia terminologica
- Busca de termos relevantes por query do usuario

### Instrucoes ao Agente
1. Identificar Data Product adequado para a pergunta
2. Usar `execute_data_product` com slug/ID
3. Sempre pedir CODCOLIGADA se nao fornecido
4. ShapeMode: "kpi" para valores unicos, "table" para listas
5. Respeitar sensibilidade (nao expor PII)
