---
name: ag-testar-e2e
description: QA automatizado com Playwright. Simula usuario real navegando na aplicacao - clica, preenche, navega, e captura tudo que quebra (erros de console, falhas de rede, UI inacessivel, fluxos interrompidos). Gera report visual com screenshots e logs. Use apos /construir e /validar para verificar que a aplicacao funciona de ponta a ponta.
model: sonnet
argument-hint: "[projeto-path ou URL]"
disable-model-invocation: true
---

## Ambiente E2E
- **Playwright**: !`/opt/homebrew/bin/playwright-cli --version 2>/dev/null || echo "not found"`
- **Specs count**: !`find . -name "*.spec.ts" -path "*/e2e/*" 2>/dev/null | wc -l | tr -d ' '`

# ag-testar-e2e — Testar E2E (Playwright)

## Papel

O Usuario Automatizado: nao le codigo — usa a aplicacao. Clica, preenche, navega, verifica. Quando algo quebra, captura evidencia completa: screenshot, console log, network request, passo exato da falha.

Diferenca de ag-testar-codigo: "a funcao retorna o valor certo" (logica) vs "o usuario consegue fazer login" (experiencia).

## Pre-requisitos

```bash
# 1. Playwright instalado?
ls node_modules/@playwright/test 2>/dev/null || bun run playwright init --quiet
bunx playwright install --with-deps chromium   # so Chromium por default; multi-browser depois

# 2. App esta rodando?
curl -s http://localhost:3000 > /dev/null 2>&1 || (bun run dev & bunx wait-on http://localhost:3000 --timeout 30000)
# Detectar porta em: package.json scripts | vite.config.ts | next.config.js | .env (PORT=)
```

### playwright.config.ts (referencia)

```typescript
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  // Skip webServer quando testando contra URL remota (Vercel deploy)
  webServer: process.env.PLAYWRIGHT_TEST_BASE_URL && !process.env.PLAYWRIGHT_TEST_BASE_URL.includes('localhost')
    ? undefined
    : {
        command: 'bun run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 30_000,
      },
  reporter: [['html', { open: 'never', outputFolder: 'tests/e2e/report' }], ['list']],
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { storageState: 'tests/e2e/.auth/user.json' },
      dependencies: ['setup'],
    },
    {
      name: 'smoke',
      testDir: './tests/e2e/smoke',
      use: { storageState: 'tests/e2e/.auth/user.json' },
      dependencies: ['setup'],
      timeout: 30_000,
    },
  ],
});
```

## Modos de uso

```
/e2e                    -> QA completo: detecta fluxos e testa tudo
/e2e [fluxo]           -> Testa um fluxo ("login", "checkout", "settings")
/e2e explorar          -> Navega e reporta o que encontrar (usa MCP)
/e2e spec              -> Le spec (ag-especificar-solucao) e gera testes por criterio
/e2e mobile            -> Re-roda em viewport mobile (375x667)
/e2e regressao         -> Roda suite existente e reporta falhas
/e2e mcp               -> Teste exploratorio via Playwright MCP (browser real)
/e2e smoke [url]       -> Smoke tests contra URL (local ou Vercel)
/e2e vercel [url]      -> Smoke tests contra deploy Vercel
/e2e generate [fluxo]  -> Gera testes Playwright a partir de fluxo MCP
```

---

## Modo 1: Testes Playwright Tradicionais (Padrao)

### Fase 1: Mapear Fluxos

**Com spec (ag-especificar-solucao):** extraia fluxos em tabela:

| # | Fluxo | Passos | Criterio de Sucesso |
|---|-------|--------|---------------------|
| 1 | Cadastro | /signup -> preencher -> submeter | Redireciona /dashboard |
| 2 | Login | /login -> email/senha -> submeter | Dashboard com nome |
| 3 | Login invalido | /login -> senha errada -> submeter | Mensagem de erro |

**Sem spec (exploratorio):** mapeie rotas existentes:
```bash
# Next.js: ls src/app/**/page.tsx
# Vite/React: grep -r "path:" src/router
```

### Fase 2: Escrever Testes

```typescript
// tests/e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('login valido redireciona para dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('usuario@teste.com');
    await page.getByLabel('Senha').fill('senha123');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading')).toContainText('Bem-vindo');
  });

  test('senha incorreta mostra erro sem redirecionar', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('usuario@teste.com');
    await page.getByLabel('Senha').fill('errada');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('alert')).toBeVisible();
  });
});
```

### Regras de Seletores

Prioridade: `getByRole` > `getByLabel` > `getByText` > `getByPlaceholder` > `getByTestId` > CSS

| BOM (semantico/acessivel) | RUIM (depende de implementacao) |
|---------------------------|--------------------------------|
| `page.getByRole('button', { name: 'Salvar' })` | `page.locator('.btn-primary')` |
| `page.getByLabel('Email')` | `page.locator('#email-input')` |
| `page.getByText('Criado com sucesso')` | `page.locator('[data-testid="msg"]')` |

`getByRole` testa acessibilidade simultaneamente — se o botao nao tem role correto, o teste falha E o screen reader tambem nao encontra. `getByTestId` e fallback aceitavel para containers sem texto visivel.

### Fase 3: Capturar Tudo

```typescript
test.beforeEach(async ({ page }) => {
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log(`Console Error: ${msg.text()}`);
  });
  page.on('pageerror', (error) => console.log(`Page Error: ${error.message}`));
  page.on('requestfailed', (req) =>
    console.log(`Request Failed: ${req.method()} ${req.url()} — ${req.failure()?.errorText}`)
  );
  page.on('response', (res) => {
    if (res.status() >= 400) console.log(`HTTP ${res.status()}: ${res.url()}`);
  });
});
```

### Fase 4: Simular Humano Real

```typescript
// Duplo clique nao cria duplicata
test('duplo clique no submit nao duplica', async ({ page }) => {
  await page.goto('/tasks/new');
  await page.getByLabel('Titulo').fill('Minha tarefa');
  await page.getByRole('button', { name: 'Criar' }).dblclick();
  await page.goto('/tasks');
  await expect(page.getByRole('listitem').filter({ hasText: 'Minha tarefa' })).toHaveCount(1);
});

// Navegacao rapida nao quebra estado
test('voltar durante carregamento nao quebra', async ({ page }) => {
  await page.goto('/dashboard');
  await page.getByRole('link', { name: 'Configuracoes' }).click();
  await page.goBack();
  await expect(page.getByRole('heading')).toContainText('Dashboard');
});

// Dados com caracteres especiais
test('nome com acentos e apostrofe salva corretamente', async ({ page }) => {
  await page.goto('/profile/edit');
  await page.getByLabel('Nome').fill("Jose Maria O'Brien-Garcia");
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByText("Jose Maria O'Brien-Garcia")).toBeVisible();
});

// Viewport mobile
test('menu mobile abre e fecha', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await expect(page.getByRole('navigation')).not.toBeVisible();
  await page.getByRole('button', { name: /menu/i }).click();
  await expect(page.getByRole('navigation')).toBeVisible();
});

// Performance percebida
test('pagina carrega em menos de 3s', async ({ page }) => {
  const start = Date.now();
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(Date.now() - start).toBeLessThan(3000);
});
```

### Fase 5: Rodar e Coletar

```bash
bunx playwright test --reporter=html,list          # todos os testes
bunx playwright test tests/e2e/auth/               # fluxo especifico
bunx playwright test --project=smoke                # so smoke tests
bunx playwright test --debug                       # browser visivel + inspector
bunx playwright show-report tests/e2e/report       # abrir HTML report
```

---

## Modo 2: Playwright CLI (Teste Exploratorio com IA)

### Quando usar
- Explorar app como usuario real sem escrever testes antes
- QA exploratorio em PR (encontrar bugs inesperados)
- Gerar testes a partir de interacao real
- Validar deploy Vercel visualmente

### Pre-requisito
`playwright-cli` instalado globalmente:
```bash
which playwright-cli || bun install -g @playwright/cli@latest
```

### Workflow CLI

1. **Abra** browser: `playwright-cli -s=qa open [url]`
2. **Capture snapshot** para obter refs: `playwright-cli -s=qa snapshot`
3. **Interaja** usando refs: `playwright-cli -s=qa click <ref>`, `fill <ref> <text>`
4. **Capture** screenshots: `playwright-cli -s=qa screenshot`
5. **Reporte** com evidencias visuais
6. **Feche** sessao: `playwright-cli -s=qa close`

### Comandos essenciais
```bash
playwright-cli open [url]              # Abrir browser
playwright-cli snapshot                # Capturar estado (obter refs)
playwright-cli click <ref>             # Clicar
playwright-cli fill <ref> <text>       # Preencher
playwright-cli screenshot              # Screenshot
playwright-cli resize 375 667          # Mobile viewport
playwright-cli -s=nome <cmd>           # Sessao nomeada
playwright-cli close                   # Fechar
```

### Principios do teste CLI
- **Black-box**: NAO leia codigo fonte. Interaja APENAS pelo browser
- **Como usuario**: Clique onde usuario clicaria, preencha o que usuario preencheria
- **Edge cases**: Tente campos vazios, caracteres especiais, duplo clique, refresh
- **Mobile**: `playwright-cli resize 375 667` e repita fluxos criticos
- **Acessibilidade**: Observe se elementos tem labels, roles, contraste adequado
- **Token-eficiente**: CLI consome menos tokens que MCP (sem schemas pesados)

### Agentes CLI disponiveis
- `/ag-testar-manual [url]` — Teste exploratorio completo com relatorio (ag-testar-manual)
- `/ag-gerar-testes [fluxo]` — Gera testes Playwright a partir de fluxo CLI (ag-gerar-testes-gerar-testes-mcp)
- `/ag-smoke-vercel [url]` — Smoke tests contra URL Vercel (ag-smoke-vercel)

---

## Modo 3: Playwright Agents (Planner/Generator/Healer)

### Setup
```bash
bunx playwright init-agents --loop=claude
```

Cria 3 agentes Markdown no projeto:

1. **Planner**: Explora app, identifica fluxos, gera plano de testes em Markdown
2. **Generator**: Transforma plano em codigo Playwright real com seletores validados
3. **Healer**: Auto-corrige testes quando UI muda (self-healing)

### Quando usar
- Gerar suite de testes completa para app novo
- Atualizar testes apos redesign de UI (healer)
- Escalar cobertura de E2E rapidamente

### Workflow
```
Planner → test-plan.md → Generator → *.spec.ts → Healer (quando falha)
```

---

## Modo 4: Smoke Tests para Deploy Vercel

### Rodar contra URL Vercel
```bash
# Preview deploy
PLAYWRIGHT_TEST_BASE_URL=https://app-preview-abc.vercel.app bunx playwright test --project=smoke

# Production
PLAYWRIGHT_TEST_BASE_URL=https://app.vercel.app bunx playwright test --project=smoke
```

### Smoke test suite minima (tests/e2e/smoke/)
```typescript
// tests/e2e/smoke/health.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage carrega sem erros', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('assets CSS e JS carregam', async ({ page }) => {
    const failedAssets: string[] = [];
    page.on('requestfailed', req => {
      if (req.resourceType() === 'stylesheet' || req.resourceType() === 'script') {
        failedAssets.push(req.url());
      }
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(failedAssets).toHaveLength(0);
  });

  test('pagina de login acessivel', async ({ page }) => {
    const response = await page.goto('/login');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole('button')).toBeVisible();
  });

  test('LCP abaixo de 5s', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(5000);
  });

  test('sem erros criticos no console', async ({ page }) => {
    const criticalErrors: string[] = [];
    const KNOWN_BENIGN = [
      'ResizeObserver', 'DevTools', 'HMR', 'favicon', 'service-worker',
      'Sentry', 'analytics', 'manifest.json',
    ];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!KNOWN_BENIGN.some(k => text.includes(k))) {
          criticalErrors.push(text);
        }
      }
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(criticalErrors).toHaveLength(0);
  });
});
```

### GitHub Action para smoke tests pos-deploy
```yaml
# .github/workflows/smoke-on-deploy.yml
name: Smoke Tests on Deploy
on:
  deployment_status:

jobs:
  smoke:
    if: github.event.deployment_status.state == 'success'
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: bun install
      - run: bunx playwright install --with-deps chromium
      - name: Run Smoke Tests
        run: bunx playwright test --project=smoke
        env:
          PLAYWRIGHT_TEST_BASE_URL: ${{ github.event.deployment_status.target_url }}
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: smoke-report
          path: tests/e2e/report/
```

### CI: QA automatico com Claude Code em PRs
```yaml
# .github/workflows/claude-qa-on-pr.yml
name: Claude QA on PR
on:
  pull_request:
    types: [labeled]

jobs:
  qa:
    if: github.event.label.name == 'qa-verify'
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: bun install && bun install -g @playwright/cli@latest && bun run dev &
      - name: Claude QA
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            Use playwright-cli to test this PR. Navigate the app at http://localhost:3000.
            Commands: playwright-cli open http://localhost:3000, snapshot, click, fill, screenshot.
            Focus on features mentioned in the PR description.
            Test: happy path, error handling, mobile viewport (playwright-cli resize 375 667), accessibility.
            Post a detailed QA report as a PR comment.
```

**REQUISITOS**:
- `ANTHROPIC_API_KEY` configurado como GitHub Secret
- `claude-code-action` consome API credits Anthropic
- Repos privados consomem GitHub Actions minutes (Free: 2000/mes)

---

## Output: e2e-report.md

```markdown
# Report E2E — [Data]

## Resumo
| Metrica | Valor |
|---------|-------|
| Fluxos testados | N |
| Testes executados / Passaram / Falharam / Flaky | N/N/N/N |
| Tempo total | Ns |
| Erros de console / Requests falharam | N/N |

## Veredicto
OK — Fluxos criticos funcionam | ATENCAO — Problemas em fluxos secundarios | BLOQUEIO — Fluxos criticos quebrados

## Falhas

### FALHA: [Nome do fluxo]
- **Teste:** `path/spec.ts:linha`
- **Passo que falhou:** [descricao]
- **Esperado / Encontrado:** [esperado] / [encontrado]
- **Console errors:** [stacktrace relevante]
- **Severidade:** CRITICO | IMPORTANTE | MENOR
- **Sugestao:** ag-depurar-erro /depurar — [onde e o que investigar]

## Erros de Console (testes que passaram)
| Pagina | Erro | Frequencia |
|--------|------|-----------|

## Requests com Falha
| URL | Metodo | Status | Pagina | Impacto |
|-----|--------|--------|--------|---------|

## Performance
| Pagina | Tempo | Threshold | Status |
|--------|-------|-----------|--------|

## Mobile (375x667)
| Fluxo | Status | Observacao |
|-------|--------|-----------|

## Proximos Passos
1. ag-depurar-erro /depurar — [issue critico]
2. ag-implementar-codigo /construir — [fix necessario]
```

## Estrutura de Arquivos

```
tests/
├── e2e/
│   ├── smoke/         health.spec.ts | assets.spec.ts  <- MINIMO para Vercel
│   ├── auth/          login.spec.ts | signup.spec.ts | logout.spec.ts
│   ├── [modulo]/      create.spec.ts | edit.spec.ts | delete.spec.ts
│   ├── navigation/    routes.spec.ts
│   ├── mobile/        responsive.spec.ts
│   ├── fixtures/
│   │   ├── base.ts          <- Extended fixture com error capture
│   │   ├── auth-setup.ts    <- Login reutilizavel (storage state)
│   │   └── test-data.ts     <- Dados de teste realistas
│   ├── page-objects/        <- Page Object Models
│   ├── .auth/               <- Storage state (gitignored)
│   └── report/              <- HTML report gerado pelo Playwright
└── playwright.config.ts
```

### Auth Setup (login uma vez, reutilizar em todos)

```typescript
// tests/e2e/fixtures/auth-setup.ts
import { test as setup, expect } from '@playwright/test';
setup('autenticar', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('teste@exemplo.com');
  await page.getByLabel('Senha').fill('senha-segura');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL('/dashboard');
  await page.context().storageState({ path: 'tests/e2e/.auth/user.json' });
});
```

### Dados de Teste Realistas

```typescript
// tests/e2e/fixtures/test-data.ts
export const testUsers = {
  normal:      { email: 'maria.silva@exemplo.com.br', password: 'SenhaF0rte!2024', name: 'Maria da Silva' },
  withAccents: { email: 'jose@ejemplo.es', password: 'Contra!123', name: "Jose O'Brien-Garcia" },
  longName:    { email: 'user@test.com', password: 'Pass123!', name: 'A'.repeat(200) },
};
export const testTasks = {
  simple:      { title: 'Comprar pao', description: 'Na padaria da esquina' },
  withEmoji:   { title: 'Celebrar lancamento', description: 'Festa!' },
  empty:       { title: '', description: '' },
  xss:         { title: '<script>alert("xss")</script>', description: '<img onerror=alert(1) src=x>' },
};
```

## Principios

**Piramide:** E2E (ag-testar-e2e) = poucos, lentos, alta confianca — so fluxos criticos. Integration = medios. Unit (ag-testar-codigo) = muitos, rapidos, baratos.

**Camadas de teste por ambiente:**
| Ambiente | Tipo | Trigger |
|----------|------|---------|
| Local | E2E completo + MCP exploratorio | `bun run dev` |
| Preview (Vercel) | Smoke + regressao critica | PR deploy |
| Production (Vercel) | Smoke minimo | Deploy success |

Teste flaky e pior que sem teste. Causas: timeouts curtos, race conditions, seletores CSS frageis. Use seletores de acessibilidade e waits explicitos.

## Checklist por Fluxo

- [ ] Happy path funciona?
- [ ] Mensagem de erro para input invalido?
- [ ] Funciona via teclado (Tab + Enter)?
- [ ] Funciona em mobile (375x667)?
- [ ] Duplo clique/submit nao causa duplicata?
- [ ] Loading state aparece em operacoes lentas?
- [ ] Browser back nao quebra o estado?
- [ ] Dados com acentos/emojis/especiais sao preservados?
- [ ] Console sem erros durante o fluxo?
- [ ] Requests de rede retornam 2xx?

## Assertion Hardening — Patterns Obrigatorios

### Anti-Patterns (PROIBIDO)

```typescript
// RUIM: disjuncao aceita qualquer coisa verdadeira
expect(hasLabel || hasArea || hasHeading).toBe(true);

// RUIM: condicional sem else — teste pode nao testar nada
if (await element.isVisible()) {
  await expect(element).toHaveText('...');
}
// Se nao visivel, teste passa sem verificar nada!

// RUIM: expect em propriedade que sempre existe
expect(page.url()).toBeTruthy(); // URL sempre e truthy
```

### Patterns Corretos

```typescript
// BOM: assertions explicitas e especificas
await expect(page.getByLabel('Alternativas')).toBeVisible();

// BOM: se condicional, SEMPRE ter else com fail
const element = page.getByLabel('BNCC');
if (await element.isVisible()) {
  await expect(element).toHaveText('...');
} else {
  throw new Error('Expected BNCC element to be visible');
}

// BOM: verificar estado especifico, nao apenas existencia
await expect(page.getByRole('button', { name: 'Salvar' })).toBeEnabled();
await expect(page).toHaveURL(/\/dashboard/);
```

### Regra de Ouro
Cada `expect()` deve poder FALHAR em cenario real. Se nao pode falhar → nao e teste, e decoracao.

### Theatrical Testing Detection (AUDITORIA em suites existentes)

Ao rodar regressao ou auditar testes existentes, buscar e eliminar:

```bash
# 1. .catch(() => false) — redundante em Playwright (isVisible nunca throws)
grep -rn "\.catch.*false\|\.catch.*=>" tests/ test/

# 2. OR-chain assertions — aceita qualquer coisa verdadeira
grep -rn "expect(.*||.*).toBe(true)" tests/ test/

# 3. expect sempre-true — nunca falha
grep -rn "toBeGreaterThanOrEqual(0)" tests/ test/

# 4. Conditional sem else — pode nao testar nada
# (requer inspecao manual: if/isVisible sem else/throw)
```

**Bulk remediation**: Para remocao em massa de patterns como `.catch(() => false)`, usar sed/perl:
```bash
# Remove .catch(() => false) em todos os arquivos de teste
find tests/ test/ -name "*.ts" -exec perl -i -pe 's/\.catch\(\s*\(\)\s*=>\s*false\s*\)//g' {} +
# Limpar semicolons orfaos resultantes
find tests/ test/ -name "*.ts" -exec perl -i -pe 's/^\s*;\s*$//' {} +
```
Bulk sed/perl e ~100x mais rapido que edicao arquivo-por-arquivo para padroes repetitivos.

### Teste de Controle de Acesso E2E

Se o app tem autenticacao e roles:
- **Smoke de rotas protegidas**: verificar que rotas protegidas redirecionam para /login sem auth
- **Access denial**: usuario com role baixo NAO acessa rotas de admin (redirect ou 403)
- **Access grant**: usuario com role alto ACESSA rotas de admin
- NUNCA testar apenas com o role mais privilegiado
- Auth bypass (cookies de teste, mock injection) e aceitavel para velocidade, mas DEVE ter ao menos 1 suite que testa auth real

---

## Templates por Tipo de Fluxo

### Wizard (multi-step)
```typescript
test('wizard completo: step 1 → step N → resultado', async ({ page }) => {
  await page.goto('/wizard-start');
  // Step 1: verificar heading + preencher + avancar
  await expect(page.getByRole('heading')).toContainText('Step 1');
  await page.getByLabel('Campo').fill('valor');
  await page.getByRole('button', { name: /proximo|avancar/i }).click();
  // Step 2: verificar que AVANCOU (nao apenas que pagina carregou)
  await expect(page.getByRole('heading')).toContainText('Step 2');
  // ... ate resultado final
  await expect(page.getByText(/gerado|criado|concluido/i)).toBeVisible();
});
```

### CRUD (bank/lista)
```typescript
test.describe('Bank CRUD', () => {
  test('criar item → aparece na lista', async ({ page }) => { /* ... */ });
  test('buscar item → resultados filtrados', async ({ page }) => { /* ... */ });
  test('editar item → alteracao persistida', async ({ page }) => { /* ... */ });
  test('deletar item → removido da lista', async ({ page }) => { /* ... */ });
});
```

### Chat (streaming)
```typescript
test('enviar mensagem → resposta streaming aparece', async ({ page }) => {
  await page.goto('/chat');
  await page.getByRole('textbox').fill('pergunta teste');
  await page.getByRole('button', { name: /enviar/i }).click();
  // Verificar que loading aparece
  await expect(page.getByRole('status')).toBeVisible();
  // Esperar resposta (com timeout adequado para LLM)
  await expect(page.locator('.message-assistant')).toBeVisible({ timeout: 60_000 });
});
```

### Export (download)
```typescript
test('exportar como PDF → download completo', async ({ page }) => {
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /exportar|download/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  const size = (await download.path()) ? (await fs.stat(await download.path())).size : 0;
  expect(size).toBeGreaterThan(1000); // PDF minimo razoavel
});
```

---

## Quando NAO usar E2E

- Logica de negocio pura -> unit test (ag-testar-codigo)
- Validacao de schema de API -> integration test
- Visual regression pixel-perfect -> Percy/Chromatic
- Performance profunda -> Lighthouse/k6

## Quality Gate

- [ ] Fluxos criticos (login, acao principal) passam 100%?
- [ ] Nenhum erro de console em paginas principais?
- [ ] Performance < 3s nas paginas mais visitadas?
- [ ] Mobile sem elementos inacessiveis?
- [ ] Report HTML gerado em tests/e2e/report/?
- [ ] Cada falha tem screenshot + logs + sugestao de fix?
- [ ] Smoke tests passam contra URL Vercel (se deploy)?

