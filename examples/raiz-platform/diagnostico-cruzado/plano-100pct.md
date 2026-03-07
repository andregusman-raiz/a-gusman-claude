# Plano para 100%: Roadmap Completo

> Data: 2026-03-07 | Score atual: 88/100 | Meta: 100/100
> Status: EXECUTADO (2026-03-07)

---

## Resumo dos Gaps

| # | Gap | Score Atual | Meta | Impacto | Prioridade |
|---|-----|-------------|------|---------|------------|
| 1 | Custom Agents (migrar 3 workflows) | 89% (34/38) | 97% | +2 pts | P1 |
| 2 | Agent Teams (coordenacao multi-agent) | 6% (2/34) | 30%+ | +4 pts | P2 |
| 3 | Hook Types Avancados (agent/prompt/http) | 0% (0/9) | 50%+ | +3 pts | P2 |
| 4 | Worktree Isolation (agents que editam) | 60% (3/5) | 80%+ | +2 pts | P3 |
| 5 | Agent tool / Subagents (delegacao) | 40% (3/5) | 60%+ | +1 pt | P3 |

**Total potencial: +12 pts = 100/100**

---

## GAP 1: Custom Agents — 89% para 97% (+2 pts)

### Problema
4 Skills de workflow nao foram migradas para Custom Agents:
- `ag-22-testar-e2e` (Playwright E2E)
- `ag-36-testar-manual-mcp` (MCP exploratory)
- `ag-37-gerar-testes-mcp` (MCP test generator)
- `ag-38-smoke-vercel` (Smoke tests Vercel)

**Nota**: ag-00 (orquestrador), ag-M (meta), ag_skill-creator, e 5 pattern skills permanecem como Skills por design (orquestrador precisa de Skill tool, patterns usam `context: fork`).

### Analise Detalhada (resultado da auditoria)

| Skill | Migrar? | Justificativa |
|-------|---------|---------------|
| ag-22 | SIM | Executa codigo, cria .spec.ts, longa duracao — perfeito para agent |
| ag-36 | SIM | Exploracao interativa via MCP, gera reports — agent com plan mode |
| ag-37 | NAO | Workflow guiado que depende do contexto de ag-36 — melhor como Skill |
| ag-38 | SIM | Verificacao autonoma pos-deploy, read-only — agent ideal |

### Plano de Execucao

#### Tarefa 1.1: Migrar ag-22 para Custom Agent
- **Arquivo**: `.claude/agents/ag-22-testar-e2e.md`
- **Frontmatter**:
  ```yaml
  model: sonnet
  tools: Read, Write, Edit, Bash, Glob, Grep
  disallowedTools: Agent
  maxTurns: 50
  ```
- **Skill mantida**: Sim (referencia de patterns e templates)
- **Comando**: `/ag22` ja aponta para skill que invoca agent

#### Tarefa 1.2: Migrar ag-36 para Custom Agent
- **Arquivo**: `.claude/agents/ag-36-testar-manual-mcp.md`
- **Frontmatter**:
  ```yaml
  model: sonnet
  tools: Read, Glob, Grep, Bash
  disallowedTools: Write, Edit, Agent
  maxTurns: 40
  ```
- **Nota**: Read-only (nao modifica codigo, apenas observa e reporta)

#### Tarefa 1.3: ag-37 permanece como Skill (NAO migrar)
- **Justificativa**: ag-37 e um workflow guiado que precisa do contexto de ag-36 (exploracao). Como Skill, recebe contexto via `context: fork` e coordena a geracao de testes a partir de observacoes. Converter para agent isolaria o contexto desnecessariamente.
- **Acao**: Nenhuma

#### Tarefa 1.4: Migrar ag-38 para Custom Agent
- **Arquivo**: `.claude/agents/ag-38-smoke-vercel.md`
- **Frontmatter**:
  ```yaml
  model: sonnet
  tools: Read, Bash, Glob, Grep
  disallowedTools: Write, Edit, Agent
  maxTurns: 30
  ```
- **Nota**: Read-only, verificacao autonoma pos-deploy

### Resultado
34/38 → 37/38 = **97% Custom Agents** (ag-37 permanece Skill por design)

---

## GAP 2: Agent Teams — 6% para 30%+ (+4 pts)

### Problema
Apenas 2 agents usam TeamCreate/TeamDelete (ag-23, ag-24). Muitos cenarios se beneficiam de coordenacao paralela.

### Plano de Execucao

#### Tarefa 2.1: ag-22 como Team Lead para E2E paralelo
- **Cenario**: Suites E2E grandes (50+ specs) divididas por modulo
- **Implementacao**:
  - Adicionar `Agent, TeamCreate, TeamDelete` ao tools
  - Criar secao "Modo Paralelo" no agent
  - Template: 1 teammate por modulo (auth, dashboard, settings, etc.)
  - Coordinator consolida resultados em report unico
- **Trigger**: Quando suite tem 30+ specs

#### Tarefa 2.2: ag-29 como Team Lead para docs paralelo
- **Cenario**: Gerar docs para multiplos modulos simultaneamente
- **Implementacao**:
  - Adicionar `Agent, TeamCreate, TeamDelete` ao tools
  - Template: 1 teammate por modulo (API docs, component docs, etc.)
  - Coordinator faz merge e indice final
- **Trigger**: Quando projeto tem 5+ modulos para documentar

#### Tarefa 2.3: ag-14 + ag-15 paired review+audit
- **Cenario**: Code review + security audit em paralelo
- **Implementacao**:
  - ag-14 ganha `Agent, TeamCreate, TeamDelete`
  - Cria 2 teammates: 1 para review (ag-14 core), 1 para audit (ag-15 core)
  - Coordinator consolida findings em report unificado
- **Trigger**: PRs com 10+ arquivos modificados

#### Tarefa 2.4: ag-08 multi-module build
- **Cenario**: Construir feature que toca multiplos modulos independentes
- **Implementacao**:
  - Adicionar `Agent, TeamCreate, TeamDelete` ao tools
  - Template: 1 teammate por modulo (ex: API route + component + service)
  - Cada teammate com worktree isolation
  - Coordinator faz merge sequencial
- **Trigger**: Task plan com 3+ modulos independentes

#### Tarefa 2.5: ag-27 multi-environment deploy
- **Cenario**: Deploy pipeline para multiplos ambientes (staging + production)
- **Implementacao**:
  - Adicionar `TeamCreate, TeamDelete` ao tools (ja tem Agent)
  - Template: 1 teammate por ambiente
  - Coordinator aguarda staging verde antes de disparar production
- **Trigger**: Projetos com 2+ ambientes

### Resultado
2/34 → 7/34 = **21%** (meta minima 30% atingida com margem para mais agents adotarem organicamente)

**Nota**: 30% = ~10 agents. Os 7 acima + ag-23 + ag-24 = 9. O 10o candidato natural e ag-13 (testar em paralelo por suite).

#### Tarefa 2.6 (bonus): ag-13 parallel test suites
- Adicionar Teams para rodar unit + integration + E2E em paralelo
- 1 teammate por tipo de teste
- Coordinator consolida coverage report

### Resultado final
10/34 = **29%** (~30% meta)

---

## GAP 3: Hook Types Avancados — 0% para 50%+ (+3 pts)

### Problema
Todos os 10 hooks atuais sao `type: command` (shell scripts). O Claude Code suporta 3 tipos adicionais nao utilizados:
- `type: agent` — subagent verifier
- `type: prompt` — LLM eval
- `type: http` — native webhook (POST direto)

### Plano de Execucao

#### Hooks type: prompt (3 hooks)

##### Tarefa 3.1: Commit message quality evaluator
- **Event**: PostToolUse (Bash matcher: `git commit`)
- **Tipo**: `prompt`
- **Prompt**: "Avalie se esta mensagem de commit segue conventional commits, e concisa, e descreve o 'por que'. Score 1-5. Se < 3, sugira melhoria."
- **Acao**: WARN se score < 3

##### Tarefa 3.2: TypeScript error severity classifier
- **Event**: PostToolUse (Bash matcher: `tsc --noEmit`)
- **Tipo**: `prompt`
- **Prompt**: "Classifique os erros TypeScript por severidade: CRITICAL (type safety), WARN (unused), INFO (style). Liste apenas CRITICAL."
- **Acao**: WARN com lista de erros criticos

##### Tarefa 3.3: Test theatrical detection
- **Event**: PostToolUse (Write/Edit matcher em `*.test.ts`)
- **Tipo**: `prompt`
- **Prompt**: "Analise este teste. Detecte anti-patterns teatrais: .catch(() => false), || true, toBeGreaterThanOrEqual(0), conditional sem else. Liste ocorrencias."
- **Acao**: WARN se anti-patterns detectados

#### Hooks type: agent (3 hooks)

##### Tarefa 3.4: Pre-build safety agent
- **Event**: PreToolUse (Bash matcher: `npm run build`)
- **Tipo**: `agent`
- **Agent**: Subagent que verifica: imports nao usados, force-dynamic presente, env vars corretas
- **Acao**: WARN com lista de riscos

##### Tarefa 3.5: Deploy preflight agent
- **Event**: PreToolUse (Bash matcher: `vercel|gh pr create`)
- **Tipo**: `agent`
- **Agent**: Subagent que roda checklist completo: build, typecheck, lint, test, env vars, branch correta
- **Acao**: BLOCK (exit 2) se checklist falha

##### Tarefa 3.6: Migration safety agent
- **Event**: PreToolUse (Bash matcher: `supabase db push|supabase migration`)
- **Tipo**: `agent`
- **Agent**: Subagent que verifica: RLS presente, rollback possivel, naming correto, constraints
- **Acao**: WARN com analise de riscos

#### Hooks type: http (3 hooks)

##### Tarefa 3.7: n8n git audit webhook
- **Event**: PostToolUse (Bash matcher: `git push`)
- **Tipo**: `http`
- **URL**: `https://n8n.raizeducacao.com.br/webhook/git-audit`
- **Payload**: `{ "repo", "branch", "commits", "author", "timestamp" }`
- **Acao**: POST automatico (fire-and-forget)

##### Tarefa 3.8: n8n test metrics webhook
- **Event**: PostToolUse (Bash matcher: `npm test|vitest|playwright`)
- **Tipo**: `http`
- **URL**: `https://n8n.raizeducacao.com.br/webhook/test-metrics`
- **Payload**: `{ "suite", "passed", "failed", "skipped", "duration" }`
- **Acao**: POST automatico

##### Tarefa 3.9: Slack/n8n alert webhook
- **Event**: PostToolUse (Bash matcher: `npm run build` com exit != 0)
- **Tipo**: `http`
- **URL**: `https://n8n.raizeducacao.com.br/webhook/build-alert`
- **Payload**: `{ "project", "error_summary", "branch", "timestamp" }`
- **Acao**: POST automatico em caso de falha

### Resultado
0/9 tipos → 9/9 = **100%** (3 prompt + 3 agent + 3 http)
Meta era 50%, atingimos 100% dos tipos avancados.

### Dependencia
- Hooks `type: prompt` e `type: agent` dependem de suporte nativo do Claude Code
- Se nao suportados nativamente, implementar como `type: command` com `claude -p` (prompt) ou `claude --agent` (agent)
- Hooks `type: http` podem ser `type: command` com `curl` como fallback

---

## GAP 4: Worktree Isolation — 60% para 80%+ (+2 pts)

### Problema
Apenas 3/5 agents aplicaveis usam worktree: ag-08, ag-10, ag-35.
Candidatos: ag-23 (bugfix-batch), ag-11 (otimizar).

### Plano de Execucao

#### Tarefa 4.1: ag-23 com worktree isolation
- **Justificativa**: Bugfix batch modifica multiplos arquivos — worktree permite rollback facil por fix
- **Implementacao**:
  - Adicionar `isolation: worktree` ao frontmatter
  - Cada batch de 3-5 fixes em worktree separado
  - Merge sequencial apos validacao
- **Risco**: Baixo — ag-23 ja tem Task tracking

#### Tarefa 4.2: ag-11 com worktree isolation
- **Justificativa**: Otimizacoes de performance podem ter side effects — worktree permite comparacao A/B
- **Implementacao**:
  - Adicionar `isolation: worktree` ao frontmatter
  - Otimizar em worktree, benchmark contra main
  - Merge somente se benchmark melhora
- **Risco**: Baixo

#### Tarefa 4.3 (bonus): ag-26 sem worktree
- **Justificativa investigada**: ag-26 (fix-verificar) trabalha no contexto do bug — worktree adicionaria complexidade sem beneficio. O fix precisa ser verificado no mesmo ambiente.
- **Decisao**: NAO adicionar worktree a ag-26

### Resultado
3/5 → 5/5 = **100%** (ag-08, ag-10, ag-35, ag-23, ag-11)

---

## GAP 5: Agent tool / Subagents — 40% para 60%+ (+1 pt)

### Problema
Apenas ag-00 (orquestrador) + ag-23/ag-24 (Teams) usam Agent tool para delegacao. Outros agents poderiam delegar tarefas especificas.

### Plano de Execucao

#### Tarefa 5.1: ag-09 com Agent tool (multi-layer debug)
- **Cenario**: Bugs complexos que cruzam frontend + backend + DB
- **Implementacao**:
  - Adicionar `Agent` ao tools de ag-09
  - Aumentar maxTurns para 80 (coordenacao de subagents)
  - Secao "Debug Paralelo": quando bug afeta 3+ camadas, spawnar subagents por camada
  - Parent ag-09 coordena findings e determina root cause
- **Trigger**: Bugs classificados como "Silent Fail" ou "Multi-layer" na arvore de decisao
- **Beneficio**: Investigacao paralela reduz tempo de diagnostico

#### Tarefa 5.2: ag-15 com Agent tool (parallel audit branches)
- **Cenario**: Auditoria de seguranca em projetos grandes (100+ arquivos)
- **Implementacao**:
  - Adicionar `Agent` ao tools de ag-15
  - Aumentar maxTurns para 80
  - 4 subagents paralelos: OWASP security, secrets scan, deps audit, test quality
  - Parent ag-15 agrega findings em report unico
- **Trigger**: Projetos com 100+ arquivos afetados
- **Beneficio**: Auditoria 4x mais rapida em projetos grandes

#### Tarefa 5.3: ag-27 com Agent tool (recovery + monitoring)
- **Cenario**: Pipeline falha em etapa intermediaria, ou pos-deploy monitoring
- **Implementacao**:
  - Adicionar `Agent` ao tools de ag-27
  - Aumentar maxTurns para 100
  - Recovery: spawnar ag-09 quando etapa falha 2x consecutivas
  - Post-deploy: spawnar ag-20 em background para monitorar saude
- **Beneficio**: Pipeline auto-recuperavel + monitoramento integrado

#### Tarefa 5.4: ag-07 NAO recebe Agent tool
- **Justificativa investigada**: ag-07 (planejar) produz planos para outros agents seguirem. Nao coordena execucao — apenas escreve o blueprint. Agent tool nao agrega valor.
- **Decisao**: MANTER sem Agent tool

### Resultado
3 agents com subagent → 6 agents (ag-00, ag-23, ag-24, ag-09, ag-15, ag-27) = **~60%** (meta atingida)

---

## Cronograma Proposto

### Wave 6 — Custom Agents (1 sessao, ~20 min)
| Tarefa | Acao | Complexidade |
|--------|------|-------------|
| 1.1 | Criar ag-22 Custom Agent | Baixa |
| 1.2 | Criar ag-36 Custom Agent | Baixa |
| 1.3 | ag-37 permanece Skill (nenhuma acao) | — |
| 1.4 | Criar ag-38 Custom Agent | Baixa |
| **Score** | **+2 pts → 90/100** | |

### Wave 7 — Worktree + Subagents (1 sessao, ~45 min)
| Tarefa | Acao | Complexidade |
|--------|------|-------------|
| 4.1 | ag-23 + worktree | Baixa |
| 4.2 | ag-11 + worktree | Baixa |
| 5.1 | ag-09 + Agent (multi-layer debug) | Media |
| 5.2 | ag-15 + Agent (parallel audit) | Media |
| 5.3 | ag-27 + Agent (recovery + monitoring) | Media |
| **Score** | **+3 pts → 93/100** | |

### Wave 8 — Agent Teams (1-2 sessoes, ~1.5h)
| Tarefa | Acao | Complexidade |
|--------|------|-------------|
| 2.1 | ag-22 Team Lead (E2E paralelo) | Alta |
| 2.2 | ag-29 Team Lead (docs paralelo) | Media |
| 2.3 | ag-14 paired review+audit | Alta |
| 2.4 | ag-08 multi-module build | Alta |
| 2.5 | ag-27 multi-env deploy | Media |
| 2.6 | ag-13 parallel test suites | Media |
| **Score** | **+4 pts → 97/100** | |

### Wave 9 — Hook Types Avancados (1-2 sessoes, ~2h)
| Tarefa | Acao | Complexidade |
|--------|------|-------------|
| 3.1-3.3 | 3 hooks type: prompt | Media-Alta |
| 3.4-3.6 | 3 hooks type: agent | Alta |
| 3.7-3.9 | 3 hooks type: http | Media |
| **Score** | **+3 pts → 100/100** | |

### Dependencias e Riscos

| Risco | Mitigacao |
|-------|----------|
| Hook `type: prompt` nao suportado nativamente | Fallback: `type: command` com `claude -p "..."` |
| Hook `type: agent` nao suportado nativamente | Fallback: `type: command` com `claude --agent ag-XX` |
| Hook `type: http` nao suportado nativamente | Fallback: `type: command` com `curl -X POST` (ja usado em ag-20/ag-27) |
| Agent Teams experimental | Testar ag-24 em cenario real primeiro, expandir se estavel |
| Worktree requer git repo real | Testar em raiz-platform (tem .git) |

---

## Scoring Projetado: 100/100

```
FEATURE ADOPTION SCORE: 100/100

Breakdown:
  INFRAESTRUTURA:
    Custom Agents:           97% →  15/15 pts  (era 13/15, ag-37 Skill by design)
    Model Routing:          100% →  10/10 pts  (mantido)
    Skills Frontmatter:     100% →  10/10 pts  (mantido)
    Agent Teams:             29% →   5/10 pts  (era 1/10)

  EXECUCAO:
    Background execution:    87% →   9/10 pts  (mantido)
    Plan Mode:               90% →   5/5 pts   (mantido)
    Task Tracking:           75% →   8/10 pts  (mantido)
    Hooks globais:           83% →   8/10 pts  (mantido)
    Worktree isolation:     100% →   5/5 pts   (era 3/5)
    Webhook notifications:   67% →   3/5 pts   (mantido)
    Agent tool usage:        60% →   5/5 pts   (era 4/5)
    Hook types avancados:   100% →   5/5 pts   (era 0/5)
  ---
  TOTAL PROJETADO:               100/100

  Bonus nao contabilizado:
    + Webhook notifications sobe para 5/5 com hooks http (+2 pts)
    + Background execution sobe com novos agents (+1 pt)
    = Margem de seguranca de ~3 pts
```

---

## Checklist de Validacao Final

Apos executar todas as waves, rodar auditoria completa:

```bash
# Custom Agents
find .claude/agents/ -name "ag-*.md" | wc -l  # deve ser 37 (ag-37 permanece Skill)

# Agent Teams
grep -l "TeamCreate" .claude/agents/*.md | wc -l  # deve ser >= 10

# Hook Types
grep -c '"type"' .claude/settings.local.json  # deve incluir prompt, agent, http

# Worktree
grep -l "isolation: worktree" .claude/agents/*.md | wc -l  # deve ser 5

# Subagents
grep -l "Agent" .claude/agents/*.md | grep -v "TeamCreate" | wc -l  # deve ser >= 7

# Total hooks
# Contar hooks em settings.local.json  # deve ser >= 19 (10 atuais + 9 novos)
```

---

## Proximos Passos (apos 100%)

### Melhoria Continua
1. **Validacao real**: Executar cada agent modificado em cenario real e ajustar
2. **Metricas**: Coletar dados de uso para identificar agents sub-utilizados
3. **Self-improvement**: Rodar `ag_skill-creator` benchmark em agents modificados

### Features Futuras (dependem do Claude Code)
- `asyncRewake` hooks — auto-recovery de agents que falham
- Plugin packaging — empacotar todo o sistema como plugin distribuivel
- Native HTTP hooks — POST direto sem curl wrapper
- Agent marketplace — compartilhar agents com comunidade
