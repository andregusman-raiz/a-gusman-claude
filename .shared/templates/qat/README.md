# QAT Templates — Quality Acceptance Testing v2

## O que e

Templates para implementar Quality Acceptance Testing (QAT) em qualquer projeto.
QAT avalia a QUALIDADE dos outputs gerados pela aplicacao usando AI-as-Judge com rubricas especificas por tipo de entregavel.

### v2: Ciclo PDCA Completo

A v2 evolui o QAT de medicao passiva para melhoria continua:

- **4 camadas de validacao**: L1 Smoke → L2 Functional → L3 Quality → L4 Business
- **Short-circuit**: L1/L2 falham = nao chama Judge API (economia ~30%)
- **Golden samples**: Outputs de referencia calibram o Judge
- **Anti-patterns**: Contra-exemplos garantem que outputs ruins recebem nota baixa
- **Baselines**: Historico de scores por cenario, atualizado automaticamente
- **Failure classification**: 6 categorias (INFRA/FEATURE/QUALITY/BUSINESS/RUBRIC/FLAKY)
- **Knowledge base**: Armazena learnings, patterns, baselines entre runs

## Como usar

### 1. Copiar templates para o projeto

```bash
# Copiar toda a estrutura
cp -r ~/.shared/templates/qat/ tests/qat/

# Renomear arquivos removendo .template
cd tests/qat/
mv qat.config.template.ts qat.config.ts
mv fixtures/qat-fixture.template.ts fixtures/qat-fixture.ts
mv fixtures/rubrics.template.ts fixtures/rubrics.ts
mv fixtures/schemas.template.ts fixtures/schemas.ts
mv helpers/judge.template.ts helpers/judge.ts
mv helpers/capture.template.ts helpers/capture.ts
mv helpers/history.template.ts helpers/history.ts
mv helpers/diagnostics.template.ts helpers/diagnostics.ts
mv helpers/actions.template.ts helpers/actions.ts
mv helpers/pdca.template.ts helpers/pdca.ts
mv helpers/rubric-refinement.template.ts helpers/rubric-refinement.ts
mv helpers/scenario-detection.template.ts helpers/scenario-detection.ts
mv helpers/cost-intelligence.template.ts helpers/cost-intelligence.ts
mv helpers/trends-exporter.template.ts helpers/trends-exporter.ts

# Cenarios — escolher o template adequado:
mv scenarios/core-journey.template.spec.ts scenarios/qat-XX-nome.spec.ts
# ou copiar o proof of concept:
mv scenarios/qat-01-chat-educacional.spec.template.ts scenarios/qat-01-chat-educacional.spec.ts

# Rubricas v2 (opcional, para rubricas especificas por cenario):
mv rubrics/specific-rubric.template.ts rubrics/chat-educacional.rubric.ts

# Knowledge base:
# Manter knowledge/ como esta — contem golden samples, anti-patterns, baselines
```

### 2. Instalar dependencias

```bash
npm install @anthropic-ai/sdk zod
# Playwright ja deve estar instalado se voce tem E2E
```

### 3. Configurar

Editar `tests/qat/qat.config.ts`:
- Definir `baseUrl` da aplicacao
- Listar cenarios com persona, userInput e businessCriteria (v2)
- Configurar `baselinePath` e `knowledgePath` (v2)
- Ajustar timeouts por cenario

### 4. Configurar env vars

```bash
# .env.local
QAT_BASE_URL=https://sua-app.vercel.app
QAT_JUDGE_API_KEY=sk-ant-...  # ou reutilizar ANTHROPIC_API_KEY
QAT_JUDGE_MODEL=claude-sonnet-4-20250514
```

### 5. Criar cenarios (metodologia v2)

Para cada funcionalidade, seguir o framework User Story → QAT Scenario:

1. Definir **persona** (quem e o usuario?)
2. Definir **input realista** (o que o usuario realmente digitaria?)
3. Criar **golden sample** em `knowledge/golden-samples/QAT-XX.md`
4. Criar **anti-patterns** em `knowledge/anti-patterns/QAT-XX.md`
5. Copiar `scenarios/core-journey.template.spec.ts`
6. Implementar 4 camadas: L1 Smoke → L2 Functional → L3 Quality → L4 Business
7. Registrar cenario em `qat.config.ts` com `category`, `persona`, `userInput`

Ver pattern completo: `~/.shared/patterns/qat-scenario-design.md`

### 6. Adicionar ao playwright.config.ts

```typescript
projects: [
  // ... projetos existentes ...
  {
    name: 'qat',
    testDir: './tests/qat/scenarios',
    use: { storageState: 'tests/e2e/.auth/user.json' },
    dependencies: ['setup'],
    timeout: 180_000,
  },
],
```

### 7. Gitignore

```
tests/qat/results/
!tests/qat/results/.gitkeep
```

### 8. Executar

```bash
# Todos os cenarios
QAT_BASE_URL=https://app.vercel.app npx playwright test --project=qat

# Cenario especifico
QAT_BASE_URL=https://app.vercel.app npx playwright test --project=qat --grep="QAT-01"

# Apenas L1+L2 (sem Judge, sem custo API)
QAT_BASE_URL=https://app.vercel.app npx playwright test --project=qat --grep="L1|L2"

# Via agente
/ag40 https://app.vercel.app
/ag40 https://app.vercel.app QAT-04
```

## Estrutura de arquivos (v2)

```
tests/qat/
  qat.config.ts             # Config: thresholds, timeouts, model, knowledge paths
  fixtures/
    qat-fixture.ts          # Playwright fixture com judge + capture helpers
    rubrics.ts              # Rubricas genericas por tipo de entregavel
    schemas.ts              # Zod schemas (v1 + v2: layers, diagnostics, baselines)
  scenarios/
    qat-XX-nome.spec.ts     # Cenarios QAT (1 arquivo por cenario, 4 camadas)
  rubrics/                   # (v2) Rubricas especificas por cenario
    specific-rubric.template.ts  # Interface base + template CUSTOMIZE
    v2/
      index.ts                # Registry + lookup helpers
      changelog.md            # Historico de versoes
      chat-educacional.rubric.ts
      extended-thinking.rubric.ts
      rag-query.rubric.ts
      plano-de-aula.rubric.ts
      relatorio-executivo.rubric.ts
      geracao-codigo.rubric.ts
      imagem-educacional.rubric.ts
  helpers/
    judge.ts                # Claude API + golden sample + anti-patterns calibration
    capture.ts              # Screenshot, download, text extraction
    history.ts              # Leitura de runs + baseline management
    diagnostics.ts          # Classificacao de falhas (6 categorias)
    actions.ts              # Acoes automaticas (GitHub issues, webhooks, baselines)
    pdca.ts                 # PDCA Engine (orquestrador Plan→Do→Check→Act)
    rubric-refinement.ts    # Auto-refinamento de rubricas (consistencia + sugestoes)
    scenario-detection.ts   # Auto-deteccao de cenarios via bug reports (Sentry/GitHub)
    cost-intelligence.ts    # ROI por cenario + otimizacao de custos
    trends-exporter.ts      # Export metricas (Prometheus, Grafana JSON, trends)
  knowledge/                 # (v2) Knowledge base persistente
    baselines.json           # Scores de referencia por cenario
    failure-patterns.json    # Catalogo de padroes de falha conhecidos
    learnings.md             # Licoes aprendidas por ciclo PDCA
    golden-samples/          # Outputs de referencia (score 9-10)
      QAT-01.md
      QAT-08.md
      QAT-130.md
    anti-patterns/           # Outputs que DEVEM receber nota baixa
      QAT-01.md
      QAT-08.md
      QAT-130.md
  results/                   # Gitignored — resultados de runs
    .gitkeep
```

## Custo estimado

- ~$0.03/cenario (Judge call com Sonnet)
- ~$0.25-0.60 por run (10 cenarios)
- **Com short-circuit (v2)**: ~30% economia quando L1/L2 falham (sem Judge call)
- ~$1.00-2.40/mes com schedule semanal
- NAO recomendado para CI por PR

## Referencia

### Patterns (metodologia)
- `~/.shared/patterns/quality-acceptance-testing.md` — Pattern QAT original
- `~/.shared/patterns/qat-scenario-design.md` — User Story → QAT Scenario
- `~/.shared/patterns/qat-pdca-cycle.md` — Ciclo PDCA completo
- `~/.shared/patterns/qat-rubric-design.md` — Como criar rubricas especificas
- `~/.shared/patterns/qat-knowledge-base.md` — Como estruturar e manter a Knowledge Base
- `~/.shared/patterns/qat-continuous-improvement.md` — Auto-refinamento, deteccao, cost intelligence

### Agent & Skill
- Agent: `~/.claude/agents/ag-Q-40-testar-qualidade.md` (PDCA Orchestrator)
- Agent: `~/.claude/agents/ag-Q-41-criar-cenario-qat.md` (Scenario Designer)
- Skill: `~/.claude/skills/ag-Q-40/SKILL.md`
- Skill: `~/.claude/skills/ag-Q-41/SKILL.md`
- Command: `~/.claude/commands/ag-Q-40.md`
- Command: `~/.claude/commands/ag-Q-41.md`

### Evolution Plan
- `~/Claude/docs/specs/QAT-EVOLUTION-PLAN.md` — Plano completo de evolucao (5 sprints)
