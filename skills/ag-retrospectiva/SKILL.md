---
name: ag-retrospectiva
description: "Retrospectiva de sessao. Analisa tempo, falhas, decisoes. Compara com sessoes anteriores. Propoe melhorias para skills e memory."
model: sonnet
context: fork
allowed-tools: Read, Glob, Grep, Bash, Write
argument-hint: "[sessao ou projeto para retrospectiva]"
disable-model-invocation: true
---

# ag-retrospectiva — Retrospectiva

Spawn the `ag-retrospectiva` agent for end-of-session analysis and continuous improvement.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `general-purpose`
- `mode`: `auto`
- `run_in_background`: `true`
- `prompt`: Compose from template below

## Prompt Template

```
Projeto: [CWD]

Analise a sessao atual e produza retrospectiva estruturada:

0. **Historico**: Leia retrospectivas anteriores em docs/ai-state/retrospectiva-*.md
   Compare metricas atuais com sessoes passadas. Identifique tendencias.
1. **Tempo**: Quantos agentes foram invocados? Quantos commits?
   Leia /tmp/claude-agent-log.txt e ~/.claude/metrics/agent-scorecard.jsonl se existirem.
2. **Falhas**: O que falhou? Quantas tentativas ate resolver?
3. **Decisoes**: Alguma decisao sub-otima? O que faria diferente?
4. **Patterns**: Algum pattern que se repetiu (positivo ou negativo)?
5. **Melhorias**: Sugestoes concretas para:
   - Memory (informacao util para futuras sessoes)
   - Skills (gaps encontrados, enriquecimentos necessarios)
   - Hooks (protecoes que faltaram)

## Output
Escrever em docs/ai-state/retrospectiva-[data].md:
```
# Retrospectiva — [data]

## Metricas
- Agentes invocados: N
- Commits: N
- Falhas: N (resolvidas: N, pendentes: N)

## O que funcionou
- ...

## O que nao funcionou
- ...

## Decisoes sub-otimas
- ...

## Melhorias propostas
- [ ] [categoria]: [melhoria]
```
```

## Baselines
After writing retrospective, update baselines:
- If `docs/ai-state/baselines.json` exists, compare and update metrics
- If not, create with current session as first baseline
- Track: avg agents/session, avg failures/session, avg commits/session

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- Runs at end of long sessions (2h+) or on demand
- ALWAYS reads previous retrospectives for comparison (step 0)
- Writes retrospective doc AND updates baselines
