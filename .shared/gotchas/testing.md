# Gotchas: Testing

## Testes Teatrais
- Anti-patterns que SEMPRE passam: `.catch(() => false)`, `|| true`, `toBeGreaterThanOrEqual(0)`
- Hook detecta automaticamente em arquivos .test.ts/.spec.ts
- CI bloqueia merge se anti-patterns detectados (quality-gates.yml)

## E2E Auth
- Playwright precisa de auth state salvo (`.auth/user.json`)
- Auth setup roda ANTES dos testes (storageState)
- Se auth expira: testes falham silenciosamente com 401

## E2E Flaky
- Timeouts muito curtos = testes flaky
- Usar `waitForSelector` em vez de `waitForTimeout` (deterministico)
- Retries com trace ajudam a diagnosticar: `--retries 1 --trace on-first-retry`

## Coverage False Sense
- 60% coverage nao significa 60% de qualidade
- Mutation testing (Stryker) e o verdadeiro indicador
- Coverage alta com expects fracos = pior que coverage baixa com expects fortes

## Mocks Excessivos
- 100% mock sem teste real = testa o mock, nao o codigo
- Usar MSW para HTTP mocking (intercepta, nao substitui)
- Preferir fake-indexeddb para offline testing (comportamento real)

## Test Organization
- Unit tests: co-locados ou em `test/` (por projeto)
- E2E tests: sempre em pasta dedicada (`tests/e2e/` ou `test/e2e/`)
- Nomear: `*.test.ts` para unit, `*.spec.ts` para E2E
