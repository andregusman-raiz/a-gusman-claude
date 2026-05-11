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

---

## Tabelas TOTVS RM usadas no raiz-data-engine (v2.0 — 2026-04-01)

> 46 tabelas MSSQL efetivamente consultadas no código. Gerado a partir de análise do código-fonte.
> Ref: `unified/schema.json` v2.0 para detalhes completos (colunas, JOINs, PII, arquivos).

### Estrutura (4 tabelas)

| Tabela | Uso Principal | Arquivos |
|--------|--------------|----------|
| `GCOLIGADA` | Empresas/escolas (multi-tenant master) | estrutura, rh, financeiro, matriculas |
| `GFILIAL` | Filiais por coligada | estrutura |
| `PSECAO` | Departamentos/secoes RH | estrutura |
| `PCARGO` | Cargos (job positions) | estrutura |

### Educacional - Pessoas (4 tabelas)

| Tabela | Uso Principal | Arquivos |
|--------|--------------|----------|
| `SALUNO` | Alunos master (RA + CODPESSOA) | educacional/alunos |
| `PPESSOA` | Pessoa fisica (NOME, CPF, EMAIL) — PII-heavy | rh, educacional, ponto, smt |
| `SPROFESSOR` | Professor master (CODPROF + CHAPA) | ponto |
| `SPROFESSORTURMA` | Professor-turma assignment | educacional, kpis, ponto |

### Educacional - Estrutura (6 tabelas)

| Tabela | Uso Principal | Arquivos |
|--------|--------------|----------|
| `SPLETIVO` | Periodos letivos (CODPERLET=2024/2025/2026) | 19 files (most-used table) |
| `SMATRICPL` | Matriculas (enrollment + status) | 14 files |
| `SHABILITACAOFILIAL` | Curso+grade+turno per enrollment | 10 files |
| `SCURSO` | Cursos (EI, EFI, EFII, EM) | 10 files |
| `SGRADE` | Grades curriculares | educacional/alunos, turmas |
| `STURMA` | Turmas (class groups) | educacional/turmas |

### Educacional - Operacao (5 tabelas)

| Tabela | Uso Principal | Arquivos |
|--------|--------------|----------|
| `STURMADISC` | Turma-disciplina (class-subject) — central hub | 7 files |
| `SDISCIPLINA` | Disciplinas (subjects) | 6 files |
| `SNOTAETAPA` | Notas por etapa (grades) | educacional, kpis |
| `SFREQUENCIA` | Frequencia diaria (attendance) — MSSQL only | educacional, kpis |
| `SOCORRENCIAS` | Ocorrencias de alunos (incidents) | educacional/ocorrencias |
| `STIPOOCORRENCIA` | Tipos de ocorrencia (lookup) | educacional/ocorrencias |

### Financeiro (7 tabelas)

| Tabela | Uso Principal | Arquivos |
|--------|--------------|----------|
| `FLAN` | Lancamentos financeiros (core: boletos, NFS) | 5 files |
| `SPARCELA` | Parcelas educacionais (payment plans) | 5 files |
| `SBOLSALAN` | Bolsas/descontos por parcela | financeiro/bolsistas, ticket, curva |
| `SSERVICO` | Servicos educacionais (Mensalidade, Material) | 5 files |
| `FTDO` | Tipos documento financeiro (005=Boleto) | financeiro/receita |
| `GNATFINANCEIRA` | Naturezas financeiras | financeiro/provider |

### RH / Folha (5 tabelas)

| Tabela | Uso Principal | Arquivos |
|--------|--------------|----------|
| `PFUNC` | Funcionarios master (employee) | 9 files (2nd most-used) |
| `PFFINANC` | Holerite/folha events (payroll) | rh/folha, rh/folha_detalhada |
| `PEVENTO` | Eventos de folha (rubrica definitions) | rh/folha_detalhada |
| `PFDEPEND` | Dependentes de funcionarios — PII | rh/complementar |
| `PFHSTSAL` | Historico salarial | rh/complementar |
| `PFUFERIASPER` | Ferias | rh/folha_detalhada |

### Contabil (3 tabelas)

| Tabela | Uso Principal | Arquivos |
|--------|--------------|----------|
| `CPARTIDA` | Lancamentos contabeis GL (5.6M rows) | contabil, obz, kpis |
| `CCONTA` | Plano de contas | contabil |
| `GCCUSTO` | Centros de custo (10K+) | contabil, kpis |

### Compras / Estoque (3 tabelas)

| Tabela | Uso Principal | Arquivos |
|--------|--------------|----------|
| `FCFO` | Fornecedores/clientes — PII | compras |
| `TMOV` | Movimentos (OC, NF) | compras, estoque |
| `TITMMOV` | Itens de movimento | estoque |
| `TPRODUTO` | Produtos (140K) | compras, estoque |

### Ponto (2 tabelas)

| Tabela | Uso Principal | Arquivos |
|--------|--------------|----------|
| `ASALDOBANCOHOR` | Banco de horas - saldo | ponto |
| `ASALDOBANCOHORFUNDETALHE` | Banco de horas - detalhe | ponto |
| `SHORARIOTURMA` | Horarios de turma (125K) | ponto |
| `SHORARIOPROFESSOR` | Horarios de professor (88K) | ponto |

### SMT - Saude (3 tabelas)

| Tabela | Uso Principal | Arquivos |
|--------|--------------|----------|
| `VATESTADO` | Atestados medicos | smt |
| `VCHAPAATESTADO` | Link atestado-funcionario | smt |
| `VTIPOATESTADO` | Tipos de atestado | smt |

### Top 5 tabelas mais referenciadas

1. **SPLETIVO** — 19 files (join key for every cycle-based query)
2. **SMATRICPL** — 14 files (enrollment is the core business)
3. **SHABILITACAOFILIAL** — 10 files (links enrollment to course)
4. **SCURSO** — 10 files (course filter for most KPIs)
5. **PFUNC** — 9 files (employee master for all HR)

### Tabelas com PII (requer mascaramento)

| Tabela | Colunas PII |
|--------|-------------|
| `PPESSOA` | NOME, CPF, EMAIL, SEXO, DTNASCIMENTO, TELEFONE1, TELEFONE2 |
| `PFDEPEND` | NOME, CPF, DTNASCIMENTO, SEXO |
| `FCFO` | NOME, NOMEFANTASIA, CGCCFO, EMAIL, TELEFONE |
| `GCOLIGADA` | CGC, NOME |
| `GFILIAL` | CGC, NOME |
| `VATESTADO` | CID (health data) |
