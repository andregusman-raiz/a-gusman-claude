---
name: ag-retrospectiva
description: "Retrospectiva de sessao: tempo, falhas, decisoes, melhorias para skills/memory. Modos: --instincts (candidatos auto-extraidos), --review-stale (memories obsoletos)."
model: sonnet
context: fork
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
argument-hint: "[sessao ou projeto] [--instincts | --review-stale | --auto-promote]"
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

## Modo --instincts

Quando invocado com `--instincts` (ou ag-0 sugere via orchestrator-feedback-loop):

1. **Le** `~/.claude/projects/*/memory/_instinct-candidates.md` (auto-gerado pelo Stop hook `instinct-extract.py`).
2. **Apresenta** cada candidato com:
   - Confidence score (0.70-1.0)
   - Sinais detectados (correction / confirmation / decision)
   - User text + contexto do assistente
3. **Pergunta**: promover (qual tipo: user/feedback/project/reference) ou descartar?
4. **Promove** via `~/Claude/.claude/skills/ag-retrospectiva/promote-instinct.py` que:
   - Cria `<tipo>_<slug>.md` em `memory/`
   - Adiciona linha em `MEMORY.md` (secao `## Promoted instincts (auto)`)
   - Remove candidato do `_instinct-candidates.md`

Sub-flag `--auto-promote`: promove automaticamente candidatos com confidence >= 0.85.

Pre-requisito: `instinct-extract.py` ja rodou (hook Stop). Sem `_instinct-candidates.md`, este modo nao tem o que apresentar.

```bash
# Exemplo
python3 ~/Claude/.claude/skills/ag-retrospectiva/promote-instinct.py --auto-promote
python3 ~/Claude/.claude/skills/ag-retrospectiva/promote-instinct.py  # interactive
```

## Modo --review-stale

Quando invocado com `--review-stale`:

1. **Le** `~/.claude/projects/*/memory/_stale-review.md` (gerado por `~/Claude/.claude/scripts/memory-decay.py`).
2. **Apresenta** memories flag-ed como stale com razao.
3. **Pergunta** para cada: refresh (re-validar conteudo), archive (mover para MEMORY-ARCHIVE.md), ou delete (com confirmacao).

Pre-requisito: `memory-decay.py` ja rodou (mensal). Pode ser executado on-demand:

```bash
python3 ~/Claude/.claude/scripts/memory-decay.py
```

## Relacao com outras skills/hooks

- **`instinct-extract.py`** (Stop hook) — gera candidatos. Nao-bloqueante.
- **`memory-decay.py`** (script mensal) — flag memories obsoletos.
- **`promote-instinct.py`** (helper) — bridge entre candidatos e memory tipado.
- **`ag-0-orquestrador`** — sugere `/ag-retrospectiva --instincts` via `session-retro-check.sh`.
