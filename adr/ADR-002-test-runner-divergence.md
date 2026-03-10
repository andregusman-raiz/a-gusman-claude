# ADR-002: Aceitar Divergencia de Test Runners (Jest vs Vitest)

**Data:** 2026-03-08
**Status:** Aceito
**Contexto:** raiz-platform usa Jest, rAIz-AI-Prof usa Vitest. Ambos sao vitest-compatible na API.

## Decisao

Aceitar a divergencia. NAO forcar migracao.

## Justificativa
- Vitest e Jest compartilham API quase identica (describe, test, expect)
- Migrar raiz-platform para Vitest seria refatoracao de risco sem beneficio claro
- Playwright (E2E) e identico em ambos
- Patterns de teste (anti-theatrical, coverage, templates) sao runner-agnostic

## Consequencias
- Templates de teste em `.shared/` usam API compativel com ambos
- Config files (jest.config.js vs vitest.config.ts) ficam no projeto, nao no shared
- Skills de testing mencionam ambos runners
