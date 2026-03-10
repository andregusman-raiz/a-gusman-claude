## Diagnostico — Gestao de Arquivos raiz-platform — 2026-03-08

**Escopo**: Analise de organizacao, duplicacoes, orfaos, convencoes e gitignore.
**Projeto**: `/Users/andregusmandeoliveira/Claude/GitHub/raiz-platform/`
**Stack**: Next.js 14 App Router, TypeScript, Supabase, Tailwind, Vercel
**Numeros**: ~4.085 arquivos em `src/`, ~1.248 arquivos de teste, ~525 skills em `.agents/`

---

### P0 — Critico (resolver antes de prosseguir)

1. **55 arquivos deletados do `.claude/` nao commitados**
   - `git status` mostra 55 arquivos com status `D` (deleted) em `.claude/Playbooks/`, `.claude/agents/`, `.claude/rules/`, `.claude/skills/`, `.claude/commands/`.
   - Esses arquivos existem no git mas foram removidos localmente. Estado inconsistente: quem clonar o repo tera arquivos que a maquina local nao tem.
   - **Impacto**: Colaboradores terao configs diferentes. Automacoes que referenciam esses arquivos podem falhar.
   - **Exemplos**: `.claude/Playbooks/01_Spec_Driven_Development.md` a `10_Automacao_Workflows.md`, todos os agents `ag-00` a `ag-08`, skills e commands.

2. **ThreadContext duplicado com semantica ambigua**
   - `src/context/ThreadContext.tsx` — thread CRUD/listing (raiz).
   - `src/context/chat/ThreadContext.tsx` — thread de chat (subcontexto).
   - O arquivo `chat/ThreadContext.tsx` tem um comentario "Distinct from src/context/ThreadContext.tsx" mas ambos exportam `ThreadContext`-related hooks. Risco de import errado.
   - **Impacto**: Desenvolvedores podem importar o errado sem perceber. Auto-import do IDE pode escolher qualquer um.

3. **CommandPalette triplicado (3 copias)**
   - `src/components/chat/CommandPalette.tsx` — 365 linhas
   - `src/components/shared/CommandPalette.tsx` — 485 linhas
   - `src/components/common/CommandPalette.tsx` — 468 linhas
   - Tres versoes do mesmo componente em dirs diferentes, com tamanhos similares mas nao identicos.
   - **Impacto**: Bug fix em uma copia nao propaga para as outras. Comportamento inconsistente na UI.

---

### P1 — Alto (resolver nesta sprint)

4. **4 pastas de componentes genericos sobrepostas: `shared/`, `common/`, `ui/`, `core/`**
   - `src/components/shared/` — Logo, MermaidDiagram, UserFooter, CommandPalette
   - `src/components/common/` — BottomSheet, CommandPalette, GuidedTour
   - `src/components/ui/` — PageLoading
   - `src/components/core/` — Button, Input, Modal, Skeleton
   - Sem criterio claro de quando usar cada uma. Um design system deveria estar em uma unica pasta.
   - **Impacto**: Confusao sobre onde criar novos componentes compartilhados.

5. **Componentes orfaos — 0 imports externos em 5 diretorios**
   - `src/components/thread/` — ThreadList, ThreadItem (0 imports fora da propria pasta)
   - `src/components/workflow/` — WorkflowBuilder (0 imports)
   - `src/components/layout/` — Header (0 imports)
   - `src/components/integrations/` — IntegrationList, IntegrationCard, etc. (0 imports)
   - `src/components/ops/` — JobTimeline (0 imports)
   - **Impacto**: Codigo morto que aumenta bundle e confunde navegacao.

6. **WhatsApp em 3+ locais com versoes sobrepostas**
   - `src/lib/services/whatsapp.service.ts` — servico original
   - `src/lib/services/whatsapp-v2/` — 15+ arquivos (ainda importado por webhook, repository, v3)
   - `src/lib/services/whatsapp-v3/` — 40+ arquivos (versao atual)
   - `src/lib/whatsapp/` — provider, adapter, types (importa de v2!)
   - `src/lib/services/whatsapp-linking.service.ts` — avulso
   - **Impacto**: v2 ainda tem imports ativos (8 arquivos), impossibilitando remocao limpa. Debito tecnico acumulando.

7. **`chrome-extension/` e `extension/` — dois projetos de extensao na raiz**
   - `chrome-extension/` — webpack, package.json proprio
   - `extension/` — vite, package.json proprio
   - Ambos com `manifest.json`, `tsconfig.json` independentes. Parecem ser versoes diferentes do mesmo conceito.
   - **Impacto**: Duplicacao de esforco, confusao sobre qual e a "oficial".

8. **Root-level sprawl — 20+ diretorios nao-padrao na raiz**
   - Diretorios que deveriam estar dentro de `src/`, `docs/`, ou serem subprojetos separados:
     - `Agentes Plataforma/` (espaco no nome!)
     - `ceo_grafico/` (Python com `__pycache__`)
     - `playground/` (13 HTMLs avulsos)
     - `coverage-litigation/` (gitignored mas tracked)
     - `services/` (Python: lightning-training, lightning-collector)
     - `raiz-bugs/` (deveria estar em docs/ ou roadmap/)
     - `clm/` (duplica? ou config extra?)
     - `config/` (raiz), `data/` (raiz)
   - **Impacto**: Raiz poluida. `ls` retorna 89 itens. Dificulta onboarding.

---

### P2 — Medio (backlog)

9. **Arquivos rastreados pelo git que deveriam ser ignorados**
   - `jest.orphaned-tests.json` — tracked, deveria ser gerado/temporario
   - `package-lock.json.bak` — 1.5MB de backup no repo
   - `.gitignore` cobre `coverage-litigation/`, `storybook-static/`, `test-results-json/` etc., mas eles existem no filesystem (possivelmente tracked antes de serem adicionados ao .gitignore)
   - Scripts Python avulsos na raiz: `_write_report.py`, `parse_errors.py` (gitignored mas presentes)
   - **Impacto**: Repo inchado. `git clone` traz lixo.

10. **Tipos em 2 locais sem criterio claro**
    - `src/types/` — index.ts, external/google.types.ts, external/hubspot.types.ts
    - `src/lib/types/` — result.ts
    - Alem disso, 18 arquivos `*.types.ts` espalhados por `src/lib/` em pastas especificas.
    - **Impacto**: Sem convencao unica. Novos tipos podem ir para qualquer lugar.

11. **Testes em 3 padroes de localizacao simultaneos**
    - `__tests__/` colocated (130+ dirs) — usado por API routes e lib
    - `tests/` top-level — e2e, integration, performance, unit
    - `*.test.ts` inline (colocated ao lado do arquivo) — menos comum
    - **Impacto**: O padrao colocated (`__tests__/`) e dominante e funciona, mas `tests/` top-level mistura unit, integration e e2e, fragmentando a localizacao.

12. **`.agents/skills/` com 525 skills — maioria parecem ser default/nao-curadas**
    - Skills como `dwarf-expert`, `address-sanitizer`, `senior-security`, `hive-mind-advanced`, `responsive-design` nao parecem especificas do projeto.
    - **Impacto**: Poluicao de contexto. Se skills sao carregadas on-demand, 525 e excessivo para lookup.

13. **EmptyState duplicado em 4 locais (social-media)**
    - `src/components/social-media/inbox/EmptyState.tsx`
    - `src/components/social-media/sources/EmptyState.tsx`
    - `src/components/social-media/automations/EmptyState.tsx`
    - `src/components/social-media/reports/EmptyState.tsx`
    - Componentes provavelmente similares com texto diferente.
    - **Impacto**: Componente generico `EmptyState` deveria existir em `shared/` com props de customizacao.

14. **3 configs de Playwright + 3 configs de Jest na raiz**
    - Playwright: `playwright.config.ts` (19KB!), `playwright.docs-test.config.ts`, `playwright.e2e-only.config.ts`
    - Jest: `jest.config.js`, `jest.integration.config.js`, `jest.polyfills.ts`, `jest.setup.ts`, `jest.orphaned-tests.json`
    - **Impacto**: Config sprawl na raiz. O playwright.config.ts de 19KB sugere complexidade acumulada.

15. **`_helpers.ts` em 7 locais de API route sem padrao de compartilhamento**
    - `src/app/api/social-media/_helpers.ts`
    - `src/app/api/lit/_helpers.ts`
    - `src/app/api/admin/_helpers.ts`
    - `src/app/api/hubspot/_helpers.ts`
    - `src/app/api/n8n/webhooks/_helpers.ts`
    - `src/app/api/dpos/_helpers.ts`
    - `src/app/api/clm/_helpers.ts`
    - **Impacto**: Provavelmente contem auth helpers, validation helpers duplicados entre si. Helpers compartilhados deveriam estar em `src/lib/api/`.

---

### P3 — Desejavel (quando houver tempo)

16. **`src/data/` com 3 arquivos avulsos**
    - `email-templates-education.ts`, `analysis-templates.json`, `automation-templates.json`
    - Nao e claro se pertencem a `src/data/` ou a `src/lib/constants/` ou a um modulo especifico.
    - **Impacto**: Cosmetico, mas confuso para quem navega.

17. **`src/remotion/` — video generation isolado**
    - Contem compositions e components para video (CorporateIntro, Explainer, etc.).
    - Tem `remotion.config.ts` na raiz do projeto.
    - **Impacto**: Modulo niche. Se nao esta em uso ativo, pode ser candidato a subprojeto ou remocao.

18. **`src/mocks/` vs `src/__mocks__/` vs `__mocks__/` (raiz)**
    - 3 locais de mocks com propositos diferentes:
      - `__mocks__/sharp.ts` — mock de modulo Node (raiz, para Jest)
      - `src/__mocks__/fileMock.js`, `styleMock.js` — mocks de assets (Jest)
      - `src/mocks/handlers/` — MSW handlers (runtime mocks)
    - **Impacto**: Cada um tem proposito, mas a separacao nao e documentada.

19. **Diretorio `Agentes Plataforma/` com espaco no nome**
    - 15 subdiretorios com definicoes de agentes de negocio.
    - Nome com espaco viola convencoes de naming e causa problemas em scripts shell.
    - **Impacto**: Problemas com tooling que nao escapa paths corretamente.

20. **`agents/` (raiz) duplica conceito de `.claude/agents/` (deletado)**
    - `agents/` contem 24 agents (ag-00 a ag-22 + ag-M) + protocols + scripts.
    - `.claude/agents/` estava tracked mas foi deletado localmente (parte dos 55 arquivos D).
    - **Impacto**: Duas hierarquias de agents. Precisa definir qual e canonica.

---

### Resumo Quantitativo

| Metrica | Valor |
|---------|-------|
| Arquivos em src/ | ~4.085 |
| Arquivos de teste | ~1.248 |
| Diretorios na raiz | 89 (deveria ser ~15-20) |
| Nomes duplicados em src/ | 30+ (CommandPalette 3x, EmptyState 4x, etc.) |
| Componentes orfaos (0 imports) | 5 diretorios |
| Skills em .agents/ | 525 (maioria nao-curada) |
| Versoes WhatsApp ativas | 3+ (v1, v2, v3 + lib) |
| Arquivos .claude deletados nao-commitados | 55 |
| Configs de teste na raiz | 8 (3 playwright + 5 jest) |
| Pastas de componentes genericos | 4 (shared, common, ui, core) |
