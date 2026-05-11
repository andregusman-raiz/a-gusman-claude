# Scripts

## `generate-thumbnails.ts`

Pre-renders PNG thumbnails of every variant × preset combination for the
`/presentation/<category>/compare` view. Replaces the runtime `scale(0.6)`
CSS hack with static images.

### How it works

1. Launches headless Chromium via Playwright.
2. For each `(variant × preset)` pair:
   - Visits `BASE_URL/` to seed `localStorage` with the target preset key
     (`glowui-preset`).
   - Navigates to `BASE_URL/presentation/<slug>/<variant-id>`.
   - Waits for the `[data-preview-root]` container to become visible.
   - Captures a PNG of that container only.
3. Writes to `public/thumbnails/<category-id>/<variant-id>.<preset-id>.png`.

### Usage

The dev server must already be running on `BASE_URL` (default
`http://localhost:3011`).

```bash
# Full regeneration (86 variants × 7 presets ≈ 602 images)
BASE_URL=http://localhost:3011 npm run thumbnails

# Subset by variant ID
npm run thumbnails -- --variants=04a-centered-text,04b-split-text-image

# Subset by preset ID
npm run thumbnails -- --presets=raiz-default,minimalist

# Combined filters
npm run thumbnails -- --variants=04a-centered-text --presets=raiz-default
```

### Cost estimate

- ~1–1.5 s per thumbnail on a local dev server.
- Full run: 5–10 min, ~5–15 MB of PNGs total.

### CI

Not run in build. PNGs are gitignored (`public/thumbnails/`). Regenerate
locally after adding/editing variants or presets. If a thumbnail is missing
at runtime, the compare view gracefully falls back to the live scaled
component render.

### Troubleshooting

- `Dev server not responding` → start `npm run dev` first.
- `preview-root not visible` → component likely throws at mount. Check the
  variant detail page directly at `BASE_URL/presentation/<slug>/<id>`.
- Missing Chromium binary → `npx playwright install chromium`.
