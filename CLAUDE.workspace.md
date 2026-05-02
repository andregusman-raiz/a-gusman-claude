# CLAUDE.md — Workspace

> Instrucoes raiz para qualquer projeto no workspace. Este arquivo e carregado automaticamente pelo Claude Code.

---

## Matriz de Decisao — Skill vs Agent vs Machine vs Team

Use esta matriz ANTES de escolher como executar uma tarefa. Regra de ouro:
**paralelismo em escrita no mesmo repo = `isolation:"worktree"` OBRIGATORIO**.

| Cenario | Ferramenta | Isolamento | Quando usar |
|---------|-----------|-----------|-------------|
| Carregar expertise (Next.js, Supabase, etc) | Skill `/ag-referencia-*` | Mesmo contexto | Precisa de padroes/convencoes no contexto atual |
| 1 tarefa isolada de busca/analise | Agent (read-only: Explore) | Contexto isolado | Exploracao sem escrita |
| 1 feature/fix single-PR | Machine `/ag-1-construir` ou `/ag-2-corrigir` | Mesmo working tree | Entrega unica convergente |
| N tarefas read-only paralelas | N x Agent (Explore) simultaneos | Seguro sem worktree | Audit/mapping multi-repo |
| N tarefas de escrita paralelas, mesmo repo | `/ag-team-safe` | Worktree por teammate (OBRIGATORIO) | Frentes independentes simultaneas |
| N tarefas de escrita paralelas, repos diferentes | N x Agent normal | Repos separados ja isolam | Projetos independentes |
| Plano multi-PR (3+ entregas) | `/ag-0-orquestrador` fatia | Serial de ag-1 | Roadmap, execution plan |
| Build + review concorrente | `/ag-1-construir --validado` | Pair programming | Feature critica com review em tempo real |
| QA full autonomo | `/ag-7-qualidade` | Mesmo repo | 5D quality audit |
| Audit completo | `/ag-9-auditar` | Mesmo repo | 5 machines em sequencia |

### Protocolo Rewrite + Routing (obrigatorio em prompts nao-triviais)

Antes de executar, emitir preamble de 3 linhas: **Rewrite** (intent condensado) + **Rota** (ferramenta + justificativa <=15 palavras) + **Executando**.
Pular quando: comando atomico explicito, continuacao de tarefa, pergunta factual, ou flag `--go`/`--skip-routing`.
Detalhes: `.claude/rules/prompt-protocol.md`. Arvore de decisao expandida: `/ag-referencia-roteamento`.

### Regras inegociaveis de paralelismo

1. **1 terminal = 1 working tree ativo.** Se precisa de 2 terminais no mesmo repo, o segundo deve estar em `git worktree add .claude/worktrees/<nome>`.
2. **Paralelismo de escrita no mesmo repo exige worktree.** Sempre. Sem excecao.
3. **Paralelismo read-only e livre.** Explore/Grep/analise em N agents simultaneos sem risco.
4. **Max 6 teammates simultaneos** (memory safety 36GB; monitorar `memory_pressure` em warn).
5. **TeamDelete imediato** ao final — Teams vivos = memory leak + tmux orfao.
6. **Plano multi-PR nunca em ag-1 direto.** Sempre via `/ag-0-orquestrador` ou `/ag-team-safe`.
7. **Antes de spawnar team/agents paralelos:** rodar `bash ~/.claude/scripts/claude-locks-status.sh` + `bash ~/.claude/scripts/repo-health.sh <repo>`.

### Comandos utilitarios de diagnostico

```bash
# Ver locks ativos (quem esta escrevendo no que)
bash ~/.claude/scripts/claude-locks-status.sh

# Limpar locks de PIDs mortos
bash ~/.claude/scripts/claude-locks-status.sh --cleanup

# Saude de um repo (stash, dirty, branches orfas, PIDs concorrentes)
bash ~/.claude/scripts/repo-health.sh ~/Claude/GitHub/example-platform

# Limpar worktrees orfaos (roda automaticamente em Stop hook)
bash ~/.claude/scripts/worktree-prune.sh
```

### Sinal visual

Statusline mostra 🔒 quando outro processo Claude tem lock no repo atual.
Se ver o icone: NAO escrever no repo, aguardar ou mudar para outro repo/worktree.

---

## Portas Localhost por Projeto

Cada projeto tem porta fixa para evitar conflitos ao rodar simultaneamente:

| Porta | Projeto | Path | Dev Command |
|-------|---------|------|-------------|
| **3000** | example-platform | `~/Claude/GitHub/example-platform/` | `npm run dev` |
| **3001** | example-prof | `~/Claude/GitHub/example-prof/` | `npm run dev -- -p 3001` |
| **3002** | example-automata | `~/Claude/GitHub/example-automata/` | `npm run dev -- -p 3002` |
| **3003** | edu-frontend | `~/Claude/projetos/edu-frontend/app/` | `npm run dev -- -p 3003` |
| **3004** | edu-portal | `~/Claude/projetos/edu-portal/` | `npm run dev -- -p 3004` |
| **3005** | fin-platform | `~/Claude/GitHub/fin-platform/` | `npm run dev` |
| **4200** | agent-dashboard | `~/Claude/projetos/agent-dashboard/` | `npm run dev -p 4200` |

Ao rodar `dev` em qualquer projeto, usar a porta da tabela. NUNCA usar porta 3000 para mais de um projeto ao mesmo tempo.

### Abrir Localhost no Browser — SEMPRE via Playwright MCP
Para visualizar qualquer projeto localhost, SEMPRE usar Playwright MCP (Chromium isolado, headless):
```
mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:PORTA" })
```
- NUNCA usar `open http://localhost:...` (abre Safari/Chrome do sistema — nao controlavel)
- NUNCA usar `xdg-open` ou qualquer comando que abra browser do sistema
- Playwright MCP permite snapshot, screenshot, interacao e debug — superior em todos os aspectos
- Para screenshots: `browser_take_screenshot` | Para estado da pagina: `browser_snapshot`

### Playwright — Modes e Channel (canonical 2026)

| Decisao | Default | Quando mudar |
|---------|---------|--------------|
| **Browser channel** | Chromium isolado | Apenas para regression policy / codecs proprietarios / enterprise |
| **Modo execucao** | headless | `--headed` quando user pede para "ver" o fluxo |
| **Profile** | temporario isolado | `userDataDir: ~/.cache/playwright-claude/<projeto>` para QAT manual com login repetido |
| **Wait pattern** | web-first assertions (`expect().toBeVisible()`) | NUNCA `waitForTimeout` |
| **Locators** | `getByRole/getByLabel/getByText` + testid fallback | NUNCA classes CSS Tailwind |

Ao escrever/editar testes Playwright: invocar `/ag-referencia-playwright` antes.
Regras completas: `.claude/rules/browser-localhost.md` (Modes + anti-patterns).
Audit example-platform (2026-04-25): `docs/diagnosticos/playwright-audit-2026-04-25.md`.

### Login Persistente + Google SSO (16 projetos pre-configurados)

Sistema de profiles persistentes do Chromium em `~/.cache/playwright-claude/`.
**SSO Google centralizado**: 1 login Google → N apps autenticadas via OAuth.

```bash
# Setup unico (1x): login Google
bash ~/Claude/.claude/scripts/playwright-persistent-login.sh --google

# Uso diario com SSO (auto-clica "Sign in with Google")
bash ~/Claude/.claude/scripts/playwright-persistent-login.sh --sso example-platform
bash ~/Claude/.claude/scripts/playwright-persistent-login.sh --sso supabase-studio
bash ~/Claude/.claude/scripts/playwright-persistent-login.sh --sso vercel-dashboard

# Profile isolado (apps sem SSO: edu-frontend, attendance-app, github)
bash ~/Claude/.claude/scripts/playwright-persistent-login.sh edu-frontend
```

```ts
// TypeScript ad-hoc com SSO
import { loginViaGoogleSso } from '~/Claude/.claude/shared/templates/e2e/persistent-context.helper';
const { context, page } = await loginViaGoogleSso('example-platform');
```

Skill: `/ag-login-persistente`. NUNCA usar em CI — para CI usar `storageState`.

---

## Visao Geral

O diretorio `~/Claude` e o workspace principal de desenvolvimento. Cada subdiretorio pode conter seu proprio projeto com CLAUDE.md especifico que herda estas regras raiz.

### Arquitetura de 3 Camadas

O workspace usa uma arquitetura de 3 camadas para compartilhar best practices entre projetos:

```
CAMADA 1+2: WORKSPACE (.claude/)   → Agents, hooks, rules, playbooks + shared patterns/templates
CAMADA 3:   PROJECT (GitHub/<proj>)→ CLAUDE.md, skills, overrides (especificos)
```

- **Camada 1+2** define COMO trabalhar + O QUE reutilizar (tudo em `.claude/`, repo `a-gusman-claude`)
- **Camada 3** define O QUE e especifico (stack, rotas, dominio)

Projetos NAO duplicam agents, hooks ou playbooks. Referenciam `.claude/shared/patterns/` e copiam `.claude/shared/templates/`.

### Estrutura do Workspace

```
~/Claude/
├── CLAUDE.md                 # Este arquivo (regras globais)
├── .claude/                  # Camada 1: Configuracao Claude Code
│   ├── settings.local.json   # Permissoes
│   ├── skills/               # Skills (workflow + patterns)
│   ├── commands/             # Vazio (todos agents invocados via skills em skills/)
│   ├── hooks/                # Git/quality hooks
│   ├── rules/                # Regras de governanca
│   └── Playbooks/            # 11 playbooks estrategicos
│   ├── shared/               # Best practices compartilhadas (ex-.shared/, agora dentro do .claude/)
│   │   ├── templates/        # Templates copiados para projetos (12 dirs)
│   │   ├── patterns/         # Referencia tecnica (40 docs)
│   │   ├── gotchas/           # Licoes aprendidas (9 docs)
│   │   ├── adr/               # ADRs cross-project
│   │   └── sync.sh            # Propagar templates para projetos
├── GitHub/                   # Camada 3: Repos com remote GitHub configurado
│   ├── example-platform/        # Cada projeto tem CLAUDE.md + skills proprias
│   └── rAIz-AI-Prof/         # Nao duplica agents/hooks/playbooks
├── projetos/                 # Projetos sem remote GitHub (locais, experimentais, scaffolding)
├── docs/                     # Documentacao centralizada
│   ├── ai-state/             # Estado de sessoes AI
│   ├── diagnosticos/         # Diagnosticos tecnicos (15 auditorias)
│   ├── specs/                # SPECs, planos tecnicos
│   ├── pesquisas/            # Pesquisas e findings
│   └── scripts/              # Scripts utilitarios
├── assets/                   # Arquivos estaticos compartilhados
│   ├── knowledge-base/       # KB centralizada — 275 files, 50K lines, 10 sistemas
│   │   │                     # GitHub: github.com/andregusman-raiz/a-gusman-claude
│   │   ├── catalog.json      # Indice geral (1,679 records, categorias, date ranges)
│   │   ├── claude-code/      # 10 files: hooks, MCP, sub-agents, settings, CLI ref, security
│   │   ├── finnet/           # 6 files: API Universal, CNAB, EDI, Open Finance
│   │   ├── gupy-pulses/      # 9 files: R&S, admissão, clima, treinamento, TOTVS connector
│   │   ├── hubspot/          # 74 files: specs OpenAPI (71), KB (300r), guides (85r)
│   │   ├── layers/           # 42 files: Portal, Super Cantina, APIs (data, auth, payments, sync)
│   │   ├── n8n/              # 7 files: 55 REST endpoints, 192 env vars, 400+ integracoes
│   │   ├── totvs/            # 68+ files: 18 docs + 3 JSONL + 47 scraped (29 DataServers, 69 tabelas SOAP / 54 curadas em unified, 1992 campos, 9950 tabelas SQL)
│   │   ├── z-api/            # 10 files: mensagens (19 endpoints), grupos, webhooks, security
│   │   ├── zeev/             # 4 files: KB (374r), API endpoints (98r), blog (580r)
│   │   └── raiz-processos/   # 97 files: 88 solucoes em 13 areas + PRISM-Lite metodologia
│   ├── design-library/         # Design library completa — app Next.js com deploy Vercel
│   │   ├── catalog/            # App browser interativo (Raiz-Educacao-SA/design-library)
│   │   ├── elements/           # 86 layouts VibeUI (auth, hero, pricing, nav, CTA, footer, etc.)
│   │   ├── solutions/          # 24 módulos verticais (dashboards, RAG, CLM, AI tools)
│   │   ├── tokens/             # JSON tokens (colors, typography, spacing, radii, layout)
│   │   └── UI_UX/raiz-educacao-design-system.md  # design system canônico (prose, 1045 linhas)
│   ├── logos/                  # Logos vetoriais (SVG, PNG, TSX)
│   └── screenshots/            # Screenshots de referencia
└── archive/                  # Projetos e arquivos inativos
```

### Sincronizacao entre projetos
```bash
# Propagar templates para todos os projetos
bash ~/.claude/shared/sync.sh

# Propagar para projeto especifico
bash ~/.claude/shared/sync.sh ~/Claude/GitHub/example-platform
```

---

## Docs Location — projeto, nao workspace

Toda doc gerada por skill (SPEC, PRD, ADR, diagnostico, relatorio, plano) DEVE ser salva DENTRO do projeto, NUNCA em `~/Claude/docs/` raiz.

Resolver `PROJECT_ROOT` antes de salvar:
```bash
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
[ "$PROJECT_ROOT" = "$HOME/Claude" ] && exit 1   # workspace raiz nao e projeto
DEST="$PROJECT_ROOT/docs/{specs|adr|diagnosticos|plans|reports}/<slug>.md"
```

- **Hook** `~/.claude/scripts/docs-location-guard.sh` (PreToolUse Write) bloqueia salvar em `~/Claude/docs/{specs,diagnosticos,plans,adr,reports}/`.
- **Excecao legitima** (cross-project): salvar em `~/Claude/docs/workspace/...`.
- **Bypass de emergencia**: `export DOCS_GUARD_DISABLED=1`.
- **Migracao de legado**: `bash ~/.claude/scripts/migrate-orphan-docs.sh --dry-run` (depois `--apply` ou `--interactive`).
- **Pattern canonico**: `~/Claude/.claude/shared/patterns/docs-location.md`.

Skills atualizadas: `spec-writer`, `prd-writer`, `adr`, `markdown-report`, `ag-documentar-projeto`, `ag-5-documentos`.

---

## Execucao Autonoma via CLI

> **REGRA OBRIGATORIA**: O Claude Code DEVE executar todas as operacoes diretamente via CLI. NUNCA solicitar que o usuario execute manualmente.

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

### Edicoes: Verificar Persistencia no Disco
Edicoes podem ser perdidas por context compaction ou interrupcao. Prevenir:
1. Apos cada 2-3 edicoes, rodar `git diff --stat` para confirmar que estao no disco
2. Se output vazio → edicoes foram perdidas. Re-executar.
3. NUNCA acumular mais de 3 edicoes sem verificar `git diff --stat`
4. Se working tree limpo inesperadamente → verificar `git reflog -5` e `git stash list` antes de assumir "algo reverteu"
5. Antes de operacoes longas (exploracao, leitura de muitos arquivos) → commitar WIP ou pelo menos `git status`

### Deploy: Verificacao Local Obrigatoria
Antes de qualquer deploy para producao:
1. `bun run build` — verificar que nao ha erros de prerender/SSR
2. `bun run typecheck` — 0 erros
3. Verificar `.env` — sem valores corrompidos (literal `\r\n`, chaves de projeto errado)
4. NUNCA remover `force-dynamic` ou diretivas SSR sem testar build completo
5. NUNCA sobrescrever env vars de producao sem confirmar com usuario

### Debugging: Analisar Antes de Codar (OBRIGATORIO)
Ao corrigir qualquer bug, ANTES de tocar em codigo:
1. **Documentar comportamento esperado** — o que deveria acontecer?
2. **Documentar comportamento atual** — o que esta acontecendo?
3. **Listar top 3 causas raiz possiveis** com arquivos envolvidos
4. So iniciar implementacao apos completar os 3 passos acima
5. **Tracar a cadeia completa** do erro ate a causa raiz ANTES de implementar fix
6. **Verificar nomes reais** de variaveis/propriedades na classe (ex: `this.supabase` vs `this.db`)
7. **Nunca corrigir sintomas** — encontrar e corrigir a causa raiz
8. **Rodar o codigo afetado** apos o fix para confirmar que o problema foi resolvido
9. Se o fix nao resolver na primeira tentativa → reanalisar causa raiz antes de tentar novamente

### Bulk Refactors: Validar Cada Substituicao
Ao fazer find-and-replace ou refatoracoes em massa:
1. **NUNCA aplicar substituicao cega** — verificar contexto de cada ocorrencia
2. **Testar amostra primeiro** — aplicar em 2-3 arquivos, rodar testes, so entao expandir
3. **Valores semanticos**: se o valor original pode ser correto (ex: `0` em timing, `null` em optional), NAO substituir automaticamente
4. **Preferir fix individual** quando < 10 ocorrencias — entender cada caso
5. Se bulk replace quebrou testes → reverter TUDO (`git checkout -- .`) e refazer com validacao
6. **Rodar suite de testes completa** apos cada batch de 5-10 arquivos modificados — so prosseguir se todos passam

### TypeScript: Imports e Tipagem
Ao modificar arquivos TypeScript:
1. **Remover imports nao utilizados** antes de commitar (causa erro no lint-staged)
2. **Rodar `bunx tsc --noEmit`** nos arquivos modificados antes de considerar work complete
3. **Nunca ignorar erros de tipo** — resolver ou justificar explicitamente
4. **Verificar que exports removidos** nao sao usados em outros arquivos (`grep` antes de deletar)
5. **Ao corrigir erros de tipo**, verificar que o fix nao quebra tipos downstream (ex: jsPDF, libs externas com tipagem propria)

### Zero Hardcode: Sem Valores Hardcoded no Codigo
NUNCA introduzir valores hardcoded no codigo. Tudo deve ser configuravel:
1. **URLs, hosts, portas** → variaveis de ambiente (`.env`, `process.env.NOME`)
2. **API keys, tokens, secrets** → environment variables (NUNCA no codigo-fonte)
3. **Magic numbers** (timeouts, limites, thresholds) → constantes nomeadas em arquivo de config ou `.env`
4. **Strings de UI repetidas** → arquivo de constantes ou i18n
5. **IDs de terceiros** (project IDs, org IDs, webhook URLs) → environment variables
6. **Feature flags** → Edge Config ou env var, NUNCA `if (true)` / `if (false)`
7. **Ao encontrar hardcode existente** → extrair para env/config como parte do fix (nao ignorar)
8. **Excecoes aceitas**: valores semanticos obvios (`0`, `1`, `true`, `""`, HTTP status codes), defaults com fallback para env var (`process.env.PORT || 3000`)

### Deploy: Sempre via CI/CD Pipeline
Para operacoes de deploy e infraestrutura:
1. **SEMPRE usar o pipeline existente** (git → PR → CI → deploy automatico)
2. **NUNCA tentar criar tokens/credentials programaticamente** — pedir ao usuario se necessario
3. **NUNCA fazer deploy direto** (`vercel --prod`) sem pipeline — usar `gh pr create` + merge
4. **Verificar acessos antes de agir** — confirmar quais CLIs/APIs estao autenticados
5. Se credenciais estao rotacionadas/invalidas → reportar ao usuario, NAO tentar workarounds

### Pre-requisitos: Verificar Antes de Executar
Antes de iniciar qualquer tarefa de deploy, CI/CD ou operacao longa (test suites, QAT, E2E):
1. Verificar que git repo esta inicializado e com remote configurado
2. Verificar que credenciais/secrets estao validos (nao rotacionados)
3. Verificar que CI pipeline existe e esta funcional
4. NUNCA tentar deploy direto sem version control e CI checks
5. **Validar API keys e .env** antes de operacoes longas — fazer uma chamada de teste rapida para confirmar que credenciais funcionam
6. **Verificar que .env existe e e legivel** antes de rodar suites de teste — evitar desperdicio de tempo com keys expiradas
7. **Confirmar branch atual** com `git branch --show-current` antes de qualquer commit/push — NUNCA assumir branch do contexto anterior
8. **Smoke-test-first para operacoes em massa** — antes de rodar suite completa ou criar itens em batch, executar 1 item para validar ambiente (1 cenario QAT, 1 API call, 1 issue). Suites com API keys expiradas = tempo perdido.

### Comportamento Geral: Diagnostico e Analise
Ao analisar codebase ou diagnosticar problemas:
1. **Tratar inconsistencias como problemas a corrigir** — NUNCA racionalizar estado existente como "by design" a menos que o usuario confirme explicitamente
2. Se encontrar padroes misturados (naming, arquitetura, imports), assumir que precisam ser unificados
3. Perguntar ao usuario qual padrao manter, NAO decidir que ambos sao intencionais

### Dados Mock: Somente com Pedido Explicito
1. **NUNCA gerar dados mock, fake ou placeholder** a menos que o usuario peca explicitamente
2. Se testes precisam de dados de teste → perguntar ao usuario antes de criar mocks
3. Se API ainda nao existe → perguntar ao usuario se quer mock ou aguardar API real
4. Dados mock existentes no projeto sao aceitos — a regra e sobre CRIAR novos

### Integridade de Quality Gates: NUNCA Manipular Parametros
1. **NUNCA alterar parametros, thresholds ou criterios de teste** para que o codigo passe em quality gates
2. Se teste falha → corrigir o CODIGO, nao o teste/threshold
3. Se threshold e muito restritivo → reportar ao usuario, NUNCA ajustar por conta propria
4. Exemplos proibidos: relaxar regex de validacao, aumentar timeout para mascarar lentidao, reduzir cobertura minima, desabilitar regras de lint

### Autonomia Limitada: Seguir Direcao do Usuario
1. **NUNCA mudar de abordagem** sem pedir autorizacao ao usuario
2. Se a abordagem do usuario parece subotima → explicar o trade-off e PERGUNTAR, nao decidir
3. Se encontrar bloqueio na abordagem solicitada → reportar o problema e oferecer alternativas, aguardar decisao
4. NUNCA substituir a solucao pedida por outra "melhor" sem aprovacao explicita

### Gap Reporting Protocol: NUNCA Aceitar Divergencia Silenciosamente
Ao encontrar divergencia numerica, cobertura parcial, dado faltante, mapeamento incompleto, ou qualquer resultado != esperado:
1. **PROIBIDO** classificar gap como "aceitavel", "ok", "suficiente", "trivial", "desprezivel", "pode ser corrigido depois", "good enough", "por enquanto basta" SEM pergunta explicita ao usuario
2. **Formato obrigatorio** de reporte quando gap for detectado:
   - **Esperado vs Atual**: numeros exatos (ex: "4306 esperado, 4012 mapeados, 294 faltando")
   - **O que falta e por que**: causa raiz conhecida ou "investigar" quando desconhecida
   - **Opcoes**: (a) corrigir agora, (b) aceitar e documentar, (c) investigar mais
   - **Pergunta direta** ao usuario: qual opcao seguir?
3. Aplicar MESMO quando gap parecer trivial — transformar conclusao em pergunta ("Seguir assim ou investigar as N excecoes?")
4. **Bypass por turno**: so apos usuario dizer explicitamente "aceita o gap" / "pode seguir" / "ok seguir" / "autorizo" / "segue assim"
5. **Bypass de sessao** (emergencia): `export GAP_GUARD_DISABLED=1`
6. **Enforcement automatico**: hook `gap-acceptance-guard.py` (Stop hook) bloqueia fim de resposta se detectar linguagem de aceitacao + contexto de gap + ausencia de pergunta. Exit 2 obriga Claude a reescrever fechamento.
7. **Anti-padrao classico** (exemplo real): "gap de apenas 294 ativos — cobertura 93% — aceitavel, pode ser corrigido depois" → BLOQUEADO. Reformular como pergunta.

### Lint-Staged Awareness (repos com eslint --fix + prettier em pre-commit)
Repos como `example-platform` tem `lint-staged` que roda `eslint --fix` + `prettier --write` durante
`git commit`. Isso modifica silenciosamente arquivos staged — edicoes podem ser "revertidas" sem
aviso. Regras:
1. **Hook PostToolUse** (`lint-staged-preview.sh`) roda `eslint --fix` apos cada Edit/Write em
   `.ts/.tsx/.js/.jsx` em repo com lint-staged. Se hook emite aviso de modificacao → RELER o
   arquivo antes de declarar edicao completa.
2. **Antes de commitar** mudancas nao-triviais: `npx lint-staged --diff` para preview.
3. **NUNCA `--no-verify`** para contornar (viola branch-strategy) — ajustar a regra ou usar
   `eslint-disable-next-line` com justificativa.
4. Regras que mais causam reverts: `no-unused-vars`, `prefer-const`, `eqeqeq`, `import/order`,
   `prettier/prettier`. Se editou codigo envolvendo qualquer uma, espere eslint --fix agir.
5. Regra completa: `.claude/rules/lint-staged-awareness.md`.

### Multi-Agent: Isolamento Obrigatorio
Ao rodar agents paralelos ou background tasks:
1. **Health check primeiro**: `bash ~/.claude/scripts/repo-health.sh <repo-path>` — se stash >3 ou working tree dirty, PARAR e fazer triagem antes
2. **Cada agent DEVE trabalhar em diretorio/worktree separado** — NUNCA multiplos agents no mesmo working directory
3. Usar `isolation: "worktree"` para agents que modificam codigo
4. Se worktree nao for possivel, executar sequencialmente em vez de arriscar conflitos
5. **lint-staged corruption recovery**: Se lint-staged corrompeu git state → `git stash drop && git checkout -- .`. Verificar com `git status` antes de qualquer commit subsequente.
6. Regra completa: ver `.claude/rules/multi-agent-isolation.md` (R1-R5). Incidente de referencia: `docs/diagnosticos/2026-04-07-data-engine-app-wip-triage.md`

### GitHub Issues: Labels Obrigatorio
Ao criar GitHub issues ou PRs com labels:
1. **SEMPRE rodar `gh label list` antes** de aplicar qualquer label — NUNCA assumir que labels existem
2. Labels comuns que NAO existem por default: `minor`, `major`, `enhancement` (verificar por repo)
3. Se label nao existe: criar com `gh label create` ou usar label existente equivalente
4. Usar labels errados forcou multiplas re-criacoes de issues — custo alto, prevencao simples

### Pre-Flight: Verificar TUDO Antes de Executar
Antes de commits, testes, ou deploy:
1. **Branch**: `git branch --show-current` — NUNCA assumir (hooks bloqueiam commit em main)
2. **Credenciais**: `bash ~/.claude/scripts/credential-preflight.sh [root]` — NUNCA rodar testes com keys expiradas
3. **Bulk changes**: max 5 arquivos por batch, validar entre batches — NUNCA find-and-replace cego
4. **Paralelismo**: overlap = 0 E worktree obrigatorio — NUNCA 2 agents no mesmo arquivo

---

## Convencoes Universais de Codigo

### Naming & TypeScript
- **Arquivos**: `snake_case` (logica), `PascalCase` (React components) | Services: `*.service.ts` | Types: `*.types.ts`
- Tipos explicitos, evitar `any` | `interface` para objetos, `type` para unions | Zod para schemas | Strict mode

### Git & Governance
- Commits semanticos: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- Branch naming: `feat/`, `fix/`, `refactor/`, `hotfix/`, `docs/`, `chore/`
- TODA mudanca funcional em feature branch + PR (`gh pr create`) — commits em main BLOQUEADOS
- Squash merge (features), merge commit (hotfix) — SEMPRE via GitHub PR
- Commits incrementais (max 5 mudancas sem commit), NUNCA `git add -A`
- Supabase migrations: `YYYYMMDDHHMMSS_desc.sql` | Release: semver via `ag-D-18 release`

### Formatacao
- Prettier: semi, singleQuote, tabWidth 2, trailingComma es5, printWidth 100 | ESLint: regras do framework

---

> See `/ag-R-58-sdd-methodology` skill for full SDD methodology (PRD→SPEC→Execucao→Review).

---

## Quality Gates

### Checklist Minimo Pos-Execucao
```bash
bun run typecheck && bun run lint && bun run test
```

> See `/ag-R-57-quality-gates` skill for complete quality gates, anti-teatralidade rules, and CI metrics.

---

## Sistemas Preditivos

Para QUALQUER projeto que treina modelo, faz predicao, classifica, faz forecasting, scoring ou anomaly detection: invocar `/ag-referencia-anti-cycle` antes de comecar. 30 regras + tier selector + 5 criticas inegociaveis (M1 PFC, M3 LAIG, M11 Independence Audit, M16 Baseline Parity, A2 Noise-Floor Threshold). Gatilho e aplicacao: `.claude/rules/quality-systems.md`. Origem: diagnostico ultra-hard de 13 ciclos falhos em projeto preditivo real — custo acumulado ~6 meses destilado em regras universais.

---

> See `/ag-R-59-security-rules` skill for complete security rules (RLS, audit trail, LGPD, permissions).

---

## Machines (Interface Principal — 13 commands)

O sistema usa **machines autonomas** (padrao MERIDIAN: fases, convergencia, state, self-healing).
Cada machine encapsula multiplos agents internos. O usuario interage com 13 commands:

```
ag-0   ORQUESTRADOR   Gateway — classifica e delega (entry point)
ag-1   CONSTRUIR      feature, issue, refactor, otimizar, ui, integrar, --validado
ag-2   CORRIGIR       bugs, tipos, batch, debt, triage
ag-3   ENTREGAR       preview, producao, rollback
ag-4   TESTE-FINAL    qat, ux-qat, benchmark, ciclo, e2e
ag-5   DOCUMENTOS     projeto, office, organizar, ortografia
ag-6   INICIAR        projeto, ambiente, explorar, pesquisar
ag-7   QUALIDADE      MERIDIAN (5D QA autonomo, convergencia MQS >= 85)
ag-8   SEGURANCA      SENTINEL (6D security+load+LGPD, SSS >= 80)
ag-9   AUDITAR        FORTRESS (laudo completo 5 machines)
ag-10  BENCHMARK      Crawl SaaS, screenshot, AI analysis, SPEC
ag-11  DESENHAR       UI/UX design, componentes, paletas, layouts, shadcn
ag-12  SQL-TOTVS-ZEEV Otimizar queries SQL Server (TOTVS RM) + PostgreSQL + Zeev BPM
```

Na duvida: `/ag-0-orquestrador [o que quer fazer]` — ele classifica e roteia.

### TOTVS RM — Knowledge Base Estruturada (obrigatoria para integracoes)

Toda integracao com TOTVS RM DEVE consultar a KB antes de implementar:

```
~/Claude/assets/knowledge-base/totvs/
├── generated/typescript-types.ts   # 2244 linhas, 72 interfaces (import types)
├── generated/all-fields-flat.json  # 1992 campos searchable (grep campo)
├── generated/quick-reference.md    # Cheat sheet DataServer→Tabela→Campos
├── soap/dataservers-catalog.json   # 29 DataServers com campos, tipos, captions PT-BR
├── soap/dataserver-schemas/*.json  # Schema individual por DataServer
├── soap/wspageindex.json           # 15 SOAP WebServices, 214 operacoes
├── rest-api/endpoints-catalog.json # 55 endpoints REST probados
├── sql-metadata/tables.json        # 9950 tabelas com row count e tamanho
├── sql-metadata/enums/SStatus.json # 13 status matricula × 52 flags (dados reais)
├── sql-metadata/enums/SCurso.json  # 17 cursos (Colegio QI)
├── sql-metadata/enums/STurno.json  # 20 turnos
├── sql-metadata/enums/GColigada.json # 32 coligadas (31 ativas)
├── docs/DOC-1 a DOC-17             # API reference, schema, queries, regras negocio
└── totvs-scraper/                  # Scripts de extracao em ~/Claude/totvs-scraper/
```

**Regra**: Ao implementar QUALQUER feature que toque TOTVS RM:
1. Consultar `generated/all-fields-flat.json` para nomes exatos de campos
2. Usar tipos de `generated/typescript-types.ts` (nao inventar interfaces)
3. Verificar `soap/dataservers-catalog.json` para saber qual DataServer expoe a tabela
4. Consultar `sql-metadata/enums/SStatus.json` para flags de status de matricula
5. Verificar `docs/DOC-9` (licoes aprendidas) para armadilhas de integracao

### Design Library — Consulta obrigatória para UI/UX

Ao construir QUALQUER componente, página, layout ou feature de UI consulte a library ANTES de criar do zero:

```
~/Claude/assets/design-library/
├── tokens/*.json           # source of truth machine-readable (colors, typography, spacing, radii, layout)
├── elements/<NN>-<cat>/    # 86 layouts VibeUI — usar componente pronto quando aplicável
├── solutions/<NN>-<id>/    # 24 módulos verticais com spec.md — reusar padrões de produto
├── UI_UX/raiz-educacao-design-system.md  # design system canônico (paleta, regras)
└── catalog.md              # índice + regra de roteamento (elements vs solutions)
```

**Regra**: Ao implementar QUALQUER UI/UX:
1. Consultar `tokens/colors.json` para paleta (NÃO hardcodar hex)
2. Procurar em `elements/` antes de criar layouts de apresentação (auth, hero, pricing, nav, CTA, footer, etc.)
3. Procurar em `solutions/` antes de criar módulos verticais (dashboard, workflow, chat AI, etc.)
4. Consultar `UI_UX/raiz-educacao-design-system.md` para dúvidas sobre paleta, tipografia, spacing
5. Rodar `cd catalog && npm run dev -- -p 3011` para navegar visualmente quando decidir entre variantes
6. Skills: `/ag-referencia-design-presentation`, `/ag-referencia-design-library`, `/ag-referencia-redesign-workflow`, `/ag-11-ux-ui`

Deploy Vercel ativo (project `catalog` em team `andregusman-raizs-projects`). Repo: `Raiz-Educacao-SA/design-library`.

### Data Source Governance (obrigatório para SQL e análise de dados)

| Domínio | Fonte Primária | Alternativa |
|---------|---------------|-------------|
| Matrículas, educacional, financeiro, metas | **PBI_DATASET** (***REDACTED_DB***) | TOTVS RM (fallback) |
| RH, ponto, compras, contábil | **TOTVS RM** (Cloud) | — |
| HubSpot, Layers, Zeev, audit | **Neon** (PostgreSQL) | — |

**Regras obrigatórias antes de qualquer SQL:**
1. Confirmar fonte correta pelo domínio acima — NUNCA adivinhar
2. TOTVS RM: `CODCOLIGADA` obrigatório em todo WHERE
3. TOTVS RM: `(NOLOCK)` em todo FROM/JOIN de leitura
4. TOTVS RM: NUNCA `SELECT *` — expandir colunas (PFUNC=680 cols)
5. COL=10: status estendido `(14,15,25,32)` + marca por `(coligada,filial)` pair
6. Neon: paginar qualquer query >5K rows (LIMIT 1000 + OFFSET loop)
7. Schema TOTVS RM: consultar `unified/schema.json` para nomes de colunas

Ver regra completa: `.claude/rules/sql-multi-db-governance.md` | Guide PBI_DATASET: `unified/guides/pbi-app-bridge.md`

---

## Plugin Skills (25 plugins oficiais = 75+ skills)

Os plugins oficiais (Anthropic/Vercel/Sentry/Figma/Chrome DevTools/Supabase/Railway) fornecem skills
mantidas externamente. **Preferir sempre a skill oficial quando disponível** — é mais atualizada e
mantida por quem construiu a ferramenta.

### Matriz Canonical — skill oficial por capability

| Capability | Skill canonical | Machine wrapper | Substitui |
|---|---|---|---|
| Deploy Vercel (preview/prod) | `vercel:deployments-cicd` | `ag-3-entregar` | ag-pipeline-deploy |
| Env vars Vercel | `vercel:env-vars` | — | manual |
| Vercel CLI (logs, link, pull) | `vercel:vercel-cli` | — | bash manual |
| AI multi-provider / failover | `vercel:ai-gateway` | — | API key direta |
| AI SDK (streaming, tools, agents) | `vercel:ai-sdk` | — | manual |
| shadcn/ui setup + componentes | `vercel:shadcn` | `ag-11-ux-ui` | manual |
| Next.js 16 App Router | `vercel:nextjs` | — | `/ag-referencia-nextjs` |
| Next.js cache components | `vercel:next-cache-components` | — | manual |
| Verificação end-to-end | `vercel:verification` | `ag-testar-manual` | manual |
| Clerk/Auth0 setup | `vercel:auth` | — | manual |
| Chatbot multi-platform | `vercel:chat-sdk` | — | manual |
| Vercel Functions (serverless) | `vercel:vercel-functions` | — | manual |
| Code review IA (complemento) | `vercel:vercel-agent` | `ag-revisar-codigo` | — |
| Monitoring/debug produção | `sentry:sentry-workflow` | `ag-monitorar-producao` | manual |
| Question ad-hoc sobre errors | `sentry:seer` | — | — |
| Sentry SDK em projeto novo | `sentry:sentry-sdk-setup` | `ag-6-iniciar` | manual |
| Alerts/OTEL/AI instrumentation | `sentry:sentry-feature-setup` | — | manual |
| Figma → código React | `figma:figma-implement-design` | `ag-11-ux-ui` | manual |
| Gerar design system no Figma | `figma:figma-generate-library` | `ag-11-ux-ui` | manual |
| Code Connect (Figma ↔ código) | `figma:figma-code-connect` | — | manual |
| Debug browser/performance | `chrome-devtools-mcp:chrome-devtools` | `ag-testar-manual` | — |
| Otimizar LCP / Core Web Vitals | `chrome-devtools-mcp:debug-optimize-lcp` | — | manual |
| A11y audit | `chrome-devtools-mcp:a11y-debugging` | `ag-revisar-ux` | — |
| Memory leak debug | `chrome-devtools-mcp:memory-leak-debugging` | `ag-depurar-erro` | — |
| Supabase (CRUD, RLS, migrations) | `supabase:supabase` | `ag-migrar-dados` | `/ag-referencia-supabase` |
| Postgres best-practices | `supabase:supabase-postgres-best-practices` | `ag-12-sql-totvs-zeev` | — |
| Railway infra (services, DBs, deploy) | `railway:use-railway` | — | manual |
| Frontend criativo/distintivo | `frontend-design:frontend-design` | `ag-11-ux-ui` | manual |
| Apps Claude API / SDK | `claude-api` | — | manual |
| Commit + push + PR | `commit-commands:commit-push-pr` | `ag-versionar-codigo` | — |
| CLAUDE.md audit/improve | `claude-md-management:claude-md-improver` | — | manual |

### Regra de prioridade: plugin skill vs ag-x local

```
1. Tem skill oficial para o domínio? (Vercel/Sentry/Figma/Chrome/Supabase/Railway)
   └── SIM → usar skill oficial direto OU via machine wrapper (ag-N)
       ├── machine wrapper OK se: adiciona valor (orquestração, quality gates, multi-fase)
       └── machine wrapper DESNECESSÁRIO se: só passa argumentos — usar skill direto
2. NÃO tem skill oficial?
   └── usar ag-x local (machine/skill/agent)
3. Em dúvida → /ag-0-orquestrador
```

### Plugin commands (atalhos rápidos)

| Comando | Quando usar | Preferir machine? |
|---|---|---|
| `/deploy` | Deploy rápido em projeto sem pipeline | Não — use `/ag-3-entregar` |
| `/commit` | Commit rápido, repo sem branch protection | Não — use `/ag-versionar-codigo` |
| `/commit-push-pr` | Fluxo completo rápido | Caso a caso |
| `/review-pr` | Review rápido <10 arquivos | Caso a caso |
| `/code-review` | Review do diff atual | Caso a caso |
| `/feature-dev` | Feature self-contained | Não — use `/ag-1-construir` |
| `/clean_gone` | Limpar branches deletadas | Sim, seguro |
| `/seer` | Debug natural-language Sentry | Sim, canonical |
| `/handoff` | Transferir contexto de sessão | Sim |

### Plugins ativos (25)

**vercel** (25 skills), **sentry** (4 skills: workflow, seer, sdk-setup, feature-setup), **figma** (6 skills), **chrome-devtools-mcp** (6 skills), **supabase** (2 skills), **railway** (1 skill), **frontend-design**, **commit-commands**, **code-review**, **pr-review-toolkit**, **hookify**, **feature-dev**, **claude-md-management**, **slack**, **greptile**, **linear**, **context7**, **superpowers**, **agent-sdk-dev**, **security-guidance**, **playwright**, **github**, **skill-creator**, **code-simplifier**, **typescript-lsp** + **pyright-lsp**.

### MCP servers integrados

| MCP | Uso |
|---|---|
| `playwright` | **Canonical para browser/localhost** (navegação) |
| `chrome-devtools` | **Canonical para debug/perf/a11y/memory** |
| `supabase` | Database operations (complemento à skill supabase:supabase) |
| `github` | issues, PRs, releases |
| `sentry` | Events/issues (complemento à skill sentry:sentry-workflow) |
| `figma` | Figma file access (complemento à skill figma:figma-implement-design) |
| `slack`, `linear` | Notifications, project management |
| `context7` | **SEMPRE quando user pergunta lib/framework** (docs em tempo real) |

---

## Notas pós Opus 4.7 1M context

- **Prompts longos (>500 linhas) em machines são OK** — 1M context não precisa fragmentar.
- **Subagents menos necessários** para tarefas <300K tokens — preferir 1 sessão longa.
- **Reference skills `/ag-referencia-*`** perdem peso vs inline em machines. Migração gradual esperada.
- **Compact threshold** pode subir de 60% para 75% (`CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=75`).
- **Ver ADR-0001** em `.claude/shared/adr/ADR-0001-consolidacao-pos-opus-47.md` para plano completo.

---

### Skills-agents locais (58 invocáveis via Agent tool) e Reference skills (9)
Skills-agents sao chamados DENTRO das machines via `subagent_type: "ag-nome"`. Power users podem chamar direto via `/ag-nome`.
Reference skills: `/ag-referencia-nextjs`, `/ag-referencia-typescript`, `/ag-referencia-supabase`, `/ag-referencia-python`, `/ag-referencia-qualidade`, `/ag-referencia-sdd`, `/ag-referencia-seguranca-rules`, `/ag-referencia-mock-first`, `/ag-referencia-anti-cycle`, `/ag-referencia-roteamento`, `/ag-referencia-stack-decisions`, `/ag-referencia-design-library`, `/ag-referencia-design-presentation` (86 layouts de apresentação — VibeUI taxonomy, 14 categorias, código pronto em `assets/design-library/elements/`), `/ag-referencia-prompt-guide` (estrutura canônica 6-blocos para prompt de UI, templates Claude/Cursor/v0/Lovable), `/ag-referencia-redesign-workflow` (screenshot/URL → categoria + variante + preset + prompt; usa Chrome DevTools MCP + Claude multimodal).

> Gotchas & troubleshooting: see `.claude/shared/gotchas/`. Playbooks: see `.claude/Playbooks/`.

---

## Plugins (24 instalados)

### Regras de Uso
- **Plugins complementam machines** — atalhos rapidos sem pipeline/convergencia
- **`/commit` plugin NAO tem branch-guard** — preferir ag-versionar-codigo para projetos com protecao
- **ag-testar-manual prefere Playwright MCP** sobre `playwright-cli` via Bash
- **ag-0-orquestrador conhece plugins** — sugere plugin quando mais eficiente que machine

### Commands disponiveis
`/code-review`, `/review-pr`, `/commit`, `/commit-push-pr`, `/clean_gone`, `/feature-dev`, `/deploy`, `/new-sdk-app`, `/revise-claude-md`, `/hookify`, `/summarize-channel`, `/find-discussions`, `/standup`, `/seer`

### MCP Servers
context7, supabase, github, playwright, linear, greptile, slack, sentry, figma

### LSP
typescript-lsp (TS/JS), pyright-lsp (Python)

### Hooks de plugins
- `security-guidance`: reminder de seguranca ao editar (PreToolUse)
- `hookify`: regras ad-hoc via markdown (Pre/PostToolUse, Stop, UserPromptSubmit)
