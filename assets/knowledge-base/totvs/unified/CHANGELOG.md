# CHANGELOG — TOTVS RM Knowledge Base Unificada

## [2.0.0] — 2026-03-26

### Adicionado
- **guides/api-dictionary.md**: Dicionário completo de APIs — 23 módulos, ~3.900 DataServers, volumetria de produção, tabela de dificuldade por caso de uso, quick start em 5 minutos
- **apis.json**: `modules` array (23 módulos com contagem de DataServers), `knownDataServers` (80+ DataServers por área: folha, ponto, RH, educacional, financeiro, compras/estoque, SMT), `productionVolume` (20.748 funcionários, 161.842 holerites, 198.713 batidas, 359.086 pessoas)
- **apis.json**: `restDataServerPattern` documentando `/RMSRestDataServer/rest/{DataServer}` como padrão REST alternativo
- **integration-patterns.md**: Dois padrões de URL REST documentados (API moderna + REST DataServer), formato de ID composto
- **index.md**: Métricas expandidas com módulos, DataServers totais, volumetria de produção

### Fonte
- Dicionário de APIs gerado manualmente a partir de inventário do servidor de produção (26/03/2026)

## [1.0.0] — 2026-03-26

### Criado
- **schema.json**: 69 tabelas, 1992 campos com tipos, FKs, PII flags
- **glossary.json**: 1,211 termos técnicos traduzidos para linguagem de negócio
- **domains.json**: 7 domínios MECE + mapeamento de tabelas
- **enums.json**: 5 tabelas de lookup com 84 valores reais do RM produção
- **queries.json**: 28 queries catalogadas (DOC-3 + DOC-14 + DOC-13)
- **apis.json**: 55 REST endpoints + 29 SOAP DataServers unificados
- **rules.json**: 6 categorias de regras (matrícula, notas, frequência, financeiro, multiTenant, PII)
- **8 domain MDs**: documentação navegável por domínio de negócio
- **4 guides**: integration-patterns, safety-security, gotchas (24 lições), query-cookbook
- **index.md**: navegação MECE com métricas e exemplos de consulta

### Fontes utilizadas
- `generated/all-fields-flat.json` (1992 campos base)
- `soap/dataservers-catalog.json` (29 DataServers)
- `rest-api/endpoints-catalog.json` (55 endpoints)
- `sql-metadata/enums/` (5 tabelas de lookup)
- `docs/DOC-1` a `DOC-17` (regras, schema, queries, segurança)

## 2026-03-26 — Sessão OBZ (extração SQL + SOAP)

### Adicionado
- `enums.json`: MARCA_COLIGADA mapping (10 marcas → coligadas)
- `schema.json`: PFFINANC (folha real, 49M rows), PSECAO (seções, PK=CODIGO), PFUNCAO (funções, PK=CODIGO)
- `apis.json`: 9 SOAP DataServers confirmados com filter_prefix e gotchas
- `rules.json`: 3 regras OBZ (NUMTEMPOS, MARCA≠COLIGADA, PFFINANC)
- `gotchas.md`: 11 novos gotchas (#25-#35) — schema SQL vs SOAP, prefixos filtro, SOAP sem VPN

### Corrigido
- Gotcha #1: SOAP funciona SEM VPN (Basic Auth porta 8051)
- PFHSTFIN → PFFINANC como tabela real de folha
- PSECAO/PFUNCAO usam CODIGO como PK (não CODSECAO/CODFUNCAO)

### Dados extraídos (salvos em projetos/obz-indicadores/data/)
- `totvs_extract.json` (88MB): 7 datasets SOAP (bolsas, profs, grades, turmas, turmadisc, coligadas, contratos)
- `totvs_sql_obz.json` (19KB): PFUNC 356 HC, bolsas 338, matrículas, seções 51, funções 714
- `totvs_soap_sap_tempos.json`: 19K turma-disciplinas coligada 8 (NUMTEMPOS não populado)
