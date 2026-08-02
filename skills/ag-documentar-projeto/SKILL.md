---
name: ag-documentar-projeto
description: "Mantem docs atualizadas - README, API, guias e changelog. Use apos mudancas significativas no codigo."
model: sonnet
argument-hint: "[projeto-path] [tipo: README|API|guide|changelog]"
disable-model-invocation: true
---

# ag-documentar-projeto — Documentar Projeto

Spawn the `ag-documentar-projeto` agent to create and maintain project documentation: README, API docs, guides, changelog, and ADRs.

## Docs Location (OBRIGATORIO)

Antes de salvar qualquer arquivo, resolver `PROJECT_ROOT` via `git rev-parse --show-toplevel` (ou usar o path do argumento). Se for `$HOME/Claude` (workspace raiz) — PARAR e perguntar qual projeto. Detalhes: `~/Claude/.claude/shared/patterns/docs-location.md`. Hook `docs-location-guard.sh` bloqueia escrita em `~/Claude/docs/`.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-documentar-projeto`
- `mode`: `auto`
- `run_in_background`: `false`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
Tipo: [readme|api|guia|changelog|adr]
Escopo: [modulo ou area especifica, se aplicavel]


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


## Regra PDF → Markdown (obrigatoria — economia de tokens)

Qualquer PDF consumido por esta skill DEVE ser convertido ANTES via markitdown:
`bash ~/Claude/.claude/scripts/pdf2md.sh <arquivo.pdf>` → Read/Grep no `.md` gerado (cache automatico).
NUNCA Read direto de `.pdf` para extrair texto. Excecao visual (layout/slides): converter primeiro, Read multimodal depois. Enforcement: hook `pdf-read-guard.sh`. Detalhes: `.claude/rules/pdf-markitdown.md`.
