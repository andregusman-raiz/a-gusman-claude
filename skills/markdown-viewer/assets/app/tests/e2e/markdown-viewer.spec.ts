import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const allowed_document = "/documento/docs/analises/CENARIOS-FINANCEIROS.md";

test("F-001 — raiz redireciona ao primeiro documento publicado", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/documento\/.+\.md$/);
  await expect(page.locator("main h1").first()).toBeVisible();
});

test("F-002 — seleção no menu renderiza outro Markdown", async ({ page }) => {
  await page.goto(allowed_document);
  await page
    .getByRole("link", { name: "Saúde Corporativa SulAmérica — Raiz Educação", exact: true })
    .click();

  await expect(page).toHaveURL(/\/documento\/README\.md$/);
  await expect(page.locator("main h1").first()).toHaveText(/Saúde Corporativa SulAmérica/);
});

test("F-003 — URL direta abre documento permitido", async ({ page }) => {
  await page.goto(allowed_document);

  await expect(page).toHaveURL(new RegExp(`${allowed_document}$`));
  await expect(page.locator("main h1").first()).toContainText("Cenários financeiros");
});

test("F-004 — busca filtra por título", async ({ page }) => {
  await page.goto(allowed_document);
  await page.getByRole("searchbox", { name: "Filtrar documentos" }).fill("matriz contratual");

  await expect(page.getByRole("link", { name: "Matriz Contratual" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cenários Financeiros" })).toHaveCount(0);
});

test("F-005 — limpar busca restaura o índice", async ({ page }) => {
  await page.goto(allowed_document);
  await page.getByRole("searchbox", { name: "Filtrar documentos" }).fill("sem resultado");
  await page.getByRole("button", { name: "Limpar busca" }).click();

  await expect(page.getByRole("link", { name: "Matriz Contratual" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cenários Financeiros" })).toBeVisible();
});

test("F-006 — busca sem resultado mostra estado vazio", async ({ page }) => {
  await page.goto(allowed_document);
  await page.getByRole("searchbox", { name: "Filtrar documentos" }).fill("documento impossível");

  await expect(page.getByRole("status")).toContainText("Nenhum documento encontrado");
});

test("F-007 — documento inexistente ou bloqueado retorna 404", async ({ page }) => {
  for (const path of ["/documento/docs/inexistente.md", "/documento/CLAUDE.md", "/documento/docs/ai-state/findings.md"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Documento não encontrado" })).toBeVisible();
  }
});

test("F-008 — estado de erro QAT oferece retorno ao índice", async ({ page }) => {
  await page.goto(`${allowed_document}?estado=erro`);

  await expect(page.locator("article").getByTestId("viewer-state-erro")).toContainText(
    "Não foi possível abrir o documento",
  );
});

test("F-009 — menu móvel permite trocar documento", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(allowed_document);
  await page.getByRole("button", { name: "Abrir menu de documentos" }).click();

  const sidebar = page.locator("#document-sidebar");
  await expect(sidebar).toHaveClass(/sidebar-open/);
  await page
    .getByRole("link", { name: "Saúde Corporativa SulAmérica — Raiz Educação", exact: true })
    .click();
  await expect(page).toHaveURL(/\/documento\/README\.md$/);
});

test("F-010 — ação de imprimir chama o diálogo do navegador", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "print", {
      configurable: true,
      value: () => document.body.setAttribute("data-print-called", "true"),
    });
  });
  await page.goto(allowed_document);
  await page.getByRole("button", { name: "Imprimir documento" }).click();

  await expect(page.locator("body")).toHaveAttribute("data-print-called", "true");
});

test("QAT — fotografa loading, vazio e erro", async ({ page }) => {
  const artifact_dir = resolve("test-results", "qat-states");
  await mkdir(artifact_dir, { recursive: true });

  for (const state of ["loading", "vazio", "erro"] as const) {
    await page.goto(`${allowed_document}?estado=${state}`);
    await expect(page.locator("article").getByTestId(`viewer-state-${state}`)).toBeVisible();
    await page.screenshot({ fullPage: true, path: resolve(artifact_dir, `${state}.png`) });
  }
});
