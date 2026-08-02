# Quality Acceptance Testing (QAT) — Pattern

## O que e QAT

Quality Acceptance Testing e uma camada de testes que avalia a QUALIDADE dos outputs gerados por uma aplicacao, nao apenas se os fluxos funcionam. Usa AI-as-Judge com rubricas especificas por tipo de entregavel para pontuar outputs reais capturados da app deployada.

### Onde QAT se encaixa na piramide de testes

```
                    QAT (qualidade dos outputs)
                   /                             \
              E2E (fluxos funcionam)
             /                       \
        Integration (componentes integrados)
       /                                     \
  Unit (logica pura)
```

QAT e uma camada ADICIONAL acima de E2E. NAO substitui nenhuma camada existente.

| Camada | Pergunta que responde |
|--------|----------------------|
| Unit | A funcao retorna o valor certo? |
| Integration | Os componentes funcionam juntos? |
| E2E | O usuario consegue completar o fluxo? |
| **QAT** | **O output gerado tem qualidade aceitavel?** |

## Por que QAT existe

Aplicacoes que usam IA para gerar conteudo (texto, imagem, apresentacao, video) podem ter todos os testes passando mas produzir outputs de baixa qualidade. Exemplos:
- Chat responde em ingles quando a pergunta e em portugues
- Imagem gerada tem artefatos visuais
- Apresentacao tem apenas 1 slide quando deveria ter 10
- Grafico com dados imprecisos
- Infografico com hierarquia visual ruim

Nenhum teste unitario ou E2E detecta esses problemas. QAT preenche essa lacuna.

## Conceito: AI-as-Judge com Rubricas

### O que e AI-as-Judge

Em vez de um humano avaliar cada output manualmente, usamos um modelo de linguagem (Claude) como juiz automatico. O juiz recebe:
1. O output produzido pela aplicacao
2. Uma rubrica com criterios especificos para aquele tipo de output
3. Instrucao para pontuar cada criterio de 1-10 com feedback

### Rubricas por tipo

Cada tipo de entregavel tem criterios diferentes:

| Tipo | Criterios |
|------|-----------|
| Chat | completude, corretude, estrutura, utilidade |
| Imagem | relevancia, qualidade-visual, composicao |
| Edicao de imagem | fidelidade, qualidade, coerencia |
| Apresentacao (PPTX) | estrutura, conteudo, design, coerencia |
| Video | relevancia, fluidez, qualidade-visual |
| Grafico | precisao-dados, clareza, legibilidade |
| Infografico | design, conteudo, hierarquia-visual |
| Automacao | completude, corretude-config, executabilidade |

**NUNCA usar rubrica generica** para todos os tipos — criterios de imagem sao fundamentalmente diferentes de criterios de texto.

## Estrutura de Cenarios

Cada cenario QAT segue o fluxo:

```
Input → Execucao → Captura → Avaliacao
```

### 1. Input
- Descricao do que o usuario faz (ex: "envia PDF com OCR ativado")
- Dados de entrada (ex: arquivo PDF, prompt de texto)
- Preconditions (ex: auth, feature flag)

### 2. Execucao
- Playwright navega ate a funcionalidade
- Executa a acao do usuario
- Aguarda output completo (com timeout)

### 3. Captura
- Screenshot da tela final
- Arquivo gerado (se download)
- Texto extraido (se chat/CLI)
- Metadata (duracao, tipo)

### 4. Avaliacao
- Claude API recebe output + rubrica
- Retorna JSON com score por criterio + overall score + feedback
- Zod valida o JSON contra schema
- Score >= threshold = PASS

## Scoring

### Escala: 1-10

| Score | Significado |
|-------|------------|
| 1-2 | Inutilizavel (vazio, irrelevante, corrompido) |
| 3-4 | Muito fraco (parcial, impreciso, mal formatado) |
| 5 | Abaixo do aceitavel (funciona mas com problemas claros) |
| **6** | **Aceitavel (threshold padrao)** |
| 7-8 | Bom (atende expectativas, qualidade solida) |
| 9-10 | Excelente (supera expectativas, qualidade profissional) |

### Threshold

Score minimo para considerar o cenario como PASS. Default: **6/10**.

Razao: 6 significa "aceitavel" — o output funciona e atende o minimo. Abaixo de 6 indica degradacao clara que requer atencao.

### Comparacao temporal

O principal valor do QAT nao e o score absoluto, mas a **tendencia** ao longo do tempo. Cada run compara com o anterior:
- Score subiu → melhoria na qualidade
- Score caiu → degradacao (requer investigacao)
- Score estavel → qualidade mantida

## Custo e Frequencia

### Custo por run
- ~10 cenarios x 1 judge call cada = 10 calls Claude API
- Custo estimado: **$0.25-0.60/run** (depende do tamanho dos outputs)
- Custo mensal (semanal): **$1.00-2.40/mes**

### Frequencia recomendada

| Frequencia | Quando |
|-----------|--------|
| Manual | Apos mudanca em modelo/prompt de IA |
| Semanal (schedule) | Baseline de qualidade continuo |
| Pos-deploy major | Validar que nova versao manteve qualidade |

**NAO rodar em CI por PR** — custo de LLM e alto demais para cada PR. Schedule semanal ou manual e suficiente.

## Como adaptar para outros projetos

### 1. Copiar templates

```bash
cp -r ~/.claude/shared/templates/qat/ tests/qat/
```

### 2. Configurar `qat.config.ts`

- Ajustar `baseUrl` para URL do projeto
- Definir cenarios especificos do projeto
- Ajustar timeouts por cenario
- Configurar modelo do Judge

### 3. Criar rubricas

Para cada tipo de output do projeto, definir criterios em `fixtures/rubrics.ts`.
Usar os templates existentes como base e ajustar para o dominio.

### 4. Criar cenarios

Para cada funcionalidade que gera output, criar arquivo em `scenarios/`:
- Navegacao ate a funcionalidade
- Execucao da acao
- Captura do output
- Chamada do Judge com rubrica adequada

### 5. Configurar auth

QAT precisa de `storageState` para funcionalidades protegidas.
Reutilizar o setup de auth do E2E existente.

### 6. Gitignore resultados

Adicionar `tests/qat/results/` ao `.gitignore` (screenshots e outputs podem ser grandes).
Opcionalmente, commitar apenas `summary.json`.

## Estrutura de arquivos

```
tests/qat/
  qat.config.ts             # Config: thresholds, timeouts, model, base URL
  fixtures/
    qat-fixture.ts          # Playwright fixture com judge + capture helpers
    rubrics.ts              # Rubricas por tipo de entregavel
    schemas.ts              # Zod schemas (criterion, evaluation, summary)
  scenarios/
    qat-XX-nome.spec.ts     # Cenarios QAT (1 arquivo por cenario)
  helpers/
    judge.ts                # Claude API call + Zod parse + retry
    capture.ts              # Screenshot, download, text extraction
    history.ts              # Leitura de runs anteriores para comparacao
  results/                  # Gitignored — outputs de cada run
    .gitkeep
    YYYY-MM-DD-HHmmss/
      QAT-XX/
        screenshot.png
        output.*
        evaluation.json
      summary.json
      report.md
```

## Anti-patterns

1. **NAO substituir E2E** — QAT avalia qualidade, E2E avalia funcionalidade
2. **NAO rodar em CI por PR** — custo de LLM inviavel ($0.25-0.60 por run)
3. **NAO usar rubrica generica** — cada tipo de output tem criterios unicos
4. **NAO avaliar outputs mockados** — QAT trabalha com outputs REAIS
5. **NAO ignorar tendencia** — score absoluto e menos importante que a tendencia
6. **NAO falhar o run por 1 cenario** — cenarios sao independentes
7. **NAO tratar QAT como teste deterministico** — outputs de IA variam; threshold acomoda variancia

## Referencia

- Agent: `~/.claude/agents/ag-Q-40-testar-qualidade.md`
- Skill: `~/.claude/skills/ag-Q-40/SKILL.md`
- Command: `~/.claude/commands/ag-Q-40.md`
- Templates: `~/.claude/shared/templates/qat/`
