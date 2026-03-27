---
name: ag-pesquisar-referencia
description: "Pesquisa solucoes, benchmarks e alternativas antes de especificar. Compara trade-offs com dados. Use when researching solutions, comparing alternatives, or evaluating technologies."
model: sonnet
argument-hint: "[tema de pesquisa]"
disable-model-invocation: true
---

# ag-pesquisar-referencia — Pesquisar Referencia

Spawn the `ag-pesquisar-referencia` agent to research solutions, benchmarks, and alternatives with data-backed trade-offs.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-pesquisar-referencia`
- `mode`: `auto`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Tema: [research topic from $ARGUMENTS]
Contexto: [project context if available, otherwise "general"]


## Output
- Research findings em docs/ai-state/findings.md
- Comparacao de alternativas com trade-offs documentados
- Benchmarks e best practices relevantes

Pesquisar e comparar alternativas com dados:
- Solucoes para o problema especifico
- Comparacao de alternativas (features, performance, maturidade)
- Best practices e anti-patterns documentados
- Libs/ferramentas relevantes

Salvar achados incrementalmente em docs/ai-state/findings.md (a cada 2 pesquisas).
Usar Context7 MCP para docs atualizadas quando possivel.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user that the agent is running in background
- Uses WebSearch and WebFetch for external research

## Research Template

```
# Research: [tema]

## Query
[Pergunta principal]

## Sources Consultadas
1. [URL/fonte] — [resumo do que encontrou]
2. ...

## Findings
### Opcao A: [nome]
- Pros: ...
- Cons: ...
- Maturity: [alpha/beta/stable/deprecated]
- Community: [stars/downloads/last commit]

### Opcao B: [nome]
- Pros: ...
- Cons: ...

## Tabela Comparativa (OBRIGATORIA)

| Criterio | Opcao A | Opcao B | Opcao C |
|----------|---------|---------|---------|
| Performance | ... | ... | ... |
| Bundle size | ... | ... | ... |
| Maturidade | ... | ... | ... |
| Comunidade | ... | ... | ... |
| Learning curve | ... | ... | ... |

## Recomendacao
[Opcao recomendada e justificativa com dados]
```

## Fontes Recomendadas por Dominio

| Dominio | Fontes |
|---------|--------|
| npm packages | npmtrends.com, bundlephobia.com, snyk.io/advisor |
| Frontend | caniuse.com, web.dev, chromestatus.com |
| Backend | TechEmpower benchmarks, DB-Engines ranking |
| AI/ML | Papers With Code, HuggingFace, Anthropic docs |
| Seguranca | OWASP, CVE database, Snyk vulnerability DB |
| General | GitHub stars/issues, StackOverflow trends |

## Anti-Patterns
- NUNCA recomendar sem tabela comparativa — achismo nao e pesquisa
- NUNCA avaliar apenas 1 alternativa — minimo 2-3 opcoes
- NUNCA ignorar bundle size para libs frontend
- NUNCA recomendar lib deprecated ou sem manutencao (last commit > 1 ano)

## Quality Gate
- [ ] Tabela comparativa com pelo menos 3 criterios?
- [ ] Pelo menos 2 alternativas avaliadas?
- [ ] Fontes documentadas para cada finding?
- [ ] Recomendacao com justificativa baseada em dados?
