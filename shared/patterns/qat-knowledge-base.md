# Pattern: QAT Knowledge Base

> Como estruturar e manter a knowledge base do QAT para melhoria continua.

## Contexto

QAT v2 gera dados a cada ciclo PDCA: scores, diagnosticos, failure patterns, baselines.
Sem uma KB estruturada, esses dados se perdem e os mesmos problemas se repetem.

## Estrutura da Knowledge Base

```
tests/qat/knowledge/
├── baselines.json           # Scores de referencia por cenario
├── failure-patterns.json    # Catalogo de falhas conhecidas
├── learnings.md             # Licoes aprendidas por ciclo
├── golden-samples/          # Outputs de referencia (score 9-10)
│   ├── QAT-01.md
│   ├── QAT-08.md
│   └── QAT-130.md
└── anti-patterns/           # Outputs que DEVEM receber nota baixa
    ├── QAT-01.md
    ├── QAT-08.md
    └── QAT-130.md
```

## Componentes

### 1. Baselines (`baselines.json`)

Historico de scores por cenario. Atualizado automaticamente pelo PDCA engine.

**Regras**:
- Baseline so atualiza **para cima** (regressao nao atualiza baseline)
- Tolerancia padrao: 1.0 ponto (delta aceitavel antes de alertar)
- Historico dos ultimos 10 runs (para deteccao de flaky)

**Uso**:
- CHECK phase: comparar score atual vs baseline
- ACT phase: atualizar baseline se melhorou
- PLAN phase: detectar cenarios flaky (variancia > tolerancia)

### 2. Failure Patterns (`failure-patterns.json`)

Catalogo de padroes de falha conhecidos com indicadores automaticos.

**Categorias**: INFRA, FEATURE, QUALITY, BUSINESS, RUBRIC, FLAKY
**Severidade**: P0 (critico), P1 (alto), P2 (medio), P3 (baixo)

**Ciclo de vida**:
1. Falha detectada → padrão cadastrado (status: `open`)
2. Causa raiz investigada → `investigating`
3. Fix implementado → `resolved` (com PR/commit ref)
4. Padrão recorrente apos fix → reabrir

**Uso**:
- CHECK phase: match automatico de diagnosticos com patterns conhecidos
- ACT phase: priorizar issues baseado em severity
- PLAN phase: skip cenarios com pattern `wont-fix`

### 3. Golden Samples (`golden-samples/*.md`)

Outputs de referencia que calibram o Judge. Score esperado: 9-10.

**Formato**:
```markdown
# Golden Sample: QAT-XX — Nome do Cenario

## Contexto
- Persona, input, cenario

## Output Ideal
(o output completo que seria score 9-10)

## Por que e excelente
(lista de razoes que justificam o score alto)
```

**Regras**:
- Criar ANTES de escrever o cenario (spec-first)
- Revisar com domain expert (professor, coordenador)
- Atualizar quando rubrica muda (manter alinhamento)
- Nunca usar output real do sistema como golden (viés circular)

### 4. Anti-Patterns (`anti-patterns/*.md`)

Contra-exemplos que DEVEM receber nota baixa. Calibram o Judge negativamente.

**Formato**:
```markdown
# Anti-Patterns: QAT-XX — Nome do Cenario

## AP-1: Nome do Anti-Pattern
**Score esperado**: 2-3/10
**Output**:
(exemplo de output ruim)
**Por que e ruim**:
(razoes especificas)
```

**Regras**:
- Incluir 3-5 anti-patterns por cenario
- Cobrir diferentes TIPOS de falha (vazio, generico, idioma errado, alucinacao)
- Se Judge der score > threshold para um anti-pattern → recalibrar rubrica

### 5. Learnings (`learnings.md`)

Licoes aprendidas de cada ciclo PDCA.

**Quando adicionar**:
- Rubrica refinada apos falso positivo/negativo
- Cenario reescrito apos timeout recorrente
- Prompt ajustado apos alucinacao
- Threshold recalibrado apos variancia alta

**Review mensal**: patterns recorrentes promovidos para `.shared/patterns/`

## Fluxo de Atualizacao

```
Ciclo PDCA
  ├── PLAN: ler baselines, failure-patterns, learnings
  ├── DO: executar cenarios
  ├── CHECK: gerar diagnosticos, match com patterns
  └── ACT:
       ├── baselines.json atualizado (se melhorou)
       ├── failure-patterns.json atualizado (novo pattern ou resolved)
       ├── learnings.md atualizado (nova entrada)
       └── GitHub issue criada (se P0/P1)
```

## Boas Praticas

1. **Golden sample ANTES do cenario**: Escrever o output ideal antes de implementar o teste
2. **Anti-patterns derivados de bugs reais**: Quando encontrar output ruim em producao, catalogar
3. **Review cruzado**: Domain expert valida golden samples, tech lead valida anti-patterns
4. **Versionamento**: KB esta no repo, mudancas via PR, historico rastreavel
5. **Curadoria ativa**: Remover entries obsoletos, atualizar dados desatualizados
6. **Nao sobre-otimizar**: Se cenario passa consistentemente (5+ runs), reduzir frequencia

## Anti-Patterns da KB

- **KB abandonada**: Criou mas nunca atualiza → dados obsoletos → Judge descalibrado
- **Golden sample do sistema**: Usar output real como golden cria loop circular
- **Baseline sem tolerancia**: Qualquer variacao gera alerta → alert fatigue
- **Failure pattern sem fix**: Catalogar sem resolver = inventario, nao melhoria
- **Learning sem acao**: "Observamos que X" sem "Portanto fizemos Y" = ruido

## Metricas da KB

| Metrica | Target | Como medir |
|---------|--------|------------|
| Golden samples por cenario | >= 1 | `ls knowledge/golden-samples/ | wc -l` vs cenarios |
| Anti-patterns por cenario | >= 3 | `grep -c "## AP-" knowledge/anti-patterns/*.md` |
| Baselines atualizados | >= 80% cenarios | `jq length baselines.json` |
| Failure patterns resolvidos | >= 50% | `jq '.patterns | map(select(.status == "resolved")) | length' failure-patterns.json` |
| Learnings por ciclo | >= 1 | Entries no learnings.md |

## Referencia

- PDCA Engine: `~/.shared/templates/qat/helpers/pdca.template.ts`
- Failure Classification: `~/.shared/templates/qat/helpers/diagnostics.template.ts`
- Rubric Design: `~/.shared/patterns/qat-rubric-design.md`
- Scenario Design: `~/.shared/patterns/qat-scenario-design.md`
