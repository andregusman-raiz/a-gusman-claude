---
description: "Regras de seguranca da cadeia de suprimentos (npm/bun)"
paths:
  - "**/package.json"
  - "**/package-lock.json"
---

# Supply Chain Security

## Instalacao
- Em CI: usar `bun install --frozen-lockfile` (nunca `bun install` sem flag) — respeita lockfile exato
- Commitar `bun.lock` sempre — faz parte do contrato de seguranca
- Antes de adotar pacote novo: verificar age (>30 dias), downloads, maintainers

## Atualizacoes
- Nunca atualizar todas as deps de uma vez — batch por tipo (devDeps separado de deps)
- Apos update: rodar suite de testes completa antes de commit
- Verificar changelogs de major versions antes de atualizar

## Auditoria
- `bunx npm-audit` antes de cada deploy (bun nao tem audit nativo — usar wrapper)
- Verificar integridade de pacotes via lockfile hash
- Zero high/critical como gate de deploy
