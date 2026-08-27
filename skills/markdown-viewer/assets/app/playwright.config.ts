import { defineConfig, devices } from "@playwright/test";

Reflect.deleteProperty(process.env, "NO_COLOR");

if (!process.env.MARKDOWN_VIEWER_PROJECT_ROOT) {
  throw new Error("MARKDOWN_VIEWER_PROJECT_ROOT é obrigatório para os testes E2E.");
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3006",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3006",
    url: "http://127.0.0.1:3006",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
