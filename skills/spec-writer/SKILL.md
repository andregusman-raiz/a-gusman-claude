---
name: spec-writer
description: "Criar SPECs tecnicas padronizadas para features e issues. Template com objetivo, escopo, requisitos, edge cases, criterios de aceite. Trigger quando usuario quer spec, especificacao, ou documento tecnico para feature/issue."
model: sonnet
argument-hint: "[feature|issue|refactor] [descricao ou #issue]"
metadata:
  filePattern: "**/specs/**,*-spec.md"
  bashPattern: "spec|especificacao|requisito|acceptance.*criteria"
  priority: 70
---

# Spec Writer Skill

Criar SPECs tecnicas padronizadas para features, issues e refactors.

## Naming Convention

- Feature: `docs/specs/{feature-name}-spec.md`
- Issue: `docs/specs/issue-{N}-spec.md`
- Refactor: `docs/specs/refactor-{scope}-spec.md`

## Template: SPEC Completa

```markdown
# SPEC: [Titulo]

**Issue**: #N (se aplicavel)
**Author**: [nome]
**Date**: YYYY-MM-DD
**Status**: Draft | Review | Approved | Implemented

---

## 1. Objetivo

O que esta feature/fix resolve? Por que e necessario?
[1-3 frases claras]

## 2. Contexto

Situacao atual, problema, motivacao.
- Estado atual: [como funciona hoje]
- Problema: [o que esta errado ou faltando]
- Impacto: [quem e afetado e como]

## 3. Escopo

### In Scope
- Item 1
- Item 2
- Item 3

### Out of Scope
- Item A (motivo)
- Item B (sera feito na issue #M)

## 4. Requisitos Funcionais

### RF-01: [Nome do requisito]
**Descricao**: O sistema deve...
**Input**: [dados de entrada]
**Output**: [resultado esperado]
**Regras**:
- Regra 1
- Regra 2

### RF-02: [Nome do requisito]
...

## 5. Requisitos Nao-Funcionais

| ID | Requisito | Metrica | Target |
|----|-----------|---------|--------|
| RNF-01 | Performance | Response time | < 200ms p95 |
| RNF-02 | Disponibilidade | Uptime | 99.9% |
| RNF-03 | Seguranca | Auth required | All endpoints |
| RNF-04 | Acessibilidade | WCAG | Level AA |

## 6. Edge Cases

| # | Cenario | Comportamento Esperado |
|---|---------|----------------------|
| EC-01 | Input vazio | Mostrar mensagem de validacao |
| EC-02 | Timeout de API | Retry 3x com backoff, depois erro |
| EC-03 | Dados duplicados | Deduplicar silenciosamente |
| EC-04 | Permissao negada | Redirect para login |
| EC-05 | Dados inconsistentes | Log warning, usar fallback |

## 7. Criterios de Aceite

- [ ] CA-01: [criterio especifico e verificavel]
- [ ] CA-02: [criterio especifico e verificavel]
- [ ] CA-03: [criterio especifico e verificavel]
- [ ] CA-04: Todos os testes passam
- [ ] CA-05: TypeScript sem erros (`bun run typecheck`)
- [ ] CA-06: Lint sem warnings (`bun run lint`)
- [ ] CA-07: Code review aprovado

## 8. Dependencias

| Dependencia | Status | Responsavel |
|-------------|--------|-------------|
| API endpoint /foo | Done | Backend team |
| Design mockup | In Progress | UX team |
| Migration #123 | Pending | DBA |

## 9. Estimativa

| Fase | Esforco |
|------|---------|
| Implementacao | X horas |
| Testes | Y horas |
| Code review | Z horas |
| **Total** | **N horas** |

## 10. Notas Tecnicas

Decisoes de implementacao, trade-offs, riscos conhecidos.
```

## Template: SPEC Minimal (Bugs Simples)

```markdown
# SPEC: Fix [descricao breve]

**Issue**: #N
**Date**: YYYY-MM-DD

## Problema
[O que esta errado — comportamento atual]

## Causa Raiz
[Por que esta acontecendo — arquivo(s) e linha(s) envolvidos]

## Fix
[O que sera feito para corrigir]
- Arquivo: `path/to/file.ts`
- Mudanca: [descricao da mudanca]

## Teste
- [ ] Cenario que reproduz o bug passa
- [ ] Regressao: funcionalidades adjacentes continuam OK
- [ ] TypeScript sem erros
```

## From GitHub Issue

Ao receber uma issue do GitHub, extrair:

```bash
# Ler issue
gh issue view N --json title,body,labels,assignees,milestone

# Extrair informacoes para SPEC
# - title → Titulo da SPEC
# - body → Contexto, requisitos (parse markdown)
# - labels → Categorizar (feature, bug, refactor)
# - milestone → Estimativa de entrega
```

Mapeamento:
| Issue Section | SPEC Section |
|--------------|--------------|
| Title | Titulo |
| Description | Contexto + Requisitos |
| Acceptance criteria (se houver) | Criterios de Aceite |
| Labels | Escopo |
| Linked issues | Dependencias |

## Checklist de Completude

Antes de considerar SPEC pronta:

- [ ] **Objetivo claro** — uma pessoa que nao conhece o projeto entende o que sera feito?
- [ ] **Escopo definido** — In Scope e Out of Scope explicitados?
- [ ] **Requisitos verificaveis** — cada RF pode ser testado automaticamente?
- [ ] **Edge cases** — pelo menos 3 cenarios de borda documentados?
- [ ] **Criterios de aceite** — especificos, mensuraveis, verificaveis?
- [ ] **Dependencias** — tudo que precisa estar pronto antes esta listado?
- [ ] **Sem ambiguidade** — nenhuma frase com "talvez", "possivelmente", "em breve"?

## Anti-Patterns

| Anti-Pattern | Exemplo | Correcao |
|-------------|---------|----------|
| Spec vaga | "Melhorar performance" | "Reduzir p95 de /api/users de 800ms para 200ms" |
| Sem edge cases | "Login funciona" | Adicionar: senha errada, conta bloqueada, 2FA, etc. |
| Sem criterio de aceite | "Feature pronta" | "Dados aparecem em < 2s com 1000 registros" |
| Scope creep | "E tambem fazer X, Y, Z" | Mover extras para Out of Scope com issues separadas |
| Spec como tutorial | "Primeiro abra o arquivo X..." | Foco no QUE, nao no COMO |
| Requisito negativo | "Nao deve ser lento" | "Response time < 200ms p95" |

## Regras de Uso

1. TODA issue implementada precisa de SPEC (nem bug simples escapa — usar minimal)
2. SPECs vivem em `docs/specs/` e sao permanentes (nao deletar apos merge)
3. Criterios de aceite devem ser verificaveis automaticamente quando possivel
4. Edge cases obrigatorios — minimo 3 por SPEC
5. Out of Scope previne scope creep — sempre listar o que NAO sera feito
6. SPEC deve ser escrita ANTES da implementacao, nao depois
7. Se a SPEC muda durante implementacao, atualizar o documento
