# 10 — Instalador Rapido

> Copie e cole este script para instalar tudo automaticamente.

---

## Instrucoes

1. Abra o Claude Code no seu projeto
2. Cole o prompt abaixo
3. O Claude Code vai criar toda a estrutura automaticamente

---

## Prompt de Instalacao

Cole este prompt no Claude Code:

```
Instale o sistema completo de agents, skills, rules e hooks no meu projeto.
Siga as instrucoes abaixo EXATAMENTE. Crie cada arquivo com o conteudo especificado.
NAO pule nenhum passo. NAO resuma. Crie TODOS os arquivos.

## Passo 1: Criar Diretorios

mkdir -p .claude/agents
mkdir -p .claude/commands
mkdir -p .claude/rules
mkdir -p .claude/hooks
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
mkdir -p docs/ai-state

## Passo 2: Agents (16 arquivos)

Crie os 16 agents em .claude/agents/ com o conteudo do arquivo
docs/claude-code-universal-playbook/03-AGENTS-REFERENCE.md

## Passo 3: Commands (16 arquivos)

Para cada agent, crie o command correspondente em .claude/commands/:
- ag00.md: "Use the ag-M-00-orquestrar agent to classify and direct: $ARGUMENTS"
- ag01.md: "Use the ag-P-01-iniciar-projeto agent to scaffold: $ARGUMENTS"
- ag02.md: "Use the ag-P-02-setup-ambiente agent to set up: $ARGUMENTS"
- ag03.md: "Use the ag-B-03-construir-codigo agent to build: $ARGUMENTS"
- ag04.md: "Use the ag-B-04-depurar-erro agent to debug: $ARGUMENTS"
- ag05.md: "Use the ag-B-05-refatorar-codigo agent to refactor: $ARGUMENTS"
- ag06.md: "Use the ag-Q-06-validar-execucao agent to validate: $ARGUMENTS"
- ag07.md: "Use the ag-Q-07-testar-codigo agent to test: $ARGUMENTS"
- ag08.md: "Use the ag-Q-08-testar-e2e agent to E2E test: $ARGUMENTS"
- ag09.md: "Use the ag-Q-09-criticar-projeto agent to review: $ARGUMENTS"
- ag10.md: "Use the ag-Q-10-auditar-codigo agent to audit: $ARGUMENTS"
- ag11.md: "Use the ag-Q-11-revisar-ux agent to review UX: $ARGUMENTS"
- ag12.md: "Use the ag-D-12-migrar-dados agent to migrate: $ARGUMENTS"
- ag13.md: "Use the ag-D-13-publicar-deploy agent to deploy: $ARGUMENTS"
- ag14.md: "Use the ag-W-14-documentar-projeto agent to document: $ARGUMENTS"
- agM.md: "Use the ag-M-99-melhorar-agentes agent to analyze and improve: $ARGUMENTS"

## Passo 4: Rules (7 arquivos)

Crie as 7 rules em .claude/rules/ com o conteudo do arquivo
docs/claude-code-universal-playbook/05-RULES-REFERENCE.md

## Passo 5: Skills (14 SKILL.md)

Crie os 14 SKILL.md em seus respectivos diretorios com o conteudo do arquivo
docs/claude-code-universal-playbook/04-SKILLS-REFERENCE.md

## Passo 6: Hooks

Crie .claude/hooks.json e os 4 scripts .sh com o conteudo do arquivo
docs/claude-code-universal-playbook/06-HOOKS-REFERENCE.md
Torne os scripts executaveis: chmod +x .claude/hooks/*.sh

## Passo 7: Estado Inicial

Crie docs/ai-state/session-state.json com:
{
  "last_updated": "",
  "agent_active": "",
  "task_description": "",
  "progress": { "completed": [], "in_progress": "", "remaining": [] },
  "files_modified": [],
  "notes": ""
}

Crie docs/ai-state/errors-log.md vazio.

## Passo 8: CLAUDE.md

Se o projeto NAO tem CLAUDE.md, crie um baseado no template em
docs/claude-code-universal-playbook/02-CLAUDE-MD-TEMPLATE.md
Personalize para a stack detectada no projeto.

## Passo 9: Verificar

Apos criar tudo, liste todos os arquivos criados e confirme que estao corretos.
Reporte: quantos agents, skills, rules e hooks foram instalados.
```

---

## Verificacao Pos-Instalacao

Apos a instalacao, verifique:

```bash
# Contar arquivos criados
echo "Agents:" && ls .claude/agents/ | wc -l
echo "Commands:" && ls .claude/commands/ | wc -l
echo "Rules:" && ls .claude/rules/ | wc -l
echo "Hooks:" && ls .claude/hooks/ | wc -l
echo "Skills:" && find .claude/skills/ -name "SKILL.md" | wc -l
```

Resultado esperado:
- Agents: 16
- Commands: 16
- Rules: 7
- Hooks: 5 (4 .sh + hooks.json)
- Skills: 14

---

## Teste Rapido

No Claude Code, teste cada tipo de invocacao:

```
# Teste orquestrador
/ag00 analise o estado deste projeto

# Teste builder
/ag03 crie um arquivo hello-world de teste

# Teste skill
/fix-and-commit (depois de fazer uma mudanca)

# Teste discovery
/discovery explore este projeto
```

---

## Personalizacao

Apos instalar, personalize para seu projeto:

### 1. CLAUDE.md
- Substitua [CUSTOMIZE] com detalhes do seu projeto
- Adicione comandos especificos da sua stack
- Liste gotchas do seu ambiente

### 2. Hooks
- Ajuste a versao do Node no preflight-check.sh
- Ajuste extensoes de arquivo no pre-commit-check.sh (.py, .go, .rs)
- Adicione checks especificos do seu ambiente

### 3. Skills
- Ajuste comandos de typecheck/lint para sua stack
- Ajuste runner de testes (jest, pytest, go test, cargo test)
- Ajuste comando de deploy (vercel, railway, fly, docker)

### 4. Rules
- Ajuste paths nas rules para sua estrutura de diretorios
- Adicione convencoes especificas do seu time

---

## Niveis de Instalacao

Se nao quiser instalar tudo de uma vez:

### Nivel 1: Basico (5 min)
- CLAUDE.md
- Rules: gsd, commit-conventions, incremental-commits

### Nivel 2: Intermediario (15 min)
- + Agents: ag-00, ag-03, ag-04, ag-07
- + Commands: ag00, ag03, ag04, ag07
- + Skills: fix-and-commit, batch-fix, testing

### Nivel 3: Avancado (30 min)
- + Todos os 16 agents e commands
- + Todas as 14 skills
- + Todas as 7 rules

### Nivel 4: Pro (45 min)
- + 4 hooks com hooks.json
- + Estado persistente (docs/ai-state/)
- + CLAUDE.md hierarquico (sub-CLAUDE.md por modulo)

---

## FAQ

**P: Funciona com Python/Go/Rust/Java?**
R: Sim. Os agents e skills sao agnsoticos de linguagem. Ajuste os comandos de typecheck/lint/test para sua stack.

**P: Preciso de todos os 16 agents?**
R: Nao. Comece com ag-00 (orquestrador), ag-03 (builder), ag-04 (debugger), ag-07 (tester). Adicione conforme necessidade.

**P: Funciona no Windows?**
R: Sim. Os hooks .sh precisam de Git Bash ou WSL. O restante funciona nativo.

**P: Posso personalizar os agents?**
R: Sim. Os agents sao arquivos .md — edite livremente. O ag-M (meta-improver) ajuda a melhorar agents com base em erros recorrentes.

**P: Como atualizar?**
R: Copie os arquivos novos. Os agents, skills e rules sao independentes — voce pode atualizar um sem afetar os outros.

**P: Conflita com oh-my-claudecode (OMC)?**
R: Nao. OMC e uma camada complementar. Os agents/skills/rules funcionam independentemente.
