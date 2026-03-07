---
description: "Regras de seguranca da cadeia de suprimentos npm"
paths:
  - "**/package.json"
  - "**/package-lock.json"
---

# Supply Chain Security

## Instalacao
- Em CI: usar `npm ci` (nunca `npm install`) — respeita lockfile exato
- Commitar `package-lock.json` sempre — faz parte do contrato de seguranca
- Antes de adotar pacote novo: verificar age (>30 dias), downloads, maintainers

## Atualizacoes
- Nunca atualizar todas as deps de uma vez — batch por tipo (devDeps separado de deps)
- Apos update: rodar suite de testes completa antes de commit
- Verificar changelogs de major versions antes de atualizar

## Auditoria
- `npm audit` antes de cada deploy
- `npm audit signatures` para verificar assinaturas de pacotes
- Zero high/critical como gate de deploy
