---
name: ag-insights
description: "Metricas e analytics de sessoes Claude Code. Token usage por projeto, patterns de erro recorrentes, commands mais usados, tempo medio de sessao, evolucao de qualidade."
model: haiku
context: fork
allowed-tools: Read, Glob, Grep, Bash
argument-hint: "[--session (atual) | --project (projeto) | --trends (evolucao)]"
disable-model-invocation: true
---

# ag-insights — Insights & Metricas

Spawn the `ag-insights` agent to collect and analyze development session metrics.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `general-purpose`
- `model`: `haiku`
- `mode`: `auto`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
Modo: [--session | --project | --trends]

Colete metricas quantitativas sobre o desenvolvimento.

## Fontes de Dados

### 1. Git History (fonte primaria)
```bash
# Commits por dia/semana
git log --oneline --since="30 days ago" --format="%ad" --date=short | sort | uniq -c

# Commits por autor
git shortlog -sn --since="30 days ago"

# Arquivos mais modificados (hotspots)
git log --since="30 days ago" --pretty=format: --name-only | sort | uniq -c | sort -rn | head -20

# Churn (linhas adicionadas/removidas)
git log --since="30 days ago" --numstat --format="" | awk '{add+=$1; del+=$2} END {print "+" add " -" del}'

# Commits por tipo (conventional commits)
git log --oneline --since="30 days ago" | grep -oP "^[a-f0-9]+ \K(feat|fix|refactor|docs|test|chore)" | sort | uniq -c | sort -rn
```

### 2. Codebase Metrics
```bash
# Total de arquivos e linhas por tipo
find src -name "*.ts" -o -name "*.tsx" | wc -l
find src -name "*.ts" -o -name "*.tsx" | xargs wc -l | tail -1

# Cobertura de testes (ratio test files / source files)
TEST_FILES=$(find . -name "*.test.*" -o -name "*.spec.*" | wc -l)
SRC_FILES=$(find src -name "*.ts" -o -name "*.tsx" | wc -l)

# TypeScript strictness (any count)
grep -r "any" --include="*.ts" --include="*.tsx" src/ | grep -v "node_modules" | wc -l

# TODO/FIXME/HACK count
grep -rn "TODO\|FIXME\|HACK\|XXX" --include="*.ts" --include="*.tsx" src/ | wc -l
```

### 3. Session Data (se disponivel)
```bash
# Retrospectivas anteriores
ls docs/ai-state/retrospectiva-*.md 2>/dev/null

# Advisor reports
ls docs/advisor-report-*.md 2>/dev/null

# Bug hunt reports
ls docs/bug-hunt-*.md 2>/dev/null

# Quality scores de MERIDIAN
grep -r "MQS" docs/ai-state/ 2>/dev/null
```

### 4. Dependencies
```bash
# Total de dependencias
jq '.dependencies | length' package.json
jq '.devDependencies | length' package.json

# Outdated (se npm/bun disponivel)
npm outdated --json 2>/dev/null | jq 'length'
```

## Modos

### --session (sessao atual)
- Commits nesta sessao
- Arquivos modificados
- Erros encontrados e resolvidos
- Tempo estimado

### --project (visao do projeto)
- Metricas de codebase atuais
- Hotspots (arquivos mais modificados)
- Health indicators (any count, TODO count, test ratio)
- Dependency health

### --trends (evolucao 30 dias)
- Commits/dia trend
- Churn trend
- Quality trend (se historico disponivel)
- Comparacao com periodo anterior

## Output

Escrever em `docs/ai-state/insights-[data].md`:

```markdown
# Development Insights — [projeto] — [data]

## Resumo Executivo
- Saude geral: [SAUDAVEL | ATENCAO | CRITICO]
- Velocidade: X commits/semana (trend: subindo/estavel/caindo)
- Qualidade: Y% test coverage, Z `any` types

## Metricas de Codebase
| Metrica | Valor | Benchmark |
|---------|-------|-----------|
| Arquivos TS/TSX | N | - |
| Linhas de codigo | N | - |
| Test files | N | >= 20% de src |
| any count | N | < 50 |
| TODO/FIXME | N | < 20 |
| Dependencies | N | < 100 |

## Hotspots (arquivos que mais mudam)
1. path/file.ts — N mudancas em 30d
...

## Trends (30 dias)
- Commits: N total, media X/dia
- Tipo: feat X%, fix Y%, refactor Z%
- Churn: +N / -M linhas

## Recomendacoes
1. [baseado nos dados coletados]
```
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- Uses haiku model (fast, cheap — just data collection)
- READ-ONLY — collects metrics, does NOT modify code
- Trends mode requires at least 2 previous reports for comparison
