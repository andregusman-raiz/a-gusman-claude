---
name: ag-W-29-gerar-documentos
description: "Gera documentos Office (PPTX, DOCX, XLSX) com qualidade nivel consultoria. Segue Design Brief aprovado."
model: sonnet
argument-hint: "[pptx|docx|xlsx] [tema]"
disable-model-invocation: true
---

# ag-W-29 — Gerar Documentos Office

Spawn the `ag-W-29-gerar-documentos` agent to generate professional Office documents (PPTX, DOCX, XLSX) with consulting-level quality.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-W-29-gerar-documentos`
- `mode`: `auto`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
Formato: [pptx|docx|xlsx]
Tema: [tema ou assunto do documento]
Design Brief: [descricao do estilo, cores, publico-alvo]


Gere documento Office profissional com qualidade de consultoria (McKinsey, BCG, Bain).
Para projetos com 5+ modulos, considere usar Agent Teams para paralelizar.
Output: arquivo no formato solicitado com design consistente.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- Runs in background — document generation may take time
- After spawning, confirm to the user
