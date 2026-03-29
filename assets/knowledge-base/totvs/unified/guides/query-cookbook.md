# Query Cookbook — TOTVS RM

> Referência cruzada para queries.json. Organizado por caso de uso.

---

## Como usar

Todas as queries estão catalogadas em `unified/queries.json` com metadata completa (domínio, tabelas, parâmetros, risk score). Este cookbook organiza por caso de uso para localização rápida.

---

## Dashboard / KPIs

| Query | Domínio | Fonte |
|-------|---------|-------|
| `dashboard-matriculas-status` | Pessoas | DOC-3 |
| `dashboard-frequencia-media` | Operação | DOC-3 |
| `comparativo-coligadas` | Framework | DOC-14 |
| `receita-por-coligada` | Financeiro | DOC-3 |

## Aluno / Matrícula

| Query | Domínio | Fonte |
|-------|---------|-------|
| `alunos-por-turma` | Pessoas | DOC-3 |
| `boletim-aluno` | Pessoas | DOC-3 |
| `boletim-completo-pivot` | Operação | DOC-14 |
| `historico-aluno` | Pessoas | DOC-3 |
| `status-matricula-detalhado` | Pessoas | DOC-14 |
| `alunos-risco-evasao` | Pessoas | DOC-14 |
| `evasao-tendencia` | Pessoas | DOC-3 |

## Notas / Frequência

| Query | Domínio | Fonte |
|-------|---------|-------|
| `notas-por-turma-etapa` | Operação | DOC-3 |
| `frequencia-diaria-turma` | Pessoas | DOC-3 |
| `resultado-final-turma` | Operação | DOC-3 |
| `disciplinas-reprovacao-alta` | Operação | DOC-14 |

## Professor

| Query | Domínio | Fonte |
|-------|---------|-------|
| `turmas-professor` | Pessoas | DOC-3 |
| `turmas-professor-horario` | Pessoas | DOC-14 |
| `professores-sem-turma` | Pessoas | DOC-3 |

## Financeiro

| Query | Domínio | Fonte |
|-------|---------|-------|
| `inadimplentes-periodo` | Financeiro | DOC-3 |
| `inadimplencia-acumulada` | Financeiro | DOC-14 |
| `bolsistas-ativos` | Financeiro | DOC-3 |
| `receita-por-coligada` | Financeiro | DOC-3 |

## Operação / Infraestrutura

| Query | Domínio | Fonte |
|-------|---------|-------|
| `vagas-turma` | Operação | DOC-3 |
| `ocupacao-salas` | Operação | DOC-14 |

## Introspecção (Schema Discovery)

| Query | Domínio | Fonte |
|-------|---------|-------|
| `gdic-listar-tabelas-educacionais` | Metadados | DOC-13 |
| `gdic-campos-tabela` | Metadados | DOC-13 |
| `gdic-busca-campo-descricao` | Metadados | DOC-13 |
| `glinksrel-fks-tabela` | Metadados | DOC-13 |
| `glinksrel-fks-educacionais` | Metadados | DOC-13 |

---

## Parâmetros Comuns

| Parâmetro | Tipo | Significado |
|-----------|------|-------------|
| `CODCOLIGADA` | int | **Obrigatório em TODAS as queries** — multi-tenant |
| `IDPERLET` | int | Período letivo (semestre/ano) |
| `RA` | string | Registro Acadêmico do aluno |
| `IDTURMADISC` | int | Turma-Disciplina (oferta específica) |
| `CODPROF` | int | Código do professor |
| `CODETAPA` | int | Etapa de avaliação (1ºBim, etc.) |

---

*SQL completo de cada query está nos DOCs fonte (DOC-3, DOC-14, DOC-13). Este cookbook é índice de navegação.*
