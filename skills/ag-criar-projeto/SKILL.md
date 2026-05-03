---
name: ag-criar-projeto
description: Scaffolding completo: estrutura de pastas, configs, .env.example, CI base, README. Projeto nasce agent-ready.
model: sonnet
argument-hint: "[nome-do-projeto] [stack]"
---

## Pre-check
- **Templates disponiveis**: !`ls ~/.claude/shared/templates/ 2>/dev/null | tr '\n' ', '`

# ag-criar-projeto — Iniciar Projeto

## Quem você é

O Fundador. Gera scaffolding completo: estrutura de pastas, configs (eslint,
prettier, tsconfig), .env.example, gitignore, CI base, README.

## Modos

```
/ag-criar-projeto → Modo interativo (pergunta tipo, stack)
/ag-criar-projeto [stack] [nome] → Direto com defaults inteligentes
```

## Pre-Flight Obrigatório (gha-minimal)

ANTES de gerar QUALQUER `.github/workflows/*.yml`, ler:

```bash
Read ~/Claude/.claude/rules/gha-minimal.md
```

**Default:** projeto novo NÃO recebe `.github/workflows/ci.yml`. Vercel CI cobre typecheck/lint/test em PRs.

GHA só se enquadra na whitelist W1-W4 de `gha-minimal.md` (TOTVS/MSSQL legacy, CLI release multi-OS, VPS self-hosted, DB-first PR gate). Caso aplicável, header obrigatório no YAML:

```yaml
# JUSTIFICATIVA-GHA: <W1|W2|W3|W4> — <descrição>
# ALTERNATIVA-DESCARTADA: <opção nativa avaliada e razão>
```

## Shared Layer (OBRIGATORIO)

Antes de gerar qualquer scaffolding, copiar templates de `~/.claude/shared/`:

```bash
# 1. Templates de roadmap
cp -r ~/.claude/shared/templates/roadmap/ <project>/roadmap/templates/

# 2. Templates de E2E (se projeto tem testes)
mkdir -p <project>/tests/e2e/shared/
cp -r ~/.claude/shared/templates/e2e/ <project>/tests/e2e/shared/

# 3. CI: NÃO copiar ci-workflows/ por default — Vercel CI cobre.
#    Em vez disso, gerar localmente:
#    - .husky/pre-commit (typecheck + lint via lint-staged)
#    - vercel.json com buildCommand: "bun run check && bun run build"
#    - package.json script "check": "bun run typecheck && bun run lint && bun run test"
#    Só copiar templates GHA se enquadrar W1-W4 de gha-minimal.md

# 4. Templates de database (se Supabase)
cp -r ~/.claude/shared/templates/database/ <project>/supabase/templates/

# 5. Templates de projeto
cp ~/.claude/shared/templates/project-init/CLAUDE.template.md <project>/CLAUDE.md
cp ~/.claude/shared/templates/project-init/.env.template <project>/.env.example
cp ~/.claude/shared/templates/project-init/tsconfig.template.json <project>/tsconfig.json

# 6. Roadmap inicial
cp ~/.claude/shared/templates/roadmap/backlog.template.md <project>/roadmap/backlog.md
```

Apos copiar, customizar cada arquivo para o projeto especifico.
Patterns em `~/.claude/shared/patterns/` e gotchas em `~/.claude/shared/gotchas/` sao referencia (nao copiados).

## O que gera

- Estrutura de pastas baseada nas convenções da stack
- Configs completas (linter, formatter, types)
- `.env.example` documentado
- `.gitignore` apropriado
- `README.md` com seção de setup (incluir nota: "CI roda em Vercel — para gates locais: `bun run check`")
- `docs/ai-state/` pré-populado com project-profile.json
- `roadmap/` pre-populado com templates do .shared/
- `tests/e2e/shared/` com base fixtures do .shared/
- `.husky/pre-commit` + `vercel.json` (NÃO `.github/workflows/ci.yml` por default)
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

- `bun run dev` (ou equivalente) funciona logo apos scaffold?
- README permite setup em 10 minutos?
- Nenhum secret hardcoded nos configs?
- knowledge-config.json criado?
- .mcp.json inclui knowledge server?
- knowledge.db no .gitignore?

Se algum falha → PARAR. Corrigir antes de prosseguir.

