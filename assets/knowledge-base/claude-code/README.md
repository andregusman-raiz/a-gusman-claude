# Claude Code — CLI & Agent System Reference

> Fonte: https://docs.anthropic.com/en/docs/claude-code
> Hooks: https://code.claude.com/docs/en/hooks
> Atualizado: 2026-03-21

## Visao Geral

Claude Code é o CLI oficial da Anthropic para desenvolvimento assistido por IA.
O sistema da Raíz usa 46 agents, 60 skills, 31 rules, 7 hooks, 12 playbooks.

## Componentes do Sistema

### Skills (`.claude/skills/`)
- Arquivo `.md` com frontmatter YAML
- Carregado automaticamente quando contexto é relevante
- Invocável via `/skill-name`
- Sem SDK, sem API — apenas markdown com instruções

### Agents (subagents)
- Workflows repetíveis definidos em markdown
- Spawned via `Agent()` tool com `subagent_type`
- Cada agent recebe contexto separado (~200K tokens)
- `isolation: "worktree"` para mudanças de código isoladas

### Agent Teams
- Múltiplas sessões Claude coordenadas em paralelo
- Comunicação via `SendMessage()` entre teammates
- Task list compartilhada (`TaskCreate`, `TaskUpdate`, `TaskList`)
- `TeamCreate()` / `TeamDelete()` para lifecycle
- Max 4 teammates (constraint de memória)

### Hooks (`hooks.json` ou `settings.json`)
- Shell commands executados em eventos específicos
- Eventos: `PreToolUse`, `PostToolUse`, `Stop`, `SessionStart`, `UserPromptSubmit`
- Matcher: regex no tool name ou evento
- Retorno: `additionalContext`, `block`, `approve`

### Rules (`.claude/rules/`)
- Arquivos `.md` carregados automaticamente em todo contexto
- Governança: branch strategy, commit conventions, quality gates
- Sem frontmatter — texto puro com instruções

### MCP Servers
- Conecta a ferramentas externas via Model Context Protocol
- Configurados em `.mcp.json` ou settings
- Cada MCP server expõe tools que Claude pode usar
- Ex: GitHub, Playwright, Supabase, Slack, Linear, Sentry

### Plugins
- Extensões instaláveis com skills + hooks + MCP
- Instalação: `claude plugin add <name>`
- Podem injetar contexto via hooks

## Memory System (`.claude/projects/`)
- Persistência cross-sessão via arquivos markdown
- Tipos: user, feedback, project, reference
- Índice em `MEMORY.md`
- Auto-managed pelo sistema

## Configurações Importantes

### settings.json
- `permissions`: allow/deny por tool + pattern
- `hooks`: eventos + matcher + comando
- `env`: variáveis de ambiente injetadas

### CLAUDE.md
- Instruções por projeto (carregadas automaticamente)
- Hierarquia: global (~/.claude/) → workspace → projeto
- Convenções, regras, estrutura

## Stats do Ecossistema (Mar 2026)
- 4% dos commits públicos no GitHub são via Claude Code (~135K/dia)
- 90% do código da Anthropic é AI-written
- 42,896× crescimento em 13 meses

## Docs Completa
- Docs oficiais: https://docs.anthropic.com/en/docs/claude-code
- Hooks: https://code.claude.com/docs/en/hooks
- Awesome list: https://github.com/hesreallyhim/awesome-claude-code
