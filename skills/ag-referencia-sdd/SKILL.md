---
name: ag-referencia-sdd
description: "Metodologia SDD (Spec Driven Development) — fluxo PRD→SPEC→Execucao→Review, quando usar, templates. Reference skill carregado on-demand."
context: fork
---

# Metodologia SDD (Spec Driven Development)

> Principio 80/20: 80% planejamento, 20% execucao.

## Fluxo Obrigatorio para Features/Refatoracoes

```
PRD.md → SPEC.md → Execucao → Review
```

- **PRD**: Problema, escopo, requisitos, metricas de sucesso
- **SPEC**: Plano tecnico (max **200 linhas**, dividir se maior)
- **Execucao**: Implementar seguindo o SPEC exatamente
- **Review**: Validar contra criterios, documentar decisoes

## Quando Usar SDD

| Cenario | SDD? |
|---------|------|
| Nova feature | Sim |
| Bug fix complexo | Sim (simplificado) |
| Refatoracao | Sim |
| Hotfix urgente | Nao (documentar depois) |
| Quick task (< 30min) | Nao |

## Templates

### PRD → `/prd [feature]` (skill prd-writer)
Gera PRD padronizado com problema, personas, escopo, metricas de sucesso, riscos.
Output: `docs/specs/{name}-prd.md` (max 100 linhas)

### SPEC → `/spec-writer [feature]` ou ag-especificar-solucao
Gera SPEC tecnica implementavel com interfaces, edge cases, criterios de aceite.
Output: `docs/specs/{name}-spec.md` (max 200 linhas)

### ADR → `/adr [decisao]` (skill adr)
Registra decisoes arquiteturais com contexto, alternativas e trade-offs.
Output: `docs/adr/ADR-{NNN}-{slug}.md` (max 60 linhas)

> Playbook detalhado: `.claude/Playbooks/01_Spec_Driven_Development.md`
