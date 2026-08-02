---
description: "NUNCA sobrescrever configs — edicoes cirurgicas obrigatorias"
paths:
  - "**/.env*"
  - "**/package.json"
  - "**/tsconfig*.json"
  - "**/*.config.*"
  - "**/vercel.json"
  - "**/.mcp.json"
---

# Config File Protection

## Regra Principal
NUNCA sobrescrever arquivos de configuracao. Sempre fazer edicoes cirurgicas.

## Arquivos Protegidos
- `.env`, `.env.local`, `.env.production`
- `.mcp.json`
- `package.json`, `package-lock.json`
- `tsconfig.json`, `tsconfig.*.json`
- `vite.config.ts`, `vitest.config.ts`
- `playwright.config.ts`
- `.github/workflows/*.yml`
- `vercel.json`
- `supabase/config.toml`

## Procedimento Obrigatorio
1. **Read** — ler conteudo atual completo
2. **Diff** — identificar exatamente o que precisa mudar
3. **Edit** — usar Edit tool (nunca Write) para mudancas cirurgicas
4. **Verify** — reler o arquivo apos edicao para confirmar integridade

## NUNCA
- Usar Write tool em arquivo de config existente
- Substituir todo o conteudo de um .env
- Sobrescrever workflows do CI sem ler o original
- Assumir que sabe o conteudo atual sem ler primeiro

## Em Caso de Acidente
Se sobrescreveu acidentalmente:
1. `git diff [arquivo]` — verificar o que mudou
2. `git checkout -- [arquivo]` — reverter
3. Refazer com edicao cirurgica
