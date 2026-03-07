# D13 - Diagnostico Cruzado: Documentacao & Knowledge Base

> **Data:** 2026-03-01
> **Escopo:** Comparacao da qualidade e gestao de documentacao entre raiz-platform e rAIz-AI-Prof
> **Versao:** 1.0

---

## Sumario Executivo

Este diagnostico compara a documentacao de dois projetos TypeScript do ecossistema rAIz:

| Dimensao | raiz-platform | rAIz-AI-Prof |
|----------|---------------|--------------|
| **Framework** | Next.js 14 (App Router) | Vite 7 (SPA React 19) |
| **Arquivos .md na raiz** | 17 | 50 |
| **Arquivos .md em docs/** | 108 | 212 |
| **ADRs** | 6 | 10 (6 numerados + 4 legacy) |
| **Sprints documentados** | 26 | 23 |
| **Arquivos fonte TS/TSX** | 3.962 | 2.483 |
| **Arquivos com JSDoc** | 3.202 (80.8%) | 1.841 (74.1%) |
| **Blocos JSDoc totais** | 16.480 | 12.888 |

**Conclusao geral:** rAIz-AI-Prof possui documentacao mais madura e bem organizada, com hierarquia clara (docs/core/, docs/guides/, docs/setup/), indice de documentacao, e governanca explicita de "documentos soberanos". raiz-platform tem volume massivo de documentacao tecnica detalhada (ESPECIFICACOES_*.md), mas sofre de fragmentacao e falta de indice centralizado.

---

## 1. README — Qualidade e Completude

### Comparacao Lado a Lado

| Criterio | raiz-platform | rAIz-AI-Prof |
|----------|:---:|:---:|
| **Existe na raiz** | NAO | SIM (506 linhas) |
| **Descricao do projeto** | -- | Completa, com badges |
| **Instrucoes de instalacao** | -- | Detalhadas (4 passos) |
| **Scripts disponiveis** | -- | Listados com descricao |
| **Estrutura de pastas** | -- | Diagrama com explicacao |
| **Stack tecnologica** | -- | Tabela completa |
| **Contribuicao** | -- | Secao com checklist de PR |
| **Status do projeto** | -- | Barra visual + fases |
| **Roadmap inline** | -- | Fases futuras listadas |
| **Licenca** | -- | MIT referenciada |
| **Contato** | -- | Issues, Discussions, Email |
| **Links para docs** | -- | 6 documentos core linkados |

### Diagnostico

- **raiz-platform:** Nao possui README.md na raiz. Isto e uma lacuna critica. O ponto de entrada para qualquer desenvolvedor novo e inexistente. A informacao esta dispersa entre CLAUDE.md, TECHNICAL_ARCHITECTURE.md, e docs/DEV-WORKFLOW.md.

- **rAIz-AI-Prof:** README exemplar. Inclui badges de versao, secoes de instalacao, uso, arquitetura, contribuicao, status, e roadmap. Segue boas praticas de projetos open-source. Unico ponto fraco: links de contato usam placeholder (`seu-usuario`).

---

## 2. Documentacao de Arquitetura

### Comparacao Lado a Lado

| Criterio | raiz-platform | rAIz-AI-Prof |
|----------|:---:|:---:|
| **Arquivo principal** | `TECHNICAL_ARCHITECTURE.md` (2.150 linhas) | `docs/core/ARCHITECTURE.md` (1.314 linhas) |
| **Localizacao** | Raiz do projeto | docs/core/ (hierarquia organizada) |
| **Diagramas** | ASCII art detalhados | Mermaid (renderizavel) |
| **Fluxos documentados** | Mensagem, SSE, streaming, tools | Arquitetura geral, DDD, lazy loading |
| **Stack documentada** | Sim (texto inline) | Sim (tabela com versoes) |
| **Principios arquiteturais** | Implicitamente | 7 principios explicitos |
| **Versao/data** | v1.0, Jan 2026 | v2.7, Jan 2026 |
| **Docs complementares** | ESPECIFICACOES_API.md (1.436 linhas), ESPECIFICACOES_BANCO_DADOS.md (2.143), ESPECIFICACOES_COMPONENTES.md (2.014), ESPECIFICACOES_AUTENTICACAO.md (1.653) | ARCHITECTURE_IMPROVEMENTS.md, components/ARCHITECTURE.md |

### Diagnostico

- **raiz-platform:** Documentacao de arquitetura massiva e extremamente detalhada (2.150 linhas + 7.246 linhas em ESPECIFICACOES_*.md = ~9.400 linhas totais). Diagramas ASCII art detalhados para fluxos de mensagem, SSE, e componentes. Porem, esta toda na raiz, misturada com outros arquivos, dificultando navegacao.

- **rAIz-AI-Prof:** Documentacao mais concisa mas melhor estruturada. Usa Mermaid para diagramas renderizaveis. Versao 2.7 indica manutencao ativa. Localizada em docs/core/ com hierarquia clara. Menos profundidade em subsistemas especificos.

---

## 3. ADRs (Architecture Decision Records)

### raiz-platform — 6 ADRs

| ADR | Titulo | Foco |
|-----|--------|------|
| ADR-001 | Webpack SSRF Vulnerability Mitigation | Seguranca |
| ADR-002 | Vega Functions Vulnerability | Seguranca |
| ADR-003 | Grafana Cloud Observability | Observabilidade |
| ADR-004 | PostHog Product Analytics | Analytics |
| ADR-005 | OTel Logs Transport | Observabilidade |
| ADR-006 | Automated Observability Triage | Observabilidade |

### rAIz-AI-Prof — 10 ADRs (2 series)

**Serie principal (0001-0006):**

| ADR | Titulo | Foco |
|-----|--------|------|
| 0000 | Template | Meta |
| 0001 | Supabase como unico backend | Infra/Backend |
| 0002 | Multi-LLM Architecture | IA |
| 0003 | DDD com versionamento | Arquitetura |
| 0004 | Dual TSConfig | TypeScript |
| 0005 | Offline-First LocalStorage | Dados |
| 0006 | Lazy Loading Agressivo | Performance |

**Serie legacy (001-004):**

| ADR | Titulo | Foco |
|-----|--------|------|
| 001 | TanStack Query | State Management |
| 002 | Dexie IndexedDB | Storage |
| 003 | Radix UI | Componentes |
| 004 | Playwright E2E | Testes |

### Comparacao

| Criterio | raiz-platform | rAIz-AI-Prof |
|----------|:---:|:---:|
| **Quantidade** | 6 | 10 |
| **Template padrao** | Nao | Sim (0000-template.md) |
| **Cobertura tematica** | Focado em seguranca/observabilidade | Ampla (backend, IA, arch, TS, storage, perf, UI, testing) |
| **Decisoes fundamentais** | Nao documentadas | Documentadas (Supabase, DDD, Multi-LLM) |
| **Formato** | Status/Date/Deciders/Context/Decision/Evidence | Status/Context/Decision/Alternatives/Consequences |
| **Alternativas avaliadas** | Parcialmente | Tabela comparativa em cada ADR |

### Diagnostico

- **raiz-platform:** ADRs focados predominantemente em seguranca e observabilidade. Faltam ADRs para decisoes fundamentais (Next.js App Router, SQLite local, Claude como LLM primario, Supabase, arquitetura de workspaces). Formato bom mas sem template.

- **rAIz-AI-Prof:** ADRs cobrem decisoes fundamentais do projeto. Template padrao facilita novos ADRs. Duas series (numeracao inconsistente) indicam evolucao organica. Cada ADR inclui alternativas avaliadas com tabela comparativa — excelente pratica.

---

## 4. CLAUDE.md e Guias de Desenvolvimento

### Comparacao Lado a Lado

| Criterio | raiz-platform | rAIz-AI-Prof |
|----------|:---:|:---:|
| **CLAUDE.md raiz** | 464 linhas (detalhado) | 67 linhas (enxuto) |
| **CLAUDE.md sub-modulos** | 5 (api, agent, conversation, db, mcp) | 0 |
| **Conteudo** | Stack, comandos, CLI, padroes, SDD, roadmap, DB-first, seguranca | Stack, comandos, dual tsconfig, arquitetura, decisoes, roadmap |
| **Metodologia dev** | SDD (Spec Driven Development) documentado | DDD documentado |
| **Regras de seguranca** | 4 niveis de permissao, LGPD, audit logging | Mencionado em ARCHITECTURE.md |
| **Rules (.claude/rules/)** | 5 rules (agent-boundaries, commits, incremental, persistent-state, quality-gate) | Nao identificados |
| **Playbooks** | Referenciados (SDD, DB-First, Dev Paralelo) | Nao |
| **Guia Claude Code** | `docs/guia-claude-code.md` | -- |

### Diagnostico

- **raiz-platform:** CLAUDE.md extraordinariamente completo. Cobre stack, comandos, metodologia SDD, gestao de roadmap com ID convention, database-first, seguranca com 4 niveis. Complementado por 5 CLAUDE.md de sub-modulos e 5 rules em .claude/rules/. E efetivamente o "manual do desenvolvedor AI" mais completo.

- **rAIz-AI-Prof:** CLAUDE.md deliberadamente enxuto (67 linhas) apos reducao de 79% (era 321 linhas). Foca no essencial: stack, comandos, configs. Decisoes arquiteturais listadas sem detalhe (detalhe vive nos ADRs). Abordagem "menos e mais" funcional mas menos auto-contido.

---

## 5. Documentacao de Usuario/Admin

### Comparacao Lado a Lado

| Criterio | raiz-platform | rAIz-AI-Prof |
|----------|:---:|:---:|
| **Manual Admin** | `docs/MANUAL_ADMINISTRADOR.md` (609 linhas) | -- |
| **Manual Usuario** | -- | `docs/guides/MANUAL_USUARIO.md` (2.693 linhas) |
| **Manuais especializados** | MANUAL_ANALISES_PREVISOES, MANUAL_APIS_SERVICOS, MANUAL_BI_DASHBOARDS, MANUAL_RAG_EMBEDDINGS | BNCC_DUO_USER_GUIDE, DUO_SCHOOL_PLANNING_GUIDE |
| **Guia de Quick Start** | docs/DEV-WORKFLOW.md | docs/guides/QUICK_START.md |
| **Docs de sistema** | AUTOMATIONS_SYSTEM, CHAT_ROOMS_SYSTEM, JARVIS_SYSTEM, VIBECODING_PROGRAMS_SYSTEM | docs/ALUNO_UX_* (11 arquivos), docs/OMR_* (12 arquivos) |
| **Guia de deploy** | DEPLOY completo (Vercel) | docs/setup/DEPLOY_GUIDE.md, docs/DEPLOY_OPTIMIZATION.md |
| **Docs de ambiente** | .env.example (12.867 bytes), docs/SUPABASE_ENV_CONFIG.md | .env.example (1.495 bytes), docs/setup/ENV_SETUP_GUIDE.md |

### Diagnostico

- **raiz-platform:** Possui manual do administrador e manuais especializados por area (BI, RAG, APIs, Analises). Documentacao de sistemas internos bem detalhada. Falta manual do usuario final.

- **rAIz-AI-Prof:** Manual do usuario completo com 2.693 linhas, cobrindo todos os 12 modulos, funcionalidades avancadas, exportacao, e FAQ. Excelente documentacao de UX com 11 documentos dedicados ao Aluno UX. Falta manual de administrador.

---

## 6. Roadmaps e Backlogs

### Comparacao Lado a Lado

| Criterio | raiz-platform | rAIz-AI-Prof |
|----------|:---:|:---:|
| **Roadmap operacional** | `roadmap/roadmap.md` (atualizado 2026-03-01) | `roadmap/roadmap.md` (atualizado 2026-05-04) |
| **Backlog** | `roadmap/backlog.md` (priorizado P0-P3) | `roadmap/backlog.md` (priorizado P0-P3) |
| **Sprints** | 26 sprints (W12-W47) | 23 sprints (W09-W28+) |
| **Estrutura roadmap/** | roadmap.md, backlog.md, items/, reports/, specs/, sprints/, templates/ | roadmap.md, backlog.md, items/, reports/, specs/, sprints/, templates/ |
| **ID Convention** | MODULE-TYPE-NNN (CH-BUG-001) | MODULE-TYPE-NNN (QS-BUG-015) |
| **Lifecycle** | intake -> triage -> backlog -> sprint -> planning -> in-progress -> verification -> done | Identico |
| **Cadencia** | Sprint semanal | Sprint semanal |
| **Items resolvidos** | ~204 (W13-W47) | 100+ (W09-W18+) |
| **Roadmap estrategico** | No proprio roadmap.md (trimestral) | docs/core/MASTER_ROADMAP_OPPORTUNITIES.md |

### Diagnostico

- **Ambos projetos:** Compartilham estrutura identica de roadmap (mesmos templates, mesma hierarquia, mesma ID convention). Isto indica boa governanca de processo compartilhada. Ambos mantem roadmap e backlog atualizados com frequencia semanal.

- **raiz-platform:** Roadmap com mais items resolvidos (~204) e mais sprints ativos, refletindo o maior tamanho/complexidade do projeto.

- **rAIz-AI-Prof:** Possui separacao explicita entre roadmap operacional (`roadmap/roadmap.md`) e roadmap estrategico (`docs/core/MASTER_ROADMAP_OPPORTUNITIES.md`), o que e uma boa pratica.

---

## 7. Documentacao de API

### Comparacao Lado a Lado

| Criterio | raiz-platform | rAIz-AI-Prof |
|----------|:---:|:---:|
| **Doc de API** | ESPECIFICACOES_API.md (1.436 linhas) | -- |
| **TypeDoc configurado** | NAO | SIM (typedoc.json + typedoc-plugin-markdown) |
| **TypeDoc gerado** | -- | Diretorio docs/api/ (vazio — nao gerado) |
| **Swagger/OpenAPI** | NAO | NAO |
| **Referencia de endpoints** | 50+ rotas em src/app/api/CLAUDE.md | Serverless em api/ (sem doc dedicada) |
| **Patterns documentados** | Sim (middleware, Zod, rate limiting) | Nao |
| **API Registry** | `scripts/api-registry.ts` (671 APIs catalogadas) | -- |

### Diagnostico

- **raiz-platform:** Possui documentacao extensa de API (ESPECIFICACOES_API.md) com patterns de middleware, validacao Zod, rate limiting. Tambem possui um API Registry automatizado que catalogou 671 endpoints. Falta TypeDoc para documentacao automatica de tipos.

- **rAIz-AI-Prof:** TypeDoc esta configurado (typedoc.json) com plugin markdown, entry points para domains/lib/hooks, mas a saida (docs/api/) nao foi gerada. A infraestrutura esta pronta, falta executar e integrar no CI.

---

## 8. Documentacao Inline (JSDoc/TSDoc)

### Metricas

| Metrica | raiz-platform | rAIz-AI-Prof |
|---------|:---:|:---:|
| **Total arquivos TS/TSX** | 3.962 | 2.483 |
| **Arquivos com JSDoc** | 3.202 (80.8%) | 1.841 (74.1%) |
| **Blocos JSDoc totais** | 16.480 | 12.888 |
| **Media blocos/arquivo** | 4.2 | 5.2 |
| **Ratio JSDoc/arquivo com doc** | 5.1 | 7.0 |

### Diagnostico

- **raiz-platform:** Maior cobertura percentual de arquivos documentados (80.8%), resultado provavel de um codebase mais maduro com mais boilerplate documentado.

- **rAIz-AI-Prof:** Menor cobertura percentual (74.1%), mas maior densidade de documentacao nos arquivos que possuem JSDoc (7.0 blocos/arquivo vs 5.1). Indica documentacao mais profunda onde existe, mas mais lacunas.

---

## 9. CHANGELOG

### Comparacao Lado a Lado

| Criterio | raiz-platform | rAIz-AI-Prof |
|----------|:---:|:---:|
| **Arquivo** | NAO existe | `docs/core/CHANGELOG.md` (267 linhas) |
| **Formato** | -- | Semantic Versioning (1.0.0 -> 2.5.2) |
| **Cobertura temporal** | -- | Out 2025 a Jan 2026 |
| **Granularidade** | -- | Por versao com categorias (Modulos, Auth, i18n, UX, Infra) |
| **Links para migracao** | -- | Incluidos |
| **Convencoes de commit** | Documentadas em CLAUDE.md | Documentadas no CHANGELOG + README |

### Diagnostico

- **raiz-platform:** Nao possui CHANGELOG. O historico de mudancas esta implicitamente nos sprints (26 arquivos) e no roadmap, mas nao ha documento consolidado de versoes. Para um projeto enterprise, isto e uma lacuna significativa.

- **rAIz-AI-Prof:** CHANGELOG bem estruturado com versionamento semantico, 4 releases documentadas (1.0.0, 1.5.0, 2.0.0, 2.5.0-2.5.2). Cada release categoriza mudancas por tipo. Excelente pratica incluir guia de migracao entre versoes.

---

## 10. Guia de Contribuicao (CONTRIBUTING.md)

### Comparacao Lado a Lado

| Criterio | raiz-platform | rAIz-AI-Prof |
|----------|:---:|:---:|
| **Arquivo na raiz** | NAO | SIM (47 linhas, redirect) |
| **Arquivo completo** | NAO | `docs/setup/CONTRIBUTING.md` (completo) |
| **Codigo de Conduta** | NAO | Contributor Covenant |
| **Processo de PR** | Em CLAUDE.md (implicitamente) | Detalhado com checklist |
| **Padroes de commit** | Em CLAUDE.md | No README + CONTRIBUTING |
| **Report de bugs** | Template em .github/ | Template + guia |
| **Setup local** | docs/DEV-WORKFLOW.md | docs/setup/ (4 guias) |

### Diagnostico

- **raiz-platform:** Nao possui CONTRIBUTING.md. As instrucoes de contribuicao estao dispersas entre CLAUDE.md (padroes de commit, metodologia SDD) e docs/DEV-WORKFLOW.md (setup local). Para um projeto com multiple contributors, isto e uma lacuna.

- **rAIz-AI-Prof:** CONTRIBUTING.md na raiz redireciona para docs/setup/CONTRIBUTING.md completo. Inclui codigo de conduta, processo de fork/branch/PR, padroes de codigo, report de bugs, e feature requests. Setup dividido em 4 guias especializados (ENV, CI/CD, Testes, Deps).

---

## 11. Organizacao e Governanca Documental

### Comparacao Lado a Lado

| Criterio | raiz-platform | rAIz-AI-Prof |
|----------|:---:|:---:|
| **Hierarquia docs/** | Plana (108 arquivos sem subpastas consistentes) | Hierarquica (core/, guides/, setup/, adr/, migrations/, etc.) |
| **Indice de documentacao** | NAO | `DOCUMENTATION_INDEX.md` (130 linhas, 77 arquivos catalogados) |
| **Documentos soberanos** | NAO | Definidos em docs/core/README.md (6 documentos oficiais) |
| **Regras de soberania** | NAO | Explicitas ("um conceito = um documento", "sem duplicacao") |
| **Cleanup documentado** | NAO | DOCUMENTATION_CLEANUP_PLAN.md + DOCUMENTATION_CLEANUP_REPORT.md |
| **Poluicao na raiz** | Alta (17 .md na raiz incluindo ESPECIFICACOES_*, ARQUITETURA_ALVO, etc.) | Media-alta (50 .md na raiz, mas muitos sao historicos) |
| **Docs de sub-modulos** | CLAUDE.md em 5 sub-dirs | README.md em 6 sub-dirs (components, domain, lib) |

### Diagnostico

- **raiz-platform:** Documentacao abundante mas desorganizada. 17 arquivos .md na raiz misturando specs, guias, e artefatos de trabalho. A pasta docs/ tem 108 arquivos sem hierarquia clara. Nao ha indice nem governanca de documentacao. Muito conteudo valioso mas dificil de navegar.

- **rAIz-AI-Prof:** Governanca documental explicita e madura. Passou por processo de cleanup documentado (59 inventariados, 31 consolidados, 24 arquivados, -41% reducao). Hierarquia clara em docs/ com 6 subdiretorios tematicos. Documentos soberanos definidos como fonte unica de verdade. Indice completo de 77 arquivos.

---

## 12. Padroes Reutilizaveis Identificados

### Padroes do rAIz-AI-Prof que raiz-platform deveria adotar:

1. **Governanca de documentos soberanos** — docs/core/README.md define 6 documentos oficiais como fonte unica de verdade. Impede duplicacao e conflitos.

2. **DOCUMENTATION_INDEX.md** — Catalogo completo de toda documentacao com categorias. Ponto de entrada para devs novos.

3. **Template de ADR** (0000-template.md) — Padroniza formato e campos obrigatorios para novos ADRs.

4. **Hierarquia docs/ (core/guides/setup/adr/)** — Separacao por audiencia: core (arquitetura), guides (usuario/dev), setup (onboarding), adr (decisoes).

5. **CHANGELOG com semantic versioning** — Historico de mudancas consolidado facilita releases e comunicacao.

6. **TypeDoc configurado** — Geracao automatica de documentacao de API a partir de JSDoc.

### Padroes do raiz-platform que rAIz-AI-Prof deveria adotar:

1. **CLAUDE.md de sub-modulos** — 5 CLAUDE.md em subdiretorios criticos (api, agent, conversation, db, mcp) fornecem contexto local.

2. **Rules em .claude/rules/** — 5 regras formais (agent-boundaries, commits, incremental, persistent-state, quality-gate) que guiam agentes AI.

3. **ESPECIFICACOES_*.md detalhadas** — Specs profundas de API, banco, componentes, autenticacao. Nivel de detalhe enterprise.

4. **API Registry automatizado** — Script que cataloga 671 endpoints automaticamente.

5. **Metodologia SDD (Spec Driven Development)** — Fluxo obrigatorio PRD -> SPEC -> Execucao -> Review documentado no CLAUDE.md.

6. **Manual do Administrador** — Documentacao de operacao do sistema para administradores.

---

## 13. Tabela de Gaps Identificados

### raiz-platform

| # | Gap | Impacto | Dificuldade |
|---|-----|---------|-------------|
| G1 | Sem README.md na raiz | Critico — nenhum ponto de entrada para devs novos | Baixa |
| G2 | Sem CHANGELOG.md | Alto — sem historico consolidado de versoes | Media |
| G3 | Sem CONTRIBUTING.md | Alto — sem guia para contribuidores | Baixa |
| G4 | Sem indice de documentacao | Alto — 108 docs sem catalogo | Media |
| G5 | Sem hierarquia em docs/ | Medio — tudo flat, dificil navegar | Media |
| G6 | ADRs nao cobrem decisoes fundamentais | Medio — Next.js, Supabase, SQLite nao documentados | Media |
| G7 | Sem template de ADR | Baixo — dificulta novos ADRs | Baixa |
| G8 | Sem TypeDoc configurado | Medio — nao gera doc de API automaticamente | Baixa |
| G9 | Poluicao de .md na raiz | Medio — ESPECIFICACOES_* deveriam estar em docs/ | Media |
| G10 | Sem documento de governanca documental | Medio — sem regras de soberania | Baixa |
| G11 | Sem manual do usuario final | Medio — plataforma complexa sem guia de uso | Alta |

### rAIz-AI-Prof

| # | Gap | Impacto | Dificuldade |
|---|-----|---------|-------------|
| G12 | TypeDoc configurado mas nao gerado | Medio — infra pronta sem output | Baixa |
| G13 | Sem CLAUDE.md em sub-modulos | Baixo — contexto local ausente para agentes AI | Media |
| G14 | Sem manual de administrador | Medio — operacao do sistema nao documentada | Alta |
| G15 | Poluicao de .md na raiz (50 arquivos) | Medio — muitos historicos na raiz | Media |
| G16 | Numeracao inconsistente de ADRs (0001-0006 + 001-004) | Baixo — confusao potencial | Baixa |
| G17 | Sem API specs detalhadas (endpoints serverless) | Medio — api/ sem documentacao | Media |
| G18 | Sem rules em .claude/rules/ | Baixo — menos governanca para agentes AI | Baixa |
| G19 | Links placeholder no README (`seu-usuario`) | Baixo — links quebrados | Baixa |
| G20 | Storybook sem documentacao dedicada | Baixo — stories existem mas sem guia | Baixa |

---

## 14. Oportunidades Priorizadas

### P0 — Critico (fazer imediatamente)

| ID | Projeto | Acao | Esforco |
|----|---------|------|---------|
| **O1** | raiz-platform | Criar README.md na raiz com descricao, instalacao, stack, links | 2h |
| **O2** | raiz-platform | Criar CONTRIBUTING.md (pode copiar pattern do rAIz-AI-Prof) | 1h |
| **O3** | rAIz-AI-Prof | Executar `npx typedoc` e verificar output em docs/api/ | 30min |

### P1 — Alto (proximo sprint)

| ID | Projeto | Acao | Esforco |
|----|---------|------|---------|
| **O4** | raiz-platform | Criar CHANGELOG.md consolidando historico dos 26 sprints | 4h |
| **O5** | raiz-platform | Criar DOCUMENTATION_INDEX.md catalogando 108+ docs | 3h |
| **O6** | raiz-platform | Mover ESPECIFICACOES_*.md e outros .md da raiz para docs/ | 2h |
| **O7** | raiz-platform | Criar hierarquia em docs/ (core/, guides/, setup/, adr/) seguindo pattern rAIz-AI-Prof | 3h |
| **O8** | raiz-platform | Criar ADRs para decisoes fundamentais (Next.js App Router, Supabase, Claude AI primario, SQLite local) | 4h |
| **O9** | rAIz-AI-Prof | Unificar numeracao de ADRs (001-004 -> 0007-0010) | 1h |
| **O10** | rAIz-AI-Prof | Mover .md historicos da raiz para docs/archive/ | 2h |

### P2 — Medio (proximo mes)

| ID | Projeto | Acao | Esforco |
|----|---------|------|---------|
| **O11** | raiz-platform | Configurar TypeDoc com typedoc.json (copiar pattern do rAIz-AI-Prof) | 2h |
| **O12** | raiz-platform | Criar template de ADR (copiar 0000-template.md do rAIz-AI-Prof) | 30min |
| **O13** | raiz-platform | Criar docs/core/README.md com governanca de documentos soberanos | 2h |
| **O14** | rAIz-AI-Prof | Criar CLAUDE.md para sub-modulos criticos (domain/, lib/supabase/, api/) | 3h |
| **O15** | rAIz-AI-Prof | Documentar endpoints serverless em api/ | 4h |
| **O16** | rAIz-AI-Prof | Criar manual de administrador basico | 6h |
| **O17** | Ambos | Integrar TypeDoc no CI (gerar em cada PR) | 2h |

### P3 — Baixo (backlog)

| ID | Projeto | Acao | Esforco |
|----|---------|------|---------|
| **O18** | raiz-platform | Criar manual do usuario final | 8h |
| **O19** | rAIz-AI-Prof | Criar rules em .claude/rules/ (copiar patterns do raiz-platform) | 2h |
| **O20** | rAIz-AI-Prof | Corrigir links placeholder no README | 30min |
| **O21** | rAIz-AI-Prof | Criar guia de Storybook (como criar/manter stories) | 2h |
| **O22** | Ambos | Implementar validacao automatica de links em .md (lint-md) | 3h |
| **O23** | Ambos | Padronizar diagramas (Mermaid em ambos, eliminar ASCII art) | 4h |

---

## 15. Metricas de Maturidade Documental

### Escala: 0 (Inexistente) a 5 (Exemplar)

| Dimensao | raiz-platform | rAIz-AI-Prof | Delta |
|----------|:---:|:---:|:---:|
| README | 0 | 5 | -5 |
| Arquitetura | 4 | 4 | 0 |
| ADRs | 3 | 4 | -1 |
| CLAUDE.md / Dev Guide | 5 | 3 | +2 |
| Manual Usuario | 1 | 5 | -4 |
| Manual Admin | 4 | 0 | +4 |
| Roadmap / Backlog | 5 | 5 | 0 |
| API Documentation | 3 | 2 | +1 |
| JSDoc Inline | 4 | 3 | +1 |
| CHANGELOG | 0 | 4 | -4 |
| CONTRIBUTING | 0 | 4 | -4 |
| Organizacao / Governanca | 2 | 5 | -3 |
| **Media** | **2.6** | **3.7** | **-1.1** |

### Interpretacao

- **raiz-platform (2.6/5):** Pontos fortes em CLAUDE.md, manual admin, roadmap, e volume de documentacao tecnica. Pontos fracos criticos em README, CHANGELOG, CONTRIBUTING, e organizacao. O projeto possui documentacao **abundante mas desorganizada** — a informacao existe mas e dificil de encontrar e navegar.

- **rAIz-AI-Prof (3.7/5):** Documentacao **bem organizada e governada**. Pontos fortes em README, manual usuario, CHANGELOG, CONTRIBUTING, e organizacao. Pontos fracos em manual admin, API docs, e CLAUDE.md de sub-modulos. Menor volume total mas muito melhor navegabilidade.

---

## 16. Recomendacoes Consolidadas

### Para raiz-platform — Top 5 acoes de maior impacto:

1. **Criar README.md** (O1) — `D:/GitHub/raiz-platform/README.md`. Sintetizar informacao de CLAUDE.md + TECHNICAL_ARCHITECTURE.md. Modelo: `D:/GitHub/rAIz-AI-Prof/README.md`.

2. **Reorganizar docs/** (O7) — Criar `docs/core/`, `docs/guides/`, `docs/setup/`, `docs/specs/`. Mover ESPECIFICACOES_*.md para `docs/specs/`, manuais para `docs/guides/`.

3. **Criar CHANGELOG.md** (O4) — `D:/GitHub/raiz-platform/CHANGELOG.md`. Consolidar historico dos 26 sprints em formato semantic versioning.

4. **Criar CONTRIBUTING.md** (O2) — `D:/GitHub/raiz-platform/CONTRIBUTING.md`. Extrair de CLAUDE.md + docs/DEV-WORKFLOW.md.

5. **Criar DOCUMENTATION_INDEX.md** (O5) — `D:/GitHub/raiz-platform/docs/DOCUMENTATION_INDEX.md`. Catalogar 108+ documentos com categorias. Modelo: `D:/GitHub/rAIz-AI-Prof/DOCUMENTATION_INDEX.md`.

### Para rAIz-AI-Prof — Top 5 acoes de maior impacto:

1. **Gerar TypeDoc** (O3) — Executar `npx typedoc` para popular `docs/api/`. A configuracao em `D:/GitHub/rAIz-AI-Prof/typedoc.json` ja esta pronta.

2. **Limpar raiz** (O10) — Mover 50 .md historicos da raiz para `docs/archive/`. Manter apenas README.md, CLAUDE.md, CONTRIBUTING.md na raiz.

3. **Unificar ADRs** (O9) — Renumerar `001-004` para `0007-0010` em `D:/GitHub/rAIz-AI-Prof/docs/adr/`.

4. **Documentar API serverless** (O15) — Criar doc para endpoints em `D:/GitHub/rAIz-AI-Prof/api/`.

5. **Criar CLAUDE.md sub-modulos** (O14) — Adicionar em `D:/GitHub/rAIz-AI-Prof/domain/`, `D:/GitHub/rAIz-AI-Prof/lib/supabase/`, e `D:/GitHub/rAIz-AI-Prof/api/`.

---

## 17. Arquivos de Referencia

### raiz-platform — Documentacao principal

| Arquivo | Caminho | Linhas |
|---------|---------|--------|
| CLAUDE.md | `D:/GitHub/raiz-platform/CLAUDE.md` | 464 |
| TECHNICAL_ARCHITECTURE.md | `D:/GitHub/raiz-platform/TECHNICAL_ARCHITECTURE.md` | 2.150 |
| ESPECIFICACOES_API.md | `D:/GitHub/raiz-platform/ESPECIFICACOES_API.md` | 1.436 |
| ESPECIFICACOES_BANCO_DADOS.md | `D:/GitHub/raiz-platform/ESPECIFICACOES_BANCO_DADOS.md` | 2.143 |
| ESPECIFICACOES_COMPONENTES.md | `D:/GitHub/raiz-platform/ESPECIFICACOES_COMPONENTES.md` | 2.014 |
| ESPECIFICACOES_AUTENTICACAO.md | `D:/GitHub/raiz-platform/ESPECIFICACOES_AUTENTICACAO.md` | 1.653 |
| MANUAL_ADMINISTRADOR.md | `D:/GitHub/raiz-platform/docs/MANUAL_ADMINISTRADOR.md` | 609 |
| roadmap.md | `D:/GitHub/raiz-platform/roadmap/roadmap.md` | -- |
| backlog.md | `D:/GitHub/raiz-platform/roadmap/backlog.md` | -- |
| ADRs (6) | `D:/GitHub/raiz-platform/docs/adr/ADR-001..006` | -- |
| CLAUDE.md sub (5) | `D:/GitHub/raiz-platform/src/*/CLAUDE.md` | -- |

### rAIz-AI-Prof — Documentacao principal

| Arquivo | Caminho | Linhas |
|---------|---------|--------|
| README.md | `D:/GitHub/rAIz-AI-Prof/README.md` | 506 |
| CLAUDE.md | `D:/GitHub/rAIz-AI-Prof/CLAUDE.md` | 67 |
| CONTRIBUTING.md | `D:/GitHub/rAIz-AI-Prof/CONTRIBUTING.md` | 47 |
| ARCHITECTURE.md | `D:/GitHub/rAIz-AI-Prof/docs/core/ARCHITECTURE.md` | 1.314 |
| PRD.md | `D:/GitHub/rAIz-AI-Prof/docs/core/PRD.md` | 674 |
| PRODUCT_PLAYBOOK.md | `D:/GitHub/rAIz-AI-Prof/docs/core/PRODUCT_PLAYBOOK.md` | 839 |
| CHANGELOG.md | `D:/GitHub/rAIz-AI-Prof/docs/core/CHANGELOG.md` | 267 |
| MANUAL_USUARIO.md | `D:/GitHub/rAIz-AI-Prof/docs/guides/MANUAL_USUARIO.md` | 2.693 |
| DOCUMENTATION_INDEX.md | `D:/GitHub/rAIz-AI-Prof/DOCUMENTATION_INDEX.md` | 130 |
| typedoc.json | `D:/GitHub/rAIz-AI-Prof/typedoc.json` | 44 |
| roadmap.md | `D:/GitHub/rAIz-AI-Prof/roadmap/roadmap.md` | -- |
| backlog.md | `D:/GitHub/rAIz-AI-Prof/roadmap/backlog.md` | -- |
| ADRs (10) | `D:/GitHub/rAIz-AI-Prof/docs/adr/0001..0006 + 001..004` | -- |
| Docs soberanos README | `D:/GitHub/rAIz-AI-Prof/docs/core/README.md` | 48 |
