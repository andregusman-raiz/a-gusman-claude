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

## PPTX — REGRAS OBRIGATORIAS (Anti-Overflow)

> Incidente 2026-04-21: textos em grid 2x2 (organograma, FP&A, AI-first rAIz) ultrapassaram
> caixas porque `python-pptx` nao mede largura renderizada. Paleta dark era default — falta
> de contraste agravava problemas de leitura.

### Regras R1-R8 (detalhe completo em `skills/pptx/SKILL.md`)

1. **R1** — Toda caixa de texto passa por `add_text_safe()` ou `add_paragraphs_safe()` do helper `pptx_utils.py` (mede via Pillow + fonte do sistema, auto-shrink)
2. **R2** — `LIGHT_THEME` como padrao (fundo off-white, texto near-black). Dark so quando pedido
3. **R3** — Fonte com TTF instalado (`Helvetica`/`Arial`). Fontes web-only quebram medicao
4. **R4** — Larguras em Emu calculadas; padding interno min 2pt; altura reserva `lines * size * 1.3`
5. **R5** — Numeros grandes (metrics) em caixa dedicada com `fit_text_size`. Label em caixa separada
6. **R6** — Bullet text: max 12 palavras / 75 chars, 1 linha preferencial (encurtar, nao reduzir fonte)
7. **R7** — Pos-geracao obrigatorio: `verify_deck(path)` + `render_deck_to_pngs(path)` para QA visual
8. **R8** — Usar `DeckBuilder` (quando disponivel) ou helper direto — nunca `add_textbox` cru

### Caminho preferido

```python
import sys
sys.path.insert(0, "/Users/andregusmandeoliveira/Claude/.claude/skills/pptx/templates")
from pptx_utils import LIGHT_THEME, add_text_safe, verify_deck, render_deck_to_pngs
```

---

## PDF — REGRAS OBRIGATORIAS (Anti-Overflow)

> Incidentes 2026-04-11 (Cubo Tech):
> - **v1**: badges/tabelas com overflow (causa: `drawString` + strings cruas sem wrap)
> - **v2**: tentei usar U+2011 (non-breaking hyphen) para resolver v1 — resultado foi PIOR: Helvetica built-in nao tem glyph, todos viraram quadrado preto `■`, e Paragraph ignora U+2011 para break control
> - **v3 (correto)**: hifen ASCII `-` para tudo + `splitLongWords=0` no ParagraphStyle das celulas/KPIs
>
> **Essas regras sao obrigatorias em todo PDF gerado. Ver detalhes completos em `skills/pdf/SKILL.md`.**

### Regras R1-R6

1. **R1**  Toda celula de tabela DEVE ser `Paragraph(texto, style)`, NUNCA string crua
2. **R2**  Use `splitLongWords=0` no ParagraphStyle de celulas curtas e KPIs. Hifen ASCII `-` para tudo: ranges numericos (`280-360`, `R$ 5,5-10,6M`) E palavras compostas (`escola-instituto`, `capacidade-alvo`, `semi-integral`). **NUNCA usar `\u2011`** — vira quadrado preto em Helvetica built-in
3. **R3**  KPI badges como `Table` de `Paragraph`, NUNCA `canvas.drawString` em caixa de largura fixa
4. **R4**  Larguras de coluna proporcionais a `CONTENT_W` com pesos explicitos que somam 1.0
5. **R5**  Verificacao obrigatoria pos-geracao via `pdftotext -layout` + grep de padroes de overflow + checagem de U+25A0 (quadrado preto)
6. **R6**  Usar o template `skills/pdf/templates/professional_report.py` como ponto de partida

### Caminho preferido para PDFs de relatorio profissional

```python
import sys
sys.path.insert(0, "/Users/andregusmandeoliveira/Claude/.claude/skills/pdf/templates")
from professional_report import ReportBuilder, nbh

rb = ReportBuilder(
    "saida.pdf",
    title="Titulo",
    subtitle="Subtitulo",
    tagline="TAGLINE DA CAPA",
    brand="Nome Marca",
    version="v1.0  Abril 2026",
    confidential=True,
    theme={  # opcional, override de cores
        "primary": HexColor("#0A1628"),
        "accent":  HexColor("#00C3FF"),
    }
)

# Capa com badges (numeros passam por nbh() automaticamente)
rb.cover(kpis=[
    ("280-360", "alunos"),
    ("R$ 5,5-10,6M", "orcamento"),
    ("6 labs", "core"),
    ("90%", "meta"),
])

# Conteudo
rb.section(1, "Sumario Executivo")
rb.paragraph("Texto do paragrafo...")
rb.bullets(["ponto 1", "ponto 2"])
rb.quote("Frase importante")
rb.table(
    header=["Col A", "Col B", "Col C"],
    rows=[["v1", "v2", "v3"]],
    weights=[0.40, 0.40, 0.20],  # soma = 1.0
)
rb.kpi_row([("100%", "meta"), ("92%", "atual")])
rb.page_break()

# Build + verificacao automatica (R5)
path, ok, warnings = rb.build_and_verify()
```

### Quando NAO usar o template

- PDFs meramente tecnicos sem capa/tabelas/KPIs (usar reportlab diretamente, sem design)
- Watermark, merge, split, OCR, form fill (usar pypdf/pdfplumber diretamente)
- PDFs que precisam de layout radicalmente diferente (HTML-to-PDF via playwright, por ex.)

Mesmo fora do template, **R1-R5 continuam obrigatorias**.

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
