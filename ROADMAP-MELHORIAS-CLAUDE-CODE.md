# Roadmap de Melhorias — Claude Code Setup
> Baseado na analise comparativa com melhores praticas mundiais (Feb 2026)
> 37 oportunidades identificadas, 12 dimensoes analisadas

---

## Legenda de Status

| Status | Significado |
|--------|-------------|
| EXECUTE | Pronto para implementar agora |
| ON HOLD (code) | Requer alteracao no codigo da plataforma — aguardando |
| ON HOLD (cost) | Relacionado a otimizacao de custo de tokens — aguardando |
| DONE | Implementado e verificado |

---

## DIM 1: CLAUDE.md — Eficiencia do Contexto

| # | Oportunidade | Status | Impacto |
|---|-------------|--------|---------|
| 1 | Podar CLAUDE.md do projeto rAIz para ~80 linhas (mover Estado Atual, Estrutura, Docs para @references) | DONE | ALTO — 3% context perdido/sessao |
| 2 | Mover convencoes de naming para rules/ (carregadas sob demanda, nao em toda sessao) | DONE | MEDIO |
| 3 | Eliminar duplicacao de Quality Gates (aparece em CLAUDE.md, rules/quality-gate.md, rules/incremental-commits.md) | DONE | MEDIO |
| 4 | Usar exemplo concreto (link para domain module exemplar) em vez de tabelas descritivas | DONE | BAIXO |

### Passo a Passo — Items 1-4:
1. Ler o CLAUDE.md do projeto alvo completo
2. Identificar secoes que Claude pode descobrir sozinho (Estrutura, Estado Atual, Docs)
3. Mover convencoes de naming para `D:/.claude/rules/naming-conventions.md`
4. Remover duplicacao de Quality Gates — manter apenas em `D:/.claude/rules/quality-gate.md`
5. Substituir tabela de "Sistema de Agentes" por referencia: `@.claude/skills/ag-M-00-orquestrar/SKILL.md`
6. Resultado: CLAUDE.md do projeto com ~80 linhas focadas em stack, comandos, e decisoes arquiteturais

---

## DIM 2: Hooks — Automacao Garantida

| # | Oportunidade | Status | Impacto |
|---|-------------|--------|---------|
| 5 | Otimizar dashboard-bridge (roda 4x por tool call — consolidar/async) | DONE | ALTO — ~800ms latencia/tool |
| 6 | TypeCheck incremental (checar apenas arquivos editados, nao tsc inteiro) | DONE | ALTO — 10-30s→<2s |
| 7 | Adicionar PostToolUse Prettier (auto-format imediato apos edits) | DONE | MEDIO |
| 8 | Adicionar PreToolUse security gate (bloquear rm -rf, git push --force, git reset --hard) | DONE | ALTO — seguranca |
| 9 | Stop hook com verificacao de completude (forcar continuacao se tasks incompletas) | DONE | MEDIO |

### Passo a Passo — Items 5-9:
1. **Item 5**: Editar `~/.claude/settings.json` — mover dashboard-bridge para apenas PostToolUse e Stop (remover Pre e Notification)
2. **Item 6**: Reescrever `~/.claude/hooks/typecheck-after-edit.sh` para checar apenas arquivos no `$CLAUDE_FILE_PATHS`
3. **Item 7**: Criar `D:/.claude/hooks/auto-format.sh` com Prettier + adicionar ao hooks.json
4. **Item 8**: Criar `D:/.claude/hooks/security-gate.sh` como PreToolUse para Bash
5. **Item 9**: Melhorar `D:/.claude/hooks/quality-check.sh` com exit code 2 quando tasks incompletas

---

## DIM 3: Testing Strategy

| # | Oportunidade | Status | Impacto |
|---|-------------|--------|---------|
| 10 | SDD→TDD pipeline: ag-07 gera specs → ag-13 testes da spec → ag-08 implementa | DONE | ALTO |
| 11 | TDD Guard hook — bloquear Write em *.ts se nao existe *.test.ts | DONE | ALTO |
| 12 | Comando de teste focado no CLAUDE.md: "Prefer npx vitest run path/to/test" | DONE | MEDIO |
| 13 | Test debt sprint plan — docs/plans/TEST-DEBT-SPRINT-PLAN.md | DONE | ALTO |
| 14 | Snapshot de metricas pos-commit | DONE | BAIXO |

### Passo a Passo — Item 12:
1. Adicionar regra ao `D:/CLAUDE.md` na secao Quality Gates
2. Texto: "Prefer single test execution: `npx vitest run path/to/test`, NOT `npm run test` (full suite)"

---

## DIM 4: Security Engineering

| # | Oportunidade | Status | Impacto |
|---|-------------|--------|---------|
| 15 | Adicionar deny rules em settings.local.json (.env*, ~/.ssh/**, **/secrets/**) | DONE | ALTO — seguranca |
| 16 | Plano de reducao de vulns — docs/plans/VULNERABILITY-REDUCTION-PLAN.md | DONE | ALTO |
| 17 | Supply chain rules (npm ci, lockfile, 7-day wait) | DONE | MEDIO |
| 18 | RLS indexes rule (indexar colunas usadas em policies) | DONE | MEDIO |
| 19 | Documentar /sandbox para sessoes autonomas | DONE | MEDIO |

### Passo a Passo — Items 15, 17-19:
1. **Item 15**: Editar `D:/.claude/settings.local.json` — adicionar deny rules
2. **Item 17**: Criar `D:/.claude/rules/supply-chain.md` com regras de npm security
3. **Item 18**: Adicionar ao `D:/.claude/rules/` regra sobre RLS indexes
4. **Item 19**: Documentar /sandbox usage em `D:/CLAUDE.md` secao Gotchas

---

## DIM 5: Model Routing & Cost

| # | Oportunidade | Status | Impacto |
|---|-------------|--------|---------|
| 20 | Adicionar modelo recomendado em cada ag-XX | DONE | MEDIO |
| 21 | Default para Sonnet via cost-optimization.md | DONE | ALTO |
| 22 | Budget safety rules em cost-optimization.md | DONE | MEDIO |
| 23 | Status line com tokens e custo | DONE | BAIXO |

---

## DIM 6: Context & Memory Management

| # | Oportunidade | Status | Impacto |
|---|-------------|--------|---------|
| 24 | Regra de /clear entre tarefas nao-relacionadas | DONE | ALTO |
| 25 | Regra de /compact proativo a 60% do context | DONE | ALTO |
| 26 | Auto-save forcado no Stop hook (salvar session-state antes de encerrar) | DONE | ALTO |
| 27 | Compaction preservation rule no CLAUDE.md | DONE | MEDIO |

### Passo a Passo — Items 24-27:
1. **Item 24**: Criar `D:/.claude/rules/context-management.md` com regras de /clear e /compact
2. **Item 25**: Incluir na mesma rule acima
3. **Item 26**: Melhorar `D:/.claude/hooks/quality-check.sh` para salvar estado automaticamente
4. **Item 27**: Adicionar linha ao `D:/CLAUDE.md` sobre compaction preservation

---

## DIM 7: SDD Enhancement

| # | Oportunidade | Status | Impacto |
|---|-------------|--------|---------|
| 28 | SDD enforcement hook (verificar spec antes de edits em dominio) | DONE | ALTO |
| 29 | Spec-to-Test generator em ag-13 (--from-spec) | DONE | ALTO |
| 30 | Size gate enforcement no ag-00 (recusar M+ sem spec) | DONE | MEDIO |

### Passo a Passo — Item 30:
1. Editar `D:/.claude/skills/ag-M-00-orquestrar/SKILL.md` — adicionar gate de size

---

## DIM 8: DevOps & Deploy

| # | Oportunidade | Status | Impacto |
|---|-------------|--------|---------|
| 31 | Vercel Preview Deployments — vercel.json + workflow + docs | DONE | MEDIO |
| 32 | Feature flags plan + README — docs/plans/FEATURE-FLAGS-PLAN.md | DONE | MEDIO |
| 33 | ag-27 enhanced com preview URL | DONE | BAIXO |

---

## DIM 9: Documentation & ADRs

| # | Oportunidade | Status | Impacto |
|---|-------------|--------|---------|
| 34 | ADRs implementados (0001-0006 em docs/adr/) | DONE | MEDIO |
| 35 | ag-21 com template e comando ADR | DONE | BAIXO |

---

## DIM 10: MCP Servers

| # | Oportunidade | Status | Impacto |
|---|-------------|--------|---------|
| 36 | Adicionar Context7 MCP (documentacao real-time de libs) | DONE | ALTO |
| 37 | Adicionar Playwright MCP (browser automation) | DONE | MEDIO |

### Passo a Passo — Items 36-37:
1. Executar `claude mcp add context7 -- npx -y @context7/mcp`
2. Executar `claude mcp add playwright -- npx -y @anthropic/playwright-mcp` (se disponivel)
3. Verificar que MCPs estao funcionando com teste rapido

---

## Resumo por Status

| Status | Qtd | Items |
|--------|-----|-------|
| DONE | 37 | 1-37 (todos implementados) |
| **Total** | **37** | |

> Execucao completa: 2026-02-28 — todos os 37 items implementados.

---

## Historico de Execucao

### Batch 1: Quick Wins (config puro) — DONE
- [15] Deny rules em settings
- [17] Supply chain rule
- [18] RLS indexes rule
- [12] Teste focado no CLAUDE.md
- [24+25] Context management rules
- [27] Compaction preservation

### Batch 2: Hooks (scripts) — DONE
- [6] TypeCheck incremental
- [7] Auto-format Prettier
- [8] Security gate PreToolUse
- [9+26] Stop hook melhorado

### Batch 3: CLAUDE.md Optimization — DONE
- [1] Podar rAIz CLAUDE.md (321→67 linhas, -79%)
- [2] Naming conventions para rules/
- [3] Eliminar duplicacao Quality Gates
- [4] Exemplo concreto

### Batch 4: Infra — DONE
- [5] Otimizar dashboard-bridge (4→2 eventos)
- [36] Context7 MCP
- [37] Playwright MCP

### Batch 5: Agent Routing — DONE
- [30] Size gate no ag-00

### Batch 6: Cost Optimization — DONE
- [20] Modelo recomendado em cada ag-XX (30 skills atualizadas)
- [21] Default Sonnet via cost-optimization.md rule
- [22] Budget safety rules
- [23] Status line com tokens e custo

### Batch 7: Code Hooks — DONE
- [10] SDD→TDD pipeline (ag-07 Phase 0 + ag-13 --from-spec)
- [11] TDD Guard hook (advisory mode)
- [14] Metrics snapshot pos-commit
- [28] SDD enforcement hook (advisory mode)
- [29] Spec-to-Test generator em ag-13

### Batch 8: Documentation — DONE
- [33] ag-27 enhanced com preview URL
- [34] ADRs (0001-0006 criados em docs/adr/)
- [35] ag-21 com template ADR

### Batch 9: Plans & Infra — DONE
- [13] Test debt sprint plan → `docs/plans/TEST-DEBT-SPRINT-PLAN.md`
- [16] Vulnerability reduction plan → `docs/plans/VULNERABILITY-REDUCTION-PLAN.md`
- [31] Vercel Preview Deployments → `vercel.json` + `.github/workflows/preview-deploy.yml` + `docs/plans/VERCEL-PREVIEW-SETUP.md`
- [32] Feature flags infrastructure → `docs/plans/FEATURE-FLAGS-PLAN.md` + `lib/feature-flags/README.md`

---

*Documento criado: 2026-02-28*
*Todos os 37 items implementados: 2026-02-28*
