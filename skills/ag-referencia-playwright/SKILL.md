---
name: ag-referencia-playwright
description: Patterns canonicos Playwright 2026 — Chromium isolado, web-first assertions, locators semanticos, persistent context. Carregar antes de QAT/E2E/browser test.
context: fork
user-invocable: true
---

# Skill: Playwright Patterns (Canonical 2026)

Referencia oficial para uso de Playwright em testes E2E, QAT, e automacao
browser. Baseado em `playwright.dev/docs/best-practices` + observacoes de
producao em raiz-platform, profdigital, jusraiz.

## Quando ativar

- Spec QAT, E2E, smoke test
- Debug de fluxo browser (Playwright MCP)
- Configuracao de `playwright.config.ts`
- Refactor de teste flaky
- Setup de novo projeto com testes

## Decisoes canonicas (sem ambiguidade)

### 1. Browser channel: SEMPRE Chromium isolado

```ts
// ✅ Default — sem channel
test('flow', async ({ page }) => { ... })

// ❌ NAO usar salvo regression policy/codecs/enterprise
test.use({ channel: 'chrome' })
```

Razoes oficiais (playwright.dev):
- Chromium fica a frente do Chrome estavel — pega regressoes antes
- Reproducibilidade: nao depende do que esta instalado no Mac
- Setup mais simples, sem licencas de codecs

### 2. Modo: headless default, headed para debug

```ts
// playwright.config.ts — default
use: { headless: true }

// CLI debug ad-hoc
npx playwright test --headed --debug
```

### 3. Isolation: 1 contexto por teste

```ts
// ✅ Default Playwright — cada test ganha context novo
test('a', async ({ page }) => { ... })  // context isolado
test('b', async ({ page }) => { ... })  // outro context

// ✅ Multi-user no mesmo teste
test('admin + user', async ({ browser }) => {
  const adminCtx = await browser.newContext()
  const userCtx = await browser.newContext()
  // ...
})
```

### 4. Persistent context: APENAS para QAT manual com login

```ts
// Usar SO em workflow exploratorio com login repetido
import { chromium } from 'playwright'

const ctx = await chromium.launchPersistentContext(
  '~/.cache/playwright-claude/<projeto>',
  { channel: 'chromium', headless: true }
)
```

NUNCA usar persistent context em CI — perde isolation.

## Web-first assertions (eliminar flakiness)

### ❌ Anti-pattern: waitForTimeout
```ts
await page.click('button')
await page.waitForTimeout(2000)        // ❌ flaky, lento, nao-deterministico
const text = await page.textContent('.result')
expect(text).toBe('OK')
```

### ✅ Correto: expect com auto-retry
```ts
await page.getByRole('button', { name: 'Submit' }).click()
await expect(page.getByRole('alert')).toHaveText('OK')  // retry ate timeout
```

### Quando precisa esperar algo NAO assertable
```ts
// ✅ Esperar resposta de API
const responsePromise = page.waitForResponse('**/api/data')
await page.click('button')
await responsePromise

// ✅ Esperar URL change
await page.waitForURL('**/dashboard')

// ✅ Esperar element state especifico
await expect(page.getByTestId('spinner')).toBeHidden()
```

## Hierarquia de locators (preferir do topo para baixo)

```ts
// 1. getByRole — semantico, A11y-first (PREFERIDO)
page.getByRole('button', { name: 'Salvar' })
page.getByRole('heading', { level: 1 })
page.getByRole('link', { name: 'Logout' })

// 2. getByLabel — form fields
page.getByLabel('Email')
page.getByLabel(/senha/i)

// 3. getByPlaceholder — quando label ausente
page.getByPlaceholder('Buscar...')

// 4. getByText — texto visivel
page.getByText('Bem-vindo')

// 5. getByTestId — opt-out semantico
page.getByTestId('submit-btn')   // requer data-testid="submit-btn"

// 6. getByAltText — imagens
page.getByAltText('Logo Raiz')

// 7. locator(css) — ULTIMO recurso
page.locator('.btn-primary')      // ❌ frangil a refactor de CSS
```

## playwright.config.ts canonico

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,                  // testes em paralelo (isolation por context)
  forbidOnly: !!process.env.CI,         // bloquear .only em CI
  retries: process.env.CI ? 2 : 0,      // retry so em CI
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    // channel: NAO setado → Chromium default (canonical)
    trace: 'on-first-retry',           // debug pos-falha automatico
    screenshot: 'only-on-failure',     // economia
    video: 'retain-on-failure',        // reproduz bugs
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // adicionar firefox/webkit so se cross-browser e requisito
  ],
  webServer: process.env.CI ? {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 120_000,
  } : undefined,
})
```

## Padroes por tipo de teste

### Smoke test (pagina carrega + elementos chave)
```ts
test('home renders core elements', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /raiz/i })).toBeVisible()
  await expect(page.getByRole('navigation')).toBeVisible()
  await expect(page.getByRole('main')).toBeVisible()
})
```

### Auth flow (login → dashboard)
```ts
test('login redirects to dashboard', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(process.env.TEST_EMAIL!)
  await page.getByLabel('Senha').fill(process.env.TEST_PASSWORD!)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.waitForURL('**/dashboard')
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
})
```

### Data fetch (waitForResponse antes de assertion)
```ts
test('list loads data from API', async ({ page }) => {
  const apiPromise = page.waitForResponse('**/api/items')
  await page.goto('/items')
  const response = await apiPromise
  expect(response.status()).toBe(200)
  await expect(page.getByRole('listitem').first()).toBeVisible()
})
```

### Auth via storage state (1x login, N tests reusam)
```ts
// global.setup.ts
import { test as setup } from '@playwright/test'

setup('authenticate', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(process.env.TEST_EMAIL!)
  await page.getByLabel('Senha').fill(process.env.TEST_PASSWORD!)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.waitForURL('**/dashboard')
  await page.context().storageState({ path: '.auth/user.json' })
})

// no playwright.config.ts
projects: [
  { name: 'setup', testMatch: /global\.setup\.ts/ },
  {
    name: 'chromium',
    use: { storageState: '.auth/user.json' },
    dependencies: ['setup'],
  },
]
```

## Anti-patterns (NUNCA fazer)

| ❌ | ✅ | Razao |
|----|-----|-------|
| `page.waitForTimeout(N)` | `expect().toBeVisible()` | Flaky, lento |
| `page.locator('.css-class')` | `getByRole/getByLabel/getByTestId` | CSS muda com refactor |
| `if (await el.isVisible()) ...` | `await expect(el).toBeVisible()` | Web-first retry |
| Estado compartilhado entre tests | `browser.newContext()` | Isolation |
| Hardcoded URLs | `process.env.BASE_URL` + `baseURL` config | Multi-ambiente |
| Hardcoded credentials | `process.env.TEST_EMAIL` etc | Seguranca |
| `page.click()` sem wait | `await el.click()` (auto-wait built-in) | Built-in wait |
| `expect(await el.textContent()).toBe(x)` | `expect(el).toHaveText(x)` | Auto-retry |
| `console.log(html)` para debug | `await page.pause()` ou `--debug` | Inspector visual |

## Debug helpers

```ts
// 1. Pause execucao (abre Inspector)
await page.pause()

// 2. Trace viewer pos-falha (config: trace: 'on-first-retry')
npx playwright show-trace test-results/<run>/trace.zip

// 3. Codegen para gerar selectors corretos
npx playwright codegen http://localhost:3000

// 4. UI mode (run + step + time travel)
npx playwright test --ui

// 5. Headed + slowmo para visualizar
npx playwright test --headed --debug
```

## MCP Playwright (Claude Code)

Para uso via Playwright MCP em sessao Claude:

```
browser_navigate({ url: "http://localhost:3000" })
browser_snapshot()                    // a11y tree estruturado
browser_take_screenshot()             // PNG
browser_click({ element, ref })       // ref do snapshot
browser_fill_form({ fields: [...] })  // multiplos inputs
browser_console_messages()            // logs sem DevTools
browser_network_requests()            // requests HTTP
```

Default: headless. Para debug visual, instruir usuario a rodar
`npx playwright test --headed` em vez de mudar config global.

## Referencia oficial

- Best practices: https://playwright.dev/docs/best-practices
- Browsers/channels: https://playwright.dev/docs/browsers
- MCP: https://playwright.dev/docs/getting-started-mcp
- Auto-waiting: https://playwright.dev/docs/actionability
- Locators: https://playwright.dev/docs/locators
