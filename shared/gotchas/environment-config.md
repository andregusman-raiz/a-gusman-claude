# Gotchas: Environment & Config

## .env Files
- NUNCA sobrescrever com Write tool — sempre Edit cirurgico
- NUNCA commitar .env (apenas .env.example com valores placeholder)
- Hook avisa automaticamente quando tenta escrever em .env

## Config Files Protegidos
- package.json, tsconfig.json, vercel.json, playwright.config.ts
- .mcp.json, .github/workflows/*.yml
- SEMPRE ler antes de editar, SEMPRE usar Edit (nao Write)
- Se sobrescreveu acidentalmente: `git checkout -- arquivo`

## MCP Servers
- Um MCP por vez, nunca paralelo
- Validar output antes de prosseguir
- Subagents herdam MCPs da sessao pai — NAO iniciar extras

## Context Window
- Se respostas ficam genericas: limpar contexto (nova sessao)
- `/compact` a 60% do context com preservacao de estado
- Subagents para exploracao (200K dedicados, nao poluem pai)

## Memory Pressure (macOS)
- `memory_pressure` para verificar antes de spawnar agents
- Max 4 sessoes Claude Code simultaneas
- Max 4 teammates por sessao
- `TeamDelete` IMEDIATO apos teammates terminarem
