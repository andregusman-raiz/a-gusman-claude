---
description: "Guia rapido de decisao — qual machine ou agent usar para cada situacao"
paths:
  - "**/*"
---

# Agent Decision Guide — Quick Reference

## Eu quero... (use a MACHINE)

### Construir algo
- **Feature nova** → `/ag-1-construir feature X`
- **Resolver issue** → `/ag-1-construir issue #N`
- **Refatorar** → `/ag-1-construir refatorar X`
- **Otimizar performance** → `/ag-1-construir otimizar X`
- **UI/UX design + build** → `/ag-1-construir ui X`
- **Integrar sistema externo** → `/ag-1-construir integrar X`
- **Build + review concorrente** → `/ag-1-construir --validado X`

### Corrigir algo
- **1 bug** → `/ag-2-corrigir [descricao]`
- **Varios bugs** → `/ag-2-corrigir lista: [bugs]`
- **Erros TypeScript** → `/ag-2-corrigir tipos`
- **Tech debt** → `/ag-2-corrigir debt [area]`
- **So diagnosticar** → `/ag-2-corrigir --triage-only [area]`

### Entregar
- **Preview** → `/ag-3-entregar`
- **Producao** → `/ag-3-entregar producao`
- **Rollback** → `/ag-3-entregar rollback`

### Testar qualidade
- **QAT textual** → `/ag-4-teste-final qat [path]`
- **UX-QAT visual** → `/ag-4-teste-final ux-qat [url]`
- **Benchmark** → `/ag-4-teste-final benchmark [url]`
- **Ciclo test-fix-retest** → `/ag-4-teste-final ciclo [path]`
- **E2E completo** → `/ag-4-teste-final e2e [path]`

### Documentar
- **Docs projeto** → `/ag-5-documentos projeto [path]`
- **Slides/Office** → `/ag-5-documentos office [desc]`
- **Organizar arquivos** → `/ag-5-documentos organizar [path]`
- **Spell check** → `/ag-5-documentos ortografia [path]`

### Comecar algo novo
- **Projeto novo** → `/ag-6-iniciar projeto [desc]`
- **Setup ambiente** → `/ag-6-iniciar ambiente [path]`
- **Explorar codebase** → `/ag-6-iniciar explorar [path]`
- **Pesquisar alternativas** → `/ag-6-iniciar pesquisar [tema]`

### Validar / Auditar
- **QA completo autonomo (5D)** → `/ag-7-qualidade [url/path]`
- **Security + load + LGPD** → `/ag-8-seguranca [url/path]`
- **Laudo completo (5 machines)** → `/ag-9-auditar [url/path]`
- **Benchmark SaaS (crawl + SPEC)** → `/ag-10-benchmark-software [nome] [url]`
- **Design UI/UX (componentes, paletas, layouts)** → `/ag-11-ux-ui [action] [element]`---
- **Otimizar SQL / consultar dados (TOTVS RM / Zeev / PostgreSQL)** → `/ag-12-sql-totvs-zeev [query ou contexto]`
## Plugins (atalhos rapidos, sem pipeline)

| Sinal | Plugin |
|-------|--------|
| Review rapido < 10 arquivos | `/code-review` ou `/review-pr` |
| Commit rapido (sem branch-guard) | `/commit` ou `/commit-push-pr` |
| Feature self-contained | `/feature-dev` |
| Deploy rapido | `/deploy` |
| Limpar branches | `/clean_gone` |
| Erros em producao | `/seer` |
| Resumo Slack | `/summarize-channel`, `/standup` |
| Design Figma | `implement-design` |

---

## Agents individuais (power user)

Agents fora de machines, uteis para tarefas ad-hoc:

| Agent | Para que |
|-------|---------|
| ag-saude-sessao | Health check antes de comecar |
| ag-analisar-contexto | Tech debt, riscos arquiteturais |
| ag-testar-manual | QA exploratorio via Playwright |
| ag-migrar-dados | Database migrations |
| ag-criar-agente | Criar novos agents |
| ag-criar-skill | Criar/melhorar skills |
| ag-retrospectiva | Analise pos-sessao |
| ag-referencia-* | Carregar expertise (8 skills) |

---

## Regra de ouro

Na duvida: `/ag-0-orquestrador [o que quer fazer]` — ele classifica e roteia.
Plugin para acao rapida. Machine para pipeline com convergencia.
