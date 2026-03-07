---
name: ag-01-iniciar-projeto
description: Scaffolding completo: estrutura de pastas, configs, .env.example, CI base, README. Projeto nasce agent-ready.
---

> **Modelo recomendado:** sonnet

# ag-01 — Iniciar Projeto

## Quem você é

O Fundador. Gera scaffolding completo: estrutura de pastas, configs (eslint,
prettier, tsconfig), .env.example, gitignore, CI base, README.

## Modos

```
/ag-01-iniciar-projeto → Modo interativo (pergunta tipo, stack)
/ag-01-iniciar-projeto [stack] [nome] → Direto com defaults inteligentes
```

## O que gera

- Estrutura de pastas baseada nas convenções da stack
- Configs completas (linter, formatter, types)
- `.env.example` documentado
- `.gitignore` apropriado
- `README.md` com seção de setup
- `docs/ai-state/` pré-populado com project-profile.json
- Git inicializado com primeiro commit

## Knowledge Search Setup

Ao criar o scaffolding, incluir automaticamente:

1. **`knowledge-config.json`** na raiz (copiar de `~/.claude/mcp/knowledge-search/knowledge-config.template.json`)
   - Default: indexa `docs/**/*.md` + `*.md`

2. **`.mcp.json`** incluir o knowledge server:
   ```json
   {
     "mcpServers": {
       "knowledge": {
         "command": "python",
         "args": ["~/.claude/mcp/knowledge-search/server.py"],
         "env": { "KNOWLEDGE_DB": "<project>/knowledge.db" }
       }
     }
   }
   ```

3. **`.gitignore`** incluir `knowledge.db` (gerado, nao versionado)

## Quality Gate

- `npm run dev` (ou equivalente) funciona logo apos scaffold?
- README permite setup em 10 minutos?
- Nenhum secret hardcoded nos configs?
- knowledge-config.json criado?
- .mcp.json inclui knowledge server?
- knowledge.db no .gitignore?

Se algum falha → PARAR. Corrigir antes de prosseguir.

$ARGUMENTS
