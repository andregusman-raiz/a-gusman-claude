# Testing Trophy Strategy

## Current vs Target Proportions

```
Current (estimated):     Target (Testing Trophy):
  70% Unit                 10% Unit (pure logic only)
  20% Integration          80% Integration (real flows)
  10% E2E                  10% E2E (critical paths)
```

## When to Write Each Type

### Unit Tests (10%) — Pure Logic Only
- Mathematical calculations
- String/data transformations
- State machine transitions
- Parsing/validation functions
- NO mocks of external services

**Example**: `calculateDiscount(price, percentage)`, `parseCSV(raw)`, `validateCPF(cpf)`

### Integration Tests (80%) — Real Flows
- API route handlers with real-ish DB (test Supabase or in-memory)
- Service functions with real dependencies (not mocked)
- React components with real hooks and context
- Multi-step business workflows

**Example**: "User creates workspace → invites member → member accepts → both see workspace"

### E2E Tests (10%) — Critical Paths Only
- Login/signup flow
- Core business workflow (content generation for rAIz-AI-Prof)
- Payment/billing (if applicable)
- Data export/import
- Cross-browser only for these paths

**Example**: "Teacher logs in → creates quiz → generates with AI → downloads PDF"

## Migration Strategy (Gradual)

### Phase 1: New Tests Follow Trophy
- All NEW test files follow Trophy proportions
- Don't rewrite existing tests
- Rule: if it touches external service, it's integration

### Phase 2: Identify Over-Tested Units
- Find unit tests that heavily mock (> 3 mocks per test = smell)
- Convert to integration tests with real dependencies
- Delete redundant unit tests

### Phase 3: Increase Integration Coverage
- Target: every API endpoint has integration test
- Target: every service method has integration test
- Use test database (Supabase test project or pgtest)

## Anti-Patterns to Avoid

1. **Mock everything** — tests pass but code breaks in production
2. **Test implementation details** — brittle tests that break on refactor
3. **Copy implementation logic** — circular testing (bug in code = bug in test)
4. **100% unit coverage** — false confidence, real bugs in integration points

## Tooling

| Project | Unit | Integration | E2E |
|---------|------|-------------|-----|
| raiz-platform | Jest | Jest + Supabase test | Playwright |
| rAIz-AI-Prof | Vitest | Vitest + MSW | Playwright |

## QAT — Camada acima de E2E

Quality Acceptance Testing (QAT) e uma camada ADICIONAL que avalia a QUALIDADE dos outputs gerados pela aplicacao (texto, imagem, PPTX, video, etc.) usando AI-as-Judge com rubricas por tipo.

```
                    QAT (qualidade dos outputs)
                   /                             \
              E2E (fluxos funcionam)
             /                       \
        Integration (componentes integrados)
       /                                     \
  Unit (logica pura)
```

QAT NAO substitui nenhuma camada existente. E relevante apenas para apps que geram conteudo via IA.

### QAT v2 — PDCA Cycle

QAT v2 evolui de medicao passiva para melhoria continua com ciclo PDCA:

**4 Camadas de Validacao** (short-circuit: se L1/L2 falham, nao chama Judge API):
1. **L1 Smoke**: Pagina carrega, input visivel, botao existe
2. **L2 Functional**: Output gerado, nao stub/erro, conteudo real (>100 chars)
3. **L3 Quality**: AI-as-Judge com golden sample + anti-patterns calibration
4. **L4 Business**: Criterios programaticos (idioma, exemplos, estrutura, tamanho)

**Failure Classification** (6 categorias):
- INFRA: pagina nao carrega, timeout, 500
- FEATURE: output vazio, stub, feature quebrada
- QUALITY: score abaixo do threshold
- BUSINESS: criterios de negocio nao atendidos
- RUBRIC: falso positivo/negativo do Judge
- FLAKY: variancia > 2 pontos entre runs

**Knowledge Base**:
- Golden samples: outputs de referencia (score 9-10) que calibram o Judge
- Anti-patterns: contra-exemplos que DEVEM receber nota baixa
- Baselines: historico de scores por cenario, atualizado automaticamente
- Failure patterns: catalogo de falhas conhecidas com indicadores
- Learnings: licoes aprendidas por ciclo PDCA

**Rubricas v2**: Especificas por dominio com 5 criterios ponderados, escalas de 6 niveis, penalidades.
7 rubricas disponiveis: chat-educacional, extended-thinking, rag-query, plano-de-aula, relatorio-executivo, geracao-codigo, imagem-educacional.

- Pattern QAT: `~/.shared/patterns/quality-acceptance-testing.md`
- Pattern KB: `~/.shared/patterns/qat-knowledge-base.md`
- Pattern PDCA: `~/.shared/patterns/qat-pdca-cycle.md`
- Pattern Rubric Design: `~/.shared/patterns/qat-rubric-design.md`
- Pattern Scenario Design: `~/.shared/patterns/qat-scenario-design.md`
- Templates: `~/.shared/templates/qat/`
- Agent: ag-40 (`/ag40`)

## Measurement

Track ratio with coverage reports:
```bash
# Count test files by type
find tests -name "*.test.ts" | wc -l    # Total
find tests -name "*.unit.*" | wc -l      # Unit
find tests -name "*.int.*" | wc -l       # Integration
find tests -name "*.e2e.*" | wc -l       # E2E
find tests/qat -name "*.spec.ts" | wc -l # QAT
```
