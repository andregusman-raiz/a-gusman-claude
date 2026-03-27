---
name: ag-5-documentos
description: "Maquina autonoma de documentacao. Office (PPTX, DOCX, XLSX, PDF), projeto (README, API), diagramas, specs, changelogs, data dictionaries, CSV transform — 15 modos, auto-detecta, produz docs completos."
model: sonnet
context: fork
argument-hint: "[modo] [path ou descricao]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TaskCreate, TaskUpdate, TaskList, TeamCreate, TeamDelete, SendMessage
metadata:
  filePattern: "README.md,CHANGELOG.md,docs/**,*.xlsx,*.xlsm,*.csv,*.pdf,*.pptx,*.docx,*.md,openapi.*,swagger.*,**/specs/**,**/schema*"
  bashPattern: "documentos|readme|changelog|xlsx|excel|pdf|pptx|docx|diagram|spec|api.doc|csv|data.dict"
  priority: 85
---

# DOCUMENTOS — Maquina Autonoma de Documentacao

## Invocacao

```
/ag-5-documentos [modo] [path ou descricao]
```

## Modos (15)

### Office Suite (4 skills dedicados)

| Modo | Skill | O que faz |
|------|-------|-----------|
| xlsx | skill: xlsx | Excel: formulas, formatacao, modelos financeiros, analise de dados, recalc via LibreOffice |
| pdf | skill: pdf | PDF: criar, merge, split, extrair texto/tabelas, OCR, formularios, watermark, criptografia |
| pptx | skill: pptx | PowerPoint: criar do zero (html2pptx), editar existente (OOXML), templates, design profissional |
| docx | skill: docx | Word: criar (docx-js), editar (OOXML), tracked changes/redlining, comments |

### Projeto & Docs (4)

| Modo | Skill / Agent | O que faz |
|------|--------------|-----------|
| projeto | ag-documentar-projeto | README, API docs, guias, changelog |
| api-docs | skill: api-docs | OpenAPI spec, endpoint reference, swagger, API documentation |
| changelog | skill: changelog-gen | CHANGELOG.md automatico a partir de git commits/PRs, Keep a Changelog format |
| spec | skill: spec-writer | SPECs tecnicas padronizadas (feature, issue, refactor), criterios de aceite |

### Diagramas & Dados (3)

| Modo | Skill | O que faz |
|------|-------|-----------|
| diagram | skill: diagram | Mermaid, PlantUML, D2 — flowcharts, sequence, ER, architecture, class diagrams |
| data-dict | skill: data-dictionary | Dicionario de dados a partir de schema (Drizzle, Prisma, SQL, TypeScript) |
| csv | skill: csv-transform | Limpar, validar, transformar CSVs sujos (encoding, headers, duplicatas, merge) |

### Relatorios & Qualidade (2)

| Modo | Skill | O que faz |
|------|-------|-----------|
| report | skill: markdown-report | Relatorios estruturados em Markdown (tecnico, executivo, auditoria, sprint review) |
| ortografia | ag-revisar-ortografia | Spell check PT-BR/EN silencioso |

### Utilitarios (2)

| Modo | Agent | O que faz |
|------|-------|-----------|
| organizar | ag-organizar-arquivos | Taxonomia, reorganizar (com aprovacao) |
| office | ag-gerar-documentos | PPTX, DOCX nivel consultoria (design brief) |

## Exemplos de Uso

```bash
# Office Suite
/ag-5-documentos xlsx relatorio financeiro Q1
/ag-5-documentos pdf merge ~/docs/*.pdf
/ag-5-documentos pptx pitch deck para investidores
/ag-5-documentos docx contrato com tracked changes

# Projeto & Docs
/ag-5-documentos projeto ~/Claude/GitHub/raiz-platform
/ag-5-documentos api-docs ~/Claude/GitHub/fgts-platform/src/app/api
/ag-5-documentos changelog v1.0.0 v2.0.0
/ag-5-documentos spec feature autenticacao OAuth

# Diagramas & Dados
/ag-5-documentos diagram er-diagram do schema de alunos
/ag-5-documentos data-dict ~/Claude/GitHub/salarios-platform/src/db/schema
/ag-5-documentos csv limpar ~/data/export-totvs.csv

# Relatorios & Qualidade
/ag-5-documentos report auditoria de seguranca
/ag-5-documentos ortografia ~/Claude/docs/
/ag-5-documentos organizar ~/Claude/projetos/
```

## Roteamento Automatico

Se modo nao especificado, detectar pelo contexto:
- Arquivo .xlsx/.csv mencionado → xlsx ou csv
- Arquivo .pdf mencionado → pdf
- Arquivo .pptx mencionado → pptx
- Arquivo .docx mencionado → docx
- "spec" ou "especificacao" → spec
- "changelog" ou "release notes" → changelog
- "diagrama" ou "fluxo" → diagram
- "dicionario de dados" ou "schema" → data-dict
- "relatorio" ou "report" → report
- "API doc" ou "swagger" → api-docs
- Default → projeto

## Dependencias por Skill

| Skill | Python | Node.js | Sistema |
|-------|--------|---------|---------|
| xlsx | openpyxl, pandas | xlsx-populate | LibreOffice |
| pdf | pypdf, pdfplumber, reportlab | — | poppler-utils, qpdf |
| pptx | markitdown[pptx], Pillow | pptxgenjs, playwright, sharp | LibreOffice, poppler |
| docx | defusedxml | docx | pandoc, LibreOffice |
| csv | pandas, chardet, pandera | — | — |
| diagram | — | — | MCP mermaid |
| api-docs | — | — | — |
| changelog | — | — | git, gh CLI |
| data-dict | — | — | — |
| spec | — | — | gh CLI |
| report | — | — | — |
