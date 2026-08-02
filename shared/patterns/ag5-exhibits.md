# ag-5-documentos — Exhibits, Validators e Referência Técnica Executive

> Extraído de `skills/ag-5-documentos/SKILL.md` para reduzir tokens carregados por invocação.
> Conteúdo VERBATIM — não alterar sem sincronizar com a skill.

---

## Seção A — Bibliotecas de Exhibits (`lib/exhibits/`) — P1.1 + P1.6 refactors

11 builders canonicos, cada um com `render(slide, spec, brand)`:

| Kind | Quando usar |
|---|---|
| `hero_number` | Numero gigante + caption HARD LIMIT 12 palavras (P1.6d) |
| `matrix_2x2` | Classificacao 2 dimensoes (4 quadrantes) |
| `timeline_horizontal` | Marcos sequenciais |
| `bar_chart_comparison` | Comparacao 2-5 segmentos |
| `stack_hierarchy` | N camadas + emphasis_index opcional (P1.6e) |
| `before_after_arrow` | 2 estados com seta dominante |
| `risk_heatmap` | Risco x impacto (5x5 ou 3x3) |
| `quote_slide` | Citacao editorial |
| `decision_slide` | Pergunta + 2-3 opcoes com trade-offs |
| `process_flow` | Etapas com setas |
| `section_divider` | Divisor entre blocos com variant `with_preview` (P1.6a) |

**Refactors P1.6 (2026-04-25):**

| Refactor | Detalhe |
|----------|---------|
| P1.6a `section_divider` | Variante `with_preview` — 3-4 mini-cards prévia do conteudo |
| P1.6b `closing_slide` | 1 frase + 1 visual. Rejeita >2 frases via `_validate_text_budget()` |
| P1.6c `cover_slide` | `logo_path` OBRIGATORIO. Rejeita sem logo via `_validate_logo()` |
| P1.6d `hero_number` | Caption HARD LIMIT 12 palavras + 1 frase. Excess vai para `_overflow_to_takeaway` |
| P1.6e `stack_hierarchy` | Param `emphasis_index` — destaca camada arbitraria (resolve "Generativa > Agentica") |

Uso via `RENDER_REGISTRY`:
```python
from lib.exhibits import RENDER_REGISTRY, EXAMPLE_INPUTS

for item in pipe.outline:
    viz = item['viz']
    render_fn = RENDER_REGISTRY[viz.kind]
    render_fn(slide, item.get('viz_data', EXAMPLE_INPUTS[viz.kind]), brand=brand)
```

---

## Seção B — Brand Semantics (P1.7) — `palette_overrides/raiz.py`

Tres tiers para uso disciplinado da paleta (evitar laranja-decorativo):

| Tier | Token raiz | Uso recomendado |
|------|-----------|-----------------|
| `accent_strong` | `#F7941D` (RAIZ_ORANGE) | Capa, hero side-bars, divisores criticos |
| `accent_moderate` | `#5BB5A2` (RAIZ_TEAL) | Takeaway bars, dividers, accents secundarios |
| `accent_neutral` | `#1E2433` (SIDEBAR) | Body backgrounds, navy escuro |

```python
from lib.palette_overrides.raiz import (
    ACCENT_STRONG, ACCENT_MODERATE, ACCENT_NEUTRAL,
    tier_color, tier_for_exhibit,
)

brand = get_brand("raiz")
brand.accent_strong    # "#F7941D"
brand.accent_moderate  # "#5BB5A2"
brand.accent_neutral   # "#1E2433"

tier_for_exhibit("takeaway_bar")    # "moderate"
tier_for_exhibit("cover_slide")      # "strong"
tier_color("strong")                  # "#F7941D"
```

---

## Seção C — Padrao Executive Canonical (PR 5.3)

### Prompt base canonical (modo executive — secao 34 do guia)

> **Voce e consultor McKinsey-grade.** Receba o briefing e produza um deck
> que seja: (1) Pyramid-coerente top-down, (2) MECE entre secoes,
> (3) com action title quantificado em 100% dos slides,
> (4) viz nao-textual em >= 50% dos slides,
> (5) source line em todo slide com dado,
> (6) anatomia 4 elementos canonical em todos os slides de conteudo,
> (7) cores 70/20/10 disciplinadas, tipografia Montserrat 14-16pt body,
> (8) cover + executive summary auto-gerado + closing com CTA explicito.
> Bloquear entrega se final_acceptance < 6/7 testes passando.

### Tabela de validators

| Validator | Modulo | Severidade | Bloqueante |
|-----------|--------|------------|------------|
| Pyramid Principle | `pyramid_validator.validate_pyramid_coherence` | high | sim |
| MECE entre secoes | `mece_validator` | medium | warning |
| Action title formula | `audit.validate_action_title` | high | sim |
| Anatomia 4 elementos | `anatomy_validator` | high | sim |
| One message per slide | `one_message_validator.detect_multi_message` | medium | warning |
| Bullet quality | `bullet_validator` | medium | warning |
| Lang executiva | `lang_validator.detect_weak_language` | medium | warning |
| Spacing/margens | `spacing_audit` | medium | warning |
| Cores 70/20/10 | `color_proportion_validator.audit_slide_color_proportion` | medium | warning |
| Strategic bold <30% | `color_proportion_validator.audit_strategic_bold` | low | warning |
| WCAG AA contrast | `audit.check_text_contrast` | high | sim |
| Source line categorical | `audit.check_source_line_for_categorical` | medium | warning |
| Layout repetition | `audit.detect_layout_repetition_from_kinds` | medium | warning |
| Arbitrary label wrap | `audit.detect_arbitrary_label_wrap` | high | sim |
| Intra-slide overlap | `audit.detect_intra_slide_overlap` | high | sim |
| Chart V01-V13 | `chart_validator.ChartSpecValidator` | varia | parcial |
| Chart anti-patterns AP01-AP08 | `chart_validator.ChartAntiPatternDetector` | varia | warning |
| Final acceptance (7 testes) | `final_acceptance.run_final_acceptance` | high | sim (>=6/7) |

### Tabela de exhibits canonical (19 tipos)

`matrix_2x2`, `matrix_3x3`, `timeline_horizontal`, `timeline_vertical`,
`process_flow`, `quadrant`, `waterfall`, `pyramid`, `stack_bar`, `bullet_list`,
`kpi_row`, `table`, `callout`, `one_pager`, `histogram`, `funnel`,
`driver_tree`, `raci_matrix`, `exec_summary`.

Ver detalhes em `lib/configs/slide_template.yaml`.

### Tabela de chart types canonical (18 tipos)

`bar_horizontal`, `bar_vertical`, `bar_stacked`, `bar_grouped`, `line`,
`line_multi`, `area`, `area_stacked`, `pie`, `donut`, `waterfall`, `bullet`,
`heatmap`, `scatter`, `bubble`, `histogram`, `sparkline`, `combo`.

Modulo `lib/charts/` IMPLEMENTADO (SPEC chart-CEO PR-A...PR-F mergeado em
2026-04-26). 18 chart types em `CHART_REGISTRY` (paralelo a `RENDER_REGISTRY`):
bar/grouped_bar, line/area, donut/pie, waterfall, bullet, infographic,
stacked_bar/stacked100_bar, combo, scatter, heatmap, treemap, driver_tree,
slope. Implementacao: matplotlib Agg + python-pptx via `embed_chart_in_slide`.
Validacao: V01-V13 (`ChartSpecValidator`) + AP01-AP08 (`ChartAntiPatternDetector`)
integrados ao `audit_deck(chart_specs=...)`. Pipeline integration:
`viz_spec_to_chart_spec()` + `compute_chart_region()`. Insight LLM auto via
`ChartInsightGenerator` com cache TTL 7d e fallback regex.

### Tabela de storylines canonical (6 templates)

| ID | Nome | Blocos |
|----|------|--------|
| scqa | SCQA McKinsey | situation -> complication -> question -> answer |
| problem_solution | Problema -> Solucao | problem -> root_cause -> solution -> impact |
| recommendation_first | Pyramid: recomendacao primeiro | recommendation -> evidencia 1/2/3 |
| before_after | Antes vs Depois | before -> gap -> intervention -> after |
| chronological | Cronologico | past -> present -> future -> decision |
| comparative | Comparativo | option_a -> option_b -> criteria -> recommendation |

Detalhes em `lib/storyline_templates.py` + `lib/configs/slide_template.yaml`.

### Padrao de resposta YAML

Os modos `criar` e `revisar` emitem resposta YAML estruturada via `lib/response_schema.py`:
- `emit_criar(payload)` -> YAML com deck_metadata, storyline_aplicado, outline, chart_specs, validators_aplicados, final_acceptance_score, audit_warnings
- `emit_revisar(payload)` -> YAML com deck_path, num_slides, issues_blocking, issues_warning, chart_audit, sugestoes_correcao, score_geral

### Anti-patterns detectados (32 anti-padroes em 26 detectors)

- `audit.detect_anti_patterns()` — detectors slide-level (AP-09 titulo generico, AP-10 bullet >2 linhas, AP-11 paralelismo, AP-18 capitalization, AP-20 titulo >14 palavras, bullet >18 palavras legacy)
- `chart_validator.ChartAntiPatternDetector` — chart-specific (AP01-AP08)
- `audit.audit_deck_full()` — output unificado para o modo `revisar` (slide_checklist + deck_checklist + anti_patterns + score_geral)

### Final acceptance (7 testes obrigatorios)

`lib/final_acceptance.py::run_final_acceptance` executa 7 testes da secao 36 do guia mestre. Bloqueio formal se `tests_passed < 6/7`. Componentes:

1. Decision clarity (existe recomendacao explicita)
2. Audience match (tom alinhado com audience)
3. Storyline coherence (5-9 blocos sem buracos)
4. Pyramid principle deck-level
5. Briefing match (deck cobre todos os topicos do briefing)
6. Visual ratio >= 30%
7. Source presence em slides com dado

### Configs canonicals YAML (PR 5.3)

| Arquivo | Conteudo |
|---------|----------|
| `lib/configs/visual_style.yaml` | Tipografia, cores 70/20/10, spacing, paletas chart |
| `lib/configs/slide_template.yaml` | 6 canonical slides + 19 exhibits + 18 charts + 6 storylines |
| `lib/configs/principles.yaml` | 22 regras canonical + hierarchy_4_levels (decisao/storyline/slide/design) |

---

## Seção D — Tipografia Canonical (guia mestre 16.2-16.3, migrado 2026-04-25)

Escala em pontos para uso em PPTX. Valores em `lib/raiz_tokens.FONT_SIZE`.

| Token | Tamanho (pt) | Uso |
|-------|--------------|-----|
| `kicker` | 9 | Section kicker (cabecalho do chrome) |
| `caption` | 9 | Captions, source lines, footer |
| `body_sm` | 12 | Body compact (cards densos) |
| `body` | **14** | Body padrao em slides (guia 14-16) |
| `subtitle` | **16** | Subtitulo abaixo do action title (guia 14-18) |
| `takeaway` | **14** | Takeaway bar |
| `label` | **14** | Labels destacados em cards |
| `h3` | **16** | Titulos de cards/quadrantes |
| `h2` | **20** | Titulos secundarios |
| `h1` | **28** | Action title (guia 26-30) |
| `section` | **36** | Titulo de secao em divisor (guia 32-44) — NOVO |
| `hero` | **40** | KPIs medios (guia 32-56) |
| `hero_xl` | **56** | KPIs grandes em capa |
| `table` | **11** | Texto em tabela (guia 9-12) — NOVO |

Escape hatch para tamanho legacy (pre-2026-04-25):
```python
from lib.raiz_tokens import FONT_SIZE, FONT_SIZE_LEGACY
size_now = FONT_SIZE["body"]            # 14 (Montserrat era)
size_old = FONT_SIZE_LEGACY["body"]     # 11 (IBM Plex Sans era — escape hatch)
```

---

## Seção E — PDF Template Python (ReportBuilder)

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
