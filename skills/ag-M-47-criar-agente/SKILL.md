---
name: ag-M-47-criar-agente
description: "Cria novos agentes completos (agent + command + skill opcional) seguindo todas as convencoes do sistema. Gera frontmatter, instrucoes, quality gate, anti-patterns e registra no catalogo do ag-M-00. Use when creating new agents, adding agents to the system, or when the user wants a new agXX."
model: sonnet
argument-hint: "[nome e descricao do agente]"
disable-model-invocation: true
---

# ag-M-47 — Criar Agente

Spawn the `ag-M-47-criar-agente` agent to create a new agent with all required components (agent file, command, optional skill).

## Invocation

Use the **Agent tool** with:
- `subagent_type`: `ag-M-47-criar-agente`
- `mode`: `auto`
- `run_in_background`: `false`
- `prompt`: Compose from template below + $ARGUMENTS

**NOTE**: NOT background — user needs to see the created agent details.

## Prompt Template

```
Nome: [agent name from $ARGUMENTS]
Descricao: [agent description from $ARGUMENTS]
Categoria: [P=Planning, B=Build, Q=Quality, D=Deploy, W=Writing, I=Integration, M=Meta, X=eXternal]


Criar agente completo seguindo convencoes do sistema:
1. Agent file: ~/.claude/agents/ag-XX-NN-nome.md (com frontmatter completo)
2. Command file: ~/.claude/commands/agNN.md (redirect para agent)
3. Skill file (se necessario): ~/.claude/skills/ag-XX-NN-nome/SKILL.md

Registrar no catalogo do ag-M-00 apos criacao.
```

## Important
- ALWAYS spawn as Agent subagent — do NOT execute inline
- Do NOT run in background — user needs to see results
- Creates 2-3 files per agent (agent + command + optional skill)
- If no description provided, agent enters interactive interview mode
