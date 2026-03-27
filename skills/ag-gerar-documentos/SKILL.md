---
name: ag-gerar-documentos
description: "Gera documentos Office (PPTX, DOCX) com qualidade nivel consultoria. Para XLSX, usar skill xlsx diretamente."
model: sonnet
argument-hint: "[pptx|docx] [tema]"
disable-model-invocation: true
---

# ag-gerar-documentos — Gerar Documentos Office

Spawn the `ag-gerar-documentos` agent to generate professional Office documents (PPTX, DOCX) with consulting-level quality.

**Para XLSX**: NAO usar este agent. Usar o skill `xlsx` diretamente — tem workflow completo com formulas, formatacao, recalculo via LibreOffice, e validacao de erros.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-gerar-documentos`
- `mode`: `auto`
- `run_in_background`: `true`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Projeto: [CWD or user-provided path]
Formato: [pptx|docx]
Tema: [tema ou assunto do documento]
Design Brief: [descricao do estilo, cores, publico-alvo]

Gere documento Office profissional com qualidade de consultoria (McKinsey, BCG, Bain).
Para projetos com 5+ modulos, considere usar Agent Teams para paralelizar.
Output: arquivo no formato solicitado com design consistente.
```

## XLSX Routing
Se formato solicitado = xlsx:
1. Carregar skill `xlsx` (path: `~/.claude/skills/xlsx/SKILL.md`)
2. Seguir workflow do skill (openpyxl/pandas + recalc.py)
3. NAO spawnar ag-gerar-documentos — executar inline com as instrucoes do skill

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline (exceto xlsx)
- Runs in background — document generation may take time
- After spawning, confirm to the user
