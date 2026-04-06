---
name: ag-1-construir
description: "Maquina autonoma de construcao. Feature, refactor, UI, issue, integracao, otimizacao — recebe objetivo, entrega PR pronto. Padrao MERIDIAN: fases, convergencia, state, self-healing."
model: opus
context: fork
argument-hint: "[objetivo ou issue #N] [--resume] [--skip-review] [--audit-only]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TaskCreate, TaskUpdate, TaskList, TeamCreate, TeamDelete, SendMessage
metadata:
  filePattern: "construir-state.json"
  bashPattern: "construir"
  priority: 98
---

# CONSTRUIR — Maquina Autonoma de Construcao

## Invocacao

```
/construir adicionar autenticacao com Clerk           # Feature
/construir issue #42                                   # Issue pipeline
/construir refatorar extrair modulo de auth            # Refactor
/construir otimizar queries do dashboard               # Optimize
/construir ui redesign do dashboard                    # UI/UX
/construir integrar sistema SophiA                     # Incorporacao
/construir --resume                                    # Retomar run
/construir --audit-only adicionar feature X            # So SPEC, sem build
```

## O que faz

Executa construcao completa AUTONOMA em 9 fases:

```
ASSESS → PRD → SPEC → [ADVERSARIO] → ADR → PLAN → BUILD → VERIFY → REVIEW → SHIP
                                                    ↑        │
                                                    └────────┘  (convergencia: max 2 cycles)
```

1. **ASSESS**: Detecta modo (feature/issue/refactor/optimize/ui/integrate), size gate. **Consulta `/ag-referencia-stack-decisions`** para validar stack antes de prosseguir.
2. **PRD**: Cria documento de produto (skill prd-writer). Skip: Size S, refactor, optimize, `--skip-prd`, PRD ja existe
3. **SPEC**: Cria especificacao tecnica (ag-especificar-solucao internamente). Referencia PRD se existir. **Valida deps propostas contra stack aprovado.**
3.5. **ADVERSARIO**: Review adversarial da SPEC (ag-adversario). Busca falhas, suposicoes implicitas, edge cases nao cobertos. **Skip: Size S, refactor, optimize.** Se veredicto = REVISE → ag-especificar-solucao atualiza SPEC antes de prosseguir.
4. **ADR**: Registra decisoes arquiteturais (skill adr). Skip: Size S, SPEC sem decisoes tecnicas com 2+ alternativas. **Se dep fora do stack aprovado → ADR obrigatorio.**
5. **PLAN**: Cria plano de execucao (ag-planejar-execucao internamente, skip para Size S)
6. **BUILD**: Implementa (ag-implementar-codigo/B-10/B-11/B-52/I-35 conforme modo). **Antes de `npm install` qualquer dep nova → verificar stack-enforcement rule.**
7. **VERIFY**: Verifica completude vs SPEC + testes (ag-validar-execucao + ag-testar-codigo). Loop convergente.
8. **REVIEW**: Code review (ag-revisar-codigo, +ag-verificar-seguranca se 10+ arquivos, +ag-avaliar-ux-design-library se UI com app rodando)
9. **SHIP**: Branch + PR com referencia a PRD, SPEC e ADRs

### Fases por Size

| Size | Fases executadas |
|------|-----------------|
| S | ASSESS → SPEC minimal → BUILD → VERIFY → SHIP |
| M | ASSESS → PRD → SPEC → ADVERSARIO → PLAN → BUILD → VERIFY → REVIEW → SHIP (ADR se aplicavel) |
| L/XL | ASSESS → PRD → SPEC → ADVERSARIO → ADR → PLAN → BUILD → VERIFY → REVIEW → SHIP (ADR obrigatorio) |

## Modos (auto-detectados)

| Modo | Sinais | Agents/Skills internos |
|------|--------|----------------------|
| feature | default, "adicionar", "implementar" | prd-writer → ag-especificar-solucao → adr → ag-planejar-execucao → ag-implementar-codigo |
| issue | "issue #N", "ticket" | gh fetch → prd-writer → ag-especificar-solucao → adr → ag-planejar-execucao → ag-implementar-codigo |
| refactor | "refatorar", "renomear", "extrair" | ag-especificar-solucao minimal → ag-refatorar-codigo (sem PRD, sem ADR) |
| optimize | "otimizar", "performance", "lento" | ag-especificar-solucao minimal → ag-otimizar-codigo (sem PRD, sem ADR) |
| ui | "ui", "design", "tela", "layout" | prd-writer → ag-11-ux-ui → ag-planejar-execucao → ag-implementar-codigo |
| integrate | "integrar", "incorporar", "due diligence" | ag-avaliar-software → prd-writer → ag-mapear-integracao → adr → ag-planejar-incorporacao → ag-incorporar-modulo |

## Pre-Load: Design Library (OBRIGATORIO para qualquer feature)

A Design Library contem 3 niveis: Componentes UI, Modulos de Produto, e Produtos Replicaveis.
Consultar em TODAS as fases, nao apenas na hora de desenhar tela.

### Quando consultar (por fase)

| Fase ag-1 | O que buscar na library | Nivel relevante |
|-----------|------------------------|----------------|
| **PRD** | Modulo existente que resolve o problema? Produto replicavel como base? | Modulo, Produto |
| **SPEC** | Types/interfaces reutilizaveis? Fluxos de negocio ja resolvidos? State machines? | Modulo |
| **PLAN** | Componentes base disponiveis? Dependencias ja mapeadas? | UI, Modulo |
| **BUILD** | Tokens do design system, componentes TSX, CSS patterns | UI |
| **REVIEW** | Compliance com design system? (ag-avaliar-ux-design-library) | UI |

### Como consultar

1. **ANTES de PRD/SPEC**: Ler `~/Claude/assets/design-library/catalog.md` — verificar se existe solucao que resolve o problema
2. **Se Modulo existe** (ex: `contract-lifecycle`): Ler spec → extrair **Types TypeScript**, **fluxos de negocio**, **state machines**, **API contracts** para a SPEC do projeto
3. **Se Produto existe** (ex: `bi-data-explorer`): Avaliar se faz sentido fork/adaptar em vez de construir do zero
4. **Se Componente UI existe**: Copiar/adaptar TSX do `catalog/src/components/` em vez de criar do zero
5. **Na SPEC**: Referenciar explicitamente (`Baseado em: design-library/solutions/NN-id`) com adaptacoes
6. **Durante BUILD**: Usar tokens do Design System (`~/Claude/assets/UI_UX/raiz-educacao-design-system.md`)
7. **Se NAO existe solucao**: Documentar gap na SPEC para futura adicao ao catalogo

**Matching rapido (necessidade → solucao):**

| Preciso de... | Solution ID | Spec path |
|---------------|------------|-----------|
| KPIs/metricas | `dashboard-kpi` | `01-dashboard-kpi/spec.md` |
| Tabela com filtros | `table-filters-export` | `02-table-filters-export/spec.md` |
| Form dinamico | `forms-multistep` | `03-forms-multistep/spec.md` |
| Timeline/audit | `status-workflow-timeline` | `04-status-workflow-timeline/spec.md` |
| App shell/sidebar | `app-shell-sidebar` | `05-app-shell-sidebar/spec.md` |
| Workflow visual | `workflow-builder` | `06-workflow-builder/spec.md` |
| Chat AI | `chat-ai-streaming` | `07-chat-ai-streaming/spec.md` |
| PDF viewer | `pageflip-3d` | `08-pageflip-3d/spec.md` |
| Kanban | `dragdrop-virtual-scroll` | `11-dragdrop-virtual-scroll/spec.md` |
| Export doc | `document-generation` | `12-document-generation/spec.md` |
| RAG/KB | `rag-knowledge-base` | `13-rag-knowledge-base/spec.md` |
| BI/charts | `bi-data-explorer` | `15-bi-data-explorer/spec.md` |
| Contratos | `contract-lifecycle` | `17-contract-lifecycle/spec.md` |

---

## Pre-Load: TOTVS RM Knowledge Base

Quando o objetivo menciona TOTVS, RM, educacional, matricula, turma, aluno, professor, coligada, frequencia, nota, contrato, parcela, bolsa, disciplina, grade, habilitacao, ou qualquer tabela S*/G*/P*/F*:

1. **ANTES de SPEC**: Ler `~/Claude/assets/knowledge-base/totvs/generated/quick-reference.md` (mapa completo)
2. **Durante SPEC**: Buscar campos em `generated/all-fields-flat.json` (grep nome do campo)
3. **Durante BUILD**: Importar tipos de `generated/typescript-types.ts` (nunca criar interfaces manuais para tabelas TOTVS)
4. **Para queries SQL**: Consultar `sql-metadata/tables.json` (9950 tabelas, row count) + `docs/DOC-9` (armadilhas)
5. **Para SOAP calls**: Consultar `soap/dataservers-catalog.json` (29 DataServers com campos e operacoes)

## Propriedades MERIDIAN

- **Autonomo**: nao para para perguntar (exceto Size XL para aprovacao)
- **Convergente**: VERIFY ↔ BUILD loop ate spec 100% (max 2 cycles)
- **State persistente**: `construir-state.json` — resume de onde parou
- **Self-healing**: falha → alternativa → documenta → continua
- **Artifacts**: PRD, SPEC, ADRs, Plan, PR, testes

## Output

```
CONSTRUIR COMPLETO
  Modo: [feature/issue/...]
  Branch: [feat/...]
  PR: [url]
  PRD: [docs/specs/...-prd.md] (se gerado)
  SPEC: [docs/specs/...-spec.md]
  ADRs: [docs/adr/ADR-NNN-*.md] (se gerados)
  Plan: [docs/plan/task_plan.md] (se gerado)
  Ciclos: [N]
  Completude: [X/Y]
  Testes: [N pass]
```

## Quando usar

- "adicionar feature X" → /construir
- "resolver issue #42" → /construir issue #42
- "refatorar modulo Y" → /construir refatorar Y
- "dashboard esta lento" → /construir otimizar dashboard
- "redesign da tela Z" → /construir ui Z
- "integrar sistema W" → /construir integrar W
