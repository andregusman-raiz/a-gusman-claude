# ADR-0001 — Consolidação do ecossistema Ag-X pós Opus 4.7 1M context

> **Status:** APROVADO (2026-04-22 — autonomia total autorizada pelo usuário)
> **Data:** 2026-04-22
> **Autores:** Diagnóstico autônomo ag-1-construir --autonomo
> **Contexto do repo:** `~/Claude/` workspace (Camada 1+2: `.claude/` global)
> **Aprovação:** Usuário delegou execução autônoma completa focada em qualidade. Transição PROPOSTO → APROVADO efetuada em 2026-04-22 16:10.

---

## Contexto

O ecossistema ag-x cresceu de forma orgânica desde março/2026, acumulando:

- **108 skills** (`.claude/skills/`)
- **58 agents** (`.claude/agents/`) — 100% duplicam skills correspondentes
- **40 rules** (`.claude/rules/`)
- **11 playbooks**
- **25 plugins oficiais** com **~75 skills externas** (Vercel 25, Sentry 10, Figma 7, Chrome DevTools 6, Supabase 2, outros)

Total: **27 278 linhas** de prompt local, das quais **~12 000 são duplicadas** entre camadas agent/skill.

Entre março e abril de 2026, a Anthropic e parceiros lançaram skills oficiais cobrindo deploy (Vercel), monitoring (Sentry), design (Figma), performance/a11y (Chrome DevTools) e database (Supabase), sobrepondo-se a agents custom.

Ao mesmo tempo, o modelo Opus 4.7 com 1M tokens de context quebra fundamentos antigos:
- Reference skills (fragmentar expertise por domínio) tinha ROI alto em 200K context; agora o ROI é marginal.
- Machines enxutas (<200 linhas) eram necessárias para caber junto de outros agents; agora cabem inline.

---

## Decisão

**Consolidar o ecossistema ag-x em 3 camadas claras, com `.claude/skills/` como camada única local, e delegação preferencial para skills oficiais de plugins.**

### Camada 1 — Skills oficiais (canonical para domínios cobertos)

Para os seguintes domínios, a **skill oficial do plugin é canonical** — nenhum wrapper custom deve reimplementar a lógica:

| Domínio | Canonical |
|---|---|
| Deploy Vercel | `vercel:deployments-cicd` |
| AI features | `vercel:ai-gateway`, `vercel:ai-sdk`, `vercel:chat-sdk` |
| shadcn/ui | `vercel:shadcn` |
| Next.js App Router | `vercel:nextjs`, `vercel:next-cache-components` |
| Auth | `vercel:auth` |
| Sentry ops | `sentry:sentry-workflow`, `sentry:seer`, `sentry:sentry-sdk-setup` |
| Figma ↔ code | `figma:figma-implement-design`, `figma:figma-generate-library` |
| Browser debug/perf/a11y | `chrome-devtools-mcp:*` |
| Supabase | `supabase:supabase`, `supabase:supabase-postgres-best-practices` |

### Camada 2 — Machines locais (ag-0 a ag-12)

As 13 machines continuam como **entry points e orquestradores**. Podem invocar skills oficiais internamente. Responsabilidades mantidas:
- Multi-fase com quality gates
- State persistente (`*-state.json`)
- Convergência (VERIFY↔BUILD loop)
- Integração com rules e hooks locais

### Camada 3 — Skills-agents locais (`.claude/skills/`)

Os 58 skills-agents (antigos "internal agents") continuam como **subagents invocáveis** por machines. YAML frontmatter define `tools:`, `model:`, `context:`.

**`.claude/agents/*.md` é deprecado** (duplicação total com skills).

### Reference skills — redução de 9 para 4

Manter apenas:
- `/ag-referencia-roteamento` (matriz override)
- `/ag-referencia-sdd` (metodologia SDD)
- `/ag-referencia-stack-decisions` (stack approved)
- `/ag-referencia-anti-ciclo-preditivo` (regras específicas)
- `/ag-referencia-mock-first` (metodologia específica)

Deprecar:
- `/ag-referencia-nextjs` → `vercel:nextjs`
- `/ag-referencia-supabase` → `supabase:supabase`
- `/ag-referencia-typescript` → inline em CLAUDE.md
- `/ag-referencia-python` → inline em projetos Python
- `/ag-referencia-qualidade` → já existe `rules/quality-gate.md`
- `/ag-referencia-seguranca-rules` → já existem rules security
- `/ag-referencia-design-library` → já existe `assets/design-library/catalog.md`

---

## Alternativas consideradas

### Alternativa A — Manter status quo

- **Prós:** zero migração, nada quebra.
- **Contras:** 50% da stack é redundante, novas skills Anthropic ignoradas, custo de manutenção sobe exponencialmente.
- **Rejeitada** por divergência do estado observado vs documentado (CLAUDE.md diz "52 agents", disco tem 58; skills novas não documentadas).

### Alternativa B — Deprecar skills, manter agents como canonical

- **Prós:** agents têm versões mais ricas (ag-1-construir 456 vs skill 175 linhas).
- **Contras:** skills têm YAML `context: fork` necessário para invocação via `/`; skills são a interface oficial Claude Code 2026; eliminar skills quebra UX do usuário.
- **Rejeitada** pelo alinhamento com direção Anthropic (skills são futuro).

### Alternativa C — Manter ambos agents+skills

- **Prós:** flexibilidade.
- **Contras:** manutenção dupla, risco de divergência, 50% stack redundante.
- **Rejeitada** pelo custo.

### Alternativa D — Migrar tudo para skills oficiais

- **Prós:** zero manutenção custom.
- **Contras:** machines locais têm orquestração específica (quality gates, integração com rules locais, TOTVS/Neon) que skills oficiais não cobrem.
- **Rejeitada** — precisamos das machines como wrappers.

### Alternativa E (ESCOLHIDA) — 3 camadas com delegação

Skills oficiais canonical por domínio, machines locais como entry points, `.claude/skills/` como camada única para skills-agents internos.

---

## Consequências

### Positivas

- **-52% da stack local** (-14 400 linhas estimadas)
- **Zero custo de manutenção** para 50+ skills oficiais
- **Atualizações automáticas** das skills oficiais (Vercel, Sentry, Figma atualizam sem precisar refatorar nossas)
- **CLAUDE.md atualizado** reflete estado real
- **Routing determinístico** para prompts modernos (80% gap resolvido)

### Negativas

- **Migração em múltiplos PRs** — estimados 10-15 PRs ao longo de 4 semanas
- **Risco de invocações quebradas** se alguma machine referencia `subagent_type` de agent deprecado
- **Dependência de plugins oficiais** — se Anthropic/Vercel mudar API de skill, impacto transversal

### Neutras

- Reference skills reduzidas de 9 para 4 — usuários power-user precisam aprender novo mapeamento.
- Adoption curve: equipe precisa saber quando usar skill oficial vs machine local.

---

## Plano de execução

Ver `~/Claude/docs/diagnosticos/2026-04-22-action-plan.md` para backlog completo P0/P1/P2.

**Sequência:**
1. Semana 1: P0.1 (dedup agents/skills), P0.2 (patch CLAUDE.md)
2. Semana 2: P0.3 (deploy canonical), P0.4 (Sentry canonical), P0.5 (Figma/Supabase/Next canonicals)
3. Semana 3-4: P1.1 a P1.5 (Opus 4.7 alignment)
4. Backlog: P2.x

**Cada passo entrega PR isolado com:**
- Grep prévio para detectar quebras
- Testes nas machines afetadas antes do merge
- Rollback plan documentado

---

## Métricas de sucesso

| Métrica | Baseline | Target 2026-05-31 |
|---|---|---|
| Linhas stack local | 27 278 | <13 000 |
| Agents em `.claude/agents/` | 58 | 0 |
| Reference skills | 9 | 4 |
| Plugin skills documentadas em CLAUDE.md | 0 | 50+ |
| Caminhos deploy concorrentes | 6 | 1 canonical |
| Caminhos monitoring concorrentes | 3 | 1 canonical |

---

## Referências

- Relatório completo: `~/Claude/docs/diagnosticos/2026-04-22-ag-x-diagnostic-report.md`
- Action plan: `~/Claude/docs/diagnosticos/2026-04-22-action-plan.md`
- Patch CLAUDE.md: `~/Claude/docs/diagnosticos/2026-04-22-agx-diagnostic/claude-md-patch.md`
- Inventário: `~/Claude/docs/diagnosticos/2026-04-22-agx-diagnostic/inventory.json`
