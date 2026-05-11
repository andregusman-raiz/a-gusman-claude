/**
 * Generate pre-rendered PNG thumbnails for the /compare view.
 *
 * Iterates over every (variant × preset) pair, navigates to the variant
 * detail page in a headless Chromium, applies the preset via localStorage,
 * and captures the `[data-preview-root]` container to
 * `public/thumbnails/<category-id>/<variant-id>.<preset-id>.png`.
 *
 * Usage:
 *   BASE_URL=http://localhost:3011 npm run thumbnails
 *   BASE_URL=http://localhost:3011 npm run thumbnails -- --variants=04a-centered-text
 *   BASE_URL=http://localhost:3011 npm run thumbnails -- --presets=raiz-default,minimalist
 *
 * The dev server must be running on BASE_URL (default http://localhost:3011).
 */

import { chromium, type Browser, type Page } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { PRESENTATION_VARIANTS } from "../src/lib/presentation-data";
import { PRESENTATION_PRESETS } from "../src/lib/presentation-presets";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3011";
const OUT_DIR = path.resolve(process.cwd(), "public", "thumbnails");
const PRESET_STORAGE_KEY = "glowui-preset";

// Final thumbnail size. Captures at viewport 1280×800, PNG is downscaled
// implicitly by the browser since we clip the preview element.
const VIEWPORT = { width: 1280, height: 800 };
const NAV_TIMEOUT_MS = 30_000;
const RENDER_WAIT_MS = 400; // let preset class + lazy components settle

type Filter = { variants?: Set<string>; presets?: Set<string> };

function parseArgs(argv: string[]): Filter {
  const filter: Filter = {};
  for (const arg of argv) {
    if (arg.startsWith("--variants=")) {
      filter.variants = new Set(arg.slice(11).split(",").filter(Boolean));
    } else if (arg.startsWith("--presets=")) {
      filter.presets = new Set(arg.slice(10).split(",").filter(Boolean));
    }
  }
  return filter;
}

async function ensureServerReady(url: string): Promise<void> {
  const tries = 5;
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok || res.status < 500) return;
    } catch {
      // retry
    }
    if (i === tries) {
      throw new Error(
        `Dev server not responding at ${url}. Start it first (e.g. npm run dev).`,
      );
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
}

async function captureOne(
  page: Page,
  variant: (typeof PRESENTATION_VARIANTS)[number],
  presetId: string,
): Promise<{ ok: boolean; reason?: string }> {
  const url = `${BASE_URL}/presentation/${variant.categorySlug}/${variant.id}`;

  // Set preset BEFORE navigation — the component reads localStorage on mount.
  // We first visit a tiny blank page on the same origin so localStorage is
  // scoped correctly.
  try {
    await page.goto(`${BASE_URL}/`, { timeout: NAV_TIMEOUT_MS });
    await page.evaluate(
      ([key, value]) => {
        try {
          localStorage.setItem(key, value);
        } catch {
          // ignore
        }
      },
      [PRESET_STORAGE_KEY, presetId],
    );
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: NAV_TIMEOUT_MS,
    });
  } catch (err) {
    return { ok: false, reason: `navigation: ${(err as Error).message}` };
  }

  const container = page.locator("[data-preview-root]").first();
  try {
    await container.waitFor({ state: "visible", timeout: NAV_TIMEOUT_MS });
  } catch {
    return { ok: false, reason: "preview-root not visible" };
  }

  // Let preset CSS apply + any client-side rendering finish.
  await page.waitForTimeout(RENDER_WAIT_MS);

  const outPath = path.join(
    OUT_DIR,
    variant.categoryId,
    `${variant.id}.${presetId}.png`,
  );
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  try {
    await container.screenshot({ path: outPath, type: "png" });
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: `screenshot: ${(err as Error).message}` };
  }
}

async function main(): Promise<void> {
  const filter = parseArgs(process.argv.slice(2));

  const variants = PRESENTATION_VARIANTS.filter(
    (v) => !filter.variants || filter.variants.has(v.id),
  );
  const presets = PRESENTATION_PRESETS.filter(
    (p) => !filter.presets || filter.presets.has(p.id),
  );

  const total = variants.length * presets.length;
  if (total === 0) {
    console.error("No (variant × preset) pairs selected. Check filters.");
    process.exit(1);
  }

  console.log(`→ BASE_URL: ${BASE_URL}`);
  console.log(`→ Output:   ${OUT_DIR}`);
  console.log(
    `→ Plan:     ${variants.length} variants × ${presets.length} presets = ${total} thumbnails`,
  );

  await ensureServerReady(BASE_URL);

  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  const started = Date.now();
  let done = 0;
  let ok = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const variant of variants) {
    for (const preset of presets) {
      done++;
      const label = `${variant.id} · ${preset.id}`;
      const result = await captureOne(page, variant, preset.id);
      if (result.ok) {
        ok++;
        process.stdout.write(
          `\r[${done}/${total}] ${label.padEnd(50).slice(0, 50)}   `,
        );
      } else {
        failed++;
        const msg = `FAIL ${label} — ${result.reason ?? "unknown"}`;
        failures.push(msg);
        console.log(`\n${msg}`);
      }
    }
  }

  await page.close();
  await context.close();
  await browser.close();

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  console.log("");
  console.log(
    `✓ Done in ${elapsed}s — ${ok} ok, ${failed} failed (total ${total})`,
  );
  if (failures.length > 0) {
    console.log("Failures:");
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(2);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
