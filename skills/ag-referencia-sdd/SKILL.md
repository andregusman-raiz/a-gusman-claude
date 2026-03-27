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

### PRD Template
```markdown
# PRD: [Nome]
## Problema
## Escopo (In/Out)
## Requisitos Funcionais
## Requisitos Nao-Funcionais
## Metricas de Sucesso
## Riscos
```

### SPEC Template
```markdown
# SPEC: [Nome]
## Contexto (link para PRD)
## Decisoes Tecnicas
## Plano de Implementacao (steps numerados)
## Testes Obrigatorios
## Rollback Plan
## Criterios de Aceitacao
```

> Playbook detalhado: `.claude/Playbooks/01_Spec_Driven_Development.md`
