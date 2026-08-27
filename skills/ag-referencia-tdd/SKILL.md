---
name: ag-referencia-tdd
description: "TDD canonico Red-Green-Refactor — pipeline obrigatorio teste-primeiro. Reference skill carregada on-demand pelo modo --tdd da ag-1-construir."
model: sonnet
context: fork
---

# TDD Canonico — Red-Green-Refactor

> Principio fundamental: escrever o teste que falha ANTES de existir implementacao. O teste define o comportamento desejado; a implementacao e consequencia.

**Escopo:** compoe com `~/Claude/CLAUDE.md` (workspace) e CLAUDE.md local do projeto.

**Quando carregar:** ao usar `/ag-1-construir --tdd`, antes de implementar feature em dominio sensivel, ao fazer refactor de logica critica com suite de testes existente.

---

## Pipeline Obrigatorio: 3 Fases por Ciclo

### Fase RED — Escrever o teste que falha

1. Ler a SPEC (ou criterio de aceite) do comportamento desejado
2. Escrever o(s) teste(s) que cobrem exatamente esse comportamento
3. Rodar os testes e **CONFIRMAR que falham** — se passarem sem implementacao, o teste esta errado (assertion fraca ou cobrindo comportamento ja existente)
4. O erro de falha deve ser o erro esperado (ex: `TypeError: func is not defined`, nao `AssertionError` vazio)

**Checklist RED:**
- [ ] Teste escrito antes de qualquer implementacao nova
- [ ] Rodei os testes e confirmei falha com mensagem de erro coerente
- [ ] O teste cobre o COMPORTAMENTO (entrada → saida esperada), nao a implementacao interna
- [ ] Commit de teste: `test: red — <descricao do comportamento>`

---

### Fase GREEN — Implementar o minimo para passar

1. Escrever o codigo mais simples possivel que faz o teste passar
2. **Nao mais que o necessario** — resistir a tentacao de generalizar ou otimizar agora
3. Rodar os testes e confirmar que passam (todos, incluindo os anteriores)
4. Se quebraram testes anteriores: o design esta errado — corrigir sem alterar os testes

**Checklist GREEN:**
- [ ] Implementei apenas o necessario para os testes novos passarem
- [ ] Todos os testes anteriores continuam passando (sem regressao)
- [ ] Nao adicionei logica especulativa ("pode ser util depois")
- [ ] Commit de implementacao: `feat: green — <descricao do comportamento>`

---

### Fase REFACTOR — Melhorar sem quebrar

1. Com todos os testes verdes, melhorar a qualidade do codigo
2. Extrair duplicacoes, renomear para clareza, simplificar estrutura
3. Rodar os testes apos cada mudanca de refactor — qualquer falha = refactor errado, reverter
4. **Nunca refatorar sem suite verde** — o risco de introducao silenciosa de bug e alto

**Checklist REFACTOR:**
- [ ] Todos os testes passavam antes de comecar o refactor
- [ ] Rodei testes apos cada mudanca individual de refactor
- [ ] Nao alterei comportamento observavel (testes devem passar identicos)
- [ ] Commit de refactor: `refactor: <o que foi melhorado>`

---

## Cadencia de commits: 1 ciclo = 1-3 commits

```
test: red — validar calculo de juros compostos com taxa zero        # Fase RED
feat: green — implementar calculo juros compostos                   # Fase GREEN
refactor: extrair helper calcular-periodo-composto                  # Fase REFACTOR (opcional)
```

Ciclos curtos (5-15 min) sao preferidos a ciclos longos. Se um ciclo RED→GREEN leva >30 min, a SPEC esta grande demais — dividir em comportamentos menores.

---

## Templates por Stack

### Vitest (TypeScript)

```ts
// RED: escrever primeiro, rodar e confirmar falha
import { describe, it, expect } from 'vitest'
import { calcularJurosCompostos } from '../financeiro/juros'

describe('calcularJurosCompostos', () => {
  it('retorna 0 quando taxa for 0', () => {
    expect(calcularJurosCompostos({ principal: 1000, taxa: 0, periodos: 12 })).toBe(0)
  })

  it('calcula montante correto para taxa mensal de 1%', () => {
    const resultado = calcularJurosCompostos({ principal: 1000, taxa: 0.01, periodos: 12 })
    expect(resultado).toBeCloseTo(126.83, 2)
  })

  it('lanca erro quando principal for negativo', () => {
    expect(() =>
      calcularJurosCompostos({ principal: -1000, taxa: 0.01, periodos: 12 })
    ).toThrow('principal deve ser positivo')
  })
})
```

```ts
// GREEN: implementar minimo para passar
export function calcularJurosCompostos({
  principal,
  taxa,
  periodos,
}: {
  principal: number
  taxa: number
  periodos: number
}): number {
  if (principal < 0) throw new Error('principal deve ser positivo')
  return principal * (Math.pow(1 + taxa, periodos) - 1)
}
```

### pytest (Python)

```python
# RED: escrever primeiro, confirmar falha com pytest
import pytest
from financeiro.juros import calcular_juros_compostos

def test_taxa_zero_retorna_zero():
    assert calcular_juros_compostos(principal=1000, taxa=0, periodos=12) == 0

def test_calcula_montante_correto_taxa_mensal_1pct():
    resultado = calcular_juros_compostos(principal=1000, taxa=0.01, periodos=12)
    assert abs(resultado - 126.83) < 0.01

def test_lanca_erro_principal_negativo():
    with pytest.raises(ValueError, match="principal deve ser positivo"):
        calcular_juros_compostos(principal=-1000, taxa=0.01, periodos=12)
```

```python
# GREEN: implementar minimo para passar
def calcular_juros_compostos(principal: float, taxa: float, periodos: int) -> float:
    if principal < 0:
        raise ValueError("principal deve ser positivo")
    return principal * ((1 + taxa) ** periodos - 1)
```

### Playwright E2E (comportamento de usuario)

```ts
// RED: cenario falha porque feature nao existe
import { test, expect } from '@playwright/test'

test('usuario consegue calcular parcela do contrato', async ({ page }) => {
  await page.goto('/contratos/novo')
  await page.getByLabel('Valor do contrato').fill('10000')
  await page.getByLabel('Prazo (meses)').fill('12')
  await page.getByLabel('Taxa mensal (%)').fill('1')
  await page.getByRole('button', { name: 'Calcular parcela' }).click()
  await expect(page.getByTestId('resultado-parcela')).toHaveText('R$ 888,49')
})
```

---

## Heuristica de deteccao: timestamp teste vs codigo

Para verificar se TDD foi seguido (ou detectar inversao do ciclo):

```bash
# Comparar timestamp do arquivo de teste vs arquivo de implementacao
stat -f "%Sm %N" tests/financeiro/juros.test.ts src/financeiro/juros.ts

# Via git: verificar qual veio primeiro nos commits
git log --oneline --follow -- tests/financeiro/juros.test.ts
git log --oneline --follow -- src/financeiro/juros.ts
```

**Sinal saudavel:** commit do teste precede ou e do mesmo commit que a implementacao.
**Sinal de inversao:** arquivo de implementacao foi criado/modificado ANTES do teste — ciclo invertido.

No git log, procurar padroes de commit:
- `test: red` antes de `feat: green` → TDD correto
- `feat: implementar X` sem commit de teste precedente → TDD nao seguido

---

## Quando NAO usar TDD

| Cenario | Recomendacao |
|---------|-------------|
| Prototipo descartavel (< 1h de vida) | Skip — custo de setup nao compensa |
| Exploracao de API desconhecida (spikes) | Explorar primeiro, escrever testes depois |
| Scripts one-shot (ETL ad-hoc, migration manual) | Skip — comportamento muda a cada run |
| UI puramente visual (layout, cores, espassamento) | Playwright screenshot testing em vez de TDD |
| Scaffolding de boilerplate (criar estrutura de diretórios) | Skip — sem logica de dominio |
| Bug fix trivial (1 linha, comportamento obvio) | Pode escrever teste junto com fix |

**Regra pratica:** se voce nao consegue descrever "quando X, entao Y" para a funcionalidade, TDD ainda nao e aplicavel — definir o comportamento primeiro.

---

## Anti-patterns (4+ obrigatorios)

### AP-1 — Testar implementacao em vez de comportamento

```ts
// ❌ ERRADO: testa detalhes internos (mock excessivo)
it('chama Math.pow internamente', () => {
  const spy = vi.spyOn(Math, 'pow')
  calcularJuros({ principal: 1000, taxa: 0.01, periodos: 12 })
  expect(spy).toHaveBeenCalledWith(1.01, 12)
})

// ✅ CORRETO: testa comportamento observavel
it('calcula montante correto para taxa de 1% ao mes', () => {
  expect(calcularJuros({ principal: 1000, taxa: 0.01, periodos: 12 })).toBeCloseTo(126.83, 2)
})
```

### AP-2 — Escrever codigo antes do teste (ciclo invertido)

```
// ❌ ERRADO: ordem invertida
1. Implementar calcularJuros()
2. Escrever teste que "cobre" a implementacao existente
→ Resultado: teste passa trivialmente, sem validar comportamento real

// ✅ CORRETO: ordem TDD
1. Escrever teste que descreve o comportamento esperado
2. Rodar e confirmar FALHA
3. Implementar minimo para passar
```

### AP-3 — Refactor sem suite verde

```
// ❌ PERIGOSO: refatorar com testes vermelhos
git status  # 3 testes falhando
# "Vou refatorar o codigo ao mesmo tempo que corrijo os testes"
→ Resultado: mistura bugs de implementacao com bugs de refactor, impossivel depurar

// ✅ CORRETO: testes devem estar verdes ANTES de qualquer refactor
git test  # todos passando
# Agora refatorar com segurança
```

### AP-4 — Testes que sempre passam (assertion fraca)

```ts
// ❌ SEMPRE PASSA: sem assertion real
it('calcula juros', () => {
  const resultado = calcularJuros({ principal: 1000, taxa: 0.01, periodos: 12 })
  expect(resultado).toBeDefined()  // qualquer valor passa
})

// ❌ SEMPRE PASSA: assertion tao larga que nao discrimina
it('retorna um numero', () => {
  expect(typeof calcularJuros({ principal: 1000, taxa: 0.01, periodos: 12 })).toBe('number')
})

// ✅ DISCRIMINA: falha quando implementacao esta errada
it('retorna juros de R$ 126.83 para 1000 a 1% por 12 meses', () => {
  expect(calcularJuros({ principal: 1000, taxa: 0.01, periodos: 12 })).toBeCloseTo(126.83, 2)
})
```

### AP-5 — Testes acoplados entre si (dependencia de ordem)

```ts
// ❌ ERRADO: test B depende do estado criado por test A
let contaId: string
it('cria conta', async () => {
  contaId = await criarConta({ saldo: 1000 })
  expect(contaId).toBeDefined()
})
it('debita da conta', async () => {
  await debitar(contaId, 100)  // falha se test A nao rodou
  expect(await getSaldo(contaId)).toBe(900)
})

// ✅ CORRETO: cada teste e independente
it('debitar reduz saldo', async () => {
  const contaId = await criarConta({ saldo: 1000 })  // setup proprio
  await debitar(contaId, 100)
  expect(await getSaldo(contaId)).toBe(900)
})
```

---

## Composicao com regras existentes

- **`fix-verification.md`**: verificacao end-to-end via Playwright apos ciclo RED-GREEN-REFACTOR confirma que o comportamento funciona do ponto de vista do usuario, nao apenas unitariamente
- **`predictive-systems.md` M16 (Baseline Parity)**: escrever o teste para o baseline simples ANTES do modelo complexo — TDD aplicado a modelos preditivos
- **`root-cause-debugging.md`**: quando bug e encontrado, escrever teste que reproduz o bug (RED) antes de corrigir (GREEN) — documenta o bug e garante nao-regressao
- **`quality-gate.md`**: `bun run test` (ou equivalente) e gate de qualidade — TDD garante que esse gate tem cobertura real, nao cosmética
- **`incremental-commits.md`**: cada ciclo RED-GREEN-REFACTOR = commits incrementais (max 3 commits por ciclo); nunca acumular multiplos ciclos sem commit

---

## Dominios onde TDD e obrigatorio (ao usar --tdd)

| Dominio | Motivo | Exemplo de comportamento a testar |
|---------|--------|----------------------------------|
| Calculos financeiros | Erros custam dinheiro real | Juros, parcelas, descontos, acordos |
| Pipelines preditivos | M16 Baseline Parity (predictive-systems.md) | Score de inadimplencia, threshold de churn |
| Dados regulatorios (LGPD, fiscal) | Compliance — falha gera passivo juridico | Anonimizacao, retencao, exportacao de dados |
| Logica de autorizacao / permissoes | Falha = brecha de seguranca | RLS, roles, can-access predicates |
| ETL critico com reconciliacao | Dado errado em batch = retrabalho massivo | Transformacoes, joins, validacoes de schema |

---

## Referencia completa

- Skill canonical: `/ag-referencia-tdd`
- Modo na machine: `/ag-1-construir feature X --tdd`
- Regras compostas: `fix-verification.md`, `predictive-systems.md`, `root-cause-debugging.md`
- Templates de teste Raiz: `~/Claude/.claude/shared/templates/`
