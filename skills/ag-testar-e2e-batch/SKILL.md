---
name: ag-testar-e2e-batch
description: "Roda suite E2E completa com validacao de infraestrutura. Pre-flight (dev server, env vars, smoke), execucao em batches de 10-20 testes, auto-fix de falhas (seletores, mocks, timing), retry ate 3 ciclos, log de progresso em /tmp/e2e-progress.md."
model: sonnet
argument-hint: "[projeto-path ou opcoes: --batch-size=N --max-retries=N --base-url=URL]"
---

# ag-testar-e2e-batch — E2E Tests with Infrastructure Validation

Executa suite E2E completa em batches com validacao de infraestrutura, auto-diagnose de falhas, e retry automatico ate convergencia (max 3 ciclos).

## Quando Usar

- Rodar suite E2E completa de forma confiavel (nao apenas `bunx playwright test`)
- Validar infraestrutura antes de rodar testes (dev server, env vars, DB)
- Auto-corrigir falhas comuns (seletores quebrados, timing, mocks desatualizados)
- Obter relatorio estruturado de progresso e resultados

## Parametros

| Parametro | Default | Descricao |
|-----------|---------|-----------|
| `projeto-path` | CWD | Diretorio raiz do projeto |
| `--batch-size` | 15 | Testes por batch (10-20 recomendado) |
| `--max-retries` | 3 | Ciclos maximo de retry |
| `--base-url` | `http://localhost:3000` | URL do dev server |
| `--project` | (todos) | Playwright project especifico (ex: `smoke`, `chromium`) |

---

## Fase 1: Pre-Flight — Validacao de Infraestrutura

### 1.1 Dev Server

Verificar se o dev server esta rodando. Se nao, iniciar e aguardar healthy.

```bash
# Detectar porta do projeto
PORT=$(grep -oP 'PORT=\K\d+' .env 2>/dev/null || echo "3000")
BASE_URL="${BASE_URL:-http://localhost:$PORT}"

# Verificar se dev server responde
if ! curl -s --max-time 5 "$BASE_URL" > /dev/null 2>&1; then
  echo "Dev server nao encontrado em $BASE_URL. Iniciando..."

  # Detectar comando de start
  if grep -q '"dev"' package.json 2>/dev/null; then
    bun run dev &
    DEV_PID=$!
  elif grep -q '"start"' package.json 2>/dev/null; then
    bun start &
    DEV_PID=$!
  else
    echo "ERRO: Nenhum script dev/start encontrado em package.json"
    exit 1
  fi

  # Aguardar server ficar healthy (max 60s)
  TIMEOUT=60
  ELAPSED=0
  while ! curl -s --max-time 2 "$BASE_URL" > /dev/null 2>&1; do
    sleep 2
    ELAPSED=$((ELAPSED + 2))
    if [ $ELAPSED -ge $TIMEOUT ]; then
      echo "ERRO: Dev server nao ficou healthy em ${TIMEOUT}s"
      kill $DEV_PID 2>/dev/null
      exit 1
    fi
    echo "Aguardando dev server... (${ELAPSED}s/${TIMEOUT}s)"
  done
  echo "Dev server healthy em ${ELAPSED}s"
else
  echo "Dev server ja rodando em $BASE_URL"
fi
```

### 1.2 Env Vars

Verificar que `.env` ou `.env.local` tem as variaveis minimas para E2E.

```bash
# Variaveis tipicamente necessarias para E2E
REQUIRED_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

MISSING=()
for var in "${REQUIRED_VARS[@]}"; do
  if ! grep -q "^${var}=" .env .env.local 2>/dev/null; then
    MISSING+=("$var")
  fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "AVISO: Variaveis faltando: ${MISSING[*]}"
  echo "Testes podem falhar por falta de config."
fi
```

**Adaptar a lista de REQUIRED_VARS** ao projeto real. Ler `playwright.config.ts` e `.env.example` para descobrir quais vars sao necessarias.

### 1.3 Playwright Instalado

```bash
# Verificar instalacao
if [ ! -d "node_modules/@playwright/test" ]; then
  echo "Playwright nao encontrado. Instalando..."
  bun add -d @playwright/test
fi

# Verificar browsers
bunx playwright install --with-deps chromium
```

---

## Fase 2: Smoke Test — Confirmar Infraestrutura

Rodar um unico smoke test para validar que a infraestrutura funciona antes de rodar a suite completa.

```bash
# Tentar projeto smoke primeiro, fallback para qualquer spec
if bunx playwright test --project=smoke --reporter=list 2>/dev/null; then
  echo "Smoke tests passaram. Infraestrutura OK."
elif bunx playwright test tests/e2e/smoke/ --reporter=list 2>/dev/null; then
  echo "Smoke tests passaram. Infraestrutura OK."
else
  # Fallback: rodar apenas o primeiro spec encontrado
  FIRST_SPEC=$(find tests/e2e -name "*.spec.ts" -not -path "*/node_modules/*" | head -1)
  if [ -n "$FIRST_SPEC" ]; then
    if bunx playwright test "$FIRST_SPEC" --reporter=list; then
      echo "Teste de infraestrutura passou."
    else
      echo "ERRO: Teste de infraestrutura falhou. Corrigir antes de continuar."
      echo "Verificar: dev server, env vars, DB, auth setup."
      exit 1
    fi
  else
    echo "ERRO: Nenhum spec E2E encontrado em tests/e2e/"
    exit 1
  fi
fi
```

Se o smoke falhar, diagnosticar a causa raiz ANTES de prosseguir:
- Server retornando 500? Verificar logs do dev server
- Auth setup falhando? Verificar credenciais de teste em `.env`
- DB indisponivel? Verificar conexao Supabase/PostgreSQL
- Browser nao instala? `bunx playwright install --with-deps`

---

## Fase 3: Executar Suite em Batches

### 3.1 Listar todos os specs

```bash
# Coletar todos os spec files
SPECS=($(find tests/e2e -name "*.spec.ts" -not -path "*/node_modules/*" -not -path "*/smoke/*" | sort))
TOTAL=${#SPECS[@]}
BATCH_SIZE=${BATCH_SIZE:-15}
echo "Total de specs: $TOTAL | Batch size: $BATCH_SIZE"
```

### 3.2 Executar em batches

Para cada batch de BATCH_SIZE specs:

```bash
bunx playwright test "${BATCH[@]}" --reporter=json,list --output=/tmp/e2e-results/
```

### 3.3 Coletar resultados por batch

Apos cada batch, parsear o JSON report:
- Testes que passaram -> registrar em /tmp/e2e-progress.md
- Testes que falharam -> coletar para retry
- Gravar contagem: passed, failed, skipped, flaky

### 3.4 Inicializar log de progresso

Criar `/tmp/e2e-progress.md` no inicio da execucao:

```markdown
# E2E Batch Progress

## Config
- **Projeto**: [path]
- **Data**: [timestamp]
- **Total specs**: N
- **Batch size**: N
- **Max retries**: 3

## Execucao

### Batch 1 (specs 1-15)
| Spec | Status | Duracao | Erro |
|------|--------|---------|------|
| auth/login.spec.ts | PASS | 2.3s | - |
| tasks/create.spec.ts | FAIL | 5.1s | Timeout waiting for selector |

**Batch 1 resultado**: 14/15 passed, 1 failed
```

---

## Fase 4: Diagnosticar e Corrigir Falhas

Para CADA teste que falhou, analisar a causa e aplicar fix:

### Categorias de Falha e Acoes

| Categoria | Sintoma | Acao |
|-----------|---------|------|
| **Seletor quebrado** | `locator.click: Error: strict mode violation` ou `waiting for selector` | Atualizar seletor no spec (usar `getByRole` > `getByLabel` > `getByTestId`) |
| **Timing/Race condition** | `Timeout 30000ms exceeded` em waitFor/expect | Adicionar `waitForLoadState`, aumentar timeout especifico, ou adicionar `waitForSelector` antes da acao |
| **Mock desatualizado** | `404 on API route` ou `unexpected response` | Atualizar mock/fixture para refletir API atual |
| **Auth expirada** | `401 Unauthorized` ou redirect para /login | Re-rodar auth setup, verificar storage state |
| **Dados de teste** | `Expected "X" but found "Y"` em dados dinamicos | Usar matcher flexivel (`toContainText` em vez de `toHaveText` exato) ou fixar seed data |
| **Infra instavel** | `net::ERR_CONNECTION_REFUSED` | Verificar se dev server caiu, reiniciar se necessario |

### Processo de fix

1. Ler o erro completo (stack trace + screenshot se disponivel)
2. Identificar categoria da falha
3. Abrir o spec file e o componente/pagina relevante
4. Aplicar fix cirurgico (minima mudanca necessaria)
5. NAO alterar logica de negocio — apenas o teste ou infraestrutura de teste
6. Registrar fix aplicado no log de progresso

```markdown
### Fixes aplicados (Ciclo 1)
| Spec | Problema | Fix |
|------|----------|-----|
| tasks/create.spec.ts | Seletor `.btn-submit` nao encontrado | Trocado para `getByRole('button', { name: 'Criar' })` |
| auth/login.spec.ts | Timeout no redirect | Adicionado `waitForURL('/dashboard', { timeout: 15000 })` |
```

---

## Fase 5: Re-Rodar Apenas Falhos (Retry Cycles)

### Ciclo de retry

```bash
# Retry apenas os specs que falharam
bunx playwright test "${FAILED_SPECS[@]}" --reporter=json,list
```

### Controle de convergencia

```
Ciclo 1: Rodar todos -> coletar falhas -> diagnosticar -> fixar -> registrar
Ciclo 2: Rodar apenas falhos -> coletar falhas restantes -> diagnosticar -> fixar -> registrar
Ciclo 3: Rodar apenas falhos -> coletar falhas restantes -> registrar como unfixable
```

**Regras de parada:**
- 100% passando -> SUCESSO, parar
- 0 novos fixes possiveis (todas falhas sao infra/flaky/out-of-scope) -> parar e reportar
- Max 3 ciclos atingido -> parar e reportar
- Mesmo teste falha 3x com mesmo erro apos fix -> marcar como SKIP e continuar

---

## Fase 6: Log de Progresso (/tmp/e2e-progress.md)

O arquivo `/tmp/e2e-progress.md` e atualizado ao longo de toda a execucao:

```markdown
# E2E Batch Progress

## Config
- **Projeto**: /path/to/project
- **Data**: 2026-03-11T14:30:00
- **Total specs**: 45
- **Batch size**: 15
- **Max retries**: 3
- **Base URL**: http://localhost:3000

## Pre-Flight
- [x] Dev server: healthy (localhost:3000)
- [x] Env vars: OK (2 warnings)
- [x] Playwright: installed (chromium)
- [x] Smoke test: PASSED (3/3)

## Execucao

### Batch 1 (specs 1-15): 13/15 passed
### Batch 2 (specs 16-30): 14/15 passed
### Batch 3 (specs 31-45): 15/15 passed

## Retry Ciclo 1: 3 failed -> 2 fixed -> 1 remaining
## Retry Ciclo 2: 1 failed -> 0 fixed -> 1 unfixable (SKIP)

## Fixes Aplicados
| # | Spec | Problema | Fix | Ciclo |
|---|------|----------|-----|-------|
| 1 | tasks/create.spec.ts | Seletor quebrado | getByRole | 1 |
| 2 | auth/login.spec.ts | Timing | waitForURL | 1 |

## Testes Marcados SKIP (Unfixable)
| Spec | Motivo |
|------|--------|
| export/pdf.spec.ts | Requer servico externo indisponivel localmente |

## Resultado Final
| Metrica | Valor |
|---------|-------|
| Total specs | 45 |
| Passed | 44 |
| Failed (unfixable) | 1 |
| Skipped | 0 |
| Flaky | 2 |
| Fixes aplicados | 2 |
| Retry ciclos | 2 |
| Tempo total | 4m 32s |
| Taxa de sucesso | 97.8% |

## Veredicto
OK — 97.8% passando. 1 teste requer servico externo (SKIP justificado).
```

---

## Fase 7: Relatorio Final (Summary)

Ao concluir, apresentar resumo ao usuario:

```
E2E Batch Complete:
- 44/45 specs passing (97.8%)
- 2 fixes aplicados (seletores, timing)
- 1 spec skipped (depende de servico externo)
- 2 retry ciclos executados
- Log completo: /tmp/e2e-progress.md
- HTML report: tests/e2e/report/index.html
```

### Acoes pos-execucao (se aplicavel)
- Se fixes foram aplicados em specs: commitar com `test(e2e): fix selectors and timing in batch run`
- Se falhas sao de codigo (nao de teste): reportar como bugs para ag-depurar-erro ou ag-corrigir-bugs
- Se flaky tests detectados: marcar com `test.fixme()` ou `test.describe.configure({ retries: 2 })`

---

## Principios

1. **Infra primeiro**: NUNCA rodar suite sem validar infraestrutura
2. **Batches**: Executar em grupos para feedback rapido e isolamento de falhas
3. **Auto-fix conservador**: Corrigir apenas testes (seletores, timing, mocks), NUNCA logica de negocio
4. **Convergencia**: Max 3 ciclos de retry — se nao convergiu, reportar e parar
5. **Rastreabilidade**: Todo fix documentado em /tmp/e2e-progress.md
6. **Root cause**: Diagnosticar antes de fixar — seguir root-cause-debugging protocol

## Anti-Patterns (NUNCA)

- Rodar suite completa sem verificar dev server
- Aplicar `.catch(() => false)` ou `|| true` para forcar testes a passar
- Aumentar timeout global para mascarar timing issues
- Ignorar falhas sem diagnostico
- Mais de 3 ciclos de retry (loop infinito)
- Alterar codigo de producao para fazer testes passar

