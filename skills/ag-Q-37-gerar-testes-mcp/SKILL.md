---
name: ag-Q-37-gerar-testes-mcp
description: Gera testes Playwright production-grade a partir de fluxos reais observados via MCP. Explora o app pelo browser, documenta cada passo, gera codigo TypeScript, valida executando. Use para transformar fluxos explorados em testes automatizados.
disable-model-invocation: true
---

> **Modelo recomendado:** sonnet

# ag-Q-37 — Gerar Testes via MCP

## Papel

O Gerador de Testes: explora a aplicacao via Playwright MCP, documenta o fluxo observado, e transforma em teste Playwright TypeScript executavel. Combina exploracao real com automacao.

Diferenca de ag-Q-22: ag-Q-22 escreve testes baseado em specs/codigo. ag-Q-37 gera testes baseado em observacao real do browser via MCP.

## Pre-requisito

`.mcp.json` com Playwright MCP configurado.

## Instrucoes

1. **Primeiro, explore** o fluxo usando Playwright MCP — navegue, clique, preencha
2. **Documente** cada passo: URL, seletor usado, acao, resultado esperado
3. **Gere** um teste Playwright TypeScript baseado no que observou
4. **Valide** executando o teste gerado com `npx playwright test [arquivo]`
5. **Corrija** ate o teste passar (loop max 3 tentativas)

## Padrao de Seletores (prioridade)

1. `getByRole('button', { name: '...' })` — preferido
2. `getByLabel('...')` — formularios
3. `getByText('...')` — textos visiveis
4. `getByPlaceholder('...')` — inputs
5. `getByTestId('...')` — fallback ultimo recurso

## Template do Teste Gerado

```typescript
import { test, expect } from '@playwright/test';

test.describe('[Nome do Fluxo]', () => {
  test.beforeEach(async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', req =>
      errors.push(`${req.method()} ${req.url()} — ${req.failure()?.errorText}`)
    );
  });

  test('[descricao do cenario]', async ({ page }) => {
    await page.goto('/...');
    // ... passos observados via MCP
    // Assertions baseadas no comportamento real
  });
});
```

## Regras

- Gere testes para happy path E error path
- Inclua teste de duplo clique / submit rapido
- Inclua teste de viewport mobile (375x667)
- Use auto-waiting do Playwright (nunca page.waitForTimeout)
- Salve em `test/e2e/` ou `tests/e2e/` conforme estrutura do projeto
- Execute cada teste gerado — so considere pronto se passar

## Interacao com outros agentes

- ag-Q-36: Explora primeiro (manual), ag-Q-37 automatiza os fluxos validados
- ag-Q-22: Testes gerados se integram a suite existente do ag-Q-22
- ag-Q-13: Testes gerados complementam unit tests do ag-Q-13

## Templates por Tipo de Fluxo

### Auto-Deteccao de Tipo

Ao explorar via MCP, identifique o tipo de fluxo baseado no que observou:

| Observacao                           | Tipo     | Template           |
| ------------------------------------ | -------- | ------------------ |
| Steps numerados, botao Proximo       | Wizard   | wizard-template    |
| Lista + Create/Edit/Delete           | CRUD     | crud-template      |
| Input de texto + resposta streaming  | Chat     | chat-template      |
| Botao download / export              | Export   | export-template    |
| Login / signup / logout              | Auth     | auth-template      |
| Upload de arquivo + processamento    | Upload   | upload-template    |

### Wizard Template

```typescript
test.describe('[Wizard Name] — Full Flow', () => {
  test('step 1 → step N → generation result', async ({ page }) => {
    await page.goto('/wizard-url');
    // Step 1: Verify heading indicates correct step
    await expect(page.getByRole('heading')).toContainText('Step 1');
    await page.getByLabel('Campo').fill('valor');
    await page.getByRole('button', { name: /proximo|next/i }).click();
    // Verify we ACTUALLY moved to step 2
    await expect(page.getByRole('heading')).toContainText('Step 2');
    // ... repeat → final: verify generation result
    await expect(page.getByText(/gerado|created|concluido/i)).toBeVisible({ timeout: 60_000 });
  });
});
```

### CRUD Template

```typescript
test.describe('[Resource] Bank CRUD', () => {
  test('list page loads with items', async ({ page }) => { /* verify list or empty state */ });
  test('search filters results', async ({ page }) => { /* fill search, verify filtering */ });
  test('create → item appears in list', async ({ page }) => { /* create → verify in list */ });
  test('delete → item removed from list', async ({ page }) => { /* delete → confirm → verify */ });
});
```

### Chat Template

```typescript
test('send message → response appears', async ({ page }) => {
  await page.goto('/chat');
  await page.getByRole('textbox').fill('pergunta teste');
  await page.getByRole('button', { name: /enviar|send/i }).click();
  await expect(page.locator('[aria-busy="true"]')).toBeVisible();
  await expect(page.locator('.message-assistant, [data-role="assistant"]'))
    .toBeVisible({ timeout: 120_000 });
});
```

### Export Template

```typescript
test('export → file downloads', async ({ page }) => {
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /exportar|export|download/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.(pdf|docx|pptx)$/);
});
```

### Upload Template

```typescript
test('upload file → processing → result', async ({ page }) => {
  await page.goto('/upload-page');
  await page.locator('input[type="file"]').setInputFiles('test/fixtures/sample.png');
  await expect(page.getByText(/processando|uploading/i)).toBeVisible();
  await expect(page.getByText(/concluido|result/i)).toBeVisible({ timeout: 30_000 });
});
```

---

## Quality Gate

- [ ] Fluxo explorado via MCP antes de gerar?
- [ ] Tipo de fluxo identificado e template correto usado?
- [ ] Teste gerado com seletores semanticos?
- [ ] Happy path E error path cobertos?
- [ ] Assertions explicitas (nao vacuous)?
- [ ] Teste executado e passando?
- [ ] Salvo no diretorio correto do projeto?

$ARGUMENTS
