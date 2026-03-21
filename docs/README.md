# Claude Code Universal Playbook

> Sistema completo de agents, skills, rules, hooks e melhores praticas para transformar o Claude Code em uma plataforma de desenvolvimento profissional.

## O Que E Isto

Este playbook contem todo o conhecimento operacional extraido de 155+ sessoes de desenvolvimento real com Claude Code. Ele transforma o Claude Code de um assistente passivo em um **sistema multi-agent orquestrado** com:

- **16 agents especializados** (orquestrador, builder, debugger, tester, deployer, etc.)
- **15 skills executaveis** (fix-and-commit, batch-fix, parallel-fix, deploy-pipeline, etc.)
- **7 rules de disciplina** (commits incrementais, quality gate, estado persistente, etc.)
- **4 hooks automaticos** (preflight, pre-commit, post-edit, quality check)
- **10 playbooks metodologicos** (SDD, Database-First, Seguranca, QA, etc.)

## Instalacao Rapida

```bash
# 1. Copie a pasta .claude/ para a raiz do seu projeto
cp -r .claude-template/ seu-projeto/.claude/

# 2. Crie a estrutura de estado
mkdir -p seu-projeto/docs/ai-state

# 3. Inicie o Claude Code no projeto
cd seu-projeto && claude

# 4. Teste: invoke o orquestrador
# No Claude Code, digite: /ag-M-00 analise este projeto
```

## Estrutura dos Arquivos

```
docs/claude-code-universal-playbook/
├── README.md                          ← Voce esta aqui
├── 01-SETUP-GUIDE.md                  ← Guia completo de instalacao passo a passo
├── 02-CLAUDE-MD-TEMPLATE.md           ← Template de CLAUDE.md para qualquer projeto
├── 03-AGENTS-REFERENCE.md             ← Todos os 16 agents com prompts completos
├── 04-SKILLS-REFERENCE.md             ← Todas as 15 skills com instrucoes completas
├── 05-RULES-REFERENCE.md              ← Todas as 7 rules com detalhes
├── 06-HOOKS-REFERENCE.md              ← Todos os 4 hooks com scripts
├── 07-PLAYBOOKS-METHODOLOGY.md        ← Metodologias (SDD, DB-First, QA, etc.)
├── 08-BEST-PRACTICES.md               ← Licoes aprendidas de 155+ sessoes
├── 09-DECISION-TREES.md               ← Quando usar cada agent/skill/workflow
└── 10-QUICK-START-INSTALLER.md        ← Script que cria tudo automaticamente
```

## Filosofia

### Principio 80/20
80% planejamento, 20% execucao. O Claude Code planeja com voce, depois executa com precisao.

### Principio Manus (Estado Persistente)
Context Window = RAM (volatil). Filesystem = Disco (persistente). Salvar progresso DURANTE o trabalho, nao no final.

### Principio GSD (Get Shit Done)
Comece pelo mais arriscado. Progresso visivel. Vies para acao. Tarefas atomicas. Commits incrementais.

### Principio Ralph Loop
CREATE → EVALUATE → REFINE (max 3 iteracoes). Track a melhor versao, nao a mais recente.

## Nivel de Maturidade

| Nivel | Descricao | O Que Instalar |
|-------|-----------|----------------|
| **1. Basico** | CLAUDE.md + rules | Template + 7 rules |
| **2. Intermediario** | + agents + skills | + 16 agents + 15 skills |
| **3. Avancado** | + hooks + state | + 4 hooks + persistent state |
| **4. Pro** | + playbooks + memory | + 10 playbooks + auto-memory |

Recomendacao: Comece pelo nivel 2 e evolua conforme necessidade.

## Compatibilidade

- Claude Code CLI v1.0+
- Qualquer linguagem/framework
- Windows, macOS, Linux
- Funciona com ou sem oh-my-claudecode (OMC)
