---
name: ag-W-21-documentar-projeto
description: "Mantem docs atualizadas - README, API, guias e changelog. Use apos mudancas significativas no codigo."
model: sonnet
argument-hint: "[projeto-path] [tipo: README|API|guide|changelog]"
disable-model-invocation: true
---

# ag-W-21 — Documentar Projeto

Spawn the `ag-W-21-documentar-projeto` agent to create and maintain project documentation: README, API docs, guides, changelog, and ADRs.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-W-21-documentar-projeto`
- `mode`: `auto`
- `run_in_background`: `false`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
Tipo: [readme|api|guia|changelog|adr]
Escopo: [modulo ou area especifica, se aplicavel]

$ARGUMENTS

Crie ou atualize a documentacao solicitada mantendo sincronia com o codigo atual.
README deve permitir setup em 10 min. API docs devem cobrir endpoints e schemas.
Guias devem ser praticos com exemplos. ADRs seguem template em docs/adr/.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- After spawning, confirm to the user

## Output
- README com setup em 10 min (install, build, run, test)
- Documentacao de API (endpoints, schemas, auth, error codes)
- Guides de uso (praticos com exemplos)
- Changelog formatado e ADRs em docs/adr/

## Anti-Patterns
- NUNCA documentar codigo obvio — docs repetindo codigo sao ruido; documentar "why", nao "what"
- NUNCA criar docs desconectados — docs nao atualizados com codigo enganam; manter sincronizados
- NUNCA pular ADR para decisoes significativas — sem ADR, ninguem sabe a justificativa

## Quality Gate
- [ ] Doc reflete estado atual do codigo?
- [ ] Dev novo consegue setup em 10 min seguindo README?
- [ ] Decisoes arquiteturais tem ADR correspondente?

$ARGUMENTS