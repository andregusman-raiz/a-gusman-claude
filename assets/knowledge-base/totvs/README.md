# TOTVS RM — Knowledge Base

> ERP Educacional TOTVS RM (Linha RM / Classis Net) — Versão 12.1.2502
> Módulos: Educacional (SGE), Financeiro (Fluxus), RH/Folha (Labore), Framework

---

## Estrutura

```
totvs/
├── unified/          ← COMECE AQUI — KB organizada por domínio, MECE, sem duplicação
│   ├── index.md      ← Ponto de entrada principal
│   ├── schema.json   ← 69 tabelas, 1992 campos, FKs, PII
│   ├── glossary.json ← 1,211 termos técnico → negócio
│   ├── domains/      ← 8 docs por domínio de negócio
│   ├── guides/       ← Integração, segurança, gotchas, cookbook
│   └── ...           ← enums, queries, apis, rules (JSONs)
│
├── raw/              ← Fontes brutas (preservadas, não editar diretamente)
│   ├── docs/         ← 18 DOCs técnicos (DOC-1 a DOC-17)
│   ├── generated/    ← TypeScript types, all-fields-flat.json
│   ├── soap/         ← 29 DataServer schemas + catalog
│   ├── rest-api/     ← 55 endpoints probados
│   ├── sql-metadata/ ← 9950 tabelas, enums reais
│   ├── specs/        ← 263 specs OpenAPI (JSONL)
│   ├── suporte/      ← 300 tickets Central TOTVS (JSONL)
│   ├── tdn/          ← 187 docs TDN (JSONL)
│   └── validation/   ← Data samples
│
└── README.md         ← Este arquivo
```

---

## Camada Unificada (MECE) — COMECE AQUI

**[→ unified/index.md](unified/index.md)**

| Recurso | Arquivo | O que contém |
|---------|---------|-------------|
| Schema completo | `unified/schema.json` | 69 tabelas, 1992 campos, FKs, PII |
| Glossário | `unified/glossary.json` | 1,211 termos técnico → negócio |
| Domínios | `unified/domains/` | 8 docs por domínio de negócio |
| Queries | `unified/queries.json` | 28 queries catalogadas |
| APIs | `unified/apis.json` | 55 REST + 29 SOAP unificados |
| Regras | `unified/rules.json` | Matrícula, notas, financeiro, PII |
| Enums | `unified/enums.json` | Valores reais do RM produção |
| Guides | `unified/guides/` | Integração, segurança, gotchas, cookbook |

### Domínios MECE

| # | Domínio | Tabelas | Link |
|---|---------|---------|------|
| 01 | Framework (Global) | 5 | [unified/domains/01-framework.md](unified/domains/01-framework.md) |
| 02 | Educacional — Estrutura | 11 | [unified/domains/02-educacional-estrutura.md](unified/domains/02-educacional-estrutura.md) |
| 03 | Educacional — Operação | 19 | [unified/domains/03-educacional-operacao.md](unified/domains/03-educacional-operacao.md) |
| 04 | Educacional — Pessoas | 15 | [unified/domains/04-educacional-pessoas.md](unified/domains/04-educacional-pessoas.md) |
| 05 | Financeiro | 7 | [unified/domains/05-financeiro.md](unified/domains/05-financeiro.md) |
| 06 | RH / Folha | 8 | [unified/domains/06-rh-folha.md](unified/domains/06-rh-folha.md) |
| 07 | Auxiliares (Lookups) | 4 | [unified/domains/07-auxiliares.md](unified/domains/07-auxiliares.md) |
| 08 | Metadados | 4+ | [unified/domains/08-metadados.md](unified/domains/08-metadados.md) |

---

## Métricas

| Métrica | Valor |
|---------|-------|
| Arquivos totais | 68+ (raw) + 21 (unified) |
| Tabelas documentadas | 69 (+ metadados) |
| Campos mapeados | 1,992 |
| DataServer objects | 29 |
| Queries catalogadas | 28 |
| Termos no glossário | 1,211 |
| Endpoints REST | 55 (7 funcionando) |
| Specs OpenAPI (JSONL) | 263 records |
| TDN docs (JSONL) | 187 records |
| Central Suporte (JSONL) | 300 records |
| Última atualização | 2026-03-26 |

---

## Guia Rápido

| Preciso saber... | Consultar |
|-----------------|-----------|
| Campos de uma tabela | `unified/schema.json` (ou domínio MD correspondente) |
| O que significa um campo TOTVS | `unified/glossary.json` |
| Status de matrícula e flags | `unified/enums.json` + `unified/rules.json` |
| Relacionamentos entre tabelas | Domínio MD (hierarquia + FKs em schema.json) |
| Query SQL pronta | `unified/queries.json` + `unified/guides/query-cookbook.md` |
| Endpoints REST/SOAP | `unified/apis.json` |
| Regras de negócio | `unified/rules.json` |
| Armadilhas de integração | `unified/guides/gotchas.md` |
| Segurança / PII | `unified/guides/safety-security.md` |
| Padrões de integração | `unified/guides/integration-patterns.md` |
| **DOCs originais detalhados** | `raw/docs/DOC-1` a `DOC-17` |

## Hierarquia de Tabelas

```
GCOLIGADA → GFILIAL → SCURSO → SHABILITACAO → SGRADE → SDISCGRADE → SDISCIPLINA
                         ↓
                    SHABILITACAOFILIAL
                         ↓
SPLETIVO → STURMA → STURMADISC → SETAPAS → SNOTAETAPA
                                → SPROFESSORTURMA
                                → SHORARIOTURMA → FrequenciaDiaria
PPESSOA → SALUNO → SHABILITACAOALUNO (CODSTATUS → SSTATUS)
                 → SMATRICPL (CODSTATUS, CODTIPOMAT, CODSTATUSRES)
                 → SMATRICULA (CODSTATUS, CODSTATUSRES)
                 → SCONTRATO → SPARCELA → SLAN → FLAN
```

---

## Fontes Externas

- [API Legada TOTVS](https://apitotvslegado.z15.web.core.windows.net/) — DataServer objects
- [TDN - Educacional](https://tdn.totvs.com/display/public/LRM/Educacional) — Documentação oficial
- [Central de Atendimento](https://centraldeatendimento.totvs.com/hc/pt-br/sections/206984868) — Suporte
- [Fórum RM](https://www.forumrm.com.br/) — Comunidade
- [GitHub - bitts/Consultas-SQL](https://github.com/bitts/Consultas-SQL) — Queries SQL
- [Estagiário do RM](https://estagiariodorm.wordpress.com/) — GDIC, GLINKSREL, dicas

---

## Manutenção

A camada `unified/` é **derivada** das fontes em `raw/`. Quando as fontes mudarem (novo scraping, novo DOC), regenerar unified com o script de geração (ver CHANGELOG).

- **Adicionar DOC**: criar em `raw/docs/`, depois atualizar unified correspondente
- **Novo scraping**: salvar em `raw/`, regenerar schema.json + domínios
- **NUNCA editar raw/ diretamente para "consertar"** — editar o source e regenerar
