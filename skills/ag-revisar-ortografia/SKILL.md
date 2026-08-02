---
name: ag-revisar-ortografia
description: "Verificador e corretor ortografico para documentos Office, PDF, TXT e MD. Corrige silenciosamente erros de ortografia e acentuacao em PT-BR e EN."
model: haiku
argument-hint: "[arquivo ou pasta]"
disable-model-invocation: true
---

# ag-revisar-ortografia — Revisar Ortografia

Spawn the `ag-revisar-ortografia` agent to check and fix spelling and accentuation in documents (PPTX, DOCX, PDF, TXT, MD) for PT-BR and EN.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-revisar-ortografia`
- `mode`: `auto`
- `run_in_background`: `false`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Path: [arquivo ou pasta a revisar]
Idioma: [pt-br|en|auto]


Revise ortografia e acentuacao no(s) documento(s). Corrija silenciosamente e reporte o que foi corrigido.
Backends (ordem de prioridade): LanguageTool API > phunspell > pyspellchecker.
Formatos suportados: PPTX, DOCX, PDF, TXT, MD.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- Uses haiku model for cost efficiency
- After spawning, confirm to the user

## Regra PDF -> Markdown (obrigatoria -- economia de tokens)

Qualquer PDF consumido por esta skill/machine DEVE ser convertido ANTES via markitdown:
`bash ~/Claude/.claude/scripts/pdf2md.sh <arquivo.pdf>` -> Read/Grep no `.md` gerado (cache automatico).
NUNCA Read direto de `.pdf` para extrair texto. Excecao visual (layout/slides): converter primeiro, Read multimodal depois. Enforcement: hook `pdf-read-guard.sh`. Detalhes: `.claude/rules/pdf-markitdown.md`.
