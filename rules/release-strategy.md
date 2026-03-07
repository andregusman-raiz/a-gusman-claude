---
description: "Estrategia de releases — semantic versioning, tags, changelog"
paths:
  - "**/*"
---

# Release Strategy

## Semantic Versioning (semver)
- **MAJOR** (1.0.0 → 2.0.0): breaking changes que exigem adaptacao dos usuarios
- **MINOR** (1.0.0 → 1.1.0): novas features, backward compatible
- **PATCH** (1.0.0 → 1.0.1): bug fixes, sem mudanca de API

## Como Determinar a Versao
Baseado nos commits desde a ultima tag:
- Contem `BREAKING CHANGE:` ou `!:` → bump MAJOR
- Contem `feat:` → bump MINOR
- Contem apenas `fix:`, `refactor:`, `docs:`, `chore:` → bump PATCH

## Quando Criar Release
- Apos completar feature significativa (milestone)
- Apos sprint de bug fixes concluido
- Apos mudancas de seguranca criticas aplicadas
- Periodicidade recomendada: ao menos 1x por semana se houve mudancas

## Workflow de Release
1. Garantir que main esta estavel (CI verde, smoke tests passando)
2. Determinar versao baseado em commits
3. Gerar/atualizar CHANGELOG.md (agrupado por tipo)
4. Criar tag: `git tag -a v[versao] -m "Release v[versao]"`
5. Push tag: `git push origin v[versao]`
6. Criar GitHub Release: `gh release create v[versao] --generate-notes`

## Changelog
- Gerado automaticamente de conventional commits
- Agrupado por secoes: Features, Bug Fixes, Refactors, Breaking Changes
- Inclui links para PRs quando disponivel
- Formato: `- descricao (#PR)` por linha

## Automacao
- `/ag-18 changelog` → gera changelog
- `/ag-18 tag [versao]` → cria tag
- `/ag-18 release [versao]` → workflow completo (changelog + tag + GitHub Release)
