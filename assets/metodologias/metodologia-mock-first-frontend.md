# Metodologia Mock-First para Frontends de Integração

> Framework metodológico para construir frontends modernos que integram com ERPs, APIs legadas ou sistemas externos. Testado em projeto real (dashboard educacional integrando com ERP TOTVS RM via SOAP/REST).
>
> Aplicável a qualquer projeto onde o frontend precisa consumir APIs que são lentas, instáveis, restritas por credenciais, ou simplesmente ainda não existem.

---

## Princípio Central

**Construir 100% da UI com dados mock antes de qualquer integração real.**

Isso inverte a abordagem tradicional (conectar API → construir UI) e traz:

1. **Velocidade**: Iterar UI sem esperar API, credenciais ou infraestrutura
2. **Validação antecipada**: Stakeholders veem e validam a UX com dados realistas
3. **Contratos definidos**: Mocks definem o shape exato que a API deve retornar
4. **Zero risco**: Quando a integração começar, a UI já está 100% testada
5. **Rollback instantâneo**: Feature flags permitem voltar ao mock a qualquer momento

---

## Fase 1 — Estrutura e Mock Data

### 1.1 Definir módulos e rotas

Mapear todas as páginas do sistema antes de escrever código:

```
/modulo-a/              → Dashboard (KPIs + resumos)
/modulo-a/lista          → Lista com filtros/paginação
/modulo-a/lista/[id]     → Detalhe
/modulo-a/criar          → Formulário
/modulo-a/analytics      → Análise/comparativo
```

**Entregável**: Lista de rotas (usar para smoke test depois).

### 1.2 Criar mock data com seed determinístico

- Usar **funções com seed** para gerar dados reproduzíveis (mesmos dados a cada reload)
- Gerar **volume realista** (não 3 registros — gerar 100-500 para testar scroll, paginação, performance)
- Incluir **variação**: status diferentes, edge cases, valores extremos
- Manter **consistência interna**: IDs referenciados devem existir, totais devem bater

```typescript
// Padrão: seed-based pseudo-random
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

// Gerar N registros com distribuição realista
const DADOS = Array.from({ length: 420 }, (_, i) => ({
  id: `reg-${String(i + 1).padStart(4, "0")}`,
  status: pick(["ativo", "inativo", "pendente"], i * 7),
  valor: 1800 + Math.floor(seededRandom(i) * 5) * 100,
  // ...
}))
```

### 1.3 Criar mock store (mutável)

Para operações de escrita (formulários, status updates), usar `Map` in-memory:

```typescript
export const store = new Map<string, Entity>(
  MOCK_DATA.map((item) => [item.id, { ...item }])
)

export function getAll(): Entity[] {
  return Array.from(store.values())
}
```

### 1.4 Criar schemas Zod para validação

Cada server action tem um schema que valida input **antes** de processar:

```typescript
export const criarItemSchema = z.object({
  nome: z.string().min(3, "Nome é obrigatório"),
  valor: z.number().min(0).max(99999),
  tipo: z.enum(["A", "B", "C"]),
})
```

**Entregável**: Arquivo de mock data por módulo + mock-store + schemas.

---

## Fase 2 — UI Completa com Mock

### 2.1 Construir todas as páginas

Implementar cada rota consumindo diretamente os mocks. Padrões a seguir:

- **Dashboards**: KPIs (4-8 cards) + visualizações (barras, tabelas) + alertas
- **Listas**: Busca + filtros + tabela paginada
- **Detalhes**: Header com badges + tabs + cards de informação
- **Formulários**: Stepper para multi-step, validação inline, feedback de sucesso
- **Análises**: Filtros no topo + comparações visuais + deltas temporais

### 2.2 Definir design system mínimo

Antes de construir, padronizar:

| Pattern | Definição |
|---------|-----------|
| KPI Card | Componente único compartilhado (não local por página) |
| Cores semânticas | 3-tier: verde (bom) / amber (atenção) / vermelho (crítico) |
| Tipografia | Mono para dados numéricos, sans para texto |
| Tabelas | Header com bg-muted, hover states, empty states |
| Barras horizontais | Para comparação (vs gráficos complexos com lib) |
| Filtros | Select no topo, dentro de Card |
| Status | Badges outline com cores inline |

### 2.3 Server Actions com pattern consistente

```typescript
// Wrapper genérico
async function safeAction<TInput, TOutput>(
  schema: ZodSchema<TInput>,
  data: unknown,
  handler: (input: TInput) => Promise<ActionResult<TOutput>>
): Promise<ActionResult<TOutput>> {
  const parsed = schema.safeParse(data)
  if (!parsed.success) return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message)
  return handler(parsed.data)
}

// Cada action segue o padrão
export async function criarItem(data: unknown): Promise<ActionResult<{ id: string }>> {
  return safeAction(criarItemSchema, data, async (input) => {
    store.set(id, { ...input, id })
    return ok({ id })
  })
}
```

**Tipo de retorno padronizado**:
```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: ErrorCode; message: string } }
```

**Entregável**: Todas as páginas funcionando com mock data.

---

## Fase 3 — Auditoria UX

### 3.1 Captura sistemática de screenshots

Após todas as páginas prontas, capturar screenshot de **cada rota** (incluindo sub-páginas):

```bash
# Via Playwright CLI
npx playwright screenshot --browser chromium "http://localhost:3000/rota" \
  "/output/ux-01-nome.png" --viewport-size="1440,900" --wait-for-timeout=2000
```

### 3.2 Análise visual especializada

Para cada screenshot, avaliar:

| Critério | O que verificar |
|----------|----------------|
| **Hierarquia** | Título > subtítulo > labels claro? |
| **Densidade** | Informação suficiente sem sobrecarga? |
| **Consistência** | Mesmo padrão de KPI/tabela/filtro que as outras páginas? |
| **Cores** | 3-tier aplicado consistentemente? |
| **Empty states** | O que aparece com 0 registros? |
| **Ações** | CTAs visíveis e claros? |
| **Dados** | Números consistentes entre módulos? |
| **Acessibilidade** | Labels, aria, touch targets? |

### 3.3 Classificar e priorizar problemas

| Prioridade | Critério | Exemplo |
|------------|----------|---------|
| P0 | Dados inconsistentes, funcionalidade quebrada | KPI mostra 847 alunos mas dados são 420 |
| P1 | Padrão visual inconsistente | 3 tipos diferentes de KPI card |
| P2 | Feature faltando que usuário espera | Dashboard sem KPIs |
| P3 | Polish | Ícone sem hover state |

### 3.4 Corrigir em sprints

Agrupar correções por prioridade e executar em sequência:
- Sprint por P0 → build → Sprint por P1 → build → Sprint por P2 → build

**Entregável**: Relatório UX com scores por módulo + sprints de correção executados.

---

## Fase 4 — Preparação para Integração

### 4.1 Error Boundaries

Criar `error.tsx` em cada route group com componente reutilizável:

```tsx
// components/ui/error-state.tsx
export function ErrorState({ onRetry }) {
  return (
    <div>
      <AlertTriangle />
      <h2>Erro ao carregar dados</h2>
      <Button onClick={onRetry}>Tentar novamente</Button>
    </div>
  )
}

// app/(app)/modulo/error.tsx
export default function ModuleError({ reset }) {
  return <ErrorState onRetry={reset} />
}
```

### 4.2 Loading States

Criar `loading.tsx` com skeleton em cada route group:

```tsx
export function LoadingState() {
  return (
    <div>
      <Skeleton className="h-6 w-48" />  {/* Header */}
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />  {/* KPI cards */}
        ))}
      </div>
      <Skeleton className="h-64" />  {/* Content */}
    </div>
  )
}
```

### 4.3 API Contracts

Criar interfaces TypeScript que representam o shape **exato** da API externa:

```typescript
// O que a API retorna (raw)
interface ExternalAPIUser {
  CODCOLIGADA: number
  NOME: string
  STATUS: "A" | "I"
}

// Mappings de códigos → labels
const STATUS_MAP: Record<string, string> = {
  A: "ativo",
  I: "inativo",
}
```

### 4.4 Adapter Layer

Transformar shapes externos no shape que a UI espera:

```typescript
// adapters/user.adapter.ts
function adaptUser(raw: ExternalAPIUser): AppUser {
  return {
    id: String(raw.CODCOLIGADA),
    nome: raw.NOME,
    status: STATUS_MAP[raw.STATUS] ?? "desconhecido",
  }
}
```

### 4.5 Provider Layer

Abstração que decide mock vs real baseado em feature flag:

```typescript
// providers/user.provider.ts
async function getUsers(): Promise<AppUser[]> {
  if (flags.users.read) {
    const raw = await apiClient.get<ExternalAPIUser[]>('/users')
    return raw.map(adaptUser)
  }
  return MOCK_USERS  // fallback
}
```

### 4.6 Feature Flags

Toggle mock/real por módulo:

```typescript
export const flags = {
  modulo_a: { read: false, write: false },
  modulo_b: { read: false, write: false },
}
```

**Rollback**: Desligar flag = app volta ao mock instantaneamente, zero downtime.

### 4.7 Client Wrappers

Criar wrappers tipados para cada protocolo da API externa:

```typescript
// REST
async function restGet<T>(path: string, token: string): Promise<T>

// SOAP (se necessário)
async function soapRequest(dataServer: string, operation: string, config): Promise<string>
```

Documentar gotchas conhecidas **no código**:

```typescript
/**
 * KNOWN GOTCHAS:
 * 1. Endpoint X retorna HTML entities em XML
 * 2. Endpoint Y não suporta subquery IN (...)
 * 3. Token expira em 300s — refresh automático necessário
 */
```

**Entregável**: Camada `lib/integration/` com contracts + adapters + providers + flags + clients.

---

## Fase 5 — Validação e Qualidade

### 5.1 Smoke Test

Script que valida todas as rotas respondem HTTP 200:

```bash
ROUTES=("/" "/modulo-a" "/modulo-a/lista" ...)
for route in "${ROUTES[@]}"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$route")
  [ "$status" != "200" ] && echo "FAIL: $route"
done
```

### 5.2 Validação de Consistência de Dados

Script que verifica:
- Totais hardcoded == totais computados
- IDs referenciados existem
- Cross-references entre módulos são válidos
- Distribuições são realistas (não todos com mesmo valor)

### 5.3 Build Gate

```bash
npm run build        # 0 erros TypeScript
bash smoke-test.sh   # 100% rotas pass
npx tsx validate.ts  # 0 erros de consistência
```

### 5.4 Checklist de Pré-Requisitos

Documento com:
- Cada bloqueio externo (credenciais, permissões, infra)
- Responsável
- Status (pendente/em andamento/resolvido)
- Qual fase bloqueia

### 5.5 Data Flow Diagram

Documentar os dois paths:

```
READ:  Página → Provider → Flag → Mock | API → Adapter → Cache → UI
WRITE: Página → Action → Schema → Flag → Mock Store | API → Response
```

**Entregável**: Scripts de validação + checklist + diagrama.

---

## Fase 6 — Integração (Execução)

### 6.1 Migração progressiva por módulo

Para cada módulo:
1. Implementar adapter (se não existe)
2. Implementar provider (conectar ao client + adapter)
3. Ligar feature flag (`read = true`)
4. Testar localmente
5. Deploy preview → validar
6. Se falhar → desligar flag → investigar

### 6.2 Ordem recomendada

1. **Leitura simples** (listar entidades) — menor risco, maior validação
2. **Leitura com filtros** (busca, paginação) — valida parâmetros
3. **Leitura de detalhes** (por ID) — valida joins
4. **Escrita simples** (criar/atualizar 1 registro) — primeiro write
5. **Escrita complexa** (transações multi-tabela) — último, maior risco

### 6.3 Critérios Go/No-Go por fase

| Fase | Critério |
|------|----------|
| Infra | Client retorna token válido |
| Read simples | Lista N+ registros sem erro |
| Read complexo | Dados retornados batem com mock (shape compatível) |
| Write | SaveRecord executa sem erro em ambiente de homologação |
| Produção | Tudo acima + smoke test em preview |

---

## Checklist — Está Pronto para Integrar?

- [ ] Todas as páginas funcionam com mock data
- [ ] Auditoria UX feita (screenshots + scores)
- [ ] Correções de UX aplicadas (P0 e P1 resolvidos)
- [ ] Error boundaries em todos os route groups
- [ ] Loading states em todos os route groups
- [ ] API contracts definidos (interfaces TypeScript)
- [ ] Adapters implementados (external → app domain)
- [ ] Providers implementados (flag → mock | API)
- [ ] Feature flags configurados (todos false)
- [ ] REST/SOAP clients implementados com gotchas documentadas
- [ ] Smoke test script criado e passando
- [ ] Validação de consistência de dados passando
- [ ] Build passando com 0 erros
- [ ] Data flow documentado
- [ ] Checklist de pré-requisitos externos preenchido
- [ ] Handoff doc para próximo dev

---

## Anti-Patterns (Evitar)

| Anti-Pattern | Por que é ruim | Alternativa |
|-------------|----------------|-------------|
| Conectar API primeiro, UI depois | Bloqueado por credenciais/infra/latência | Mock-first |
| Mock com 3 registros | Não testa paginação, scroll, performance | 100-500 registros com seed |
| KPI hardcoded ("847") | Inconsistente quando dados mudam | Computar do mock data |
| 1 KPI card por página (copy-paste) | 3 padrões visuais diferentes | Componente compartilhado |
| Select dropdown para ações perigosas | Mudança acidental de status | Badge + DropdownMenu + confirmação |
| Ignorar breadcrumbs | Slug cru como label | Mapa de labels |
| Deploy sem smoke test | Rota 404 em produção | Script automatizado |
| Integrar tudo de uma vez | Impossível debugar | Por módulo com feature flag |

---

## Métricas de Sucesso

| Métrica | Meta | Como medir |
|---------|------|-----------|
| Cobertura de rotas | 100% | Smoke test |
| Score UX médio | ≥8.0/10 | Auditoria visual |
| Build errors | 0 | `npm run build` |
| Consistência dados | 0 erros | Script de validação |
| Tempo para rollback | <1 min | Feature flag toggle |
| Páginas com error boundary | 100% | Glob `**/error.tsx` |
| Páginas com loading state | 100% | Glob `**/loading.tsx` |
