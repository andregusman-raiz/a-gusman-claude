# QAT-Benchmark (QAT-B) — Pattern

## O que e QAT-Benchmark

QAT-Benchmark e uma metodologia de benchmark que compara a qualidade dos outputs de uma aplicacao AI contra um baseline de mercado (Claude API direto). Herda a infraestrutura do QAT (PDCA, camadas, rubricas, KB, classificacao de falhas) e adiciona:

- **Dual-run engine**: mesmo cenario executado na app E no baseline (Claude API)
- **Judge Jury**: 3 modelos x 2 posicoes (6 avaliacoes por cenario) para reduzir bias
- **8 dimensoes**: avaliacao multidimensional (accuracy, teaching, agentic, calibration, safety, efficiency, robustness, UX)
- **Parity Index**: `score_app / score_baseline` (1.0 = paridade com mercado)
- **Anti-contaminacao**: 30% cenarios fixos (baseline tracking) + 70% rotaveis

### Onde QAT-B se encaixa

```
                        QAT-B (benchmark vs mercado)
                       /                              \
                    QAT (qualidade dos outputs)
                   /                             \
              E2E (fluxos funcionam)
             /                       \
        Integration (componentes integrados)
       /                                     \
  Unit (logica pura)
```

| Camada | Pergunta que responde |
|--------|----------------------|
| Unit | A funcao retorna o valor certo? |
| Integration | Os componentes funcionam juntos? |
| E2E | O usuario consegue completar o fluxo? |
| QAT | O output gerado tem qualidade aceitavel? |
| **QAT-B** | **A qualidade e comparavel ao melhor do mercado?** |

## Por que QAT-B existe

QAT mede qualidade absoluta. Mas "7.2/10" nao diz se isso e bom ou ruim comparado ao que o usuario teria usando Claude/ChatGPT direto. QAT-B responde:

- Estamos no nivel do mercado? (Parity Index >= 0.9)
- Onde estamos atras? (dimensoes com gap > 1.5)
- Onde estamos a frente? (vantagens competitivas)
- Estamos melhorando ou piorando? (tendencia temporal)

## Arquitetura Dual-Run

```
Cenario (prompt + contexto)
    |
    +---> [ADAPTER A] App (raiz-platform /dashboard) ---> output_app
    |
    +---> [ADAPTER B] Claude API (baseline) -----------> output_baseline
    |
    v
[TRIPLE SCORER]
    |
    +---> L1-L2: Rule-based (deterministico)
    +---> L3: Judge Jury (3 modelos x 2 posicoes = 6 scores)
    +---> L4: Functional verification (programatico)
    |
    v
[PARITY ENGINE]
    score_app / score_baseline = Parity Index
    |
    v
[PDCA] --> baselines, patterns, learnings, report
```

### Adapters

Adapters abstraem a interface de comunicacao. Cada sistema-alvo implementa:

```typescript
interface BenchmarkAdapter {
  name: string;
  send(scenario: BenchmarkScenario): Promise<BenchmarkOutput>;
  cleanup(): Promise<void>;
}
```

- **raiz-chat.adapter**: Playwright navega ate /dashboard, envia prompt, captura output
- **claude-api.adapter**: Chama Claude API diretamente com mesmo prompt/contexto

### Anti-Contaminacao

Para evitar overfitting nos cenarios:
- **30% fixos** (core): Nunca mudam. Servem como baseline temporal. IDs: BM-01 a BM-12
- **70% rotaveis**: Pool de 100+ cenarios, selecionados aleatoriamente a cada run
- **Rotacao trimestral**: cenarios fixos reavalidos a cada trimestre

## 8 Dimensoes de Avaliacao

| ID | Dimensao | Peso | O que mede |
|----|----------|------|------------|
| D1 | Content Accuracy | 15% | Corretude factual, sem alucinacoes |
| D2 | Teaching Quality | 15% | Pedagogia, adaptacao ao nivel, scaffolding |
| D3 | Agentic Capability | 15% | Uso de ferramentas, multi-step reasoning |
| D4 | Calibration | 10% | Reconhece limites, incerteza, "nao sei" |
| D5 | Safety | 10% | Rejeita harmful, guardrails, bias |
| D6 | Efficiency | 10% | Latencia, tokens, custo |
| D7 | Robustness | 10% | Typos, ambiguidade, adversarial |
| D8 | Response UX | 15% | Estrutura, formatacao, tom, idioma |

Pesos sao configuraves por projeto no `qat-benchmark.config.ts`.

## Judge Jury (Anti-Bias)

Para reduzir o bias de um unico modelo Judge:

1. **3 modelos**: Claude Opus, GPT-4o, Gemini 2.5 Pro
2. **2 posicoes**: cada modelo avalia (A=app, B=baseline) E (A=baseline, B=app)
3. **6 scores por cenario**: mediana remove outliers
4. **Fallback**: se 1 modelo falha, usar 2 restantes. Se 2 falham, usar 1 com flag.

```
Judge 1 (Claude):   [app first] 7.2  |  [baseline first] 7.0  → median 7.1
Judge 2 (GPT-4o):   [app first] 6.8  |  [baseline first] 7.1  → median 6.95
Judge 3 (Gemini):   [app first] 7.0  |  [baseline first] 6.9  → median 6.95
                                                    Final: median(7.1, 6.95, 6.95) = 6.95
```

**Custo por cenario**: ~$0.15-0.30 (6 judge calls x $0.025-0.05 cada)
**Modo economico**: 1 modelo x 2 posicoes = 2 scores ($0.05-0.10/cenario)

## Parity Index

```
Parity = score_app / score_baseline
```

| Range | Interpretacao | Acao |
|-------|--------------|------|
| >= 1.1 | Superioridade (app melhor que baseline) | Documentar vantagem |
| 0.9 - 1.1 | Paridade (aceitavel) | Manter |
| 0.7 - 0.9 | Gap significativo | Investigar e melhorar |
| < 0.7 | Gap critico | P0 — acao imediata |

## Classificacao de Falhas (7 categorias)

Herda 6 do QAT + 1 nova:

| Categoria | Descricao |
|-----------|-----------|
| INFRA | App nao responde, timeout, erro de rede |
| FEATURE | Funcionalidade ausente ou quebrada |
| QUALITY | Score absoluto abaixo do threshold |
| BUSINESS | Viola regra de negocio (idioma, formato, dominio) |
| RUBRIC | Falso positivo/negativo do Judge |
| FLAKY | Variancia > 2 entre runs |
| **BASELINE** | App OK em absoluto mas gap vs baseline > 1.5 |

## PDCA Cycle

Identico ao QAT, com adicao do Parity Engine no CHECK:

- **PLAN**: Carregar KB + configurar adapters + selecionar cenarios (30% fixos + 70% rotacao)
- **DO**: Dual-run (app + baseline) + triple-score por dimensao
- **CHECK**: Classificar falhas (7 categorias) + calcular Parity Index + comparar baselines
- **ACT**: Atualizar KB (baselines, patterns, learnings) + gerar report + alertas

## Custo e Frequencia

| Modo | Cenarios | Judge | Custo/run | Frequencia |
|------|----------|-------|-----------|------------|
| Completo (jury) | 40 | 3x2 | ~$6-12 | Mensal ou pre-release |
| Standard (1 judge) | 40 | 1x2 | ~$2-4 | Quinzenal |
| Rapido (fixed only) | 12 | 1x2 | ~$0.60-1.20 | Semanal |
| Smoke (5 core) | 5 | 1x1 | ~$0.12-0.25 | Pos-deploy |

## Como adaptar para outros projetos

### 1. Copiar templates

```bash
cp -r ~/.shared/templates/qat-benchmark/ tests/qat-benchmark/
```

### 2. Configurar `qat-benchmark.config.ts`

- Ajustar `baseUrl` para URL do projeto
- Configurar adapters (app adapter + baseline adapter)
- Definir pesos das 8 dimensoes
- Configurar modelos do Judge Jury
- Ajustar thresholds e modo (completo/standard/rapido)

### 3. Implementar adapters

- **App adapter**: Implementar interacao com a interface do projeto
- **Baseline adapter**: Configurar Claude API como referencia

### 4. Criar cenarios

- 30% fixos (core) para tracking temporal
- 70% rotaveis para anti-contaminacao
- Cada cenario com dimensoes e rubricas especificas

### 5. Configurar auth + env vars

```bash
QAT_BENCHMARK_BASE_URL=https://app.exemplo.com
QAT_BENCHMARK_ANTHROPIC_KEY=sk-...
QAT_BENCHMARK_OPENAI_KEY=sk-...
QAT_BENCHMARK_GOOGLE_KEY=...
```

## Estrutura de arquivos

```
tests/qat-benchmark/
  qat-benchmark.config.ts          # Config: adapters, dimensions, jury, thresholds
  adapters/
    raiz-chat.adapter.ts           # Adapter para app (Playwright-based)
    claude-api.adapter.ts          # Adapter para baseline (API-based)
  scorers/
    rule-based.scorer.ts           # L1-L2 scoring deterministico
    llm-judge.scorer.ts            # L3 Judge Jury (3 modelos x 2 posicoes)
    functional.scorer.ts           # L4 verificacao programatica
  dimensions/
    dimensions.ts                  # 8 dimensoes com pesos e criterios
  scenarios/
    fixed/                         # 30% cenarios fixos (baseline tracking)
      BM-01-simple-chat.ts
      ...
    rotatable/                     # 70% pool de cenarios rotaveis
      BM-R001-complex-reasoning.ts
      ...
  knowledge/
    baselines.json                 # Historico de scores por dimensao
    failure-patterns.json          # Falhas conhecidas com classificacao
    learnings.md                   # Licoes aprendidas
    golden-samples/                # Respostas de referencia
  results/                         # Gitignored — outputs de cada run
    .gitkeep
    YYYY-MM-DD-HHmmss/
      run-config.json
      BM-XX/
        output-app.json
        output-baseline.json
        scores.json
      summary.json
      parity-report.json
      report.md
  README.md
```

## Anti-patterns

1. **NAO substituir QAT** — QAT-B e camada ADICIONAL focada em benchmark, nao qualidade absoluta
2. **NAO rodar jury completo em CI** — custo de 3 modelos x 2 posicoes e alto ($6-12/run)
3. **NAO usar apenas 1 dimensao** — visao unidimensional esconde problemas
4. **NAO ignorar Parity Index** — score absoluto alto nao garante competitividade
5. **NAO contaminar cenarios** — anti-contaminacao (30/70 split) e obrigatoria
6. **NAO comparar com baseline desatualizado** — atualizar Claude API model a cada release
7. **NAO tratar como teste deterministico** — outputs de IA variam; mediana de jury acomoda

## Referencia

- SPEC: `~/Claude/docs/specs/SPEC-QAT-BENCHMARK.md`
- Agent Runner: `~/.claude/agents/ag-Q-44-benchmark-qualidade.md`
- Agent Scenario: `~/.claude/agents/ag-Q-45-criar-cenario-benchmark.md`
- Skills: `~/.claude/skills/ag-Q-44/SKILL.md`, `~/.claude/skills/ag-Q-45/SKILL.md`
- Commands: `~/.claude/commands/ag-Q-44.md`, `~/.claude/commands/ag-Q-45.md`
- Templates: `~/.shared/templates/qat-benchmark/`
- Related patterns: `quality-acceptance-testing.md`, `qat-pdca-cycle.md`, `qat-rubric-design.md`
