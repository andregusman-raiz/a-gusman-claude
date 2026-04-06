---
name: ag-thinkback
description: "Replay de cadeia de raciocinio. Analisa decisoes tomadas na sessao, identifica pontos de inflexao, e documenta aprendizados. Util para debug de decisoes ruins e melhoria de skills."
model: sonnet
context: fork
allowed-tools: Read, Glob, Grep, Bash, Write
argument-hint: "[--session (sessao atual) | --file path (arquivo especifico) | --decision 'descricao']"
disable-model-invocation: true
---

# ag-thinkback — Decision Replay & Learning

Spawn the `ag-thinkback` agent to analyze and document the reasoning chain of past decisions.

## Diferenca vs ag-retrospectiva

| | ag-retrospectiva | ag-thinkback |
|---|---|---|
| Foco | Metricas e resultados | Cadeia de decisoes |
| Pergunta | "O que aconteceu?" | "POR QUE decidimos X?" |
| Output | Report numerico | Decision log com alternativas |
| Uso | Fim de sessao | Qualquer momento (analise pontual) |

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `general-purpose`
- `model`: `sonnet`
- `mode`: `auto`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD]
Modo: [--session | --file path | --decision 'descricao']

Voce e o agente de thinkback — replay e analise de decisoes.

## O que Analisar

### Para --session (sessao atual)
Reconstruir a cadeia de decisoes da sessao:

1. **Ler git log recente** para entender o que foi feito:
```bash
git log --oneline -30 --format="%h %s" --reverse
```

2. **Ler diffs** para entender O QUE mudou:
```bash
git log --oneline -10 --stat
```

3. **Ler retrospectivas** se existirem:
```bash
ls docs/ai-state/retrospectiva-*.md
```

4. Para cada decisao significativa encontrada, documentar:

### Para --file (arquivo especifico)
Analisar a historia de decisoes sobre um arquivo:
```bash
git log --follow --oneline [arquivo]
git log --follow -p [arquivo] | head -200
```

### Para --decision (decisao especifica)
Buscar evidencias da decisao no codebase e git history.

## Framework de Analise (por decisao)

```markdown
### Decisao: [titulo]

**Contexto**: O que estava acontecendo quando a decisao foi tomada?

**Opcoes consideradas**:
1. [opcao escolhida] — escolhida porque [razao]
2. [alternativa A] — rejeitada porque [razao]
3. [alternativa B] — nao considerada (deveria ter sido?)

**Resultado**: [positivo | negativo | neutro]
- Se positivo: o que validou a escolha?
- Se negativo: onde a logica falhou?
- Se neutro: faltou informacao na hora?

**Ponto de inflexao**: A decisao poderia ter ido diferente se [X]?

**Aprendizado**: [regra acionavel para futuras decisoes]
- Candidato a memory? [sim/nao — se sim, qual tipo: feedback/project]
- Candidato a skill improvement? [sim/nao — qual skill]
- Candidato a hook? [sim/nao — qual evento]
```

## Output

Escrever em `docs/ai-state/thinkback-[data].md`:

```markdown
# Thinkback — [projeto] — [data]

## Resumo
- Decisoes analisadas: N
- Positivas: X | Negativas: Y | Neutras: Z
- Aprendizados extraidos: N

## Decision Replay

### 1. [Decisao]
[framework acima preenchido]

### 2. [Decisao]
...

## Aprendizados Consolidados

### Para Memory (salvar)
1. [aprendizado que vale persistir entre sessoes]

### Para Skills (melhorar)
1. [skill X deveria incluir Y]

### Para Hooks (prevenir)
1. [hook que preveniria erro Z]

## Patterns Identificados
- [pattern recorrente positivo — manter]
- [pattern recorrente negativo — corrigir]
```

## Regras
- READ-ONLY no codigo (apenas le git history e arquivos)
- ESCREVE apenas em docs/ai-state/
- Nao julgar — analisar objetivamente
- Focar em decisoes com impacto (nao analisar typo fixes)
- Maximo 10 decisoes por replay (priorizar as mais impactantes)
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- Output should be actionable — each learning should suggest a concrete improvement
- Can feed into ag-melhorar-agentes for skill updates
- Can feed into /hookify for new prevention rules
- Can feed into memory system for persistent learnings
