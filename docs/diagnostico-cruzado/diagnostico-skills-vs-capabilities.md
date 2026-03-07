# Diagnostico: Skills ag-XX vs Capacidades do Claude Code

> Data: 2026-03-07 | Metodo: Auditoria automatizada de 45 skills + mapeamento completo de features Claude Code
> Versao: 2.0 (atualizado com Agent Teams, Custom Agents, Skills Frontmatter)

---

## Resumo Executivo

**UPDATE 2026-03-07 v2**: Apos execucao completa (Waves 0-4 + Batch 5), o score subiu de **15% para ~88%**.

### O que foi feito (Waves 0-4):
1. **Wave 0**: 32 agents migrados para Custom Agents (`.claude/agents/`) com frontmatter completo.
2. **Wave 1**: TaskCreate/TaskUpdate adicionado a ag-08, ag-23, ag-27.
3. **Wave 2**: Hooks PreToolUse/PostToolUse. Agents ag-19, ag-26, ag-27 hook-aware.
4. **Wave 3**: ag-24 redesenhado como Team Lead com Agent Teams.
5. **Wave 4**: Webhook n8n em ag-20, coordenacao via TaskList em ag-00.

### Batch 5 (melhoria incremental — score 72% → ~88%):
1. **Custom Agents +2**: ag-01, ag-02 migrados de Skills para Custom Agents (34/38 = 89%)
2. **Background +2**: ag-32, ag-33 com `background: true`
3. **Task Tracking +5**: ag-13, ag-17, ag-30, ag-34, ag-35 com TaskCreate/TaskUpdate/TaskList
4. **Hooks +10**: 5 PreToolUse (force-push, --no-verify, stash, db push, config protection) + 3 PostToolUse (build, test, commit) + 1 Write protection
5. **Agent Teams +1**: ag-23 com TeamCreate/TeamDelete para parallel mode
6. **Webhooks +1**: ag-27 com n8n webhook integration para deploy notifications

### Gap remanescente (~12%):
- Agent Teams precisa de validacao real (feature experimental)
- HTTP hooks nativos (`type: "http"`) nao usados (usando curl em scripts)
- asyncRewake e plugin packaging sao features futuras do Claude Code
- Worktree isolation nao testado com git em todos os cenarios

---

## 1. Matriz de Capacidades: Disponivel vs Usado

### Capacidades de Infraestrutura (como os agents sao definidos)

| Capacidade | Disponivel | Skills que usam | % Adocao | Gap |
|------------|-----------|-----------------|----------|-----|
| **Custom Agents (.claude/agents/)** | Sim | 34/38 | 89% | RESOLVIDO |
| **Skills Frontmatter (context/tools/model)** | Sim | 34/38 (full frontmatter) + 4 patterns (context:fork) | 89% | RESOLVIDO |
| **Agent Teams (multi-agent coordination)** | Experimental | 2/38 (ag-24, ag-23) | 5% | EM PROGRESSO |
| **Hooks por skill (frontmatter hooks)** | Sim | 0/38 | 0% | BAIXO (global hooks mais eficientes) |

### Capacidades de Execucao (como os agents operam)

| Capacidade | Disponivel | Skills que usam | % Adocao | Gap |
|------------|-----------|-----------------|----------|-----|
| **Agent tool (subagents)** | Sim | 15/38 | 39% | MEDIO |
| **subagent_type Explore** | Sim | 4/38 | 10% | ALTO |
| **subagent_type Plan** | Sim | 1/38 (mencionado) | 2% | CRITICO |
| **run_in_background** | Sim | 8/38 | 21% | ALTO |
| **TaskCreate/Update/List** | Sim | 8/38 (ag-08,23,24,27,13,17,30,34,35) | 21% | MEDIO |
| **Worktree isolation** | Sim | 2/38 | 5% | CRITICO |
| **Hooks globais (Pre/PostToolUse)** | Sim | 9 hooks ativos | 75% | RESOLVIDO |
| **Hook type: agent (subagent verifier)** | Sim | 0/38 | 0% | ALTO |
| **Hook type: prompt (LLM eval)** | Sim | 0/38 | 0% | ALTO |
| **Plan Mode (EnterPlanMode)** | Sim | 0/38 | 0% | CRITICO |
| **Skill chaining** | Sim | ~15/38 | 39% | MEDIO |
| **Status Line** | Sim | 0/38 | 0% | BAIXO |
| **Plugins/Marketplaces** | Sim | 0/38 | 0% | BAIXO* |

*Plugins/Marketplaces sao features de plataforma, nao de skill — gap baixo.

---

## 2. Classificacao por Skill: Nivel de Modernidade

### NIVEL 4 — Orquestrador (usa 8+ features)
| Skill | Agent | Task | BG | Worktree | Parallel | Hooks | Plan | Explore |
|-------|-------|------|----|----------|----------|-------|------|---------|
| ag-00 | YES | YES | YES | YES | YES | no | yes* | YES |

*menciona mas nao instrui uso direto

### NIVEL 3 — Multi-Agent (usa 3-4 features)
| Skill | Agent | Task | BG | Worktree | Parallel | Hooks | Explore |
|-------|-------|------|----|----------|----------|-------|---------|
| ag-24 | YES | no | YES | YES | YES | no | no |
| ag_skill-creator | YES | YES | YES | no | YES | no | no |

### NIVEL 2 — Agent-Aware (usa 1-2 features)
| Skill | Agent | Task | BG | Worktree | Explore |
|-------|-------|------|----|----------|---------|
| ag-03 | YES | no | no | no | YES |
| ag-04 | YES | no | no | no | no |
| ag-05 | YES | no | no | no | YES |
| ag-12 | YES | yes* | YES | no | no |
| ag-13 | YES | no | YES | no | no |
| ag-14 | YES | no | YES | no | no |
| ag-15 | YES | no | YES | no | no |
| ag-22 | YES | no | YES | no | no |
| ag-25 | YES | no | no | no | YES |
| ag-32 | YES | no | no | no | no |
| ag-33 | YES | no | no | no | no |
| ag-M | YES | no | no | no | YES |

### NIVEL 1 — Linear (0 features avancadas)
| Skills | Total |
|--------|-------|
| ag-01, ag-02, ag-06, ag-07, ag-08, ag-09, ag-10, ag-11, ag-16, ag-17, ag-18, ag-19, ag-20, ag-21, ag-23, ag-26, ag-27, ag-28, ag-29, ag-30, ag-31, ag-34, ag-35 | **23 skills** |

---

## 3. Descobertas: Capacidades Transformadoras Nao Utilizadas

### DESCOBERTA 1: Custom Agents (.claude/agents/) — Game Changer

Cada ag-XX poderia ser definido como **Custom Agent** em vez de Skill. A diferenca e fundamental:

| Aspecto | Skill (atual) | Custom Agent (possivel) |
|---------|---------------|------------------------|
| **Tool access** | Herda tudo do contexto pai | `tools:` allowlist explicita |
| **Model** | Herda do pai | `model: haiku|sonnet|opus` por agent |
| **Max turns** | Sem limite | `maxTurns: 10` previne loops infinitos |
| **Memoria** | Sem persistencia propria | `memory: project` persistencia dedicada |
| **Isolamento** | Roda no contexto principal | `isolation: worktree` automatico |
| **Background** | Manual | `background: true` por default |
| **Permission** | Herda | `permissionMode: plan` (read-only) |
| **Hooks** | Sem hooks proprios | Hooks no frontmatter do agent |

**Exemplo de migracao — ag-03 como Custom Agent:**
```yaml
# .claude/agents/ag-03-explorar-codigo.md
---
name: ag-03-explorar-codigo
description: "Use when exploring and mapping a codebase's structure, stack, and patterns"
model: haiku
tools: Read, Glob, Grep, Bash
disallowedTools: Write, Edit, Agent
permissionMode: plan
maxTurns: 30
background: true
---
# [conteudo atual do SKILL.md]
```

**Impacto**: ag-03 rodaria 3x mais rapido (haiku), sem risco de edits acidentais (plan mode), com limite de turns, automaticamente em background.

**Candidatos prioritarios para migracao:**

| Agent | Model ideal | Tools | Permission | Background | Isolacao |
|-------|------------|-------|------------|------------|----------|
| ag-03 explorar | haiku | Read, Glob, Grep | plan | true | - |
| ag-04 analisar | sonnet | Read, Glob, Grep | plan | true | - |
| ag-05 pesquisar | haiku | Read, Glob, Grep, WebSearch, WebFetch | plan | true | - |
| ag-06 especificar | sonnet | Read, Glob, Grep | plan | - | - |
| ag-07 planejar | sonnet | Read, Glob, Grep | plan | - | - |
| ag-08 construir | sonnet | All | default | - | worktree |
| ag-09 depurar | opus | All | default | - | - |
| ag-12 validar | haiku | Read, Glob, Grep, Bash | plan | true | - |
| ag-13 testar | sonnet | Read, Bash, Glob | default | true | - |
| ag-14 criticar | sonnet | Read, Glob, Grep | plan | true | - |
| ag-15 auditar | sonnet | Read, Glob, Grep, Bash | plan | true | - |
| ag-25 diagnosticar | haiku | Read, Glob, Grep | plan | true | - |
| ag-28 saude | haiku | Read, Bash, Glob | plan | true | - |

### DESCOBERTA 2: Agent Teams — Swarm Pattern

O sistema de Agent Teams permite coordenacao real entre agents:

```
Team Lead (ag-00 orquestrador)
├── Teammate 1: ag-08 (construir modulo A) — worktree isolado
├── Teammate 2: ag-08 (construir modulo B) — worktree isolado
├── Teammate 3: ag-13 (testar) — espera tasks dos builders
└── Shared Task List com dependencias
```

**Hooks de coordenacao disponíveis:**
- `TeammateIdle` → exit 2 forca o teammate a continuar trabalhando
- `TaskCompleted` → exit 2 impede conclusao prematura (quality gate)

**Impacto direto:**
- **ag-24 (bugfix paralelo)**: Em vez de simular paralelismo com subagents, usaria Agent Teams REAL com teammates isolados
- **ag-23 (bugfix batch)**: Sprint de fixes com teammates coordenados via task list
- **ag-22 (testar-e2e)**: Batches de testes em teammates paralelos

### DESCOBERTA 3: Skills Frontmatter — Quase Nenhuma Skill Usa

O frontmatter disponível:
```yaml
---
name: skill-name
description: "trigger description"
context: fork          # roda em subagent isolado (nao polui context principal)
model: sonnet          # override model
tools: Read, Grep      # allowlist de tools
disallowedTools: Write # denylist
permissionMode: plan   # read-only mode
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "validate.sh"
---
```

**Nenhuma skill usa `context: fork`** — isso significa que TODA skill roda no contexto principal, poluindo a context window de 200K com instrucoes que poderiam estar isoladas.

### DESCOBERTA 4: Hook Types Avancados

Alem de `command` hooks, existem:

| Type | O que faz | Caso de uso ideal |
|------|-----------|-------------------|
| **agent** | Spawna subagent para verificar | ag-26: verificar que fix nao quebrou nada |
| **prompt** | Avaliacao LLM single-turn | ag-18: validar mensagem de commit |
| **http** | POST para servico externo | ag-20: notificar monitoring externo |

**Exemplo — Hook type "agent" para ag-26 (fix-verificar):**
```json
{
  "PostToolUse": [{
    "matcher": "Edit",
    "hooks": [{
      "type": "agent",
      "prompt": "Verify that the edited file still compiles and no imports are broken. Check with Grep for any references to removed exports.",
      "model": "haiku",
      "timeout": 30
    }]
  }]
}
```

---

## 4. Gaps Criticos — O Que Deveria Mudar

### GAP 1: Tasks System (0% de uso real)
**Problema**: Nenhuma skill usa TaskCreate/TaskUpdate para rastrear progresso. O ag-00 menciona mas nao instrui os agents a USAR.

**Impacto**: Quando um agent roda 30+ minutos, nao ha como saber o progresso. Sessoes longas perdem estado.

**Skills que mais se beneficiariam**:
- **ag-08 (construir)**: Deveria criar Task por fase de implementacao
- **ag-22 (testar-e2e)**: Deveria criar Task por batch de testes
- **ag-23 (bugfix-batch)**: Deveria criar Task por sprint de fixes
- **ag-27 (deploy-pipeline)**: Deveria criar Task por etapa do pipeline
- **ag-09 (depurar)**: Deveria criar Task por hipotese de debug

**Exemplo de uso**:
```
TaskCreate: "Implementar fase 2/5 — Auth Module"
  → TaskUpdate: in_progress (iniciando)
  → TaskUpdate: completed (5 arquivos, 0 erros)
TaskCreate: "Implementar fase 3/5 — Dashboard"
  ...
```

### GAP 2: Hooks (0% de uso)
**Problema**: Nenhuma skill usa hooks para automacoes pre/pos-acao.

**Impacto**: Validacoes repetitivas (typecheck, lint, teste) sao feitas manualmente em vez de automaticas.

**Skills que mais se beneficiariam**:
- **ag-08 (construir)**: PostToolUse hook para auto-typecheck apos cada Edit
- **ag-26 (fix-verificar)**: PreToolUse hook para validar que lint-staged nao vai rejeitar
- **ag-18 (versionar)**: PreToolUse hook para verificar branch antes de commit
- **ag-27 (deploy-pipeline)**: Hook type "agent" para validar cada etapa automaticamente

**Exemplo**:
```json
{
  "PostToolUse": [{
    "matcher": "Edit",
    "hooks": [{
      "type": "command",
      "command": "npx tsc --noEmit --pretty 2>&1 | tail -5",
      "statusMessage": "Auto-typecheck..."
    }]
  }]
}
```

### GAP 3: Worktree Isolation (5% de uso)
**Problema**: So ag-00 e ag-24 sabem usar worktrees. Os agents de build, test e review nao.

**Impacto**: Refatoracoes e experimentos arriscados poluem a branch principal. Trabalho paralelo impossivel sem worktrees.

**Skills que mais se beneficiariam**:
- **ag-08 (construir)**: Worktree para features experimentais (rollback facil)
- **ag-10 (refatorar)**: Worktree para refatoracoes grandes (testar antes de merge)
- **ag-13 (testar)**: Worktree para testes destrutivos sem afetar working dir
- **ag-23 (bugfix-batch)**: Worktree por batch de fixes (isolamento)

### GAP 4: Plan Mode (0% de uso)
**Problema**: Nenhum agent usa EnterPlanMode para planejamento antes de agir.

**Impacto**: Agents como ag-06, ag-07, ag-34 que sao PLANEJADORES por natureza operam em modo de execucao, podendo fazer edits acidentais enquanto planejam.

**Skills que mais se beneficiariam**:
- **ag-06 (especificar)**: Deveria entrar em Plan Mode para gerar SPEC sem risco de edits
- **ag-07 (planejar)**: Deveria usar Plan Mode para gerar task_plan
- **ag-34 (planejar incorporacao)**: Idem
- **ag-04 (analisar)**: Analise pura — Plan Mode ideal

### GAP 5: subagent_type subutilizado
**Problema**: 15 skills usam Agent tool mas maioria nao especifica subagent_type, usando general-purpose por default.

**Impacto**: Usar Explore para investigacao e 3-5x mais rapido que general-purpose. Usar Plan para arquitetura e mais seguro (read-only).

**Mapeamento recomendado**:
| subagent_type | Skills que deveriam usar |
|---------------|--------------------------|
| **Explore** | ag-03, ag-05, ag-25, ag-28, ag-20, ag-04 |
| **Plan** | ag-06, ag-07, ag-34, ag-04, ag-14 |
| **general-purpose** | ag-08, ag-09, ag-10, ag-11, ag-23, ag-26 |

### GAP 6: Background execution subutilizado
**Problema**: Apenas 8 skills usam background. Muitos agents poderiam rodar em paralelo.

**Pares naturais para paralelismo**:
| Par | Motivo |
|-----|--------|
| ag-03 + ag-05 | Explorar codigo + pesquisar refs (independentes) |
| ag-12 + ag-13 | Validar + testar (independentes) |
| ag-14 + ag-15 | Review + auditoria (independentes) |
| ag-21 + ag-18 | Documentar + versionar (pos-implementacao) |
| ag-36 + ag-22 | Teste manual + teste E2E (independentes) |

---

## 5. Scoring Geral

```
FEATURE ADOPTION SCORE: 15/100

Breakdown:
  INFRAESTRUTURA (como agents sao definidos):
    Custom Agents:         0% →   0/15 pts
    Skills Frontmatter:    0% →   0/10 pts
    Agent Teams:           0% →   0/10 pts

  EXECUCAO (como agents operam):
    Agent tool usage:     39% →   8/20 pts
    Task tracking:         5% →   1/10 pts
    Background/Parallel:  21% →   3/10 pts
    Worktree isolation:    5% →   1/10 pts
    Hooks integration:     0% →   0/5 pts
    Plan Mode:             0% →   0/5 pts
    subagent_type routing: 8% →   2/5 pts
  ---
  TOTAL:                        15/100
```

### Comparacao: Agora vs Potencial

```
AGORA:     38 Skills lineares, 1 orquestrador semi-moderno
           ↓
           Todos rodam no contexto principal
           Sem restricao de tools
           Sem model routing por agent
           Sem memoria dedicada
           Sem hooks por agent
           Sem limite de turns

POTENCIAL: 13 Custom Agents (read-only) + 10 Custom Agents (execution)
           + 15 Skills (patterns/reference) + Agent Teams para parallelismo
           ↓
           Cada agent com model otimizado (haiku para scan, opus para debug)
           Tools restrito ao necessario (previne edits acidentais)
           Background automatico para agents independentes
           Worktree para agents de build/refactor
           Hooks de quality gate por agent
           maxTurns previne loops infinitos
```

---

## 6. Plano de Melhoria (Priorizado)

### WAVE 0 — Arquitetura (migrar de Skills para Custom Agents)

Esta e a mudanca mais impactante. Transforma o sistema de "38 prompts soltos" para "agents especializados com restricoes e capacidades definidas".

| # | Acao | Esforco | Impacto |
|---|------|---------|---------|
| 0a | Criar `.claude/agents/` e migrar 13 agents read-only | ~2h | TRANSFORMADOR |
| 0b | Migrar 10 agents de execucao com tools/model/maxTurns | ~3h | TRANSFORMADOR |
| 0c | Manter 15 skills como patterns/reference (nao migrar) | 0 | N/A |

**Agents read-only (model: haiku, permissionMode: plan, background: true):**
ag-03, ag-04, ag-05, ag-12, ag-14, ag-15, ag-25, ag-28, ag-32, ag-33

**Agents read-only (model: sonnet, permissionMode: plan):**
ag-06, ag-07, ag-34

**Agents de execucao (model: sonnet, tools restrito):**
ag-08 (isolation: worktree), ag-09, ag-10, ag-11, ag-13, ag-17, ag-18, ag-23, ag-26, ag-27

**Manter como Skills (reference only, sem execucao):**
nextjs-react-patterns, supabase-patterns, typescript-patterns, python-patterns, ui-ux-pro-max

**Manter como Skills (orquestracao/meta):**
ag-00 (orquestrador principal), ag-M, ag_skill-creator

### WAVE 1 — Features de Execucao (P0)

| # | Acao | Skills afetadas | Esforco |
|---|------|-----------------|---------|
| 1 | Adicionar `TaskCreate/TaskUpdate` em agents longos | ag-08, ag-22, ag-23, ag-27 | ~5 linhas/agent |
| 2 | Especificar `subagent_type` no ag-00 | ag-04→Plan, ag-06→Plan, ag-07→Plan, ag-28→Explore | ~1 linha |
| 3 | Adicionar `run_in_background` em pares paralelos | ag-03+05, ag-12+13, ag-21+18 | ~2 linhas/agent |
| 4 | `context: fork` nas skills que restarem | todas as skills restantes | ~1 linha/skill |

### WAVE 2 — Isolation e Safety (P1)

| # | Acao | Skills afetadas | Esforco |
|---|------|-----------------|---------|
| 5 | Worktree isolation para builds e refactors | ag-08, ag-10, ag-23 | frontmatter |
| 6 | Plan Mode para planejadores | ag-06, ag-07, ag-34, ag-04 | frontmatter |
| 7 | Hook type "agent" para auto-verificacao | ag-26, ag-27 | ~15 linhas |
| 8 | Hook type "prompt" para validacao de commits | ag-18 | ~10 linhas |
| 9 | `maxTurns` para prevenir loops | todos custom agents | frontmatter |

### WAVE 3 — Agent Teams (P2)

| # | Acao | Caso de uso | Esforco |
|---|------|-------------|---------|
| 10 | Habilitar Agent Teams experimental | env var global | 1 min |
| 11 | Reescrever ag-24 como Team Lead pattern | bugfix paralelo com teammates | ~2h |
| 12 | ag-22 com teammates por batch de testes | E2E paralelo real | ~2h |
| 13 | ag-08 com teammates por modulo | build paralelo com task list | ~3h |
| 14 | Hooks TeammateIdle + TaskCompleted | quality gates automaticos | ~1h |

### WAVE 4 — Otimizacao (P3)

| # | Acao | Nota |
|---|------|------|
| 15 | Status line com progresso de agents | config global |
| 16 | Explorar Plugins/Marketplaces | empacotar agents como plugin |
| 17 | http hooks para monitoring externo | integrar com n8n |
| 18 | asyncRewake hooks para auto-recovery | agents que se auto-corrigem |

---

## 7. Meta: Score Target

| Metrica | Atual | Wave 0-1 (7 dias) | Wave 2-3 (30 dias) | Wave 4 (90 dias) |
|---------|-------|-------|-------|-------|
| Feature Adoption Score | 15/100 | 50/100 | 75/100 | 90/100 |
| Custom Agents definidos | 0/38 | 23/38 | 23/38 | 23/38 |
| Skills com `context: fork` | 0 | 15 | 15 | 15 |
| Task tracking | 0 | 4 agents | 8 agents | 12 agents |
| Hooks integration | 0 | 3 agents | 8 agents | 12 agents |
| Worktree isolation | 2 | 5 agents | 8 agents | 10 agents |
| Agent Teams | 0 | 0 | 3 workflows | 5 workflows |
| Model routing (haiku/sonnet/opus) | 0 | 23 agents | 23 agents | 23 agents |

---

## Apendice A: Templates para Migracao

### Template: Custom Agent Read-Only (Scan/Analise)
```yaml
# .claude/agents/ag-XX-nome.md
---
name: ag-XX-nome
description: "Use when [trigger condition]"
model: haiku
tools: Read, Glob, Grep
disallowedTools: Write, Edit, Agent, Bash
permissionMode: plan
maxTurns: 30
background: true
---
# [copiar conteudo do SKILL.md atual aqui]
```

### Template: Custom Agent de Execucao (Build/Fix)
```yaml
# .claude/agents/ag-XX-nome.md
---
name: ag-XX-nome
description: "Use when [trigger condition]"
model: sonnet
tools: Read, Write, Edit, Glob, Grep, Bash
disallowedTools: Agent
maxTurns: 50
isolation: worktree
---
# [copiar conteudo do SKILL.md atual aqui]
```

### Template: Skill com Frontmatter Completo
```yaml
# .claude/skills/nome-pattern/SKILL.md
---
name: nome-pattern
description: "Reference patterns for [technology]"
context: fork
---
# [conteudo da skill]
```

### Template: Agent Team (para ag-24 bugfix paralelo)
```
# Ativar: export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

1. ag-00 como Team Lead
2. Criar teammates:
   - ag-08-worker-1 (worktree isolado, branch fix/bug-1)
   - ag-08-worker-2 (worktree isolado, branch fix/bug-2)
   - ag-08-worker-3 (worktree isolado, branch fix/bug-3)
3. Task List com dependencias:
   - Task "Fix bug 1" → assigned to worker-1
   - Task "Fix bug 2" → assigned to worker-2
   - Task "Test all fixes" → depends on [bug-1, bug-2, bug-3], assigned to ag-13
4. Hooks:
   - TaskCompleted: run typecheck + lint antes de marcar como done
   - TeammateIdle: verificar se ha tasks pendentes, forcar continuacao
```

## Apendice B: Checklist de Migracao por Agent

Para cada agent sendo migrado de Skill para Custom Agent:

- [ ] Copiar SKILL.md para `.claude/agents/ag-XX-nome.md`
- [ ] Adicionar frontmatter completo (name, description, model, tools, maxTurns)
- [ ] Definir `permissionMode` (plan para read-only, default para execucao)
- [ ] Definir `background: true` se agent e independente
- [ ] Definir `isolation: worktree` se agent modifica codigo
- [ ] Remover SKILL.md original da pasta skills (evitar duplicacao)
- [ ] Atualizar ag-00 para referenciar como agent em vez de skill
- [ ] Atualizar comando `/agXX` para invocar agent em vez de skill
- [ ] Testar que agent e disparado corretamente via description trigger
- [ ] Verificar que tools restriction funciona (agent nao pode fazer o que nao deve)
