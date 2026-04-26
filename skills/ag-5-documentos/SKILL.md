---
name: ag-5-documentos
description: "Maquina autonoma de documentacao. Office (PPTX, DOCX, XLSX, PDF), projeto (README, API), diagramas, specs, changelogs, data dictionaries, CSV transform — 16 modos, auto-detecta, produz docs completos. Modo `executive` entrega decks McKinsey-grade com tokens rAIz via pipeline 4-fase obrigatorio."
model: sonnet
context: fork
argument-hint: "[modo] [path ou descricao] [--brand=raiz|inspira] [--skip-review] [--draft]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TaskCreate, TaskUpdate, TaskList, TeamCreate, TeamDelete, SendMessage
metadata:
  filePattern: "README.md,CHANGELOG.md,docs/**,*.xlsx,*.xlsm,*.csv,*.pdf,*.pptx,*.docx,*.md,openapi.*,swagger.*,**/specs/**,**/schema*"
  bashPattern: "documentos|readme|changelog|xlsx|excel|pdf|pptx|docx|diagram|spec|api.doc|csv|data.dict|executive|executivo|board|diretoria|mckinsey"
  priority: 85
---

# DOCUMENTOS — Maquina Autonoma de Documentacao

## Invocacao

```
/ag-5-documentos [modo] [path ou descricao]
```

## ⚠️ Pipeline 7-fase OBRIGATORIO (modo `executive` e `pptx --executive`)

> **Atualizado em 2026-04-25** com P0/P1 da auditoria rigorosa
> (`docs/diagnosticos/2026-04-25-avaliacao-rigorosa-pptx-skill.md`).
> Nota anterior: 5.4/10. Meta apos P0+P1: ~7.5/10.

**Nunca entregar a primeira versao (v1).** Todo deck executivo passa por 7 fases:

```
FASE 1 — SINTESE        FASE 2 — OUTLINE        FASE 3 — VIZ-FIRST       FASE 4 — LAYOUT
━━━━━━━━━━━━━━━━━━━     ━━━━━━━━━━━━━━━━━━━     ━━━━━━━━━━━━━━━━━━━     ━━━━━━━━━━━━━━━━━━━
<slug>.md (briefing)    estrutura por slide     [P0.1] viz por slide     selecao de exhibit
review editorial        [P0.4] funde proximos   tipo canonico            (matrix/timeline/...)

FASE 5 — RENDER         FASE 6 — AUDIT           FASE 7 — DELIVERY
━━━━━━━━━━━━━━━━━━━     ━━━━━━━━━━━━━━━━━━━     ━━━━━━━━━━━━━━━━━━━
<slug>-v1.pptx          [P0.2] viz ratio gate    <slug>-v2.pptx (final)
exhibit per slide       [P0.5] WCAG AA contrast  <slug>-v2.pdf
build com tokens rAIz   [P1.4] multimodal review fix loop ate <=3 iter
                        bloqueio se falha
```

**Gates obrigatorios (bloqueiam entrega):**
- P0.2 — >= 30% slides com viz nao-textual
- P0.5 — Texto WCAG AA (contraste >= 4.5:1)
- Geometria — zero shapes vazando da slide

**Bypass permitido apenas com flag explicita:** `--skip-review` ou `--draft`.

Detalhes: `lib/pipeline.py::ExecutiveDeckPipeline`,
`lib/visualization.py` (P0.1), `lib/audit.py` (P0.2/P0.3/P0.5/P1.2/P1.3/P1.4).

## Modos (15)

### Office Suite (4 skills dedicados + 1 modo executivo)

| Modo | Skill / Pipeline | O que faz |
|------|------------------|-----------|
| xlsx | skill: xlsx | Excel: formulas, formatacao, modelos financeiros, analise de dados, recalc via LibreOffice |
| pdf | skill: pdf | PDF: criar, merge, split, extrair texto/tabelas, OCR, formularios, watermark, criptografia |
| pptx | skill: pptx | PowerPoint standard: criar do zero (html2pptx), editar existente (OOXML), design padrao |
| **executive** | **pipeline 4-fase** | **PPTX board-ready nivel McKinsey — tokens rAIz default, brand override (inspira), action titles, takeaway bars, auditor visual. Entrega SEMPRE como v2 apos review.** |
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

## Modo `executive` — deck McKinsey-grade

### Quando usar (auto-trigger)
Palavras-chave que disparam: `executivo`, `board`, `diretoria`, `investidor`,
`mckinsey`, `comite executivo`, `nivel consultoria`.

Tambem use explicitamente quando o deck sera apresentado a stakeholders de alto
nivel (N1, CEO, investidor, board).

### Tokens visuais (default = rAIz)
Todas as cores e fontes sao carregadas de
`~/Claude/assets/design-library/tokens/*.json` — fonte de verdade unica.

| Token | Default rAIz | Override `inspira` |
|-------|--------------|---------------------|
| primary (dark bg) | `#1E2433` sidebar | `#1E2433` navy |
| accent (brand) | `#F7941D` orange | `#3CBFE0` cyan |
| font heading | IBM Plex Sans | Calibri |
| font body | IBM Plex Sans | Calibri |
| bg light | `#F8F9FA` | `#F8F9FA` |

**Em duvida sobre uma cor:** abrir catalog rAIz em
`cd ~/Claude/assets/design-library/catalog && npm run dev -- -p 3011`
→ `http://localhost:3011/tokens` (Playwright MCP).

### Briefing rigoroso obrigatorio (PRE-fase 1)

Antes de invocar a skill, copiar o template canonical de briefing:
- `lib/templates/briefing.md` (rigoroso, baseado em plano de uso 2026-04-25)
- 9 secoes obrigatorias: mensagem central, audiencia, duracao, narrativa,
  outline por slide com viz sugerida, identidade visual, exclusoes, cuidados, gates

Briefing genrico = nota 4-5/10. Briefing rigoroso = nota 7-8/10.

### Pipeline 7-fase (executar NESTA ORDEM — bloqueio se pular)

```python
from lib.pipeline import ExecutiveDeckPipeline
from lib.palette_overrides import get_brand

pipe = ExecutiveDeckPipeline(
    slug="inspira-cybersec-2025-2027",
    out_dir=Path("~/Claude/Saraiva"),
    brand=get_brand("inspira"),
)

# FASE 1 — Sintese (MD)
pipe.write_md(md_content)

# FASE 2 — Outline (estrutura) + sintese executiva (P0.4)
pipe.synthesize_outline(slides_data, apply_executive_synthesis=True)
# slides_data = [{'title': str, 'message': str, 'bullets': [str], ...}]
# apply_executive_synthesis=True funde slides com >=70% keyword overlap

# FASE 3 — Visualization-first design (P0.1)
pipe.assign_visualizations()
# Atribui viz canonica por slide: hero_number, bar_chart_comparison,
# matrix_2x2, timeline_horizontal, stack_hierarchy, etc.
# Hint explicito via 'kind_hint' no slide_data.

# Inspecao: viz quality report
report = pipe.viz_quality_report()
#   report["ratio_non_textual"]      — >= 0.30 obrigatorio (P0.2)
#   report["kind_counts"]            — Counter por tipo
#   report["layout_repetition_indices"] — slides com 3+ consecutivos iguais (P1.2)

# FASE 5 — Render (PPTX v1)
pipe.build_v1(lambda path, brand: build_deck_fn(path, brand))

# FASE 6 — Audit expandido
audit = pipe.audit()
#   audit["pdf_path"]              — PDF gerado via soffice
#   audit["warnings"]              — geometric + WCAG (P0.5) + source_line (P1.3)
#   audit["report_md"]             — relatorio markdown
#   audit["multimodal_checklist"]  — 14 itens para Read multimodal (P1.4)
#   audit["viz_quality"]           — metricas P0.2 + P1.2
#   audit["blocked_for_delivery"]  — list de razoes que BLOQUEIAM entrega
#   audit["high_severity_count"]   — quantos warnings sao high

# Se audit["blocked_for_delivery"] nao-vazio: aplicar fixes e re-build.
# Claude orquestrador faz Read multimodal do PDF + checklist.
# Loop ate <= 3 iteracoes.

# FASE 7 — v2 (ENTREGA)
result = pipe.promote_to_v2()
#   result["deliverable_pptx"]     — SEMPRE <slug>-v2.pptx
#   result["deliverable_preview"]  — <slug>-v2.pdf
```

### Checklist multimodal — 14 itens (P1.4)

Apos PDF gerado (FASE 6), Claude orquestrador DEVE:
1. Convert PPTX -> PDF via soffice (ja feito por audit())
2. Read PDF page-by-page com Claude multimodal
3. Aplicar checklist em `lib/audit.py::MULTIMODAL_REVIEW_CHECKLIST` (14 itens)
4. Score: passar >= 11/14 (80%) para entregar
5. Se < 11/14: voltar para FASE 4/5 com defeitos especificos
6. Loop ate 3 iteracoes max

### Anti-patterns canonical detectados automaticamente (P0.3, P1.3)

| Anti-pattern | Detector |
|---|---|
| Title comeca com "Os/As/Um/Sumario/Definicoes/Tipos de" | `validate_action_title_quality()` |
| Title sem numero quando source tem dado | `validate_action_title_quality()` |
| Texto contraste < WCAG AA 4.5:1 | `check_text_contrast()` |
| 3+ slides consecutivos com mesmo layout | `detect_layout_repetition_from_kinds()` |
| Afirmacao categorica ("4 camadas", "6 estagios") sem source | `check_source_line_for_categorical()` |
| Bullet com > 18 palavras | `detect_anti_patterns()` |
| Viz ratio < 30% (deck-level) | `audit_deck(viz_kinds=...)` |

### Primitivos disponiveis (`lib/mckinsey_pptx.py`)
`chrome()`, `action_title()`, `takeaway_bar()`, `source_line()`, `kpi_card()`,
`status_pill()`, `set_bg()`, `add_rect()`, `add_tb()`,
`validate_action_title_quality()`.

### Charts (`lib/timeline_charts.py`)
`timeline_horizontal()`, `line_chart_simple()`, `bar_chart_horizontal()`.

### Biblioteca de exhibits (`lib/exhibits/`) — P1.1

10 builders canonicos, cada um com `render(slide, spec, brand)`:

| Kind | Quando usar |
|---|---|
| `hero_number` | Numero gigante 60-100pt + tese curta |
| `matrix_2x2` | Classificacao 2 dimensoes (4 quadrantes) |
| `timeline_horizontal` | Marcos sequenciais |
| `bar_chart_comparison` | Comparacao 2-5 segmentos |
| `stack_hierarchy` | N camadas em stack vertical |
| `before_after_arrow` | 2 estados com seta dominante |
| `risk_heatmap` | Risco x impacto (5x5 ou 3x3) |
| `quote_slide` | Citacao editorial |
| `decision_slide` | Pergunta + 2-3 opcoes com trade-offs |
| `process_flow` | Etapas com setas |

Uso:
```python
from lib.exhibits import RENDER_REGISTRY, EXAMPLE_INPUTS

# Em loop de render
for item in pipe.outline:
    viz = item['viz']
    render_fn = RENDER_REGISTRY[viz.kind]
    render_fn(slide, item.get('viz_data', EXAMPLE_INPUTS[viz.kind]), brand=brand)
```

### Templates prontos (`lib/templates/`)
- `briefing.md` — template canonical de briefing
- `cover_slide.render()`, `closing_slide.render()`

### Bypass (uso restrito)
- `--skip-review` — promove v1 -> v2 sem auditoria (mantem estrutura do pipeline)
- `--draft` — rascunho rapido, sem quality gate

## Exemplos de Uso

```bash
# Modo executive (pipeline 4-fase obrigatorio)
/ag-5-documentos executive deck cybersec inspira 2025-2027 --brand=inspira
/ag-5-documentos executive pitch deck investidores rAIz  # default = raiz tokens
/ag-5-documentos executive --draft board pre-mortem      # bypass rapido

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
