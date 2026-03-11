# 01 — Guia Completo de Instalacao

> Passo a passo para configurar o Claude Code com todo o sistema de agents, skills, rules e hooks.

---

## Pre-Requisitos

- Claude Code CLI instalado (`npm install -g @anthropic-ai/claude-code` ou via installer)
- Git inicializado no projeto
- Node.js (recomendado v20.x para projetos JS/TS)

---

## Passo 1: Criar Estrutura de Diretorios

Na raiz do seu projeto, crie:

```bash
mkdir -p .claude/agents
mkdir -p .claude/commands
mkdir -p .claude/skills/fix-and-commit
mkdir -p .claude/skills/batch-fix
mkdir -p .claude/skills/parallel-fix
mkdir -p .claude/skills/diagnose-bugs
mkdir -p .claude/skills/testing
mkdir -p .claude/skills/e2e-testing
mkdir -p .claude/skills/deploy
mkdir -p .claude/skills/deploy-pipeline
mkdir -p .claude/skills/migration
mkdir -p .claude/skills/security-audit
mkdir -p .claude/skills/design
mkdir -p .claude/skills/discovery
mkdir -p .claude/skills/documentation
mkdir -p .claude/skills/ux-review
mkdir -p .claude/rules
mkdir -p .claude/hooks
mkdir -p docs/ai-state
```

---

## Passo 2: Criar CLAUDE.md (Instrucoes do Projeto)

Copie o template de `02-CLAUDE-MD-TEMPLATE.md` e personalize para seu projeto. O CLAUDE.md vai na raiz do projeto.

```bash
cp docs/claude-code-universal-playbook/02-CLAUDE-MD-TEMPLATE.md ./CLAUDE.md
# Edite CLAUDE.md com detalhes do seu projeto
```

---

## Passo 3: Instalar Agents

Copie cada arquivo de agent para `.claude/agents/`. Veja o conteudo completo em `03-AGENTS-REFERENCE.md`.

Os 16 agents necessarios:

| Arquivo | Funcao |
|---------|--------|
| `ag-M-00-orquestrar.md` | Classificar e direcionar (nunca executa) |
| `ag-P-01-iniciar-projeto.md` | Scaffolding de projeto novo |
| `ag-P-02-setup-ambiente.md` | Docker, CI, env vars |
| `ag-B-03-construir-codigo.md` | **Builder principal** — implementar codigo |
| `ag-B-04-depurar-erro.md` | Debugger — causa raiz, nao sintomas |
| `ag-B-05-refatorar-codigo.md` | Refatoracao — recusa sem testes |
| `ag-Q-06-validar-execucao.md` | Validador — checa completude |
| `ag-Q-07-testar-codigo.md` | Tester — unit + integration |
| `ag-Q-08-testar-e2e.md` | E2E — Playwright, APIs reais |
| `ag-Q-09-criticar-projeto.md` | Code reviewer — questiona decisoes |
| `ag-Q-10-auditar-codigo.md` | Security — OWASP Top 10 |
| `ag-Q-11-revisar-ux.md` | UX — acessibilidade, mobile |
| `ag-D-12-migrar-dados.md` | Migrations — zero downtime |
| `ag-D-13-publicar-deploy.md` | Deploy + versionamento |
| `ag-W-14-documentar-projeto.md` | Documentacao com exemplos reais |
| `ag-M-99-melhorar-agentes.md` | Meta — melhora os outros agents |

---

## Passo 4: Instalar Commands (Atalhos)

Para cada agent, crie um command shortcut em `.claude/commands/`:

```bash
# Para cada agente (ag00 ate ag14 + agM), crie um arquivo simples:
echo 'Use the ag-M-00-orquestrar agent to classify and direct: $ARGUMENTS' > .claude/commands/ag00.md
echo 'Use the ag-P-01-iniciar-projeto agent to scaffold: $ARGUMENTS' > .claude/commands/ag01.md
echo 'Use the ag-P-02-setup-ambiente agent to set up: $ARGUMENTS' > .claude/commands/ag02.md
echo 'Use the ag-B-03-construir-codigo agent to build: $ARGUMENTS' > .claude/commands/ag03.md
echo 'Use the ag-B-04-depurar-erro agent to debug: $ARGUMENTS' > .claude/commands/ag04.md
echo 'Use the ag-B-05-refatorar-codigo agent to refactor: $ARGUMENTS' > .claude/commands/ag05.md
echo 'Use the ag-Q-06-validar-execucao agent to validate: $ARGUMENTS' > .claude/commands/ag06.md
echo 'Use the ag-Q-07-testar-codigo agent to test: $ARGUMENTS' > .claude/commands/ag07.md
echo 'Use the ag-Q-08-testar-e2e agent to E2E test: $ARGUMENTS' > .claude/commands/ag08.md
echo 'Use the ag-Q-09-criticar-projeto agent to review: $ARGUMENTS' > .claude/commands/ag09.md
echo 'Use the ag-Q-10-auditar-codigo agent to audit: $ARGUMENTS' > .claude/commands/ag10.md
echo 'Use the ag-Q-11-revisar-ux agent to review UX: $ARGUMENTS' > .claude/commands/ag11.md
echo 'Use the ag-D-12-migrar-dados agent to migrate: $ARGUMENTS' > .claude/commands/ag12.md
echo 'Use the ag-D-13-publicar-deploy agent to deploy: $ARGUMENTS' > .claude/commands/ag13.md
echo 'Use the ag-W-14-documentar-projeto agent to document: $ARGUMENTS' > .claude/commands/ag14.md
echo 'Use the ag-M-99-melhorar-agentes agent to analyze and improve: $ARGUMENTS' > .claude/commands/agM.md
```

Agora voce pode invocar agents com `/ag03 implemente a feature X`.

---

## Passo 5: Instalar Skills

Copie cada SKILL.md para o diretorio correspondente. Veja conteudo completo em `04-SKILLS-REFERENCE.md`.

Skills essenciais (instale estas primeiro):

| Skill | Quando Usar |
|-------|-------------|
| `fix-and-commit` | 1 fix simples → validar → commitar |
| `batch-fix` | 3-5 bugs sequenciais com checkpoints |
| `parallel-fix` | 6+ bugs independentes (worktree isolation) |
| `diagnose-bugs` | Ler bugs, classificar, planejar (sem executar) |
| `testing` | Criar testes unit + integration |
| `deploy-pipeline` | Pipeline completo: typecheck → lint → test → build → deploy |

Skills complementares:

| Skill | Quando Usar |
|-------|-------------|
| `e2e-testing` | Testes Playwright com APIs reais |
| `deploy` | Deploy controlado com smoke test + monitoring |
| `migration` | Alteracoes de schema sem downtime |
| `security-audit` | Auditoria OWASP Top 10 |
| `design` | Especificar solucao tecnica + task_plan.md |
| `discovery` | Explorar codebase desconhecido |
| `documentation` | Docs com exemplos que funcionam |
| `ux-review` | Review de UX e acessibilidade |

---

## Passo 6: Instalar Rules

Copie cada rule para `.claude/rules/`. Veja conteudo completo em `05-RULES-REFERENCE.md`.

| Rule | O Que Faz |
|------|-----------|
| `gsd.md` | Disciplina de execucao — comece pelo mais arriscado, progresso visivel |
| `commit-conventions.md` | Commits semanticos: feat/fix/refactor/docs/test/chore |
| `incremental-commits.md` | Commit a cada 3-5 fixes, nunca acumular >5 |
| `quality-gate.md` | Self-check antes de declarar completo |
| `persistent-state.md` | Salvar estado a cada 20 actions, re-ler plano a cada 30 |
| `ralph-loop.md` | CREATE → EVALUATE → REFINE (max 3 ciclos) |
| `agent-boundaries.md` | Ownership exclusivo de arquivos em execucao paralela |

---

## Passo 7: Instalar Hooks

### 7a. Criar hooks.json

```bash
cat > .claude/hooks.json << 'EOF'
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/preflight-check.sh 2>/dev/null || true"
          }
        ]
      }
    ]
  }
}
EOF
```

### 7b. Criar scripts de hook

Veja `06-HOOKS-REFERENCE.md` para o conteudo completo de cada script:

- `preflight-check.sh` — Health check na sessao (Node version, processos, OOM)
- `post-edit-check.sh` — Lembrete para salvar estado a cada 5 edicoes
- `pre-commit-check.sh` — Rodar testes relacionados antes de commit
- `quality-check.sh` — Verificar estado ao final da sessao

```bash
chmod +x .claude/hooks/*.sh
```

---

## Passo 8: Criar Estado Inicial

```bash
cat > docs/ai-state/session-state.json << 'EOF'
{
  "last_updated": "",
  "agent_active": "",
  "task_description": "",
  "progress": {
    "completed": [],
    "in_progress": "",
    "remaining": []
  },
  "files_modified": [],
  "notes": ""
}
EOF

touch docs/ai-state/errors-log.md
```

---

## Passo 9: Configurar Permissoes (Opcional)

Crie `.claude/settings.local.json` para permitir comandos automaticamente:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(npx tsc *)",
      "Bash(npx eslint *)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(git status *)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(node *)",
      "Bash(ls *)",
      "Bash(mkdir *)",
      "Bash(cat *)"
    ]
  }
}
```

Adicione mais permissoes conforme sua stack (vercel, supabase, gh, docker, etc.).

---

## Passo 10: Verificar Instalacao

No Claude Code, rode:

```
/ag00 analise o estado deste projeto e verifique se o sistema de agents esta configurado
```

O orquestrador deve:
1. Detectar os agents instalados
2. Verificar a estrutura de diretorios
3. Reportar o que esta pronto e o que falta

---

## Estrutura Final

```
seu-projeto/
├── .claude/
│   ├── agents/          (16 arquivos .md)
│   ├── commands/        (16 arquivos .md)
│   ├── skills/          (14+ diretorios com SKILL.md)
│   ├── rules/           (7 arquivos .md)
│   ├── hooks/           (4 scripts .sh)
│   ├── hooks.json       (configuracao de hooks)
│   └── settings.local.json (permissoes)
├── docs/
│   └── ai-state/
│       ├── session-state.json
│       └── errors-log.md
└── CLAUDE.md            (instrucoes do projeto)
```

---

## Troubleshooting

| Problema | Solucao |
|----------|---------|
| Commands nao aparecem | Reiniciar Claude Code (os commands sao carregados no startup) |
| Hooks nao executam | Verificar `chmod +x` nos scripts .sh |
| Agent nao encontrado | Verificar que o arquivo .md esta em `.claude/agents/` |
| Skills nao ativam | Verificar que SKILL.md existe dentro do diretorio da skill |
| Estado nao persiste | Verificar que `docs/ai-state/` existe e eh gravavel |
| Windows: scripts .sh | Instalar Git Bash ou usar WSL |
