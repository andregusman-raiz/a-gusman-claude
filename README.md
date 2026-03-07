# Claude Code Agent System

Sistema de 34+ agentes e skills para desenvolvimento autônomo com Claude Code.

## Estrutura

```
.claude/
├── agents/          # 34 Custom Agents (.md com frontmatter YAML)
├── skills/          # 12 Skills (SKILL.md invocados via Skill tool)
├── commands/        # Slash commands (/ag00 - /ag38, /agM)
├── rules/           # Regras de governança (config-protection, deploy, etc.)
├── hooks/           # Shell hooks (secret-scan, branch-guard, etc.)
├── scripts/         # Scripts de automação (self-improve, harvest, etc.)
├── Playbooks/       # 11 playbooks estratégicos
├── lib/             # Bibliotecas compartilhadas
├── mcp/             # MCP server configs
├── research/        # Pesquisas e referências
└── settings.local.json  # Permissões e hooks globais
```

## Agentes (por fase do ciclo)

| Fase | Agentes |
|------|---------|
| Iniciar | ag-01 (scaffold), ag-02 (ambiente) |
| Analisar | ag-03 (explorar), ag-04 (contexto), ag-05 (pesquisar) |
| Planejar | ag-06 (spec), ag-07 (task plan) |
| Construir | ag-08 (código), ag-09 (debug), ag-10 (refactor), ag-11 (otimizar) |
| Validar | ag-12 (validar), ag-13 (testes), ag-14 (review), ag-15 (audit) |
| UX/Docs | ag-16 (UX), ag-21 (docs), ag-29 (Office), ag-31 (ortografia) |
| Dados | ag-17 (migrations) |
| Git/Deploy | ag-18 (git), ag-19 (deploy), ag-20 (monitor), ag-27 (pipeline) |
| E2E | ag-22 (Playwright), ag-36-38 (MCP, smoke) |
| Bugfix | ag-23 (batch), ag-24 (paralelo), ag-25 (triage), ag-26 (fix+verify) |
| Ops | ag-28 (saúde), ag-30 (organizar) |
| Incorporação | ag-32 (due diligence), ag-33 (mapa), ag-34 (plano), ag-35 (execução) |
| Meta | ag-00 (orquestrador), ag-M (melhorar), ag_skill-creator |

## Capabilities

- **Model routing**: haiku (scans), sonnet (implementation), opus (deep analysis)
- **Agent Teams**: coordenação multi-agente (ag-24, ag-23)
- **Task Tracking**: TaskCreate/TaskUpdate em 8 agentes
- **9 Hooks ativos**: safety (force-push, --no-verify, stash, db push, config protection, vercel --prod) + quality (post-build, post-test, post-commit)
- **Webhook n8n**: notificações de deploy e alertas
