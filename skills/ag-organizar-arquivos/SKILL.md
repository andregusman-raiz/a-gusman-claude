---
name: ag-organizar-arquivos
description: "Organiza arquivos e pastas com taxonomia inteligente. Scan, classifica, propoe estrutura, aguarda aprovacao, executa. NUNCA apaga sem confirmacao."
model: sonnet
argument-hint: "[pasta a organizar]"
disable-model-invocation: true
---

# ag-organizar-arquivos — Organizar Arquivos

Spawn the `ag-organizar-arquivos` agent to organize files and folders with intelligent taxonomy. Scans, classifies, proposes structure, waits for approval, then executes.

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-organizar-arquivos`
- `mode`: `auto`
- `run_in_background`: `false`
- `prompt`: Compose from template below + $ARGUMENTS

## Prompt Template

```
Pasta: [path da pasta a organizar]
Criterios: [criterios de organizacao, se especificados pelo usuario]


## Output
- Plano de organizacao (5 fases: Scan → Classify → Propose → Approve → Execute)
- Taxonomia proposta com justificativa
- Backup antes de mover arquivos; NUNCA apaga sem confirmacao

Organize a pasta seguindo o protocolo de 5 fases: Scan, Classificar, Propor, Aprovar, Executar.
NUNCA apague arquivos sem confirmacao EXPLICITA do usuario.
NUNCA mova arquivos para fora da pasta de trabalho sem confirmacao.
Backup antes de mover — copiar primeiro, confirmar, depois apagar original.
SEMPRE apresente plano ao usuario antes de executar.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- Agent will ALWAYS propose changes before executing — requires user approval
- After spawning, confirm to the user
