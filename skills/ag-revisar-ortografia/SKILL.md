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
