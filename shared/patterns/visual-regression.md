# Visual Regression Testing Pattern

## Overview

Visual regression testing catches unintended UI changes before they reach production.
A screenshot is taken for each critical page/component on every PR, and compared
against a baseline captured from the main branch. Any pixel-level diff is flagged
for human review.

This workspace uses **Argos CI** + **Playwright** for visual regression.

---

## Stack

| Tool | Role |
|------|------|
| `@playwright/test` | Browser automation and screenshot capture |
| `@argos-ci/playwright` | Argos integration — uploads screenshots, generates diff links |
| Argos CI (SaaS) | Stores baselines, computes diffs, comments on PRs |

---

## Setup (per project)

### 1. Install packages

```bash
npm install --save-dev @argos-ci/playwright
```

### 2. Configure Argos in playwright.config.ts

```typescript
import { defineConfig } from '@playwright/test';
import { argosReporter } from '@argos-ci/playwright/reporter';

export default defineConfig({
  reporter: [
    ['list'],
    // Add Argos reporter — it uploads screenshots after the run
    [argosReporter, { uploadToArgos: !!process.env.ARGOS_TOKEN }],
  ],
});
```

### 3. Add ARGOS_TOKEN secret

- Go to https://argos-ci.com → connect the GitHub repo
- Copy the project token
- Add it to GitHub Settings → Secrets → Actions as `ARGOS_TOKEN`

---

## Writing Visual Tests

### Tag visual tests with @visual

Visual regression tests are isolated from functional tests using the `@visual` grep tag.
This lets the CI workflow run only visual tests without re-running the full E2E suite.

```typescript
// tests/e2e/visual/login.visual.spec.ts
import { test } from '@playwright/test';
import { argosScreenshot } from '@argos-ci/playwright';

// Tag test with @visual so the visual-regression.yml workflow picks it up
test('@visual Login page appearance', async ({ page }) => {
  await page.goto('/login');
  // Wait for fonts and images to load before capturing
  await page.waitForLoadState('networkidle');

  // Full-page screenshot — Argos handles comparison
  await argosScreenshot(page, 'login-page');
});

test('@visual Login form — error state', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'invalid@');
  await page.fill('[name="password"]', 'wrong');
  await page.click('[type="submit"]');
  await page.waitForSelector('[role="alert"]');

  // Name the screenshot so diffs are easy to identify
  await argosScreenshot(page, 'login-form-error');
});
```

### Screenshot helpers

```typescript
// tests/e2e/helpers/visual.ts
import { Page } from '@playwright/test';
import { argosScreenshot } from '@argos-ci/playwright';

/**
 * Capture a stable screenshot:
 *   - waits for network idle (fonts, lazy images loaded)
 *   - hides dynamic content (timestamps, avatars, animations)
 *   - sets a consistent viewport
 */
export async function stableScreenshot(
  page: Page,
  name: string,
  options?: {
    /** CSS selectors to hide before screenshotting (timestamps, user-specific content) */
    hideSelectors?: string[];
    /** Wait this long after networkidle before capturing (for CSS animations) */
    stabilizeMs?: number;
  }
) {
  await page.waitForLoadState('networkidle');

  // Hide dynamic / user-specific content that would cause false positives
  const defaultHide = [
    '[data-testid="timestamp"]',
    '[data-testid="avatar"]',
    '.animate-pulse',
    '.animate-spin',
  ];
  const selectors = [...defaultHide, ...(options?.hideSelectors ?? [])];

  await page.evaluate((sels) => {
    sels.forEach((sel) => {
      document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
        el.style.visibility = 'hidden';
      });
    });
  }, selectors);

  if (options?.stabilizeMs) {
    await page.waitForTimeout(options.stabilizeMs);
  }

  await argosScreenshot(page, name);
}
```

### Component-level screenshots

```typescript
test('@visual Button — all variants', async ({ page }) => {
  await page.goto('/storybook/button');

  // Screenshot a specific component rather than the full page
  const component = page.locator('[data-testid="button-showcase"]');
  await argosScreenshot(page, 'button-variants', {
    element: component,
  });
});
```

---

## Threshold Configuration

Argos CI manages thresholds via the dashboard (no local config needed).
Recommended defaults:

| Threshold | Value | When to change |
|-----------|-------|----------------|
| Auto-approve below | 0.1% diff | Raise if fonts cause noise |
| Review required above | 0.1% diff | Lower for pixel-critical UI |
| Fail build above | 1% diff | Match your quality bar |

For intentional UI changes, approve the diff in the Argos dashboard to update the baseline.

---

## CI Workflow Structure

The `visual-regression.yml` workflow follows this pattern:

```
trigger: pull_request to main
  ↓
checkout (fetch-depth: 0 — Argos needs full history)
  ↓
npm ci + playwright install chromium
  ↓
npm run build
  ↓
start server (next start OR vite preview)
  ↓
npx playwright test --grep="@visual"
  ↓
Argos reporter uploads screenshots to Argos CI
  ↓
Argos comments on PR with diff link
```

### Next.js projects

```yaml
- name: Start Next.js server
  run: npm run start &
  # Wait for port 3000 to be ready
```

### Vite projects

```yaml
- name: Start Vite preview server
  # npm run preview serves dist/ on port 4173
  run: npm run preview -- --port 4173 &
  # Wait for port 4173 to be ready
```

---

## What to Screenshot

### High-value targets (always)

- Login / auth screens
- Main dashboard / home
- Core feature pages (one screenshot per feature)
- Empty states and loading states
- Error pages (404, 500)

### Component-level (when using Storybook)

- Design system components (Button, Input, Modal, etc.)
- Data tables with sample data
- Charts / visualizations

### Skip

- Pages behind auth that vary by user data (use mock data)
- Real-time data (prices, timestamps — hide with `hideSelectors`)
- Admin pages with low traffic risk

---

## Debugging False Positives

Common causes of noisy diffs and how to fix them:

| Cause | Fix |
|-------|-----|
| Fonts not loaded | `waitForLoadState('networkidle')` |
| CSS animations | Add `stabilizeMs: 300` to stableScreenshot |
| Timestamps | Add `[data-testid="timestamp"]` to hideSelectors |
| Random avatars | Add `[data-testid="avatar"]` to hideSelectors |
| User-specific names | Mock auth state with fixed user data |
| Scrollbar width differs between OS | Use `--project=chromium` only in CI |
| Anti-aliasing differences | These are below the 0.1% threshold |

---

## Cross-Project Consistency

Both `raiz-platform` and `rAIz-AI-Prof` use the same pattern:

| Setting | raiz-platform | rAIz-AI-Prof |
|---------|--------------|--------------|
| Server command | `npm run start` (port 3000) | `npm run preview` (port 4173) |
| Test dir | `tests/e2e/` | `test/e2e/` |
| Screenshot dir | `tests/e2e/screenshots/` | `test/e2e/screenshots/` |
| Grep tag | `@visual` | `@visual` |
| Argos secret | `ARGOS_TOKEN` | `ARGOS_TOKEN` |

---

## Related Patterns

- `testing.md` — General E2E patterns, anti-patterns, test quality rules
- `deploy.md` — CI/CD pipeline and preview deploy patterns
- `.github/workflows/visual-regression.yml` — Workflow implementations in each project
