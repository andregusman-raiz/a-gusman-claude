---
name: ag-5-documentos
description: "Documentacao: Office (PPTX/DOCX/XLSX/PDF), README, API, diagramas, specs, changelog, data dictionary e CSV; executive para decks."
model: sonnet
context: fork
argument-hint: "[modo] [path ou descricao] [--brand=raiz|inspira] [--skip-review] [--draft]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TaskCreate, TaskUpdate, TaskList, TeamCreate, TeamDelete, SendMessage
metadata:
  filePattern: "README.md,CHANGELOG.md,docs/**,*.xlsx,*.xlsm,*.csv,*.pdf,*.pptx,*.docx,*.md,openapi.*,swagger.*,**/specs/**,**/schema*"
  bashPattern: "documentos|readme|changelog|xlsx|excel|pdf|pptx|docx|diagram|spec|api.doc|csv|data.dict|executive|executivo|board|diretoria|mckinsey|soap|motivacional|inspiracional|institucional|manifesto|cultura|town.?hall|all.?hands|kickoff|keynote|palestra"
  priority: 85
---

# DOCUMENTOS — Maquina Autonoma de Documentacao

## Invocacao

```
/ag-5-documentos [modo] [path ou descricao]
```

## Docs Location (OBRIGATORIO em todos os modos)

Antes de salvar qualquer doc gerado, resolver `PROJECT_ROOT`:

```bash
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
[ "$PROJECT_ROOT" = "$HOME/Claude" ] && {
  # Workspace raiz nao e projeto. Perguntar qual projeto ao usuario.
  # Listar opcoes: ls ~/Claude/GitHub/ ~/Claude/projetos/
  exit 1
}
```

Mapa de destinos por modo (todos relativos a `$PROJECT_ROOT`):
- `executive`/`pptx`/`docx`/`pdf` → `$PROJECT_ROOT/docs/reports/<slug>.{pptx,docx,pdf}`
- `spec` → `$PROJECT_ROOT/docs/specs/<slug>-spec.md`
- `prd` → `$PROJECT_ROOT/docs/specs/<slug>-prd.md`
- `adr` → `$PROJECT_ROOT/docs/adr/ADR-NNN-<slug>.md`
- `report` → `$PROJECT_ROOT/docs/reports/<slug>.md` (textual) ou `$PROJECT_ROOT/docs/diagnosticos/` (tecnico)
- `data-dict` → `$PROJECT_ROOT/docs/data-dictionaries/<schema>.md`
- `api-doc` → `$PROJECT_ROOT/docs/api/<spec>.md`
- `diagram` → `$PROJECT_ROOT/docs/diagrams/<slug>.{md,svg,png}`
- `changelog` → `$PROJECT_ROOT/CHANGELOG.md`
- `readme` → `$PROJECT_ROOT/README.md`

Excecao legitima cross-project: salvar em `~/Claude/docs/workspace/...` com flag `--workspace-doc`.

NUNCA salvar em `~/Claude/docs/` raiz — hook `docs-location-guard.sh` bloqueia. Detalhes: `~/Claude/.claude/shared/patterns/docs-location.md`.

## ⚠️ Pipeline 7-fase OBRIGATORIO (modo `executive` e `pptx --executive`)

> **Atualizado em 2026-04-25** com P0/P1 da auditoria rigorosa
> (`docs/diagnosticos/2026-04-25-avaliacao-rigorosa-pptx-skill.md`).
> Nota anterior: 5.4/10. Meta apos P0+P1: ~7.5/10.
>
> **2026-04-25 (v4 audit)**: aplicados P0.6/P0.7/P0.8 + P1.5/P1.6/P1.7
> apos auditoria slide-por-slide do v4 (nota 7.2/10).
> Defeitos cobertos: arbitrary wrap, intra-slide overlap, audience leak,
> closing slide com 5 frases, cover sem logo, hero caption inflada,
> stack ordem semantica != visual, accent monolitico (laranja decorativo).

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
- P0.6 — Zero quebras de label em ponto NAO-natural (arbitrary wrap)
- P0.7 — Zero shapes sobrepostos sem `_overlay_intentional` marker
- Geometria — zero shapes vazando da slide

**Validators bloqueantes (P0.6, P0.7) — adicionados em 2026-04-25:**

| Validator | Detecta | Causa de origem (v4 audit) |
|-----------|---------|----------------------------|
| `detect_arbitrary_label_wrap()` | Labels com 3+ linhas terminando em ponto NAO-natural (palavra cortada, separador artificial '/') | Slide 20: "Criar pasta / de trabalho / ~/Claude-Workspace" — 3 quebras arbitrarias |
| `detect_intra_slide_overlap()` | Shapes com >=20% overlap dentro do mesmo slide, exceto marcados como `_overlay_intentional` | Slide 22: ladder lateral sobre matriz 2x2, truncando "Var competitiva." e "Es" |

Ambos rodam dentro de `audit_slide()` e sao reportados em `audit["blocked_for_delivery"]`.

**Audience gate (P0.8) — 2026-04-25:**

`ExecutiveDeckPipeline(audience="external")` ativa auto-mask de nomes
proprios internos detectados via regex (CamelCase sem prefix Raiz).
Exemplos: `JusRaiz` → `plataforma interna`. Brand allowlist preserva
`Raiz`/`RaizEducacao`/`rAIz`. Warnings emitidos para revisao manual.

Audiences validas: `internal` (no-op), `external`, `board_external`,
`investor`, `press`.

**Cross-section layout balance (P1.5) — 2026-04-25:**

`detect_layout_repetition_from_kinds(layout_kinds, concentration_threshold=0.30)`
agora reporta tambem `kind_concentration` quando um kind individual
representa >30% do deck — sinal de monotonia visual mesmo sem repeticao
consecutiva.

**Bypass permitido apenas com flag explicita:** `--skip-review` ou `--draft`.

Detalhes: `lib/pipeline.py::ExecutiveDeckPipeline`,
`lib/visualization.py` (P0.1), `lib/audit.py` (P0.2/P0.3/P0.5/P1.2/P1.3/P1.4).

## Modos (16)

### Office Suite (4 skills dedicados + 1 modo executivo)

| Modo | Skill / Pipeline | O que faz |
|------|------------------|-----------|
| xlsx | skill: xlsx | Excel: formulas, formatacao, modelos financeiros, analise de dados, recalc via LibreOffice |
| pdf | skill: pdf | PDF: criar, merge, split, extrair texto/tabelas, OCR, formularios, watermark, criptografia |
| pptx | skill: pptx | PowerPoint standard: criar do zero (html2pptx), editar existente (OOXML), design padrao |
| **executive** | **pipeline 7-fase** | **PPTX board-ready nivel McKinsey — DATA-DENSE: action titles, exhibits, charts, source lines. Tokens rAIz default. Entrega SEMPRE como v2 apos review.** |
| **soap** | **template HTML** | **Apresentacao NARRATIVA de alto impacto — MINIMALISTA: 1 ideia por slide, tipografia gigante, marca. Para conteudo motivacional/institucional/cultural/manifesto. Entrega .html navegavel.** |
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
| font heading | Montserrat | Calibri |
| font body | Montserrat | Calibri |
| bg light | `#F8F9FA` | `#F8F9FA` |

**Em duvida sobre uma cor:** abrir catalog rAIz em
`cd ~/Claude/assets/design-library/catalog && npm run dev -- -p 3011`
→ `http://localhost:3011/tokens` (Playwright MCP).

### Tipografia canonical

Escala Montserrat: kicker/caption=9pt, body=14pt, h1=28pt, hero=40pt, hero_xl=56pt. Valores em `lib/raiz_tokens.FONT_SIZE`. Escape hatch legacy: `FONT_SIZE_LEGACY["body"]` = 11pt.

> Tabela completa: Read `~/Claude/.claude/shared/patterns/ag5-exhibits.md` (Seção D)

### Fallback de fonte (Helvetica)

`Brand.font_heading`/`font_body` agora passam por `pptx_utils.resolve_font_family()`,
que detecta se Montserrat esta instalada (via varredura de `~/Library/Fonts`,
`/usr/share/fonts`, etc.). Se ausente, escreve **Helvetica** no XML do PPTX e
loga warning unico. Nunca aborta build. Para sumir com o warning, instalar a
fonte: `https://fonts.google.com/specimen/Montserrat` → `~/Library/Fonts/`.

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

### Biblioteca de exhibits e Brand semantics

11 builders em `lib/exhibits/` (hero_number, matrix_2x2, timeline_horizontal, bar_chart_comparison, stack_hierarchy, before_after_arrow, risk_heatmap, quote_slide, decision_slide, process_flow, section_divider) + 3 tiers de paleta (accent_strong #F7941D, accent_moderate #5BB5A2, accent_neutral #1E2433).

> Detalhe completo + code: Read `~/Claude/.claude/shared/patterns/ag5-exhibits.md` (Seções A e B)

### Templates prontos (`lib/templates/`)
- `briefing.md` — template canonical de briefing
- `cover_slide.render()`, `closing_slide.render()`

### Bypass (uso restrito)
- `--skip-review` — promove v1 -> v2 sem auditoria (mantem estrutura do pipeline)
- `--draft` — rascunho rapido, sem quality gate

## Modo `soap` — apresentacao narrativa de alto impacto (HTML)

> Estilo "SOAP / Apple / Duarte": minimalista, emocional, 1 ideia grande por
> slide. O apresentador fala; o slide ancora. Oposto do `executive` (data-dense).

### Quando usar (auto-trigger)

Palavras-chave que disparam: `soap`, `motivacional`, `inspiracional`,
`institucional`, `cultura`, `manifesto`, `valores`, `visao`, `proposito`,
`comunicado`, `kickoff`, `town hall`, `all-hands`, `palestra`, `keynote`,
`celebracao`, `storytelling`.

Tambem quando: conteudo e emocional/narrativo (nao data-dense), publico amplo
(colaboradores, evento), objetivo e engajar/inspirar/alinhar (nao decidir com dados).

### SOAP vs executive — qual escolher

| Sinal | **soap** (HTML) | **executive** (PPTX) |
|-------|-----------------|----------------------|
| Objetivo | inspirar, alinhar cultura, narrar | decidir com dados, board |
| Densidade | 1 ideia por slide, texto minimo | data-dense, action titles, exhibits |
| Visual | tipografia gigante, cor de marca, respiro | charts, matrizes, KPIs, source lines |
| Dados | narrativo — KPI NAO obrigatorio | numerico — source line obrigatoria |
| Formato | `.html` standalone (full-screen, navegavel) | `.pptx` + `.pdf` |
| Publico | colaboradores, evento, town hall | N1/CEO/investidor/board |

Na duvida entre os dois: se o pedido tem **numeros/decisao/board** → `executive`.
Se tem **cultura/pessoas/inspiracao/manifesto** → `soap`.

### ⚠️ Regra anti-fabricacao (CRITICA — inegociavel)

> Incidente 2026-05-26: deck "Modo Raiz" foi gerado como pitch institucional
> generico com KPIs INVENTADOS (73% engajamento, 9K alunos, 94% score, 335K
> leads, "5 novos mercados"). Conteudo, publico e dados errados. Corrigido
> reescrevendo com o roteiro real do usuario, zero numeros fabricados.

1. Usar o CONTEUDO FORNECIDO pelo usuario fielmente. Roteiro dado = seguir.
2. **NUNCA inventar** KPIs, percentuais, metricas, nomes de produto ou marcos.
   Deck de cultura nao precisa de numero.
3. Se houver dado, vem do usuario ou de fonte real (data-engine) — jamais chutado.
4. Faltou conteudo? **Perguntar** — nao preencher com pitch generico.

### Principios SOAP

- 1 mensagem por slide. A headline ocupa o slide.
- Texto minimo. Sem paragrafos longos; bullets curtos quando preciso.
- Contraste forte: fundos solidos (dark/navy/orange/teal), tipografia weight 900.
- Ritmo: alternar slides de IMPACTO (`slide--section`, statement centrado) com
  slides de CONTEUDO (lista/pills/transformacoes/passos).
- Marca: tokens rAIz, logo oficial SVG embutido, laranja em pontos-chave (nao decorativo).
- Maximo ~15 slides salvo pedido explicito.

### Template canonical (NAO gerar do zero)

`lib/templates/soap_deck.html` — copiar e preencher. Ja inclui:
- Framework CSS: temas `slide--{dark,navy,orange,teal}` + `slide--section`
- Componentes: `.statements`, `.list-clean`, `.list-no`, `.transforms`, `.steps`,
  `.pill-grid`, `.quote`, `.highlight-box`, `.grid-2`/`.card`, `.accent-line`, `.kicker`
- Logo oficial Raiz como `<symbol id="raiz-logo">` (de `assets/logos/raiz-educacao-logo.svg`)
- Navegacao: teclado (←→, espaco, Home/End) + clique lateral + swipe + progress + counter automatico
- `@media print` → export PDF com 1 slide por pagina

O template tem cabecalho-comentario com a lista completa de componentes e o
bloco de verificacao headless. Trocar de marca = trocar `<symbol>` + tokens `--raiz-*`.

### Pipeline SOAP (4 passos)

1. **CONTEUDO** — coletar/estruturar a narrativa do usuario. Nunca inventar (ver regra acima).
2. **ESTRUTURA** — mapear em <=15 slides, alternando impacto x conteudo; tema por slide.
3. **RENDER** — `cp lib/templates/soap_deck.html $PROJECT_ROOT/docs/reports/<slug>.html`,
   substituir os `<div class="slide">` pelo conteudo real (manter `<style>`/`<symbol>`/`<script>`).
4. **VERIFY** — renderizar 3-5 slides representativos via Chrome headless, Read multimodal,
   conferir logo/contraste/overflow/ortografia. Loop ate limpo.

### Verificacao headless (sem Playwright MCP)

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
DECK="$PROJECT_ROOT/docs/reports/<slug>.html"

# Screenshot do slide N (troca init goTo(1)->goTo(N) numa copia temp):
perl -0pe 's/\n    goTo\(1\);\n  \}\)\(\);/\n    goTo(N);\n  })();/' "$DECK" > /tmp/s.html
"$CHROME" --headless=new --force-device-scale-factor=2 --window-size=1600,900 \
  --screenshot=/tmp/sN.png "file:///tmp/s.html"   # depois: Read /tmp/sN.png (multimodal)

# Export PDF (1 slide por pagina, via @media print):
"$CHROME" --headless=new --print-to-pdf="$PROJECT_ROOT/docs/reports/<slug>.pdf" \
  --no-pdf-header-footer "file://$DECK"
```

### Output

`$PROJECT_ROOT/docs/reports/<slug>.html` (ou `~/Claude/docs/workspace/<slug>.html`
com `--workspace-doc` para conteudo cross-project como comunicados corporativos).

## Exemplos de Uso

```bash
# Modo executive (pipeline 7-fase obrigatorio — PPTX data-dense para board)
/ag-5-documentos executive deck cybersec inspira 2025-2027 --brand=inspira
/ag-5-documentos executive pitch deck investidores rAIz  # default = raiz tokens
/ag-5-documentos executive --draft board pre-mortem      # bypass rapido

# Modo soap (HTML narrativo de alto impacto — cultura/motivacional/institucional)
/ag-5-documentos soap apresentacao "Modo Raiz" cultura de trabalho
/ag-5-documentos soap manifesto institucional rAIz para town hall
/ag-5-documentos soap kickoff 2026 --workspace-doc

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

### Regras R1-R8

Detalhe completo em `skills/pptx/SKILL.md` (seção "REGRAS OBRIGATORIAS Anti-Overflow"). Caminho do helper:
```python
import sys; sys.path.insert(0, "/Users/andregusmandeoliveira/Claude/.claude/skills/pptx/templates")
from pptx_utils import LIGHT_THEME, add_text_safe, verify_deck, render_deck_to_pngs
```

---

## PDF — REGRAS OBRIGATORIAS (Anti-Overflow)

Detalhe completo em `skills/pdf/SKILL.md`. Resumo: R1 `Paragraph()` em toda célula (nunca `drawString`), R2 `splitLongWords=0` + hífen ASCII (nunca `\u2011`), R3 KPI badges via `Table`, R4 larguras proporcionais, R5 verificação pós-geração via `pdftotext`, R6 usar template `professional_report.py`.

Template Python completo (ReportBuilder): Read `~/Claude/.claude/shared/patterns/ag5-exhibits.md` (Seção E). Quando NAO usar o template: PDFs técnicos sem design, watermark/merge/split, HTML-to-PDF. Mesmo fora do template, **R1-R5 continuam obrigatorias**.

## Padrao Executive — referencia canonical (PR 5.3)

Artefatos canonicos finalizados em PR 5.3: prompt McKinsey-grade, 17 validators (5 bloqueantes: pyramid, action title, anatomia 4 elementos, WCAG, label wrap, overlap), 19 exhibit types, 18 chart types, 6 storylines, 7 testes final_acceptance (bloqueio se <6/7), 3 configs YAML.

> Tabelas completas (validators, exhibits, charts, storylines, configs, anti-patterns): Read `~/Claude/.claude/shared/patterns/ag5-exhibits.md` (Seção C)
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

## External Invocation (CLI)

A skill expoe `cli.py` para invocacao programatica externa (Node subprocess,
HTTP service, n8n, scripts). Util quando consumidores fora do Claude Code
precisam gerar/auditar decks (ex: raiz-platform `presentation-bridge.service.ts`
em Phase 2b).

### Comandos

```bash
SKILL=~/Claude/.claude/skills/ag-5-documentos

# Build deck a partir de briefing YAML/JSON
python "$SKILL/cli.py" build \
  --briefing briefing.yaml \
  --output deck.pptx \
  --output-json response.json \
  --no-llm

# Build com gate: exit 2 se audit detectar blocking findings
python "$SKILL/cli.py" build \
  --briefing briefing.json \
  --output deck.pptx \
  --fail-on-blocking \
  --no-llm

# Build via stdin (briefing JSON direto)
echo '{"titulo":"X","outline":[...]}' | python "$SKILL/cli.py" build \
  --output deck.pptx --no-llm

# Audit deck existente (sem regerar)
python "$SKILL/cli.py" audit \
  --pptx existing.pptx \
  --output-json audit.json

# Validate briefing (dry-run, sem gerar arquivo)
python "$SKILL/cli.py" validate --briefing briefing.yaml
```

### Exit codes (consistente com Node bridge)

| Code | Significado |
|------|-------------|
| 0 | Sucesso |
| 1 | Erro de input (briefing invalido, file not found, JSON/YAML quebrado) |
| 2 | Falha de validacao (deck gerado mas com blocking findings + `--fail-on-blocking`) |
| 3 | Erro interno (exception nao tratada) |

### Briefing minimo aceito por `build`

```json
{
  "titulo": "Crescimento 2026",
  "marca": "raiz",
  "outline": [
    {"kind": "section_divider", "title": "Introducao"},
    {"kind": "hero_number", "title": "Receita +30% YoY",
     "content": {"value": "30%", "label": "YoY"}},
    {"kind": "bullet_list", "title": "Proximos passos",
     "bullets": ["Validar", "Implementar", "Monitorar"]}
  ]
}
```

Para briefings completos no schema Pydantic strict (`Briefing` em
`lib/briefing_schema.py`), os campos `pergunta_principal`, `mensagem_central`,
`audience`, `format`, `tom` etc. tambem sao aceitos pelo subcomando
`validate` (que retorna `schema_strict: true`).

### Flags relevantes

- `--no-llm` — pula validators LLM (regex fallback only). Ideal para CI / Node
  bridge sem acesso a `ANTHROPIC_API_KEY`.
- `--fail-on-blocking` — propaga blocking findings como exit 2 (build/audit).
- `--storyline KIND` — override do storyline_kind do briefing.

### Integracao em Node (exemplo simplificado)

```ts
import { spawn } from "node:child_process";

const child = spawn("python3", [
  `${SKILL_PATH}/cli.py`, "build",
  "--briefing", briefingPath,
  "--output", outPath,
  "--output-json", responsePath,
  "--no-llm",
  "--fail-on-blocking",
]);

child.on("close", (code) => {
  if (code === 0) /* OK */;
  else if (code === 2) /* blocking findings */;
  else /* erro */;
});
```

Implementacao da bridge: ver Phase 2b (raiz-platform).

## Regra PDF → Markdown (obrigatoria — economia de tokens)

Qualquer PDF consumido por esta machine DEVE ser convertido ANTES via markitdown:
`bash ~/Claude/.claude/scripts/pdf2md.sh <arquivo.pdf>` → Read/Grep no `.md` gerado (cache automatico).
NUNCA Read direto de `.pdf` para extrair texto. Excecao visual (layout/slides): converter primeiro, Read multimodal depois. Enforcement: hook `pdf-read-guard.sh`. Detalhes: `.claude/rules/pdf-markitdown.md`.
