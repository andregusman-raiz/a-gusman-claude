---
name: prd-writer
description: "Criar PRD (Product Requirements Document) antes da SPEC tecnica. Problema, personas, escopo, metricas de sucesso. Trigger quando usuario quer prd, requisitos de produto, ou documento de produto."
model: sonnet
argument-hint: "[feature|produto|problema] [descricao]"
metadata:
  filePattern: "**/prd*,*-prd.md"
  bashPattern: "prd|product.requirement|requisito.*produto"
  priority: 75
---

# PRD Writer Skill

Criar PRDs (Product Requirements Documents) padronizados — o documento que antecede a SPEC tecnica.

> PRD responde "O QUE e POR QUE". SPEC responde "COMO".

## Naming Convention

- Feature: `docs/specs/{feature-name}-prd.md`
- Produto: `docs/specs/{product-name}-prd.md`
- Issue: `docs/specs/issue-{N}-prd.md`

## Template: PRD Completo

```markdown
# PRD: [Titulo]

**Author**: [nome]
**Date**: YYYY-MM-DD
**Status**: Draft | Review | Approved
**SPEC**: (link para SPEC quando criada)

---

## 1. Problema

[1-3 frases. O que esta errado ou faltando? Qual dor do usuario resolve?]

## 2. Usuarios e Personas

| Persona | Descricao | Necessidade Principal |
|---------|-----------|----------------------|
| [nome] | [quem e, contexto] | [o que precisa] |

## 3. Escopo

### In Scope
- Item 1
- Item 2

### Out of Scope
- Item A (motivo ou issue futura)
- Item B (sera feito em fase posterior)

## 4. Requisitos Funcionais (alto nivel)

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-01 | [descricao do que o sistema deve fazer] | Must |
| RF-02 | [descricao] | Must |
| RF-03 | [descricao] | Should |
| RF-04 | [descricao] | Could |

Prioridades: Must (obrigatorio), Should (importante), Could (desejavel), Won't (nao agora)

## 5. Requisitos Nao-Funcionais

| ID | Categoria | Requisito | Target |
|----|-----------|-----------|--------|
| RNF-01 | Performance | [descricao] | [metrica] |
| RNF-02 | Seguranca | [descricao] | [metrica] |
| RNF-03 | Acessibilidade | [descricao] | [metrica] |
| RNF-04 | Disponibilidade | [descricao] | [metrica] |

## 6. Metricas de Sucesso

Como saber que funcionou? (metricas mensuráveis, nao feelings)

| Metrica | Baseline (hoje) | Target | Como medir |
|---------|-----------------|--------|------------|
| [nome] | [valor atual] | [valor desejado] | [ferramenta/metodo] |

## 7. Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| [descricao] | Alta/Media/Baixa | Alto/Medio/Baixo | [como mitigar] |

## 8. Pesquisa e Referencias

- [Links para findings.md, benchmarks, concorrentes analisados]
- [Decisoes de produto ja tomadas e rationale]
```

## Template: PRD Minimal (features pequenas)

```markdown
# PRD: [Titulo]

**Date**: YYYY-MM-DD

## Problema
[O que esta errado ou faltando — 1-3 frases]

## Usuarios
[Quem e afetado e como]

## Escopo
- In: [lista curta]
- Out: [o que nao entra]

## Requisitos (MoSCoW)
- **Must**: [obrigatorios]
- **Should**: [importantes]

## Sucesso = [metrica mensuravel]
```

## Workflow

1. **PRIMEIRO**: Ler `~/Claude/assets/design-library/catalog.md` — verificar se existe Modulo ou Produto que resolve o problema
   - Se sim: referenciar no PRD em "Pesquisa e Referencias" com link para solution spec
   - Extrair requisitos ja resolvidos (evita especificar do zero o que ja existe)
2. Se existir `docs/ai-state/findings.md` — ler para contexto de pesquisa previa
3. Se existir issue GitHub — extrair contexto com `gh issue view N`
4. Gerar PRD no template correto (completo se M+, minimal se S)
5. Salvar em `docs/specs/{name}-prd.md`
6. PRD alimenta ag-especificar-solucao (SPEC tecnica)

## Checklist de Completude

- [ ] **Problema claro** — alguem de fora do time entende o problema?
- [ ] **Personas identificadas** — quem usa e quem se beneficia?
- [ ] **Escopo negativo** — Out of Scope tem pelo menos 1 item?
- [ ] **Metricas mensuraveis** — pelo menos 1 metrica com baseline e target?
- [ ] **Riscos documentados** — pelo menos 1 risco com mitigacao?
- [ ] **Sem jargao tecnico** — PRD e documento de produto, nao de engenharia?
- [ ] **Max 100 linhas** — conciso, sem repetir o que vai na SPEC?

## Anti-Patterns

| Anti-Pattern | Exemplo | Correcao |
|-------------|---------|----------|
| PRD tecnico demais | "Usar React com SSR e Postgres" | Foco no QUE, nao no COMO (stack vai na SPEC) |
| Sem metricas | "Melhorar experiencia" | "Reduzir tempo de onboarding de 15min para 3min" |
| Sem escopo negativo | Listar so o que entra | Sempre listar o que NAO entra (previne scope creep) |
| PRD como SPEC | Detalhar endpoints e schemas | PRD e alto nivel — detalhes tecnicos vao na SPEC |
| Sem personas | "Os usuarios querem..." | Identificar QUEM sao os usuarios e suas dores especificas |
| Metrica vanity | "Aumentar pageviews" | Metrica conectada ao problema: "Reduzir churn de 8% para 4%" |

## Regras

1. PRD e escrito ANTES da SPEC — nunca depois
2. PRD max 100 linhas (metade da SPEC)
3. PRD NAO contem decisoes tecnicas (isso vai na SPEC e ADR)
4. Se pesquisa previa existe (findings.md) — referenciar, nao duplicar
5. Se issue GitHub existe — extrair contexto, nao copiar inteiro
6. PRD e documento vivo — atualizar se requisitos mudam
