# CLAUDE.md — Workspace

> Instrucoes raiz para qualquer projeto no workspace. Este arquivo e carregado automaticamente pelo Claude Code.

---

## Visao Geral

O diretorio `~/Claude` e o workspace principal de desenvolvimento. Cada subdiretorio pode conter seu proprio projeto com CLAUDE.md especifico que herda estas regras raiz.

### Estrutura do Workspace

```
~/Claude/
├── CLAUDE.md                 # Este arquivo (regras globais)
├── .claude/                  # Configuracao Claude Code
│   ├── settings.local.json   # Permissoes
│   ├── skills/               # Skills (workflow + patterns)
│   ├── commands/             # Slash commands (ag00-ag35 + agM)
│   ├── hooks/                # Git/quality hooks
│   ├── rules/                # Regras de governanca
│   └── Playbooks/            # 11 playbooks estrategicos
├── .agents/                  # Protocolos e estado
│   ├── protocols/            # pre-flight, handoff, persistent-state
│   └── .context/             # session-state, findings, errors-log
├── .templates/               # Templates para novos projetos
├── GitHub/                   # Repos git (raiz-platform, rAIz-AI-Prof)
├── projetos/                 # Projetos standalone
├── docs/                     # Documentacao, specs, diagnosticos
│   ├── ai-state/             # Estado de sessoes AI
│   ├── diagnostico-cruzado/  # Diagnosticos tecnicos
│   └── specs/                # SPECs, pesquisas, planos avulsos
└── screenshots/              # Screenshots de referencia
```

---

## Execucao Autonoma via CLI

> **REGRA OBRIGATORIA**: O Claude Code DEVE executar todas as operacoes diretamente via CLI. NUNCA solicitar que o usuario execute manualmente.

### CLIs Disponiveis

| CLI | Uso Principal |
|-----|---------------|
| `npm` / `npx` | Pacotes, scripts, ferramentas Node.js |
| `node` | Execucao de scripts JavaScript/TypeScript |
| `python` / `pip` | Scripts Python, instalacao de pacotes |
| `git` | Versionamento, branches, commits |
| `gh` | GitHub PRs, issues, releases, actions |
| `supabase` | Migrations, DB, functions, secrets |
| `vercel` | Deploy, env vars, logs, domains |

### Comportamento Esperado
1. **Migrations**: Executar `supabase db push` ou `npm run migrate` diretamente
2. **Deploy**: Executar `vercel --prod` quando solicitado
3. **Git**: Usar `gh` para PRs, issues, e releases
4. **Secrets**: Configurar via `supabase secrets set` ou `vercel env add`
5. **Testes**: Executar `npm test` ou `pytest` diretamente

### Proibicoes
- NUNCA pedir ao usuario para executar comandos de CLI
- NUNCA sugerir que o usuario faca deploy manualmente
- NUNCA instruir o usuario a rodar migrations
- NUNCA delegar operacoes de infraestrutura

---

## Regras Criticas (Aprendidas de Sessoes Reais)

### Config Files: Merge, NUNCA Overwrite
Ao modificar arquivos de configuracao (.mcp.json, ci.yml, playwright.config.ts, .env, package.json, tsconfig.json, etc.):
1. **SEMPRE ler o conteudo atual** antes de qualquer edicao
2. **Fazer edicoes cirurgicas** — adicionar/alterar apenas o necessario
3. **NUNCA sobrescrever o arquivo inteiro** com Write tool
4. **Verificar apos a edicao** que valores existentes foram preservados
5. Se acidentalmente sobrescreveu → reverter imediatamente do git

### Deploy: Verificacao Local Obrigatoria
Antes de qualquer deploy para producao:
1. `npm run build` — verificar que nao ha erros de prerender/SSR
2. `npm run typecheck` — 0 erros
3. Verificar `.env` — sem valores corrompidos (literal `\r\n`, chaves de projeto errado)
4. NUNCA remover `force-dynamic` ou diretivas SSR sem testar build completo
5. NUNCA sobrescrever env vars de producao sem confirmar com usuario

### Debugging: Root Cause First
Ao corrigir bugs:
1. **Tracar a cadeia completa** do erro ate a causa raiz ANTES de implementar fix
2. **Verificar nomes reais** de variaveis/propriedades na classe (ex: `this.supabase` vs `this.db`)
3. **Nunca corrigir sintomas** — encontrar e corrigir a causa raiz
4. **Rodar o codigo afetado** apos o fix para confirmar que o problema foi resolvido
5. Se o fix nao resolver na primeira tentativa → reanalisar causa raiz antes de tentar novamente

### Bulk Refactors: Validar Cada Substituicao
Ao fazer find-and-replace ou refatoracoes em massa:
1. **NUNCA aplicar substituicao cega** — verificar contexto de cada ocorrencia
2. **Testar amostra primeiro** — aplicar em 2-3 arquivos, rodar testes, so entao expandir
3. **Valores semanticos**: se o valor original pode ser correto (ex: `0` em timing, `null` em optional), NAO substituir automaticamente
4. **Preferir fix individual** quando < 10 ocorrencias — entender cada caso
5. Se bulk replace quebrou testes → reverter TUDO (`git checkout -- .`) e refazer com validacao

### TypeScript: Imports e Tipagem
Ao modificar arquivos TypeScript:
1. **Remover imports nao utilizados** antes de commitar (causa erro no lint-staged)
2. **Rodar `npx tsc --noEmit`** nos arquivos modificados antes de considerar work complete
3. **Nunca ignorar erros de tipo** — resolver ou justificar explicitamente
4. **Verificar que exports removidos** nao sao usados em outros arquivos (`grep` antes de deletar)

### Deploy: Sempre via CI/CD Pipeline
Para operacoes de deploy e infraestrutura:
1. **SEMPRE usar o pipeline existente** (git → PR → CI → deploy automatico)
2. **NUNCA tentar criar tokens/credentials programaticamente** — pedir ao usuario se necessario
3. **NUNCA fazer deploy direto** (`vercel --prod`) sem pipeline — usar `gh pr create` + merge
4. **Verificar acessos antes de agir** — confirmar quais CLIs/APIs estao autenticados
5. Se credenciais estao rotacionadas/invalidas → reportar ao usuario, NAO tentar workarounds

### Pre-requisitos: Verificar Antes de Executar
Antes de iniciar qualquer tarefa de deploy ou CI/CD:
1. Verificar que git repo esta inicializado e com remote configurado
2. Verificar que credenciais/secrets estao validos (nao rotacionados)
3. Verificar que CI pipeline existe e esta funcional
4. NUNCA tentar deploy direto sem version control e CI checks

---

## Convencoes Universais de Codigo

### Naming
- **Arquivos TypeScript**: `snake_case` para logica, `PascalCase` para componentes React
- **Services**: `*.service.ts` | **Schemas**: `*.schema.ts` | **Types**: `*.types.ts`
- **Hooks React**: `use*.ts` (ex: `useAuth.ts`)
- **Componentes React**: PascalCase (ex: `ChatInput.tsx`)

### TypeScript
- Tipos explicitos, evitar `any`
- `interface` para objetos, `type` para unions/intersections
- Zod para validacao de schemas
- Strict mode como objetivo

### Git
- Commits semanticos: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- Branch naming: `feat/`, `fix/`, `refactor/`, `hotfix/`, `docs/`, `chore/`
- PRs com descricao clara e checklist

### Git Governance (automatico via hooks + rules + skills)
- **Branch**: TODA mudanca funcional em feature branch — commits em main BLOQUEADOS para codigo fonte
- **Commit**: semantico, incremental (max 5 mudancas sem commit), NUNCA `git add -A`
- **PR**: TODA mudanca funcional vai via PR (`gh pr create`), titulo conventional commit, body com checklist
- **Merge**: squash merge para features, merge commit para hotfix — SEMPRE via GitHub PR
- **Deploy**: preview via PR automatico → producao via merge em main (deploy-gate.yml)
- **Supabase**: migrations com naming `YYYYMMDDHHMMSS_desc.sql`, verificar constraints antes de criar
- **Release**: semver, changelog de conventional commits, tag + GitHub Release via `ag-18 release`
- **Protecoes**: hooks bloqueiam force push, git stash, --no-verify, supabase config push

### Formatacao
- Prettier: semi, singleQuote, tabWidth 2, trailingComma es5, printWidth 100
- ESLint: regras do framework em uso

---

## Metodologia SDD (Spec Driven Development)

> Principio 80/20: 80% planejamento, 20% execucao.

**Fluxo obrigatorio para features/refatoracoes**:

```
PRD.md → SPEC.md → Execucao → Review
```

- **PRD**: Problema, escopo, requisitos, metricas de sucesso
- **SPEC**: Plano tecnico (max **200 linhas**, dividir se maior)
- **Execucao**: Implementar seguindo o SPEC exatamente
- **Review**: Validar contra criterios, documentar decisoes

### Quando usar SDD

| Cenario | SDD? |
|---------|------|
| Nova feature | Sim |
| Bug fix complexo | Sim (simplificado) |
| Refatoracao | Sim |
| Hotfix urgente | Nao (documentar depois) |
| Quick task (< 30min) | Nao |

> Playbook detalhado: `.claude/Playbooks/01_Spec_Driven_Development.md`

---

## Quality Gates (Minimos)

Antes de declarar qualquer tarefa como concluida:

| Gate | Criterio | Comando Tipico |
|------|----------|----------------|
| Build | Sem erros | `npm run build` |
| TypeCheck | 0 erros | `npm run typecheck` ou `npx tsc --noEmit` |
| Lint | 0 erros novos | `npm run lint` |
| Tests | 0 falhas novas | `npm test` ou `pytest` |
| Security | 0 vulnerabilidades criticas | `npm audit` |

### Teste Focado (durante desenvolvimento)
Preferir execucao de teste individual para feedback rapido:
```bash
npx vitest run path/to/test.test.ts   # Um arquivo
npx vitest run --reporter=verbose      # Suite completa (somente no final)
```
NUNCA rodar `npm run test` durante desenvolvimento iterativo — somente para validacao final.

### Checklist Minimo Pos-Execucao
```bash
npm run typecheck && npm run lint && npm test
```

### Regras Anti-Teatralidade (Obrigatorias)

Ao escrever ou revisar testes:
- Cada expect() DEVE poder FALHAR em cenario real
- NUNCA: `.catch(() => false)`, `|| true`, conditional sem else, expect always-true
- SEMPRE: hard-code valores esperados, testar ambos paths (sucesso + falha)
- SEMPRE: mutation mental antes de declarar done ("se eu introduzir bug, este teste falha?")
- Ver detalhes: `.claude/rules/test-quality-enforcement.md`

### Metricas de Qualidade (CI)
- **Theatrical scan**: CI bloqueia merge se anti-patterns detectados (test-quality job)
- **Mutation testing**: Stryker roda semanalmente (mutation-testing.yml), target 80%
- **DORA metrics**: Change Fail Rate, Lead Time, Deploy Frequency (dora-metrics.yml)
- **Quality gates**: TS budget, ESLint budget, file size, npm audit (quality-gates.yml)
- **Audit local**: `bash .claude/scripts/test-quality-audit.sh [path]`

### Compaction Preservation
Ao executar `/compact`, SEMPRE incluir instrucao:
> "Preserve: lista de arquivos modificados, task atual, comandos de teste, erros encontrados"

---

## Seguranca — Regras Inegociaveis

### Banco de Dados
- **RLS** (Row Level Security) ativo em TODAS as tabelas, sem excecao
- **Audit trail** obrigatorio: tabela `audit_logs` com JSONB (quem, o que, quando, onde, resultado)
- Migrations sequenciais — nunca pular numeracao
- Indices desde o inicio (nao como afterthought)

### Dados
- **NUNCA logar**: password, token, secret, apiKey, creditCard, PII
- **LGPD**: Base legal para cada tratamento, direito ao esquecimento, minimizacao de dados
- Mascaramento automatico de PII em contexto de IA

### Niveis de Permissao (quando aplicavel)
| Nivel | Acesso |
|-------|--------|
| superadmin | Acesso total, gerencia usuarios |
| core_team | Projetos internos |
| external_agent | Projetos atribuidos |
| client | Somente leitura |

> Playbook detalhado: `.claude/Playbooks/04_Seguranca_By_Design.md`

---

## Sistema de Skills

O workspace possui 24 skills organizadas em:

### Skills de Workflow (20)
| Skill | Funcao |
|-------|--------|
| `/orquestrar` | Classificar intencao, montar workflow |
| `/explorar` | Mapear codebase, detectar stack |
| `/analisar` | Diagnosticar debitos, dependencias |
| `/projetar` | Criar spec tecnica (Ralph Loop) |
| `/planejar` | Decompor spec em tarefas atomicas |
| `/construir` | Implementar codigo |
| `/depurar` | Diagnosticar e corrigir bugs |
| `/refatorar` | Reestruturar sem mudar comportamento |
| `/testar` | Unit + integration tests |
| `/testar-e2e` | Testes E2E com Playwright |
| `/revisar` | Code review e critica |
| `/auditar` | Auditoria de seguranca e qualidade |
| `/documentar` | Documentacao tecnica |
| `/versionar` | Git commits, PRs |
| `/deploy` | Deploy e smoke tests |
| `/migrar-db` | Migracoes zero-downtime |
| `/due-diligence` | Avaliacao tecnica pre-incorporacao |
| `/mapear-integracao` | Mapa de dimensoes de integracao |
| `/planejar-incorporacao` | Roadmap de incorporacao com fases |
| `/incorporar-modulo` | Execucao de incorporacao modulo a modulo |

### Skills de Patterns (4)
| Skill | Conteudo |
|-------|----------|
| `/nextjs-react-patterns` | App Router, Server/Client Components, Tailwind |
| `/supabase-patterns` | PostgreSQL, RLS, migrations, Zod |
| `/typescript-patterns` | Strict mode, generics, utility types |
| `/python-patterns` | venv, pytest, type hints |

---

## Protocolos de Agentes

### Pre-Flight (obrigatorio antes de agir)
1. Verificar `session-state.json` — sessao anterior em andamento?
2. Ler `errors-log.md` — erros conhecidos a evitar
3. Ler `findings.md` — contexto acumulado
4. Confirmar objetivo e escopo

### Regra dos 5/10
- A cada **5 acoes**: salvar estado em `session-state.json`
- A cada **10 acoes**: reler o plano de execucao

### Persistent State
- `.agents/.context/session-state.json` — estado atual
- `.agents/.context/findings.md` — descobertas acumuladas
- `.agents/.context/errors-log.md` — erros + solucoes

---

## Gotchas & Troubleshooting

- **Vercel timeouts**: Funcoes padrao 60s, streaming 300s. Operacoes longas = background jobs
- **RLS esquecido**: Tabela nova sem RLS = dados expostos. SEMPRE incluir na migration
- **Migration sequencial**: Nunca pular numeracao. Verificar ultimo numero antes de criar
- **MCP sequential**: Um MCP por vez, nunca paralelo. Validar output antes de prosseguir
- **Bundle size**: Se build falha por tamanho, verificar imports com analyze
- **Context window**: Se respostas ficam genericas, limpar contexto (nova sessao)
- **Env vars**: Nunca hardcode secrets. Usar `.env.local` para dev, env vars do provider para prod
- **Circular imports**: Extrair types para arquivo separado
- **Sandbox mode**: Para tarefas autonomas de longa duracao, usar `claude --sandbox` que isola o ambiente (filesystem read-only exceto /tmp, sem acesso a rede). Ideal para analise de codigo, refatoracao exploratoria, e geração de specs sem risco de side effects

---

## Documentacao Hierarquica

Cada projeto no workspace pode ter:
- `CLAUDE.md` na raiz do projeto (herda regras deste arquivo)
- `CLAUDE.md` em subdiretorios (regras especificas do modulo)
- Skills adicionais em `.claude/skills/` do projeto

### Playbooks (referencia completa)
- `01_Spec_Driven_Development.md` — Metodologia SDD
- `02_Checklist_Projeto.md` — Template de novo projeto
- `03_Database_First.md` — Abordagem database-first
- `04_Seguranca_By_Design.md` — Framework de seguranca
- `05_Otimizacao_Custos_IA.md` — Selecao de modelo e custos
- `06_Desenvolvimento_Paralelo.md` — Multi-branch strategy
- `07_Quality_Assurance.md` — Pipeline de qualidade
- `08_Gestao_Memoria_Contexto.md` — Gestao de contexto
- `09_Integracao_MCPs.md` — Governanca de MCPs
- `10_Automacao_Workflows.md` — Automacao com N8N
- `11_Incorporacao_Software.md` — Incorporacao de software externo (Strangler Fig, ACL)
