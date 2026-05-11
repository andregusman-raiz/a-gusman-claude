# PBI_RAIZ Bridge Guide

## Conceito

Power BI NÃO lê do TOTVS RM diretamente. Lê do **PBI_RAIZ** no servidor RAIZDB01.
Tabelas PBI_RAIZ são pré-processadas: business rules (DAX measures, M queries) já estão aplicadas.

**Regra**: Para queries com paridade PBI, SEMPRE preferir PBI_RAIZ sobre TOTVS RM raw.

## Conexão

- **Host**: 201.148.210.17 (RAIZDB01)
- **User**: integracoes.raiz
- **Database**: PBI_RAIZ
- **Total tables**: 106
- **Discovery**: raiz-data-engine `/api/pbi-raiz/tables`, `/api/pbi-raiz/columns/{table}`, `/api/pbi-raiz/query`

## Mapa de Equivalência: TOTVS RM → PBI_RAIZ

| Domínio de Negócio | TOTVS RM (raw) | PBI_RAIZ (decodificado) | Rows (aprox.) |
|---|---|---|---|
| Matrículas ativas (painel) | SMATRICPL + SSTATUS | **Tabela_Z_PAINELMATRICULA_BI** | 32K |
| Matrículas v2 (completa) | SMATRICPL + SMATRICULA + grade | **Tabela_f_matriculas** | 50K+ |
| Financeiro (parcelas) | SPARCELA + SBOLSALAN | **Tabela_FICHAFINANCEIRA** | 4.7M |
| Notas | SNOTADISC | **Tabela_Notas_Alunos** | 1.9M |
| Cobrança | FLAN + FTDO | **Tabela_RPTCOBRANCA** | 331K |
| Acordos | FLAN (subtipo) | **Tabela_VW_ACORDOS** | 1M |
| Marcas por coligada | GCOLIGADA + GFILIAL | **Tabela_Marcas** | 89 |
| Metas comerciais | n/a (externa) | **Tabela_MetasComerciais** | 2.9K |
| Serviços por marca | n/a (externa) | **Tabela_Servicos** | 500+ |
| Balancete | CCTB_LANCAMENTOS | **Tabela_Balancete** | 800K+ |

## Business Rules Já Decodificadas no PBI_RAIZ

Estas regras estão embutidas nas views/tabelas PBI_RAIZ — NÃO precisa replicar em SQL raw:

| Regra | Onde no PBI | O que faz |
|---|---|---|
| STATUSVALIDO=S | Tabela_Z_PAINELMATRICULA_BI | Matriculado + Pré-Matriculado (base64 inline table no DAX original) |
| Matricula Validade=S | Tabela_f_matriculas | JOIN Tabela_Matrizcurricular + filtro REGULAR + some CURSO LIVRE |
| Detecção Integral | Tabela_Z_PAINELMATRICULA_BI | UNION de 12 branches por marca, via GRADE codes + flag INTEGRAL + CODCURSO |
| Ticket revenue | Tabela_FICHAFINANCEIRA | SUM(VALORFATURADO) com EXCLUSÕES (Acordo, Devolução, Material, Integral, Bilíngue, Dependência) |
| Dedup matrículas | Tabela_f_matriculas | ROW_NUMBER(PARTITION BY RA, Coligada, TipoGrade, Perletivo ORDER BY DATAMATRICULA DESC) = 1 |

## SQL Gotcha PBI_RAIZ

### NULL-safe filter obrigatório
SQL Server trata `<>` como falso quando o valor é NULL. Filtros de exclusão DEVEM ser NULL-safe:

```sql
-- ERRADO (exclui NULLs silenciosamente — perde 30%+ dos registros)
WHERE TIPO_CANCELAMENTO <> 'ERRO CADASTRO'

-- CORRETO
WHERE (TIPO_CANCELAMENTO <> 'ERRO CADASTRO' OR TIPO_CANCELAMENTO IS NULL)
```

### Paginação em tabelas grandes
Tabela_FICHAFINANCEIRA (4.7M), Tabela_Notas_Alunos (1.9M), Tabela_VW_ACORDOS (1M):
SEMPRE usar TOP N ou OFFSET/FETCH. NUNCA single-shot em tabelas >100K rows.

## TMDL Reference (somente consulta)

4,329 DAX measures decodificadas em `~/Claude/docs/pbi-extraction/tmdl/`.
Arquivos chave:
- `c_medidas.tmdl` — Matrículas: 307 measures
- `# Metricas.tmdl` — DRE: 138 measures

Usar como referência para entender lógica de negócio. NÃO tentar executar DMV queries via PBI REST API (blocked).

## Quando usar TOTVS RM raw em vez de PBI_RAIZ

| Cenário | Usar |
|---------|------|
| RH, folha, ponto, compras, contábil | TOTVS RM (não está no PBI_RAIZ) |
| Dados real-time (última hora) | TOTVS RM (PBI_RAIZ pode ter lag de até 24h) |
| Campos não expostos no PBI_RAIZ | TOTVS RM (com validação de schema.json) |
| Matrículas, financeiro, educacional, metas | **PBI_RAIZ** (preferencial) |
