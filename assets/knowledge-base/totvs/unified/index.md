# TOTVS RM — Knowledge Base Unificada (MECE)

> Base de conhecimento MECE (Mutuamente Exclusiva, Coletivamente Exaustiva) do TOTVS RM.
> Organizada por domínio de negócio. Sem duplicação. Formato híbrido (JSON + MD).

---

## Métricas

| Métrica | Valor |
|---------|-------|
| Módulos RM disponíveis | 23 |
| DataServers total (estimado) | ~3.900 |
| DataServers SOAP scraped | 29 (com schema detalhado) |
| Domínios documentados | 8 |
| Tabelas documentadas | 69 (+ metadados) |
| Campos mapeados | 1,992 |
| Endpoints REST | 55 (7 funcionando) |
| Queries catalogadas | 28 |
| Termos no glossário | 1,211 |
| Enums com valores reais | 5 tabelas (84 registros) |
| Regras de negócio | 6 categorias |
| Funcionários na base | 20.748 |
| Holerites disponíveis | 161.842 |
| Pessoas cadastradas (RH) | 359.086 |
| Batidas de ponto | 198.713+ |

---

## Navegação por Domínio

| # | Domínio | Tabelas | Descrição | Link |
|---|---------|---------|-----------|------|
| 01 | Framework (Global) | 5 | Coligadas, filiais, pessoas, usuários, permissões | [domains/01-framework.md](domains/01-framework.md) |
| 02 | Educacional — Estrutura | 11 | Cursos, habilitações, grades, disciplinas | [domains/02-educacional-estrutura.md](domains/02-educacional-estrutura.md) |
| 03 | Educacional — Operação | 19 | Turmas, horários, notas, etapas, infraestrutura | [domains/03-educacional-operacao.md](domains/03-educacional-operacao.md) |
| 04 | Educacional — Pessoas | 14 | Alunos, professores, matrículas, frequência | [domains/04-educacional-pessoas.md](domains/04-educacional-pessoas.md) |
| 05 | Financeiro | 7 | Contratos, parcelas, bolsas, lançamentos | [domains/05-financeiro.md](domains/05-financeiro.md) |
| 06 | RH / Folha | 8 | Funcionários, holerites, eSocial | [domains/06-rh-folha.md](domains/06-rh-folha.md) |
| 07 | Auxiliares (Lookups) | 4 | Status, tipos de matrícula, turnos | [domains/07-auxiliares.md](domains/07-auxiliares.md) |
| 08 | Metadados | 4+ | GDIC, GCAMPOS, GLINKSREL, GSISTEMA | [domains/08-metadados.md](domains/08-metadados.md) |

---

## Source of Truth (JSON)

| Arquivo | Conteúdo | Tamanho |
|---------|----------|---------|
| [schema.json](schema.json) | Todas tabelas, campos, tipos, FKs, PII | ~69 tabelas, 1992 campos |
| [glossary.json](glossary.json) | Tradução técnico → negócio | 1,211 termos |
| [domains.json](domains.json) | Mapeamento tabela → domínio | 7 domínios |
| [enums.json](enums.json) | Valores de lookup consolidados | 5 tabelas, 84 registros |
| [queries.json](queries.json) | Catálogo de queries com metadata | 28 queries |
| [apis.json](apis.json) | REST + SOAP endpoints unificados | 55 REST + 29 SOAP |
| [rules.json](rules.json) | Regras de negócio codificadas | 6 categorias |

---

## Guides

| Guide | Conteúdo |
|-------|----------|
| [api-dictionary.md](guides/api-dictionary.md) | **Dicionário completo**: 23 módulos, ~3.900 DataServers, volumetria, dificuldade por caso de uso, quick start |
| [integration-patterns.md](guides/integration-patterns.md) | Como integrar: REST, SOAP, SQL direto |
| [safety-security.md](guides/safety-security.md) | PII, risk scoring, tokens bloqueados |
| [gotchas.md](guides/gotchas.md) | 24 lições aprendidas (conectividade, auth, SQL, matrícula) |
| [query-cookbook.md](guides/query-cookbook.md) | 28 queries organizadas por caso de uso |

---

## Como Consultar

### Por tabela
```bash
# Buscar campo em todas as tabelas
python3 -c "import json; d=json.load(open('schema.json')); [print(f\"{t['name']}.{f['name']}: {f['caption']}\") for t in d['tables'] for f in t['fields'] if 'STATUS' in f['name']]"
```

### Por termo de negócio
```bash
# Traduzir termo técnico
python3 -c "import json; d=json.load(open('glossary.json')); [print(f\"{t['technical']}: {t['business']}\") for t in d['terms'] if 'PERLET' in t['technical']]"
```

### Por query
```bash
# Encontrar query por caso de uso
python3 -c "import json; d=json.load(open('queries.json')); [print(f\"{q['name']}: {q['useCase']}\") for q in d['queries'] if 'evasão' in q['useCase'].lower() or 'evasao' in q['name']]"
```

### Via Claude Code
```
"Quais campos da tabela SMATRICULA?"     → lê schema.json
"O que significa IDPERLET?"              → lê glossary.json
"Como consultar inadimplência?"          → lê queries.json + query-cookbook
"Quais tabelas do domínio financeiro?"   → lê domains.json
"Quais status de matrícula existem?"     → lê enums.json + rules.json
```

---

## Relação com Fontes Originais

A camada `unified/` é **derivada** das fontes brutas em `../raw/` (preservadas intactas):

| Fonte | Path | Status |
|-------|------|--------|
| 18 DOCs técnicos | `../raw/docs/` | Preservado (fonte primária de regras) |
| TypeScript types | `../raw/generated/` | Preservado (fonte de tipos) |
| SOAP schemas | `../raw/soap/` | Preservado (fonte de DataServers) |
| REST probes | `../raw/rest-api/` | Preservado (fonte de endpoints) |
| SQL metadata | `../raw/sql-metadata/` | Preservado (fonte de tabelas/enums) |
| JSONL knowledge | `../raw/specs/`, `../raw/suporte/`, `../raw/tdn/` | Preservado (750 records) |

Quando as fontes mudarem (novo scraping, novo DOC), regenerar a camada unified.
