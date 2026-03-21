---
description: "Detectar e usar o package manager correto (bun ou npm)"
paths:
  - "**/*"
---

# Package Manager — Deteccao Automatica

## Regra

SEMPRE detectar o package manager do projeto ANTES de rodar comandos:

```bash
if [ -f bun.lock ] || [ -f bun.lockb ]; then
  PM="bun"
else
  PM="npm"
fi
```

## Mapeamento de Comandos

| npm | bun |
|-----|-----|
| `npm run <script>` | `bun run <script>` |
| `npm test` | `bun run test` |
| `npm install` | `bun install` |
| `npm install <pkg>` | `bun add <pkg>` |
| `npm install -D <pkg>` | `bun add -d <pkg>` |
| `npx <cmd>` | `bunx <cmd>` |

## Preferencia

- Se projeto tem `bun.lock` → usar bun (mais rapido)
- Se projeto tem apenas `package-lock.json` → usar npm
- Se tem ambos → usar bun
- NUNCA assumir npm — sempre verificar

## Para builds pesados (Next.js)

```bash
NODE_OPTIONS="--max-old-space-size=8192" bun run build
```
