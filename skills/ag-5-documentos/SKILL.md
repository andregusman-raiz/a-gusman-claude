---
name: ag-5-documentos
description: "Maquina autonoma de documentacao. Projeto (README, API), Office (PPTX, DOCX), organizar arquivos, ortografia — auto-detecta modo, produz docs completos."
model: sonnet
context: fork
argument-hint: "[projeto|office|organizar|ortografia] [path ou descricao]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, TaskCreate, TaskUpdate, TaskList, TeamCreate, TeamDelete, SendMessage
metadata:
  filePattern: "README.md,CHANGELOG.md,docs/**"
  bashPattern: "documentos|readme|changelog"
  priority: 85
---

# DOCUMENTOS — Maquina Autonoma de Documentacao

## Invocacao

```
/documentos projeto ~/Claude/GitHub/raiz-platform
/documentos office slides sobre feature X
/documentos organizar ~/Claude/projetos/
/documentos ortografia ~/Claude/docs/
```

## Modos

| Modo | Agent interno | O que faz |
|------|--------------|-----------|
| projeto | ag-documentar-projeto | README, API docs, guias, changelog |
| office | ag-gerar-documentos | PPTX, DOCX, XLSX nivel consultoria |
| organizar | ag-organizar-arquivos | Taxonomia, reorganizar (com aprovacao) |
| ortografia | ag-revisar-ortografia | Spell check PT-BR/EN silencioso |
